import { ethers } from "hardhat";

async function main() {
  const address = "0x50921Cd1D05a3C7C95B75C6fa1008761C59eb85d";
  
  console.log("Checking MNT balance for:", address);
  console.log("=".repeat(60));
  
  // Get provider
  const provider = ethers.provider;
  
  // Get network info
  const network = await provider.getNetwork();
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId.toString());
  console.log();
  
  // Get native MNT balance
  const balance = await provider.getBalance(address);
  const balanceInMNT = ethers.formatEther(balance);
  
  console.log("Native MNT Balance:");
  console.log("  Raw:", balance.toString(), "wei");
  console.log("  Formatted:", balanceInMNT, "MNT");
  console.log();
  
  // Get transaction count
  const txCount = await provider.getTransactionCount(address);
  console.log("Transaction Count:", txCount);
  console.log();
  
  console.log("=".repeat(60));
  console.log("✅ Balance check complete!");
  
  // Explorer link
  if (network.chainId === 5000n) {
    console.log("View on Explorer: https://mantlescan.xyz/address/" + address);
  } else if (network.chainId === 5003n) {
    console.log("View on Explorer: https://sepolia.mantlescan.xyz/address/" + address);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
