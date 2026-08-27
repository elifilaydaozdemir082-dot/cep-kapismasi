import { useState, useEffect } from 'react';
import { MainMenuScreen } from './screens/MainMenuScreen';
import { PlayerSetupScreen } from './screens/PlayerSetupScreen';
import { GameSelectScreen } from './screens/GameSelectScreen';
import { CountdownScreen } from './screens/CountdownScreen';
import { SinglePlayerTapGame } from './screens/SinglePlayerTapGame';
import { MultiPlayerTapGame } from './screens/MultiPlayerTapGame';
import { ResultsScreen } from './screens/ResultsScreen';
import { RecordsScreen } from './screens/RecordsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { RulesModal } from './components/RulesModal';
import { HomeButton } from './components/HomeButton';
import { ExitConfirmModal } from './components/ExitConfirmModal';

// Mini Game Components
import { CarRaceGame } from './games/CarRaceGame';
import { PenaltyGame } from './games/PenaltyGame';
import { BasketballGame } from './games/BasketballGame';
import { ArcheryGame } from './games/ArcheryGame';
import { ReflexGame } from './games/ReflexGame';
import { TugOfWarGame } from './games/TugOfWarGame';
import { AirHockeyGame } from './games/AirHockeyGame';
import { TowerGame } from './games/TowerGame';
import { MazeGame } from './games/MazeGame';
import { MemoryGame } from './games/MemoryGame';

// Word Games
import { TabuGame } from './games/TabuGame';
import { HangmanGame } from './games/HangmanGame';
import { WordSearchGame } from './games/WordSearchGame';
import { AnagramGame } from './games/AnagramGame';
import { ForbiddenLetterGame } from './games/ForbiddenLetterGame';
import { WordChainGame } from './games/WordChainGame';

// Trivia / Quiz Components
import { QuizSetupScreen } from './screens/quiz/QuizSetupScreen';
import { QuizPlayScreen } from './screens/quiz/QuizPlayScreen';
import { TrueFalsePlayScreen } from './screens/quiz/TrueFalsePlayScreen';

// New Game: Kutunu Seç
import { BoxDealGame } from './games/BoxDealGame';

// First Social Party Game Pack
import { CharadesGame } from './games/CharadesGame';
import { PassTheBombGame } from './games/PassTheBombGame';
import { OrderingGame } from './games/OrderingGame';
import { EstimationGame } from './games/EstimationGame';

import type { DifficultyLevel, GameMode, GameSettings, GameType, MedalType, Player, ScreenType, SinglePlayerRecord } from './types/game';
import type { QuizCategoryId, QuizGameMode } from './types/quiz';
import { storageService } from './services/storage';
import { calculatePlayerRankings } from './utils/score';
import { getGameMetadata } from './registry/gameRegistry';

