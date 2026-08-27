import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Car, Trophy, RotateCcw, AlertTriangle, ShieldAlert } from 'lucide-react-native';
import { HeaderNav } from '../../components/HeaderNav';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useGameSession } from '../../context/GameSessionContext';

interface Obstacle {
  id: number;
  lane: number; // 0: Left, 1: Center, 2: Right
  y: number; // 0..100%
  type: 'truck' | 'police' | 'oil' | 'barrier';
}

export default function MobileCarRaceScreen() {
  const router = useRouter();
  const { session } = useGameSession();
  const player = session.players[0] || { name: 'Oyuncu 1' };

  const [distance, setDistance] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(90);
  const [playerLane, setPlayerLane] = useState<number>(1); // 0: Left, 1: Center, 2: Right
  const [lives, setLives] = useState<number>(3);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);

  const isFinishedRef = useRef<boolean>(false);
  const playerLaneRef = useRef<number>(1);
  const livesRef = useRef<number>(3);
  const lastSpawnRef = useRef<number>(0);

  useEffect(() => {
    playerLaneRef.current = playerLane;
  }, [playerLane]);

  // Game Loop: Distance, Speed & Obstacle Animation
  useEffect(() => {
    if (isGameOver || isFinishedRef.current) return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      // Update distance & speed
      setDistance((d) => d + Math.round(speed * delta * 2));
      setScore((s) => s + Math.round(speed * delta));
      setSpeed((s) => Math.min(220, s + delta * 2));

      // Obstacle Spawner (Every 1.2s - 2.0s)
      if (now - lastSpawnRef.current > 1400) {
        lastSpawnRef.current = now;
        const randomLane = Math.floor(Math.random() * 3);
        const types: ('truck' | 'police' | 'oil' | 'barrier')[] = ['truck', 'police', 'oil', 'barrier'];
        const randomType = types[Math.floor(Math.random() * types.length)];

        setObstacles((prev) => [
          ...prev.filter((o) => o.y < 105),
          {
            id: now + Math.random(),
            lane: randomLane,
            y: -10,
            type: randomType,
          },
        ]);
      }

      // Move Obstacles & Check Collisions
      setObstacles((prev) => {
        const nextObstacles: Obstacle[] = [];

        for (const obs of prev) {
          const nextY = obs.y + speed * delta * 0.45;

          // Check Collision with Player Car (Player is at y = 78%)
          if (nextY >= 70 && nextY <= 86 && obs.lane === playerLaneRef.current) {
            // Collision hit!
            handleCollision();
            continue; // Destroy obstacle after hit
          }

          // Near Miss Bonus
          if (nextY >= 78 && nextY <= 82 && Math.abs(obs.lane - playerLaneRef.current) === 1) {
            setScore((s) => s + 25);
          }

          if (nextY <= 105) {
            nextObstacles.push({ ...obs, y: nextY });
          }
        }

        return nextObstacles;
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isGameOver, speed]);

  const handleCollision = () => {
    const nextLives = livesRef.current - 1;
    livesRef.current = nextLives;
    setLives(nextLives);

    setFeedback('💥 ENGEL ÇARPMASI!');
    setTimeout(() => setFeedback(null), 1000);

    if (nextLives <= 0) {
      isFinishedRef.current = true;
      setIsGameOver(true);
    }
  };

  const handleMoveLeft = () => {
    if (isGameOver) return;
    setPlayerLane((prev) => Math.max(0, prev - 1));
  };

  const handleMoveRight = () => {
    if (isGameOver) return;
    setPlayerLane((prev) => Math.min(2, prev + 1));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <HeaderNav title="Mini Araba Yarışı" onHomePress={() => setShowExitModal(true)} />

        {/* Top Info Bar */}
        <View style={styles.infoBar}>
          <View style={styles.infoPill}>
            <Car size={16} color="#F59E0B" />
            <Text style={styles.infoText}>{distance} m</Text>
          </View>

          <View style={styles.infoPill}>
            <Text style={styles.infoText}>⚡ {Math.round(speed)} km/h</Text>
          </View>

          <View style={styles.infoPill}>
            <Text style={styles.livesText}>{'❤️'.repeat(lives)}</Text>
          </View>
        </View>

        {/* Road Track Arena */}
        <View style={styles.trackArena}>
          {/* Feedback Banner */}
          {feedback && (
            <View style={styles.feedbackBox}>
              <Text style={styles.feedbackText}>{feedback}</Text>
            </View>
          )}

          {/* Lane Dividers */}
          <View style={styles.laneDividers}>
            <View style={styles.dividerLine} />
            <View style={styles.dividerLine} />
          </View>

          {/* Moving Obstacles */}
          {obstacles.map((obs) => (
            <View
              key={obs.id}
              style={[
                styles.obstacle,
                {
                  top: `${obs.y}%`,
                  left: obs.lane === 0 ? '12%' : obs.lane === 1 ? '42%' : '72%',
                },
              ]}
            >
              {obs.type === 'truck' ? (
                <Text style={styles.obstacleEmoji}>🚛</Text>
              ) : obs.type === 'police' ? (
                <Text style={styles.obstacleEmoji}>🚓</Text>
              ) : obs.type === 'oil' ? (
                <Text style={styles.obstacleEmoji}>🛢️</Text>
              ) : (
                <Text style={styles.obstacleEmoji}>🚧</Text>
              )}
            </View>
          ))}

          {/* Player Car Avatar */}
          <View
            style={[
              styles.carAvatar,
              { left: playerLane === 0 ? '12%' : playerLane === 1 ? '42%' : '72%' },
            ]}
          >
            <Car size={34} color="#38BDF8" fill="#020617" />
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.controlBtn} onPress={handleMoveLeft}>
            <Text style={styles.controlText}>◀ SOL ŞERİT</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlBtn} onPress={handleMoveRight}>
            <Text style={styles.controlText}>SAĞ ŞERİT ▶</Text>
          </TouchableOpacity>
        </View>

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

        <Modal visible={isGameOver} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Trophy size={40} color="#F59E0B" />
              <Text style={styles.modalTitle}>YARIŞ TAMAMLANDI!</Text>
              <Text style={styles.modalScore}>{distance} METRE ({score} PUAN)</Text>
              <TouchableOpacity style={styles.restartBtn} onPress={() => router.replace('/games')}>
                <RotateCcw size={18} color="#020617" />
                <Text style={styles.restartText}>Oyun Seçimine Dön</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  content: { flex: 1, padding: 16 },
  infoBar: {
    flexDirection: 'row',
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
    borderRadius: 12,
  },
  infoText: { color: '#F8FAFC', fontWeight: '900', fontSize: 13 },
  livesText: { fontSize: 13 },
  trackArena: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 2,
    borderRadius: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  feedbackBox: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    zIndex: 30,
    backgroundColor: '#020617',
    borderColor: '#EF4444',
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  feedbackText: { color: '#EF4444', fontWeight: '900', fontSize: 14 },
  laneDividers: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    height: '100%',
  },
  dividerLine: {
    width: 2,
    height: '100%',
    backgroundColor: '#334155',
  },
  obstacle: {
    position: 'absolute',
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  obstacleEmoji: { fontSize: 32 },
  carAvatar: {
    position: 'absolute',
    bottom: 24,
    padding: 8,
    backgroundColor: '#020617',
    borderColor: '#38BDF8',
    borderWidth: 2,
    borderRadius: 16,
    zIndex: 25,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  controlBtn: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderColor: '#38BDF8',
    borderWidth: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  controlText: { color: '#38BDF8', fontWeight: '900', fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2,6,23,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#F8FAFC', marginTop: 10 },
  modalScore: { fontSize: 24, fontWeight: '900', color: '#F59E0B', marginVertical: 12 },
  restartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 10,
  },
  restartText: { color: '#020617', fontWeight: '900', fontSize: 14 },
});
