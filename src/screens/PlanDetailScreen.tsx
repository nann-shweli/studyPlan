import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Modal,
  Alert,
  TouchableOpacity,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { ErrorState, EmptyState, LoadingState } from '../components/feedback';
import { Header, ProgressBar } from '../components/ui';
import { TaskItem } from '../features/tasks/components/TaskItem';
import { TaskForm } from '../features/tasks/components/TaskForm';
import { PlanForm } from '../features/study-plans/components/PlanForm';
import { useStudyPlansStore } from '../features/study-plans/studyPlansSlice';
import { useTasks } from '../features/tasks/hooks/useTasks';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../theme';
import type { RootStackParamList } from '../app/navigation/types';
import type { StudyTask } from '../types';
import { useAppSettings } from '../hooks/useAppSettings';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'PlanDetail'>;

export const PlanDetailScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { planId, planTitle } = route.params;

  const {
    plans,
    isLoading: isPlanLoading,
    error: planError,
    loadPlans,
    updatePlan,
  } = useStudyPlansStore();
  const plan = plans.find(item => item.id === planId);
  const currentPlanTitle = plan?.title ?? planTitle;
  const {
    tasks,
    completedCount,
    isLoading: isTaskLoading,
    error: taskError,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    refresh: refreshTasks,
  } = useTasks(planId);
  const { layout } = useAppSettings();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditPlanModal, setShowEditPlanModal] = useState(false);
  const [editingTask, setEditingTask] = useState<StudyTask | null>(null);
  const [hasLoadedPlan, setHasLoadedPlan] = useState(false);

  useEffect(() => {
    let mounted = true;

    loadPlans().finally(() => {
      if (mounted) setHasLoadedPlan(true);
    });

    return () => {
      mounted = false;
    };
  }, [loadPlans]);

  const handleAdd = async (values: { title: string; date: string }) => {
    await addTask({ ...values, planId });
    setShowAddModal(false);
  };

  const handleEdit = async (values: { title: string; date: string }) => {
    if (!editingTask) return;
    await updateTask(editingTask.id, values);
    setEditingTask(null);
  };

  const handleEditPlan = async (values: {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
  }) => {
    await updatePlan(planId, values);
    navigation.setParams({ planId, planTitle: values.title });
    setShowEditPlanModal(false);
  };

  const handleDelete = (task: StudyTask) => {
    Alert.alert('Delete Task', `Delete "${task.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteTask(task.id).catch(() => {
            Alert.alert('Delete Failed', 'Unable to delete this task.');
          });
        },
      },
    ]);
  };

  const refresh = async () => {
    setHasLoadedPlan(false);
    await Promise.all([loadPlans(), refreshTasks()]);
    setHasLoadedPlan(true);
  };

  const renderTaskEmptyState = () => {
    if (isTaskLoading) {
      return <LoadingState title="Loading tasks..." />;
    }

    if (taskError) {
      return <ErrorState message={taskError} onRetry={refreshTasks} />;
    }

    return (
      <EmptyState
        icon="checkmark-circle-outline"
        title="No tasks yet"
        subtitle="Add the first task for this study plan."
        actionLabel="Add Task"
        onAction={() => setShowAddModal(true)}
      />
    );
  };

  const renderBody = () => {
    if ((isPlanLoading || !hasLoadedPlan) && !plan && tasks.length === 0) {
      return <LoadingState title="Loading study plan..." />;
    }

    if (planError && !plan) {
      return <ErrorState message={planError} onRetry={refresh} />;
    }

    if (!plan && !isPlanLoading && hasLoadedPlan) {
      return (
        <ErrorState
          title="Plan not found"
          message="This study plan could not be found on this device."
          retryLabel="Go Back"
          onRetry={() => navigation.goBack()}
        />
      );
    }

    return (
      <>
        <View
          style={[
            styles.progressSection,
            {
              paddingHorizontal: layout.screenPadding,
              paddingVertical: layout.headerVertical,
            },
          ]}
        >
          <ProgressBar
            completed={completedCount}
            total={tasks.length}
            height={10}
          />
        </View>

        <FlatList
          data={tasks}
          keyExtractor={item => item.id}
          contentContainerStyle={[
            styles.list,
            {
              padding: layout.screenPadding,
              paddingBottom: layout.screenPadding + Spacing.xl,
            },
          ]}
          showsVerticalScrollIndicator={false}
          refreshing={isTaskLoading && tasks.length > 0}
          onRefresh={refreshTasks}
          renderItem={({ item }) => (
            <TaskItem
              task={item}
              showDate
              onToggle={() => {
                toggleTask(item.id).catch(() => {
                  Alert.alert('Update Failed', 'Unable to update this task.');
                });
              }}
              onDelete={() => handleDelete(item)}
              onEdit={() => setEditingTask(item)}
            />
          )}
          ListEmptyComponent={renderTaskEmptyState}
        />
      </>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title={currentPlanTitle}
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => setShowEditPlanModal(true)}
              style={styles.iconBtn}
              disabled={!plan}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="create-outline"
                size={18}
                color={Colors.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowAddModal(true)}
              style={styles.addBtn}
            >
              <Text style={styles.addBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {renderBody()}

      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <Text
            style={[
              styles.modalTitle,
              {
                paddingHorizontal: layout.screenPadding,
                marginBottom: layout.listGap,
              },
            ]}
          >
            Add Task
          </Text>
          <TaskForm
            planId={planId}
            onSubmit={handleAdd}
            onCancel={() => setShowAddModal(false)}
          />
        </View>
      </Modal>

      <Modal
        visible={showEditPlanModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditPlanModal(false)}
      >
        <View style={styles.modalContainer}>
          <Text
            style={[
              styles.modalTitle,
              {
                paddingHorizontal: layout.screenPadding,
                marginBottom: layout.listGap,
              },
            ]}
          >
            Edit Plan
          </Text>
          <PlanForm
            initialValues={
              plan
                ? {
                    title: plan.title,
                    description: plan.description ?? '',
                    startDate: plan.startDate,
                    endDate: plan.endDate,
                  }
                : undefined
            }
            onSubmit={handleEditPlan}
            onCancel={() => setShowEditPlanModal(false)}
            submitLabel="Save Changes"
          />
        </View>
      </Modal>

      <Modal
        visible={!!editingTask}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditingTask(null)}
      >
        <View style={styles.modalContainer}>
          <Text
            style={[
              styles.modalTitle,
              {
                paddingHorizontal: layout.screenPadding,
                marginBottom: layout.listGap,
              },
            ]}
          >
            Edit Task
          </Text>
          <TaskForm
            planId={planId}
            initialValues={
              editingTask
                ? { title: editingTask.title, date: editingTask.date }
                : undefined
            }
            onSubmit={handleEdit}
            onCancel={() => setEditingTask(null)}
            submitLabel="Save Changes"
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    fontSize: 22,
    color: Colors.white,
    lineHeight: 26,
    fontWeight: FontWeight.bold,
  },
  progressSection: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  list: { padding: Spacing.base, flexGrow: 1 },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
  },
});
