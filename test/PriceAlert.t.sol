// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {PriceAlert} from "../src/PriceAlert.sol";

// Mock Tellor contract for testing
contract MockTellor {
    struct DataPoint {
        bytes data;
        uint256 timestamp;
    }

    mapping(bytes32 => DataPoint[]) public queryData;
    mapping(bytes32 => uint256) public dataCount;

    function submitData(
        bytes32 _queryId,
        uint256 _value,
        uint256 _timestamp
    ) external {
        bytes memory data = abi.encode(_value);
        queryData[_queryId].push(DataPoint(data, _timestamp));
        dataCount[_queryId]++;
    }

    function getNewValueCountbyQueryId(
        bytes32 _queryId
    ) external view returns (uint256) {
        return dataCount[_queryId];
    }

    function getTimestampbyQueryIdandIndex(
        bytes32 _queryId,
        uint256 _index
    ) external view returns (uint256) {
        require(_index < queryData[_queryId].length, "Index out of bounds");
        return queryData[_queryId][_index].timestamp;
    }

    function retrieveData(
        bytes32 _queryId,
        uint256 _timestamp
    ) external view returns (bytes memory) {
        DataPoint[] memory data = queryData[_queryId];
        for (uint256 i = 0; i < data.length; i++) {
            if (data[i].timestamp == _timestamp) {
                return data[i].data;
            }
        }
        revert("No data for timestamp");
    }

    function getDataBefore(
        bytes32 _queryId,
        uint256 _timestamp
    )
        external
        view
        returns (
            bool _ifRetrieve,
            bytes memory _value,
            uint256 _timestampRetrieved
        )
    {
        DataPoint[] memory data = queryData[_queryId];
        uint256 latestTimestamp = 0;
        bytes memory latestData;

        for (uint256 i = 0; i < data.length; i++) {
            if (
                data[i].timestamp <= _timestamp &&
                data[i].timestamp > latestTimestamp
            ) {
                latestTimestamp = data[i].timestamp;
                latestData = data[i].data;
            }
        }

        if (latestTimestamp > 0) {
            return (true, latestData, latestTimestamp);
        } else {
            return (false, "", 0);
        }
    }
}

