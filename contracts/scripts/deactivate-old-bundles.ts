import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deactivating old single-token bundles with account:", deployer.address);

  const BUNDLE_FACTORY_ADDRESS = "0xA3Eb8B3df5963ae6798321f8cf8087804Ca5e6Ad";
  
  // Old bundles to deactivate (first 10 single-token bundles)
  const oldBundles = [
    "0xfe8536AB3aC49208c605c4C33F840A2ff8dA2Fcc", // Test MNT Bundle (old factory)
    "0x0b21EC9509AbFBf9BB096E38F96C90AFd4a32305", // Test MNT Bundle v2 (old factory)
    "0x595F1bf16770f16ce91f9046D1044EDA0a989506", // MNT Bundle v3 (old factory)
    "0x990F8FD2682dAaaA7835109011036Cb3f18dAa31", // MNT Bundle v3 (100% WMNT)
    "0x6311Ae98163aeCBE751d5DEbb2428b772D69dc71", // Conservative Growth (100% WMNT)
    "0xE2FeD4dce47D9069e2E6C3F22c5C544A062b7DB5", // Conservative Growth (100% WMNT)
    "0xCD9045d9A80Fa2F160B17E98f1fBdc41189BeD57", // Balanced Portfolio (100% WMNT)
    "0xf60Cd6874cD1f2F8fe302CA724Af0B7Bf8215346", // Aggressive Growth (100% WMNT)
    "0x2c4591e889E1dC55067e14B5043D5cc4dAD03F51", // DeFi Yield Maximizer (100% WMNT)
  ];

  const bundleFactory = await ethers.getContractAt("BundleFactory", BUNDLE_FACTORY_ADDRESS);

  console.log(`\n🗑️  Deactivating ${oldBundles.length} old bundles...\n`);

  let deactivatedCount = 0;
  let skippedCount = 0;

  for (const bundleAddress of oldBundles) {
    try {
      // Check if bundle exists and is active
      const bundleInfo = await bundleFactory.bundles(bundleAddress);
      
      if (!bundleInfo.isActive) {
        console.log(`⏭️  ${bundleAddress} - Already inactive`);
        skippedCount++;
        continue;
      }

      console.log(`🔄 Deactivating ${bundleAddress}...`);
      const tx = await bundleFactory.deactivateBundle(bundleAddress);
      await tx.wait();
      console.log(`   ✅ Deactivated successfully\n`);
      deactivatedCount++;

      // Wait a bit between transactions
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error: any) {
      if (error.message.includes("Not bundle creator")) {
        console.log(`⏭️  ${bundleAddress} - Not creator, skipping\n`);
        skippedCount++;
      } else if (error.message.includes("Invalid bundle")) {
        console.log(`⏭️  ${bundleAddress} - Not in current factory, skipping\n`);
        skippedCount++;
      } else {
        console.error(`❌ Failed to deactivate ${bundleAddress}:`, error.message.substring(0, 100));
      }
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 DEACTIVATION SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Deactivated: ${deactivatedCount}`);
  console.log(`⏭️  Skipped: ${skippedCount}`);
  console.log(`📋 Total: ${oldBundles.length}`);
  
  console.log("\n✨ Only the 5 diversified bundles remain active!");
  console.log("Restart the mobile app to see only the new bundles.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
