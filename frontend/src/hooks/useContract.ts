import {
  useReadContract,
  useWriteContract,
  useSimulateContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther, formatEther, type Address } from "viem";
import PriceAlertABI from "../abi/PriceAlert.json";
import { config } from "../lib/config";

// Contract configuration
export const PRICE_ALERT_ADDRESS = config.contracts.priceAlert as Address;
export const TELLOR_ORACLE_ADDRESS = config.contracts.tellorOracle as Address;
export const PRICE_ALERT_ABI = PriceAlertABI.abi;

// Alert type definition
export interface Alert {
  id: bigint;
  user: Address;
  targetPrice: bigint;
  isAbove: boolean;
  triggered: boolean;
  deleted: boolean;
  createdAt: bigint;
}

// Read hooks
export function useCurrentPrice() {
  return useReadContract({
    address: PRICE_ALERT_ADDRESS,
    abi: PRICE_ALERT_ABI,
    functionName: "getCurrentPrice",
  });
}

export function useUserAlerts(userAddress: Address | undefined) {
  return useReadContract({
    address: PRICE_ALERT_ADDRESS,
    abi: PRICE_ALERT_ABI,
    functionName: "getUserAlerts",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });
}

export function useActiveAlerts(userAddress: Address | undefined) {
  return useReadContract({
    address: PRICE_ALERT_ADDRESS,
    abi: PRICE_ALERT_ABI,
    functionName: "getActiveAlerts",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });
}

export function useTriggeredAlerts(userAddress: Address | undefined) {
  return useReadContract({
    address: PRICE_ALERT_ADDRESS,
    abi: PRICE_ALERT_ABI,
    functionName: "getTriggeredAlerts",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });
}

export function useDeletedAlerts(userAddress: Address | undefined) {
  return useReadContract({
    address: PRICE_ALERT_ADDRESS,
    abi: PRICE_ALERT_ABI,
    functionName: "getDeletedAlerts",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });
}

export function useAlert(alertId: bigint | undefined) {
  return useReadContract({
    address: PRICE_ALERT_ADDRESS,
    abi: PRICE_ALERT_ABI,
    functionName: "getAlert",
    args: alertId !== undefined ? [alertId] : undefined,
    query: {
      enabled: alertId !== undefined,
    },
  });
}

export function useTotalAlerts() {
  return useReadContract({
    address: PRICE_ALERT_ADDRESS,
    abi: PRICE_ALERT_ABI,
    functionName: "getTotalAlerts",
  });
}

export function useDataFeedInfo() {
  return useReadContract({
    address: PRICE_ALERT_ADDRESS,
    abi: PRICE_ALERT_ABI,
    functionName: "getDataFeedInfo",
  });
}

export function usePriceAt(timestamp: bigint | undefined) {
  return useReadContract({
    address: PRICE_ALERT_ADDRESS,
    abi: PRICE_ALERT_ABI,
    functionName: "getPriceAt",
    args: timestamp !== undefined ? [timestamp] : undefined,
    query: {
      enabled: timestamp !== undefined,
    },
  });
}

// Write hooks
export function useCreateAlert() {
  return useWriteContract();
}

export function useDeleteAlert() {
  return useWriteContract();
}

export function useCheckAlert() {
  return useWriteContract();
}

// Simulation hooks
export function useSimulateCreateAlert(targetPrice: string, isAbove: boolean) {
  const targetPriceWei = targetPrice ? parseEther(targetPrice) : BigInt(0);

  return useSimulateContract({
    address: PRICE_ALERT_ADDRESS,
    abi: PRICE_ALERT_ABI,
    functionName: "createAlert",
    args: [targetPriceWei, isAbove],
    query: {
      enabled: !!targetPrice && targetPriceWei > 0,
    },
  });
}

export function useSimulateDeleteAlert(alertId: bigint | undefined) {
  return useSimulateContract({
    address: PRICE_ALERT_ADDRESS,
    abi: PRICE_ALERT_ABI,
    functionName: "deleteAlert",
    args: alertId !== undefined ? [alertId] : undefined,
    query: {
      enabled: alertId !== undefined,
    },
  });
}

export function useSimulateCheckAlert(alertId: bigint | undefined) {
  return useSimulateContract({
    address: PRICE_ALERT_ADDRESS,
    abi: PRICE_ALERT_ABI,
    functionName: "checkAlert",
    args: alertId !== undefined ? [alertId] : undefined,
    query: {
      enabled: alertId !== undefined,
    },
  });
}

// Transaction receipt hooks
export function useTransactionReceipt(hash: `0x${string}` | undefined) {
  return useWaitForTransactionReceipt({
    hash,
    query: {
      enabled: !!hash,
    },
  });
}

// Utility functions
export function formatPrice(priceWei: bigint): string {
  return formatEther(priceWei);
}

export function parsePrice(priceEth: string): bigint {
  return parseEther(priceEth);
}

export function formatTimestamp(timestamp: bigint): string {
  return new Date(Number(timestamp) * 1000).toLocaleString();
}
