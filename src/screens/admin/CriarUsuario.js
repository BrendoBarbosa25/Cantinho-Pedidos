// screens/admin/CriarUsuario.js
import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import BotaoHaptico from '../../components/BotaoHaptico';
import { criarUsuario } from '../../services/api';

const PAPEIS = ['garcom', 'cozinha', 'admin'];

export default function CriarUsuario() {
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [role, setRole] = useState('garcom');
  const [enviando, setEnviando] = useState(false);

  async function aoCriar() {
    if (!nomeUsuario || !senha) {
      Alert.alert('Erro', 'preencha usuário e senha');
      return;
    }

    try {
      setEnviando(true);
      await criarUsuario(nomeUsuario, senha, role);
      Alert.alert('Sucesso', `usuário ${nomeUsuario} (${role}) criado`);
      setNomeUsuario('');
      setSenha('');
    } catch (err) {
      Alert.alert('Erro', err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Criar usuário</Text>

      <TextInput
        style={styles.input}
        placeholder="nome de usuário"
        autoCapitalize="none"
        value={nomeUsuario}
        onChangeText={setNomeUsuario}
      />

      <TextInput
        style={styles.input}
        placeholder="senha"
        secureTextEntry
        value={senha}
        onChangeText={setSenha}
      />

      <Text style={styles.subtitulo}>Papel</Text>
      <View style={styles.linhaRoles}>
        {PAPEIS.map((papel) => (
          <BotaoHaptico
            key={papel}
            onPress={() => setRole(papel)}
            style={role === papel ? styles.roleSelecionada : styles.roleNormal}
          >
            {papel}
          </BotaoHaptico>
        ))}
      </View>

      <BotaoHaptico onPress={aoCriar} disabled={enviando}>
        {enviando ? 'Criando...' : 'Criar usuário'}
      </BotaoHaptico>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  titulo: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  subtitulo: { fontSize: 14, fontWeight: 'bold', marginTop: 8, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  linhaRoles: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  roleNormal: { backgroundColor: '#9e9e9e', flex: 1 },
  roleSelecionada: { backgroundColor: '#2e7d32', flex: 1 },
});
