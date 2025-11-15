require("@nomicfoundation/hardhat-toolbox");
require("dotenv/config");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    arcTestnet: {
      url: process.env.ARC_RPC_URL || "https://rpc.testnet.arc.network",
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 12345, // Update with actual ARC testnet chain ID
      gas: 5000000,
      gasPrice: 20000000000
    },
    arcMainnet: {
      url: process.env.ARC_MAINNET_RPC_URL || "https://rpc.arc.network",
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 54321, // Update with actual ARC mainnet chain ID
    }
  },
  etherscan: {
    // ARCScan verification (if supported)
    apiKey: {
      arcTestnet: process.env.ARCSCAN_API_KEY || "your-api-key"
    },
    customChains: [
      {
        network: "arcTestnet",
        chainId: 12345,
        urls: {
          apiURL: "https://api.testnet.arcscan.app/api",
          browserURL: "https://testnet.arcscan.app"
        }
      }
    ]
  },
  paths: {
    sources: "./",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};

