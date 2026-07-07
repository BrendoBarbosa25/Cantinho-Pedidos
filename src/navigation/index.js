// App.js (ou navigation/index.js, como preferir)
import { useState, useEffect } from 'react';
import Login from './src/screens/Login';
import ListaMesas from './src/screens/ListaMesas';
import Cozinha from './src/screens/Cozinha';
import Dashboard from './src/screens/Admin/Dashboard';
import { getToken, getRole, limparSessao } from './src/services/auth';

export default function App() {
  const [role, setRole] = useState(null);
  const [carregandoSessao, setCarregandoSessao] = useState(true);

  useEffect(() => {
    // ao abrir o app, confere se já tem sessão salva
    async function checarSessao() {
      const token = await getToken();
      const roleSalvo = await getRole();
      if (token && roleSalvo) setRole(roleSalvo);
      setCarregandoSessao(false);
    }
    checarSessao();
  }, []);

  if (carregandoSessao) return null; // ou uma tela de loading

  if (!role) {
    return <Login onLoginSuccess={(r) => setRole(r)} />;
  }

  if (role === 'garcom') return <ListaMesas />;
  if (role === 'cozinha') return <Cozinha />;
  if (role === 'admin') return <Dashboard />;

  return <Login onLoginSuccess={(r) => setRole(r)} />;
}   