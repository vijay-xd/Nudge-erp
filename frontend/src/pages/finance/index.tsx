import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DollarSign,
  Plus,
  Download,
  CreditCard,
  Receipt,
  Clock,
  CheckCircle,
  AlertCircle,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Dialog, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { financeService } from '@/services/finance.service';

export default function FinancePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'invoices' | 'bills' | 'payments' | 'ar_ageing'>('invoices');

  // Payment recording state
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'RECEIVED' | 'MADE'>('RECEIVED');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [paymentAmount, setPaymentAmount] = useState(1000);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [allocatedInvoiceId, setAllocatedInvoiceId] = useState('');
  const [allocatedBillId, setAllocatedBillId] = useState('');

  // Queries
  const { data: summaryData } = useQuery({
    queryKey: ['finance-summary'],
    queryFn: () => financeService.getSummary(),
  });

  const { data: invoicesData, isLoading: isInvoicesLoading } = useQuery({
    queryKey: ['finance-invoices'],
    queryFn: () => financeService.getInvoices({ limit: 50 }),
  });

  const { data: billsData, isLoading: isBillsLoading } = useQuery({
    queryKey: ['finance-bills'],
    queryFn: () => financeService.getBills({ limit: 50 }),
    enabled: activeTab === 'bills',
  });

  const { data: paymentsData, isLoading: isPaymentsLoading } = useQuery({
    queryKey: ['finance-payments'],
    queryFn: () => financeService.getPayments(1, 50),
    enabled: activeTab === 'payments',
  });

  const { data: arAgeingData, isLoading: isArLoading } = useQuery({
    queryKey: ['finance-ar-ageing'],
    queryFn: () => financeService.getArAgeing(),
    enabled: activeTab === 'ar_ageing',
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (data: any) => financeService.recordPayment(data),
    onSuccess: (payment) => {
      toast.success(`Payment #${payment.paymentNumber} recorded successfully`);
      setIsPaymentOpen(false);
      queryClient.invalidateQueries({ queryKey: ['finance-summary'] });
      queryClient.invalidateQueries({ queryKey: ['finance-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['finance-bills'] });
      queryClient.invalidateQueries({ queryKey: ['finance-payments'] });
      queryClient.invalidateQueries({ queryKey: ['finance-ar-ageing'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Payment recording failed'),
  });

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentType === 'RECEIVED' && !allocatedInvoiceId) {
      toast.error('Please select an invoice to allocate the payment to');
      return;
    }
    if (paymentType === 'MADE' && !allocatedBillId) {
      toast.error('Please select a vendor bill to allocate the payment to');
      return;
    }

    recordPaymentMutation.mutate({
      paymentType,
      paymentMethod,
      amount: Number(paymentAmount),
      referenceNumber: referenceNumber || undefined,
      allocations: [
        {
          invoiceId: paymentType === 'RECEIVED' ? allocatedInvoiceId : undefined,
          vendorBillId: paymentType === 'MADE' ? allocatedBillId : undefined,
          amount: Number(paymentAmount),
        },
      ],
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance & Invoicing"
        description="Accounts receivable (AR), supplier payables (AP), GST invoicing, cash collections, and ageing."
        actions={
          <div className="flex items-center gap-3">
            <a
              href={financeService.getExportUrl()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              Export Invoices CSV
            </a>
            <Button
              onClick={() => {
                const firstInv = invoicesData?.data?.find(
                  (i: any) => Number(i.totalAmount) > Number(i.paidAmount),
                );
                if (firstInv) {
                  setAllocatedInvoiceId(firstInv.id);
                  setPaymentAmount(Number(firstInv.totalAmount) - Number(firstInv.paidAmount));
                }
                setIsPaymentOpen(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Record Payment
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-600">
          <CardContent className="p-4">
            <div className="text-xs font-semibold uppercase text-slate-500">Invoiced This Month</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              ₹{summaryData?.invoicedThisMonth?.toLocaleString('en-IN') ?? '0.00'}
            </div>
            <p className="text-xs text-slate-500 mt-1">Gross sales invoices generated</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <CardContent className="p-4">
            <div className="text-xs font-semibold uppercase text-slate-500">Cash Collections</div>
            <div className="text-2xl font-bold text-slate-900 mt-1 flex items-center gap-1.5">
              ₹{summaryData?.collectionsThisMonth?.toLocaleString('en-IN') ?? '0.00'}
              <ArrowDownLeft className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-xs text-slate-500 mt-1">Customer payments received</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="text-xs font-semibold uppercase text-slate-500">Total Receivables (AR)</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              ₹{summaryData?.totalReceivables?.toLocaleString('en-IN') ?? '0.00'}
            </div>
            <p className="text-xs text-slate-500 mt-1">Pending from customers</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-600">
          <CardContent className="p-4">
            <div className="text-xs font-semibold uppercase text-slate-500">Total Payables (AP)</div>
            <div className="text-2xl font-bold text-slate-900 mt-1 flex items-center gap-1.5">
              ₹{summaryData?.totalPayables?.toLocaleString('en-IN') ?? '0.00'}
              <ArrowUpRight className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-xs text-slate-500 mt-1">Outstanding to suppliers</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'invoices'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="h-4 w-4" />
          Customer Invoices
        </button>
        <button
          onClick={() => setActiveTab('bills')}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'bills'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          Vendor Bills (AP)
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'payments'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign className="h-4 w-4" />
          Payment Transactions
        </button>
        <button
          onClick={() => setActiveTab('ar_ageing')}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'ar_ageing'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="h-4 w-4" />
          AR Ageing Analysis
        </button>
      </div>

      {/* Tab 1: Invoices */}
      {activeTab === 'invoices' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Invoice #</th>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Invoice Date</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Total (INR)</th>
                    <th className="px-6 py-3 text-right">Paid (INR)</th>
                    <th className="px-6 py-3 text-right">Balance Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {isInvoicesLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                        Loading customer invoices...
                      </td>
                    </tr>
                  ) : !invoicesData?.data || invoicesData.data.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                        No invoices generated yet.
                      </td>
                    </tr>
                  ) : (
                    invoicesData.data.map((inv: any) => {
                      const balance = Math.max(0, Number(inv.totalAmount) - Number(inv.paidAmount));
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-900">{inv.invoiceNumber}</td>
                          <td className="px-6 py-4 font-medium text-slate-800">{inv.customer.legalName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                            {new Date(inv.invoiceDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={inv.status} />
                          </td>
                          <td className="px-6 py-4 text-right font-medium">
                            ₹{Number(inv.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-right text-emerald-600 font-medium">
                            ₹{Number(inv.paidAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-slate-900">
                            ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Vendor Bills */}
      {activeTab === 'bills' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Bill #</th>
                    <th className="px-6 py-3">Supplier / Vendor</th>
                    <th className="px-6 py-3">Bill Date</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Total (INR)</th>
                    <th className="px-6 py-3 text-right">Paid (INR)</th>
                    <th className="px-6 py-3 text-right">Balance Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {isBillsLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                        Loading vendor bills...
                      </td>
                    </tr>
                  ) : !billsData?.data || billsData.data.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                        No supplier bills found.
                      </td>
                    </tr>
                  ) : (
                    billsData.data.map((bill: any) => {
                      const balance = Math.max(0, Number(bill.totalAmount) - Number(bill.paidAmount));
                      return (
                        <tr key={bill.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-900">{bill.billNumber}</td>
                          <td className="px-6 py-4 font-medium text-slate-800">{bill.vendor.legalName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                            {new Date(bill.billDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={bill.status} />
                          </td>
                          <td className="px-6 py-4 text-right font-medium">
                            ₹{Number(bill.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-right text-emerald-600 font-medium">
                            ₹{Number(bill.paidAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-slate-900">
                            ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Payments */}
      {activeTab === 'payments' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Payment #</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Method</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Reference #</th>
                    <th className="px-6 py-3 text-right">Amount (INR)</th>
                    <th className="px-6 py-3">Allocation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {isPaymentsLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                        Loading payment history...
                      </td>
                    </tr>
                  ) : !paymentsData?.data || paymentsData.data.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                        No payments recorded yet.
                      </td>
                    </tr>
                  ) : (
                    paymentsData.data.map((pay: any) => (
                      <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-slate-900">{pay.paymentNumber}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              pay.paymentType === 'RECEIVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {pay.paymentType === 'RECEIVED' ? 'Receipt (Customer)' : 'Payment (Vendor)'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs">{pay.paymentMethod}</td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {new Date(pay.paymentDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-xs font-mono">{pay.referenceNumber || 'N/A'}</td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900">
                          ₹{Number(pay.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-xs">
                          {pay.allocations?.map((a: any) => (
                            <div key={a.id}>
                              {a.invoice?.invoiceNumber || a.vendorBill?.billNumber}: ₹{Number(a.amount).toFixed(2)}
                            </div>
                          ))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 4: AR Ageing */}
      {activeTab === 'ar_ageing' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-slate-50">
              <CardContent className="p-4">
                <div className="text-xs font-semibold text-slate-500">Current (0 - 30 days)</div>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  ₹{arAgeingData?.summary?.current?.toLocaleString('en-IN') ?? '0.00'}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-amber-50/50">
              <CardContent className="p-4">
                <div className="text-xs font-semibold text-amber-700">31 - 60 days</div>
                <div className="text-xl font-bold text-amber-900 mt-1">
                  ₹{arAgeingData?.summary?.bucket30_60?.toLocaleString('en-IN') ?? '0.00'}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-orange-50/50">
              <CardContent className="p-4">
                <div className="text-xs font-semibold text-orange-700">61 - 90 days</div>
                <div className="text-xl font-bold text-orange-900 mt-1">
                  ₹{arAgeingData?.summary?.bucket60_90?.toLocaleString('en-IN') ?? '0.00'}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-red-50/50">
              <CardContent className="p-4">
                <div className="text-xs font-semibold text-red-700">&gt; 90 days (Overdue)</div>
                <div className="text-xl font-bold text-red-900 mt-1">
                  ₹{arAgeingData?.summary?.over90?.toLocaleString('en-IN') ?? '0.00'}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-0">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b">
                  <tr>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3 text-right">0-30 Days</th>
                    <th className="px-6 py-3 text-right">31-60 Days</th>
                    <th className="px-6 py-3 text-right">61-90 Days</th>
                    <th className="px-6 py-3 text-right">&gt; 90 Days</th>
                    <th className="px-6 py-3 text-right">Total Outstanding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {isArLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                        Calculating AR ageing...
                      </td>
                    </tr>
                  ) : !arAgeingData?.byCustomer || arAgeingData.byCustomer.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                        No outstanding receivables.
                      </td>
                    </tr>
                  ) : (
                    arAgeingData.byCustomer.map((c: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-6 py-3.5 font-medium text-slate-900">{c.customer}</td>
                        <td className="px-6 py-3.5 text-right">₹{c.current.toFixed(2)}</td>
                        <td className="px-6 py-3.5 text-right text-amber-700">₹{c.bucket30_60.toFixed(2)}</td>
                        <td className="px-6 py-3.5 text-right text-orange-700">₹{c.bucket60_90.toFixed(2)}</td>
                        <td className="px-6 py-3.5 text-right text-red-700 font-bold">₹{c.over90.toFixed(2)}</td>
                        <td className="px-6 py-3.5 text-right font-bold text-slate-900">₹{c.total.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Record Payment Modal */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-xl">
          <DialogTitle className="text-lg font-bold text-slate-900 mb-2">Record Payment & Allocation</DialogTitle>
          <form onSubmit={handlePaymentSubmit} className="space-y-4 text-sm">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Transaction Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentType('RECEIVED')}
                  className={`p-2 rounded text-xs font-semibold border ${
                    paymentType === 'RECEIVED'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  Customer Receipt (Inflow)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType('MADE')}
                  className={`p-2 rounded text-xs font-semibold border ${
                    paymentType === 'MADE'
                      ? 'bg-purple-50 border-purple-500 text-purple-800'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  Supplier Payment (Outflow)
                </button>
              </div>
            </div>

            {paymentType === 'RECEIVED' ? (
              <div>
                <label className="block font-medium text-slate-700 mb-1">Select Customer Invoice *</label>
                <select
                  value={allocatedInvoiceId}
                  onChange={(e) => {
                    setAllocatedInvoiceId(e.target.value);
                    const inv = invoicesData?.data?.find((i: any) => i.id === e.target.value);
                    if (inv) {
                      setPaymentAmount(Math.max(0, Number(inv.totalAmount) - Number(inv.paidAmount)));
                    }
                  }}
                  className="w-full rounded border border-slate-300 p-2 text-sm"
                  required
                >
                  <option value="">Select Invoice...</option>
                  {(invoicesData?.data || []).map((inv: any) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} - {inv.customer.legalName} (Bal: ₹
                      {(Number(inv.totalAmount) - Number(inv.paidAmount)).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block font-medium text-slate-700 mb-1">Select Supplier Bill *</label>
                <select
                  value={allocatedBillId}
                  onChange={(e) => {
                    setAllocatedBillId(e.target.value);
                    const b = billsData?.data?.find((x: any) => x.id === e.target.value);
                    if (b) {
                      setPaymentAmount(Math.max(0, Number(b.totalAmount) - Number(b.paidAmount)));
                    }
                  }}
                  className="w-full rounded border border-slate-300 p-2 text-sm"
                  required
                >
                  <option value="">Select Bill...</option>
                  {(billsData?.data || []).map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.billNumber} - {b.vendor.legalName} (Bal: ₹
                      {(Number(b.totalAmount) - Number(b.paidAmount)).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Amount (INR) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full rounded border border-slate-300 p-2 text-sm font-semibold"
                  required
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full rounded border border-slate-300 p-2 text-sm"
                >
                  <option value="BANK_TRANSFER">NEFT / RTGS</option>
                  <option value="UPI">UPI</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="CASH">Cash</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Reference / UTR / Cheque #</label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. UTR12345678"
                className="w-full rounded border border-slate-300 p-2 text-sm"
              />
            </div>

            <DialogFooter className="mt-6 flex justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => setIsPaymentOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={recordPaymentMutation.isPending}>
                Save Payment
              </Button>
            </DialogFooter>
          </form>
        </div>
      </Dialog>
    </div>
  );
}
