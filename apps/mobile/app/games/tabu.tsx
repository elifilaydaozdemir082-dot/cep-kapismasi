import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageSquare, Trophy, RotateCcw } from 'lucide-react-native';
import { HeaderNav } from '../../components/HeaderNav';
import { ConfirmModal } from '../../components/ConfirmModal';

const TABU_CARDS = [
  { target: 'GÜNEŞ', forbidden: ['Sarı', 'Sıcak', 'Yaz', 'Gökyüzü', 'Gündüz'] },
  { target: 'DENİZ', forbidden: ['Mavi', 'Su', 'Yüzmek', 'Balık', 'Plaj'] },
  { target: 'FUTBOL', forbidden: ['Top', 'Gol', 'Saha', 'Hakem', 'Takım'] },
  { target: 'BİLGİSAYAR', forbidden: ['Ekran', 'Klavye', 'İnternet', 'Yazılım', 'Fare'] },
];

export default function MobileTabuScreen() {
  const router = useRouter();
  const [cardIdx, setCardIdx] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);

  const currentCard = TABU_CARDS[cardIdx] || TABU_CARDS[0];

  const handleCorrect = () => {
    setScore((s) => s + 1);
    nextCard();
  };

  const handlePass = () => {
    nextCard();
  };

  const nextCard = () => {
    if (cardIdx < TABU_CARDS.length - 1) {
      setCardIdx((i) => i + 1);
    } else {
      setIsGameOver(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <HeaderNav title="Tabu" onHomePress={() => setShowExitModal(true)} />

        <View style={styles.infoBar}>
          <View style={styles.infoPill}>
            <MessageSquare size={16} color="#EC4899" />
            <Text style={styles.infoText}>Skor: {score}</Text>
          </View>
          <View style={styles.infoPill}>
            <Text style={styles.infoText}>Kart: {cardIdx + 1} / {TABU_CARDS.length}</Text>
          </View>
        </View>

        <View style={styles.cardContainer}>
          <Text style={styles.targetWord}>{currentCard.target}</Text>
          <View style={styles.divider} />
          <Text style={styles.forbiddenTitle}>YASAKLI KELİMELER</Text>
          {currentCard.forbidden.map((word, i) => (
            <Text key={i} style={styles.forbiddenWord}>• {word}</Text>
          ))}
        </View>

        <View style={styles.buttonsRow}>
          <TouchableOpacity style={styles.passBtn} onPress={handlePass}>
            <Text style={styles.passText}>PAS GEÇ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.correctBtn} onPress={handleCorrect}>
            <Text style={styles.correctText}>DOĞRU! (+1)</Text>
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
              <Trophy size={40} color="#EC4899" />
              <Text style={styles.modalTitle}>TABU TURU TAMAMLANDI!</Text>
              <Text style={styles.modalScore}>{score} DOĞRU KELİME</Text>
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
  cardContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderColor: '#EC4899',
    borderWidth: 2,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  targetWord: { fontSize: 32, fontWeight: '900', color: '#EC4899', marginBottom: 12 },
  divider: { width: '80%', height: 2, backgroundColor: '#334155', marginVertical: 12 },
  forbiddenTitle: { fontSize: 12, fontWeight: '900', color: '#94A3B8', marginBottom: 8, letterSpacing: 1 },
  forbiddenWord: { fontSize: 18, fontWeight: '700', color: '#F8FAFC', marginVertical: 4 },
  buttonsRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  passBtn: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderColor: '#94A3B8',
    borderWidth: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  passText: { color: '#94A3B8', fontWeight: '900', fontSize: 14 },
  correctBtn: {
    flex: 1,
    backgroundColor: '#EC4899',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  correctText: { color: '#020617', fontWeight: '900', fontSize: 14 },
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
  modalScore: { fontSize: 24, fontWeight: '900', color: '#EC4899', marginVertical: 12 },
  restartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EC4899',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 10,
  },
  restartText: { color: '#020617', fontWeight: '900', fontSize: 14 },
});
