// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title WrappedMNT
 * @dev Simple wrapped MNT token for testing scheduled payments
 */
contract WrappedMNT is ERC20 {
    event Deposit(address indexed dst, uint256 wad);
    event Withdrawal(address indexed src, uint256 wad);

    constructor() ERC20("Wrapped MNT", "WMNT") {}

    /**
     * @dev Deposit MNT and get WMNT
     */
    function deposit() public payable {
        _mint(msg.sender, msg.value);
        emit Deposit(msg.sender, msg.value);
    }

    /**
     * @dev Withdraw MNT by burning WMNT
     */
    function withdraw(uint256 amount) public {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        _burn(msg.sender, amount);
        payable(msg.sender).transfer(amount);
        emit Withdrawal(msg.sender, amount);
    }

    /**
     * @dev Allow deposits via receive
     */
    receive() external payable {
        deposit();
    }

    /**
     * @dev Mint tokens for testing (remove in production)
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
