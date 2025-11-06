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
    <div className="bg-white rounded-lg p-4 shadow-lg h-full flex flex-col">
      <h2 className="text-xl font-bold mb-3 text-gray-800">合成器</h2>

      {/* 分步合成 */}
      <div className="mb-4 flex-1">
        <h3 className="text-base font-semibold mb-2 text-gray-700">分步合成</h3>
        
        {/* 步骤选择 */}
        <div className="flex gap-1.5 mb-2">
          {(['preprocess', 'cook', 'season'] as SynthesisStep[]).map((step) => (
            <button
              key={step}
              onClick={() => onStepChange(step)}
              className={`
                flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all
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
        <div className="bg-blue-50 p-2 rounded-lg mb-2 text-xs text-gray-700">
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
            w-full py-2 rounded-lg font-semibold transition-all text-sm
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
        <h3 className="text-base font-semibold mb-2 text-gray-700">全丢合成</h3>
        <div className="bg-yellow-50 p-2 rounded-lg mb-2 text-xs text-gray-700">
          <p className="font-semibold text-yellow-800 mb-0.5">⚠️ 风险提示：</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>工具卡耐久-2（双倍消耗）</li>
            <li>辅料卡直接销毁</li>
            <li>30%概率触发混乱烹饪</li>
          </ul>
        </div>
        <button
          onClick={onFullThrowSynthesis}
          disabled={!synthesizer.hasEnergy(1) || selectedCards.length === 0}
          className={`
            w-full py-2 rounded-lg font-semibold transition-all text-sm
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
      <div className="mt-3 text-center text-xs text-gray-600">
        已选择 {selectedCards.length} 张卡牌
      </div>
    </div>
  );
}

