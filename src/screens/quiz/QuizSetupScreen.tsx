import React, { useState } from 'react';
import { HelpCircle, Play, Flame } from 'lucide-react';
import { Header } from '../../components/Header';
import type { DifficultyLevel, GameMode, Player } from '../../types/game';
import type { QuizCategoryId, QuizCategoryInfo, QuizGameMode } from '../../types/quiz';
import { QuizCategoryCard } from '../../components/quiz/QuizCategoryCard';

interface QuizSetupScreenProps {
  mode: GameMode;
  players: Player[];
  onBack: () => void;
  onStartQuiz: (config: {
    quizMode: QuizGameMode;
    categoryId: QuizCategoryId;
    difficulty: DifficultyLevel;
    questionCount: number;
    enableRiskFinal: boolean;
  }) => void;
}

export const QUIZ_CATEGORIES: QuizCategoryInfo[] = [
  { id: 'genel-kultur', title: 'Genel Kültür', description: 'Dünya ve yaşam genel bilgileri', icon: 'HelpCircle', color: '#00D2D3' },
  { id: 'turk-tarihi', title: 'Türk Tarihi', description: 'Orhun\'dan Cumhuriyet\'e şanlı tarih', icon: 'BookOpen', color: '#FF4757' },
  { id: 'turkiye-cografyasi', title: 'Türkiye Coğrafyası', description: 'İller, dağlar, nehirler ve göller', icon: 'Compass', color: '#10AC84' },
  { id: 'bilim-doga', title: 'Bilim ve Doğa', description: 'Fizik, kimya, biyoloji ve uzay', icon: 'Atom', color: '#5F27CD' },
  { id: 'sosyal-medya', title: 'Sosyal Medya & Kültür', description: 'İnternet geyikleri, trendler ve dijital dünya', icon: 'Share2', color: '#FF9F43' },
  { id: 'guncel-olaylar', title: 'Güncel Olaylar', description: 'Son dönem olaylar ve haberler', icon: 'Newspaper', color: '#FF6B6B' },
  { id: 'karisik', title: 'Karışık', description: 'Tüm kategorilerden rastgele harmanlanmış sorular', icon: 'Shuffle', color: '#00D2D3' },
];

