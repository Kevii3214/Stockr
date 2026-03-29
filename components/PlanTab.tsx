import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ChatMessage,
  OnboardingStep,
  PlanTask,
  UserPlan,
  XP_LEVELS,
  getLevelInfo,
  usePlan,
} from '../context/PlanContext';

// ─── Quick reply options ──────────────────────────────────────────────────────

const STEP_OPTIONS: Partial<Record<OnboardingStep, Array<{ label: string; value: string }>>> = {
  experience: [
    { label: '🌱 Beginner',  value: 'beginner'  },
    { label: '📈 Novice',    value: 'novice'    },
    { label: '💼 Advanced',  value: 'advanced'  },
  ],
  goal: [
    { label: '💎 Wealth Building',  value: 'wealth'      },
    { label: '🏖️ Retirement',       value: 'retirement'  },
    { label: '💸 Dividend Income',  value: 'dividend'    },
    { label: '🎯 Speculation',      value: 'speculation' },
  ],
  risk: [
    { label: '🐢 Conservative', value: 'conservative' },
    { label: '⚖️ Moderate',     value: 'moderate'     },
    { label: '🔥 Aggressive',   value: 'aggressive'   },
  ],
};

// ─── TypingIndicator ──────────────────────────────────────────────────────────

function TypingIndicator() {
  const dots = [useRef(new Animated.Value(0.3)).current,
                useRef(new Animated.Value(0.3)).current,
                useRef(new Animated.Value(0.3)).current];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.delay((dots.length - 1 - i) * 150),
        ]),
      ),
    );
    animations.forEach(a => a.start());
    return () => animations.forEach(a => a.stop());
  }, []);

  return (
    <View style={styles.typingRow}>
      <View style={styles.avatarB}>
        <Text style={styles.avatarBText}>B</Text>
      </View>
      <View style={styles.typingBubble}>
        {dots.map((dot, i) => (
          <Animated.View key={i} style={[styles.typingDot, { opacity: dot }]} />
        ))}
      </View>
    </View>
  );
}

// ─── MessageBubble ────────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowBaggio]}>
      {!isUser && (
        <View style={styles.avatarB}>
          <Text style={styles.avatarBText}>B</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBaggio]}>
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextBaggio]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

// ─── QuickReplies ─────────────────────────────────────────────────────────────

