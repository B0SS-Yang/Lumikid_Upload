import { Text, View, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import { API_URL } from '@/constants/API';
import * as WebBrowser from 'expo-web-browser';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('错误', '请填写所有字段');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('错误', '两次输入的密码不一致');
      return;
    }
    const email = await AsyncStorage.getItem('pendingVerificationEmail');
    if (!email) {
      Alert.alert('错误', '邮箱信息丢失，请重新操作');
      router.replace('/LoginPages/ForgotPasswordPage');
      return;
    }
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/auth/reset_password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: newPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('成功', '密码重置成功！', [
          {
            text: '确定',
            onPress: async () => {
              await AsyncStorage.removeItem('pendingVerificationEmail');
              router.replace('/LoginPages/LoginPage');
            },
          },
        ]);
      } else {
        Alert.alert('重置失败', data.detail || '请稍后重试');
      }
    } catch (err) {
      Alert.alert('重置失败', err instanceof Error ? err.message : '请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // 打开后端 Google 登录入口
      const result = await WebBrowser.openAuthSessionAsync(
        `${API_URL}/auth/login/google`,
        // 这里填写你的前端回调地址（需和后端REDIRECT_URI一致）
        'yourapp://auth-callback'
      );
      // result.url 里会包含 access_token
      if (result.type === 'success' && result.url) {
        // 解析 access_token
        const match = result.url.match(/access_token=([^&]+)/);
        if (match) {
          const token = match[1];
          await AsyncStorage.setItem('token', token);
          // 跳转到主页面
          router.replace('/');
        } else {
          Alert.alert('登录失败', '未获取到token');
        }
      }
    } catch (err) {
      Alert.alert('登录失败', err instanceof Error ? err.message : '未知错误');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>重置密码</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="新密码"
          placeholderTextColor={Colors.greyLight}
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="确认新密码"
          placeholderTextColor={Colors.greyLight}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
      </View>
      <TouchableOpacity
        style={[defaultStyles.btn, styles.resetButton, isLoading && styles.disabledButton]}
        onPress={handleResetPassword}
        disabled={isLoading}>
        <Text style={styles.resetButtonText}>
          {isLoading ? '重置中...' : '重置密码'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
        <Text style={styles.backLinkText}>返回</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light, padding: 20, justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: Colors.brown, marginBottom: 40, textAlign: 'center' },
  inputContainer: { gap: 15, marginBottom: 20 },
  input: { backgroundColor: Colors.input, padding: 15, borderRadius: 12, fontSize: 16 },
  resetButton: { backgroundColor: Colors.primary, marginBottom: 15 },
  disabledButton: { opacity: 0.7 },
  resetButtonText: { color: Colors.light, fontSize: 18, fontWeight: '600' },
  backLink: { alignItems: 'center', marginTop: 10 },
  backLinkText: { color: Colors.primary, fontSize: 16 },
}); 