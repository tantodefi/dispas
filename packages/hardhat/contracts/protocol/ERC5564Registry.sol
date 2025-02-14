// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface IERC5564Registry {
    event StealthMetaAddressSet(address indexed registrant, string stealthMetaAddress);

    function setStealthMetaAddress(string memory stealthMetaAddress) external;
    function setStealthMetaAddressFor(
        address registrant,
        string memory stealthMetaAddress,
        bytes memory signature
    ) external;
    function getStealthMetaAddress(address registrant) external view returns (string memory);
}

contract ERC5564Registry is IERC5564Registry {
    mapping(address => string) private _stealthMetaAddresses;

    function setStealthMetaAddress(string memory stealthMetaAddress) external {
        _stealthMetaAddresses[msg.sender] = stealthMetaAddress;
        emit StealthMetaAddressSet(msg.sender, stealthMetaAddress);
    }

    function setStealthMetaAddressFor(
        address registrant,
        string memory stealthMetaAddress,
        bytes memory signature
    ) external {
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                "\x19Ethereum Signed Message:\n32",
                keccak256(abi.encodePacked(stealthMetaAddress))
            )
        );
        address signer = recoverSigner(messageHash, signature);
        require(signer == registrant, "Invalid signature");

        _stealthMetaAddresses[registrant] = stealthMetaAddress;
        emit StealthMetaAddressSet(registrant, stealthMetaAddress);
    }

    function getStealthMetaAddress(address registrant) external view returns (string memory) {
        return _stealthMetaAddresses[registrant];
    }

    function recoverSigner(bytes32 messageHash, bytes memory signature) internal pure returns (address) {
        require(signature.length == 65, "Invalid signature length");

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }

        if (v < 27) v += 27;
        require(v == 27 || v == 28, "Invalid signature 'v' value");

        return ecrecover(messageHash, v, r, s);
    }
} 