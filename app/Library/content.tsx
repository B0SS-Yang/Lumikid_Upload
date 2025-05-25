import * as FileSystem from 'expo-file-system';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-root-toast';
import { API_URL } from '@/constants/API';

export default function ContentScreen() {
  const { book } = useLocalSearchParams<{ book: string }>();
  const bookData = JSON.parse(book);
  const dbId = bookData.db_id;

  const router = useRouter();
  const [progress, setProgress] = useState<number>(0);
  const [downloading, setDownloading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAndDownload = async () => {
      try {
        if (!book || !dbId) throw new Error("❌ 参数缺失");

        const bookData = JSON.parse(book);
        const bookId = bookData.id;

        // 获取签名链接
        const res = await fetch(`${API_URL}/pdf-link/${dbId}`, {
          headers: {
            'x-api-key': 'cs46_learning_companion_secure_key_2024'
          }
        });

        const data = await res.json();
        const pdfUrl = data.url;

        if (!pdfUrl || typeof pdfUrl !== 'string') {
          throw new Error("❌ 后端未返回 PDF 链接");
        }

        const fileUri = FileSystem.documentDirectory + `${bookId}.pdf`;

        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (fileInfo.exists) {
          Toast.show("✅ 文件已存在", { duration: 2000, position: Toast.positions.CENTER });
          await WebBrowser.openBrowserAsync(pdfUrl);
          return router.back();
        }

        const downloadResumable = FileSystem.createDownloadResumable(
          pdfUrl,
          fileUri,
          {},
          ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
            setProgress(totalBytesWritten / totalBytesExpectedToWrite);
          }
        );

        const result = await downloadResumable.downloadAsync();
        if (result?.uri) {
          Toast.show("✅ Download successed ", { duration: 2000, position: Toast.positions.CENTER });
          await WebBrowser.openBrowserAsync(pdfUrl);
          router.back();
        } else {
          throw new Error("下载失败或文件 URI 无效");
        }

      } catch (err) {
        console.error("❌ 错误:", err);
        Alert.alert("Download failed", err instanceof Error ? err.message : "未知错误");
      } finally {
        setDownloading(false);
      }
    };

    fetchAndDownload();
  }, [book, dbId]);

  return (
    <View style={styles.container}>
      {downloading ? (
        <>
          <ActivityIndicator size="large" />
          <Text style={styles.progressText}>Downloading... {Math.floor(progress * 100)}%</Text>
        </>
      ) : (
        <Text>Completed</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  progressText: { marginTop: 12, fontSize: 16 },
});
