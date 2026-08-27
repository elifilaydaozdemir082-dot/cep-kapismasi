import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Home, ArrowLeft } from 'lucide-react-native';

interface HeaderNavProps {
  title: string;
  showBack?: boolean;
  onHomePress?: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  title,
  showBack = true,
  onHomePress,
}) => {
  const router = useRouter();

  const handleHome = () => {
    if (onHomePress) {
      onHomePress();
    } else {
      router.replace('/');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftContainer}>
        {showBack && (
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <ArrowLeft size={20} color="#38BDF8" />
          </TouchableOpacity>
        )}
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <TouchableOpacity onPress={handleHome} style={styles.homeButton}>
        <Home size={20} color="#38BDF8" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconButton: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#1E293B',
  },
  title: {
    color: '#F8FAFC',
    fontWeight: '900',
    fontSize: 16,
    flex: 1,
  },
  homeButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
});
