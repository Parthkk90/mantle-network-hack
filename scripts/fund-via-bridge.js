/**
 * Get Mantle Testnet MNT - Simple Version
 */

const { ethers } = require('ethers');
require('dotenv').config();

const YOUR_ADDRESS = process.env.WALLET_ADDRESS || '0x50921Cd1D05a3C7C95B75C6fa1008761C59eb85d';

async function checkMantleBalance() {
    const provider = new ethers.JsonRpcProvider('https://rpc.sepolia.mantle.xyz');
    
    try {
        const balance = await provider.getBalance(YOUR_ADDRESS);
        const mnt = ethers.formatEther(balance);
        
        console.log(`\n💰 Mantle Testnet Balance: ${mnt} MNT`);
        return parseFloat(mnt) > 0.01;
    } catch (error) {
        console.error('Error:', error.message);
        return false;
    }
}

async function main() {
    console.log('🔄 Get Mantle Testnet MNT\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const hasFunds = await checkMantleBalance();
    
    if (!hasFunds) {
        console.log('\n📍 GET MNT FROM FAUCET:');
        console.log('1. Visit: https://faucet.sepolia.mantle.xyz/');
        console.log('2. Enter your address:', YOUR_ADDRESS);
        console.log('3. Click "Request MNT"');
        console.log('4. Wait 30 seconds\n');
        
        console.log('Alternative faucets:');
        console.log('- https://faucet.quicknode.com/mantle/sepolia');
        console.log('- https://thirdweb.com/mantle-sepolia-testnet/faucet\n');
    } else {
        console.log('✅ You have MNT! Ready to build.\n');
    }
}

main().catch(console.error);
