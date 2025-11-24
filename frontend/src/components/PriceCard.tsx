import React from "react";
import "../app/globals.css";

interface PriceCardProps {
  ethPrice: string;
  timestamp: number;
  onRefresh: () => void;
  loading: boolean;
}

export default function PriceCard({
  ethPrice,
  timestamp,
  onRefresh,
  loading,
}: PriceCardProps): React.ReactElement {
  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const getTimeAgo = (timestamp: number) => {
    if (!timestamp) return "N/A";
    const seconds = Math.floor(Date.now() / 1000) - timestamp;
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours} hour(s) ago`;
    if (minutes > 0) return `${minutes} minute(s) ago`;
    return `${seconds} second(s) ago`;
  };

  return (
    <div className="priceCard">
      <div className="priceCardHeader">
        <div>
          <h3 className="priceCardLabel">
            ETH/USD Price{" "}
            {loading && <span className="loadingDot">Refreshing...</span>}
          </h3>
          <span className="priceCardValue">
            $
            {loading ? (
              <span className="loadingText">Refreshing...</span>
            ) : ethPrice ? (
              parseFloat(ethPrice).toLocaleString("en-UK", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            ) : (
              "Loading..."
            )}
          </span>
        </div>
        <button
          className="priceCardRefreshBtn"
          onClick={onRefresh}
          disabled={loading}
          title={loading ? "Refreshing..." : "Refresh Price"}
        >
          <svg
            className={loading ? "iconSpin" : "iconSmall"}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      <div className="priceCardFooter">
        <div className="priceCardInfo">
          <p>Last updated: {formatTimestamp(timestamp)}</p>
          <p>Time ago: {getTimeAgo(timestamp)}</p>
        </div>
      </div>
    </div>
  );
}
