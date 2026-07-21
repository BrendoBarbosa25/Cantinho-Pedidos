// App.js
import { AuthProvider } from './src/contexts/AuthContext';
import Navegacao from './src/navigation';

export default function App() {
  return (
    <AuthProvider>
      <Navegacao />
    </AuthProvider>
  );
}
