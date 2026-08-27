import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Zap,
  Car,
  Goal,
  Target,
  Crosshair,
  Activity,
  Swords,
  MessageSquare,
  HelpCircle,
  Search,
  Shuffle,
  Ban,
  Link,
  BookOpen,
  Gift,
  Layers,
  Compass,
  Brain,
  Film,
  Flame,
  ListOrdered,
  Lock,
  Play,
  AlertCircle,
  Users,
} from 'lucide-react-native';
import { HeaderNav } from '../components/HeaderNav';
import { useGameSession } from '../context/GameSessionContext';
import {
  MOBILE_GAME_REGISTRY,
  MOBILE_GAME_CATEGORIES,
  MobileGameCategory,
  MobileGameDefinition,
} from '../registry/mobileGameRegistry';

// Icon Renderer for Mobile Lucide Icons
const renderMobileIcon = (iconName: string, color: string) => {
  const props = { size: 24, color };
  switch (iconName) {
    case 'Zap':
      return <Zap {...props} />;
    case 'Car':
      return <Car {...props} />;
    case 'Goal':
      return <Goal {...props} />;
    case 'Target':
      return <Target {...props} />;
    case 'Crosshair':
      return <Crosshair {...props} />;
    case 'Activity':
      return <Activity {...props} />;
    case 'Swords':
      return <Swords {...props} />;
    case 'MessageSquare':
      return <MessageSquare {...props} />;
    case 'HelpCircle':
      return <HelpCircle {...props} />;
    case 'Search':
      return <Search {...props} />;
    case 'Shuffle':
      return <Shuffle {...props} />;
    case 'Ban':
      return <Ban {...props} />;
    case 'Link':
      return <Link {...props} />;
    case 'BookOpen':
      return <BookOpen {...props} />;
    case 'Gift':
      return <Gift {...props} />;
    case 'Layers':
      return <Layers {...props} />;
    case 'Compass':
      return <Compass {...props} />;
    case 'Brain':
      return <Brain {...props} />;
    case 'Film':
      return <Film {...props} />;
    case 'Flame':
      return <Flame {...props} />;
    case 'ListOrdered':
      return <ListOrdered {...props} />;
    default:
      return <Zap {...props} />;
  }
};

