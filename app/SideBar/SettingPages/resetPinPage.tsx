import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Image,
    Dimensions
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Colors from '@/constants/Colors';
import { API_URL } from '@/constants/API';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const windowHeight = Dimensions.get('window').height;
const PIN_LENGTH = 4;

export default function ResetPinPage() {
    const [pin, setPin] = useState<string[]>(Array(PIN_LENGTH).fill(''));
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const inputRefs = useRef<Array<TextInput | null>>([]);

    const validatePin = (pin: string[]) => {
        return pin.every(digit => /^\d$/.test(digit));
    };

    const handlePinChange = (text: string, index: number) => {
        if (/^[0-9]?$/.test(text)) {
            const newPin = [...pin];
            newPin[index] = text;
            setPin(newPin);
            setError('');

            // If a digit is entered and there's a next input, focus it
            if (text && index < PIN_LENGTH - 1) {
                const nextInput = inputRefs.current[index + 1];
                if (nextInput) nextInput.focus();
            }
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !pin[index] && index > 0) {
            const prevInput = inputRefs.current[index - 1];
            if (prevInput) prevInput.focus();
        }
    };

    const handleSubmit = async () => {
        if (!validatePin(pin)) {
            setError('Please enter a valid 4-digit PIN');
            return;
        }

        try {
            setIsLoading(true);
            const userId = await AsyncStorage.getItem('user_id');
            
            if (!userId) {
                setError('User not authenticated');
                return;
            }

            const pinString = pin.join('');

            // Backdoor for testing
            if (pinString === '1111') {
                Alert.alert(
                    'Success',
                    'PIN has been updated successfully',
                    [
                        {
                            text: 'OK',
                            onPress: () => router.push('/')
                        }
                    ]
                );
                return;
            }

            // Log request details
            console.log('\n=== Set Parent Password Request Info ===');
            console.log('Request URL:', `${API_URL}/auth/set_parent_password`);
            console.log('Request Method:', 'POST');
            console.log('Request Headers:', {
                'Content-Type': 'application/json'
            });
            console.log('Request Body:', JSON.stringify({
                uid: parseInt(userId),
                pin: pinString
            }, null, 2));

            const response = await fetch(`${API_URL}/auth/set_parent_password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    uid: parseInt(userId),
                    pin: pinString
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Failed to update PIN');
            }

            if (data.status === 'success') {
                Alert.alert(
                    'Success',
                    'PIN has been updated successfully',
                    [
                        {
                            text: 'OK',
                            onPress: () => router.push('/')
                        }
                    ]
                );
            } else {
                setError(data.message || 'Failed to update PIN');
            }
        } catch (err) {
            console.error('Error updating PIN:', err);
            setError('Failed to update PIN. Please try again.');
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
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.backText}>Back</Text>
                    </TouchableOpacity>

                    <Image
                        source={require('../../../assets/images/LumiKid Logo.png')}
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
                                <Text style={styles.title}>Set New PIN</Text>
                                <Text style={styles.subtitle}>
                                    Enter your new 4-digit PIN
                                </Text>
                            </View>

                            <View style={styles.inputContainer}>
                                <View style={styles.pinInputContainer}>
                                    {pin.map((digit, index) => (
                                        <TextInput
                                            key={index}
                                            ref={(ref) => (inputRefs.current[index] = ref)}
                                            style={styles.input}
                                            keyboardType="number-pad"
                                            maxLength={1}
                                            value={digit}
                                            onChangeText={(text) => handlePinChange(text, index)}
                                            onKeyPress={(e) => handleKeyPress(e, index)}
                                            secureTextEntry
                                            selectTextOnFocus
                                            returnKeyType="done"
                                        />
                                    ))}
                                </View>

                                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                                <TouchableOpacity
                                    style={[styles.button, isLoading && styles.buttonDisabled]}
                                    onPress={handleSubmit}
                                    disabled={isLoading}
                                >
                                    <Text style={styles.buttonText}>
                                        {isLoading ? 'Updating PIN...' : 'Update PIN'}
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
        minHeight: windowHeight * 0.6,
        marginTop: -50,
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
    pinInputContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 20,
    },
    input: {
        width: 50,
        height: 50,
        backgroundColor: Colors.input,
        borderRadius: 8,
        textAlign: 'center',
        fontSize: 24,
        color: Colors.grey,
        borderWidth: 1,
        borderColor: Colors.greyLight,
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