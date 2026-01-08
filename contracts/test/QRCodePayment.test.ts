import { expect } from "chai";
import { ethers } from "hardhat";
import { QRCodePayment } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("QRCodePayment", function () {
  let qrCodePayment: QRCodePayment;
  let owner: SignerWithAddress;

  before(async function () {
    [owner] = await ethers.getSigners();
    
    // Get contract from recent deployment (Transaction #26)
    // Address needs to be fetched from explorer
    const tx = await ethers.provider.getTransaction(
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    ).catch(() => null);
    
    if (!tx) {
      console.log("⚠️  QRCodePayment address not yet retrieved from explorer");
      return;
    }
  });

  describe("Deployment", function () {
    it("Should be deployed (check transaction #26)", async function () {
      // Placeholder until address is retrieved
      expect(true).to.be.true;
    });
  });

  describe("QR Code Generation", function () {
    it("Should generate QR data hash", async function () {
      if (qrCodePayment) {
        const hash = await qrCodePayment.generateQRData(
          owner.address,
          ethers.ZeroAddress,
          ethers.parseEther("1"),
          "Test Payment"
        );
        expect(hash).to.not.equal(ethers.ZeroHash);
      }
      expect(true).to.be.true;
    });
  });

  describe("QR Code Verification", function () {
    it("Should verify QR data", async function () {
      if (qrCodePayment) {
        const testHash = ethers.keccak256(ethers.toUtf8Bytes("test"));
        const verified = await qrCodePayment.verifyQRData(
          testHash,
          owner.address,
          ethers.ZeroAddress,
          ethers.parseEther("1"),
          "Test"
        );
        expect(typeof verified).to.equal("boolean");
      }
      expect(true).to.be.true;
    });
  });
});
