// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ARCfxSettlement} from "../contracts/ARCfxSettlement.sol";

contract ARCfxSettlementTest is Test {
    ARCfxSettlement public settlement;

    address public constant TOKEN_USDC =
        0x3600000000000000000000000000000000000000;
    address public constant TOKEN_EURC =
        0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a;
    address public constant WALLET_FROM = address(0x1);
    address public constant WALLET_TO = address(0x2);

    // Events (must be declared in test for vm.expectEmit)
    event SettlementLogged(
        address indexed fromToken,
        address indexed toToken,
        uint256 amountIn,
        uint256 amountOut,
        address fromWallet,
        address toWallet,
        string referenceId,
        uint256 timestamp
    );

    event ComplianceChecked(
        address indexed wallet,
        string riskLevel,
        uint256 riskScore,
        uint256 timestamp
    );

    function setUp() public {
        settlement = new ARCfxSettlement();
    }

    function test_LogSettlement() public {
        uint256 amountIn = 100e6; // 100 USDC
        uint256 amountOut = 92e6; // 92 EURC

        vm.expectEmit(true, true, false, true);
        emit SettlementLogged(
            TOKEN_USDC,
            TOKEN_EURC,
            amountIn,
            amountOut,
            WALLET_FROM,
            WALLET_TO,
            "quote_123",
            block.timestamp
        );

        settlement.logSettlement(
            TOKEN_USDC,
            TOKEN_EURC,
            amountIn,
            amountOut,
            WALLET_FROM,
            WALLET_TO,
            "quote_123"
        );

        assertEq(settlement.getTotalSettlements(), 1);
    }

    function test_RevertInvalidTokens() public {
        vm.expectRevert("Invalid fromToken");
        settlement.logSettlement(
            address(0),
            TOKEN_EURC,
            100e6,
            92e6,
            WALLET_FROM,
            WALLET_TO,
            "quote_123"
        );
    }

    function test_LogComplianceCheck() public {
        vm.expectEmit(true, false, false, true);
        emit ComplianceChecked(WALLET_FROM, "low", 15, block.timestamp);

        settlement.logComplianceCheck(WALLET_FROM, "low", 15);
    }

    function test_MultipleSettlements() public {
        settlement.logSettlement(
            TOKEN_USDC,
            TOKEN_EURC,
            100e6,
            92e6,
            WALLET_FROM,
            WALLET_TO,
            "quote_1"
        );

        settlement.logSettlement(
            TOKEN_EURC,
            TOKEN_USDC,
            50e6,
            54e6,
            WALLET_TO,
            WALLET_FROM,
            "quote_2"
        );

        assertEq(settlement.getTotalSettlements(), 2);
    }
}
