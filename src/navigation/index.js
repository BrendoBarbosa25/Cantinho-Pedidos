// navigation/index.js
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, TouchableOpacity, Text } from 'react-native';

import { useAuth } from '../contexts/AuthContext';

import Login from '../screens/login';
import ListaMesas from '../screens/ListaMesas';
import Comanda from '../screens/Comanda';
import Cozinha from '../screens/Cozinha';
import Dashboard from '../screens/admin/Dashboard';
import CriarUsuario from '../screens/admin/CriarUsuario';

const Stack = createNativeStackNavigator();

function BotaoSair() {
  const { sair } = useAuth();
  return (
    <TouchableOpacity onPress={sair} style={{ marginRight: 16 }}>
      <Text style={{ color: '#c62828', fontWeight: 'bold' }}>Sair</Text>
    </TouchableOpacity>
  );
}

const opcoesComuns = {
  headerRight: () => <BotaoSair />,
};

function StackGarcom() {
  return (
    <Stack.Navigator initialRouteName="ListaMesas" screenOptions={opcoesComuns}>
      <Stack.Screen name="ListaMesas" component={ListaMesas} options={{ title: 'Mesas' }} />
      <Stack.Screen name="Comanda" component={Comanda} options={{ title: 'Comanda' }} />
    </Stack.Navigator>
  );
}

function StackCozinha() {
  return (
    <Stack.Navigator screenOptions={opcoesComuns}>
      <Stack.Screen name="Cozinha" component={Cozinha} options={{ title: 'Fila da cozinha' }} />
    </Stack.Navigator>
  );
}

// O admin agora tem acesso a TODAS as telas do sistema, não só ao painel.
// Ele começa no Dashboard, mas pode navegar pra qualquer uma das outras.
function StackAdmin() {
  return (
    <Stack.Navigator initialRouteName="Dashboard" screenOptions={opcoesComuns}>
      <Stack.Screen name="Dashboard" component={Dashboard} options={{ title: 'Painel' }} />
      <Stack.Screen name="CriarUsuario" component={CriarUsuario} options={{ title: 'Novo usuário' }} />
      <Stack.Screen name="ListaMesas" component={ListaMesas} options={{ title: 'Mesas' }} />
      <Stack.Screen name="Comanda" component={Comanda} options={{ title: 'Comanda' }} />
      <Stack.Screen name="Cozinha" component={Cozinha} options={{ title: 'Fila da cozinha' }} />
    </Stack.Navigator>
  );
}

export default function Navegacao() {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!usuario && <Login />}
      {usuario?.role === 'garcom' && <StackGarcom />}
      {usuario?.role === 'cozinha' && <StackCozinha />}
      {usuario?.role === 'admin' && <StackAdmin />}
    </NavigationContainer>
  );
}