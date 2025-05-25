import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';


export default function SettingsPage() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Settings</Text>

      {/* Account Management Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Management</Text>
        <SettingItem label="Email" value="xxxx@xxx.com" />
        <Pressable onPress={() => router.push('/SideBar/SettingPages/roles')}>
           <SettingItem label="Roles" />
        </Pressable>
        <SettingItem label="Subscription" />
        <Pressable onPress={() => router.push('/SideBar/SettingPages/data-management')}>
           <SettingItem label="Data Management" />
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
      </View>

      {/* Logout Button */}
      <Pressable 
        onPress={() => router.push('../LoginPages/LoginIndexPage')}
        style={styles.logoutButton}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </ScrollView>
  );
}

// 可复用设置项组件
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
