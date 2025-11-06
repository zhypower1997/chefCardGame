import { Player, Synthesizer, GameState, Card, SynthesisResult } from '@/types/game';
import { SynthesisEngine } from './synthesis';
import { SurvivalManager } from './survival';
import { ExploreSystem } from './survival';
import { createCard, getRandomCardKeys } from '@/data/cards';
import { SHOP_ITEMS } from '@/data/shop';

export class GameManager {
  private player: Player;
  private synthesizer: Synthesizer;
  private synthesisEngine: SynthesisEngine;
  private survivalManager: SurvivalManager;
  private currentTurn: number = 1;
  private gameOver: boolean = false;
  private gameWon: boolean = false;
  private lastSynthesisResult: SynthesisResult | null = null;

  constructor() {
    this.player = new Player();
    this.synthesizer = new Synthesizer();
    this.synthesisEngine = new SynthesisEngine(this.synthesizer, this.player);
    this.survivalManager = new SurvivalManager(this.player);

    // 初始化玩家卡牌（给一些起始卡牌）
    // 注意：如果JSON尚未加载，会使用默认数据库（包含processingRules）
    this.initializePlayerCards();
  }

  // 初始化玩家起始卡牌
  private initializePlayerCards(): void {
    const startingCards = ['knife', 'pot', 'fire', 'tomato', 'egg', 'salt'];
    startingCards.forEach(key => {
      const card = createCard(key);
      if (card) {
        this.player.addCard(card);
      }
    });
  }

  // 重新初始化玩家卡片（在JSON加载完成后调用，确保使用最新的卡片数据）
  public reinitializePlayerCards(): void {
    // 清空现有卡片
    this.player.cards = [];
    // 重新初始化
    this.initializePlayerCards();
  }

  // 获取游戏状态
  getGameState(): GameState {
    return {
      player: this.player,
      synthesizer: this.synthesizer,
      currentTurn: this.currentTurn,
      gameOver: this.gameOver,
      gameWon: this.gameWon
    };
  }

  // 分步合成
  stepByStepSynthesis(
    cardIds: string[],
    step: 'preprocess' | 'cook' | 'season'
  ): SynthesisResult {
    const cards = cardIds
      .map(id => this.player.cards.find(c => c.id === id))
      .filter((c): c is Card => c !== undefined);

    const result = this.synthesisEngine.stepByStepSynthesis(cards, step);

    if (result.success) {
      // 消耗卡牌
      result.consumedCards.forEach(card => {
        if (card.cardType === 'auxiliary' && card.name !== '油') {
          // 辅料卡（除了油）可能还有使用次数，不直接移除
          if (card.useCount <= 0) {
            this.player.removeCard(card.id);
          }
        } else if (card.cardType === 'auxiliary' && card.name === '油') {
          // 油直接销毁
          this.player.removeCard(card.id);
        } else if (card.cardType === 'product') {
          // 成品卡在调味步骤中被替换
          this.player.removeCard(card.id);
        } else if (card.cardType === 'food' && step === 'cook') {
          // 食材卡在烹饪步骤中被消耗（预处理步骤只是标记，不消耗）
          this.player.removeCard(card.id);
        } else if (card.cardType === 'food' && step === 'preprocess') {
          // 预处理步骤：如果食材被加工了（已在result.consumedCards中），则移除
          // 否则保留（标记为已预处理）
          this.player.removeCard(card.id);
        } else if (card.cardType === 'tool' && card.currentDurability <= 0) {
          // 工具卡耐久为0时移除
          this.player.removeCard(card.id);
        } else if (card.cardType === 'special' && card.name === '火源') {
          // 火源不消耗，但燃料卡需要消耗
          // 燃料卡已经在cookStep中处理
        } else if (card.cardType === 'special' && card.name === '燃料卡') {
          // 燃料卡已被消耗
          this.player.removeCard(card.id);
        }
      });

      // 添加成品卡（仅在烹饪步骤完成后）
      if (result.productCard && step === 'cook') {
        this.player.addCard(result.productCard);
        // 成品卡添加到卡牌库，玩家可以选择何时使用
      } else if (result.productCard && step === 'season') {
        // 调味步骤中，替换原成品卡
        this.player.addCard(result.productCard);
        // 增强后的成品卡添加到卡牌库
      }
    }

    this.lastSynthesisResult = result;
    this.survivalManager.setLastSynthesisResult(result);

    return result;
  }

