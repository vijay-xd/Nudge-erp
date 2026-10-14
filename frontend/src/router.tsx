import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppLayout } from '@/components/layout/app-layout';

// Auth Pages
import LoginPage from '@/pages/auth/login';
import RegisterPage from '@/pages/auth/register';

// Main Pages
import DashboardPage from '@/pages/dashboard/index';
import ProductsListPage from '@/pages/products/index';
import ProductCreatePage from '@/pages/products/create';
import ProductDetailPage from '@/pages/products/detail';

import VendorsListPage from '@/pages/vendors/index';
import VendorCreatePage from '@/pages/vendors/create';
import VendorDetailPage from '@/pages/vendors/detail';

import CustomersListPage from '@/pages/customers/index';
import CustomerCreatePage from '@/pages/customers/create';
import CustomerDetailPage from '@/pages/customers/detail';

import WarehousesListPage from '@/pages/warehouses/index';
import WarehouseCreatePage from '@/pages/warehouses/create';

// Module Placeholders (Phase 2+)
import SalesOrdersPage from '@/pages/sales-orders/index';
import PurchaseOrdersPage from '@/pages/purchase-orders/index';
import InventoryPage from '@/pages/inventory/index';
import FulfilmentPage from '@/pages/fulfilment/index';
import FinancePage from '@/pages/finance/index';
import AnalyticsPage from '@/pages/analytics/index';
import IntegrationsPage from '@/pages/integrations/index';
import NotificationsPage from '@/pages/notifications/index';
import AuditLogPage from '@/pages/audit-log/index';
import SettingsPage from '@/pages/settings/index';
import AiSearchPage from '@/pages/ai-search/index';
import NotFoundPage from '@/pages/not-found';

export const router = createBrowserRouter([
  // Public Auth Routes
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },

  // Protected Application Routes
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'ai-search',
        element: <AiSearchPage />,
      },
      // Products
      {
        path: 'products',
        element: <ProductsListPage />,
      },
      {
        path: 'products/new',
        element: <ProductCreatePage />,
      },
      {
        path: 'products/:id',
        element: <ProductDetailPage />,
      },
      // Vendors
      {
        path: 'vendors',
        element: <VendorsListPage />,
      },
      {
        path: 'vendors/new',
        element: <VendorCreatePage />,
      },
      {
        path: 'vendors/:id',
        element: <VendorDetailPage />,
      },
      // Customers
      {
        path: 'customers',
        element: <CustomersListPage />,
      },
      {
        path: 'customers/new',
        element: <CustomerCreatePage />,
      },
      {
        path: 'customers/:id',
        element: <CustomerDetailPage />,
      },
      // Warehouses
      {
        path: 'warehouses',
        element: <WarehousesListPage />,
      },
      {
        path: 'warehouses/new',
        element: <WarehouseCreatePage />,
      },
      {
        path: 'warehouses/:id',
        element: <WarehousesListPage />,
      },
      // Phase 2+ Module Routes
      {
        path: 'sales-orders',
        element: <SalesOrdersPage />,
      },
      {
        path: 'purchase-orders',
        element: <PurchaseOrdersPage />,
      },
      {
        path: 'inventory',
        element: <InventoryPage />,
      },
      {
        path: 'fulfilment',
        element: <FulfilmentPage />,
      },
      {
        path: 'finance',
        element: <FinancePage />,
      },
      {
        path: 'analytics',
        element: <AnalyticsPage />,
      },
      {
        path: 'integrations',
        element: <IntegrationsPage />,
      },
      {
        path: 'notifications',
        element: <NotificationsPage />,
      },
      {
        path: 'audit-log',
        element: <AuditLogPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },

  // 404 Route
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
