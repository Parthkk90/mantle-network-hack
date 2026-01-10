import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WalletSetupScreen from './src/screens/WalletSetupScreen';
import HomeScreen from './src/screens/HomeScreen';
import SendScreen from './src/screens/SendScreen';
import ReceiveScreen from './src/screens/ReceiveScreen';
import WalletService from './src/services/WalletService';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isWalletReady, setIsWalletReady] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkWallet();
  }, []);

  const checkWallet = async () => {
    try {
      const hasWallet = await WalletService.hasWallet();
      if (hasWallet) {
        await WalletService.loadWallet();
        setIsWalletReady(true);
      }
    } catch (error) {
      console.error('Wallet check error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isWalletReady ? (
          <Stack.Screen name="WalletSetup">
            {(props) => (
              <WalletSetupScreen {...props} onWalletReady={() => setIsWalletReady(true)} />
            )}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Send" component={SendScreen} />
            <Stack.Screen name="Receive" component={ReceiveScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
