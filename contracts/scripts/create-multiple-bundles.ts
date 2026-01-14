import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Creating multiple bundles with account:", deployer.address);

  const BUNDLE_FACTORY_ADDRESS = "0xA3Eb8B3df5963ae6798321f8cf8087804Ca5e6Ad";
  const WMNT_ADDRESS = "0x6fe0A990936C4ceAb46f8f2BfDDF02CfE2129Ff8";
  const WBTC_ADDRESS = "0x18801321BAe6aA7FD0C45cdceA2DcFBa320e9A27";
  const WETH_ADDRESS = "0x6D4096ea28CF58C0BA5d4e25792f95Bc54CfFCd0";
  const USDC_ADDRESS = "0xe2a3EF0Bfe32ae98532CA97f2CcebE981F7D5a1F";
  const USDT_ADDRESS = "0x47A3E2eF94bD24a014211fD08e776ED56497E3c7";

  const bundleFactory = await ethers.getContractAt("BundleFactory", BUNDLE_FACTORY_ADDRESS);

  // Get token contracts and approve large amount for all
  console.log("\n🔓 Approving tokens for BundleFactory...");
  const approveAmount = ethers.parseEther("1000000000"); // Large approval
  
  const tokens = [
    { address: WMNT_ADDRESS, symbol: "WMNT" },
    { address: WBTC_ADDRESS, symbol: "WBTC" },
    { address: WETH_ADDRESS, symbol: "WETH" },
    { address: USDC_ADDRESS, symbol: "USDC" },
    { address: USDT_ADDRESS, symbol: "USDT" },
  ];

  for (const token of tokens) {
    const tokenContract = await ethers.getContractAt("MockERC20", token.address);
    const tx = await tokenContract.approve(BUNDLE_FACTORY_ADDRESS, approveAmount);
    await tx.wait();
    console.log(`   ✅ ${token.symbol} approved`);
  }

  console.log("\n📦 Creating diversified bundles...\n");
  const bundleConfigs = [
    {
      tokens: [WBTC_ADDRESS, WETH_ADDRESS, WMNT_ADDRESS],
      weights: [4000, 3500, 2500], // 40% BTC, 35% ETH, 25% MNT
      name: "Blue Chip Portfolio",
      symbol: "BLUE",
    },
    {
      tokens: [USDC_ADDRESS, USDT_ADDRESS, WMNT_ADDRESS],
      weights: [5000, 3000, 2000], // 50% USDC, 30% USDT, 20% MNT
      name: "Stable Income",
      symbol: "STBL",
    },
    {
      tokens: [WBTC_ADDRESS, WETH_ADDRESS, USDC_ADDRESS, WMNT_ADDRESS],
      weights: [3000, 3000, 2500, 1500], // 30% BTC, 30% ETH, 25% USDC, 15% MNT
      name: "Balanced Growth",
      symbol: "GROW",
    },
    {
      tokens: [WBTC_ADDRESS, WETH_ADDRESS, WMNT_ADDRESS],
      weights: [5000, 3000, 2000], // 50% BTC, 30% ETH, 20% MNT
      name: "Aggressive Growth",
      symbol: "AGGR",
    },
    {
      tokens: [WETH_ADDRESS, WMNT_ADDRESS, USDC_ADDRESS],
      weights: [4500, 3500, 2000], // 45% ETH, 35% MNT, 20% USDC
      name: "DeFi Maximizer",
      symbol: "DEFI",
    },
  ];

  const createdBundles = [];

  for (const config of bundleConfigs) {
    try {
      console.log(`\n📦 Creating: ${config.name} (${config.symbol})...`);
      
      const tx = await bundleFactory.createBundle(
        config.tokens,
        config.weights,
        config.name,
        config.symbol
      );
      
      console.log("   Transaction sent:", tx.hash);
      const receipt = await tx.wait();
      
      // Get bundle address from events
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
        const bundleAddress = parsed?.args[0];
        console.log("   ✅ Bundle deployed:", bundleAddress);
        
        createdBundles.push({
          name: config.name,
          symbol: config.symbol,
          address: bundleAddress,
        });
      }
      
      // Wait a bit between deployments
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error: any) {
      console.error(`   ❌ Failed to create ${config.name}:`, error.message);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  
  createdBundles.forEach((bundle, index) => {
    console.log(`${index + 1}. ${bundle.name} (${bundle.symbol})`);
    console.log(`   Address: ${bundle.address}`);
  });
  
  console.log("\n✅ All bundles created successfully!");
  console.log("\nThe app will automatically discover these bundles.");
  console.log("Restart the mobile app to see them in Browse Bundles!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
