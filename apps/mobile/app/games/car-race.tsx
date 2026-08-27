import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Car, Trophy, RotateCcw, ShieldAlert } from 'lucide-react-native';
import { HeaderNav } from '../../components/HeaderNav';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useGameSession } from '../../context/GameSessionContext';

export default function MobileCarRaceScreen() {
  const router = useRouter();
  const { session } = useGameSession();
  const player = session.players[0] || { name: 'Oyuncu 1' };

  const [distance, setDistance] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(80);
  const [playerLane, setPlayerLane] = useState<number>(1); // 0: Left, 1: Center, 2: Right
  const [lives, setLives] = useState<number>(3);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);

  const isFinishedRef = useRef<boolean>(false);

  // Distance & speed tick
  useEffect(() => {
    if (isGameOver || isFinishedRef.current) return;

    const timer = setInterval(() => {
      setDistance((d) => d + Math.round(speed / 10));
      setSpeed((s) => Math.min(180, s + 0.5));
    }, 150);

    return () => clearInterval(timer);
  }, [isGameOver, speed]);

  const handleMoveLeft = () => {
    if (isGameOver) return;
    setPlayerLane((prev) => Math.max(0, prev - 1));
  };

  const handleMoveRight = () => {
    if (isGameOver) return;
    setPlayerLane((prev) => Math.min(2, prev + 1));
  };

  const finishGame = () => {
    isFinishedRef.current = true;
    setIsGameOver(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <HeaderNav title="Mini Araba Yarışı" onHomePress={() => setShowExitModal(true)} />

        {/* Top Info Bar */}
        <View style={styles.infoBar}>
          <View style={styles.infoPill}>
            <Car size={16} color="#F59E0B" />
            <Text style={styles.infoText}>{distance} Metre</Text>
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
          <View style={styles.laneDividers}>
            <View style={styles.dividerLine} />
            <View style={styles.dividerLine} />
          </View>

          {/* Car Avatar */}
          <View
            style={[
              styles.carAvatar,
              { left: playerLane === 0 ? '12%' : playerLane === 1 ? '42%' : '72%' },
            ]}
          >
            <Car size={36} color="#38BDF8" fill="#020617" />
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
              <Text style={styles.modalScore}>{distance} METRE</Text>
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
    borderStyle: 'dashed',
  },
  carAvatar: {
    position: 'absolute',
    bottom: 24,
    padding: 8,
    backgroundColor: '#020617',
    borderColor: '#38BDF8',
    borderWidth: 2,
    borderRadius: 16,
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
  modalScore: { fontSize: 28, fontWeight: '900', color: '#38BDF8', marginVertical: 12 },
  restartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#38BDF8',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 10,
  },
  restartText: { color: '#020617', fontWeight: '900', fontSize: 14 },
});
