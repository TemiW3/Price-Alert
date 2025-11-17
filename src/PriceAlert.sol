// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

interface ITellor {
    function getDataBefore(
        bytes32 _queryId,
        uint256 _timestamp
    ) external view returns (bytes memory _value, uint256 _timestampRetrieved);

    function retrieveData(
        bytes32 _queryId,
        uint256 _timestamp
    ) external view returns (bytes memory);

    function getNewValueCountbyQueryId(
        bytes32 _queryId
    ) external view returns (uint256);

    function getTimestampbyQueryIdandIndex(
        bytes32 _queryId,
        uint256 _index
    ) external view returns (uint256);
}

contract PriceAlert {
    struct Alert {
        uint256 id;
        address user;
        uint256 targetPrice;
        bool isAbove;
        bool triggered;
        uint256 createdAt;
    }

    ITellor public immutable tellor;
    bytes32 public immutable queryId;

    Alert[] public alerts;
    mapping(address => uint256[]) public userAlerts;

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

    constructor(address _tellorAddress, bytes32 _queryId) {
        tellor = ITellor(_tellorAddress);
        queryId = _queryId;
    }

    function createAlert(
        uint256 _targetPrice,
        bool _isAbove
    ) external returns (uint256) {
        require(_targetPrice > 0, "Price must be > 0");

        uint256 alertId = alerts.length;

        Alert memory newAlert = Alert({
            id: alertId,
            user: msg.sender,
            targetPrice: _targetPrice,
            isAbove: _isAbove,
            triggered: false,
            createdAt: block.timestamp
        });

        alerts.push(newAlert);
        userAlerts[msg.sender].push(alertId);

        emit AlertCreated(alertId, msg.sender, _targetPrice, _isAbove);

        return alertId;
    }

    function getCurrentPrice()
        public
        view
        returns (uint256 price, uint256 timestamp)
    {
        // First, check if there's any data
        uint256 count = tellor.getNewValueCountbyQueryId(queryId);
        require(count > 0, "No data available");

        // Get the latest timestamp
        uint256 latestIndex = count - 1;
        timestamp = tellor.getTimestampbyQueryIdandIndex(queryId, latestIndex);

        // Retrieve the data
        bytes memory data = tellor.retrieveData(queryId, timestamp);
        require(data.length >= 32, "Invalid data");

        price = abi.decode(data, (uint256));
    }

    function checkAlert(uint256 _alertId) external returns (bool) {
        require(_alertId < alerts.length, "Alert does not exist");
        Alert storage alert = alerts[_alertId];

        require(!alert.triggered, "Alert already triggered");

        // Get current price from Tellor
        (uint256 currentPrice, uint256 timestamp) = getCurrentPrice();

        require(timestamp > 0, "No price data available");
        require(block.timestamp - timestamp < 24 hours, "Price data too old");

        // Check if alert condition is met
        bool shouldTrigger = false;

        if (alert.isAbove && currentPrice >= alert.targetPrice) {
            shouldTrigger = true;
        } else if (!alert.isAbove && currentPrice <= alert.targetPrice) {
            shouldTrigger = true;
        }

        if (shouldTrigger) {
            alert.triggered = true;
            emit AlertTriggered(_alertId, alert.user, currentPrice);
        }

        return shouldTrigger;
    }

    function getPriceAt(
        uint256 _timestamp
    ) public view returns (uint256 price, uint256 timestamp) {
        (bytes memory data, uint256 retrievedTimestamp) = tellor.getDataBefore(
            queryId,
            _timestamp
        );

        require(retrievedTimestamp > 0, "No data available");
        require(data.length >= 32, "Invalid data");

        price = abi.decode(data, (uint256));
        timestamp = retrievedTimestamp;
    }

    function deleteAlert(uint256 _alertId) external {
        require(_alertId < alerts.length, "Alert does not exist");
        require(alerts[_alertId].user == msg.sender, "Not your alert");
        require(!alerts[_alertId].triggered, "Alert already triggered");

        alerts[_alertId].triggered = true;

        emit AlertDeleted(_alertId, msg.sender);
    }

    function getUserAlerts(
        address _user
    ) external view returns (uint256[] memory) {
        return userAlerts[_user];
    }

    function getAlert(
        uint256 _alertId
    ) external view returns (Alert memory alert) {
        require(_alertId < alerts.length, "Alert does not exist");
        alert = alerts[_alertId];
    }

    function getTotalAlerts() external view returns (uint256) {
        return alerts.length;
    }

    function getDataFeedInfo()
        external
        view
        returns (
            uint256 totalDataPoints,
            uint256 latestPrice,
            uint256 latestTimestamp
        )
    {
        totalDataPoints = tellor.getNewValueCountbyQueryId(ethQueryId);

        if (totalDataPoints > 0) {
            (latestPrice, latestTimestamp) = getCurrentPrice();
        }
    }

    function getActiveAlerts(
        address _user
    ) external view returns (uint256[] memory) {
        uint256[] memory allAlerts = userAlerts[_user];
        uint256 activeCount = 0;

        // Count active alerts
        for (uint256 i = 0; i < allAlerts.length; i++) {
            if (!alerts[allAlerts[i]].triggered) {
                activeCount++;
            }
        }

        // Create array of active alert IDs
        uint256[] memory activeAlerts = new uint256[](activeCount);
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < allAlerts.length; i++) {
            if (!alerts[allAlerts[i]].triggered) {
                activeAlerts[currentIndex] = allAlerts[i];
                currentIndex++;
            }
        }

        return activeAlerts;
    }
}
