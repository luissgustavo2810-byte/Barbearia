import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import ScreenHero from '../components/ScreenHero';
import { loginUser, registerUser } from '../services/authService';

export default function AuthScreen({ theme, onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim() || (isRegister && (!name.trim() || !phone.trim()))) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.');
      return;
    }

    try {
      setLoading(true);

      let userData;

      if (isRegister) {
        userData = await registerUser({
          name,
          email,
          phone,
          password,
        });
      } else {
        userData = await loginUser({
          email,
          password,
        });
      }

      onLogin(userData);

      Alert.alert(
        'Sucesso',
        isRegister ? 'Conta criada com sucesso!' : 'Login realizado com sucesso!'
      );
    } catch (error) {
      Alert.alert('Erro', error.message || 'Não foi possível continuar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: theme.background },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHero
        theme={theme}
        title={isRegister ? 'Criar conta' : 'Entrar na sua conta'}
        subtitle={
          isRegister
            ? 'Cadastre-se para acessar seu perfil e acompanhar seus agendamentos.'
            : 'Faça login para acessar seu perfil e recursos personalizados.'
        }
      />

      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.card,
            borderColor: theme.muted,
          },
        ]}
      >
        {isRegister && (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Nome</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Digite seu nome"
              placeholderTextColor={theme.muted}
              style={[
                styles.input,
                {
                  color: theme.text,
                  borderColor: theme.muted,
                  backgroundColor: theme.background,
                },
              ]}
            />
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>E-mail</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Digite seu e-mail"
            placeholderTextColor={theme.muted}
            autoCapitalize="none"
            keyboardType="email-address"
            style={[
              styles.input,
              {
                color: theme.text,
                borderColor: theme.muted,
                backgroundColor: theme.background,
              },
            ]}
          />
        </View>

        {isRegister && (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Telefone</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="(99) 99999-9999"
              placeholderTextColor={theme.muted}
              keyboardType="phone-pad"
              style={[
                styles.input,
                {
                  color: theme.text,
                  borderColor: theme.muted,
                  backgroundColor: theme.background,
                },
              ]}
            />
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Senha</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Digite sua senha"
            placeholderTextColor={theme.muted}
            secureTextEntry
            style={[
              styles.input,
              {
                color: theme.text,
                borderColor: theme.muted,
                backgroundColor: theme.background,
              },
            ]}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Aguarde...' : isRegister ? 'Criar conta' : 'Entrar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsRegister(!isRegister)}>
          <Text style={[styles.switchText, { color: theme.text }]}>
            {isRegister
              ? 'Já tem conta? Entrar'
              : 'Ainda não tem conta? Criar conta'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 30,
  },
  card: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  button: {
    marginTop: 8,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  switchText: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
    opacity: 0.9,
  },
});