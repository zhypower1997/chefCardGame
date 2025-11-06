import { Player, Task, ThreatEvent, Card, GameState } from '@/types/game';
import { createCard, EXPLORE_DROPS } from '@/data/cards';

// 任务生成器
export class TaskGenerator {
  private static taskTemplates: Array<{
    description: string;
    target: string;
    reward?: string[];
    penalty: number;
    timeLimit?: number;
  }> = [
    {
      description: '制作热菜',
      target: '1回合内合成需要火源的料理',
      reward: ['salt', 'oil'],
      penalty: 2,
      timeLimit: 1
    },
    {
      description: '制作无油料理',
      target: '合成不使用油的料理',
      reward: ['sugar'],
      penalty: 1,
      timeLimit: 3
    },
    {
      description: '制作精品料理',
      target: '合成品质为精品的料理',
      reward: ['fox'],
      penalty: 2,
      timeLimit: 2
    },
    {
      description: '使用新鲜食材',
      target: '使用未变质的食材合成',
      reward: ['tomato', 'egg'],
      penalty: 1,
      timeLimit: 2
    }
  ];

  static generateTask(): Task {
    const template = this.taskTemplates[Math.floor(Math.random() * this.taskTemplates.length)];
    return {
      id: `task-${Date.now()}`,
      description: template.description,
      target: template.target,
      reward: template.reward?.map(key => createCard(key)).filter((c): c is Card => c !== null),
      penalty: template.penalty,
      timeLimit: template.timeLimit,
      remainingTurns: template.timeLimit,
      completed: false
    };
  }

  static checkTaskCompletion(task: Task, player: Player, lastSynthesis?: any): boolean {
    if (task.completed) return true;

    switch (task.target) {
      case '1回合内合成需要火源的料理':
        return lastSynthesis?.consumedCards?.some((c: Card) => c.name === '火源') || false;
      case '合成不使用油的料理':
        return lastSynthesis?.consumedCards?.every((c: Card) => c.name !== '油') || false;
      case '合成品质为精品的料理':
        return lastSynthesis?.quality === 'fine' || lastSynthesis?.quality === 'excellent';
      case '使用未变质的食材合成':
        return lastSynthesis?.consumedCards?.every((c: Card) =>
          c.cardType !== 'food' || !c.isSpoiled()
        ) || false;
      default:
        return false;
    }
  }
}

// 威胁事件生成器
export class ThreatGenerator {
  private static threatTemplates: Array<{
    name: string;
    description: string;
    requirement: string;
    reward?: string[];
    penalty: number;
    timeLimit?: number;
  }> = [
    {
      name: '野兽来袭',
      description: '一只野兽正在靠近！需要诱饵卡来应对。',
      requirement: '需要诱饵卡',
      reward: ['fuel', 'repair'],
      penalty: 3,
      timeLimit: 2
    },
    {
      name: '商人订单',
      description: '商人需要一个精品料理，超时将失去卡牌。',
      requirement: '需要精品料理',
      reward: ['sugar', 'oil'],
      penalty: 2,
      timeLimit: 3
    },
    {
      name: '工具损坏',
      description: '你的工具正在损坏，需要修复卡。',
      requirement: '需要修复卡',
      reward: ['fuel'],
      penalty: 1,
      timeLimit: 2
    }
  ];

  static generateThreat(): ThreatEvent {
    const template = this.threatTemplates[Math.floor(Math.random() * this.threatTemplates.length)];
    return {
      id: `threat-${Date.now()}`,
      name: template.name,
      description: template.description,
      requirement: template.requirement,
      reward: template.reward?.map(key => createCard(key)).filter((c): c is Card => c !== null),
      penalty: template.penalty,
      timeLimit: template.timeLimit,
      remainingTurns: template.timeLimit
    };
  }

