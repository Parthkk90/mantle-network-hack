import { ethers } from "hardhat";

/**
 * Deployment script for Cresca Basket Trading and Payment Scheduling
 * Non-RWA features only
 */

async function main() {
  console.log("🚀 Deploying CRESCA Basket Trading & Payment Contracts to Mantle Network...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "MNT\n");

  // ============================================
  // 1. Deploy VaultManager
  // ============================================
  console.log("🏦 Deploying VaultManager...");
  
  // Get SwapRouter address from environment or prompt
  let swapRouterAddress = process.env.SWAP_ROUTER_ADDRESS;
  
  if (!swapRouterAddress || swapRouterAddress === "") {
    console.log("⚠️  No SWAP_ROUTER_ADDRESS in .env, deploying SwapRouter first...\n");
    
    // Deploy SwapRouter
    console.log("🔄 Deploying SwapRouter...");
    const SwapRouter = await ethers.getContractFactory("SwapRouter");
    const swapRouter = await SwapRouter.deploy();
    await swapRouter.waitForDeployment();
    swapRouterAddress = await swapRouter.getAddress();
    console.log("✅ SwapRouter deployed to:", swapRouterAddress, "\n");
  } else {
    console.log("Using existing SwapRouter at:", swapRouterAddress, "\n");
  }

  const VaultManager = await ethers.getContractFactory("VaultManager");
  const vaultManager = await VaultManager.deploy(swapRouterAddress);
  await vaultManager.waitForDeployment();
  const vaultAddress = await vaultManager.getAddress();
  console.log("✅ VaultManager deployed to:", vaultAddress, "\n");

  // ============================================
  // 2. Deploy BundleFactory
  // ============================================
  console.log("📦 Deploying BundleFactory...");
  const BundleFactory = await ethers.getContractFactory("BundleFactory");
  const bundleFactory = await BundleFactory.deploy(vaultAddress);
  await bundleFactory.waitForDeployment();
  const factoryAddress = await bundleFactory.getAddress();
  console.log("✅ BundleFactory deployed to:", factoryAddress, "\n");

  // ============================================
  // 3. Deploy PaymentProcessor
  // ============================================
  console.log("💳 Deploying PaymentProcessor...");
  const PaymentProcessor = await ethers.getContractFactory("PaymentProcessor");
  const paymentProcessor = await PaymentProcessor.deploy();
  await paymentProcessor.waitForDeployment();
  const processorAddress = await paymentProcessor.getAddress();
  console.log("✅ PaymentProcessor deployed to:", processorAddress, "\n");

  // ============================================
  // 4. Deploy PaymentScheduler
  // ============================================
  console.log("📅 Deploying PaymentScheduler...");
  const PaymentScheduler = await ethers.getContractFactory("PaymentScheduler");
  const paymentScheduler = await PaymentScheduler.deploy();
  await paymentScheduler.waitForDeployment();
  const schedulerAddress = await paymentScheduler.getAddress();
  console.log("✅ PaymentScheduler deployed to:", schedulerAddress, "\n");

  // ============================================
  // 5. Configuration
  // ============================================
  console.log("⚙️  Configuring contracts...\n");

  // Set minimum investment amount (optional, can be configured later)
  const minInvestment = ethers.parseEther("0.01"); // 0.01 tokens minimum
  console.log("Setting minimum investment amount to:", ethers.formatEther(minInvestment));
  await bundleFactory.setMinInvestmentAmount(minInvestment);
  console.log("✅ Minimum investment configured\n");

  // ============================================
  // 6. Summary
  // ============================================
  console.log("=" .repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!\n");
  console.log("Contract Addresses:");
  console.log("=" .repeat(60));
  console.log("SwapRouter:          ", swapRouterAddress);
  console.log("VaultManager:        ", vaultAddress);
  console.log("BundleFactory:       ", factoryAddress);
  console.log("PaymentProcessor:    ", processorAddress);
  console.log("PaymentScheduler:    ", schedulerAddress);
  console.log("=" .repeat(60));

  // Save addresses to file
  const deploymentInfo = {
    network: process.env.HARDHAT_NETWORK || "unknown",
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      swapRouter: swapRouterAddress,
      vaultManager: vaultAddress,
      bundleFactory: factoryAddress,
      paymentProcessor: processorAddress,
      paymentScheduler: schedulerAddress
    },
    configuration: {
      minInvestment: minInvestment.toString()
    }
  };

  const fs = require("fs");
  const outputPath = "basket-payment-deployment.json";
  fs.writeFileSync(
    outputPath,
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log(`\n💾 Deployment info saved to ${outputPath}\n`);

  // ============================================
  // 7. Verification Instructions
  // ============================================
  console.log("📝 To verify contracts on Mantle Explorer, run:\n");
  console.log(`npx hardhat verify --network ${process.env.HARDHAT_NETWORK || 'mantle'} ${swapRouterAddress}`);
  console.log(`npx hardhat verify --network ${process.env.HARDHAT_NETWORK || 'mantle'} ${vaultAddress} ${swapRouterAddress}`);
  console.log(`npx hardhat verify --network ${process.env.HARDHAT_NETWORK || 'mantle'} ${factoryAddress} ${vaultAddress}`);
  console.log(`npx hardhat verify --network ${process.env.HARDHAT_NETWORK || 'mantle'} ${processorAddress}`);
  console.log(`npx hardhat verify --network ${process.env.HARDHAT_NETWORK || 'mantle'} ${schedulerAddress}\n`);

  console.log("=" .repeat(60));
  console.log("📊 Next Steps:");
  console.log("=" .repeat(60));
  console.log("1. Add DEX routers to SwapRouter (Agni, Merchant Moe, etc.)");
  console.log("2. Create sample bundles for testing");
  console.log("3. Setup payment schedules");
  console.log("4. Integrate with frontend");
  console.log("=" .repeat(60));
  console.log("\n🚀 Ready for basket trading and payment scheduling!");
  console.log("=" .repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
