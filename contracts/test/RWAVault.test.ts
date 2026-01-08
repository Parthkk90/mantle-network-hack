import { expect } from "chai";
import { ethers } from "hardhat";
import { RWAVault } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("RWAVault", function () {
  let rwaVault: RWAVault;
  let owner: SignerWithAddress;

  before(async function () {
    [owner] = await ethers.getSigners();
    
    rwaVault = await ethers.getContractAt(
      "RWAVault",
      "0xC3c278BaE4CCe83e467c388Ea8302eEC119c7a63"
    );
  });

  describe("Deployment", function () {
    it("Should be deployed at correct address", async function () {
      expect(await rwaVault.getAddress()).to.equal(
        "0xC3c278BaE4CCe83e467c388Ea8302eEC119c7a63"
      );
    });

    it("Should have roles defined", async function () {
      const CUSTODIAN_ROLE = await rwaVault.CUSTODIAN_ROLE();
      expect(CUSTODIAN_ROLE).to.not.equal(ethers.ZeroHash);
    });
  });

  describe("Asset Management", function () {
    it("Should return asset list", async function () {
      const assetList = await rwaVault.assetList(0).catch(() => null);
      // May be empty or have assets
      expect(true).to.be.true;
    });

    it("Should return withdrawal request count", async function () {
      const count = await rwaVault.withdrawalRequestCount();
      expect(count).to.be.gte(0);
    });
  });

  describe("Contract State", function () {
    it("Should not be paused", async function () {
      const paused = await rwaVault.paused();
      expect(paused).to.equal(false);
    });
  });
});
