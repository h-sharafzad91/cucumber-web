'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Round } from '@/types';

interface ArenaListCardProps {
  arena: Round;
  onJoin?: (arena: Round) => void;
}

function formatTickInterval(seconds: number): string {
  if (seconds >= 3600) {
    const hours = seconds / 3600;
    return hours === 1 ? '1h' : `${hours}h`;
  }
  if (seconds >= 60) {
    const mins = seconds / 60;
    return mins === 1 ? '1m' : `${mins}m`;
  }
  return `${seconds}s`;
}

function formatCountdown(targetTime: string | undefined): string {
  if (!targetTime) return '-';

  const target = new Date(targetTime).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) return 'Starting soon';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function getTradingPairIcon(tradingPair: string): string {
  const base = tradingPair.split('/')[0].toUpperCase();
  const icons: Record<string, string> = {
    'BTC': '₿',
    'ETH': 'Ξ',
    'SOL': '◎',
    'AVAX': '🔺',
    'MATIC': '⬡',
    'LINK': '⬢',
    'DOT': '●',
    'ATOM': '⚛',
    'ADA': '₳',
    'XRP': '✕',
    'DOGE': '🐕',
    'SHIB': '🐕',
  };
  return icons[base] || '◉';
}

function getTradingPairColor(tradingPair: string): string {
  const base = tradingPair.split('/')[0].toUpperCase();
  const colors: Record<string, string> = {
    'BTC': 'from-orange-500/20 to-orange-600/10 border-orange-500/30',
    'ETH': 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
    'SOL': 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
    'AVAX': 'from-red-500/20 to-red-600/10 border-red-500/30',
    'MATIC': 'from-violet-500/20 to-violet-600/10 border-violet-500/30',
    'LINK': 'from-blue-400/20 to-blue-500/10 border-blue-400/30',
  };
  return colors[base] || 'from-gray-500/20 to-gray-600/10 border-gray-500/30';
}

