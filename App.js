// App.js

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Importa as telas que ainda vamos criar
import ListaMesas from './src/screens/ListaMesas';
import Comanda from './src/screens/Comanda';

// Cria o "empilhador" de telas — cada tela nova entra por cima da anterior,
// e o usuário pode voltar (botão nativo do Android faz isso sozinho)
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    // NavigationContainer é obrigatório — é o "container raiz" que gerencia
    // todo o estado de navegação do app (qual tela está ativa, histórico, etc.)
    <NavigationContainer>
      <Stack.Navigator initialRouteName="ListaMesas">
        {/* Cada Stack.Screen registra uma tela com um "nome" que usamos
            depois em navigation.navigate('NomeDaTela') */}
        <Stack.Screen
          name="ListaMesas"
          component={ListaMesas}
          options={{ title: 'Mesas' }}
        />
        <Stack.Screen
          name="Comanda"
          component={Comanda}
          options={{ title: 'Comanda' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}