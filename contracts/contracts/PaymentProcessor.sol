// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PaymentProcessor
 * @dev Handles sending and receiving MNT and ERC20 tokens with QR code support
 * @notice Supports instant payments, batch payments, and payment history tracking
 */
contract PaymentProcessor is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    
    struct Payment {
        uint256 id;
        address sender;
        address recipient;
        address token; // address(0) for native MNT
        uint256 amount;
        uint256 timestamp;
        string note;
        PaymentType paymentType;
    }
    
    struct PaymentRequest {
        uint256 id;
        address recipient;
        address token;
        uint256 amount;
        string note;
        bool isPaid;
        uint256 createdAt;
        uint256 expiresAt;
    }
    
    enum PaymentType {
        INSTANT,
        BATCH,
        QR_CODE,
        REQUEST
    }
    
    // State
    uint256 private paymentIdCounter;
    uint256 private requestIdCounter;
    
    mapping(uint256 => Payment) public payments;
    mapping(address => uint256[]) public userSentPayments;
    mapping(address => uint256[]) public userReceivedPayments;
    
    mapping(uint256 => PaymentRequest) public paymentRequests;
    mapping(address => uint256[]) public userPaymentRequests;
    
    // Fee configuration (in basis points, 100 = 1%)
    uint256 public platformFee = 0; // 0% fee initially
    uint256 public constant MAX_FEE = 100; // Maximum 1% fee
    address public feeRecipient;
    
    // Events
    event PaymentSent(
        uint256 indexed paymentId,
        address indexed sender,
        address indexed recipient,
        address token,
        uint256 amount,
        PaymentType paymentType
    );
    
    event PaymentReceived(
        uint256 indexed paymentId,
        address indexed sender,
        address indexed recipient,
        address token,
        uint256 amount
    );
    
    event BatchPaymentExecuted(
        address indexed sender,
        uint256 recipientCount,
        address token,
        uint256 totalAmount
    );
    
    event PaymentRequestCreated(
        uint256 indexed requestId,
        address indexed recipient,
        address token,
        uint256 amount
    );
    
    event PaymentRequestFulfilled(
        uint256 indexed requestId,
        uint256 indexed paymentId,
        address indexed sender
    );
    
    event FeeUpdated(uint256 newFee);
    
    /**
     * @dev Constructor
     */
    constructor() Ownable(msg.sender) {
        feeRecipient = msg.sender;
    }
    
    /**
     * @dev Send native MNT to a recipient
     * @param recipient Address to receive MNT
     * @param note Optional payment note/memo
     */
    function sendMNT(
        address payable recipient,
        string calldata note
    ) external payable nonReentrant returns (uint256 paymentId) {
        require(recipient != address(0), "Invalid recipient");
        require(msg.value > 0, "Amount must be > 0");
        
        // Calculate fee
        uint256 feeAmount = (msg.value * platformFee) / 10000;
        uint256 amountAfterFee = msg.value - feeAmount;
        
        // Transfer MNT
        recipient.transfer(amountAfterFee);
        
        // Transfer fee
        if (feeAmount > 0) {
            payable(feeRecipient).transfer(feeAmount);
        }
        
        // Record payment
        paymentId = _recordPayment(
            msg.sender,
            recipient,
            address(0),
            msg.value,
            note,
            PaymentType.INSTANT
        );
        
        emit PaymentSent(paymentId, msg.sender, recipient, address(0), msg.value, PaymentType.INSTANT);
        emit PaymentReceived(paymentId, msg.sender, recipient, address(0), amountAfterFee);
        
        return paymentId;
    }
    
    /**
     * @dev Send ERC20 tokens to a recipient
     * @param token ERC20 token address
     * @param recipient Address to receive tokens
     * @param amount Amount of tokens to send
     * @param note Optional payment note/memo
     */
    function sendToken(
        address token,
        address recipient,
        uint256 amount,
        string calldata note
    ) external nonReentrant returns (uint256 paymentId) {
        require(token != address(0), "Invalid token");
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be > 0");
        
        // Calculate fee
        uint256 feeAmount = (amount * platformFee) / 10000;
        uint256 amountAfterFee = amount - feeAmount;
        
        // Transfer tokens
        IERC20(token).safeTransferFrom(msg.sender, recipient, amountAfterFee);
        
        // Transfer fee
        if (feeAmount > 0) {
            IERC20(token).safeTransferFrom(msg.sender, feeRecipient, feeAmount);
        }
        
        // Record payment
        paymentId = _recordPayment(
            msg.sender,
            recipient,
            token,
            amount,
            note,
            PaymentType.INSTANT
        );
        
        emit PaymentSent(paymentId, msg.sender, recipient, token, amount, PaymentType.INSTANT);
        emit PaymentReceived(paymentId, msg.sender, recipient, token, amountAfterFee);
        
        return paymentId;
    }
    
    /**
     * @dev Send MNT to multiple recipients in one transaction
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts for each recipient
     * @param notes Array of notes for each payment
     */
    function batchSendMNT(
        address payable[] calldata recipients,
        uint256[] calldata amounts,
        string[] calldata notes
    ) external payable nonReentrant {
        require(recipients.length == amounts.length, "Length mismatch");
        require(recipients.length == notes.length, "Length mismatch");
        require(recipients.length > 0, "No recipients");
        require(recipients.length <= 100, "Too many recipients");
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        
        require(msg.value >= totalAmount, "Insufficient MNT");
        
        // Execute batch payments
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient");
            require(amounts[i] > 0, "Amount must be > 0");
            
            uint256 feeAmount = (amounts[i] * platformFee) / 10000;
            uint256 amountAfterFee = amounts[i] - feeAmount;
            
            recipients[i].transfer(amountAfterFee);
            
            if (feeAmount > 0) {
                payable(feeRecipient).transfer(feeAmount);
            }
            
            uint256 paymentId = _recordPayment(
                msg.sender,
                recipients[i],
                address(0),
                amounts[i],
                notes[i],
                PaymentType.BATCH
            );
            
            emit PaymentSent(paymentId, msg.sender, recipients[i], address(0), amounts[i], PaymentType.BATCH);
        }
        
        emit BatchPaymentExecuted(msg.sender, recipients.length, address(0), totalAmount);
        
        // Refund excess
        if (msg.value > totalAmount) {
            payable(msg.sender).transfer(msg.value - totalAmount);
        }
    }
    
    /**
     * @dev Send tokens to multiple recipients in one transaction
     * @param token ERC20 token address
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts for each recipient
     * @param notes Array of notes for each payment
     */
    function batchSendToken(
        address token,
        address[] calldata recipients,
        uint256[] calldata amounts,
        string[] calldata notes
    ) external nonReentrant {
        require(token != address(0), "Invalid token");
        require(recipients.length == amounts.length, "Length mismatch");
        require(recipients.length == notes.length, "Length mismatch");
        require(recipients.length > 0, "No recipients");
        require(recipients.length <= 100, "Too many recipients");
        
        uint256 totalAmount = 0;
        
        // Execute batch payments
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient");
            require(amounts[i] > 0, "Amount must be > 0");
            
            uint256 feeAmount = (amounts[i] * platformFee) / 10000;
            uint256 amountAfterFee = amounts[i] - feeAmount;
            
            IERC20(token).safeTransferFrom(msg.sender, recipients[i], amountAfterFee);
            
            if (feeAmount > 0) {
                IERC20(token).safeTransferFrom(msg.sender, feeRecipient, feeAmount);
            }
            
            totalAmount += amounts[i];
            
            uint256 paymentId = _recordPayment(
                msg.sender,
                recipients[i],
                token,
                amounts[i],
                notes[i],
                PaymentType.BATCH
            );
            
            emit PaymentSent(paymentId, msg.sender, recipients[i], token, amounts[i], PaymentType.BATCH);
        }
        
        emit BatchPaymentExecuted(msg.sender, recipients.length, token, totalAmount);
    }
    
    /**
     * @dev Create a payment request with QR code (recipient creates request)
     * @param token Token address (address(0) for MNT)
     * @param amount Amount requested
     * @param note Payment note/description
     * @param expiresIn Expiration time in seconds (0 for no expiry)
     * @return requestId Payment request ID (can be encoded in QR code)
     */
    function createPaymentRequest(
        address token,
        uint256 amount,
        string calldata note,
        uint256 expiresIn
    ) external returns (uint256 requestId) {
        require(amount > 0, "Amount must be > 0");
        
        requestId = requestIdCounter++;
        
        uint256 expiresAt = expiresIn > 0 ? block.timestamp + expiresIn : 0;
        
        paymentRequests[requestId] = PaymentRequest({
            id: requestId,
            recipient: msg.sender,
            token: token,
            amount: amount,
            note: note,
            isPaid: false,
            createdAt: block.timestamp,
            expiresAt: expiresAt
        });
        
        userPaymentRequests[msg.sender].push(requestId);
        
        emit PaymentRequestCreated(requestId, msg.sender, token, amount);
        
        return requestId;
    }
    
    /**
     * @dev Fulfill a payment request (sender scans QR code and pays)
     * @param requestId Payment request ID from QR code
     */
    function fulfillPaymentRequest(uint256 requestId) external payable nonReentrant {
        PaymentRequest storage request = paymentRequests[requestId];
        require(request.id == requestId, "Request does not exist");
        require(!request.isPaid, "Already paid");
        require(request.expiresAt == 0 || block.timestamp <= request.expiresAt, "Request expired");
        
        uint256 paymentId;
        
        if (request.token == address(0)) {
            // MNT payment
            require(msg.value >= request.amount, "Insufficient MNT");
            
            uint256 feeAmount = (request.amount * platformFee) / 10000;
            uint256 amountAfterFee = request.amount - feeAmount;
            
            payable(request.recipient).transfer(amountAfterFee);
            
            if (feeAmount > 0) {
                payable(feeRecipient).transfer(feeAmount);
            }
            
            // Refund excess
            if (msg.value > request.amount) {
                payable(msg.sender).transfer(msg.value - request.amount);
            }
            
            paymentId = _recordPayment(
                msg.sender,
                request.recipient,
                address(0),
                request.amount,
                request.note,
                PaymentType.REQUEST
            );
        } else {
            // Token payment
            uint256 feeAmount = (request.amount * platformFee) / 10000;
            uint256 amountAfterFee = request.amount - feeAmount;
            
            IERC20(request.token).safeTransferFrom(msg.sender, request.recipient, amountAfterFee);
            
            if (feeAmount > 0) {
                IERC20(request.token).safeTransferFrom(msg.sender, feeRecipient, feeAmount);
            }
            
            paymentId = _recordPayment(
                msg.sender,
                request.recipient,
                request.token,
                request.amount,
                request.note,
                PaymentType.REQUEST
            );
        }
        
        request.isPaid = true;
        
        emit PaymentRequestFulfilled(requestId, paymentId, msg.sender);
        emit PaymentSent(paymentId, msg.sender, request.recipient, request.token, request.amount, PaymentType.REQUEST);
    }
    
    /**
     * @dev Get payment request details (for QR code scanner)
     * @param requestId Payment request ID
     * @return request Payment request details
     */
    function getPaymentRequest(uint256 requestId) external view returns (PaymentRequest memory) {
        require(paymentRequests[requestId].id == requestId, "Request does not exist");
        return paymentRequests[requestId];
    }
    
    /**
     * @dev Get user's payment requests
     * @param user User address
     * @return Array of payment request IDs
     */
    function getUserPaymentRequests(address user) external view returns (uint256[] memory) {
        return userPaymentRequests[user];
    }
    
    /**
     * @dev Get sent payment history for user
     * @param user User address
     * @return Array of payment IDs
     */
    function getSentPayments(address user) external view returns (uint256[] memory) {
        return userSentPayments[user];
    }
    
    /**
     * @dev Get received payment history for user
     * @param user User address
     * @return Array of payment IDs
     */
    function getReceivedPayments(address user) external view returns (uint256[] memory) {
        return userReceivedPayments[user];
    }
    
    /**
     * @dev Get payment details
     * @param paymentId Payment ID
     * @return payment Payment details
     */
    function getPayment(uint256 paymentId) external view returns (Payment memory) {
        return payments[paymentId];
    }
    
    /**
     * @dev Record a payment internally
     */
    function _recordPayment(
        address sender,
        address recipient,
        address token,
        uint256 amount,
        string memory note,
        PaymentType paymentType
    ) internal returns (uint256 paymentId) {
        paymentId = paymentIdCounter++;
        
        payments[paymentId] = Payment({
            id: paymentId,
            sender: sender,
            recipient: recipient,
            token: token,
            amount: amount,
            timestamp: block.timestamp,
            note: note,
            paymentType: paymentType
        });
        
        userSentPayments[sender].push(paymentId);
        userReceivedPayments[recipient].push(paymentId);
        
        return paymentId;
    }
    
    /**
     * @dev Update platform fee (only owner)
     * @param newFee New fee in basis points
     */
    function setPlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= MAX_FEE, "Fee too high");
        platformFee = newFee;
        emit FeeUpdated(newFee);
    }
    
    /**
     * @dev Update fee recipient (only owner)
     * @param newRecipient New fee recipient address
     */
    function setFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid address");
        feeRecipient = newRecipient;
    }
    
    /**
     * @dev Receive function to accept MNT
     */
    receive() external payable {}
}
