import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RolesPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'parent' | 'child' | null>(null);

  // Load locally saved role on page load
  useEffect(() => {
    const loadRole = async () => {
      try {
        const saved = await AsyncStorage.getItem('selectedRole');
        if (saved === 'parent' || saved === 'child') {
          setSelectedRole(saved);
        }
      } catch (e) {
        console.log('Failed to read role', e);
      }
    };
    loadRole();
  }, []);

  // Save to local storage after selection
  const handleSelect = async (role: 'parent' | 'child') => {
    try {
      setSelectedRole(role);
      await AsyncStorage.setItem('selectedRole', role);
    } catch (e) {
      console.log('Failed to save role', e);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Text style={styles.title}>Roles</Text>
      </View>

      {/* Parent */}
      <Pressable style={styles.roleRow} onPress={() => handleSelect('parent')}>
        <View>
          <Text style={styles.roleTitle}>Parents</Text>
          <Text style={styles.roleDesc}>
            Allow parents to manage content, unlock advanced features, etc.
          </Text>
        </View>
        <View style={selectedRole === 'parent' ? styles.checkedBox : styles.emptyBox}>
          {selectedRole === 'parent' && <Text style={styles.checkText}>✓</Text>}
        </View>
      </Pressable>

      {/* Child */}
      <Pressable style={styles.roleRow} onPress={() => handleSelect('child')}>
        <View>
          <Text style={styles.roleTitle}>Children</Text>
          <Text style={styles.roleDesc}>
            Provide children with fun and interactive learning experience.
          </Text>
        </View>
        <View style={selectedRole === 'child' ? styles.checkedBox : styles.emptyBox}>
          {selectedRole === 'child' && <Text style={styles.checkText}>✓</Text>}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 24,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backArrow: {
    fontSize: 24,
    marginRight: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  roleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
    alignItems: 'center',
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: '500',
  },
  roleDesc: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 6,
    maxWidth: 250,
  },
  checkedBox: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyBox: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
  },
  checkText: {
    fontSize: 18,
  },
});
