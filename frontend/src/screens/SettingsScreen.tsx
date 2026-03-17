// @author Zidane Virani

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors, fontSize, spacing, borderRadius } from '../theme';
import { api } from '../services/api';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [autoExport, setAutoExport] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [serviceEmail, setServiceEmail] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const response = await api.getUserSettings();
      setSheetId(response.settings.googleSheetId);
      setAutoExport(response.settings.autoExport);
      setServiceEmail(response.serviceAccountEmail);
    } catch (e) {
      console.error('Failed to load settings:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleConnectSheets() {
    if (!sheetUrl.trim()) {
      Alert.alert(
        'Google Sheets URL',
        'Please enter your Google Sheets URL to connect.'
      );
      return;
    }
    setIsProcessing(true);
    try {
      const settings = await api.connectGoogleSheet('link', sheetUrl);
      setSheetId(settings.googleSheetId);
      setAutoExport(settings.autoExport);
      Alert.alert('Connected!', 'Google Sheets linked successfully.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to connect sheet.');
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleCreateSheet() {
    setIsProcessing(true);
    try {
      const settings = await api.connectGoogleSheet('create');
      setSheetId(settings.googleSheetId);
      setAutoExport(settings.autoExport);
      Alert.alert('Created!', 'A new Google Sheet was created and linked. Check your Google Drive!');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create sheet.');
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleDisconnectSheets() {
    Alert.alert('Disconnect', 'Are you sure you want to disconnect Google Sheets?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: async () => {
          setIsProcessing(true);
          try {
            await api.connectGoogleSheet('disconnect');
            setSheetId(null);
            setSheetUrl('');
            setAutoExport(false);
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to disconnect.');
          } finally {
            setIsProcessing(false);
          }
        },
      },
    ]);
  }

  async function handleToggleAutoExport(val: boolean) {
    setAutoExport(val);
    try {
      await api.updateUserSettings(val);
    } catch (e: any) {
      Alert.alert('Error', 'Failed to update auto-export settings.');
      setAutoExport(!val);
    }
  }

  async function handleSyncAllReceipts() {
    setIsProcessing(true);
    try {
      const response = await api.syncAllReceipts();
      Alert.alert('Sync Started', response.message);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to sync receipts.');
    } finally {
      setIsProcessing(false);
    }
  }

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
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
                {sheetId ? 'Connected' : 'Not connected'}
              </Text>
            </View>
            {sheetId && (
              <View style={styles.connectedBadge}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.success}
                />
              </View>
            )}
          </View>

          {isProcessing ? (
            <ActivityIndicator size="small" color="#34A853" style={{ marginVertical: spacing.md }} />
          ) : !sheetId ? (
            <>
              {serviceEmail ? (
                <View style={styles.instructionBox}>
                  <Text style={styles.instructionTitle}>To link an existing sheet:</Text>
                  <Text style={styles.instructionText}>
                    1. Open your Google Sheet
                  </Text>
                  <Text style={styles.instructionText}>
                    2. Click "Share" and invite:
                  </Text>
                  <Text style={styles.serviceEmailText} selectable>{serviceEmail}</Text>
                  <Text style={styles.instructionText}>
                    3. Ensure they have "Editor" access.
                  </Text>
                  <Text style={styles.instructionText}>
                    4. Paste the URL below:
                  </Text>
                </View>
              ) : null}

              <TextInput
                style={styles.sheetsInput}
                value={sheetUrl}
                onChangeText={setSheetUrl}
                placeholder="Paste Google Sheets URL"
                placeholderTextColor={colors.textLight}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.connectButton}
                onPress={handleConnectSheets}
              >
                <Ionicons name="link" size={18} color="#FFFFFF" />
                <Text style={styles.connectText}>Connect Existing</Text>
              </TouchableOpacity>

              <Text style={styles.orText}>- OR -</Text>

              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateSheet}
              >
                <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                <Text style={styles.createText}>Create New Sheet</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <SettingRow
                label="Auto-export new receipts"
                value={autoExport}
                onToggle={handleToggleAutoExport}
              />
              <TouchableOpacity
                style={styles.syncButton}
                onPress={handleSyncAllReceipts}
              >
                <Ionicons name="sync-outline" size={18} color="#FFFFFF" />
                <Text style={styles.syncText}>Sync All Receipts Now</Text>
              </TouchableOpacity>
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
            <Text style={styles.aboutValue}>Sasha Muravyev & Zidane Virani</Text>
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
  orText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginVertical: spacing.sm,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.sm,
    height: 44,
  },
  createText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  instructionBox: {
    backgroundColor: '#F3F4F6',
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  instructionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  instructionText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  serviceEmailText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
    marginVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#34A853',
    borderRadius: borderRadius.sm,
    height: 44,
    marginTop: spacing.md,
  },
  syncText: {
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
