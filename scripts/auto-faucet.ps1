# PowerShell script to try multiple faucet endpoints
$ADDRESS = "0x50921Cd1D05a3C7C95B75C6fa1008761C59eb85d"

Write-Host ""
Write-Host "Mantle Testnet Auto-Faucet Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check current balance
Write-Host "Checking current balance..." -ForegroundColor Yellow
$balanceBody = @{
    jsonrpc = "2.0"
    method = "eth_getBalance"
    params = @($ADDRESS, "latest")
    id = 1
} | ConvertTo-Json

try {
    $balanceResponse = Invoke-RestMethod -Uri "https://rpc.testnet.mantle.xyz" -Method POST -Body $balanceBody -ContentType "application/json"
    $balance = [bigint]::Parse($balanceResponse.result.Substring(2), 'AllowHexSpecifier')
    $mnt = [decimal]$balance / 1000000000000000000
    Write-Host "Current Balance: $mnt MNT" -ForegroundColor Green
    Write-Host ""
    
    if ($mnt -gt 0) {
        Write-Host "You already have funds! Ready to deploy." -ForegroundColor Green
        Write-Host ""
        exit 0
    }
} catch {
    Write-Host "Could not check balance" -ForegroundColor Yellow
    Write-Host ""
}

# Faucet endpoints to try
$faucets = @(
    @{
        Name = "Official Mantle Faucet"
        Url = "https://faucet.testnet.mantle.xyz/api/claim"
        Body = @{ address = $ADDRESS } | ConvertTo-Json
    },
    @{
        Name = "Mantle Drip API"
        Url = "https://faucet.testnet.mantle.xyz/api/drip"
        Body = @{ wallet = $ADDRESS } | ConvertTo-Json
    },
    @{
        Name = "Alternative Endpoint"
        Url = "https://api.testnet.mantle.xyz/faucet"
        Body = @{ recipient = $ADDRESS } | ConvertTo-Json
    }
)

$success = $false

foreach ($faucet in $faucets) {
    Write-Host "Trying: $($faucet.Name)..." -ForegroundColor Cyan
    
    try {
        $response = Invoke-RestMethod -Uri $faucet.Url -Method POST -Body $faucet.Body -ContentType "application/json" -ErrorAction Stop
        Write-Host "Success! Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Green
        $success = $true
        break
    } catch {
        Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Start-Sleep -Seconds 2
}

if (-not $success) {
    Write-Host ""
    Write-Host "Automatic funding failed. Try these options:" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "1. MANUAL CURL COMMAND:" -ForegroundColor Cyan
    Write-Host "curl -X POST https://faucet.testnet.mantle.xyz/api/claim -H ""Content-Type: application/json"" -d '{""address"":""$ADDRESS""}'"
    Write-Host ""
    
    Write-Host "2. DIRECT FAUCET WEBSITES:" -ForegroundColor Cyan
    Write-Host "   - https://faucet.testnet.mantle.xyz/"
    Write-Host "   - https://www.l2faucet.com/mantle"
    Write-Host "   - https://faucets.chain.link/mantle-testnet"
    Write-Host ""
    
    Write-Host "3. OPEN BROWSER:" -ForegroundColor Cyan
    $openBrowser = Read-Host "Open faucet in browser? (y/n)"
    if ($openBrowser -eq "y") {
        Start-Process "https://faucet.testnet.mantle.xyz/"
    }
    
    Write-Host ""
    Write-Host "4. COMMUNITY REQUEST:" -ForegroundColor Cyan
    Write-Host "Post this in Mantle Discord/Telegram:"
    Write-Host "=====================================" -ForegroundColor DarkGray
    Write-Host "Need Mantle Testnet tokens for hackathon testing"
    Write-Host "Address: $ADDRESS"
    Write-Host "Will return the favor!"
    Write-Host "=====================================" -ForegroundColor DarkGray
} else {
    Write-Host ""
    Write-Host "Funding successful! Waiting 10 seconds then checking balance..." -ForegroundColor Green
    Write-Host ""
    Start-Sleep -Seconds 10
    
    # Check balance again
    try {
        $balanceResponse = Invoke-RestMethod -Uri "https://rpc.testnet.mantle.xyz" -Method POST -Body $balanceBody -ContentType "application/json"
        $balance = [bigint]::Parse($balanceResponse.result.Substring(2), 'AllowHexSpecifier')
        $mnt = [decimal]$balance / 1000000000000000000
        Write-Host "New Balance: $mnt MNT" -ForegroundColor Green
        
        if ($mnt -gt 0) {
            Write-Host ""
            Write-Host "Ready to deploy! Run:" -ForegroundColor Green
            Write-Host "npx hardhat run scripts/deploy-basket-payment.ts --network mantleTestnet" -ForegroundColor Yellow
            Write-Host ""
        }
    } catch {
        Write-Host "Could not verify balance. Check manually." -ForegroundColor Yellow
        Write-Host ""
    }
}
