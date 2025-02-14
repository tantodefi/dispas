// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.12;

// importing the LSP0 standard from npm package
import "@lukso/lsp-smart-contracts/contracts/LSP0ERC725Account/LSP0ERC725Account.sol";

contract LSP0ERC725AccountProxy is LSP0ERC725Account {
    constructor(address initialOwner) LSP0ERC725Account(initialOwner) {}
} 