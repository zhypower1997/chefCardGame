import { Card, CardType, Trait, ProcessingRules } from '@/types/game';

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

// 从JSON加载卡牌数据的接口
interface CardDataFromJSON {
  tools?: Array<{
    key: string;
    name: string;
    maxDurability: number;
    trait?: {
      name: string;
      probability?: number;
      effect: string;
    };
    processingRules?: Record<string, string[]>;
  }>;
  foods?: Array<{
    key: string;
    name: string;
    spoilTurn: number;
    trait?: {
      name: string;
      probability?: number;
      effect: string;
    };
    isProcessed?: boolean;
  }>;
  auxiliaries?: Array<{
    key: string;
    name: string;
    useCount: number;
    effect: string;
  }>;
  specials?: Array<{
    key: string;
    name: string;
    useCount?: number;
    effect?: string;
    trait?: {
      name: string;
      probability?: number;
      effect: string;
    };
  }>;
}

// 卡牌数据缓存
let CARD_DATABASE_CACHE: Record<string, Omit<Card, 'id' | 'currentDurability' | 'remainingSpoil'>> = {};
let CARD_KEY_TO_NAME_MAP: Record<string, string> = {}; // key -> name 映射
let CARD_NAME_TO_KEY_MAP: Record<string, string> = {}; // name -> key 映射

// 从JSON加载卡牌数据
async function loadCardsFromJSON(): Promise<void> {
  try {
    const response = await fetch('/cards.json');
    if (!response.ok) {
      throw new Error('无法加载cards.json');
    }
    const data: CardDataFromJSON = await response.json();
    
    // 清空缓存
    CARD_DATABASE_CACHE = {};
    CARD_KEY_TO_NAME_MAP = {};
    CARD_NAME_TO_KEY_MAP = {};
    
    // 处理工具卡
    if (data.tools) {
      for (const tool of data.tools) {
        const processingRules: ProcessingRules = {};
        if (tool.processingRules) {
          processingRules[tool.name] = tool.processingRules;
        }
        
        const trait = tool.trait ? {
          name: tool.trait.name,
          probability: tool.trait.probability,
          effect: tool.trait.effect,
          handler: tool.trait.probability 
            ? (context: any) => {
                if (Math.random() <= tool.trait!.probability!) {
                  return { effect: tool.trait!.effect };
                }
                return null;
              }
            : undefined
        } : undefined;
        
        CARD_DATABASE_CACHE[tool.key] = {
          cardType: 'tool' as CardType,
          name: tool.name,
          maxDurability: tool.maxDurability,
          trait,
          spoilTurn: 0,
          useCount: 1,
          processingRules
        };
        CARD_KEY_TO_NAME_MAP[tool.key] = tool.name;
        CARD_NAME_TO_KEY_MAP[tool.name] = tool.key;
      }
    }
    
    // 处理食材卡
    if (data.foods) {
      for (const food of data.foods) {
        const trait = food.trait ? {
          name: food.trait.name,
          probability: food.trait.probability,
          effect: food.trait.effect,
          handler: food.trait.probability 
            ? (context: any) => {
                if (Math.random() <= food.trait!.probability!) {
                  return { effect: food.trait!.effect };
                }
                return null;
              }
            : undefined
        } : undefined;
        
        CARD_DATABASE_CACHE[food.key] = {
          cardType: 'food' as CardType,
          name: food.name,
          maxDurability: 0,
          trait,
          spoilTurn: food.spoilTurn,
          useCount: 1
        };
        CARD_KEY_TO_NAME_MAP[food.key] = food.name;
        CARD_NAME_TO_KEY_MAP[food.name] = food.key;
      }
    }
    
    // 处理辅料卡
    if (data.auxiliaries) {
      for (const aux of data.auxiliaries) {
        CARD_DATABASE_CACHE[aux.key] = {
          cardType: 'auxiliary' as CardType,
          name: aux.name,
          maxDurability: 0,
          spoilTurn: 0,
          useCount: aux.useCount,
          effect: aux.effect
        };
        CARD_KEY_TO_NAME_MAP[aux.key] = aux.name;
        CARD_NAME_TO_KEY_MAP[aux.name] = aux.key;
      }
    }
    
    // 处理特殊卡
    if (data.specials) {
      for (const special of data.specials) {
        const trait = special.trait ? {
          name: special.trait.name,
          probability: special.trait.probability,
          effect: special.trait.effect,
          handler: special.trait.probability 
            ? (context: any) => {
                if (Math.random() <= special.trait!.probability!) {
                  return { effect: special.trait!.effect };
                }
                return null;
              }
            : undefined
        } : undefined;
        
        CARD_DATABASE_CACHE[special.key] = {
          cardType: 'special' as CardType,
          name: special.name,
          maxDurability: 0,
          trait,
          spoilTurn: 0,
          useCount: special.useCount || 1,
          effect: special.effect
        };
        CARD_KEY_TO_NAME_MAP[special.key] = special.name;
        CARD_NAME_TO_KEY_MAP[special.name] = special.key;
      }
    }
  } catch (error) {
    console.warn('无法从JSON加载卡牌，使用默认卡牌:', error);
  }
}

