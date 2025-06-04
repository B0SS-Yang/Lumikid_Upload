import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/constants/API';
import * as FileSystem from 'expo-file-system';

const { width } = Dimensions.get('window');

interface Feature {
  id: string;
  name: string;
}

const features: Feature[] = [
  { id: 'chatting', name: 'AI Chatting' },
  { id: 'library', name: 'Digital Library' },
  { id: 'modules', name: 'Education Modules' },
];

const fetchAndSaveAllChatHistory = async (userId: string) => {
  try {
    const chatListUrl = `${API_URL}/chats?user_id=${userId}`;
    const chatListRes = await fetch(chatListUrl, {
      headers: { 'x-api-key': 'cs46_learning_companion_secure_key_2024' }
    });
    const chatList = await chatListRes.json();

    const dirUri = FileSystem.documentDirectory + 'ChatHistory/';
    await FileSystem.makeDirectoryAsync(dirUri, { intermediates: true });

    for (const chat of chatList) {
      const chatId = chat.id;
      const chatHistoryUrl = `${API_URL}/chathistory/${chatId}`;
      const chatHistoryRes = await fetch(chatHistoryUrl, {
        headers: { 'x-api-key': 'cs46_learning_companion_secure_key_2024' }
      });
      const chatHistory = await chatHistoryRes.json();
      const fileUri = `${dirUri}chat_${chatId}.json`;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(chatHistory, null, 2));
    }
  } catch (err) {
    console.error('failed to fetch or save chat history:', err);
  }
};

