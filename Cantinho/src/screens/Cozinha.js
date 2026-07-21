// screens/Cozinha.js
import { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { listarPedidosPorStatus, atualizarStatusPedido } from '../services/api';
import BotaoHaptico from '../components/BotaoHaptico';

export default function Cozinha() {
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  async function carregarPedidos() {
    try {
      setCarregando(true);
      setErro(null);
      // listarPedidosPorStatus já retorna cada pedido com numero_mesa,
      // comanda_id e itens (ver services/api.js)
      const pendentes = await listarPedidosPorStatus('pendente');
      setPedidos(pendentes);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  // Recarrega toda vez que a tela ganha foco, e também periodicamente
  // (polling simples — a cozinha precisa ver pedido novo sem recarregar manualmente)
  useFocusEffect(
    useCallback(() => {
      carregarPedidos();
      const intervalo = setInterval(carregarPedidos, 10000); // a cada 10s
      return () => clearInterval(intervalo);
    }, [])
  );

  async function marcarPronto(pedidoId) {
    try {
      await atualizarStatusPedido(pedidoId, 'pronto');
      await carregarPedidos();
    } catch (err) {
      Alert.alert('Erro', err.message);
    }
  }

  if (carregando && pedidos.length === 0) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (erro) {
    return (
      <View style={styles.centro}>
        <Text style={styles.erro}>Erro: {erro}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={pedidos}
      keyExtractor={(pedido) => pedido.id.toString()}
      contentContainerStyle={styles.lista}
      ListEmptyComponent={<Text style={styles.vazio}>Nenhum pedido pendente</Text>}
      renderItem={({ item: pedido }) => (
        <View style={styles.card}>
          <Text style={styles.tituloCard}>
            Pedido #{pedido.id} — Mesa {pedido.numero_mesa}
          </Text>
          <Text style={styles.subTituloCard}>Comanda #{pedido.comanda_id}</Text>

          <View style={styles.listaItens}>
            {pedido.itens.map((item) => (
              <Text key={item.id} style={styles.linhaItem}>
                {item.quantidade}x {item.nome}
                {item.observacao ? ` (${item.observacao})` : ''}
              </Text>
            ))}
          </View>

          <BotaoHaptico onPress={() => marcarPronto(pedido.id)}>
            Marcar como pronto
          </BotaoHaptico>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  erro: { color: 'red' },
  vazio: { textAlign: 'center', marginTop: 32, color: '#888' },
  lista: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff3e0', padding: 16, borderRadius: 8 },
  tituloCard: { fontSize: 18, fontWeight: 'bold', marginBottom: 2 },
  subTituloCard: { fontSize: 13, color: '#795548', marginBottom: 10 },
  listaItens: { marginBottom: 12 },
  linhaItem: { fontSize: 15, paddingVertical: 2 },
});