import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { haptics } from "../../lib/haptics";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/auth";
import {
  getRitualsCount,
  getJourneysCount,
  getAmbitionsCount,
  getTodayStats,
  createRituals,
  generateTodosForRitual,
  ensureUserSettings,
  updateStreak,
  type Ritual,
} from "../../lib/db";
import { getStreakPersonality } from "../../lib/types";

// Category definitions
const CATEGORIES = [
  { id: "personal_care", emoji: "🪥", label: "Personal Care" },
  { id: "health", emoji: "💪", label: "Health & Body" },
  { id: "learning", emoji: "🧠", label: "Learn Something" },
  { id: "money", emoji: "💰", label: "Money & Finance" },
  { id: "home", emoji: "🏠", label: "Home & Life" },
  { id: "relationships", emoji: "❤️", label: "Relationships" },
  { id: "wellbeing", emoji: "😌", label: "Mind & Wellbeing" },
  { id: "custom", emoji: "✨", label: "Add my own" },
];

// Pre-built items for each category
const CATEGORY_ITEMS: Record<string, { id: string; emoji: string; label: string; defaultFrequency: string; defaultDay: string | null }[]> = {
  personal_care: [
    { id: "nails", emoji: "✂️", label: "Cut nails", defaultFrequency: "every_2_weeks", defaultDay: "sun" },
    { id: "haircut", emoji: "💇", label: "Haircut", defaultFrequency: "monthly", defaultDay: "sat" },
    { id: "beard", emoji: "🪒", label: "Shave / trim beard", defaultFrequency: "every_3_days", defaultDay: null },
    { id: "moisturise", emoji: "🧴", label: "Moisturise skin", defaultFrequency: "daily", defaultDay: null },
    { id: "dental", emoji: "🦷", label: "Dental checkup", defaultFrequency: "every_6_months", defaultDay: null },
    { id: "eye", emoji: "👁️", label: "Eye checkup", defaultFrequency: "yearly", defaultDay: null },
    { id: "toothbrush", emoji: "🪥", label: "New toothbrush", defaultFrequency: "every_3_months", defaultDay: null },
    { id: "wash_hair", emoji: "🚿", label: "Wash hair", defaultFrequency: "every_2_days", defaultDay: null },
  ],
  health: [
    { id: "walk", emoji: "🚶", label: "Morning walk / run", defaultFrequency: "daily", defaultDay: null },
    { id: "water", emoji: "💧", label: "Drink 8 glasses water", defaultFrequency: "daily", defaultDay: null },
    { id: "vitamins", emoji: "💊", label: "Take vitamins", defaultFrequency: "daily", defaultDay: null },
    { id: "sleep", emoji: "😴", label: "Sleep by 11pm", defaultFrequency: "daily", defaultDay: null },
    { id: "workout", emoji: "🏋️", label: "Workout", defaultFrequency: "every_2_days", defaultDay: null },
    { id: "weigh", emoji: "⚖️", label: "Weigh myself", defaultFrequency: "weekly", defaultDay: "mon" },
    { id: "bp", emoji: "🩺", label: "Blood pressure check", defaultFrequency: "monthly", defaultDay: null },
    { id: "checkup", emoji: "🏥", label: "Full body checkup", defaultFrequency: "yearly", defaultDay: null },
    { id: "no_phone", emoji: "📵", label: "No phone after 10pm", defaultFrequency: "daily", defaultDay: null },
  ],
  learning: [
    { id: "coding", emoji: "💻", label: "Learn a coding skill", defaultFrequency: "daily", defaultDay: null },
    { id: "reading", emoji: "📚", label: "Read books", defaultFrequency: "daily", defaultDay: null },
    { id: "language", emoji: "🌍", label: "Learn a language", defaultFrequency: "daily", defaultDay: null },
    { id: "tutorial", emoji: "▶️", label: "Watch a tutorial", defaultFrequency: "daily", defaultDay: null },
    { id: "instrument", emoji: "🎸", label: "Practice instrument", defaultFrequency: "daily", defaultDay: null },
    { id: "podcast", emoji: "🎙️", label: "Listen to podcast", defaultFrequency: "weekly", defaultDay: null },
  ],
  money: [
    { id: "expenses", emoji: "📝", label: "Track daily expenses", defaultFrequency: "daily", defaultDay: null },
    { id: "savings", emoji: "🏦", label: "Transfer to savings", defaultFrequency: "weekly", defaultDay: "mon" },
    { id: "budget", emoji: "📊", label: "Review monthly budget", defaultFrequency: "monthly", defaultDay: null },
    { id: "bills", emoji: "🧾", label: "Pay credit card bill", defaultFrequency: "monthly", defaultDay: null },
    { id: "investments", emoji: "📈", label: "Check investments", defaultFrequency: "monthly", defaultDay: null },
    { id: "subscriptions", emoji: "🔄", label: "Review subscriptions", defaultFrequency: "every_6_months", defaultDay: null },
  ],
  home: [
    { id: "clean", emoji: "🧹", label: "Clean room / house", defaultFrequency: "weekly", defaultDay: "sun" },
    { id: "laundry", emoji: "👕", label: "Do laundry", defaultFrequency: "weekly", defaultDay: "sat" },
    { id: "groceries", emoji: "🛒", label: "Grocery shopping", defaultFrequency: "weekly", defaultDay: "sat" },
    { id: "bedsheets", emoji: "🛏️", label: "Change bedsheets", defaultFrequency: "every_2_weeks", defaultDay: "sun" },
    { id: "backup", emoji: "📱", label: "Back up phone", defaultFrequency: "monthly", defaultDay: null },
    { id: "car", emoji: "🚗", label: "Car service", defaultFrequency: "every_6_months", defaultDay: null },
  ],
  relationships: [
    { id: "parents", emoji: "📞", label: "Call parents", defaultFrequency: "weekly", defaultDay: "sun" },
    { id: "friends", emoji: "👋", label: "Check in with a friend", defaultFrequency: "weekly", defaultDay: null },
    { id: "date_night", emoji: "❤️", label: "Date night", defaultFrequency: "monthly", defaultDay: null },
    { id: "journal", emoji: "📓", label: "Write in journal", defaultFrequency: "daily", defaultDay: null },
    { id: "family", emoji: "🏠", label: "Family dinner", defaultFrequency: "weekly", defaultDay: "sun" },
  ],
  wellbeing: [
    { id: "meditate", emoji: "🧘", label: "Meditate", defaultFrequency: "daily", defaultDay: null },
    { id: "reflect", emoji: "✍️", label: "Journal / reflect", defaultFrequency: "daily", defaultDay: null },
    { id: "detox", emoji: "🌿", label: "Digital detox evening", defaultFrequency: "weekly", defaultDay: "sun" },
    { id: "gratitude", emoji: "🙏", label: "Gratitude practice", defaultFrequency: "daily", defaultDay: null },
    { id: "read_bed", emoji: "📖", label: "Read before bed", defaultFrequency: "daily", defaultDay: null },
  ],
};

const FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "every_2_days", label: "Every 2 days" },
  { value: "every_3_days", label: "Every 3 days" },
  { value: "weekly", label: "Weekly" },
  { value: "every_2_weeks", label: "Every 2 weeks" },
  { value: "monthly", label: "Monthly" },
  { value: "every_3_months", label: "Every 3 months" },
  { value: "every_6_months", label: "Every 6 months" },
  { value: "yearly", label: "Yearly" },
];

const DAYS = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" },
];

const TIMES = [
  { value: "morning", label: "Morning", emoji: "🌅" },
  { value: "afternoon", label: "Afternoon", emoji: "☀️" },
  { value: "evening", label: "Evening", emoji: "🌙" },
  { value: "anytime", label: "Anytime", emoji: "📌" },
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  component?: "categories" | "checklist" | "custom-input" | "frequency-picker" | "day-picker" | "time-picker" | "review" | "success";
}

interface SelectedItem {
  id: string;
  emoji: string;
  label: string;
  frequency: string;
  day: string | null;
  time: string | null;
  why: string;
}

export default function PilotScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  // State
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [customItemText, setCustomItemText] = useState("");
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [reviewItems, setReviewItems] = useState<SelectedItem[]>([]);
  const [currentCustomItem, setCurrentCustomItem] = useState<{ label: string; frequency: string; day: string | null; time: string | null } | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [streakDays, setStreakDays] = useState(0);

  // Initialize
  useEffect(() => {
    checkFirstTime();
  }, [user]);

  const checkFirstTime = async () => {
    if (!user) {
      // Demo mode - show first time flow
      setIsFirstTime(true);
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: "Hey! I'm Pilot, your life co-pilot 🙌\nLet's set up your life in a few taps.\nWhat do you want to stay on top of first?",
        component: "categories",
      }]);
      return;
    }

    try {
      const ritualsCount = await getRitualsCount(user.id);
      const journeysCount = await getJourneysCount(user.id);
      const ambitionsCount = await getAmbitionsCount(user.id);

      if (ritualsCount === 0 && journeysCount === 0 && ambitionsCount === 0) {
        setIsFirstTime(true);
        setMessages([{
          id: "welcome",
          role: "assistant",
          content: "Hey! I'm Pilot, your life co-pilot 🙌\nLet's set up your life in a few taps.\nWhat do you want to stay on top of first?",
          component: "categories",
        }]);
      } else {
        setIsFirstTime(false);
        setStreakDays(await updateStreak(user.id));
        const stats = await getTodayStats(user.id);
        setMessages([{
          id: "welcome-back",
          role: "assistant",
          content: `Hey! ${getStreakPersonality(stats.completed > 0 ? stats.completed : streakDays)}\nYou've nailed ${stats.completed} of ${stats.total} things today.`,
        }]);
      }
    } catch (error) {
      console.error("Error checking first time:", error);
      setIsFirstTime(true);
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: "Hey! I'm Pilot, your life co-pilot 🙌\nLet's set up your life in a few taps.\nWhat do you want to stay on top of first?",
        component: "categories",
      }]);
    }
  };

  const formatFrequencyLabel = (freq: string): string => {
    const found = FREQUENCIES.find(f => f.value === freq);
    return found?.label || freq;
  };

  // Handle category selection
  const handleCategoryPress = (categoryId: string) => {
    haptics.light();
    console.log('Selected category id:', categoryId);
    console.log('Items found:', CATEGORY_ITEMS[categoryId]);

    if (categoryId === "custom") {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: "What do you want to add?",
        component: "custom-input",
      }]);
      return;
    }

    setSelectedCategory(categoryId);
    setSelectedItems(new Set());

    // Add checklist message
    const categoryLabel = CATEGORIES.find(c => c.id === categoryId)?.label || "";
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: "assistant",
      content: `Pick what applies to you from ${categoryLabel}:`,
      component: "checklist",
    }]);
  };

  // Handle checklist item toggle
  const handleItemToggle = (itemId: string) => {
    haptics.light();
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  // Handle custom item submit
  const handleCustomItemSubmit = () => {
    if (!customItemText.trim()) return;

    setCurrentCustomItem({
      label: customItemText.trim(),
      frequency: "daily",
      day: null,
      time: null,
    });

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: "user",
      content: customItemText.trim(),
    }, {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "How often?",
      component: "frequency-picker",
    }]);

    setCustomItemText("");
  };

  // Handle frequency selection
  const handleFrequencySelect = (freq: string) => {
    if (currentCustomItem) {
      const updated = { ...currentCustomItem, frequency: freq };
      setCurrentCustomItem(updated);

      // If weekly or longer, ask for day
      if (["weekly", "every_2_weeks", "monthly", "every_3_months", "every_6_months", "yearly"].includes(freq)) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: "assistant",
          content: "Any particular day?",
          component: "day-picker",
        }]);
      } else if (freq === "daily") {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: "assistant",
          content: "Any specific time? (optional)",
          component: "time-picker",
        }]);
      } else {
        // Go to review
        goToReview([...selectedItems.map(id => {
          const items = CATEGORY_ITEMS[selectedCategory!] || [];
          const item = items.find(i => i.id === id);
          return {
            id,
            emoji: item?.emoji || "📌",
            label: item?.label || "",
            frequency: item?.defaultFrequency || "daily",
            day: item?.defaultDay || null,
            time: null,
            why: "",
          };
        }), { id: "custom", emoji: "✨", label: updated.label, frequency: updated.frequency, day: updated.day, time: updated.time, why: "" }]);
      }
    }
  };

  // Handle day selection
  const handleDaySelect = (day: string) => {
    if (currentCustomItem) {
      const updated = { ...currentCustomItem, day };
      setCurrentCustomItem(updated);

      if (currentCustomItem.frequency === "daily") {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: "assistant",
          content: "Any specific time? (optional)",
          component: "time-picker",
        }]);
      } else {
        goToReview([...Array.from(selectedItems).map(id => {
          const items = CATEGORY_ITEMS[selectedCategory!] || [];
          const item = items.find(i => i.id === id);
          return {
            id,
            emoji: item?.emoji || "📌",
            label: item?.label || "",
            frequency: item?.defaultFrequency || "weekly",
            day: item?.defaultDay || null,
            time: null,
            why: "",
          };
        }), { id: "custom", emoji: "✨", label: currentCustomItem.label, frequency: currentCustomItem.frequency, day, time: null, why: "" }]);
      }
    }
  };

  // Handle time selection
  const handleTimeSelect = (time: string) => {
    if (currentCustomItem) {
      const timeMap: Record<string, string> = {
        morning: "08:00",
        afternoon: "14:00",
        evening: "20:00",
        anytime: null,
      };

      goToReview([...Array.from(selectedItems).map(id => {
        const items = CATEGORY_ITEMS[selectedCategory!] || [];
        const item = items.find(i => i.id === id);
        return {
          id,
          emoji: item?.emoji || "📌",
          label: item?.label || "",
          frequency: item?.defaultFrequency || "daily",
          day: item?.defaultDay || null,
          time: null,
          why: "",
        };
      }), { id: "custom", emoji: "✨", label: currentCustomItem.label, frequency: currentCustomItem.frequency, day: null, time: timeMap[time], why: "" }]);
    }
  };

  // Go to review screen
  const goToReview = (items: SelectedItem[]) => {
    setReviewItems(items);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: "assistant",
      content: "Here's what I'll set up for you — change anything that feels off:",
      component: "review",
    }]);
  };

  // Handle done button from checklist
  const handleDonePress = () => {
    const items = Array.from(selectedItems).map(id => {
      const categoryItems = CATEGORY_ITEMS[selectedCategory!] || [];
      const item = categoryItems.find(i => i.id === id);
      return {
        id,
        emoji: item?.emoji || "📌",
        label: item?.label || "",
        frequency: item?.defaultFrequency || "weekly",
        day: item?.defaultDay || null,
        time: null,
        why: "",
      };
    });

    if (items.length > 0) {
      goToReview(items);
    }
  };

  // Handle remove item from review
  const handleRemoveItem = (id: string) => {
    setReviewItems(prev => prev.filter(item => item.id !== id));
  };

  // Handle item change in review
  const handleItemChange = (id: string, field: string, value: string) => {
    setReviewItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // Save all rituals
  const handleSaveRituals = async () => {
    if (!user) {
      // Demo mode - just show success
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: "You're all set! I've added your rituals to your life.\n\nWant to set up a learning journey or an ambition next?",
        component: "success",
      }]);
      return;
    }

    setIsLoading(true);
    try {
      console.log('Current user:', user.id);

      // Create rituals
      const ritualsToSave = reviewItems.map(item => ({
        user_id: user.id,
        title: item.label,
        category: selectedCategory || "custom",
        frequency: item.frequency as any,
        preferred_day: item.day as any,
        preferred_time: item.time,
        why: item.why || null,
        is_paused: false,
        pause_until: null,
        emoji: item.emoji,
      }));

      console.log('Saving rituals:', JSON.stringify(ritualsToSave));

      // Check if rituals table exists
      const { data: tableCheck, error: tableError } = await supabase
        .from('rituals')
        .select('count', { count: 'exact', head: true });
      console.log('Rituals table check:', { tableCheck, tableError });

      const createdRituals = await createRituals(ritualsToSave);
      console.log('Rituals saved successfully:', createdRituals.length);

      // Generate todos for each ritual
      for (const ritual of createdRituals) {
        const todos = await generateTodosForRitual(ritual, 30);
        console.log(`Generated ${todos.length} todos for ritual: ${ritual.title}`);
      }

      const stats = await getTodayStats(user.id);
      console.log('Today stats:', stats);

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: `You're all set! I've added ${rituals.length} rituals to your life.\n\nCheck your Today tab — ${stats.total} things are already waiting for you today. 🎉\n\nWant to set up a learning journey or a big ambition next?`,
        component: "success",
      }]);

      setReviewItems([]);
    } catch (error) {
      console.error("Error saving rituals:", error);
    }
    setIsLoading(false);
  };

  // Regular chat handle send
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: "user",
      content: text,
    }]);
    setInputText("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "That's a great question. Tell you what — use the '+ Add more' button to set up something new to track, and I'll help you stay on top of it.",
      }]);
      setIsLoading(false);
    }, 1000);
  };

  // Render message
  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageContainer, item.role === "user" && styles.userMessageContainer]}>
      {item.role === "assistant" && (
        <View style={styles.pilotAvatar}>
          <Text style={styles.pilotAvatarText}>✦</Text>
        </View>
      )}
      <View style={[styles.messageBubble, item.role === "user" ? styles.userBubble : styles.assistantBubble]}>
        <Text style={styles.messageText}>{item.content}</Text>

        {/* Category Grid Component */}
        {item.component === "categories" && (
          <View style={styles.categoryGrid}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(cat.id)}
              >
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text style={styles.categoryLabel}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Checklist Component */}
        {item.component === "checklist" && selectedCategory && (
          <View style={styles.checklistContainer}>
            {CATEGORY_ITEMS[selectedCategory]?.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.checklistItem}
                onPress={() => handleItemToggle(item.id)}
              >
                <View style={[styles.checkbox, selectedItems.has(item.id) && styles.checkboxChecked]}>
                  {selectedItems.has(item.id) && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.itemEmoji}>{item.emoji}</Text>
                <View style={styles.itemContent}>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                  <Text style={styles.itemFrequency}>{formatFrequencyLabel(item.defaultFrequency)}</Text>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.addMoreButton}
              onPress={() => handleCategoryPress("custom")}
            >
              <Text style={styles.addMoreText}>+ Add something else under this category</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.doneButton, selectedItems.size === 0 && styles.doneButtonDisabled]}
              onPress={handleDonePress}
              disabled={selectedItems.size === 0}
            >
              <Text style={styles.doneButtonText}>Done — review these →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Custom Input Component */}
        {item.component === "custom-input" && (
          <View style={styles.customInputContainer}>
            <TextInput
              style={styles.customInput}
              placeholder="What do you want to add?"
              placeholderTextColor="#5A5A5A"
              value={customItemText}
              onChangeText={setCustomItemText}
              onSubmitEditing={handleCustomItemSubmit}
            />
            <TouchableOpacity
              style={[styles.customSubmitButton, !customItemText.trim() && styles.customSubmitDisabled]}
              onPress={handleCustomItemSubmit}
              disabled={!customItemText.trim()}
            >
              <Text style={styles.customSubmitText}>→</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Frequency Picker Component */}
        {item.component === "frequency-picker" && (
          <View style={styles.pickerContainer}>
            {FREQUENCIES.map(freq => (
              <TouchableOpacity
                key={freq.value}
                style={styles.pickerChip}
                onPress={() => handleFrequencySelect(freq.value)}
              >
                <Text style={styles.pickerChipText}>{freq.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Day Picker Component */}
        {item.component === "day-picker" && (
          <View style={styles.pickerContainer}>
            {DAYS.map(day => (
              <TouchableOpacity
                key={day.value}
                style={styles.pickerChip}
                onPress={() => handleDaySelect(day.value)}
              >
                <Text style={styles.pickerChipText}>{day.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Time Picker Component */}
        {item.component === "time-picker" && (
          <View style={styles.pickerContainer}>
            {TIMES.map(time => (
              <TouchableOpacity
                key={time.value}
                style={styles.pickerChip}
                onPress={() => handleTimeSelect(time.value)}
              >
                <Text style={styles.pickerChipText}>{time.emoji} {time.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Review Component */}
        {item.component === "review" && (
          <View style={styles.reviewContainer}>
            {reviewItems.map(item => (
              <View key={item.id} style={styles.reviewItem}>
                <View style={styles.reviewItemHeader}>
                  <Text style={styles.reviewItemEmoji}>{item.emoji}</Text>
                  <Text style={styles.reviewItemLabel}>{item.label}</Text>
                  <TouchableOpacity onPress={() => handleRemoveItem(item.id)}>
                    <Text style={styles.removeButton}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.frequencyChips}>
                  {FREQUENCIES.slice(0, 5).map(freq => (
                    <TouchableOpacity
                      key={freq.value}
                      style={[styles.freqChip, item.frequency === freq.value && styles.freqChipActive]}
                      onPress={() => handleItemChange(item.id, "frequency", freq.value)}
                    >
                      <Text style={[styles.freqChipText, item.frequency === freq.value && styles.freqChipTextActive]}>
                        {freq.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {["weekly", "every_2_weeks", "monthly", "every_3_months", "every_6_months", "yearly"].includes(item.frequency) && (
                  <View style={styles.daySelector}>
                    {DAYS.map(day => (
                      <TouchableOpacity
                        key={day.value}
                        style={[styles.dayChip, item.day === day.value && styles.dayChipActive]}
                        onPress={() => handleItemChange(item.id, "day", day.value)}
                      >
                        <Text style={[styles.dayChipText, item.day === day.value && styles.dayChipTextActive]}>
                          {day.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {item.frequency === "daily" && (
                  <View style={styles.timeSelector}>
                    {TIMES.map(time => (
                      <TouchableOpacity
                        key={time.value}
                        style={[styles.timeChip, item.time && (time.value === "morning" && item.time === "08:00" || time.value === "afternoon" && item.time === "14:00" || time.value === "evening" && item.time === "20:00" || time.value === "anytime" && !item.time) && styles.timeChipActive]}
                        onPress={() => {
                          const timeMap: Record<string, string | null> = {
                            morning: "08:00",
                            afternoon: "14:00",
                            evening: "20:00",
                            anytime: null,
                          };
                          handleItemChange(item.id, "time", timeMap[time.value] || "");
                        }}
                      >
                        <Text style={styles.timeChipText}>{time.emoji} {time.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <TextInput
                  style={styles.whyInput}
                  placeholder="Why does this matter to you? (optional)"
                  placeholderTextColor="#5A5A5A"
                  value={item.why}
                  onChangeText={(text) => handleItemChange(item.id, "why", text)}
                />
              </View>
            ))}

            <TouchableOpacity
              style={[styles.looksGoodButton, isLoading && styles.looksGoodButtonDisabled]}
              onPress={handleSaveRituals}
              disabled={isLoading}
            >
              <Text style={styles.looksGoodText}>Looks good — let's go! ✓</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Success Component */}
        {item.component === "success" && (
          <View style={styles.successButtonsContainer}>
            <TouchableOpacity
              style={styles.successButton}
              onPress={() => router.push("/today")}
            >
              <Text style={styles.successButtonText}>Set up a learning journey</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.successButton, styles.successButtonSecondary]}
              onPress={() => {}}
            >
              <Text style={styles.successButtonTextSecondary}>I'm good for now</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  // First time render
  if (isFirstTime) {
    return (
      <LinearGradient colors={["#0A0A0A", "#111111"]} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>✦ Pilot</Text>
        </View>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />

        {/* Add more button for first time users */}
        <TouchableOpacity
          style={styles.addMoreChip}
          onPress={() => setShowCategoryModal(true)}
        >
          <Text style={styles.addMoreChipText}>+ Add more</Text>
        </TouchableOpacity>

        {/* Category Modal */}
        <Modal
          visible={showCategoryModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCategoryModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>What do you want to add?</Text>
                <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={styles.categoryCard}
                    onPress={() => {
                      setShowCategoryModal(false);
                      handleCategoryPress(cat.id);
                    }}
                  >
                    <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                    <Text style={styles.categoryLabel}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    );
  }

  // Regular chat render for returning users
  return (
    <LinearGradient colors={["#0A0A0A", "#111111"]} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>✦ Pilot</Text>
          <TouchableOpacity
            style={styles.addMoreButtonHeader}
            onPress={() => setShowCategoryModal(true)}
          >
            <Text style={styles.addMoreButtonHeaderText}>+ Add more</Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />

        {isLoading && (
          <View style={styles.typingContainer}>
            <Text style={styles.typingText}>Pilot is typing...</Text>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Message Pilot..."
            placeholderTextColor="#5A5A5A"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            onSubmitEditing={() => handleSend()}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            <Text style={styles.sendButtonText}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Category Modal */}
        <Modal
          visible={showCategoryModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCategoryModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>What do you want to add?</Text>
                <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={styles.categoryCard}
                    onPress={() => {
                      setShowCategoryModal(false);
                      handleCategoryPress(cat.id);
                    }}
                  >
                    <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                    <Text style={styles.categoryLabel}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  addMoreButtonHeader: {
    backgroundColor: "#141414",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  addMoreButtonHeaderText: {
    color: "#7C3AED",
    fontSize: 14,
    fontWeight: "500",
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  messageContainer: {
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  userMessageContainer: {
    justifyContent: "flex-end",
  },
  pilotAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  pilotAvatarText: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  messageBubble: {
    maxWidth: "85%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  assistantBubble: {
    backgroundColor: "#141414",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  userBubble: {
    backgroundColor: "#7C3AED",
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: "#FFFFFF",
    lineHeight: 24,
  },
  typingContainer: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  typingText: {
    fontSize: 14,
    color: "#5A5A5A",
    fontStyle: "italic",
  },
  // Category Grid
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 16,
    gap: 8,
  },
  categoryCard: {
    width: "47%",
    backgroundColor: "#141414",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  categoryEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "500",
    textAlign: "center",
  },
  // Checklist
  checklistContainer: {
    marginTop: 12,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#5A5A5A",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  itemEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 15,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  itemFrequency: {
    fontSize: 12,
    color: "#9A9A9A",
    marginTop: 2,
  },
  addMoreButton: {
    paddingVertical: 16,
  },
  addMoreText: {
    color: "#7C3AED",
    fontSize: 14,
    fontWeight: "500",
  },
  doneButton: {
    backgroundColor: "#7C3AED",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  doneButtonDisabled: {
    backgroundColor: "#2A2A2A",
  },
  doneButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  // Custom Input
  customInputContainer: {
    flexDirection: "row",
    marginTop: 12,
    alignItems: "flex-end",
  },
  customInput: {
    flex: 1,
    backgroundColor: "#141414",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  customSubmitButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  customSubmitDisabled: {
    backgroundColor: "#2A2A2A",
  },
  customSubmitText: {
    fontSize: 20,
    color: "#FFFFFF",
  },
  // Pickers
  pickerContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    gap: 8,
  },
  pickerChip: {
    backgroundColor: "#141414",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  pickerChipText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  // Review
  reviewContainer: {
    marginTop: 16,
  },
  reviewItem: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  reviewItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  reviewItemEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  reviewItemLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  removeButton: {
    fontSize: 18,
    color: "#EF4444",
    padding: 4,
  },
  frequencyChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  freqChip: {
    backgroundColor: "#141414",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  freqChipActive: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
  },
  freqChipText: {
    fontSize: 12,
    color: "#9A9A9A",
  },
  freqChipTextActive: {
    color: "#FFFFFF",
  },
  daySelector: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  dayChip: {
    width: 40,
    height: 32,
    backgroundColor: "#141414",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  dayChipActive: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
  },
  dayChipText: {
    fontSize: 12,
    color: "#9A9A9A",
  },
  dayChipTextActive: {
    color: "#FFFFFF",
  },
  timeSelector: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  timeChip: {
    backgroundColor: "#141414",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  timeChipActive: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
  },
  timeChipText: {
    fontSize: 12,
    color: "#9A9A9A",
  },
  whyInput: {
    backgroundColor: "#141414",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    marginTop: 8,
  },
  looksGoodButton: {
    backgroundColor: "#10B981",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  looksGoodButtonDisabled: {
    backgroundColor: "#2A2A2A",
  },
  looksGoodText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  // Success buttons
  successButtonsContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  successButton: {
    flex: 1,
    backgroundColor: "#7C3AED",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  successButtonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  successButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  successButtonTextSecondary: {
    color: "#9A9A9A",
    fontSize: 14,
    fontWeight: "500",
  },
  // Add more chip
  addMoreChip: {
    alignSelf: "center",
    backgroundColor: "#141414",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    marginBottom: 16,
  },
  addMoreChipText: {
    color: "#7C3AED",
    fontSize: 14,
    fontWeight: "500",
  },
  // Input
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#2A2A2A",
    backgroundColor: "#0A0A0A",
  },
  input: {
    flex: 1,
    backgroundColor: "#141414",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: "#FFFFFF",
    maxHeight: 100,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: "#2A2A2A",
  },
  sendButtonText: {
    fontSize: 20,
    color: "#FFFFFF",
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#0A0A0A",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  modalClose: {
    fontSize: 24,
    color: "#9A9A9A",
    padding: 4,
  },
});