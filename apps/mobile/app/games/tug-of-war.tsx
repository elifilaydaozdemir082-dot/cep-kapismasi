import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swords, Trophy, RotateCcw } from 'lucide-react-native';
import { HeaderNav } from '../../components/HeaderNav';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useGameSession } from '../../context/GameSessionContext';

export default function MobileTugOfWarScreen() {
  const router = useRouter();
  const { session } = useGameSession();
  const isMulti = session.mode === 'multiplayer';

  const [ropePosition, setRopePosition] = useState<number>(50);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [winnerName, setWinnerName] = useState<string>('');
  const [showExitModal, setShowExitModal] = useState<boolean>(false);

  const player1 = session.players[0] || { name: 'Oyuncu 1', color: '#06B6D4' };
  const player2 = session.players[1] || { name: isMulti ? 'Oyuncu 2' : 'Bot Rakip', color: '#EF4444' };

  // AI Pull Loop for Single Player
  useEffect(() => {
    if (isMulti || isGameOver) return;

    const timer = setInterval(() => {
      setRopePosition((prev) => {
        const next = prev + 1.2;
        if (next >= 90) {
          clearInterval(timer);
          setWinnerName(player2.name);
          setIsGameOver(true);
          return 100;
        }
        return next;
      });
    }, 150);

    return () => clearInterval(timer);
  }, [isMulti, isGameOver]);

  const handlePullP1 = () => {
    if (isGameOver) return;
    setRopePosition((prev) => {
      const next = prev - 3.5;
      if (next <= 10) {
        setWinnerName(player1.name);
        setIsGameOver(true);
        return 0;
      }
      return next;
    });
  };

  const handlePullP2 = () => {
    if (isGameOver || !isMulti) return;
    setRopePosition((prev) => {
      const next = prev + 3.5;
      if (next >= 90) {
        setWinnerName(player2.name);
        setIsGameOver(true);
        return 100;
      }
      return next;
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <HeaderNav title="Halat Çekme" onHomePress={() => setShowExitModal(true)} />

        <View style={styles.infoBar}>
          <Text style={[styles.playerHeader, { color: player1.color }]}>{player1.name}</Text>
          <Swords size={20} color="#8B5CF6" />
          <Text style={[styles.playerHeader, { color: player2.color }]}>{player2.name}</Text>
        </View>

        <View style={styles.arena}>
          <Text style={styles.arenaHint}>En Hızlı Dokunan Çeker!</Text>
          <View style={styles.ropeTrack}>
            <View style={styles.centerMarker} />
            <View style={[styles.knotIndicator, { left: `${ropePosition}%` }]} />
          </View>
        </View>

        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[styles.pullBtn, { backgroundColor: player1.color }]}
            onPress={handlePullP1}
            activeOpacity={0.8}
          >
            <Text style={styles.pullText}>{player1.name.toUpperCase()} ÇEK!</Text>
          </TouchableOpacity>

          {isMulti && (
            <TouchableOpacity
              style={[styles.pullBtn, { backgroundColor: player2.color }]}
              onPress={handlePullP2}
              activeOpacity={0.8}
            >
              <Text style={styles.pullText}>{player2.name.toUpperCase()} ÇEK!</Text>
            </TouchableOpacity>
          )}
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
              <Trophy size={40} color="#8B5CF6" />
              <Text style={styles.modalTitle}>KAZANAN OYUNCU</Text>
              <Text style={styles.modalScore}>{winnerName.toUpperCase()}</Text>
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
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
  },
  playerHeader: { fontWeight: '900', fontSize: 14 },
  arena: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 2,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  arenaHint: { color: '#94A3B8', fontWeight: '800', fontSize: 13, marginBottom: 24 },
  ropeTrack: {
    width: '100%',
    height: 24,
    backgroundColor: '#020617',
    borderColor: '#334155',
    borderWidth: 2,
    borderRadius: 12,
    position: 'relative',
    justifyContent: 'center',
  },
  centerMarker: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#EF4444',
  },
  knotIndicator: {
    position: 'absolute',
    top: -6,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F59E0B',
    borderColor: '#F8FAFC',
    borderWidth: 3,
  },
  buttonsRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  pullBtn: {
    flex: 1,
    paddingVertical: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pullText: { color: '#020617', fontWeight: '900', fontSize: 16 },
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
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#F8FAFC', marginTop: 10 },
  modalScore: { fontSize: 24, fontWeight: '900', color: '#8B5CF6', marginVertical: 12 },
  restartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 10,
  },
  restartText: { color: '#020617', fontWeight: '900', fontSize: 14 },
});