export default function FeaturePage() {
  const router = useRouter();
  const {id} = useLocalSearchParams();
  const chatId = parseInt(id as string, 10);

  // ——— 1. dynamic get user_id ———
  const [userId, setUserId] = useState<number | null>(null);
  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('user_id');
      if (!stored) {
        router.replace('//login');
        return;
      }
      setUserId(parseInt(stored, 10));
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (userId) {
        await fetchAndSaveAllChatHistory(userId.toString());
      }
    })();
  }, [userId]);

  // ——— 2. confirm AI Chatting / Digital Library popup ———
  const [confirmingFeature, setConfirmingFeature] = useState<Feature | null>(null);

  // ——— 3. education module (small game) selection popup ———
  const [gameModalVisible, setGameModalVisible] = useState(false);

  // ——— 4. sidebar slide in animation ———
  const slideAnim = useRef(new Animated.Value(width)).current;
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // ——— 5. mode switch related states ———
  const [isParentMode, setIsParentMode] = useState(false);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');

  // load the current mode
  useEffect(() => {
    const loadMode = async () => {
      const mode = await AsyncStorage.getItem('isParentMode');
      setIsParentMode(mode === 'true');
    };
    loadMode();
  }, []);

  // handle mode switch
  const handleModeToggle = async () => {
    if (!isParentMode) {
      // switch to parent mode, show the PIN code input box
      setPinModalVisible(true);
    } else {
      // switch to child mode, directly switch
      await AsyncStorage.setItem('isParentMode', 'false');
      setIsParentMode(false);
      router.replace('/');
    }
  };

  // handle PIN code verification
  const handlePinSubmit = async () => {
    try {
      const userId = await AsyncStorage.getItem('user_id');
      
      if (!userId) {
        setPinError('Please login first');
        return;
      }

      // Log request details
      console.log('\n=== Check Parent Password Request Info ===');
      console.log('Request URL:', `${API_URL}/auth/check_parent_password`);
      console.log('Request Method:', 'POST');
      console.log('Request Headers:', {
        'Content-Type': 'application/json'
      });
      console.log('Request Body:', JSON.stringify({
        uid: parseInt(userId),
        pin: pin
      }, null, 2));

      const response = await fetch(`${API_URL}/auth/check_parent_password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: parseInt(userId),
          pin: pin
        })
      });

      const data = await response.json();

      if (data.status === 'success') {
        await AsyncStorage.setItem('isParentMode', 'true');
        setIsParentMode(true);
        setPinModalVisible(false);
        setPin('');
        setPinError('');
        router.replace('/');
      } else {
        setPinError('Incorrect PIN code');
      }
    } catch (err) {
      console.error('PIN verification error:', err);
      setPinError('Failed to verify PIN code');
    }
  };

  // click the mask or blank area, slide out and return
  const handleBackToChat = () => {
    Animated.timing(slideAnim, {
      toValue: width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      router.back();
    });
  };

  // feature button click: AI Chatting / Library first pop up confirm, Modules directly pop up small game list
  const handlePressFeature = (feature: Feature) => {
    if (feature.id === 'modules') {
      setGameModalVisible(true);
    } else if (feature.id === 'library') {
      router.push('../Library/home');
    } else {
      setConfirmingFeature(feature);
    }
  };

  // cancel all popups
  const handleCancel = () => {
    setConfirmingFeature(null);
    setGameModalVisible(false);
    setPinModalVisible(false);
    setPin('');
    setPinError('');
  };

  // confirm AI Chatting (send exit_game)
  const handleConfirm = async () => {
    if (!confirmingFeature || userId === null) return;

    try {
      if (confirmingFeature.id === 'chatting') {
        await fetch(`${API_URL}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'cs46_learning_companion_secure_key_2024',
          },
          body: JSON.stringify({
            user_id: userId,
            id: chatId,
            message: 'exit_game',
            age: 5,
            language: 'en',
            interests: [],
          }),
        });
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', `Failed to ${confirmingFeature.name}`);
    }

    setConfirmingFeature(null);
  };

  // start small game: point to /game/:type instead of /chat
  const startGame = async (type: 'math' | 'vocabulary' | 'grammar') => {
    if (!userId) return;
    try {
      console.log(`🎮 Starting ${type} game...`);
      const res = await fetch(`${API_URL}/game/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'cs46_learning_companion_secure_key_2024',
        },
        body: JSON.stringify({ 
          user_id: userId,
          chat_id: chatId 
        }),
      });

      if (!res.ok) throw new Error('Failed to start game');
      const data = await res.json();
      console.log('🎮 Game initialization response:', data);

      let question = '', answer = '';
      if (Array.isArray(data)) {
        [question, answer] = data;
      } else if (typeof data === 'object') {
        if (data.Question && data.Answer) {
        question = data.Question;
        answer = data.Answer;
        } else {
          console.error('Unexpected data format:', data);
          throw new Error('Invalid game data format');
        }
      }

      console.log('🎮 Initializing game:', {
        type,
        question,
        answer
      });

      // jump to home page and pass the question information
      router.push({
        pathname: '/',
        params: {
          gameType: type,
          gameQuestion: encodeURIComponent(question),
          gameAnswer: encodeURIComponent(answer),
          chatId: chatId?.toString() || '',
        },
      });
    } catch (err) {
      console.error('❌ Game initialization error:', err);
      Alert.alert('Failed to start', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setGameModalVisible(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={handleBackToChat}>
      <View style={styles.container}>
        <Animated.View
          style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}
        >
          <View style={styles.header}>
            <Text style={styles.headerText}>Menu</Text>
          </View>

          {features.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={styles.menuItem}
              onPress={() => handlePressFeature(f)}
            >
              <Text style={styles.menuText}>{f.name}</Text>
            </TouchableOpacity>
          ))}

          {/* subscribe button - only show in parent mode */}
          {isParentMode && (
            <TouchableOpacity
              style={styles.subscribeButton}
              onPress={() => router.push('../components/SubscribePage')}
            >
              <Text style={styles.subscribeButtonText}>Subscribe</Text>
            </TouchableOpacity>
          )}

          {/* mode switch button */}
          <View style={styles.modeSwitchContainer}>
            <TouchableOpacity
              style={[
                styles.modeSwitch,
                isParentMode && styles.modeSwitchActive,
              ]}
              onPress={handleModeToggle}
            >
              <Text style={styles.modeSwitchText}>
                {isParentMode ? 'Parent Mode' : 'Child Mode'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* confirm popup: exit game / enter library */}
        {confirmingFeature && (
          <Modal transparent animationType="fade">
            <View style={styles.modalBackground}>
              <View style={styles.modalBox}>
                <Text style={styles.modalTitle}>
                  Confirm {confirmingFeature.name}
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity onPress={handleCancel}>
                    <Text style={styles.modalCancel}>❌ Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleConfirm}>
                    <Text style={styles.modalConfirm}>✅ Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* education module: small game list popup */}
        <Modal visible={gameModalVisible} transparent animationType="fade">
          <TouchableWithoutFeedback onPress={handleCancel}>
            <View style={styles.modalContainer}>
              <TouchableWithoutFeedback>
                <View style={styles.modalBox}>
                  <Text style={styles.modalTitle}>Choose a Game</Text>
                  <View style={styles.gameButtonsContainer}>
                    <TouchableOpacity 
                      style={styles.gameButton}
                      onPress={() => startGame('math')}
                    >
                      <Text style={styles.gameButtonText}>Math</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.gameButton}
                      onPress={() => startGame('vocabulary')}
                    >
                      <Text style={styles.gameButtonText}>Vocabulary</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.gameButton}
                      onPress={() => startGame('grammar')}
                    >
                      <Text style={styles.gameButtonText}>Grammar</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={handleCancel}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* PIN code verification popup */}
        <Modal visible={pinModalVisible} transparent animationType="fade">
          <View style={styles.modalBackground}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Enter 4-digit Parent PIN</Text>
              <TextInput
                style={styles.pinInput}
                value={pin}
                onChangeText={(text) => {
                  // limit to input numbers and at most 4 digits
                  if (/^\d{0,4}$/.test(text)) {
                    setPin(text);
                    setPinError('');
                  }
                }}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
                placeholder="Enter PIN"
              />
              {pinError ? (
                <Text style={styles.pinError}>{pinError}</Text>
              ) : null}
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  onPress={() => {
                    setPinModalVisible(false);
                    setPin('');
                    setPinError('');
                  }}
                >
                  <Text style={styles.modalCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handlePinSubmit}>
                  <Text style={styles.modalConfirm}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sidebar: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: width * 0.7,
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 20,
  },
  headerText: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  menuItem: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#f8f8f8',
    marginBottom: 10,
  },
  menuText: { fontSize: 18, color: '#333' },
  modeSwitchContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    left: 20,
  },
  modeSwitch: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  modeSwitchActive: {
    backgroundColor: '#34C759',
  },
  modeSwitchText: {
    fontSize: 16,
    color: '#333',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 16,
  },
  modalMessage: { fontSize: 16, color: '#007AFF', margin: 8 },
  modalCancel: { fontSize: 16, color: '#FF3B30' },
  modalConfirm: { fontSize: 16, color: '#34C759' },
  pinInput: {
    width: '80%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,  
    textAlign: 'left', 
    marginTop: 10,
    letterSpacing: 1,  
  },
  pinError: {
    color: '#FF3B30',
    marginTop: 10,
    fontSize: 14,
    textAlign: 'center', 
  },
  subscribeButton: {
    backgroundColor: '#FF9500',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameButtonsContainer: {
    width: '100%',
    marginVertical: 20,
  },
  gameButton: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  gameButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  cancelButton: {
    width: '100%',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
