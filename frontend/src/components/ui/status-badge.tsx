import { Badge } from '@/components/ui/badge';

export interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = status.toUpperCase().replace(/\s+/g, '_');

  switch (normalized) {
    case 'ACTIVE':
    case 'COMPLETED':
    case 'DELIVERED':
    case 'FULFILLED':
    case 'PAID':
    case 'APPROVED':
      return (
        <Badge variant="success" dot className={className}>
          {status}
        </Badge>
      );

    case 'PENDING':
    case 'PROCESSING':
    case 'IN_TRANSIT':
    case 'PARTIALLY_FULFILLED':
    case 'AWAITING_APPROVAL':
      return (
        <Badge variant="warning" dot className={className}>
          {status.replace(/_/g, ' ')}
        </Badge>
      );

    case 'CONFIRMED':
    case 'SHIPPED':
    case 'ORDERED':
      return (
        <Badge variant="info" dot className={className}>
          {status}
        </Badge>
      );

    case 'INACTIVE':
    case 'CANCELLED':
    case 'REJECTED':
    case 'BLOCKED':
    case 'SUSPENDED':
    case 'OUT_OF_STOCK':
      return (
        <Badge variant="destructive" dot className={className}>
          {status.replace(/_/g, ' ')}
        </Badge>
      );

    case 'ARCHIVED':
    case 'DRAFT':
    default:
      return (
        <Badge variant="secondary" dot className={className}>
          {status}
        </Badge>
      );
  }
}
