import { ethers } from 'hardhat';

async function main() {
  console.log('🚀 Deploying WrappedMNT (WMNT)...\n');

  const [deployer] = await ethers.getSigners();
  console.log('Deploying with account:', deployer.address);
  console.log('Account balance:', (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy WrappedMNT
  const WrappedMNT = await ethers.getContractFactory('WrappedMNT');
  const wmnt = await WrappedMNT.deploy();
  await wmnt.waitForDeployment();

  const wmntAddress = await wmnt.getAddress();
  console.log('\n✅ WrappedMNT deployed to:', wmntAddress);

  // Mint some test tokens to deployer
  const mintAmount = ethers.parseEther('1000');
  console.log('\n🪙 Minting 1000 WMNT to deployer...');
  const mintTx = await wmnt.mint(deployer.address, mintAmount);
  await mintTx.wait();
  console.log('✅ Minted 1000 WMNT');

  const balance = await wmnt.balanceOf(deployer.address);
  console.log('Deployer WMNT balance:', ethers.formatEther(balance));

  console.log('\n📝 Contract Details:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('WrappedMNT (WMNT):', wmntAddress);
  console.log('Name:', await wmnt.name());
  console.log('Symbol:', await wmnt.symbol());
  console.log('Decimals:', await wmnt.decimals());
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  console.log('\n🔗 Verify on Explorer:');
  console.log(`https://sepolia.mantlescan.xyz/address/${wmntAddress}`);

  console.log('\n✅ Deployment complete!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
