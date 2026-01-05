// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title KYCRegistry
 * @dev Manages KYC verification status for RWA token holders
 * @notice Implements tiered KYC levels and jurisdiction-based compliance
 */
contract KYCRegistry is AccessControl, Pausable {
    
    bytes32 public constant KYC_PROVIDER_ROLE = keccak256("KYC_PROVIDER_ROLE");
    bytes32 public constant COMPLIANCE_ADMIN_ROLE = keccak256("COMPLIANCE_ADMIN_ROLE");
    
    // KYC Tiers
    enum KYCTier {
        NONE,           // Not verified
        BASIC,          // Basic identity verification
        INTERMEDIATE,   // Enhanced due diligence
        ADVANCED        // Accredited investor status
    }
    
    // KYC Status
    struct KYCStatus {
        KYCTier tier;
        uint256 verificationDate;
        uint256 expirationDate;
        string jurisdiction; // ISO country code (e.g., "US", "SG")
        bool isActive;
        bool isAccreditedInvestor;
        string providerName; // KYC provider identifier
        bytes32 documentHash; // Hash of KYC documents (stored off-chain)
    }
    
    // Jurisdiction restrictions
    struct JurisdictionRules {
        bool isAllowed;
        uint256 maxInvestmentAmount;
        KYCTier minimumTier;
        bool requiresAccreditation;
    }
    
    // Storage
    mapping(address => KYCStatus) public kycStatuses;
    mapping(string => JurisdictionRules) public jurisdictionRules;
    mapping(address => bool) public isBlacklisted;
    
    // Statistics
    uint256 public totalVerifiedUsers;
    mapping(KYCTier => uint256) public tierCounts;
    
    // Events
    event KYCVerified(
        address indexed user, 
        KYCTier tier, 
        string jurisdiction, 
        uint256 expirationDate
    );
    event KYCRevoked(address indexed user, string reason);
    event KYCUpdated(address indexed user, KYCTier newTier);
    event JurisdictionRulesUpdated(string jurisdiction, bool isAllowed);
    event UserBlacklisted(address indexed user, bool status);
    event AccreditationStatusUpdated(address indexed user, bool isAccredited);
    
    /**
     * @dev Constructor
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(COMPLIANCE_ADMIN_ROLE, msg.sender);
        _grantRole(KYC_PROVIDER_ROLE, msg.sender);
        
        // Setup default jurisdiction rules (allow most jurisdictions)
        _setDefaultJurisdictions();
    }
    
    /**
     * @dev Verify a user's KYC
     * @param user Address to verify
     * @param tier KYC tier level
     * @param jurisdiction User's jurisdiction
     * @param validityDays Number of days the KYC is valid
     * @param isAccredited Whether user is an accredited investor
     * @param documentHash Hash of KYC documents
     * @param providerName Name of KYC provider
     */
    function verifyKYC(
        address user,
        KYCTier tier,
        string memory jurisdiction,
        uint256 validityDays,
        bool isAccredited,
        bytes32 documentHash,
        string memory providerName
    ) external onlyRole(KYC_PROVIDER_ROLE) whenNotPaused {
        require(user != address(0), "Invalid address");
        require(tier != KYCTier.NONE, "Invalid tier");
        require(validityDays > 0 && validityDays <= 1825, "Invalid validity period"); // Max 5 years
        require(!isBlacklisted[user], "User is blacklisted");
        require(jurisdictionRules[jurisdiction].isAllowed, "Jurisdiction not allowed");
        
        bool isNewUser = !kycStatuses[user].isActive;
        
        uint256 expirationDate = block.timestamp + (validityDays * 1 days);
        
        kycStatuses[user] = KYCStatus({
            tier: tier,
            verificationDate: block.timestamp,
            expirationDate: expirationDate,
            jurisdiction: jurisdiction,
            isActive: true,
            isAccreditedInvestor: isAccredited,
            providerName: providerName,
            documentHash: documentHash
        });
        
        if (isNewUser) {
            totalVerifiedUsers++;
        }
        
        tierCounts[tier]++;
        
        emit KYCVerified(user, tier, jurisdiction, expirationDate);
        
        if (isAccredited) {
            emit AccreditationStatusUpdated(user, true);
        }
    }
    
    /**
     * @dev Update user's KYC tier
     * @param user Address to update
     * @param newTier New KYC tier
     */
    function updateKYCTier(address user, KYCTier newTier) 
        external 
        onlyRole(KYC_PROVIDER_ROLE) 
    {
        require(kycStatuses[user].isActive, "User not verified");
        require(newTier != KYCTier.NONE, "Invalid tier");
        
        KYCTier oldTier = kycStatuses[user].tier;
        
        if (oldTier != newTier) {
            tierCounts[oldTier]--;
            tierCounts[newTier]++;
            kycStatuses[user].tier = newTier;
            
            emit KYCUpdated(user, newTier);
        }
    }
    
    /**
     * @dev Revoke user's KYC
     * @param user Address to revoke
     * @param reason Reason for revocation
     */
    function revokeKYC(address user, string memory reason) 
        external 
        onlyRole(COMPLIANCE_ADMIN_ROLE) 
    {
        require(kycStatuses[user].isActive, "User not verified");
        
        kycStatuses[user].isActive = false;
        totalVerifiedUsers--;
        tierCounts[kycStatuses[user].tier]--;
        
        emit KYCRevoked(user, reason);
    }
    
    /**
     * @dev Update accredited investor status
     * @param user Address to update
     * @param isAccredited New accreditation status
     */
    function updateAccreditationStatus(address user, bool isAccredited) 
        external 
        onlyRole(KYC_PROVIDER_ROLE) 
    {
        require(kycStatuses[user].isActive, "User not verified");
        kycStatuses[user].isAccreditedInvestor = isAccredited;
        emit AccreditationStatusUpdated(user, isAccredited);
    }
    
    /**
     * @dev Set jurisdiction rules
     * @param jurisdiction ISO country code
     * @param isAllowed Whether jurisdiction is allowed
     * @param maxAmount Maximum investment amount (0 = unlimited)
     * @param minTier Minimum required KYC tier
     * @param requiresAccreditation Whether accreditation is required
     */
    function setJurisdictionRules(
        string memory jurisdiction,
        bool isAllowed,
        uint256 maxAmount,
        KYCTier minTier,
        bool requiresAccreditation
    ) external onlyRole(COMPLIANCE_ADMIN_ROLE) {
        jurisdictionRules[jurisdiction] = JurisdictionRules({
            isAllowed: isAllowed,
            maxInvestmentAmount: maxAmount,
            minimumTier: minTier,
            requiresAccreditation: requiresAccreditation
        });
        
        emit JurisdictionRulesUpdated(jurisdiction, isAllowed);
    }
    
    /**
     * @dev Blacklist or unblacklist a user
     * @param user Address to update
     * @param status Blacklist status
     */
    function setBlacklisted(address user, bool status) 
        external 
        onlyRole(COMPLIANCE_ADMIN_ROLE) 
    {
        isBlacklisted[user] = status;
        
        if (status && kycStatuses[user].isActive) {
            kycStatuses[user].isActive = false;
            totalVerifiedUsers--;
            tierCounts[kycStatuses[user].tier]--;
        }
        
        emit UserBlacklisted(user, status);
    }
    
    /**
     * @dev Check if user is verified
     * @param user Address to check
     * @return Boolean indicating verification status
     */
    function isVerified(address user) external view returns (bool) {
        KYCStatus memory status = kycStatuses[user];
        return status.isActive && 
               block.timestamp < status.expirationDate && 
               !isBlacklisted[user];
    }
    
    /**
     * @dev Check if user meets tier requirement
     * @param user Address to check
     * @param requiredTier Minimum required tier
     * @return Boolean indicating if requirement is met
     */
    function meetsKYCTier(address user, KYCTier requiredTier) 
        external 
        view 
        returns (bool) 
    {
        KYCStatus memory status = kycStatuses[user];
        return status.isActive && 
               status.tier >= requiredTier &&
               block.timestamp < status.expirationDate &&
               !isBlacklisted[user];
    }
    
    /**
     * @dev Check if user can invest from their jurisdiction
     * @param user Address to check
     * @param amount Investment amount
     * @return Boolean indicating if investment is allowed
     */
    function canInvestFromJurisdiction(address user, uint256 amount) 
        external 
        view 
        returns (bool) 
    {
        KYCStatus memory status = kycStatuses[user];
        
        if (!status.isActive || block.timestamp >= status.expirationDate || isBlacklisted[user]) {
            return false;
        }
        
        JurisdictionRules memory rules = jurisdictionRules[status.jurisdiction];
        
        if (!rules.isAllowed) return false;
        if (rules.maxInvestmentAmount > 0 && amount > rules.maxInvestmentAmount) return false;
        if (status.tier < rules.minimumTier) return false;
        if (rules.requiresAccreditation && !status.isAccreditedInvestor) return false;
        
        return true;
    }
    
    /**
     * @dev Get user's KYC status
     * @param user Address to query
     */
    function getKYCStatus(address user) 
        external 
        view 
        returns (
            KYCTier tier,
            uint256 verificationDate,
            uint256 expirationDate,
            string memory jurisdiction,
            bool isActive,
            bool isAccredited
        ) 
    {
        KYCStatus memory status = kycStatuses[user];
        return (
            status.tier,
            status.verificationDate,
            status.expirationDate,
            status.jurisdiction,
            status.isActive && block.timestamp < status.expirationDate && !isBlacklisted[user],
            status.isAccreditedInvestor
        );
    }
    
    /**
     * @dev Setup default jurisdiction rules
     */
    function _setDefaultJurisdictions() private {
        // Allow most jurisdictions with basic requirements
        string[10] memory allowedJurisdictions = ["US", "SG", "GB", "DE", "FR", "JP", "AU", "CA", "CH", "NL"];
        
        for (uint256 i = 0; i < allowedJurisdictions.length; i++) {
            jurisdictionRules[allowedJurisdictions[i]] = JurisdictionRules({
                isAllowed: true,
                maxInvestmentAmount: 0, // Unlimited
                minimumTier: KYCTier.BASIC,
                requiresAccreditation: false
            });
        }
        
        // Restricted jurisdictions can be added as needed
        jurisdictionRules["KP"] = JurisdictionRules({
            isAllowed: false,
            maxInvestmentAmount: 0,
            minimumTier: KYCTier.NONE,
            requiresAccreditation: false
        });
    }
    
    /**
     * @dev Pause KYC operations
     */
    function pause() external onlyRole(COMPLIANCE_ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause KYC operations
     */
    function unpause() external onlyRole(COMPLIANCE_ADMIN_ROLE) {
        _unpause();
    }
}
