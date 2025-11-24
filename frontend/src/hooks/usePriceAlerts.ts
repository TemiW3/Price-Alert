import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useAccount, useConfig } from "wagmi";
import { readContract } from "wagmi/actions";
import {
  useUserAlerts,
  useActiveAlerts,
  useTriggeredAlerts,
  useDeletedAlerts,
  useAlert,
  useCurrentPrice,
  useCreateAlert,
  useDeleteAlert,
  useCheckAlert,
  useSimulateCreateAlert,
  useSimulateDeleteAlert,
  useSimulateCheckAlert,
  useTransactionReceipt,
  formatPrice,
  parsePrice,
  formatTimestamp,
  PRICE_ALERT_ADDRESS,
  PRICE_ALERT_ABI,
  type Alert,
} from "./useContract";

// Enhanced Alert interface with formatted values
export interface FormattedAlert extends Alert {
  targetPriceFormatted: string;
  createdAtFormatted: string;
  timeAgo: string;
}

// Hook for managing user's price alerts
export function usePriceAlerts() {
  const { address } = useAccount();
  const config = useConfig();
  const [transactionHash, setTransactionHash] = useState<
    `0x${string}` | undefined
  >();

  // Read queries
  const {
    data: userAlertIds,
    isLoading: isLoadingUserAlerts,
    refetch: refetchUserAlerts,
  } = useUserAlerts(address);

  const {
    data: activeAlertIds,
    isLoading: isLoadingActiveAlerts,
    refetch: refetchActiveAlerts,
  } = useActiveAlerts(address);

  const {
    data: triggeredAlertIds,
    isLoading: isLoadingTriggeredAlerts,
    refetch: refetchTriggeredAlerts,
  } = useTriggeredAlerts(address);

  const {
    data: deletedAlertIds,
    isLoading: isLoadingDeletedAlerts,
    refetch: refetchDeletedAlerts,
  } = useDeletedAlerts(address);

  const {
    data: currentPriceData,
    isLoading: isLoadingPrice,
    refetch: refetchPrice,
  } = useCurrentPrice();

  // Write contracts
  const { writeContract: createAlert, isPending: isCreatingAlert } =
    useCreateAlert();
  const { writeContract: deleteAlert, isPending: isDeletingAlert } =
    useDeleteAlert();
  const { writeContract: checkAlert, isPending: isCheckingAlert } =
    useCheckAlert();

  // Transaction receipt
  const { data: receipt, isLoading: isWaitingForReceipt } =
    useTransactionReceipt(transactionHash);

  // Helper functions
  const formatAlert = useCallback((alert: Alert): FormattedAlert => {
    const now = Date.now();
    const createdAt = Number(alert.createdAt) * 1000;
    const diffMs = now - createdAt;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    let timeAgo = "";
    if (diffDays > 0) {
      timeAgo = `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    } else if (diffHours > 0) {
      timeAgo = `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    } else {
      timeAgo = "Less than an hour ago";
    }

    return {
      ...alert,
      targetPriceFormatted: formatPrice(alert.targetPrice),
      createdAtFormatted: formatTimestamp(alert.createdAt),
      timeAgo,
    };
  }, []);

  // State for fetched alerts
  const [userAlerts, setUserAlerts] = useState<FormattedAlert[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<FormattedAlert[]>([]);
  const [triggeredAlerts, setTriggeredAlerts] = useState<FormattedAlert[]>([]);
  const [deletedAlerts, setDeletedAlerts] = useState<FormattedAlert[]>([]);
  const [isLoadingUserAlertDetails, setIsLoadingUserAlertDetails] =
    useState(false);
  const [isLoadingActiveAlertDetails, setIsLoadingActiveAlertDetails] =
    useState(false);
  const [isLoadingTriggeredAlertDetails, setIsLoadingTriggeredAlertDetails] =
    useState(false);
  const [isLoadingDeletedAlertDetails, setIsLoadingDeletedAlertDetails] =
    useState(false);

  // Auto-refresh data when transaction is completed
  useEffect(() => {
    if (receipt && receipt.status === "success") {
      // Add a small delay to ensure blockchain state is updated
      const timer = setTimeout(() => {
        refetchUserAlerts();
        refetchActiveAlerts();
        refetchTriggeredAlerts();
        refetchDeletedAlerts();
        refetchPrice();
      }, 1000); // 1 second delay

      return () => clearTimeout(timer);
    }
  }, [
    receipt,
    refetchUserAlerts,
    refetchActiveAlerts,
    refetchTriggeredAlerts,
    refetchDeletedAlerts,
    refetchPrice,
  ]);

  // Fetch user alerts when userAlertIds changes
  useEffect(() => {
    const fetchUserAlerts = async () => {
      if (
        !userAlertIds ||
        !Array.isArray(userAlertIds) ||
        userAlertIds.length === 0
      ) {
        setUserAlerts([]);
        return;
      }

      setIsLoadingUserAlertDetails(true);
      try {
        const alertPromises = (userAlertIds as readonly bigint[]).map(
          async (alertId) => {
            try {
              const result = await readContract(config, {
                address: PRICE_ALERT_ADDRESS,
                abi: PRICE_ALERT_ABI,
                functionName: "getAlert",
                args: [alertId],
              });

              // The result should be a tuple/struct with alert data
              if (result && typeof result === "object") {
                const alert = result as Alert;
                // Validate that we have the expected structure (ID can be 0, so check for !== undefined)
                if (
                  alert.id !== undefined &&
                  alert.user &&
                  alert.targetPrice !== undefined
                ) {
                  return alert;
                }
              }

              console.warn(`Invalid alert data for ID ${alertId}:`, result);
              return null;
            } catch (error) {
              console.error(`Failed to fetch alert ${alertId}:`, error);
              return null;
            }
          }
        );

        const alertResults = await Promise.all(alertPromises);
        const validAlerts = alertResults
          .filter((alert): alert is Alert => alert !== null)
          .map(formatAlert);

        setUserAlerts(validAlerts);
      } catch (error) {
        console.error("Error fetching user alerts:", error);
        setUserAlerts([]);
      } finally {
        setIsLoadingUserAlertDetails(false);
      }
    };

    fetchUserAlerts();
  }, [userAlertIds, formatAlert]);

  // Fetch active alerts when activeAlertIds changes
  useEffect(() => {
    const fetchActiveAlerts = async () => {
      if (
        !activeAlertIds ||
        !Array.isArray(activeAlertIds) ||
        activeAlertIds.length === 0
      ) {
        setActiveAlerts([]);
        return;
      }

      setIsLoadingActiveAlertDetails(true);
      try {
        const alertPromises = (activeAlertIds as readonly bigint[]).map(
          async (alertId) => {
            try {
              const result = await readContract(config, {
                address: PRICE_ALERT_ADDRESS,
                abi: PRICE_ALERT_ABI,
                functionName: "getAlert",
                args: [alertId],
              });

              // The result should be a tuple/struct with alert data
              if (result && typeof result === "object") {
                const alert = result as Alert;
                // Validate that we have the expected structure (ID can be 0, so check for !== undefined)
                if (
                  alert.id !== undefined &&
                  alert.user &&
                  alert.targetPrice !== undefined
                ) {
                  return alert;
                }
              }

              console.warn(`Invalid alert data for ID ${alertId}:`, result);
              return null;
            } catch (error) {
              console.error(`Failed to fetch alert ${alertId}:`, error);
              return null;
            }
          }
        );

        const alertResults = await Promise.all(alertPromises);
        const validAlerts = alertResults
          .filter((alert): alert is Alert => alert !== null)
          .map(formatAlert);

        setActiveAlerts(validAlerts);
      } catch (error) {
        console.error("Error fetching active alerts:", error);
        setActiveAlerts([]);
      } finally {
        setIsLoadingActiveAlertDetails(false);
      }
    };

    fetchActiveAlerts();
  }, [activeAlertIds, formatAlert]);

  // Fetch triggered alerts when triggeredAlertIds changes
  useEffect(() => {
    const fetchTriggeredAlerts = async () => {
      if (
        !triggeredAlertIds ||
        !Array.isArray(triggeredAlertIds) ||
        triggeredAlertIds.length === 0
      ) {
        setTriggeredAlerts([]);
        return;
      }

      setIsLoadingTriggeredAlertDetails(true);
      try {
        const alertPromises = (triggeredAlertIds as readonly bigint[]).map(
          async (alertId) => {
            try {
              const result = await readContract(config, {
                address: PRICE_ALERT_ADDRESS,
                abi: PRICE_ALERT_ABI,
                functionName: "getAlert",
                args: [alertId],
              });

              if (result && typeof result === "object") {
                const alert = result as Alert;
                if (
                  alert.id !== undefined &&
                  alert.user &&
                  alert.targetPrice !== undefined
                ) {
                  return alert;
                }
              }

              console.warn(
                `Invalid triggered alert data for ID ${alertId}:`,
                result
              );
              return null;
            } catch (error) {
              console.error(
                `Failed to fetch triggered alert ${alertId}:`,
                error
              );
              return null;
            }
          }
        );

        const alertResults = await Promise.all(alertPromises);
        const validAlerts = alertResults
          .filter((alert): alert is Alert => alert !== null)
          .map(formatAlert);

        setTriggeredAlerts(validAlerts);
      } catch (error) {
        console.error("Error fetching triggered alerts:", error);
        setTriggeredAlerts([]);
      } finally {
        setIsLoadingTriggeredAlertDetails(false);
      }
    };

    fetchTriggeredAlerts();
  }, [triggeredAlertIds, formatAlert, config]);

  // Fetch deleted alerts when deletedAlertIds changes
  useEffect(() => {
    const fetchDeletedAlerts = async () => {
      if (
        !deletedAlertIds ||
        !Array.isArray(deletedAlertIds) ||
        deletedAlertIds.length === 0
      ) {
        setDeletedAlerts([]);
        return;
      }

      setIsLoadingDeletedAlertDetails(true);
      try {
        const alertPromises = (deletedAlertIds as readonly bigint[]).map(
          async (alertId) => {
            try {
              const result = await readContract(config, {
                address: PRICE_ALERT_ADDRESS,
                abi: PRICE_ALERT_ABI,
                functionName: "getAlert",
                args: [alertId],
              });

              if (result && typeof result === "object") {
                const alert = result as Alert;
                if (
                  alert.id !== undefined &&
                  alert.user &&
                  alert.targetPrice !== undefined
                ) {
                  return alert;
                }
              }

              console.warn(
                `Invalid deleted alert data for ID ${alertId}:`,
                result
              );
              return null;
            } catch (error) {
              console.error(`Failed to fetch deleted alert ${alertId}:`, error);
              return null;
            }
          }
        );

        const alertResults = await Promise.all(alertPromises);
        const validAlerts = alertResults
          .filter((alert): alert is Alert => alert !== null)
          .map(formatAlert);

        setDeletedAlerts(validAlerts);
      } catch (error) {
        console.error("Error fetching deleted alerts:", error);
        setDeletedAlerts([]);
      } finally {
        setIsLoadingDeletedAlertDetails(false);
      }
    };

    fetchDeletedAlerts();
  }, [deletedAlertIds, formatAlert, config]);

  const getCurrentPrice = useCallback(() => {
    if (
      !currentPriceData ||
      !Array.isArray(currentPriceData) ||
      currentPriceData.length < 2
    ) {
      return null;
    }
    return {
      price: currentPriceData[0] as bigint,
      timestamp: currentPriceData[1] as bigint,
      priceFormatted: formatPrice(currentPriceData[0] as bigint),
      timestampFormatted: formatTimestamp(currentPriceData[1] as bigint),
    };
  }, [currentPriceData]);

  // Alert creation with simulation
  const createAlertWithSimulation = useCallback(
    async (targetPrice: string, isAbove: boolean) => {
      if (!address) throw new Error("Wallet not connected");

      try {
        // Create the alert
        const hash = await new Promise<`0x${string}`>((resolve, reject) => {
          createAlert(
            {
              address: PRICE_ALERT_ADDRESS,
              abi: PRICE_ALERT_ABI,
              functionName: "createAlert",
              args: [parsePrice(targetPrice), isAbove],
            },
            {
              onSuccess: resolve,
              onError: reject,
            }
          );
        });

        setTransactionHash(hash);

        // Refresh user alerts after successful creation
        setTimeout(() => {
          refetchUserAlerts();
        }, 2000); // Wait 2 seconds for transaction to be mined

        return hash;
      } catch (error) {
        console.error("Failed to create alert:", error);
        throw error;
      }
    },
    [address, createAlert, refetchUserAlerts]
  );

  // Alert deletion
  const deleteAlertById = useCallback(
    async (alertId: bigint) => {
      if (!address) throw new Error("Wallet not connected");

      try {
        const hash = await new Promise<`0x${string}`>((resolve, reject) => {
          deleteAlert(
            {
              address: PRICE_ALERT_ADDRESS,
              abi: PRICE_ALERT_ABI,
              functionName: "deleteAlert",
              args: [alertId],
            },
            {
              onSuccess: resolve,
              onError: reject,
            }
          );
        });

        setTransactionHash(hash);

        // Refresh all alert data after successful deletion
        setTimeout(() => {
          refetchUserAlerts();
          refetchActiveAlerts();
          refetchTriggeredAlerts();
          refetchDeletedAlerts();
        }, 2000); // Wait 2 seconds for transaction to be mined

        return hash;
      } catch (error) {
        console.error("Failed to delete alert:", error);
        throw error;
      }
    },
    [
      address,
      deleteAlert,
      refetchUserAlerts,
      refetchActiveAlerts,
      refetchTriggeredAlerts,
      refetchDeletedAlerts,
    ]
  );

  // Alert checking
  const checkAlertById = useCallback(
    async (alertId: bigint) => {
      if (!address) throw new Error("Wallet not connected");

      try {
        const hash = await new Promise<`0x${string}`>((resolve, reject) => {
          checkAlert(
            {
              address: PRICE_ALERT_ADDRESS,
              abi: PRICE_ALERT_ABI,
              functionName: "checkAlert",
              args: [alertId],
            },
            {
              onSuccess: resolve,
              onError: reject,
            }
          );
        });

        setTransactionHash(hash);
        return hash;
      } catch (error) {
        console.error("Failed to check alert:", error);
        throw error;
      }
    },
    [address, checkAlert]
  );

  // Refresh all data
  const refreshData = useCallback(() => {
    refetchUserAlerts();
    refetchActiveAlerts();
    refetchTriggeredAlerts();
    refetchDeletedAlerts();
    refetchPrice();
    // Trigger alert details refetch by updating the dependency arrays
  }, [
    refetchUserAlerts,
    refetchActiveAlerts,
    refetchTriggeredAlerts,
    refetchDeletedAlerts,
    refetchPrice,
  ]);

  // Clear transaction state
  const clearTransaction = useCallback(() => {
    setTransactionHash(undefined);
  }, []);

  return {
    // Data
    userAlerts,
    activeAlerts,
    triggeredAlerts,
    deletedAlerts,
    currentPrice: getCurrentPrice(),
    userAlertIds,
    activeAlertIds,

    // Loading states
    isLoadingUserAlerts: isLoadingUserAlerts || isLoadingUserAlertDetails,
    isLoadingActiveAlerts: isLoadingActiveAlerts || isLoadingActiveAlertDetails,
    isLoadingTriggeredAlerts:
      isLoadingTriggeredAlerts || isLoadingTriggeredAlertDetails,
    isLoadingDeletedAlerts:
      isLoadingDeletedAlerts || isLoadingDeletedAlertDetails,
    isLoadingPrice,
    isCreatingAlert,
    isDeletingAlert,
    isCheckingAlert,
    isWaitingForReceipt,

    // Actions
    createAlert: createAlertWithSimulation,
    deleteAlert: deleteAlertById,
    checkAlert: checkAlertById,
    refreshData,
    clearTransaction,

    // Transaction data
    transactionHash,
    receipt,

    // Utilities
    formatAlert,
    formatPrice,
    parsePrice,
    formatTimestamp,

    // Connection status
    isConnected: !!address,
    address,
  };
}

// Hook for individual alert management
export function useAlertDetails(alertId: bigint | undefined) {
  const { data: alert, isLoading, refetch } = useAlert(alertId);

  const formattedAlert = alert
    ? {
        ...(alert as Alert),
        targetPriceFormatted: formatPrice((alert as Alert).targetPrice),
        createdAtFormatted: formatTimestamp((alert as Alert).createdAt),
      }
    : null;

  return {
    alert: formattedAlert,
    isLoading,
    refetch,
  };
}

// Hook for alert creation with simulation
export function useCreateAlertWithSimulation() {
  const [targetPrice, setTargetPrice] = useState("");
  const [isAbove, setIsAbove] = useState(true);

  const { data: simulationData, isLoading: isSimulating } =
    useSimulateCreateAlert(targetPrice, isAbove);
  const { writeContract, isPending } = useCreateAlert();

  const createAlert = useCallback(async () => {
    if (!simulationData?.request) {
      throw new Error("Simulation failed");
    }

    return new Promise<`0x${string}`>((resolve, reject) => {
      writeContract(simulationData.request, {
        onSuccess: resolve,
        onError: reject,
      });
    });
  }, [simulationData, writeContract]);

  return {
    targetPrice,
    setTargetPrice,
    isAbove,
    setIsAbove,
    simulationData,
    isSimulating,
    createAlert,
    isPending,
    canCreate: !!simulationData?.request,
  };
}
