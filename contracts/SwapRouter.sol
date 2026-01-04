// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SwapRouter
 * @dev Aggregates liquidity from multiple DEXs on Mantle Network
 * @notice Finds best swap prices across Agni Finance, Merchant Moe, FusionX, etc.
 */
contract SwapRouter is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    struct SwapRoute {
        address dex;
        address[] path;
        uint256 expectedOutput;
    }
    
    // Registered DEX routers
    mapping(address => bool) public isRegisteredDEX;
    address[] public dexList;
    
    // Fee configuration
    uint256 public swapFee = 30; // 0.3% in basis points
    uint256 public constant FEE_DENOMINATOR = 10000;
    address public feeRecipient;
    
    // Events
    event SwapExecuted(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        address dex
    );
    event DEXAdded(address indexed dex);
    event DEXRemoved(address indexed dex);
    event FeeUpdated(uint256 newFee);
    
    /**
     * @dev Constructor
     */
    constructor() Ownable(msg.sender) {
        feeRecipient = msg.sender;
    }
    
    /**
     * @dev Execute a token swap
     * @param tokenIn Input token address
     * @param tokenOut Output token address
     * @param amountIn Amount of input tokens
     * @param minAmountOut Minimum acceptable output amount (slippage protection)
     * @param deadline Transaction deadline
     * @return amountOut Actual amount of output tokens received
     */
    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        uint256 deadline
    ) external nonReentrant returns (uint256 amountOut) {
        require(tokenIn != address(0) && tokenOut != address(0), "Invalid tokens");
        require(amountIn > 0, "Amount must be > 0");
        require(deadline >= block.timestamp, "Transaction expired");
        
        // Transfer input tokens from user
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        
        // Calculate fee
        uint256 feeAmount = (amountIn * swapFee) / FEE_DENOMINATOR;
        uint256 amountAfterFee = amountIn - feeAmount;
        
        // Get best route
        SwapRoute memory bestRoute = getBestRoute(tokenIn, tokenOut, amountAfterFee);
        require(bestRoute.expectedOutput >= minAmountOut, "Slippage too high");
        
        // Execute swap on best DEX
        amountOut = _executeSwap(
            bestRoute.dex,
            tokenIn,
            tokenOut,
            amountAfterFee,
            minAmountOut
        );
        
        // Transfer fee
        if (feeAmount > 0) {
            IERC20(tokenIn).safeTransfer(feeRecipient, feeAmount);
        }
        
        // Transfer output tokens to user
        IERC20(tokenOut).safeTransfer(msg.sender, amountOut);
        
        emit SwapExecuted(msg.sender, tokenIn, tokenOut, amountIn, amountOut, bestRoute.dex);
        
        return amountOut;
    }
    
    /**
     * @dev Get best swap route across all DEXs
     * @param tokenIn Input token
     * @param tokenOut Output token
     * @param amountIn Input amount
     * @return Best swap route
     */
    function getBestRoute(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) public view returns (SwapRoute memory) {
        require(dexList.length > 0, "No DEXs registered");
        
        SwapRoute memory bestRoute;
        uint256 bestOutput = 0;
        
        // Query each DEX for expected output
        for (uint256 i = 0; i < dexList.length; i++) {
            uint256 expectedOutput = _getExpectedOutput(
                dexList[i],
                tokenIn,
                tokenOut,
                amountIn
            );
            
            if (expectedOutput > bestOutput) {
                bestOutput = expectedOutput;
                bestRoute.dex = dexList[i];
                bestRoute.path = _getPath(tokenIn, tokenOut);
                bestRoute.expectedOutput = expectedOutput;
            }
        }
        
        require(bestOutput > 0, "No valid route found");
        return bestRoute;
    }
    
    /**
     * @dev Get quote for a swap
     * @param tokenIn Input token
     * @param tokenOut Output token
     * @param amountIn Input amount
     * @return expectedOutput Expected output amount (before fees)
     * @return dex Best DEX for this swap
     */
    function getQuote(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint256 expectedOutput, address dex) {
        uint256 amountAfterFee = amountIn - (amountIn * swapFee / FEE_DENOMINATOR);
        SwapRoute memory route = getBestRoute(tokenIn, tokenOut, amountAfterFee);
        return (route.expectedOutput, route.dex);
    }
    
    /**
     * @dev Execute swap on specific DEX
     * @param dex DEX router address
     * @param tokenIn Input token
     * @param tokenOut Output token
     * @param amountIn Input amount
     * @param minAmountOut Minimum output amount
     * @return amountOut Actual output amount
     */
    function _executeSwap(
        address dex,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) internal returns (uint256 amountOut) {
        require(isRegisteredDEX[dex], "DEX not registered");
        
        // Approve DEX to spend tokens
        IERC20(tokenIn).approve(dex, amountIn);
        
        // Build path
        address[] memory path = _getPath(tokenIn, tokenOut);
        
        // Call DEX swap function (Uniswap V2 compatible)
        // This is a simplified version - actual implementation would handle different DEX interfaces
        bytes memory data = abi.encodeWithSignature(
            "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
            amountIn,
            minAmountOut,
            path,
            address(this),
            block.timestamp
        );
        
        (bool success, bytes memory returnData) = dex.call(data);
        require(success, "DEX swap failed");
        
        // Decode output amount (last element in amounts array)
        uint256[] memory amounts = abi.decode(returnData, (uint256[]));
        amountOut = amounts[amounts.length - 1];
        
        return amountOut;
    }
    
    /**
     * @dev Get expected output from a DEX
     * @param dex DEX router address
     * @param tokenIn Input token
     * @param tokenOut Output token
     * @param amountIn Input amount
     * @return expectedOutput Expected output amount
     */
    function _getExpectedOutput(
        address dex,
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) internal view returns (uint256 expectedOutput) {
        address[] memory path = _getPath(tokenIn, tokenOut);
        
        // Call getAmountsOut on DEX (Uniswap V2 compatible)
        bytes memory data = abi.encodeWithSignature(
            "getAmountsOut(uint256,address[])",
            amountIn,
            path
        );
        
        (bool success, bytes memory returnData) = dex.staticcall(data);
        if (!success) return 0;
        
        uint256[] memory amounts = abi.decode(returnData, (uint256[]));
        expectedOutput = amounts[amounts.length - 1];
        
        return expectedOutput;
    }
    
    /**
     * @dev Build swap path
     * @param tokenIn Input token
     * @param tokenOut Output token
     * @return path Swap path
     */
    function _getPath(address tokenIn, address tokenOut) 
        internal 
        pure 
        returns (address[] memory path) 
    {
        // Simple direct path - could be enhanced with intermediate tokens (WETH, USDC, etc.)
        path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;
        return path;
    }
    
    /**
     * @dev Add a DEX router (only owner)
     * @param dex DEX router address
     */
    function addDEX(address dex) external onlyOwner {
        require(dex != address(0), "Invalid DEX address");
        require(!isRegisteredDEX[dex], "DEX already registered");
        
        isRegisteredDEX[dex] = true;
        dexList.push(dex);
        
        emit DEXAdded(dex);
    }
    
    /**
     * @dev Remove a DEX router (only owner)
     * @param dex DEX router address
     */
    function removeDEX(address dex) external onlyOwner {
        require(isRegisteredDEX[dex], "DEX not registered");
        
        isRegisteredDEX[dex] = false;
        
        // Remove from array
        for (uint256 i = 0; i < dexList.length; i++) {
            if (dexList[i] == dex) {
                dexList[i] = dexList[dexList.length - 1];
                dexList.pop();
                break;
            }
        }
        
        emit DEXRemoved(dex);
    }
    
    /**
     * @dev Update swap fee (only owner)
     * @param newFee New fee in basis points
     */
    function setSwapFee(uint256 newFee) external onlyOwner {
        require(newFee <= 100, "Fee too high"); // Max 1%
        swapFee = newFee;
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
     * @dev Get all registered DEXs
     * @return Array of DEX addresses
     */
    function getAllDEXs() external view returns (address[] memory) {
        return dexList;
    }
    
    /**
     * @dev Emergency token recovery (only owner)
     * @param token Token to recover
     * @param amount Amount to recover
     */
    function recoverToken(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
}
