// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {ARCfxSettlement} from "../contracts/ARCfxSettlement.sol";
import {ARCfxPayouts} from "../contracts/ARCfxPayouts.sol";

/**
 * @title Deploy Script
 * @notice Deploys ARC-FX smart contracts to ARC Network
 * 
 * Usage:
 *   forge script script/Deploy.s.sol --rpc-url $ARC_RPC_URL --private-key $PRIVATE_KEY --broadcast
 */
contract Deploy is Script {
    function run() external {
        // Private key is passed via --private-key flag
        vm.startBroadcast();

        // Deploy ARCfxSettlement
        ARCfxSettlement settlement = new ARCfxSettlement();
        console.log("ARCfxSettlement deployed to:", address(settlement));

        // Deploy ARCfxPayouts
        ARCfxPayouts payouts = new ARCfxPayouts();
        console.log("ARCfxPayouts deployed to:", address(payouts));

        vm.stopBroadcast();

        // Output deployment addresses
        console.log("\n=== Deployment Complete ===");
        console.log("ARCfxSettlement:", address(settlement));
        console.log("ARCfxPayouts:", address(payouts));
        console.log("\nAdd these to your .env file:");
        console.log("CONTRACT_SETTLEMENT=%s", address(settlement));
        console.log("CONTRACT_PAYOUTS=%s", address(payouts));
    }
}

