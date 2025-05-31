import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Image,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Colors from '@/constants/Colors';
import { API_URL } from '@/constants/API';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export default function PinSettingPage() {
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSkip = () => {
        Alert.alert(
            'Skip Parent Pin Setup',
            'Are you sure you want to skip setting up a parent PIN? You can always set it up later in settings.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Skip',
                    onPress: () => router.push('/')
                }
            ]
        );
    };

    const validatePin = (value: string) => {
        return /^\d{4}$/.test(value); // PIN must be exactly 4 digits
    };

    const handlePinChange = (value: string) => {
        // Only allow numbers and max 4 digits
        if (/^\d{0,4}$/.test(value)) {
            setPin(value);
            setError('');
        }
    };

    const handleConfirmPinChange = (value: string) => {
        // Only allow numbers and max 4 digits
        if (/^\d{0,4}$/.test(value)) {
            setConfirmPin(value);
            setError('');
        }
    };

    const handleSubmit = async () => {
        if (!validatePin(pin)) {
            setError('PIN must be exactly 4 digits');
            return;
        }

        if (pin !== confirmPin) {
            setError('PINs do not match');
            return;
        }

        try {
            setIsLoading(true);
            const email = await AsyncStorage.getItem('email');
            
            if (!email) {
                setError('User not authenticated');
                return;
            }

            // Set parent password using the backend API
            const response = await fetch(`${API_URL}/auth/set_parent_password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': 'cs46_learning_companion_secure_key_2024',
                },
                body: JSON.stringify({
                    email: email,
                    password: pin
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Failed to set parent PIN');
            }

            if (data.status === 'success') {
                Alert.alert(
                    'Success',
                    'Parent PIN has been set successfully',
                    [
                        {
                            text: 'OK',
                            onPress: () => router.push('/')
                        }
                    ]
                );
            } else {
                setError(data.message || 'Failed to set parent PIN');
            }
        } catch (err) {
            console.error('Error setting parent PIN:', err);
            setError('Failed to set parent PIN. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <StatusBar style="dark" />
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView 
                        contentContainerStyle={{ flexGrow: 1 }}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.header}>
                            <TouchableOpacity 
                                style={styles.skipButton}
                                onPress={handleSkip}
                            >
                                <Text style={styles.skipText}>Skip</Text>
                            </TouchableOpacity>

                            <Image
                                source={require('../../assets/images/LumiKid Logo.png')}
                                style={styles.logoImage}
                                resizeMode="contain"
                            />

                            <View style={styles.headerRight} />
                        </View>

                        <View style={styles.content}>
                            <Text style={styles.title}>Set Parent PIN</Text>
                            <Text style={styles.subtitle}>
                                Create a 4-digit PIN to protect parental control settings
                            </Text>

                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter 4-digit PIN"
                                    value={pin}
                                    onChangeText={handlePinChange}
                                    secureTextEntry
                                    keyboardType="number-pad"
                                    maxLength={4}
                                    placeholderTextColor={Colors.greyLight}
                                />

                                <TextInput
                                    style={styles.input}
                                    placeholder="Confirm 4-digit PIN"
                                    value={confirmPin}
                                    onChangeText={handleConfirmPinChange}
                                    secureTextEntry
                                    keyboardType="number-pad"
                                    maxLength={4}
                                    placeholderTextColor={Colors.greyLight}
                                />

                                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                                <TouchableOpacity
                                    style={[styles.button, isLoading && styles.buttonDisabled]}
                                    onPress={handleSubmit}
                                    disabled={isLoading}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.buttonText}>
                                        {isLoading ? 'Setting PIN...' : 'Set PIN'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </SafeAreaProvider>
    );
}

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
    },
    skipButton: {
        padding: 8,
    },
    skipText: {
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
    content: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
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
        marginBottom: 30,
    },
    inputContainer: {
        width: '100%',
        maxWidth: 300,
        alignSelf: 'center',
    },
    input: {
        backgroundColor: Colors.input,
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
        fontSize: 16,  // 调整为标准字体大小
        color: Colors.grey,
        textAlign: 'left', // 左对齐，与其他输入框保持一致
        letterSpacing: 1,  // 恢复正常字符间距
        width: '100%',
        borderWidth: 1,
        borderColor: Colors.greyLight,
    },
    button: {
        backgroundColor: Colors.primary,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
        width: '100%', // 确保按钮宽度一致
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: Colors.light,
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorText: {
        color: Colors.orange,
        textAlign: 'center',
        marginTop: 10,
    },
}); 