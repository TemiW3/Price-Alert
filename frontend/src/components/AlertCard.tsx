import React, { useState } from "react";
import "../app/globals.css";

interface Alert {
  id: string;
  targetPrice: number;
  isAbove: boolean;
  triggered: boolean;
  createdAt: number;
}

interface AlertCardProps {
  alert: Alert;
  currentPrice: number;
  onDelete: (id: string) => void;
  onCheck: (id: string) => void;
  loading: boolean;
}

export default function AlertCard({
  alert,
  currentPrice,
  onDelete,
  onCheck,
  loading,
}: AlertCardProps): React.ReactElement {
  // Guard against undefined alert
  if (!alert) {
    return (
      <div className="alertCard alertCardActive">
        <div className="alertCardContent">
          <div className="alertCardInfo">
            <p className="alertCardPrice">Loading alert...</p>
          </div>
        </div>
      </div>
    );
  }

  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const isPriceCloseToTarget = () => {
    if (!currentPrice || !alert.targetPrice) return false;
    const target = alert.targetPrice;
    const current = currentPrice;
    const diff = Math.abs(current - target);
    const percentDiff = (diff / target) * 100;
    return percentDiff < 5;
  };

  const getCardStyle = () => {
    if (alert.triggered) return `alertCard alertCardTriggered`;
    if (isPriceCloseToTarget()) return `alertCard alertCardClose`;
    return `alertCard alertCardActive`;
  };
  return (
    <div className={getCardStyle()}>
      <div className="alertCardContent">
        <div className="flexCol">
          <div className="alertCardHeader">
            <span className="alertCardTitle">Alert {alert.id}</span>
            {alert.triggered && (
              <span className="alertCardBadgeTriggered">
                <svg
                  className="iconSmall"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                TRIGGERED
              </span>
            )}
            {!alert.triggered && isPriceCloseToTarget() && (
              <span className="alertCardBadgeClose">⚡ CLOSE</span>
            )}
          </div>
          <div className="alertCardInfo">
            <p className="alertCardPrice">
              {alert.isAbove ? "📈 Alert ABOVE" : "📉 Alert BELOW"}
              <span className="alertCardPriceValue">
                $
                {alert.targetPrice.toLocaleString("en-UK", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </p>

            {currentPrice && !alert.triggered && (
              <p className="alertCardCurrentPrice">
                Current: $
                {currentPrice.toLocaleString("en-UK", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                {alert.isAbove ? (
                  <span className="ml-2 text-gray-500">
                    ($
                    {(alert.targetPrice - currentPrice).toFixed(2)} to go)
                  </span>
                ) : (
                  <span className="ml-2 text-gray-500">
                    ($
                    {(currentPrice - alert.targetPrice).toFixed(2)} to go)
                  </span>
                )}
              </p>
            )}

            <p className="alertCardTimestamp">
              Created: {formatTimestamp(alert.createdAt)}
            </p>
          </div>
        </div>
        {!alert.triggered && (
          <div className="alertCardButtons">
            <button
              onClick={() => onCheck(alert.id)}
              disabled={loading}
              className="buttonInfo"
            >
              🔍 Check
            </button>
            <button
              onClick={() => onDelete(alert.id)}
              disabled={loading}
              className="buttonDanger"
            >
              🗑️ Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
