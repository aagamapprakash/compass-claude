import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  MapPin, Plus, Trash2, Calendar, FileText, ChevronUp, ChevronDown, Loader2,
  Link2, Hash, Tag, ExternalLink, Copy, Check, Pencil, Save,
  DollarSign, Receipt, Home, UtensilsCrossed, Bike, Compass, Car, Package, UserCircle
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import PlacesSearch, { type PlaceSuggestion } from './PlacesSearch';
import type { TripStop } from '@shared/schema';

interface TripStopsProps {
  tripId: number;
  canEdit: boolean;
  currentUserId?: string;
  isOwner?: boolean;
  isMember?: boolean;
  members?: { userId: string; name: string; role: string }[];
}

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
  stopId: number | null;
  assignedToUserId: string | null;
  assignedToName: string | null;
  createdAt: string;
  paidByName: string;
  paidByProfileImage: string | null;
  splits: ExpenseSplit[];
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

function formatStopDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatExpenseDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface InlineExpenseFormProps {
  tripId: number;
  stopId: number | null;
  currentUserId: string;
  members: { userId: string; name: string }[];
  onClose: () => void;
}

function InlineExpenseForm({ tripId, stopId, currentUserId, members, onClose }: InlineExpenseFormProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('other');
  const [date, setDate] = useState('');
  const [assignedToUserId, setAssignedToUserId] = useState('');
  const [paidByUserId, setPaidByUserId] = useState(currentUserId);
  const [splitMode, setSplitMode] = useState<'everyone' | 'select' | 'custom'>('everyone');
  const [selectedSplitMembers, setSelectedSplitMembers] = useState<string[]>(members.map(m => m.userId));
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>(() =>
    Object.fromEntries(members.map(m => [m.userId, '']))
  );

  const addExpenseMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest('POST', `/api/trips/${tripId}/expenses`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips', tripId.toString(), 'expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trips', tripId.toString(), 'balances'] });
      onClose();
    },
  });

  const amountCents = Math.round(parseFloat(amount) * 100);
  const customTotal = Object.values(customAmounts).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
  const customTotalCents = Math.round(customTotal * 100);
  const remainingCents = amountCents - customTotalCents;
  const isCustomValid = Math.abs(remainingCents) <= 1;

  const handleSubmit = () => {
    if (!description.trim() || isNaN(amountCents) || amountCents <= 0) return;
    if (splitMode === 'custom' && !isCustomValid) return;
    const payload: Record<string, unknown> = {
      description: description.trim(),
      amount: amountCents,
      category,
      paidByUserId,
      date: date || undefined,
      stopId: stopId || undefined,
      assignedToUserId: (assignedToUserId && assignedToUserId !== 'none') ? assignedToUserId : undefined,
    };
    if (splitMode === 'select' && selectedSplitMembers.length > 0) {
      payload.splitAmong = selectedSplitMembers;
    } else if (splitMode === 'custom') {
      payload.splitDetails = members
        .filter(m => parseFloat(customAmounts[m.userId] || '0') > 0)
        .map(m => ({ userId: m.userId, amount: Math.round(parseFloat(customAmounts[m.userId]) * 100) }));
    }
    addExpenseMutation.mutate(payload);
  };

  const toggleSplitMember = (userId: string) => {
    setSelectedSplitMembers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  return (
    <div className="p-3 bg-[#F5C542]/5 rounded-xl border border-[#F5C542]/20 space-y-3 mt-2">
      <div className="flex items-center gap-2 mb-1">
        <Receipt className="h-4 w-4 text-[#F5C542]" />
        <span className="text-sm font-semibold text-[#00357a]">Add Expense</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What was this for?"
          className="rounded-xl border-[#00357a]/20 text-sm"
          data-testid="input-expense-description"
        />
        <div className="flex gap-2">
          <div className="relative flex-1">
            <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#00357a]/40" />
            <Input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="rounded-xl border-[#00357a]/20 pl-7 text-sm"
              data-testid="input-expense-amount"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="rounded-xl border-[#00357a]/20 w-[130px] text-sm" data-testid="select-expense-category">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-[#00357a]/60">Date (optional)</label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border-[#00357a]/20 text-sm"
            data-testid="input-expense-date"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-[#00357a]/60 flex items-center gap-1">
            <UserCircle className="h-3 w-3" />
            Assigned to (optional)
          </label>
          <Select value={assignedToUserId} onValueChange={setAssignedToUserId}>
            <SelectTrigger className="rounded-xl border-[#00357a]/20 text-sm" data-testid="select-expense-assigned-to">
              <SelectValue placeholder="Anyone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Anyone</SelectItem>
              {members.map(m => (
                <SelectItem key={m.userId} value={m.userId}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-[#00357a]/60 flex items-center gap-1">
          <DollarSign className="h-3 w-3" />
          Paid by
        </label>
        <Select value={paidByUserId} onValueChange={setPaidByUserId}>
          <SelectTrigger className="rounded-xl border-[#00357a]/20 text-sm" data-testid="select-expense-paid-by">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {members.map(m => (
              <SelectItem key={m.userId} value={m.userId}>{m.name}{m.userId === currentUserId ? ' (you)' : ''}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs font-medium text-[#00357a]/60">Split</label>
          <Button
            size="sm"
            variant={splitMode === 'everyone' ? 'default' : 'outline'}
            onClick={() => {
              setSplitMode('everyone');
              setSelectedSplitMembers(members.map(m => m.userId));
            }}
            className={`rounded-xl text-xs h-7 ${splitMode === 'everyone' ? 'bg-[#00357a] text-white' : 'border-[#00357a]/20 text-[#00357a]'}`}
            data-testid="button-split-all"
          >
            Everyone equally
          </Button>
          <Button
            size="sm"
            variant={splitMode === 'select' ? 'default' : 'outline'}
            onClick={() => setSplitMode('select')}
            className={`rounded-xl text-xs h-7 ${splitMode === 'select' ? 'bg-[#00357a] text-white' : 'border-[#00357a]/20 text-[#00357a]'}`}
            data-testid="button-split-select"
          >
            Select members
          </Button>
          <Button
            size="sm"
            variant={splitMode === 'custom' ? 'default' : 'outline'}
            onClick={() => setSplitMode('custom')}
            className={`rounded-xl text-xs h-7 ${splitMode === 'custom' ? 'bg-[#00357a] text-white' : 'border-[#00357a]/20 text-[#00357a]'}`}
            data-testid="button-split-custom"
          >
            Custom amounts
          </Button>
        </div>
        {splitMode === 'select' && (
          <div className="flex flex-wrap gap-1.5">
            {members.map(m => {
              const selected = selectedSplitMembers.includes(m.userId);
              return (
                <Button
                  key={m.userId}
                  size="sm"
                  variant={selected ? 'default' : 'outline'}
                  onClick={() => toggleSplitMember(m.userId)}
                  className={`rounded-xl text-xs h-7 gap-1 ${selected ? 'bg-[#00357a] text-white' : 'border-[#00357a]/20 text-[#00357a]'}`}
                  data-testid={`button-split-member-${m.userId}`}
                >
                  {selected && <Check className="h-3 w-3" />}
                  {m.name}
                </Button>
              );
            })}
          </div>
        )}
        {splitMode === 'custom' && (
          <div className="space-y-1.5">
            {members.map(m => (
              <div key={m.userId} className="flex items-center gap-2">
                <span className="text-xs text-[#00357a] flex-1 truncate">{m.name}{m.userId === currentUserId ? ' (you)' : ''}</span>
                <div className="relative w-28">
                  <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[#00357a]/40" />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={customAmounts[m.userId]}
                    onChange={(e) => setCustomAmounts(prev => ({ ...prev, [m.userId]: e.target.value }))}
                    placeholder="0.00"
                    className="rounded-xl border-[#00357a]/20 pl-6 text-sm h-8"
                    data-testid={`input-split-amount-${m.userId}`}
                  />
                </div>
              </div>
            ))}
            <div className={`flex items-center justify-between text-xs pt-1 ${isCustomValid ? 'text-green-600' : 'text-red-500'}`}>
              <span data-testid="text-split-remaining">
                {isCustomValid
                  ? 'Amounts match total'
                  : remainingCents > 0
                    ? `$${(remainingCents / 100).toFixed(2)} remaining to assign`
                    : `$${(Math.abs(remainingCents) / 100).toFixed(2)} over total`}
              </span>
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onClose} className="rounded-xl text-[#00357a]/60 text-sm">
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={
            !description.trim() || !amount || parseFloat(amount) <= 0 || addExpenseMutation.isPending ||
            (splitMode === 'select' && selectedSplitMembers.length === 0) ||
            (splitMode === 'custom' && !isCustomValid)
          }
          className="bg-[#00357a] text-white rounded-xl gap-1 text-sm"
          data-testid="button-save-expense"
        >
          {addExpenseMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          {addExpenseMutation.isPending ? 'Saving...' : 'Add'}
        </Button>
      </div>
    </div>
  );
}

interface ExpenseItemProps {
  expense: ExpenseWithDetails;
  currentUserId: string;
  isOwner: boolean;
  tripId: number;
  members: { userId: string; name: string }[];
}

function ExpenseItem({ expense, currentUserId, isOwner, tripId, members }: ExpenseItemProps) {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDesc, setEditDesc] = useState(expense.description);
  const [editAmount, setEditAmount] = useState((expense.amount / 100).toFixed(2));
  const [editCategory, setEditCategory] = useState(expense.category);
  const [editDate, setEditDate] = useState(expense.date || '');
  const [editAssignedTo, setEditAssignedTo] = useState(expense.assignedToUserId || '');
  const [editSplitMode, setEditSplitMode] = useState<'equal' | 'custom'>('equal');
  const [editCustomAmounts, setEditCustomAmounts] = useState<Record<string, string>>(() =>
    Object.fromEntries(members.map(m => [m.userId, '']))
  );

  const catInfo = getCategoryInfo(expense.category);
  const CatIcon = catInfo.icon;
  const canEdit = expense.paidByUserId === currentUserId || isOwner;

  const deleteExpenseMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/expenses/${expense.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips', tripId.toString(), 'expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trips', tripId.toString(), 'balances'] });
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest('PATCH', `/api/expenses/${expense.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips', tripId.toString(), 'expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trips', tripId.toString(), 'balances'] });
      setIsEditing(false);
    },
    onError: () => {
      toast({ title: 'Failed to update expense', variant: 'destructive' });
    },
  });

  const settleMutation = useMutation({
    mutationFn: async ({ splitId, settled }: { splitId: number; settled: boolean }) => {
      const res = await apiRequest('PATCH', `/api/expense-splits/${splitId}/settle`, { settled });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips', tripId.toString(), 'expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trips', tripId.toString(), 'balances'] });
    },
  });

  const handleStartEdit = () => {
    setEditDesc(expense.description);
    setEditAmount((expense.amount / 100).toFixed(2));
    setEditCategory(expense.category);
    setEditDate(expense.date || '');
    setEditAssignedTo(expense.assignedToUserId || '');
    setEditSplitMode('equal');
    const prefilledAmounts = Object.fromEntries(members.map(m => {
      const existingSplit = expense.splits.find(s => s.userId === m.userId);
      return [m.userId, existingSplit ? (existingSplit.amount / 100).toFixed(2) : ''];
    }));
    setEditCustomAmounts(prefilledAmounts);
    setIsEditing(true);
  };

  const editAmountCents = Math.round(parseFloat(editAmount) * 100);
  const editCustomTotal = Object.values(editCustomAmounts).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
  const editCustomTotalCents = Math.round(editCustomTotal * 100);
  const editRemainingCents = editAmountCents - editCustomTotalCents;
  const isEditCustomValid = Math.abs(editRemainingCents) <= 1;

  const handleSaveEdit = () => {
    if (!editDesc.trim() || isNaN(editAmountCents) || editAmountCents <= 0) return;
    if (editSplitMode === 'custom' && !isEditCustomValid) return;
    const payload: Record<string, unknown> = {
      description: editDesc.trim(),
      amount: editAmountCents,
      category: editCategory,
      date: editDate || null,
      assignedToUserId: (editAssignedTo && editAssignedTo !== 'none') ? editAssignedTo : null,
    };
    if (editSplitMode === 'custom') {
      payload.splitDetails = members
        .filter(m => parseFloat(editCustomAmounts[m.userId] || '0') > 0)
        .map(m => ({ userId: m.userId, amount: Math.round(parseFloat(editCustomAmounts[m.userId]) * 100) }));
    }
    updateExpenseMutation.mutate(payload);
  };

  if (isEditing) {
    return (
      <div className="p-3 bg-[#F5C542]/10 rounded-lg border border-[#F5C542]/30 mt-1.5 space-y-2" data-testid={`expense-edit-form-${expense.id}`}>
        <div className="flex items-center gap-2 mb-1">
          <Pencil className="h-3.5 w-3.5 text-[#F5C542]" />
          <span className="text-xs font-semibold text-[#00357a]">Edit Expense</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            placeholder="Description"
            className="rounded-xl border-[#00357a]/20 text-sm"
            data-testid={`input-edit-expense-desc-${expense.id}`}
          />
          <div className="flex gap-2">
            <div className="relative flex-1">
              <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#00357a]/40" />
              <Input
                type="number"
                step="0.01"
                min="0"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="rounded-xl border-[#00357a]/20 pl-7 text-sm"
                data-testid={`input-edit-expense-amount-${expense.id}`}
              />
            </div>
            <Select value={editCategory} onValueChange={setEditCategory}>
              <SelectTrigger className="rounded-xl border-[#00357a]/20 w-[130px] text-sm" data-testid={`select-edit-expense-category-${expense.id}`}>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#00357a]/60">Date</label>
            <Input
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              className="rounded-xl border-[#00357a]/20 text-sm"
              data-testid={`input-edit-expense-date-${expense.id}`}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#00357a]/60 flex items-center gap-1">
              <UserCircle className="h-3 w-3" />
              Assigned to
            </label>
            <Select value={editAssignedTo || 'none'} onValueChange={setEditAssignedTo}>
              <SelectTrigger className="rounded-xl border-[#00357a]/20 text-sm" data-testid={`select-edit-expense-assigned-${expense.id}`}>
                <SelectValue placeholder="Anyone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Anyone</SelectItem>
                {members.map(m => (
                  <SelectItem key={m.userId} value={m.userId}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-[#00357a]/60 flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            Paid by
          </label>
          <div className="text-sm text-[#00357a] px-3 py-2 rounded-xl border border-[#00357a]/20 bg-[#00357a]/5" data-testid={`text-edit-paid-by-${expense.id}`}>
            {members.find(m => m.userId === expense.paidByUserId)?.name ?? expense.paidByUserId}
            {expense.paidByUserId === currentUserId ? ' (you)' : ''}
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-xs font-medium text-[#00357a]/60">Split amounts</label>
            <Button
              size="sm"
              variant={editSplitMode === 'equal' ? 'default' : 'outline'}
              onClick={() => setEditSplitMode('equal')}
              className={`rounded-xl text-xs h-7 ${editSplitMode === 'equal' ? 'bg-[#00357a] text-white' : 'border-[#00357a]/20 text-[#00357a]'}`}
              data-testid={`button-edit-split-equal-${expense.id}`}
            >
              Keep equal
            </Button>
            <Button
              size="sm"
              variant={editSplitMode === 'custom' ? 'default' : 'outline'}
              onClick={() => setEditSplitMode('custom')}
              className={`rounded-xl text-xs h-7 ${editSplitMode === 'custom' ? 'bg-[#00357a] text-white' : 'border-[#00357a]/20 text-[#00357a]'}`}
              data-testid={`button-edit-split-custom-${expense.id}`}
            >
              Custom amounts
            </Button>
          </div>
          {editSplitMode === 'custom' && (
            <div className="space-y-1.5">
              {members.map(m => (
                <div key={m.userId} className="flex items-center gap-2">
                  <span className="text-xs text-[#00357a] flex-1 truncate">{m.name}{m.userId === currentUserId ? ' (you)' : ''}</span>
                  <div className="relative w-28">
                    <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[#00357a]/40" />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editCustomAmounts[m.userId]}
                      onChange={(e) => setEditCustomAmounts(prev => ({ ...prev, [m.userId]: e.target.value }))}
                      placeholder="0.00"
                      className="rounded-xl border-[#00357a]/20 pl-6 text-sm h-8"
                      data-testid={`input-edit-split-amount-${m.userId}-${expense.id}`}
                    />
                  </div>
                </div>
              ))}
              <div className={`flex items-center justify-between text-xs pt-1 ${isEditCustomValid ? 'text-green-600' : 'text-red-500'}`}>
                <span data-testid={`text-edit-split-remaining-${expense.id}`}>
                  {isEditCustomValid
                    ? 'Amounts match total'
                    : editRemainingCents > 0
                      ? `$${(editRemainingCents / 100).toFixed(2)} remaining to assign`
                      : `$${(Math.abs(editRemainingCents) / 100).toFixed(2)} over total`}
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="rounded-xl text-[#00357a]/60 text-sm">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSaveEdit}
            disabled={!editDesc.trim() || !editAmount || parseFloat(editAmount) <= 0 || updateExpenseMutation.isPending || (editSplitMode === 'custom' && !isEditCustomValid)}
            className="bg-[#00357a] text-white rounded-xl gap-1 text-sm"
            data-testid={`button-save-edit-expense-${expense.id}`}
          >
            {updateExpenseMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {updateExpenseMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2.5 bg-[#F5C542]/5 rounded-lg border border-[#F5C542]/15 mt-1.5" data-testid={`expense-item-${expense.id}`}>
      <div className="flex items-center gap-2">
        <div className="flex-shrink-0 h-7 w-7 rounded-md bg-[#F5C542]/20 flex items-center justify-center">
          <CatIcon className="h-3.5 w-3.5 text-[#00357a]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-medium text-[#00357a] text-xs truncate" data-testid={`text-expense-desc-${expense.id}`}>
              {expense.description}
            </span>
            {expense.assignedToName && (
              <Badge variant="outline" className="text-[10px] gap-0.5 no-default-active-elevate">
                <UserCircle className="h-2.5 w-2.5" />
                {expense.assignedToName}
              </Badge>
            )}
          </div>
          <p className="text-[10px] text-[#00357a]/50 mt-0.5">
            Paid by {expense.paidByName}
            {expense.date && ` · ${formatExpenseDate(expense.date)}`}
          </p>
        </div>
        <span className="font-bold text-[#00357a] text-sm flex-shrink-0" data-testid={`text-expense-amount-${expense.id}`}>
          {formatCents(expense.amount)}
        </span>
        {canEdit && (
          <Button
            size="icon"
            variant="ghost"
            onClick={handleStartEdit}
            className="text-[#00357a]/40"
            data-testid={`button-edit-expense-${expense.id}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[#00357a]/40"
          data-testid={`button-expand-expense-${expense.id}`}
        >
          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </Button>
        {canEdit && (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => deleteExpenseMutation.mutate()}
            disabled={deleteExpenseMutation.isPending}
            className="text-[#7B1E3C]/50"
            data-testid={`button-delete-expense-${expense.id}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      {isExpanded && expense.splits.length > 0 && (
        <div className="mt-2 pt-2 border-t border-[#00357a]/10 space-y-1.5">
          <p className="text-[10px] font-medium text-[#00357a]/50 uppercase tracking-wider">Split details</p>
          {expense.splits.map((split) => (
            <div key={split.id} className="flex items-center gap-1.5 text-xs" data-testid={`split-item-${split.id}`}>
              <Avatar className="h-5 w-5">
                <AvatarFallback className="bg-[#00357a]/10 text-[#00357a] text-[9px] font-medium">
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
                className={`rounded-xl text-[10px] gap-0.5 h-6 px-2 ${split.settled ? 'bg-green-600 text-white' : 'border-[#00357a]/20 text-[#00357a]'}`}
                data-testid={`button-settle-${split.id}`}
              >
                <Check className="h-2.5 w-2.5" />
                {split.settled ? 'Settled' : 'Settle'}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface StopEditState {
  name: string;
  notes: string;
  startDate: string;
  endDate: string;
  link: string;
  confirmationNumber: string;
  attachmentType: string;
}

export default function TripStops({ tripId, canEdit, currentUserId, isOwner = false, isMember = false, members = [] }: TripStopsProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [placeId, setPlaceId] = useState<string | undefined>();
  const [notes, setNotes] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [link, setLink] = useState('');
  const [confirmationNumber, setConfirmationNumber] = useState('');
  const [attachmentType, setAttachmentType] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [expenseFormStopId, setExpenseFormStopId] = useState<number | null | 'general'>(null);
  const [editingStopId, setEditingStopId] = useState<number | null>(null);
  const [stopEdit, setStopEdit] = useState<StopEditState>({ name: '', notes: '', startDate: '', endDate: '', link: '', confirmationNumber: '', attachmentType: '' });

  const stopsQueryKey = ['/api/trips', tripId.toString(), 'stops'];
  const expensesQueryKey = ['/api/trips', tripId.toString(), 'expenses'];

  const { data: stops = [], isLoading: stopsLoading } = useQuery<TripStop[]>({
    queryKey: stopsQueryKey,
  });

  const { data: expenses = [], isLoading: expensesLoading } = useQuery<ExpenseWithDetails[]>({
    queryKey: expensesQueryKey,
    enabled: isMember,
  });

  const addStopMutation = useMutation({
    mutationFn: async (data: { name: string; placeId?: string; notes?: string; startDate?: string; endDate?: string; link?: string; confirmationNumber?: string; attachmentType?: string }) => {
      const res = await apiRequest('POST', `/api/trips/${tripId}/stops`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stopsQueryKey });
      resetForm();
    },
  });

  const deleteStopMutation = useMutation({
    mutationFn: async (stopId: number) => {
      await apiRequest('DELETE', `/api/trips/${tripId}/stops/${stopId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stopsQueryKey });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (stopIds: number[]) => {
      await apiRequest('PUT', `/api/trips/${tripId}/stops/reorder`, { stopIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stopsQueryKey });
    },
  });

  const resetForm = () => {
    setName('');
    setPlaceId(undefined);
    setNotes('');
    setStartDate('');
    setEndDate('');
    setLink('');
    setConfirmationNumber('');
    setAttachmentType('');
    setShowForm(false);
  };

  const { toast } = useToast();

  const updateStopMutation = useMutation({
    mutationFn: async ({ stopId, data }: { stopId: number; data: Record<string, unknown> }) => {
      const res = await apiRequest('PATCH', `/api/trips/${tripId}/stops/${stopId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stopsQueryKey });
      setEditingStopId(null);
    },
    onError: () => {
      toast({ title: 'Failed to update stop', variant: 'destructive' });
    },
  });

  const handleStartEditStop = (stop: TripStop) => {
    setStopEdit({
      name: stop.name,
      notes: stop.notes || '',
      startDate: stop.startDate || '',
      endDate: stop.endDate || '',
      link: stop.link || '',
      confirmationNumber: stop.confirmationNumber || '',
      attachmentType: stop.attachmentType || '',
    });
    setEditingStopId(stop.id);
  };

  const handleSaveEditStop = (stopId: number) => {
    if (!stopEdit.name.trim()) return;
    updateStopMutation.mutate({
      stopId,
      data: {
        name: stopEdit.name.trim(),
        notes: stopEdit.notes.trim() || null,
        startDate: stopEdit.startDate || null,
        endDate: stopEdit.endDate || null,
        link: stopEdit.link.trim() || null,
        confirmationNumber: stopEdit.confirmationNumber.trim() || null,
        attachmentType: stopEdit.attachmentType || null,
      },
    });
  };

  const handleCopyConfirmation = (stopId: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(stopId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveStop = () => {
    if (!name.trim()) return;
    addStopMutation.mutate({
      name: name.trim(),
      placeId: placeId || undefined,
      notes: notes.trim() || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      link: link.trim() || undefined,
      confirmationNumber: confirmationNumber.trim() || undefined,
      attachmentType: attachmentType || undefined,
    });
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const ids = stops.map((s) => s.id);
    [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
    reorderMutation.mutate(ids);
  };

  const handleMoveDown = (index: number) => {
    if (index === stops.length - 1) return;
    const ids = stops.map((s) => s.id);
    [ids[index], ids[index + 1]] = [ids[index + 1], ids[index]];
    reorderMutation.mutate(ids);
  };

  const getStopExpenses = (stopId: number) => expenses.filter(e => e.stopId === stopId);
  const generalExpenses = expenses.filter(e => !e.stopId);
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  const isLoading = stopsLoading || (isMember && expensesLoading);

  return (
    <Card className="rounded-2xl border-[#00357a]/10 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
        <CardTitle className="text-lg text-[#00357a] flex items-center gap-2">
          <MapPin className="h-5 w-5 text-[#F5C542]" />
          Itinerary
          {isMember && expenses.length > 0 && (
            <Badge variant="secondary" className="ml-1 text-xs no-default-active-elevate">
              {formatCents(totalSpent)} total
            </Badge>
          )}
        </CardTitle>
        {canEdit && !showForm && (
          <Button
            size="sm"
            onClick={() => setShowForm(true)}
            className="bg-[#F5C542] text-[#00357a] rounded-xl gap-1"
            data-testid="button-add-stop"
          >
            <Plus className="h-4 w-4" />
            Add Stop
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        )}

        {!isLoading && stops.length === 0 && !showForm && (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-[#00357a]/5 mb-3">
              <MapPin className="h-7 w-7 text-[#00357a]/30" />
            </div>
            <p className="text-sm text-[#00357a]/50">No stops added yet</p>
            {canEdit && (
              <p className="text-xs text-[#00357a]/40 mt-1">Add stops to plan your itinerary</p>
            )}
          </div>
        )}

        {stops.length > 0 && (
          <div className="relative">
            <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-[#F5C542] via-[#00357a]/20 to-[#7B1E3C]/30" />
            <div className="space-y-3">
              {stops.map((stop, index) => {
                const stopExpenses = getStopExpenses(stop.id);
                return (
                  <div
                    key={stop.id}
                    className="relative flex items-start gap-3 pl-1"
                    data-testid={`stop-item-${stop.id}`}
                  >
                    <div className="relative z-10 flex-shrink-0 mt-1">
                      <Badge className="h-9 w-9 rounded-full flex items-center justify-center bg-[#00357a] text-white text-sm font-semibold p-0">
                        {index + 1}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      {editingStopId === stop.id ? (
                        <div className="p-3 bg-[#F5C542]/10 rounded-xl border border-[#F5C542]/30 space-y-3" data-testid={`stop-edit-form-${stop.id}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <Pencil className="h-3.5 w-3.5 text-[#F5C542]" />
                            <span className="text-xs font-semibold text-[#00357a]">Edit Stop</span>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-[#00357a]/70 flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-[#F5C542]" />
                              Name
                            </label>
                            <Input
                              value={stopEdit.name}
                              onChange={(e) => setStopEdit(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Stop name"
                              className="rounded-xl border-[#00357a]/20"
                              data-testid={`input-edit-stop-name-${stop.id}`}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-[#00357a]/70 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Start Date
                              </label>
                              <Input
                                type="date"
                                value={stopEdit.startDate}
                                onChange={(e) => setStopEdit(prev => ({ ...prev, startDate: e.target.value }))}
                                className="rounded-xl border-[#00357a]/20"
                                data-testid={`input-edit-stop-start-date-${stop.id}`}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-[#00357a]/70 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                End Date
                              </label>
                              <Input
                                type="date"
                                value={stopEdit.endDate}
                                onChange={(e) => setStopEdit(prev => ({ ...prev, endDate: e.target.value }))}
                                className="rounded-xl border-[#00357a]/20"
                                data-testid={`input-edit-stop-end-date-${stop.id}`}
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-[#00357a]/70 flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              Type
                            </label>
                            <Select value={stopEdit.attachmentType} onValueChange={(val) => setStopEdit(prev => ({ ...prev, attachmentType: val }))}>
                              <SelectTrigger className="rounded-xl border-[#00357a]/20" data-testid={`select-edit-stop-type-${stop.id}`}>
                                <SelectValue placeholder="Select type (optional)" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Hotel Booking">Hotel Booking</SelectItem>
                                <SelectItem value="Flight">Flight</SelectItem>
                                <SelectItem value="Car Rental">Car Rental</SelectItem>
                                <SelectItem value="Activity">Activity</SelectItem>
                                <SelectItem value="Restaurant">Restaurant</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-[#00357a]/70 flex items-center gap-1">
                                <Link2 className="h-3 w-3" />
                                Link
                              </label>
                              <Input
                                type="url"
                                value={stopEdit.link}
                                onChange={(e) => setStopEdit(prev => ({ ...prev, link: e.target.value }))}
                                placeholder="https://..."
                                className="rounded-xl border-[#00357a]/20"
                                data-testid={`input-edit-stop-link-${stop.id}`}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-[#00357a]/70 flex items-center gap-1">
                                <Hash className="h-3 w-3" />
                                Confirmation #
                              </label>
                              <Input
                                value={stopEdit.confirmationNumber}
                                onChange={(e) => setStopEdit(prev => ({ ...prev, confirmationNumber: e.target.value }))}
                                placeholder="e.g. ABC123"
                                className="rounded-xl border-[#00357a]/20"
                                data-testid={`input-edit-stop-confirmation-${stop.id}`}
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-[#00357a]/70 flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              Notes
                            </label>
                            <Textarea
                              value={stopEdit.notes}
                              onChange={(e) => setStopEdit(prev => ({ ...prev, notes: e.target.value }))}
                              placeholder="Any details about this stop..."
                              className="rounded-xl border-[#00357a]/20 min-h-[60px] resize-y"
                              data-testid={`input-edit-stop-notes-${stop.id}`}
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button variant="ghost" size="sm" onClick={() => setEditingStopId(null)} className="rounded-xl text-[#00357a]/60">
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSaveEditStop(stop.id)}
                              disabled={!stopEdit.name.trim() || updateStopMutation.isPending}
                              className="bg-[#00357a] text-white rounded-xl gap-1"
                              data-testid={`button-save-edit-stop-${stop.id}`}
                            >
                              {updateStopMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                              {updateStopMutation.isPending ? 'Saving...' : 'Save'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                      <div className="p-3 bg-[#00357a]/5 rounded-xl border border-[#00357a]/10">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-[#00357a] truncate">{stop.name}</p>
                            {(stop.startDate || stop.endDate) && (
                              <p className="text-xs text-[#00357a]/50 flex items-center gap-1 mt-1">
                                <Calendar className="h-3 w-3" />
                                {stop.startDate && formatStopDate(stop.startDate)}
                                {stop.startDate && stop.endDate && ' - '}
                                {stop.endDate && formatStopDate(stop.endDate)}
                              </p>
                            )}
                            {stop.notes && (
                              <p className="text-xs text-[#00357a]/60 mt-1 flex items-start gap-1">
                                <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                <span className="line-clamp-2">{stop.notes}</span>
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {stop.attachmentType && (
                                <Badge variant="secondary" className="text-xs gap-1" data-testid={`badge-attachment-type-${stop.id}`}>
                                  <Tag className="h-3 w-3" />
                                  {stop.attachmentType}
                                </Badge>
                              )}
                              {stop.confirmationNumber && (
                                <Badge
                                  variant="outline"
                                  className="text-xs gap-1 cursor-pointer"
                                  onClick={() => handleCopyConfirmation(stop.id, stop.confirmationNumber!)}
                                  data-testid={`badge-confirmation-${stop.id}`}
                                >
                                  <Hash className="h-3 w-3" />
                                  {stop.confirmationNumber}
                                  {copiedId === stop.id ? (
                                    <Check className="h-3 w-3 text-green-600" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Badge>
                              )}
                              {stop.link && (
                                <a
                                  href={stop.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-[#00357a]/70 hover:text-[#00357a] transition-colors"
                                  data-testid={`link-stop-url-${stop.id}`}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  <span className="underline">View Link</span>
                                </a>
                              )}
                            </div>
                          </div>
                          {canEdit && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleStartEditStop(stop)}
                                className="text-[#00357a]/50"
                                data-testid={`button-edit-stop-${stop.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleMoveUp(index)}
                                disabled={index === 0 || reorderMutation.isPending}
                                className="text-[#00357a]/50"
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleMoveDown(index)}
                                disabled={index === stops.length - 1 || reorderMutation.isPending}
                                className="text-[#00357a]/50"
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => deleteStopMutation.mutate(stop.id)}
                                disabled={deleteStopMutation.isPending}
                                className="text-[#7B1E3C]/60"
                                data-testid={`button-delete-stop-${stop.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      )}

                      {isMember && currentUserId && (
                        <div className="mt-1">
                          {stopExpenses.length > 0 && (
                            <div className="space-y-1">
                              {stopExpenses.map(exp => (
                                <ExpenseItem
                                  key={exp.id}
                                  expense={exp}
                                  currentUserId={currentUserId}
                                  isOwner={isOwner}
                                  tripId={tripId}
                                  members={members.length > 0 ? members : [{ userId: currentUserId, name: 'You' }]}
                                />
                              ))}
                            </div>
                          )}

                          {expenseFormStopId === stop.id ? (
                            <InlineExpenseForm
                              tripId={tripId}
                              stopId={stop.id}
                              currentUserId={currentUserId}
                              members={members.length > 0 ? members : [{ userId: currentUserId, name: 'You' }]}
                              onClose={() => setExpenseFormStopId(null)}
                            />
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setExpenseFormStopId(stop.id)}
                              className="text-[#00357a]/40 hover:text-[#00357a] text-xs gap-1 mt-1 h-7"
                              data-testid={`button-add-expense-stop-${stop.id}`}
                            >
                              <DollarSign className="h-3 w-3" />
                              Add Expense
                            </Button>
                          )}

                          {stopExpenses.length > 0 && (
                            <div className="flex justify-end mt-1">
                              <span className="text-[10px] font-medium text-[#00357a]/40">
                                Stop total: {formatCents(stopExpenses.reduce((sum, e) => sum + e.amount, 0))}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {showForm && (
          <div className="p-4 bg-[#F5C542]/5 rounded-xl border border-[#F5C542]/20 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#00357a] flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-[#F5C542]" />
                Stop Name
              </label>
              <PlacesSearch
                onSelect={(s: PlaceSuggestion) => {
                  setName(s.description);
                  setPlaceId(s.placeId);
                }}
                placeholder="Search for a place..."
                defaultType="attraction"
                showTypeFilter={false}
              />
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Or type a name manually"
                className="rounded-xl border-[#00357a]/20"
                data-testid="input-stop-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#00357a]/70 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Start Date
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-xl border-[#00357a]/20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#00357a]/70 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  End Date
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-xl border-[#00357a]/20"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#00357a]/70 flex items-center gap-1">
                <Tag className="h-3 w-3" />
                Type
              </label>
              <Select value={attachmentType} onValueChange={setAttachmentType}>
                <SelectTrigger className="rounded-xl border-[#00357a]/20" data-testid="select-attachment-type">
                  <SelectValue placeholder="Select type (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hotel Booking">Hotel Booking</SelectItem>
                  <SelectItem value="Flight">Flight</SelectItem>
                  <SelectItem value="Car Rental">Car Rental</SelectItem>
                  <SelectItem value="Activity">Activity</SelectItem>
                  <SelectItem value="Restaurant">Restaurant</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#00357a]/70 flex items-center gap-1">
                  <Link2 className="h-3 w-3" />
                  Link
                </label>
                <Input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://..."
                  className="rounded-xl border-[#00357a]/20"
                  data-testid="input-stop-link"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#00357a]/70 flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  Confirmation #
                </label>
                <Input
                  value={confirmationNumber}
                  onChange={(e) => setConfirmationNumber(e.target.value)}
                  placeholder="e.g. ABC123"
                  className="rounded-xl border-[#00357a]/20"
                  data-testid="input-stop-confirmation"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#00357a]/70 flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Notes
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any details about this stop..."
                className="rounded-xl border-[#00357a]/20 min-h-[60px] resize-y"
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
                onClick={handleSaveStop}
                disabled={!name.trim() || addStopMutation.isPending}
                className="bg-[#00357a] text-white rounded-xl gap-1"
                data-testid="button-save-stop"
              >
                {addStopMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {addStopMutation.isPending ? 'Saving...' : 'Save Stop'}
              </Button>
            </div>
          </div>
        )}

        {isMember && currentUserId && !isLoading && (
          <div className="border-t border-[#00357a]/10 pt-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-[#00357a] flex items-center gap-1.5">
                <Receipt className="h-4 w-4 text-[#F5C542]" />
                General Expenses
              </h3>
              {expenseFormStopId !== 'general' && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setExpenseFormStopId('general')}
                  className="text-[#00357a]/50 text-xs gap-1 h-7"
                  data-testid="button-add-general-expense"
                >
                  <Plus className="h-3 w-3" />
                  Add Expense
                </Button>
              )}
            </div>

            {expenseFormStopId === 'general' && (
              <InlineExpenseForm
                tripId={tripId}
                stopId={null}
                currentUserId={currentUserId}
                members={members.length > 0 ? members : [{ userId: currentUserId, name: 'You' }]}
                onClose={() => setExpenseFormStopId(null)}
              />
            )}

            {generalExpenses.length > 0 ? (
              <div className="space-y-1">
                {generalExpenses.map(exp => (
                  <ExpenseItem
                    key={exp.id}
                    expense={exp}
                    currentUserId={currentUserId}
                    isOwner={isOwner}
                    tripId={tripId}
                    members={members.length > 0 ? members : [{ userId: currentUserId, name: 'You' }]}
                  />
                ))}
              </div>
            ) : (
              expenseFormStopId !== 'general' && (
                <p className="text-xs text-[#00357a]/40 text-center py-2">No general expenses yet</p>
              )
            )}
          </div>
        )}

        {isMember && expenses.length > 0 && (
          <div className="border-t border-[#00357a]/10 pt-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-[#00357a] flex items-center gap-1.5">
              <DollarSign className="h-4 w-4 text-[#F5C542]" />
              Trip Total
            </span>
            <span className="text-lg font-bold text-[#00357a]" data-testid="text-trip-total">
              {formatCents(totalSpent)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
