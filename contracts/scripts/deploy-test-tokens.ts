import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying test tokens with account:", deployer.address);

  // Deploy mock tokens for testing
  const tokens = [
    { name: "Wrapped Bitcoin", symbol: "WBTC", decimals: 8 },
    { name: "Wrapped Ethereum", symbol: "WETH", decimals: 18 },
    { name: "USD Coin", symbol: "USDC", decimals: 6 },
    { name: "Tether USD", symbol: "USDT", decimals: 6 },
  ];

  const deployedTokens = [];

  for (const token of tokens) {
    console.log(`\n📝 Deploying ${token.name} (${token.symbol})...`);
    
    const Token = await ethers.getContractFactory("MockERC20");
    const tokenContract = await Token.deploy(
      token.name,
      token.symbol,
      token.decimals
    );
    
    await tokenContract.waitForDeployment();
    const address = await tokenContract.getAddress();
    
    console.log(`   ✅ ${token.symbol} deployed at: ${address}`);
    
    // Mint some tokens to deployer for testing
    const mintAmount = ethers.parseUnits("1000000", token.decimals);
    await tokenContract.mint(deployer.address, mintAmount);
    console.log(`   💰 Minted ${ethers.formatUnits(mintAmount, token.decimals)} ${token.symbol}`);
    
    deployedTokens.push({
      name: token.name,
      symbol: token.symbol,
      address: address,
    });
  }

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("📊 TEST TOKENS DEPLOYED");
  console.log("=".repeat(70));
  
  deployedTokens.forEach((token) => {
    console.log(`${token.symbol.padEnd(6)} - ${token.address}`);
  });
  
  console.log("\n✅ All tokens deployed successfully!");
  console.log("\nAdd WMNT address: 0x6fe0A990936C4ceAb46f8f2BfDDF02CfE2129Ff8");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
