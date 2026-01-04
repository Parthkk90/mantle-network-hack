import { ethers } from "hardhat";
import { VaultManager, BundleFactory, SwapRouter, PaymentScheduler } from "../typechain-types";

async function main() {
  console.log("Starting deployment to Mantle Network...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());
  console.log();

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

  // Deploy QRCodePayment
  console.log("Deploying QRCodePayment...");
  const QRCodePayment = await ethers.getContractFactory("QRCodePayment");
  const qrCodePayment = await QRCodePayment.deploy();
  await qrCodePayment.waitForDeployment();
  const qrCodePaymentAddress = await qrCodePayment.getAddress();
  console.log("QRCodePayment deployed to:", qrCodePaymentAddress);
  console.log();

  console.log("=".repeat(60));
  console.log("Deployment Summary");
  console.log("=".repeat(60));
  console.log("SwapRouter:         ", swapRouterAddress);
  console.log("VaultManager:       ", vaultManagerAddress);
  console.log("BundleFactory:      ", bundleFactoryAddress);
  console.log("PaymentScheduler:   ", paymentSchedulerAddress);
  console.log("PaymentProcessor:   ", paymentProcessorAddress);
  console.log("QRCodePayment:      ", qrCodePaymentAddress);
  console.log("=".repeat(60));
  console.log();

  console.log("✅ All contracts deployed successfully!");
  console.log();
  console.log("Next steps:");
  console.log("1. Verify contracts on Mantlescan");
  console.log("2. Configure SwapRouter with Mantle DEXs");
  console.log("3. Set up keeper for PaymentScheduler");
  console.log("4. Update frontend with contract addresses");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
