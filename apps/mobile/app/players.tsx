import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, Check, Play } from 'lucide-react-native';
import { HeaderNav } from '../components/HeaderNav';
import { mobileStorageService, MobilePlayer } from '../services/storage';

const COLOR_OPTIONS = ['#06B6D4', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

export default function PlayersScreen() {
  const router = useRouter();
  const [players, setPlayers] = useState<MobilePlayer[]>([
    { id: 'p1', name: 'Oyuncu 1', color: '#06B6D4' },
    { id: 'p2', name: 'Oyuncu 2', color: '#EF4444' },
  ]);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    const loaded = await mobileStorageService.getPlayers();
    setPlayers(loaded);
  };

  const updatePlayerName = (id: string, name: string) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name: name } : p))
    );
  };

  const updatePlayerColor = (id: string, color: string) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, color: color } : p))
    );
  };

  const handleStartGame = async () => {
    await mobileStorageService.savePlayers(players);
    router.push('/games?mode=multi');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <HeaderNav title="Oyuncu Ayarları" />

        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <Users size={22} color="#38BDF8" />
              <Text style={styles.cardTitle}>Oyuncuları Düzenleyin</Text>
            </View>

            {players.map((p, idx) => (
              <View key={p.id} style={styles.playerCard}>
                <Text style={[styles.playerLabel, { color: p.color }]}>
                  {idx + 1}. Oyuncu
                </Text>

                <TextInput
                  value={p.name}
                  onChangeText={(text) => updatePlayerName(p.id, text)}
                  style={styles.input}
                  placeholder="Oyuncu Adı"
                  placeholderTextColor="#64748B"
                  maxLength={14}
                />

                <View style={styles.colorRow}>
                  {COLOR_OPTIONS.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: c },
                        p.color === c && styles.selectedColor,
                      ]}
                      onPress={() => updatePlayerColor(p.id, c)}
                    >
                      {p.color === c && <Check size={14} color="#020617" />}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.startButton} onPress={handleStartGame}>
              <Play size={20} color="#020617" fill="#020617" />
              <Text style={styles.startButtonText}>Oyun Seçimine Geç</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  card: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    marginTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  playerCard: {
    backgroundColor: '#020617',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  playerLabel: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 12,
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedColor: {
    borderWidth: 2,
    borderColor: '#F8FAFC',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#38BDF8',
    paddingVertical: 16,
    borderRadius: 18,
    marginTop: 12,
  },
  startButtonText: {
    color: '#020617',
    fontWeight: '900',
    fontSize: 16,
  },
});
