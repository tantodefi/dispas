// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/utils/Address.sol";
import "../interfaces/IERC5564Announcer.sol";
import "@lukso/lsp-smart-contracts/contracts/LSP0ERC725Account/LSP0ERC725Account.sol";
import "@lukso/lsp-smart-contracts/contracts/LSP6KeyManager/LSP6KeyManager.sol";

contract DispasStealth {
    IERC5564Announcer public immutable STEALTH_ANNOUNCER;
    uint256 public constant SCHEME_ID = 1; // SECP256K1 scheme

    mapping(address => bytes32) private stealthMetadata;
    mapping(address => Announcement[]) private announcements;
    
    event StealthMetadataRegistered(address indexed account, bytes32 metadata);
    event StealthTransfer(
        address indexed from,
        address indexed to,
        address ephemeralAddress,
        uint256 amount
    );

    constructor(address announcer) {
        require(announcer != address(0), "Zero address");
        STEALTH_ANNOUNCER = IERC5564Announcer(announcer);
    }

    function registerStealthMetadata(address account, bytes32 metadata) external {
        // Check if the account is a Universal Profile and if msg.sender is its owner
        LSP0ERC725Account up = LSP0ERC725Account(payable(account));
        require(msg.sender == up.owner(), "Not authorized");
        
        stealthMetadata[account] = metadata;
        emit StealthMetadataRegistered(account, metadata);
    }

    function getStealthMetadata(address account) external view returns (bytes32) {
        return stealthMetadata[account];
    }

    function sendStealthTransfer(
        address from,
        address to,
        address ephemeralAddress
    ) external payable {
        require(msg.value > 0, "Zero amount");
        require(stealthMetadata[to] != bytes32(0), "Recipient has no stealth metadata");
        
        // Check if sender UP has enough balance
        LSP0ERC725Account upFrom = LSP0ERC725Account(payable(from));
        require(address(upFrom).balance >= msg.value, "Insufficient balance");
        
        // Check authorization
        require(msg.sender == upFrom.owner(), "Not authorized");
        
        // Transfer the funds
        (bool success, ) = to.call{value: msg.value}("");
        require(success, "Transfer failed");

        // Announce the transfer
        STEALTH_ANNOUNCER.announce(
            SCHEME_ID,
            ephemeralAddress,
            abi.encodePacked(stealthMetadata[to]),
            abi.encode(msg.value)
        );

        // Store the announcement
        announcements[to].push(Announcement({
            recipient: to,
            ephemeralAddress: ephemeralAddress,
            amount: msg.value
        }));

        emit StealthTransfer(from, to, ephemeralAddress, msg.value);
    }

    function getAnnouncements(address recipient) external view returns (
        Announcement[] memory
    ) {
        return announcements[recipient];
    }

    struct Announcement {
        address recipient;
        address ephemeralAddress;
        uint256 amount;
    }
} 