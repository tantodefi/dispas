import { useCallback } from 'react';
import { useChainId, usePublicClient, useWalletClient } from 'wagmi';
import { secp256k1 } from '@noble/curves/secp256k1';
import type { StealthAnnouncement } from "@scopelift/stealth-address-sdk";
import { CONTRACT_ADDRESSES } from "~~/utils/constants";
import { Address } from 'viem';
import { useScaffoldContract } from './scaffold-eth';

const ERC5564_REGISTRY_ABI = [
  {
    inputs: [
      { name: "spendingPubKey", type: "bytes" },
      { name: "viewingPubKey", type: "bytes" }
    ],
    name: "register",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;

export function useStealthAddress() {
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];

  const generateKeys = useCallback(async () => {
    try {
      console.log("Generating stealth keys...");
      
      // Generate private keys
      const spendingPrivateKey = secp256k1.utils.randomPrivateKey();
      const viewingPrivateKey = secp256k1.utils.randomPrivateKey();
      
      // Generate public keys
      const spendingPublicKey = Buffer.from(secp256k1.getPublicKey(spendingPrivateKey, true)).toString('hex');
      const viewingPublicKey = Buffer.from(secp256k1.getPublicKey(viewingPrivateKey, true)).toString('hex');
      
      const keys = {
        spending: {
          private: Buffer.from(spendingPrivateKey).toString('hex'),
          public: spendingPublicKey
        },
        viewing: {
          private: Buffer.from(viewingPrivateKey).toString('hex'),
          public: viewingPublicKey
        }
      };

      console.log("Generated key pairs:", keys);
      return keys;
    } catch (error) {
      console.error("Error generating keys:", error);
      throw error;
    }
  }, []);

  const registerStealthKeys = useCallback(async ({
    spendingPublicKey,
    viewingPublicKey
  }: {
    spendingPublicKey: string;
    viewingPublicKey: string;
  }) => {
    if (!walletClient) throw new Error("Wallet not connected");
    if (!addresses?.ERC5564_REGISTRY) throw new Error("Registry address not found");

    try {
      console.log("Registering keys with contract:", addresses.ERC5564_REGISTRY);
      console.log("Stealth keys:", { spendingPublicKey, viewingPublicKey });

      const { request } = await publicClient.simulateContract({
        address: addresses.ERC5564_REGISTRY,
        abi: ERC5564_REGISTRY_ABI,
        functionName: "register",
        args: [
          `0x${spendingPublicKey}`,
          `0x${viewingPublicKey}`
        ],
      });

      return walletClient.writeContract(request);
    } catch (error) {
      console.error("Error registering stealth keys:", error);
      throw error;
    }
  }, [walletClient, publicClient, addresses]);

  return {
    generateKeys,
    registerStealthKeys,
  };
} 