import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ConfirmDeletePage() {
  const router = useRouter();

  const handleDelete = async () => {
    try {
      // 清空所有聊天记录（示例：清除 chatHistory 项）
      await AsyncStorage.removeItem('chatHistory');
      Alert.alert('Success', 'All chat history deleted.');
      router.replace('/SideBar/SettingPages/data-management'); // 或 router.back();
    } catch (e) {
      Alert.alert('Error', 'Failed to delete history.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Text style={styles.title}>Data Management</Text>
      </View>

      {/* 提示语句 */}
      <View style={styles.confirmBox}>
        <Text style={styles.confirmText}>
          Are you sure to delete{'\n'}all chat history?
        </Text>
      </View>

      {/* 底部按钮 */}
      <View style={styles.buttonRow}>
        <Pressable style={styles.button} onPress={handleDelete}>
          <Text style={styles.redText}>Yes</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={() => router.back()}>
          <Text style={styles.blackText}>No</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ccc', // 灰色背景区域
    paddingTop: 60,
    paddingHorizontal: 24,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 24,
    marginRight: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  confirmBox: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 20,
    color: 'red',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  button: {
    flex: 1,
    paddingVertical: 20,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#ddd',
  },
  redText: {
    fontSize: 18,
    color: 'red',
    fontWeight: '600',
  },
  blackText: {
    fontSize: 18,
    color: '#000',
    fontWeight: '600',
  },
});
