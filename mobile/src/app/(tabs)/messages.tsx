import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { MessageSquare, Send, User as UserIcon } from 'lucide-react-native';
import { Colors } from '@/constants/theme';

interface DemoMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  isMe: boolean;
}

export default function MessagesScreen() {
  const [messages, setMessages] = useState<DemoMessage[]>([
    {
      id: 'm1',
      sender: 'Rahul S.',
      text: 'Hi, I think I found your keys near the main gate!',
      time: '10:30 AM',
      isMe: false,
    },
    {
      id: 'm2',
      sender: 'You',
      text: 'Oh awesome! Do they have a blue keychain on them?',
      time: '10:32 AM',
      isMe: true,
    },
    {
      id: 'm3',
      sender: 'Rahul S.',
      text: 'Yes! Exact blue keychain with 3 keys attached.',
      time: '10:33 AM',
      isMe: false,
    },
  ]);

  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsg: DemoMessage = {
      id: 'm-' + Date.now(),
      sender: 'You',
      text: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput('');
  };

  const renderMessage = ({ item }: { item: DemoMessage }) => (
    <View style={[styles.msgRow, item.isMe ? styles.msgMeRow : styles.msgOtherRow]}>
      <View style={[styles.bubble, item.isMe ? styles.bubbleMe : styles.bubbleOther]}>
        <Text style={[styles.msgText, item.isMe ? styles.msgTextMe : styles.msgTextOther]}>
          {item.text}
        </Text>
        <Text style={[styles.timeText, item.isMe ? styles.timeTextMe : styles.timeTextOther]}>
          {item.time}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Active Conversation Header */}
      <View style={styles.chatHeader}>
        <View style={styles.avatarCircle}>
          <UserIcon size={20} color="#FFFFFF" />
        </View>
        <View>
          <Text style={styles.chatHeaderTitle}>Rahul S.</Text>
          <Text style={styles.chatHeaderSubtitle}>Regarding: Black Leather Wallet</Text>
        </View>
      </View>

      {/* Message List */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
      />

      {/* Input Bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.chatInput}
          placeholder="Type a message..."
          value={input}
          onChangeText={setInput}
          placeholderTextColor={Colors.textMuted}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
          <Send size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatHeaderTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.text,
  },
  chatHeaderSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  messageList: {
    padding: 16,
    gap: 12,
  },
  msgRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  msgMeRow: {
    justifyContent: 'flex-end',
  },
  msgOtherRow: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bubbleMe: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 2,
  },
  bubbleOther: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: 2,
  },
  msgText: {
    fontSize: 14,
    lineHeight: 20,
  },
  msgTextMe: {
    color: '#FFFFFF',
  },
  msgTextOther: {
    color: Colors.text,
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeTextMe: {
    color: 'rgba(255,255,255,0.7)',
  },
  timeTextOther: {
    color: Colors.textMuted,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 8,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#F0F4F4',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.text,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
