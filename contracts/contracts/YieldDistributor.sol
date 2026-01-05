// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title YieldDistributor
 * @dev Distributes yield from RWAs to token holders with compliance checks
 * @notice Handles rental income, bond coupons, invoice payments, etc.
 */
contract YieldDistributor is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");
    
    // Distribution record
    struct Distribution {
        address rwaToken;
        address yieldToken;
        uint256 totalAmount;
        uint256 perTokenAmount;
        uint256 distributionDate;
        uint256 claimDeadline;
        string description;
        bool isActive;
        uint256 totalClaimed;
    }
    
    // Tax withholding (for compliance)
    struct TaxWithholding {
        uint256 rate; // In basis points (100 = 1%)
        address taxRecipient;
        bool isActive;
    }
    
    // Storage
    mapping(uint256 => Distribution) public distributions;
    mapping(uint256 => mapping(address => bool)) public hasClaimed;
    mapping(uint256 => mapping(address => uint256)) public claimAmounts;
    uint256 public distributionCount;
    
    // Tax withholding by jurisdiction
    mapping(string => TaxWithholding) public jurisdictionTax;
    
    address public kycRegistry;
    
    // Statistics
    uint256 public totalDistributed;
    uint256 public totalWithheld;
    mapping(address => uint256) public holderEarnings;
    
    // Events
    event YieldDistributed(
        uint256 indexed distributionId,
        address indexed rwaToken,
        uint256 totalAmount,
        string description
    );
    event YieldClaimed(
        uint256 indexed distributionId,
        address indexed holder,
        uint256 grossAmount,
        uint256 netAmount,
        uint256 taxWithheld
    );
    event TaxWithholdingUpdated(string jurisdiction, uint256 rate, address recipient);
    event DistributionCancelled(uint256 indexed distributionId);
    
    /**
     * @dev Constructor
     * @param _kycRegistry Address of KYC registry
     */
    constructor(address _kycRegistry) {
        require(_kycRegistry != address(0), "Invalid KYC registry");
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(DISTRIBUTOR_ROLE, msg.sender);
        _grantRole(COMPLIANCE_ROLE, msg.sender);
        
        kycRegistry = _kycRegistry;
    }
    
    /**
     * @dev Create new yield distribution
     * @param rwaToken RWA token address
     * @param yieldToken Token used for yield payment (USDC, USDT, etc.)
     * @param totalAmount Total yield amount to distribute
     * @param claimPeriodDays Number of days holders can claim
     * @param description Description of yield (e.g., "Q1 2026 Rental Income")
     */
    function createDistribution(
        address rwaToken,
        address yieldToken,
        uint256 totalAmount,
        uint256 claimPeriodDays,
        string memory description
    ) external onlyRole(DISTRIBUTOR_ROLE) nonReentrant returns (uint256) {
        require(rwaToken != address(0), "Invalid RWA token");
        require(yieldToken != address(0), "Invalid yield token");
        require(totalAmount > 0, "Invalid amount");
        require(claimPeriodDays > 0, "Invalid claim period");
        
        // Transfer yield tokens to this contract
        IERC20(yieldToken).safeTransferFrom(msg.sender, address(this), totalAmount);
        
        uint256 rwaSupply = IERC20(rwaToken).totalSupply();
        require(rwaSupply > 0, "No RWA tokens issued");
        
        uint256 perTokenAmount = (totalAmount * 1e18) / rwaSupply;
        uint256 distributionId = distributionCount++;
        uint256 claimDeadline = block.timestamp + (claimPeriodDays * 1 days);
        
        distributions[distributionId] = Distribution({
            rwaToken: rwaToken,
            yieldToken: yieldToken,
            totalAmount: totalAmount,
            perTokenAmount: perTokenAmount,
            distributionDate: block.timestamp,
            claimDeadline: claimDeadline,
            description: description,
            isActive: true,
            totalClaimed: 0
        });
        
        emit YieldDistributed(distributionId, rwaToken, totalAmount, description);
        
        return distributionId;
    }
    
    /**
     * @dev Claim yield from distribution
     * @param distributionId Distribution ID to claim from
     */
    function claimYield(uint256 distributionId) external nonReentrant {
        Distribution storage dist = distributions[distributionId];
        
        require(dist.isActive, "Distribution not active");
        require(block.timestamp <= dist.claimDeadline, "Claim period ended");
        require(!hasClaimed[distributionId][msg.sender], "Already claimed");
        require(_isKYCVerified(msg.sender), "Not KYC verified");
        
        uint256 holderBalance = IERC20(dist.rwaToken).balanceOf(msg.sender);
        require(holderBalance > 0, "No tokens held");
        
        uint256 grossAmount = (holderBalance * dist.perTokenAmount) / 1e18;
        require(grossAmount > 0, "No yield to claim");
        
        // Get holder's jurisdiction for tax withholding
        string memory jurisdiction = _getJurisdiction(msg.sender);
        TaxWithholding memory tax = jurisdictionTax[jurisdiction];
        
        uint256 taxAmount = 0;
        uint256 netAmount = grossAmount;
        
        if (tax.isActive && tax.rate > 0) {
            taxAmount = (grossAmount * tax.rate) / 10000;
            netAmount = grossAmount - taxAmount;
            
            // Transfer tax to tax recipient
            if (taxAmount > 0) {
                IERC20(dist.yieldToken).safeTransfer(tax.taxRecipient, taxAmount);
                totalWithheld += taxAmount;
            }
        }
        
        // Mark as claimed
        hasClaimed[distributionId][msg.sender] = true;
        claimAmounts[distributionId][msg.sender] = netAmount;
        dist.totalClaimed += grossAmount;
        
        // Transfer net yield to holder
        IERC20(dist.yieldToken).safeTransfer(msg.sender, netAmount);
        
        // Update statistics
        totalDistributed += grossAmount;
        holderEarnings[msg.sender] += netAmount;
        
        emit YieldClaimed(distributionId, msg.sender, grossAmount, netAmount, taxAmount);
    }
    
    /**
     * @dev Batch claim multiple distributions
     * @param distributionIds Array of distribution IDs
     */
    function batchClaimYield(uint256[] memory distributionIds) external nonReentrant {
        require(distributionIds.length > 0, "No distributions specified");
        require(distributionIds.length <= 20, "Too many distributions");
        
        for (uint256 i = 0; i < distributionIds.length; i++) {
            uint256 distributionId = distributionIds[i];
            Distribution storage dist = distributions[distributionId];
            
            if (!dist.isActive || 
                block.timestamp > dist.claimDeadline || 
                hasClaimed[distributionId][msg.sender]) {
                continue;
            }
            
            uint256 holderBalance = IERC20(dist.rwaToken).balanceOf(msg.sender);
            if (holderBalance == 0) continue;
            
            uint256 grossAmount = (holderBalance * dist.perTokenAmount) / 1e18;
            if (grossAmount == 0) continue;
            
            // Get holder's jurisdiction for tax withholding
            string memory jurisdiction = _getJurisdiction(msg.sender);
            TaxWithholding memory tax = jurisdictionTax[jurisdiction];
            
            uint256 taxAmount = 0;
            uint256 netAmount = grossAmount;
            
            if (tax.isActive && tax.rate > 0) {
                taxAmount = (grossAmount * tax.rate) / 10000;
                netAmount = grossAmount - taxAmount;
                
                if (taxAmount > 0) {
                    IERC20(dist.yieldToken).safeTransfer(tax.taxRecipient, taxAmount);
                    totalWithheld += taxAmount;
                }
            }
            
            hasClaimed[distributionId][msg.sender] = true;
            claimAmounts[distributionId][msg.sender] = netAmount;
            dist.totalClaimed += grossAmount;
            
            IERC20(dist.yieldToken).safeTransfer(msg.sender, netAmount);
            
            totalDistributed += grossAmount;
            holderEarnings[msg.sender] += netAmount;
            
            emit YieldClaimed(distributionId, msg.sender, grossAmount, netAmount, taxAmount);
        }
    }
    
    /**
     * @dev Get claimable amount for a holder
     * @param distributionId Distribution ID
     * @param holder Holder address
     */
    function getClaimableAmount(uint256 distributionId, address holder) 
        external 
        view 
        returns (uint256 grossAmount, uint256 netAmount, uint256 taxAmount) 
    {
        Distribution memory dist = distributions[distributionId];
        
        if (!dist.isActive || 
            block.timestamp > dist.claimDeadline || 
            hasClaimed[distributionId][holder]) {
            return (0, 0, 0);
        }
        
        uint256 holderBalance = IERC20(dist.rwaToken).balanceOf(holder);
        if (holderBalance == 0) return (0, 0, 0);
        
        grossAmount = (holderBalance * dist.perTokenAmount) / 1e18;
        
        string memory jurisdiction = _getJurisdiction(holder);
        TaxWithholding memory tax = jurisdictionTax[jurisdiction];
        
        if (tax.isActive && tax.rate > 0) {
            taxAmount = (grossAmount * tax.rate) / 10000;
            netAmount = grossAmount - taxAmount;
        } else {
            netAmount = grossAmount;
            taxAmount = 0;
        }
        
        return (grossAmount, netAmount, taxAmount);
    }
    
    /**
     * @dev Set tax withholding for a jurisdiction
     * @param jurisdiction ISO country code
     * @param rate Tax rate in basis points (100 = 1%)
     * @param taxRecipient Address to receive withheld taxes
     */
    function setTaxWithholding(
        string memory jurisdiction,
        uint256 rate,
        address taxRecipient
    ) external onlyRole(COMPLIANCE_ROLE) {
        require(rate <= 5000, "Tax rate too high"); // Max 50%
        require(taxRecipient != address(0), "Invalid recipient");
        
        jurisdictionTax[jurisdiction] = TaxWithholding({
            rate: rate,
            taxRecipient: taxRecipient,
            isActive: true
        });
        
        emit TaxWithholdingUpdated(jurisdiction, rate, taxRecipient);
    }
    
    /**
     * @dev Cancel distribution and return unclaimed yield
     * @param distributionId Distribution ID
     * @param recipient Recipient for unclaimed yield
     */
    function cancelDistribution(uint256 distributionId, address recipient) 
        external 
        onlyRole(DISTRIBUTOR_ROLE) 
        nonReentrant 
    {
        Distribution storage dist = distributions[distributionId];
        require(dist.isActive, "Distribution not active");
        
        uint256 unclaimedAmount = dist.totalAmount - dist.totalClaimed;
        
        dist.isActive = false;
        
        if (unclaimedAmount > 0) {
            IERC20(dist.yieldToken).safeTransfer(recipient, unclaimedAmount);
        }
        
        emit DistributionCancelled(distributionId);
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
    
    /**
     * @dev Get jurisdiction of an address
     */
    function _getJurisdiction(address account) private view returns (string memory) {
        (bool success, bytes memory data) = kycRegistry.staticcall(
            abi.encodeWithSignature("getKYCStatus(address)", account)
        );
        
        if (!success || data.length == 0) return "";
        
        (,,,string memory jurisdiction,,) = abi.decode(
            data, 
            (uint8, uint256, uint256, string, bool, bool)
        );
        
        return jurisdiction;
    }
    
    /**
     * @dev Get distribution details
     */
    function getDistribution(uint256 distributionId) 
        external 
        view 
        returns (
            address rwaToken,
            address yieldToken,
            uint256 totalAmount,
            uint256 totalClaimed,
            uint256 distributionDate,
            uint256 claimDeadline,
            bool isActive
        ) 
    {
        Distribution memory dist = distributions[distributionId];
        return (
            dist.rwaToken,
            dist.yieldToken,
            dist.totalAmount,
            dist.totalClaimed,
            dist.distributionDate,
            dist.claimDeadline,
            dist.isActive
        );
    }
}
