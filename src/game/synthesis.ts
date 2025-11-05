import { Card, SynthesisResult, SynthesisStep, Synthesizer, Player } from '@/types/game';

// 分步合成逻辑
export class SynthesisEngine {
  private synthesizer: Synthesizer;
  private player: Player;

  constructor(synthesizer: Synthesizer, player: Player) {
    this.synthesizer = synthesizer;
    this.player = player;
  }

  // 分步合成
  stepByStepSynthesis(
    cards: Card[],
    step: SynthesisStep
  ): SynthesisResult {
    if (!this.synthesizer.hasEnergy(1)) {
      return {
        success: false,
        message: '合成器能量不足',
        consumedCards: [],
        quality: 'normal'
      };
    }

    let result: SynthesisResult;

    switch (step) {
      case 'preprocess':
        result = this.preprocessStep(cards);
        break;
      case 'cook':
        result = this.cookStep(cards);
        break;
      case 'season':
        result = this.seasonStep(cards);
        break;
      default:
        result = {
          success: false,
          message: '未知的合成步骤',
          consumedCards: [],
          quality: 'normal'
        };
    }

    if (!result.success) {
      this.synthesizer.consumeEnergy(1);
    }

    return result;
  }

  // 预处理步骤（食材加工）
  private preprocessStep(cards: Card[]): SynthesisResult {
    const toolCard = cards.find(c => c.cardType === 'tool' && c.name === '刀');
    const foodCards = cards.filter(c => c.cardType === 'food');

    if (!toolCard || !toolCard.isUsable()) {
      return {
        success: false,
        message: '需要可用的刀进行预处理',
        consumedCards: [],
        quality: 'normal'
      };
    }

    if (foodCards.length === 0) {
      return {
        success: false,
        message: '需要食材进行预处理',
        consumedCards: [],
        quality: 'normal'
      };
    }

    // 消耗工具耐久
    toolCard.consumeDurability(1);

    // 触发特性
    const traitTriggers: Array<{ cardName: string; traitName: string; effect: any }> = [];
    const toolTrait = toolCard.triggerTrait({});
    if (toolTrait) {
      traitTriggers.push({
        cardName: toolCard.name,
        traitName: toolCard.trait!.name,
        effect: toolTrait
      });
    }

    // 处理食材特性
    for (const foodCard of foodCards) {
      const foodTrait = foodCard.triggerTrait({});
      if (foodTrait) {
        traitTriggers.push({
          cardName: foodCard.name,
          traitName: foodCard.trait!.name,
          effect: foodTrait
        });
      }
    }

    return {
      success: true,
      message: '预处理完成',
      consumedCards: [toolCard], // 预处理只消耗工具卡，食材卡保留
      traitTriggers,
      quality: 'normal'
    };
  }

  // 烹饪步骤（锅+火源+预处理食材）
  private cookStep(cards: Card[]): SynthesisResult {
    const potCard = cards.find(c => c.cardType === 'tool' && c.name === '锅');
    const fireCard = cards.find(c => c.name === '火源');
    const preprocessedFood = cards.filter(c => c.cardType === 'food');

    if (!potCard || !potCard.isUsable()) {
      return {
        success: false,
        message: '需要可用的锅进行烹饪',
        consumedCards: [],
        quality: 'normal'
      };
    }

    if (!fireCard) {
      return {
        success: false,
        message: '需要火源进行烹饪',
        consumedCards: [],
        quality: 'normal'
      };
    }

    if (preprocessedFood.length === 0) {
      return {
        success: false,
        message: '需要预处理过的食材',
        consumedCards: [],
        quality: 'normal'
      };
    }

    // 消耗工具耐久
    potCard.consumeDurability(1);

    // 消耗火源燃料（如果有燃料卡）
    const fuelCard = cards.find(c => c.name === '燃料卡');
    if (fuelCard) {
      fuelCard.consumeUse();
    }

    // 触发特性
    const traitTriggers: Array<{ cardName: string; traitName: string; effect: any }> = [];
    for (const foodCard of preprocessedFood) {
      const foodTrait = foodCard.triggerTrait({});
      if (foodTrait) {
        traitTriggers.push({
          cardName: foodCard.name,
          traitName: foodCard.trait!.name,
          effect: foodTrait
        });
      }
    }

    // 生成成品卡
    const productCard = this.generateProduct(preprocessedFood, cards, traitTriggers);

    return {
      success: true,
      message: '烹饪完成',
      productCard,
      consumedCards: [potCard, fireCard, ...preprocessedFood, ...(fuelCard ? [fuelCard] : [])],
      traitTriggers,
      quality: productCard ? this.calculateQuality(preprocessedFood, potCard, cards) : 'normal'
    };
  }

