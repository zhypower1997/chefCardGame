import { Card } from '@/types/game';

/**
 * 食谱配置系统
 *
 * 使用方法：
 * 1. 在 RECIPE_DATABASE 数组中添加新的食谱配置
 * 2. 配置必需食材（requiredIngredients）
 * 3. 设置基础属性（baseHealValue, baseTradeValue等）
 * 4. 可选：配置品质升级规则（qualityRules）
 * 5. 可选：配置辅料效果（auxiliaryEffects）
 *
 * 示例：
 * {
 *   id: 'my-recipe',
 *   name: '我的料理',
 *   requiredIngredients: ['食材A', '食材B'],
 *   baseQuality: 'normal',
 *   baseHealValue: 5,
 *   baseTradeValue: 3,
 *   qualityRules: {
 *     fine: { minScore: 4 },
 *     excellent: { minScore: 7, requiredTraits: ['双黄蛋'] }
 *   },
 *   auxiliaryEffects: {
 *     '盐': { healBonus: 1 }
 *   }
 * }
 */

// 食谱配方接口
export interface Recipe {
  id: string; // 配方ID
  name: string; // 成品名称
  requiredIngredients: string[]; // 必需食材（名称数组）
  optionalIngredients?: string[]; // 可选食材
  baseQuality: 'normal' | 'fine' | 'excellent'; // 基础品质
  baseHealValue: number; // 基础回复值
  baseBuffEffect?: string; // 基础buff效果
  baseTradeValue: number; // 基础交易价值
  qualityRules?: {
    // 品质升级规则
    fine?: {
      minScore?: number; // 精品所需最低分数
      requiredIngredients?: string[]; // 需要额外食材
      requiredAuxiliary?: string[]; // 需要额外辅料
    };
    excellent?: {
      minScore?: number; // 极品所需最低分数
      requiredIngredients?: string[]; // 需要额外食材
      requiredAuxiliary?: string[]; // 需要额外辅料
      requiredTraits?: string[]; // 需要触发的特性
    };
  };
  auxiliaryEffects?: {
    // 辅料效果加成
    [auxiliaryName: string]: {
      healBonus?: number; // 回复值加成
      buffEffect?: string; // buff效果
      qualityBonus?: number; // 品质分数加成
    };
  };
}

// 从JSON加载食谱数据的函数
async function loadRecipesFromJSON(): Promise<Recipe[]> {
  try {
    const response = await fetch('/recipes.json');
    if (!response.ok) {
      throw new Error('无法加载recipes.json');
    }
    const data = await response.json();
    return data as Recipe[];
  } catch (error) {
    console.warn('无法从JSON加载食谱，使用默认食谱:', error);
    return DEFAULT_RECIPE_DATABASE;
  }
}

// 默认食谱配置数据库（作为后备）
export const DEFAULT_RECIPE_DATABASE: Recipe[] = [
  {
    id: 'tomato-egg',
    name: '番茄炒蛋',
    requiredIngredients: ['番茄', '鸡蛋'],
    baseQuality: 'normal',
    baseHealValue: 4,
    baseBuffEffect: '',
    baseTradeValue: 2,
    qualityRules: {
      fine: {
        minScore: 3, // 需要至少3分才能达到精品
      },
      excellent: {
        minScore: 6, // 需要至少6分才能达到极品
        requiredTraits: ['双黄蛋', '狐运'], // 或者触发特定特性
      },
    },
    auxiliaryEffects: {
      '盐': {
        healBonus: 1,
      },
      '油': {
        buffEffect: '香煎增益',
        qualityBonus: 1,
      },
      '糖': {
        healBonus: 1,
      },
    },
  },
  {
    id: 'tomato-only',
    name: '番茄料理',
    requiredIngredients: ['番茄'],
    baseQuality: 'normal',
    baseHealValue: 2,
    baseTradeValue: 1,
  },
  {
    id: 'egg-only',
    name: '鸡蛋料理',
    requiredIngredients: ['鸡蛋'],
    baseQuality: 'normal',
    baseHealValue: 2,
    baseTradeValue: 1,
  },
  {
    id: 'mixed',
    name: '混合料理',
    requiredIngredients: [], // 空数组表示任意食材组合
    baseQuality: 'normal',
    baseHealValue: 2,
    baseTradeValue: 1,
  },
];

// 食谱配置数据库（运行时加载）
let RECIPE_DATABASE_CACHE: Recipe[] | null = null;

// 获取食谱数据库（支持从JSON加载）
export async function getRecipeDatabase(): Promise<Recipe[]> {
  if (RECIPE_DATABASE_CACHE) {
    return RECIPE_DATABASE_CACHE;
  }

  // 尝试从JSON加载
  RECIPE_DATABASE_CACHE = await loadRecipesFromJSON();
  return RECIPE_DATABASE_CACHE;
}

// 同步获取食谱数据库（使用缓存或默认值）
export function getRecipeDatabaseSync(): Recipe[] {
  if (RECIPE_DATABASE_CACHE) {
    return RECIPE_DATABASE_CACHE;
  }
  return DEFAULT_RECIPE_DATABASE;
}

// 初始化食谱数据库（在应用启动时调用）
export async function initializeRecipes(): Promise<void> {
  RECIPE_DATABASE_CACHE = await loadRecipesFromJSON();
}

// 为了向后兼容，保留原来的导出
export const RECIPE_DATABASE = DEFAULT_RECIPE_DATABASE;

