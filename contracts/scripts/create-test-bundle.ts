import { ethers } from "hardhat";

async function main() {
  console.log("Creating test bundle...");

  const [deployer] = await ethers.getSigners();
  console.log("Creating with account:", deployer.address);

  const BUNDLE_FACTORY_ADDRESS = "0xd218F93Fd6adE12E7C89F20172aC976ec79bcbA9";
  const WMNT_ADDRESS = "0x6fe0A990936C4ceAb46f8f2BfDDF02CfE2129Ff8";

  // Get BundleFactory contract
  const bundleFactory = await ethers.getContractAt("BundleFactory", BUNDLE_FACTORY_ADDRESS);

  // Create a simple bundle with just WMNT (for testing)
  // Using 100% weight (10000 basis points)
  const tokens = [WMNT_ADDRESS];
  const weights = [10000]; // 100%
  const name = "Test MNT Bundle";
  const symbol = "TMNT";

  console.log("\nCreating bundle:");
  console.log("- Name:", name);
  console.log("- Symbol:", symbol);
  console.log("- Tokens:", tokens);
  console.log("- Weights:", weights);

  const tx = await bundleFactory.createBundle(tokens, weights, name, symbol);
  console.log("\nTransaction sent:", tx.hash);
  
  const receipt = await tx.wait();
  console.log("✅ Bundle created!");

  // Get the bundle address from the event
  const event = receipt?.logs
    .map((log: any) => {
      try {
        return bundleFactory.interface.parseLog(log);
      } catch (e) {
        return null;
      }
    })
    .find((parsedLog: any) => parsedLog?.name === "BundleCreated");

  if (event) {
    console.log("\n📦 Bundle Token Address:", event.args.bundleToken);
  }

  // Get all bundles
  const allBundles = await bundleFactory.getAllBundles();
  console.log("\n📋 All bundles:", allBundles);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
