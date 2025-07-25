import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Switch,
  Image,
  Alert,
  Animated,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/constants/API';

const { width } = Dimensions.get('window');

interface SubscriptionPlan {
  id: string;
  title: string;
  price: number;
  period: string;
  features: string[];
}

const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'monthly',
    title: 'Monthly subscription',
    price: 9.99,
    period: 'month',
    features: [
      'Unlimited access to all educational content',
      'Personalized learning plan',
      'Progress tracking',
      'Parent monitoring panel',
    ],
  },
  {
    id: 'quarterly',
    title: 'Quarterly subscription',
    price: 26.99,
    period: 'quarter',
    features: [
      'Monthly subscription all features',
      'Priority customer support',
      'Advanced learning analysis',
      'Save 10%',
    ],
  },
  {
    id: 'yearly',
    title: 'Yearly subscription',
    price: 99.99,
    period: 'year',
    features: [
      'Quarterly subscription all features',
      'Exclusive learning resources',
      'Family account management',
      'Save 17%',
    ],
  },
];

export default function SubscribePage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(subscriptionPlans[0]);
  const [isAutoRenew, setIsAutoRenew] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
  };

  const handleSubscribe = async () => {
    try {
      // 1. get the token
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Please login first');
        return;
      }

      // 2. assemble the request body
      const requestBody = {
        token,
        plan: 'Pro',
        duration: selectedPlan.id, // 'monthly' | 'quarterly' | 'yearly'
        auto_renew: isAutoRenew,
        renew_method: 'credit_card',
      };

      // print the request body and request url
      console.log('[DEBUG] Subscription Request:');
      console.log('Request URL:', `${API_URL}/payment/purchase`);
      console.log('Request Body:', JSON.stringify(requestBody));

      // 3. call the backend API
      const response = await fetch(`${API_URL}/payment/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      // print the backend response
      console.log('[DEBUG] Backend Response:', data);

      if (response.ok && data.checkout_url) {
        Alert.alert('Redirecting', 'Please complete the payment on the next page', [
          {
            text: 'OK',
            onPress: () => Linking.openURL(data.checkout_url),
          },
        ]);
      } else {
        Alert.alert('Subscription Failed', data.detail || 'Please try again later');
      }
    } catch (err) {
      Alert.alert('Subscription Failed', err instanceof Error ? err.message : 'Please try again later');
    }
  };

  const renderDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {subscriptionPlans.map((_, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 16, 8],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  width: dotWidth,
                  opacity,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/LumiKid Logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>Select your subscription plan</Text>
      
      <View style={styles.swipeHintContainer}>
        <Ionicons name="chevron-back" size={20} color={Colors.primary} />
        <Text style={styles.swipeHintText}>Swipe left and right to view more plans</Text>
        <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {subscriptionPlans.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={[
              styles.planCard,
              selectedPlan.id === plan.id && styles.selectedPlanCard,
            ]}
            onPress={() => handlePlanSelect(plan)}
          >
            <Text style={styles.planTitle}>{plan.title}</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.currency}>$</Text>
              <Text style={styles.price}>{plan.price}</Text>
              <Text style={styles.period}>/{plan.period}</Text>
            </View>
            <View style={styles.featuresContainer}>
              {plan.features.map((feature, index) => (
                <Text key={index} style={styles.feature}>
                  ✓ {feature}
                </Text>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {renderDots()}

      <View style={styles.autoRenewContainer}>
        <Text style={styles.autoRenewText}>Auto-renew</Text>
        <Switch
          value={isAutoRenew}
          onValueChange={setIsAutoRenew}
          trackColor={{ false: '#767577', true: Colors.primary }}
          thumbColor={isAutoRenew ? '#fff' : '#f4f3f4'}
        />
      </View>

      <TouchableOpacity
        style={styles.subscribeButton}
        onPress={handleSubscribe}
      >
        <Text style={styles.subscribeButtonText}>
          Subscribe
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  logo: {
    width: 200,
    height: 60,
    alignSelf: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: Colors.brown,
  },
  swipeHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  swipeHintText: {
    fontSize: 14,
    color: Colors.primary,
    marginHorizontal: 8,
  },
  scrollView: {
    flex: 0,
  },
  scrollViewContent: {
    paddingHorizontal: 10,
  },
  planCard: {
    width: width - 60,
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPlanCard: {
    borderColor: Colors.primary,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.brown,
    marginBottom: 15,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  currency: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.primary,
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  period: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
  featuresContainer: {
    marginTop: 10,
  },
  feature: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginHorizontal: 4,
  },
  autoRenewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  autoRenewText: {
    fontSize: 16,
    color: '#333',
  },
  subscribeButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    padding: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: Colors.primary,
    fontSize: 16,
  },
}); 