import React, { useState } from "react";
import "../app/global.css";

interface AlertFormProps {
  onCreateAlert: (price: number, isAbove: boolean) => void;
  loading: boolean;
}

export default function AlertForm({
  onCreateAlert,
  loading,
}: AlertFormProps): React.ReactElement {
  const [targetPrice, setTargetPrice] = useState("");
  const [alertType, setAlertType] = useState("above");

  const handleSubmit = () => {
    if (targetPrice && parseFloat(targetPrice) > 0) {
      onCreateAlert(parseFloat(targetPrice), alertType === "above");
      setTargetPrice("");
    }
  };

  return (
    <div className="formCard">
      <h2 className="formHeader">
        <span></span>
      </h2>

      <div>
        <div className="formGrid">
          <div>
            <label className="formLabel" htmlFor="targetPrice">
              Alert type
            </label>

            <select
              value={alertType}
              onChange={(e) => setAlertType(e.target.value)}
              className="formInput"
            >
              <option value="above">Above</option>
              <option value="below">Below</option>
            </select>
          </div>

          <div>
            <label className="formLabel" htmlFor="targetPrice">
              Target Price
            </label>
            <input
              type="number"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="e.g., 3500.00"
              step="0.01"
              min="0"
              className="formInput"
            />
          </div>
        </div>

        <button
          className="formSubmitBtn"
          onClick={handleSubmit}
          disabled={loading || !targetPrice || parseFloat(targetPrice) <= 0}
        >
          {loading ? "Creating Alert..." : "Create Alert"}
        </button>
      </div>

      <div className="formTip">
        <p className="formTipText">
          💡 <strong>Tip:</strong> Your alert will trigger when the ETH/USD
          price {alertType === "above" ? "rises above" : "falls below"} your
          target price. Click "Check Alert" to manually verify.
        </p>
      </div>
    </div>
  );
}
