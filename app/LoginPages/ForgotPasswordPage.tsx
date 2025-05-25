import { Text, View, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';
import { useState } from 'react';
import { API_URL } from '@/constants/API';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    try {
      setIsLoading(true);
      const requestUrl = `${API_URL}/auth/reset-password`;
      const requestData = { email };
      
      console.log('\n=== Reset Password Request Information ===');
      console.log('Request URL:', requestUrl);
      console.log('Request Method: POST');
      console.log('Request Body:', JSON.stringify(requestData, null, 2));

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.detail || 'Failed to send reset email');
      }

      Alert.alert(
        'Success',
        'Password reset instructions have been sent to your email',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Error', 'Failed to send reset email, please try again later');
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
        onPress={handleResetPassword}
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