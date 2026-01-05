// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title InvoiceFactoring
 * @dev Tokenize invoices and provide early payment through factoring
 * @notice Allows businesses to get immediate liquidity from unpaid invoices
 */
contract InvoiceFactoring is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    bytes32 public constant FACTORING_ADMIN_ROLE = keccak256("FACTORING_ADMIN_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    
    // Invoice status
    enum InvoiceStatus {
        PENDING_VERIFICATION,
        VERIFIED,
        FUNDED,
        PAID,
        DEFAULTED,
        CANCELLED
    }
    
    // Invoice details
    struct Invoice {
        uint256 invoiceId;
        address seller;
        address buyer;
        uint256 invoiceAmount;
        uint256 discountRate; // In basis points (100 = 1%)
        uint256 netAmount; // Amount seller receives
        uint256 dueDate;
        uint256 creationDate;
        InvoiceStatus status;
        string invoiceHash; // IPFS hash of invoice document
        address paymentToken;
        bool isVerified;
        address rwaToken; // Tokenized representation
    }
    
    // Factoring pool
    struct FactoringPool {
        uint256 totalLiquidity;
        uint256 availableLiquidity;
        uint256 totalInvoicesFunded;
        uint256 totalRepaid;
        address liquidityToken;
    }
    
    // Storage
    mapping(uint256 => Invoice) public invoices;
    uint256 public invoiceCount;
    
    FactoringPool public factoringPool;
    
    // Credit limits for buyers
    mapping(address => uint256) public buyerCreditLimit;
    mapping(address => uint256) public buyerOutstanding;
    
    // Seller statistics
    mapping(address => uint256) public sellerTotalFactored;
    mapping(address => uint256) public sellerDefaultCount;
    
    address public kycRegistry;
    uint256 public constant MAX_DISCOUNT_RATE = 1000; // 10%
    uint256 public constant MIN_INVOICE_DURATION = 7 days;
    uint256 public constant MAX_INVOICE_DURATION = 180 days;
    
    // Events
    event InvoiceCreated(
        uint256 indexed invoiceId,
        address indexed seller,
        address indexed buyer,
        uint256 amount
    );
    event InvoiceVerified(uint256 indexed invoiceId);
    event InvoiceFunded(uint256 indexed invoiceId, uint256 netAmount);
    event InvoicePaid(uint256 indexed invoiceId, uint256 amount);
    event InvoiceDefaulted(uint256 indexed invoiceId);
    event LiquidityAdded(address indexed provider, uint256 amount);
    event LiquidityRemoved(address indexed provider, uint256 amount);
    event BuyerCreditLimitUpdated(address indexed buyer, uint256 newLimit);
    
    /**
     * @dev Constructor
     * @param _kycRegistry KYC registry address
     * @param _liquidityToken Token used for factoring (USDC, USDT, etc.)
     */
    constructor(address _kycRegistry, address _liquidityToken) {
        require(_kycRegistry != address(0), "Invalid KYC registry");
        require(_liquidityToken != address(0), "Invalid liquidity token");
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(FACTORING_ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
        
        kycRegistry = _kycRegistry;
        factoringPool.liquidityToken = _liquidityToken;
    }
    
    /**
     * @dev Create a new invoice for factoring
     * @param buyer Address of the buyer/debtor
     * @param invoiceAmount Total invoice amount
     * @param dueDate Payment due date
     * @param invoiceHash IPFS hash of invoice document
     * @param paymentToken Token for payment
     */
    function createInvoice(
        address buyer,
        uint256 invoiceAmount,
        uint256 dueDate,
        string memory invoiceHash,
        address paymentToken
    ) external nonReentrant returns (uint256) {
        require(_isKYCVerified(msg.sender), "Seller not KYC verified");
        require(_isKYCVerified(buyer), "Buyer not KYC verified");
        require(invoiceAmount > 0, "Invalid amount");
        require(dueDate > block.timestamp + MIN_INVOICE_DURATION, "Due date too soon");
        require(dueDate < block.timestamp + MAX_INVOICE_DURATION, "Due date too far");
        require(buyer != msg.sender, "Cannot self-invoice");
        
        uint256 invoiceId = invoiceCount++;
        
        invoices[invoiceId] = Invoice({
            invoiceId: invoiceId,
            seller: msg.sender,
            buyer: buyer,
            invoiceAmount: invoiceAmount,
            discountRate: 0,
            netAmount: 0,
            dueDate: dueDate,
            creationDate: block.timestamp,
            status: InvoiceStatus.PENDING_VERIFICATION,
            invoiceHash: invoiceHash,
            paymentToken: paymentToken,
            isVerified: false,
            rwaToken: address(0)
        });
        
        emit InvoiceCreated(invoiceId, msg.sender, buyer, invoiceAmount);
        
        return invoiceId;
    }
    
    /**
     * @dev Verify invoice authenticity
     * @param invoiceId Invoice ID
     * @param discountRate Discount rate for factoring (basis points)
     */
    function verifyInvoice(uint256 invoiceId, uint256 discountRate) 
        external 
        onlyRole(VERIFIER_ROLE) 
    {
        Invoice storage invoice = invoices[invoiceId];
        
        require(invoice.status == InvoiceStatus.PENDING_VERIFICATION, "Invalid status");
        require(discountRate <= MAX_DISCOUNT_RATE, "Discount rate too high");
        
        // Check buyer's credit limit
        uint256 buyerLimit = buyerCreditLimit[invoice.buyer];
        uint256 buyerUsed = buyerOutstanding[invoice.buyer];
        require(buyerUsed + invoice.invoiceAmount <= buyerLimit, "Buyer credit limit exceeded");
        
        uint256 discountAmount = (invoice.invoiceAmount * discountRate) / 10000;
        uint256 netAmount = invoice.invoiceAmount - discountAmount;
        
        invoice.discountRate = discountRate;
        invoice.netAmount = netAmount;
        invoice.isVerified = true;
        invoice.status = InvoiceStatus.VERIFIED;
        
        emit InvoiceVerified(invoiceId);
    }
    
    /**
     * @dev Fund verified invoice (seller receives payment)
     * @param invoiceId Invoice ID
     */
    function fundInvoice(uint256 invoiceId) 
        external 
        onlyRole(FACTORING_ADMIN_ROLE) 
        nonReentrant 
    {
        Invoice storage invoice = invoices[invoiceId];
        
        require(invoice.status == InvoiceStatus.VERIFIED, "Invoice not verified");
        require(factoringPool.availableLiquidity >= invoice.netAmount, "Insufficient liquidity");
        
        // Update pool
        factoringPool.availableLiquidity -= invoice.netAmount;
        factoringPool.totalInvoicesFunded++;
        
        // Update buyer outstanding
        buyerOutstanding[invoice.buyer] += invoice.invoiceAmount;
        
        // Update seller statistics
        sellerTotalFactored[invoice.seller] += invoice.netAmount;
        
        invoice.status = InvoiceStatus.FUNDED;
        
        // Transfer funds to seller
        IERC20(factoringPool.liquidityToken).safeTransfer(invoice.seller, invoice.netAmount);
        
        emit InvoiceFunded(invoiceId, invoice.netAmount);
    }
    
    /**
     * @dev Buyer pays the invoice
     * @param invoiceId Invoice ID
     */
    function payInvoice(uint256 invoiceId) external nonReentrant {
        Invoice storage invoice = invoices[invoiceId];
        
        require(invoice.status == InvoiceStatus.FUNDED, "Invoice not funded");
        require(msg.sender == invoice.buyer, "Only buyer can pay");
        require(block.timestamp <= invoice.dueDate, "Invoice overdue");
        
        // Transfer full invoice amount from buyer
        IERC20(invoice.paymentToken).safeTransferFrom(
            msg.sender,
            address(this),
            invoice.invoiceAmount
        );
        
        // Update pool
        factoringPool.availableLiquidity += invoice.invoiceAmount;
        factoringPool.totalRepaid += invoice.invoiceAmount;
        
        // Update buyer outstanding
        buyerOutstanding[invoice.buyer] -= invoice.invoiceAmount;
        
        invoice.status = InvoiceStatus.PAID;
        
        emit InvoicePaid(invoiceId, invoice.invoiceAmount);
    }
    
    /**
     * @dev Mark invoice as defaulted
     * @param invoiceId Invoice ID
     */
    function markDefaulted(uint256 invoiceId) 
        external 
        onlyRole(FACTORING_ADMIN_ROLE) 
    {
        Invoice storage invoice = invoices[invoiceId];
        
        require(invoice.status == InvoiceStatus.FUNDED, "Invoice not funded");
        require(block.timestamp > invoice.dueDate, "Not yet overdue");
        
        invoice.status = InvoiceStatus.DEFAULTED;
        
        // Update statistics
        sellerDefaultCount[invoice.seller]++;
        buyerOutstanding[invoice.buyer] -= invoice.invoiceAmount;
        
        emit InvoiceDefaulted(invoiceId);
    }
    
    /**
     * @dev Add liquidity to factoring pool
     * @param amount Amount to add
     */
    function addLiquidity(uint256 amount) 
        external 
        nonReentrant 
    {
        require(amount > 0, "Invalid amount");
        require(_isKYCVerified(msg.sender), "Not KYC verified");
        
        IERC20(factoringPool.liquidityToken).safeTransferFrom(
            msg.sender,
            address(this),
            amount
        );
        
        factoringPool.totalLiquidity += amount;
        factoringPool.availableLiquidity += amount;
        
        emit LiquidityAdded(msg.sender, amount);
    }
    
    /**
     * @dev Remove liquidity from factoring pool
     * @param amount Amount to remove
     */
    function removeLiquidity(uint256 amount) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
        nonReentrant 
    {
        require(amount > 0, "Invalid amount");
        require(factoringPool.availableLiquidity >= amount, "Insufficient available liquidity");
        
        factoringPool.totalLiquidity -= amount;
        factoringPool.availableLiquidity -= amount;
        
        IERC20(factoringPool.liquidityToken).safeTransfer(msg.sender, amount);
        
        emit LiquidityRemoved(msg.sender, amount);
    }
    
    /**
     * @dev Set buyer credit limit
     * @param buyer Buyer address
     * @param limit Credit limit
     */
    function setBuyerCreditLimit(address buyer, uint256 limit) 
        external 
        onlyRole(FACTORING_ADMIN_ROLE) 
    {
        require(_isKYCVerified(buyer), "Buyer not KYC verified");
        buyerCreditLimit[buyer] = limit;
        emit BuyerCreditLimitUpdated(buyer, limit);
    }
    
    /**
     * @dev Get invoice details
     */
    function getInvoice(uint256 invoiceId) 
        external 
        view 
        returns (
            address seller,
            address buyer,
            uint256 invoiceAmount,
            uint256 netAmount,
            uint256 dueDate,
            InvoiceStatus status,
            bool isVerified
        ) 
    {
        Invoice memory invoice = invoices[invoiceId];
        return (
            invoice.seller,
            invoice.buyer,
            invoice.invoiceAmount,
            invoice.netAmount,
            invoice.dueDate,
            invoice.status,
            invoice.isVerified
        );
    }
    
    /**
     * @dev Get factoring pool statistics
     */
    function getPoolStats() 
        external 
        view 
        returns (
            uint256 totalLiquidity,
            uint256 availableLiquidity,
            uint256 utilization,
            uint256 totalFunded,
            uint256 totalRepaid
        ) 
    {
        uint256 util = factoringPool.totalLiquidity > 0
            ? ((factoringPool.totalLiquidity - factoringPool.availableLiquidity) * 10000) / factoringPool.totalLiquidity
            : 0;
        
        return (
            factoringPool.totalLiquidity,
            factoringPool.availableLiquidity,
            util,
            factoringPool.totalInvoicesFunded,
            factoringPool.totalRepaid
        );
    }
    
    /**
     * @dev Check if address is KYC verified
     */
    function _isKYCVerified(address account) private view returns (bool) {
        (bool success, bytes memory data) = kycRegistry.staticcall(
            abi.encodeWithSignature("isVerified(address)", account)
        );
        
        if (!success || data.length == 0) return false;
        return abi.decode(data, (bool));
    }
}
