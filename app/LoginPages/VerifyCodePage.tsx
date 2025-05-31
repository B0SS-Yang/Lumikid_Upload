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

  const handleSubmit = async () => {
    const enteredCode = code.join('');
    if (enteredCode.length < CODE_LENGTH) {
      setError('Please complete the verification code input');
      return;
    }

    try {
      const email = await AsyncStorage.getItem('pendingVerificationEmail');
      if (!email) {
        setError('Please login again');
        return;
      }

      const response = await fetch(`${API_URL}/auth/verify_code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code: enteredCode,
        }),
      });

      const data = await response.json();
      console.log('Verification response:', data);

      if (response.ok) {
        // Save verification code to AsyncStorage
        await AsyncStorage.setItem('verificationCode', enteredCode);
        
        // Show success alert and then redirect
        Alert.alert(
          'Success',
          'Verification successful! Your account has been activated. Please proceed to login.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Clear the verification code input
                setCode(Array(CODE_LENGTH).fill(''));
                // Redirect to login page
                router.replace('/LoginPages/LoginPage');
              }
            }
          ]
        );
      } else {
        setError(data.detail || 'Verification code error, please try again');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || 'Verification failed, please try again');
    }
  };

  const handleResend = async () => {
    if (timer === 0) {
      try {
        const email = await AsyncStorage.getItem('pendingVerificationEmail');
        if (!email) {
          setError('Please login again');
          return;
        }

        const response = await fetch(`${API_URL}/auth/resend-verification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();
        console.log('Resend response:', data);

        if (response.ok) {
          setCode(Array(CODE_LENGTH).fill(''));
          setError('');
          setTimer(60);
          Alert.alert('Success', 'A new verification code has been sent to your email');
        } else {
          setError(data.detail || 'Resend failed, please try again');
        }
      } catch (err: any) {
        console.error('Resend error:', err);
        setError(err.message || 'Resend failed, please try again');
      }
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

      <TouchableOpacity onPress={handleResend} disabled={timer > 0}>
        <Text style={[styles.resendText, timer > 0 && styles.resendTextDisabled]}>
          {timer > 0 ? `${timer} seconds later resend` : 'Resend verification code'}
        </Text>
      </TouchableOpacity>

      {error !== '' && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity 
        style={[defaultStyles.btn, styles.submitButton]} 
        onPress={handleSubmit}
      >
        <Text style={styles.submitText}>Verify</Text>
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
  resendText: {
    marginTop: 10,
    fontSize: 14,
    color: Colors.primary,
  },
  resendTextDisabled: {
    color: '#999',
  },
  errorText: {
    marginTop: 15,
    color: 'red',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    marginTop: 30,
    width: '100%',
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
