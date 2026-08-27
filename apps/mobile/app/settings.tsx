import React, { useState, useEffect } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Volume2, Smartphone, Trash2 } from 'lucide-react-native';
import { HeaderNav } from '../components/HeaderNav';
import { mobileStorageService, MobileSettings } from '../services/storage';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<MobileSettings>({
    soundEnabled: true,
    hapticEnabled: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const loaded = await mobileStorageService.getSettings();
    setSettings(loaded);
  };

  const toggleSound = async (val: boolean) => {
    const updated = { ...settings, soundEnabled: val };
    setSettings(updated);
    await mobileStorageService.saveSettings(updated);
  };

  const toggleHaptic = async (val: boolean) => {
    const updated = { ...settings, hapticEnabled: val };
    setSettings(updated);
    await mobileStorageService.saveSettings(updated);
  };

  const handleClearData = () => {
    Alert.alert(
      'Verileri Sıfırla',
      'Tüm oyuncu adları, ayarlar ve rekorlar silinecektir. Emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Evet, Sıfırla',
          style: 'destructive',
          onPress: async () => {
            await mobileStorageService.clearAllData();
            await loadSettings();
            Alert.alert('Tamamlandı', 'Tüm yerel veriler sıfırlandı.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <HeaderNav title="Ayarlar" />

        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Uygulama Tercihleri</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={styles.iconCircle}>
                  <Volume2 size={20} color="#38BDF8" />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Ses Efektleri</Text>
                  <Text style={styles.settingSubtext}>Oyun içi ses geri bildirimleri</Text>
                </View>
              </View>
              <Switch
                value={settings.soundEnabled}
                onValueChange={toggleSound}
                trackColor={{ false: '#1E293B', true: '#38BDF8' }}
                thumbColor={settings.soundEnabled ? '#020617' : '#94A3B8'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={styles.iconCircle}>
                  <Smartphone size={20} color="#F59E0B" />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Dokunsal Titreşim (Haptic)</Text>
                  <Text style={styles.settingSubtext}>Hedef dokunuşlarında hafif titreşim</Text>
                </View>
              </View>
              <Switch
                value={settings.hapticEnabled}
                onValueChange={toggleHaptic}
                trackColor={{ false: '#1E293B', true: '#38BDF8' }}
                thumbColor={settings.hapticEnabled ? '#020617' : '#94A3B8'}
              />
            </View>

            <TouchableOpacity style={styles.dangerButton} onPress={handleClearData}>
              <Trash2 size={18} color="#EF4444" />
              <Text style={styles.dangerButtonText}>Tüm Verileri Sıfırla</Text>
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F8FAFC',
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#020617',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  settingSubtext: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 18,
    marginTop: 16,
  },
  dangerButtonText: {
    color: '#EF4444',
    fontWeight: '900',
    fontSize: 14,
  },
});
