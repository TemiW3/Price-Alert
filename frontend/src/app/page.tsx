"use client";
import React, { useState } from "react";
import PriceCard from "@/components/PriceCard";
import AlertCard from "@/components/AlertCard";
import AlertForm from "@/components/AlertForm";
import "../app/globals.css";

export default function Home() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  return (
    <main className="container">
      <div className="innerContainer">
        <PriceCard ethPrice={} timestamp={} onRefresh={} loading={} />
        <AlertForm onCreateAlert={} loading={} />
        {/* <AlertCard /> */}
      </div>
    </main>
  );
}
