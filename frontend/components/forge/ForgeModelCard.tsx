"use client";

import { useEffect, useState } from "react";
import ForgeViewer from "@/components/forge/ForgeViewer";
import { API_URL, authHeaders } from "@/utils/api";
import { ForgeModel, ForgeModelStatus } from "@/utils/forge";

type ForgeModelCardProps = {
  model: ForgeModel;
  onStatusChange?: (status: ForgeModelStatus) => void;
};

export default function ForgeModelCard({ model, onStatusChange }: ForgeModelCardProps) {
  const [status, setStatus] = useState<ForgeModelStatus>(model.status);
  const [progress, setProgress] = useState(model.progress ?? "0%");

  useEffect(() => {
    if (status === "success" || status === "failed") return;

    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`${API_URL}/forge/models/${encodeURIComponent(model.urn)}/status`, {
          headers: await authHeaders(),
        });
        if (!res.ok || cancelled) return;

        const data = await res.json();
        const nextStatus = (data.status ?? "pending") as ForgeModelStatus;
        setStatus(nextStatus);
        if (data.progress) setProgress(data.progress);
        onStatusChange?.(nextStatus);
      } catch {
        // keep polling on transient errors
      }
    };

    poll();
    const interval = setInterval(poll, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [model.urn, status, onStatusChange]);

  return (
    <div className="space-y-2">
      <p className="text-sm opacity-80">🏗️ {model.fileName}</p>
      {status === "success" ? (
        <ForgeViewer urn={model.urn} />
      ) : status === "failed" ? (
        <p className="text-sm text-red-400">Model translation failed. Check APS credentials and file format.</p>
      ) : (
        <p className="text-sm opacity-70">Translating model... {progress}</p>
      )}
    </div>
  );
}
