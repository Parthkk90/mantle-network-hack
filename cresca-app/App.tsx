import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Platform, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
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
import SwapScreen from './src/screens/SwapScreen';
import KYCVerificationScreen from './src/screens/KYCVerificationScreen';
import RWAInvestmentScreen from './src/screens/RWAInvestmentScreen';
import TransactionDetailsScreen from './src/screens/TransactionDetailsScreen';
import { COLORS } from './src/theme/colors';
import { TransactionProvider } from './src/context/TransactionContext';
import { NetworkProvider } from './src/context/NetworkContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const LightTheme = {
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
  dark: false,
};

function TabIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  const iconMap: { [key: string]: keyof typeof Ionicons.glyphMap } = {
    home: 'home-outline',
    markets: 'trending-up-outline',
    bundles: 'cube-outline',
    rwa: 'business-outline',
    profile: 'person-outline',
  };
  
  const focusedIconMap: { [key: string]: keyof typeof Ionicons.glyphMap } = {
    home: 'home',
    markets: 'trending-up',
    bundles: 'cube',
    rwa: 'business',
    profile: 'person',
  };
  
  const iconName = focused ? focusedIconMap[name] : iconMap[name];
  const iconColor = focused ? COLORS.text : COLORS.textMuted;
  
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={iconName} size={24} color={iconColor} />
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 85,
          paddingBottom: 25,
          paddingTop: 10,
          paddingHorizontal: 10,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 10,
          shadowColor: COLORS.shadow,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        },
        tabBarActiveTintColor: COLORS.text,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 4,
        },
        tabBarShowLabel: true,
        sceneStyle: { backgroundColor: COLORS.background },
      }}
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
        name="RWATab"
        component={RWAScreen}
        options={{
          tabBarLabel: 'RWA',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="rwa" color={color} focused={focused} />
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
        name="SettingsTab"
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

function AppContent() {
  const { isWalletReady, loading, login } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingIcon}>
          <Ionicons name="flash" size={36} color={COLORS.textWhite} />
        </View>
        <Text style={styles.loadingText}>Cresca</Text>
        <Text style={styles.loadingSubtext}>Loading your wallet...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer theme={LightTheme}>
      <StatusBar style="dark" />
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
        }}
      >
        {!isWalletReady ? (
          <Stack.Screen name="WalletSetup">
            {(props) => (
              <WalletSetupScreen {...props} onWalletReady={login} />
            )}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Send" component={SendScreen} />
            <Stack.Screen name="Receive" component={ReceiveScreen} />
            <Stack.Screen name="Swap" component={SwapScreen} />
            <Stack.Screen name="BundleDetails" component={BundleDetailsScreen} />
            <Stack.Screen name="TokenDetails" component={TokenDetailsScreen} />
            <Stack.Screen name="CreateBundle" component={CreateBundleScreen} />
            <Stack.Screen name="Schedule" component={ScheduleScreen} />
            <Stack.Screen name="RWA" component={RWAScreen} />
            <Stack.Screen name="KYCVerification" component={KYCVerificationScreen} />
            <Stack.Screen name="RWAInvestment" component={RWAInvestmentScreen} />
            <Stack.Screen name="TransactionDetails" component={TransactionDetailsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NetworkProvider>
        <TransactionProvider>
          <AppContent />
        </TransactionProvider>
      </NetworkProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingText: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
});
