import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("\n🚀 Starting RWA Contracts Deployment to Mantle Network...\n");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("📋 Deployment Details:");
  console.log(`  Network: ${network.name}`);
  console.log(`  Chain ID: ${network.chainId}`);
  console.log(`  Deployer: ${deployer.address}`);
  console.log(`  Balance: ${ethers.formatEther(balance)} MNT\n`);

  console.log("============================================================");
  console.log("📦 Deploying RWA Contracts (6 contracts)");
  console.log("============================================================\n");

  const contracts: { [key: string]: string } = {};

  // 1. Deploy KYCRegistry (standalone)
  console.log("Deploying KYCRegistry...");
  const KYCRegistry = await ethers.getContractFactory("KYCRegistry");
  const kycRegistry = await KYCRegistry.deploy();
  await kycRegistry.waitForDeployment();
  contracts.KYCRegistry = await kycRegistry.getAddress();
  console.log(`✅ KYCRegistry deployed at: ${contracts.KYCRegistry}\n`);

  // 2. Deploy RWAVault (deploy before RWAToken)
  console.log("Deploying RWAVault...");
  const RWAVault = await ethers.getContractFactory("RWAVault");
  const rwaVault = await RWAVault.deploy();
  await rwaVault.waitForDeployment();
  contracts.RWAVault = await rwaVault.getAddress();
  console.log(`✅ RWAVault deployed at: ${contracts.RWAVault}\n`);

  // 3. Deploy RWAToken (needs KYCRegistry and RWAVault addresses)
  console.log("Deploying RWAToken...");
  const RWAToken = await ethers.getContractFactory("RWAToken");
  const rwaToken = await RWAToken.deploy(
    "Real World Asset Token",
    "RWA",
    0, // AssetType.REAL_ESTATE
    "Sample RWA Asset",
    
    1000000000, // $10M in cents
    "QmSampleHash",
    contracts.KYCRegistry,
    contracts.RWAVault
  );
  await rwaToken.waitForDeployment();
  contracts.RWAToken = await rwaToken.getAddress();
  console.log(`✅ RWAToken deployed at: ${contracts.RWAToken}\n`);

  // 4. Deploy YieldDistributor (needs KYCRegistry)
  console.log("Deploying YieldDistributor...");
  const YieldDistributor = await ethers.getContractFactory("YieldDistributor");
  const yieldDistributor = await YieldDistributor.deploy(contracts.KYCRegistry);
  await yieldDistributor.waitForDeployment();
  contracts.YieldDistributor = await yieldDistributor.getAddress();
  console.log(`✅ YieldDistributor deployed at: ${contracts.YieldDistributor}\n`);

  // 5. Deploy InvoiceFactoring (needs KYCRegistry)
  console.log("Deploying InvoiceFactoring...");
  const InvoiceFactoring = await ethers.getContractFactory("InvoiceFactoring");
  const invoiceFactoring = await InvoiceFactoring.deploy(contracts.KYCRegistry);
  await invoiceFactoring.waitForDeployment();
  contracts.InvoiceFactoring = await invoiceFactoring.getAddress();
  console.log(`✅ InvoiceFactoring deployed at: ${contracts.InvoiceFactoring}\n`);

  // 6. Deploy QRCodePayment (standalone utility)
  console.log("Deploying QRCodePayment...");
  const QRCodePayment = await ethers.getContractFactory("QRCodePayment");
  const qrCodePayment = await QRCodePayment.deploy();
  await qrCodePayment.waitForDeployment();
  contracts.QRCodePayment = await qrCodePayment.getAddress();
  console.log(`✅ QRCodePayment deployed at: ${contracts.QRCodePayment}\n`);

  console.log("============================================================");
  console.log("🎉 All RWA Contracts Deployed Successfully!");
  console.log("============================================================\n");

  console.log("📝 Contract Addresses:");
  Object.entries(contracts).forEach(([name, address]) => {
    console.log(`  ${name}: ${address}`);
  });

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: contracts,
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = `rwa-${network.name}-${Date.now()}.json`;
  const filepath = path.join(deploymentsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));

  console.log(`\n💾 Deployment info saved to: ${filename}`);
  console.log("\n✨ Deployment Complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
