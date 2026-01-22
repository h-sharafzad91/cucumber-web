'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Round } from '@/types';

interface LiveArenaSliderProps {
  arenas: Round[];
  autoPlayInterval?: number;
}

function formatTimeRemaining(endTime: string | undefined): string {
  if (!endTime) return 'No limit';

  const end = new Date(endTime).getTime();
  const now = Date.now();
  const diff = end - now;

  if (diff <= 0) return 'Ending soon';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatDuration(startTime: string | undefined): string {
  if (!startTime) return '-';

  const start = new Date(startTime).getTime();
  const now = Date.now();
  const diff = now - start;

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
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

export function LiveArenaSlider({ arenas, autoPlayInterval = 5000 }: LiveArenaSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<Record<string, string>>({});

  // Update time remaining every second
  useEffect(() => {
    const updateTimes = () => {
      const times: Record<string, string> = {};
      arenas.forEach(arena => {
        times[arena.id] = formatTimeRemaining(arena.end_time);
      });
      setTimeRemaining(times);
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    return () => clearInterval(interval);
  }, [arenas]);

  const goToNext = useCallback(() => {
    if (arenas.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % arenas.length);
  }, [arenas.length]);

  const goToPrev = useCallback(() => {
    if (arenas.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + arenas.length) % arenas.length);
  }, [arenas.length]);

  // Auto-play
  useEffect(() => {
    if (isHovered || arenas.length <= 1) return;

    const interval = setInterval(goToNext, autoPlayInterval);
    return () => clearInterval(interval);
  }, [isHovered, arenas.length, autoPlayInterval, goToNext]);

  if (arenas.length === 0) return null;

  const currentArena = arenas[currentIndex];
  const tradingPair = currentArena.trading_pair || 'BTC/USDT';
  const pairIcon = getTradingPairIcon(tradingPair);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Slider */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 border border-primary-500/50 shadow-lg shadow-primary-500/10">
        {/* Banner Background */}
        {currentArena.banner_url && (
          <div
            className="absolute inset-0 opacity-20 bg-cover bg-center"
            style={{ backgroundImage: `url(${currentArena.banner_url})` }}
          />
        )}

        {/* Live Indicator */}
        <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <span className="text-red-400 text-sm font-bold tracking-wide">LIVE</span>
        </div>

        {/* Arena Counter */}
        {arenas.length > 1 && (
          <div className="absolute top-4 right-4 bg-gray-900/80 px-3 py-1 rounded-full text-sm z-10">
            {currentIndex + 1} / {arenas.length}
          </div>
        )}

        {/* Content */}
        <div className="relative p-6 pt-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Section - Arena Info */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                <h2 className="text-3xl font-bold mb-2">{currentArena.name}</h2>
                <div className="flex flex-wrap items-center gap-3">
                  {/* Trading Pair Badge */}
                  <span className="inline-flex items-center gap-1.5 bg-primary-500/20 text-primary-400 px-3 py-1.5 rounded-lg font-medium">
                    <span className="text-lg">{pairIcon}</span>
                    <span>{tradingPair}</span>
                  </span>

                  {/* Arena Type */}
                  <span className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium",
                    currentArena.arena_type === 'contest'
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'bg-blue-500/20 text-blue-400'
                  )}>
                    {currentArena.arena_type === 'contest' ? 'Contest' : 'Tournament'}
                  </span>

                  {/* Tick Interval */}
                  <span className="bg-gray-700/50 px-3 py-1.5 rounded-lg text-sm text-gray-300">
                    {formatTickInterval(currentArena.min_tick_interval || 10)} - {formatTickInterval(currentArena.max_tick_interval || 120)} ticks
                  </span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-gray-700/30 rounded-lg p-3">
                  <span className="text-gray-400 text-xs uppercase tracking-wide">Participants</span>
                  <p className="text-xl font-bold mt-1">
                    {currentArena.current_participants || 0}
                    {currentArena.agent_limit ? (
                      <span className="text-gray-500 text-sm font-normal"> / {currentArena.agent_limit}</span>
                    ) : ''}
                  </p>
                </div>
                <div className="bg-gray-700/30 rounded-lg p-3">
                  <span className="text-gray-400 text-xs uppercase tracking-wide">Duration</span>
                  <p className="text-xl font-bold mt-1">{formatDuration(currentArena.start_time)}</p>
                </div>
                <div className="bg-gray-700/30 rounded-lg p-3">
                  <span className="text-gray-400 text-xs uppercase tracking-wide">Time Left</span>
                  <p className={cn(
                    "text-xl font-bold mt-1",
                    timeRemaining[currentArena.id] === 'Ending soon' && 'text-red-400'
                  )}>
                    {timeRemaining[currentArena.id] || '-'}
                  </p>
                </div>
                <div className="bg-gray-700/30 rounded-lg p-3">
                  <span className="text-gray-400 text-xs uppercase tracking-wide">Initial Balance</span>
                  <p className="text-xl font-bold mt-1">${currentArena.settings?.initial_balance?.toLocaleString() || '10,000'}</p>
                </div>
              </div>

              {/* Watch Button */}
              <Link
                href={`/arena/${currentArena.id}`}
                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 px-6 py-3 rounded-lg font-semibold transition group"
              >
                <span>Watch Live</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>

            {/* Right Section - Prize Pool */}
            <div className="bg-gradient-to-br from-primary-500/10 to-primary-600/5 rounded-xl p-5 border border-primary-500/20">
              <h3 className="text-gray-400 text-sm uppercase tracking-wide mb-3">Prize Pool</h3>
              <div className="text-4xl font-bold text-primary-400 mb-4">
                ${(currentArena.current_pool_size || currentArena.prize_pool_seed || 0).toLocaleString()}
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Entry Fee</span>
                  <span className="font-medium">${currentArena.buy_in_fee?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Base Seed</span>
                  <span className="font-medium">${currentArena.prize_pool_seed?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Winners</span>
                  <span className="font-medium">{currentArena.winner_count || 3}</span>
                </div>

                {/* Payout Structure */}
                {currentArena.payout_structure && (
                  <div className="pt-3 border-t border-gray-700">
                    <span className="text-gray-400 text-xs">Payout Distribution</span>
                    <div className="flex gap-2 mt-2">
                      {Object.entries(currentArena.payout_structure)
                        .sort(([a], [b]) => Number(a) - Number(b))
                        .slice(0, 3)
                        .map(([place, percent]) => (
                          <div
                            key={place}
                            className={cn(
                              "flex-1 text-center py-1.5 rounded",
                              place === '1' && "bg-yellow-500/20 text-yellow-400",
                              place === '2' && "bg-gray-400/20 text-gray-300",
                              place === '3' && "bg-orange-500/20 text-orange-400"
                            )}
                          >
                            <div className="text-xs opacity-70">#{place}</div>
                            <div className="font-bold">{percent}%</div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        {arenas.length > 1 && (
          <>
            <button
              onClick={goToPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-gray-900/80 hover:bg-gray-800 p-2 rounded-full transition z-10"
              aria-label="Previous arena"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-900/80 hover:bg-gray-800 p-2 rounded-full transition z-10"
              aria-label="Next arena"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Dots Indicator */}
      {arenas.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {arenas.map((arena, index) => (
            <button
              key={arena.id}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "w-2.5 h-2.5 rounded-full transition-all",
                index === currentIndex
                  ? "bg-primary-500 w-6"
                  : "bg-gray-600 hover:bg-gray-500"
              )}
              aria-label={`Go to arena ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Mini Cards Below (for quick navigation) */}
      {arenas.length > 1 && (
        <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
          {arenas.map((arena, index) => (
            <button
              key={arena.id}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "flex-shrink-0 bg-gray-800 rounded-lg p-3 min-w-[180px] text-left transition border",
                index === currentIndex
                  ? "border-primary-500 bg-gray-800"
                  : "border-gray-700 hover:border-gray-600"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{getTradingPairIcon(arena.trading_pair || 'BTC/USDT')}</span>
                <span className="font-medium text-sm truncate">{arena.name}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>{arena.trading_pair || 'BTC/USDT'}</span>
                <span>•</span>
                <span className="text-primary-400">${(arena.current_pool_size || 0).toLocaleString()}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
