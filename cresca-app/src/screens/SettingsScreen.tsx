import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

interface SettingsScreenProps {
  navigation: any;
}

interface SettingItem {
  id: string;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const [userName] = useState('Pascal');
  const { logout } = useAuth();

  const handleSettingPress = (setting: SettingItem) => {
    Alert.alert(
      setting.label,
      `${setting.label} settings will be implemented soon.`,
      [{ text: 'OK' }]
    );
  };

  const settingsItems: SettingItem[] = [
    { 
      id: 'wallet', 
      label: 'Wallet Settings', 
      description: 'Manage your wallet preferences',
      icon: 'settings-outline' 
    },
    { 
      id: 'security', 
      label: 'Security & Privacy', 
      description: 'Backup, recovery, and security',
      icon: 'lock-closed-outline' 
    },
    { 
      id: 'notifications', 
      label: 'Notifications', 
      description: 'Transaction and price alerts',
      icon: 'notifications-outline' 
    },
    { 
      id: 'network', 
      label: 'Network Settings', 
      description: 'Switch between networks',
      icon: 'globe-outline' 
    },
    { 
      id: 'help', 
      label: 'Help & Support', 
      description: 'Get help and contact support',
      icon: 'help-circle-outline' 
    },
  ];

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? This will remove your wallet from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Account & Settings</Text>
        </View>
        <TouchableOpacity style={styles.editButton}>
          <Ionicons name="pencil" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={28} color={COLORS.textWhite} />
            </View>
            <View style={styles.onlineIndicator} />
          </View>
          <Text style={styles.userName}>{userName}</Text>
        </View>

        {/* Settings List */}
        <View style={styles.settingsList}>
          {settingsItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.settingItem,
                index === settingsItems.length - 1 && styles.settingItemLast
              ]}
              onPress={() => handleSettingPress(item)}
            >
              <View style={styles.settingLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name={item.icon} size={22} color={COLORS.primary} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>{item.label}</Text>
                  <Text style={styles.settingDescription}>{item.description}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        {/* Version Info */}
        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
          <Text style={styles.versionText}>Cresca © 2026</Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  editIcon: {
    fontSize: 18,
  },
  scrollContent: {
    flex: 1,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: 32,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  avatarIcon: {
    fontSize: 48,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.accentGreen,
    borderWidth: 3,
    borderColor: COLORS.background,
  },
  userName: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.text,
  },
  settingsList: {
    marginHorizontal: 20,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  icon: {
    fontSize: 20,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  arrow: {
    fontSize: 24,
    color: COLORS.textMuted,
    marginLeft: 8,
  },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 24,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.accentRed,
  },
  versionInfo: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  versionText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  bottomSpacer: {
    height: 100,
  },
});
