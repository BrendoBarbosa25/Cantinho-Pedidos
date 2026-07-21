// services/auth.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAVE_TOKEN = '@cantinho:token';
const CHAVE_USUARIO = '@cantinho:usuario';

// Salva o token e os dados do usuário depois de um login bem-sucedido
export async function salvarSessao(token, usuario) {
  await AsyncStorage.setItem(CHAVE_TOKEN, token);
  await AsyncStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
}

// Lê o token salvo (usado pelo api.js em toda requisição)
export async function getToken() {
  return AsyncStorage.getItem(CHAVE_TOKEN);
}

// Lê os dados do usuário salvos (id, nome_usuario, role)
export async function getUsuario() {
  const valor = await AsyncStorage.getItem(CHAVE_USUARIO);
  return valor ? JSON.parse(valor) : null;
}

// Remove a sessão — usado no logout
export async function limparSessao() {
  await AsyncStorage.removeItem(CHAVE_TOKEN);
  await AsyncStorage.removeItem(CHAVE_USUARIO);
}