contract PriceAlertTest is Test {
    PriceAlert public priceAlert;
    MockTellor public mockTellor;

    bytes32 public constant QUERY_ID =
        keccak256(abi.encode("SpotPrice", abi.encode("btc", "usd")));

    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    uint256 public constant INITIAL_PRICE = 50000e18; // $50,000
    uint256 public constant UPDATED_PRICE = 55000e18; // $55,000

    event AlertCreated(
        uint256 indexed alertId,
        address indexed user,
        uint256 targetPrice,
        bool isAbove
    );
    event AlertTriggered(
        uint256 indexed alertId,
        address indexed user,
        uint256 currentPrice
    );
    event AlertDeleted(uint256 indexed alertId, address indexed user);

    function setUp() public {
        // Deploy mock Tellor
        mockTellor = new MockTellor();

        // Deploy PriceAlert contract
        priceAlert = new PriceAlert(address(mockTellor), QUERY_ID);

        // Add initial price data
        mockTellor.submitData(QUERY_ID, INITIAL_PRICE, block.timestamp);
    }

    function test_Constructor() public {
        assertEq(address(priceAlert.tellor()), address(mockTellor));
        assertEq(priceAlert.queryId(), QUERY_ID);
    }

    function test_CreateAlert() public {
        uint256 targetPrice = 52000e18;
        bool isAbove = true;

        vm.startPrank(alice);

        vm.expectEmit(true, true, false, true);
        emit AlertCreated(0, alice, targetPrice, isAbove);

        uint256 alertId = priceAlert.createAlert(targetPrice, isAbove);

        assertEq(alertId, 0);

        PriceAlert.Alert memory alert = priceAlert.getAlert(alertId);
        assertEq(alert.id, 0);
        assertEq(alert.user, alice);
        assertEq(alert.targetPrice, targetPrice);
        assertEq(alert.isAbove, isAbove);
        assertEq(alert.triggered, false);
        assertEq(alert.createdAt, block.timestamp);

        vm.stopPrank();
    }

    function test_CreateAlert_RevertsWithZeroPrice() public {
        vm.startPrank(alice);
        vm.expectRevert("Price must be > 0");
        priceAlert.createAlert(0, true);
        vm.stopPrank();
    }

    function test_GetCurrentPrice() public {
        (uint256 price, uint256 timestamp) = priceAlert.getCurrentPrice();
        assertEq(price, INITIAL_PRICE);
        assertEq(timestamp, block.timestamp);
    }

    function test_GetCurrentPrice_RevertsWithNoData() public {
        // Deploy new contract with different query ID (no data)
        bytes32 emptyQueryId = keccak256("empty");
        PriceAlert emptyAlert = new PriceAlert(
            address(mockTellor),
            emptyQueryId
        );

        vm.expectRevert("No data available");
        emptyAlert.getCurrentPrice();
    }

    function test_CheckAlert_TriggersAboveAlert() public {
        uint256 targetPrice = 52000e18;

        // Create alert
        vm.startPrank(alice);
        uint256 alertId = priceAlert.createAlert(targetPrice, true);
        vm.stopPrank();

        // Update price to trigger alert
        vm.warp(block.timestamp + 1);
        mockTellor.submitData(QUERY_ID, UPDATED_PRICE, block.timestamp);

        vm.expectEmit(true, true, false, true);
        emit AlertTriggered(alertId, alice, UPDATED_PRICE);

        bool triggered = priceAlert.checkAlert(alertId);
        assertTrue(triggered);

        PriceAlert.Alert memory alert = priceAlert.getAlert(alertId);
        assertTrue(alert.triggered);
    }

    function test_CheckAlert_TriggersBelowAlert() public {
        uint256 targetPrice = 52000e18;
        uint256 lowerPrice = 48000e18;

        // Create below alert
        vm.startPrank(alice);
        uint256 alertId = priceAlert.createAlert(targetPrice, false);
        vm.stopPrank();

        // Update price to trigger alert
        vm.warp(block.timestamp + 1);
        mockTellor.submitData(QUERY_ID, lowerPrice, block.timestamp);

        vm.expectEmit(true, true, false, true);
        emit AlertTriggered(alertId, alice, lowerPrice);

        bool triggered = priceAlert.checkAlert(alertId);
        assertTrue(triggered);
    }

    function test_CheckAlert_DoesNotTrigger() public {
        uint256 targetPrice = 60000e18; // Higher than current price

        // Create above alert
        vm.startPrank(alice);
        uint256 alertId = priceAlert.createAlert(targetPrice, true);
        vm.stopPrank();

        bool triggered = priceAlert.checkAlert(alertId);
        assertFalse(triggered);

        PriceAlert.Alert memory alert = priceAlert.getAlert(alertId);
        assertFalse(alert.triggered);
    }

    function test_CheckAlert_RevertsWithNonExistentAlert() public {
        vm.expectRevert("Alert does not exist");
        priceAlert.checkAlert(999);
    }

    function test_CheckAlert_RevertsWithAlreadyTriggered() public {
        uint256 targetPrice = 52000e18;

        // Create and trigger alert
        vm.startPrank(alice);
        uint256 alertId = priceAlert.createAlert(targetPrice, true);
        vm.stopPrank();

        vm.warp(block.timestamp + 1);
        mockTellor.submitData(QUERY_ID, UPDATED_PRICE, block.timestamp);
        priceAlert.checkAlert(alertId);

        // Try to check again
        vm.expectRevert("Alert already triggered");
        priceAlert.checkAlert(alertId);
    }

    function test_CheckAlert_RevertsWithOldData() public {
        uint256 targetPrice = 52000e18;

        // Create alert
        vm.startPrank(alice);
        uint256 alertId = priceAlert.createAlert(targetPrice, true);
        vm.stopPrank();

        // Warp time forward more than 24 hours without updating price
        vm.warp(block.timestamp + 25 hours);

        vm.expectRevert("Price data too old");
        priceAlert.checkAlert(alertId);
    }

    function test_DeleteAlert() public {
        uint256 targetPrice = 52000e18;

        // Create alert
        vm.startPrank(alice);
        uint256 alertId = priceAlert.createAlert(targetPrice, true);

        vm.expectEmit(true, true, false, false);
        emit AlertDeleted(alertId, alice);

        priceAlert.deleteAlert(alertId);
        vm.stopPrank();

        PriceAlert.Alert memory alert = priceAlert.getAlert(alertId);
        assertTrue(alert.triggered); // Deletion sets triggered to true
    }

    function test_DeleteAlert_RevertsWithNonExistentAlert() public {
        vm.startPrank(alice);
        vm.expectRevert("Alert does not exist");
        priceAlert.deleteAlert(999);
        vm.stopPrank();
    }

    function test_DeleteAlert_RevertsWithNotOwner() public {
        uint256 targetPrice = 52000e18;

        // Alice creates alert
        vm.startPrank(alice);
        uint256 alertId = priceAlert.createAlert(targetPrice, true);
        vm.stopPrank();

        // Bob tries to delete
        vm.startPrank(bob);
        vm.expectRevert("Not your alert");
        priceAlert.deleteAlert(alertId);
        vm.stopPrank();
    }

    function test_DeleteAlert_RevertsWithAlreadyTriggered() public {
        uint256 targetPrice = 52000e18;

        // Create and trigger alert
        vm.startPrank(alice);
        uint256 alertId = priceAlert.createAlert(targetPrice, true);
        vm.stopPrank();

        vm.warp(block.timestamp + 1);
        mockTellor.submitData(QUERY_ID, UPDATED_PRICE, block.timestamp);
        priceAlert.checkAlert(alertId);

        vm.startPrank(alice);
        vm.expectRevert("Alert already triggered");
        priceAlert.deleteAlert(alertId);
        vm.stopPrank();
    }

    function test_GetUserAlerts() public {
        // Create multiple alerts for Alice
        vm.startPrank(alice);
        uint256 alertId1 = priceAlert.createAlert(52000e18, true);
        uint256 alertId2 = priceAlert.createAlert(48000e18, false);
        vm.stopPrank();

        // Create alert for Bob
        vm.startPrank(bob);
        uint256 alertId3 = priceAlert.createAlert(60000e18, true);
        vm.stopPrank();

        uint256[] memory aliceAlerts = priceAlert.getUserAlerts(alice);
        uint256[] memory bobAlerts = priceAlert.getUserAlerts(bob);

        assertEq(aliceAlerts.length, 2);
        assertEq(aliceAlerts[0], alertId1);
        assertEq(aliceAlerts[1], alertId2);

        assertEq(bobAlerts.length, 1);
        assertEq(bobAlerts[0], alertId3);
    }

    function test_GetActiveAlerts() public {
        // Create multiple alerts
        vm.startPrank(alice);
        uint256 alertId1 = priceAlert.createAlert(52000e18, true);
        uint256 alertId2 = priceAlert.createAlert(48000e18, false);
        uint256 alertId3 = priceAlert.createAlert(60000e18, true);
        vm.stopPrank();

        // Trigger one alert
        vm.warp(block.timestamp + 1);
        mockTellor.submitData(QUERY_ID, UPDATED_PRICE, block.timestamp);
        priceAlert.checkAlert(alertId1);

        uint256[] memory activeAlerts = priceAlert.getActiveAlerts(alice);

        assertEq(activeAlerts.length, 2);
        assertEq(activeAlerts[0], alertId2);
        assertEq(activeAlerts[1], alertId3);
    }

    function test_GetTotalAlerts() public {
        assertEq(priceAlert.getTotalAlerts(), 0);

        vm.startPrank(alice);
        priceAlert.createAlert(52000e18, true);
        assertEq(priceAlert.getTotalAlerts(), 1);

        priceAlert.createAlert(48000e18, false);
        assertEq(priceAlert.getTotalAlerts(), 2);
        vm.stopPrank();

        vm.startPrank(bob);
        priceAlert.createAlert(60000e18, true);
        assertEq(priceAlert.getTotalAlerts(), 3);
        vm.stopPrank();
    }

    function test_GetDataFeedInfo() public {
        (
            uint256 totalDataPoints,
            uint256 latestPrice,
            uint256 latestTimestamp
        ) = priceAlert.getDataFeedInfo();

        assertEq(totalDataPoints, 1);
        assertEq(latestPrice, INITIAL_PRICE);
        assertEq(latestTimestamp, block.timestamp);
    }

    function test_GetPriceAt() public {
        uint256 firstTimestamp = block.timestamp;

        // Add another data point
        vm.warp(block.timestamp + 100);
        mockTellor.submitData(QUERY_ID, UPDATED_PRICE, block.timestamp);

        // Get price at first timestamp
        (uint256 price, uint256 timestamp) = priceAlert.getPriceAt(
            firstTimestamp + 1
        );

        assertEq(price, INITIAL_PRICE);
        assertEq(timestamp, firstTimestamp);
    }

    function test_GetPriceAt_RevertsWithNoData() public {
        vm.expectRevert("No data before timestamp");
        priceAlert.getPriceAt(block.timestamp - 1);
    }

    function test_MultipleUsers_MultipleAlerts() public {
        // Alice creates alerts
        vm.startPrank(alice);
        uint256 aliceAlert1 = priceAlert.createAlert(52000e18, true);
        uint256 aliceAlert2 = priceAlert.createAlert(48000e18, false);
        vm.stopPrank();

        // Bob creates alerts
        vm.startPrank(bob);
        uint256 bobAlert1 = priceAlert.createAlert(60000e18, true);
        uint256 bobAlert2 = priceAlert.createAlert(45000e18, false);
        vm.stopPrank();

        // Check total alerts
        assertEq(priceAlert.getTotalAlerts(), 4);

        // Check user alerts
        uint256[] memory aliceAlerts = priceAlert.getUserAlerts(alice);
        uint256[] memory bobAlerts = priceAlert.getUserAlerts(bob);

        assertEq(aliceAlerts.length, 2);
        assertEq(bobAlerts.length, 2);

        // Update price to trigger some alerts
        vm.warp(block.timestamp + 1);
        mockTellor.submitData(QUERY_ID, UPDATED_PRICE, block.timestamp); // $55,000

        // This should trigger Alice's first alert (above $52,000)
        bool triggered1 = priceAlert.checkAlert(aliceAlert1);
        assertTrue(triggered1);

        // This should not trigger Alice's second alert (below $48,000)
        bool triggered2 = priceAlert.checkAlert(aliceAlert2);
        assertFalse(triggered2);

        // Check active alerts
        uint256[] memory aliceActiveAlerts = priceAlert.getActiveAlerts(alice);
        assertEq(aliceActiveAlerts.length, 1); // Only the second alert should be active
        assertEq(aliceActiveAlerts[0], aliceAlert2);
    }

    function test_EdgeCase_ExactTargetPrice() public {
        uint256 targetPrice = INITIAL_PRICE; // Exact current price

        // Test "above" alert with exact price
        vm.startPrank(alice);
        uint256 alertId1 = priceAlert.createAlert(targetPrice, true);
        vm.stopPrank();

        bool triggered1 = priceAlert.checkAlert(alertId1);
        assertTrue(triggered1); // Should trigger because current >= target

        // Test "below" alert with exact price
        vm.startPrank(alice);
        uint256 alertId2 = priceAlert.createAlert(targetPrice, false);
        vm.stopPrank();

        bool triggered2 = priceAlert.checkAlert(alertId2);
        assertTrue(triggered2); // Should trigger because current <= target
    }
}
