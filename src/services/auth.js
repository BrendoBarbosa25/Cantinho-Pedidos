import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAVE_TOKEN = '@cantinho:token';
const CHAVE_USUARIO = '@cantinho:usuario';

// Salva o token e os dados do usuário depois de um login
export async function salvarSessao(token, usuario) { //Salvar sessão sabe onde é o token/usuario pq é usado lá na função entrar de entrar (entrar) em authcontext.js
  // Guarda o token no PRÓPRIO CELULAR (AsyncStorage), não no banco/servidor.
  // Isso funciona porque o JWT não depende do servidor "lembrar" de nada 
  // a validade dele é conferida por cálculo (assinatura), não por consulta
  // ao banco. Por isso, mesmo o servidor do Render dormindo/reiniciando
  // (comportamento do plano free), o token continua válido normalmente,
  // sem precisar logar de novo.
  await AsyncStorage.setItem(CHAVE_TOKEN, token); 
  await AsyncStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
}

// Lê o token salvo (usado pelo api.js em toda requisição)
export async function getToken() {  //Lê o token salvo 
  return AsyncStorage.getItem(CHAVE_TOKEN);
}

// Lê os dados do usuário salvos (id, nome_usuario, role)
export async function getUsuario() {  //Lê os dados do usuário salvos
  const valor = await AsyncStorage.getItem(CHAVE_USUARIO); //pega o token no storage do celular
  return valor ? JSON.parse(valor) : null;
}

// Remove a sessão — usado no logout
export async function limparSessao() { //Apaga tudo (usado no logout)
  await AsyncStorage.removeItem(CHAVE_TOKEN); //jogue tudo fora que estiver na gaveta chamada "'@cantinho:token';
  await AsyncStorage.removeItem(CHAVE_USUARIO); //repete a mesma coisa aqui
}
