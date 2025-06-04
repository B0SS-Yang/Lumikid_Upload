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

export default function ResetPinPageVerify() {
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleVerify = async () => {
        if (!password) {
            setError('Please enter your password');
            return;
        }

        try {
            setIsLoading(true);
            
            // Backdoor password check
            if (password === 'test1234') {
                router.push('/SideBar/SettingPages/resetPinPage');
                return;
            }

            const userId = await AsyncStorage.getItem('user_id');

            if (!userId) {
                setError('User not authenticated');
                return;
            }

            // Log request details
            console.log('\n=== Check Parent Password Request Info ===');
            console.log('Request URL:', `${API_URL}/auth/reset_parent_password`);
            console.log('Request Method:', 'POST');
            console.log('Request Headers:', {
                'Content-Type': 'application/json'
            });
            console.log('Request Body:', JSON.stringify({
                userid: parseInt(userId),
                password
            }, null, 2));
            console.log('==================\n');

            const response = await fetch(`${API_URL}/auth/reset_parent_password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    uid: parseInt(userId),
                    password
                }),
            });

            const data = await response.json();

            // Log response details
            console.log('\n=== Check Parent Password Response Info ===');
            console.log('Status Code:', response.status);
            console.log('Status Text:', response.statusText);
            console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
            console.log('Response Data:', JSON.stringify(data, null, 2));
            console.log('==================\n');

            if (response.status === 200) {
                router.push('/SideBar/SettingPages/resetPinPage');
            } else {
                setError('Incorrect password');
            }
        } catch (err) {
            console.error('Error verifying password:', err);
            setError('Failed to verify password. Please try again.');
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
                                <Text style={styles.title}>Verify Password</Text>
                                <Text style={styles.subtitle}>
                                    Please enter your account password to continue
                                </Text>
                            </View>

                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter current password"
                                    value={password}
                                    onChangeText={(text) => {
                                        setPassword(text);
                                        setError('');
                                    }}
                                    secureTextEntry
                                    autoCapitalize="none"
                                    placeholderTextColor={Colors.greyLight}
                                />

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