  static checkThreatResolved(threat: ThreatEvent, player: Player): boolean {
    switch (threat.requirement) {
      case '需要诱饵卡':
        return player.getCardByName('诱饵卡') !== undefined;
      case '需要精品料理':
        return player.cards.some(c =>
          c.cardType === 'product' && c.name.includes('精品')
        );
      case '需要修复卡':
        return player.getCardByName('修复卡') !== undefined;
      default:
        return false;
    }
  }
}

// 探索掉落数据缓存
let EXPLORE_DROPS_CACHE: Record<string, string[]> = {};

// 从JSON加载探索掉落数据
async function loadExploreDropsFromJSON(): Promise<void> {
  try {
    const response = await fetch('/explore-drops.json');
    if (!response.ok) {
      throw new Error('无法加载explore-drops.json');
    }
    const data = await response.json();

    // 清空缓存
    EXPLORE_DROPS_CACHE = {};

    // 提取掉落列表
    for (const [location, locationData] of Object.entries(data)) {
      if (locationData && typeof locationData === 'object' && 'drops' in locationData) {
        EXPLORE_DROPS_CACHE[location] = (locationData as any).drops || [];
      }
    }
  } catch (error) {
    console.warn('无法从JSON加载探索掉落，使用默认掉落:', error);
    EXPLORE_DROPS_CACHE = EXPLORE_DROPS;
  }
}

// 初始化探索掉落数据
export async function initializeExploreDrops(): Promise<void> {
  await loadExploreDropsFromJSON();
  // 合并默认掉落（如果JSON中没有的）
  for (const [location, drops] of Object.entries(EXPLORE_DROPS)) {
    if (!EXPLORE_DROPS_CACHE[location]) {
      EXPLORE_DROPS_CACHE[location] = drops;
    }
  }
}

// 获取探索掉落列表
function getExploreDrops(location: string): string[] {
  if (Object.keys(EXPLORE_DROPS_CACHE).length === 0) {
    return EXPLORE_DROPS[location] || [];
  }
  return EXPLORE_DROPS_CACHE[location] || [];
}

// 探索系统
export class ExploreSystem {
  static explore(location: 'plain' | 'mine' | 'forest' | 'market' | string): Card[] {
    const drops = getExploreDrops(location);
    const cards: Card[] = [];

    if (drops.length === 0) {
      return cards;
    }

    // 随机获得1-2张卡牌
    const count = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < count; i++) {
      const randomKey = drops[Math.floor(Math.random() * drops.length)];
      const card = createCard(randomKey);
      if (card) {
        cards.push(card);
      }
    }

    return cards;
  }
}

// 生存循环管理器
export class SurvivalManager {
  private player: Player;
  private lastSynthesisResult: any = null;

  constructor(player: Player) {
    this.player = player;
  }

  // 设置上次合成结果（用于任务判定）
  setLastSynthesisResult(result: any): void {
    this.lastSynthesisResult = result;
  }

  // 回合开始
  startTurn(): void {
    // 恢复合成器能量（在游戏管理器中处理）
    // 刷新任务（如果当前没有任务）
    if (!this.player.currentTask) {
      this.player.currentTask = TaskGenerator.generateTask();
    }

    // 随机触发威胁事件（30%概率）
    if (!this.player.currentThreat && Math.random() < 0.3) {
      this.player.currentThreat = ThreatGenerator.generateThreat();
    }
  }

