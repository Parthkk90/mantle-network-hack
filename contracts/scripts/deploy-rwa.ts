import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying CRESCA RWA / RealFi Contracts to Mantle Network...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "MNT\n");

  // ============================================
  // 1. Deploy KYC Registry
  // ============================================
  console.log("📋 Deploying KYCRegistry...");
  const KYCRegistry = await ethers.getContractFactory("KYCRegistry");
  const kycRegistry = await KYCRegistry.deploy();
  await kycRegistry.waitForDeployment();
  const kycAddress = await kycRegistry.getAddress();
  console.log("✅ KYCRegistry deployed to:", kycAddress, "\n");

  // ============================================
  // 2. Deploy RWA Vault
  // ============================================
  console.log("🏦 Deploying RWAVault...");
  const RWAVault = await ethers.getContractFactory("RWAVault");
  const rwaVault = await RWAVault.deploy();
  await rwaVault.waitForDeployment();
  const vaultAddress = await rwaVault.getAddress();
  console.log("✅ RWAVault deployed to:", vaultAddress, "\n");

  // ============================================
  // 3. Deploy Yield Distributor
  // ============================================
  console.log("💰 Deploying YieldDistributor...");
  const YieldDistributor = await ethers.getContractFactory("YieldDistributor");
  const yieldDistributor = await YieldDistributor.deploy(kycAddress);
  await yieldDistributor.waitForDeployment();
  const distributorAddress = await yieldDistributor.getAddress();
  console.log("✅ YieldDistributor deployed to:", distributorAddress, "\n");

  // ============================================
  // 4. Deploy Invoice Factoring
  // ============================================
  // Using USDC address on Mantle (or deploy mock for testnet)
  const USDC_ADDRESS = "0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9"; // Mantle USDC
  
  console.log("📄 Deploying InvoiceFactoring...");
  const InvoiceFactoring = await ethers.getContractFactory("InvoiceFactoring");
  const invoiceFactoring = await InvoiceFactoring.deploy(kycAddress, USDC_ADDRESS);
  await invoiceFactoring.waitForDeployment();
  const factoringAddress = await invoiceFactoring.getAddress();
  console.log("✅ InvoiceFactoring deployed to:", factoringAddress, "\n");

  // ============================================
  // 5. Deploy Sample RWA Token (Real Estate)
  // ============================================
  console.log("🏠 Deploying Sample RWA Token (Real Estate)...");
  const RWAToken = await ethers.getContractFactory("RWAToken");
  
  const sampleRWA = await RWAToken.deploy(
    "Mantle Tower Apartment 401",
    "RWA-MNTL-401",
    0, // AssetType.REAL_ESTATE
    "401 Mantle Tower, Downtown District",
    50000000, // $500,000 in cents
    "QmSampleLegalDocumentHash123456789", // IPFS hash placeholder
    kycAddress,
    vaultAddress
  );
  await sampleRWA.waitForDeployment();
  const sampleRWAAddress = await sampleRWA.getAddress();
  console.log("✅ Sample RWA Token deployed to:", sampleRWAAddress, "\n");

  // ============================================
  // 6. Configuration
  // ============================================
  console.log("⚙️  Configuring contracts...\n");

  // Grant roles
  console.log("Setting up KYC provider role...");
  const KYC_PROVIDER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("KYC_PROVIDER_ROLE"));
  await kycRegistry.grantRole(KYC_PROVIDER_ROLE, deployer.address);
  console.log("✅ KYC provider role granted\n");

  // Setup sample jurisdictions
  console.log("Setting up jurisdiction rules...");
  await kycRegistry.setJurisdictionRules(
    "US",
    true, // allowed
    0, // no max amount
    2, // KYCTier.INTERMEDIATE
    false // no accreditation required
  );
  console.log("✅ US jurisdiction configured\n");

  // Setup tax withholding
  console.log("Setting up tax withholding (US: 0%)...");
  await yieldDistributor.setTaxWithholding(
    "US",
    0, // 0% for demo
    deployer.address // tax recipient
  );
  console.log("✅ Tax withholding configured\n");

  // ============================================
  // 7. Summary
  // ============================================
  console.log("=" .repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!\n");
  console.log("Contract Addresses:");
  console.log("=" .repeat(60));
  console.log("KYCRegistry:        ", kycAddress);
  console.log("RWAVault:           ", vaultAddress);
  console.log("YieldDistributor:   ", distributorAddress);
  console.log("InvoiceFactoring:   ", factoringAddress);
  console.log("Sample RWA Token:   ", sampleRWAAddress);
  console.log("=" .repeat(60));

  // Save addresses to file
  const deploymentInfo = {
    network: "mantle",
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      kycRegistry: kycAddress,
      rwaVault: vaultAddress,
      yieldDistributor: distributorAddress,
      invoiceFactoring: factoringAddress,
      sampleRWAToken: sampleRWAAddress
    }
  };

  const fs = require("fs");
  fs.writeFileSync(
    "rwa-deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n💾 Deployment info saved to rwa-deployment.json\n");

  // ============================================
  // 8. Verification Instructions
  // ============================================
  console.log("📝 To verify contracts on Mantle Explorer, run:\n");
  console.log(`npx hardhat verify --network mantle ${kycAddress}`);
  console.log(`npx hardhat verify --network mantle ${vaultAddress}`);
  console.log(`npx hardhat verify --network mantle ${distributorAddress} ${kycAddress}`);
  console.log(`npx hardhat verify --network mantle ${factoringAddress} ${kycAddress} ${USDC_ADDRESS}`);
  console.log(`npx hardhat verify --network mantle ${sampleRWAAddress} "Mantle Tower Apartment 401" "RWA-MNTL-401" 0 "401 Mantle Tower, Downtown District" 50000000 "QmSampleLegalDocumentHash123456789" ${kycAddress} ${vaultAddress}\n`);

  console.log("=" .repeat(60));
  console.log("🚀 Ready to tokenize real-world assets on Mantle Network!");
  console.log("=" .repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
