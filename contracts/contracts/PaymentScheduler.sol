// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PaymentScheduler
 * @dev Manages scheduled and recurring cryptocurrency payments
 * @notice Supports one-time, recurring, and DCA payment schedules
 */
contract PaymentScheduler is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    enum ScheduleType {
        ONE_TIME,
        RECURRING,
        DCA
    }
    
    enum ScheduleStatus {
        ACTIVE,
        PAUSED,
        CANCELLED,
        COMPLETED
    }
    
    struct Schedule {
        uint256 id;
        address creator;
        ScheduleType scheduleType;
        ScheduleStatus status;
        address token;
        address recipient;
        uint256 amount;
        uint256 interval;
        uint256 startTime;
        uint256 endTime;
        uint256 lastExecuted;
        uint256 executionCount;
        uint256 maxExecutions;
    }
    
    // State
    uint256 private scheduleIdCounter;
    mapping(uint256 => Schedule) public schedules;
    mapping(address => uint256[]) public userSchedules;
    uint256[] public allScheduleIds;
    
    // Keeper management
    mapping(address => bool) public isKeeper;
    
    // Events
    event ScheduleCreated(
        uint256 indexed scheduleId,
        address indexed creator,
        ScheduleType scheduleType,
        address token,
        address recipient,
        uint256 amount
    );
    event ScheduleExecuted(uint256 indexed scheduleId, uint256 timestamp, uint256 amount);
    event SchedulePaused(uint256 indexed scheduleId);
    event ScheduleResumed(uint256 indexed scheduleId);
    event ScheduleCancelled(uint256 indexed scheduleId);
    event ScheduleCompleted(uint256 indexed scheduleId);
    event KeeperAdded(address indexed keeper);
    event KeeperRemoved(address indexed keeper);
    
    /**
     * @dev Constructor
     */
    constructor() Ownable(msg.sender) {
        isKeeper[msg.sender] = true;
    }
    
    /**
     * @dev Create a new payment schedule
     * @param scheduleType Type of schedule (ONE_TIME, RECURRING, DCA)
     * @param token Token address to send
     * @param recipient Recipient address
     * @param amount Amount per payment
     * @param interval Time between payments (0 for one-time)
     * @param startTime When to start (0 for immediate)
     * @param maxExecutions Maximum number of executions (0 for unlimited)
     * @return scheduleId ID of created schedule
     */
    function createSchedule(
        ScheduleType scheduleType,
        address token,
        address recipient,
        uint256 amount,
        uint256 interval,
        uint256 startTime,
        uint256 maxExecutions
    ) external nonReentrant returns (uint256 scheduleId) {
        require(token != address(0), "Invalid token");
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be > 0");
        
        if (scheduleType == ScheduleType.ONE_TIME) {
            require(interval == 0, "One-time schedule should have 0 interval");
            require(maxExecutions == 0 || maxExecutions == 1, "Invalid max executions");
        } else {
            require(interval > 0, "Recurring schedule needs interval");
        }
        
        if (startTime == 0) {
            startTime = block.timestamp;
        } else {
            require(startTime >= block.timestamp, "Start time in past");
        }
        
        scheduleId = scheduleIdCounter++;
        
        schedules[scheduleId] = Schedule({
            id: scheduleId,
            creator: msg.sender,
            scheduleType: scheduleType,
            status: ScheduleStatus.ACTIVE,
            token: token,
            recipient: recipient,
            amount: amount,
            interval: interval,
            startTime: startTime,
            endTime: 0,
            lastExecuted: 0,
            executionCount: 0,
            maxExecutions: maxExecutions
        });
        
        userSchedules[msg.sender].push(scheduleId);
        allScheduleIds.push(scheduleId);
        
        emit ScheduleCreated(
            scheduleId,
            msg.sender,
            scheduleType,
            token,
            recipient,
            amount
        );
        
        return scheduleId;
    }
    
    /**
     * @dev Execute a scheduled payment (called by keeper)
     * @param scheduleId ID of schedule to execute
     */
    function executeSchedule(uint256 scheduleId) external nonReentrant {
        require(isKeeper[msg.sender], "Only keeper can execute");
        
        Schedule storage schedule = schedules[scheduleId];
        require(schedule.status == ScheduleStatus.ACTIVE, "Schedule not active");
        require(block.timestamp >= schedule.startTime, "Not started yet");
        
        // Check if enough time has passed since last execution
        if (schedule.lastExecuted > 0) {
            require(
                block.timestamp >= schedule.lastExecuted + schedule.interval,
                "Interval not met"
            );
        }
        
        // Check max executions
        if (schedule.maxExecutions > 0) {
            require(
                schedule.executionCount < schedule.maxExecutions,
                "Max executions reached"
            );
        }
        
        // Execute payment
        IERC20(schedule.token).safeTransferFrom(
            schedule.creator,
            schedule.recipient,
            schedule.amount
        );
        
        schedule.lastExecuted = block.timestamp;
        schedule.executionCount++;
        
        emit ScheduleExecuted(scheduleId, block.timestamp, schedule.amount);
        
        // Check if schedule should be completed
        if (schedule.scheduleType == ScheduleType.ONE_TIME) {
            schedule.status = ScheduleStatus.COMPLETED;
            schedule.endTime = block.timestamp;
            emit ScheduleCompleted(scheduleId);
        } else if (
            schedule.maxExecutions > 0 && 
            schedule.executionCount >= schedule.maxExecutions
        ) {
            schedule.status = ScheduleStatus.COMPLETED;
            schedule.endTime = block.timestamp;
            emit ScheduleCompleted(scheduleId);
        }
    }
    
    /**
     * @dev Pause a schedule
     * @param scheduleId ID of schedule to pause
     */
    function pauseSchedule(uint256 scheduleId) external {
        Schedule storage schedule = schedules[scheduleId];
        require(schedule.creator == msg.sender, "Not schedule creator");
        require(schedule.status == ScheduleStatus.ACTIVE, "Schedule not active");
        
        schedule.status = ScheduleStatus.PAUSED;
        emit SchedulePaused(scheduleId);
    }
    
    /**
     * @dev Resume a paused schedule
     * @param scheduleId ID of schedule to resume
     */
    function resumeSchedule(uint256 scheduleId) external {
        Schedule storage schedule = schedules[scheduleId];
        require(schedule.creator == msg.sender, "Not schedule creator");
        require(schedule.status == ScheduleStatus.PAUSED, "Schedule not paused");
        
        schedule.status = ScheduleStatus.ACTIVE;
        emit ScheduleResumed(scheduleId);
    }
    
    /**
     * @dev Cancel a schedule
     * @param scheduleId ID of schedule to cancel
     */
    function cancelSchedule(uint256 scheduleId) external {
        Schedule storage schedule = schedules[scheduleId];
        require(schedule.creator == msg.sender, "Not schedule creator");
        require(
            schedule.status == ScheduleStatus.ACTIVE || 
            schedule.status == ScheduleStatus.PAUSED,
            "Schedule already ended"
        );
        
        schedule.status = ScheduleStatus.CANCELLED;
        schedule.endTime = block.timestamp;
        emit ScheduleCancelled(scheduleId);
    }
    
    /**
     * @dev Check if a schedule is ready for execution
     * @param scheduleId ID of schedule to check
     * @return True if ready for execution
     */
    function isScheduleReady(uint256 scheduleId) external view returns (bool) {
        Schedule memory schedule = schedules[scheduleId];
        
        if (schedule.status != ScheduleStatus.ACTIVE) return false;
        if (block.timestamp < schedule.startTime) return false;
        
        if (schedule.lastExecuted > 0) {
            if (block.timestamp < schedule.lastExecuted + schedule.interval) {
                return false;
            }
        }
        
        if (schedule.maxExecutions > 0) {
            if (schedule.executionCount >= schedule.maxExecutions) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * @dev Get all schedules for a user
     * @param user Address of user
     * @return Array of schedule IDs
     */
    function getUserSchedules(address user) external view returns (uint256[] memory) {
        return userSchedules[user];
    }
    
    /**
     * @dev Get schedule details
     * @param scheduleId ID of schedule
     * @return Schedule struct
     */
    function getSchedule(uint256 scheduleId) external view returns (Schedule memory) {
        return schedules[scheduleId];
    }
    
    /**
     * @dev Get all active schedules
     * @return Array of schedule IDs
     */
    function getActiveSchedules() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        
        for (uint256 i = 0; i < allScheduleIds.length; i++) {
            if (schedules[allScheduleIds[i]].status == ScheduleStatus.ACTIVE) {
                activeCount++;
            }
        }
        
        uint256[] memory activeSchedules = new uint256[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allScheduleIds.length; i++) {
            if (schedules[allScheduleIds[i]].status == ScheduleStatus.ACTIVE) {
                activeSchedules[index] = allScheduleIds[i];
                index++;
            }
        }
        
        return activeSchedules;
    }
    
    /**
     * @dev Add a keeper (only owner)
     * @param keeper Address to add as keeper
     */
    function addKeeper(address keeper) external onlyOwner {
        require(keeper != address(0), "Invalid address");
        isKeeper[keeper] = true;
        emit KeeperAdded(keeper);
    }
    
    /**
     * @dev Remove a keeper (only owner)
     * @param keeper Address to remove as keeper
     */
    function removeKeeper(address keeper) external onlyOwner {
        isKeeper[keeper] = false;
        emit KeeperRemoved(keeper);
    }
}
