import { ethers } from "hardhat";

async function main() {
  console.log("Updating BundleFactory with investment functions...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Get existing VaultManager address
  const VAULT_MANAGER_ADDRESS = "0x12d06098124c6c24E0551c429D996c8958A32083";
  
  console.log("\n1. Deploying new BundleFactory...");
  const BundleFactory = await ethers.getContractFactory("BundleFactory");
  const bundleFactory = await BundleFactory.deploy(VAULT_MANAGER_ADDRESS);
  await bundleFactory.waitForDeployment();
  const bundleFactoryAddress = await bundleFactory.getAddress();
  console.log("✅ New BundleFactory deployed at:", bundleFactoryAddress);

  // Update VaultManager to point to new factory
  console.log("\n2. Updating VaultManager with new factory address...");
  const VaultManager = await ethers.getContractAt("VaultManager", VAULT_MANAGER_ADDRESS);
  
  try {
    const tx = await VaultManager.setBundleFactory(bundleFactoryAddress);
    await tx.wait();
    console.log("✅ VaultManager updated with new factory");
  } catch (error) {
    console.log("Note: setBundleFactory may not exist on current VaultManager");
    console.log("You'll need to redeploy VaultManager or call setBundleFactory manually");
  }

  console.log("\n📋 Deployment Summary:");
  console.log("=".repeat(50));
  console.log("New BundleFactory:", bundleFactoryAddress);
  console.log("VaultManager:", VAULT_MANAGER_ADDRESS);
  console.log("=".repeat(50));

  console.log("\n⚠️  Update cresca-app/src/services/BundleService.ts:");
  console.log(`const BUNDLE_FACTORY_ADDRESS = '${bundleFactoryAddress}';`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
