// Authorize keeper to execute scheduled payments
import { ethers } from "hardhat";

async function main() {
  console.log("🔐 Authorizing Keeper for PaymentScheduler...\n");

  const PAYMENT_SCHEDULER_ADDRESS = "0xfAc3A13b1571A227CF36878fc46E07B56021cd7B";
  const KEEPER_ADDRESS = "0x50921Cd1D05a3C7C95B75C6fa1008761C59eb85d";

  // Get contract
  const paymentScheduler = await ethers.getContractAt("PaymentScheduler", PAYMENT_SCHEDULER_ADDRESS);
  
  // Check current status
  console.log("📋 Checking current status...");
  const isAlreadyKeeper = await paymentScheduler.isKeeper(KEEPER_ADDRESS);
  
  if (isAlreadyKeeper) {
    console.log("✅ Address is already authorized as keeper!");
    console.log(`   Keeper: ${KEEPER_ADDRESS}`);
    return;
  }

  // Add keeper
  console.log(`⏳ Authorizing ${KEEPER_ADDRESS} as keeper...`);
  const tx = await paymentScheduler.addKeeper(KEEPER_ADDRESS);
  console.log(`📤 Transaction sent: ${tx.hash}`);
  
  await tx.wait();
  console.log("✅ Keeper authorized successfully!\n");

  // Verify
  const isKeeper = await paymentScheduler.isKeeper(KEEPER_ADDRESS);
  console.log("🔍 Verification:", isKeeper ? "✅ CONFIRMED" : "❌ FAILED");

  console.log("\n" + "═".repeat(70));
  console.log("📊 KEEPER AUTHORIZATION COMPLETE");
  console.log("═".repeat(70));
  console.log("Contract:", PAYMENT_SCHEDULER_ADDRESS);
  console.log("Keeper:", KEEPER_ADDRESS);
  console.log("═".repeat(70));
  console.log("\n✅ Ready to start keeper service!");
  console.log("   cd keeper && npm start");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Authorization failed:", error);
    process.exit(1);
  });
