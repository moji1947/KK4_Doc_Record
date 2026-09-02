import * as React from "react";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { Header } from "@/components/shared/Header";
import { SpreadsheetView } from "@/features/documents/components/SpreadsheetView";
import { DocumentDetailModal } from "@/features/documents/components/DocumentDetailModal";
import { SubmitRevisionModal } from "@/features/documents/components/SubmitRevisionModal";
import {
  useDocuments,
  DocumentRecord,
} from "@/features/documents/api/useDocuments";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function DocumentRegisterDashboard() {
  const [selectedDocForDetail, setSelectedDocForDetail] =
    React.useState<DocumentRecord | null>(null);
  const [selectedDocForRevision, setSelectedDocForRevision] =
    React.useState<DocumentRecord | null>(null);

  // Load all document records
  const { data: documentsData, isLoading, isError, refetch } = useDocuments({
    pageSize: 300,
  });

  const documents = documentsData?.items || [];

  const stats = React.useMemo(() => {
    const total = documents.length;
    const conzolUploaded = documents.filter((d) => d.erpSynced).length;
    const conzolPending = documents.filter((d) => !d.erpSynced).length;
    return { total, conzolUploaded, conzolPending };
  }, [documents]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        stats={{
          total: stats.total,
          conzolUploaded: stats.conzolUploaded,
          conzolPending: stats.conzolPending,
        }}
      />

      {/* Main Spreadsheet Interface (Google Sheets Style) */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-4">
        <SpreadsheetView
          documents={documents}
          isLoading={isLoading}
          isError={isError}
          onSelectDocument={(doc) => setSelectedDocForDetail(doc)}
          onSubmitRevision={(doc) => setSelectedDocForRevision(doc)}
          onRefresh={() => refetch()}
        />
      </main>

      {/* MODALS */}
      <DocumentDetailModal
        documentId={selectedDocForDetail?.documentId || null}
        isOpen={!!selectedDocForDetail}
        onClose={() => setSelectedDocForDetail(null)}
        onSubmitRevision={(doc) => setSelectedDocForRevision(doc)}
      />

      <SubmitRevisionModal
        document={selectedDocForRevision}
        isOpen={!!selectedDocForRevision}
        onClose={() => setSelectedDocForRevision(null)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DocumentRegisterDashboard />
    </QueryClientProvider>
  );
}

export default App;
