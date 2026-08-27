import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Activity, Zap, Trophy, RotateCcw } from 'lucide-react-native';
import { HeaderNav } from '../../components/HeaderNav';
import { ConfirmModal } from '../../components/ConfirmModal';

export default function MobileReflexScreen() {
  const router = useRouter();
  const [roundState, setRoundState] = useState<'ready' | 'go' | 'foul' | 'end'>('ready');
  const [statusMessage, setStatusMessage] = useState<string>('BEKLEYİN...');
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [bestReactionMs, setBestReactionMs] = useState<number | null>(null);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);

  const totalRounds = 5;
  const goStartTimeRef = useRef<number>(0);
  const goTimeoutRef = useRef<any>(null);
  const reactionTimesRef = useRef<number[]>([]);

  useEffect(() => {
    startRound();
    return () => {
      if (goTimeoutRef.current) clearTimeout(goTimeoutRef.current);
    };
  }, [currentRound]);

  const startRound = () => {
    setRoundState('ready');
    setStatusMessage('BEKLEYİN...');
    const randomDelay = 2000 + Math.random() * 3000;
    goTimeoutRef.current = setTimeout(() => {
      setRoundState('go');
      setStatusMessage('ŞİMDİ DOKUN!');
      goStartTimeRef.current = Date.now();
    }, randomDelay);
  };

  const handleTap = () => {
    if (isGameOver || roundState === 'end' || roundState === 'foul') return;

    if (roundState === 'ready') {
      if (goTimeoutRef.current) clearTimeout(goTimeoutRef.current);
      setRoundState('foul');
      setStatusMessage('ERKEN DOKUNUŞ! (FAUL)');
      setTimeout(() => advanceRound(), 1400);
      return;
    }

    if (roundState === 'go') {
      const reaction = Date.now() - goStartTimeRef.current;
      reactionTimesRef.current.push(reaction);
      const minMs = Math.min(...reactionTimesRef.current);
      setBestReactionMs(minMs);
      setRoundState('end');
      setStatusMessage(`${reaction} ms! (En İyi: ${minMs} ms)`);
      setTimeout(() => advanceRound(), 1500);
    }
  };

  const advanceRound = () => {
    if (currentRound < totalRounds) {
      setCurrentRound((r) => r + 1);
    } else {
      setIsGameOver(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <HeaderNav title="Refleks Düellosu" onHomePress={() => setShowExitModal(true)} />

        <View style={styles.infoBar}>
          <View style={styles.infoPill}>
            <Activity size={16} color="#06B6D4" />
            <Text style={styles.infoText}>En Hızlı: {bestReactionMs ? `${bestReactionMs} ms` : '-'}</Text>
          </View>
          <View style={styles.infoPill}>
            <Text style={styles.infoText}>Raund: {currentRound} / {totalRounds}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.arena,
            roundState === 'go' && styles.goArena,
            roundState === 'foul' && styles.foulArena,
          ]}
          onPress={handleTap}
          activeOpacity={0.9}
        >
          <Zap size={48} color={roundState === 'go' ? '#020617' : '#06B6D4'} />
          <Text style={[styles.statusTitle, roundState === 'go' && styles.goText]}>
            {statusMessage}
          </Text>
        </TouchableOpacity>

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
              <Text style={styles.modalTitle}>DÜELLO TAMAMLANDI!</Text>
              <Text style={styles.modalScore}>EN HIZLI: {bestReactionMs || 500} MS</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  goArena: { backgroundColor: '#10B981', borderColor: '#34D399' },
  foulArena: { backgroundColor: '#991B1B', borderColor: '#EF4444' },
  statusTitle: { fontSize: 24, fontWeight: '900', color: '#F8FAFC', textAlign: 'center' },
  goText: { color: '#020617' },
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
