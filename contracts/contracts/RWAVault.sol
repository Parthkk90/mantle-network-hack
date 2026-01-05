// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title RWAVault
 * @dev Custodian contract for holding and managing RWA-backed assets
 * @notice Implements secure custody with multi-sig and time-locked withdrawals
 */
contract RWAVault is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    
    bytes32 public constant CUSTODIAN_ROLE = keccak256("CUSTODIAN_ROLE");
    bytes32 public constant ASSET_MANAGER_ROLE = keccak256("ASSET_MANAGER_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    
    // Asset custody information
    struct CustodyAsset {
        address tokenAddress;
        uint256 totalAmount;
        uint256 lockedAmount;
        uint256 availableAmount;
        bool isActive;
        string assetIdentifier;
        uint256 lastAuditDate;
    }
    
    // Withdrawal request (for time-locked security)
    struct WithdrawalRequest {
        address token;
        address recipient;
        uint256 amount;
        uint256 requestTime;
        uint256 executionTime;
        bool isExecuted;
        bool isCancelled;
        string reason;
        uint256 approvalCount;
    }
    
    // Storage
    mapping(address => CustodyAsset) public custodyAssets;
    address[] public assetList;
    
    mapping(uint256 => WithdrawalRequest) public withdrawalRequests;
    mapping(uint256 => mapping(address => bool)) public hasApproved;
    uint256 public withdrawalRequestCount;
    
    uint256 public constant TIMELOCK_PERIOD = 2 days;
    uint256 public constant REQUIRED_APPROVALS = 2;
    
    // Yield collection
    mapping(address => uint256) public totalYieldCollected;
    
    // Events
    event AssetDeposited(address indexed token, uint256 amount, string assetIdentifier);
    event AssetWithdrawn(address indexed token, address indexed recipient, uint256 amount);
    event WithdrawalRequested(uint256 indexed requestId, address indexed token, uint256 amount);
    event WithdrawalApproved(uint256 indexed requestId, address indexed approver);
    event WithdrawalExecuted(uint256 indexed requestId);
    event WithdrawalCancelled(uint256 indexed requestId);
    event AssetLocked(address indexed token, uint256 amount);
    event AssetUnlocked(address indexed token, uint256 amount);
    event YieldCollected(address indexed token, uint256 amount);
    event AssetAudited(address indexed token, uint256 timestamp);
    
    /**
     * @dev Constructor
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(CUSTODIAN_ROLE, msg.sender);
        _grantRole(ASSET_MANAGER_ROLE, msg.sender);
        _grantRole(AUDITOR_ROLE, msg.sender);
    }
    
    /**
     * @dev Deposit assets into custody
     * @param token Token address
     * @param amount Amount to deposit
     * @param assetIdentifier Unique identifier for the asset
     */
    function depositAsset(
        address token,
        uint256 amount,
        string memory assetIdentifier
    ) external onlyRole(CUSTODIAN_ROLE) nonReentrant {
        require(token != address(0), "Invalid token");
        require(amount > 0, "Invalid amount");
        
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        if (!custodyAssets[token].isActive) {
            custodyAssets[token] = CustodyAsset({
                tokenAddress: token,
                totalAmount: amount,
                lockedAmount: 0,
                availableAmount: amount,
                isActive: true,
                assetIdentifier: assetIdentifier,
                lastAuditDate: block.timestamp
            });
            assetList.push(token);
        } else {
            custodyAssets[token].totalAmount += amount;
            custodyAssets[token].availableAmount += amount;
        }
        
        emit AssetDeposited(token, amount, assetIdentifier);
    }
    
    /**
     * @dev Request withdrawal (time-locked for security)
     * @param token Token to withdraw
     * @param recipient Recipient address
     * @param amount Amount to withdraw
     * @param reason Reason for withdrawal
     */
    function requestWithdrawal(
        address token,
        address recipient,
        uint256 amount,
        string memory reason
    ) external onlyRole(ASSET_MANAGER_ROLE) returns (uint256) {
        require(custodyAssets[token].isActive, "Asset not in custody");
        require(custodyAssets[token].availableAmount >= amount, "Insufficient available balance");
        require(recipient != address(0), "Invalid recipient");
        
        uint256 requestId = withdrawalRequestCount++;
        
        withdrawalRequests[requestId] = WithdrawalRequest({
            token: token,
            recipient: recipient,
            amount: amount,
            requestTime: block.timestamp,
            executionTime: block.timestamp + TIMELOCK_PERIOD,
            isExecuted: false,
            isCancelled: false,
            reason: reason,
            approvalCount: 0
        });
        
        // Lock the amount
        custodyAssets[token].availableAmount -= amount;
        custodyAssets[token].lockedAmount += amount;
        
        emit WithdrawalRequested(requestId, token, amount);
        emit AssetLocked(token, amount);
        
        return requestId;
    }
    
    /**
     * @dev Approve withdrawal request
     * @param requestId Withdrawal request ID
     */
    function approveWithdrawal(uint256 requestId) 
        external 
        onlyRole(CUSTODIAN_ROLE) 
    {
        WithdrawalRequest storage request = withdrawalRequests[requestId];
        
        require(!request.isExecuted, "Already executed");
        require(!request.isCancelled, "Request cancelled");
        require(!hasApproved[requestId][msg.sender], "Already approved");
        
        hasApproved[requestId][msg.sender] = true;
        request.approvalCount++;
        
        emit WithdrawalApproved(requestId, msg.sender);
    }
    
    /**
     * @dev Execute withdrawal after timelock
     * @param requestId Withdrawal request ID
     */
    function executeWithdrawal(uint256 requestId) 
        external 
        onlyRole(CUSTODIAN_ROLE) 
        nonReentrant 
    {
        WithdrawalRequest storage request = withdrawalRequests[requestId];
        
        require(!request.isExecuted, "Already executed");
        require(!request.isCancelled, "Request cancelled");
        require(block.timestamp >= request.executionTime, "Timelock not expired");
        require(request.approvalCount >= REQUIRED_APPROVALS, "Insufficient approvals");
        
        request.isExecuted = true;
        
        CustodyAsset storage asset = custodyAssets[request.token];
        asset.lockedAmount -= request.amount;
        asset.totalAmount -= request.amount;
        
        IERC20(request.token).safeTransfer(request.recipient, request.amount);
        
        emit AssetUnlocked(request.token, request.amount);
        emit WithdrawalExecuted(requestId);
        emit AssetWithdrawn(request.token, request.recipient, request.amount);
    }
    
    /**
     * @dev Cancel withdrawal request
     * @param requestId Withdrawal request ID
     */
    function cancelWithdrawal(uint256 requestId) 
        external 
        onlyRole(ASSET_MANAGER_ROLE) 
    {
        WithdrawalRequest storage request = withdrawalRequests[requestId];
        
        require(!request.isExecuted, "Already executed");
        require(!request.isCancelled, "Already cancelled");
        
        request.isCancelled = true;
        
        // Unlock the amount
        CustodyAsset storage asset = custodyAssets[request.token];
        asset.lockedAmount -= request.amount;
        asset.availableAmount += request.amount;
        
        emit AssetUnlocked(request.token, request.amount);
        emit WithdrawalCancelled(requestId);
    }
    
    /**
     * @dev Collect yield from RWA (rental income, bond coupons, etc.)
     * @param token Token address
     * @param amount Yield amount
     */
    function collectYield(address token, uint256 amount) 
        external 
        onlyRole(ASSET_MANAGER_ROLE) 
        nonReentrant 
    {
        require(custodyAssets[token].isActive, "Asset not in custody");
        
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        custodyAssets[token].totalAmount += amount;
        custodyAssets[token].availableAmount += amount;
        totalYieldCollected[token] += amount;
        
        emit YieldCollected(token, amount);
    }
    
    /**
     * @dev Audit asset holdings
     * @param token Token to audit
     */
    function auditAsset(address token) 
        external 
        onlyRole(AUDITOR_ROLE) 
    {
        require(custodyAssets[token].isActive, "Asset not in custody");
        
        uint256 actualBalance = IERC20(token).balanceOf(address(this));
        uint256 recordedBalance = custodyAssets[token].totalAmount;
        
        require(actualBalance >= recordedBalance, "Balance mismatch detected");
        
        custodyAssets[token].lastAuditDate = block.timestamp;
        
        emit AssetAudited(token, block.timestamp);
    }
    
    /**
     * @dev Get custody asset details
     * @param token Token address
     */
    function getCustodyAsset(address token) 
        external 
        view 
        returns (
            uint256 totalAmount,
            uint256 lockedAmount,
            uint256 availableAmount,
            string memory assetIdentifier,
            uint256 lastAuditDate
        ) 
    {
        CustodyAsset memory asset = custodyAssets[token];
        return (
            asset.totalAmount,
            asset.lockedAmount,
            asset.availableAmount,
            asset.assetIdentifier,
            asset.lastAuditDate
        );
    }
    
    /**
     * @dev Get total assets under custody
     */
    function getTotalAssetCount() external view returns (uint256) {
        return assetList.length;
    }
    
    /**
     * @dev Emergency withdrawal (requires admin role)
     * @param token Token to withdraw
     * @param recipient Recipient address
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(
        address token,
        address recipient,
        uint256 amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        IERC20(token).safeTransfer(recipient, amount);
        emit AssetWithdrawn(token, recipient, amount);
    }
    
    /**
     * @dev Pause vault operations
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause vault operations
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
