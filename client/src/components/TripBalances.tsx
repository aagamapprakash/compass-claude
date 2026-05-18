import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight } from 'lucide-react';

interface BalanceEntry {
  from: string;
  to: string;
  amount: number;
  fromName: string;
  toName: string;
}

interface TripBalancesProps {
  tripId: number;
}

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export default function TripBalances({ tripId }: TripBalancesProps) {
  const { data: balances = [], isLoading } = useQuery<BalanceEntry[]>({
    queryKey: ['/api/trips', tripId.toString(), 'balances'],
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (balances.length === 0) {
    return (
      <div className="text-center py-3">
        <p className="font-serif text-sm text-muted-foreground">All settled up</p>
        <p className="font-mono text-xs text-muted-foreground mt-1">No outstanding balances</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {balances.map((entry, index) => (
        <div
          key={index}
          className="flex items-center gap-2 border-b border-dashed border-foreground/30 py-2 last:border-0"
          data-testid={`balance-item-${index}`}
        >
          <span className="font-mono text-xs font-bold flex-shrink-0" data-testid={`text-balance-from-${index}`}>
            {entry.fromName}
          </span>
          <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <span className="font-mono text-xs flex-1 truncate" data-testid={`text-balance-to-${index}`}>
            {entry.toName}
          </span>
          <span className="font-serif text-sm font-bold text-compass-maroon flex-shrink-0" data-testid={`text-balance-amount-${index}`}>
            {formatCents(entry.amount)}
          </span>
        </div>
      ))}
    </div>
  );
}
