import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../components/Card';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../theme';

const VERSION = '1.0.0';

export const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* App info */}
        <Text style={styles.sectionLabel}>ABOUT</Text>
        <Card style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>App Name</Text>
            <Text style={styles.rowValue}>StudyPlan</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowValue}>{VERSION}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Storage</Text>
            <Text style={styles.rowValue}>Local (Offline-first)</Text>
          </View>
        </Card>

        {/* MVP notice */}
        <Text style={styles.sectionLabel}>COMING SOON</Text>
        <Card style={styles.card}>
          {['🔔 Push Notifications', '🔥 Streak System', '☁️ Cloud Sync', '📆 Calendar View'].map(
            (item, i, arr) => (
              <React.Fragment key={item}>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>{item}</Text>
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonText}>Soon</Text>
                  </View>
                </View>
                {i < arr.length - 1 ? <View style={styles.divider} /> : null}
              </React.Fragment>
            ),
          )}
        </Card>

        <Text style={styles.footer}>
          Built with ❤️ using React Native & TypeScript
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extraBold,
    color: Colors.textPrimary,
  },
  scroll: { padding: Spacing.base },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  card: { paddingHorizontal: Spacing.base, paddingVertical: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  rowLabel: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },
  rowValue: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  divider: { height: 1, backgroundColor: Colors.border },
  comingSoonBadge: {
    backgroundColor: Colors.primaryLight + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  comingSoonText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: FontWeight.semiBold,
  },
  footer: {
    textAlign: 'center',
    fontSize: FontSize.sm,
    color: Colors.textDisabled,
    marginTop: Spacing.xxl,
    marginBottom: Spacing.lg,
  },
});
