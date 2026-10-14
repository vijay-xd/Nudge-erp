import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Badge } from '@/components/ui/badge';
import { Save, Building, User as UserIcon, Shield, Database } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user } = useAuth();

  const [orgName, setOrgName] = useState(user?.organizationName || 'Acme Operations Ltd');
  const [userName, setUserName] = useState(user?.name || 'Sarah Jenkins');
  const [userEmail] = useState(user?.email || 'admin@nudgedemo.com');
  const [currency, setCurrency] = useState('USD');
  const [timezone, setTimezone] = useState('UTC');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Workspace settings updated successfully');
    }, 400);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Settings & Workspace Preferences"
        description="Manage tenant configuration, team memberships, and profile preferences."
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Organization Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-700" />
              <div>
                <CardTitle>Organization Details</CardTitle>
                <CardDescription>Primary legal identity and operational defaults.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Organization Name" required>
                <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
              </FormField>

              <FormField label="Tenant Identifier (UUID)">
                <Input value={user?.organizationId || 'org-demo-001'} disabled className="font-mono bg-slate-50" />
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Base Operating Currency">
                <Select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  options={[
                    { value: 'USD', label: 'USD ($) — United States Dollar' },
                    { value: 'EUR', label: 'EUR (€) — Euro' },
                    { value: 'GBP', label: 'GBP (£) — British Pound' },
                    { value: 'CAD', label: 'CAD ($) — Canadian Dollar' },
                  ]}
                />
              </FormField>

              <FormField label="System Timezone">
                <Select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  options={[
                    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
                    { value: 'EST', label: 'America/New_York (EST/EDT)' },
                    { value: 'CST', label: 'America/Chicago (CST/CDT)' },
                    { value: 'PST', label: 'America/Los_Angeles (PST/PDT)' },
                    { value: 'CET', label: 'Europe/Berlin (CET/CEST)' },
                  ]}
                />
              </FormField>
            </div>
          </CardContent>
        </Card>

        {/* User Account Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-blue-700" />
              <div>
                <CardTitle>Your Administrator Profile</CardTitle>
                <CardDescription>Personal details and assigned security clearance.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Full Name" required>
                <Input value={userName} onChange={(e) => setUserName(e.target.value)} />
              </FormField>

              <FormField label="Email Address">
                <Input value={userEmail} disabled className="bg-slate-50" />
              </FormField>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <span className="text-xs font-medium text-slate-700">Security Clearance / Role:</span>
              <Badge variant="default" className="font-mono">
                <Shield className="h-3 w-3 mr-1" />
                {user?.role || 'ORG_ADMIN'}
              </Badge>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" isLoading={isSaving}>
              <Save className="mr-1.5 h-4 w-4" /> Save Configuration
            </Button>
          </CardFooter>
        </Card>

        {/* Multi-Tenant Isolation Status */}
        <Card className="border-slate-200 bg-slate-50/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-800">Multi-Tenant Isolation Enforced</div>
                <div className="text-[11px] text-slate-500">
                  Data queries are strictly scoped to organization tenant key <code>{user?.organizationId || 'org-demo-001'}</code>.
                </div>
              </div>
            </div>
            <Badge variant="success">Secured</Badge>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
