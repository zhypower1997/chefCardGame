'use client';

import { Player, Synthesizer } from '@/types/game';

interface PlayerStatusProps {
  player: Player;
  synthesizer: Synthesizer;
}

export function PlayerStatus({ player, synthesizer }: PlayerStatusProps) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">玩家状态</h2>
      
      {/* 生命值 */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-700 font-semibold">❤️ 生命值</span>
          <span className={`text-lg font-bold ${
            player.health <= 3 ? 'text-red-600' : 
            player.health <= 6 ? 'text-orange-600' : 'text-green-600'
          }`}>
            {player.health}/{player.maxHealth}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all ${
              player.health <= 3 ? 'bg-red-500' : 
              player.health <= 6 ? 'bg-orange-500' : 'bg-green-500'
            }`}
            style={{ width: `${(player.health / player.maxHealth) * 100}%` }}
          />
        </div>
      </div>

      {/* 饥饿值 */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-700 font-semibold">🍖 饥饿值</span>
          <span className={`text-lg font-bold ${
            player.hunger === 0 ? 'text-red-600' : 
            player.hunger <= 3 ? 'text-orange-600' : 'text-green-600'
          }`}>
            {player.hunger}/{player.maxHunger}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all ${
              player.hunger === 0 ? 'bg-red-500' : 
              player.hunger <= 3 ? 'bg-orange-500' : 'bg-green-500'
            }`}
            style={{ width: `${(player.hunger / player.maxHunger) * 100}%` }}
          />
        </div>
        {player.hunger === 0 && (
          <p className="text-xs text-red-600 mt-1">⚠️ 饥饿值为0，每回合扣1生命值</p>
        )}
      </div>

      {/* Buff效果 */}
      {player.buffs.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">💫 Buff效果</h3>
          <div className="space-y-1">
            {player.buffs.map((buff, index) => (
              <div key={index} className="bg-purple-50 p-2 rounded text-sm">
                <span className="font-medium">{buff.name}</span>
                <span className="text-gray-600 ml-2">剩余 {buff.remainingTurns} 回合</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 金币 */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-700 font-semibold">💰 金币</span>
          <span className="text-lg font-bold text-yellow-600">
            {player.coins}
          </span>
        </div>
      </div>

      {/* 卡牌统计 */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-blue-50 p-2 rounded">
          <div className="font-semibold text-blue-700">工具</div>
          <div className="text-2xl font-bold text-blue-600">
            {player.getCardsByType('tool').length}
          </div>
        </div>
        <div className="bg-green-50 p-2 rounded">
          <div className="font-semibold text-green-700">食材</div>
          <div className="text-2xl font-bold text-green-600">
            {player.getCardsByType('food').length}
          </div>
        </div>
        <div className="bg-yellow-50 p-2 rounded">
          <div className="font-semibold text-yellow-700">辅料</div>
          <div className="text-2xl font-bold text-yellow-600">
            {player.getCardsByType('auxiliary').length}
          </div>
        </div>
        <div className="bg-orange-50 p-2 rounded">
          <div className="font-semibold text-orange-700">成品</div>
          <div className="text-2xl font-bold text-orange-600">
            {player.getCardsByType('product').length}
          </div>
        </div>
      </div>
    </div>
  );
}

