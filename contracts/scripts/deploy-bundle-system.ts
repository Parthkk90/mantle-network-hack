import { ethers } from "hardhat";

async function main() {
  console.log("Deploying complete bundle system with investment support...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "MNT");

  // Get SwapRouter address
  const SWAP_ROUTER_ADDRESS = "0xBC4a342B0c057501E081484A2d24e576E854F823";

  console.log("\n1. Deploying VaultManager...");
  const VaultManager = await ethers.getContractFactory("VaultManager");
  const vaultManager = await VaultManager.deploy(SWAP_ROUTER_ADDRESS);
  await vaultManager.waitForDeployment();
  const vaultManagerAddress = await vaultManager.getAddress();
  console.log("✅ VaultManager deployed at:", vaultManagerAddress);

  console.log("\n2. Deploying BundleFactory...");
  const BundleFactory = await ethers.getContractFactory("BundleFactory");
  const bundleFactory = await BundleFactory.deploy(vaultManagerAddress);
  await bundleFactory.waitForDeployment();
  const bundleFactoryAddress = await bundleFactory.getAddress();
  console.log("✅ BundleFactory deployed at:", bundleFactoryAddress);

  console.log("\n3. Configuring VaultManager...");
  const tx = await vaultManager.setBundleFactory(bundleFactoryAddress);
  await tx.wait();
  console.log("✅ VaultManager configured with BundleFactory");

  console.log("\n📋 Deployment Summary:");
  console.log("=".repeat(60));
  console.log("VaultManager:    ", vaultManagerAddress);
  console.log("BundleFactory:   ", bundleFactoryAddress);
  console.log("SwapRouter:      ", SWAP_ROUTER_ADDRESS);
  console.log("=".repeat(60));

  console.log("\n⚠️  Update cresca-app/src/services/BundleService.ts:");
  console.log(`const BUNDLE_FACTORY_ADDRESS = '${bundleFactoryAddress}';`);
  console.log(`const VAULT_MANAGER_ADDRESS = '${vaultManagerAddress}';`);

  console.log("\n✅ Deployment complete! You can now invest in bundles with MNT.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
