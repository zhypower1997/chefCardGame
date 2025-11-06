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
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">商店</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">💰 {playerCoins} 金币</span>
          <button
            onClick={onToggleShop}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            {showShop ? '收起' : '商店'}
          </button>
        </div>
      </div>

      {showShop && (
        <div className="space-y-3">
          {shopItems.map(item => {
            const canAfford = playerCoins >= item.price;
            return (
              <button
                key={item.cardKey}
                onClick={() => onBuy(item.cardKey)}
                disabled={!canAfford}
                className={`
                  w-full p-4 rounded-lg border-2 transition-all text-left
                  ${canAfford
                    ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 hover:border-purple-400 hover:shadow-md'
                    : 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-50'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{item.icon || '🛒'}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-800">{item.name}</h3>
                      <span className={`text-lg font-bold ${canAfford ? 'text-purple-600' : 'text-gray-400'}`}>
                        💰 {item.price}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
          <p className="text-xs text-gray-500 mt-2">
            💡 使用金币购买工具类卡牌，提升你的合成能力
          </p>
        </div>
      )}
    </div>
  );
}

