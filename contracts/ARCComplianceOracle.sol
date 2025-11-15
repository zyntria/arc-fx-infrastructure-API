// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ARCComplianceOracle
 * @notice On-chain source of truth for verified bond issuers
 * @dev Only verified issuers can issue bonds on ARC-Yield platform
 */
contract ARCComplianceOracle {
    address public owner;
    address public pendingOwner;

    struct IssuerInfo {
        bytes32 kycHash;      // SHA-256 hash of off-chain KYB/AML record
        bool verified;        // Whether issuer is currently verified
        string legalName;     // Official legal entity name (from KYB)
        string jurisdiction;  // Country code (e.g., "US", "GB", "SG")
        uint256 verifiedAt;   // Timestamp of verification
        uint256 revokedAt;    // Timestamp of revocation (if any)
    }

    mapping(address => IssuerInfo) public issuers;
    
    // Track all verified issuers for enumeration
    address[] public verifiedIssuers;
    mapping(address => uint256) private issuerIndex;

    event IssuerVerified(
        address indexed issuer, 
        bytes32 kycHash, 
        string legalName,
        string jurisdiction
    );
    event IssuerRevoked(address indexed issuer, string reason);
    event IssuerUpdated(address indexed issuer, bytes32 newKycHash);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Verify an issuer with KYB information
     * @param issuer Wallet address of the issuer
     * @param kycHash SHA-256 hash of KYB documentation
     * @param legalName Official legal entity name
     * @param jurisdiction Country code (ISO 3166-1 alpha-2)
     */
    function setIssuerVerified(
        address issuer,
        bytes32 kycHash,
        string calldata legalName,
        string calldata jurisdiction
    ) external onlyOwner {
        require(issuer != address(0), "Invalid issuer address");
        require(kycHash != bytes32(0), "Invalid KYC hash");
        require(bytes(legalName).length > 0, "Legal name required");
        require(bytes(jurisdiction).length == 2, "Invalid jurisdiction code");

        bool wasVerified = issuers[issuer].verified;
        
        issuers[issuer] = IssuerInfo({
            kycHash: kycHash,
            verified: true,
            legalName: legalName,
            jurisdiction: jurisdiction,
            verifiedAt: block.timestamp,
            revokedAt: 0
        });

        // Add to verified list if new
        if (!wasVerified) {
            issuerIndex[issuer] = verifiedIssuers.length;
            verifiedIssuers.push(issuer);
        }

        emit IssuerVerified(issuer, kycHash, legalName, jurisdiction);
    }

    /**
     * @notice Revoke an issuer's verification
     * @param issuer Wallet address of the issuer
     * @param reason Reason for revocation
     */
    function revokeIssuer(address issuer, string calldata reason) external onlyOwner {
        require(issuers[issuer].verified, "Issuer not verified");
        
        issuers[issuer].verified = false;
        issuers[issuer].revokedAt = block.timestamp;

        // Remove from verified list
        uint256 index = issuerIndex[issuer];
        uint256 lastIndex = verifiedIssuers.length - 1;
        
        if (index != lastIndex) {
            address lastIssuer = verifiedIssuers[lastIndex];
            verifiedIssuers[index] = lastIssuer;
            issuerIndex[lastIssuer] = index;
        }
        
        verifiedIssuers.pop();
        delete issuerIndex[issuer];

        emit IssuerRevoked(issuer, reason);
    }

    /**
     * @notice Update KYC hash for an issuer (e.g., after document renewal)
     * @param issuer Wallet address of the issuer
     * @param newKycHash New SHA-256 hash of KYB documentation
     */
    function updateIssuerKycHash(address issuer, bytes32 newKycHash) external onlyOwner {
        require(issuers[issuer].verified, "Issuer not verified");
        require(newKycHash != bytes32(0), "Invalid KYC hash");
        
        issuers[issuer].kycHash = newKycHash;
        emit IssuerUpdated(issuer, newKycHash);
    }

    /**
     * @notice Check if an address is a verified issuer
     * @param issuer Wallet address to check
     * @return bool True if issuer is verified
     */
    function isVerifiedIssuer(address issuer) external view returns (bool) {
        return issuers[issuer].verified;
    }

    /**
     * @notice Get KYC hash for an issuer
     * @param issuer Wallet address of the issuer
     * @return bytes32 KYC hash
     */
    function getIssuerKycHash(address issuer) external view returns (bytes32) {
        return issuers[issuer].kycHash;
    }

    /**
     * @notice Get full issuer information
     * @param issuer Wallet address of the issuer
     * @return IssuerInfo struct with all issuer data
     */
    function getIssuerInfo(address issuer) external view returns (IssuerInfo memory) {
        return issuers[issuer];
    }

    /**
     * @notice Get total number of verified issuers
     * @return uint256 Count of verified issuers
     */
    function getVerifiedIssuerCount() external view returns (uint256) {
        return verifiedIssuers.length;
    }

    /**
     * @notice Get verified issuer at index
     * @param index Index in the verified issuers array
     * @return address Issuer wallet address
     */
    function getVerifiedIssuerAt(uint256 index) external view returns (address) {
        require(index < verifiedIssuers.length, "Index out of bounds");
        return verifiedIssuers[index];
    }

    /**
     * @notice Transfer ownership to a new address (2-step process)
     * @param newOwner Address of new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        pendingOwner = newOwner;
    }

    /**
     * @notice Accept ownership transfer
     */
    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "Not pending owner");
        emit OwnershipTransferred(owner, pendingOwner);
        owner = pendingOwner;
        pendingOwner = address(0);
    }
}

