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
    Dimensions,
    ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Colors from '@/constants/Colors';
import { API_URL } from '@/constants/API';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const windowHeight = Dimensions.get('window').height;

export default function PinSettingPage() {
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSkip = async () => {
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
                    onPress: async () => {
                        await AsyncStorage.setItem('userMode', 'Child');
                        router.push('/');
                    }
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
            const userId = await AsyncStorage.getItem('user_id');
            
            if (!userId) {
                setError('User not authenticated');
                return;
            }

            console.log('Setting PIN for user:', { userId });

            // Log request details
            console.log('\n=== Set Parent PIN Request ===');
            console.log('Request URL:', `${API_URL}/auth/set_parent_password`);
            console.log('Request Method:', 'POST');
            console.log('Request Headers:', {
                'Content-Type': 'application/json'
            });
            console.log('Request Body:', JSON.stringify({
                uid: parseInt(userId),
                pin: pin
            }, null, 2));
            console.log('==================\n');

            const response = await fetch(`${API_URL}/auth/set_parent_password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    uid: parseInt(userId),
                    pin: pin
                }),
            });

            const data = await response.json();

            // Log response details
            console.log('\n=== Set Parent PIN Response ===');
            console.log('Response Status:', response.status);
            console.log('Response Data:', JSON.stringify(data, null, 2));
            console.log('==================\n');

            if (!response.ok) {
                throw new Error(data.detail || 'Failed to set parent PIN');
            }

            if (data.status === 'success') {
                // Set user mode to Child before redirecting
                await AsyncStorage.setItem('userMode', 'Child');
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
                
                {/* Header */}
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
                                <Text style={styles.title}>Set Parent PIN</Text>
                                <Text style={styles.subtitle}>
                                    Create a 4-digit PIN to protect parental control settings
                                </Text>
                            </View>

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
        backgroundColor: Colors.light,
    },
    skipButton: {
        padding: 8,
        minWidth: 40,
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
    input: {
        backgroundColor: Colors.input,
        borderRadius: 8,
        padding: 15,
        marginBottom: 15,
        fontSize: 16,
        color: Colors.grey,
        width: '100%',
        borderWidth: 1,
        borderColor: Colors.greyLight,
        height: 50,
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
    errorText: {
        color: Colors.orange,
        textAlign: 'center',
        marginTop: 10,
        fontSize: 14,
    },
}); 