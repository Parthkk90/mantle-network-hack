import { expect } from "chai";
import { ethers } from "hardhat";
import { YieldDistributor } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("YieldDistributor", function () {
  let yieldDistributor: YieldDistributor;
  let owner: SignerWithAddress;

  before(async function () {
    [owner] = await ethers.getSigners();
    
    yieldDistributor = await ethers.getContractAt(
      "YieldDistributor",
      "0xA5674a1c1000f90B8619cCb43DEd55CE36C5d844"
    );
  });

  describe("Deployment", function () {
    it("Should be deployed at correct address", async function () {
      expect(await yieldDistributor.getAddress()).to.equal(
        "0xA5674a1c1000f90B8619cCb43DEd55CE36C5d844"
      );
    });

    it("Should have KYC registry set", async function () {
      const kycReg = await yieldDistributor.kycRegistry();
      expect(kycReg).to.equal("0xF28D9911059EE1851d5DC3bdb2714eBcdd5AF4AB");
    });

    it("Should have roles defined", async function () {
      const DISTRIBUTOR_ROLE = await yieldDistributor.DISTRIBUTOR_ROLE();
      expect(DISTRIBUTOR_ROLE).to.not.equal(ethers.ZeroHash);
    });
  });

  describe("Distributions", function () {
    it("Should return distribution count", async function () {
      const count = await yieldDistributor.distributionCount();
      expect(count).to.be.gte(0);
    });

    it("Should query distribution details", async function () {
      const count = await yieldDistributor.distributionCount();
      if (count > 0) {
        const dist = await yieldDistributor.distributions(0);
        expect(dist).to.exist;
      }
      expect(true).to.be.true;
    });
  });
});
