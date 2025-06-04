import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Button, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-root-toast';
import { API_URL } from '@/constants/API';

export default function ContentScreen() {
  const { book } = useLocalSearchParams<{ book: string }>();
  const bookData = JSON.parse(book);
  const dbId = bookData.db_id;

  const [progress, setProgress] = useState<number>(0);
  const [downloading, setDownloading] = useState<boolean>(true);

  const [audioUrl, setAudioUrl] = useState('');
  const [audioPlaying, setAudioPlaying] = useState(false);
  const sound = useRef<Audio.Sound | null>(null);

  // get audio link (prepare first, then play automatically when pdf is opened)
  useEffect(() => {
    const fetchAudio = async () => {
      try {
        console.log('\n=== Audio File Request Info ===');
        console.log('Request URL:', `${API_URL}/audio-link/${dbId}`);
        console.log('Request Method:', 'GET');
        console.log('Request Headers:', {
          'x-api-key': 'cs46_learning_companion_secure_key_2024'
        });

        const res = await fetch(`${API_URL}/audio-link/${dbId}`, {
          headers: {
            'x-api-key': 'cs46_learning_companion_secure_key_2024',
          },
        });

        console.log('Response Status:', res.status);
        const data = await res.json();
        console.log('Response Data:', data);
        console.log('Audio URL:', data.url);
        console.log('==================\n');

        setAudioUrl(data.url);
      } catch (err) {
        console.error('❌ Audio fetch failed:', err);
      }
    };
    fetchAudio();
  }, []);

  // download PDF and open it, then automatically play audio
  useEffect(() => {
    const fetchAndDownload = async () => {
      try {
        const bookId = bookData.id;

        const res = await fetch(`${API_URL}/pdf-link/${dbId}`, {
          headers: {
            'x-api-key': 'cs46_learning_companion_secure_key_2024',
          },
        });
        const data = await res.json();
        const pdfUrl = data.url;

        const fileUri = FileSystem.documentDirectory + `${bookId}.pdf`;
        const fileInfo = await FileSystem.getInfoAsync(fileUri);

        if (!fileInfo.exists) {
          const downloadResumable = FileSystem.createDownloadResumable(
            pdfUrl,
            fileUri,
            {},
            ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
              setProgress(totalBytesWritten / totalBytesExpectedToWrite);
            }
          );
          const result = await downloadResumable.downloadAsync();
          if (!result?.uri) throw new Error('download failed');
          Toast.show('✅ PDF download success', { duration: 2000 });
        } else {
          Toast.show('✅ PDF already exists', { duration: 2000 });
        }

        await WebBrowser.openBrowserAsync(pdfUrl);

        // ⏱ automatically play audio
        if (audioUrl) {
          console.log('\n=== Audio Playback Attempt ===');
          console.log('Creating audio player for URL:', audioUrl);
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: audioUrl },
            { shouldPlay: true }
          );
          console.log('✅ Audio player created successfully');
          sound.current = newSound;
          setAudioPlaying(true);
          
          // Add status listener
          newSound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded) {
              console.log('Audio Status:', {
                isPlaying: status.isPlaying,
                positionMillis: status.positionMillis,
                durationMillis: status.durationMillis,
                didJustFinish: status.didJustFinish
              });
            }
          });
        }

      } catch (err) {
        console.error('❌ Download or playback failed:', err);
        Alert.alert('Failed', err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setDownloading(false);
      }
    };

    fetchAndDownload();
  }, [audioUrl]);

  const stopAudio = async () => {
    if (sound.current) {
      await sound.current.stopAsync();
      setAudioPlaying(false);
    }
  };

  const resumeAudio = async () => {
    if (audioUrl) {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );
      sound.current = newSound;
      setAudioPlaying(true);
    }
  };

  return (
    <View style={styles.container}>
      {downloading ? (
        <>
          <ActivityIndicator size="large" />
          <Text style={styles.progressText}>Downloading... {Math.floor(progress * 100)}%</Text>
        </>
      ) : (
        <>
          <Text>PDF opened</Text>
          <View style={{ marginTop: 20 }}>
            <Text>reading control:</Text>
            <Button
              title={audioPlaying ? 'stop reading' : 'resume reading'}
              onPress={audioPlaying ? stopAudio : resumeAudio}
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  progressText: { marginTop: 12, fontSize: 16 },
});