  // 全丢合成
  fullThrowSynthesis(cardIds: string[]): SynthesisResult {
    const cards = cardIds
      .map(id => this.player.cards.find(c => c.id === id))
      .filter((c): c is Card => c !== undefined);

    const result = this.synthesisEngine.fullThrowSynthesis(cards);

    if (result.success) {
      // 消耗所有使用的卡牌
      result.consumedCards.forEach(card => {
        // 工具卡耐久已消耗，但可能还有剩余耐久
        if (card.cardType === 'tool' && card.currentDurability <= 0) {
          this.player.removeCard(card.id);
        } else if (card.cardType === 'auxiliary') {
          // 辅料卡在全丢合成中直接销毁
          this.player.removeCard(card.id);
        } else if (card.cardType === 'food' || card.cardType === 'special') {
          // 食材和特殊卡在合成中被消耗
          this.player.removeCard(card.id);
        }
      });

      // 添加成品卡
      if (result.productCard) {
        this.player.addCard(result.productCard);
        // 成品卡添加到卡牌库，玩家可以选择何时使用
      }
    } else {
      // 合成失败，返还卡牌（卡牌已经在player.cards中，不需要额外操作）
    }

    this.lastSynthesisResult = result;
    this.survivalManager.setLastSynthesisResult(result);

    return result;
  }

  // 探索
  explore(location: 'plain' | 'mine' | 'forest' | 'market'): Card[] | null {
    // 探索消耗1能量
    if (!this.synthesizer.hasEnergy(1)) {
      return null; // 能量不足，返回null表示探索失败
    }

    this.synthesizer.consumeEnergy(1);
    const cards = ExploreSystem.explore(location);
    cards.forEach(card => this.player.addCard(card));
    return cards;
  }

  // 使用卡牌
  useCard(cardId: string): { success: boolean; message: string } {
    const card = this.player.cards.find(c => c.id === cardId);
    if (!card) {
      return { success: false, message: '卡牌不存在' };
    }

    if (card.cardType === 'product') {
      this.survivalManager.useProductCard(card);
      return { success: true, message: `使用${card.name}成功` };
    }

    // 其他卡牌的使用逻辑
    if (card.name === '修复卡') {
      // 修复工具卡
      const toolCards = this.player.getCardsByType('tool');
      if (toolCards.length > 0) {
        const toolToRepair = toolCards[0];
        toolToRepair.currentDurability = toolToRepair.maxDurability;
        this.player.removeCard(cardId);
        return { success: true, message: `修复了${toolToRepair.name}的耐久度` };
      } else {
        return { success: false, message: '没有可修复的工具卡' };
      }
    }

    if (card.name === '燃料卡') {
      // 为火源提供燃料
      const fireCard = this.player.getCardByName('火源');
      if (fireCard) {
        // 消耗燃料卡
        this.player.removeCard(cardId);
        return { success: true, message: '燃料卡已使用，火源已补充燃料' };
      } else {
        return { success: false, message: '需要火源卡才能使用燃料卡' };
      }
    }

    if (card.name === '诱饵卡') {
      // 诱饵卡主要用于应对威胁事件
      // 如果当前有野兽威胁，可以提前使用来应对
      if (this.player.currentThreat && this.player.currentThreat.requirement === '需要诱饵卡') {
        // 消耗诱饵卡并解决威胁
        this.player.removeCard(cardId);
        // 发放奖励
        const rewardNames: string[] = [];
        if (this.player.currentThreat.reward) {
          this.player.currentThreat.reward.forEach(rewardCard => {
            this.player.addCard(rewardCard);
            rewardNames.push(rewardCard.name);
          });
        }
        const threatName = this.player.currentThreat.name;
        this.player.currentThreat = null;
        const rewardMsg = rewardNames.length > 0 ? `，获得奖励：${rewardNames.join('、')}` : '';
        return { success: true, message: `使用诱饵卡成功应对${threatName}${rewardMsg}` };
      } else {
        return { success: false, message: '当前没有需要诱饵卡的威胁事件（诱饵卡会在威胁出现时自动使用）' };
      }
    }

    return { success: false, message: '无法使用此卡牌' };
  }

