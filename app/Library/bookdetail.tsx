import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Book {
  id: string;
  title: string;
  description: string;
  pdfPath: string;
  author: string;
  age_range: string;
  db_id: string
}

const imageMap: Record<string, any> = {
  'book_001': require('../../assets/images/1.png'),
  'book_002': require('../../assets/images/2.png'),
  'book_003': require('../../assets/images/3.png'),
  'book_004': require('../../assets/images/4.png'),
  'book_005': require('../../assets/images/5.png'),
  'book_006': require('../../assets/images/6.png'),
  'book_007': require('../../assets/images/7.png'),
  'book_008': require('../../assets/images/8.png'),
  'book_009': require('../../assets/images/9.png'),
  'book_010': require('../../assets/images/10.png'),
  'book_011': require('../../assets/images/11.png'),
  'book_012': require('../../assets/images/12.png')
};

export default function BookDetailScreen() {
  const { book } = useLocalSearchParams<{ book: string }>();
  const bookData: Book = JSON.parse(book);
  const coverImage = imageMap[bookData.id];

  return (
    <View style={styles.container}>
      {/* 返回按钮 */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#333" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      {/* 封面图 */}
      {coverImage && (<Image source={coverImage} style={styles.cover} resizeMode="contain" />)}


      {/* 标题、描述、作者等信息 */}
      <View style={styles.textSection}>
        <Text style={styles.title}>{bookData.title}</Text>
        <Text style={styles.meta}>Author: {bookData.author}</Text>
        <Text style={styles.meta}>Suitable for children aged {bookData.age_range}</Text>
        <Text style={styles.description}>Abstract: {bookData.description}</Text>
        
      </View>

      
      {/* 底部按钮 */}
      <View style={styles.bottomWrapper}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => {
            console.log("🧾 当前 book:", book);
            router.push({
              pathname: '/Library/content',
              params: { book: JSON.stringify(bookData), dbId: bookData.db_id }
            });
          }}
        >
          <Text style={styles.buttonText}>Start Reading</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, alignItems: 'center', backgroundColor: '#fff' },
  backButton: { flexDirection: 'row', alignSelf: 'flex-start', marginBottom: 10 },
  backText: { fontSize: 16, marginLeft: 6, color: '#333' },
  cover: { width: 240, height: 320, borderRadius: 3 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 4, textAlign: 'center' },
  description: { fontSize: 20, textAlign: 'left', marginTop: 24, marginBottom: 16, color: '#444', lineHeight: 24,      // 增加行间距
    letterSpacing: 0.8, },
  meta: { fontSize: 16, marginTop: 6, color: '#555', textAlign: 'center' },
  textSection: {
    paddingHorizontal: 20,
    alignSelf: 'stretch'
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3, // 安卓阴影
    shadowColor: '#000', // iOS 阴影
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 24,
  },
  bottomWrapper: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'transparent', // 确保不影响背景
  },
});


/*
import { Ionicons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import bookImageMap from '../../utils/pdfImageMap';


interface Book {
  id: string;
  title: string;
  description: string;
  pdfPath: string;
  author: string;
  age_range: string;
  pageCount: number; // 新增字段，指明该书有几页
}

const imageMap: Record<string, any> = {
  'book_001': require('../../assets/images/1.png'),
  'book_002': require('../../assets/images/2.png'),
  'book_003': require('../../assets/images/3.png'),
  'book_004': require('../../assets/images/4.png'),
  'book_005': require('../../assets/images/5.png'),
  'book_006': require('../../assets/images/6.png'),
  'book_007': require('../../assets/images/7.png'),
  'book_008': require('../../assets/images/8.png'),
  'book_009': require('../../assets/images/9.png'),
  'book_010': require('../../assets/images/10.png'),
  'book_011': require('../../assets/images/11.png'),
  'book_012': require('../../assets/images/12.png')
};

export default function BookDetailScreen() {
  const { book } = useLocalSearchParams<{ book: string }>();
  const bookData: Book = JSON.parse(book);
  const coverImage = imageMap[bookData.id];

  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleStartReading = async () => {
    const bookId = bookData.id;
    const localDir = `${FileSystem.documentDirectory}${bookId}/`;
    const assets = bookImageMap[bookId];

    setDownloading(true);

    try {
      // 创建缓存目录（如不存在）
      const dirInfo = await FileSystem.getInfoAsync(localDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(localDir, { intermediates: true });
      }

      const existingFiles = await FileSystem.readDirectoryAsync(localDir);

      console.log('🔁 existingFiles:', existingFiles.length);
      console.log('📘 pageCount from bookData:', bookData.pageCount);
      
      if (
        existingFiles.length > 0 &&
        bookData.pageCount &&
        existingFiles.length === bookData.pageCount
      ) {
        console.log('✅ 所有页面已缓存，直接跳转');
        router.push({
          pathname: '/Digital/content',
          params: { book: JSON.stringify(bookData) },
        });
        return;
      }
      
      /*if (existingFiles.length === 18) {
        // 已缓存，直接跳转
        router.push({ pathname: '/Digital/content', params: { book: JSON.stringify(bookData) } });
        return;
      }

      for (let i = 0; i < assets.length; i++) {
        const asset = Asset.fromModule(assets[i]);
        await asset.downloadAsync();

        const localUri = `${localDir}${i + 1}.jpg`;
        const fileInfo = await FileSystem.getInfoAsync(localUri);
        if (!fileInfo.exists) {
          await FileSystem.copyAsync({
            from: asset.localUri!,
            to: localUri,
          });
        }

        setProgress((i + 1) / assets.length);
      }
      console.log('📥 所有图片下载完毕，准备跳转');

      router.push({ pathname: '/Digital/content', params: { book: JSON.stringify(bookData) } });

    } catch (err) {
      console.error('拷贝失败:', err);
      Alert.alert('错误', '拷贝图片失败，请检查文件是否存在或路径是否正确');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#333" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      {coverImage && (<Image source={coverImage} style={styles.cover} resizeMode="contain" />)}

      <View style={styles.textSection}>
        <Text style={styles.title}>{bookData.title}</Text>
        <Text style={styles.meta}>Author: {bookData.author}</Text>
        <Text style={styles.meta}>Suitable for children aged {bookData.age_range}</Text>
        <Text style={styles.description}>Abstract: {bookData.description}</Text>
      </View>

      <View style={styles.bottomWrapper}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartReading}
          disabled={downloading}
        >
          {downloading ? (
            <View>
              <ActivityIndicator color="white" />
              <Text style={styles.buttonText}>准备中... {Math.floor(progress * 100)}%</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Start Reading</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, alignItems: 'center', backgroundColor: '#fff' },
  backButton: { flexDirection: 'row', alignSelf: 'flex-start', marginBottom: 10 },
  backText: { fontSize: 16, marginLeft: 6, color: '#333' },
  cover: { width: 240, height: 320, borderRadius: 3 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 4, textAlign: 'center' },
  description: {
    fontSize: 20, textAlign: 'left', marginTop: 24, marginBottom: 16, color: '#444',
    lineHeight: 24, letterSpacing: 0.8,
  },
  meta: { fontSize: 16, marginTop: 6, color: '#555', textAlign: 'center' },
  textSection: {
    paddingHorizontal: 20,
    alignSelf: 'stretch'
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 24,
  },
  bottomWrapper: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
});
*/