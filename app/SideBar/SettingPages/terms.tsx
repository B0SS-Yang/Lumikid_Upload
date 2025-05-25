import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export default function TermsPage() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* 顶部返回+标题 */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Text style={styles.title}>Terms of service</Text>
      </View>

      {/* 可滚动内容 */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.text}>
          Here’s a Terms of Service (ToS) document for your AI early childhood education companion app:
        </Text>
        <Text style={styles.text}>Effective Date: YYYY-MM-DD</Text>
        <Text style={styles.text}>Last Updated: YYYY-MM-DD</Text>

        <Text style={styles.text}>
          Welcome to [App Name]! These Terms of Service ("Terms") govern your use of our application, website, and related services (collectively, the "Service"). By using the Service, you agree to these Terms. If you do not agree, please do not use the Service.
        </Text>

        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.text}>
          By accessing or using the Service, you confirm that you are at least the legal age of majority in your jurisdiction or have obtained parental/guardian consent if you are a minor.
        </Text>

        <Text style={styles.sectionTitle}>2. Use of the Service</Text>
        <Text style={styles.text}>
          You agree to use the Service only for its intended educational purposes. You must not:
        </Text>
        <Text style={styles.bullet}>• Use the Service for any illegal or harmful purposes.</Text>
        <Text style={styles.bullet}>• Interfere with or disrupt the functionality of the Service.</Text>
        <Text style={styles.bullet}>• Access other users’ accounts or data without permission.</Text>
        <Text style={styles.bullet}>• Distribute malware or harmful software.</Text>

        <Text style={styles.sectionTitle}>3. User Accounts and Security</Text>
        <Text style={styles.bullet}>• Some features may require account creation.</Text>
        <Text style={styles.bullet}>• You are responsible for keeping your credentials secure.</Text>
        <Text style={styles.bullet}>• We are not liable for unauthorized access due to your negligence.</Text>

        <Text style={styles.sectionTitle}>4. Children's Privacy</Text>
        <Text style={styles.text}>
          The app is for children but we comply with COPPA and GDPR-K. No personal data is collected from children without parental consent.
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
    fontSize: 26,
    fontWeight: 'bold',
  },
  content: {
    paddingBottom: 80,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
    color: '#222',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
  },
  bullet: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
    marginBottom: 6,
  },
});
