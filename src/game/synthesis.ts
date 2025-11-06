import { Card, SynthesisResult, SynthesisStep, Synthesizer, Player } from '@/types/game';
import {
  findMatchingRecipe,
  calculateQualityScore,
  calculateFinalQuality,
  calculateFinalProductStats,
} from '@/data/recipes';
import { createCardByName } from '@/data/cards';

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

    // 无论成功还是失败都消耗能量
    this.synthesizer.consumeEnergy(1);

    return result;
  }

  // 预处理步骤（食材加工）
  private preprocessStep(cards: Card[]): SynthesisResult {
    const toolCards = cards.filter(c => c.cardType === 'tool' && c.isUsable());
    const foodCards = cards.filter(c => c.cardType === 'food');

    if (toolCards.length === 0) {
      return {
        success: false,
        message: '需要可用的工具进行预处理',
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

    // 尝试匹配工具和食材的加工规则
    const traitTriggers: Array<{ cardName: string; traitName: string; effect: any }> = [];
    const processedCards: Card[] = [];
    const newCards: Card[] = [];
    let hasProcessed = false;

    // 遍历每个食材，尝试找到可以加工它的工具
    for (const foodCard of foodCards) {
      let processed = false;

      for (const toolCard of toolCards) {
        if (!toolCard.processingRules || !toolCard.processingRules[toolCard.name]) {
          console.debug(`工具 ${toolCard.name} 没有 processingRules 或规则为空`);
          continue;
        }

        const rules = toolCard.processingRules[toolCard.name];
        const resultNames = rules[foodCard.name];

        console.debug(`检查加工规则: 工具=${toolCard.name}, 食材=${foodCard.name}, 结果=${resultNames ? resultNames.join(',') : '无匹配'}`);
        console.debug(`processingRules结构:`, toolCard.processingRules);
        console.debug(`rules内容:`, rules);

        if (resultNames && resultNames.length > 0) {
          // 找到匹配的加工规则，使用第一个结果
          const resultName = resultNames[0];
          console.debug(`尝试创建加工后的食材卡: ${resultName}`);

          // 创建新的加工后的食材卡
          const newCard = createCardByName(resultName);

          if (!newCard) {
            // 如果无法创建新卡，记录错误并返回错误结果
            console.error(`无法创建加工后的食材卡: ${resultName}，工具: ${toolCard.name}，食材: ${foodCard.name}`);
            console.error(`请检查cards.json中是否有name为"${resultName}"的卡片定义`);
            // 返回错误，避免走到默认预处理逻辑
            return {
              success: false,
              message: `无法创建加工后的食材: ${resultName}，请检查卡片数据是否正确加载`,
              consumedCards: [],
              quality: 'normal'
            };
          }

          console.debug(`成功创建加工后的食材卡: ${newCard.name}`);

          // 预处理后的卡牌增加价格
          // 取原食材价格和新卡牌价格中的较大值，然后增加1
          const originalFoodPrice = foodCard.tradeValue || (foodCard.isSpoiled() ? 0 : 1);
          const newCardBasePrice = newCard.tradeValue || (newCard.isSpoiled() ? 0 : 1);
          newCard.tradeValue = Math.max(originalFoodPrice, newCardBasePrice) + 1;

          // 消耗原食材卡
          processedCards.push(foodCard);
          // 消耗工具耐久
          toolCard.consumeDurability(1);
          // 添加新卡牌
          newCards.push(newCard);
          processed = true;
          hasProcessed = true;

          // 触发工具特性
          const toolTrait = toolCard.triggerTrait({});
          if (toolTrait) {
            traitTriggers.push({
              cardName: toolCard.name,
              traitName: toolCard.trait!.name,
              effect: toolTrait
            });
          }

          break; // 找到匹配的工具后跳出
        }
      }

      // 如果没有找到匹配的加工规则，使用默认的预处理标记
      if (!processed) {
        foodCard.markAsPreprocessed();
        // 预处理后的卡牌增加价格
        const basePrice = foodCard.tradeValue || (foodCard.isSpoiled() ? 0 : 1);
        foodCard.tradeValue = basePrice + 1;

        const foodTrait = foodCard.triggerTrait({});
        if (foodTrait) {
          traitTriggers.push({
            cardName: foodCard.name,
            traitName: foodCard.trait!.name,
            effect: foodTrait
          });
        }
      }
    }

    // 如果使用了工具但没有找到匹配规则，消耗第一个工具的耐久
    if (toolCards.length > 0 && !hasProcessed) {
      toolCards[0].consumeDurability(1);
    }

    // 将新创建的卡牌添加到玩家卡牌库
    newCards.forEach(card => {
      this.player.addCard(card);
    });

    const consumedCards = [...processedCards];
    if (toolCards.length > 0 && hasProcessed) {
      consumedCards.push(...toolCards.filter(t => t.currentDurability <= 0 || consumedCards.length > 0));
    }

    return {
      success: true,
      message: hasProcessed
        ? `预处理完成，获得：${newCards.map(c => c.name).join('、')}`
        : '预处理完成',
      consumedCards: consumedCards.length > 0 ? consumedCards : (toolCards.length > 0 ? [toolCards[0]] : []),
      traitTriggers,
      quality: 'normal'
    };
  }

  // 烹饪步骤（锅+火源+预处理食材）
  private cookStep(cards: Card[]): SynthesisResult {
    const potCard = cards.find(c => c.cardType === 'tool' && c.name === '锅');
    const fireCard = cards.find(c => c.name === '火源');
    const preprocessedFood = cards.filter(c => c.isPreprocessedFood());

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
      consumedCards: [productCard, ...consumedAuxiliary], // 原始成品卡和辅料卡都需要消耗
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
      // 合成失败，消耗能量
      this.synthesizer.consumeEnergy(1);
      return {
        success: false,
        message: '必选卡缺失（需要：锅、火源、食材）',
        consumedCards: [],
        quality: 'normal'
      };
    }

    // 合成成功，消耗能量
    this.synthesizer.consumeEnergy(1);

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

    // 获取食材名称列表
    const ingredientNames = foodCards.map(f => f.name);

    // 查找匹配的食谱
    const recipe = findMatchingRecipe(ingredientNames);
    if (!recipe) {
      // 如果没有匹配的食谱，返回默认料理
      return new Card(
        'product',
        '未知料理',
        0,
        undefined,
        0,
        1,
        undefined,
        2,
        '',
        1
      );
    }

    // 获取工具卡和辅料卡
    const toolCard = allCards.find(c => c.cardType === 'tool' && c.name === '锅');
    const auxiliaryCards = allCards.filter(c => c.cardType === 'auxiliary');

    // 计算品质分数
    const qualityScore = calculateQualityScore(
      foodCards,
      toolCard || null,
      auxiliaryCards,
      recipe
    );

    // 计算最终品质
    const quality = calculateFinalQuality(
      recipe,
      qualityScore,
      traitTriggers,
      foodCards,
      auxiliaryCards
    );

    // 计算最终属性
    const { healValue: baseHealValue, buffEffect: baseBuffEffect, tradeValue: baseTradeValue } =
      calculateFinalProductStats(recipe, quality, auxiliaryCards);

    // 混乱烹饪效果
    let finalHealValue = chaosEffect ? Math.max(2, baseHealValue - 1) : baseHealValue;

    // 根据品质生成成品名称
    let productName = recipe.name;
    if (quality === 'excellent') {
      productName = `极品${recipe.name}`;
    } else if (quality === 'fine') {
      productName = `精品${recipe.name}`;
    }

    return new Card(
      'product',
      productName,
      0,
      undefined,
      0,
      1,
      undefined,
      finalHealValue,
      baseBuffEffect,
      baseTradeValue
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

    // 调味后的卡牌增加价格
    // 基础价格 + 使用的辅料数量
    const basePrice = enhanced.tradeValue || 1;
    enhanced.tradeValue = basePrice + auxiliaryCards.length;

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

