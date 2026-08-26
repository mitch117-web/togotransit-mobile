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
import { MessageCircle, X, Send, Bot, Package, MapPinned, Wallet, Ticket, Clock } from 'lucide-react-native'
import { useTheme } from '../lib/theme'
import { useAuth } from '../lib/auth'
import api from '../lib/api'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const SUGGESTIONS = [
  { icon: Package, text: 'Suivre un colis', prompt: 'Je veux suivre mon colis' },
  { icon: MapPinned, text: 'Trajets disponibles', prompt: 'Quels sont les trajets disponibles ?' },
  { icon: Wallet, text: 'Tarifs de livraison', prompt: 'Quels sont vos tarifs de livraison ?' },
  { icon: Ticket, text: 'Comment réserver ?', prompt: 'Comment réserver un billet ?' },
  { icon: Clock, text: "Heures d'ouverture", prompt: "Quelles sont vos heures d'ouverture ?" },
]

export default function AIChatbot() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollViewRef = useRef<ScrollView>(null)
  const { colors, isDark } = useTheme()

  // Assistant réservé aux comptes voyageur — jamais pour gestionnaire/super_admin.
  if (user && user.role !== 'voyageur') {
    return null
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const envoyer = async (texte?: string) => {
    const contenu = (texte ?? input).trim()
    if (!contenu || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: contenu,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await api.post('/ai/chat', { message: contenu })
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data?.message || "Désolé, je n'ai pas pu traiter votre demande. Réessayez.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Connexion impossible pour le moment. Vérifiez votre connexion et réessayez.",
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Bouton flottant */}
      <TouchableOpacity
        style={[styles.floatingBtn, { backgroundColor: colors.primary }]}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.85}
      >
        <MessageCircle size={26} color={colors.onPrimary} strokeWidth={2.2} />
      </TouchableOpacity>

      {/* Modal du chat */}
      <Modal visible={isOpen} animationType="slide" onRequestClose={() => setIsOpen(false)}>
        <KeyboardAvoidingView
          style={[styles.container, { backgroundColor: colors.background }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* En-tête */}
          <View style={[styles.header, { backgroundColor: colors.primary }]}>
            <View style={[styles.headerIconWrap, { backgroundColor: colors.onPrimary + '20' }]}>
              <Bot size={20} color={colors.onPrimary} strokeWidth={2.2} />
            </View>
            <View style={styles.headerTitleWrap}>
              <Text style={[styles.headerText, { color: colors.onPrimary }]}>Assistant TogoTransit</Text>
              <View style={styles.headerStatusRow}>
                <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.headerSubtext, { color: colors.onPrimary + 'cc' }]}>En ligne</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => setIsOpen(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={22} color={colors.onPrimary} />
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={[styles.emptyIconWrap, { backgroundColor: colors.primaryContainer }]}>
                  <Bot size={36} color={colors.onPrimaryContainer} strokeWidth={2} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  Bonjour {user?.prenom ? `${user.prenom}` : ''} 👋
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  Je suis l'assistant TogoTransit. Posez-moi vos questions sur vos trajets, colis, tarifs et paiements.
                </Text>
                <View style={styles.suggestionsContainer}>
                  {SUGGESTIONS.map((s) => (
                    <TouchableOpacity
                      key={s.text}
                      onPress={() => envoyer(s.prompt)}
                      style={[styles.suggestion, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      activeOpacity={0.75}
                    >
                      <s.icon size={15} color={colors.primary} strokeWidth={2.2} />
                      <Text style={[styles.suggestionText, { color: colors.text }]}>{s.text}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              messages.map((msg) => (
                <View
                  key={msg.id}
                  style={[styles.messageRow, msg.role === 'user' ? styles.userRow : styles.aiRow]}
                >
                  {msg.role === 'assistant' && (
                    <View style={[styles.avatarSmall, { backgroundColor: colors.primaryContainer }]}>
                      <Bot size={14} color={colors.onPrimaryContainer} />
                    </View>
                  )}
                  <View
                    style={[
                      styles.messageBubble,
                      msg.role === 'user'
                        ? [styles.userBubble, { backgroundColor: colors.primary }]
                        : [styles.aiBubble, { backgroundColor: colors.surface, borderColor: colors.border }]
                    ]}
                  >
                    <Text style={[styles.messageText, { color: msg.role === 'user' ? colors.onPrimary : colors.text }]}>
                      {msg.content}
                    </Text>
                    <Text
                      style={[
                        styles.messageTime,
                        { color: msg.role === 'user' ? colors.onPrimary + '80' : colors.textSecondary }
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
                <View style={[styles.avatarSmall, { backgroundColor: colors.primaryContainer }]}>
                  <Bot size={14} color={colors.onPrimaryContainer} />
                </View>
                <View style={[styles.messageBubble, styles.aiBubble, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.loadingDots}>
                    <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                    <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                    <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Saisie */}
          <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceContainerLow, color: colors.text }]}
              value={input}
              onChangeText={setInput}
              placeholder="Posez votre question..."
              placeholderTextColor={colors.textSecondary}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: input.trim() && !isLoading ? colors.primary : colors.border }]}
              onPress={() => envoyer()}
              disabled={!input.trim() || isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.onPrimary} size="small" />
              ) : (
                <Send size={18} color={colors.onPrimary} />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  floatingBtn: {
    position: 'absolute',
    bottom: 84,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    zIndex: 1000
  },
  container: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 16
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '800'
  },
  headerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  headerSubtext: {
    fontSize: 11,
    fontWeight: '600',
  },
  headerBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center'
  },
  messagesContainer: {
    flex: 1
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 8,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 20
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 24,
    justifyContent: 'center'
  },
  messageRow: {
    marginBottom: 16,
    flexDirection: 'row',
    gap: 8,
  },
  userRow: {
    justifyContent: 'flex-end'
  },
  aiRow: {
    justifyContent: 'flex-start'
  },
  avatarSmall: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18
  },
  userBubble: {
    borderTopRightRadius: 4
  },
  aiBubble: {
    borderWidth: 1,
    borderTopLeftRadius: 4
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right'
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 5
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    opacity: 0.5
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    gap: 10,
    borderTopWidth: 1
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    maxHeight: 100,
    fontSize: 15
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center'
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: '700'
  }
})
