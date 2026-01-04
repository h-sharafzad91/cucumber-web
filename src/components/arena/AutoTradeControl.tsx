"use client";

import { useState, useEffect, useCallback } from "react";
import { resumeRound, pauseRound, getSchedulerStatus } from "@/lib/api";
import { useArenaStore } from "@/stores/arena-store";
import { cn } from "@/lib/utils";

interface AutoTradeControlProps {
  roundId: string;
  roundStatus: string;
  minTickInterval?: number;
  maxTickInterval?: number;
  onStatusChange?: (status: string) => void;
}

export function AutoTradeControl({
  roundId,
  roundStatus,
  minTickInterval = 10,
  maxTickInterval = 120,
  onStatusChange,
}: AutoTradeControlProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { setRound, round } = useArenaStore();

  const fetchSchedulerStatus = useCallback(async () => {
    try {
      const status = await getSchedulerStatus(roundId);
      setIsRunning(status.scheduler_running);
      setLastChecked(new Date());
      setError(null);
    } catch (err) {
      console.error("Failed to fetch scheduler status:", err);
    }
  }, [roundId]);

  useEffect(() => {
    fetchSchedulerStatus();
    const interval = setInterval(fetchSchedulerStatus, 10000);
    return () => clearInterval(interval);
  }, [fetchSchedulerStatus]);

  useEffect(() => {
    if (roundStatus !== "active") {
      setIsRunning(false);
    } else {
      fetchSchedulerStatus();
    }
  }, [roundStatus, fetchSchedulerStatus]);

  const handleResume = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await resumeRound(roundId);
      await fetchSchedulerStatus();
      if (round) {
        setRound({ ...round, status: "active" });
      }
      onStatusChange?.("active");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resume");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await pauseRound(roundId);
      await fetchSchedulerStatus();
      onStatusChange?.("paused");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to pause");
    } finally {
      setIsLoading(false);
    }
  };

  const formatInterval = (seconds: number) => {
    if (seconds >= 3600) {
      return `${seconds / 3600}h`;
    } else if (seconds >= 60) {
      return `${seconds / 60}m`;
    }
    return `${seconds}s`;
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className={cn(
                "w-3 h-3 rounded-full",
                isRunning ? "bg-green-500" : "bg-gray-500"
              )}
            />
            {isRunning && (
              <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-500 animate-ping opacity-75" />
            )}
          </div>

          <div>
            <span className="text-sm font-medium">
              Tick Scheduler: {isRunning ? "Running" : "Stopped"}
            </span>
            <p className="text-xs text-gray-400">
              Per-agent ticks: {formatInterval(minTickInterval)} - {formatInterval(maxTickInterval)}
              {lastChecked && (
                <span className="ml-2">
                  • Last checked: {lastChecked.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isRunning ? (
            <button
              onClick={handlePause}
              disabled={isLoading}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                "bg-red-600 hover:bg-red-700 text-white",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isLoading ? "..." : "Pause"}
            </button>
          ) : (
            <button
              onClick={handleResume}
              disabled={isLoading}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                "bg-green-600 hover:bg-green-700 text-white",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isLoading ? "..." : "Resume"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
