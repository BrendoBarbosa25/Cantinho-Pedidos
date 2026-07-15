// screens/ListaMesas.js
import { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { listarMesas, listarComandas, abrirComanda } from '../services/api';
import BotaoHaptico from '../components/BotaoHaptico';

export default function ListaMesas({ navigation }) {
  const [mesas, setMesas] = useState([]);
  const [comandasAbertas, setComandasAbertas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  async function carregarDados() {
    try {
      setCarregando(true);
      setErro(null);
      // busca as duas coisas em paralelo — mais rápido que sequencial
      const [todasMesas, todasComandas] = await Promise.all([ //permite executar varias operacoes assincronas ao mesmo tempo e esperar que todas elas terminem para continuar o códig
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

  // Recarrega toda vez que a tela ganha foco — importante ao voltar
  // da tela de Comanda (depois de fechar), pra mesa aparecer livre de novo
  useFocusEffect( //hook do rectnative. Ele roda o codigo de dentro dele toda vez que a tela fica visível. se o usuário sair da tela e voltar, ele roda de novo.
    useCallback(() => { //Ele memoriza a função carregarDados() para que ela não seja recriada sem necessidade a cada renderização da tela.
      carregarDados();
    }, [])
  );

  // aCha se existe uma comanda aberta pra determinada mesa (por id, não número)
  function comandaDaMesa(mesaId) {
    return comandasAbertas.find((c) => c.mesa_id === mesaId);
  }

  async function aoTocarNaMesa(mesa) {
    const comandaExistente = comandaDaMesa(mesa.id); // vai passar de comanda em comanda  e checar se o mesaid dela é igual ao mesaID

    if (comandaExistente) { //se a comanda existir
      // Mesa já tem comanda aberta — só navega pra ela
      navigation.navigate('Comanda', {  //navigation.navigate serve para mudar de tela
        comandaId: comandaExistente.id,
        numeroMesa: mesa.numero,
      });
      return;
    }

    // Mesa livre abre uma comanda nova antes de navegar
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
        return (
          <BotaoHaptico
            style={ocupada ? styles.mesaOcupada : styles.mesaLivre}
            onPress={() => aoTocarNaMesa(mesa)}
          >
            {`Mesa ${mesa.numero} — ${ocupada ? 'Comanda aberta' : 'Livre'}`}
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
