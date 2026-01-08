import { ethers } from "hardhat";

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log("\n🚀 Deploying ALL CRESCA + RWA Contracts\n");

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "MNT\n");

  const deployed: any = {};

  try {
    // Core Contracts (already deployed - just listing addresses)
    console.log("📦 Core CRESCA Contracts (Already Deployed):");
    deployed.SwapRouter = "0x171Cb040f80ea3E7f46EFD434e3D12A77A5D76BD";
    deployed.VaultManager = "0x12d06098124c6c24E0551c429D996c8958A32083";
    deployed.BundleFactory = "0xB463bf41250c9f83A846708fa96fB20aC1B4f08E";
    deployed.PaymentScheduler = "0xfAc3A13b1571A227CF36878fc46E07B56021cd7B";
    deployed.PaymentProcessor = "0x7D7A1bbD55c6A2e1F23cD711B319F377D09D93f8";
    console.log("✅ Core contracts already deployed\n");

    // RWA Contracts
    console.log("📦 Deploying RWA Contracts:\n");

    console.log("1/6 Deploying KYCRegistry...");
    const KYC = await ethers.getContractFactory("KYCRegistry");
    const kyc = await KYC.deploy();
    await kyc.waitForDeployment();
    deployed.KYCRegistry = await kyc.getAddress();
    console.log("✅", deployed.KYCRegistry);
    await sleep(3000); // Wait 3 seconds between deployments

    console.log("\n2/6 Deploying RWAVault...");
    const Vault = await ethers.getContractFactory("RWAVault");
    const vault = await Vault.deploy();
    await vault.waitForDeployment();
    deployed.RWAVault = await vault.getAddress();
    console.log("✅", deployed.RWAVault);
    await sleep(3000);

    console.log("\n3/6 Deploying RWAToken...");
    const Token = await ethers.getContractFactory("RWAToken");
    const token = await Token.deploy(
      "Real World Asset",
      "RWA",
      0, // REAL_ESTATE
      "Sample RWA",
      100000000,
      "QmHash",
      deployed.KYCRegistry,
      deployed.RWAVault
    );
    await token.waitForDeployment();
    deployed.RWAToken = await token.getAddress();
    console.log("✅", deployed.RWAToken);
    await sleep(3000);

    console.log("\n4/6 Deploying YieldDistributor...");
    const Yield = await ethers.getContractFactory("YieldDistributor");
    const yieldDist = await Yield.deploy(deployed.KYCRegistry);
    await yieldDist.waitForDeployment();
    deployed.YieldDistributor = await yieldDist.getAddress();
    console.log("✅", deployed.YieldDistributor);
    await sleep(3000);

    console.log("\n5/6 Deploying InvoiceFactoring...");
    const Invoice = await ethers.getContractFactory("InvoiceFactoring");
    const invoice = await Invoice.deploy(deployed.KYCRegistry);
    await invoice.waitForDeployment();
    deployed.InvoiceFactoring = await invoice.getAddress();
    console.log("✅", deployed.InvoiceFactoring);
    await sleep(3000);

    console.log("\n6/6 Deploying QRCodePayment...");
    const QR = await ethers.getContractFactory("QRCodePayment");
    const qr = await QR.deploy();
    await qr.waitForDeployment();
    deployed.QRCodePayment = await qr.getAddress();
    console.log("✅", deployed.QRCodePayment);

    console.log("\n" + "=".repeat(70));
    console.log("🎉 ALL CONTRACTS DEPLOYED SUCCESSFULLY!");
    console.log("=".repeat(70) + "\n");

    console.log("📋 Complete Contract List:\n");
    console.log("CORE DeFi Contracts:");
    console.log("  SwapRouter:        ", deployed.SwapRouter);
    console.log("  VaultManager:      ", deployed.VaultManager);
    console.log("  BundleFactory:     ", deployed.BundleFactory);
    console.log("  PaymentScheduler:  ", deployed.PaymentScheduler);
    console.log("  PaymentProcessor:  ", deployed.PaymentProcessor);
    
    console.log("\nRWA Contracts:");
    console.log("  KYCRegistry:       ", deployed.KYCRegistry);
    console.log("  RWAVault:          ", deployed.RWAVault);
    console.log("  RWAToken:          ", deployed.RWAToken);
    console.log("  YieldDistributor:  ", deployed.YieldDistributor);
    console.log("  InvoiceFactoring:  ", deployed.InvoiceFactoring);
    console.log("  QRCodePayment:     ", deployed.QRCodePayment);
    
    console.log("\n" + "=".repeat(70));
    console.log("\n✨ Total: 11 Contracts on Mantle Sepolia Testnet");
    console.log("\nView on Mantlescan:");
    console.log(`https://sepolia.mantlescan.xyz/address/${deployer.address}\n`);

  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    console.log("\n✅ Deployed so far:");
    console.log(JSON.stringify(deployed, null, 2));
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