export function ArenaListCard({ arena, onJoin }: ArenaListCardProps) {
  const [countdown, setCountdown] = useState<string>('-');
  const tradingPair = arena.trading_pair || 'BTC/USDT';
  const pairIcon = getTradingPairIcon(tradingPair);
  const pairColor = getTradingPairColor(tradingPair);

  // Update countdown every second
  useEffect(() => {
    const updateCountdown = () => {
      setCountdown(formatCountdown(arena.scheduled_start_time));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [arena.scheduled_start_time]);

  const isFilling = (arena.current_participants || 0) >= (arena.agent_limit || 100) * 0.8;
  const spotsLeft = (arena.agent_limit || 100) - (arena.current_participants || 0);

  return (
    <div
      className={cn(
        "bg-gradient-to-br rounded-xl p-5 border transition-all hover:scale-[1.02] hover:shadow-lg",
        pairColor
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{pairIcon}</div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{arena.name}</h3>
              {/* Status Badge */}
              {arena.status === 'active' && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/30 text-red-300">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  LIVE
                </span>
              )}
              {arena.status === 'completed' && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500/30 text-gray-300">
                  Ended
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-300">{tradingPair}</span>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs font-medium",
                arena.arena_type === 'contest'
                  ? 'bg-orange-500/30 text-orange-300'
                  : 'bg-blue-500/30 text-blue-300'
              )}>
                {arena.arena_type === 'contest' ? 'Contest' : 'Tournament'}
              </span>
            </div>
          </div>
        </div>

        {/* Countdown Badge for pending */}
        {arena.status === 'pending' && arena.scheduled_start_time && (
          <div className="text-right">
            <div className="text-xs text-gray-400 uppercase">Starts in</div>
            <div className={cn(
              "font-bold text-lg",
              countdown === 'Starting soon' && 'text-green-400 animate-pulse'
            )}>
              {countdown}
            </div>
          </div>
        )}

        {/* Started time for active */}
        {arena.status === 'active' && arena.start_time && (
          <div className="text-right">
            <div className="text-xs text-gray-400 uppercase">Started</div>
            <div className="font-medium text-sm">
              {new Date(arena.start_time).toLocaleTimeString()}
            </div>
          </div>
        )}

        {/* End time for completed */}
        {arena.status === 'completed' && arena.end_time && (
          <div className="text-right">
            <div className="text-xs text-gray-400 uppercase">Ended</div>
            <div className="font-medium text-sm">
              {new Date(arena.end_time).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>

      {/* Prize Pool Highlight */}
      <div className="bg-black/20 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-sm">Prize Pool</span>
          <span className="text-2xl font-bold text-primary-400">
            ${(arena.current_pool_size || arena.prize_pool_seed || 0).toLocaleString()}
          </span>
        </div>
        {arena.payout_structure && (
          <div className="flex gap-2 mt-2 text-xs">
            {Object.entries(arena.payout_structure)
              .sort(([a], [b]) => Number(a) - Number(b))
              .slice(0, 3)
              .map(([place, percent]) => (
                <span
                  key={place}
                  className={cn(
                    "px-2 py-1 rounded",
                    place === '1' && "bg-yellow-500/20 text-yellow-400",
                    place === '2' && "bg-gray-400/20 text-gray-300",
                    place === '3' && "bg-orange-500/20 text-orange-400"
                  )}
                >
                  #{place}: {percent}%
                </span>
              ))}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div>
          <span className="text-gray-400 text-xs">Entry Fee</span>
          <p className="font-medium">${arena.buy_in_fee?.toFixed(2) || '0.00'}</p>
        </div>
        <div>
          <span className="text-gray-400 text-xs">Initial Balance</span>
          <p className="font-medium">${arena.settings?.initial_balance?.toLocaleString() || '10,000'}</p>
        </div>
        <div>
          <span className="text-gray-400 text-xs">Tick Interval</span>
          <p className="font-medium">
            {formatTickInterval(arena.min_tick_interval || 10)} - {formatTickInterval(arena.max_tick_interval || 120)}
          </p>
        </div>
        <div>
          <span className="text-gray-400 text-xs">Participants</span>
          <div className="flex items-center gap-2">
            <p className="font-medium">
              {arena.current_participants || 0}
              {arena.agent_limit && <span className="text-gray-500"> / {arena.agent_limit}</span>}
            </p>
            {arena.status === 'pending' && isFilling && (
              <span className="text-xs text-yellow-400">Hot!</span>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar for Participants - only show for pending arenas */}
      {arena.status === 'pending' && arena.agent_limit && (
        <div className="mb-4">
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                isFilling ? "bg-yellow-500" : "bg-primary-500"
              )}
              style={{ width: `${Math.min(((arena.current_participants || 0) / arena.agent_limit) * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-400">
            <span>{spotsLeft} spots left</span>
            <span>{Math.round(((arena.current_participants || 0) / arena.agent_limit) * 100)}% full</span>
          </div>
        </div>
      )}

      {/* Action Button */}
      {arena.status === 'pending' && onJoin && (
        <button
          onClick={() => onJoin(arena)}
          disabled={spotsLeft <= 0}
          className={cn(
            "w-full py-3 rounded-lg font-semibold transition",
            spotsLeft <= 0
              ? "bg-gray-600 cursor-not-allowed text-gray-400"
              : "bg-primary-600 hover:bg-primary-700"
          )}
        >
          {spotsLeft <= 0 ? 'Arena Full' : 'Join Arena'}
        </button>
      )}

      {arena.status === 'active' && (
        <Link
          href={`/arena/${arena.id}`}
          className="block w-full py-3 rounded-lg font-semibold transition text-center bg-red-600 hover:bg-red-700"
        >
          Watch Live
        </Link>
      )}

      {arena.status === 'completed' && (
        <Link
          href={`/arena/${arena.id}`}
          className="block w-full py-3 rounded-lg font-semibold transition text-center bg-gray-600 hover:bg-gray-500"
        >
          View Results
        </Link>
      )}

      {arena.status === 'pending' && !onJoin && (
        <Link
          href={`/arena/${arena.id}`}
          className="block w-full py-3 rounded-lg font-semibold transition text-center bg-primary-600 hover:bg-primary-700"
        >
          View Arena
        </Link>
      )}
    </div>
  );
}
