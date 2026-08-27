import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HelpCircle, Trophy, RotateCcw } from 'lucide-react-native';
import { HeaderNav } from '../../components/HeaderNav';
import { ConfirmModal } from '../../components/ConfirmModal';

const TARGET_WORD = 'TÜRKIYE';
const ALPHABET = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ'.split('');

export default function MobileHangmanScreen() {
  const router = useRouter();
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [lives, setLives] = useState<number>(6);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isWon, setIsWon] = useState<boolean>(false);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);

  const handleGuess = (letter: string) => {
    if (guessedLetters.includes(letter) || isGameOver) return;
    const nextGuessed = [...guessedLetters, letter];
    setGuessedLetters(nextGuessed);

    if (!TARGET_WORD.includes(letter)) {
      const nextLives = lives - 1;
      setLives(nextLives);
      if (nextLives <= 0) {
        setIsGameOver(true);
      }
    } else {
      const allGuessed = TARGET_WORD.split('').every((char) => nextGuessed.includes(char));
      if (allGuessed) {
        setIsWon(true);
        setIsGameOver(true);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <HeaderNav title="Kelimeyi Kurtar" onHomePress={() => setShowExitModal(true)} />

        <View style={styles.infoBar}>
          <View style={styles.infoPill}>
            <HelpCircle size={16} color="#A855F7" />
            <Text style={styles.infoText}>Kalan Can: {'❤️'.repeat(lives)}</Text>
          </View>
        </View>

        <View style={styles.wordArena}>
          <View style={styles.wordRow}>
            {TARGET_WORD.split('').map((char, idx) => (
              <Text key={idx} style={styles.letterBox}>
                {guessedLetters.includes(char) ? char : '_'}
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.keyboardGrid}>
          {ALPHABET.map((char) => (
            <TouchableOpacity
              key={char}
              style={[
                styles.keyBtn,
                guessedLetters.includes(char) && styles.disabledKey,
              ]}
              onPress={() => handleGuess(char)}
              disabled={guessedLetters.includes(char)}
            >
              <Text style={styles.keyText}>{char}</Text>
            </TouchableOpacity>
          ))}
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
              <Trophy size={40} color="#A855F7" />
              <Text style={styles.modalTitle}>{isWon ? 'TEBRİKLER KAZANDIN!' : 'MAALESEF BİTTİ'}</Text>
              <Text style={styles.modalScore}>KELİME: {TARGET_WORD}</Text>
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
  wordArena: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderColor: '#A855F7',
    borderWidth: 2,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  wordRow: { flexDirection: 'row', gap: 8 },
  letterBox: { fontSize: 28, fontWeight: '900', color: '#A855F7' },
  keyboardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 12 },
  keyBtn: {
    width: 38,
    height: 38,
    backgroundColor: '#0F172A',
    borderColor: '#A855F7',
    borderWidth: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledKey: { opacity: 0.3 },
  keyText: { color: '#F8FAFC', fontWeight: '900', fontSize: 13 },
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
  modalScore: { fontSize: 24, fontWeight: '900', color: '#A855F7', marginVertical: 12 },
  restartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#A855F7',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 10,
  },
  restartText: { color: '#020617', fontWeight: '900', fontSize: 14 },
});
