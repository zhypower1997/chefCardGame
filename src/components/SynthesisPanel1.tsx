'use client';
import { Synthesizer, SynthesisStep } from '@/types/game';
import { useState, useEffect } from 'react';

interface SynthesisPanelProps {
  selectedCards: string[];
  onSelectCard: (cardId: string) => void;
  onStepSynthesis: () => void;
  onFullThrowSynthesis: () => void;
  synthesisStep: SynthesisStep;
  onStepChange: (step: SynthesisStep) => void;
  synthesizer: Synthesizer;
  message?: string;
  messageLog?: string[];
}

export function SynthesisPanel({
  selectedCards,
  onStepSynthesis,
  onFullThrowSynthesis,
  synthesisStep,
  onStepChange,
  message,
  synthesizer,
  messageLog = [],
}: SynthesisPanelProps) {
  const stepLabels: Record<SynthesisStep, string> = {
    preprocess: '预处理',
    cook: '烹饪',
    season: '调味',
  };

  // 使用从父组件传递过来的messageLog，显示最近的5条消息
  const recentMessages = messageLog.slice(-5);
  const latestTimestamp =
    messageLog.length > 0
      ? new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
      : '';

  return (
    <div className="rounded-lg p-4 h-full flex flex-col">
      <div className="w-[438.8px] h-[331.6px] bg-[url('/assets/images/other/bg.png')] bg-cover bg-center mx-auto mb-4 relative">
        {/* 合成步骤选择 */}
        <div className="flex justify-center mb-2 absolute top-2 left-1/2 transform -translate-x-1/2 gap-4">
          {['preprocess', 'cook', 'season'].map((step) => (
            <button
              key={step}
              onClick={() => onStepChange(step as SynthesisStep)}
              className={`
                px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                ${synthesisStep === step
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }
              `}
            >
              {stepLabels[step as SynthesisStep]}
            </button>
          ))}
        </div>
        <div
          className="absolute top-[50px] w-[350px] h-[220px] left-[40px] p-4 text-[#5B7062]"
          style={{ fontFamily: "'FusionPixel', monospace" }}
        >
          {synthesisStep === 'preprocess' && <p>需要：刀 + 食材卡</p>}
          {synthesisStep === 'cook' && <p>需要：锅 + 火源 + 预处理过的食材</p>}
          {synthesisStep === 'season' && <p>需要：成品卡 + 辅料卡</p>}
          <div className='mix-blend-multiply w-[120px] h-[120px] m-auto'>
            
            {synthesisStep === 'preprocess' && <img src="/assets/images/other/pre.gif" alt="" />}
          {synthesisStep === 'cook' && <img src="/assets/images/other/pr.gif" alt="" />}
          {synthesisStep === 'season' && <img src="/assets/images/other/tw.gif" alt="" />}
          </div>
          {/* 日志展示区域 */}
          {messageLog.length > 0 && (
            <div className="mt-2 space-y-1 max-h-[50px] overflow-y-auto">
              {recentMessages.reverse().map((msg, index) => (
                <div key={index} className="text-[16px] text-gray-800">
                  <span className="text-gray-500 text-[12px]">
                    [{latestTimestamp}]
                  </span>
                  <span className="text-green-600">系统消息：</span>
                  {msg}
                </div>
              ))}
            </div>
          )}
          {messageLog.length === 0 && message && (
            <div className="text-[18px] text-gray-800">
              <span className="text-green-600">系统消息：</span>
              {message}
            </div>
          )}
        </div>
        <div className="absolute top-[55px] w-[33.2px] h-[91.6px] left-[45px] p-4 bg-[url('/assets/images/other/light.png')] bg-cover bg-center "></div>
        <div className="absolute bottom-[10px] right-[50px]">
          <button
            onClick={onFullThrowSynthesis}
            disabled={!synthesizer.hasEnergy(1) || selectedCards.length === 0}
            className={`
           py-2 rounded-lg font-semibold transition-all text-sm mr-2 p-2
            ${synthesizer.hasEnergy(1) && selectedCards.length > 0
                ? 'bg-orange-500 text-white hover:bg-orange-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
          `}
          >
            全丢合成
          </button>
          <button
            onClick={onStepSynthesis}
            disabled={!synthesizer.hasEnergy(1) || selectedCards.length === 0}
            className={`
            p-2 py-2 rounded-lg font-semibold transition-all text-sm
            ${synthesizer.hasEnergy(1) && selectedCards.length > 0
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
          `}
          >
            执行 {stepLabels[synthesisStep]}
          </button>
        </div>

      </div>
    </div>
  );
}
