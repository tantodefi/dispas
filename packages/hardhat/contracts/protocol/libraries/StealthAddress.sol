// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

library StealthAddressLib {
    error InvalidStealthMetaAddress();
    error InvalidSchemeId();

    /**
     * @dev Parse a stealth meta-address into its components
     * @param metaAddress The stealth meta-address in bytes format
     * @return spendingPubKey The spending public key
     * @return viewingPubKey The viewing public key
     */
    function parseStealthMetaAddress(bytes calldata metaAddress) 
        internal 
        pure 
        returns (bytes memory spendingPubKey, bytes memory viewingPubKey) 
    {
        // Validate meta-address format (st:lyx: + 64 bytes spending + 64 bytes viewing)
        if (metaAddress.length < 133) revert InvalidStealthMetaAddress();

        // Extract public keys from meta-address
        // Format: st:lyx:<spending_pub_key>:<viewing_pub_key>
        spendingPubKey = new bytes(64);
        viewingPubKey = new bytes(64);
        
        // Skip "st:lyx:" prefix (7 bytes) and copy keys
        uint256 offset = 7;
        for(uint i = 0; i < 64; i++) {
            spendingPubKey[i] = metaAddress[offset + i];
            viewingPubKey[i] = metaAddress[offset + 64 + i];
        }
    }

    /**
     * @dev Generate a stealth address from public keys
     * @param spendingPubKey The spending public key
     * @param viewingPubKey The viewing public key
     * @return stealthAddress The generated stealth address
     * @return ephemeralPubKey The ephemeral public key
     * @return viewTag The view tag
     */
    function generateStealthAddress(
        bytes memory spendingPubKey, 
        bytes memory viewingPubKey
    ) 
        internal 
        view 
        returns (
            address stealthAddress,
            bytes memory ephemeralPubKey,
            bytes1 viewTag
        ) 
    {
        // Generate ephemeral key pair using block data for randomness
        bytes32 ephemeralPrivKey = keccak256(
            abi.encodePacked(
                block.timestamp, 
                block.prevrandao, 
                msg.sender,
                spendingPubKey,
                viewingPubKey
            )
        );

        // Generate ephemeral public key (in production this would use proper ECC)
        ephemeralPubKey = abi.encodePacked(
            keccak256(abi.encodePacked("ephemeral", ephemeralPrivKey))
        );

        // Generate shared secret using ECDH simulation
        bytes32 sharedSecret = keccak256(
            abi.encodePacked(
                ephemeralPrivKey,
                viewingPubKey
            )
        );

        // Generate stealth address
        stealthAddress = address(
            uint160(
                uint256(
                    keccak256(
                        abi.encodePacked(
                            sharedSecret,
                            spendingPubKey
                        )
                    )
                )
            )
        );

        // Generate view tag (first byte of shared secret)
        viewTag = bytes1(uint8(uint256(sharedSecret) & 0xFF));
    }

    /**
     * @dev Compute a shared secret between two parties
     * @param privateKey The private key
     * @param publicKey The public key
     * @return The shared secret
     */
    function computeSharedSecret(
        bytes32 privateKey,
        bytes memory publicKey
    ) 
        internal 
        pure 
        returns (bytes32) 
    {
        return keccak256(abi.encodePacked(privateKey, publicKey));
    }
} 