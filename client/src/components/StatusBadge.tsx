import { Badge } from '@/components/ui/badge';

export type TripStatus = 'past' | 'current' | 'upcoming';

interface StatusBadgeProps {
  status: TripStatus;
}

const statusConfig: Record<TripStatus, { label: string; className: string }> = {
  past: {
    label: 'Past',
    className: 'bg-compass-maroon text-white border-0',
  },
  current: {
    label: 'Active',
    className: 'bg-compass-gold text-compass-navy border-0 font-semibold',
  },
  upcoming: {
    label: 'Upcoming',
    className: 'bg-compass-navy text-white border-0',
  },
};

export function getStatusFromDates(startDate: string, endDate?: string | null): TripStatus {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = endDate ? new Date(endDate) : start;
  end.setHours(23, 59, 59, 999);

  if (now > end) return 'past';
  if (now >= start && now <= end) return 'current';
  return 'upcoming';
}

export function getStatusColor(status: TripStatus): string {
  switch (status) {
    case 'upcoming': return '#00357A';
    case 'current': return '#D4A259';
    case 'past': return '#7A1F2D';
  }
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge 
      variant="secondary" 
      className={`${config.className} rounded-full px-3 py-1 text-xs font-medium tracking-wide shadow-soft backdrop-blur-sm`}
    >
      {config.label}
    </Badge>
  );
}
