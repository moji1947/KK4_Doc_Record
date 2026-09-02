import { FileSpreadsheet, Layers, CheckCircle2, AlertTriangle } from "lucide-react";

interface HeaderProps {
  stats?: {
    total: number;
    conzolUploaded: number;
    conzolPending: number;
  };
}

export function Header({ stats }: HeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white shadow-xs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Brand & Project Info */}
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-scg-red text-white font-black text-xs shadow-sm">
              SCG
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-bold text-slate-900 tracking-tight flex items-center space-x-1.5">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600 inline" />
                  <span>KK4 Document Register & ConZoL Upload Platform</span>
                </h1>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold font-mono text-slate-700 border border-slate-300">
                  CM24045
                </span>
                <span className="hidden sm:inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 border border-slate-200">
                  SKK-IM-CM26002
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Cement Implement SKK — Satellite Burner KK4
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          {stats && (
            <div className="flex items-center space-x-3 text-xs">
              <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-medium">
                <Layers className="h-3.5 w-3.5 text-blue-600" />
                <span>Total: <strong>{stats.total}</strong></span>
              </div>

              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-300 text-amber-900 font-bold">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                <span>Pending ConZoL: <strong>{stats.conzolPending}</strong></span>
              </div>

              <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Uploaded: <strong>{stats.conzolUploaded}</strong></span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
