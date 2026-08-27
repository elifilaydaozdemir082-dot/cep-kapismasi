import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Users, Trophy, Settings, Zap, Play } from 'lucide-react-native';
import { useGameSession } from '../context/GameSessionContext';
import { mobileStorageService } from '../services/storage';

export default function MainMenuScreen() {
  const router = useRouter();
  const { setMode, resetSession } = useGameSession();

  useEffect(() => {
    // Controlled reset of temporary session state on home screen arrival
    resetSession();
  }, []);

  const handleSinglePlayerPress = async () => {
    setMode('single');
    const savedPlayers = await mobileStorageService.getPlayers();
    if (savedPlayers && savedPlayers.length > 0 && savedPlayers[0].name.trim() !== '') {
      router.push('/games');
    } else {
      router.push('/players');
    }
  };

  const handleMultiPlayerPress = () => {
    setMode('multiplayer');
    router.push('/players');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        {/* Top Header Title Banner */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Zap size={36} color="#38BDF8" fill="#38BDF8" />
          </View>
          <Text style={styles.title}>Cep Kapışması</Text>
          <Text style={styles.subtitle}>Eğlenceli Mini Oyunlar ve Bilgi Kapışmaları</Text>
        </View>

        {/* Main Menu Action Buttons */}
        <View style={styles.menuList}>
          <TouchableOpacity
            style={[styles.menuButton, styles.primaryButton]}
            onPress={() => router.push('/webview')}
            activeOpacity={0.8}
          >
            <View style={styles.iconCirclePrimary}>
              <Zap size={24} color="#020617" fill="#020617" />
            </View>
            <View style={styles.buttonTextContainer}>
              <Text style={styles.primaryButtonText}>🚀 TÜM OYUNLAR (25+ KAPISMA)</Text>
              <Text style={styles.buttonSubtext}>Okçuluk, Basket, Penaltı, Halat Çekme vb.</Text>
            </View>
            <Play size={20} color="#020617" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={handleSinglePlayerPress}
            activeOpacity={0.8}
          >
            <View style={styles.iconCircleSecondary}>
              <User size={22} color="#38BDF8" />
            </View>
            <View style={styles.buttonTextContainer}>
              <Text style={styles.buttonText}>Tek Oyunculu Mobil</Text>
              <Text style={styles.buttonSubtext}>Yerel Mobil Ekranlar</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={handleMultiPlayerPress}
            activeOpacity={0.8}
          >
            <View style={styles.iconCircleSecondary}>
              <Users size={22} color="#38BDF8" />
            </View>
            <View style={styles.buttonTextContainer}>
              <Text style={styles.buttonText}>Arkadaşlarla Oyna</Text>
              <Text style={styles.buttonSubtext}>Aynı Cihazda Çoklu Kapışma</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => router.push('/records')}
            activeOpacity={0.8}
          >
            <View style={styles.iconCircleSecondary}>
              <Trophy size={22} color="#F59E0B" />
            </View>
            <View style={styles.buttonTextContainer}>
              <Text style={styles.buttonText}>Rekorlar</Text>
              <Text style={styles.buttonSubtext}>En Yüksek Skorlar ve Başarılar</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => router.push('/settings')}
            activeOpacity={0.8}
          >
            <View style={styles.iconCircleSecondary}>
              <Settings size={22} color="#94A3B8" />
            </View>
            <View style={styles.buttonTextContainer}>
              <Text style={styles.buttonText}>Ayarlar</Text>
              <Text style={styles.buttonSubtext}>Ses ve Titreşim Tercihleri</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  scrollContent: {
    padding: 24,
    justifyContent: 'space-between',
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 36,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 6,
    textAlign: 'center',
  },
  menuList: {
    gap: 14,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 14,
  },
  primaryButton: {
    backgroundColor: '#38BDF8',
    borderColor: '#7DD3FC',
  },
  iconCirclePrimary: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleSecondary: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonTextContainer: {
    flex: 1,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#020617',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  buttonSubtext: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
});
