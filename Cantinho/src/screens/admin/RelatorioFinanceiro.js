// screens/admin/RelatorioFinanceiro.js
import { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { buscarFaturamento } from '../../services/api';

export default function RelatorioFinanceiro() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useFocusEffect(
    useCallback(() => {
      async function carregar() {
        try {
          setCarregando(true);
          setErro(null);
          const resultado = await buscarFaturamento(); // últimos 7 dias por padrão
          setDados(resultado);
        } catch (err) {
          setErro(err.message);
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
      data={dados.porDia}
      keyExtractor={(linha) => linha.dia}
      ListHeaderComponent={
        <View style={styles.resumo}>
          <Text style={styles.titulo}>Faturamento — últimos 7 dias</Text>
          <Text style={styles.totalGeral}>
            R$ {Number(dados.totalGeral).toFixed(2)}
          </Text>
          <Text style={styles.legenda}>
            {dados.totalComandas} comanda(s) fechada(s)
          </Text>
        </View>
      }
      ListEmptyComponent={
        <Text style={styles.vazio}>Nenhuma comanda fechada no período</Text>
      }
      renderItem={({ item }) => (
        <View style={styles.linhaDia}>
          <Text style={styles.dia}>{formatarData(item.dia)}</Text>
          <Text style={styles.valorDia}>R$ {Number(item.total).toFixed(2)}</Text>
          <Text style={styles.qtdDia}>{item.comandas} comanda(s)</Text>
        </View>
      )}
    />
  );
}

function formatarData(dataISO) {
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  erro: { color: 'red' },
  vazio: { textAlign: 'center', marginTop: 32, color: '#888' },
  resumo: { marginBottom: 20 },
  titulo: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  totalGeral: { fontSize: 32, fontWeight: 'bold', color: '#2e7d32' },
  legenda: { fontSize: 14, color: '#666', marginTop: 4 },
  linhaDia: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  dia: { fontWeight: 'bold' },
  valorDia: { fontWeight: 'bold', color: '#2e7d32' },
  qtdDia: { color: '#666', fontSize: 12 },
});