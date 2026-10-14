import React from 'react';
import {
  X,
  TrendingUp,
  AlertTriangle,
  Building2,
  ShoppingCart,
  Truck,
  Boxes,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export interface DrilldownModalData {
  type: 'revenue' | 'orders' | 'intake' | 'fillRate' | 'channel' | 'category' | 'product';
  title: string;
  subtitle: string;
  badge?: string;
  kpis: Array<{ label: string; value: string; hint?: string; isPositive?: boolean }>;
  detailsMarkdown?: string;
  tableData?: {
    headers: string[];
    rows: Array<Array<string | number>>;
  };
  actionLink?: {
    label: string;
    path: string;
  };
}

interface DrilldownModalProps {
  data: DrilldownModalData | null;
  onClose: () => void;
}

export const DrilldownModal: React.FC<DrilldownModalProps> = ({ data, onClose }) => {
  if (!data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative z-50 w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-50 dark:bg-orange-950 text-[#fd3706] border border-orange-200 dark:border-orange-900">
                {data.badge || 'TELEMETRY DRILLDOWN'}
              </span>
              <span className="text-xs text-slate-400">• Sharma FMCG Analytics</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {data.title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {data.subtitle}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto px-6 py-5 space-y-5">
          {/* 3-4 KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {data.kpis.map((kpi, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between"
              >
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {kpi.label}
                </span>
                <span className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {kpi.value}
                </span>
                {kpi.hint && (
                  <span
                    className={`text-[10px] font-semibold mt-1 ${
                      kpi.isPositive ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  >
                    {kpi.hint}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Table Data if available */}
          {data.tableData && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Detailed Telemetry Breakdown
              </h4>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800/80 text-[11px] font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                      {data.tableData.headers.map((h, i) => (
                        <th key={i} className="py-2.5 px-3 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.tableData.rows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className={`py-2 px-3 text-slate-700 dark:text-slate-300 ${
                              cIdx === 0 ? 'font-semibold text-slate-900 dark:text-slate-100' : ''
                            }`}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <span className="text-[11px] text-slate-400">
            Click outside or press <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono">Esc</kbd> to close
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
            {data.actionLink && (
              <Link
                to={data.actionLink.path}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#fd3706] hover:bg-[#e03004] text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <span>{data.actionLink.label}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
