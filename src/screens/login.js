// screens/login.js
import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import BotaoHaptico from '../components/BotaoHaptico';
import { useAuth } from '../contexts/AuthContext';

export default function Login() { 
  const { entrar } = useAuth(); //essa função entrar() vem do authcontext.js
  const [nomeUsuario, setNomeUsuario] = useState(''); //
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function aoEntrar() { //se o usuário clicar no botão de entrar, essa função é chamada
    if (!nomeUsuario || !senha) { // as barras significam "ou"
      setErro('preencha usuário e senha'); 
      return;
    }

    try { //se o usuário digitou usuário e senha, tenta entrar
      setErro(null); //limpa a mensagem de erro
      setEnviando(true); //mostra o indicador de carregamento
      await entrar(nomeUsuario, senha); //os valores digitados aqui vão para authcontext.js, lá na função entrar() 

    } catch (err) { //se der erro, mostra a mensagem de erro
      setErro(err.message);const { entrar } = useAuth();
    } finally {
      setEnviando(false); //esconde o indicador de carregamento
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
