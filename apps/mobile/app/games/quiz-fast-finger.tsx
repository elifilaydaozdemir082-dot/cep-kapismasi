import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Zap, Trophy, RotateCcw } from 'lucide-react-native';
import { HeaderNav } from '../../components/HeaderNav';
import { ConfirmModal } from '../../components/ConfirmModal';

const FAST_QUESTIONS = [
  { question: '5 x 8 Kaç Eder?', options: ['35', '40', '45', '50'], correct: 1 },
  { question: 'En Büyük Okyanus Hangisidir?', options: ['Atlas', 'Büyük (Pasifik)', 'Hint', 'Kutup'], correct: 1 },
];

export default function MobileQuizFastFingerScreen() {
  const router = useRouter();
  const [qIdx, setQIdx] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);

  const currentQ = FAST_QUESTIONS[qIdx] || FAST_QUESTIONS[0];

  const handleAnswer = (optionIdx: number) => {
    if (isGameOver) return;
    if (optionIdx === currentQ.correct) {
      setScore((s) => s + 15);
    }
    if (qIdx < FAST_QUESTIONS.length - 1) {
      setQIdx((i) => i + 1);
    } else {
      setIsGameOver(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <HeaderNav title="Hızlı Parmak" onHomePress={() => setShowExitModal(true)} />

        <View style={styles.infoBar}>
          <View style={styles.infoPill}>
            <Zap size={16} color="#06B6D4" />
            <Text style={styles.infoText}>Skor: {score}</Text>
          </View>
          <View style={styles.infoPill}>
            <Text style={styles.infoText}>Soru: {qIdx + 1} / {FAST_QUESTIONS.length}</Text>
          </View>
        </View>

        <View style={styles.arena}>
          <Text style={styles.questionText}>{currentQ.question}</Text>

          <View style={styles.optionsList}>
            {currentQ.options.map((opt, i) => (
              <TouchableOpacity key={i} style={styles.optionBtn} onPress={() => handleAnswer(i)}>
                <Text style={styles.optionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
              <Trophy size={40} color="#06B6D4" />
              <Text style={styles.modalTitle}>HIZLI PARMAK TAMAMLANDI!</Text>
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
    borderColor: '#06B6D4',
    borderWidth: 2,
    borderRadius: 24,
    justifyContent: 'center',
    padding: 20,
    gap: 20,
  },
  questionText: { fontSize: 22, fontWeight: '900', color: '#F8FAFC', textAlign: 'center' },
  optionsList: { gap: 10 },
  optionBtn: {
    backgroundColor: '#020617',
    borderColor: '#06B6D4',
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  optionText: { color: '#06B6D4', fontWeight: '900', fontSize: 15 },
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
  modalScore: { fontSize: 24, fontWeight: '900', color: '#06B6D4', marginVertical: 12 },
  restartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#06B6D4',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 10,
  },
  restartText: { color: '#020617', fontWeight: '900', fontSize: 14 },
});
