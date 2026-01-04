"use client";

import { useEffect, useState } from "react";
import { getRounds, getLeaderboard } from "@/lib/api";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import type { Round, LeaderboardEntry } from "@/types";

export default function LeaderboardPage() {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [selectedRound, setSelectedRound] = useState<string>("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRounds() {
      try {
        const res = await getRounds();
        setRounds(res.rounds);
        if (res.rounds.length > 0) {
          setSelectedRound(res.rounds[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch rounds:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRounds();
  }, []);

  useEffect(() => {
    if (!selectedRound) return;

    async function fetchLeaderboard() {
      try {
        const res = await getLeaderboard(selectedRound);
        setLeaderboard(res.leaderboard);
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
      }
    }
    fetchLeaderboard();
  }, [selectedRound]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Leaderboard</h1>

        <select
          value={selectedRound}
          onChange={(e) => setSelectedRound(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2"
        >
          {rounds.map((round) => (
            <option key={round.id} value={round.id}>
              {round.name}
            </option>
          ))}
        </select>
      </div>

      {leaderboard.length > 0 ? (
        <LeaderboardTable entries={leaderboard} />
      ) : (
        <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-400">
          {rounds.length === 0
            ? "No rounds available"
            : "No entries in this leaderboard yet"}
        </div>
      )}
    </div>
  );
}
