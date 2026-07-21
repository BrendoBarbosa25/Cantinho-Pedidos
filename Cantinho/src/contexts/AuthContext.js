// contexts/AuthContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import { login as loginApi } from '../services/api';
import { salvarSessao, getUsuario, getToken, limparSessao } from '../services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
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

  async function entrar(nome_usuario, senha) {
    const resposta = await loginApi(nome_usuario, senha);
    await salvarSessao(resposta.token, resposta.usuario);
    setUsuario(resposta.usuario);
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
export function useAuth() {
  return useContext(AuthContext);
}
