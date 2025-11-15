// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title ARCYieldBondNFT
 * @notice Soulbound NFT certificates for ARC Yield bonds
 * @dev Each NFT represents a bond position with certificate image on IPFS
 */
contract ARCYieldBondNFT is ERC721, Ownable {
    using Strings for uint256;

    // Structs
    struct BondPosition {
        string bondId;           // e.g. "bond_123"
        uint256 units;           // Number of bond units
        uint256 subscriptionTime; // When the bond was purchased
    }

    // State variables
    mapping(uint256 => BondPosition) public positions;
    mapping(uint256 => string) private _tokenURIs; // tokenId => metadata URI
    uint256 public nextTokenId = 1;
    
    // Base URI for metadata (your API endpoint)
    string public baseMetadataURI;
    
    // Bond contract that can mint NFTs
    address public bondContract;

    // Events
    event CertificateMinted(
        uint256 indexed tokenId,
        address indexed owner,
        string bondId,
        uint256 units
    );
    
    event MetadataURISet(uint256 indexed tokenId, string uri);

    // Modifiers
    modifier onlyBondContract() {
        require(msg.sender == bondContract || msg.sender == owner(), "Not authorized");
        _;
    }

    constructor(
        string memory name,
        string memory symbol,
        string memory _baseMetadataURI
    ) ERC721(name, symbol) Ownable(msg.sender) {
        baseMetadataURI = _baseMetadataURI;
    }

    /**
     * @notice Set the bond contract address that can mint NFTs
     */
    function setBondContract(address _bondContract) external onlyOwner {
        bondContract = _bondContract;
    }

    /**
     * @notice Update base metadata URI
     */
    function setBaseMetadataURI(string memory _baseMetadataURI) external onlyOwner {
        baseMetadataURI = _baseMetadataURI;
    }

    /**
     * @notice Mint a bond certificate NFT
     * @param to The address to mint to
     * @param bondId The bond identifier
     * @param units Number of bond units purchased
     * @return tokenId The minted token ID
     */
    function mintCertificate(
        address to,
        string memory bondId,
        uint256 units
    ) external onlyBondContract returns (uint256) {
        uint256 tokenId = nextTokenId++;
        
        _safeMint(to, tokenId);
        
        positions[tokenId] = BondPosition({
            bondId: bondId,
            units: units,
            subscriptionTime: block.timestamp
        });
        
        emit CertificateMinted(tokenId, to, bondId, units);
        
        return tokenId;
    }

    /**
     * @notice Set custom metadata URI for a token (e.g., direct IPFS link)
     * @param tokenId The token ID
     * @param uri The metadata URI (can be IPFS link)
     */
    function setTokenURI(uint256 tokenId, string memory uri) external onlyBondContract {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        _tokenURIs[tokenId] = uri;
        emit MetadataURISet(tokenId, uri);
    }

    /**
     * @notice Get the metadata URI for a token
     * @dev This is what ARCScan and wallets call to get certificate image
     * @param tokenId The token ID
     * @return The full metadata URI
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        
        // If custom URI is set (e.g., direct IPFS link), use it
        if (bytes(_tokenURIs[tokenId]).length > 0) {
            return _tokenURIs[tokenId];
        }
        
        // Otherwise, construct from base URI and bond ID
        BondPosition memory position = positions[tokenId];
        
        // Return: https://api.arcfx.finance/v1/nft/bonds/{bondId}/metadata.json
        return string(abi.encodePacked(
            baseMetadataURI,
            "/bonds/",
            position.bondId,
            "/metadata.json"
        ));
    }

    /**
     * @notice Get bond position details for a token
     */
    function getPosition(uint256 tokenId) external view returns (
        string memory bondId,
        uint256 units,
        uint256 subscriptionTime
    ) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        BondPosition memory position = positions[tokenId];
        return (position.bondId, position.units, position.subscriptionTime);
    }

    /**
     * @notice Check if a token exists
     */
    function exists(uint256 tokenId) external view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    /**
     * @notice Get all token IDs owned by an address
     */
    function tokensOfOwner(address owner) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory tokens = new uint256[](balance);
        uint256 index = 0;
        
        for (uint256 tokenId = 1; tokenId < nextTokenId && index < balance; tokenId++) {
            if (_ownerOf(tokenId) == owner) {
                tokens[index++] = tokenId;
            }
        }
        
        return tokens;
    }

    /**
     * @notice Soulbound: Prevent transfers (except minting and burning)
     * @dev Override to make certificates non-transferable
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from == address(0)) and burning (to == address(0))
        // Block transfers between addresses
        if (from != address(0) && to != address(0)) {
            revert("Soulbound: transfers are disabled");
        }
        
        return super._update(to, tokenId, auth);
    }

    /**
     * @notice Override supportsInterface
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

