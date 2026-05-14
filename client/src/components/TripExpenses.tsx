import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DollarSign, Plus, Trash2, Loader2, Receipt,
  Home, UtensilsCrossed, Bike, Compass, Car, Package,
  ChevronDown, ChevronUp, Check
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface ExpenseSplit {
  id: number;
  expenseId: number;
  userId: string;
  amount: number;
  settled: boolean;
  userName: string;
}

interface ExpenseWithDetails {
  id: number;
  tripId: number;
  paidByUserId: string;
  description: string;
  amount: number;
  category: string;
  splitType: string;
  date: string | null;
  createdAt: string;
  paidByName: string;
  paidByProfileImage: string | null;
  splits: ExpenseSplit[];
}

interface TripExpensesProps {
  tripId: number;
  currentUserId: string;
  isOwner: boolean;
}

const CATEGORIES = [
  { value: 'lodging', label: 'Lodging', icon: Home },
  { value: 'food', label: 'Food', icon: UtensilsCrossed },
  { value: 'equipment', label: 'Equipment', icon: Bike },
  { value: 'experiences', label: 'Experiences', icon: Compass },
  { value: 'transportation', label: 'Transportation', icon: Car },
  { value: 'other', label: 'Other', icon: Package },
];

function getCategoryInfo(category: string) {
  return CATEGORIES.find(c => c.value === category) || CATEGORIES[5];
}

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function formatExpenseDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default function TripExpenses({ tripId, currentUserId, isOwner }: TripExpensesProps) {
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('other');
  const [date, setDate] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const expensesQueryKey = ['/api/trips', tripId.toString(), 'expenses'];

  const { data: expenses = [], isLoading } = useQuery<ExpenseWithDetails[]>({
    queryKey: expensesQueryKey,
  });

  const addExpenseMutation = useMutation({
    mutationFn: async (data: { description: string; amount: number; category: string; date?: string; paidByUserId: string }) => {
      const res = await apiRequest('POST', `/api/trips/${tripId}/expenses`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expensesQueryKey });
      queryClient.invalidateQueries({ queryKey: ['/api/trips', tripId.toString(), 'balances'] });
      resetForm();
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (expenseId: number) => {
      await apiRequest('DELETE', `/api/expenses/${expenseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expensesQueryKey });
      queryClient.invalidateQueries({ queryKey: ['/api/trips', tripId.toString(), 'balances'] });
    },
  });

  const settleMutation = useMutation({
    mutationFn: async ({ splitId, settled }: { splitId: number; settled: boolean }) => {
      const res = await apiRequest('PATCH', `/api/expense-splits/${splitId}/settle`, { settled });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expensesQueryKey });
      queryClient.invalidateQueries({ queryKey: ['/api/trips', tripId.toString(), 'balances'] });
    },
  });

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setCategory('other');
    setDate('');
    setShowForm(false);
  };

  const handleAddExpense = () => {
    const amountCents = Math.round(parseFloat(amount) * 100);
    if (!description.trim() || isNaN(amountCents) || amountCents <= 0) return;
    addExpenseMutation.mutate({
      description: description.trim(),
      amount: amountCents,
      category,
      date: date || undefined,
      paidByUserId: currentUserId,
    });
  };

  const filteredExpenses = filterCategory === 'all' 
    ? expenses 
    : expenses.filter(e => e.category === filterCategory);

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <Card className="rounded-2xl border-[#00357a]/10 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
        <CardTitle className="text-lg text-[#00357a] flex items-center gap-2">
          <Receipt className="h-5 w-5 text-[#F5C542]" />
          Expenses
          {expenses.length > 0 && (
            <Badge variant="secondary" className="ml-1 text-xs">
              {formatCents(totalSpent)} total
            </Badge>
          )}
        </CardTitle>
        {!showForm && (
          <Button
            size="sm"
            onClick={() => setShowForm(true)}
            className="bg-[#F5C542] text-[#00357a] rounded-xl gap-1"
            data-testid="button-add-expense"
          >
            <Plus className="h-4 w-4" />
            Add Expense
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="p-4 bg-[#F5C542]/5 rounded-xl border border-[#F5C542]/20 space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-[#00357a]">Description</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What was this expense for?"
                className="rounded-xl border-[#00357a]/20"
                data-testid="input-expense-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-[#00357a] flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  Amount
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="rounded-xl border-[#00357a]/20"
                  data-testid="input-expense-amount"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-[#00357a]">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="rounded-xl border-[#00357a]/20" data-testid="select-expense-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-[#00357a]">Date (optional)</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-xl border-[#00357a]/20"
                data-testid="input-expense-date"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetForm}
                className="rounded-xl text-[#00357a]/60"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAddExpense}
                disabled={!description.trim() || !amount || parseFloat(amount) <= 0 || addExpenseMutation.isPending}
                className="bg-[#00357a] text-white rounded-xl gap-1"
                data-testid="button-save-expense"
              >
                {addExpenseMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {addExpenseMutation.isPending ? 'Saving...' : 'Add Expense'}
              </Button>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        )}

        {!isLoading && expenses.length === 0 && !showForm && (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-[#00357a]/5 mb-3">
              <Receipt className="h-7 w-7 text-[#00357a]/30" />
            </div>
            <p className="text-sm text-[#00357a]/50">No expenses tracked yet</p>
            <p className="text-xs text-[#00357a]/40 mt-1">Add expenses to split costs with your group</p>
          </div>
        )}

        {!isLoading && expenses.length > 0 && (
          <>
            <div className="flex gap-1.5 flex-wrap">
              <Button
                size="sm"
                variant={filterCategory === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterCategory('all')}
                className={`rounded-xl text-xs ${filterCategory === 'all' ? 'bg-[#00357a] text-white' : 'border-[#00357a]/20 text-[#00357a]'}`}
                data-testid="button-filter-all"
              >
                All
              </Button>
              {CATEGORIES.map(c => {
                const count = expenses.filter(e => e.category === c.value).length;
                if (count === 0) return null;
                const Icon = c.icon;
                return (
                  <Button
                    key={c.value}
                    size="sm"
                    variant={filterCategory === c.value ? 'default' : 'outline'}
                    onClick={() => setFilterCategory(c.value)}
                    className={`rounded-xl text-xs gap-1 ${filterCategory === c.value ? 'bg-[#00357a] text-white' : 'border-[#00357a]/20 text-[#00357a]'}`}
                    data-testid={`button-filter-${c.value}`}
                  >
                    <Icon className="h-3 w-3" />
                    {c.label} ({count})
                  </Button>
                );
              })}
            </div>

            <div className="space-y-2">
              {filteredExpenses.map((expense) => {
                const catInfo = getCategoryInfo(expense.category);
                const CatIcon = catInfo.icon;
                const isExpanded = expandedId === expense.id;
                const canDelete = expense.paidByUserId === currentUserId || isOwner;
                
                return (
                  <div
                    key={expense.id}
                    className="p-3 bg-[#00357a]/5 rounded-xl border border-[#00357a]/10"
                    data-testid={`expense-item-${expense.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-[#00357a]/10 flex items-center justify-center">
                        <CatIcon className="h-4 w-4 text-[#00357a]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-[#00357a] text-sm truncate" data-testid={`text-expense-desc-${expense.id}`}>
                            {expense.description}
                          </p>
                          <Badge variant="secondary" className="text-xs no-default-active-elevate">
                            {catInfo.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-[#00357a]/50 mt-0.5">
                          Paid by {expense.paidByName}
                          {expense.date && ` · ${formatExpenseDate(expense.date)}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-bold text-[#00357a]" data-testid={`text-expense-amount-${expense.id}`}>
                          {formatCents(expense.amount)}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setExpandedId(isExpanded ? null : expense.id)}
                          className="text-[#00357a]/50"
                          data-testid={`button-expand-expense-${expense.id}`}
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                        {canDelete && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteExpenseMutation.mutate(expense.id)}
                            disabled={deleteExpenseMutation.isPending}
                            className="text-[#7B1E3C]/60"
                            data-testid={`button-delete-expense-${expense.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {isExpanded && expense.splits.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-[#00357a]/10 space-y-2">
                        <p className="text-xs font-medium text-[#00357a]/60 uppercase tracking-wider">Split details</p>
                        {expense.splits.map((split) => (
                          <div
                            key={split.id}
                            className="flex items-center gap-2 text-sm"
                            data-testid={`split-item-${split.id}`}
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-[#00357a]/10 text-[#00357a] text-xs font-medium">
                                {split.userName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className={`flex-1 ${split.settled ? 'text-[#00357a]/40 line-through' : 'text-[#00357a]'}`}>
                              {split.userName}
                            </span>
                            <span className={`font-medium ${split.settled ? 'text-[#00357a]/40' : 'text-[#00357a]'}`}>
                              {formatCents(split.amount)}
                            </span>
                            <Button
                              size="sm"
                              variant={split.settled ? 'default' : 'outline'}
                              onClick={() => settleMutation.mutate({ splitId: split.id, settled: !split.settled })}
                              disabled={settleMutation.isPending}
                              className={`rounded-xl text-xs gap-1 ${split.settled ? 'bg-green-600 text-white' : 'border-[#00357a]/20 text-[#00357a]'}`}
                              data-testid={`button-settle-${split.id}`}
                            >
                              <Check className="h-3 w-3" />
                              {split.settled ? 'Settled' : 'Settle'}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
