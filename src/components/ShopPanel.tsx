'use client';

import { SHOP_ITEMS } from '@/data/shop';

interface ShopPanelProps {
  onBuy: (cardKey: string) => void;
  showShop: boolean;
  onToggleShop: () => void;
  playerCoins: number;
}

export function ShopPanel({ onBuy, showShop, onToggleShop, playerCoins }: ShopPanelProps) {
  const shopItems = SHOP_ITEMS;

  return (
    <div className="bg-white rounded-lg p-3 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-gray-800">商店</h2>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-600">💰 {playerCoins}</span>
          <button
            onClick={onToggleShop}
            className="px-2 py-1 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm"
          >
            {showShop ? '收起' : '商店'}
          </button>
        </div>
      </div>

      {showShop && (
        <div className="space-y-1.5">
          {shopItems.map(item => {
            const canAfford = playerCoins >= item.price;
            return (
              <button
                key={item.cardKey}
                onClick={() => onBuy(item.cardKey)}
                disabled={!canAfford}
                className={`
                  w-full p-2 rounded-lg border-2 transition-all text-left
                  ${canAfford
                    ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 hover:border-purple-400 hover:shadow-md'
                    : 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-50'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{item.icon || '🛒'}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-800 text-sm">{item.name}</h3>
                      <span className={`text-base font-bold ${canAfford ? 'text-purple-600' : 'text-gray-400'}`}>
                        💰 {item.price}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">{item.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
          <p className="text-xs text-gray-500 mt-1">
            💡 使用金币购买工具类卡牌，提升你的合成能力
          </p>
        </div>
      )}
    </div>
  );
}

