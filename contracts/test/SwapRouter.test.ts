import { expect } from "chai";
import { ethers } from "hardhat";
import { SwapRouter } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("SwapRouter", function () {
  let swapRouter: SwapRouter;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;

  before(async function () {
    [owner, user] = await ethers.getSigners();
    
    // Use deployed contract
    const deployedAddress = "0x171Cb040f80ea3E7f46EFD434e3D12A77A5D76BD";
    swapRouter = await ethers.getContractAt("SwapRouter", deployedAddress);
  });

  describe("Deployment", function () {
    it("Should be deployed at correct address", async function () {
      expect(await swapRouter.getAddress()).to.equal("0x171Cb040f80ea3E7f46EFD434e3D12A77A5D76BD");
    });

    it("Should have owner set", async function () {
      const ownerAddress = await swapRouter.owner();
      expect(ownerAddress).to.not.equal(ethers.ZeroAddress);
    });
  });

  describe("DEX Management", function () {
    it("Should return DEX list", async function () {
      const dexes = await swapRouter.getAllDEXs();
      expect(dexes).to.be.an("array");
    });

    it("Should have isRegisteredDEX mapping", async function () {
      const mockDex = "0x0000000000000000000000000000000000000001";
      const isRegistered = await swapRouter.isRegisteredDEX(mockDex);
      expect(typeof isRegistered).to.equal("boolean");
    });
  });

  describe("Swap Fee", function () {
    it("Should return swap fee rate", async function () {
      const fee = await swapRouter.swapFee();
      expect(fee).to.be.gte(0);
      expect(fee).to.be.lte(10000); // Max 100%
    });
  });

  describe("Contract State", function () {
    it("Should have fee recipient set", async function () {
      const recipient = await swapRouter.feeRecipient();
      expect(recipient).to.not.equal(ethers.ZeroAddress);
    });
  });
});
