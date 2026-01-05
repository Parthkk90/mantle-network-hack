// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title QRCodePayment
 * @dev Helper contract for QR code payment generation and validation
 * @notice Provides utilities for encoding/decoding payment data in QR codes
 */
contract QRCodePayment {
    
    struct QRPaymentData {
        address recipient;
        address token; // address(0) for native MNT
        uint256 amount;
        string note;
        uint256 requestId; // 0 if not a payment request
    }
    
    /**
     * @dev Generate QR code data for receiving payment
     * @param recipient Address to receive payment
     * @param token Token address (address(0) for MNT)
     * @param amount Amount to receive
     * @param note Payment description
     * @return dataHash Hash that can be encoded in QR code
     */
    function generateQRData(
        address recipient,
        address token,
        uint256 amount,
        string memory note
    ) public pure returns (bytes32 dataHash) {
        return keccak256(abi.encodePacked(recipient, token, amount, note));
    }
    
    /**
     * @dev Verify QR code data matches payment parameters
     * @param dataHash QR code hash
     * @param recipient Expected recipient
     * @param token Expected token
     * @param amount Expected amount
     * @param note Expected note
     * @return True if data matches
     */
    function verifyQRData(
        bytes32 dataHash,
        address recipient,
        address token,
        uint256 amount,
        string memory note
    ) public pure returns (bool) {
        bytes32 expectedHash = keccak256(abi.encodePacked(recipient, token, amount, note));
        return dataHash == expectedHash;
    }
    
    /**
     * @dev Generate address-only QR code (for simple receiving)
     * @param recipient Address to receive payment
     * @return addressHash Hash of address for QR code
     */
    function generateAddressQR(address recipient) public pure returns (bytes32 addressHash) {
        return keccak256(abi.encodePacked(recipient));
    }
    
    /**
     * @dev Verify address from QR code
     * @param addressHash QR code hash
     * @param recipient Expected address
     * @return True if address matches
     */
    function verifyAddressQR(
        bytes32 addressHash,
        address recipient
    ) public pure returns (bool) {
        return addressHash == keccak256(abi.encodePacked(recipient));
    }
    
    /**
     * @dev Generate payment request QR data
     * @param requestId Payment request ID
     * @param recipient Recipient address
     * @param token Token address
     * @param amount Amount requested
     * @return requestHash Hash for QR code
     */
    function generateRequestQR(
        uint256 requestId,
        address recipient,
        address token,
        uint256 amount
    ) public pure returns (bytes32 requestHash) {
        return keccak256(abi.encodePacked(
            "PAYMENT_REQUEST",
            requestId,
            recipient,
            token,
            amount
        ));
    }
    
    /**
     * @dev Validate payment request QR code
     * @param requestHash QR code hash
     * @param requestId Expected request ID
     * @param recipient Expected recipient
     * @param token Expected token
     * @param amount Expected amount
     * @return True if valid
     */
    function verifyRequestQR(
        bytes32 requestHash,
        uint256 requestId,
        address recipient,
        address token,
        uint256 amount
    ) public pure returns (bool) {
        bytes32 expectedHash = keccak256(abi.encodePacked(
            "PAYMENT_REQUEST",
            requestId,
            recipient,
            token,
            amount
        ));
        return requestHash == expectedHash;
    }
    
    /**
     * @dev Encode multiple payment recipients in batch QR
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts
     * @param token Token address
     * @return batchHash Hash for batch payment QR code
     */
    function generateBatchQR(
        address[] memory recipients,
        uint256[] memory amounts,
        address token
    ) public pure returns (bytes32 batchHash) {
        require(recipients.length == amounts.length, "Length mismatch");
        return keccak256(abi.encodePacked(recipients, amounts, token));
    }
}
