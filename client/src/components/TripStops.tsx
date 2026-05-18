import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  MapPin, Plus, Trash2, Calendar, FileText, ChevronUp, ChevronDown, Loader2,
  Link2, Hash, ExternalLink, Copy, Check, Pencil, Save,
  DollarSign, Receipt, Home, UtensilsCrossed, Bike, Compass, Car, Package, UserCircle, Tag,
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
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function formatExpenseDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Shared input/select class helpers ─────────────────────────────────────
const inputCls = 'border-foreground/40 rounded-none text-sm font-mono';
const selectTriggerCls = 'border-foreground/40 rounded-none text-sm font-mono';
const labelCls = 'text-xs font-mono text-muted-foreground flex items-center gap-1';
const splitBtnActive = 'bg-compass-navy text-white border-2 border-foreground rounded-none font-mono text-xs h-7';
const splitBtnInactive = 'bg-background text-foreground border border-foreground/50 rounded-none font-mono text-xs h-7 hover:border-foreground';

// ── InlineExpenseForm ──────────────────────────────────────────────────────
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
    <div className="border-2 border-dashed border-foreground/40 p-3 space-y-3 mt-2 bg-background">
      <div className="flex items-center gap-2 mb-1">
        <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-mono text-xs font-bold">Add Expense</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Input
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="What was this for?"
          className={inputCls}
          data-testid="input-expense-description"
        />
        <div className="flex gap-2">
          <div className="relative flex-1">
            <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className={`${inputCls} pl-7`}
              data-testid="input-expense-amount"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className={`${selectTriggerCls} w-[130px]`} data-testid="select-expense-category">
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
          <label className={labelCls}><Calendar className="h-3 w-3" /> Date (optional)</label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} data-testid="input-expense-date" />
        </div>
        <div className="space-y-1">
          <label className={labelCls}><UserCircle className="h-3 w-3" /> Assigned to (optional)</label>
          <Select value={assignedToUserId} onValueChange={setAssignedToUserId}>
            <SelectTrigger className={selectTriggerCls} data-testid="select-expense-assigned-to">
              <SelectValue placeholder="Anyone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Anyone</SelectItem>
              {members.map(m => <SelectItem key={m.userId} value={m.userId}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <label className={labelCls}><DollarSign className="h-3 w-3" /> Paid by</label>
        <Select value={paidByUserId} onValueChange={setPaidByUserId}>
          <SelectTrigger className={selectTriggerCls} data-testid="select-expense-paid-by">
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
          <span className={labelCls}>Split</span>
          <Button size="sm" onClick={() => { setSplitMode('everyone'); setSelectedSplitMembers(members.map(m => m.userId)); }}
            className={splitMode === 'everyone' ? splitBtnActive : splitBtnInactive} data-testid="button-split-all">
            Everyone equally
          </Button>
          <Button size="sm" onClick={() => setSplitMode('select')}
            className={splitMode === 'select' ? splitBtnActive : splitBtnInactive} data-testid="button-split-select">
            Select members
          </Button>
          <Button size="sm" onClick={() => setSplitMode('custom')}
            className={splitMode === 'custom' ? splitBtnActive : splitBtnInactive} data-testid="button-split-custom">
            Custom amounts
          </Button>
        </div>
        {splitMode === 'select' && (
          <div className="flex flex-wrap gap-1.5">
            {members.map(m => {
              const selected = selectedSplitMembers.includes(m.userId);
              return (
                <Button key={m.userId} size="sm" onClick={() => toggleSplitMember(m.userId)}
                  className={selected ? splitBtnActive : splitBtnInactive}
                  data-testid={`button-split-member-${m.userId}`}>
                  {selected && <Check className="h-3 w-3 mr-1" />}{m.name}
                </Button>
              );
            })}
          </div>
        )}
        {splitMode === 'custom' && (
          <div className="space-y-1.5">
            {members.map(m => (
              <div key={m.userId} className="flex items-center gap-2">
                <span className="font-mono text-xs flex-1 truncate">{m.name}{m.userId === currentUserId ? ' (you)' : ''}</span>
                <div className="relative w-28">
                  <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input type="number" step="0.01" min="0" value={customAmounts[m.userId]}
                    onChange={e => setCustomAmounts(prev => ({ ...prev, [m.userId]: e.target.value }))}
                    placeholder="0.00" className={`${inputCls} pl-6 h-8`}
                    data-testid={`input-split-amount-${m.userId}`} />
                </div>
              </div>
            ))}
            <div className={`text-xs pt-1 ${isCustomValid ? 'text-green-600' : 'text-red-500'}`}>
              <span data-testid="text-split-remaining">
                {isCustomValid ? 'Amounts match total'
                  : remainingCents > 0
                    ? `$${(remainingCents / 100).toFixed(2)} remaining`
                    : `$${(Math.abs(remainingCents) / 100).toFixed(2)} over total`}
              </span>
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onClose} className="font-mono text-xs rounded-none">Cancel</Button>
        <Button size="sm" onClick={handleSubmit}
          disabled={!description.trim() || !amount || parseFloat(amount) <= 0 || addExpenseMutation.isPending ||
            (splitMode === 'select' && selectedSplitMembers.length === 0) ||
            (splitMode === 'custom' && !isCustomValid)}
          className="bg-compass-navy text-white border-2 border-foreground rounded-none font-mono text-xs hard-shadow gap-1"
          data-testid="button-save-expense">
          {addExpenseMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          {addExpenseMutation.isPending ? 'Saving…' : 'Add'}
        </Button>
      </div>
    </div>
  );
}

// ── ExpenseItem ────────────────────────────────────────────────────────────
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
    mutationFn: async () => { await apiRequest('DELETE', `/api/expenses/${expense.id}`); },
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
    onError: () => { toast({ title: 'Failed to update expense', variant: 'destructive' }); },
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
    setEditCustomAmounts(Object.fromEntries(members.map(m => {
      const s = expense.splits.find(sp => sp.userId === m.userId);
      return [m.userId, s ? (s.amount / 100).toFixed(2) : ''];
    })));
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
      <div className="border-2 border-dashed border-foreground/40 p-3 space-y-2 mt-1.5 bg-background" data-testid={`expense-edit-form-${expense.id}`}>
        <div className="flex items-center gap-2">
          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-mono text-xs font-bold">Edit Expense</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Description"
            className={inputCls} data-testid={`input-edit-expense-desc-${expense.id}`} />
          <div className="flex gap-2">
            <div className="relative flex-1">
              <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input type="number" step="0.01" min="0" value={editAmount}
                onChange={e => setEditAmount(e.target.value)}
                className={`${inputCls} pl-7`} data-testid={`input-edit-expense-amount-${expense.id}`} />
            </div>
            <Select value={editCategory} onValueChange={setEditCategory}>
              <SelectTrigger className={`${selectTriggerCls} w-[130px]`} data-testid={`select-edit-expense-category-${expense.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className={labelCls}>Date</label>
            <Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)}
              className={inputCls} data-testid={`input-edit-expense-date-${expense.id}`} />
          </div>
          <div className="space-y-1">
            <label className={labelCls}><UserCircle className="h-3 w-3" /> Assigned to</label>
            <Select value={editAssignedTo || 'none'} onValueChange={setEditAssignedTo}>
              <SelectTrigger className={selectTriggerCls} data-testid={`select-edit-expense-assigned-${expense.id}`}>
                <SelectValue placeholder="Anyone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Anyone</SelectItem>
                {members.map(m => <SelectItem key={m.userId} value={m.userId}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1">
          <label className={labelCls}>Paid by</label>
          <div className="font-mono text-xs px-3 py-2 border border-foreground/30 bg-muted/10" data-testid={`text-edit-paid-by-${expense.id}`}>
            {members.find(m => m.userId === expense.paidByUserId)?.name ?? expense.paidByUserId}
            {expense.paidByUserId === currentUserId ? ' (you)' : ''}
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={labelCls}>Split</span>
            <Button size="sm" onClick={() => setEditSplitMode('equal')}
              className={editSplitMode === 'equal' ? splitBtnActive : splitBtnInactive}
              data-testid={`button-edit-split-equal-${expense.id}`}>Keep equal</Button>
            <Button size="sm" onClick={() => setEditSplitMode('custom')}
              className={editSplitMode === 'custom' ? splitBtnActive : splitBtnInactive}
              data-testid={`button-edit-split-custom-${expense.id}`}>Custom amounts</Button>
          </div>
          {editSplitMode === 'custom' && (
            <div className="space-y-1.5">
              {members.map(m => (
                <div key={m.userId} className="flex items-center gap-2">
                  <span className="font-mono text-xs flex-1 truncate">{m.name}{m.userId === currentUserId ? ' (you)' : ''}</span>
                  <div className="relative w-28">
                    <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <Input type="number" step="0.01" min="0" value={editCustomAmounts[m.userId]}
                      onChange={e => setEditCustomAmounts(prev => ({ ...prev, [m.userId]: e.target.value }))}
                      placeholder="0.00" className={`${inputCls} pl-6 h-8`}
                      data-testid={`input-edit-split-amount-${m.userId}-${expense.id}`} />
                  </div>
                </div>
              ))}
              <div className={`text-xs pt-1 ${isEditCustomValid ? 'text-green-600' : 'text-red-500'}`}>
                <span data-testid={`text-edit-split-remaining-${expense.id}`}>
                  {isEditCustomValid ? 'Amounts match total'
                    : editRemainingCents > 0
                      ? `$${(editRemainingCents / 100).toFixed(2)} remaining`
                      : `$${(Math.abs(editRemainingCents) / 100).toFixed(2)} over total`}
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="font-mono text-xs rounded-none">Cancel</Button>
          <Button size="sm" onClick={handleSaveEdit}
            disabled={!editDesc.trim() || !editAmount || parseFloat(editAmount) <= 0 || updateExpenseMutation.isPending || (editSplitMode === 'custom' && !isEditCustomValid)}
            className="bg-compass-navy text-white border-2 border-foreground rounded-none font-mono text-xs hard-shadow gap-1"
            data-testid={`button-save-edit-expense-${expense.id}`}>
            {updateExpenseMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {updateExpenseMutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-foreground/30 p-2.5 mt-1.5 bg-background" data-testid={`expense-item-${expense.id}`}>
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 border border-foreground/30 flex items-center justify-center flex-shrink-0">
          <CatIcon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-xs text-foreground truncate" data-testid={`text-expense-desc-${expense.id}`}>
              {expense.description}
            </span>
            {expense.assignedToName && (
              <span className="border border-foreground/40 px-1.5 py-0.5 font-mono text-[10px] flex items-center gap-0.5">
                <UserCircle className="h-2.5 w-2.5" />{expense.assignedToName}
              </span>
            )}
          </div>
          <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
            Paid by {expense.paidByName}{expense.date && ` · ${formatExpenseDate(expense.date)}`}
          </p>
        </div>
        <span className="font-serif text-sm font-bold flex-shrink-0" data-testid={`text-expense-amount-${expense.id}`}>
          {formatCents(expense.amount)}
        </span>
        {canEdit && (
          <Button size="icon" variant="ghost" onClick={handleStartEdit}
            className="text-muted-foreground h-7 w-7" data-testid={`button-edit-expense-${expense.id}`}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button size="icon" variant="ghost" onClick={() => setIsExpanded(!isExpanded)}
          className="text-muted-foreground h-7 w-7" data-testid={`button-expand-expense-${expense.id}`}>
          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </Button>
        {canEdit && (
          <Button size="icon" variant="ghost" onClick={() => deleteExpenseMutation.mutate()}
            disabled={deleteExpenseMutation.isPending}
            className="text-compass-maroon/60 h-7 w-7" data-testid={`button-delete-expense-${expense.id}`}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      {isExpanded && expense.splits.length > 0 && (
        <div className="mt-2 pt-2 border-t border-foreground/20 space-y-1.5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Split details</p>
          {expense.splits.map(split => (
            <div key={split.id} className="flex items-center gap-1.5" data-testid={`split-item-${split.id}`}>
              <div className="w-5 h-5 border border-foreground/30 flex items-center justify-center flex-shrink-0">
                <span className="font-mono text-[9px] font-bold">{split.userName.charAt(0).toUpperCase()}</span>
              </div>
              <span className={`flex-1 font-mono text-xs ${split.settled ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                {split.userName}
              </span>
              <span className={`font-mono text-xs ${split.settled ? 'text-muted-foreground' : 'font-bold'}`}>
                {formatCents(split.amount)}
              </span>
              <Button size="sm" onClick={() => settleMutation.mutate({ splitId: split.id, settled: !split.settled })}
                disabled={settleMutation.isPending}
                className={`text-[10px] gap-0.5 h-6 px-2 rounded-none border font-mono ${split.settled ? 'bg-compass-navy text-white border-foreground' : 'bg-background text-foreground border-foreground/50 hover:border-foreground'}`}
                data-testid={`button-settle-${split.id}`}>
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

// ── Stop edit state ────────────────────────────────────────────────────────
interface StopEditState {
  name: string;
  notes: string;
  startDate: string;
  endDate: string;
  link: string;
  confirmationNumber: string;
  attachmentType: string;
}

// ── Main TripStops ─────────────────────────────────────────────────────────
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

  const { data: stops = [], isLoading: stopsLoading } = useQuery<TripStop[]>({ queryKey: stopsQueryKey });
  const { data: expenses = [], isLoading: expensesLoading } = useQuery<ExpenseWithDetails[]>({
    queryKey: expensesQueryKey,
    enabled: isMember,
  });

  const addStopMutation = useMutation({
    mutationFn: async (data: { name: string; placeId?: string; notes?: string; startDate?: string; endDate?: string; link?: string; confirmationNumber?: string; attachmentType?: string }) => {
      const res = await apiRequest('POST', `/api/trips/${tripId}/stops`, data);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: stopsQueryKey }); resetForm(); },
  });

  const deleteStopMutation = useMutation({
    mutationFn: async (stopId: number) => { await apiRequest('DELETE', `/api/trips/${tripId}/stops/${stopId}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: stopsQueryKey }); },
  });

  const reorderMutation = useMutation({
    mutationFn: async (stopIds: number[]) => { await apiRequest('PUT', `/api/trips/${tripId}/stops/reorder`, { stopIds }); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: stopsQueryKey }); },
  });

  const { toast } = useToast();

  const updateStopMutation = useMutation({
    mutationFn: async ({ stopId, data }: { stopId: number; data: Record<string, unknown> }) => {
      const res = await apiRequest('PATCH', `/api/trips/${tripId}/stops/${stopId}`, data);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: stopsQueryKey }); setEditingStopId(null); },
    onError: () => { toast({ title: 'Failed to update stop', variant: 'destructive' }); },
  });

  const resetForm = () => {
    setName(''); setPlaceId(undefined); setNotes(''); setStartDate(''); setEndDate('');
    setLink(''); setConfirmationNumber(''); setAttachmentType(''); setShowForm(false);
  };

  const handleStartEditStop = (stop: TripStop) => {
    setStopEdit({ name: stop.name, notes: stop.notes || '', startDate: stop.startDate || '', endDate: stop.endDate || '', link: stop.link || '', confirmationNumber: stop.confirmationNumber || '', attachmentType: stop.attachmentType || '' });
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
    addStopMutation.mutate({ name: name.trim(), placeId: placeId || undefined, notes: notes.trim() || undefined, startDate: startDate || undefined, endDate: endDate || undefined, link: link.trim() || undefined, confirmationNumber: confirmationNumber.trim() || undefined, attachmentType: attachmentType || undefined });
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const ids = stops.map(s => s.id);
    [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
    reorderMutation.mutate(ids);
  };

  const handleMoveDown = (index: number) => {
    if (index === stops.length - 1) return;
    const ids = stops.map(s => s.id);
    [ids[index], ids[index + 1]] = [ids[index + 1], ids[index]];
    reorderMutation.mutate(ids);
  };

  const getStopExpenses = (stopId: number) => expenses.filter(e => e.stopId === stopId);
  const generalExpenses = expenses.filter(e => !e.stopId);
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  const isLoading = stopsLoading || (isMember && expensesLoading);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div>
      {/* Timeline */}
      <div className="relative border-l-2 border-foreground ml-4 pl-6 pb-4 space-y-8">

        {/* Empty state (no stops, can't edit) */}
        {stops.length === 0 && !showForm && !canEdit && (
          <div className="text-center py-8">
            <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="font-serif text-sm text-muted-foreground">No stops added yet</p>
          </div>
        )}

        {/* Stop cards */}
        {stops.map((stop, index) => {
          const stopExpenses = getStopExpenses(stop.id);
          return (
            <div key={stop.id} className="relative" data-testid={`stop-item-${stop.id}`}>
              {/* Timeline dot */}
              <div className="absolute -left-[33px] top-1 w-4 h-4 rounded-full border-2 border-foreground bg-background" />

              {editingStopId === stop.id ? (
                /* ── Edit form ── */
                <div className="border-2 border-dashed border-foreground/50 p-4 space-y-3 bg-muted/5" data-testid={`stop-edit-form-${stop.id}`}>
                  <div className="flex items-center gap-2">
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-mono text-xs font-bold">Edit Stop</span>
                  </div>
                  <div className="space-y-1">
                    <label className={labelCls}><MapPin className="h-3 w-3" /> Name</label>
                    <Input value={stopEdit.name} onChange={e => setStopEdit(p => ({ ...p, name: e.target.value }))}
                      placeholder="Stop name" className={inputCls} data-testid={`input-edit-stop-name-${stop.id}`} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className={labelCls}><Calendar className="h-3 w-3" /> Start</label>
                      <Input type="date" value={stopEdit.startDate} onChange={e => setStopEdit(p => ({ ...p, startDate: e.target.value }))}
                        className={inputCls} data-testid={`input-edit-stop-start-date-${stop.id}`} />
                    </div>
                    <div className="space-y-1">
                      <label className={labelCls}><Calendar className="h-3 w-3" /> End</label>
                      <Input type="date" value={stopEdit.endDate} onChange={e => setStopEdit(p => ({ ...p, endDate: e.target.value }))}
                        className={inputCls} data-testid={`input-edit-stop-end-date-${stop.id}`} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className={labelCls}><Tag className="h-3 w-3" /> Type</label>
                    <Select value={stopEdit.attachmentType} onValueChange={val => setStopEdit(p => ({ ...p, attachmentType: val }))}>
                      <SelectTrigger className={selectTriggerCls} data-testid={`select-edit-stop-type-${stop.id}`}>
                        <SelectValue placeholder="Select type (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {['Hotel Booking','Flight','Car Rental','Activity','Restaurant','Other'].map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className={labelCls}><Link2 className="h-3 w-3" /> Link</label>
                      <Input type="url" value={stopEdit.link} onChange={e => setStopEdit(p => ({ ...p, link: e.target.value }))}
                        placeholder="https://…" className={inputCls} data-testid={`input-edit-stop-link-${stop.id}`} />
                    </div>
                    <div className="space-y-1">
                      <label className={labelCls}><Hash className="h-3 w-3" /> Confirmation #</label>
                      <Input value={stopEdit.confirmationNumber} onChange={e => setStopEdit(p => ({ ...p, confirmationNumber: e.target.value }))}
                        placeholder="e.g. ABC123" className={inputCls} data-testid={`input-edit-stop-confirmation-${stop.id}`} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className={labelCls}><FileText className="h-3 w-3" /> Notes</label>
                    <Textarea value={stopEdit.notes} onChange={e => setStopEdit(p => ({ ...p, notes: e.target.value }))}
                      placeholder="Any details about this stop…" className="border-foreground/40 rounded-none min-h-[60px] resize-y text-sm font-serif"
                      data-testid={`input-edit-stop-notes-${stop.id}`} />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setEditingStopId(null)} className="font-mono text-xs rounded-none">Cancel</Button>
                    <Button size="sm" onClick={() => handleSaveEditStop(stop.id)}
                      disabled={!stopEdit.name.trim() || updateStopMutation.isPending}
                      className="bg-compass-navy text-white border-2 border-foreground rounded-none font-mono text-xs hard-shadow gap-1"
                      data-testid={`button-save-edit-stop-${stop.id}`}>
                      {updateStopMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {updateStopMutation.isPending ? 'Saving…' : 'Save'}
                    </Button>
                  </div>
                </div>
              ) : (
                /* ── Stop display ── */
                <div className="border-2 border-foreground hard-shadow bg-background p-4">
                  {/* Header row */}
                  <div className="flex justify-between items-start border-b border-dashed border-foreground/40 pb-2 mb-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-serif text-base font-semibold truncate">{stop.name}</h3>
                      {(stop.startDate || stop.endDate) && (
                        <span className="font-mono text-xs text-muted-foreground">
                          {stop.startDate && formatStopDate(stop.startDate)}
                          {stop.startDate && stop.endDate && ' – '}
                          {stop.endDate && formatStopDate(stop.endDate)}
                        </span>
                      )}
                    </div>
                    {canEdit && (
                      <div className="flex items-center gap-0.5 flex-shrink-0 ml-2">
                        <Button size="icon" variant="ghost" onClick={() => handleStartEditStop(stop)}
                          className="h-7 w-7 text-muted-foreground" data-testid={`button-edit-stop-${stop.id}`}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleMoveUp(index)}
                          disabled={index === 0 || reorderMutation.isPending}
                          className="h-7 w-7 text-muted-foreground">
                          <ChevronUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleMoveDown(index)}
                          disabled={index === stops.length - 1 || reorderMutation.isPending}
                          className="h-7 w-7 text-muted-foreground">
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteStopMutation.mutate(stop.id)}
                          disabled={deleteStopMutation.isPending}
                          className="h-7 w-7 text-compass-maroon/60" data-testid={`button-delete-stop-${stop.id}`}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {stop.notes && (
                    <p className="font-serif text-sm text-muted-foreground mb-3 line-clamp-3">{stop.notes}</p>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {stop.attachmentType && (
                      <span className="border border-foreground px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider" data-testid={`badge-attachment-type-${stop.id}`}>
                        {stop.attachmentType}
                      </span>
                    )}
                    {stop.confirmationNumber && (
                      <button
                        className="border border-foreground px-2 py-0.5 font-mono text-[10px] flex items-center gap-1 hover:bg-muted/30"
                        onClick={() => handleCopyConfirmation(stop.id, stop.confirmationNumber!)}
                        data-testid={`badge-confirmation-${stop.id}`}
                      >
                        <Hash className="h-2.5 w-2.5" />{stop.confirmationNumber}
                        {copiedId === stop.id ? <Check className="h-2.5 w-2.5 text-green-600" /> : <Copy className="h-2.5 w-2.5" />}
                      </button>
                    )}
                    {stop.link && (
                      <a href={stop.link} target="_blank" rel="noopener noreferrer"
                        className="border border-foreground px-2 py-0.5 font-mono text-[10px] flex items-center gap-1 hover:bg-muted/30"
                        data-testid={`link-stop-url-${stop.id}`}>
                        <ExternalLink className="h-2.5 w-2.5" />View Link
                      </a>
                    )}
                  </div>

                  {/* Expenses for this stop */}
                  {isMember && currentUserId && (
                    <div className="mt-3">
                      {stopExpenses.length > 0 && (
                        <div className="space-y-1">
                          {stopExpenses.map(exp => (
                            <ExpenseItem key={exp.id} expense={exp} currentUserId={currentUserId}
                              isOwner={isOwner} tripId={tripId}
                              members={members.length > 0 ? members : [{ userId: currentUserId, name: 'You' }]} />
                          ))}
                        </div>
                      )}
                      {expenseFormStopId === stop.id ? (
                        <InlineExpenseForm tripId={tripId} stopId={stop.id} currentUserId={currentUserId}
                          members={members.length > 0 ? members : [{ userId: currentUserId, name: 'You' }]}
                          onClose={() => setExpenseFormStopId(null)} />
                      ) : (
                        <button
                          onClick={() => setExpenseFormStopId(stop.id)}
                          className="border border-foreground/30 font-mono text-[10px] px-2 py-0.5 hover:bg-muted/20 mt-2 flex items-center gap-1 text-muted-foreground"
                          data-testid={`button-add-expense-stop-${stop.id}`}
                        >
                          <DollarSign className="h-2.5 w-2.5" />Add Expense
                        </button>
                      )}
                      {stopExpenses.length > 0 && (
                        <div className="flex justify-end mt-1">
                          <span className="font-mono text-[10px] text-muted-foreground">
                            Stop total: {formatCents(stopExpenses.reduce((s, e) => s + e.amount, 0))}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Add Stop form (in timeline) */}
        {showForm && (
          <div className="relative">
            <div className="absolute -left-[33px] top-2 w-4 h-4 rounded-full border border-dashed border-foreground bg-background" />
            <div className="border-2 border-dashed border-foreground/50 p-4 space-y-4 bg-muted/5">
              <div className="space-y-2">
                <label className={`${labelCls} text-sm`}><MapPin className="h-3.5 w-3.5" /> Stop Name</label>
                <PlacesSearch
                  onSelect={(s: PlaceSuggestion) => { setName(s.description); setPlaceId(s.placeId); }}
                  placeholder="Search for a place…"
                  defaultType="attraction"
                  showTypeFilter={false}
                />
                <Input value={name} onChange={e => setName(e.target.value)}
                  placeholder="Or type a name manually" className={inputCls} data-testid="input-stop-name" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={labelCls}><Calendar className="h-3 w-3" /> Start Date</label>
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}><Calendar className="h-3 w-3" /> End Date</label>
                  <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputCls} />
                </div>
              </div>
              <div className="space-y-1">
                <label className={labelCls}><Tag className="h-3 w-3" /> Type</label>
                <Select value={attachmentType} onValueChange={setAttachmentType}>
                  <SelectTrigger className={selectTriggerCls} data-testid="select-attachment-type">
                    <SelectValue placeholder="Select type (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {['Hotel Booking','Flight','Car Rental','Activity','Restaurant','Other'].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={labelCls}><Link2 className="h-3 w-3" /> Link</label>
                  <Input type="url" value={link} onChange={e => setLink(e.target.value)}
                    placeholder="https://…" className={inputCls} data-testid="input-stop-link" />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}><Hash className="h-3 w-3" /> Confirmation #</label>
                  <Input value={confirmationNumber} onChange={e => setConfirmationNumber(e.target.value)}
                    placeholder="e.g. ABC123" className={inputCls} data-testid="input-stop-confirmation" />
                </div>
              </div>
              <div className="space-y-1">
                <label className={labelCls}><FileText className="h-3 w-3" /> Notes</label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Any details about this stop…"
                  className="border-foreground/40 rounded-none min-h-[60px] resize-y text-sm font-serif" />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={resetForm} className="font-mono text-xs rounded-none">Cancel</Button>
                <Button size="sm" onClick={handleSaveStop} disabled={!name.trim() || addStopMutation.isPending}
                  className="bg-compass-navy text-white border-2 border-foreground rounded-none font-mono text-xs hard-shadow gap-1"
                  data-testid="button-save-stop">
                  {addStopMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {addStopMutation.isPending ? 'Saving…' : 'Save Stop'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Append Stop button */}
        {canEdit && !showForm && (
          <div className="relative">
            <div className="absolute -left-[33px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-dashed border-foreground/50 bg-background" />
            <button
              onClick={() => setShowForm(true)}
              className="w-full border-2 border-dashed border-foreground/40 p-4 flex justify-center items-center gap-2 hover:bg-muted/20 transition-colors font-mono text-xs text-muted-foreground"
              data-testid="button-add-stop"
            >
              <Plus className="h-4 w-4" /> Append Stop
            </button>
          </div>
        )}
      </div>

      {/* General Expenses */}
      {isMember && currentUserId && (
        <div className="border-t-2 border-foreground pt-6 mt-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <Receipt className="h-3 w-3" /> General Expenses
            </h3>
            {expenseFormStopId !== 'general' && (
              <button
                onClick={() => setExpenseFormStopId('general')}
                className="border border-foreground/40 font-mono text-[10px] px-2 py-0.5 hover:bg-muted/30 flex items-center gap-1 text-muted-foreground"
                data-testid="button-add-general-expense"
              >
                <Plus className="h-2.5 w-2.5" /> Add
              </button>
            )}
          </div>

          {expenseFormStopId === 'general' && (
            <InlineExpenseForm tripId={tripId} stopId={null} currentUserId={currentUserId}
              members={members.length > 0 ? members : [{ userId: currentUserId, name: 'You' }]}
              onClose={() => setExpenseFormStopId(null)} />
          )}

          {generalExpenses.length > 0 ? (
            <div className="space-y-1">
              {generalExpenses.map(exp => (
                <ExpenseItem key={exp.id} expense={exp} currentUserId={currentUserId}
                  isOwner={isOwner} tripId={tripId}
                  members={members.length > 0 ? members : [{ userId: currentUserId, name: 'You' }]} />
              ))}
            </div>
          ) : (
            expenseFormStopId !== 'general' && (
              <p className="font-mono text-xs text-muted-foreground text-center py-2">No general expenses yet</p>
            )
          )}
        </div>
      )}

      {/* Trip Total */}
      {isMember && expenses.length > 0 && (
        <div className="border-t-2 border-foreground pt-3 mt-4 flex items-center justify-between">
          <span className="font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5" /> Trip Total
          </span>
          <span className="font-serif text-lg font-bold" data-testid="text-trip-total">
            {formatCents(totalSpent)}
          </span>
        </div>
      )}
    </div>
  );
}
