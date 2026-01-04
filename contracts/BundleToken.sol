// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BundleToken
 * @dev ERC20 token representing shares in a token bundle
 * @notice Users deposit underlying tokens and receive bundle tokens proportionally
 */
contract BundleToken is ERC20, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    
    // Bundle configuration
    address[] public underlyingTokens;
    uint256[] public targetWeights;
    address public vaultManager;
    
    // Constants
    uint256 public constant WEIGHT_PRECISION = 10000; // 100.00%
    uint256 public constant MIN_REBALANCE_THRESHOLD = 500; // 5% deviation triggers rebalance
    
    // State
    uint256 public lastRebalanceTime;
    uint256 public rebalanceInterval = 1 days;
    bool public isPaused;
    
    // Events
    event Deposited(address indexed user, uint256 bundleAmount, uint256[] tokenAmounts);
    event Withdrawn(address indexed user, uint256 bundleAmount, uint256[] tokenAmounts);
    event Rebalanced(uint256 timestamp);
    event Paused();
    event Unpaused();
    
    /**
     * @dev Constructor
     * @param name Name of the bundle token
     * @param symbol Symbol of the bundle token
     * @param tokens Array of underlying token addresses
     * @param weights Array of target weights for each token
     * @param _vaultManager Address of the vault manager
     */
    constructor(
        string memory name,
        string memory symbol,
        address[] memory tokens,
        uint256[] memory weights,
        address _vaultManager
    ) ERC20(name, symbol) Ownable(msg.sender) {
        require(tokens.length == weights.length, "Length mismatch");
        require(_vaultManager != address(0), "Invalid vault manager");
        
        underlyingTokens = tokens;
        targetWeights = weights;
        vaultManager = _vaultManager;
        lastRebalanceTime = block.timestamp;
    }
    
    /**
     * @dev Deposit tokens and receive bundle tokens
     * @param tokenAmounts Array of token amounts to deposit
     * @return bundleAmount Amount of bundle tokens minted
     */
    function deposit(uint256[] calldata tokenAmounts) 
        external 
        nonReentrant 
        whenNotPaused 
        returns (uint256 bundleAmount) 
    {
        require(tokenAmounts.length == underlyingTokens.length, "Invalid amounts");
        
        // Validate and transfer tokens
        for (uint256 i = 0; i < underlyingTokens.length; i++) {
            require(tokenAmounts[i] > 0, "Amount must be > 0");
            
            IERC20(underlyingTokens[i]).safeTransferFrom(
                msg.sender,
                vaultManager,
                tokenAmounts[i]
            );
        }
        
        // Calculate bundle tokens to mint
        bundleAmount = _calculateBundleAmount(tokenAmounts);
        require(bundleAmount > 0, "Invalid bundle amount");
        
        // Mint bundle tokens
        _mint(msg.sender, bundleAmount);
        
        emit Deposited(msg.sender, bundleAmount, tokenAmounts);
        
        return bundleAmount;
    }
    
    /**
     * @dev Withdraw tokens by burning bundle tokens
     * @param bundleAmount Amount of bundle tokens to burn
     * @return tokenAmounts Array of token amounts received
     */
    function withdraw(uint256 bundleAmount) 
        external 
        nonReentrant 
        whenNotPaused 
        returns (uint256[] memory tokenAmounts) 
    {
        require(bundleAmount > 0, "Amount must be > 0");
        require(balanceOf(msg.sender) >= bundleAmount, "Insufficient balance");
        
        // Calculate underlying token amounts
        tokenAmounts = getUnderlyingAmounts(bundleAmount);
        
        // Burn bundle tokens
        _burn(msg.sender, bundleAmount);
        
        // Transfer underlying tokens from vault
        for (uint256 i = 0; i < underlyingTokens.length; i++) {
            // Call vault manager to transfer tokens
            (bool success, ) = vaultManager.call(
                abi.encodeWithSignature(
                    "withdrawFromBundle(address,address,address,uint256)",
                    address(this),
                    underlyingTokens[i],
                    msg.sender,
                    tokenAmounts[i]
                )
            );
            require(success, "Vault transfer failed");
        }
        
        emit Withdrawn(msg.sender, bundleAmount, tokenAmounts);
        
        return tokenAmounts;
    }
    
    /**
     * @dev Calculate underlying token amounts for a given bundle amount
     * @param bundleAmount Amount of bundle tokens
     * @return amounts Array of underlying token amounts
     */
    function getUnderlyingAmounts(uint256 bundleAmount) 
        public 
        view 
        returns (uint256[] memory amounts) 
    {
        amounts = new uint256[](underlyingTokens.length);
        
        if (totalSupply() == 0) {
            return amounts;
        }
        
        for (uint256 i = 0; i < underlyingTokens.length; i++) {
            // Get vault balance for this token
            uint256 vaultBalance = IERC20(underlyingTokens[i]).balanceOf(vaultManager);
            amounts[i] = (vaultBalance * bundleAmount) / totalSupply();
        }
        
        return amounts;
    }
    
    /**
     * @dev Trigger rebalancing to maintain target weights
     * @notice Can be called by anyone if rebalance interval has passed
     */
    function rebalance() external nonReentrant whenNotPaused {
        require(
            block.timestamp >= lastRebalanceTime + rebalanceInterval,
            "Rebalance interval not met"
        );
        
        // Call vault manager to execute rebalance
        (bool success, ) = vaultManager.call(
            abi.encodeWithSignature(
                "rebalanceBundle(address)",
                address(this)
            )
        );
        require(success, "Rebalance failed");
        
        lastRebalanceTime = block.timestamp;
        emit Rebalanced(block.timestamp);
    }
    
    /**
     * @dev Check if rebalancing is needed based on weight deviation
     * @return True if rebalancing is needed
     */
    function needsRebalance() external view returns (bool) {
        if (totalSupply() == 0) return false;
        if (block.timestamp < lastRebalanceTime + rebalanceInterval) return false;
        
        // Check if any weight has deviated beyond threshold
        for (uint256 i = 0; i < underlyingTokens.length; i++) {
            uint256 currentWeight = _getCurrentWeight(i);
            uint256 targetWeight = targetWeights[i];
            
            uint256 deviation = currentWeight > targetWeight 
                ? currentWeight - targetWeight 
                : targetWeight - currentWeight;
            
            if (deviation > MIN_REBALANCE_THRESHOLD) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * @dev Get current weight of a token in the bundle
     * @param tokenIndex Index of the token
     * @return Current weight (in basis points)
     */
    function _getCurrentWeight(uint256 tokenIndex) internal view returns (uint256) {
        // This is a simplified version - actual implementation would use oracle prices
        uint256 totalValue = 0;
        uint256[] memory balances = new uint256[](underlyingTokens.length);
        
        for (uint256 i = 0; i < underlyingTokens.length; i++) {
            balances[i] = IERC20(underlyingTokens[i]).balanceOf(vaultManager);
            totalValue += balances[i]; // Simplified - should use USD values
        }
        
        if (totalValue == 0) return 0;
        
        return (balances[tokenIndex] * WEIGHT_PRECISION) / totalValue;
    }
    
    /**
     * @dev Calculate bundle amount based on deposited tokens
     * @param tokenAmounts Array of token amounts
     * @return Bundle token amount to mint
     */
    function _calculateBundleAmount(uint256[] calldata tokenAmounts) 
        internal 
        view 
        returns (uint256) 
    {
        if (totalSupply() == 0) {
            // First deposit - use sum of amounts (simplified)
            uint256 sum = 0;
            for (uint256 i = 0; i < tokenAmounts.length; i++) {
                sum += tokenAmounts[i];
            }
            return sum;
        }
        
        // Subsequent deposits - proportional to existing supply
        uint256 minRatio = type(uint256).max;
        
        for (uint256 i = 0; i < underlyingTokens.length; i++) {
            uint256 vaultBalance = IERC20(underlyingTokens[i]).balanceOf(vaultManager);
            if (vaultBalance > 0) {
                uint256 ratio = (tokenAmounts[i] * totalSupply()) / vaultBalance;
                if (ratio < minRatio) {
                    minRatio = ratio;
                }
            }
        }
        
        return minRatio;
    }
    
    /**
     * @dev Pause the contract (only owner)
     */
    function pause() external onlyOwner {
        isPaused = true;
        emit Paused();
    }
    
    /**
     * @dev Unpause the contract (only owner)
     */
    function unpause() external onlyOwner {
        isPaused = false;
        emit Unpaused();
    }
    
    /**
     * @dev Modifier to check if contract is not paused
     */
    modifier whenNotPaused() {
        require(!isPaused, "Contract is paused");
        _;
    }
    
    /**
     * @dev Get bundle configuration
     * @return tokens Array of underlying token addresses
     * @return weights Array of target weights
     */
    function getBundleConfig() 
        external 
        view 
        returns (address[] memory tokens, uint256[] memory weights) 
    {
        return (underlyingTokens, targetWeights);
    }
}
