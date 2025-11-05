import { Card, CardType, Trait } from '@/types/game';

// 预定义卡牌数据
export const CARD_DATABASE: Record<string, Omit<Card, 'id' | 'currentDurability' | 'remainingSpoil'>> = {
  // 工具卡
  knife: {
    cardType: 'tool' as CardType,
    name: '刀',
    maxDurability: 3,
    trait: {
      name: '锋利',
      probability: 0.1,
      effect: '10%概率加工双倍食材',
      handler: () => ({ doubleFood: true })
    }
  },
  pot: {
    cardType: 'tool' as CardType,
    name: '锅',
    maxDurability: 5,
    trait: {
      name: '导热',
      effect: '需火源激活'
    }
  },
  fire: {
    cardType: 'special' as CardType,
    name: '火源',
    maxDurability: 0,
    trait: {
      name: '燃烧',
      effect: '每回合消耗1燃料卡，必选用于热菜合成'
    }
  },
  
  // 基础食材卡
  tomato: {
    cardType: 'food' as CardType,
    name: '番茄',
    maxDurability: 0,
    spoilTurn: 3,
    trait: {
      name: '熟透',
      probability: 1,
      effect: '放置2回合后美味度+2',
      handler: (context: { turns: number }) => {
        if (context.turns >= 2) {
          return { bonusScore: 2 };
        }
        return null;
      }
    }
  },
  egg: {
    cardType: 'food' as CardType,
    name: '鸡蛋',
    maxDurability: 0,
    spoilTurn: 2,
    trait: {
      name: '双黄蛋',
      probability: 0.2,
      effect: '20%概率合成时品质提升',
      handler: () => ({ qualityUpgrade: true })
    }
  },
  
  // 辅料卡
  salt: {
    cardType: 'auxiliary' as CardType,
    name: '盐',
    maxDurability: 0,
    useCount: 3,
    effect: '美味度+1'
  },
  oil: {
    cardType: 'auxiliary' as CardType,
    name: '油',
    maxDurability: 0,
    useCount: 1,
    effect: '触发"香煎"增益'
  },
  sugar: {
    cardType: 'auxiliary' as CardType,
    name: '糖',
    maxDurability: 0,
    useCount: 2,
    effect: '甜度+1'
  },
  
  // 特殊卡
  fox: {
    cardType: 'special' as CardType,
    name: '逗逗狐',
    maxDurability: 0,
    trait: {
      name: '狐运',
      probability: 0.15,
      effect: '15%概率免消耗合成精品',
      handler: () => ({ freeFineQuality: true })
    }
  },
  fuel: {
    cardType: 'special' as CardType,
    name: '燃料卡',
    maxDurability: 0,
    useCount: 1,
    effect: '为火源提供燃料'
  },
  bait: {
    cardType: 'special' as CardType,
    name: '诱饵卡',
    maxDurability: 0,
    useCount: 1,
    effect: '应对野兽威胁'
  },
  repair: {
    cardType: 'special' as CardType,
    name: '修复卡',
    maxDurability: 0,
    useCount: 1,
    effect: '修复工具卡耐久'
  },
  
  // 成品卡示例
  tomatoEgg: {
    cardType: 'product' as CardType,
    name: '番茄炒蛋',
    maxDurability: 0,
    healValue: 4,
    buffEffect: '',
    tradeValue: 2
  },
  fineTomatoEgg: {
    cardType: 'product' as CardType,
    name: '精品番茄炒蛋',
    maxDurability: 0,
    healValue: 6,
    buffEffect: '饱腹：2回合不消耗饥饿',
    tradeValue: 5
  },
  excellentTomatoEgg: {
    cardType: 'product' as CardType,
    name: '极品番茄炒蛋',
    maxDurability: 0,
    healValue: 8,
    buffEffect: '饱腹：3回合不消耗饥饿，生命值+2',
    tradeValue: 10
  }
};

// 卡牌工厂函数
export function createCard(cardKey: string): Card | null {
  const cardData = CARD_DATABASE[cardKey];
  if (!cardData) return null;
  
  return new Card(
    cardData.cardType,
    cardData.name,
    cardData.maxDurability,
    cardData.trait,
    cardData.spoilTurn,
    cardData.useCount,
    cardData.effect,
    cardData.healValue,
    cardData.buffEffect,
    cardData.tradeValue
  );
}

// 探索地点卡牌掉落表
export const EXPLORE_DROPS: Record<string, string[]> = {
  plain: ['tomato', 'egg', 'salt'],
  mine: ['fuel', 'repair'],
  forest: ['fuel', 'oil'],
  market: ['sugar', 'oil']
};

