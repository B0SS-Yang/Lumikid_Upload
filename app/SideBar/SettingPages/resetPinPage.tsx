import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
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

export default function ResetPinPage() {
    const [pin, setPin] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const validatePin = (value: string) => {
        return /^\d{4}$/.test(value);
    };

    const handlePinChange = (value: string) => {
        if (value.length <= 4 && /^\d*$/.test(value)) {
            setPin(value);
            setError('');
        }
    };

    const handleSubmit = async () => {
        if (!validatePin(pin)) {
            setError('PIN must be exactly 4 digits');
            return;
        }

        try {
            setIsLoading(true);
            const email = await AsyncStorage.getItem('email');
            
            if (!email) {
                setError('User not authenticated');
                return;
            }

            const response = await fetch(`${API_URL}/auth/set_parent_password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password: pin
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

    const handleBack = () => {
        router.back();
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
                                style={styles.backButton}
                                onPress={handleBack}
                            >
                                <Text style={styles.backText}>Back</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.content}>
                            <Text style={styles.title}>Set New PIN</Text>
                            <Text style={styles.subtitle}>
                                Enter your new 4-digit PIN
                            </Text>

                            <View style={styles.inputContainer}>
                                <View style={styles.pinInputContainer}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter new PIN"
                                        value={pin}
                                        onChangeText={handlePinChange}
                                        keyboardType="numeric"
                                        maxLength={4}
                                        placeholderTextColor={Colors.greyLight}
                                    />
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
        alignItems: 'center',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        padding: 8,
    },
    backText: {
        color: Colors.primary,
        fontSize: 16,
        fontWeight: '600',
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
    pinInputContainer: {
        marginBottom: 20,
        alignItems: 'center',
    },
    input: {
        backgroundColor: Colors.input,
        borderRadius: 8,
        padding: 15,
        width: '100%',
        fontSize: 24,
        textAlign: 'center',
        color: Colors.grey,
        letterSpacing: 8,
    },
    button: {
        backgroundColor: Colors.primary,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
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