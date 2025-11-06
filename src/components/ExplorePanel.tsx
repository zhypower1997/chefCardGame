'use client';

interface ExplorePanelProps {
  onExplore: (location: 'plain' | 'mine' | 'forest' | 'market') => void;
  showExplore: boolean;
  onToggleExplore: () => void;
  hasEnergy: boolean;
}

export function ExplorePanel({ onExplore, showExplore, onToggleExplore, hasEnergy }: ExplorePanelProps) {
  const locations: Array<{
    key: 'plain' | 'mine' | 'forest' | 'market';
    name: string;
    description: string;
    icon: string;
  }> = [
    {
      key: 'plain',
      name: '平原',
      description: '获得基础食材（番茄、鸡蛋、盐）',
      icon: '🌾'
    },
    {
      key: 'mine',
      name: '矿山',
      description: '获得燃料卡、修复卡',
      icon: '⛏️'
    },
    {
      key: 'forest',
      name: '森林',
      description: '获得燃料卡、油',
      icon: '🌲'
    },
    {
      key: 'market',
      name: '市场',
      description: '获得糖、油',
      icon: '🏪'
    }
  ];

  return (
    <div className="bg-white rounded-lg p-3 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-gray-800">探索</h2>
        <button
          onClick={onToggleExplore}
          className="px-2 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
        >
          {showExplore ? '收起' : '探索'}
        </button>
      </div>

      {showExplore && (
        <div className="space-y-1.5">
          {locations.map(location => (
            <button
              key={location.key}
              onClick={() => onExplore(location.key)}
              disabled={!hasEnergy}
              className={`
                w-full p-2 rounded-lg border-2 transition-all text-left
                ${hasEnergy
                  ? 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200 hover:border-green-400'
                  : 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-50'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{location.icon}</span>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 text-sm">{location.name}</h3>
                  <p className="text-xs text-gray-600">{location.description}</p>
                </div>
              </div>
            </button>
          ))}
          <p className="text-xs text-gray-500 mt-1">
            💡 探索消耗1回合，随机获得1-2张卡牌
          </p>
        </div>
      )}
    </div>
  );
}

