import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ExcelWorkbookView } from "@/features/documents/components/ExcelWorkbookView";
import { useDocuments } from "@/features/documents/api/useDocuments";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function MainDashboard() {
  const { data: documentsData, isLoading, refetch } = useDocuments({
    pageSize: 500,
  });

  const documents = documentsData?.items || [];

  return (
    <div className="min-h-screen bg-[#f3f2f1] flex flex-col font-sans p-2 sm:p-4 selection:bg-emerald-100 selection:text-emerald-900">
      <main className="flex-1 mx-auto max-w-[1500px] w-full">
        <ExcelWorkbookView
          documents={documents}
          isLoading={isLoading}
          onRefresh={() => refetch()}
        />
      </main>
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainDashboard />
    </QueryClientProvider>
  );
}

export default App;
