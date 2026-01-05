// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RWAToken
 * @dev ERC20 token representing fractionalized ownership of real-world assets
 * @notice Supports real estate, bonds, invoices, and cash-flow generating assets
 */
contract RWAToken is ERC20, AccessControl, Pausable, ReentrancyGuard {
    
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    
    // Asset Types
    enum AssetType {
        REAL_ESTATE,
        BOND,
        INVOICE,
        CASH_FLOW_RIGHTS,
        OTHER
    }
    
    // Asset Details
    struct AssetDetails {
        AssetType assetType;
        string assetIdentifier; // Property address, bond ISIN, invoice number
        uint256 totalValue; // In USD cents
        uint256 acquisitionDate;
        string legalDocumentHash; // IPFS hash of legal documents
        string valuationReportHash; // IPFS hash of valuation
        bool isVerified;
    }
    
    // Yield Distribution
    struct YieldDistribution {
        uint256 totalAmount;
        uint256 distributionDate;
        uint256 perTokenAmount;
        string description; // e.g., "Q1 2026 Rental Income"
    }
    
    AssetDetails public assetDetails;
    address public kycRegistry;
    address public rwaVault; // Custody contract
    
    // Yield tracking
    YieldDistribution[] public yieldHistory;
    mapping(address => uint256) public lastClaimedYield;
    mapping(address => uint256) public accumulatedYield;
    
    // Transfer restrictions
    bool public transfersRestricted = true;
    mapping(address => bool) public isWhitelisted;
    
    // Events
    event AssetVerified(string assetIdentifier);
    event YieldDistributed(uint256 indexed distributionId, uint256 totalAmount, uint256 perTokenAmount);
    event YieldClaimed(address indexed holder, uint256 amount);
    event TransferRestrictionUpdated(bool restricted);
    event HolderWhitelisted(address indexed holder, bool status);
    
    /**
     * @dev Constructor
     * @param name Name of the RWA token (e.g., "Miami Beach Property 123")
     * @param symbol Symbol (e.g., "RWA-MIA123")
     * @param _assetType Type of real-world asset
     * @param _assetIdentifier Unique identifier for the asset
     * @param _totalValue Total value of the asset in USD cents
     * @param _legalDocumentHash IPFS hash of legal documents
     * @param _kycRegistry Address of KYC registry contract
     * @param _rwaVault Address of custody vault
     */
    constructor(
        string memory name,
        string memory symbol,
        AssetType _assetType,
        string memory _assetIdentifier,
        uint256 _totalValue,
        string memory _legalDocumentHash,
        address _kycRegistry,
        address _rwaVault
    ) ERC20(name, symbol) {
        require(_kycRegistry != address(0), "Invalid KYC registry");
        require(_rwaVault != address(0), "Invalid vault");
        require(_totalValue > 0, "Invalid asset value");
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(COMPLIANCE_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        
        assetDetails = AssetDetails({
            assetType: _assetType,
            assetIdentifier: _assetIdentifier,
            totalValue: _totalValue,
            acquisitionDate: block.timestamp,
            legalDocumentHash: _legalDocumentHash,
            valuationReportHash: "",
            isVerified: false
        });
        
        kycRegistry = _kycRegistry;
        rwaVault = _rwaVault;
    }
    
    /**
     * @dev Mint tokens representing fractionalized ownership
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) 
        external 
        onlyRole(MINTER_ROLE) 
        whenNotPaused 
    {
        require(isKYCVerified(to), "Recipient not KYC verified");
        _mint(to, amount);
        
        if (!isWhitelisted[to]) {
            isWhitelisted[to] = true;
            emit HolderWhitelisted(to, true);
        }
    }
    
    /**
     * @dev Verify the asset with legal documentation
     * @param valuationHash IPFS hash of valuation report
     */
    function verifyAsset(string memory valuationHash) 
        external 
        onlyRole(COMPLIANCE_ROLE) 
    {
        assetDetails.valuationReportHash = valuationHash;
        assetDetails.isVerified = true;
        emit AssetVerified(assetDetails.assetIdentifier);
    }
    
    /**
     * @dev Distribute yield to token holders
     * @param totalAmount Total yield amount to distribute
     * @param description Description of yield distribution
     */
    function distributeYield(uint256 totalAmount, string memory description) 
        external 
        onlyRole(MINTER_ROLE) 
        nonReentrant 
    {
        require(totalAmount > 0, "Invalid amount");
        require(totalSupply() > 0, "No tokens issued");
        
        uint256 perTokenAmount = (totalAmount * 1e18) / totalSupply();
        
        yieldHistory.push(YieldDistribution({
            totalAmount: totalAmount,
            distributionDate: block.timestamp,
            perTokenAmount: perTokenAmount,
            description: description
        }));
        
        emit YieldDistributed(yieldHistory.length - 1, totalAmount, perTokenAmount);
    }
    
    /**
     * @dev Calculate unclaimed yield for a holder
     * @param holder Address of token holder
     * @return Unclaimed yield amount
     */
    function getUnclaimedYield(address holder) public view returns (uint256) {
        if (yieldHistory.length == 0) return 0;
        
        uint256 lastClaimed = lastClaimedYield[holder];
        uint256 unclaimed = 0;
        
        for (uint256 i = lastClaimed; i < yieldHistory.length; i++) {
            uint256 holderBalance = balanceOf(holder);
            unclaimed += (holderBalance * yieldHistory[i].perTokenAmount) / 1e18;
        }
        
        return unclaimed;
    }
    
    /**
     * @dev Claim accumulated yield
     */
    function claimYield() external nonReentrant {
        require(isKYCVerified(msg.sender), "Not KYC verified");
        
        uint256 unclaimed = getUnclaimedYield(msg.sender);
        require(unclaimed > 0, "No yield to claim");
        
        lastClaimedYield[msg.sender] = yieldHistory.length;
        accumulatedYield[msg.sender] += unclaimed;
        
        emit YieldClaimed(msg.sender, unclaimed);
    }
    
    /**
     * @dev Check if address is KYC verified
     * @param account Address to check
     * @return Boolean indicating KYC status
     */
    function isKYCVerified(address account) public view returns (bool) {
        (bool success, bytes memory data) = kycRegistry.staticcall(
            abi.encodeWithSignature("isVerified(address)", account)
        );
        
        if (!success || data.length == 0) return false;
        return abi.decode(data, (bool));
    }
    
    /**
     * @dev Override transfer to enforce KYC requirements
     */
    function _update(address from, address to, uint256 value) 
        internal 
        override 
        whenNotPaused 
    {
        // Allow minting and burning
        if (from == address(0) || to == address(0)) {
            super._update(from, to, value);
            return;
        }
        
        // Check transfer restrictions
        if (transfersRestricted) {
            require(isWhitelisted[from] && isWhitelisted[to], "Transfer restricted");
        }
        
        // Enforce KYC for transfers
        require(isKYCVerified(to), "Recipient not KYC verified");
        
        super._update(from, to, value);
    }
    
    /**
     * @dev Update transfer restrictions
     * @param restricted Whether transfers should be restricted
     */
    function setTransferRestricted(bool restricted) 
        external 
        onlyRole(COMPLIANCE_ROLE) 
    {
        transfersRestricted = restricted;
        emit TransferRestrictionUpdated(restricted);
    }
    
    /**
     * @dev Whitelist an address for transfers
     * @param account Address to whitelist
     * @param status Whitelist status
     */
    function setWhitelisted(address account, bool status) 
        external 
        onlyRole(COMPLIANCE_ROLE) 
    {
        isWhitelisted[account] = status;
        emit HolderWhitelisted(account, status);
    }
    
    /**
     * @dev Pause all token operations
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause token operations
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Get total yield distributions
     */
    function getYieldHistoryLength() external view returns (uint256) {
        return yieldHistory.length;
    }
    
    /**
     * @dev Get asset type as string
     */
    function getAssetTypeString() external view returns (string memory) {
        if (assetDetails.assetType == AssetType.REAL_ESTATE) return "Real Estate";
        if (assetDetails.assetType == AssetType.BOND) return "Bond";
        if (assetDetails.assetType == AssetType.INVOICE) return "Invoice";
        if (assetDetails.assetType == AssetType.CASH_FLOW_RIGHTS) return "Cash Flow Rights";
        return "Other";
    }
}
