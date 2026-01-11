import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { COLORS } from '../theme/colors';

interface SettingsScreenProps {
  navigation: any;
}

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const handleSettingPress = (setting: string) => {
    Alert.alert(
      setting.toUpperCase(),
      `${setting} settings will be implemented soon.`,
      [{ text: 'OK' }]
    );
  };

  const settingsSections = [
    {
      title: '>> ACCOUNT',
      items: [
        { id: 'wallet', label: 'Wallet Settings', icon: '⚙' },
        { id: 'security', label: 'Security & Privacy', icon: '🔒' },
        { id: 'backup', label: 'Backup & Recovery', icon: '💾' },
      ],
    },
    {
      title: '>> PREFERENCES',
      items: [
        { id: 'notifications', label: 'Notifications', icon: '🔔' },
        { id: 'network', label: 'Network Settings', icon: '🌐' },
        { id: 'currency', label: 'Currency', icon: '💱' },
      ],
    },
    {
      title: '>> SUPPORT',
      items: [
        { id: 'help', label: 'Help & Support', icon: '❓' },
        { id: 'about', label: 'About', icon: 'ℹ' },
        { id: 'terms', label: 'Terms & Conditions', icon: '📄' },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{'>> SETTINGS'}</Text>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>C</Text>
          </View>
          <Text style={styles.userName}>CRESCA_USER</Text>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>{'[ EDIT_PROFILE ]'}</Text>
          </TouchableOpacity>
        </View>

        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.settingItem,
                  itemIndex === section.items.length - 1 && styles.settingItemLast,
                ]}
                onPress={() => handleSettingPress(item.label)}
              >
                <View style={styles.settingLeft}>
                  <View style={styles.iconContainer}>
                    <Text style={styles.icon}>{item.icon}</Text>
                  </View>
                  <Text style={styles.settingLabel}>{item.label.toUpperCase()}</Text>
                </View>
                <Text style={styles.arrow}>{'>'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => {
            Alert.alert(
              'LOGOUT',
              'Are you sure you want to logout?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Logout',
                  style: 'destructive',
                  onPress: () => {
                    // Handle logout
                    console.log('User logged out');
                  },
                },
              ]
            );
          }}
        >
          <Text style={styles.logoutButtonText}>{'[ LOGOUT ]'}</Text>
        </TouchableOpacity>

        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>VERSION 1.0.0</Text>
          <Text style={styles.versionText}>CRESCA © 2024</Text>
        </View>
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
    padding: 24,
    paddingTop: 60,
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 2,
  },
  scrollContent: {
    flex: 1,
  },
  profileCard: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: COLORS.cardBackground,
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.background,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  editButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  editButtonText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    padding: 16,
    backgroundColor: COLORS.background,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  settingLabel: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  arrow: {
    fontSize: 18,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  logoutButton: {
    marginHorizontal: 16,
    marginVertical: 24,
    padding: 16,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.error,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  versionInfo: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  versionText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
});
