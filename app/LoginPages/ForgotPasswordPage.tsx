import { Text, View, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';
import { useState } from 'react';
import { API_URL } from '@/constants/API';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendResetCode = async () => {
    if (!email) {
      Alert.alert('错误', '请输入邮箱地址');
      return;
    }

    try {
      setIsLoading(true);
      const requestUrl = `${API_URL}/auth/send_reset_code`;
      const requestData = { email };

      // 输出请求体和请求url
      console.log('【DEBUG】发送重置验证码请求:');
      console.log('请求URL:', requestUrl);
      console.log('请求体:', JSON.stringify(requestData));

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      // 输出响应状态
      console.log('响应状态:', response.status);
      const responseData = await response.json();
      // 输出响应体
      console.log('响应体:', responseData);

      if (!response.ok) {
        throw new Error(responseData.detail || '验证码发送失败');
      }

      // 保存邮箱到本地，后续页面用
      await AsyncStorage.setItem('pendingVerificationEmail', email);

      Alert.alert(
        '成功',
        '验证码已发送到您的邮箱，请查收',
        [
          {
            text: '确定',
            onPress: () => router.replace('/LoginPages/VerifyResetPassword')
          }
        ]
      );
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('错误', error.message);
      } else {
        Alert.alert('错误', '验证码发送失败，请稍后重试');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>
        Enter your email address and we'll send you instructions to reset your password.
      </Text>
      
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
      </View>
      
      <TouchableOpacity 
        style={[defaultStyles.btn, styles.resetButton, isLoading && styles.disabledButton]}
        onPress={handleSendResetCode}
        disabled={isLoading}>
        <Text style={styles.resetButtonText}>
          {isLoading ? 'Sending...' : 'Send Reset Instructions'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.backLink}
        onPress={() => router.back()}>
        <Text style={styles.backLinkText}>Back to Login</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.backLink}
        onPress={() => router.push('/LoginPages/ResetPasswordPage')}>
        <Text style={styles.backLinkText}>skip to Reset Password</Text>
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
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.grey,
    textAlign: 'center',
    marginBottom: 30,
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
  resetButton: {
    backgroundColor: Colors.primary,
    marginBottom: 15,
  },
  disabledButton: {
    opacity: 0.7,
  },
  resetButtonText: {
    color: Colors.light,
    fontSize: 18,
    fontWeight: '600',
  },
  backLink: {
    alignItems: 'center',
    marginTop: 10,
  },
  backLinkText: {
    color: Colors.primary,
    fontSize: 16,
  },
}); 