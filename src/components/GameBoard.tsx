'use client';

import { useState, useEffect } from 'react';
import { GameManager } from '@/game/gameManager';
import { Card, SynthesisStep } from '@/types/game';
import { CardDisplay } from './CardDisplay';
import { SynthesisPanel } from './SynthesisPanel';
import { PlayerStatus } from './PlayerStatus';
import { TaskPanel } from './TaskPanel';
import { ExplorePanel } from './ExplorePanel';
import { ShopPanel } from './ShopPanel';
import { initializeRecipes } from '@/data/recipes';
import { initializeCards } from '@/data/cards';
import { initializeExploreDrops } from '@/game/survival';

export default function GameBoard() {
  const [gameManager] = useState(() => new GameManager());
  const [gameState, setGameState] = useState(gameManager.getGameState());
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [synthesisStep, setSynthesisStep] =
    useState<SynthesisStep>('preprocess');
  const [message, setMessage] = useState<string>('');
  const [showExplore, setShowExplore] = useState(false);
  const [showShop, setShowShop] = useState(false);

  // 初始化时加载JSON配置
  useEffect(() => {
    Promise.all([
      initializeCards(),
      initializeRecipes(),
      initializeExploreDrops(),
    ])
      .then(() => {
        // JSON加载完成后，重新初始化玩家卡片以确保使用最新的卡片数据
        gameManager.reinitializePlayerCards();
        updateGameState();
      })
      .catch((err) => {
        console.error('加载配置失败:', err);
      });
  }, []);

  const updateGameState = () => {
    setGameState(gameManager.getGameState());
  };

  const handleCardSelect = (cardId: string) => {
    setSelectedCards((prev) => {
      if (prev.includes(cardId)) {
        return prev.filter((id) => id !== cardId);
      }
      return [...prev, cardId];
    });
  };

  const handleStepSynthesis = () => {
    if (selectedCards.length === 0) {
      setMessage('请选择要使用的卡牌');
      return;
    }

    const result = gameManager.stepByStepSynthesis(
      selectedCards,
      synthesisStep,
    );
    setMessage(result.message);
    setSelectedCards([]);
    updateGameState();
  };

  const handleFullThrowSynthesis = () => {
    if (selectedCards.length === 0) {
      setMessage('请选择要使用的卡牌');
      return;
    }

    const result = gameManager.fullThrowSynthesis(selectedCards);
    setMessage(result.message);
    setSelectedCards([]);
    updateGameState();
  };

  const handleUseCard = (cardId: string) => {
    const result = gameManager.useCard(cardId);
    setMessage(result.message);
    updateGameState();
  };

  const handleDiscardCard = (cardId: string) => {
    const success = gameManager.discardCard(cardId);
    if (success) {
      setMessage('卡牌已丢弃');
      // 如果丢弃的卡牌在选中列表中，移除它
      setSelectedCards((prev) => prev.filter((id) => id !== cardId));
    } else {
      setMessage('丢弃失败：卡牌不存在');
    }
    updateGameState();
  };

  const handleSellCard = (cardId: string) => {
    const result = gameManager.sellCard(cardId);
    setMessage(result.message);
    updateGameState();
  };

  const handleBuyCard = (cardKey: string) => {
    const result = gameManager.buyCard(cardKey);
    setMessage(result.message);
    updateGameState();
  };

  const handleExplore = (location: 'plain' | 'mine' | 'forest' | 'market') => {
    const cards = gameManager.explore(location);
    if (cards === null) {
      setMessage('能量值不足，无法探索');
      return;
    }
    setMessage(
      `探索成功！获得 ${cards.length} 张卡牌：${cards
        .map((c) => c.name)
        .join('、')}`,
    );
    setShowExplore(false);
    updateGameState();
  };

  const handleNextTurn = () => {
    gameManager.nextTurn();
    updateGameState();
    setMessage('进入下一回合');
    setSelectedCards([]);
  };

  const handleStartNewGame = () => {
    gameManager.startNewGame();
    updateGameState();
    setMessage('新游戏开始');
    setSelectedCards([]);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-2 overflow-hidden flex flex-col">
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* 顶部标题栏 */}
        <div className="mb-2 flex justify-between items-center flex-shrink-0">
          <h1 className="text-2xl font-bold text-orange-800">
            逗逗狐的合成厨房
          </h1>
          <div className="flex items-center gap-4">
            {/* 能量值显示 */}
            <div className="bg-white rounded-lg px-4 py-2 shadow-md">
              <div className="flex items-center gap-3">
                <span className="text-gray-700 font-semibold text-sm">
                  能量值
                </span>
                <span className="text-base font-bold text-blue-600">
                  {gameState.synthesizer.energy}/
                  {gameState.synthesizer.maxEnergy}
                </span>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${
                        (gameState.synthesizer.energy /
                          gameState.synthesizer.maxEnergy) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="text-sm font-semibold text-gray-700">
              回合：{gameState.currentTurn}
            </div>
            <button
              onClick={handleStartNewGame}
              className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
            >
              新游戏
            </button>
            <button
              onClick={handleNextTurn}
              className="px-4 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold text-sm"
            >
              下一回合
            </button>
          </div>
        </div>

        {gameState.gameOver ? (
          <div className="bg-red-500 text-white p-8 rounded-lg text-center flex-1 flex items-center justify-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">游戏结束</h2>
              <p className="text-xl">生命值归零，游戏失败</p>
              <button
                onClick={handleStartNewGame}
                className="mt-4 px-6 py-3 bg-white text-red-500 rounded-lg hover:bg-gray-100"
              >
                重新开始
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col gap-2">
            {/* 主内容区 */}
            <div className="flex-1 overflow-hidden flex gap-2 min-h-0">
              {/* 左侧：紧凑的玩家状态和任务 */}
              <div className="w-64 flex-shrink-0 flex flex-col gap-2 overflow-y-auto">
                <PlayerStatus
                  player={gameState.player}
                  synthesizer={gameState.synthesizer}
                />
                <TaskPanel
                  task={gameState.player.currentTask}
                  threat={gameState.player.currentThreat}
                />
              </div>

              {/* 中间：合成器（最大） */}
              <div className="flex-1 min-w-0 flex flex-col">
                <SynthesisPanel
                  selectedCards={selectedCards}
                  onSelectCard={handleCardSelect}
                  onStepSynthesis={handleStepSynthesis}
                  onFullThrowSynthesis={handleFullThrowSynthesis}
                  synthesisStep={synthesisStep}
                  onStepChange={setSynthesisStep}
                  synthesizer={gameState.synthesizer}
                />
              </div>

              {/* 右侧：紧凑的探索和商店 */}
              <div className="w-64 flex-shrink-0 flex flex-col gap-2 overflow-y-auto">
                <ExplorePanel
                  onExplore={handleExplore}
                  showExplore={showExplore}
                  onToggleExplore={() => setShowExplore(!showExplore)}
                  hasEnergy={gameState.synthesizer.hasEnergy(1)}
                />
                <ShopPanel
                  onBuy={handleBuyCard}
                  showShop={showShop}
                  onToggleShop={() => setShowShop(!showShop)}
                  playerCoins={gameState.player.coins}
                />
              </div>
            </div>

            {/* 卡牌展示区（最大） */}
            <div className="flex-1 min-h-0 flex flex-col bg-white rounded-lg p-3 shadow-lg">
              <h2 className="text-xl font-bold mb-2 text-gray-800 flex-shrink-0">
                我的卡牌
              </h2>
              <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 xl:grid-cols-10 2xl:grid-cols-12 gap-1.5 p-2 relative">
                  {gameState.player.cards.map((card) => (
                    <CardDisplay
                      key={card.id}
                      card={card}
                      isSelected={selectedCards.includes(card.id)}
                      onSelect={() => handleCardSelect(card.id)}
                      onUse={() => handleUseCard(card.id)}
                      onDiscard={() => handleDiscardCard(card.id)}
                      onSell={() => handleSellCard(card.id)}
                    />
                  ))}
                </div>
                {gameState.player.cards.length === 0 && (
                  <p className="text-center text-gray-500 py-8">暂无卡牌</p>
                )}
              </div>
            </div>

            {/* 消息提示 */}
            {message && (
              <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-2 rounded text-sm flex-shrink-0">
                <p>{message}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
