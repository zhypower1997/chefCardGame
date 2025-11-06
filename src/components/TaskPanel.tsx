'use client';

import { Task, ThreatEvent } from '@/types/game';

interface TaskPanelProps {
  task: Task | null;
  threat: ThreatEvent | null;
}

export function TaskPanel({ task, threat }: TaskPanelProps) {
  return (
    <div className="space-y-2">
      {/* 当前任务 */}
      {task && (
        <div className={`rounded-lg p-2 shadow-lg ${
          task.completed ? 'bg-green-50 border-2 border-green-400' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold text-gray-800">📋 当前任务</h3>
            {task.completed && (
              <span className="bg-green-500 text-white px-1.5 py-0.5 rounded text-xs">已完成</span>
            )}
          </div>
          <p className="text-xs text-gray-700 mb-1">{task.description}</p>
          <p className="text-xs text-gray-600 mb-1">目标：{task.target}</p>
          {task.remainingTurns !== undefined && !task.completed && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">剩余回合</span>
              <span className={`font-bold text-xs ${
                task.remainingTurns <= 1 ? 'text-red-600' : 'text-gray-700'
              }`}>
                {task.remainingTurns}
              </span>
            </div>
          )}
          {task.reward && task.reward.length > 0 && (
            <div className="mt-1 text-xs text-green-700">
              奖励：{task.reward.map(c => c.name).join('、')}
            </div>
          )}
          {!task.completed && task.penalty && (
            <div className="mt-1 text-xs text-red-600">
              失败惩罚：-{task.penalty} 生命值
            </div>
          )}
        </div>
      )}

      {/* 威胁事件 */}
      {threat && (
        <div className="bg-red-50 border-2 border-red-400 rounded-lg p-2 shadow-lg">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold text-red-800">⚠️ 威胁事件</h3>
            {threat.remainingTurns !== undefined && (
              <span className={`font-bold text-xs ${
                threat.remainingTurns <= 1 ? 'text-red-600' : 'text-orange-600'
              }`}>
                {threat.remainingTurns} 回合
              </span>
            )}
          </div>
          <p className="font-semibold text-red-700 mb-0.5 text-xs">{threat.name}</p>
          <p className="text-xs text-gray-700 mb-1">{threat.description}</p>
          <p className="text-xs text-gray-600 mb-1">要求：{threat.requirement}</p>
          {threat.reward && threat.reward.length > 0 && (
            <div className="mt-1 text-xs text-green-700">
              奖励：{threat.reward.map(c => c.name).join('、')}
            </div>
          )}
          {threat.penalty && (
            <div className="mt-1 text-xs text-red-600">
              失败惩罚：-{threat.penalty} 生命值
            </div>
          )}
        </div>
      )}

      {!task && !threat && (
        <div className="bg-white rounded-lg p-2 shadow-lg text-center text-gray-500 text-xs">
          <p>暂无任务或威胁</p>
        </div>
      )}
    </div>
  );
}

