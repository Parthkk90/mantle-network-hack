import { expect } from "chai";
import { ethers } from "hardhat";
import { KYCRegistry } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("KYCRegistry", function () {
  let kycRegistry: KYCRegistry;
  let owner: SignerWithAddress;

  before(async function () {
    [owner] = await ethers.getSigners();
    
    kycRegistry = await ethers.getContractAt(
      "KYCRegistry",
      "0xF28D9911059EE1851d5DC3bdb2714eBcdd5AF4AB"
    );
  });

  describe("Deployment", function () {
    it("Should be deployed at correct address", async function () {
      expect(await kycRegistry.getAddress()).to.equal(
        "0xF28D9911059EE1851d5DC3bdb2714eBcdd5AF4AB"
      );
    });

    it("Should have DEFAULT_ADMIN_ROLE defined", async function () {
      const DEFAULT_ADMIN_ROLE = await kycRegistry.DEFAULT_ADMIN_ROLE();
      // DEFAULT_ADMIN_ROLE is 0x00 by design in AccessControl
      expect(DEFAULT_ADMIN_ROLE).to.equal(ethers.ZeroHash);
    });
  });

  describe("KYC Status", function () {
    it("Should return KYC status for an address", async function () {
      const status = await kycRegistry.kycStatuses(owner.address);
      expect(status).to.exist;
    });

    it("Should check if address is blacklisted", async function () {
      const isBlacklisted = await kycRegistry.isBlacklisted(owner.address);
      expect(typeof isBlacklisted).to.equal("boolean");
    });
  });

  describe("Contract State", function () {
    it("Should not be paused", async function () {
      const paused = await kycRegistry.paused();
      expect(paused).to.equal(false);
    });
  });
});
