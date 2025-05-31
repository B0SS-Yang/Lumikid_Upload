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
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    const email = await AsyncStorage.getItem('pendingVerificationEmail');
    if (!email) {
      Alert.alert('Error', 'Email information lost, please try again');
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
        Alert.alert('Success', 'Password reset successful!', [
          {
            text: 'OK',
            onPress: async () => {
              await AsyncStorage.removeItem('pendingVerificationEmail');
              router.replace('/LoginPages/LoginPage');
            },
          },
        ]);
      } else {
        Alert.alert('Reset Failed', data.detail || 'Please try again later');
      }
    } catch (err) {
      Alert.alert('Reset Failed', err instanceof Error ? err.message : 'Please try again later');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await WebBrowser.openAuthSessionAsync(
        `${API_URL}/auth/login/google`,
        'yourapp://auth-callback'
      );
      if (result.type === 'success' && result.url) {
        const match = result.url.match(/access_token=([^&]+)/);
        if (match) {
          const token = match[1];
          await AsyncStorage.setItem('token', token);
          router.replace('/');
        } else {
          Alert.alert('Login Failed', 'Token not received');
        }
      }
    } catch (err) {
      Alert.alert('Login Failed', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="New Password"
          placeholderTextColor={Colors.greyLight}
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm New Password"
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
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
        <Text style={styles.backLinkText}>Back</Text>
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