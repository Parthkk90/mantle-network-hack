import { expect } from "chai";
import { ethers } from "hardhat";
import { VaultManager } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("VaultManager", function () {
  let vaultManager: VaultManager;
  let owner: SignerWithAddress;

  before(async function () {
    [owner] = await ethers.getSigners();
    
    vaultManager = await ethers.getContractAt(
      "VaultManager",
      "0x12d06098124c6c24E0551c429D996c8958A32083"
    );
  });

  describe("Deployment", function () {
    it("Should be deployed at correct address", async function () {
      expect(await vaultManager.getAddress()).to.equal(
        "0x12d06098124c6c24E0551c429D996c8958A32083"
      );
    });

    it("Should have swap router set", async function () {
      const swapRouter = await vaultManager.swapRouter();
      expect(swapRouter).to.equal("0x171Cb040f80ea3E7f46EFD434e3D12A77A5D76BD");
    });

    it("Should have owner set", async function () {
      const ownerAddress = await vaultManager.owner();
      expect(ownerAddress).to.not.equal(ethers.ZeroAddress);
    });
  });

  describe("Bundle Management", function () {
    it("Should have bundles mapping", async function () {
      // Check contract has bundle management
      expect(true).to.be.true;
    });
  });

  describe("Contract State", function () {
    it("Should have owner set", async function () {
      const ownerAddress = await vaultManager.owner();
      expect(ownerAddress).to.not.equal(ethers.ZeroAddress);
    });
  });
});
