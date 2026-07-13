// screens/ListaMesas.js
import { useState, useCallback, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import {
  listarMesas,
  listarComandas,
  abrirComanda,
  listarPedidosPorStatus,
  atualizarStatusPedido,
} from '../services/api';
import BotaoHaptico from '../components/BotaoHaptico';

export default function ListaMesas({ navigation }) {
  const [mesas, setMesas] = useState([]);
  const [comandasAbertas, setComandasAbertas] = useState([]);
  const [pedidosProntos, setPedidosProntos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  // Guarda os ids de pedidos "prontos" já vistos, pra só disparar o
  // haptic quando um pedido NOVO ficar pronto (e não a cada polling).
  const idsProntosVistos = useRef(new Set());

  async function carregarDados() {
    try {
      setCarregando(true);
      setErro(null);
      // busca as duas coisas em paralelo — mais rápido que sequencial
      const [todasMesas, todasComandas] = await Promise.all([
        listarMesas(),
        listarComandas(),
      ]);
      setMesas(todasMesas);
      setComandasAbertas(todasComandas.filter((c) => c.status === 'aberta'));
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  // Busca pedidos com status "pronto" — usado pra acender o aviso amarelo
  // na mesa correspondente. Roda em polling, sem afetar o loading principal.
  async function carregarPedidosProntos() {
    try {
      const prontos = await listarPedidosPorStatus('pronto');
      setPedidosProntos(prontos);

      const idsAtuais = new Set(prontos.map((p) => p.id));
      const surgiuNovoPronto = prontos.some((p) => !idsProntosVistos.current.has(p.id));

      if (surgiuNovoPronto) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      idsProntosVistos.current = idsAtuais;
    } catch (err) {
      // silencioso — não queremos travar a tela principal por causa disso
    }
  }

  // Recarrega toda vez que a tela ganha foco — importante ao voltar
  // da tela de Comanda (depois de fechar), pra mesa aparecer livre de novo.
  // Também faz polling de pedidos prontos, pro garçom saber sem precisar
  // ficar entrando e saindo da tela.
  useFocusEffect(
    useCallback(() => {
      carregarDados();
      carregarPedidosProntos();
      const intervalo = setInterval(carregarPedidosProntos, 10000); // a cada 10s
      return () => clearInterval(intervalo);
    }, [])
  );

  // Acha se existe uma comanda aberta pra determinada mesa (por id, não número)
  function comandaDaMesa(mesaId) {
    return comandasAbertas.find((c) => c.mesa_id === mesaId);
  }

  // Acha se a comanda da mesa tem algum pedido pronto aguardando entrega
  function pedidoProntoDaMesa(mesaId) {
    const comanda = comandaDaMesa(mesaId);
    if (!comanda) return null;
    return pedidosProntos.find((p) => p.comanda_id === comanda.id) || null;
  }

  // Chamado ao tocar em "Pedido Retirado" — marca o pedido como entregue,
  // o que faz o aviso amarelo sumir na próxima atualização.
  async function aoRetirarPedido(pedidoId) {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await atualizarStatusPedido(pedidoId, 'entregue');
      // remove localmente na hora, sem esperar o próximo polling
      setPedidosProntos((atual) => atual.filter((p) => p.id !== pedidoId));
      idsProntosVistos.current.delete(pedidoId);
    } catch (err) {
      setErro(err.message);
    }
  }

  async function aoTocarNaMesa(mesa) {
    const comandaExistente = comandaDaMesa(mesa.id);

    if (comandaExistente) {
      // Mesa já tem comanda aberta — só navega pra ela
      navigation.navigate('Comanda', {
        comandaId: comandaExistente.id,
        numeroMesa: mesa.numero,
      });
      return;
    }

    // Mesa livre — abre uma comanda nova antes de navegar
    try {
      const novaComanda = await abrirComanda(mesa.id);
      navigation.navigate('Comanda', {
        comandaId: novaComanda.id,
        numeroMesa: mesa.numero,
      });
    } catch (err) {
      setErro(err.message);
    }
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
      data={mesas}
      keyExtractor={(mesa) => mesa.id.toString()}
      contentContainerStyle={styles.lista}
      renderItem={({ item: mesa }) => {
        const ocupada = !!comandaDaMesa(mesa.id);
        const pedidoPronto = pedidoProntoDaMesa(mesa.id);

        let estilo = styles.mesaLivre;
        let texto = `Mesa ${mesa.numero} — Livre`;

        if (pedidoPronto) {
          estilo = styles.mesaPronta;
          texto = `Pedido#${pedidoPronto.id} | Comanda #${pedidoPronto.comanda_id} - Pronto`;
        } else if (ocupada) {
          estilo = styles.mesaOcupada;
          texto = `Mesa ${mesa.numero} — Comanda aberta`;
        }

        return (
          <View>
            {pedidoPronto && (
              <View style={styles.blocoRetirada}>
                <Text style={styles.labelRetirada}>
                  Pedido #{pedidoPronto.id} | Comanda #{pedidoPronto.comanda_id}
                </Text>
                <BotaoHaptico
                  style={styles.botaoRetirado}
                  onPress={() => aoRetirarPedido(pedidoPronto.id)}
                >
                  Pedido Retirado
                </BotaoHaptico>
              </View>
            )}

            <BotaoHaptico style={estilo} onPress={() => aoTocarNaMesa(mesa)}>
              {texto}
            </BotaoHaptico>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  erro: { color: 'red' },
  lista: { padding: 16, gap: 12 },
  mesaLivre: { backgroundColor: '#2e7d32' },
  mesaOcupada: { backgroundColor: '#c62828' },
  mesaPronta: { backgroundColor: '#f9a825' },
  blocoRetirada: { marginBottom: 6 },
  labelRetirada: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#5d4037',
  },
  botaoRetirado: { backgroundColor: '#1565c0', marginBottom: 6 },
});