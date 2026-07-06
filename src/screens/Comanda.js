// screens/Comanda.js

import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import {
    listarItensDaComanda,
    listarCardapio,
    adicionarItem,
    removerItem,
    fecharComanda,
} from '../services/api';
import BotaoHaptico from '../components/BotaoHaptico';

// route.params traz o que a tela anterior passou via navigation.navigate
export default function Comanda({ route, navigation }) {
    const { comandaId, numeroMesa } = route.params;

    const [itens, setItens] = useState([]);
    const [cardapio, setCardapio] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(null);

    async function carregarDados() {
        try {
            setCarregando(true);
            setErro(null);
            // Busca os dois de uma vez — mais rápido que sequencial
            const [itensResposta, cardapioResposta] = await Promise.all([
                listarItensDaComanda(comandaId),
                listarCardapio(),
            ]);
            setItens(itensResposta);
            setCardapio(cardapioResposta);
        } catch (err) {
            setErro(err.message);
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        carregarDados();
    }, []);

    // O total NÃO é calculado só aqui pra exibição definitiva — o mob (seção 4.2)
    // diz que a fonte de verdade é o banco. Isso aqui é só pra feedback visual
    // rápido na tela; o valor oficial vem quando a comanda é fechada.
    const total = itens.reduce((soma, item) => {
        return soma + item.quantidade * item.preco;
    }, 0);

    async function aoAdicionarItem(itemCardapio) {
        try {
            await adicionarItem(comandaId, itemCardapio.id, 1, null);
            await carregarDados(); // recarrega pra pegar o item já persistido
        } catch (err) {
            Alert.alert('Erro', err.message);
        }
    }

    async function aoRemoverItem(itemId) {
        try {
            await removerItem(itemId);
            await carregarDados();
        } catch (err) {
            Alert.alert('Erro', err.message);
        }
    }

    async function aoFecharComanda() {
        try {
            await fecharComanda(comandaId);
            navigation.goBack(); // volta pra ListaMesas, que recarrega via useFocusEffect
        } catch (err) {
            Alert.alert('Erro', err.message);
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
        <View style={styles.container}>
            <Text style={styles.titulo}>Mesa {numeroMesa}</Text>

            <Text style={styles.subtitulo}>Itens na comanda</Text>
            <FlatList
                data={itens}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.linhaItem}>
                        <Text>{item.quantidade}x {item.nome_item}</Text>
                        <BotaoHaptico onPress={() => aoRemoverItem(item.id)} style={styles.botaoRemover}>
                            Remover
                        </BotaoHaptico>
                    </View>
                )}
                ListEmptyComponent={<Text>Nenhum item ainda</Text>}
            />

            <Text style={styles.total}>Total: R$ {total.toFixed(2)}</Text>

            <Text style={styles.subtitulo}>Cardápio</Text>
            <FlatList
                data={cardapio}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <BotaoHaptico onPress={() => aoAdicionarItem(item)} style={styles.botaoAdicionar}>
                        {`${item.nome} — R$ ${item.preco}`}
                    </BotaoHaptico>
                )}
            />

            <BotaoHaptico onPress={aoFecharComanda} style={styles.botaoFechar}>
                Fechar comanda
            </BotaoHaptico>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    erro: { color: 'red' },
    titulo: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
    subtitulo: { fontSize: 16, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
    linhaItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
    total: { fontSize: 18, fontWeight: 'bold', marginTop: 12 },
    botaoRemover: { backgroundColor: '#c62828', paddingHorizontal: 10, paddingVertical: 4 },
    botaoAdicionar: { backgroundColor: '#1565c0', marginBottom: 6 },
    botaoFechar: { backgroundColor: '#2e7d32', marginTop: 16 },
});