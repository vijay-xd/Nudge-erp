import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertCircle, Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600 mb-4 shadow-xs">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">404</h1>
      <h2 className="mt-2 text-lg font-semibold text-slate-700">Page Not Found</h2>
      <p className="mt-2 text-xs text-slate-500 max-w-sm">
        The requested ERP route does not exist or you may not have sufficient permissions to view it.
      </p>
      <div className="mt-6">
        <Link to="/dashboard">
          <Button>
            <Home className="mr-2 h-4 w-4" /> Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
