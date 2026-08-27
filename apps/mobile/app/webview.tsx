import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, RefreshCw } from 'lucide-react-native';
import Constants from 'expo-constants';

export default function MobileWebViewScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [key, setKey] = useState(0);

  // Obtain local machine host IP dynamically for Expo Go device connection
  const debuggerHost = Constants.expoConfig?.hostUri || '';
  const localIp = debuggerHost.split(':')[0] || 'localhost';
  const webUrl = `http://${localIp}:5174`;

  const handleRefresh = () => {
    setError(false);
    setLoading(true);
    setKey((prev) => prev + 1);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Top Header Controls */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#F8FAFC" />
          <Text style={styles.backText}>Mobil Menü</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>🎮 TÜM OYUNLAR</Text>

        <TouchableOpacity style={styles.iconButton} onPress={handleRefresh}>
          <RefreshCw size={18} color="#38BDF8" />
        </TouchableOpacity>
      </View>

      {/* Main High-Performance Expo WebView */}
      <View style={styles.webviewContainer}>
        <WebView
          key={key}
          source={{ uri: webUrl }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlayback={true}
          scalesPageToFit={true}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
        />

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#38BDF8" />
            <Text style={styles.loadingText}>Oyunlar Yükleniyor ({webUrl})...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorTitle}>Bağlantı Kurulamadı</Text>
            <Text style={styles.errorText}>
              Lütfen bilgisayarınızda `npm run dev` komutunun çalıştığından ve mobil cihazınızla aynı Wi-Fi ağında olduğunuzdan emin olun.
            </Text>

            <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
              <RefreshCw size={18} color="#020617" />
              <Text style={styles.retryButtonText}>Yeniden Dene</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backText: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 13,
  },
  headerTitle: {
    color: '#38BDF8',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  iconButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  webviewContainer: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: '#020617',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#020617',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#020617',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  errorTitle: {
    color: '#EF4444',
    fontSize: 18,
    fontWeight: '900',
  },
  errorText: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#38BDF8',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#020617',
    fontWeight: '900',
    fontSize: 14,
  },
});
