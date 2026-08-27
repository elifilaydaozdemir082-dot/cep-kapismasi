import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Users, ChevronRight } from 'lucide-react-native';
import { HeaderNav } from '../components/HeaderNav';

export default function ModeSelectionScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <HeaderNav title="Mod Seçimi" />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Oyun Modunu Seçin</Text>
          <Text style={styles.cardSubtitle}>
            İster tek başınıza rekor kırın, ister arkadaşlarınızla yarışın.
          </Text>

          <View style={styles.optionsList}>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => router.push('/games?mode=single')}
              activeOpacity={0.8}
            >
              <View style={styles.iconCircle}>
                <User size={24} color="#38BDF8" />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.optionTitle}>Tek Oyunculu</Text>
                <Text style={styles.optionDesc}>Zamana karşı yarışın ve kişisel rekorunuzu geliştirin.</Text>
              </View>
              <ChevronRight size={20} color="#64748B" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => router.push('/players')}
              activeOpacity={0.8}
            >
              <View style={styles.iconCircle}>
                <Users size={24} color="#F59E0B" />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.optionTitle}>Çok Oyunculu</Text>
                <Text style={styles.optionDesc}>2-4 oyuncu ile aynı ekranda sırayla veya aynı anda yarışın.</Text>
              </View>
              <ChevronRight size={20} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>
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
  card: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    marginTop: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 4,
    marginBottom: 20,
  },
  optionsList: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#020617',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 14,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  optionDesc: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
});
