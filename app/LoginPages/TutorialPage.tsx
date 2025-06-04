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
  ScrollView,
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
  isUser: boolean;
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
    { id: '1', text: 'Welcome to LumiKid! I am Lumi! Let\'s get to know you!', isUser: false },
    { id: '2', text: 'Please tell me your name.', isUser: false },
  ]);

  const questions = [
    {
      id: 1,
      question: 'What is your name?',
      key: 'user_name',
      validate: (value: string) => {
        if (!value.trim()) {
          return { isValid: false, message: 'Please enter your name' };
        }
        return { isValid: true };
      },
      keyboardType: 'default' as KeyboardTypeOptions,
    },
    {
      id: 2,
      question: 'What is your age?',
      key: 'user_age',
      validate: (value: string) => {
        const age = Number(value);
        if (isNaN(age)) {
          return { isValid: false, message: 'Please enter a valid number' };
        }
        if (age < 0 || age > 100) {
          return { isValid: false, message: 'Age must be between 0 and 100' };
        }
        return { isValid: true };
      },
      keyboardType: 'numeric' as KeyboardTypeOptions,
    },
    {
      id: 3,
      question: 'Are you a boy or a girl?',
      key: 'user_gender',
      validate: (value: string) => {
        const normalizedValue = value.toLowerCase();
        const validGenders = ['male', 'female', 'boy', 'girl', 'man', 'woman'];
        if (!validGenders.includes(normalizedValue)) {
          return { 
            isValid: false, 
            message: 'Please answer with either "boy", "girl", "male", "woman", or "woman'
          };
        }
        return { isValid: true };
      },
      keyboardType: 'default' as KeyboardTypeOptions,
    },
  ];

  // Helper function to convert gender input to backend format
  const convertGenderToBackendFormat = (gender: string): string => {
    const normalizedGender = gender.toLowerCase();
    if (normalizedGender === 'boy' || normalizedGender === 'male' || normalizedGender === 'man') {
      return 'Male';
    } else if (normalizedGender === 'girl' || normalizedGender === 'female' || normalizedGender === 'woman') {
      return 'Female';
    }
    return 'Unset';
  };

  const sendUserDataToBackend = async (userData: UserData) => {
    try {
      // First try to get the temporary token and user_id
      const tempToken = await AsyncStorage.getItem('temp_token');
      const userId = await AsyncStorage.getItem('user_id');
      const userName = await AsyncStorage.getItem('user_name');
      const storedGender = await AsyncStorage.getItem('user_gender');
      
      console.log('Sending user data:', { userName, userId, ...userData });

      if (!tempToken) {
        console.error('No token found for user data update');
        return;
      }

      if (!userId) {
        console.error('No user_id found for user data update');
        return;
      }

      // Build complete user data
      const completeUserData = {
        name: userName || '',
        age: userData.age || 0,
        gender: convertGenderToBackendFormat(storedGender || userData.gender || 'Unset')
      };

      console.log('Sending to backend:', completeUserData);

      const requestBody = {
        token: tempToken,
        user_id: parseInt(userId),
        user_data: completeUserData
      };

      console.log('Complete request body:', requestBody);

      const response = await fetch(`${API_URL}/auth/update_profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'cs46_learning_companion_secure_key_2024',
          'Authorization': `Bearer ${tempToken}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Backend error:', errorData);
        // Don't throw error, just log it and continue
        console.warn('Failed to update profile, but continuing with local save');
      } else {
      const data = await response.json();
      console.log('Profile updated successfully:', data);
        
        // After successful update, move the token to permanent storage
        await AsyncStorage.setItem('token', tempToken);
        await AsyncStorage.removeItem('temp_token');

        // Save user_id if it's in the response
        if (data.user_id) {
          await AsyncStorage.setItem('user_id', data.user_id.toString());
          console.log('User ID saved:', data.user_id);
        } else {
          console.warn('No user_id in response');
        }
      }

      // Save user info locally regardless of backend success
      await AsyncStorage.setItem('user_name', completeUserData.name);
      await AsyncStorage.setItem('user_age', completeUserData.age.toString());
      await AsyncStorage.setItem('user_gender', completeUserData.gender);

    } catch (error) {
      // Log error but don't block the flow
      console.error('Error in sendUserDataToBackend:', error);
      // Continue with the flow even if backend update fails
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate input based on current step
      const currentQuestion = questions[step];
      const validationResult = currentQuestion.validate(inputText);
      
      if (!validationResult.isValid) {
        Alert.alert('Invalid Input', validationResult.message || 'Please check your input');
        return;
      }

      // Add user message
      const newMessage = {
        id: Date.now().toString(),
        text: inputText,
        isUser: true,
      };
      setMessages(prev => [...prev, newMessage]);

      // Save current answer based on step
      if (step === 0) {
        await AsyncStorage.setItem('user_name', inputText);
      } else if (step === 1) {
        const age = Number(inputText);
        if (age < 0 || age > 100) {
          Alert.alert('Invalid Age', 'Age must be between 0 and 100');
          return;
        }
        await AsyncStorage.setItem('user_age', inputText);
      } else if (step === 2) {
        const normalizedGender = inputText.toLowerCase();
        const validGenders = ['male', 'female', 'boy', 'girl'];
        if (!validGenders.includes(normalizedGender)) {
          Alert.alert('Invalid Gender', 'Please answer with either "boy", "girl", "male", or "female"');
          return;
        }
        const formattedGender = convertGenderToBackendFormat(inputText);
        await AsyncStorage.setItem('user_gender', formattedGender);
      }

      setInputText('');

      // Move to next question or finish
      if (step < questions.length - 1) {
        setStep(step + 1);
        const nextQuestion: Message = {
          id: Date.now().toString() + '_question',
          text: questions[step + 1].question,
          isUser: false,
        };
        setTimeout(() => {
          setMessages(prev => [...prev, nextQuestion]);
        }, 500);
      } else {
        // Get all stored user data
        const storedName = await AsyncStorage.getItem('user_name') || '';
        const storedAge = await AsyncStorage.getItem('user_age') || '0';
        const storedGender = await AsyncStorage.getItem('user_gender') || 'Unset';

        // Additional validation before sending to backend
        const age = parseInt(storedAge, 10);
        if (isNaN(age) || age < 0 || age > 100) {
          Alert.alert('Error', 'Invalid age detected. Please start over.');
          return;
          }

        // Prepare final user data
        const finalUserData: UserData = {
          age: age,
          gender: storedGender
        };

        // Send data to backend but don't wait for it
        sendUserDataToBackend(finalUserData).catch(console.error);

        // Show final message
        const finalMessage: Message = {
          id: Date.now().toString() + '_final',
          text: `Great to meet you${storedName ? ', ' + storedName : ''}! Now let's set up a PIN to secure your account!`,
          isUser: false,
        };
        setMessages(prev => [...prev, finalMessage]);
        
        // Delay navigation for 3 seconds
        setTimeout(() => {
          router.push('/LoginPages/PinSettingPage');
        }, 3000);
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      Alert.alert('Error', 'Something went wrong, please try again');
    }
  };

  const handleSkip = () => {
    router.push('/LoginPages/PinSettingPage');
  };

  const renderItem = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageRow,
      item.isUser && styles.userMessageRow
    ]}>
      {item.isUser && (
        <Image
          source={require('../../assets/images/Lumi Sun.png')}
          style={styles.avatar}
          resizeMode="cover"
        />
      )}
      <View
        style={[
          styles.messageBubble,
          item.isUser ? styles.userBubble : styles.assistantBubble,
        ]}
      >
        <Text style={[
          styles.messageText,
          item.isUser && styles.userMessageText
        ]}>
          {item.text}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Top area */}
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

      {/* Chat content */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input area */}
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

          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendButtonText}>Send</Text>
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
    width: 40, // 
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
  disabledButton: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
