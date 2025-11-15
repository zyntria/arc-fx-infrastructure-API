// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ARCfxPayouts} from "../contracts/ARCfxPayouts.sol";

contract ARCfxPayoutsTest is Test {
    ARCfxPayouts public payouts;

    address public constant TOKEN_USDC =
        0x3600000000000000000000000000000000000000;
    address public constant TOKEN_EURC =
        0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a;
    address public constant RECIPIENT_1 = address(0x1);
    address public constant RECIPIENT_2 = address(0x2);

    // Events (must be declared in test for vm.expectEmit)
    event PayoutExecuted(
        address indexed to,
        address indexed token,
        uint256 amount,
        string metadata,
        uint256 timestamp
    );

    function setUp() public {
        payouts = new ARCfxPayouts();
    }

    function test_ExecuteSinglePayout() public {
        ARCfxPayouts.Payout[] memory payoutList = new ARCfxPayouts.Payout[](1);
        payoutList[0] = ARCfxPayouts.Payout({
            to: RECIPIENT_1,
            token: TOKEN_USDC,
            amount: 100e6,
            metadata: "Salary payment"
        });

        vm.expectEmit(true, true, false, true);
        emit PayoutExecuted(
            RECIPIENT_1,
            TOKEN_USDC,
            100e6,
            "Salary payment",
            block.timestamp
        );

        bytes32 batchId = payouts.executePayouts(payoutList);

        ARCfxPayouts.BatchInfo memory info = payouts.getBatchInfo(batchId);
        assertEq(info.recipientCount, 1);
        assertEq(info.successCount, 1);
        assertEq(info.failedCount, 0);
    }

    function test_ExecuteBatchPayouts() public {
        ARCfxPayouts.Payout[] memory payoutList = new ARCfxPayouts.Payout[](3);
        payoutList[0] = ARCfxPayouts.Payout({
            to: RECIPIENT_1,
            token: TOKEN_USDC,
            amount: 100e6,
            metadata: "Employee 1"
        });
        payoutList[1] = ARCfxPayouts.Payout({
            to: RECIPIENT_2,
            token: TOKEN_EURC,
            amount: 50e6,
            metadata: "Employee 2"
        });
        payoutList[2] = ARCfxPayouts.Payout({
            to: RECIPIENT_1,
            token: TOKEN_USDC,
            amount: 75e6,
            metadata: "Bonus"
        });

        bytes32 batchId = payouts.executePayouts(payoutList);

        ARCfxPayouts.BatchInfo memory info = payouts.getBatchInfo(batchId);
        assertEq(info.recipientCount, 3);
        assertEq(info.successCount, 3);
        assertEq(payouts.getTotalBatches(), 1);
    }

    function test_RevertEmptyPayouts() public {
        ARCfxPayouts.Payout[] memory emptyList = new ARCfxPayouts.Payout[](0);

        vm.expectRevert("No payouts provided");
        payouts.executePayouts(emptyList);
    }

    function test_RevertTooManyRecipients() public {
        ARCfxPayouts.Payout[] memory tooMany = new ARCfxPayouts.Payout[](101);

        vm.expectRevert("Too many recipients");
        payouts.executePayouts(tooMany);
    }

    function test_InvalidPayoutHandling() public {
        ARCfxPayouts.Payout[] memory payoutList = new ARCfxPayouts.Payout[](2);

        // Valid payout
        payoutList[0] = ARCfxPayouts.Payout({
            to: RECIPIENT_1,
            token: TOKEN_USDC,
            amount: 100e6,
            metadata: "Valid"
        });

        // Invalid payout (zero address)
        payoutList[1] = ARCfxPayouts.Payout({
            to: address(0),
            token: TOKEN_USDC,
            amount: 50e6,
            metadata: "Invalid"
        });

        bytes32 batchId = payouts.executePayouts(payoutList);

        ARCfxPayouts.BatchInfo memory info = payouts.getBatchInfo(batchId);
        assertEq(info.recipientCount, 2);
        assertEq(info.successCount, 1);
        assertEq(info.failedCount, 1);
    }

    function test_MaxRecipientsAllowed() public {
        ARCfxPayouts.Payout[] memory maxPayouts = new ARCfxPayouts.Payout[](
            100
        );

        for (uint i = 0; i < 100; i++) {
            // Casting to uint160 is safe because i+1 is always < 100
            // forge-lint: disable-next-line(unsafe-typecast)
            maxPayouts[i] = ARCfxPayouts.Payout({
                to: address(uint160(i + 1)),
                token: TOKEN_USDC,
                amount: 10e6,
                metadata: "Bulk payment"
            });
        }

        bytes32 batchId = payouts.executePayouts(maxPayouts);

        ARCfxPayouts.BatchInfo memory info = payouts.getBatchInfo(batchId);
        assertEq(info.recipientCount, 100);
        assertEq(info.successCount, 100);
    }
}