  // 合成转化
  transformCards(cardIds: string[]): Card | null {
    const cards = cardIds
      .map(id => this.player.cards.find(c => c.id === id))
      .filter((c): c is Card => c !== undefined);

    const result = this.survivalManager.transformCards(cards);
    if (result) {
      this.player.addCard(result);
    }
    return result;
  }

  // 下一回合
  nextTurn(): void {
    // 回合结束处理
    this.survivalManager.endTurn();

    // 检查游戏结束
    if (this.player.health <= 0) {
      this.gameOver = true;
      return;
    }

    // 回合开始处理
    this.currentTurn += 1;
    // 每回合能量自动加满
    this.synthesizer.energy = this.synthesizer.maxEnergy;
    this.survivalManager.startTurn();

    // 每回合开始发两张卡牌
    const cardKeys = getRandomCardKeys(2);
    cardKeys.forEach(key => {
      const card = createCard(key);
      if (card) {
        this.player.addCard(card);
      }
    });
  }

  // 丢弃卡牌
  discardCard(cardId: string): boolean {
    const card = this.player.cards.find(c => c.id === cardId);
    if (!card) return false;

    this.player.removeCard(cardId);
    return true;
  }

  // 售卖卡牌到市场
  sellCard(cardId: string): { success: boolean; coins: number; message: string } {
    const card = this.player.cards.find(c => c.id === cardId);
    if (!card) {
      return { success: false, coins: 0, message: '卡牌不存在' };
    }

    // 计算售价：有tradeValue的按tradeValue，没有的按类型设置默认价格
    let price = card.tradeValue;
    if (!price) {
      // 根据卡牌类型设置默认价格
      switch (card.cardType) {
        case 'product':
          price = 1; // 成品卡默认1金币
          break;
        case 'tool':
          // 工具卡按耐久度计算：当前耐久度 * 2
          price = card.currentDurability * 2;
          break;
        case 'food':
          // 食材卡：新鲜的1金币，变质的0金币
          price = card.isSpoiled() ? 0 : 1;
          break;
        case 'auxiliary':
          // 辅料卡按剩余使用次数计算：使用次数 * 1
          price = card.useCount;
          break;
        case 'special':
          // 特殊卡：逗逗狐值5金币，其他1金币
          price = card.name === '逗逗狐' ? 5 : 1;
          break;
        default:
          price = 0;
      }
    }

    // 移除卡牌并添加金币
    this.player.removeCard(cardId);
    this.player.addCoins(price);

    return {
      success: true,
      coins: price,
      message: `成功售出 ${card.name}，获得 ${price} 金币`
    };
  }

  // 从商店购买卡牌
  buyCard(cardKey: string): { success: boolean; message: string } {
    const shopItem = SHOP_ITEMS.find(item => item.cardKey === cardKey);
    if (!shopItem) {
      return { success: false, message: '商品不存在' };
    }

    // 检查金币是否足够
    if (!this.player.spendCoins(shopItem.price)) {
      return { success: false, message: `金币不足，需要 ${shopItem.price} 金币` };
    }

    // 创建卡牌并添加到玩家卡牌库
    const card = createCard(cardKey);
    if (!card) {
      // 如果创建失败，返还金币
      this.player.addCoins(shopItem.price);
      return { success: false, message: '购买失败：无法创建卡牌' };
    }

    this.player.addCard(card);
    return { success: true, message: `成功购买 ${shopItem.name}，花费 ${shopItem.price} 金币` };
  }

  // 获取商店物品列表
  getShopItems() {
    return SHOP_ITEMS;
  }

  // 开始新游戏
  startNewGame(): void {
    this.player = new Player();
    this.synthesizer = new Synthesizer();
    this.synthesisEngine = new SynthesisEngine(this.synthesizer, this.player);
    this.survivalManager = new SurvivalManager(this.player);
    this.currentTurn = 1;
    this.gameOver = false;
    this.gameWon = false;
    this.lastSynthesisResult = null;
    this.initializePlayerCards();
    this.survivalManager.startTurn();

    // 第一回合开始时也发两张卡牌
    const cardKeys = getRandomCardKeys(2);
    cardKeys.forEach(key => {
      const card = createCard(key);
      if (card) {
        this.player.addCard(card);
      }
    });
  }
}

