import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStudyPlans } from '../features/study-plans/hooks/useStudyPlans';
import { PlanCard } from '../features/study-plans/components/PlanCard';
import { EmptyState } from '../components/EmptyState';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../theme';
import type { RootStackParamList } from '../app/navigation/types';
import { useAppSettings } from '../hooks/useAppSettings';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { plans, isLoading, getProgress, deletePlan } = useStudyPlans();
  const { layout } = useAppSettings();

  const handleDelete = (id: string, title: string) => {
    Alert.alert('Delete Plan', `Delete "${title}" and all its tasks?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deletePlan(id),
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={[styles.header, { paddingVertical: layout.headerVertical }]}>
        <View>
          <Text style={styles.headerTitle}>My Study Plans</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('CreatePlan')}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={plans}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.list, { padding: layout.screenPadding }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <PlanCard
            plan={item}
            progress={getProgress(item.id)}
            onPress={() =>
              navigation.navigate('PlanDetail', {
                planId: item.id,
                planTitle: item.title,
              })
            }
            onDelete={() => handleDelete(item.id, item.title)}
          />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon={'book-outline'}
              title="No study plans yet"
              subtitle="Tap the + button to create your first study plan"
            />
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  greeting: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extraBold,
    color: Colors.textPrimary,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    fontSize: 28,
    color: Colors.white,
    lineHeight: 32,
    fontWeight: FontWeight.bold,
  },
  list: { padding: Spacing.base, flexGrow: 1 },
});
