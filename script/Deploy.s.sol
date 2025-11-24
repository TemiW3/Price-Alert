// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {PriceAlert} from "../src/PriceAlert.sol";

contract Deploy is Script {
    // Tellor contract address on Sepolia testnet
    address constant TELLOR_ADDRESS =
        0xB19584Be015c04cf6CFBF6370Fe94a58b7A38830;

    // ETH/USD query ID for Tellor (SpotPrice query for ETH/USD)
    bytes32 constant ETH_USD_QUERY_ID =
        keccak256(abi.encode("SpotPrice", abi.encode("eth", "usd")));

    function run() external {
        deployPriceAlert();
    }

    function deployPriceAlert() private returns (PriceAlert) {
        vm.startBroadcast();

        PriceAlert priceAlert = new PriceAlert(
            TELLOR_ADDRESS,
            ETH_USD_QUERY_ID
        );

        vm.stopBroadcast();

        console.log("PriceAlert deployed at:", address(priceAlert));
        console.log("Tellor Address:", TELLOR_ADDRESS);
        console.log("Query ID:", vm.toString(ETH_USD_QUERY_ID));

        return priceAlert;
    }
}
