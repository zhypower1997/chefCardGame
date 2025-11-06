'use client';

import { Card } from '@/types/game';

interface CardDisplayProps {
  card: Card;
  isSelected: boolean;
  onSelect: () => void;
  onUse: () => void;
  onDiscard?: () => void;
  onSell?: () => void;
}

export function CardDisplay({ card, isSelected, onSelect, onUse, onDiscard, onSell }: CardDisplayProps) {
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
        relative border-2 rounded-lg p-1.5 cursor-pointer transition-all
        ${getCardColor()}
        ${isSelected ? 'ring-2 ring-yellow-400 scale-[1.03] z-50 shadow-lg' : 'hover:scale-[1.02] z-10'}
      `}
      style={{ transformOrigin: 'center center' }}
      onClick={onSelect}
    >
      <div className="flex justify-between items-start mb-1">
        <h3 className="font-bold text-sm text-gray-800 leading-tight">
          {card.name}
        </h3>
        <span className="text-xs bg-white px-1 py-0.5 rounded text-gray-600 leading-tight">
          {getCardTypeLabel()}
        </span>
      </div>

      {/* 工具卡耐久度 */}
      {card.cardType === 'tool' && (
        <div className="text-xs text-gray-600 mb-0.5">
          耐久: {card.currentDurability}/{card.maxDurability}
        </div>
      )}

      {/* 食材变质回合 */}
      {card.cardType === 'food' && (
        <div className="space-y-0.5">
          <div className={`text-xs ${card.isSpoiled() ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
            {card.isSpoiled() ? '已变质' : `剩余: ${card.remainingSpoil}回合`}
          </div>
          {card.isPreprocessed && (
            <div className="text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded font-semibold">
              ✂️ 已预处理
            </div>
          )}
        </div>
      )}

      {/* 辅料使用次数 */}
      {card.cardType === 'auxiliary' && (
        <div className="text-xs text-gray-600 mb-0.5">
          使用次数: {card.useCount}
        </div>
      )}

      {/* 特性 */}
      {card.trait && (
        <div className="text-xs text-purple-600 mb-0.5 leading-tight">
          ✨ {card.trait.name}
        </div>
      )}

      {/* 效果描述 */}
      {card.effect && (
        <div className="text-xs text-gray-500 mb-0.5 leading-tight line-clamp-2">
          {card.effect}
        </div>
      )}

      {/* 成品卡属性 */}
      {card.cardType === 'product' && (
        <div className="text-xs text-gray-600 space-y-0.5">
          {card.healValue && (
            <div>回复: {card.healValue} 饥饿</div>
          )}
          {card.buffEffect && (
            <div className="text-orange-600 line-clamp-1">💫 {card.buffEffect}</div>
          )}
          {card.tradeValue && (
            <div>交易价值: {card.tradeValue}</div>
          )}
        </div>
      )}

      {/* 操作按钮区域 */}
      <div className="mt-1 space-y-0.5">
        {/* 使用按钮（成品卡和可使用的特殊卡） */}
        {(card.cardType === 'product' || 
          (card.cardType === 'special' && (card.name === '燃料卡' || card.name === '诱饵卡' || card.name === '修复卡'))) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUse();
            }}
            className="w-full bg-orange-500 text-white text-xs py-0.5 rounded hover:bg-orange-600"
          >
            使用
          </button>
        )}

        {/* 操作按钮组 */}
        <div className="grid grid-cols-2 gap-0.5">
          {/* 丢弃按钮 */}
          {onDiscard && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onDiscard();
              }}
              className="bg-gray-400 text-white text-xs py-0.5 rounded hover:bg-gray-500"
            >
              丢弃
            </button>
          )}

          {/* 售卖按钮 */}
          {onSell && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const price = card.tradeValue || 
                  (card.cardType === 'tool' ? card.currentDurability * 2 :
                   card.cardType === 'food' ? (card.isSpoiled() ? 0 : 1) :
                   card.cardType === 'auxiliary' ? card.useCount :
                   card.cardType === 'special' ? (card.name === '逗逗狐' ? 5 : 1) :
                   card.cardType === 'product' ? 1 : 0);
                if (confirm(`确定要以 ${price} 金币的价格售出 ${card.name} 吗？`)) {
                  onSell();
                }
              }}
              className="bg-green-500 text-white text-xs py-0.5 rounded hover:bg-green-600"
            >
              售卖
            </button>
          )}
        </div>
      </div>

      {/* 选中标记 */}
      {isSelected && (
        <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">✓</span>
        </div>
      )}
    </div>
  );
}

