// components/BotaoHaptico.js

import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

// children = o texto/conteúdo dentro do botão
// onPress = a função a executar quando tocado
export default function BotaoHaptico({ onPress, children, style }) {
  function aoTocar() {
    // Vibração leve — confirma a ação sem exigir atenção visual,
    // que é exatamente a justificativa do recurso na seção 7 do mob
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  return (
    <TouchableOpacity style={[styles.botao, style]} onPress={aoTocar}>
      <Text style={styles.texto}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  botao: {
    backgroundColor: '#2e7d32',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  texto: {
    color: '#fff',
    fontWeight: 'bold',
  },
});