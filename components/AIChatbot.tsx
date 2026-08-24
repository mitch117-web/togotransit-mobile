import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Modal
} from 'react-native'
import { useTheme } from '../lib/theme'
import api from '../lib/api'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollViewRef = useRef<ScrollView>(null)
  const { colors, isDark, toggleTheme } = useTheme()

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await api.post('/ai/chat', { message: input })
      if (response.data.message) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.data.message,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, aiMessage])
      }
    } catch (error) {
      console.error('Chat error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Floating Button */}
      <TouchableOpacity
        style={[styles.floatingBtn, { backgroundColor: colors.primary }]}
        onPress={() => setIsOpen(true)}
      >
        <Text style={styles.floatingBtnText}>💬</Text>
      </TouchableOpacity>

      {/* Chat Modal */}
      <Modal visible={isOpen} animationType="slide">
        <KeyboardAvoidingView
          style={[styles.container, { backgroundColor: colors.surfaceContainerLow }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.primary }]}>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => setIsOpen(false)}
            >
              <Text style={styles.headerBtnText}>✕</Text>
            </TouchableOpacity>
            <View style={styles.headerTitle}>
              <Text style={styles.headerEmoji}>🚚</Text>
              <Text style={[styles.headerText, { color: colors.onPrimary }]}>
                TogoTransit AI
              </Text>
            </View>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={toggleTheme}
            >
              <Text style={styles.headerBtnText}>{isDark ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
          >
            {messages.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>👋</Text>
                <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
                  Bonjour !
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.onSurfaceVariant }]}>
                  Je suis votre assistant TogoTransit. Posez-moi toutes vos questions sur vos colis et livraisons !
                </Text>
                <View style={styles.suggestionsContainer}>
                  <QuickSuggestion text="Réserver un voyage" onClick={() => setInput("Je veux réserver un voyage")} />
                  <QuickSuggestion text="Envoyer un colis" onClick={() => setInput("Comment envoyer un colis ?")} />
                  <QuickSuggestion text="Suivre un colis" onClick={() => setInput("Je veux suivre mon colis")} />
                  <QuickSuggestion text="Voir les trajets" onClick={() => setInput("Quels sont les trajets disponibles ?")} />
                  <QuickSuggestion text="Tarifs livraison" onClick={() => setInput("Quels sont vos tarifs de livraison ?")} />
                </View>
              </View>
            ) : (
              messages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.messageRow,
                    msg.role === 'user' ? styles.userRow : styles.aiRow
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      msg.role === 'user'
                        ? [styles.userBubble, { backgroundColor: colors.primary }]
                        : [styles.aiBubble, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        msg.role === 'user'
                          ? { color: colors.onPrimary }
                          : { color: colors.onSurface }
                      ]}
                    >
                      {msg.content}
                    </Text>
                    <Text
                      style={[
                        styles.messageTime,
                        {
                          color: msg.role === 'user'
                            ? `${colors.onPrimary}80`
                            : `${colors.onSurfaceVariant}80`
                        }
                      ]}
                    >
                      {msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
              ))
            )}
            {isLoading && (
              <View style={[styles.messageRow, styles.aiRow]}>
                <View style={[styles.messageBubble, styles.aiBubble, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
                  <View style={styles.loadingDots}>
                    <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                    <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                    <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input */}
          <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.outlineVariant }]}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceContainer, color: colors.onSurface }]}
              value={input}
              onChangeText={setInput}
              placeholder="Posez votre question..."
              placeholderTextColor={colors.onSurfaceVariant}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: input.trim() && !isLoading ? colors.primary : colors.outlineVariant }]}
              onPress={sendMessage}
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={styles.sendBtnText}>➤</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  )
}

function QuickSuggestion({ text, onClick }: { text: string, onClick: () => void }) {
  const { colors } = useTheme()
  return (
    <TouchableOpacity
      onPress={onClick}
      style={[styles.suggestion, { backgroundColor: colors.surfaceContainer, borderColor: colors.outlineVariant }]}
    >
      <Text style={[styles.suggestionText, { color: colors.onSurfaceVariant }]}>{text}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  floatingBtn: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 1000
  },
  floatingBtnText: {
    fontSize: 28
  },
  container: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerBtnText: {
    fontSize: 24,
    color: 'white'
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  headerEmoji: {
    fontSize: 24
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  messagesContainer: {
    flex: 1
  },
  messagesContent: {
    padding: 16
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 22
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 20,
    justifyContent: 'center'
  },
  messageRow: {
    marginBottom: 16
  },
  userRow: {
    alignItems: 'flex-end'
  },
  aiRow: {
    alignItems: 'flex-start'
  },
  messageBubble: {
    maxWidth: '85%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20
  },
  userBubble: {
    borderTopRightRadius: 4
  },
  aiBubble: {
    borderWidth: 1,
    borderTopLeftRadius: 4
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right'
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 6
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    opacity: 0.4
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
    borderTopWidth: 1
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    maxHeight: 100,
    fontSize: 16
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  sendBtnText: {
    fontSize: 20,
    color: 'white'
  },
  suggestion: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '500'
  }
})