export default function GamesScreen() {
  const router = useRouter();
  const { session } = useGameSession();

  const [activeCategory, setActiveCategory] = useState<MobileGameCategory>('all');
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>('');
  const [modalMessage, setModalMessage] = useState<string>('');

  useEffect(() => {
    if (!session.mode) {
      router.replace('/');
    }
  }, [session.mode]);

  const mode = session.mode || 'single';
  const isSingle = mode === 'single';

  // Filter games based on selected category tab
  const filteredGames =
    activeCategory === 'all'
      ? MOBILE_GAME_REGISTRY
      : MOBILE_GAME_REGISTRY.filter((g) => g.category === activeCategory);

  const handleCardPress = (game: MobileGameDefinition) => {
    const supportsCurrentMode = game.supportedModes.includes(mode);

    if (!supportsCurrentMode) {
      setModalTitle(game.title);
      setModalMessage(
        'Bu oyun yalnızca çok oyunculu modda oynanabilir. Ana sayfadan "Arkadaşlarla Oyna" modunu seçebilirsiniz.'
      );
      setModalVisible(true);
      return;
    }

    if (game.status === 'playable' && game.route) {
      router.push(`${game.route}?mode=${mode}` as any);
    } else {
      setModalTitle(game.title);
      setModalMessage('Bu oyun Expo sürümüne henüz taşınmadı.\nWeb sürümünde oynamaya devam edebilirsin.');
      setModalVisible(true);
    }
  };

  const renderGameCard = ({ item: game }: { item: MobileGameDefinition }) => {
    const supportsCurrentMode = game.supportedModes.includes(mode);
    const isPlayable = game.status === 'playable' && supportsCurrentMode;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          isPlayable && styles.playableCard,
          !supportsCurrentMode && styles.incompatibleCard,
        ]}
        onPress={() => handleCardPress(game)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.iconBox,
              { backgroundColor: `${game.color}20`, borderColor: game.color },
            ]}
          >
            {renderMobileIcon(game.iconName, game.color)}
          </View>

          {isPlayable ? (
            <View style={styles.readyBadge}>
              <Text style={styles.readyBadgeText}>OYNANABİLİR</Text>
            </View>
          ) : !supportsCurrentMode ? (
            <View style={styles.multiOnlyBadge}>
              <Lock size={10} color="#F59E0B" />
              <Text style={styles.multiOnlyBadgeText}>Sadece Çok Oyunculu</Text>
            </View>
          ) : (
            <View style={styles.devBadge}>
              <Lock size={10} color="#94A3B8" />
              <Text style={styles.devBadgeText}>Mobil Sürüme Hazırlanıyor</Text>
            </View>
          )}
        </View>

        <Text style={styles.cardTitle}>{game.title}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>
          {game.description}
        </Text>

        {isPlayable ? (
          <View style={styles.playRow}>
            <Play size={14} color="#38BDF8" fill="#38BDF8" />
            <Text style={styles.playText}>Hemen Oyna</Text>
          </View>
        ) : (
          <View style={styles.disabledRow}>
            <Text style={styles.disabledText}>
              {!supportsCurrentMode ? 'Mod Uyumsuz' : 'Hazırlanıyor'}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <HeaderNav title="Oyun Seçimi" />

        {/* Top Active Mode Status Bar */}
        <View style={styles.modeBar}>
          <View style={styles.modeInfoGroup}>
            <View
              style={[
                styles.modeDot,
                { backgroundColor: isSingle ? '#38BDF8' : '#F59E0B' },
              ]}
            />
            <Text style={styles.modeTitleText}>
              {isSingle
                ? 'Tek Oyunculu Mod'
                : `Arkadaşlarla Oyna · ${session.players.length} Oyuncu`}
            </Text>
          </View>

          {!isSingle && (
            <TouchableOpacity
              style={styles.editPlayersButton}
              onPress={() => router.push('/players')}
              activeOpacity={0.8}
            >
              <Users size={14} color="#38BDF8" />
              <Text style={styles.editPlayersText}>Oyuncuları Düzenle</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Horizontal Category Filter Tabs */}
        <View style={styles.tabsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContainer}
          >
            {MOBILE_GAME_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.tabButton,
                  activeCategory === cat.id && styles.activeTabButton,
                ]}
                onPress={() => setActiveCategory(cat.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeCategory === cat.id && styles.activeTabText,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 22 Games List */}
        <FlatList
          data={filteredGames}
          renderItem={renderGameCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />

        {/* Info Modal for Unfinished or Incompatible Games */}
        <Modal visible={modalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalIconBox}>
                <AlertCircle size={32} color="#F59E0B" />
              </View>
              <Text style={styles.modalTitle}>{modalTitle}</Text>
              <Text style={styles.modalMessage}>{modalMessage}</Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.8}
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
  modeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 8,
    marginBottom: 12,
  },
  modeInfoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modeTitleText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '900',
  },
  editPlayersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#020617',
    borderColor: '#38BDF8',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  editPlayersText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
  },
  tabsWrapper: {
    marginBottom: 12,
  },
  tabsContainer: {
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1,
  },
  activeTabButton: {
    backgroundColor: '#38BDF8',
    borderColor: '#7DD3FC',
  },
  tabText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '800',
  },
  activeTabText: {
    color: '#020617',
    fontWeight: '900',
  },
  listContainer: {
    gap: 12,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
  },
  playableCard: {
    borderColor: '#38BDF8',
  },
  incompatibleCard: {
    opacity: 0.6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  readyBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: 'rgba(56, 189, 248, 0.4)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  readyBadgeText: {
    color: '#38BDF8',
    fontSize: 9,
    fontWeight: '900',
  },
  devBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  devBadgeText: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '900',
  },
  multiOnlyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  multiOnlyBadgeText: {
    color: '#F59E0B',
    fontSize: 9,
    fontWeight: '900',
  },
  cardTitle: {
    fontSize: 17,
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
    marginTop: 10,
  },
  playText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '900',
  },
  disabledRow: {
    marginTop: 10,
  },
  disabledText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '800',
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
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
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
