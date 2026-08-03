import { useRealtimeConnection } from './app/useRealtimeConnection';
import { AppRouter } from './app/AppRouter';

export default function App() {
  useRealtimeConnection();
  return <AppRouter />;
}
