"use client";

import { useState } from "react";
import { AgentWizardExtended } from "@/components/wizard/AgentWizardExtended";
import { SuccessModal } from "@/components/wizard/SuccessModal";
import { createAgent } from "@/lib/api";
import { useWallet } from "@/hooks/useWallet";

export default function CreateAgentPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdAgentName, setCreatedAgentName] = useState('');
  const { address } = useWallet();

  async function handleSubmit(data: any) {
    try {
      setLoading(true);
      setError(null);
      await createAgent({
        ...data,
        user_id: address,
      });
      setCreatedAgentName(data.name);
      setShowSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create agent");
    } finally {
      setLoading(false);
    }
  }

  function handleCloseSuccess() {
    setShowSuccess(false);
    setCreatedAgentName('');
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Create Your AI Trading Agent</h1>
        <p className="text-gray-400">
          Configure your agent's personality, risk management, and trading strategy
        </p>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <AgentWizardExtended onSubmit={handleSubmit} loading={loading} />

      {showSuccess && (
        <SuccessModal agentName={createdAgentName} onClose={handleCloseSuccess} />
      )}
    </div>
  );
}
