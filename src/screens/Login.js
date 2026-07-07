import { useState } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import BotaoHaptico from '../components/BotaoHaptico';
import api from '../services/api';
import { salvarSessao } from '../services/auth';

export default function Login({ onLoginSuccess }) {
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleLogin() {
    setErro('');
    setCarregando(true);
    try {
      const res = await api.post('/usuarios/login', { nome_usuario: nomeUsuario, senha });
      await salvarSessao(res.data.token, res.data.role);
      onLoginSuccess(res.data.role); // avisa o componente pai pra trocar de tela
    } catch (err) {
      setErro('Usuário ou senha inválidos');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Cantinho</Text>
      <TextInput
        style={styles.input}
        placeholder="usuário"
        value={nomeUsuario}
        onChangeText={setNomeUsuario}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
      />
      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
      <BotaoHaptico onPress={handleLogin} disabled={carregando}>
        {carregando ? 'Entrando...' : 'Entrar'}
      </BotaoHaptico>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  titulo: { fontSize: 28, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  erro: { color: 'red', marginBottom: 12, textAlign: 'center' },
});