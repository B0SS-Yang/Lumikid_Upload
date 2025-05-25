import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { API_URL } from '@/constants/API';
const { width } = Dimensions.get('window');
const BACKEND_BASE_URL = API_URL;

interface ChatItem {
  id: number;
  title: string;
}

const fetchChatsFromServer = async (userId: number): Promise<ChatItem[]> => {
  const res = await fetch(
    `${BACKEND_BASE_URL}/chats?user_id=${userId}`,
    {
      headers: { 'x-api-key': 'cs46_learning_companion_secure_key_2024' }
    }
  );
  if (!res.ok) throw new Error('Failed to fetch chat list');
  return await res.json();
};

const renameChatOnServer = async (chatId: number, newTitle: string) => {
  const res = await fetch(`${BACKEND_BASE_URL}/chats/${chatId}/rename`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'cs46_learning_companion_secure_key_2024',
    },
    body: JSON.stringify({ new_title: newTitle })
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Rename failed. Server response:", errorText);
  }
};

export default function MenuPage() {
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(-width)).current;
  const [isVisible, setIsVisible] = useState(true);

  // —— 动态 userId —— 
  const [userId, setUserId] = useState<number | null>(null);
  useEffect(() => {
    (async () => {
      const idStr = await AsyncStorage.getItem('user_id');  // :contentReference[oaicite:0]{index=0}:contentReference[oaicite:1]{index=1}
      if (!idStr) {
        router.replace('//loginPage');
        return;
      }
      setUserId(parseInt(idStr, 10));
    })();
  }, []);

  const [chatList, setChatList] = useState<ChatItem[]>([]);
  const [searchText, setSearchText] = useState('');
  const [renamingChatId, setRenamingChatId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

    // 点击遮罩区域，侧边栏收回并返回上一个页面
  const handleBackToChat = () => {
    Animated.timing(slideAnim, {
      toValue: -width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
      router.back();
    });
  };

  const refreshChats = async () => {
    if (userId === null) return; // 等待 userId 载入
    setRefreshing(true);
    try {
      const chatsFromServer = await fetchChatsFromServer(userId);  // :contentReference[oaicite:2]{index=2}:contentReference[oaicite:3]{index=3}
      setChatList(chatsFromServer);
      await AsyncStorage.setItem('chatList', JSON.stringify(chatsFromServer));
    } catch (error) {
      console.error("refersh error:", error);
      const stored = await AsyncStorage.getItem('chatList');
      if (stored) setChatList(JSON.parse(stored));
    } finally {
      setRefreshing(false);
    }
  };

  // 拿到 userId 后首次拉列表
  useEffect(() => {
    if (userId !== null) {
      refreshChats();
    }
  }, [userId]);

  const updateChatList = async (newList: ChatItem[]) => {
    setChatList(newList);
    await AsyncStorage.setItem('chatList', JSON.stringify(newList));
  };

  const filteredChats = chatList.filter(item =>
    (item.title ?? '').toLowerCase().includes(searchText.toLowerCase())
  );

  const handlePressChat = (chat: ChatItem) => {
    router.push(`/?id=${chat.id}`);
  };

  const handleLongPressChat = (chat: ChatItem) => {
    if (chat.title === 'example') return;
    setSelectedChat(chat);
    setShowOptions(true);
  };

  const createChatOnServer = async (userId: number): Promise<ChatItem> => {
    const res = await fetch(`${BACKEND_BASE_URL}/chats/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'cs46_learning_companion_secure_key_2024',
      },
      body: JSON.stringify({ user_id: userId })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("create error:", errorText);
      throw new Error("Create chat failed");
    }

    return await res.json();
  };

  const handleAddChat = async () => {
    if (userId === null) return;
    try {
      const newChat = await createChatOnServer(userId);
      const updated = [...chatList, newChat];
      await updateChatList(updated);
      await refreshChats();
    } catch (err) {
      console.error("handleAddChat error:", err);
    }
  };

  const handleSettings = () => {
    router.push('/SideBar/settings');
  };

  const confirmRename = async () => {
    const trimmedTitle = newTitle.trim();
    if (!trimmedTitle || renamingChatId === null) return;

    try {
      await renameChatOnServer(renamingChatId, trimmedTitle);
      const updated = chatList.map(chat =>
        chat.id === renamingChatId ? { ...chat, title: trimmedTitle } : chat
      );
      await updateChatList(updated);
      Alert.alert("rename succeeded", "Please pull down to refresh to see the latest titles");
    } catch (err) {
      console.error("rename error:", err);
      Alert.alert("rename failed", "try again later");
    }

    setRenamingChatId(null);
    setNewTitle('');
  };

  const cancelRename = () => {
    setRenamingChatId(null);
    setNewTitle('');
  };

  const renderItem = ({ item }: { item: ChatItem }) => {
    const isRenaming = renamingChatId === item.id;
    return (
      <View>
        <TouchableOpacity
          style={styles.chatItem}
          onPress={() => handlePressChat(item)}
          onLongPress={() => handleLongPressChat(item)}
        >
          <Text style={styles.chatText}>{item.title}</Text>
        </TouchableOpacity>
        {isRenaming && (
          <View style={styles.renameContainer}>
            <TextInput
              style={styles.renameInput}
              placeholder="Enter new name"
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <TouchableOpacity onPress={confirmRename}>
              <Text style={styles.renameButton}>✅</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={cancelRename}>
              <Text style={styles.renameButton}>❌</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (!isVisible) return null;

  return (
    <TouchableWithoutFeedback onPress={handleBackToChat}>
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.sidebar,
            {
              transform: [{ translateX: slideAnim }]
            }
          ]}
        >
          <SafeAreaView style={styles.sidebarContent}>
            {/* Header Row: Search + Add */}
            <View style={styles.headerRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search chat..."
                value={searchText}
                onChangeText={setSearchText}
              />
              <TouchableOpacity style={styles.addButton} onPress={handleAddChat}>
                <Ionicons name="add" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Chat List */}
            <FlatList
              data={filteredChats}
              keyExtractor={item => item.id.toString()}
              renderItem={renderItem}
              style={{ flex: 1 }}
              refreshing={refreshing}
              onRefresh={refreshChats}
            />

            {/* Settings Button */}
            <TouchableOpacity style={styles.settingsButton} onPress={handleSettings}>
              <Ionicons name="settings" size={24} color="white" />
            </TouchableOpacity>
          </SafeAreaView>
        </Animated.View>

        {/* Modal: Rename / Delete / Cancel */}
        <Modal visible={showOptions} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.optionBox}>
              <TouchableOpacity
                onPress={() => {
                  setRenamingChatId(selectedChat?.id || null);
                  setNewTitle(selectedChat?.title || '');
                  setShowOptions(false);
                }}
              >
                <Text style={styles.optionText}>✏️ Rename</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  try {
                    await fetch(`${BACKEND_BASE_URL}/chats/${selectedChat?.id}/hide`, {
                      method: 'POST',
                      headers: { 'x-api-key': 'cs46_learning_companion_secure_key_2024' },
                    });
                    const updated = chatList.filter(chat => chat.id !== selectedChat?.id);
                    await updateChatList(updated);
                  } catch (err) {
                    console.error("delete error:", err);
                  } finally {
                    setShowOptions(false);
                  }
                }}
              >
                <Text style={styles.optionText}>🗑️ Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowOptions(false)}>
                <Text style={styles.optionText}>❌ Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: width * 0.8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sidebarContent: {
    flex: 1,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f2f2f2',
    paddingHorizontal: 10,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#34C759',
    padding: 10,
    borderRadius: 8,
  },
  chatItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  chatText: {
    fontSize: 16,
  },
  renameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
  },
  renameInput: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  renameButton: {
    fontSize: 20,
    marginHorizontal: 4,
  },
  settingsButton: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 30,
    alignSelf: 'center',
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00000055',
  },
  optionBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    elevation: 10,
    width: 220,
    gap: 12,
  },
  optionText: {
    fontSize: 18,
    textAlign: 'center',
  },
});
