'use client';

import { useState, useCallback, useEffect } from 'react';
import { useWebSocket, type TickUpdate } from '@/hooks/useWebSocket';

interface LiveMarketPriceProps {
  roundId: string;
  initialPrice?: number;
  tradingPair?: string;
}

export function LiveMarketPrice({ roundId, initialPrice = 0, tradingPair = 'BTC/USDT' }: LiveMarketPriceProps) {
  const [price, setPrice] = useState<number>(initialPrice);
  const [prevPrice, setPrevPrice] = useState<number>(initialPrice);
  const [tickNumber, setTickNumber] = useState<number>(0);

  useEffect(() => {
    if (initialPrice > 0) {
      setPrice(currentPrice => {
        if (currentPrice === 0) {
          setPrevPrice(initialPrice);
          return initialPrice;
        }
        return currentPrice;
      });
    }
  }, [initialPrice]);

  const handleTickUpdate = useCallback((data: TickUpdate) => {
    setPrice(prevCurrentPrice => {
      setPrevPrice(prevCurrentPrice);
      return data.market_price;
    });

    if (data.tick_number >= 0) {
      setTickNumber(data.tick_number);
    }
  }, []);

  const { isConnected } = useWebSocket({
    roundId,
    onTick: handleTickUpdate,
  });

  const priceChange = price - prevPrice;
  const priceDirection = priceChange > 0 ? 'up' : priceChange < 0 ? 'down' : 'neutral';

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm text-gray-400">{tradingPair}</h3>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
            }`}
          />
          <span className="text-xs text-gray-400">Tick #{tickNumber}</span>
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold">
          ${price.toFixed(2)}
        </span>
        {priceDirection !== 'neutral' && (
          <span
            className={`text-sm font-medium ${
              priceDirection === 'up' ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {priceDirection === 'up' ? '↑' : '↓'} ${Math.abs(priceChange).toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );
}
