import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Platform } from 'react-native';
import { useFonts } from 'expo-font';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TamaguiProvider, Theme, Paragraph, YStack, Button } from 'tamagui';
import tamaguiConfig from './tamagui.config.ts';

import RegistrationScreen from './src/screens/Auth/RegistrationScreen';

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
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <Theme name="light">
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Auth">
            <Stack.Screen 
              name="Auth" 
              component={RegistrationScreen} 
              options={{ 
                headerShown: false, // скрываем нативный хедер
                contentStyle: { backgroundColor: '#fff' } // правильный контейнер для жестов
              }} 
            />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Details" component={DetailsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style="auto" />
      </Theme>
    </TamaguiProvider>
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
