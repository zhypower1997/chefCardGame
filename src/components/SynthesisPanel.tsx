'use client';

import { Synthesizer, SynthesisStep } from '@/types/game';

interface SynthesisPanelProps {
  selectedCards: string[];
  onSelectCard: (cardId: string) => void;
  onStepSynthesis: () => void;
  onFullThrowSynthesis: () => void;
  synthesisStep: SynthesisStep;
  onStepChange: (step: SynthesisStep) => void;
  synthesizer: Synthesizer;
}

export function SynthesisPanel({
  selectedCards,
  onStepSynthesis,
  onFullThrowSynthesis,
  synthesisStep,
  onStepChange,
  synthesizer
}: SynthesisPanelProps) {
  const stepLabels: Record<SynthesisStep, string> = {
    preprocess: '预处理',
    cook: '烹饪',
    season: '调味'
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">合成器</h2>
      
      {/* 能量显示 */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-700 font-semibold">能量值</span>
          <span className="text-lg font-bold text-blue-600">
            {synthesizer.energy}/{synthesizer.maxEnergy}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-blue-500 h-4 rounded-full transition-all"
            style={{ width: `${(synthesizer.energy / synthesizer.maxEnergy) * 100}%` }}
          />
        </div>
      </div>

      {/* 分步合成 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">分步合成</h3>
        
        {/* 步骤选择 */}
        <div className="flex gap-2 mb-3">
          {(['preprocess', 'cook', 'season'] as SynthesisStep[]).map((step) => (
            <button
              key={step}
              onClick={() => onStepChange(step)}
              className={`
                flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all
                ${synthesisStep === step
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }
              `}
            >
              {stepLabels[step]}
            </button>
          ))}
        </div>

        {/* 当前步骤说明 */}
        <div className="bg-blue-50 p-3 rounded-lg mb-3 text-sm text-gray-700">
          {synthesisStep === 'preprocess' && (
            <p>需要：刀 + 食材卡</p>
          )}
          {synthesisStep === 'cook' && (
            <p>需要：锅 + 火源 + 预处理过的食材</p>
          )}
          {synthesisStep === 'season' && (
            <p>需要：成品卡 + 辅料卡</p>
          )}
        </div>

        <button
          onClick={onStepSynthesis}
          disabled={!synthesizer.hasEnergy(1) || selectedCards.length === 0}
          className={`
            w-full py-3 rounded-lg font-semibold transition-all
            ${synthesizer.hasEnergy(1) && selectedCards.length > 0
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          执行 {stepLabels[synthesisStep]}
        </button>
      </div>

      {/* 全丢合成 */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-gray-700">全丢合成</h3>
        <div className="bg-yellow-50 p-3 rounded-lg mb-3 text-sm text-gray-700">
          <p className="font-semibold text-yellow-800 mb-1">⚠️ 风险提示：</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>工具卡耐久-2（双倍消耗）</li>
            <li>辅料卡直接销毁</li>
            <li>30%概率触发混乱烹饪</li>
          </ul>
        </div>
        <button
          onClick={onFullThrowSynthesis}
          disabled={!synthesizer.hasEnergy(1) || selectedCards.length === 0}
          className={`
            w-full py-3 rounded-lg font-semibold transition-all
            ${synthesizer.hasEnergy(1) && selectedCards.length > 0
              ? 'bg-orange-500 text-white hover:bg-orange-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          全丢合成
        </button>
      </div>

      {/* 已选卡牌数量 */}
      <div className="mt-4 text-center text-sm text-gray-600">
        已选择 {selectedCards.length} 张卡牌
      </div>
    </div>
  );
}

