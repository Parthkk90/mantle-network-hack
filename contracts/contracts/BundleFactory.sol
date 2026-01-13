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
    
    // Investment tracking
    mapping(address => mapping(address => uint256)) public userInvestments; // bundleToken => user => amount
    
    // Events
    event BundleCreated(
        address indexed bundleToken,
        address indexed creator,
        address[] tokens,
        uint256[] weights,
        string name
    );
    event BundleDeactivated(address indexed bundleToken);
    event Investment(address indexed bundleToken, address indexed user, uint256 amount);
    event Withdrawal(address indexed bundleToken, address indexed user, uint256 amount);
    
    // Constants
    uint256 public constant MAX_TOKENS_PER_BUNDLE = 20;
    uint256 public constant WEIGHT_PRECISION = 10000; // 100.00%
    uint256 public minInvestmentAmount = 1e18; // 1 token minimum
    
    /**
     * @dev Constructor
     * @param _vaultManager Address of the vault manager contract
     */
    constructor(address payable _vaultManager) Ownable(msg.sender) {
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
    function setVaultManager(address payable newVaultManager) external onlyOwner {
        require(newVaultManager != address(0), "Invalid address");
        vaultManager = VaultManager(newVaultManager);
    }
    
    /**
     * @dev Invest in a bundle with native token (MNT)
     * @param bundleToken Address of the bundle token to invest in
     * @param amount Amount to invest (for validation, must match msg.value)
     */
    function investInBundle(address bundleToken, uint256 amount) 
        external 
        payable 
        nonReentrant 
    {
        require(bundles[bundleToken].bundleToken != address(0), "Bundle does not exist");
        require(bundles[bundleToken].isActive, "Bundle is not active");
        require(msg.value > 0, "Investment amount must be > 0");
        require(msg.value >= minInvestmentAmount, "Below minimum investment");
        require(msg.value == amount, "Amount mismatch");
        
        // Track user investment
        userInvestments[bundleToken][msg.sender] += msg.value;
        
        // Transfer funds to vault manager
        (bool success, ) = address(vaultManager).call{value: msg.value}("");
        require(success, "Transfer to vault failed");
        
        emit Investment(bundleToken, msg.sender, msg.value);
    }
    
    /**
     * @dev Get user's investment in a specific bundle
     * @param bundleToken Address of the bundle token
     * @param user Address of the user
     * @return Investment amount
     */
    function getUserInvestment(address bundleToken, address user) 
        external 
        view 
        returns (uint256) 
    {
        return userInvestments[bundleToken][user];
    }
    
    /**
     * @dev Withdraw investment from a bundle
     * @param bundleToken Address of the bundle token
     * @param amount Amount to withdraw
     */
    function withdrawFromBundle(address bundleToken, uint256 amount) 
        external 
        nonReentrant 
    {
        require(bundles[bundleToken].bundleToken != address(0), "Bundle does not exist");
        require(userInvestments[bundleToken][msg.sender] >= amount, "Insufficient investment");
        
        // Update investment tracking
        userInvestments[bundleToken][msg.sender] -= amount;
        
        // Transfer funds from vault back to user
        (bool success, ) = address(vaultManager).call(
            abi.encodeWithSignature(
                "withdrawToUser(address,uint256)",
                msg.sender,
                amount
            )
        );
        require(success, "Withdrawal failed");
        
        emit Withdrawal(bundleToken, msg.sender, amount);
    }
}
