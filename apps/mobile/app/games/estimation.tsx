import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Target, Trophy, RotateCcw } from 'lucide-react-native';
import { HeaderNav } from '../../components/HeaderNav';
import { ConfirmModal } from '../../components/ConfirmModal';

const ESTIMATION_QUESTIONS = [
  { question: 'Türkiye\'nin yüzölçümü kaç bin km²\'dir?', answer: '783.562 km²' },
  { question: 'Dünya ile Ay arasındaki ortalama mesafe kaç bin km\'dir?', answer: '384.400 km' },
];

export default function MobileEstimationScreen() {
  const router = useRouter();
  const [qIdx, setQIdx] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);

  const currentQ = ESTIMATION_QUESTIONS[qIdx] || ESTIMATION_QUESTIONS[0];

  const handleEstimate = () => {
    setScore((s) => s + 50);
    if (qIdx < ESTIMATION_QUESTIONS.length - 1) {
      setQIdx((i) => i + 1);
    } else {
      setIsGameOver(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <HeaderNav title="Hangisi Daha Yakın?" onHomePress={() => setShowExitModal(true)} />

        <View style={styles.infoBar}>
          <View style={styles.infoPill}>
            <Target size={16} color="#38BDF8" />
            <Text style={styles.infoText}>Skor: {score}</Text>
          </View>
          <View style={styles.infoPill}>
            <Text style={styles.infoText}>Soru: {qIdx + 1} / {ESTIMATION_QUESTIONS.length}</Text>
          </View>
        </View>

        <View style={styles.arena}>
          <Text style={styles.questionText}>{currentQ.question}</Text>
          <TouchableOpacity style={styles.estimateBtn} onPress={handleEstimate}>
            <Text style={styles.estimateText}>TAHMİNİ GÖNDER (Gerçek: {currentQ.answer})</Text>
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
              <Text style={styles.modalTitle}>TAHMİN YARIŞMASI TAMAMLANDI!</Text>
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
    borderColor: '#38BDF8',
    borderWidth: 2,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 24,
  },
  questionText: { fontSize: 22, fontWeight: '900', color: '#F8FAFC', textAlign: 'center' },
  estimateBtn: {
    backgroundColor: '#38BDF8',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 18,
  },
  estimateText: { color: '#020617', fontWeight: '900', fontSize: 14, textAlign: 'center' },
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
