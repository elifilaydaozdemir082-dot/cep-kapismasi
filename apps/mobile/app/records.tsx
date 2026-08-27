import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trophy, Zap, Flame, Target } from 'lucide-react-native';
import { HeaderNav } from '../components/HeaderNav';
import { mobileStorageService, TargetHuntRecord } from '../services/storage';

export default function RecordsScreen() {
  const [record, setRecord] = useState<TargetHuntRecord | null>(null);

  useEffect(() => {
    loadRecord();
  }, []);

  const loadRecord = async () => {
    const loaded = await mobileStorageService.getTargetHuntRecord();
    setRecord(loaded);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <HeaderNav title="Rekorlar" />

        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
          {/* Main Trophy Banner */}
          <View style={styles.banner}>
            <View style={styles.trophyCircle}>
              <Trophy size={36} color="#F59E0B" />
            </View>
            <Text style={styles.bannerTitle}>Kişisel Başarılar</Text>
            <Text style={styles.bannerSubtitle}>Hedef Avı En İyi Skorlarınız</Text>
          </View>

          {record ? (
            <View style={styles.card}>
              <View style={styles.gameTitleRow}>
                <Zap size={20} color="#38BDF8" />
                <Text style={styles.gameTitle}>Hedef Avı Rekorları</Text>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>En Yüksek Skor</Text>
                  <Text style={styles.statValue}>{record.highScore} puan</Text>
                </View>

                <View style={styles.statBox}>
                  <View style={styles.statHeaderRow}>
                    <Flame size={14} color="#F59E0B" />
                    <Text style={styles.statLabel}>En Uzun Seri</Text>
                  </View>
                  <Text style={styles.statValue}>{record.bestStreak} x</Text>
                </View>

                <View style={styles.statBoxFull}>
                  <View style={styles.statHeaderRow}>
                    <Target size={14} color="#10B981" />
                    <Text style={styles.statLabel}>En İyi İsabet Oranı</Text>
                  </View>
                  <Text style={styles.statValue}>%{record.bestAccuracy}</Text>
                </View>
              </View>

              <Text style={styles.dateText}>Son Oynama: {record.lastPlayedDate}</Text>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Henüz Kayıt Yok</Text>
              <Text style={styles.emptyText}>
                Hedef Avı oyununu oynayarak ilk rekorunuzu kaydedin!
              </Text>
            </View>
          )}
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
  banner: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  trophyCircle: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  bannerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
  },
  gameTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  gameTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statBox: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: '#020617',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  statBoxFull: {
    width: '100%',
    backgroundColor: '#020617',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  statHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#38BDF8',
  },
  dateText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
    marginTop: 16,
    textAlign: 'right',
  },
  emptyCard: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
});
