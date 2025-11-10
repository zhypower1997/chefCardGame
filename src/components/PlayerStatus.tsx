'use client';

import { Player, Synthesizer } from '@/types/game';

interface PlayerStatusProps {
  player: Player;
  synthesizer: Synthesizer;
}

export function PlayerStatus({ player, synthesizer }: PlayerStatusProps) {
  return (
    <div className="bg-white rounded-lg p-3 shadow-lg">
      <h2 className="text-lg font-bold mb-2 text-gray-800">玩家状态</h2>
      
      {/* 生命值 */}
      <div className="mb-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-gray-700 font-semibold text-sm">❤️ 生命值</span>
          <span className={`text-base font-bold ${
            player.health <= 3 ? 'text-gray-800' : 
            player.health <= 6 ? 'text-gray-700' : 'text-gray-700'
          }`}>
            {player.health}/{player.maxHealth}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all striped-bg"
            style={{
              width: `${(player.health / player.maxHealth) * 100}%`,
              backgroundColor: player.health <= 3 ? '#1f2937' : player.health <= 6 ? '#4b5563' : '#6b7280',
            }}
          />
        </div>
      </div>

      {/* 饥饿值 */}
      <div className="mb-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-gray-700 font-semibold text-sm">🍖 饥饿值</span>
          <span className={`text-base font-bold ${
            player.hunger === 0 ? 'text-gray-800' : 
            player.hunger <= 3 ? 'text-gray-700' : 'text-gray-700'
          }`}>
            {player.hunger}/{player.maxHunger}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all striped-bg"
            style={{
              width: `${(player.hunger / player.maxHunger) * 100}%`,
              backgroundColor: player.hunger === 0 ? '#1f2937' : player.hunger <= 3 ? '#4b5563' : '#6b7280',
            }}
          />
        </div>
        {player.hunger === 0 && (
          <p className="text-xs text-gray-800 mt-0.5">⚠️ 饥饿值为0，每回合扣1生命值</p>
        )}
      </div>

      {/* Buff效果 */}
      {player.buffs.length > 0 && (
        <div className="mb-2">
          <h3 className="text-xs font-semibold text-gray-700 mb-1">💫 Buff效果</h3>
          <div className="space-y-0.5">
            {player.buffs.map((buff, index) => (
              <div key={index} className="bg-gray-100 p-1 rounded text-xs">
                <span className="font-medium">{buff.name}</span>
                <span className="text-gray-600 ml-1">剩余 {buff.remainingTurns} 回合</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 金币 */}
      <div className="mb-2">
        <div className="flex justify-between items-center">
          <span className="text-gray-700 font-semibold text-sm">💰 金币</span>
          <span className="text-base font-bold text-gray-700">
            {player.coins}
          </span>
        </div>
      </div>

      {/* 卡牌统计 */}
      <div className="grid grid-cols-4 gap-1.5 text-xs">
        <div className="bg-gray-100 p-1.5 rounded">
          <div className="font-semibold text-gray-700 text-xs">工具</div>
          <div className="text-xl font-bold text-gray-700">
            {player.getCardsByType('tool').length}
          </div>
        </div>
        <div className="bg-gray-100 p-1.5 rounded">
          <div className="font-semibold text-gray-700 text-xs">食材</div>
          <div className="text-xl font-bold text-gray-700">
            {player.getCardsByType('food').length}
          </div>
        </div>
        <div className="bg-gray-100 p-1.5 rounded">
          <div className="font-semibold text-gray-700 text-xs">辅料</div>
          <div className="text-xl font-bold text-gray-700">
            {player.getCardsByType('auxiliary').length}
          </div>
        </div>
        <div className="bg-gray-100 p-1.5 rounded">
          <div className="font-semibold text-gray-700 text-xs">成品</div>
          <div className="text-xl font-bold text-gray-700">
            {player.getCardsByType('product').length}
          </div>
        </div>
      </div>
    </div>
  );
}

