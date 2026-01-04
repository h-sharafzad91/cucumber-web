"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface AgentWizardProps {
  onSubmit: (data: {
    name: string;
    persona_config: {
      strategy: "momentum" | "mean_reversion" | "breakout" | "custom";
      risk_tolerance: "conservative" | "moderate" | "aggressive";
      goal?: string;
      description?: string;
    };
    worker_config?: {
      model?: string;
      temperature?: number;
      max_tokens?: number;
    };
  }) => void;
  loading?: boolean;
}

export function AgentWizard({ onSubmit, loading }: AgentWizardProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [riskTolerance, setRiskTolerance] = useState<"conservative" | "moderate" | "aggressive">("moderate");
  const [strategy, setStrategy] = useState<"momentum" | "mean_reversion" | "breakout" | "custom">("momentum");
  const [goal, setGoal] = useState("");
  const [description, setDescription] = useState("");

  const strategies = [
    { value: "momentum" as const, label: "Momentum", desc: "Follow price trends" },
    { value: "mean_reversion" as const, label: "Mean Reversion", desc: "Trade price corrections" },
    { value: "breakout" as const, label: "Breakout", desc: "Trade on price breakouts" },
    { value: "custom" as const, label: "Custom", desc: "Custom strategy" },
  ];

  function handleSubmit() {
    onSubmit({
      name,
      persona_config: {
        strategy,
        risk_tolerance: riskTolerance,
        goal: goal || undefined,
        description: description || undefined,
      },
    });
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={cn(
              "h-2 flex-1 rounded",
              s <= step ? "bg-primary-500" : "bg-gray-700"
            )}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Name your agent</h2>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., TrendFollower, RiskTaker"
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
          />
          <button
            onClick={() => setStep(2)}
            disabled={!name.trim()}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded-lg font-medium transition"
          >
            Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Risk Tolerance</h2>
            <div className="grid grid-cols-3 gap-3">
              {(["conservative", "moderate", "aggressive"] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setRiskTolerance(level)}
                  className={cn(
                    "p-4 rounded-lg border-2 text-center transition",
                    riskTolerance === level
                      ? "border-primary-500 bg-primary-500/10"
                      : "border-gray-700 hover:border-gray-600"
                  )}
                >
                  <div className="font-medium capitalize">{level}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {level === "conservative"
                      ? "Safer trades"
                      : level === "moderate"
                      ? "Balanced"
                      : "Higher risk"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Trading Strategy</h2>
            <div className="grid grid-cols-2 gap-3">
              {strategies.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStrategy(s.value)}
                  className={cn(
                    "p-4 rounded-lg border-2 text-left transition",
                    strategy === s.value
                      ? "border-primary-500 bg-primary-500/10"
                      : "border-gray-700 hover:border-gray-600"
                  )}
                >
                  <div className="font-medium">{s.label}</div>
                  <div className="text-xs text-gray-400 mt-1">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded-lg font-medium transition"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded-lg font-medium transition"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Agent Goal</h2>
            <p className="text-sm text-gray-400 mb-2">
              What should your agent try to achieve?
            </p>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g., Maximize returns, Steady growth, Capital preservation..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
            />
          </div>

          <div>
            <h2 className="text-lg font-semibold">Agent Description (optional)</h2>
            <p className="text-sm text-gray-400 mb-2">
              Add custom instructions for your agent's trading behavior
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Focus on ETH momentum signals. Be cautious during high volatility..."
              rows={3}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500 resize-none"
            />
          </div>

          <div className="bg-gray-700/50 rounded-lg p-4 space-y-2">
            <h3 className="font-medium">Summary</h3>
            <div className="text-sm space-y-1">
              <div>
                <span className="text-gray-400">Name:</span> {name}
              </div>
              <div>
                <span className="text-gray-400">Risk:</span> {riskTolerance}
              </div>
              <div>
                <span className="text-gray-400">Strategy:</span> {strategy.replace("_", " ")}
              </div>
              {goal && (
                <div>
                  <span className="text-gray-400">Goal:</span> {goal}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded-lg font-medium transition"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded-lg font-medium transition"
            >
              {loading ? "Creating..." : "Create Agent"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
