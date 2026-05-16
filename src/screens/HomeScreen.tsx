import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStudyPlans } from '../features/study-plans/hooks/useStudyPlans';
import { PlanCard } from '../features/study-plans/components/PlanCard';
import { EmptyState, ErrorState, LoadingState } from '../components/feedback';
import { ScreenContainer, ScreenHeader } from '../components/layout';
import { Colors, Spacing, Radius } from '../theme';
import type { RootStackParamList } from '../app/navigation/types';
import { useAppSettings } from '../hooks/useAppSettings';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { plans, isLoading, error, getProgress, deletePlan, refresh } =
    useStudyPlans();
  const { layout } = useAppSettings();

  const handleDelete = (id: string, title: string) => {
    Alert.alert('Delete Plan', `Delete "${title}" and all its tasks?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deletePlan(id).catch(() => {
            Alert.alert('Delete Failed', 'Unable to delete this study plan.');
          });
        },
      },
    ]);
  };

  const openCreatePlan = () => navigation.navigate('CreatePlan');

  const renderEmptyState = () => {
    if (isLoading) {
      return <LoadingState title="Loading study plans..." />;
    }

    if (error) {
      return <ErrorState message={error} onRetry={refresh} />;
    }

    return (
      <EmptyState
        icon="book-outline"
        title="No study plans yet"
        subtitle="Create a plan, add tasks, and track your progress from one place."
        actionLabel="Create Plan"
        onAction={openCreatePlan}
      />
    );
  };

  return (
    <ScreenContainer>
      <ScreenHeader
        title="My Study Plans"
        subtitle={`${plans.length} ${plans.length === 1 ? 'plan' : 'plans'}`}
        rightAction={
        <TouchableOpacity
          style={styles.addBtn}
          onPress={openCreatePlan}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
        }
      />

      <FlatList
        data={plans}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.list,
          {
            padding: layout.screenPadding,
            paddingBottom: layout.screenPadding + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshing={isLoading && plans.length > 0}
        onRefresh={refresh}
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
        ListEmptyComponent={renderEmptyState}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { padding: Spacing.base, flexGrow: 1 },
});
