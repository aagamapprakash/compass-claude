import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Scale } from 'lucide-react';

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

  return (
    <Card className="rounded-2xl border-[#00357a]/10 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-[#00357a] flex items-center gap-2">
          <Scale className="h-5 w-5 text-[#F5C542]" />
          Balances
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        )}

        {!isLoading && balances.length === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-[#00357a]/50">All settled up</p>
            <p className="text-xs text-[#00357a]/40 mt-1">No outstanding balances</p>
          </div>
        )}

        {!isLoading && balances.length > 0 && (
          <div className="space-y-2">
            {balances.map((entry, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-3 bg-[#00357a]/5 rounded-xl border border-[#00357a]/10"
                data-testid={`balance-item-${index}`}
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-[#7B1E3C]/10 text-[#7B1E3C] text-xs font-medium">
                    {entry.fromName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-[#00357a] truncate" data-testid={`text-balance-from-${index}`}>
                  {entry.fromName}
                </span>
                <ArrowRight className="h-4 w-4 text-[#00357a]/40 flex-shrink-0" />
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-[#00357a]/10 text-[#00357a] text-xs font-medium">
                    {entry.toName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-[#00357a] truncate" data-testid={`text-balance-to-${index}`}>
                  {entry.toName}
                </span>
                <span className="ml-auto font-bold text-[#7B1E3C] flex-shrink-0" data-testid={`text-balance-amount-${index}`}>
                  {formatCents(entry.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