  // 调味步骤（添加辅料）
  private seasonStep(cards: Card[]): SynthesisResult {
    const auxiliaryCards = cards.filter(c => c.cardType === 'auxiliary');
    const productCard = cards.find(c => c.cardType === 'product');

    if (!productCard) {
      return {
        success: false,
        message: '需要成品卡进行调味',
        consumedCards: [],
        quality: 'normal'
      };
    }

    if (auxiliaryCards.length === 0) {
      return {
        success: false,
        message: '需要辅料进行调味',
        consumedCards: [],
        quality: 'normal'
      };
    }

    // 消耗辅料
    const consumedAuxiliary: Card[] = [];
    for (const auxCard of auxiliaryCards) {
      if (auxCard.name === '油') {
        // 油直接销毁
        consumedAuxiliary.push(auxCard);
      } else {
        // 其他辅料消耗使用次数
        const stillUsable = auxCard.consumeUse();
        if (!stillUsable) {
          consumedAuxiliary.push(auxCard);
        }
      }
    }

    // 提升成品品质
    const enhancedProduct = this.enhanceProduct(productCard, auxiliaryCards);

    return {
      success: true,
      message: '调味完成',
      productCard: enhancedProduct,
      consumedCards: consumedAuxiliary,
      quality: this.calculateQuality([], null, [], enhancedProduct)
    };
  }

  // 全丢合成
  fullThrowSynthesis(cards: Card[]): SynthesisResult {
    if (!this.synthesizer.hasEnergy(1)) {
      return {
        success: false,
        message: '合成器能量不足',
        consumedCards: [],
        quality: 'normal'
      };
    }

    // 自动过滤无关卡并排序
    const filteredCards = this.filterAndSortCards(cards);

    // 检查必选卡
    const hasPot = filteredCards.some(c => c.cardType === 'tool' && c.name === '锅');
    const hasFire = filteredCards.some(c => c.name === '火源');
    const hasFood = filteredCards.some(c => c.cardType === 'food');
    const hasTool = filteredCards.some(c => c.cardType === 'tool' && c.name === '刀');

    if (!hasPot || !hasFire || !hasFood) {
      this.synthesizer.consumeEnergy(1);
      return {
        success: false,
        message: '必选卡缺失（需要：锅、火源、食材）',
        consumedCards: [],
        quality: 'normal'
      };
    }

    // 30%概率触发混乱烹饪
    const isChaos = Math.random() < 0.3;
    let chaosEffect = false;
    let chaosMessage = '';

    if (isChaos) {
      chaosEffect = true;
      chaosMessage = '触发混乱烹饪！';
      // 1-2张食材卡消失
      const foodCards = filteredCards.filter(c => c.cardType === 'food');
      const removeCount = Math.min(foodCards.length, Math.floor(Math.random() * 2) + 1);
      for (let i = 0; i < removeCount; i++) {
        const index = Math.floor(Math.random() * foodCards.length);
        foodCards.splice(index, 1);
      }
      chaosMessage += ` ${removeCount}张食材卡消失！`;
    }

    // 执行全流程（双倍消耗工具卡）
    const toolCards = filteredCards.filter(c => c.cardType === 'tool');
    toolCards.forEach(tool => tool.consumeDurability(2));

    // 辅料卡直接销毁
    const auxiliaryCards = filteredCards.filter(c => c.cardType === 'auxiliary');
    auxiliaryCards.forEach(aux => {
      if (aux.name === '油') {
        aux.useCount = 0;
      } else {
        aux.useCount = 0;
      }
    });

    // 生成成品
    const foodCards = filteredCards.filter(c => c.cardType === 'food');
    const traitTriggers: Array<{ cardName: string; traitName: string; effect: any }> = [];

    // 检查逗逗狐特性
    const foxCard = filteredCards.find(c => c.name === '逗逗狐');
    if (foxCard) {
      const foxTrait = foxCard.triggerTrait({});
      if (foxTrait) {
        traitTriggers.push({
          cardName: foxCard.name,
          traitName: foxCard.trait!.name,
          effect: foxTrait
        });
      }
    }

    const productCard = this.generateProduct(foodCards, filteredCards, traitTriggers, chaosEffect);

    // 计算品质
    let quality = this.calculateQuality(foodCards, toolCards[0], filteredCards, productCard);
    if (chaosEffect) {
      // 混乱烹饪品质-1
      if (quality === 'excellent') quality = 'fine';
      else if (quality === 'fine') quality = 'normal';
    }

    return {
      success: true,
      message: `全丢合成完成${chaosMessage ? '：' + chaosMessage : ''}`,
      productCard,
      consumedCards: filteredCards,
      traitTriggers,
      quality
    };
  }

