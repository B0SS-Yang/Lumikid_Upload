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
      Alert.alert('错误', '请填写所有字段');
      resetVerification();
      return;
    }
    if (!isVerified) {
      Alert.alert('错误', '请完成验证');
      return;
    }
    try {
      setIsLoading(true);
      const requestUrl = `${API_URL}/auth/login`;
      const requestData = { email, password };
      
      // 调试日志：登录请求信息
      console.log('\n=== 登录请求信息 ===');
      console.log('请求URL:', requestUrl);
      console.log('请求方法:', 'POST');
      console.log('请求头:', {
        'Content-Type': 'application/json'
      });
      console.log('请求体:', JSON.stringify(requestData, null, 2));
      console.log('==================\n');
      
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      // 调试日志：登录响应信息
      console.log('\n=== 登录响应信息 ===');
      console.log('状态码:', response.status);
      console.log('状态文本:', response.statusText);
      console.log('响应头:', Object.fromEntries(response.headers.entries()));
      const responseData = await response.json();
      console.log('登录响应数据:', responseData);
      console.log('==================\n');
      
      if (!response.ok) {
        if (responseData.detail && (responseData.detail.includes('not verified') || responseData.detail.includes('未激活'))) {
          Alert.alert('提示', '您的账户未激活，请验证邮箱。', [
            {
              text: '确定',
              onPress: async () => {
                // 保存邮箱到 AsyncStorage
                await AsyncStorage.setItem('pendingVerificationEmail', email);
                // 保存密码到 AsyncStorage
                await AsyncStorage.setItem('pendingPassword', password);
                // 重置表单
                setEmail('');
                setPassword('');
                resetVerification();
                // 直接跳转到验证页面
                router.replace('/LoginPages/VerifyCodePage');
              }
            }
          ]);
          setIsLoading(false);
          return;
        }
        throw new Error(responseData.detail || '登录失败');
      }

      if (!responseData) {
        console.error('响应数据为空');
        throw new Error('登录响应数据无效');
      }

      // 保存登录状态和token
      await AsyncStorage.setItem('token', responseData.access_token);
      await AsyncStorage.setItem('isLoggedIn', 'true');
      // 登录后强制设置为幼儿模式
      await AsyncStorage.setItem('selectedRole', 'child');
      await AsyncStorage.setItem('isParentMode', 'false');
      
      // 检查所有可能的 user_id 字段
      const userId = responseData.user_id || 
                     responseData.userId || 
                     responseData.user?.id; // 默认值

      if (!userId) {
        console.error('userId 为空，无法拉取聊天历史');
        return;
      }

      await AsyncStorage.setItem('user_id', userId.toString());
      
      // 拉取并保存所有聊天历史
      console.log('准备调用 fetchAndSaveAllChatHistory');
      await fetchAndSaveAllChatHistory(userId);
      console.log('fetchAndSaveAllChatHistory 调用结束');
      
      // 2. 创建新的聊天会话
      try {
        // 调试日志：创建聊天会话请求信息
        console.log('\n=== 创建聊天会话请求信息 ===');
        console.log('请求URL:', `${API_URL}/chats/create`);
        console.log('请求方法:', 'POST');
        console.log('请求头:', {
          'Content-Type': 'application/json',
          'x-api-key': 'cs46_learning_companion_secure_key_2024'
        });
        console.log('请求体:', JSON.stringify({
          user_id: userId
        }, null, 2));
        console.log('========================\n');
        
        const createChatResponse = await fetch(`${API_URL}/chats/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'cs46_learning_companion_secure_key_2024'
          },
          body: JSON.stringify({
            user_id: userId
          })
        });
        
        // 调试日志：创建聊天会话响应信息
        console.log('\n=== 创建聊天会话响应信息 ===');
        console.log('状态码:', createChatResponse.status);
        console.log('状态文本:', createChatResponse.statusText);
        console.log('响应头:', Object.fromEntries(createChatResponse.headers.entries()));
        const chatData = await createChatResponse.json();
        console.log('响应体:', JSON.stringify(chatData, null, 2));
        console.log('========================\n');
        
        if (chatData && chatData.id) {
          await AsyncStorage.setItem('lastChatId', chatData.id.toString());
          console.log('✅ 成功创建聊天会话，ID:', chatData.id);
          // 先全部 await 完成，再跳转
          await fetchAndSaveAllChatHistory(userId);
          // ...创建聊天会话...
          // ...await 完成后再 router.replace(...)
          router.replace(`/?id=${chatData.id}`);
        } else {
          throw new Error('创建聊天会话失败');
        }
      } catch (error) {
        console.error('❌ 创建聊天会话失败:', error);
        setEmail('');
        setPassword('');
        resetVerification();
        router.replace('/');
      }
      
    } catch (error) {
      console.error('❌ 登录过程发生错误:', error);
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('Network request failed')) {
          Alert.alert(
            '网络错误',
            `错误类型: 网络连接失败\n原因: ${error.message}\n请检查:\n1. 网络连接是否正常\n2. 服务器地址是否正确\n3. 代理是否启用\n4. 防火墙设置`,
            [
              {
                text: '重试',
                onPress: () => {
                  setEmail('');
                  setPassword('');
                  resetVerification();
                  handleLogin();
                }
              },
              {
                text: '取消',
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
          Alert.alert('错误', error.message);
          setEmail('');
          setPassword('');
          resetVerification();
        }
      } else {
        Alert.alert('错误', '登录失败，请稍后重试');
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
      console.log('fetchAndSaveAllChatHistory 被调用，userId:', userId);
      // 1. 获取所有聊天列表
      const chatListUrl = `${API_URL}/chats?user_id=${userId}`;
      console.log('【DEBUG】获取聊天列表请求:');
      console.log('请求URL:', chatListUrl);
      console.log('请求头:', { 'x-api-key': 'cs46_learning_companion_secure_key_2024' });
      const chatListRes = await fetch(chatListUrl, {
        headers: { 'x-api-key': 'cs46_learning_companion_secure_key_2024' }
      });
      console.log('响应状态:', chatListRes.status);
      const chatList = await chatListRes.json();
      console.log('响应体:', chatList);

      // 2. 确保ChatHistory文件夹存在
      const dirUri = FileSystem.documentDirectory + 'ChatHistory/';
      await FileSystem.makeDirectoryAsync(dirUri, { intermediates: true });

      // 3. 遍历每个聊天，拉取历史并保存
      for (const chat of chatList) {
        const chatId = chat.id;
        const chatHistoryUrl = `${API_URL}/chathistory/${chatId}`;
        console.log('【DEBUG】获取聊天历史请求:');
        console.log('请求URL:', chatHistoryUrl);
        console.log('请求头:', { 'x-api-key': 'cs46_learning_companion_secure_key_2024' });
        const chatHistoryRes = await fetch(chatHistoryUrl, {
          headers: { 'x-api-key': 'cs46_learning_companion_secure_key_2024' }
        });
        console.log('响应状态:', chatHistoryRes.status);
        const chatHistory = await chatHistoryRes.json();
        console.log('响应体:', chatHistory);
        const fileUri = `${dirUri}chat_${chatId}.json`;
        await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(chatHistory, null, 2));
      }
      console.log('所有聊天历史已保存到本地 ChatHistory 文件夹');
    } catch (err) {
      console.error('拉取或保存聊天历史失败:', err);
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