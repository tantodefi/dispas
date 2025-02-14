// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface IERC5564Announcer {
    /**
     * @dev Emitted when a stealth transfer is announced
     * @param schemeId The ID of the stealth address scheme (1 for secp256k1)
     * @param stealthAddress The stealth address where funds were sent
     * @param caller The address that called the announce function
     * @param ephemeralPubKey The ephemeral public key used to generate the stealth address
     * @param metadata Additional metadata about the transfer
     */
    event Announcement(
        uint256 indexed schemeId,
        address indexed stealthAddress,
        address indexed caller,
        bytes ephemeralPubKey,
        bytes metadata
    );

    /**
     * @dev Announces a stealth transfer
     * @param schemeId The ID of the stealth address scheme
     * @param stealthAddress The stealth address where funds were sent
     * @param ephemeralPubKey The ephemeral public key used to generate the stealth address
     * @param metadata Additional metadata about the transfer
     */
    function announce(
        uint256 schemeId,
        address stealthAddress,
        bytes memory ephemeralPubKey,
        bytes memory metadata
    ) external;
} 