export const QuizSetupScreen: React.FC<QuizSetupScreenProps> = ({
  mode,
  onBack,
  onStartQuiz,
}) => {
  const [step, setStep] = useState<'mode' | 'category' | 'config'>('mode');
  const [selectedQuizMode, setSelectedQuizMode] = useState<QuizGameMode>('classic');
  const [selectedCategoryId, setSelectedCategoryId] = useState<QuizCategoryId>('genel-kultur');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('normal');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [enableRiskFinal, setEnableRiskFinal] = useState<boolean>(false);

  const handleSelectQuizMode = (qMode: QuizGameMode) => {
    setSelectedQuizMode(qMode);
    setStep('category');
  };

  const handleSelectCategory = (catId: QuizCategoryId) => {
    setSelectedCategoryId(catId);
    setStep('config');
  };

  const handleFinalStart = () => {
    onStartQuiz({
      quizMode: selectedQuizMode,
      categoryId: selectedCategoryId,
      difficulty,
      questionCount,
      enableRiskFinal,
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-white select-none animate-fade-in">
      <Header
        title="Bilgi Yarışması Kurulumu"
        onBack={() => {
          if (step === 'config') setStep('category');
          else if (step === 'category') setStep('mode');
          else onBack();
        }}
      />

      <div className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-4 overflow-y-auto">
        {/* Step Indicator */}
        <div className="flex justify-around items-center bg-slate-900 border border-slate-800 rounded-2xl p-2 text-xs font-black text-slate-400">
          <span className={step === 'mode' ? 'text-indigo-400 font-extrabold' : ''}>1. Oyun Modu</span>
          <span>&gt;</span>
          <span className={step === 'category' ? 'text-indigo-400 font-extrabold' : ''}>2. Kategori</span>
          <span>&gt;</span>
          <span className={step === 'config' ? 'text-indigo-400 font-extrabold' : ''}>3. Ayarlar</span>
        </div>

        {/* STEP 1: QUIZ MODE SELECTION */}
        {step === 'mode' && (
          <div className="space-y-3">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-black text-white">Oyun Modunu Seçin</h2>
              <p className="text-xs text-slate-400">Yarışmak istediğiniz formatı belirleyin</p>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-2">
              <button
                onClick={() => handleSelectQuizMode('classic')}
                className="bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-3xl p-5 text-left space-y-2 shadow-lg transition-all active:scale-98"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-black text-indigo-400">🎯 Klasik Yarışma</h3>
                  <span className="text-xs font-bold text-slate-400 bg-slate-950 px-3 py-1 rounded-full">
                    Süreli & Jokerli
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium">
                  10 soruluk yarışma. Hız bonusları, seriler ve 3 özel joker (50:50, Dondur, Pas).
                </p>
              </button>

              {mode === 'multi' && (
                <button
                  onClick={() => handleSelectQuizMode('fast-finger')}
                  className="bg-slate-900 border border-slate-800 hover:border-amber-400 rounded-3xl p-5 text-left space-y-2 shadow-lg transition-all active:scale-98"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-black text-amber-400">⚡ Hızlı Parmak</h3>
                    <span className="text-xs font-bold text-slate-400 bg-slate-950 px-3 py-1 rounded-full">
                      Çok Oyunculu
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium">
                    İlk basan cevap verir! Yanlış cevapta sıra diğer oyunculara geçer.
                  </p>
                </button>
              )}

              <button
                onClick={() => handleSelectQuizMode('true-false')}
                className="bg-slate-900 border border-slate-800 hover:border-emerald-400 rounded-3xl p-5 text-left space-y-2 shadow-lg transition-all active:scale-98"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-black text-emerald-400">✔️ / ❌ Doğru mu, Yanlış mı?</h3>
                  <span className="text-xs font-bold text-slate-400 bg-slate-950 px-3 py-1 rounded-full">
                    Hızlı Seri
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium">
                  Ekrana gelen cümlenin Doğru veya Yanlış olduğuna karar verin.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: CATEGORY SELECTION */}
        {step === 'category' && (
          <div className="space-y-3">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-black text-white">Kategori Seçin</h2>
              <p className="text-xs text-slate-400">15 Zengin soru kategorisi mevcuttur</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-6">
              {QUIZ_CATEGORIES.map((cat) => (
                <QuizCategoryCard
                  key={cat.id}
                  category={cat}
                  onSelect={handleSelectCategory}
                />
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: CONFIG SELECTION */}
        {step === 'config' && (
          <div className="space-y-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl animate-scale-up max-w-sm mx-auto">
            <div className="text-center space-y-1">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                <HelpCircle className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-black text-white">Yarışma Ayarları</h2>
            </div>

            {/* Difficulty Selector */}
            {mode === 'single' && (
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-slate-300 block">Zorluk Seviyesi:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['easy', 'normal', 'hard'] as DifficultyLevel[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 border ${
                        difficulty === d
                          ? 'bg-indigo-500 text-white border-indigo-400 shadow-md'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      {d === 'easy' ? 'Kolay' : d === 'normal' ? 'Normal' : 'Zor'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Question Count Selector */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-slate-300 block">Soru Sayısı:</label>
              <div className="grid grid-cols-3 gap-2">
                {[5, 10, 15].map((cnt) => (
                  <button
                    key={cnt}
                    onClick={() => setQuestionCount(cnt)}
                    className={`py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 border ${
                      questionCount === cnt
                        ? 'bg-indigo-500 text-white border-indigo-400 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    {cnt} Soru
                  </button>
                ))}
              </div>
            </div>

            {/* Riskli Final Toggle for Multiplayer */}
            {mode === 'multi' && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-left">
                  <Flame className="w-5 h-5 text-amber-400" />
                  <div>
                    <span className="text-xs font-black text-white block">Riskli Final</span>
                    <span className="text-[10px] text-slate-400 block">Son soruda puan bahsi koyma</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enableRiskFinal}
                  onChange={(e) => setEnableRiskFinal(e.target.checked)}
                  className="w-5 h-5 accent-indigo-500 rounded cursor-pointer"
                />
              </div>
            )}

            <button
              onClick={handleFinalStart}
              className="w-full py-4 rounded-2xl bg-indigo-500 text-white font-black text-base shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" /> Yarışmayı Başlat
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
