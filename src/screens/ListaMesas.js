// screens/ListaMesas.js

import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native'; // recarrega ao voltar pra essa tela
import { listarComandas, abrirComanda } from '../services/api';
import BotaoHaptico from '../components/BotaoHaptico';

// O restaurante tem 8 mesas fixas (contexto do briefing) — geramos os números 1 a 8
const NUMEROS_DAS_MESAS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function ListaMesas({ navigation }) {
  const [comandasAbertas, setComandasAbertas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  // Busca as comandas abertas no backend, pra saber quais mesas estão ocupadas
  async function carregarComandas() {
    try {
      setCarregando(true);
      setErro(null);
      const todas = await listarComandas();
      // Filtra só as abertas — o que define "mesa ocupada"
      setComandasAbertas(todas.filter((c) => c.status === 'aberta'));
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  // useFocusEffect roda toda vez que a tela ganha foco — importante porque
  // ao voltar da tela de Comanda (depois de fechar uma comanda), a lista
  // precisa atualizar o status da mesa sem precisar recarregar o app inteiro
  useFocusEffect(
    useCallback(() => {
      carregarComandas();
    }, [])
  );

  // Acha se existe uma comanda aberta pra determinada mesa
  function comandaDaMesa(numeroMesa) {
    return comandasAbertas.find((c) => c.numero_mesa === numeroMesa);
  }

  async function aoTocarNaMesa(numeroMesa) {
    const comandaExistente = comandaDaMesa(numeroMesa);

    if (comandaExistente) {
      // Mesa já tem comanda aberta — só navega pra ela
      navigation.navigate('Comanda', { comandaId: comandaExistente.id, numeroMesa });
      return;
    }

    // Mesa livre — abre uma comanda nova antes de navegar
    try {
      const novaComanda = await abrirComanda(numeroMesa);
      navigation.navigate('Comanda', { comandaId: novaComanda.id, numeroMesa });
    } catch (err) {
      setErro(err.message);
    }
  }

  // Tratamento de loading — exigência do escopo mínimo do briefing geral
  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Tratamento de erro — mesma exigência
  if (erro) {
    return (
      <View style={styles.centro}>
        <Text style={styles.erro}>Erro: {erro}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={NUMEROS_DAS_MESAS}
      keyExtractor={(numero) => numero.toString()}
      contentContainerStyle={styles.lista}
      renderItem={({ item: numeroMesa }) => {
        const ocupada = !!comandaDaMesa(numeroMesa);
        return (
          <BotaoHaptico
            style={ocupada ? styles.mesaOcupada : styles.mesaLivre}
            onPress={() => aoTocarNaMesa(numeroMesa)}
          >
            {`Mesa ${numeroMesa} — ${ocupada ? 'Comanda aberta' : 'Livre'}`}
          </BotaoHaptico>
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
});