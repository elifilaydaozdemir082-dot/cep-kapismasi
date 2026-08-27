import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Brain, Trophy, RotateCcw } from 'lucide-react-native';
import { HeaderNav } from '../../components/HeaderNav';
import { ConfirmModal } from '../../components/ConfirmModal';

export default function MobileMemoryScreen() {
  const router = useRouter();
  const [level, setLevel] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);

  const handleTapPad = () => {
    if (isGameOver) return;
    const isCorrect = Math.random() > 0.15;
    if (isCorrect) {
      setScore((s) => s + 10);
      setLevel((l) => l + 1);
    } else {
      setIsGameOver(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <HeaderNav title="Hafıza Rotası" onHomePress={() => setShowExitModal(true)} />

        <View style={styles.infoBar}>
          <View style={styles.infoPill}>
            <Brain size={16} color="#8B5CF6" />
            <Text style={styles.infoText}>Seviye: {level}</Text>
          </View>
          <View style={styles.infoPill}>
            <Text style={styles.infoText}>Skor: {score}</Text>
          </View>
        </View>

        <View style={styles.arena}>
          <View style={styles.padsGrid}>
            <TouchableOpacity style={[styles.pad, { backgroundColor: '#EF4444' }]} onPress={handleTapPad} />
            <TouchableOpacity style={[styles.pad, { backgroundColor: '#38BDF8' }]} onPress={handleTapPad} />
            <TouchableOpacity style={[styles.pad, { backgroundColor: '#F59E0B' }]} onPress={handleTapPad} />
            <TouchableOpacity style={[styles.pad, { backgroundColor: '#10B981' }]} onPress={handleTapPad} />
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
              <Trophy size={40} color="#8B5CF6" />
              <Text style={styles.modalTitle}>HAFIZA OYUNU BİTTİ!</Text>
              <Text style={styles.modalScore}>SEVİYE {level} ({score} PUAN)</Text>
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
    borderColor: '#8B5CF6',
    borderWidth: 2,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  padsGrid: {
    width: 240,
    height: 240,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pad: {
    width: 100,
    height: 100,
    borderRadius: 24,
  },
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
