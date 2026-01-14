import { ethers } from "hardhat";

async function main() {
  const BUNDLE_ADDRESS = "0x990F8FD2682dAaaA7835109011036Cb3f18dAa31";

  console.log("Testing bundle at:", BUNDLE_ADDRESS);
  
  const bundle = await ethers.getContractAt("BundleToken", BUNDLE_ADDRESS);
  
  // Test getTokens()
  console.log("\nTesting getTokens()...");
  const tokens = await bundle.getTokens();
  console.log("Tokens:", tokens);
  
  // Test getWeights()
  console.log("\nTesting getWeights()...");
  const weights = await bundle.getWeights();
  console.log("Weights:", weights);
  
  // Test totalSupply()
  console.log("\nTesting totalSupply()...");
  const totalSupply = await bundle.totalSupply();
  console.log("Total Supply:", ethers.formatEther(totalSupply), "TMNT2");
  
  // Test name and symbol
  const name = await bundle.name();
  const symbol = await bundle.symbol();
  console.log("\nBundle Details:");
  console.log("  Name:", name);
  console.log("  Symbol:", symbol);
  
  console.log("\n✅ All functions working!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
