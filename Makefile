-include .env

.PHONY: all test clean deploy fund help install snapshot format anvil 

build:; forge build

test :; forge test 

deploy-sepolia:
	@forge script script/Deploy.s.sol:Deploy --rpc-url $(SEPOLIA_RPC_URL) --account metamaskTestAccount --broadcast --verify --etherscan-api-key $(ETHERSCAN_API_KEY) -vvvv