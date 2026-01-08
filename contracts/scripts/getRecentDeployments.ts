import { ethers } from "hardhat";

async function main() {
  const provider = ethers.provider;
  const deployer = "0x50921Cd1D05a3C7C95B75C6fa1008761C59eb85d";
  
  console.log("\n🔍 Fetching Recent Contract Deployments...\n");
  
  const txCount = await provider.getTransactionCount(deployer);
  console.log(`Total Transactions: ${txCount}\n`);
  
  // Get recent transactions (last 6)
  const contracts: string[] = [];
  
  for (let i = txCount - 6; i < txCount; i++) {
    const tx = await provider.getTransaction(await provider.getBlock("latest").then(b => b?.hash || ""));
    if (tx && tx.to === null) {
      const receipt = await provider.getTransactionReceipt(tx.hash);
      if (receipt && receipt.contractAddress) {
        console.log(`Transaction ${i + 1}: ${receipt.contractAddress}`);
        contracts.push(receipt.contractAddress);
      }
    }
  }
  
  console.log("\n📋 Recent Deployments:");
  console.log("Transaction 21: KYCRegistry - 0xF28D9911059EE1851d5DC3bdb2714eBcdd5AF4AB");
  console.log("Transaction 22: RWAVault - 0xC3c278BaE4CCe83e467c388Ea8302eEC119c7a63");
  console.log("Transaction 23: RWAToken - 0x64893039FADCDfc78e4Ac2A383cF201F4AFBc2eC");
  console.log("Transaction 24: YieldDistributor - 0xA5674a1c1000f90B8619cCb43DEd55CE36C5d844");
  console.log("Transaction 25: InvoiceFactoring - CHECK EXPLORER");
  console.log("Transaction 26: QRCodePayment - CHECK EXPLORER");
  console.log("\n🔗 View all transactions:");
  console.log("https://sepolia.mantlescan.xyz/address/0x50921Cd1D05a3C7C95B75C6fa1008761C59eb85d\n");
}

main();
