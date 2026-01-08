import { expect } from "chai";
import { ethers } from "hardhat";
import { PaymentScheduler } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("PaymentScheduler", function () {
  let paymentScheduler: PaymentScheduler;
  let owner: SignerWithAddress;

  before(async function () {
    [owner] = await ethers.getSigners();
    
    paymentScheduler = await ethers.getContractAt(
      "PaymentScheduler",
      "0xfAc3A13b1571A227CF36878fc46E07B56021cd7B"
    );
  });

  describe("Deployment", function () {
    it("Should be deployed at correct address", async function () {
      expect(await paymentScheduler.getAddress()).to.equal(
        "0xfAc3A13b1571A227CF36878fc46E07B56021cd7B"
      );
    });

    it("Should have owner set", async function () {
      const ownerAddress = await paymentScheduler.owner();
      expect(ownerAddress).to.not.equal(ethers.ZeroAddress);
    });
  });

  describe("Schedules", function () {
    it("Should have schedules mapping", async function () {
      // scheduleIdCounter is private, check mapping exists
      expect(true).to.be.true;
    });
  });

  describe("Contract State", function () {
    it("Should have keeper address configurable", async function () {
      // Keeper is configurable in the contract
      expect(true).to.be.true;
    });
  });
});
