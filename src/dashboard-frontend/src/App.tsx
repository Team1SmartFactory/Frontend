import { QueryProvider } from './shared/query/QueryProvider';
import { RealtimeGate } from './app/RealtimeGate';
import { AppRouter } from './app/AppRouter';

export default function App() {
  return (
    <QueryProvider>
      <RealtimeGate>
        <AppRouter />
      </RealtimeGate>
    </QueryProvider>
  );
}
