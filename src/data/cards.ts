import { Card, CardType, Trait, ProcessingRules } from '@/types/game';

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
        let processingRules: ProcessingRules | undefined;
        if (tool.processingRules && Object.keys(tool.processingRules).length > 0) {
          processingRules = {};
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
}

// 获取卡牌数据库（同步）
function getCardDatabase(): Record<string, Omit<Card, 'id' | 'currentDurability' | 'remainingSpoil'>> {
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
  plain: ['tomato', 'egg', 'salt', 'radish'],
  mine: ['fuel', 'repair'],
  forest: ['fuel', 'oil'],
  market: ['sugar', 'oil'],
  'vegetable-garden': ['radish'],
  'tool-shop': ['grater', 'repair']
};

