import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import WalletSetupScreen from './src/screens/WalletSetupScreen';
import HomeScreen from './src/screens/HomeScreen';
import SendScreen from './src/screens/SendScreen';
import ReceiveScreen from './src/screens/ReceiveScreen';
import MarketsScreen from './src/screens/MarketsScreen';
import BundleDetailsScreen from './src/screens/BundleDetailsScreen';
import PortfolioScreen from './src/screens/PortfolioScreen';
import CreateBundleScreen from './src/screens/CreateBundleScreen';
import TokenDetailsScreen from './src/screens/TokenDetailsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ScheduleScreen from './src/screens/ScheduleScreen';
import RWAScreen from './src/screens/RWAScreen';
import KYCVerificationScreen from './src/screens/KYCVerificationScreen';
import RWAInvestmentScreen from './src/screens/RWAInvestmentScreen';
import WalletService from './src/services/WalletService';
import { COLORS } from './src/theme/colors';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const DarkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    background: COLORS.background,
    card: COLORS.cardBackground,
    text: COLORS.text,
    border: COLORS.border,
    notification: COLORS.primary,
  },
  dark: true,
};

function TabIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  const icons: { [key: string]: string } = {
    home: '⌂',
    markets: '⟁',
    schedule: '◷',
    bundles: '▦',
    assets: '🏛',
    profile: '⚙',
  };
  
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ 
        color, 
        fontSize: 24,
        fontWeight: focused ? 'bold' : 'normal',
      }}>
        {icons[name]}
      </Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.cardBackground,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
        },
      }}
      sceneContainerStyle={{ backgroundColor: COLORS.background }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="MarketsTab"
        component={MarketsScreen}
        options={{
          tabBarLabel: 'Markets',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="markets" color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="ScheduleTab"
        component={ScheduleScreen}
        options={{
          tabBarLabel: 'Schedule',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="schedule" color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="BundlesTab"
        component={PortfolioScreen}
        options={{
          tabBarLabel: 'Bundles',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="bundles" color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="RWATab"
        component={RWAScreen}
        options={{
          tabBarLabel: 'Assets',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="assets" color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="profile" color={color} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isWalletReady, setIsWalletReady] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkWallet();
  }, []);

  const checkWallet = async () => {
    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );
      
      const checkPromise = WalletService.hasWallet();
      
      const hasWallet = await Promise.race([checkPromise, timeoutPromise]) as boolean;
      
      if (hasWallet) {
        try {
          await WalletService.loadWallet();
          setIsWalletReady(true);
        } catch (loadError) {
          console.error('Wallet load error:', loadError);
          // Wallet exists but can't load - clear it and show setup
          setIsWalletReady(false);
        }
      }
    } catch (error) {
      console.error('Wallet check error:', error);
      // On timeout or error, assume no wallet and show setup
      setIsWalletReady(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>CRESCA</Text>
      </View>
    );
  }

  return (
    <NavigationContainer theme={DarkTheme}>
      <StatusBar style="light" />
      <Stack.Navigator 
        screenOptions={{ headerShown: false }}
        screenContainerStyle={{ backgroundColor: COLORS.background }}
      >
        {!isWalletReady ? (
          <Stack.Screen name="WalletSetup">
            {(props) => (
              <WalletSetupScreen {...props} onWalletReady={() => setIsWalletReady(true)} />
            )}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Send" component={SendScreen} />
            <Stack.Screen name="Receive" component={ReceiveScreen} />
            <Stack.Screen name="BundleDetails" component={BundleDetailsScreen} />
            <Stack.Screen name="TokenDetails" component={TokenDetailsScreen} />
            <Stack.Screen name="CreateBundle" component={CreateBundleScreen} />
            <Stack.Screen name="KYCVerification" component={KYCVerificationScreen} />
            <Stack.Screen name="RWAInvestment" component={RWAInvestmentScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 4,
  },
});
