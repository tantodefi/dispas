import { StealthKeyRegistry } from "@scopelift/stealth-address-sdk";
import type { StealthAnnouncement } from "@scopelift/stealth-address-sdk";

export class StealthAddressManager {
  private registry: StealthKeyRegistry;

  constructor(chainId: number, rpcUrl: string) {
    this.registry = new StealthKeyRegistry({
      chainId,
      rpcUrl,
    });
  }

  async generateKeyPairs() {
    // Generate new spending key pair
    const spendingKeyPair = await this.registry.generateKeyPair();
    const viewingKeyPair = await this.registry.generateKeyPair();

    return {
      spendingPublicKey: spendingKeyPair.publicKeyHex,
      spendingPrivateKey: spendingKeyPair.privateKeyHex,
      viewingPublicKey: viewingKeyPair.publicKeyHex,
      viewingPrivateKey: viewingKeyPair.privateKeyHex,
    };
  }

  async watchAnnouncementsForUser({
    spendingPublicKey,
    viewingPrivateKey,
    onAnnouncement,
  }: {
    spendingPublicKey: string;
    viewingPrivateKey: string;
    onAnnouncement: (announcement: StealthAnnouncement) => void;
  }) {
    return this.registry.watchAnnouncementsForUser({
      spendingPublicKey,
      viewingPrivateKey,
      onAnnouncement,
    });
  }
} 