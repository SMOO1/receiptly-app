// @author Zidane Virani

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors, fontSize, spacing, borderRadius } from '../theme';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [sheetsUrl, setSheetsUrl] = useState('');
  const [sheetsConnected, setSheetsConnected] = useState(false);
  const [autoExport, setAutoExport] = useState(false);
  const [notifications, setNotifications] = useState(true);

  function handleConnectSheets() {
    if (!sheetsUrl.trim()) {
      Alert.alert(
        'Google Sheets URL',
        'Please enter your Google Sheets URL to connect.'
      );
      return;
    }

    // Simulate connection
    setSheetsConnected(true);
    Alert.alert('Connected!', 'Google Sheets linked successfully.');
  }

  function handleDisconnectSheets() {
    setSheetsConnected(false);
    setSheetsUrl('');
    setAutoExport(false);
  }

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>Settings</Text>

      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.displayName?.[0]?.toUpperCase() || '?'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {user?.displayName || 'User'}
            </Text>
            <Text style={styles.profileEmail}>
              {user?.email || 'user@email.com'}
            </Text>
          </View>
        </View>
      </View>

      {/* Google Sheets Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Google Sheets Export</Text>
        <View style={styles.card}>
          <View style={styles.sheetsHeader}>
            <View style={styles.sheetsIcon}>
              <Ionicons name="grid-outline" size={24} color="#34A853" />
            </View>
            <View style={styles.sheetsInfo}>
              <Text style={styles.sheetsTitle}>Google Sheets</Text>
              <Text style={styles.sheetsStatus}>
                {sheetsConnected ? 'Connected' : 'Not connected'}
              </Text>
            </View>
            {sheetsConnected && (
              <View style={styles.connectedBadge}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.success}
                />
              </View>
            )}
          </View>

          {!sheetsConnected ? (
            <>
              <TextInput
                style={styles.sheetsInput}
                value={sheetsUrl}
                onChangeText={setSheetsUrl}
                placeholder="Paste Google Sheets URL"
                placeholderTextColor={colors.textLight}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.connectButton}
                onPress={handleConnectSheets}
              >
                <Ionicons name="link" size={18} color="#FFFFFF" />
                <Text style={styles.connectText}>Connect</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <SettingRow
                label="Auto-export new receipts"
                value={autoExport}
                onToggle={setAutoExport}
              />
              <TouchableOpacity
                style={styles.disconnectButton}
                onPress={handleDisconnectSheets}
              >
                <Text style={styles.disconnectText}>Disconnect</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.card}>
          <SettingRow
            label="Push Notifications"
            value={notifications}
            onToggle={setNotifications}
          />
        </View>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Built by</Text>
            <Text style={styles.aboutValue}>Zidane Virani</Text>
          </View>
        </View>
      </View>

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function SettingRow({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: (val: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primaryLight }}
        thumbColor={value ? colors.primary : colors.textLight}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingTop: 60,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  profileInfo: {
    marginLeft: spacing.md,
  },
  profileName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  profileEmail: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sheetsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sheetsIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetsInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  sheetsTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  sheetsStatus: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  connectedBadge: {
    padding: spacing.xs,
  },
  sheetsInput: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    height: 44,
    fontSize: fontSize.sm,
    color: colors.text,
    marginBottom: spacing.md,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#34A853',
    borderRadius: borderRadius.sm,
    height: 44,
  },
  connectText: {
    color: '#FFFFFF',
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  disconnectButton: {
    alignItems: 'center',
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  disconnectText: {
    color: colors.error,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  settingLabel: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  aboutLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  aboutValue: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: borderRadius.md,
    height: 48,
    marginTop: spacing.md,
  },
  signOutText: {
    color: colors.error,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
