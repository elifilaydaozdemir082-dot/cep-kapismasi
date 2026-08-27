import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Trophy, RotateCcw } from 'lucide-react-native';
import { HeaderNav } from '../../components/HeaderNav';
import { ConfirmModal } from '../../components/ConfirmModal';

const TARGET_WORDS = ['KAPISMA', 'CEPOYUNU', 'REFLEKS', 'PENALTI'];

export default function MobileWordSearchScreen() {
  const router = useRouter();
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);

  const handleWordTap = (word: string) => {
    if (foundWords.includes(word)) return;
    const next = [...foundWords, word];
    setFoundWords(next);
    if (next.length === TARGET_WORDS.length) {
      setIsGameOver(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <HeaderNav title="Kelime Avı" onHomePress={() => setShowExitModal(true)} />

        <View style={styles.infoBar}>
          <View style={styles.infoPill}>
            <Search size={16} color="#14B8A6" />
            <Text style={styles.infoText}>Bulunan: {foundWords.length} / {TARGET_WORDS.length}</Text>
          </View>
        </View>

        <View style={styles.arena}>
          <Text style={styles.arenaTitle}>GİZLİ KELİMELERİ BUL</Text>
          <View style={styles.wordsList}>
            {TARGET_WORDS.map((w) => (
              <TouchableOpacity
                key={w}
                style={[styles.wordCard, foundWords.includes(w) && styles.foundCard]}
                onPress={() => handleWordTap(w)}
              >
                <Text style={[styles.wordText, foundWords.includes(w) && styles.foundText]}>
                  {w} {foundWords.includes(w) ? '✓' : ''}
                </Text>
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
              <Trophy size={40} color="#14B8A6" />
              <Text style={styles.modalTitle}>TÜM KELİMELER BULUNDU!</Text>
              <Text style={styles.modalScore}>{foundWords.length} KELİME</Text>
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
    borderColor: '#14B8A6',
    borderWidth: 2,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  arenaTitle: { color: '#14B8A6', fontWeight: '900', fontSize: 18 },
  wordsList: { gap: 10, width: '100%' },
  wordCard: {
    backgroundColor: '#020617',
    borderColor: '#14B8A6',
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  foundCard: { backgroundColor: '#14B8A6' },
  wordText: { color: '#14B8A6', fontWeight: '900', fontSize: 16 },
  foundText: { color: '#020617' },
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
  modalScore: { fontSize: 24, fontWeight: '900', color: '#14B8A6', marginVertical: 12 },
  restartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#14B8A6',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 10,
  },
  restartText: { color: '#020617', fontWeight: '900', fontSize: 14 },
});
