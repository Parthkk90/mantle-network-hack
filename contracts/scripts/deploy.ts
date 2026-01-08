import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🚀 Starting CRESCA Deployment to Mantle Network...\n");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("📋 Deployment Details:");
  console.log("  Network:", network.name);
  console.log("  Chain ID:", network.chainId.toString());
  console.log("  Deployer:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("  Balance:", ethers.formatEther(balance), "MNT");
  
  if (balance === 0n) {
    console.error("\n❌ ERROR: Insufficient balance!");
    console.log("Get testnet MNT from: https://faucet.sepolia.mantle.xyz");
    process.exit(1);
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("📦 Deploying Core CRESCA Contracts (6 contracts)");
  console.log("=".repeat(60) + "\n");

  // Deploy SwapRouter (placeholder - will be integrated with Mantle DEXs)
  console.log("Deploying SwapRouter...");
  const SwapRouter = await ethers.getContractFactory("SwapRouter");
  const swapRouter = await SwapRouter.deploy();
  await swapRouter.waitForDeployment();
  const swapRouterAddress = await swapRouter.getAddress();
  console.log("SwapRouter deployed to:", swapRouterAddress);
  console.log();

  // Deploy VaultManager
  console.log("Deploying VaultManager...");
  const VaultManager = await ethers.getContractFactory("VaultManager");
  const vaultManager = await VaultManager.deploy(swapRouterAddress);
  await vaultManager.waitForDeployment();
  const vaultManagerAddress = await vaultManager.getAddress();
  console.log("VaultManager deployed to:", vaultManagerAddress);
  console.log();

  // Deploy BundleFactory
  console.log("Deploying BundleFactory...");
  const BundleFactory = await ethers.getContractFactory("BundleFactory");
  const bundleFactory = await BundleFactory.deploy(vaultManagerAddress);
  await bundleFactory.waitForDeployment();
  const bundleFactoryAddress = await bundleFactory.getAddress();
  console.log("BundleFactory deployed to:", bundleFactoryAddress);
  console.log();

  // Deploy PaymentScheduler
  console.log("Deploying PaymentScheduler...");
  const PaymentScheduler = await ethers.getContractFactory("PaymentScheduler");
  const paymentScheduler = await PaymentScheduler.deploy();
  await paymentScheduler.waitForDeployment();
  const paymentSchedulerAddress = await paymentScheduler.getAddress();
  console.log("PaymentScheduler deployed to:", paymentSchedulerAddress);
  console.log();

  // Deploy PaymentProcessor
  console.log("Deploying PaymentProcessor...");
  const PaymentProcessor = await ethers.getContractFactory("PaymentProcessor");
  const paymentProcessor = await PaymentProcessor.deploy();
  await paymentProcessor.waitForDeployment();
  const paymentProcessorAddress = await paymentProcessor.getAddress();
  console.log("PaymentProcessor deployed to:", paymentProcessorAddress);
  console.log();

  console.log("\n" + "=".repeat(60));
  console.log("📊 Deployment Summary");
  console.log("=".repeat(60));
  
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      SwapRouter: swapRouterAddress,
      VaultManager: vaultManagerAddress,
      BundleFactory: bundleFactoryAddress,
      PaymentScheduler: paymentSchedulerAddress,
      PaymentProcessor: paymentProcessorAddress
    }
  };
  
  console.log("SwapRouter:         ", swapRouterAddress);
  console.log("VaultManager:       ", vaultManagerAddress);
  console.log("BundleFactory:      ", bundleFactoryAddress);
  console.log("PaymentScheduler:   ", paymentSchedulerAddress);
  console.log("PaymentProcessor:   ", paymentProcessorAddress);
  console.log("=".repeat(60));
  
  // Save deployment info to file
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const filename = `${network.name}-${Date.now()}.json`;
  const filepath = path.join(deploymentsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\n💾 Deployment info saved to:", filepath);
  console.log("\n✅ All 6 core contracts deployed successfully!");
  
  console.log("\n📋 Next Steps:");
  console.log("1. Verify contracts:");
  console.log("   npx hardhat verify --network mantleSepolia", swapRouterAddress);
  console.log("   npx hardhat verify --network mantleSepolia", vaultManagerAddress, swapRouterAddress);
  console.log("   npx hardhat verify --network mantleSepolia", bundleFactoryAddress, vaultManagerAddress);
  console.log("   npx hardhat verify --network mantleSepolia", paymentSchedulerAddress);
  console.log("   npx hardhat verify --network mantleSepolia", paymentProcessorAddress);
  console.log("\n2. View on Explorer:");
  if (network.chainId === 5003n) {
    console.log("   https://sepolia.mantlescan.xyz/address/" + bundleFactoryAddress);
  } else if (network.chainId === 5000n) {
    console.log("   https://mantlescan.xyz/address/" + bundleFactoryAddress);
  }
  console.log("\n3. Update frontend with contract addresses");
  console.log("4. Test creating bundles on testnet");
  console.log("\n🎉 CRESCA is ready to use!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
