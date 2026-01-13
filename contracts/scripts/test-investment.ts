import { ethers } from "hardhat";

async function main() {
  console.log("Testing investment in bundle...");

  const [deployer] = await ethers.getSigners();
  console.log("Investing with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "MNT");

  const BUNDLE_FACTORY_ADDRESS = "0xd218F93Fd6adE12E7C89F20172aC976ec79bcbA9";
  const BUNDLE_TOKEN_ADDRESS = "0xfe8536AB3aC49208c605c4C33F840A2ff8dA2Fcc";

  // Get BundleFactory contract
  const bundleFactory = await ethers.getContractAt("BundleFactory", BUNDLE_FACTORY_ADDRESS);

  // Investment amount: 1 MNT
  const amount = ethers.parseEther("1.0");

  console.log("\n💰 Investing in bundle:");
  console.log("- Bundle:", BUNDLE_TOKEN_ADDRESS);
  console.log("- Amount:", ethers.formatEther(amount), "MNT");

  const tx = await bundleFactory.investInBundle(BUNDLE_TOKEN_ADDRESS, amount, {
    value: amount,
  });
  console.log("\n📤 Transaction sent:", tx.hash);
  
  await tx.wait();
  console.log("✅ Investment successful!");

  // Check investment
  const investment = await bundleFactory.getUserInvestment(BUNDLE_TOKEN_ADDRESS, deployer.address);
  console.log("\n📊 Your investment:", ethers.formatEther(investment), "MNT");

  console.log("\n✅ Test complete! Investment function is working.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
