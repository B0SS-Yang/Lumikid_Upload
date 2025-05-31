import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { KeyboardTypeOptions } from 'react-native';
import { API_URL } from '@/constants/API';

interface Message {
  id: string;
  text: string;
  role: 'user' | 'assistant';
}

interface UserData {
  age: number;
  gender: string;
}

export default function TutorialPage() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [step, setStep] = useState(0);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Welcome to LumiKid! I am Lumi! Let\'s get to know you!', role: 'assistant' },
    { id: '2', text: 'Please tell me your name.', role: 'assistant' },
  ]);

  const questions = [
    {
      id: 1,
      question: 'What is your name?',
      key: 'user_name',
      validate: (value: string) => value.length > 0,
      keyboardType: 'default' as KeyboardTypeOptions,
    },
    {
      id: 2,
      question: 'What is your age?',
      key: 'user_age',
      validate: (value: string) => !isNaN(Number(value)) && Number(value) > 0,
      keyboardType: 'numeric' as KeyboardTypeOptions,
    },
    {
      id: 3,
      question: 'Are you a boy or a girl?',
      key: 'user_gender',
      validate: (value: string) => {
        const normalizedValue = value.toLowerCase();
        return ['male', 'female', 'boy', 'girl'].includes(normalizedValue) ||
               ['Male', 'Female', 'Boy', 'Girl'].includes(value);
      },
      keyboardType: 'default' as KeyboardTypeOptions,
    },
  ];

  const sendUserDataToBackend = async (userData: UserData) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userName = await AsyncStorage.getItem('user_name');
      
      if (!token) {
        throw new Error('No token found');
      }

      // 构建完整的用户数据
      const completeUserData = {
        name: userName,
        age: userData.age,
        gender: userData.gender
      };

      const response = await fetch(`${API_URL}/auth/update_profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'cs46_learning_companion_secure_key_2024',
        },
        body: JSON.stringify({
          token: token,
          user_data: completeUserData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update profile');
      }

      const data = await response.json();
      console.log('Profile updated successfully:', data);

      // 保存用户信息到本地存储以供后续使用
      await AsyncStorage.setItem('user_name', userName || '');
      await AsyncStorage.setItem('user_age', userData.age.toString());
      await AsyncStorage.setItem('user_gender', userData.gender);

    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to update profile. Please try again later.'
      );
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    // 添加用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      role: 'user',
    };
    setMessages(prev => [...prev, userMessage]);
    
    try {
      // 保存当前答案
      await AsyncStorage.setItem(questions[step].key, inputText);

      // 验证输入
      if (!questions[step].validate(inputText)) {
        let errorMessage = 'Please enter a valid answer';
        if (questions[step].key === 'user_age') {
          errorMessage = 'Please enter a valid age';
        } else if (questions[step].key === 'user_gender') {
          errorMessage = 'Please enter Male/Female/Boy/Girl';
        }

        const errorResponse: Message = {
          id: Date.now().toString() + '_error',
          text: errorMessage,
          role: 'assistant',
        };
        setMessages(prev => [...prev, errorResponse]);
        setInputText('');
        return;
      }

      if (step < questions.length - 1) {
        // 进入下一个问题
        setStep(step + 1);
        const nextQuestion: Message = {
          id: Date.now().toString() + '_question',
          text: questions[step + 1].question,
          role: 'assistant',
        };
        setTimeout(() => {
          setMessages(prev => [...prev, nextQuestion]);
        }, 500);
      } else {
        // 完成所有问题，收集数据并发送到后端
        const name = await AsyncStorage.getItem('user_name');
        const age = Number(await AsyncStorage.getItem('user_age'));
        const gender = await AsyncStorage.getItem('user_gender');
        
        // 标准化性别格式
        const normalizedGender = (() => {
          const lowerGender = gender?.toLowerCase();
          if (lowerGender === 'male' || lowerGender === 'boy') {
            return 'Male';
          } else if (lowerGender === 'female' || lowerGender === 'girl') {
            return 'Female';
          }
          return 'Female'; // 默认值
        })();

        const userData: UserData = {
          age,
          gender: normalizedGender,
        };

        // 发送数据到后端
        await sendUserDataToBackend(userData);

        const finalMessage: Message = {
          id: Date.now().toString() + '_final',
          text: `Great to meet you${name ? ', ' + name : ''}! Now let's set up a PIN to secure your account!`,
          role: 'assistant',
        };
        setMessages(prev => [...prev, finalMessage]);
        
        // 延迟跳转到PIN设置页面
        setTimeout(() => {
          router.push('/LoginPages/PinSettingPage');
        }, 2000);
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
    setInputText('');
  };

  const handleSkip = () => {
    router.push('/');
  };

  const renderItem = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageRow,
      item.role === 'user' && styles.userMessageRow
    ]}>
      {item.role === 'assistant' && (
        <Image
          source={require('../../assets/images/Lumi Sun.png')}
          style={styles.avatar}
          resizeMode="cover"
        />
      )}
      <View
        style={[
          styles.messageBubble,
          item.role === 'user' ? styles.userBubble : styles.assistantBubble,
        ]}
      >
        <Text style={[
          styles.messageText,
          item.role === 'user' && styles.userMessageText
        ]}>
          {item.text}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 顶部区域 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={handleSkip}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        <Image
          source={require('../../assets/images/LumiKid Logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />

        <View style={styles.headerRight} />
      </View>

      {/* 聊天内容 */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* 输入区域 */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.micButton}>
            <Ionicons name="mic" size={20} color="black" />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder={questions[step].question}
            keyboardType={questions[step].keyboardType || 'default'}
          />

          <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
            <Ionicons name="send" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingHorizontal: 16,
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerRight: {
    width: 40, // 与 skip 按钮宽度相同，保持对称
  },
  logoImage: {
    width: 120,
    height: 40,
  },
  messageList: {
    padding: 15,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 5,
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 20,
    maxWidth: '75%',
  },
  userBubble: {
    backgroundColor: '#007AFF',
  },
  assistantBubble: {
    backgroundColor: '#F0F0F0',
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  userMessageText: {
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 10,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EAEAEA',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
