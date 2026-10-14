import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Mail,
  Upload,
  CheckCircle,
  AlertCircle,
  FileText,
  RefreshCw,
  Eye,
  XCircle,
  Zap,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Dialog, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { intakeService, EmailImportItem } from '@/services/intake.service';
import { customersService } from '@/services/customers.service';
import { productsService } from '@/services/products.service';

export default function IntegrationsPage() {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedImport, setSelectedImport] = useState<EmailImportItem | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  // Review & Approval state
  const [approvalCustomerId, setApprovalCustomerId] = useState('');
  const [approvalLines, setApprovalLines] = useState<any[]>([]);

  // Queries
  const { data: gmailStatus, isLoading: isGmailLoading } = useQuery({
    queryKey: ['gmail-status'],
    queryFn: () => intakeService.getGmailStatus(),
  });

  const { data: importsData, isLoading: isImportsLoading } = useQuery({
    queryKey: ['intake-imports'],
    queryFn: () => intakeService.getImports({ limit: 50 }),
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => customersService.getAll({ limit: 100 }),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products-list'],
    queryFn: () => productsService.getAll({ limit: 100 }),
  });

  // Mutations
  const uploadMutation = useMutation({
    mutationFn: (file: File) => intakeService.uploadFile(file),
    onSuccess: (data) => {
      toast.success(`Document extracted! Confidence: ${Math.round(Number(data.confidenceScore) * 100)}%`);
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ['intake-imports'] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Document upload/extraction failed'),
  });

  const connectGmailMutation = useMutation({
    mutationFn: () => intakeService.connectGmail(),
    onSuccess: (res) => {
      if (res.authUrl) {
        window.location.href = res.authUrl;
      } else {
        toast.success(res.message || 'Connected to Gmail');
        queryClient.invalidateQueries({ queryKey: ['gmail-status'] });
      }
    },
  });

  const syncGmailMutation = useMutation({
    mutationFn: () => intakeService.syncGmail(),
    onSuccess: (res) => {
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ['intake-imports'] });
      queryClient.invalidateQueries({ queryKey: ['gmail-status'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Sync failed'),
  });

  const disconnectGmailMutation = useMutation({
    mutationFn: () => intakeService.disconnectGmail(),
    onSuccess: () => {
      toast.success('Gmail disconnected');
      queryClient.invalidateQueries({ queryKey: ['gmail-status'] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      intakeService.approveImport(id, data),
    onSuccess: (res) => {
      toast.success(`Sales Order #${res.salesOrder.orderNumber} created from document!`);
      setIsReviewOpen(false);
      queryClient.invalidateQueries({ queryKey: ['intake-imports'] });
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Failed to approve import'),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => intakeService.rejectImport(id),
    onSuccess: () => {
      toast.success('Import document marked as rejected');
      setIsReviewOpen(false);
      queryClient.invalidateQueries({ queryKey: ['intake-imports'] });
    },
  });

  const openReviewModal = async (imp: EmailImportItem) => {
    setSelectedImport(imp);
    try {
      const full = await intakeService.getImportById(imp.id);
      setSelectedImport(full);

      // Match customer or find default
      const matchedCustomer = (customersData?.data || []).find((c: any) =>
        c.legalName.toLowerCase().includes(full.extractedData?.customerName?.toLowerCase() || 'blinkit'),
      );
      setApprovalCustomerId(matchedCustomer?.id || customersData?.data?.[0]?.id || '');

      const lines = (full.extractedData?.items || []).map((item: any) => ({
        productId: item.matchedProductId || productsData?.data?.[0]?.id || '',
        quantity: item.quantity,
        unitPrice: item.unitSellingPrice || item.unitPrice,
        rawSku: item.rawSku,
        rawName: item.rawName,
        availableStock: item.availableStock,
        isMatched: item.isMatched,
      }));
      setApprovalLines(lines);
      setIsReviewOpen(true);
    } catch {
      setIsReviewOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gmail & Document Intake"
        description="Automated purchase-order intake from Quick-Commerce channels, PDF/CSV parsing, and AI extraction review."
      />

      {/* Grid: Gmail Integration + Manual Upload */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gmail Card */}
        <Card className="border-t-4 border-t-red-500">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900">
                  <Mail className="h-5 w-5 text-red-500" />
                  Gmail Automated PO Intake
                </CardTitle>
                <p className="text-xs text-slate-500 mt-1">
                  Connect mailbox to automatically discover Blinkit, Zepto, and Swiggy PO emails.
                </p>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  gmailStatus?.isConnected
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {gmailStatus?.isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg space-y-1.5 border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Operating Mode:</span>
                <span className="font-semibold text-slate-800">
                  {gmailStatus?.mode === 'LIVE_OAUTH' ? 'Live Google OAuth 2.0' : 'Development Adapter (Mock)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Monitored Mailbox:</span>
                <span className="font-mono text-slate-800">{gmailStatus?.accountEmail || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Last Synced:</span>
                <span className="text-slate-600">
                  {gmailStatus?.lastSyncAt ? new Date(gmailStatus.lastSyncAt).toLocaleString() : 'Never'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              {!gmailStatus?.isConnected ? (
                <Button
                  size="sm"
                  onClick={() => connectGmailMutation.mutate()}
                  disabled={connectGmailMutation.isPending}
                  className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
                >
                  <Zap className="h-4 w-4" />
                  Connect Mailbox
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    onClick={() => syncGmailMutation.mutate()}
                    disabled={syncGmailMutation.isPending}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <RefreshCw className={`h-4 w-4 ${syncGmailMutation.isPending ? 'animate-spin' : ''}`} />
                    Poll Incoming POs
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => disconnectGmailMutation.mutate()}
                    disabled={disconnectGmailMutation.isPending}
                  >
                    Disconnect
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Manual Document Upload Card */}
        <Card className="border-t-4 border-t-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900">
              <Upload className="h-5 w-5 text-blue-500" />
              Manual PO Document Upload Fallback
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1">
              Upload customer purchase order PDF, CSV, or XLSX spreadsheets for structured extraction.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors bg-slate-50/50">
              <input
                type="file"
                id="docUpload"
                accept=".pdf,.csv,.xlsx,.txt"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <label htmlFor="docUpload" className="cursor-pointer block">
                <FileText className="mx-auto h-8 w-8 text-blue-500 mb-2" />
                <span className="text-sm font-semibold text-slate-700">
                  {selectedFile ? selectedFile.name : 'Click to select or drag PDF / CSV / XLSX here'}
                </span>
                <p className="text-xs text-slate-400 mt-1">
                  Supports Quick-Commerce PO exports (Blinkit, Zepto, Instamart)
                </p>
              </label>
            </div>

            {selectedFile && (
              <Button
                onClick={() => uploadMutation.mutate(selectedFile)}
                disabled={uploadMutation.isPending}
                className="w-full flex items-center justify-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {uploadMutation.isPending ? 'Extracting Order Schema...' : 'Extract & Review Order'}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Review Queue Table */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
            <span>Document Intake Review Queue</span>
            <span className="text-xs font-normal text-slate-500">
              Human approval required before converting to approved Sales Orders
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Source / File</th>
                  <th className="px-6 py-3">Extracted Order ID</th>
                  <th className="px-6 py-3">Customer / Channel</th>
                  <th className="px-6 py-3 text-center">Confidence</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3 text-center">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isImportsLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                      Loading review queue...
                    </td>
                  </tr>
                ) : !importsData?.data || importsData.data.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      <ShieldCheck className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                      No imported purchase order documents in the queue.
                    </td>
                  </tr>
                ) : (
                  importsData.data.map((imp: EmailImportItem) => {
                    const confidence = Number(imp.confidenceScore || 0);
                    return (
                      <tr key={imp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{imp.attachmentName || imp.subject}</div>
                          <div className="text-xs font-mono text-slate-400">{imp.messageId}</div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs font-medium text-slate-800">
                          {imp.extractedData?.externalOrderId || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <span className="font-medium text-slate-800">
                            {imp.extractedData?.customerName || 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                              confidence >= 0.9
                                ? 'bg-emerald-100 text-emerald-800'
                                : confidence >= 0.7
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {Math.round(confidence * 100)}%
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={imp.status} />
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                          {new Date(imp.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Button
                            size="sm"
                            variant={imp.status === 'APPROVED' ? 'ghost' : 'default'}
                            onClick={() => openReviewModal(imp)}
                            className="flex items-center gap-1.5"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            {imp.status === 'APPROVED' ? 'View' : 'Review & Approve'}
                          </Button>
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

      {/* Review & Approval Modal */}
      {selectedImport && (
        <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
          <div className="max-w-4xl w-full p-6 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center justify-between border-b pb-3">
              <span className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Review Extracted Order: {selectedImport.extractedData?.externalOrderId || selectedImport.attachmentName}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Confidence: {Math.round(Number(selectedImport.confidenceScore) * 100)}%
              </span>
            </DialogTitle>

            <div className="my-4 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Target Customer</label>
                  <select
                    value={approvalCustomerId}
                    onChange={(e) => setApprovalCustomerId(e.target.value)}
                    disabled={selectedImport.status === 'APPROVED'}
                    className="w-full rounded border border-slate-300 p-2 text-sm bg-white"
                  >
                    {(customersData?.data || []).map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.legalName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">External PO Number</label>
                  <input
                    type="text"
                    disabled
                    value={selectedImport.extractedData?.externalOrderId || ''}
                    className="w-full rounded border border-slate-300 p-2 text-sm bg-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-800 mb-2">Line Items & SKU Matching</h4>
                <div className="overflow-x-auto border rounded">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 border-b">
                      <tr>
                        <th className="p-2.5">Extracted Raw Text</th>
                        <th className="p-2.5">Matched Internal Product</th>
                        <th className="p-2.5 text-right">Available Stock</th>
                        <th className="p-2.5 text-right">Quantity</th>
                        <th className="p-2.5 text-right">Unit Price</th>
                        <th className="p-2.5 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {approvalLines.map((line, idx) => (
                        <tr key={idx} className={!line.isMatched ? 'bg-amber-50/50' : ''}>
                          <td className="p-2.5">
                            <div className="font-medium text-slate-900">{line.rawName}</div>
                            <div className="text-[10px] font-mono text-slate-400">Raw: {line.rawSku}</div>
                          </td>
                          <td className="p-2.5">
                            <select
                              value={line.productId}
                              disabled={selectedImport.status === 'APPROVED'}
                              onChange={(e) => {
                                const prod = (productsData?.data || []).find((p: any) => p.id === e.target.value);
                                const updated = [...approvalLines];
                                updated[idx].productId = e.target.value;
                                if (prod?.sellingPrice) {
                                  updated[idx].unitPrice = Number(prod.sellingPrice);
                                }
                                setApprovalLines(updated);
                              }}
                              className="w-full rounded border border-slate-300 p-1.5 text-xs bg-white"
                            >
                              {(productsData?.data || []).map((p: any) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.sku})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2.5 text-right font-medium text-slate-700">
                            {line.availableStock ?? '--'}
                          </td>
                          <td className="p-2.5 text-right">
                            <input
                              type="number"
                              min="1"
                              disabled={selectedImport.status === 'APPROVED'}
                              value={line.quantity}
                              onChange={(e) => {
                                const updated = [...approvalLines];
                                updated[idx].quantity = Number(e.target.value);
                                setApprovalLines(updated);
                              }}
                              className="w-16 rounded border border-slate-300 p-1 text-right"
                            />
                          </td>
                          <td className="p-2.5 text-right">₹{Number(line.unitPrice).toFixed(2)}</td>
                          <td className="p-2.5 text-right font-bold text-slate-900">
                            ₹{(Number(line.quantity) * Number(line.unitPrice)).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t pt-4 flex justify-between items-center">
              <div>
                {selectedImport.status !== 'APPROVED' && selectedImport.status !== 'REJECTED' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => rejectMutation.mutate(selectedImport.id)}
                    disabled={rejectMutation.isPending}
                    className="flex items-center gap-1"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject Document
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsReviewOpen(false)}>
                  Close
                </Button>
                {selectedImport.status !== 'APPROVED' && (
                  <Button
                    onClick={() =>
                      approveMutation.mutate({
                        id: selectedImport.id,
                        data: {
                          customerId: approvalCustomerId,
                          externalOrderId: selectedImport.extractedData?.externalOrderId,
                          lines: approvalLines.map((l) => ({
                            productId: l.productId,
                            quantity: Number(l.quantity),
                            unitPrice: Number(l.unitPrice),
                          })),
                        },
                      })
                    }
                    disabled={approveMutation.isPending || !approvalCustomerId}
                    className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve & Create Sales Order
                  </Button>
                )}
              </div>
            </DialogFooter>
          </div>
        </Dialog>
      )}
    </div>
  );
}
