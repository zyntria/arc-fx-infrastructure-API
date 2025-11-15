import { FastifyInstance } from "fastify";
import { nftContractService } from "../services/nft-contract";
import { generateCertificateImage } from "../services/nft-image";
import { uploadImageToIPFS } from "../services/storage-simple";
import { nftMetadataStore } from "../services/nft-metadata-store";

export async function nftTestRoutes(server: FastifyInstance) {
  /**
   * Test: Mint an NFT certificate
   * POST /v1/nft/test/mint
   */
  server.post<{
    Body: {
      wallet_address: string;
      bond_id: string;
      units: number;
      generate_image?: boolean;
    };
  }>("/nft/test/mint", async (request, reply) => {
    const { wallet_address, bond_id, units, generate_image } = request.body;

    if (!wallet_address || !bond_id || !units) {
      return reply.status(400).send({
        error: "wallet_address, bond_id, and units are required",
      });
    }

    try {
      let imageUrl: string | undefined;
      let imageCid: string | undefined;

      // Generate certificate image if requested
      if (generate_image) {
        console.log("[NFT Test] 🎨 Generating certificate image with OpenAI...");
        
        const imageResult = await generateCertificateImage({
          context: "bond_certificate",
          style: "institutional",
          bond_id: bond_id,
          fields: {
            title: "ARC Yield — Bond Certificate",
            series_label: "Test Series",
            principal_label: `${units} Units`,
            coupon_label: "5%",
            tenor_label: "90 Days",
            issuer_display_name: "ARC-FX Demo",
            transferability: "Soulbound",
          },
        });

        if (imageResult.status === "completed" && imageResult.image_base64) {
          console.log("[NFT Test] ✅ Image generated, uploading to IPFS...");
          
          // Upload to IPFS
          const buffer = Buffer.from(imageResult.image_base64, "base64");
          const uploadResult = await uploadImageToIPFS({
            bondId: bond_id,
            buffer,
            filename: `${bond_id}-certificate.png`,
            contentType: "image/png",
          });

          imageUrl = uploadResult.ipfs_url;
          imageCid = uploadResult.cid;
          console.log(`[NFT Test] 🚀 Image uploaded: ${imageUrl} (CID: ${imageCid})`);
        } else {
          console.log("[NFT Test] ⚠️ Image generation failed, minting without image");
        }
      }

      // Mint the NFT
      console.log(`[NFT Test] Minting NFT for ${wallet_address}...`);
      const result = await nftContractService.mintCertificate({
        toAddress: wallet_address,
        bondId: bond_id,
        units,
      });

      if (!result.success) {
        return reply.status(500).send({
          error: result.error || "Failed to mint NFT",
        });
      }

      // Get token URI
      let tokenURI: string | null = null;
      if (result.tokenId) {
        tokenURI = await nftContractService.getTokenURI(result.tokenId);
      }

      // Store certificate metadata for this bond
      await nftMetadataStore.set(bond_id, {
        bond_id,
        series_name: "Test Series",
        principal: units.toString(),
        currency: "USDC",
        coupon_rate: "5",
        tenor_days: "90",
        issuer_name: "ARC-FX Demo",
        transferability: "Soulbound",
        image_url: imageUrl || "ipfs://QmPlaceholder",
        gateway_url: imageUrl ? imageUrl.replace("ipfs://", "https://ipfs.io/ipfs/") : undefined,
        image_cid: imageCid,
        created_at: new Date().toISOString(),
        units,
        token_id: result.tokenId ? parseInt(result.tokenId) : undefined,
      });

      return reply.send({
        success: true,
        message: "NFT certificate minted successfully!",
        token_id: result.tokenId,
        tx_hash: result.txHash,
        token_uri: tokenURI,
        image_url: imageUrl,
        arcscan_tx_url: `https://testnet.arcscan.app/tx/${result.txHash}`,
        arcscan_nft_url: result.tokenId
          ? `https://testnet.arcscan.app/token/0x035667589F3eac34089dc0e4155A768b9b448EE7/instance/${result.tokenId}`
          : undefined,
      });
    } catch (error: any) {
      console.error("[NFT Test] Error:", error);
      return reply.status(500).send({
        error: error.message || "Internal server error",
      });
    }
  });

  /**
   * Test: Get NFTs owned by an address
   * GET /v1/nft/test/tokens/:address
   */
  server.get<{
    Params: { address: string };
  }>("/nft/test/tokens/:address", async (request, reply) => {
    const { address } = request.params;

    try {
      const tokens = await nftContractService.getTokensOfOwner(address);

      const tokensWithDetails = await Promise.all(
        tokens.map(async (tokenId) => {
          const position = await nftContractService.getPosition(tokenId);
          const tokenURI = await nftContractService.getTokenURI(tokenId);

          return {
            token_id: tokenId,
            bond_id: position?.bondId,
            units: position?.units,
            subscription_time: position?.subscriptionTime,
            token_uri: tokenURI,
            arcscan_nft_url: `https://testnet.arcscan.app/token/0x035667589F3eac34089dc0e4155A768b9b448EE7/instance/${tokenId}`,
          };
        })
      );

      return reply.send({
        address,
        token_count: tokens.length,
        tokens: tokensWithDetails,
      });
    } catch (error: any) {
      console.error("[NFT Test] Error:", error);
      return reply.status(500).send({
        error: error.message || "Internal server error",
      });
    }
  });

  /**
   * Test: Get contract info
   * GET /v1/nft/test/info
   */
  server.get("/nft/test/info", async (request, reply) => {
    return reply.send({
      contract_address: "0x035667589f3eac34089dc0e4155a768b9b448ee7",
      network: "Arc Testnet",
      chain_id: 5042002,
      arcscan_url:
        "https://testnet.arcscan.app/address/0x035667589f3eac34089dc0e4155a768b9b448ee7",
      name: "ARC Yield Bond Certificate",
      symbol: "ARCBOND",
      metadata_base_uri:
        "https://arc-fx-infrastructure-api-production-31b7.up.railway.app/v1/nft",
    });
  });
}

