'use client';

import { Card } from '@/types/game';

interface CardDisplayProps {
  card: Card;
  isSelected: boolean;
  onSelect: () => void;
  onUse: () => void;
}

export function CardDisplay({ card, isSelected, onSelect, onUse }: CardDisplayProps) {
  const getCardColor = () => {
    switch (card.cardType) {
      case 'tool':
        return 'bg-blue-100 border-blue-400';
      case 'food':
        return card.isSpoiled() ? 'bg-gray-300 border-gray-500' : 'bg-green-100 border-green-400';
      case 'auxiliary':
        return 'bg-yellow-100 border-yellow-400';
      case 'special':
        return 'bg-purple-100 border-purple-400';
      case 'product':
        return 'bg-orange-100 border-orange-400';
      default:
        return 'bg-gray-100 border-gray-400';
    }
  };

  const getCardTypeLabel = () => {
    switch (card.cardType) {
      case 'tool':
        return '工具';
      case 'food':
        return '食材';
      case 'auxiliary':
        return '辅料';
      case 'special':
        return '特殊';
      case 'product':
        return '成品';
      default:
        return '';
    }
  };

  return (
    <div
      className={`
        relative border-2 rounded-lg p-3 cursor-pointer transition-all
        ${getCardColor()}
        ${isSelected ? 'ring-4 ring-yellow-400 scale-105' : 'hover:scale-105'}
      `}
      onClick={onSelect}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-lg text-gray-800">{card.name}</h3>
        <span className="text-xs bg-white px-2 py-1 rounded text-gray-600">
          {getCardTypeLabel()}
        </span>
      </div>

      {/* 工具卡耐久度 */}
      {card.cardType === 'tool' && (
        <div className="text-sm text-gray-600 mb-1">
          耐久: {card.currentDurability}/{card.maxDurability}
        </div>
      )}

      {/* 食材变质回合 */}
      {card.cardType === 'food' && (
        <div className={`text-sm mb-1 ${card.isSpoiled() ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
          {card.isSpoiled() ? '已变质' : `剩余: ${card.remainingSpoil}回合`}
        </div>
      )}

      {/* 辅料使用次数 */}
      {card.cardType === 'auxiliary' && (
        <div className="text-sm text-gray-600 mb-1">
          使用次数: {card.useCount}
        </div>
      )}

      {/* 特性 */}
      {card.trait && (
        <div className="text-xs text-purple-600 mb-1">
          ✨ {card.trait.name}
        </div>
      )}

      {/* 效果描述 */}
      {card.effect && (
        <div className="text-xs text-gray-500 mb-1">
          {card.effect}
        </div>
      )}

      {/* 成品卡属性 */}
      {card.cardType === 'product' && (
        <div className="text-xs text-gray-600 space-y-1">
          {card.healValue && (
            <div>回复: {card.healValue} 饥饿</div>
          )}
          {card.buffEffect && (
            <div className="text-orange-600">💫 {card.buffEffect}</div>
          )}
          {card.tradeValue && (
            <div>交易价值: {card.tradeValue}</div>
          )}
        </div>
      )}

      {/* 使用按钮（成品卡） */}
      {card.cardType === 'product' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUse();
          }}
          className="mt-2 w-full bg-orange-500 text-white text-xs py-1 rounded hover:bg-orange-600"
        >
          使用
        </button>
      )}

      {/* 选中标记 */}
      {isSelected && (
        <div className="absolute top-1 right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">✓</span>
        </div>
      )}
    </div>
  );
}

