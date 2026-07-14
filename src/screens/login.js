// screens/login.js
import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import BotaoHaptico from '../components/BotaoHaptico';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { entrar } = useAuth();
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function aoEntrar() {
    if (!nomeUsuario || !senha) {
      setErro('preencha usuário e senha');
      return;
    }

    try {
      setErro(null);
      setEnviando(true);
      await entrar(nomeUsuario, senha);
      // não precisa navegar manualmente — o AuthContext atualiza "usuario",
      // e o navigation/index.js troca de stack sozinho quando isso muda
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Cantinho</Text>

      <TextInput
        style={styles.input}
        placeholder="usuário"
        autoCapitalize="none"
        value={nomeUsuario}
        onChangeText={setNomeUsuario}
      />

      <TextInput
        style={styles.input}
        placeholder="senha"
        autoCapitalize="none"
        secureTextEntry
        value={senha}
        onChangeText={setSenha}
      />

      {erro && <Text style={styles.erro}>{erro}</Text>}

      {enviando ? (
        <ActivityIndicator size="large" />
      ) : (
        <BotaoHaptico onPress={aoEntrar}>Entrar</BotaoHaptico>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  titulo: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 32 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
  },
  erro: { color: '#c62828', marginBottom: 12, textAlign: 'center' },
});
