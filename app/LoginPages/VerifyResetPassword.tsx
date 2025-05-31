import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Keyboard,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/constants/API';
import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';

const CODE_LENGTH = 6;

const EmailVerificationScreen = () => {
  const router = useRouter();
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [timer, setTimer] = useState<number>(60);
  const [error, setError] = useState<string>('');
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);

  useEffect(() => {
    if (timer > 0) {
      const countdown = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(countdown);
    }
  }, [timer]);

  const handleChange = (text: string, index: number) => {
    if (/^[0-9]?$/.test(text)) {
      const newCode = [...code];
      newCode[index] = text;
      setCode(newCode);

      if (text && index < CODE_LENGTH - 1) {
        const nextInput = inputRefs.current[index + 1];
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && code[index] === '' && index > 0) {
      const prevInput = inputRefs.current[index - 1];
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerify = async () => {
    if (!code) {
      Alert.alert('Error', 'Please enter verification code');
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
      const response = await fetch(`${API_URL}/auth/verify_reset_code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'cs46_learning_companion_secure_key_2024',
        },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();
      if (response.ok) {
        router.replace('/LoginPages/ResetPasswordPage');
      } else {
        Alert.alert('Error', data.detail || 'Invalid verification code');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to connect to server. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    const email = await AsyncStorage.getItem('pendingVerificationEmail');
    if (!email) {
      Alert.alert('Error', 'Email information lost, please try again');
      router.replace('/LoginPages/ForgotPasswordPage');
      return;
    }

    try {
      setIsResending(true);
      const response = await fetch(`${API_URL}/auth/forgot_password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'cs46_learning_companion_secure_key_2024',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'New verification code has been sent');
      } else {
        Alert.alert('Error', data.detail || 'Failed to send verification code');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to connect to server. Please try again later.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/LumiKid Logo.png')}
        style={styles.logoImage}
        resizeMode="contain"
        accessibilityLabel="LumiKid Logo"
      />
      <Text style={styles.subtitle}>The verification code has been sent to your email</Text>

      <View style={styles.codeContainer}>
        {code.map((char, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputRefs.current[index] = ref)}
            style={styles.input}
            keyboardType="number-pad"
            maxLength={1}
            value={char}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            returnKeyType="done"
            selectTextOnFocus
            textContentType="oneTimeCode"
          />
        ))}
      </View>

      <TouchableOpacity
        style={[defaultStyles.btn, styles.verifyButton, isLoading && styles.disabledButton]}
        onPress={handleVerify}
        disabled={isLoading}
      >
        <Text style={styles.verifyButtonText}>
          {isLoading ? 'Verifying...' : 'Verify Code'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.resendButton, isResending && styles.disabledButton]}
        onPress={handleResend}
        disabled={isResending}
      >
        <Text style={styles.resendButtonText}>
          {isResending ? 'Sending...' : 'Resend Code'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
        <Text style={styles.backLinkText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
};

export default EmailVerificationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 100,
    paddingHorizontal: 30,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logoImage: {
    width: 200,
    height: 60,
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  input: {
    width: 45,
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 20,
    marginHorizontal: 5,
  },
  verifyButton: {
    backgroundColor: Colors.primary,
    marginTop: 30,
    width: '100%',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  resendButton: {
    backgroundColor: Colors.primary,
    marginTop: 10,
    width: '100%',
  },
  resendButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  backLink: {
    marginTop: 10,
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 8,
  },
  backLinkText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#999',
  },
});
