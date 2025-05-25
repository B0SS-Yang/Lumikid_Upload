import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function FontPage() {
  const router = useRouter();
  const [fontSize, setFontSize] = useState<'small' | 'middle' | 'large' | null>(null);

  useEffect(() => {
    const loadFontSize = async () => {
      const saved = await AsyncStorage.getItem('selectedFontSize');
      if (saved === 'small' || saved === 'middle' || saved === 'large') {
        setFontSize(saved);
      }
    };
    loadFontSize();
  }, []);

  const handleSelect = async (size: 'small' | 'middle' | 'large') => {
    setFontSize(size);
    await AsyncStorage.setItem('selectedFontSize', size);
  };

  const previewText = "Hello, my name is Lumikid,\nLet's start our journey!";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Text style={styles.title}>Font</Text>
      </View>

      {/* Small */}
      <Pressable style={styles.row} onPress={() => handleSelect('small')}>
        <View style={styles.textBlock}>
          <Text style={styles.label}>Small size</Text>
          <Text style={[styles.preview, { fontSize: 14 }]}>{previewText}</Text>
        </View>
        <View style={fontSize === 'small' ? styles.checkedBox : styles.emptyBox}>
          {fontSize === 'small' && <Text style={styles.checkText}>✓</Text>}
        </View>
      </Pressable>

      {/* Middle */}
      <Pressable style={styles.row} onPress={() => handleSelect('middle')}>
        <View style={styles.textBlock}>
          <Text style={styles.label}>Middle size</Text>
          <Text style={[styles.preview, { fontSize: 18 }]}>{previewText}</Text>
        </View>
        <View style={fontSize === 'middle' ? styles.checkedBox : styles.emptyBox}>
          {fontSize === 'middle' && <Text style={styles.checkText}>✓</Text>}
        </View>
      </Pressable>

      {/* Large */}
      <Pressable style={styles.row} onPress={() => handleSelect('large')}>
        <View style={styles.textBlock}>
          <Text style={styles.label}>Large size</Text>
          <Text style={[styles.preview, { fontSize: 26 }]}>{previewText}</Text>
        </View>
        <View style={fontSize === 'large' ? styles.checkedBox : styles.emptyBox}>
          {fontSize === 'large' && <Text style={styles.checkText}>✓</Text>}
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    alignItems: 'center',
  },
  textBlock: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    fontSize: 18,
    marginBottom: 4,
  },
  preview: {
    color: '#aaa',
    lineHeight: 22,
  },
  checkedBox: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderColor: '#000',
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
