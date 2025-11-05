import { Player, Synthesizer, GameState, Card, SynthesisResult } from '@/types/game';
import { SynthesisEngine } from './synthesis';
import { SurvivalManager } from './survival';
import { ExploreSystem } from './survival';
import { createCard } from '@/data/cards';

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
          // 预处理步骤不消耗食材卡，只是加工
          // 食材卡保留，等待烹饪步骤使用
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
  explore(location: 'plain' | 'mine' | 'forest' | 'market'): Card[] {
    const cards = ExploreSystem.explore(location);
    cards.forEach(card => this.player.addCard(card));
    return cards;
  }

  // 使用卡牌
  useCard(cardId: string): boolean {
    const card = this.player.cards.find(c => c.id === cardId);
    if (!card) return false;

    if (card.cardType === 'product') {
      this.survivalManager.useProductCard(card);
      return true;
    }

    // 其他卡牌的使用逻辑
    if (card.name === '修复卡') {
      // 修复工具卡
      const toolCards = this.player.getCardsByType('tool');
      if (toolCards.length > 0) {
        const toolToRepair = toolCards[0];
        toolToRepair.currentDurability = toolToRepair.maxDurability;
        this.player.removeCard(cardId);
        return true;
      }
    }

    if (card.name === '燃料卡') {
      // 为火源提供燃料（这里简化处理，直接消耗）
      const fireCard = this.player.getCardByName('火源');
      if (fireCard) {
        this.player.removeCard(cardId);
        return true;
      }
    }

    return false;
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
    this.synthesizer.recoverEnergy(1);
    this.survivalManager.startTurn();
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
  }
}

