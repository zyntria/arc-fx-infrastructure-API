import { ethers } from "ethers";
import { config } from "../config";

// NFT Contract ABI (only the functions we need)
const NFT_ABI = [
  "function mintCertificate(address to, string bondId, uint256 units) returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function getPosition(uint256 tokenId) view returns (string bondId, uint256 units, uint256 subscriptionTime)",
  "function tokensOfOwner(address owner) view returns (uint256[])",
  "function setBondContract(address _bondContract)",
  "function owner() view returns (address)"
];

export class NFTContractService {
  private provider: ethers.JsonRpcProvider | null = null;
  private contract: ethers.Contract | null = null;
  private wallet: ethers.Wallet | null = null;

  constructor() {
    // Lazy initialization - only create connections when needed
  }

  private ensureInitialized() {
    if (!this.provider) {
      if (!config.ARC_RPC_URL) {
        throw new Error("ARC_RPC_URL not configured");
      }
      if (!config.PRIVATE_KEY) {
        throw new Error("PRIVATE_KEY not configured");
      }
      if (!config.BOND_NFT_CONTRACT) {
        throw new Error("BOND_NFT_CONTRACT not configured");
      }

      // Connect to Arc Testnet
      this.provider = new ethers.JsonRpcProvider(config.ARC_RPC_URL);
      
      // Create wallet from private key
      this.wallet = new ethers.Wallet(config.PRIVATE_KEY, this.provider);
      
      // Initialize contract
      this.contract = new ethers.Contract(
        config.BOND_NFT_CONTRACT,
        NFT_ABI,
        this.wallet
      );
    }
  }

  /**
   * Mint an NFT certificate for a bond subscription
   */
  async mintCertificate(params: {
    toAddress: string;
    bondId: string;
    units: number;
  }): Promise<{
    success: boolean;
    tokenId?: string;
    txHash?: string;
    error?: string;
  }> {
    try {
      this.ensureInitialized();
      console.log(`[NFT] Minting certificate for bond ${params.bondId} to ${params.toAddress}`);
      
      // Mint the NFT
      const tx = await this.contract!.mintCertificate(
        params.toAddress,
        params.bondId,
        params.units
      );

      console.log(`[NFT] Transaction sent: ${tx.hash}`);
      console.log(`[NFT] Transaction details:`, {
        from: tx.from,
        to: tx.to,
        nonce: tx.nonce,
        gasLimit: tx.gasLimit?.toString(),
        gasPrice: tx.gasPrice?.toString(),
        chainId: tx.chainId,
      });
      console.log(`[NFT] Waiting for confirmation (timeout: 60s)...`);
      
      // Wait for confirmation with extended timeout (60 seconds)
      // Arc testnet can be slow during high load
      const receipt = await Promise.race([
        tx.wait(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Transaction confirmation timeout')), 60000) // Increased to 60s
        )
      ]).catch((error) => {
        // If timeout, transaction is still valid, just return what we have
        console.error(`[NFT] ⚠️ Confirmation timeout after 60s - transaction still processing on-chain: ${tx.hash}`);
        console.error(`[NFT] Error details:`, {
          error: error.message,
          errorCode: error.code,
          errorName: error.name,
          txHash: tx.hash,
          nonce: tx.nonce,
          gasPrice: tx.gasPrice?.toString(),
          gasLimit: tx.gasLimit?.toString(),
          from: tx.from,
          to: tx.to,
          timestamp: new Date().toISOString(),
        });
        console.log(`[NFT] Check status at: https://testnet.arcscan.app/tx/${tx.hash}`);
        return null;
      });
      
      if (!receipt) {
        // Transaction sent but confirmation timed out
        // Return success since tx was sent - user can check ARCScan
        console.log(`[NFT] Returning early - check ARCScan for confirmation`);
        return {
          success: true,
          txHash: tx.hash,
          tokenId: undefined, // Will be available once confirmed
        };
      }
      
      console.log(`[NFT] Transaction confirmed in block ${receipt.blockNumber}`);

      // Extract tokenId from CertificateMinted event
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = this.contract!.interface.parseLog(log);
          return parsed?.name === "CertificateMinted";
        } catch {
          return false;
        }
      });

      let tokenId: string | undefined;
      if (event) {
        const parsed = this.contract!.interface.parseLog(event);
        tokenId = parsed?.args?.tokenId?.toString();
      }

      return {
        success: true,
        tokenId,
        txHash: receipt.hash,
      };
    } catch (error: any) {
      console.error("[NFT] Minting failed:", error.message);
      console.error("[NFT] Full error details:", {
        message: error.message,
        code: error.code,
        name: error.name,
        reason: error.reason,
        transaction: error.transaction,
        receipt: error.receipt,
        stack: error.stack?.split('\n').slice(0, 5).join('\n'), // First 5 lines of stack
      });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get NFTs owned by an address
   */
  async getTokensOfOwner(address: string): Promise<string[]> {
    try {
      this.ensureInitialized();
      const tokens = await this.contract!.tokensOfOwner(address);
      return tokens.map((t: any) => t.toString());
    } catch (error: any) {
      console.error("[NFT] Failed to get tokens:", error.message);
      return [];
    }
  }

  /**
   * Get token metadata URI
   */
  async getTokenURI(tokenId: string): Promise<string | null> {
    try {
      this.ensureInitialized();
      return await this.contract!.tokenURI(tokenId);
    } catch (error: any) {
      console.error("[NFT] Failed to get token URI:", error.message);
      return null;
    }
  }

  /**
   * Get position details for a token
   */
  async getPosition(tokenId: string): Promise<{
    bondId: string;
    units: string;
    subscriptionTime: string;
  } | null> {
    try {
      this.ensureInitialized();
      const position = await this.contract!.getPosition(tokenId);
      return {
        bondId: position.bondId,
        units: position.units.toString(),
        subscriptionTime: position.subscriptionTime.toString(),
      };
    } catch (error: any) {
      console.error("[NFT] Failed to get position:", error.message);
      return null;
    }
  }

  /**
   * Check transaction status manually (useful for timeouts)
   */
  async checkTransactionStatus(txHash: string): Promise<{
    confirmed: boolean;
    blockNumber?: number;
    status?: number;
    tokenId?: string;
    error?: string;
  }> {
    try {
      this.ensureInitialized();
      console.log(`[NFT] Checking transaction status: ${txHash}`);
      
      const receipt = await this.provider!.getTransactionReceipt(txHash);
      
      if (!receipt) {
        return {
          confirmed: false,
          error: "Transaction not yet mined or not found"
        };
      }

      console.log(`[NFT] Transaction confirmed in block ${receipt.blockNumber}, status: ${receipt.status}`);

      // Try to extract tokenId from logs
      let tokenId: string | undefined;
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = this.contract!.interface.parseLog(log);
          return parsed?.name === "CertificateMinted";
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = this.contract!.interface.parseLog(event);
        tokenId = parsed?.args?.tokenId?.toString();
      }

      return {
        confirmed: true,
        blockNumber: receipt.blockNumber,
        status: receipt.status ?? undefined,
        tokenId,
      };
    } catch (error: any) {
      console.error("[NFT] Failed to check transaction:", error.message);
      return {
        confirmed: false,
        error: error.message,
      };
    }
  }
}

// Export singleton instance
export const nftContractService = new NFTContractService();

