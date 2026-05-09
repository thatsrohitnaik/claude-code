import { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useAppStore } from "../../src/store";
import { useAuth } from "../../context/auth";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const suggestions = [
  "What should I focus on today?",
  "Am I on track this week?",
  "Suggest resources for my goals",
];

export default function ChatScreen() {
  const router = useRouter();
  const { userName } = useAppStore();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hi! I'm Pilot, your life co-pilot. How can I help you today?",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const showSuggestions = messages.length < 3;

  const handleSend = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!text) setInputText("");
    setIsLoading(true);

    try {
      // Call the API - in production this would be a real API call
      // For now, simulate the API call
      const response = await fetch("http://localhost:4000/trpc/ai.chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          json: {
            message: messageText,
            history: messages.map(m => ({ role: m.role, content: m.content })),
          },
        }),
      });

      // If API is not available, use fallback
      let aiResponse: string;
      if (response.ok) {
        const data = await response.json();
        aiResponse = data.result?.data?.json?.response || getFallbackResponse(messageText);
      } else {
        aiResponse = getFallbackResponse(messageText);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      // Fallback response when API is not available
      const fallbackResponse = getFallbackResponse(messageText);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: fallbackResponse,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }

    setIsLoading(false);
  };

  const getFallbackResponse = (message: string): string => {
    const lower = message.toLowerCase();
    if (lower.includes("goal") || lower.includes("goals")) {
      return "You're working on 3 active goals: Learn system design (45%), Run 5k (60%), Read 12 books this year (25%). The reading goal is falling behind — you need to finish roughly 1 book every 2.5 weeks to hit your target. Which one do you want to focus on?";
    }
    if (lower.includes("task") || lower.includes("todo")) {
      return "You have 3 tasks for today. 1 is done, 2 pending. The highest priority is the system design study session — it's tied to your career goal and you're already 45% through.";
    }
    if (lower.includes("progress") || lower.includes("streak") || lower.includes("track")) {
      return "You're on a 7-day streak — impressive! Week completion is at 65%. Your career goal is at 45% (on track), fitness at 60% (on track), and reading at 25% (at risk). Want me to help recalibrate the reading goal?";
    }
    if (lower.includes("resource") || lower.includes("learn") || lower.includes("study")) {
      return "For system design, watch Alex Xu's System Design Interview playlist on YouTube — 4 hours, covers exactly what interviewers test. Start with the URL shortener video. Then grab 'Designing Data-Intensive Applications' by Martin Kleppmann — it's the gold standard.";
    }
    if (lower.includes("help") || lower.includes("what can") || lower.includes("what should")) {
      return "I can help you: track progress on your 3 goals, prioritize today's tasks, suggest specific learning resources, or create a weekly plan. What do you need most right now?";
    }
    return "I'm here to help you hit your goals. Ask me about your progress, what to focus on next, or get specific resource recommendations. What's on your mind?";
  };

  const handleSuggestionPress = (suggestion: string) => {
    handleSend(suggestion);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageContainer, item.role === "user" && styles.userMessageContainer]}>
      <View style={[styles.messageBubble, item.role === "user" ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.messageText, item.role === "user" && styles.userMessageText]}>
          {item.content}
        </Text>
      </View>
    </View>
  );

  return (
    <LinearGradient colors={["#0D0D0D", "#111111"]} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.pilotIcon}>✦</Text>
            <Text style={styles.title}>Pilot</Text>
          </View>
          <View style={styles.headerRight} />
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

        {/* Quick Suggestions */}
        {showSuggestions && (
          <View style={styles.suggestionsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsScroll}>
              {suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionChip}
                  onPress={() => handleSuggestionPress(suggestion)}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer} importantForAutofill="no">
          <TextInput
            style={styles.input}
            placeholder="Message Pilot..."
            placeholderTextColor="#6B7280"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            spellCheck={false}
            dataDetectorTypes="none"
            onSubmitEditing={() => handleSend()}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={() => handleSend()}
            disabled={!inputText.trim() || isLoading}
          >
            <Text style={styles.sendButtonText}>→</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0D",
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    fontSize: 28,
    color: "#FFFFFF",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
  },
  pilotIcon: {
    fontSize: 20,
    color: "#6366F1",
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  headerRight: {
    width: 40,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  messageContainer: {
    marginBottom: 12,
    flexDirection: "row",
  },
  userMessageContainer: {
    justifyContent: "flex-end",
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  assistantBubble: {
    backgroundColor: "#1F2937",
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: "#6366F1",
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: "#FFFFFF",
    lineHeight: 22,
  },
  userMessageText: {
    color: "#FFFFFF",
  },
  typingContainer: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  typingText: {
    fontSize: 14,
    color: "#6B7280",
    fontStyle: "italic",
  },
  suggestionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  suggestionsScroll: {
    gap: 8,
    flexDirection: "row",
  },
  suggestionChip: {
    backgroundColor: "#1F2937",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#374151",
  },
  suggestionText: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#374151",
    backgroundColor: "#0D0D0D",
  },
  input: {
    flex: 1,
    backgroundColor: "#1F2937",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: "#FFFFFF",
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: "#374151",
  },
  sendButtonText: {
    fontSize: 20,
    color: "#FFFFFF",
  },
});