import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Disc, Trophy, RotateCcw } from 'lucide-react-native';
import { HeaderNav } from '../../components/HeaderNav';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useGameSession } from '../../context/GameSessionContext';

export default function MobileAirHockeyScreen() {
  const router = useRouter();
  const { session } = useGameSession();
  const isMulti = session.mode === 'multiplayer';

  const [p1Score, setP1Score] = useState<number>(0);
  const [p2Score, setP2Score] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [winnerName, setWinnerName] = useState<string>('');
  const [showExitModal, setShowExitModal] = useState<boolean>(false);

  const player1 = session.players[0] || { name: 'Oyuncu 1', color: '#06B6D4' };
  const player2 = session.players[1] || { name: isMulti ? 'Oyuncu 2' : 'Bot Rakip', color: '#F59E0B' };

  const handleShootGoal = (scorer: 'p1' | 'p2') => {
    if (isGameOver) return;
    if (scorer === 'p1') {
      const next = p1Score + 1;
      setP1Score(next);
      if (next >= 5) {
        setWinnerName(player1.name);
        setIsGameOver(true);
      }
    } else {
      const next = p2Score + 1;
      setP2Score(next);
      if (next >= 5) {
        setWinnerName(player2.name);
        setIsGameOver(true);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <HeaderNav title="Hava Hokeyi" onHomePress={() => setShowExitModal(true)} />

        <View style={styles.infoBar}>
          <Text style={[styles.playerHeader, { color: player1.color }]}>{player1.name}: {p1Score}</Text>
          <Disc size={20} color="#38BDF8" />
          <Text style={[styles.playerHeader, { color: player2.color }]}>{player2.name}: {p2Score}</Text>
        </View>

        <View style={styles.tableArena}>
          <View style={styles.goalMouthTop}>
            <Text style={styles.goalText}>{player2.name} KALESİ</Text>
          </View>

          <View style={styles.centerLine} />

          <View style={styles.goalMouthBottom}>
            <Text style={styles.goalText}>{player1.name} KALESİ</Text>
          </View>
        </View>

        <View style={styles.buttonsRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: player1.color }]} onPress={() => handleShootGoal('p1')}>
            <Text style={styles.actionText}>{player1.name.toUpperCase()} GOL AT!</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: player2.color }]} onPress={() => handleShootGoal('p2')}>
            <Text style={styles.actionText}>{player2.name.toUpperCase()} GOL AT!</Text>
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
              <Trophy size={40} color="#38BDF8" />
              <Text style={styles.modalTitle}>HOKEY ŞAMPİYONU!</Text>
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
  tableArena: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderColor: '#38BDF8',
    borderWidth: 3,
    borderRadius: 24,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    position: 'relative',
  },
  goalMouthTop: {
    width: '60%',
    height: 40,
    backgroundColor: 'rgba(239,68,68,0.2)',
    borderColor: '#EF4444',
    borderWidth: 2,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalMouthBottom: {
    width: '60%',
    height: 40,
    backgroundColor: 'rgba(56,189,248,0.2)',
    borderColor: '#38BDF8',
    borderWidth: 2,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalText: { color: '#F8FAFC', fontWeight: '900', fontSize: 11 },
  centerLine: {
    width: '100%',
    height: 2,
    backgroundColor: '#38BDF8',
    opacity: 0.5,
  },
  buttonsRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  actionBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  actionText: { color: '#020617', fontWeight: '900', fontSize: 12 },
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
  modalScore: { fontSize: 24, fontWeight: '900', color: '#38BDF8', marginVertical: 12 },
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
