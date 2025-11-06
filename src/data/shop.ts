// 商店配置
export interface ShopItem {
  cardKey: string; // 卡牌key（对应CARD_DATABASE中的key）
  name: string; // 显示名称
  price: number; // 价格（金币）
  description: string; // 描述
  icon?: string; // 图标
}

// 商店物品列表（工具类卡牌）
export const SHOP_ITEMS: ShopItem[] = [
  {
    cardKey: 'knife',
    name: '刀',
    price: 5,
    description: '基础工具，耐久3，10%概率加工双倍食材',
    icon: '🔪'
  },
  {
    cardKey: 'pot',
    name: '锅',
    price: 8,
    description: '烹饪工具，耐久5，需火源激活',
    icon: '🍳'
  },
  {
    cardKey: 'fire',
    name: '火源',
    price: 10,
    description: '热菜合成必需，每回合消耗1燃料卡',
    icon: '🔥'
  },
  {
    cardKey: 'repair',
    name: '修复卡',
    price: 3,
    description: '修复工具卡耐久',
    icon: '🔧'
  }
];

// 根据cardKey获取商店物品
export function getShopItem(cardKey: string): ShopItem | undefined {
  return SHOP_ITEMS.find(item => item.cardKey === cardKey);
}

