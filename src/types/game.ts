// 卡牌类型定义
export type CardType = 'tool' | 'food' | 'auxiliary' | 'special' | 'product';

// 特性接口
export interface Trait {
  name: string;
  probability?: number; // 特性触发概率（0-1）
  effect: string; // 特性效果描述
  handler?: (context: any) => any; // 特性处理函数
}

// 卡牌基础类
export class Card {
  cardType: CardType;
  name: string;
  maxDurability: number; // 工具卡初始耐久，其他类型为0
  currentDurability: number; // 当前耐久
  trait?: Trait; // 特性
  spoilTurn: number; // 食材变质回合（0为非食材）
  remainingSpoil: number; // 剩余变质回合
  useCount: number; // 辅料卡使用次数
  effect?: string; // 效果描述
  healValue?: number; // 成品卡回复值
  buffEffect?: string; // 成品卡buff效果
  tradeValue?: number; // 交易价值
  id: string; // 唯一标识

  constructor(
    cardType: CardType,
    name: string,
    maxDurability: number = 0,
    trait?: Trait,
    spoilTurn: number = 0,
    useCount: number = 1,
    effect?: string,
    healValue?: number,
    buffEffect?: string,
    tradeValue?: number
  ) {
    this.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.cardType = cardType;
    this.name = name;
    this.maxDurability = maxDurability;
    this.currentDurability = maxDurability;
    this.trait = trait;
    this.spoilTurn = spoilTurn;
    this.remainingSpoil = spoilTurn;
    this.useCount = useCount;
    this.effect = effect;
    this.healValue = healValue;
    this.buffEffect = buffEffect;
    this.tradeValue = tradeValue;
  }

  // 检查是否变质
  isSpoiled(): boolean {
    return this.cardType === 'food' && this.remainingSpoil <= 0;
  }

  // 消耗耐久度
  consumeDurability(amount: number = 1): void {
    if (this.cardType === 'tool') {
      this.currentDurability = Math.max(0, this.currentDurability - amount);
    }
  }

  // 消耗使用次数（辅料卡）
  consumeUse(): boolean {
    if (this.cardType === 'auxiliary') {
      this.useCount = Math.max(0, this.useCount - 1);
      return this.useCount > 0;
    }
    return false;
  }

  // 检查是否可用
  isUsable(): boolean {
    if (this.cardType === 'tool') {
      return this.currentDurability > 0;
    }
    if (this.cardType === 'auxiliary') {
      return this.useCount > 0;
    }
    return true;
  }

  // 触发特性（如果存在）
  triggerTrait(context: any): any {
    if (!this.trait) return null;
    if (this.trait.probability && Math.random() > this.trait.probability) {
      return null;
    }
    if (this.trait.handler) {
      return this.trait.handler(context);
    }
    return { traitName: this.trait.name, effect: this.trait.effect };
  }
}

// 合成步骤类型
export type SynthesisStep = 'preprocess' | 'cook' | 'season';

// 合成结果
export interface SynthesisResult {
  success: boolean;
  productCard?: Card;
  quality: 'normal' | 'fine' | 'excellent'; // 普通、精品、极品
  message: string;
  consumedCards: Card[];
  traitTriggers?: Array<{ cardName: string; traitName: string; effect: any }>;
}

// 合成器类
export class Synthesizer {
  energy: number; // 能量值（上限3）
  maxEnergy: number = 3;
  successRate: number = 1.0; // 基础成功率

  constructor() {
    this.energy = this.maxEnergy;
  }

  // 恢复能量
  recoverEnergy(amount: number = 1): void {
    this.energy = Math.min(this.maxEnergy, this.energy + amount);
  }

  // 消耗能量
  consumeEnergy(amount: number = 1): boolean {
    if (this.energy >= amount) {
      this.energy -= amount;
      return true;
    }
    return false;
  }

  // 检查是否有足够能量
  hasEnergy(amount: number = 1): boolean {
    return this.energy >= amount;
  }
}

// 任务类型
export interface Task {
  id: string;
  description: string;
  target: string; // 任务目标描述
  reward?: Card[]; // 奖励卡牌
  penalty?: number; // 失败惩罚（生命值）
  timeLimit?: number; // 时间限制（回合数）
  remainingTurns?: number; // 剩余回合数
  completed: boolean;
}

// 威胁事件类型
export interface ThreatEvent {
  id: string;
  name: string;
  description: string;
  requirement: string; // 应对要求（如"需要诱饵卡"）
  reward?: Card[];
  penalty?: number; // 失败惩罚
  timeLimit?: number;
  remainingTurns?: number;
}

// 玩家状态类
export class Player {
  hunger: number = 10; // 饥饿值
  maxHunger: number = 10;
  health: number = 10; // 生命值
  maxHealth: number = 10;
  cards: Card[] = []; // 持有卡牌列表
  currentTask: Task | null = null; // 当前任务
  currentThreat: ThreatEvent | null = null; // 当前威胁
  buffs: Array<{ name: string; remainingTurns: number }> = []; // buff效果

  // 添加卡牌
  addCard(card: Card): void {
    this.cards.push(card);
  }

  // 移除卡牌
  removeCard(cardId: string): Card | null {
    const index = this.cards.findIndex(c => c.id === cardId);
    if (index !== -1) {
      return this.cards.splice(index, 1)[0];
    }
    return null;
  }

  // 获取特定类型的卡牌
  getCardsByType(type: CardType): Card[] {
    return this.cards.filter(card => card.cardType === type);
  }

  // 获取特定名称的卡牌
  getCardByName(name: string): Card | undefined {
    return this.cards.find(card => card.name === name);
  }

  // 消耗饥饿值
  consumeHunger(amount: number = 2): void {
    this.hunger = Math.max(0, this.hunger - amount);
    if (this.hunger === 0) {
      // 饥饿值为0时，每回合扣1生命值
      this.health = Math.max(0, this.health - 1);
    }
  }

  // 恢复生命值
  heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  // 恢复饥饿值
  restoreHunger(amount: number): void {
    this.hunger = Math.min(this.maxHunger, this.hunger + amount);
  }

  // 添加buff
  addBuff(name: string, turns: number): void {
    this.buffs.push({ name, remainingTurns: turns });
  }

  // 更新buff（回合结束调用）
  updateBuffs(): void {
    this.buffs = this.buffs
      .map(buff => ({ ...buff, remainingTurns: buff.remainingTurns - 1 }))
      .filter(buff => buff.remainingTurns > 0);
  }

  // 检查是否有buff
  hasBuff(name: string): boolean {
    return this.buffs.some(buff => buff.name === name);
  }
}

// 游戏状态
export interface GameState {
  player: Player;
  synthesizer: Synthesizer;
  currentTurn: number;
  gameOver: boolean;
  gameWon: boolean;
}

// 探索地点类型
export type ExploreLocation = 'plain' | 'mine' | 'forest' | 'market';

// 探索结果
export interface ExploreResult {
  location: ExploreLocation;
  cards: Card[];
}

