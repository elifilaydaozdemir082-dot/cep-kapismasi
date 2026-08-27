import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flame, Trophy, RotateCcw } from 'lucide-react-native';
import { HeaderNav } from '../../components/HeaderNav';
import { ConfirmModal } from '../../components/ConfirmModal';

const PROMPTS = [
  'A harfi ile başlayan meyveler',
  'Avrupa ülkeleri',
  'Ayak sporu terimleri',
  'Soğuk yenilen tatlılar',
];

export default function MobilePassTheBombScreen() {
  const router = useRouter();
  const [promptIdx, setPromptIdx] = useState<number>(0);
  const [passedCount, setPassedCount] = useState<number>(0);
  const [isExploded, setIsExploded] = useState<boolean>(false);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);

  const currentPrompt = PROMPTS[promptIdx] || PROMPTS[0];

  useEffect(() => {
    if (isExploded) return;
    const bombTime = 15000 + Math.random() * 15000;
    const timer = setTimeout(() => {
      setIsExploded(true);
    }, bombTime);

    return () => clearTimeout(timer);
  }, [promptIdx, isExploded]);

  const handlePass = () => {
    if (isExploded) return;
    setPassedCount((c) => c + 1);
    setPromptIdx((i) => (i + 1) % PROMPTS.length);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <HeaderNav title="Bomba Kimde?" onHomePress={() => setShowExitModal(true)} />

        <View style={styles.infoBar}>
          <View style={styles.infoPill}>
            <Flame size={16} color="#EF4444" />
            <Text style={styles.infoText}>Bomba Pası: {passedCount}</Text>
          </View>
        </View>

        <View style={styles.arena}>
          <Flame size={72} color="#EF4444" />
          <Text style={styles.promptText}>{currentPrompt}</Text>
          <Text style={styles.hintText}>Söyle ve Hemen Telefonu Devret!</Text>
        </View>

        <TouchableOpacity style={styles.passBtn} onPress={handlePass}>
          <Text style={styles.passText}>CEVAPLANDI - BOMBUYI DEVRET! 💣</Text>
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

        <Modal visible={isExploded} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Trophy size={40} color="#EF4444" />
              <Text style={styles.modalTitle}>BOOM! BOMBA PATLADI 💥</Text>
              <Text style={styles.modalScore}>{passedCount} BAŞARILI DEVİR</Text>
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
    borderColor: '#EF4444',
    borderWidth: 2,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 20,
  },
  promptText: { fontSize: 24, fontWeight: '900', color: '#F8FAFC', textAlign: 'center' },
  hintText: { fontSize: 14, fontWeight: '700', color: '#EF4444' },
  passBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 12,
  },
  passText: { color: '#020617', fontWeight: '900', fontSize: 15 },
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
  modalScore: { fontSize: 24, fontWeight: '900', color: '#EF4444', marginVertical: 12 },
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
