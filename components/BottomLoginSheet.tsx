import React, { FC } from 'react';
import Colors from '@/constants/Colors';
import { defaultStyles } from '../constants/Styles';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BottomLoginSheet: FC = () => {
  const { bottom } = useSafeAreaInsets();//定义了一个函数式组件, 获取屏幕底部的安全边距，以适配有刘海/底部手势的设备。
  const router = useRouter();
  return (
    // 主视图容器 <View> 使用 styles.container 样式，并加上底部安全区填充。
    <View style={[styles.container, { paddingBottom: bottom }]}>

      <TouchableOpacity style={[defaultStyles.btn, styles.btnLight]}>
        <Ionicons name="logo-apple" size={14} style={styles.btnIcon} />
        <Text style={styles.btnLightText}>Continue with Apple</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[defaultStyles.btn, styles.btnDark]}>
        <Ionicons name="logo-google" size={16} style={styles.btnIcon} color={'#fff'} />
        <Text style={styles.btnDarkText}>Continue with Google</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[defaultStyles.btn, styles.btnDark]}
        onPress={() => router.push('/LoginPages/LoginIndexPage')}>
          <Ionicons name="mail" size={20} style={styles.btnIcon} color={'#fff'} />
          <Text style={styles.btnDarkText}>Sign up with email</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[defaultStyles.btn, styles.btnDark]}
        onPress={() => router.push('/LoginPages/LoginPage')}>
          <Text style={styles.btnDarkText}>Log in</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 26,
    gap: 14,
  },
  btnLight: {
    backgroundColor: '#fff',
  },
  btnLightText: {
    color: '#000',
    fontSize: 20,
  },
  btnDark: {
    backgroundColor: Colors.grey,
  },
  btnDarkText: {
    color: '#fff',
    fontSize: 20,
  },
  btnOutline: {
    borderWidth: 3,
    borderColor: Colors.grey,
  },
  btnIcon: {
    paddingRight: 6,
  },
});

export default BottomLoginSheet;
