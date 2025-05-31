import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/constants/API';
import Colors from '@/constants/Colors';

interface UserInfo {
  user_id: number;
  email: string;
  name: string;
  profile_picture_url: string;
  current_plan: string;
  google_id: string | null;
  apple_id: string | null;
  activated: number;
  verification_code: string | null;
  expire_time: string | null;
  parent_password: string | null;
  age: number;
  gender: string;
  reset_verified: boolean;
  created_at: string;
  last_active_at: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentRole, setCurrentRole] = useState<string>('');

  useEffect(() => {
    fetchUserInfo();
    getCurrentRole();
  }, []);

  const getCurrentRole = async () => {
    try {
      const role = await AsyncStorage.getItem('currentRole');
      setCurrentRole(role || 'Child');
    } catch (error) {
      console.error('Error getting current role:', error);
      setCurrentRole('Child');
    }
  };

  const fetchUserInfo = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('Token not found in AsyncStorage');
        router.push('../LoginPages/LoginIndexPage');
        return;
      }

      console.log('Making request to /auth/me with token:', token);
      
      const url = `${API_URL}/auth/get_me?token=${token}`;
      console.log('Request URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
        },
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        console.error('API Error:', data);
        throw new Error('Failed to fetch user info');
      }

      setUserInfo(data);
    } catch (error) {
      console.error('Error in fetchUserInfo:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Settings</Text>

      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <SettingItem 
          label="Name" 
          value={userInfo?.name || 'Guest'} 
        />
        <SettingItem 
          label="Email" 
          value={userInfo?.email || 'Not available'} 
        />
        <SettingItem 
          label="Age" 
          value={userInfo?.age?.toString() || 'Not set'} 
        />
        <SettingItem 
          label="Gender" 
          value={userInfo?.gender || 'Not set'} 
        />
      </View>

      {/* Account Management Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Management</Text>
        <SettingItem 
          label="Current Role" 
          value={currentRole} 
        />
        <SettingItem 
          label="Plan" 
          value={userInfo?.current_plan || 'Free'} 
        />
        <SettingItem 
          label="Account Status" 
          value={userInfo?.activated ? 'Active' : 'Inactive'} 
        />
        <Pressable onPress={() => router.push('/SideBar/SettingPages/data-management')}>
           <SettingItem label="Data Management" />
        </Pressable>
        <Pressable onPress={() => router.push('/SideBar/SettingPages/resetPinPageVerify')}>
           <SettingItem 
             label="Reset Parent Password" 
             value={userInfo?.parent_password ? 'Set' : 'Not Set'}
           />
        </Pressable>
      </View>

      {/* Preference Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preference</Text>
        <Pressable onPress={() => router.push('//mode')}>
           <SettingItem label="Mode" />
        </Pressable>
        <Pressable onPress={() => router.push('/SideBar/SettingPages/font')}>
           <SettingItem label="Font" />
        </Pressable>
      </View>

      {/* Information Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Information</Text>
        <Pressable onPress={() => router.push('/SideBar/SettingPages/privacy')}>
           <SettingItem label="Privacy Policy" />
        </Pressable>
        <Pressable onPress={() => router.push('/SideBar/SettingPages/terms')}>
           <SettingItem label="Terms of service" />
        </Pressable>
        <SettingItem 
          label="Member Since" 
          value={new Date(userInfo?.created_at || '').toLocaleDateString()} 
        />
        <SettingItem 
          label="Last Active" 
          value={new Date(userInfo?.last_active_at || '').toLocaleDateString()} 
        />
      </View>

      {/* Logout Button */}
      <Pressable 
        onPress={async () => {
          await AsyncStorage.clear();
          router.push('../LoginPages/LoginIndexPage');
        }}
        style={styles.logoutButton}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </ScrollView>
  );
}

// Reusable setting item component
function SettingItem({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.item}>
      <Text style={styles.itemLabel}>{label}</Text>
      {value && <Text style={styles.itemValue}>{value}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 50,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 10,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
  },
  itemLabel: {
    fontSize: 16,
  },
  itemValue: {
    fontSize: 16,
    color: '#999',
  },
  logoutButton: {
    marginTop: 30,
    paddingVertical: 15,
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutText: {
    color: '#e53935',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
