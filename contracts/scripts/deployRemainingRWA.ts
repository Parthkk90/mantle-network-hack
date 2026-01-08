import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("\n🚀 Deploying Remaining RWA Contracts\n");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(balance)} MNT\n`);

  // Get addresses from previous deployments
  const kycRegistryAddress = "0xF28D9911059EE1851d5DC3bdb2714eBcdd5AF4AB";
  const rwaTokenAddress = "0x64893039FADCDfc78e4Ac2A383cF201F4AFBc2eC"; // Use RWAToken as liquidity token

  const contracts: { [key: string]: string } = {};

  // 1. Deploy InvoiceFactoring
  console.log("5/6 Deploying InvoiceFactoring...");
  const InvoiceFactoring = await ethers.getContractFactory("InvoiceFactoring");
  const invoiceFactoring = await InvoiceFactoring.deploy(
    kycRegistryAddress,
    rwaTokenAddress
  );
  await invoiceFactoring.waitForDeployment();
  contracts.InvoiceFactoring = await invoiceFactoring.getAddress();
  console.log(`✅ ${contracts.InvoiceFactoring}\n`);

  // 2. Deploy QRCodePayment
  console.log("6/6 Deploying QRCodePayment...");
  const QRCodePayment = await ethers.getContractFactory("QRCodePayment");
  const qrCodePayment = await QRCodePayment.deploy();
  await qrCodePayment.waitForDeployment();
  contracts.QRCodePayment = await qrCodePayment.getAddress();
  console.log(`✅ ${contracts.QRCodePayment}\n`);

  console.log("🎉 All Remaining RWA Contracts Deployed!\n");

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: contracts,
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  const filename = `rwa-remaining-${network.name}-${Date.now()}.json`;
  const filepath = path.join(deploymentsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));

  console.log(`💾 Saved to: ${filename}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
