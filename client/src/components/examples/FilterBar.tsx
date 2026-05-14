import { useState } from 'react';
import FilterBar, { type FilterOption } from '../FilterBar';

export default function FilterBarExample() {
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
  const counts = { all: 12, upcoming: 5, current: 2, past: 5 };

  return (
    <FilterBar
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
      counts={counts}
    />
  );
}
