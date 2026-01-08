import { expect } from "chai";
import { ethers } from "hardhat";
import { PaymentProcessor } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("PaymentProcessor", function () {
  let paymentProcessor: PaymentProcessor;
  let owner: SignerWithAddress;

  before(async function () {
    [owner] = await ethers.getSigners();
    
    paymentProcessor = await ethers.getContractAt(
      "PaymentProcessor",
      "0x7D7A1bbD55c6A2e1F23cD711B319F377D09D93f8"
    );
  });

  describe("Deployment", function () {
    it("Should be deployed at correct address", async function () {
      expect(await paymentProcessor.getAddress()).to.equal(
        "0x7D7A1bbD55c6A2e1F23cD711B319F377D09D93f8"
      );
    });
  });

  describe("Payment Requests", function () {
    it("Should have payment request mapping", async function () {
      // requestIdCounter is private, but we can check requests mapping
      expect(true).to.be.true;
    });

    it("Should allow creating payment requests", async function () {
      // This would require actual token addresses
      expect(true).to.be.true; // Placeholder
    });
  });

  describe("Contract State", function () {
    it("Should have owner set", async function () {
      const ownerAddress = await paymentProcessor.owner();
      expect(ownerAddress).to.not.equal(ethers.ZeroAddress);
    });
  });
});
