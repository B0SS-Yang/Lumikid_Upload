import { Text, View, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useRef, useEffect } from 'react';
import { API_URL } from '@/constants/API';
import SliderCaptcha, { SliderCaptchaRef } from '../components/SliderCaptcha';
import * as FileSystem from 'expo-file-system';

interface UserCredentials {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const sliderCaptchaRef = useRef<SliderCaptchaRef>(null);

  const resetVerification = () => {
    setIsVerified(false);
    sliderCaptchaRef.current?.reset();
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (!isVerified) {
      Alert.alert('Error', 'Please complete verification');
      return;
    }
    try {
      setIsLoading(true);
      const requestUrl = `${API_URL}/auth/login`;
      const requestData = { email, password };
      
      console.log('\n=== Login Request Info ===');
      console.log('Request URL:', requestUrl);
      console.log('Request Method:', 'POST');
      console.log('Request Headers:', {
        'Content-Type': 'application/json'
      });
      console.log('Request Body:', JSON.stringify(requestData, null, 2));
      console.log('==================\n');
      
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('\n=== Login Response Info ===');
      console.log('Status Code:', response.status);
      console.log('Status Text:', response.statusText);
      console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
      const responseData = await response.json();
      console.log('Login Response Data:', responseData);
      console.log('==================\n');
      
      if (!response.ok) {
        if (responseData.detail && (responseData.detail.includes('not verified'))) {
          Alert.alert('Notice', 'Your account is not activated, please verify your email.', [
            {
              text: 'OK',
              onPress: async () => {
                await AsyncStorage.setItem('pendingVerificationEmail', email);
                await AsyncStorage.setItem('pendingPassword', password);
                setEmail('');
                setPassword('');
                resetVerification();
                router.replace('/LoginPages/VerifyCodePage');
              }
            }
          ]);
          setIsLoading(false);
          return;
        }
        throw new Error(responseData.detail || 'Login failed');
      }

      if (!responseData) {
        console.error('Response data is empty');
        throw new Error('Invalid login response data');
      }

      // Save auth data
      await AsyncStorage.setItem('token', responseData.access_token);
      await AsyncStorage.setItem('isLoggedIn', 'true');
      await AsyncStorage.setItem('email', email);
      
      // Check if this is first login
      if (responseData.first_login === false) {
        // Existing user - proceed to main app
      const userId = responseData.user_id || 
                     responseData.userId || 
                      responseData.user?.id;

        if (userId) {
          console.log('Setting user_id in AsyncStorage:', userId);
      await AsyncStorage.setItem('user_id', userId.toString());
          await AsyncStorage.setItem('email', email);
          await fetchAndSaveAllChatHistory(userId);
          router.replace('/');
        } else {
          console.error('userId is empty, cannot fetch chat history');
          router.replace('/');
        }
      } else {
        // First time login - redirect to tutorial
        console.log('First time login detected, redirecting to tutorial');
        // Store the token and user_id in AsyncStorage before redirecting
        try {
          const userId = responseData.user_id || 
                        responseData.userId || 
                        responseData.user?.id;
          
          if (userId) {
            console.log('Setting user_id for new user:', userId);
            await AsyncStorage.setItem('user_id', userId.toString());
            await AsyncStorage.setItem('email', email);
        }
          await AsyncStorage.setItem('temp_token', responseData.access_token);
          console.log('Token stored successfully for tutorial page');
      } catch (error) {
          console.error('Failed to store token or user_id:', error);
        }
        router.replace('/LoginPages/TutorialPage');
      }
      
    } catch (error) {
      console.error('❌ Login process error:', error);
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('Network request failed')) {
          Alert.alert(
            'Network Error',
            `Error Type: Network connection failed\nReason: ${error.message}\nPlease check:\n1. Network connection\n2. Server address\n3. Proxy settings\n4. Firewall settings`,
            [
              {
                text: 'Retry',
                onPress: () => {
                  setEmail('');
                  setPassword('');
                  resetVerification();
                  handleLogin();
                }
              },
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => {
                  setEmail('');
                  setPassword('');
                  resetVerification();
                }
              }
            ]
          );
        } else {
          Alert.alert('Error', error.message);
          setEmail('');
          setPassword('');
          resetVerification();
        }
      } else {
        Alert.alert('Error', 'Login failed, please try again');
        setEmail('');
        setPassword('');
        resetVerification();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAndSaveAllChatHistory = async (userId: string) => {
    try {
      console.log('fetchAndSaveAllChatHistory has been called, userId:', userId);
      // 1. get all chat list
      const chatListUrl = `${API_URL}/chats?user_id=${userId}`;
      console.log('【DEBUG】Get chat list request:');
      console.log('Request URL:', chatListUrl);
      console.log('Request headers:', { 'x-api-key': 'cs46_learning_companion_secure_key_2024' });
      const chatListRes = await fetch(chatListUrl, {
        headers: { 'x-api-key': 'cs46_learning_companion_secure_key_2024' }
      });
      console.log('Response status:', chatListRes.status);
      const chatList = await chatListRes.json();
      console.log('Response body:', chatList);

      // 2. ensure the ChatHistory folder exists
      const dirUri = FileSystem.documentDirectory + 'ChatHistory/';
      await FileSystem.makeDirectoryAsync(dirUri, { intermediates: true });

      // 3. iterate through each chat, fetch history and save
      for (const chat of chatList) {
        const chatId = chat.id;
        const chatHistoryUrl = `${API_URL}/chathistory/${chatId}`;
        console.log('【DEBUG】Get chat history request:');
        console.log('Request URL:', chatHistoryUrl);
        console.log('Request headers:', { 'x-api-key': 'cs46_learning_companion_secure_key_2024' });
        const chatHistoryRes = await fetch(chatHistoryUrl, {
          headers: { 'x-api-key': 'cs46_learning_companion_secure_key_2024' }
        });
        console.log('Response status:', chatHistoryRes.status);
        const chatHistory = await chatHistoryRes.json();
        console.log('Response body:', chatHistory);
        const fileUri = `${dirUri}chat_${chatId}.json`;
        await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(chatHistory, null, 2));
      }
      console.log('All chat history has been saved to the local ChatHistory folder');
    } catch (err) {
      console.error('Failed to fetch or save chat history:', err);
    }
  };

  useEffect(() => {
    (async () => {
      const userId = await AsyncStorage.getItem('user_id');
      if (userId) {
        await fetchAndSaveAllChatHistory(userId);
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <View style={styles.inputContainer}>
        <TextInput 
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={Colors.greyLight}
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            resetVerification();
          }}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput 
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={Colors.greyLight}
          secureTextEntry
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            resetVerification();
          }}
        />
      </View>
      <SliderCaptcha ref={sliderCaptchaRef} onVerify={() => setIsVerified(true)} />
      <TouchableOpacity 
        style={[defaultStyles.btn, styles.loginButton, (isLoading || !isVerified) && styles.disabledButton]}
        onPress={handleLogin}
        disabled={isLoading || !isVerified}>
        <Text style={styles.loginButtonText}>
          {isLoading ? 'Logging in...' : 'Login'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.forgotPassword}
        onPress={() => router.push('/LoginPages/ForgotPasswordPage')}>
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.registerLink}
        onPress={() => router.push('../LoginPages/RegisterPage')}>
        <Text style={styles.registerLinkText}>Create new account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.brown,
    marginBottom: 40,
    textAlign: 'center',
  },
  inputContainer: {
    gap: 15,
    marginBottom: 20,
  },
  input: {
    backgroundColor: Colors.input,
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    marginBottom: 15,
  },
  disabledButton: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: Colors.light,
    fontSize: 18,
    fontWeight: '600',
  },
  forgotPassword: {
    alignItems: 'center',
    marginBottom: 15,
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontSize: 16,
  },
  registerLink: {
    alignItems: 'center',
    marginTop: 10,
  },
  registerLinkText: {
    color: Colors.primary,
    fontSize: 16,
  },
}); 