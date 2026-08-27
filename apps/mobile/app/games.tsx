import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Zap, Car, Goal, Target, Brain, Bot, AlertCircle, Play } from 'lucide-react-native';
import { HeaderNav } from '../components/HeaderNav';

interface GameCardItem {
  id: string;
  title: string;
  desc: string;
  icon: any;
  color: string;
  isReady: boolean;
}

const GAME_CARDS: GameCardItem[] = [
  {
    id: 'target-hunt',
    title: 'Hedef Avı',
    desc: 'Ekranda beliren hedefleri yakala, seriyi koru!',
    icon: Zap,
    color: '#38BDF8',
    isReady: true,
  },
  {
    id: 'car-race',
    title: 'Mini Araba Yarışı',
    desc: 'Otoyolda engellerden kaç, yakın geçiş serisi yap!',
    icon: Car,
    color: '#F59E0B',
    isReady: false,
  },
  {
    id: 'penalty',
    title: 'Penaltı Yarışması',
    desc: 'Topa falso ver, kaleciyi avla!',
    icon: Goal,
    color: '#10B981',
    isReady: false,
  },
  {
    id: 'archery',
    title: 'Okçuluk',
    desc: 'Rüzgârı hesapla, tam 10 puanlık merkeze vur!',
    icon: Target,
    color: '#EF4444',
    isReady: false,
  },
  {
    id: 'memory',
    title: 'Hafıza Rotası',
    desc: 'Diziyi aklında tut ve tekrar et!',
    icon: Brain,
    color: '#8B5CF6',
    isReady: false,
  },
  {
    id: 'hangman',
    title: 'Kelimeyi Kurtar',
    desc: 'Gizli kelimeyi harf harf tahmin et!',
    icon: Bot,
    color: '#EC4899',
    isReady: false,
  },
];

export default function GamesScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const [preparingModalVisible, setPreparingModalVisible] = useState<boolean>(false);
  const [selectedGameTitle, setSelectedGameTitle] = useState<string>('');

  const handleGameSelect = (game: GameCardItem) => {
    if (game.isReady) {
      router.push(`/games/target-hunt?mode=${mode || 'single'}`);
    } else {
      setSelectedGameTitle(game.title);
      setPreparingModalVisible(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <HeaderNav title="Oyun Seçimi" />

        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
          <Text style={styles.sectionTitle}>
            {mode === 'multi' ? 'Çok Oyunculu Mod' : 'Tek Oyunculu Mod'}
          </Text>
          <Text style={styles.sectionSubtitle}>
            Oynamak istediğiniz oyunu seçin:
          </Text>

          <View style={styles.grid}>
            {GAME_CARDS.map((game) => {
              const IconComp = game.icon;
              return (
                <TouchableOpacity
                  key={game.id}
                  style={[styles.card, game.isReady && styles.readyCard]}
                  onPress={() => handleGameSelect(game)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardHeader}>
                    <View style={[styles.iconBox, { backgroundColor: `${game.color}20`, borderColor: game.color }]}>
                      <IconComp size={24} color={game.color} />
                    </View>
                    {!game.isReady && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>YAKINDA</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.cardTitle}>{game.title}</Text>
                  <Text style={styles.cardDesc}>{game.desc}</Text>

                  {game.isReady && (
                    <View style={styles.playRow}>
                      <Play size={14} color="#38BDF8" fill="#38BDF8" />
                      <Text style={styles.playText}>Hemen Oyna</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Preparing Game Modal */}
        <Modal visible={preparingModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalIconBox}>
                <AlertCircle size={32} color="#F59E0B" />
              </View>
              <Text style={styles.modalTitle}>{selectedGameTitle}</Text>
              <Text style={styles.modalMessage}>
                Bu oyun mobil sürüme hazırlanıyor.
              </Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setPreparingModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Tamam</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F8FAFC',
    marginTop: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 4,
    marginBottom: 16,
  },
  grid: {
    gap: 14,
  },
  card: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
  },
  readyCard: {
    borderColor: '#38BDF8',
    backgroundColor: '#0F172A',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '900',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    lineHeight: 16,
  },
  playRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  playText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  modalIconBox: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  modalMessage: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#38BDF8',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#020617',
    fontWeight: '900',
    fontSize: 14,
  },
});
