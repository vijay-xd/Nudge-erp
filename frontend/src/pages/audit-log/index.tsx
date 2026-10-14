import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, History, User, Activity } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { SearchInput } from '@/components/ui/search-input';
import { auditService } from '@/services/audit.service';

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const { data: auditData, isLoading } = useQuery({
    queryKey: ['audit-logs', page, search, entityFilter],
    queryFn: () =>
      auditService.getAll({
        page,
        limit: 25,
        search: search || undefined,
        entityType: entityFilter || undefined,
      }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Trail & Security Log"
        description="Immutable record of critical business actions: orders approved, shipments released, stock adjusted, and financial payments."
        badge={auditData?.meta?.total ? `${auditData.meta.total} events recorded` : undefined}
      />

      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="w-full md:w-96">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by action, entity ID, or keyword..."
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-sm font-medium text-slate-500">Entity:</span>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm"
            >
              <option value="">All Entities</option>
              <option value="SalesOrder">Sales Orders</option>
              <option value="PurchaseOrder">Purchase Orders</option>
              <option value="GoodsReceipt">Goods Receipts</option>
              <option value="Shipment">Shipments</option>
              <option value="InventoryTransaction">Inventory Transactions</option>
              <option value="CustomerInvoice">Customer Invoices</option>
              <option value="Payment">Payments</option>
              <option value="EmailImport">Document Imports</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">Actor / User</th>
                  <th className="px-6 py-3">Entity Type</th>
                  <th className="px-6 py-3">Entity ID</th>
                  <th className="px-6 py-3">Changes Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      Loading audit events...
                    </td>
                  </tr>
                ) : !auditData?.data || auditData.data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      <History className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                      No audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditData.data.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-3.5 whitespace-nowrap text-xs text-slate-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-xs">
                        {log.actor ? (
                          <div className="flex items-center gap-1.5 font-medium text-slate-800">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            {log.actor.firstName} {log.actor.lastName}
                          </div>
                        ) : (
                          <span className="text-slate-400">System</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-xs font-semibold text-slate-700">
                        {log.entityType}
                      </td>
                      <td className="px-6 py-3.5 text-xs font-mono text-slate-500">
                        {log.entityId ? `${log.entityId.slice(0, 8)}...` : 'N/A'}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-600 font-mono">
                        {log.changes ? JSON.stringify(log.changes) : '--'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
