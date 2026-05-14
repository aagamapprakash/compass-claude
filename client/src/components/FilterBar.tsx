import { NeonButton } from '@/components/ui/neon-button';
import type { TripStatus } from './StatusBadge';

export type FilterOption = 'all' | TripStatus;

interface FilterBarProps {
  activeFilter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
  counts?: Record<FilterOption, number>;
}

const filters: { value: FilterOption; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'current', label: 'Active' },
  { value: 'past', label: 'Past' },
];

export default function FilterBar({ activeFilter, onFilterChange, counts }: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2" data-testid="filter-bar">
      {filters.map((filter) => {
        const isActive = activeFilter === filter.value;
        return (
          <NeonButton
            key={filter.value}
            variant={isActive ? "solid" : "outline"}
            size="sm"
            neon={isActive}
            neonColor="gold"
            onClick={() => onFilterChange(filter.value)}
            className={isActive ? 'shadow-soft' : ''}
            data-testid={`filter-${filter.value}`}
          >
            {filter.label}
            {counts && counts[filter.value] !== undefined && (
              <span className={`ml-1.5 text-xs ${isActive ? 'text-white/70' : 'text-compass-navy/50'}`}>
                {counts[filter.value]}
              </span>
            )}
          </NeonButton>
        );
      })}
    </div>
  );
}
