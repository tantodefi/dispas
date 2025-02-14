export const CONTRACT_ADDRESSES = {
  // Testnet addresses
  4201: {
    DISPAS: "0x746C338d272581967ad9F3F4d7CB3994EDf91b3a",
    DISPAS_STEALTH: "0x312ef2A035bA266Ed81e7C6CaC0e6d8929EEF13a",
    ERC5564_ANNOUNCER: "0x4E581D6a88bc7D60D092673904d961B6b0961A40",
    ERC5564_REGISTRY: "0x8653F395983827E05A6625eED4D045e696980D16"
  },
  // Mainnet addresses
  42: {
    DISPAS: "0x312ef2A035bA266Ed81e7C6CaC0e6d8929EEF13a",
    DISPAS_STEALTH: "0x746C338d272581967ad9F3F4d7CB3994EDf91b3a",
    ERC5564_ANNOUNCER: "0x8653F395983827E05A6625eED4D045e696980D16",
    ERC5564_REGISTRY: "0x4E581D6a88bc7D60D092673904d961B6b0961A40"
  }
} as const;

// Chain IDs
export const SUPPORTED_CHAINS = {
  LOCALHOST: 31337,
  LUKSO_TESTNET: 4201,
  LUKSO_MAINNET: 42
} as const;

export const LSP0_ABI = [
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "_key",
        "type": "bytes32"
      }
    ],
    "name": "getData",
    "outputs": [
      {
        "internalType": "bytes",
        "name": "value",
        "type": "bytes"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "_key",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "_value",
        "type": "bytes"
      }
    ],
    "name": "setData",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]; 