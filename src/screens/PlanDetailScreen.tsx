import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Modal,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Header } from '../components/Header';
import { EmptyState } from '../components/EmptyState';
import { TaskItem } from '../features/tasks/components/TaskItem';
import { TaskForm } from '../features/tasks/components/TaskForm';
import { PlanForm } from '../features/study-plans/components/PlanForm';
import { useStudyPlansStore } from '../features/study-plans/studyPlansSlice';
import { useTasks } from '../features/tasks/hooks/useTasks';
import { ProgressBar } from '../features/progress/components/ProgressBar';
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

  const { plans, updatePlan } = useStudyPlansStore();
  const plan = plans.find(item => item.id === planId);
  const currentPlanTitle = plan?.title ?? planTitle;
  const { tasks, completedCount, addTask, updateTask, toggleTask, deleteTask } =
    useTasks(planId);
  const { layout } = useAppSettings();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditPlanModal, setShowEditPlanModal] = useState(false);
  const [editingTask, setEditingTask] = useState<StudyTask | null>(null);

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
        onPress: () => deleteTask(task.id),
      },
    ]);
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
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.editBtnText}>✎</Text>
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

      {/* Overall progress */}
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

      {/* Task list */}
      <FlatList
        data={tasks}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.list, { padding: layout.screenPadding }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TaskItem
            task={item}
            showDate
            onToggle={() => toggleTask(item.id)}
            onDelete={() => handleDelete(item)}
            onEdit={() => setEditingTask(item)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="book-outline"
            title="No Tasks Yet"
            subtitle="Create your first study plan to get started."
          />
        }
      />

      {/* Add Task Modal */}
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

      {/* Edit Plan Modal */}
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
                : {
                    title: currentPlanTitle,
                  }
            }
            onSubmit={handleEditPlan}
            onCancel={() => setShowEditPlanModal(false)}
            submitLabel="Save Changes"
          />
        </View>
      </Modal>

      {/* Edit Task Modal */}
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
  editBtnText: {
    fontSize: 18,
    color: Colors.primary,
    lineHeight: 22,
    fontWeight: FontWeight.bold,
     transform: [{ scaleX: -0.8 }],
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
