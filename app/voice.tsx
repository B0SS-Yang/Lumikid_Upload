import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useLocalSearchParams } from 'expo-router';
import { API_URL } from '@/constants/API';

export default function VoiceChatPage() {
  const [status, setStatus] = useState<'idle' | 'recording' | 'uploading' | 'playing'>('idle');
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const userId =112;
  const { id } = useLocalSearchParams();
  if (!id || isNaN(parseInt(id as string))) {
    console.warn("❌ Invalid chatId:", id);
    Alert.alert("Error", "Invalid chat ID, cannot upload voice");
    return;
  }

  const chatId = parseInt(id as string);
  const apiKey = 'cs46_learning_companion_secure_key_2024';
  const backendUrl = 'base/voice-chat';

  const startRecording = async () => {
    try {
      setStatus('recording');
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
    } catch (error) {
      console.error('Start recording error:', error);
      Alert.alert('Error', 'Unable to start recording');
      setStatus('idle');
    }
  };

  const stopRecordingAndUpload = async () => {
    try {
      setStatus('uploading');
      if (isNaN(chatId)) {
        console.warn("❌ chatId 无效：", id);
        Alert.alert("错误", "当前聊天 ID 无效，无法上传语音");
        setStatus('idle');
        return;
      }
      
      console.log("✅ 上传语音时使用的 chatId:", chatId);
      
      const recording = recordingRef.current;
      if (!recording) return;

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (!uri) throw new Error('The recording file was not saved');

      const file = {
        uri,
        name: 'voice.wav',
        type: 'audio/wav',
      };

      const formData = new FormData();
      formData.append('file', file as any);
      formData.append('user_id', String(userId));
      formData.append('age', '5');
      formData.append('language', 'en');
      formData.append('chat_id', String(chatId));
      formData.append('interests', 'child books,math');

      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server returns error: ${response.status}`);
      }

      const blob = await response.blob();
      const reader = new FileReader();

      reader.onloadend = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const filePath = FileSystem.cacheDirectory + `voice-${Date.now()}.mp3`;

          await FileSystem.writeAsStringAsync(filePath, base64, {
            encoding: FileSystem.EncodingType.Base64,
          });

          const soundObject = new Audio.Sound();
          await soundObject.loadAsync({ uri: filePath });
          await soundObject.playAsync();

          soundRef.current = soundObject;
          setStatus('playing');

          soundObject.setOnPlaybackStatusUpdate((status) => {
            if ('isPlaying' in status && 'didJustFinish' in status) {
              if (!status.isPlaying && status.didJustFinish) {
                setStatus('idle');
              }
            }
          });
        } catch (err) {
          console.error('Playback failure:', err);
          Alert.alert('error', 'Voice playback failed');
          setStatus('idle');
        }
      };

      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('error', 'Voice transmission failed');
      setStatus('idle');
    }
  };

  const handlePress = async () => {
    if (status === 'idle') {
      await startRecording();
    } else if (status === 'recording') {
      await stopRecordingAndUpload();
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePress} disabled={status === 'uploading'}>
        {status === 'idle' && <Ionicons name="mic" size={64} color="black" />}
        {status === 'recording' && <Ionicons name="mic" size={64} color="red" />}
        {status === 'uploading' && <ActivityIndicator size="large" color="gray" />}
        {status === 'playing' && <Ionicons name="volume-high" size={64} color="#007AFF" />}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
