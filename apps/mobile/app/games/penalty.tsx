import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Goal, Trophy, RotateCcw } from 'lucide-react-native';
import { HeaderNav } from '../../components/HeaderNav';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useGameSession } from '../../context/GameSessionContext';

export default function MobilePenaltyScreen() {
  const router = useRouter();
  const { session } = useGameSession();
  const player = session.players[0] || { name: 'Oyuncu 1' };

  const [shotCount, setShotCount] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);

  const totalShots = 5;

  const handleShoot = (targetTarget: 'left' | 'center' | 'right') => {
    if (isGameOver) return;

    const goalkeeperDive = ['left', 'center', 'right'][Math.floor(Math.random() * 3)];

    if (targetTarget !== goalkeeperDive) {
      setScore((s) => s + 1);
      setFeedback('⚽ GOL!');
    } else {
      setFeedback('🧤 KALECİ KURTARDI!');
    }

    setTimeout(() => {
      setFeedback(null);
      if (shotCount < totalShots) {
        setShotCount((s) => s + 1);
      } else {
        setIsGameOver(true);
      }
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <HeaderNav title="Penaltı Yarışması" onHomePress={() => setShowExitModal(true)} />

        {/* Top Info Bar */}
        <View style={styles.infoBar}>
          <View style={styles.infoPill}>
            <Goal size={16} color="#10B981" />
            <Text style={styles.infoText}>{score} Gol</Text>
          </View>
          <View style={styles.infoPill}>
            <Text style={styles.infoText}>Atış: {shotCount} / {totalShots}</Text>
          </View>
        </View>

        {/* Goal Arena */}
        <View style={styles.goalArena}>
          {feedback && (
            <View style={styles.feedbackBox}>
              <Text style={styles.feedbackText}>{feedback}</Text>
            </View>
          )}

          <View style={styles.goalMouth}>
            <Text style={styles.keeperText}>🧤 KALECİ</Text>
          </View>

          <Text style={styles.instructionText}>Köşeyi Seç ve Şut Çek!</Text>
        </View>

        {/* Target Buttons */}
        <View style={styles.buttonsRow}>
          <TouchableOpacity style={styles.shootBtn} onPress={() => handleShoot('left')}>
            <Text style={styles.shootText}>SOL KÖŞE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shootBtn} onPress={() => handleShoot('center')}>
            <Text style={styles.shootText}>ORTA</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shootBtn} onPress={() => handleShoot('right')}>
            <Text style={styles.shootText}>SAĞ KÖŞE</Text>
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
              <Trophy size={40} color="#10B981" />
              <Text style={styles.modalTitle}>MAÇ TAMAMLANDI!</Text>
              <Text style={styles.modalScore}>{score} GOL / {totalShots} ATIŞ</Text>
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
  goalArena: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 2,
    borderRadius: 24,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    position: 'relative',
  },
  feedbackBox: {
    backgroundColor: '#020617',
    borderColor: '#10B981',
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 10,
  },
  feedbackText: { color: '#10B981', fontWeight: '900', fontSize: 16 },
  goalMouth: {
    width: '100%',
    height: 120,
    borderColor: '#F8FAFC',
    borderWidth: 4,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#020617',
  },
  keeperText: { fontSize: 24, fontWeight: '900', color: '#F59E0B' },
  instructionText: { color: '#94A3B8', fontWeight: '700', fontSize: 13, marginTop: 'auto' },
  buttonsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  shootBtn: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderColor: '#10B981',
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  shootText: { color: '#10B981', fontWeight: '900', fontSize: 12 },
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
  modalScore: { fontSize: 24, fontWeight: '900', color: '#10B981', marginVertical: 12 },
  restartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 10,
  },
  restartText: { color: '#020617', fontWeight: '900', fontSize: 14 },
});
