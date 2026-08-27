import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Target, Trophy, RotateCcw } from 'lucide-react-native';
import { HeaderNav } from '../../components/HeaderNav';
import { ConfirmModal } from '../../components/ConfirmModal';

export default function MobileBasketballScreen() {
  const router = useRouter();
  const [shotCount, setShotCount] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);

  const totalShots = 5;

  const handleShoot = (power: 'soft' | 'normal' | 'hard') => {
    if (isGameOver) return;
    const isBasket = power === 'normal' || Math.random() > 0.4;
    const pts = isBasket ? (power === 'normal' ? 3 : 2) : 0;

    if (pts > 0) {
      setScore((s) => s + pts);
      setFeedback(`🏀 BASKET! (+${pts} PUAN)`);
    } else {
      setFeedback('❌ KAÇTI!');
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
        <HeaderNav title="Basket Atışı" onHomePress={() => setShowExitModal(true)} />

        <View style={styles.infoBar}>
          <View style={styles.infoPill}>
            <Target size={16} color="#F97316" />
            <Text style={styles.infoText}>{score} Puan</Text>
          </View>
          <View style={styles.infoPill}>
            <Text style={styles.infoText}>Atış: {shotCount} / {totalShots}</Text>
          </View>
        </View>

        <View style={styles.arena}>
          {feedback && (
            <View style={styles.feedbackBox}>
              <Text style={styles.feedbackText}>{feedback}</Text>
            </View>
          )}

          <View style={styles.hoopBox}>
            <Text style={styles.hoopText}>🏀 POTA</Text>
          </View>
          <Text style={styles.instructionText}>Güç Ayarla ve Atış Yap!</Text>
        </View>

        <View style={styles.buttonsRow}>
          <TouchableOpacity style={styles.shootBtn} onPress={() => handleShoot('soft')}>
            <Text style={styles.shootText}>YAVAŞ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shootBtn} onPress={() => handleShoot('normal')}>
            <Text style={styles.shootText}>TAM İDEAL</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shootBtn} onPress={() => handleShoot('hard')}>
            <Text style={styles.shootText}>GÜÇLÜ</Text>
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
              <Trophy size={40} color="#F97316" />
              <Text style={styles.modalTitle}>BASKET MAÇI TAMAMLANDI!</Text>
              <Text style={styles.modalScore}>{score} PUAN</Text>
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
  arena: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 2,
    borderRadius: 24,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  feedbackBox: {
    backgroundColor: '#020617',
    borderColor: '#F97316',
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  feedbackText: { color: '#F97316', fontWeight: '900', fontSize: 16 },
  hoopBox: {
    width: 140,
    height: 100,
    borderColor: '#F8FAFC',
    borderWidth: 4,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#020617',
    marginTop: 20,
  },
  hoopText: { fontSize: 24, fontWeight: '900', color: '#F97316' },
  instructionText: { color: '#94A3B8', fontWeight: '700', fontSize: 13, marginTop: 'auto' },
  buttonsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  shootBtn: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderColor: '#F97316',
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  shootText: { color: '#F97316', fontWeight: '900', fontSize: 12 },
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
  modalScore: { fontSize: 26, fontWeight: '900', color: '#F97316', marginVertical: 12 },
  restartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F97316',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 10,
  },
  restartText: { color: '#020617', fontWeight: '900', fontSize: 14 },
});
