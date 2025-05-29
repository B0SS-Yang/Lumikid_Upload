import { View, StyleSheet, Image, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { defaultStyles } from '@/constants/Styles';
import Colors from '@/constants/Colors';
import * as WebBrowser from 'expo-web-browser';
import { API_URL } from '@/constants/API';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import { openAuthSessionAsync } from 'expo-web-browser';

const Page = () => {
  const { bottom } = useSafeAreaInsets();
  const router = useRouter();

  const redirectUri = AuthSession.makeRedirectUri();
  console.log('【DEBUG】redirectUri:', redirectUri);

  const handleGoogleLogin = async () => {
    console.log('【DEBUG】handleGoogleLogin redirectUri:', redirectUri);
    const authUrl = `${API_URL}/auth/google_login?redirect_uri=${encodeURIComponent(redirectUri)}`;
    console.log('【DEBUG】authUrl:', authUrl);
    const result = await openAuthSessionAsync(authUrl, redirectUri);
    if (result.type === 'success' && result.url) {
      const match = result.url.match(/access_token=([^&]+)/);
      if (match) {
        const token = match[1];
        await AsyncStorage.setItem('token', token);
        router.replace('/');
      } else {
        Alert.alert('登录失败', '未获取到token');
      }
    } else {
      Alert.alert('登录失败', '未获取到token');
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/LumiKid Logo.png')}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="LumiKid Logo"
      />
      <View style={[styles.bottomSheet, { paddingBottom: bottom +25 }]}>  
        <TouchableOpacity style={[defaultStyles.btn, styles.btnDark]} onPress={handleGoogleLogin}>
          <Ionicons name="logo-google" size={16} style={styles.btnIcon} color={'#fff'} />
          <Text style={styles.btnDarkText}>Continue with Google</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[defaultStyles.btn, styles.btnDark]}
          onPress={() => router.push('/LoginPages/RegisterPage')}>
            <Ionicons name="mail" size={20} style={styles.btnIcon} color={'#fff'} />
            <Text style={styles.btnDarkText}>Register with email</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[defaultStyles.btn, styles.btnDark]}
          onPress={() => router.push('/LoginPages/LoginPage')}>
            <Text style={styles.btnDarkText}>Log in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent:"center",
  },
  logo: {
    width: 205,
    height: 60,
    marginLeft: 'auto',
    marginRight: 'auto',
    marginBottom: 150,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 26,
    gap: 14,
  },
  btnLight: {
    backgroundColor: '#fff',
  },
  btnLightText: {
    color: '#000',
    fontSize: 20,
  },
  btnDark: {
    backgroundColor: Colors.grey,
  },
  btnDarkText: {
    color: '#fff',
    fontSize: 20,
  },
  btnOutline: {
    borderWidth: 3,
    borderColor: Colors.grey,
  },
  btnIcon: {
    paddingRight: 6,
  },
});
export default Page;