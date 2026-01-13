// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title VaultManager
 * @dev Manages underlying assets for all bundle tokens
 * @notice Holds tokens, handles deposits/withdrawals, and executes rebalancing
 */
contract VaultManager is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // Bundle registry
    mapping(address => bool) public isRegisteredBundle;
    mapping(address => address[]) public bundleTokens;
    address[] public allBundles;
    
    // Bundle factory (allowed to call certain functions)
    address public bundleFactory;
    
    // Swap router for rebalancing
    address public swapRouter;
    
    // Events
    event BundleRegistered(address indexed bundle, address[] tokens);
    event Deposited(address indexed bundle, address indexed token, uint256 amount);
    event Withdrawn(address indexed bundle, address indexed token, address indexed to, uint256 amount);
    event Rebalanced(address indexed bundle);
    event SwapRouterUpdated(address indexed newRouter);
    
    /**
     * @dev Constructor
     * @param _swapRouter Address of the swap router contract
     */
    constructor(address _swapRouter) Ownable(msg.sender) {
        require(_swapRouter != address(0), "Invalid swap router");
        swapRouter = _swapRouter;
    }
    
    /**
     * @dev Set bundle factory address (only owner)
     * @param _bundleFactory Address of bundle factory
     */
    function setBundleFactory(address _bundleFactory) external onlyOwner {
        require(_bundleFactory != address(0), "Invalid factory address");
        bundleFactory = _bundleFactory;
    }
    
    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {
        // Accept ETH deposits
    }
    
    /**
     * @dev Register a new bundle (called by BundleFactory)
     * @param bundle Address of the bundle token
     * @param tokens Array of underlying token addresses
     */
    function registerBundle(address bundle, address[] calldata tokens) external {
        require(!isRegisteredBundle[bundle], "Bundle already registered");
        require(bundle != address(0), "Invalid bundle address");
        require(tokens.length > 0, "No tokens provided");
        
        isRegisteredBundle[bundle] = true;
        bundleTokens[bundle] = tokens;
        allBundles.push(bundle);
        
        emit BundleRegistered(bundle, tokens);
    }
    
    /**
     * @dev Deposit tokens to a bundle's vault
     * @param bundle Address of the bundle
     * @param token Address of the token
     * @param amount Amount to deposit
     */
    function depositToBundle(
        address bundle,
        address token,
        uint256 amount
    ) external nonReentrant {
        require(isRegisteredBundle[bundle], "Bundle not registered");
        require(_isBundleToken(bundle, token), "Token not in bundle");
        require(amount > 0, "Amount must be > 0");
        
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        emit Deposited(bundle, token, amount);
    }
    
    /**
     * @dev Withdraw tokens from a bundle's vault
     * @param bundle Address of the bundle
     * @param token Address of the token
     * @param to Recipient address
     * @param amount Amount to withdraw
     */
    function withdrawFromBundle(
        address bundle,
        address token,
        address to,
        uint256 amount
    ) external nonReentrant {
        require(msg.sender == bundle, "Only bundle can withdraw");
        require(isRegisteredBundle[bundle], "Bundle not registered");
        require(_isBundleToken(bundle, token), "Token not in bundle");
        require(amount > 0, "Amount must be > 0");
        
        IERC20(token).safeTransfer(to, amount);
        
        emit Withdrawn(bundle, token, to, amount);
    }
    
    /**
     * @dev Rebalance a bundle to maintain target weights
     * @param bundle Address of the bundle to rebalance
     */
    function rebalanceBundle(address bundle) external nonReentrant {
        require(isRegisteredBundle[bundle], "Bundle not registered");
        
        // Get bundle configuration
        (address[] memory tokens, uint256[] memory targetWeights) = _getBundleConfig(bundle);
        
        // Calculate current balances and target amounts
        uint256[] memory currentBalances = new uint256[](tokens.length);
        uint256 totalValue = 0;
        
        for (uint256 i = 0; i < tokens.length; i++) {
            currentBalances[i] = IERC20(tokens[i]).balanceOf(address(this));
            totalValue += currentBalances[i]; // Simplified - should use USD values
        }
        
        // Execute swaps to reach target weights
        for (uint256 i = 0; i < tokens.length; i++) {
            uint256 targetAmount = (totalValue * targetWeights[i]) / 10000;
            
            if (currentBalances[i] < targetAmount) {
                // Need to buy this token
                uint256 amountNeeded = targetAmount - currentBalances[i];
                _buyToken(tokens[i], amountNeeded, tokens, currentBalances, i);
            }
        }
        
        emit Rebalanced(bundle);
    }
    
    /**
     * @dev Buy tokens through swap router
     * @param tokenToBuy Token to purchase
     * @param amount Amount to purchase
     * @param allTokens All tokens in bundle
     * @param balances Current balances
     * @param skipIndex Index to skip (token being bought)
     */
    function _buyToken(
        address tokenToBuy,
        uint256 amount,
        address[] memory allTokens,
        uint256[] memory balances,
        uint256 skipIndex
    ) internal {
        // Find token with excess balance to sell
        for (uint256 i = 0; i < allTokens.length; i++) {
            if (i == skipIndex) continue;
            
            // Simplified - would use swap router in production
            // This is a placeholder for the actual swap logic
            if (balances[i] > 0) {
                // Execute swap via router
                // swapRouter.swap(allTokens[i], tokenToBuy, amountToSell, minAmountOut);
                break;
            }
        }
    }
    
    /**
     * @dev Get bundle configuration from bundle contract
     * @param bundle Address of the bundle
     * @return tokens Array of token addresses
     * @return weights Array of target weights
     */
    function _getBundleConfig(address bundle) 
        internal 
        view 
        returns (address[] memory tokens, uint256[] memory weights) 
    {
        (bool success, bytes memory data) = bundle.staticcall(
            abi.encodeWithSignature("getBundleConfig()")
        );
        require(success, "Failed to get bundle config");
        
        (tokens, weights) = abi.decode(data, (address[], uint256[]));
    }
    
    /**
     * @dev Check if token is part of bundle
     * @param bundle Address of the bundle
     * @param token Address of the token
     * @return True if token is in bundle
     */
    function _isBundleToken(address bundle, address token) internal view returns (bool) {
        address[] memory tokens = bundleTokens[bundle];
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] == token) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * @dev Get vault balance for a bundle and token
     * @param bundle Address of the bundle
     * @param token Address of the token
     * @return Balance in vault
     */
    function getVaultBalance(address bundle, address token) 
        external 
        view 
        returns (uint256) 
    {
        require(isRegisteredBundle[bundle], "Bundle not registered");
        require(_isBundleToken(bundle, token), "Token not in bundle");
        
        return IERC20(token).balanceOf(address(this));
    }
    
    /**
     * @dev Get all bundles
     * @return Array of bundle addresses
     */
    function getAllBundles() external view returns (address[] memory) {
        return allBundles;
    }
    
    /**
     * @dev Update swap router (only owner)
     * @param newRouter Address of new swap router
     */
    function setSwapRouter(address newRouter) external onlyOwner {
        require(newRouter != address(0), "Invalid address");
        swapRouter = newRouter;
        emit SwapRouterUpdated(newRouter);
    }
    
    /**
     * @dev Emergency withdraw (only owner)
     * @param token Token to withdraw
     * @param to Recipient address
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner {
        require(to != address(0), "Invalid recipient");
        IERC20(token).safeTransfer(to, amount);
    }
    
    /**
     * @dev Withdraw ETH to user (called by BundleFactory)
     * @param to Recipient address
     * @param amount Amount to withdraw
     */
    function withdrawToUser(address to, uint256 amount) external nonReentrant {
        require(msg.sender == bundleFactory, "Only factory can call");
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be > 0");
        require(address(this).balance >= amount, "Insufficient balance");
        
        (bool success, ) = to.call{value: amount}("");
        require(success, "ETH transfer failed");
    }
    
    /**
     * @dev Get ETH balance in vault
     * @return Balance in wei
     */
    function getETHBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