function QuickReplies({
  step,
  onSelect,
}: {
  step: OnboardingStep;
  onSelect: (label: string, value: string, step: OnboardingStep) => void;
}) {
  const options = STEP_OPTIONS[step];
  if (!options) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.quickRepliesScroll}
      contentContainerStyle={styles.quickRepliesContent}
    >
      {options.map(opt => (
        <TouchableOpacity
          key={opt.value}
          style={styles.quickReplyBtn}
          onPress={() => onSelect(opt.label, opt.value, step)}
          activeOpacity={0.75}
        >
          <Text style={styles.quickReplyText}>{opt.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ─── OnboardingChat ───────────────────────────────────────────────────────────

function OnboardingChat() {
  const { messages, chatLoading, onboardingStep, sendMessage, selectQuickReply } = usePlan();
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    sendMessage(text);
  };

  const showQuickReplies = !chatLoading && !!STEP_OPTIONS[onboardingStep];

  return (
    <View style={styles.chatContainer}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={m => m.id}
        renderItem={({ item }) => <MessageBubble message={item} />}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={chatLoading ? <TypingIndicator /> : null}
      />

      {showQuickReplies && (
        <QuickReplies step={onboardingStep} onSelect={selectQuickReply} />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={120}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder="Ask Baggio anything..."
            placeholderTextColor="#3d3d5c"
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit
          />
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            activeOpacity={0.75}
            disabled={!input.trim()}
          >
            <Text style={styles.sendBtnText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── PlanHeader ───────────────────────────────────────────────────────────────

function PlanHeader({ plan }: { plan: UserPlan }) {
  const levelInfo = getLevelInfo(plan.xpTotal);
  const nextLevel = XP_LEVELS.find(l => l.level === levelInfo.level + 1);
  const progress = nextLevel
    ? (plan.xpTotal - levelInfo.minXP) / (nextLevel.minXP - levelInfo.minXP)
    : 1;

  const barWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(barWidth, {
      toValue: Math.max(0, Math.min(1, progress)),
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View style={styles.planHeader}>
      <View style={styles.levelRow}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>Lv {plan.level} · {levelInfo.name}</Text>
        </View>
        <Text style={styles.xpText}>{plan.xpTotal} XP</Text>
      </View>
      <View style={styles.xpTrack}>
        <Animated.View
          style={[
            styles.xpFill,
            {
              width: barWidth.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      <Text style={styles.xpLabel}>
        {nextLevel ? `${nextLevel.minXP - plan.xpTotal} XP to ${nextLevel.name}` : 'Max level reached!'}
      </Text>
    </View>
  );
}

// ─── TaskCard ─────────────────────────────────────────────────────────────────

function TaskCard({ task, onComplete }: { task: PlanTask; onComplete: () => void }) {
  return (
    <View style={[styles.taskCard, task.completed && styles.taskCardDone]}>
      <TouchableOpacity
        style={[styles.taskCheck, task.completed && styles.taskCheckDone]}
        onPress={task.completed ? undefined : onComplete}
        activeOpacity={task.completed ? 1 : 0.6}
      >
        {task.completed && <Text style={styles.taskCheckMark}>✓</Text>}
      </TouchableOpacity>
      <View style={styles.taskBody}>
        <Text style={[styles.taskTitle, task.completed && styles.taskTitleDone]}>
          {task.title}
        </Text>
        <Text style={styles.taskDesc}>{task.description}</Text>
      </View>
      <View style={styles.xpBadge}>
        <Text style={styles.xpBadgeText}>+{task.xpReward} XP</Text>
      </View>
    </View>
  );
}

// ─── BaggioChatModal ──────────────────────────────────────────────────────────

function BaggioChatModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { messages, chatLoading, sendMessage } = usePlan();
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (visible && messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 150);
    }
  }, [visible, messages.length]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    sendMessage(text);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View style={styles.modalBaggioRow}>
              <View style={[styles.avatarB, styles.avatarBLarge]}>
                <Text style={[styles.avatarBText, { fontSize: 16 }]}>B</Text>
              </View>
              <View>
                <Text style={styles.modalTitle}>Baggio</Text>
                <Text style={styles.modalSubtitle}>Your investing advisor</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.modalClose} activeOpacity={0.7}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={m => m.id}
            renderItem={({ item }) => <MessageBubble message={item} />}
            contentContainerStyle={[styles.messageList, { paddingBottom: 8 }]}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={chatLoading ? <TypingIndicator /> : null}
            style={{ flex: 1 }}
          />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={20}
          >
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                value={input}
                onChangeText={setInput}
                placeholder="Ask Baggio anything..."
                placeholderTextColor="#3d3d5c"
                multiline
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={handleSend}
                blurOnSubmit
              />
              <TouchableOpacity
                style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
                onPress={handleSend}
                activeOpacity={0.75}
                disabled={!input.trim()}
              >
                <Text style={styles.sendBtnText}>↑</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
}

// ─── PlanView ─────────────────────────────────────────────────────────────────

function PlanView() {
  const { plan, tasks, completeTask, createNewPlan } = usePlan();
  const [chatOpen, setChatOpen] = useState(false);

  if (!plan) return null;

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.planScroll}
        contentContainerStyle={styles.planScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <PlanHeader plan={plan} />

        {/* Plan summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{plan.planTitle}</Text>
          <Text style={styles.summaryText}>{plan.planSummary}</Text>
        </View>

        {/* Active tasks */}
        {activeTasks.length > 0 && (
          <View style={styles.taskSection}>
            <Text style={styles.sectionLabel}>In Progress</Text>
            {activeTasks.map(task => (
              <TaskCard key={task.id} task={task} onComplete={() => completeTask(task.id)} />
            ))}
          </View>
        )}

        {/* Completed tasks */}
        {completedTasks.length > 0 && (
          <View style={styles.taskSection}>
            <Text style={styles.sectionLabel}>Completed</Text>
            {completedTasks.map(task => (
              <TaskCard key={task.id} task={task} onComplete={() => {}} />
            ))}
          </View>
        )}

        {/* New plan button */}
        <TouchableOpacity style={styles.newPlanBtn} onPress={createNewPlan} activeOpacity={0.7}>
          <Text style={styles.newPlanText}>Start a new plan</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Floating Baggio button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setChatOpen(true)}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>B</Text>
      </TouchableOpacity>

      <BaggioChatModal visible={chatOpen} onClose={() => setChatOpen(false)} />
    </View>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────

export default function PlanTab() {
  const { plan, planLoading } = usePlan();

  if (planLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingDot} />
        <Text style={styles.loadingText}>Loading your plan...</Text>
      </View>
    );
  }

  if (!plan) return <OnboardingChat />;
  return <PlanView />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#7c6af7',
  },
  loadingText: {
    color: '#7878a0',
    fontSize: 14,
  },

  // Chat container
  chatContainer: {
    flex: 1,
  },
  messageList: {
    padding: 12,
    paddingBottom: 4,
    gap: 10,
  },

  // Bubbles
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: 6,
    maxWidth: '85%',
    gap: 8,
  },
  bubbleRowUser: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  bubbleRowBaggio: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexShrink: 1,
  },
  bubbleUser: {
    backgroundColor: '#7c6af7',
    borderBottomRightRadius: 4,
  },
  bubbleBaggio: {
    backgroundColor: '#1e1e38',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextUser: {
    color: '#ffffff',
  },
  bubbleTextBaggio: {
    color: '#e0e0f0',
  },

  // Baggio avatar
  avatarB: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#7c6af722',
    borderWidth: 1,
    borderColor: '#7c6af7',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  avatarBLarge: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarBText: {
    color: '#7c6af7',
    fontSize: 12,
    fontWeight: '700',
  },

  // Typing indicator
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  typingBubble: {
    backgroundColor: '#1e1e38',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#7c6af7',
  },

  // Quick replies
  quickRepliesScroll: {
    flexShrink: 0,
    maxHeight: 52,
  },
  quickRepliesContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  quickReplyBtn: {
    backgroundColor: '#1e1e38',
    borderWidth: 1,
    borderColor: '#7c6af7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  quickReplyText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '500',
  },

  // Input row
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#22223a',
    backgroundColor: '#0d0d1a',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#12122a',
    borderWidth: 1,
    borderColor: '#22223a',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    color: '#ffffff',
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7c6af7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#3d3d5c',
  },
  sendBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },

  // Plan view
  planScroll: {
    flex: 1,
  },
  planScrollContent: {
    padding: 16,
    paddingBottom: 80,
    gap: 16,
  },

  // Plan header / XP
  planHeader: {
    gap: 8,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelBadge: {
    backgroundColor: '#1e1e38',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  levelText: {
    color: '#7c6af7',
    fontSize: 13,
    fontWeight: '600',
  },
  xpText: {
    color: '#7878a0',
    fontSize: 13,
  },
  xpTrack: {
    height: 6,
    backgroundColor: '#1e1e38',
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpFill: {
    height: 6,
    backgroundColor: '#7c6af7',
    borderRadius: 3,
  },
  xpLabel: {
    color: '#7878a0',
    fontSize: 11,
  },

  // Summary card
  summaryCard: {
    backgroundColor: '#16162a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#22223a',
    padding: 20,
    gap: 8,
  },
  summaryTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  summaryText: {
    color: '#b0b0c8',
    fontSize: 14,
    lineHeight: 20,
  },

  // Task sections
  taskSection: {
    gap: 8,
  },
  sectionLabel: {
    color: '#7878a0',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },

  // Task card
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#16162a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#22223a',
    padding: 14,
  },
  taskCardDone: {
    opacity: 0.6,
  },
  taskCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#7c6af7',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  taskCheckDone: {
    backgroundColor: '#4DED30',
    borderColor: '#4DED30',
    borderStyle: 'solid',
  },
  taskCheckMark: {
    color: '#0d0d1a',
    fontSize: 13,
    fontWeight: '700',
  },
  taskBody: {
    flex: 1,
    gap: 3,
  },
  taskTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  taskTitleDone: {
    color: '#7878a0',
  },
  taskDesc: {
    color: '#7878a0',
    fontSize: 13,
    lineHeight: 18,
  },
  xpBadge: {
    backgroundColor: '#7c6af715',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexShrink: 0,
  },
  xpBadgeText: {
    color: '#7c6af7',
    fontSize: 12,
    fontWeight: '600',
  },

  // New plan button
  newPlanBtn: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  newPlanText: {
    color: '#7878a0',
    fontSize: 14,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7c6af7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7c6af7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
  },

  // Baggio modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: {
    backgroundColor: '#0d0d1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '72%',
    borderTopWidth: 1,
    borderColor: '#22223a',
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#3d3d5c',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#22223a',
  },
  modalBaggioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalSubtitle: {
    color: '#7878a0',
    fontSize: 12,
  },
  modalClose: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    color: '#7878a0',
    fontSize: 16,
  },
});