  // 过滤和排序卡牌
  private filterAndSortCards(cards: Card[]): Card[] {
    // 过滤无关卡（保留工具、食材、辅料、特殊卡）
    const relevantTypes: string[] = ['tool', 'food', 'auxiliary', 'special'];
    return cards.filter(card => relevantTypes.includes(card.cardType));
  }

  // 生成成品卡
  private generateProduct(
    foodCards: Card[],
    allCards: Card[],
    traitTriggers: Array<{ cardName: string; traitName: string; effect: any }>,
    chaosEffect: boolean = false
  ): Card {
    // 根据食材组合生成对应成品
    const hasTomato = foodCards.some(c => c.name === '番茄');
    const hasEgg = foodCards.some(c => c.name === '鸡蛋');

    let baseQuality = 'normal';
    let healValue = 4;
    let buffEffect = '';
    let tradeValue = 2;

    // 检查品质提升特性
    const hasQualityUpgrade = traitTriggers.some(
      t => t.effect?.qualityUpgrade || t.effect?.freeFineQuality
    );

    if (hasQualityUpgrade || hasTomato && hasEgg) {
      // 计算基础分
      const freshnessScore = foodCards.filter(f => !f.isSpoiled()).length * 2;
      const toolScore = allCards.find(c => c.cardType === 'tool' && c.name === '锅')?.currentDurability === 5 ? 1 : 0;
      const auxiliaryScore = allCards.filter(c => c.cardType === 'auxiliary').length * 2;
      const totalScore = freshnessScore + toolScore + auxiliaryScore;

      if (totalScore >= 6 || hasQualityUpgrade) {
        baseQuality = 'excellent';
        healValue = 8;
        buffEffect = '饱腹：3回合不消耗饥饿，生命值+2';
        tradeValue = 10;
      } else if (totalScore >= 3) {
        baseQuality = 'fine';
        healValue = 6;
        buffEffect = '饱腹：2回合不消耗饥饿';
        tradeValue = 5;
      }
    }

    if (chaosEffect) {
      healValue = Math.max(2, healValue - 1);
    }

    const productName = baseQuality === 'excellent' 
      ? '极品番茄炒蛋' 
      : baseQuality === 'fine' 
      ? '精品番茄炒蛋' 
      : '番茄炒蛋';

    return new Card(
      'product',
      productName,
      0,
      undefined,
      0,
      1,
      undefined,
      healValue,
      buffEffect,
      tradeValue
    );
  }

  // 增强成品（调味后）
  private enhanceProduct(productCard: Card, auxiliaryCards: Card[]): Card {
    // 创建增强后的成品副本
    const enhanced = new Card(
      productCard.cardType,
      productCard.name,
      productCard.maxDurability,
      productCard.trait,
      productCard.spoilTurn,
      productCard.useCount,
      productCard.effect,
      productCard.healValue,
      productCard.buffEffect,
      productCard.tradeValue
    );

    // 根据辅料提升属性
    const hasSalt = auxiliaryCards.some(c => c.name === '盐');
    const hasOil = auxiliaryCards.some(c => c.name === '油');
    const hasSugar = auxiliaryCards.some(c => c.name === '糖');

    if (hasSalt && enhanced.healValue) {
      enhanced.healValue += 1;
    }
    if (hasOil) {
      enhanced.buffEffect = (enhanced.buffEffect || '') + ' 香煎增益';
    }
    if (hasSugar) {
      enhanced.healValue = (enhanced.healValue || 0) + 1;
    }

    return enhanced;
  }

  // 计算品质
  private calculateQuality(
    foodCards: Card[],
    toolCard: Card | null,
    allCards: Card[],
    productCard?: Card
  ): 'normal' | 'fine' | 'excellent' {
    if (productCard) {
      if (productCard.name.includes('极品')) return 'excellent';
      if (productCard.name.includes('精品')) return 'fine';
      return 'normal';
    }

    // 基础分计算
    const freshnessScore = foodCards.filter(f => !f.isSpoiled()).length * 2;
    const toolScore = toolCard && toolCard.currentDurability === toolCard.maxDurability ? 1 : 0;
    const auxiliaryScore = allCards.filter(c => c.cardType === 'auxiliary').length * 2;
    const totalScore = freshnessScore + toolScore + auxiliaryScore;

    if (totalScore >= 6) return 'excellent';
    if (totalScore >= 3) return 'fine';
    return 'normal';
  }
}

