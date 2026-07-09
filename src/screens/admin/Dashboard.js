// screens/admin/Dashboard.js
import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { listarComandas } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import BotaoHaptico from '../../components/BotaoHaptico';

export default function Dashboard({ navigation }) {
  const { usuario } = useAuth();
  const [comandasAbertas, setComandasAbertas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      async function carregar() {
        setCarregando(true);
        try {
          const comandas = await listarComandas();
          setComandasAbertas(comandas);
        } finally {
          setCarregando(false);
        }
      }
      carregar();
    }, [])
  );

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Olá, {usuario?.nome_usuario}</Text>
      <Text style={styles.metrica}>Comandas abertas agora: {comandasAbertas.length}</Text>

      <BotaoHaptico onPress={() => navigation.navigate('ListaMesas')}>
        Ver mesas
      </BotaoHaptico>

      <View style={{ height: 12 }} />

      <BotaoHaptico onPress={() => navigation.navigate('Cozinha')}>
        Ver fila da cozinha
      </BotaoHaptico>

      <View style={{ height: 12 }} />

      <BotaoHaptico onPress={() => navigation.navigate('CriarUsuario')}>
        Criar novo usuário
      </BotaoHaptico>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titulo: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  metrica: { fontSize: 16, marginBottom: 24, color: '#555' },
});