import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "hardhat-gas-reporter";
import "solidity-coverage";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.23", // Mantle recommended version (0.8.23 or below)
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  defaultNetwork: "mantleTestnet", // Default network when not specified
  networks: {
    hardhat: {
      chainId: 31337,
    },
    mantle: {
      url: "https://rpc.mantle.xyz", // Mainnet
      chainId: 5000,
      accounts: process.env.ACCOUNT_PRIVATE_KEY ? [process.env.ACCOUNT_PRIVATE_KEY] : [],
      // Use default configuration for gas (will use network's basefee + priorityfee)
    },
    mantleTestnet: {
      url: "https://rpc.testnet.mantle.xyz", // Mantle Testnet
      chainId: 5001,
      accounts: process.env.ACCOUNT_PRIVATE_KEY ? [process.env.ACCOUNT_PRIVATE_KEY] : [],
      gasPrice: 20000000, // 0.02 gwei
    },
    mantleSepolia: {
      url: "https://rpc.sepolia.mantle.xyz", // Sepolia Testnet
      chainId: 5003,
      accounts: process.env.ACCOUNT_PRIVATE_KEY ? [process.env.ACCOUNT_PRIVATE_KEY] : [],
      gasPrice: 20000000, // 0.02 gwei - Mantle's minimum basefee for optimized fees
    },
    // Legacy network names for backward compatibility
    "mantle-testnet": {
      url: "https://rpc.testnet.mantle.xyz",
      chainId: 5001,
      accounts: process.env.ACCOUNT_PRIVATE_KEY ? [process.env.ACCOUNT_PRIVATE_KEY] : [],
      gasPrice: 20000000,
    },
    "mantle-mainnet": {
      url: "https://rpc.mantle.xyz",
      chainId: 5000,
      accounts: process.env.ACCOUNT_PRIVATE_KEY ? [process.env.ACCOUNT_PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      mantle: process.env.MANTLESCAN_API_KEY || "",
      mantleSepolia: process.env.MANTLESCAN_API_KEY || "",
      "mantle-testnet": process.env.MANTLESCAN_API_KEY || "",
      "mantle-mainnet": process.env.MANTLESCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "mantle",
        chainId: 5000,
        urls: {
          apiURL: "https://api.mantlescan.xyz/api",
          browserURL: "https://mantlescan.xyz",
        },
      },
      {
        network: "mantleSepolia",
        chainId: 5003,
        urls: {
          apiURL: "https://api-sepolia.mantlescan.xyz/api",
          browserURL: "https://sepolia.mantlescan.xyz",
        },
      },
      {
        network: "mantle-testnet",
        chainId: 5003,
        urls: {
          apiURL: "https://api-sepolia.mantlescan.xyz/api",
          browserURL: "https://sepolia.mantlescan.xyz",
        },
      },
      {
        network: "mantle-mainnet",
        chainId: 5000,
        urls: {
          apiURL: "https://api.mantlescan.xyz/api",
          browserURL: "https://mantlescan.xyz",
        },
      },
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  paths: {
    sources: "./contracts",  // Contracts in contracts subfolder
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 60000,
  },
};

export default config;
