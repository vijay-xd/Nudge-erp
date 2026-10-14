import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle2, AlertTriangle, Info, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  timestamp: string;
  read: boolean;
}

const INITIAL_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'notif-1',
    title: 'Low Stock Threshold Reached',
    message: 'Industrial Sensor Pro (SNS-PRO-01) has fallen below reorder safety point (8 units remaining).',
    type: 'warning',
    timestamp: '10 minutes ago',
    read: false,
  },
  {
    id: 'notif-2',
    title: 'New Customer Order Received',
    message: 'Apex Technologies placed order #SO-2026-0891 for 12 line items totaling $8,450.00.',
    type: 'success',
    timestamp: '1 hour ago',
    read: false,
  },
  {
    id: 'notif-3',
    title: 'Supplier Lead Time Updated',
    message: 'Precision Metalworks updated standard delivery lead time to 7 business days.',
    type: 'info',
    timestamp: 'Yesterday at 4:30 PM',
    read: true,
  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<SystemNotification[]>(INITIAL_NOTIFICATIONS);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };

  const clearAll = () => {
    setNotifications([]);
    toast.success('All notifications cleared');
  };

  const getIcon = (type: SystemNotification['type']) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="System Notifications"
        description="Operational alerts, stock warnings, and workflow approval events."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={markAllRead}>
              Mark all as read
            </Button>
            <Button variant="ghost" size="sm" onClick={clearAll} className="text-slate-500">
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="p-0 divide-y divide-slate-100">
          {notifications.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              <Bell className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              No pending notifications. You are completely caught up!
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 flex items-start gap-3 transition-colors ${
                  n.read ? 'bg-white' : 'bg-blue-50/30'
                }`}
              >
                <div className="mt-0.5">{getIcon(n.type)}</div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900">{n.title}</span>
                    <span className="text-[10px] text-slate-400">{n.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-600">{n.message}</p>
                </div>
                {!n.read && (
                  <Badge variant="default" size="sm" className="shrink-0">
                    New
                  </Badge>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
