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
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/constants/API';
import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const CODE_LENGTH = 6;
const windowHeight = Dimensions.get('window').height;

const EmailVerificationScreen = () => {
  const router = useRouter();
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [timer, setTimer] = useState<number>(60);
  const [error, setError] = useState<string>('');
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
    const enteredCode = code.join('');
    if (enteredCode.length < CODE_LENGTH) {
      setError('Please complete the verification code input');
      return;
    }

      const email = await AsyncStorage.getItem('pendingVerificationEmail');
      if (!email) {
      setError('Email information lost, please try again');
      router.replace('/LoginPages/ForgotPasswordPage');
        return;
      }

    try {
      setIsLoading(true);
      setError('');
      
      console.log('\n=== Verify Reset Code Request Info ===');
      console.log('Request URL:', `${API_URL}/auth/verify_reset_code`);
      console.log('Request Method:', 'POST');
      console.log('Request Headers:', {
        'Content-Type': 'application/json',
        'x-api-key': 'cs46_learning_companion_secure_key_2024',
      });
      console.log('Request Body:', JSON.stringify({ 
        email, 
        code: enteredCode 
      }, null, 2));
      console.log('==================\n');

      const response = await fetch(`${API_URL}/auth/verify_reset_code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'cs46_learning_companion_secure_key_2024',
        },
        body: JSON.stringify({ email, code: enteredCode }),
      });

      const data = await response.json();
      
      console.log('\n=== Verify Reset Code Response Info ===');
      console.log('Status Code:', response.status);
      console.log('Status Text:', response.statusText);
      console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
      console.log('Response Data:', JSON.stringify(data, null, 2));
      console.log('==================\n');

      if (response.ok) {
        router.replace('/LoginPages/ResetPasswordPage');
      } else {
        setError(data.detail || 'Invalid verification code');
      }
    } catch (err) {
      setError('Failed to connect to server. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    
        const email = await AsyncStorage.getItem('pendingVerificationEmail');
        if (!email) {
      setError('Email information lost, please try again');
      router.replace('/LoginPages/ForgotPasswordPage');
          return;
        }

    try {
      setError('');
      
      console.log('\n=== Send Reset Code Request Info ===');
      console.log('Request URL:', `${API_URL}/auth/send_reset_code`);
      console.log('Request Method:', 'POST');
      console.log('Request Headers:', {
        'Content-Type': 'application/json',
        'x-api-key': 'cs46_learning_companion_secure_key_2024',
      });
      console.log('Request Body:', JSON.stringify({ email }, null, 2));
      console.log('==================\n');

      const response = await fetch(`${API_URL}/auth/send_reset_code`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          'x-api-key': 'cs46_learning_companion_secure_key_2024',
          },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();
      
      console.log('\n=== Send Reset Code Response Info ===');
      console.log('Status Code:', response.status);
      console.log('Status Text:', response.statusText);
      console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
      console.log('Response Data:', JSON.stringify(data, null, 2));
      console.log('==================\n');

        if (response.ok) {
          setCode(Array(CODE_LENGTH).fill(''));
          setTimer(60);
        Alert.alert('Success', 'New verification code has been sent');
        } else {
        setError(data.detail || 'Failed to send verification code');
        }
    } catch (err) {
      setError('Failed to connect to server. Please try again later.');
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

      <Image
        source={require('../../assets/images/LumiKid Logo.png')}
        style={styles.logoImage}
        resizeMode="contain"
          />

          <View style={styles.headerRight} />
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollViewContent}
            bounces={false}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.contentContainer}>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>Verify Code</Text>
                <Text style={styles.subtitle}>
                  The verification code has been sent to your email
                </Text>
              </View>

              <View style={styles.inputContainer}>
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

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity 
                  style={[styles.button, isLoading && styles.buttonDisabled]} 
                  onPress={handleVerify}
                  disabled={isLoading}
      >
                  <Text style={styles.buttonText}>
                    {isLoading ? 'Verifying...' : 'Verify'}
                  </Text>
      </TouchableOpacity>
    </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default EmailVerificationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingHorizontal: 16,
    backgroundColor: Colors.light,
  },
  backButton: {
    padding: 8,
    minWidth: 40,
  },
  backText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  logoImage: {
    width: 120,
    height: 40,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    justifyContent: 'center',
    minHeight: windowHeight * 0.7,
  },
  titleContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.grey,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.greyLight,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  inputContainer: {
    width: '100%',
    maxWidth: 300,
    alignSelf: 'center',
    alignItems: 'center',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  input: {
    width: 45,
    height: 50,
    borderWidth: 1,
    borderColor: Colors.greyLight,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 20,
    marginHorizontal: 5,
    backgroundColor: Colors.input,
    color: Colors.grey,
  },
  resendText: {
    marginTop: 10,
    fontSize: 14,
    color: Colors.primary,
  },
  resendTextDisabled: {
    color: Colors.greyLight,
  },
  errorText: {
    color: Colors.orange,
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
    height: 50,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: Colors.light,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
