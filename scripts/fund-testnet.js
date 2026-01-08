/**
 * Mantle Testnet Faucet Script
 * Attempts to get testnet MNT tokens programmatically
 */

const https = require('https');
const http = require('http');

const TARGET_ADDRESS = '0x50921Cd1D05a3C7C95B75C6fa1008761C59eb85d';
const RPC_URL = 'https://rpc.testnet.mantle.xyz';

// Method 1: Try Mantle's official faucet API (if available)
async function tryOfficialFaucet() {
    console.log('\n🚰 Attempting Mantle Official Faucet...');
    
    return new Promise((resolve) => {
        const postData = JSON.stringify({
            address: TARGET_ADDRESS
        });

        const options = {
            hostname: 'faucet.testnet.mantle.xyz',
            port: 443,
            path: '/api/claim',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': postData.length,
                'User-Agent': 'Mozilla/5.0'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('✅ Success:', data);
                    resolve(true);
                } else {
                    console.log(`❌ Failed (${res.statusCode}):`, data);
                    resolve(false);
                }
            });
        });

        req.on('error', (e) => {
            console.log('❌ Error:', e.message);
            resolve(false);
        });

        req.write(postData);
        req.end();
    });
}

// Method 2: Try alternative Mantle faucets
async function tryAlternativeFaucets() {
    console.log('\n🌊 Trying Alternative Faucets...');
    
    const faucets = [
        {
            name: 'Mantle Faucet V2',
            url: 'https://faucet.testnet.mantle.xyz/api/drip',
            method: 'POST',
            body: { wallet: TARGET_ADDRESS }
        },
        {
            name: 'QuickNode Faucet',
            url: 'https://faucet.quicknode.com/mantle/testnet',
            method: 'POST',
            body: { address: TARGET_ADDRESS }
        }
    ];

    for (const faucet of faucets) {
        console.log(`\n📍 Trying ${faucet.name}...`);
        try {
            const result = await fetch(faucet.url, {
                method: faucet.method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(faucet.body)
            }).catch(() => null);
            
            if (result && result.ok) {
                const data = await result.json();
                console.log('✅ Success:', data);
                return true;
            }
        } catch (e) {
            console.log('❌ Failed:', e.message);
        }
    }
    
    return false;
}

// Method 3: Check current balance
async function checkBalance() {
    console.log('\n💰 Checking Current Balance...');
    
    const postData = JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [TARGET_ADDRESS, 'latest'],
        id: 1
    });

    return new Promise((resolve) => {
        const options = {
            hostname: 'rpc.testnet.mantle.xyz',
            port: 443,
            path: '/',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': postData.length
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    const balance = BigInt(response.result);
                    const mnt = Number(balance) / 1e18;
                    console.log(`📊 Balance: ${mnt} MNT (${response.result} wei)`);
                    resolve(mnt > 0);
                } catch (e) {
                    console.log('❌ Error checking balance:', e.message);
                    resolve(false);
                }
            });
        });

        req.on('error', (e) => {
            console.log('❌ Error:', e.message);
            resolve(false);
        });

        req.write(postData);
        req.end();
    });
}

// Method 4: Generate curl commands for manual use
function printManualCommands() {
    console.log('\n📝 MANUAL FAUCET COMMANDS:');
    console.log('\n1️⃣ Using curl (try this in terminal):');
    console.log(`
curl -X POST https://faucet.testnet.mantle.xyz/api/claim \\
  -H "Content-Type: application/json" \\
  -d '{"address":"${TARGET_ADDRESS}"}'
    `.trim());
    
    console.log('\n2️⃣ Alternative API endpoint:');
    console.log(`
curl -X POST https://faucet.testnet.mantle.xyz/api/drip \\
  -H "Content-Type: application/json" \\
  -d '{"wallet":"${TARGET_ADDRESS}"}'
    `.trim());
    
    console.log('\n3️⃣ Using PowerShell:');
    console.log(`
Invoke-RestMethod -Uri "https://faucet.testnet.mantle.xyz/api/claim" \`
  -Method POST \`
  -ContentType "application/json" \`
  -Body '{"address":"${TARGET_ADDRESS}"}'
    `.trim());
}

// Method 5: Community request template
function printCommunityRequest() {
    console.log('\n💬 COMMUNITY REQUEST (Copy & Paste):');
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🙏 Requesting Mantle Testnet Tokens

Address: ${TARGET_ADDRESS}
Network: Mantle Testnet (ChainID 5001)
Amount Needed: 1-5 MNT (for testing)

Reason: Testing DeFi contracts for hackathon
Will return favor! 🤝
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Post this in:
- Mantle Discord: https://discord.gg/0xMantle
- Mantle Telegram: https://t.me/mantlenetwork  
- Twitter: @0xMantle with #MantleTestnet
    `.trim());
}

// Main execution
async function main() {
    console.log('🚀 Mantle Testnet Funding Script');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Target Address: ${TARGET_ADDRESS}`);
    console.log(`Network: Mantle Testnet (ChainID 5001)`);
    
    // Check current balance first
    const hasBalance = await checkBalance();
    
    if (hasBalance) {
        console.log('\n✅ You already have funds! Ready to deploy.');
        return;
    }
    
    // Try official faucet
    let success = await tryOfficialFaucet();
    
    if (!success) {
        // Try alternatives
        success = await tryAlternativeFaucets();
    }
    
    if (!success) {
        console.log('\n⚠️  Automatic funding failed. Try these options:\n');
        printManualCommands();
        printCommunityRequest();
        
        console.log('\n🌐 DIRECT FAUCET LINKS:');
        console.log('1. https://faucet.testnet.mantle.xyz/');
        console.log('2. https://www.l2faucet.com/mantle');
        console.log('3. https://faucets.chain.link/mantle-testnet');
    } else {
        console.log('\n✅ Funding successful! Checking balance...');
        setTimeout(() => checkBalance(), 5000);
    }
}

main().catch(console.error);
