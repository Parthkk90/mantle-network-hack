/**
 * Alternative: Bridge from Sepolia ETH (easier to get) to Mantle Testnet
 * Many developers have Sepolia ETH from other projects
 */

const { ethers } = require('ethers');
require('dotenv').config();

const MANTLE_BRIDGE_ADDRESS = '0x676A795fe6E43C17c668de16730c3F690FEB7120'; // Testnet bridge
const YOUR_ADDRESS = '0x50921Cd1D05a3C7C95B75C6fa1008761C59eb85d';

async function bridgeFromSepolia() {
    console.log('🌉 Bridging from Sepolia to Mantle Testnet\n');
    
    // Check if user has Sepolia ETH
    const sepoliaProvider = new ethers.JsonRpcProvider('https://rpc.sepolia.org');
    
    try {
        const balance = await sepoliaProvider.getBalance(YOUR_ADDRESS);
        const eth = ethers.formatEther(balance);
        
        console.log(`Sepolia ETH Balance: ${eth} ETH`);
        
        if (parseFloat(eth) > 0.01) {
            console.log('\n✅ You have Sepolia ETH!');
            console.log('\n📍 BRIDGE INSTRUCTIONS:');
            console.log('1. Visit: https://bridge.testnet.mantle.xyz/');
            console.log('2. Connect your wallet');
            console.log('3. Bridge 0.01 ETH from Sepolia → Mantle Testnet');
            console.log('4. Wait 5-10 minutes');
            console.log('5. You\'ll receive MNT on Mantle Testnet\n');
            
            console.log('Or use this direct link:');
            console.log(`https://bridge.testnet.mantle.xyz/?from=sepolia&to=mantle&amount=0.01`);
        } else {
            console.log('\n❌ No Sepolia ETH. Get some from:');
            console.log('- https://sepoliafaucet.com/');
            console.log('- https://www.infura.io/faucet/sepolia');
            console.log('- https://faucet.quicknode.com/ethereum/sepolia');
        }
    } catch (error) {
        console.error('Error checking Sepolia balance:', error.message);
    }
}

async function checkMantleBalance() {
    const mantleProvider = new ethers.JsonRpcProvider('https://rpc.testnet.mantle.xyz');
    
    try {
        const balance = await mantleProvider.getBalance(YOUR_ADDRESS);
        const mnt = ethers.formatEther(balance);
        
        console.log(`\n💰 Mantle Testnet Balance: ${mnt} MNT`);
        
        if (parseFloat(mnt) > 0) {
            console.log('✅ Ready to deploy!\n');
            return true;
        }
    } catch (error) {
        console.error('Error checking Mantle balance:', error.message);
    }
    
    return false;
}

async function main() {
    console.log('🔄 Alternative Funding via Bridge\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Check current Mantle balance
    const hasFunds = await checkMantleBalance();
    
    if (!hasFunds) {
        // Check Sepolia balance and provide bridge instructions
        await bridgeFromSepolia();
    }
}

main().catch(console.error);
