// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./BundleToken.sol";
import "./VaultManager.sol";

/**
 * @title BundleFactory
 * @dev Factory contract for creating and managing token bundles
 * @notice Users can create custom token bundles with specified allocations
 */
contract BundleFactory is Ownable, ReentrancyGuard {
    
    struct BundleInfo {
        address bundleToken;
        address[] tokens;
        uint256[] weights;
        address creator;
        uint256 createdAt;
        string name;
        string symbol;
        bool isActive;
    }
    
    // Vault manager reference
    VaultManager public vaultManager;
    
    // Bundle tracking
    mapping(address => BundleInfo) public bundles;
    address[] public allBundles;
    mapping(address => address[]) public userBundles;
    
    // Events
    event BundleCreated(
        address indexed bundleToken,
        address indexed creator,
        address[] tokens,
        uint256[] weights,
        string name
    );
    event BundleDeactivated(address indexed bundleToken);
    
    // Constants
    uint256 public constant MAX_TOKENS_PER_BUNDLE = 20;
    uint256 public constant WEIGHT_PRECISION = 10000; // 100.00%
    uint256 public minInvestmentAmount = 1e18; // 1 token minimum
    
    /**
     * @dev Constructor
     * @param _vaultManager Address of the vault manager contract
     */
    constructor(address _vaultManager) Ownable(msg.sender) {
        require(_vaultManager != address(0), "Invalid vault manager");
        vaultManager = VaultManager(_vaultManager);
    }
    
    /**
     * @dev Create a new token bundle
     * @param tokens Array of token addresses to include in bundle
     * @param weights Array of weights for each token (must sum to WEIGHT_PRECISION)
     * @param name Name of the bundle
     * @param symbol Symbol of the bundle token
     * @return bundleToken Address of the created bundle token
     */
    function createBundle(
        address[] calldata tokens,
        uint256[] calldata weights,
        string calldata name,
        string calldata symbol
    ) external nonReentrant returns (address bundleToken) {
        require(tokens.length > 0, "At least one token required");
        require(tokens.length <= MAX_TOKENS_PER_BUNDLE, "Too many tokens");
        require(tokens.length == weights.length, "Length mismatch");
        require(bytes(name).length > 0, "Name required");
        require(bytes(symbol).length > 0, "Symbol required");
        
        // Validate weights sum to 100%
        uint256 totalWeight = 0;
        for (uint256 i = 0; i < weights.length; i++) {
            require(weights[i] > 0, "Weight must be > 0");
            totalWeight += weights[i];
        }
        require(totalWeight == WEIGHT_PRECISION, "Weights must sum to 100%");
        
        // Validate token addresses
        for (uint256 i = 0; i < tokens.length; i++) {
            require(tokens[i] != address(0), "Invalid token address");
            // Check for duplicates
            for (uint256 j = i + 1; j < tokens.length; j++) {
                require(tokens[i] != tokens[j], "Duplicate token");
            }
        }
        
        // Deploy new bundle token
        BundleToken newBundle = new BundleToken(
            name,
            symbol,
            tokens,
            weights,
            address(vaultManager)
        );
        bundleToken = address(newBundle);
        
        // Store bundle info
        bundles[bundleToken] = BundleInfo({
            bundleToken: bundleToken,
            tokens: tokens,
            weights: weights,
            creator: msg.sender,
            createdAt: block.timestamp,
            name: name,
            symbol: symbol,
            isActive: true
        });
        
        allBundles.push(bundleToken);
        userBundles[msg.sender].push(bundleToken);
        
        // Register with vault manager
        vaultManager.registerBundle(bundleToken, tokens);
        
        emit BundleCreated(bundleToken, msg.sender, tokens, weights, name);
        
        return bundleToken;
    }
    
    /**
     * @dev Get bundle information
     * @param bundleToken Address of the bundle token
     * @return info Bundle information struct
     */
    function getBundleInfo(address bundleToken) external view returns (BundleInfo memory) {
        require(bundles[bundleToken].bundleToken != address(0), "Bundle does not exist");
        return bundles[bundleToken];
    }
    
    /**
     * @dev Get all bundles created by a user
     * @param user Address of the user
     * @return Array of bundle token addresses
     */
    function getUserBundles(address user) external view returns (address[] memory) {
        return userBundles[user];
    }
    
    /**
     * @dev Get all bundles
     * @return Array of all bundle token addresses
     */
    function getAllBundles() external view returns (address[] memory) {
        return allBundles;
    }
    
    /**
     * @dev Get active bundles
     * @return Array of active bundle token addresses
     */
    function getActiveBundles() external view returns (address[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < allBundles.length; i++) {
            if (bundles[allBundles[i]].isActive) {
                activeCount++;
            }
        }
        
        address[] memory activeBundles = new address[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < allBundles.length; i++) {
            if (bundles[allBundles[i]].isActive) {
                activeBundles[index] = allBundles[i];
                index++;
            }
        }
        
        return activeBundles;
    }
    
    /**
     * @dev Deactivate a bundle (only owner or creator)
     * @param bundleToken Address of the bundle token
     */
    function deactivateBundle(address bundleToken) external {
        BundleInfo storage bundle = bundles[bundleToken];
        require(bundle.bundleToken != address(0), "Bundle does not exist");
        require(
            msg.sender == owner() || msg.sender == bundle.creator,
            "Not authorized"
        );
        require(bundle.isActive, "Already inactive");
        
        bundle.isActive = false;
        emit BundleDeactivated(bundleToken);
    }
    
    /**
     * @dev Update minimum investment amount (only owner)
     * @param newAmount New minimum investment amount
     */
    function setMinInvestmentAmount(uint256 newAmount) external onlyOwner {
        minInvestmentAmount = newAmount;
    }
    
    /**
     * @dev Update vault manager (only owner)
     * @param newVaultManager Address of new vault manager
     */
    function setVaultManager(address newVaultManager) external onlyOwner {
        require(newVaultManager != address(0), "Invalid address");
        vaultManager = VaultManager(newVaultManager);
    }
}