// 根据食材查找匹配的食谱
export function findMatchingRecipe(ingredientNames: string[]): Recipe | null {
  const recipeDatabase = getRecipeDatabaseSync();

  // 按优先级排序：最具体的食谱优先（必需食材数量多的优先）
  const sortedRecipes = [...recipeDatabase].sort((a, b) => {
    // 优先匹配必需食材最多的（更具体的食谱）
    if (a.requiredIngredients.length !== b.requiredIngredients.length) {
      return b.requiredIngredients.length - a.requiredIngredients.length;
    }
    // 如果必需食材数量相同，保持原顺序
    return 0;
  });

  // 记录最佳匹配的食谱
  let bestMatch: Recipe | null = null;
  let bestMatchScore = 0;

  // 检查所有有必需食材的食谱
  for (const recipe of sortedRecipes) {
    // 跳过没有必需食材的食谱（稍后处理）
    if (recipe.requiredIngredients.length === 0) {
      continue;
    }

    // 检查是否包含所有必需食材
    const hasAllRequired = recipe.requiredIngredients.every(required =>
      ingredientNames.includes(required)
    );

    if (!hasAllRequired) {
      continue;
    }

    // 计算匹配分数：必需食材数量（匹配度越高分数越高）
    const matchScore = recipe.requiredIngredients.length;

    // 如果找到完全匹配的食谱（必需食材数量等于或小于食材数量），立即返回
    // 因为已经按优先级排序，第一个完全匹配的就是最匹配的
    if (matchScore > bestMatchScore) {
      bestMatch = recipe;
      bestMatchScore = matchScore;
    }
  }

  // 如果找到了匹配的食谱，返回它
  if (bestMatch) {
    return bestMatch;
  }

  // 如果没有匹配的，检查是否有通用食谱（没有必需食材的）
  for (const recipe of sortedRecipes) {
    if (recipe.requiredIngredients.length === 0) {
      return recipe;
    }
  }

  return null;
}

// 计算品质分数
export function calculateQualityScore(
  foodCards: Card[],
  toolCard: Card | null,
  auxiliaryCards: Card[],
  recipe: Recipe
): number {
  // 新鲜度分数
  const freshnessScore = foodCards.filter(f => !f.isSpoiled()).length * 2;

  // 工具分数（满耐久+1）
  const toolScore = toolCard && toolCard.currentDurability === toolCard.maxDurability ? 1 : 0;

  // 辅料分数
  const auxiliaryScore = auxiliaryCards.length * 2;

  // 辅料加成分数
  let auxiliaryBonus = 0;
  if (recipe.auxiliaryEffects) {
    for (const auxCard of auxiliaryCards) {
      const effect = recipe.auxiliaryEffects[auxCard.name];
      if (effect?.qualityBonus) {
        auxiliaryBonus += effect.qualityBonus;
      }
    }
  }

  return freshnessScore + toolScore + auxiliaryScore + auxiliaryBonus;
}

// 根据食谱和分数计算最终品质
export function calculateFinalQuality(
  recipe: Recipe,
  qualityScore: number,
  traitTriggers: Array<{ cardName: string; traitName: string; effect: any }>,
  foodCards: Card[],
  auxiliaryCards: Card[]
): 'normal' | 'fine' | 'excellent' {
  // 检查是否触发品质提升特性
  const hasQualityUpgrade = traitTriggers.some(
    t => t.effect?.qualityUpgrade || t.effect?.freeFineQuality
  );

  // 检查极品条件
  if (recipe.qualityRules?.excellent) {
    const excellentRule = recipe.qualityRules.excellent;
    const meetsScore = !excellentRule.minScore || qualityScore >= excellentRule.minScore;
    const meetsTraits =
      !excellentRule.requiredTraits ||
      excellentRule.requiredTraits.some(trait =>
        traitTriggers.some(t => t.traitName === trait)
      );

    if (meetsScore && (meetsTraits || hasQualityUpgrade)) {
      return 'excellent';
    }
  }

  // 检查精品条件
  if (recipe.qualityRules?.fine) {
    const fineRule = recipe.qualityRules.fine;
    const meetsScore = !fineRule.minScore || qualityScore >= fineRule.minScore;

    if (meetsScore || hasQualityUpgrade) {
      return 'fine';
    }
  }

  return recipe.baseQuality;
}

// 根据品质和食谱计算最终属性
export function calculateFinalProductStats(
  recipe: Recipe,
  quality: 'normal' | 'fine' | 'excellent',
  auxiliaryCards: Card[]
): {
  healValue: number;
  buffEffect: string;
  tradeValue: number;
} {
  let healValue = recipe.baseHealValue;
  let buffEffect = recipe.baseBuffEffect || '';
  let tradeValue = recipe.baseTradeValue; // 基础价格

  // 根据品质调整价格（在基础价格上增加）
  if (quality === 'fine') {
    healValue = Math.max(healValue, 6);
    buffEffect = '饱腹：2回合不消耗饥饿';
    // 精品：基础价格 + 100%（即2倍）
    tradeValue = recipe.baseTradeValue * 2;
  } else if (quality === 'excellent') {
    healValue = Math.max(healValue, 8);
    buffEffect = '饱腹：3回合不消耗饥饿，生命值+2';
    // 极品：基础价格 + 200%（即3倍）
    tradeValue = recipe.baseTradeValue * 3;
  }
  // normal品质保持基础价格不变

  // 应用辅料效果
  if (recipe.auxiliaryEffects) {
    for (const auxCard of auxiliaryCards) {
      const effect = recipe.auxiliaryEffects[auxCard.name];
      if (effect) {
        if (effect.healBonus) {
          healValue += effect.healBonus;
        }
        if (effect.buffEffect) {
          buffEffect = buffEffect ? `${buffEffect} ${effect.buffEffect}` : effect.buffEffect;
        }
      }
    }
  }

  return { healValue, buffEffect, tradeValue };
}

