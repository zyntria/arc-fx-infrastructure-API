-- NFT Certificate Database Schema
-- Stores certificate metadata, images, and IPFS data

-- Certificate metadata table
CREATE TABLE IF NOT EXISTS nft_certificates (
  id SERIAL PRIMARY KEY,
  bond_id VARCHAR(255) UNIQUE NOT NULL,
  token_id INTEGER,
  
  -- Bond details
  series_name VARCHAR(255) NOT NULL,
  principal VARCHAR(50) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'USDC',
  coupon_rate VARCHAR(10) NOT NULL,
  tenor_days VARCHAR(20) NOT NULL,
  issuer_name VARCHAR(255) NOT NULL,
  transferability VARCHAR(50) NOT NULL DEFAULT 'Soulbound',
  units INTEGER NOT NULL,
  
  -- Image data
  image_cid VARCHAR(255),
  image_ipfs_url TEXT,
  image_gateway_url TEXT,
  image_local_path TEXT,
  
  -- OpenAI generation data
  style VARCHAR(50) NOT NULL,
  prompt_used TEXT,
  openai_image_id VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Indexes for fast lookups
  CONSTRAINT unique_bond_id UNIQUE (bond_id)
);

CREATE INDEX IF NOT EXISTS idx_bond_id ON nft_certificates(bond_id);
CREATE INDEX IF NOT EXISTS idx_token_id ON nft_certificates(token_id);
CREATE INDEX IF NOT EXISTS idx_created_at ON nft_certificates(created_at);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_nft_certificates_updated_at 
  BEFORE UPDATE ON nft_certificates 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

