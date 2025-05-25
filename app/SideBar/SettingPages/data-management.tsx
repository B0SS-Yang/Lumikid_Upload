import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';

export default function DataManagementPage() {
  const router = useRouter();

  // 删除数据逻辑（这里只是演示弹窗）
  const handleDelete = () => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete all chat history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // 这里写实际删除逻辑
            console.log('Chat history deleted');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Text style={styles.title}>Data Management</Text>
      </View>

      {/* 查看历史 */}
      <Pressable style={styles.row} onPress={() => console.log('View chat history')}>
        <Text style={styles.rowText}>View archived chat history</Text>
      </Pressable>

      {/* 删除按钮 */}
      <Pressable style={styles.deleteBtn} onPress={handleDelete}>
        <Text style={styles.deleteText}>Delete all chat history</Text>
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
  row: {
    marginBottom: 40,
  },
  rowText: {
    fontSize: 18,
  },
  deleteBtn: {
    marginTop: 'auto',
    marginBottom: 40,
    alignSelf: 'center',
  },
  deleteText: {
    fontSize: 16,
    color: 'red',
  },
});
