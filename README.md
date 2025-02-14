# Dispastealth: Stealth Payments on LUKSO

Dispas implements ERC-5564 stealth addresses integrated with LUKSO Universal Profiles, allowing private payments while maintaining the benefits of account abstraction.

https://dispastealth.vercel.app/

https://dispastealth.vercel.app/register-stealth

testnet deployment:
```
npx hardhat deploy --network luksoTestnet --tags ERC5564
WARNING: You are currently using Node.js v23.5.0, which is not supported by Hardhat. This can lead to unexpected behavior. See https://hardhat.org/nodejs-versions


Private key length: 66
Nothing to compile
No need to generate any newer typings.
deploying "ERC5564Registry" (tx: 0xb8aa46db56fb4f1fbdd5983f954e85afc2c65ef672063ca06ee634a8faa267bb)...: deployed at 0x8653F395983827E05A6625eED4D045e696980D16 with 494901 gas
deploying "ERC5564Announcer" (tx: 0x83327a5735c8482776c11333586a2e3ef37871f9f198bb7f871c67f4e408c1bd)...: deployed at 0x4E581D6a88bc7D60D092673904d961B6b0961A40 with 189957 gas
📝 Updated TypeScript contract definition file on ../nextjs/contracts/deployedContracts.ts
👻 -GH05T-1N-TH3-5H3LL ~/dispastealth/packages/hardhat   main ●  
npx hardhat deploy --network luksoTestnet --tags DispasStealth
WARNING: You are currently using Node.js v23.5.0, which is not supported by Hardhat. This can lead to unexpected behavior. See https://hardhat.org/nodejs-versions


Private key length: 66
Nothing to compile
No need to generate any newer typings.
reusing "ERC5564Registry" at 0x8653F395983827E05A6625eED4D045e696980D16
reusing "ERC5564Announcer" at 0x4E581D6a88bc7D60D092673904d961B6b0961A40
deploying "DispasStealth" (tx: 0xbee6d2a6035fbbb3bff3bb207e89222f1376a8b9ab25d9476dcd8e8f9e62e773)...: deployed at 0x312ef2A035bA266Ed81e7C6CaC0e6d8929EEF13a with 553045 gas
📝 Updated TypeScript contract definition file on ../nextjs/contracts/deployedContracts.ts
👻 -GH05T-1N-TH3-5H3LL ~/dispastealth/packages/hardhat   main ●  
npx hardhat deploy --network luksoTestnet --tags Dispas
WARNING: You are currently using Node.js v23.5.0, which is not supported by Hardhat. This can lead to unexpected behavior. See https://hardhat.org/nodejs-versions


Private key length: 66
Nothing to compile
No need to generate any newer typings.
deploying "Dispas" (tx: 0x9def886bb9a225687235b4f36559af1dec595a4f723382bbb319f96f6d019323)...: deployed at 0x746C338d272581967ad9F3F4d7CB3994EDf91b3a with 237654 gas
📝 Updated TypeScript contract definition file on ../nextjs/contracts/deployedContracts.ts
```

mainnet deployment:
```
npx hardhat deploy --network luksoMainnet --tags ERC5564

WARNING: You are currently using Node.js v23.5.0, which is not supported by Hardhat. This can lead to unexpected behavior. See https://hardhat.org/nodejs-versions


Private key length: 66
Nothing to compile
No need to generate any newer typings.
deploying "ERC5564Announcer" (tx: 0xe1333ba120fe4e4dc452d2285171e6200e435478c30351f00190541e7dc1d69e)...: deployed at 0x8653F395983827E05A6625eED4D045e696980D16 with 189957 gas
deploying "ERC5564Registry" (tx: 0xee2752b825fc43762a917121d16cc0b0dfe9900c985192a8a34c01d0f4f2ddf8)...: deployed at 0x4E581D6a88bc7D60D092673904d961B6b0961A40 with 494901 gas
📝 Updated TypeScript contract definition file on ../nextjs/contracts/deployedContracts.ts
npx hardhat deploy --network luksoMainnet --tags Dispas
WARNING: You are currently using Node.js v23.5.0, which is not supported by Hardhat. This can lead to unexpected behavior. See https://hardhat.org/nodejs-versions


Private key length: 66
Nothing to compile
No need to generate any newer typings.
deploying "Dispas" (tx: 0x3a3b32322796d5b4b085bfe0a80e8dc0aabc286b4f501a009d50c7359c8d7331)...: deployed at 0x312ef2A035bA266Ed81e7C6CaC0e6d8929EEF13a with 237654 gas
npx hardhat deploy --network luksoMainnet --tags Dispas
WARNING: You are currently using Node.js v23.5.0, which is not supported by Hardhat. This can lead to unexpected behavior. See https://hardhat.org/nodejs-versions


Private key length: 66
Nothing to compile
No need to generate any newer typings.
reusing "Dispas" at 0x312ef2A035bA266Ed81e7C6CaC0e6d8929EEF13a
reusing "ERC5564Announcer" at 0x8653F395983827E05A6625eED4D045e696980D16
reusing "ERC5564Registry" at 0x4E581D6a88bc7D60D092673904d961B6b0961A40
deploying "DispasStealth" (tx: 0x467124cf867ce5a14d6f95767e27e195804cf6072560e94fbc735a47fea1101b)...: deployed at 0x746C338d272581967ad9F3F4d7CB3994EDf91b3a with 553045 gas
```


