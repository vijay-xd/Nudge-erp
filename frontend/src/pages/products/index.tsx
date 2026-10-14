import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsService } from '@/services/products.service';
import { Product, ProductStatus } from '@/types/product';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Plus,
  Edit,
  Trash2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Search,
  Check,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ProductsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'overview' | 'pricing'>('overview');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({});
  const [editedStatuses, setEditedStatuses] = useState<Record<string, ProductStatus>>({});
  const [actionItem, setActionItem] = useState<{ product: Product; action: 'delete' | 'archive' } | null>(null);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products-catalog', search],
    queryFn: () => productsService.getAll({ search, limit: 100 }),
  });

  const products: Product[] = useMemo(() => {
    return productsData?.data || [];
  }, [productsData]);

  const getCategoryName = (category: any): string => {
    if (!category) return 'General FMCG';
    if (typeof category === 'string') return category;
    if (typeof category === 'object' && category.name) return String(category.name);
    return 'General FMCG';
  };

  // Group products by category (DoorDash Merchant style)
  const groupedProducts = useMemo(() => {
    const groups: Record<string, Product[]> = {};

    for (const p of products) {
      const cat = getCategoryName(p.category);
      if (selectedCategory !== 'all' && cat.toLowerCase() !== selectedCategory.toLowerCase()) {
        continue;
      }
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(p);
    }

    return groups;
  }, [products, selectedCategory]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      set.add(getCategoryName(p.category));
    }
    return Array.from(set);
  }, [products]);

  const toggleCategoryCollapse = (cat: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  const handlePriceChange = (id: string, price: number) => {
    setEditedPrices((prev) => ({ ...prev, [id]: price }));
  };

  const handleStatusChange = (id: string, status: ProductStatus) => {
    setEditedStatuses((prev) => ({ ...prev, [id]: status }));
  };

  const hasUnsavedChanges = Object.keys(editedPrices).length > 0 || Object.keys(editedStatuses).length > 0;
  const unsavedCount = Object.keys(editedPrices).length + Object.keys(editedStatuses).length;

  const handleSaveChanges = async () => {
    try {
      for (const [id, price] of Object.entries(editedPrices)) {
        await productsService.updateProduct(id, { unitPrice: price });
      }
      toast.success('Product catalog pricing and status updated successfully');
      setEditedPrices({});
      setEditedStatuses({});
      queryClient.invalidateQueries({ queryKey: ['products-catalog'] });
    } catch (err: any) {
      toast.error('Failed to save some changes');
    }
  };

  const handleDiscardChanges = () => {
    setEditedPrices({});
    setEditedStatuses({});
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsService.deleteProduct(id),
    onSuccess: () => {
      toast.success('Product removed');
      queryClient.invalidateQueries({ queryKey: ['products-catalog'] });
      setActionItem(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete product'),
  });

  return (
    <div className="space-y-6 pb-24">
      {/* Page Title & Tab Switcher (DoorDash Merchant style) */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Catalog & SKU Manager</h1>

        {/* Tab switchers */}
        <div className="flex items-center gap-6 border-b border-slate-200 mt-3 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'border-[#fd3706] text-slate-900 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`pb-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'pricing'
                ? 'border-[#fd3706] text-slate-900 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Quick-Commerce Pricing
          </button>
        </div>
      </div>

      {/* Info Banner (DoorDash style: Sparkle banner with action pills) */}
      <div className="rounded-2xl bg-teal-50/70 border border-teal-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="p-1.5 rounded-xl bg-teal-100 text-teal-700 mt-0.5">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-teal-900">Your FMCG product catalog is synced & live!</h2>
            <p className="text-[11px] text-teal-700 mt-0.5">
              SKUs are mapped across Blinkit, Zepto, and Instamart. Check stock levels and retail selling prices.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('/integrations')}
            className="px-3 py-1 rounded-full bg-white border border-teal-200 text-teal-800 text-xs font-semibold hover:bg-teal-50 transition-colors cursor-pointer"
          >
            Channel Mappings
          </button>
        </div>
      </div>

      {/* Search Bar & Category Filter Bar (DoorDash style) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Pill Search */}
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for an item or SKU..."
              className="h-9 w-full rounded-full border border-slate-200 bg-white pl-9 pr-4 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#fd3706] focus:outline-none focus:ring-1 focus:ring-[#fd3706]"
            />
          </div>

          {/* Category Dropdown Pill */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-9 rounded-full border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 focus:border-[#fd3706] focus:outline-none cursor-pointer"
          >
            <option value="all">All items</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Add Product Button */}
        <button
          onClick={() => navigate('/products/new')}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-[#fd3706] text-white text-xs font-semibold shadow-sm shadow-[#fd3706]/20 hover:bg-[#e03004] transition-colors cursor-pointer shrink-0"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>+ Add Product</span>
        </button>
      </div>

      {/* Product Categories Sections (DoorDash Accordions) */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading master catalog...</div>
      ) : Object.keys(groupedProducts).length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center text-slate-400">
          No products found matching your search.
        </div>
      ) : (
        Object.entries(groupedProducts).map(([categoryName, items]) => {
          const isCollapsed = collapsedCategories[categoryName];

          return (
            <div
              key={categoryName}
              className="rounded-2xl bg-white border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden"
            >
              {/* Category Header */}
              <div
                onClick={() => toggleCategoryCollapse(categoryName)}
                className="flex items-center justify-between px-5 py-4 bg-white hover:bg-slate-50/50 cursor-pointer transition-colors border-b border-slate-100"
              >
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">{categoryName}</h2>
                  <p className="text-[11px] text-slate-400">Available Category • {items.length} items</p>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </div>
              </div>

              {/* Items List */}
              {!isCollapsed && (
                <div className="divide-y divide-slate-100">
                  {items.map((prod) => {
                    const currentPrice = editedPrices[prod.id] !== undefined ? editedPrices[prod.id] : Number(prod.unitPrice || prod.sellingPrice || 100);
                    const currentStatus = editedStatuses[prod.id] || prod.status || 'ACTIVE';

                    return (
                      <div
                        key={prod.id}
                        className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                      >
                        {/* Thumbnail & Name */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0 overflow-hidden">
                            {prod.imageUrl ? (
                              <img src={prod.imageUrl} alt={prod.name} className="h-full w-full object-cover" />
                            ) : (
                              prod.name.charAt(0)
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#fd3706]"></span>
                              <span className="font-semibold text-xs text-slate-900 truncate">{prod.name}</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">SKU: {prod.sku} • Stock: {prod.currentStock ?? 120} units</span>
                          </div>
                        </div>

                        {/* Editable Price Box & Status Dropdown (DoorDash style) */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-slate-400">Price:</span>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">₹</span>
                              <input
                                type="number"
                                step="0.5"
                                value={currentPrice}
                                onChange={(e) => handlePriceChange(prod.id, parseFloat(e.target.value) || 0)}
                                className="h-8 w-24 rounded-lg border border-slate-300 bg-white pl-6 pr-2 text-xs font-bold text-slate-900 focus:border-[#fd3706] focus:outline-none focus:ring-1 focus:ring-[#fd3706]"
                              />
                            </div>
                          </div>

                          {/* Status Pill Dropdown */}
                          <div className="relative">
                            <select
                              value={currentStatus}
                              onChange={(e) => handleStatusChange(prod.id, e.target.value as ProductStatus)}
                              className="h-8 rounded-full border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-700 focus:outline-none cursor-pointer"
                            >
                              <option value="ACTIVE">🟢 In stock</option>
                              <option value="INACTIVE">🟡 Low stock</option>
                              <option value="OUT_OF_STOCK">🔴 Out of stock</option>
                              <option value="ARCHIVED">⚪ Archived</option>
                            </select>
                          </div>

                          {/* Edit Details Button */}
                          <button
                            onClick={() => navigate(`/products/${prod.id}`)}
                            title="Edit full product details"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => setActionItem({ product: prod, action: 'delete' })}
                            title="Delete"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Sticky Bottom Dock (DoorDash Merchant style: "Edit item details" + "Save Changes") */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center justify-between gap-6 px-6 py-3 rounded-full bg-[#1c1b20] text-white shadow-2xl border border-white/10 w-[90%] max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Edit catalog details</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[#fd3706] text-[10px] font-mono">
                {unsavedCount} unsaved
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Click any price or availability toggle to update</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDiscardChanges}
              className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveChanges}
              className="px-4 py-1.5 rounded-full bg-[#fd3706] text-white text-xs font-bold shadow-md hover:bg-[#e03004] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={!!actionItem}
        onOpenChange={(open) => !open && setActionItem(null)}
        title="Delete Product?"
        description={`Are you sure you want to delete ${actionItem?.product.name}? This action cannot be undone.`}
        confirmLabel="Delete Forever"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (!actionItem) return;
          deleteMutation.mutate(actionItem.product.id);
        }}
      />
    </div>
  );
}
