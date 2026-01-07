import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Platform } from 'react-native';
import { useFonts } from 'expo-font';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TamaguiProvider, Theme, Paragraph, YStack, Button } from 'tamagui';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import tamaguiConfig from './tamagui.config';

import RegistrationScreen from './src/screens/Auth/RegistrationScreen';
import PartnerCodeScreen from './src/screens/Auth/PartnerScreen';

const Stack = createNativeStackNavigator();

if (Platform.OS === 'web') {
  require('./tamagui-web.css');
}

export default function App() {
  const [loaded] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  });

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
        <Theme name="light">
          <BottomSheetModalProvider>
            <NavigationContainer>
              <Stack.Navigator initialRouteName="Auth">
                <Stack.Screen 
                  name="Auth" 
                  component={RegistrationScreen} 
                  options={{ 
                    headerShown: false,
                    contentStyle: { backgroundColor: '#fff' }
                  }} 
                />
                <Stack.Screen 
                  name="PartnerScreen" 
                  component={PartnerCodeScreen} 
                  options={{ headerShown: false }} 
                />
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Details" component={DetailsScreen} />
              </Stack.Navigator>
            </NavigationContainer>
          </BottomSheetModalProvider>
          <StatusBar style="auto" />
        </Theme>
      </TamaguiProvider>
    </GestureHandlerRootView>
  );
}

function HomeScreen({ navigation }: any) {
  return (
    <YStack flex={1} justifyContent="center" alignItems="center" padding="$4" gap="$4">
      <Paragraph size="$5">Главная</Paragraph>
      <Button onPress={() => navigation.navigate('Details')}>Открыть детали</Button>
    </YStack>
  )
}

function DetailsScreen() {
  return (
    <YStack flex={1} justifyContent="center" alignItems="center" padding="$4" gap="$4">
      <Paragraph size="$5">Детали</Paragraph>
      <Button>Кнопка</Button>
    </YStack>
  )
}
