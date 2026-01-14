import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Upgrading bundle with account:", deployer.address);

  const BUNDLE_FACTORY_ADDRESS = "0xd218F93Fd6adE12E7C89F20172aC976ec79bcbA9";
  const OLD_BUNDLE_ADDRESS = "0xfe8536AB3aC49208c605c4C33F840A2ff8dA2Fcc";

  // Get BundleFactory contract
  const bundleFactory = await ethers.getContractAt("BundleFactory", BUNDLE_FACTORY_ADDRESS);

  // Get old bundle details
  const oldBundleInfo = await bundleFactory.bundles(OLD_BUNDLE_ADDRESS);
  console.log("Old bundle info:", {
    name: oldBundleInfo.name,
    symbol: oldBundleInfo.symbol,
    creator: oldBundleInfo.creator,
    isActive: oldBundleInfo.isActive,
  });

  // Get tokens and weights from old bundle
  const oldBundle = await ethers.getContractAt("BundleToken", OLD_BUNDLE_ADDRESS);
  const [tokens, weights] = await oldBundle.getBundleConfig();
  
  // Convert to plain arrays
  const tokenArray = Array.from(tokens);
  const weightArray = Array.from(weights);
  
  console.log("Creating new bundle with same config...");
  console.log("Tokens:", tokenArray);
  console.log("Weights:", weightArray);

  // Create new bundle with updated contract
  const tx = await bundleFactory.createBundle(
    tokenArray,
    weightArray,
    "Test MNT Bundle v2",
    "TMNT2"
  );
  
  console.log("Transaction sent:", tx.hash);
  const receipt = await tx.wait();
  console.log("Transaction confirmed");

  // Get new bundle address from events
  const event = receipt?.logs.find((log: any) => {
    try {
      const parsed = bundleFactory.interface.parseLog(log);
      return parsed?.name === "BundleCreated";
    } catch {
      return false;
    }
  });

  if (event) {
    const parsed = bundleFactory.interface.parseLog(event);
    const newBundleAddress = parsed?.args[0];
    console.log("\n✅ New bundle deployed:", newBundleAddress);
    console.log("\nUpdate BundleService.ts with this address!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