export function App() {
  const [screen, setScreen] = useState<ScreenType>('main-menu');
  const [gameMode, setGameMode] = useState<GameMode>('single');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('normal');
  const [selectedGame, setSelectedGame] = useState<GameType>('tap-rush');
  const [players, setPlayers] = useState<Player[]>([]);
  const [settings, setSettings] = useState<GameSettings>(storageService.getSettings());

  // Exit Confirmation Modal State
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

  // Quiz Setup State
  const [quizConfig, setQuizConfig] = useState<{
    quizMode: QuizGameMode;
    categoryId: QuizCategoryId;
    difficulty: DifficultyLevel;
    questionCount: number;
    enableRiskFinal: boolean;
  }>({
    quizMode: 'classic',
    categoryId: 'genel-kultur',
    difficulty: 'normal',
    questionCount: 10,
    enableRiskFinal: false,
  });

  // Single player result state
  const [singleResult, setSingleResult] = useState<{
    score: number;
    isNewRecord: boolean;
    record: SinglePlayerRecord | null;
    medal: MedalType;
    stats?: Record<string, number | string>;
  }>({
    score: 0,
    isNewRecord: false,
    record: null,
    medal: 'none',
  });

  // Multi player result state
  const [multiResultPlayers, setMultiResultPlayers] = useState<Player[]>([]);

  const currentGameMeta = getGameMetadata(selectedGame);

  useEffect(() => {
    storageService.saveSettings(settings);
  }, [settings]);

  // Prevent browser context menu & capture back navigation safely
  useEffect(() => {
    const preventContextMenu = (e: MouseEvent) => e.preventDefault();
    window.addEventListener('contextmenu', preventContextMenu);
    return () => window.removeEventListener('contextmenu', preventContextMenu);
  }, []);

  // Handle Home navigation request with exit guard for active play screens
  const handleHomeClick = () => {
    if (screen === 'single-play' || screen === 'multi-play' || screen === 'countdown') {
      setShowExitConfirm(true);
    } else {
      setScreen('main-menu');
    }
  };

  const handleConfirmExitToHome = () => {
    setShowExitConfirm(false);
    setScreen('main-menu');
  };

  const handleSelectSinglePlayer = () => {
    setGameMode('single');
    setScreen('player-setup');
  };

  const handleSelectMultiPlayer = () => {
    setGameMode('multi');
    setScreen('player-setup');
  };

  const handleConfirmSetup = (configuredPlayers: Player[]) => {
    setPlayers(configuredPlayers);
    setScreen('game-select');
  };

  const handleSelectGame = (gameType: GameType) => {
    setSelectedGame(gameType);
    setScreen('rules');
  };

  const handleStartFromRules = () => {
    setScreen('countdown');
  };

  const handleCountdownComplete = () => {
    if (gameMode === 'single') {
      setScreen('single-play');
    } else {
      setScreen('multi-play');
    }
  };

  const handleFinishSingleGame = (
    finalScore: number,
    isNewRecord: boolean,
    record: SinglePlayerRecord,
    medal: MedalType = 'none',
    stats?: Record<string, number | string>
  ) => {
    setSingleResult({
      score: finalScore,
      isNewRecord,
      record,
      medal,
      stats,
    });
    setScreen('results');
  };

  const handleFinishMultiGame = (finalPlayers: Player[]) => {
    setMultiResultPlayers(finalPlayers);

    // Save history
    const ranked = calculatePlayerRankings(finalPlayers, currentGameMeta.isLowerScoreBetter);
    if (ranked.length > 0) {
      const winner = ranked[0];
      storageService.saveMultiHistory(
        selectedGame,
        currentGameMeta.title,
        winner.isTieForWinner ? 'Berabere' : winner.name,
        winner.score,
        finalPlayers.length,
        finalPlayers.map((p) => ({ name: p.name, score: p.score, color: p.color }))
      );
    }

    setScreen('results');
  };

  const handleGenericGameFinish = (
    results: { playerId: string; score: number; stats?: Record<string, number | string> }[]
  ) => {
    const updatedPlayers = players.map((p) => {
      const match = results.find((r) => r.playerId === p.id);
      return { ...p, score: match ? match.score : 0 };
    });

    if (gameMode === 'single') {
      const p1Score = updatedPlayers[0]?.score || 0;
      const matchStats = results[0]?.stats;

      const res = storageService.saveSingleScore(
        selectedGame,
        difficulty,
        updatedPlayers[0]?.name || 'Oyuncu 1',
        p1Score,
        currentGameMeta.unit,
        currentGameMeta.isLowerScoreBetter
      );
      handleFinishSingleGame(p1Score, res.isNewRecord, res.record, res.medal, matchStats);
    } else {
      handleFinishMultiGame(updatedPlayers);
    }
  };

  const handlePlayAgain = () => {
    setPlayers((prev) => prev.map((p) => ({ ...p, score: 0 })));
    setScreen('countdown');
  };

  const isQuizGameSelected =
    selectedGame === 'quiz-classic' ||
    selectedGame === 'quiz-fast-finger' ||
    selectedGame === 'quiz-true-false';

  return (
    <main className="w-full h-full max-w-lg mx-auto flex flex-col bg-slate-950 text-white relative shadow-2xl overflow-hidden">
      {/* Global Home Button overlay on non-main-menu screens */}
      {screen !== 'main-menu' && (
        <div className="absolute top-3 left-3 z-40">
          <HomeButton onClick={handleHomeClick} />
        </div>
      )}

      {/* Global Exit Confirmation Modal */}
      <ExitConfirmModal
        isOpen={showExitConfirm}
        onResumeGame={() => setShowExitConfirm(false)}
        onConfirmExit={handleConfirmExitToHome}
      />

      {screen === 'main-menu' && (
        <MainMenuScreen
          onSelectSinglePlayer={handleSelectSinglePlayer}
          onSelectMultiPlayer={handleSelectMultiPlayer}
          onOpenRecords={() => setScreen('records')}
          onOpenSettings={() => setScreen('settings')}
          soundEnabled={settings.soundEnabled}
          vibrationEnabled={settings.vibrationEnabled}
        />
      )}

      {screen === 'player-setup' && (
        <PlayerSetupScreen
          mode={gameMode}
          onBack={() => setScreen('main-menu')}
          onConfirmSetup={handleConfirmSetup}
          soundEnabled={settings.soundEnabled}
          vibrationEnabled={settings.vibrationEnabled}
        />
      )}

      {screen === 'game-select' && (
        <GameSelectScreen
          onBack={() => setScreen('player-setup')}
          onSelectGame={handleSelectGame}
        />
      )}

      {/* Rules Modal or Quiz Setup Screen */}
      {isQuizGameSelected && screen === 'rules' ? (
        <QuizSetupScreen
          mode={gameMode}
          players={players}
          onBack={() => setScreen('game-select')}
          onStartQuiz={(config) => {
            setQuizConfig(config);
            handleStartFromRules();
          }}
        />
      ) : (
        <RulesModal
          game={currentGameMeta}
          mode={gameMode}
          difficulty={difficulty}
          onSelectDifficulty={setDifficulty}
          isOpen={screen === 'rules'}
          onStartGame={handleStartFromRules}
          onBack={() => setScreen('game-select')}
          soundEnabled={settings.soundEnabled}
          vibrationEnabled={settings.vibrationEnabled}
        />
      )}

      {screen === 'countdown' && (
        <CountdownScreen
          onCountdownComplete={handleCountdownComplete}
          soundEnabled={settings.soundEnabled}
          vibrationEnabled={settings.vibrationEnabled}
        />
      )}

      {/* SINGLE PLAYER MINI GAMES ROUTER */}
      {screen === 'single-play' && players.length > 0 && (
        <>
          {selectedGame === 'box-deal' && (
            <BoxDealGame
              mode="single"
              players={players}
              onFinishGame={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}

          {selectedGame === 'tap-rush' && (
            <SinglePlayerTapGame
              player={players[0]}
              difficulty={difficulty}
              onFinishGame={(score, isNew, rec, medal, stats) =>
                handleFinishSingleGame(score, isNew, rec, medal, stats)
              }
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}
          {selectedGame === 'car-race' && (
            <CarRaceGame
              mode="single"
              players={players}
              difficulty={difficulty}
              onFinishGame={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}
          {selectedGame === 'penalty' && (
            <PenaltyGame
              mode="single"
              players={players}
              onFinishGame={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}
          {selectedGame === 'basketball' && (
            <BasketballGame
              mode="single"
              players={players}
              difficulty={difficulty}
              onFinishGame={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}
          {selectedGame === 'archery' && (
            <ArcheryGame
              mode="single"
              players={players}
              onFinishGame={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}
          {selectedGame === 'reflex' && (
            <ReflexGame
              mode="single"
              players={players}
              onFinishGame={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}
          {selectedGame === 'tug-of-war' && (
            <TugOfWarGame
              mode="single"
              players={players}
              onFinishGame={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}
          {selectedGame === 'air-hockey' && (
            <AirHockeyGame
              mode="single"
              players={players}
              onFinishGame={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}
          {selectedGame === 'tower' && (
            <TowerGame
              mode="single"
              players={players}
              onFinishGame={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}
          {selectedGame === 'maze' && (
            <MazeGame
              mode="single"
              players={players}
              onFinishGame={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}
          {selectedGame === 'memory' && (
            <MemoryGame
              mode="single"
              players={players}
              onFinishGame={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}

          {/* WORD GAMES SINGLE PLAYER */}
          {selectedGame === 'tabu' && (
            <TabuGame
              mode="single"
              players={players}
              onFinishGame={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}
          {selectedGame === 'hangman' && (
            <HangmanGame
              mode="single"
              players={players}
              onFinishGame={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}
          {selectedGame === 'word-search' && (
            <WordSearchGame
              mode="single"
              players={players}
              difficulty={difficulty}
              onFinishGame={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}
          {selectedGame === 'anagram' && (
            <AnagramGame
              mode="single"
              players={players}
              onFinishGame={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}
          {selectedGame === 'forbidden-letter' && (
            <ForbiddenLetterGame
              mode="single"
              players={players}
              onFinishGame={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}
          {selectedGame === 'word-chain' && (
            <WordChainGame
              mode="single"
              players={players}
              onFinishGame={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}

          {/* QUIZ SINGLE PLAYER */}
          {(selectedGame === 'quiz-classic' || selectedGame === 'quiz-fast-finger') && (
            <QuizPlayScreen
              mode="single"
              quizMode={quizConfig.quizMode}
              categoryId={quizConfig.categoryId}
              difficulty={quizConfig.difficulty}
              questionCount={quizConfig.questionCount}
              enableRiskFinal={quizConfig.enableRiskFinal}
              players={players}
              onFinishQuiz={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}
          {selectedGame === 'quiz-true-false' && (
            <TrueFalsePlayScreen
              mode="single"
              categoryId={quizConfig.categoryId}
              players={players}
              onFinishQuiz={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}
          {/* SOCIAL GAMES SINGLE PLAYER */}
          {selectedGame === 'charades' && (
            <CharadesGame
              mode="single"
              players={players}
              onFinishGame={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}
          {selectedGame === 'pass-the-bomb' && (
            <PassTheBombGame
              mode="single"
              players={players}
              onFinishGame={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}
          {selectedGame === 'order-up' && (
            <OrderingGame
              mode="single"
              players={players}
              onFinishGame={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}
          {selectedGame === 'estimation' && (
            <EstimationGame
              mode="single"
              players={players}
              onFinishGame={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}
        </>
      )}

      {/* MULTIPLAYER MINI GAMES ROUTER */}
      {screen === 'multi-play' && (
        <>
          {selectedGame === 'box-deal' && (
            <BoxDealGame
              mode="multi"
              players={players}
              onFinishGame={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}

          {selectedGame === 'tap-rush' && (
            <MultiPlayerTapGame
              players={players}
              onFinishGame={handleFinishMultiGame}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}
          {selectedGame === 'car-race' && (
            <CarRaceGame
              mode="multi"
              players={players}
              difficulty={difficulty}
              onFinishGame={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}
          {selectedGame === 'penalty' && (
            <PenaltyGame
              mode="multi"
              players={players}
              onFinishGame={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}
          {selectedGame === 'basketball' && (
            <BasketballGame
              mode="multi"
              players={players}
              difficulty={difficulty}
              onFinishGame={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}
          {selectedGame === 'archery' && (
            <ArcheryGame
              mode="multi"
              players={players}
              onFinishGame={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}
          {selectedGame === 'reflex' && (
            <ReflexGame
              mode="multi"
              players={players}
              onFinishGame={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}
          {selectedGame === 'tug-of-war' && (
            <TugOfWarGame
              mode="multi"
              players={players}
              onFinishGame={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}
          {selectedGame === 'air-hockey' && (
            <AirHockeyGame
              mode="multi"
              players={players}
              onFinishGame={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}
          {selectedGame === 'tower' && (
            <TowerGame
              mode="multi"
              players={players}
              onFinishGame={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}
          {selectedGame === 'maze' && (
            <MazeGame
              mode="multi"
              players={players}
              onFinishGame={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}
          {selectedGame === 'memory' && (
            <MemoryGame
              mode="multi"
              players={players}
              onFinishGame={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}

          {/* WORD GAMES MULTIPLAYER */}
          {selectedGame === 'tabu' && (
            <TabuGame
              mode="multi"
              players={players}
              onFinishGame={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}
          {selectedGame === 'hangman' && (
            <HangmanGame
              mode="multi"
              players={players}
              onFinishGame={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}
          {selectedGame === 'word-search' && (
            <WordSearchGame
              mode="multi"
              players={players}
              difficulty={difficulty}
              onFinishGame={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}
          {selectedGame === 'anagram' && (
            <AnagramGame
              mode="multi"
              players={players}
              onFinishGame={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}
          {selectedGame === 'forbidden-letter' && (
            <ForbiddenLetterGame
              mode="multi"
              players={players}
              onFinishGame={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}
          {selectedGame === 'word-chain' && (
            <WordChainGame
              mode="multi"
              players={players}
              onFinishGame={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}

          {/* QUIZ MULTIPLAYER */}
          {(selectedGame === 'quiz-classic' || selectedGame === 'quiz-fast-finger') && (
            <QuizPlayScreen
              mode="multi"
              quizMode={quizConfig.quizMode}
              categoryId={quizConfig.categoryId}
              difficulty={quizConfig.difficulty}
              questionCount={quizConfig.questionCount}
              enableRiskFinal={quizConfig.enableRiskFinal}
              players={players}
              onFinishQuiz={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}
          {/* SOCIAL GAMES MULTIPLAYER */}
          {selectedGame === 'charades' && (
            <CharadesGame
              mode="multi"
              players={players}
              onFinishGame={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}
          {selectedGame === 'pass-the-bomb' && (
            <PassTheBombGame
              mode="multi"
              players={players}
              onFinishGame={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}
          {selectedGame === 'order-up' && (
            <OrderingGame
              mode="multi"
              players={players}
              onFinishGame={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}
          {selectedGame === 'estimation' && (
            <EstimationGame
              mode="multi"
              players={players}
              onFinishGame={handleGenericGameFinish}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
            />
          )}
        </>
      )}

      {screen === 'results' && (
        <ResultsScreen
          mode={gameMode}
          gameType={selectedGame}
          gameTitle={currentGameMeta.title}
          gameUnit={currentGameMeta.unit}
          difficulty={difficulty}
          earnedMedal={singleResult.medal}
          isLowerScoreBetter={currentGameMeta.isLowerScoreBetter}
          singleScore={singleResult.score}
          singleStats={singleResult.stats}
          isNewRecord={singleResult.isNewRecord}
          singleRecord={singleResult.record}
          multiPlayers={multiResultPlayers}
          onPlayAgain={handlePlayAgain}
          onGameSelect={() => setScreen('game-select')}
          onMainMenu={() => setScreen('main-menu')}
          soundEnabled={settings.soundEnabled}
          vibrationEnabled={settings.vibrationEnabled}
        />
      )}

      {screen === 'records' && (
        <RecordsScreen onBack={() => setScreen('main-menu')} />
      )}

      {screen === 'settings' && (
        <SettingsScreen
          settings={settings}
          onUpdateSettings={setSettings}
          onBack={() => setScreen('main-menu')}
        />
      )}
    </main>
  );
};

export default App;