## Stealth Address Architecture

### Core Components

1. **Stealth Meta-Address Generation**

```
typescript
// packages/nextjs/utils/stealthAddress.ts
export class StealthAddressManager {
static async createStealthMetaAddress(recipientAddress: string): Promise<StealthMetaAddress> {
const randomBytes = ethers.utils.randomBytes(32);
const signature = ethers.utils.keccak256(randomBytes);
const keys = generateKeysFromSignature(signature);
const metaAddress = generateStealthMetaAddress(keys.spendingPubKey, keys.viewingPubKey);
return {
metaAddress,
keys,
};
}
}
```

This generates a stealth meta-address that can be publicly shared. The meta-address contains the public keys needed for generating one-time stealth addresses.

2. **Key Storage in Universal Profiles**

```
typescript
static async storeKeysInUniversalProfile(
upAddress: string,
keys: StealthMetaAddress["keys"],
signer: ethers.Signer
) {
const erc725 = new ERC725(
LSP0_ABI,
upAddress,
signer.provider,
{ ipfsGateway: "https://api.universalprofile.cloud/ipfs" }
);
const keyName = ethers.utils.keccak256(
ethers.utils.toUtf8Bytes("StealthKeys")
);
const value = ethers.utils.defaultAbiCoder.encode(
["bytes32", "bytes32", "bytes32", "bytes32"],
[
keys.spendingPubKey,
keys.viewingPubKey,
keys.spendingPrivKey,
keys.viewingPrivKey,
]
);
await erc725.connect(signer).setData(keyName, value);
}
```

The stealth keys are securely stored in the recipient's Universal Profile using ERC-725 data storage.

### Smart Contracts

1. **ERC-5564 Registry**

```
solidity
// packages/hardhat/contracts/protocol/ERC5564Registry.sol
contract ERC5564Registry {
event StealthAddressAnnouncement(
address indexed ephemeralAddress,
bytes32 indexed stealthRecipientAndViewTag,
bytes metadata
);
function announce(
address ephemeralAddress,
bytes32 stealthRecipientAndViewTag,
bytes calldata metadata
) external {
emit StealthAddressAnnouncement(
ephemeralAddress,
stealthRecipientAndViewTag,
metadata
);
}
}```

The registry contract emits events for stealth payments, allowing recipients to scan for their payments.

2. **Stealth Payment Distribution**

```
solidity
// packages/hardhat/contracts/protocol/DispasStealth.sol
contract DispasStealth {
function distributeStealthFunds(StealthPayment[] calldata payments) external payable {
uint256 totalAmount = 0;
for (uint256 i = 0; i < payments.length; i++) {
totalAmount += payments[i].amount;
// Generate stealth address from meta-address
address stealthAddress = generateStealthAddress(
payments[i].stealthMetaAddress
);
// Transfer funds and announce
payable(stealthAddress).transfer(payments[i].amount);
announcer.announce(
stealthAddress,
payments[i].stealthMetaAddress,
""
);
}
require(msg.value >= totalAmount, "Insufficient funds sent");
}
}```

### Frontend Integration

1. **Stealth Toggle Component**

```
typescript
// packages/nextjs/components/StealthToggle.tsx
export const StealthToggle = ({ onChange }: { onChange: (enabled: boolean) => void }) => {
return (
<div className="form-control">
<label className="label cursor-pointer">
<span className="label-text mr-2">Enable Stealth Payments</span>
<input
type="checkbox"
className="toggle toggle-primary"
onChange={e => onChange(e.target.checked)}
/>
</label>
</div>
);
};```

2. **Stealth Address Helper**

```
typescript
// packages/nextjs/components/StealthAddressHelper.tsx
export const StealthAddressHelper = () => {
const { address } = useAccount();
const [stealthMetaAddress, setStealthMetaAddress] = useState<string>("");
const generateStealthMetaAddress = async () => {
if (!address) return;
const manager = new StealthAddressManager();
const metaAddress = await manager.generateStealthMetaAddress(address);
setStealthMetaAddress(metaAddress);
};
// ... QR code and display logic
};```

## How It Works

1. **Generating a Stealth Meta-Address**
   - User connects their Universal Profile
   - Generates a stealth meta-address using ERC-5564
   - Stores the keys in their Universal Profile using ERC-725

2. **Sending a Stealth Payment**
   - Sender gets recipient's stealth meta-address
   - Frontend generates a one-time stealth address
   - Payment is sent through DispasStealth contract
   - Payment is announced on ERC-5564 registry

