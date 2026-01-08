import { ethers } from "hardhat";

async function main() {
  console.log("\n🚀 Deploying RWA Contracts to Mantle Sepolia...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  try {
    // Deploy KYCRegistry
    console.log("\n1. Deploying KYCRegistry...");
    const KYCRegistry = await ethers.getContractFactory("KYCRegistry");
    const kycRegistry = await KYCRegistry.deploy();
    await kycRegistry.waitForDeployment();
    const kycAddress = await kycRegistry.getAddress();
    console.log("✅ KYCRegistry:", kycAddress);

    // Deploy RWAVault
    console.log("\n2. Deploying RWAVault...");
    const RWAVault = await ethers.getContractFactory("RWAVault");
    const rwaVault = await RWAVault.deploy();
    await rwaVault.waitForDeployment();
    const vaultAddress = await rwaVault.getAddress();
    console.log("✅ RWAVault:", vaultAddress);

    // Deploy RWAToken
    console.log("\n3. Deploying RWAToken...");
    const RWAToken = await ethers.getContractFactory("RWAToken");
    const rwaToken = await RWAToken.deploy(
      "Real World Asset",
      "RWA",
      0, // REAL_ESTATE
      "Sample Property",
      100000000, // $1M in cents
      "QmHash123",
      kycAddress,
      vaultAddress
    );
    await rwaToken.waitForDeployment();
    const tokenAddress = await rwaToken.getAddress();
    console.log("✅ RWAToken:", tokenAddress);

    // Deploy YieldDistributor
    console.log("\n4. Deploying YieldDistributor...");
    const YieldDistributor = await ethers.getContractFactory("YieldDistributor");
    const yieldDist = await YieldDistributor.deploy(kycAddress);
    await yieldDist.waitForDeployment();
    const yieldAddress = await yieldDist.getAddress();
    console.log("✅ YieldDistributor:", yieldAddress);

    // Deploy InvoiceFactoring
    console.log("\n5. Deploying InvoiceFactoring...");
    const InvoiceFactoring = await ethers.getContractFactory("InvoiceFactoring");
    const invoiceFact = await InvoiceFactoring.deploy(kycAddress);
    await invoiceFact.waitForDeployment();
    const invoiceAddress = await invoiceFact.getAddress();
    console.log("✅ InvoiceFactoring:", invoiceAddress);

    // Deploy QRCodePayment
    console.log("\n6. Deploying QRCodePayment...");
    const QRCodePayment = await ethers.getContractFactory("QRCodePayment");
    const qrPayment = await QRCodePayment.deploy();
    await qrPayment.waitForDeployment();
    const qrAddress = await qrPayment.getAddress();
    console.log("✅ QRCodePayment:", qrAddress);

    console.log("\n🎉 All RWA Contracts Deployed!\n");
    console.log("=".repeat(60));
    console.log("KYCRegistry:      ", kycAddress);
    console.log("RWAVault:         ", vaultAddress);
    console.log("RWAToken:         ", tokenAddress);
    console.log("YieldDistributor: ", yieldAddress);
    console.log("InvoiceFactoring: ", invoiceAddress);
    console.log("QRCodePayment:    ", qrAddress);
    console.log("=".repeat(60));

  } catch (error: any) {
    console.error("\n❌ Deployment Error:");
    console.error(error.message);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
