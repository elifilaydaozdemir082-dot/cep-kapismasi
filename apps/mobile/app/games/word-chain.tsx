import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, Trophy, RotateCcw } from 'lucide-react-native';
import { HeaderNav } from '../../components/HeaderNav';
import { ConfirmModal } from '../../components/ConfirmModal';

export default function MobileWordChainScreen() {
  const router = useRouter();
  const [chain, setChain] = useState<string[]>(['KAPISMA', 'ARABA', 'ANKARA']);
  const [score, setScore] = useState<number>(3);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);

  const lastWord = chain[chain.length - 1];
  const lastLetter = lastWord[lastWord.length - 1];

  const handleAddWord = () => {
    const mockWords = ['ARDIÇ', 'ÇİÇEK', 'KALEM', 'MASA', 'AYAK'];
    const nextWord = mockWords[Math.floor(Math.random() * mockWords.length)];
    const nextChain = [...chain, nextWord];
    setChain(nextChain);
    setScore(nextChain.length);
    if (nextChain.length >= 8) {
      setIsGameOver(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <HeaderNav title="Kelime Zinciri" onHomePress={() => setShowExitModal(true)} />

        <View style={styles.infoBar}>
          <View style={styles.infoPill}>
            <Link size={16} color="#6366F1" />
            <Text style={styles.infoText}>Zincir Uzunluğu: {score}</Text>
          </View>
        </View>

        <View style={styles.arena}>
          <Text style={styles.lastWordLabel}>SON KELİME: {lastWord}</Text>
          <Text style={styles.targetLetter}>BAŞLAYACAK HARF: "{lastLetter}"</Text>
          <TouchableOpacity style={styles.addBtn} onPress={handleAddWord}>
            <Text style={styles.addText}>YENİ KELİME EKLE ✓</Text>
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
              <Trophy size={40} color="#6366F1" />
              <Text style={styles.modalTitle}>ZİNCİR REKORU!</Text>
              <Text style={styles.modalScore}>{score} KELİMELİK ZİNCİR</Text>
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
    borderColor: '#6366F1',
    borderWidth: 2,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 20,
  },
  lastWordLabel: { fontSize: 24, fontWeight: '900', color: '#6366F1' },
  targetLetter: { fontSize: 20, fontWeight: '800', color: '#F8FAFC' },
  addBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 18,
  },
  addText: { color: '#020617', fontWeight: '900', fontSize: 15 },
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
  modalScore: { fontSize: 24, fontWeight: '900', color: '#6366F1', marginVertical: 12 },
  restartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 10,
  },
  restartText: { color: '#020617', fontWeight: '900', fontSize: 14 },
});
