import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* 顶部标题栏 */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Text style={styles.title}>Privacy Policy</Text>
      </View>

      {/* 滚动文本区 */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.text}>Effective Date: YYYY-MM-DD</Text>
        <Text style={styles.text}>Last Updated: YYYY-MM-DD</Text>

        <Text style={styles.text}>
          Thank you for using [App Name] (hereinafter referred to as "the App"). We value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, and protect your data.
        </Text>

        <Text style={styles.text}>
          1. Information We Collect{'\n'}
          1.1 Information You Provide Directly: User account info, profile details, feedback, etc.{'\n'}
          1.2 Information Collected Automatically: Device info, usage stats, crash logs.{'\n'}
          1.3 Children’s Data: We comply with COPPA and GDPR-K. No identifiable info is collected from children without parental consent.
        </Text>

        <Text style={styles.text}>
          2. How We Use Information{'\n'}
          To provide app functionality, personalize content, ensure security, support users, and improve experience.
        </Text>

        <Text style={styles.text}>
          3. Information Sharing and Disclosure{'\n'}
          We do not sell users' personal data. However, in some cases, we may share info as legally required or with consent.
        </Text>
      </ScrollView>
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
    marginBottom: 20,
  },
  backArrow: {
    fontSize: 24,
    marginRight: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  content: {
    paddingBottom: 80,
  },
  text: {
    fontSize: 16,
    color: '#222',
    lineHeight: 22,
    marginBottom: 20,
  },
});
