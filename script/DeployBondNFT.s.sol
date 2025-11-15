// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {BondCertificateNFT} from "../contracts/BondCertificateNFT.sol";

contract DeployBondNFT is Script {
    function run() external returns (BondCertificateNFT) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        BondCertificateNFT nft = new BondCertificateNFT();
        
        console.log("BondCertificateNFT deployed to:", address(nft));
        console.log("Owner:", nft.owner());
        console.log("Name:", nft.name());
        console.log("Symbol:", nft.symbol());
        
        vm.stopBroadcast();
        
        return nft;
    }
}

