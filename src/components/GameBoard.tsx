'use client';

import { useState, useEffect } from 'react';
import { GameManager } from '@/game/gameManager';
import { Card, SynthesisStep } from '@/types/game';
import { CardDisplay } from './CardDisplay';
import { SynthesisPanel } from './SynthesisPanel1';
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
  const [messageLog, setMessageLog] = useState<string[]>([]);
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

  const updateMessage = (newMessage: string) => {
    setMessage(newMessage);
    if (newMessage && newMessage.trim()) {
      setMessageLog((prev) => [...prev, newMessage]);
    }
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
      updateMessage('请选择要使用的卡牌');
      return;
    }

    const result = gameManager.stepByStepSynthesis(
      selectedCards,
      synthesisStep,
    );
    updateMessage(result.message);
    setSelectedCards([]);
    updateGameState();
  };

  const handleFullThrowSynthesis = () => {
    if (selectedCards.length === 0) {
      updateMessage('请选择要使用的卡牌');
      return;
    }

    const result = gameManager.fullThrowSynthesis(selectedCards);
    updateMessage(result.message);
    setSelectedCards([]);
    updateGameState();
  };

  const handleUseCard = (cardId: string) => {
    const result = gameManager.useCard(cardId);
    updateMessage(result.message);
    updateGameState();
  };

  const handleDiscardCard = (cardId: string) => {
    const success = gameManager.discardCard(cardId);
    if (success) {
      updateMessage('卡牌已丢弃');
      // 如果丢弃的卡牌在选中列表中，移除它
      setSelectedCards((prev) => prev.filter((id) => id !== cardId));
    } else {
      updateMessage('丢弃失败：卡牌不存在');
    }
    updateGameState();
  };

  const handleSellCard = (cardId: string) => {
    const result = gameManager.sellCard(cardId);
    updateMessage(result.message);
    updateGameState();
  };

  const handleBuyCard = (cardKey: string) => {
    const result = gameManager.buyCard(cardKey);
    updateMessage(result.message);
    updateGameState();
  };

  const handleExplore = (location: 'plain' | 'mine' | 'forest' | 'market') => {
    const cards = gameManager.explore(location);
    if (cards === null) {
      updateMessage('能量值不足，无法探索');
      return;
    }
    updateMessage(
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
    updateMessage('进入下一回合');
    setSelectedCards([]);
  };

  const handleStartNewGame = () => {
    gameManager.startNewGame();
    updateGameState();
    updateMessage('新游戏开始');
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
            <div className="cursor-pointer" onClick={() => {
              window.open(window.location.href, '_blank');
            }}><svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5126" width="30" height="30"><path d="M257.92256 30.42816h508.16c132.5184 0 242.09536 115.712 242.09536 256.29056v450.00064c0 140.84224-109.57696 256.84352-242.09536 256.84352h-508.16c-132.5184 0-242.09408-116.00128-242.09408-256.84352V286.72384c0-140.57856 109.57696-256.28928 242.09536-256.28928z m-13.50016 173.99168h133.58848c12.43008 0 22.4 10.86464 22.4 24.28672 0 13.1584-9.96352 24.28672-22.4 24.28672h-78.28992l80.98048 85.43872a24.80256 24.80256 0 0 1 0 34.28096 21.78048 21.78048 0 0 1-32.10752 0l-81.23008-85.43872v82.304c0 13.73824-10.24 24.28672-22.94144 24.28672-12.43008 0-22.4-10.54848-22.4-24.28672V228.70272c0-13.13152 9.96352-24.28672 22.4-24.28672z m535.18208 614.57408h-133.0688c-12.928 0-22.94144-10.57408-22.94144-23.70688 0-13.1584 10.01344-24.31232 22.94144-24.31232h78.01728l-80.98176-85.99296c-8.64384-9.41312-8.64384-24.86656 0-33.69984a21.64736 21.64736 0 0 1 32.384 0l80.70656 85.43744v-82.85312c0-13.15968 10.26304-23.73376 22.94144-23.73376a23.36256 23.36256 0 0 1 23.21664 23.73376v141.4208a23.712 23.712 0 0 1-23.21536 23.70688z m23.21664-590.2912v140.86912c0 13.73824-10.26304 24.28672-23.21664 24.28672-12.672 0-22.94144-10.54848-22.94144-24.28672v-82.304l-80.70656 85.43872a22.09408 22.09408 0 0 1-32.384 0 25.9008 25.9008 0 0 1 0-34.28096l80.98176-85.43872h-78.01856c-12.928 0-22.94144-11.12832-22.94144-24.28672 0-13.42208 10.01344-24.28672 22.94144-24.28672h133.0688c12.40576 0 23.21664 11.1552 23.21664 24.28672zM222.0288 795.28704V653.86624c0-13.15968 9.96352-23.73376 22.4-23.73376 12.70272 0 22.94144 10.57408 22.94144 23.73376v82.85312l81.23008-85.43744a21.34272 21.34272 0 0 1 32.10752 0c9.16736 8.832 9.16736 24.28672 0 33.69984l-80.98048 85.99296h78.28992c12.43008 0 22.4 11.15392 22.4 24.31232 0 13.1328-9.96352 23.70688-22.4 23.70688H244.4224c-12.43008 0-22.4-10.57408-22.4-23.70688zM766.07616 111.0144H257.92256c-90.67008 0-165.44896 79.136-165.44896 175.70944v449.99552c0 96.54144 74.77888 176.256 165.44896 176.256h508.16c90.72128 0 166.272-79.71584 166.272-176.256V286.72384c0-96.56704-75.54944-175.70304-166.272-175.70304z" fill="#aaaaaa" p-id="5127"></path></svg></div>
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
                      width: `${(gameState.synthesizer.energy /
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
            <div className="h-[380px] overflow-hidden flex gap-2 min-h-0">
              {/* 左侧：紧凑的玩家状态和任务 */}
              <div className="w-[350px] flex-shrink-0 flex flex-col gap-2 overflow-y-auto">
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
                  message={message}
                  messageLog={messageLog}
                />
              </div>

              {/* 右侧：紧凑的探索和商店 */}
              <div className="w-[350px] flex-shrink-0 flex flex-col gap-2 overflow-y-auto">
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
          </div>
        )}
      </div>
    </div>
  );
}
