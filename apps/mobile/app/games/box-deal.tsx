import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gift, Trophy, RotateCcw } from 'lucide-react-native';
import { HeaderNav } from '../../components/HeaderNav';
import { ConfirmModal } from '../../components/ConfirmModal';

const INITIAL_BOXES = [
  { id: 1, amount: 100, opened: false },
  { id: 2, amount: 500, opened: false },
  { id: 3, amount: 1000, opened: false },
  { id: 4, amount: 5000, opened: false },
  { id: 5, amount: 25000, opened: false },
  { id: 6, amount: 100000, opened: false },
];

export default function MobileBoxDealScreen() {
  const router = useRouter();
  const [boxes, setBoxes] = useState(INITIAL_BOXES);
  const [chosenAmount, setChosenAmount] = useState<number | null>(null);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);

  const handleOpenBox = (id: number) => {
    if (isGameOver) return;
    const targetBox = boxes.find((b) => b.id === id);
    if (!targetBox || targetBox.opened) return;

    setBoxes((prev) => prev.map((b) => (b.id === id ? { ...b, opened: true } : b)));
    const remaining = boxes.filter((b) => !b.opened && b.id !== id);

    if (remaining.length <= 1) {
      const finalVal = remaining[0]?.amount || targetBox.amount;
      setChosenAmount(finalVal);
      setIsGameOver(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <HeaderNav title="Kutunu Seç" onHomePress={() => setShowExitModal(true)} />

        <View style={styles.infoBar}>
          <View style={styles.infoPill}>
            <Gift size={16} color="#F59E0B" />
            <Text style={styles.infoText}>Kutuları Aç!</Text>
          </View>
        </View>

        <View style={styles.arena}>
          <View style={styles.boxesGrid}>
            {boxes.map((box) => (
              <TouchableOpacity
                key={box.id}
                style={[styles.boxCard, box.opened && styles.openedBox]}
                onPress={() => handleOpenBox(box.id)}
                disabled={box.opened}
              >
                <Text style={styles.boxNumber}>KUTU {box.id}</Text>
                {box.opened && <Text style={styles.boxAmount}>{box.amount} ₺</Text>}
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
              <Trophy size={40} color="#F59E0B" />
              <Text style={styles.modalTitle}>TEBRİKLER İKRAMİYE!</Text>
              <Text style={styles.modalScore}>{chosenAmount || 50000} ₺</Text>
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
    borderColor: '#F59E0B',
    borderWidth: 2,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  boxesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  boxCard: {
    width: 100,
    height: 100,
    backgroundColor: '#020617',
    borderColor: '#F59E0B',
    borderWidth: 2,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  openedBox: { backgroundColor: '#1E293B', opacity: 0.6 },
  boxNumber: { color: '#F59E0B', fontWeight: '900', fontSize: 14 },
  boxAmount: { color: '#10B981', fontWeight: '900', fontSize: 12, marginTop: 4 },
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
  modalScore: { fontSize: 28, fontWeight: '900', color: '#F59E0B', marginVertical: 12 },
  restartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 10,
  },
  restartText: { color: '#020617', fontWeight: '900', fontSize: 14 },
});