// 初始化卡牌数据库
export async function initializeCards(): Promise<void> {
  await loadCardsFromJSON();
  // 合并默认卡牌（如果JSON中没有的）
  for (const [key, cardData] of Object.entries(CARD_DATABASE)) {
    if (!CARD_DATABASE_CACHE[key]) {
      CARD_DATABASE_CACHE[key] = cardData;
      CARD_KEY_TO_NAME_MAP[key] = cardData.name;
      CARD_NAME_TO_KEY_MAP[cardData.name] = key;
    }
  }
}

// 获取卡牌数据库（同步）
function getCardDatabase(): Record<string, Omit<Card, 'id' | 'currentDurability' | 'remainingSpoil'>> {
  if (Object.keys(CARD_DATABASE_CACHE).length === 0) {
    // 如果缓存为空，使用默认数据库
    return CARD_DATABASE;
  }
  return CARD_DATABASE_CACHE;
}

// 根据名称获取卡牌key
export function getCardKeyByName(name: string): string | null {
  return CARD_NAME_TO_KEY_MAP[name] || null;
}

// 卡牌工厂函数
export function createCard(cardKey: string): Card | null {
  const cardDatabase = getCardDatabase();
  const cardData = cardDatabase[cardKey];
  if (!cardData) return null;
  
  // 构建processingRules
  let processingRules: ProcessingRules | undefined;
  if (cardData.processingRules) {
    processingRules = cardData.processingRules;
  }
  
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
    cardData.tradeValue,
    processingRules
  );
}

// 根据名称创建卡牌
export function createCardByName(name: string): Card | null {
  const key = getCardKeyByName(name);
  if (!key) return null;
  return createCard(key);
}

// 获取所有可用的卡牌key（排除成品卡，因为成品卡只能通过合成获得）
export function getAllAvailableCardKeys(): string[] {
  const cardDatabase = getCardDatabase();
  return Object.keys(cardDatabase).filter(key => {
    const cardData = cardDatabase[key];
    // 排除成品卡
    return cardData.cardType !== 'product';
  });
}

// 随机获取指定数量的卡牌key
export function getRandomCardKeys(count: number): string[] {
  const availableKeys = getAllAvailableCardKeys();
  if (availableKeys.length === 0) return [];
  
  const shuffled = [...availableKeys].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// 探索地点卡牌掉落表
export const EXPLORE_DROPS: Record<string, string[]> = {
  plain: ['tomato', 'egg', 'salt'],
  mine: ['fuel', 'repair'],
  forest: ['fuel', 'oil'],
  market: ['sugar', 'oil']
};

