import { expect } from "chai";
import { ethers } from "hardhat";
import { DispasStealth, ERC5564Announcer, ERC5564Registry, LSP0ERC725Account } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { deployments } from "hardhat";

describe("DispasStealth Stress Tests", function () {
  let dispas: DispasStealth;
  let announcer: ERC5564Announcer;
  let registry: ERC5564Registry;
  let owner: SignerWithAddress;
  let recipient: SignerWithAddress;
  let universalProfile: LSP0ERC725Account;

  const setupTest = deployments.createFixture(async ({ deployments, ethers }) => {
    await deployments.fixture(["ERC5564", "Dispas"]);
    [owner, recipient] = await ethers.getSigners();

    // Get deployed contracts
    announcer = await ethers.getContract("ERC5564Announcer");
    registry = await ethers.getContract("ERC5564Registry");
    dispas = await ethers.getContract("DispasStealth");

    // Deploy and setup Universal Profile
    const LSP0Factory = await ethers.getContractFactory("LSP0ERC725Account");
    universalProfile = await LSP0Factory.deploy(owner.address);
    await universalProfile.waitForDeployment();

    // Fund the UP
    await owner.sendTransaction({
      to: await universalProfile.getAddress(),
      value: ethers.parseEther("10"),
    });

    return { dispas, announcer, registry, owner, recipient, universalProfile };
  });

  beforeEach(async function () {
    const result = await setupTest();
    dispas = result.dispas;
    announcer = result.announcer;
    registry = result.registry;
    universalProfile = result.universalProfile;
  });

  describe("Edge Cases - Large Numbers of Announcements", function () {
    it("should handle multiple announcements for the same recipient", async function () {
      // First register stealth metadata for recipient
      const recipientMetadata = ethers.randomBytes(32);
      const recipientUP = await (await ethers.getContractFactory("LSP0ERC725Account"))
        .deploy(recipient.address);
      await recipientUP.waitForDeployment();
      
      await dispas.connect(recipient).registerStealthMetadata(
        await recipientUP.getAddress(),
        recipientMetadata
      );

      // Create multiple stealth transfers
      const numTransfers = 50;
      const transferAmount = ethers.parseEther("0.1");
      
      for (let i = 0; i < numTransfers; i++) {
        const ephemeralAddress = ethers.Wallet.createRandom().address;
        await dispas.connect(owner).sendStealthTransfer(
          await universalProfile.getAddress(),
          await recipientUP.getAddress(),
          ephemeralAddress,
          { value: transferAmount }
        );
      }

      const announcements = await dispas.getAnnouncements(await recipientUP.getAddress());
      expect(announcements.length).to.equal(numTransfers);
    });

    it("should maintain correct state after many registrations", async function () {
      const numRegistrations = 20; // Reduced from 100 to work with available signers
      const signers = await ethers.getSigners();
      
      for (let i = 0; i < numRegistrations && i < signers.length; i++) {
        const metadata = ethers.hexlify(ethers.randomBytes(32));
        const userUP = await (await ethers.getContractFactory("LSP0ERC725Account"))
          .deploy(signers[i].address);
        await userUP.waitForDeployment();
        
        await dispas.connect(signers[i]).registerStealthMetadata(
          await userUP.getAddress(),
          metadata
        );
        
        const storedMetadata = await dispas.getStealthMetadata(await userUP.getAddress());
        expect(storedMetadata).to.equal(metadata);
      }
    });
  });

  describe("Gas Optimization Tests", function () {
    it("should maintain reasonable gas costs for repeated operations", async function () {
      // Setup recipient UP and metadata
      const recipientUP = await (await ethers.getContractFactory("LSP0ERC725Account"))
        .deploy(recipient.address);
      await recipientUP.waitForDeployment();
      
      const metadata = ethers.hexlify(ethers.randomBytes(32));
      const regTx = await dispas.connect(recipient).registerStealthMetadata(
        await recipientUP.getAddress(),
        metadata
      );
      const regReceipt = await regTx.wait();
      expect(regReceipt?.gasUsed).to.be.below(200000);

      const ephemeralAddress = ethers.Wallet.createRandom().address;
      const transferTx = await dispas.connect(owner).sendStealthTransfer(
        await universalProfile.getAddress(),
        await recipientUP.getAddress(),
        ephemeralAddress,
        { value: ethers.parseEther("0.1") }
      );
      const transferReceipt = await transferTx.wait();
      expect(transferReceipt?.gasUsed).to.be.below(300000);
    });
  });

  describe("LSP0 Integration Tests", function () {
    it("should correctly interact with Universal Profile permissions", async function () {
      const metadata = ethers.randomBytes(32);
      const nonOwner = recipient;

      // Only owner should be able to register metadata
      await expect(
        dispas.connect(nonOwner).registerStealthMetadata(
          await universalProfile.getAddress(),
          metadata
        )
      ).to.be.revertedWith("Not authorized");

      // Owner should succeed
      await expect(
        dispas.registerStealthMetadata(
          await universalProfile.getAddress(),
          metadata
        )
      ).to.not.be.reverted;
    });

    it("should handle UP balance checks correctly", async function () {
      // Setup recipient UP first
      const recipientUP = await (await ethers.getContractFactory("LSP0ERC725Account"))
        .deploy(recipient.address);
      await recipientUP.waitForDeployment();
      
      const metadata = ethers.hexlify(ethers.randomBytes(32));
      await dispas.connect(recipient).registerStealthMetadata(
        await recipientUP.getAddress(),
        metadata
      );

      // Try to transfer more than UP balance
      const largeAmount = ethers.parseEther("20"); // UP only has 10 ETH
      await expect(
        dispas.connect(owner).sendStealthTransfer(
          await universalProfile.getAddress(),
          await recipientUP.getAddress(),
          ethers.Wallet.createRandom().address,
          { value: largeAmount }
        )
      ).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("Recovery Scenarios", function () {
    it("should allow metadata update for recovery", async function () {
      const initialMetadata = ethers.hexlify(ethers.randomBytes(32));
      const newMetadata = ethers.hexlify(ethers.randomBytes(32));

      // Register initial metadata
      await dispas.connect(owner).registerStealthMetadata(
        await universalProfile.getAddress(),
        initialMetadata
      );

      // Simulate recovery by updating metadata
      await dispas.connect(owner).registerStealthMetadata(
        await universalProfile.getAddress(),
        newMetadata
      );

      const storedMetadata = await dispas.getStealthMetadata(
        await universalProfile.getAddress()
      );
      expect(storedMetadata).to.equal(newMetadata);
    });

    it("should maintain announcement history after metadata update", async function () {
      // Setup recipient UP
      const recipientUP = await (await ethers.getContractFactory("LSP0ERC725Account"))
        .deploy(recipient.address);
      await recipientUP.waitForDeployment();
      
      // Register initial metadata for both sender and recipient
      const initialMetadata = ethers.hexlify(ethers.randomBytes(32));
      const recipientMetadata = ethers.hexlify(ethers.randomBytes(32));
      
      await dispas.connect(owner).registerStealthMetadata(
        await universalProfile.getAddress(),
        initialMetadata
      );
      
      await dispas.connect(recipient).registerStealthMetadata(
        await recipientUP.getAddress(),
        recipientMetadata
      );

      // Create some announcements
      const numTransfers = 5;
      const transferAmount = ethers.parseEther("0.1");
      
      for (let i = 0; i < numTransfers; i++) {
        await dispas.connect(owner).sendStealthTransfer(
          await universalProfile.getAddress(),
          await recipientUP.getAddress(),
          ethers.Wallet.createRandom().address,
          { value: transferAmount }
        );
      }

      // Update metadata
      const newMetadata = ethers.hexlify(ethers.randomBytes(32));
      await dispas.connect(owner).registerStealthMetadata(
        await universalProfile.getAddress(),
        newMetadata
      );

      // Check announcements are preserved
      const announcements = await dispas.getAnnouncements(await recipientUP.getAddress());
      expect(announcements.length).to.equal(numTransfers);
    });
  });
}); 