// Deploy PaymentScheduler Contract
import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
  console.log("🚀 Deploying PaymentScheduler contract...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "MNT\n");

  if (balance === 0n) {
    console.error("❌ Account has no balance! Get MNT from faucet first.");
    process.exit(1);
  }

  // Deploy PaymentScheduler
  console.log("⏳ Deploying PaymentScheduler...");
  const PaymentScheduler = await ethers.getContractFactory("PaymentScheduler");
  const paymentScheduler = await PaymentScheduler.deploy();
  
  await paymentScheduler.waitForDeployment();
  const address = await paymentScheduler.getAddress();

  console.log("✅ PaymentScheduler deployed to:", address);
  console.log("");

  // Verify deployer is keeper
  const isKeeper = await paymentScheduler.isKeeper(deployer.address);
  console.log("🔐 Deployer is keeper:", isKeeper);

  // Add keeper address if provided
  const keeperAddress = "0x50921Cd1D05a3C7C95B75C6fa1008761C59eb85d";
  if (keeperAddress && keeperAddress !== deployer.address) {
    console.log("\n⏳ Adding keeper address:", keeperAddress);
    const tx = await paymentScheduler.addKeeper(keeperAddress);
    await tx.wait();
    console.log("✅ Keeper added successfully");
  }

  console.log("\n" + "═".repeat(70));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("═".repeat(70));
  console.log("Contract Address:", address);
  console.log("Deployer:", deployer.address);
  console.log("Keeper:", keeperAddress);
  console.log("Block Explorer:", `https://sepolia.mantlescan.xyz/address/${address}`);
  console.log("═".repeat(70));

  console.log("\n📝 Next steps:");
  console.log("1. Update keeper/.env:");
  console.log(`   PAYMENT_SCHEDULER_ADDRESS=${address}`);
  console.log("\n2. Update cresca-app/src/services/PaymentSchedulerService.ts:");
  console.log(`   const PAYMENT_SCHEDULER_ADDRESS = '${address}';`);
  console.log("\n3. Start keeper service:");
  console.log("   cd keeper && npm start");

  // Save deployment info
  const deploymentInfo = {
    contractAddress: address,
    deployer: deployer.address,
    keeper: keeperAddress,
    deployedAt: new Date().toISOString(),
    blockExplorer: `https://sepolia.mantlescan.xyz/address/${address}`,
  };

  fs.writeFileSync(
    'deployment-info.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n💾 Deployment info saved to: deployment-info.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
