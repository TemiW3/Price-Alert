// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/Console.sol";

interface ITellor {
    function getDataBefore(
        bytes32 _queryId,
        uint256 _timestamp
    ) external view returns (bytes memory _value, uint256 _timestampRetrieved);

    function retrieveData(
        bytes32 _queryId,
        uint256 _timestamp
    ) external view returns (bytes memory);

    function getTimestampbyQueryIdandIndex(
        bytes32 _queryId,
        uint256 _index
    ) external view returns (uint256);

    function getNewValueCountbyQueryId(
        bytes32 _queryId
    ) external view returns (uint256);
}

contract TestPrice is Script {
    bytes32 public btcQueryId;

    // Helper function to convert timestamp to readable format
    function timestampToDateTime(
        uint256 timestamp
    )
        internal
        pure
        returns (
            uint256 year,
            uint256 month,
            uint256 day,
            uint256 hour,
            uint256 minute,
            uint256 second
        )
    {
        // Convert timestamp to date components
        second = timestamp % 60;
        timestamp /= 60;
        minute = timestamp % 60;
        timestamp /= 60;
        hour = timestamp % 24;
        timestamp /= 24;

        // Calculate days since Unix epoch (Jan 1, 1970)
        uint256 daysSinceEpoch = timestamp;

        // Simple approximation for year (accounting for leap years)
        year = 1970 + (daysSinceEpoch * 4) / 1461; // Rough calculation

        // More precise year calculation
        uint256 daysInYear;
        uint256 tempDays = daysSinceEpoch;
        year = 1970;

        while (true) {
            daysInYear = isLeapYear(year) ? 366 : 365;
            if (tempDays >= daysInYear) {
                tempDays -= daysInYear;
                year++;
            } else {
                break;
            }
        }

        // Calculate month and day
        uint256 daysRemaining = tempDays;
        month = 1;

        uint256[12] memory daysInMonth = [
            uint256(31),
            28,
            31,
            30,
            31,
            30,
            31,
            31,
            30,
            31,
            30,
            31
        ];

        // Adjust February for leap year
        if (isLeapYear(year)) {
            daysInMonth[1] = 29;
        }

        for (uint256 i = 0; i < 12; i++) {
            if (daysRemaining >= daysInMonth[i]) {
                daysRemaining -= daysInMonth[i];
                month++;
            } else {
                break;
            }
        }

        day = daysRemaining + 1;
    }

    function isLeapYear(uint256 year) internal pure returns (bool) {
        return (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
    }

    constructor() {
        // set the BTC queryId
        bytes memory _queryData = abi.encode(
            "SpotPrice",
            abi.encode("eth", "usd")
        );
        btcQueryId = keccak256(_queryData);
    }

    function run() external view {
        // Tellor Playground address for Sepolia testnet
        address tellorOracle = 0xB19584Be015c04cf6CFBF6370Fe94a58b7A38830;

        console.log("=== Testing Tellor Oracle ===");
        console.log("Oracle Address:", tellorOracle);
        console.log("BTC Query ID:", vm.toString(abi.encodePacked(btcQueryId)));

        ITellor tellor = ITellor(tellorOracle);

        // First get the count of data points to find the latest index
        console.log("\nGetting data count for query...");
        try tellor.getNewValueCountbyQueryId(btcQueryId) returns (
            uint256 count
        ) {
            console.log("Total data points:", count);

            if (count == 0) {
                console.log("No data available for this query");
                return;
            }

            // Get the latest timestamp (count - 1 since indices start at 0)
            uint256 latestIndex = count - 1;
            console.log("Getting latest timestamp at index:", latestIndex);

            try
                tellor.getTimestampbyQueryIdandIndex(btcQueryId, latestIndex)
            returns (uint256 timestamp) {
                console.log("Latest timestamp:", timestamp);

                // Try to retrieve the data using the found timestamp
                try tellor.retrieveData(btcQueryId, timestamp) returns (
                    bytes memory data
                ) {
                    console.log("Retrieved data length:", data.length);
                    console.log("Raw data:", vm.toString(data));

                    if (data.length >= 32) {
                        uint256 _value = abi.decode(data, (uint256));
                        console.log("\nSUCCESS!");
                        console.log("BTC/USD Price raw value:", _value);
                        console.log("BTC/USD Price: $", _value / 1e18);

                        // Display timestamp info
                        console.log("Data timestamp:", timestamp);

                        // Convert timestamp to readable date/time
                        (
                            uint256 year,
                            uint256 month,
                            uint256 day,
                            uint256 hour,
                            uint256 minute,
                            uint256 sec
                        ) = timestampToDateTime(timestamp);
                        console.log("Date: %s-%s-%s", year, month, day);
                        console.log("Time: %s:%s:%s UTC", hour, minute, sec);

                        // Calculate and display age
                        uint256 ageInSeconds = block.timestamp - timestamp;
                        uint256 ageInMinutes = ageInSeconds / 60;
                        uint256 ageInHours = ageInMinutes / 60;
                        uint256 ageInDays = ageInHours / 24;

                        console.log(
                            "Age: %s days, %s hours, %s minutes",
                            ageInDays,
                            ageInHours % 24,
                            ageInMinutes % 60
                        );
                    } else {
                        console.log("Data too short to decode as uint256");
                    }
                } catch Error(string memory reason) {
                    console.log("Failed to retrieve data:", reason);
                } catch {
                    console.log("Failed to retrieve data - unknown error");
                }
            } catch Error(string memory reason) {
                console.log("Failed to get timestamp:", reason);
            }
        } catch Error(string memory reason) {
            console.log("Failed to get data count:", reason);
            console.log(
                "This might mean no data has been submitted for BTC/USD yet"
            );
        }
    }
}
