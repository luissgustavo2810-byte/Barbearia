import 'react-native-gesture-handler';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import MainScreen from './screens/MainScreen';
import HomeScreen from './screens/HomeScreen';
import PlansScreen from './screens/PlansScreen';
import AuthScreen from './screens/AuthScreen';
import ProfileScreen from './screens/ProfileScreen';
import AdminScreen from './screens/AdminScreen';
import PaymentsScreen from './screens/PaymentsScreen';
import { themes } from './styles/theme';
import { supabase } from './lib/supabase';
import { logoutUser } from './services/authService';

const Tab = createBottomTabNavigator();

function AnimatedTabIcon({ routeName, color, size, focused }) {
  const scaleAnim = useRef(new Animated.Value(focused ? 1.12 : 1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focused ? 1.12 : 1,
      friction: 5,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [focused, scaleAnim]);

  let iconName = 'ellipse-outline';

  if (routeName === 'Início') iconName = focused ? 'home' : 'home-outline';
  else if (routeName === 'Agendar') iconName = focused ? 'calendar' : 'calendar-outline';
  else if (routeName === 'Planos') iconName = focused ? 'card' : 'card-outline';
  else if (routeName === 'Pagamentos') iconName = focused ? 'wallet' : 'wallet-outline';
  else if (routeName === 'Perfil') iconName = focused ? 'person' : 'person-outline';
  else if (routeName === 'Admin')
  iconName = focused ? 'settings' : 'settings-outline';

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Ionicons name={iconName} size={size} color={color} />
    </Animated.View>
  );
}

function AnimatedScreenWrapper({ children }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 320,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, translateAnim]);

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: fadeAnim,
        transform: [{ translateY: translateAnim }],
      }}
    >
      {children}
    </Animated.View>
  );
}

export default function App() {
  const [themeName, setThemeName] = useState('dark');
  const [user, setUser] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  const theme = themes[themeName];

  useEffect(() => {
    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadUserProfile(session.user.id, session.user.email);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function checkSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      await loadUserProfile(session.user.id, session.user.email);
    }

    setLoadingSession(false);
  }

  async function loadUserProfile(userId, email) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setUser({
        id: userId,
        name: data.name,
        email,
        phone: data.phone,
        plan: null,
        booking: null,
        role: data.role || 'client',
      });
    }
  }

  const navigationTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: theme.background,
      card: theme.navbar,
      text: theme.text,
      border: theme.muted,
      primary: theme.primary,
    },
  };

  const handleLogin = (loggedUser) => {
    setUser(loggedUser);
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
  };

  if (loadingSession) {
    return null;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style={themeName === 'dark' ? 'light' : 'dark'} />

      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerStyle: {
            backgroundColor: theme.navbar,
          },
          headerTitleStyle: {
            color: theme.text,
            fontWeight: 'bold',
          },
          headerTintColor: theme.text,
          headerShadowVisible: false,
          tabBarStyle: {
            backgroundColor: theme.navbar,
            borderTopColor: theme.muted,
            height: Platform.OS === 'android' ? 105 : 110,
            paddingTop: 8,
            paddingBottom: Platform.OS === 'android' ? 10 : 22,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            marginBottom: Platform.OS === 'android' ? 4 : 0,
          },
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.text,
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon
              routeName={route.name}
              color={color}
              size={size}
              focused={focused}
            />
          ),
        })}
      >
        <Tab.Screen name="Início">
          {(props) => (
            <AnimatedScreenWrapper>
              <MainScreen
                {...props}
                theme={theme}
                themeName={themeName}
                setThemeName={setThemeName}
              />
            </AnimatedScreenWrapper>
          )}
        </Tab.Screen>

        <Tab.Screen name="Agendar">
          {(props) => (
            <AnimatedScreenWrapper>
              <HomeScreen
                {...props}
                theme={theme}
                themeName={themeName}
                user={user}
              />
            </AnimatedScreenWrapper>
          )}
        </Tab.Screen>

        <Tab.Screen name="Planos">
          {(props) => (
            <PlansScreen
              {...props}
              theme={theme}
              user={user}
            />
          )}
        </Tab.Screen>
        {user && user?.role !== 'admin' && (
          <Tab.Screen name="Pagamentos">
            {(props) => (
              <AnimatedScreenWrapper>
                <PaymentsScreen
                  {...props}
                  theme={theme}
                  user={user}
                />
              </AnimatedScreenWrapper>
            )}
          </Tab.Screen>
        )}

        <Tab.Screen name={user?.role === 'admin' ? 'Admin' : 'Perfil'}>
            {(props) => (
              <AnimatedScreenWrapper>
                {user?.role === 'admin' ? (
                  <AdminScreen
                  {...props}
                  theme={theme}
                  user={user}
                  onLogout={handleLogout}
                />
                ) : user ? (
                  <ProfileScreen
                    {...props}
                    theme={theme}
                    user={user}
                    onLogout={handleLogout}
                  />
                ) : (
                  <AuthScreen
                    {...props}
                    theme={theme}
                    onLogin={handleLogin}
                  />
                )}
              </AnimatedScreenWrapper>
          )}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}