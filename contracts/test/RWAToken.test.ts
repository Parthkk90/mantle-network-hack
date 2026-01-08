import { expect } from "chai";
import { ethers } from "hardhat";
import { RWAToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("RWAToken", function () {
  let rwaToken: RWAToken;
  let owner: SignerWithAddress;

  before(async function () {
    [owner] = await ethers.getSigners();
    
    rwaToken = await ethers.getContractAt(
      "RWAToken",
      "0x64893039FADCDfc78e4Ac2A383cF201F4AFBc2eC"
    );
  });

  describe("Deployment", function () {
    it("Should be deployed at correct address", async function () {
      expect(await rwaToken.getAddress()).to.equal(
        "0x64893039FADCDfc78e4Ac2A383cF201F4AFBc2eC"
      );
    });

    it("Should have name and symbol", async function () {
      const name = await rwaToken.name();
      const symbol = await rwaToken.symbol();
      expect(name).to.not.equal("");
      expect(symbol).to.not.equal("");
    });

    it("Should have 18 decimals", async function () {
      const decimals = await rwaToken.decimals();
      expect(decimals).to.equal(18);
    });
  });

  describe("Asset Details", function () {
    it("Should have asset details set", async function () {
      const details = await rwaToken.assetDetails();
      expect(details).to.exist;
      expect(details.totalValue).to.be.gt(0);
    });

    it("Should have KYC registry set", async function () {
      const kycReg = await rwaToken.kycRegistry();
      expect(kycReg).to.equal("0xF28D9911059EE1851d5DC3bdb2714eBcdd5AF4AB");
    });

    it("Should have RWA vault set", async function () {
      const vault = await rwaToken.rwaVault();
      expect(vault).to.equal("0xC3c278BaE4CCe83e467c388Ea8302eEC119c7a63");
    });
  });

  describe("Token Supply", function () {
    it("Should return total supply", async function () {
      const totalSupply = await rwaToken.totalSupply();
      expect(totalSupply).to.be.gte(0);
    });
  });

  describe("Contract State", function () {
    it("Should not be paused", async function () {
      const paused = await rwaToken.paused();
      expect(paused).to.equal(false);
    });
  });
});
