import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Zap, RotateCcw, Trophy, Target, Flame } from 'lucide-react-native';
import { HeaderNav } from '../../components/HeaderNav';
import { ConfirmModal } from '../../components/ConfirmModal';
import { TargetSVG } from '../../components/TargetSVGs';
import { mobileStorageService, TargetHuntRecord } from '../../services/storage';

interface TargetItem {
  id: number;
  type: 'normal' | 'golden' | 'trap';
  x: number; // percentage 10..80%
  y: number; // percentage 15..75%
}

export default function MobileTargetHuntScreen() {
  const router = useRouter();

  // Settings
  const [hapticEnabled, setHapticEnabled] = useState<boolean>(true);

  // Game Loop & Timer State
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [isGameActive, setIsGameActive] = useState<boolean>(true);

  // Stats State & Refs (Stale-closure safe)
  const [score, setScore] = useState<number>(0);
  const [hits, setHits] = useState<number>(0);
  const [misses, setMisses] = useState<number>(0);
  const [trapHits, setTrapHits] = useState<number>(0);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);

  const scoreRef = useRef<number>(0);
  const hitsRef = useRef<number>(0);
  const missesRef = useRef<number>(0);
  const trapHitsRef = useRef<number>(0);
  const currentStreakRef = useRef<number>(0);
  const bestStreakRef = useRef<number>(0);
  const isFinishedRef = useRef<boolean>(false);

  // Targets State
  const [targets, setTargets] = useState<TargetItem[]>([]);

  // Exit Modal & Results Modal
  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const [showResultsModal, setShowResultsModal] = useState<boolean>(false);
  const [recordResult, setRecordResult] = useState<{ isNewRecord: boolean; record: TargetHuntRecord } | null>(null);

  useEffect(() => {
    loadSettings();
    startNewGame();
  }, []);

  const loadSettings = async () => {
    const s = await mobileStorageService.getSettings();
    setHapticEnabled(s.hapticEnabled);
  };

  const triggerHaptic = (type: 'hit' | 'golden' | 'trap') => {
    if (!hapticEnabled) return;
    try {
      if (type === 'trap') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else if (type === 'golden') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (e) {
      // Ignore if haptics unavailable in simulator
    }
  };

  // Timer Loop
  useEffect(() => {
    if (!isGameActive || isFinishedRef.current) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          finishGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isGameActive]);

  // Target Spawner Loop
  useEffect(() => {
    if (!isGameActive || isFinishedRef.current) return;

    const spawnInterval = setInterval(() => {
      spawnRandomTarget();
    }, 800);

    return () => clearInterval(spawnInterval);
  }, [isGameActive]);

  const spawnRandomTarget = () => {
    if (isFinishedRef.current) return;

    const randTypeNum = Math.random();
    const type: 'normal' | 'golden' | 'trap' =
      randTypeNum < 0.65 ? 'normal' : randTypeNum < 0.85 ? 'golden' : 'trap';

    // Safe bounds within pitch (10%..80% X, 15%..75% Y)
    const x = Math.floor(Math.random() * 70) + 10;
    const y = Math.floor(Math.random() * 60) + 15;

    const newTarget: TargetItem = {
      id: Math.random(),
      type,
      x,
      y,
    };

    setTargets((prev) => [...prev.slice(-3), newTarget]);
  };

  const handleTapTarget = (target: TargetItem) => {
    if (!isGameActive || isFinishedRef.current || timeLeft <= 0) return;

    // Remove target
    setTargets((prev) => prev.filter((t) => t.id !== target.id));

    const multiplier = Math.min(4, 1 + Math.floor(currentStreakRef.current / 5));

    if (target.type === 'normal') {
      triggerHaptic('hit');
      hitsRef.current += 1;
      setHits(hitsRef.current);

      currentStreakRef.current += 1;
      setCurrentStreak(currentStreakRef.current);
      bestStreakRef.current = Math.max(bestStreakRef.current, currentStreakRef.current);
      setBestStreak(bestStreakRef.current);

      const pts = 10 * multiplier;
      scoreRef.current += pts;
      setScore(scoreRef.current);
    } else if (target.type === 'golden') {
      triggerHaptic('golden');
      hitsRef.current += 1;
      setHits(hitsRef.current);

      currentStreakRef.current += 1;
      setCurrentStreak(currentStreakRef.current);
      bestStreakRef.current = Math.max(bestStreakRef.current, currentStreakRef.current);
      setBestStreak(bestStreakRef.current);

      const pts = 25 * multiplier;
      scoreRef.current += pts;
      setScore(scoreRef.current);
    } else if (target.type === 'trap') {
      triggerHaptic('trap');
      trapHitsRef.current += 1;
      setTrapHits(trapHitsRef.current);

      currentStreakRef.current = 0;
      setCurrentStreak(0);

      scoreRef.current = Math.max(0, scoreRef.current - 15);
      setScore(scoreRef.current);
    }
  };

  const handleTapArenaMiss = () => {
    if (!isGameActive || isFinishedRef.current || timeLeft <= 0) return;
    missesRef.current += 1;
    setMisses(missesRef.current);
    currentStreakRef.current = 0;
    setCurrentStreak(0);
  };

  const finishGame = async () => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;
    setIsGameActive(false);

    const finalScore = scoreRef.current;
    const finalHits = hitsRef.current;
    const finalMisses = missesRef.current;
    const finalTrapHits = trapHitsRef.current;
    const finalBestStreak = bestStreakRef.current;

    const totalAttempts = finalHits + finalMisses + finalTrapHits;
    const accuracy = totalAttempts > 0 ? Math.round((finalHits / totalAttempts) * 100) : 0;

    const res = await mobileStorageService.saveTargetHuntRecord(
      finalScore,
      finalBestStreak,
      accuracy
    );

    setRecordResult(res);
    setShowResultsModal(true);
  };

  const startNewGame = () => {
    scoreRef.current = 0;
    hitsRef.current = 0;
    missesRef.current = 0;
    trapHitsRef.current = 0;
    currentStreakRef.current = 0;
    bestStreakRef.current = 0;
    isFinishedRef.current = false;

    setScore(0);
    setHits(0);
    setMisses(0);
    setTrapHits(0);
    setCurrentStreak(0);
    setBestStreak(0);
    setTimeLeft(30);
    setTargets([]);
    setShowResultsModal(false);
    setShowExitModal(false);
    setIsGameActive(true);
  };

  const currentMultiplier = Math.min(4, 1 + Math.floor(currentStreak / 5));
  const totalAttempts = hits + misses + trapHits;
  const currentAccuracy = totalAttempts > 0 ? Math.round((hits / totalAttempts) * 100) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <HeaderNav
          title="Hedef Avı"
          onHomePress={() => setShowExitModal(true)}
        />

        {/* Top Game Info Bar */}
        <View style={styles.infoBar}>
          <View style={styles.infoPill}>
            <Zap size={16} color="#38BDF8" />
            <Text style={styles.scoreText}>{score} Puan</Text>
          </View>

          <View style={styles.infoPill}>
            <Flame size={16} color="#F59E0B" />
            <Text style={styles.streakText}>x{currentMultiplier} Çarpan</Text>
          </View>

          <View style={[styles.infoPill, timeLeft <= 5 && styles.timerDanger]}>
            <Text style={styles.timerText}>⏱️ {timeLeft}s</Text>
          </View>
        </View>

        {/* Target Play Arena */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleTapArenaMiss}
          style={styles.arena}
        >
          {targets.map((target) => (
            <TouchableOpacity
              key={target.id}
              activeOpacity={0.7}
              onPress={() => handleTapTarget(target)}
              style={[
                styles.targetWrapper,
                { left: `${target.x}%`, top: `${target.y}%` },
              ]}
            >
              <TargetSVG type={target.type} size={64} />
            </TouchableOpacity>
          ))}
        </TouchableOpacity>

        {/* Exit Confirmation Modal */}
        <ConfirmModal
          visible={showExitModal}
          title="Oyundan Çıkış Onayı"
          message="Oyundan çıkmak istiyor musun? Bu turun ilerlemesi kaydedilmeyecek."
          onCancel={() => setShowExitModal(false)}
          onConfirm={() => {
            setShowExitModal(false);
            router.replace('/');
          }}
        />

        {/* Game Results Modal */}
        <Modal visible={showResultsModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.resultsCard}>
              <View style={styles.trophyBadge}>
                <Trophy size={36} color="#F59E0B" />
              </View>

              <Text style={styles.resultsTitle}>
                {recordResult?.isNewRecord ? 'YENİ REKOR!' : 'TUR TAMAMLANDI!'}
              </Text>
              <Text style={styles.resultsSubtitle}>
                {recordResult?.isNewRecord
                  ? `Tebrikler, ${score} puan ile yeni kişisel rekorunu kırdın!`
                  : 'Harika bir denemeydi, skorun kaydedildi.'}
              </Text>

              <View style={styles.resultsScoreBox}>
                <Text style={styles.scoreLabel}>TOPLAM SKOR</Text>
                <Text style={styles.scoreValue}>{score} Puan</Text>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statCell}>
                  <Text style={styles.cellLabel}>İsabet Oranı</Text>
                  <Text style={styles.cellValue}>%{currentAccuracy}</Text>
                </View>

                <View style={styles.statCell}>
                  <Text style={styles.cellLabel}>En Uzun Seri</Text>
                  <Text style={styles.cellValue}>{bestStreak} x</Text>
                </View>

                <View style={styles.statCell}>
                  <Text style={styles.cellLabel}>Doğru Hedef</Text>
                  <Text style={styles.cellValue}>{hits}</Text>
                </View>

                <View style={styles.statCell}>
                  <Text style={styles.cellLabel}>Tuzak Vuruşu</Text>
                  <Text style={styles.cellValue}>{trapHits}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.playAgainButton} onPress={startNewGame}>
                <RotateCcw size={20} color="#020617" />
                <Text style={styles.playAgainText}>Tekrar Oyna</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 18,
    padding: 10,
    marginBottom: 12,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#020617',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  timerDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#EF4444',
  },
  scoreText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '900',
  },
  streakText: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '900',
  },
  timerText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '900',
  },
  arena: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 2,
    borderRadius: 28,
    overflow: 'hidden',
    position: 'relative',
  },
  targetWrapper: {
    position: 'absolute',
    padding: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resultsCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
  },
  trophyBadge: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  resultsSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 16,
  },
  resultsScoreBox: {
    width: '100%',
    backgroundColor: '#020617',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#38BDF8',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  statCell: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#020617',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
  },
  cellLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
  },
  cellValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  playAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: '#38BDF8',
  },
  playAgainText: {
    color: '#020617',
    fontWeight: '900',
    fontSize: 15,
  },
});
