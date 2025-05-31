import { Text, View, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import { API_URL } from '@/constants/API';

// 定义用户凭证的数据结构
interface UserCredentials {
  email: string;
  password: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>("");

  // 注册用户的函数
  const registerUser = async (userData: UserCredentials) => {
    try {
      console.log('API URL:', `${API_URL}/auth/register`);
      console.log('Sending registration data:', JSON.stringify(userData, null, 2));
      
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      // 检查响应状态
      if (!response.ok) {
        const errorData = await response.json();
        console.log('Error Response Status:', response.status);
        console.log('Error Response Data:', JSON.stringify(errorData, null, 2));
        
        // 根据不同的错误类型返回不同的错误信息
        switch (response.status) {
          case 400:
            if (errorData.detail?.includes('email')) {
              throw new Error('The email format is incorrect');
            } else if (errorData.detail?.includes('password')) {
              throw new Error('The password does not meet the requirements');
            } else {
              throw new Error(errorData.detail || 'Request parameter error');
            }
          case 409:
            // 检查是否是未验证的情况
            console.log('409 Error Data:', JSON.stringify(errorData, null, 2));
            if (errorData.detail?.includes('not verified')) {
              Alert.alert('Email Already Registered', 'This email has already been registered. Please verify your email.', [
                {
                  text: 'OK',
                  onPress: async () => {
                    try {
                      await AsyncStorage.setItem('pendingVerificationEmail', email);
                      router.replace('/LoginPages/VerifyCodePage');
                    } catch (err) {
                      console.error('Error saving email:', err);
                      Alert.alert('Error', 'Failed to proceed to verification page');
                    }
                  }
                }
              ]);
              return;
            }
            throw new Error('The email has already been registered');
          case 422:
            throw new Error('Data validation failed, please check the input');
          case 500:
            throw new Error('Server internal error, please try again later');
          default:
            throw new Error(errorData.detail || 'Registration failed');
        }
      }

      // 获取响应数据
      const data = await response.json();
      console.log('Success Response Data:', JSON.stringify(data, null, 2));
      
      // Check user verification status
      if (data.status === 'unverified') {
        Alert.alert('Success', 'Registration successful! Please verify your email.', [
          {
            text: 'OK',
            onPress: async () => {
              try {
                // Save email for verification page
                await AsyncStorage.setItem('pendingVerificationEmail', email);
                // Navigate to verification page
                router.replace('/LoginPages/VerifyCodePage');
              } catch (error) {
                console.error('Error saving email:', error);
                Alert.alert('Error', 'Failed to proceed to verification page');
              }
            }
          }
        ]);
      } else {
        // If already verified (unusual case), go to login
        Alert.alert('Success', 'Registration successful! Please login to continue.', [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/LoginPages/LoginPage');
            }
          }
        ]);
      }
    } catch (error: any) {
      console.log('Registration error:', error);
      
      // 检查是否是未验证的错误
      if (error.message?.includes('unverified') || error.message?.includes('not verified')) {
        Alert.alert('Verification Required', 'Please verify your email first.', [
          {
            text: 'OK',
            onPress: async () => {
              try {
                await AsyncStorage.setItem('pendingVerificationEmail', email);
                router.replace('/LoginPages/VerifyCodePage');
              } catch (err) {
                console.error('Error saving email:', err);
                Alert.alert('Error', 'Failed to proceed to verification page');
              }
            }
          }
        ]);
        return;
      }

      if (error.message?.includes('Failed to fetch') || error.message?.includes('Network request failed')) {
        Alert.alert(
          'Network Error',
          `Error type: Network connection failed\nReason: ${error.message}\nPlease check:\n1. Whether the network connection is normal\n2. Whether the server address is correct\n3. Whether the proxy is enabled\n4. Firewall settings`,
          [
            {
              text: 'Retry',
              onPress: () => handleRegister()
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
      } else {
        Alert.alert('Error', error.message || 'Registration failed, please try again later');
      }
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await registerUser({ email, password });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <View style={styles.inputContainer}>
        <TextInput 
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={Colors.greyLight}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput 
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={Colors.greyLight}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TextInput 
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor={Colors.greyLight}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
      </View>
      
      <TouchableOpacity 
        style={[defaultStyles.btn, styles.registerButton, isLoading && styles.disabledButton]}
        onPress={handleRegister}
        disabled={isLoading}>
        <Text style={styles.registerButtonText}>
          {isLoading ? 'Registering...' : 'Register'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.loginLink}
        onPress={() => router.push('../LoginPages/LoginPage')}>
        <Text style={styles.loginLinkText}>Already have an account? Login</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.loginLink}
        onPress={() => router.push('../LoginPages/TutorialPage')}>
        <Text style={styles.loginLinkText}>Skip to tutorial</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.loginLink}
        onPress={() => router.push('../LoginPages/VerifyCodePage')}>
        <Text style={styles.loginLinkText}>Skip to verify code</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.loginLink}
        onPress={() => router.push('../LoginPages/PinSettingPage')}>
        <Text style={styles.loginLinkText}>Skip to Pin Setting</Text>
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
    marginBottom: 30,
  },
  input: {
    backgroundColor: Colors.input,
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
  },
  registerButton: {
    backgroundColor: Colors.primary,
    marginBottom: 15,
  },
  disabledButton: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: Colors.light,
    fontSize: 18,
    fontWeight: '600',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 15,
  },
  loginLinkText: {
    color: Colors.primary,
    fontSize: 16,
  },
});
