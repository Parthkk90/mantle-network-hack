import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("\n🚀 Deploying Final 2 RWA Contracts\n");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(balance)} MNT\n`);

  const contracts: { [key: string]: string } = {};

  // Use the previously deployed KYCRegistry and RWAToken addresses
  const kycRegistryAddress = "0xF28D9911059EE1851d5DC3bdb2714eBcdd5AF4AB";
  const rwaTokenAddress = "0x64893039FADCDfc78e4Ac2A383cF201F4AFBc2eC";

  // 1. Deploy InvoiceFactoring (needs KYC registry + liquidity token)
  console.log("5/6 Deploying InvoiceFactoring...");
  const InvoiceFactoring = await ethers.getContractFactory("InvoiceFactoring");
  const invoiceFactoring = await InvoiceFactoring.deploy(
    kycRegistryAddress,
    rwaTokenAddress // Use RWAToken as liquidity token
  );
  await invoiceFactoring.waitForDeployment();
  contracts.InvoiceFactoring = await invoiceFactoring.getAddress();
  console.log(`✅ InvoiceFactoring deployed at: ${contracts.InvoiceFactoring}\n`);

  // 2. Deploy QRCodePayment (standalone utility)
  console.log("6/6 Deploying QRCodePayment...");
  const QRCodePayment = await ethers.getContractFactory("QRCodePayment");
  const qrCodePayment = await QRCodePayment.deploy();
  await qrCodePayment.waitForDeployment();
  contracts.QRCodePayment = await qrCodePayment.getAddress();
  console.log(`✅ QRCodePayment deployed at: ${contracts.QRCodePayment}\n`);

  console.log("============================================================");
  console.log("🎉 Final 2 RWA Contracts Deployed Successfully!");
  console.log("============================================================\n");

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

  const filename = `rwa-final-${network.name}-${Date.now()}.json`;
  const filepath = path.join(deploymentsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));

  console.log(`💾 Deployment info saved to: ${filename}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
