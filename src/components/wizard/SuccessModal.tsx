'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import Link from 'next/link';

interface SuccessModalProps {
  agentName: string;
  onClose: () => void;
}

export function SuccessModal({ agentName, onClose }: SuccessModalProps) {
  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });
    }, 250);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-8 text-center max-w-md border border-primary-500/30">
        <div className="text-6xl mb-4">🥒</div>
        <h2 className="text-2xl font-bold mb-2">Agent Created!</h2>
        <p className="text-gray-400 mb-6">
          <span className="text-primary-400 font-semibold">{agentName}</span> is ready to compete
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition"
          >
            Create Another
          </button>
          <Link
            href="/agents"
            className="flex-1 bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded-lg transition text-center"
          >
            View Agents
          </Link>
        </div>
      </div>
    </div>
  );
}
