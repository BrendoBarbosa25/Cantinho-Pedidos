// screens/Comanda.js
import { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import {
  listarPedidosDaComanda,
  listarItensDoPedido,
  listarCardapio,
  criarPedido,
  adicionarItem,
  removerItem,
  fecharComanda,
} from '../services/api';
import BotaoHaptico from '../components/BotaoHaptico';

const ETIQUETA_STATUS = {
  pendente: 'Pendente',
  pronto: 'Pronto — aguardando entrega',
  entregue: 'Pedido entregue',
};

export default function Comanda({ route, navigation }) {
  const { comandaId, numeroMesa } = route.params;

  const [pedidos, setPedidos] = useState([]); // cada pedido já vem com seus itens
  const [cardapio, setCardapio] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  async function carregarDados() {
    try {
      setCarregando(true);
      setErro(null);

      const [listaPedidos, listaCardapio] = await Promise.all([ //Promisse.all permite executar varias operações assincronas ao mesmo tempo e esperar que todas elas terminem para continuar o codigo
        listarPedidosDaComanda(comandaId),
        listarCardapio(),
      ]);

      // busca os itens de cada pedido (uma chamada por pedido)
      const pedidosComItens = await Promise.all( 
        listaPedidos.map(async (pedido) => ({ //.map é um transformador de listas. Ele passa por cada item do array (cada pedido) e devolve um item novo para criar uma lista novinha no final
          //O async foi colocado ali porque dentro da transformação de cada pedido, você precisa fazer uma operação demorada: buscar os itens no servidor
          ...pedido, // O '...' (Spread) copia/espalha todas as propriedades do pedido original (ex: id, mesa, total)
    // Isso garante que os dados antigos não sejam apagados ou perdidos no novo objeto
          itens: await listarItensDoPedido(pedido.id),
        }))
      );

      setPedidos(pedidosComItens);
      setCardapio(listaCardapio);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [])
  );

  // O pedido "atual" é o último pendente — é nele que novos itens entram.
  // Se não existir nenhum pendente (primeiro pedido, ou o último já foi entregue e o cliente quer pedir de novo), precisa criar um pedido novo
  const pedidoAtual = pedidos.find((p) => p.status === 'pendente'); 

  const totalGeral = pedidos.reduce((soma, pedido) => { 
    const totalPedido = pedido.itens.reduce(
      (s, item) => s + item.quantidade * item.preco,
      0 //esse 0 é o ponto inicial da soma
    );
    return soma + totalPedido;
  }, 0); //0 é o ponto inicial da soma
//Se nao colocar o 0, o JavaScript vai pegar o primeiro objeto inteiro da lista (o primeiro pedido ou o primeiro item) e tentar somar com o preço do segundo
  async function aoIniciarNovoPedido() {
    try {
      await criarPedido(comandaId);
      await carregarDados();
    } catch (err) {
      Alert.alert('Erro', err.message);
    }
  }

  async function aoAdicionarItem(itemCardapio) {
    if (!pedidoAtual) {
      Alert.alert('Atenção', 'inicie um novo pedido antes de adicionar itens');
      return;
    }
    try {
      await adicionarItem(pedidoAtual.id, itemCardapio.id, 1, null);
      await carregarDados();
    } catch (err) {
      Alert.alert('Erro', err.message);
    }
  }

  function aoRemoverItem(itemId) {
    Alert.alert(
      'Remover item',
      'Tem certeza que deseja remover este item do pedido?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await removerItem(itemId);
              await carregarDados();
            } catch (err) {
              Alert.alert('Erro', err.message);
            }
          },
        },
      ]
    );
  }

  // Efetivamente fecha a comanda no backend (chamado só depois da confirmação)
  async function aoFecharComanda() {
    try {
      await fecharComanda(comandaId);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Erro', err.message);
    }
  }

  // Pop-up de confirmação — "Quer fechar a comanda (mesa) com o valor (x)?"
  // Cada botão dispara um haptic diferente antes de resolver a ação:
  // "Sim" segue com o fechamento, "Não" só cancela.
  function confirmarFechamento() {
    Alert.alert(
      'Fechar comanda',
      `Quer fechar a comanda (Mesa ${numeroMesa}) com o valor (R$ ${totalGeral.toFixed(2)})?`,
      [
        {
          text: 'Não',
          style: 'cancel',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        },
        {
          text: 'Sim',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            aoFecharComanda();
          },
        },
      ],
      { cancelable: true }
    );
  }

  if (carregando) {
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
      style={styles.container}
      data={pedidos}
      keyExtractor={(pedido) => pedido.id.toString()}
      ListHeaderComponent={
        <Text style={styles.titulo}>Mesa {numeroMesa}</Text>
      }
      renderItem={({ item: pedido }) => (
        <View style={styles.blocoPedido}>
          <Text style={styles.statusPedido}>
            Pedido #{pedido.id} — {ETIQUETA_STATUS[pedido.status]}
          </Text>
          {pedido.itens.map((item) => (
            <View key={item.id} style={styles.linhaItem}>
              <Text>{item.quantidade}x {item.nome}</Text>
              {pedido.status === 'pendente' && (
                <BotaoHaptico onPress={() => aoRemoverItem(item.id)} style={styles.botaoRemover}>
                  Remover
                </BotaoHaptico>
              )}
            </View>
          ))}
        </View>
      )}
      ListFooterComponent={
        <View>
          <Text style={styles.total}>Total: R$ {totalGeral.toFixed(2)}</Text>

          {!pedidoAtual && (
            <BotaoHaptico onPress={aoIniciarNovoPedido} style={styles.botaoNovoPedido}>
              Fazer novo pedido
            </BotaoHaptico>
          )}

          {pedidoAtual && (
            <>
              <Text style={styles.subtitulo}>Adicionar ao pedido atual</Text>
              <FlatList
                data={cardapio}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <BotaoHaptico onPress={() => aoAdicionarItem(item)} style={styles.botaoAdicionar}>
                    {`${item.nome} — R$ ${item.preco}`}
                  </BotaoHaptico>
                )}
              />
            </>
          )}

          <BotaoHaptico onPress={confirmarFechamento} style={styles.botaoFechar}>
            Fechar comanda
          </BotaoHaptico>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  erro: { color: 'red' },
  titulo: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  subtitulo: { fontSize: 16, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  blocoPedido: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  statusPedido: { fontWeight: 'bold', marginBottom: 6 },
  linhaItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  total: { fontSize: 18, fontWeight: 'bold', marginTop: 8, marginBottom: 12 },
  botaoRemover: { backgroundColor: '#c62828', paddingHorizontal: 10, paddingVertical: 4 },
  botaoAdicionar: { backgroundColor: '#1565c0', marginBottom: 6 },
  botaoNovoPedido: { backgroundColor: '#f9a825', marginBottom: 16 },
  botaoFechar: { backgroundColor: '#2e7d32', marginTop: 16, marginBottom: 32 },
});