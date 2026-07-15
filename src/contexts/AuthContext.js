// contexts/AuthContext.js serve pra guardar quem esta logado 
import { createContext, useContext, useState, useEffect } from 'react';
import { login as loginApi } from '../services/api';
import { salvarSessao, getUsuario, getToken, limparSessao } from '../services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) { //children representa tudo que for colocado dentro das tags <AuthProvider>
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  // Ao abrir o app, confere se já existe uma sessão salva
  useEffect(() => {
    async function checarSessaoSalva() { 
      const token = await getToken();
      const usuarioSalvo = await getUsuario();
      if (token && usuarioSalvo) {
        setUsuario(usuarioSalvo);
      }
      setCarregando(false);
    }
    checarSessaoSalva();
  }, []);

  async function entrar(nome_usuario, senha) { //chama a API, salva a sessão, atualiza o estado
    const resposta = await loginApi(nome_usuario, senha); //loginapi fica em api.js! Resposta recebe o que volta do backend (ex:{mensagem: login foi um sucesso} )
    await salvarSessao(resposta.token, resposta.usuario);  //guarda o token e o as informações do usuario. isso aqui é uma função (salvarSessao) lá do auth.js!!!!
    setUsuario(resposta.usuario); //salva o usuario
  }

  async function sair() {
    await limparSessao(); 
    setUsuario(null); 
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, entrar, sair }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook usado em qualquer tela: const { usuario, sair } = useAuth();
export function useAuth() { //empresta pra qualquer tela o usuario.entrar.sair
  return useContext(AuthContext);
}
