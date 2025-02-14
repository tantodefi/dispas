import { expect } from "chai";
import { ethers } from "hardhat";
import { DispasStealth } from "../typechain-types";

describe("DispasStealth", function () {
  let dispas: DispasStealth;
  let universalProfile1: any;
  let universalProfile2: any;
  let owner1: any;
  let owner2: any;
  let randomUser: any;
  let announcer: any;

  beforeEach(async function () {
    // Get signers
    [owner1, owner2, randomUser] = await ethers.getSigners();

    // Deploy ERC5564Announcer first
    const AnnouncerFactory = await ethers.getContractFactory("ERC5564Announcer");
    announcer = await AnnouncerFactory.deploy();
    await announcer.waitForDeployment();

    // Deploy Universal Profiles
    const UP = await ethers.getContractFactory("LSP0ERC725AccountProxy");
    universalProfile1 = await UP.connect(owner1).deploy(await owner1.getAddress());
    await universalProfile1.waitForDeployment();
    
    universalProfile2 = await UP.connect(owner2).deploy(await owner2.getAddress());
    await universalProfile2.waitForDeployment();

    // Deploy DispasStealth contract with announcer address
    const Dispas = await ethers.getContractFactory("contracts/protocol/DispasStealth.sol:DispasStealth");
    dispas = await Dispas.deploy(await announcer.getAddress());
    await dispas.waitForDeployment();
  });

  describe("Stealth Address Registration", function () {
    it("should allow a UP to register a stealth metadata", async function () {
      const stealthMetadata = ethers.encodeBytes32String("test-metadata");
      const upAddress = await universalProfile1.getAddress();
      
      await expect(
        dispas.connect(owner1).registerStealthMetadata(upAddress, stealthMetadata)
      ).to.emit(dispas, "StealthMetadataRegistered")
        .withArgs(upAddress, stealthMetadata);
      
      const savedMetadata = await dispas.getStealthMetadata(upAddress);
      expect(savedMetadata).to.equal(stealthMetadata);
    });

    it("should only allow UP owner to register stealth metadata", async function () {
      const stealthMetadata = ethers.encodeBytes32String("test-metadata");
      const upAddress = await universalProfile1.getAddress();
      
      await expect(
        dispas.connect(randomUser).registerStealthMetadata(upAddress, stealthMetadata)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("Stealth Transfers", function () {
    const amount = ethers.parseEther("1.0");
    
    beforeEach(async function () {
      // Register stealth metadata for both UPs
      const stealthMetadata1 = ethers.encodeBytes32String("metadata-1");
      const stealthMetadata2 = ethers.encodeBytes32String("metadata-2");
      
      await dispas.connect(owner1).registerStealthMetadata(await universalProfile1.getAddress(), stealthMetadata1);
      await dispas.connect(owner2).registerStealthMetadata(await universalProfile2.getAddress(), stealthMetadata2);
      
      // Fund UP1 with some ETH
      await owner1.sendTransaction({
        to: await universalProfile1.getAddress(),
        value: amount * 2n // Double the amount for multiple tests
      });
    });

    it("should allow stealth transfer between UPs", async function () {
      const wallet = ethers.Wallet.createRandom();
      const ephemeralAddress = await wallet.getAddress();
      const initialBalance = await ethers.provider.getBalance(await universalProfile2.getAddress());

      await expect(
        dispas.connect(owner1).sendStealthTransfer(
          await universalProfile1.getAddress(),
          await universalProfile2.getAddress(),
          ephemeralAddress,
          { value: amount }
        )
      ).to.emit(dispas, "StealthTransfer")
        .withArgs(await universalProfile1.getAddress(), await universalProfile2.getAddress(), ephemeralAddress, amount);

      const finalBalance = await ethers.provider.getBalance(await universalProfile2.getAddress());
      expect(finalBalance - initialBalance).to.equal(amount);
    });

    it("should fail if sender UP doesn't have enough balance", async function () {
      const wallet = ethers.Wallet.createRandom();
      const ephemeralAddress = await wallet.getAddress();
      const tooMuchAmount = ethers.parseEther("100.0");

      await expect(
        dispas.connect(owner1).sendStealthTransfer(
          await universalProfile1.getAddress(),
          await universalProfile2.getAddress(),
          ephemeralAddress,
          { value: tooMuchAmount }
        )
      ).to.be.reverted;
    });

    it("should fail if recipient UP doesn't have stealth metadata registered", async function () {
      const wallet = ethers.Wallet.createRandom();
      const ephemeralAddress = await wallet.getAddress();
      const UP = await ethers.getContractFactory("LSP0ERC725AccountProxy");
      const newUP = await UP.connect(owner1).deploy(await owner1.getAddress());

      await expect(
        dispas.connect(owner1).sendStealthTransfer(
          await universalProfile1.getAddress(),
          await newUP.getAddress(),
          ephemeralAddress,
          { value: amount }
        )
      ).to.be.revertedWith("Recipient has no stealth metadata");
    });
  });

  describe("Announcement Retrieval", function () {
    it("should allow retrieving announcements for a UP", async function () {
      const wallet = ethers.Wallet.createRandom();
      const ephemeralAddress = await wallet.getAddress();
      const amount = ethers.parseEther("1.0");

      // Register stealth metadata
      const stealthMetadata1 = ethers.encodeBytes32String("metadata-1");
      const stealthMetadata2 = ethers.encodeBytes32String("metadata-2");
      
      await dispas.connect(owner1).registerStealthMetadata(await universalProfile1.getAddress(), stealthMetadata1);
      await dispas.connect(owner2).registerStealthMetadata(await universalProfile2.getAddress(), stealthMetadata2);

      // Fund UP1
      await owner1.sendTransaction({
        to: await universalProfile1.getAddress(),
        value: amount
      });

      // Make a stealth transfer
      await dispas.connect(owner1).sendStealthTransfer(
        await universalProfile1.getAddress(),
        await universalProfile2.getAddress(),
        ephemeralAddress,
        { value: amount }
      );

      // Get announcements
      const announcements = await dispas.getAnnouncements(await universalProfile2.getAddress());
      expect(announcements.length).to.be.above(0);
      expect(announcements[0].recipient).to.equal(await universalProfile2.getAddress());
      expect(announcements[0].ephemeralAddress).to.equal(ephemeralAddress);
      expect(announcements[0].amount).to.equal(amount);
    });
  });
}); 