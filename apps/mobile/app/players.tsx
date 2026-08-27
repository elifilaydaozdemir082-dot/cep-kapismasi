import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, User, Check, Play } from 'lucide-react-native';
import { HeaderNav } from '../components/HeaderNav';
import { useGameSession } from '../context/GameSessionContext';
import { MobilePlayer } from '../services/storage';

const COLOR_PALETTE = ['#38BDF8', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

export default function PlayersScreen() {
  const router = useRouter();
  const { session, setPlayers } = useGameSession();

  const mode = session.mode || 'single';
  const isSingle = mode === 'single';

  const [playerCount, setPlayerCount] = useState<number>(
    isSingle ? 1 : Math.max(2, session.players.length || 2)
  );

  const [playersList, setPlayersList] = useState<MobilePlayer[]>([]);

  useEffect(() => {
    if (!session.mode) {
      // Safe fallback redirect if opened without session
      router.replace('/');
      return;
    }

    if (isSingle) {
      const p1 = session.players[0] || { id: 'p1', name: 'Oyuncu 1', color: COLOR_PALETTE[0] };
      setPlayersList([{ ...p1, id: 'p1' }]);
    } else {
      const count = Math.max(2, Math.min(4, session.players.length || 2));
      setPlayerCount(count);

      const list: MobilePlayer[] = [];
      for (let i = 0; i < count; i++) {
        if (session.players[i]) {
          list.push({ ...session.players[i] });
        } else {
          list.push({
            id: `p${i + 1}`,
            name: `${i + 1}. Oyuncu`,
            color: COLOR_PALETTE[i % COLOR_PALETTE.length],
          });
        }
      }
      setPlayersList(list);
    }
  }, [session.mode]);

  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(count);
    setPlayersList((prev) => {
      const newList: MobilePlayer[] = [];
      for (let i = 0; i < count; i++) {
        if (prev[i]) {
          newList.push(prev[i]);
        } else {
          newList.push({
            id: `p${i + 1}`,
            name: `${i + 1}. Oyuncu`,
            color: COLOR_PALETTE[i % COLOR_PALETTE.length],
          });
        }
      }
      return newList;
    });
  };

  const updatePlayerName = (id: string, name: string) => {
    setPlayersList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name } : p))
    );
  };

  const updatePlayerColor = (id: string, color: string) => {
    setPlayersList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, color } : p))
    );
  };

  const handleStartGame = async () => {
    // Validate player names
    for (let i = 0; i < playersList.length; i++) {
      if (!playersList[i].name.trim()) {
        Alert.alert('Eksik Bilgi', `Lütfen ${i + 1}. oyuncu adını girin.`);
        return;
      }
    }

    if (!isSingle) {
      // Validate unique names in multiplayer
      const names = playersList.map((p) => p.name.trim().toLowerCase());
      const uniqueNames = new Set(names);
      if (uniqueNames.size < names.length) {
        Alert.alert('Çift İsim Uyarısı', 'Her oyuncunun ismi farklı olmalıdır.');
        return;
      }
    }

    await setPlayers(playersList);
    router.push('/games');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <HeaderNav title={isSingle ? 'Tek Oyuncu Ayarı' : 'Çoklu Oyuncu Ayarı'} />

        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
          <View style={styles.card}>
            <View style={styles.headerRow}>
              {isSingle ? (
                <User size={24} color="#38BDF8" />
              ) : (
                <Users size={24} color="#38BDF8" />
              )}
              <Text style={styles.cardTitle}>
                {isSingle ? 'Oyuncu Adı ve Rengi' : 'Oyuncuları Düzenleyin'}
              </Text>
            </View>

            {/* Player Count Selection (Multiplayer Only) */}
            {!isSingle && (
              <View style={styles.countSelectorBox}>
                <Text style={styles.countSelectorLabel}>Oyuncu Sayısı Seçin:</Text>
                <View style={styles.countButtonsRow}>
                  {[2, 3, 4].map((cnt) => (
                    <TouchableOpacity
                      key={cnt}
                      style={[
                        styles.countButton,
                        playerCount === cnt && styles.countButtonActive,
                      ]}
                      onPress={() => handlePlayerCountChange(cnt)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.countButtonText,
                          playerCount === cnt && styles.countButtonTextActive,
                        ]}
                      >
                        {cnt} Oyuncu
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Players Inputs & Color Selectors */}
            {playersList.map((p, idx) => (
              <View key={p.id} style={styles.playerCard}>
                <Text style={[styles.playerLabel, { color: p.color }]}>
                  {isSingle ? 'Oyuncu Profiliniz' : `${idx + 1}. Oyuncu`}
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
                  {COLOR_PALETTE.map((c) => (
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

            <TouchableOpacity style={styles.startButton} onPress={handleStartGame} activeOpacity={0.8}>
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
  countSelectorBox: {
    backgroundColor: '#020617',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
  },
  countSelectorLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  countButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    alignItems: 'center',
  },
  countButtonActive: {
    backgroundColor: '#38BDF8',
    borderColor: '#7DD3FC',
  },
  countButtonText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#94A3B8',
  },
  countButtonTextActive: {
    color: '#020617',
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