  // 回合结束
  endTurn(): void {
    // 消耗饥饿值
    if (!this.player.hasBuff('饱腹')) {
      this.player.consumeHunger(2);
    }

    // 更新食材变质
    this.player.cards.forEach(card => {
      if (card.cardType === 'food') {
        card.remainingSpoil = Math.max(0, card.remainingSpoil - 1);
      }
    });

    // 消耗火源燃料（每回合消耗1点，如果火源存在且燃料值>0）
    const fireCard = this.player.getCardByName('火源');
    if (fireCard && fireCard.currentDurability > 0) {
      fireCard.consumeDurability(1);
    }

    // 更新buff
    this.player.updateBuffs();

    // 检查任务完成度
    if (this.player.currentTask && !this.player.currentTask.completed) {
      const completed = TaskGenerator.checkTaskCompletion(
        this.player.currentTask,
        this.player,
        this.lastSynthesisResult
      );

      if (completed) {
        this.player.currentTask.completed = true;
        // 发放奖励
        if (this.player.currentTask.reward) {
          this.player.currentTask.reward.forEach(card => {
            this.player.addCard(card);
          });
        }
      } else {
        // 减少剩余回合
        if (this.player.currentTask.remainingTurns !== undefined) {
          this.player.currentTask.remainingTurns -= 1;
          if (this.player.currentTask.remainingTurns <= 0) {
            // 任务失败，扣除生命值
            const penalty = this.player.currentTask.penalty ?? 0;
            this.player.health = Math.max(0, this.player.health - penalty);
          }
        }
      }
    }

    // 检查威胁事件
    if (this.player.currentThreat) {
      const resolved = ThreatGenerator.checkThreatResolved(
        this.player.currentThreat,
        this.player
      );

      if (resolved) {
        // 威胁解决，发放奖励
        if (this.player.currentThreat.reward) {
          this.player.currentThreat.reward.forEach(card => {
            this.player.addCard(card);
          });
        }
        // 移除用于解决威胁的卡牌
        if (this.player.currentThreat.requirement === '需要诱饵卡') {
          const baitCard = this.player.getCardByName('诱饵卡');
          if (baitCard) this.player.removeCard(baitCard.id);
        } else if (this.player.currentThreat.requirement === '需要修复卡') {
          const repairCard = this.player.getCardByName('修复卡');
          if (repairCard) this.player.removeCard(repairCard.id);
        } else if (this.player.currentThreat.requirement === '需要精品料理') {
          const fineProduct = this.player.cards.find(c =>
            c.cardType === 'product' && c.name.includes('精品')
          );
          if (fineProduct) this.player.removeCard(fineProduct.id);
        }
        this.player.currentThreat = null;
      } else {
        // 减少剩余回合
        if (this.player.currentThreat.remainingTurns !== undefined) {
          this.player.currentThreat.remainingTurns -= 1;
          if (this.player.currentThreat.remainingTurns <= 0) {
            // 威胁未解决，扣除生命值
            this.player.health = Math.max(0, this.player.health - (this.player.currentThreat.penalty || 0));
            this.player.currentThreat = null;
          }
        }
      }
    }

    // 检查游戏结束条件
    if (this.player.health <= 0) {
      // 游戏失败
    }
  }

  // 使用成品卡（恢复生命值/饥饿值）
  useProductCard(card: Card): void {
    if (card.cardType !== 'product') return;

    if (card.healValue) {
      this.player.restoreHunger(card.healValue);
    }

    if (card.buffEffect) {
      // 解析buff效果
      if (card.buffEffect.includes('饱腹')) {
        const turnsMatch = card.buffEffect.match(/(\d+)回合/);
        const turns = turnsMatch ? parseInt(turnsMatch[1]) : 2;
        this.player.addBuff('饱腹', turns);
      }
      if (card.buffEffect.includes('生命值+')) {
        const healMatch = card.buffEffect.match(/生命值\+(\d+)/);
        const heal = healMatch ? parseInt(healMatch[1]) : 0;
        this.player.heal(heal);
      }
    }

    // 使用后移除卡牌
    this.player.removeCard(card.id);
  }

  // 合成转化（如变质食材+工具卡→诱饵卡）
  transformCards(cards: Card[]): Card | null {
    const spoiledFood = cards.find(c => c.cardType === 'food' && c.isSpoiled());
    const toolCard = cards.find(c => c.cardType === 'tool');

    // 变质食材 + 工具卡 → 诱饵卡
    if (spoiledFood && toolCard) {
      const baitCard = createCard('bait');
      if (baitCard) {
        this.player.removeCard(spoiledFood.id);
        this.player.removeCard(toolCard.id);
        return baitCard;
      }
    }

    // 可以添加更多转化规则
    return null;
  }
}

