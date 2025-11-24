"use client";
import React, { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import PriceCard from "@/components/PriceCard";
import AlertCard from "@/components/AlertCard";
import AlertForm from "@/components/AlertForm";
import { WalletConnect } from "@/components/WalletConnect";
import { usePriceAlerts } from "@/hooks/usePriceAlerts";
import { useCurrentPrice } from "@/hooks/useContract";
import "../app/globals.css";

export default function Home() {
  const { isConnected } = useAccount();
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Contract hooks
  const {
    userAlerts,
    activeAlerts,
    triggeredAlerts,
    deletedAlerts,
    isLoadingUserAlerts,
    createAlert,
    deleteAlert,
    checkAlert,
    isCreatingAlert,
    isDeletingAlert,
    isCheckingAlert,
    transactionHash,
  } = usePriceAlerts();

  const {
    data: currentPriceData,
    isLoading: isPriceLoading,
    refetch: refetchPrice,
  } = useCurrentPrice();

  // Format price data - currentPriceData returns [price, timestamp]
  const ethPrice = currentPriceData
    ? (
        Number((currentPriceData as readonly [bigint, bigint])[0]) / 1e18
      ).toFixed(4)
    : "0";
  const priceTimestamp = currentPriceData
    ? Number((currentPriceData as readonly [bigint, bigint])[1])
    : 0;

  // Handle refresh price
  const handleRefreshPrice = useCallback(() => {
    refetchPrice();
    setRefreshCounter((prev) => prev + 1);
  }, [refetchPrice]);

  // Handle create alert
  const handleCreateAlert = useCallback(
    async (price: number, isAbove: boolean) => {
      if (!isConnected) return;

      try {
        await createAlert(price.toString(), isAbove);
      } catch (error) {
        console.error("Failed to create alert:", error);
      }
    },
    [createAlert, isConnected]
  );

  // Handle delete alert
  const handleDeleteAlert = useCallback(
    async (alertId: string) => {
      if (!isConnected) return;

      try {
        await deleteAlert(BigInt(alertId));
      } catch (error) {
        console.error("Failed to delete alert:", error);
      }
    },
    [deleteAlert, isConnected]
  );

  // Handle check alert
  const handleCheckAlert = useCallback(
    async (alertId: string) => {
      if (!isConnected) return;

      try {
        await checkAlert(BigInt(alertId));
      } catch (error) {
        console.error("Failed to check alert:", error);
      }
    },
    [checkAlert, isConnected]
  );

  return (
    <main className="container">
      <div className="innerContainer">
        {/* Wallet Connection */}
        <div className="mb-8">
          <WalletConnect />
        </div>

        {!isConnected ? (
          // Not connected state
          <div className="connect-wallet-prompt">
            <div className="connect-wallet-card">
              <h2 className="connect-wallet-title">
                Welcome to Price Alert DApp
              </h2>
              <p className="connect-wallet-text">
                Connect your wallet to start creating price alerts for ETH using
                Tellor Oracle data.
              </p>
              <div className="connect-wallet-features">
                <div className="feature-item">
                  <span className="feature-icon">📊</span>
                  <span>Real-time ETH price data</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🔔</span>
                  <span>Custom price alerts</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">⚡</span>
                  <span>Tellor Oracle integration</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Connected state - show main app
          <>
            {/* Price Card */}
            <PriceCard
              ethPrice={ethPrice}
              timestamp={priceTimestamp}
              onRefresh={handleRefreshPrice}
              loading={isPriceLoading}
            />

            {/* Alert Form */}
            <AlertForm
              onCreateAlert={handleCreateAlert}
              loading={isCreatingAlert}
            />

            {/* Alerts Section */}
            {isLoadingUserAlerts ? (
              <div className="loading-alerts">
                <div className="loading-spinner"></div>
                <p>Loading your alerts...</p>
              </div>
            ) : (
              <div className="alertSection">
                <h3 className="alertSectionHeader">
                  <span className="alertSectionIndicatorActive"></span>
                  Your Alerts ({userAlerts.length})
                </h3>

                {userAlerts.length === 0 ? (
                  <div className="no-alerts">
                    <div className="no-alerts-card">
                      <h4>No alerts yet</h4>
                      <p>Create your first price alert above to get started!</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Active Alerts */}
                    {activeAlerts.length > 0 && (
                      <div className="alertSubsection">
                        <h4 className="alertSubsectionHeader">
                          <span className="alertStatusDot alertStatusActive"></span>
                          Active Alerts ({activeAlerts.length})
                        </h4>
                        <div className="alertList">
                          {activeAlerts.map((alert) => (
                            <AlertCard
                              key={alert.id.toString()}
                              alert={{
                                id: alert.id.toString(),
                                targetPrice: Number(alert.targetPrice) / 1e18,
                                isAbove: alert.isAbove,
                                triggered: alert.triggered,
                                deleted: alert.deleted,
                                createdAt: Number(alert.createdAt),
                              }}
                              currentPrice={parseFloat(ethPrice)}
                              onDelete={handleDeleteAlert}
                              onCheck={handleCheckAlert}
                              loading={isDeletingAlert || isCheckingAlert}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Triggered Alerts */}
                    {triggeredAlerts.length > 0 && (
                      <div className="alertSubsection">
                        <h4 className="alertSubsectionHeader">
                          <span className="alertStatusDot alertStatusTriggered"></span>
                          Triggered Alerts ({triggeredAlerts.length})
                        </h4>
                        <div className="alertList">
                          {triggeredAlerts.map((alert) => (
                            <AlertCard
                              key={alert.id.toString()}
                              alert={{
                                id: alert.id.toString(),
                                targetPrice: Number(alert.targetPrice) / 1e18,
                                isAbove: alert.isAbove,
                                triggered: alert.triggered,
                                deleted: alert.deleted,
                                createdAt: Number(alert.createdAt),
                              }}
                              currentPrice={parseFloat(ethPrice)}
                              onDelete={handleDeleteAlert}
                              onCheck={handleCheckAlert}
                              loading={isDeletingAlert || isCheckingAlert}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Deleted Alerts */}
                    {deletedAlerts.length > 0 && (
                      <div className="alertSubsection">
                        <h4 className="alertSubsectionHeader">
                          <span className="alertStatusDot alertStatusDeleted"></span>
                          Deleted Alerts ({deletedAlerts.length})
                        </h4>
                        <div className="alertList">
                          {deletedAlerts.map((alert) => (
                            <AlertCard
                              key={alert.id.toString()}
                              alert={{
                                id: alert.id.toString(),
                                targetPrice: Number(alert.targetPrice) / 1e18,
                                isAbove: alert.isAbove,
                                triggered: alert.triggered,
                                deleted: alert.deleted,
                                createdAt: Number(alert.createdAt),
                              }}
                              currentPrice={parseFloat(ethPrice)}
                              onDelete={handleDeleteAlert}
                              onCheck={handleCheckAlert}
                              loading={isDeletingAlert || isCheckingAlert}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Transaction Status */}
            {transactionHash && (
              <div className="transaction-status">
                <div className="notification notificationSuccess">
                  <span className="notificationIcon">✅</span>
                  <div className="notificationContent">
                    <p className="notificationText">Transaction submitted!</p>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transaction-link"
                    >
                      View on Etherscan
                    </a>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
