import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnalysisDashboard } from "./components/AnalysisDashboard";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="dark min-h-screen bg-background">
        <AnalysisDashboard />
      </div>
    </QueryClientProvider>
  );
}
