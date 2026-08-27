import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Crosshair, Trophy, RotateCcw } from 'lucide-react-native';
import { HeaderNav } from '../../components/HeaderNav';
import { ConfirmModal } from '../../components/ConfirmModal';

export default function MobileArcheryScreen() {
  const router = useRouter();
  const [shotCount, setShotCount] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);

  const totalShots = 5;

  const handleShoot = (power: number) => {
    if (isGameOver) return;
    let pts = 0;

    if (power >= 80 && power <= 90) {
      pts = 10;
      setFeedback('🎯 TAM 10 PUAN!');
    } else if (power >= 60 && power <= 95) {
      pts = 7;
      setFeedback('🎯 7 PUAN!');
    } else if (power >= 40) {
      pts = 3;
      setFeedback('⚫ 3 PUAN!');
    } else {
      pts = 0;
      setFeedback('❌ KARAVANA!');
    }

    setScore((s) => s + pts);

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
        <HeaderNav title="Okçuluk" onHomePress={() => setShowExitModal(true)} />

        <View style={styles.infoBar}>
          <View style={styles.infoPill}>
            <Crosshair size={16} color="#EF4444" />
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

          <View style={styles.targetRing}>
            <View style={styles.targetRingInner}>
              <Text style={styles.centerText}>10</Text>
            </View>
          </View>
          <Text style={styles.instructionText}>Yayı Germek İçin Güç Seçin!</Text>
        </View>

        <View style={styles.buttonsRow}>
          <TouchableOpacity style={styles.shootBtn} onPress={() => handleShoot(45)}>
            <Text style={styles.shootText}>%45 DÜŞÜK</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shootBtn} onPress={() => handleShoot(85)}>
            <Text style={styles.shootText}>%85 OPTİMAL</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shootBtn} onPress={() => handleShoot(100)}>
            <Text style={styles.shootText}>%100 MAKS</Text>
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
              <Trophy size={40} color="#EF4444" />
              <Text style={styles.modalTitle}>OKÇULUK ATISI TAMAMLANDI!</Text>
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
    borderColor: '#EF4444',
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  feedbackText: { color: '#EF4444', fontWeight: '900', fontSize: 16 },
  targetRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderColor: '#EF4444',
    borderWidth: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    marginTop: 20,
  },
  targetRingInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerText: { fontSize: 18, fontWeight: '900', color: '#020617' },
  instructionText: { color: '#94A3B8', fontWeight: '700', fontSize: 13, marginTop: 'auto' },
  buttonsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  shootBtn: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderColor: '#EF4444',
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  shootText: { color: '#EF4444', fontWeight: '900', fontSize: 12 },
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
  modalScore: { fontSize: 26, fontWeight: '900', color: '#EF4444', marginVertical: 12 },
  restartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 10,
  },
  restartText: { color: '#020617', fontWeight: '900', fontSize: 14 },
});
