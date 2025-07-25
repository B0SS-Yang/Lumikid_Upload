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

  const handleSubmit = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
      setIsLoading(true);
    try {
      console.log('📤 Forgot password request:', {
        url: `${API_URL}/auth/send_reset_code`,
        method: 'POST',
        email: email,
        timestamp: new Date().toISOString()
      });

      const response = await fetch(`${API_URL}/auth/send_reset_code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'cs46_learning_companion_secure_key_2024',
        },
        body: JSON.stringify({ email }),
      });

      console.log('📥 Forgot password response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: new Date().toISOString()
      });

      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
      await AsyncStorage.setItem('pendingVerificationEmail', email);
        Alert.alert('Success', 'Verification code has been sent to your email', [
          {
            text: 'OK',
            onPress: () => router.push('/LoginPages/VerifyResetPassword'),
          },
        ]);
      } else {
        // deal with different error cases
        let errorMessage = 'Failed to send verification code';
        if (response.status === 404) {
          errorMessage = 'Email not found. Please check your email address.';
        } else if (data.detail) {
          errorMessage = data.detail;
        }
        Alert.alert('Error', errorMessage);
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      Alert.alert(
        'Error',
        'Failed to connect to server. Please check your network connection and try again.'
      );
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
        style={[defaultStyles.btn, styles.submitButton, isLoading && styles.disabledButton]}
        onPress={handleSubmit}
        disabled={isLoading}>
        <Text style={styles.submitButtonText}>
          {isLoading ? 'Sending...' : 'Send Verification Code'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.backLink}
        onPress={() => router.back()}>
        <Text style={styles.backLinkText}>Back</Text>
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
  submitButton: {
    backgroundColor: Colors.primary,
    marginBottom: 15,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
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