3. **Receiving a Stealth Payment**
   - Recipient scans ERC-5564 registry events
   - Retrieves keys from their Universal Profile
   - Derives private keys for the stealth address
   - Can now access and spend the received funds

## Security Considerations

1. **Key Storage**
   - Private keys are stored encrypted in Universal Profiles
   - Only the UP owner can access their stealth keys
   - Keys never leave the user's device unencrypted

2. **Payment Privacy**
   - Each payment uses a unique stealth address
   - No on-chain link between UP and stealth address
   - Only recipient can link payments to their UP

3. **Integration with Universal Profiles**
   - Maintains account abstraction benefits
   - Social recovery through UP
   - Integrated with UP permissions system

#### Contract Interactions
1. DispasStealth + ERC5564Announcer:
- DispasStealth holds a reference to the ERC5564Announcer contract (STEALTH_ANNOUNCER)
- Used to announce stealth payments through the announce() function
- The announcer emits events that recipients can scan for their payments

2. DispasStealth + Universal Profiles (UPs):
- Users interact through their Universal Profiles (LUKSO's account abstraction)
- UPs register their stealth metadata using registerStealthMetadata()
- UPs receive funds through stealth transfers

#### User Flow

1. Registration:

```
function registerStealthMetadata(address account, bytes32 metadata) external {
    require(msg.sender == account, "Not authorized");
    stealthMetadata[account] = metadata;
    emit StealthMetadataRegistered(account, metadata);
}```

- User creates stealth keys (off-chain)
- User registers their stealth metadata through their UP
- Metadata is stored in the contract's mapping

2. Sending Stealth Payments:

```
function sendStealthTransfer(
    address from,
    address to,
    address ephemeralAddress
) external payable {
    require(msg.value > 0, "Zero amount");
    require(stealthMetadata[to] != bytes32(0), "Recipient has no stealth metadata");
    
    // Transfer funds
    (bool success, ) = to.call{value: msg.value}("");
    require(success, "Transfer failed");

    // Announce the transfer
    STEALTH_ANNOUNCER.announce(
        SCHEME_ID,
        ephemeralAddress,
        abi.encodePacked(stealthMetadata[to]),
        abi.encode(msg.value)
    );

    emit StealthTransfer(from, to, ephemeralAddress, msg.value);
}
}```

Flow:
1. Sender looks up recipient's stealth metadata
2. Generates ephemeral address using recipient's metadata
3. Sends payment through DispasStealth contract
4. Contract announces the payment through ERC5564Announcer

3. Receiving Payments:

```
function getAnnouncements(address recipient) external view returns (
    Announcement[] memory
) {
    // Recipients scan these announcements to find their payments
    // ...
});
}
}```

Flow:
1. Recipient scans ERC-5564 registry events
2. Retrieves keys from their Universal Profile
3. Derives private keys for the stealth address
4. Can now access and spend the received funds



## [🤑 Dispas](https://dispas.vercel.app)

**Fancy a quick demo? 👉 https://youtu.be/7YJ1J9-KH40**

### Manage payroll, allowances, donations, e.t.c more easily by distributing funds in ONE transaction

![Dispas](https://valentinecodes.github.io/dispas/assets/dispas.png)

## Local Development

Before you begin, you need to install the following tools:

- [Node (>= v18.18)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

## Quickstart

To get started with Dispas, follow the steps below:

1. Clone repo and install dependencies:

```
git clone https://github.com/ValentineCodes/dispas.git
cd dispas
yarn install
```

2. Run a local network in the first terminal:

```
yarn chain
```

This command starts a local Ethereum network using Hardhat. The network runs on your local machine and can be used for testing and development. You can customize the network configuration in `packages/hardhat/hardhat.config.ts`.

3. On a second terminal, deploy the test contract:

```
yarn deploy
```

This command deploys a test smart contract to the local network. The contract is located in `packages/hardhat/contracts` and can be modified to suit your needs. The `yarn deploy` command uses the deploy script located in `packages/hardhat/deploy` to deploy the contract to the network. You can also customize the deploy script.

4. On a third terminal, start your NextJS app:

```
yarn start
```

Visit your app on: `http://localhost:3000`. You can interact with your smart contract using the `Debug Contracts` page. You can tweak the app config in `packages/nextjs/scaffold.config.ts`.

Run smart contract test with `yarn hardhat:test`

- Edit smart contracts in `packages/hardhat/contracts`
- Edit frontend homepage at `packages/nextjs/app/page.tsx`. For guidance on [routing](https://nextjs.org/docs/app/building-your-application/routing/defining-routes) and configuring [pages/layouts](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts) checkout the Next.js documentation.
- Edit deployment scripts in `packages/hardhat/deploy`

## Contributing to Dispas

We welcome contributions to Dispas!

Please see [CONTRIBUTING.MD](https://github.com/valentinecodes/dispas/blob/main/CONTRIBUTING.md) for more information and guidelines for contributing to Dispas.

