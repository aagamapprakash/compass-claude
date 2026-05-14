import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, Building2, Utensils, Landmark, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type PlaceType = 'all' | 'destination' | 'hotel' | 'restaurant' | 'attraction';

export interface PlaceSuggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
  description: string;
  types: string[];
}

export interface PlaceDetails {
  id: string;
  name: string;
  address: string;
  rating?: number;
  userRatingCount?: number;
  photoUrl?: string;
  photos?: string[];
  description?: string;
  types: string[];
  priceLevel?: string;
  website?: string;
  phone?: string;
  openingHours?: string[];
  location?: { latitude: number; longitude: number };
}

interface PlacesSearchProps {
  onSelect: (place: PlaceSuggestion, details?: PlaceDetails) => void;
  placeholder?: string;
  defaultType?: PlaceType;
  showTypeFilter?: boolean;
  className?: string;
  value?: string;
  fetchDetails?: boolean;
  onTypeChange?: (type: PlaceType) => void;
}

const TYPE_OPTIONS: { value: PlaceType; label: string; icon: typeof Search }[] = [
  { value: 'all', label: 'All', icon: Search },
  { value: 'destination', label: 'Cities', icon: MapPin },
  { value: 'hotel', label: 'Hotels', icon: Building2 },
  { value: 'restaurant', label: 'Restaurants', icon: Utensils },
  { value: 'attraction', label: 'Attractions', icon: Landmark },
];

export default function PlacesSearch({
  onSelect,
  placeholder = 'Search for a place...',
  defaultType = 'all',
  showTypeFilter = true,
  className,
  value: controlledValue,
  fetchDetails = false,
  onTypeChange,
}: PlacesSearchProps) {
  const [inputValue, setInputValue] = useState(controlledValue || '');
  const [selectedType, setSelectedType] = useState<PlaceType>(defaultType);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (controlledValue !== undefined) {
      setInputValue(controlledValue);
    }
  }, [controlledValue]);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        input: query,
        ...(selectedType !== 'all' && { types: selectedType }),
      });

      const response = await fetch(`/api/places/autocomplete?${params}`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        setShowDropdown(true);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedType]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (inputValue.length >= 2) {
      debounceRef.current = setTimeout(() => {
        fetchSuggestions(inputValue);
      }, 300);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [inputValue, fetchSuggestions]);

  const fetchPlaceDetails = async (placeId: string): Promise<PlaceDetails | undefined> => {
    try {
      const response = await fetch(`/api/places/${placeId}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
    }
    return undefined;
  };

  const handleSelect = async (suggestion: PlaceSuggestion) => {
    setInputValue(suggestion.description);
    setShowDropdown(false);
    setSuggestions([]);

    if (fetchDetails) {
      const details = await fetchPlaceDetails(suggestion.placeId);
      onSelect(suggestion, details);
    } else {
      onSelect(suggestion);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelect(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        break;
    }
  };

  const clearInput = () => {
    setInputValue('');
    setSuggestions([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPlaceIcon = (types: string[]) => {
    if (types.some(t => t.includes('lodging') || t.includes('hotel'))) {
      return <Building2 className="h-4 w-4 text-compass-maroon" />;
    }
    if (types.some(t => t.includes('restaurant') || t.includes('food') || t.includes('cafe'))) {
      return <Utensils className="h-4 w-4 text-compass-gold" />;
    }
    if (types.some(t => t.includes('tourist') || t.includes('museum') || t.includes('park'))) {
      return <Landmark className="h-4 w-4 text-compass-navy" />;
    }
    return <MapPin className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className={cn('relative', className)}>
      {showTypeFilter && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {TYPE_OPTIONS.map((type) => {
            const Icon = type.icon;
            return (
              <Badge
                key={type.value}
                variant={selectedType === type.value ? 'default' : 'outline'}
                className={cn(
                  'cursor-pointer transition-all gap-1.5 px-3 py-1.5',
                  selectedType === type.value
                    ? 'bg-compass-navy text-white hover:bg-compass-navy/90'
                    : 'hover:bg-compass-navy/10 border-compass-navy/20'
                )}
                onClick={() => {
                  setSelectedType(type.value);
                  onTypeChange?.(type.value);
                  if (inputValue.length >= 2) {
                    fetchSuggestions(inputValue);
                  }
                }}
                data-testid={`filter-${type.value}`}
              >
                <Icon className="h-3 w-3" />
                {type.label}
              </Badge>
            );
          })}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowDropdown(true);
            }
          }}
          placeholder={placeholder}
          className="pl-10 pr-10 h-12 rounded-xl border-compass-navy/20 focus:border-compass-navy focus:ring-compass-navy/20"
          data-testid="input-places-search"
        />
        {isLoading && (
          <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {inputValue && !isLoading && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={clearInput}
            data-testid="button-clear-search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-background border border-compass-navy/20 rounded-xl shadow-lg overflow-hidden max-h-80 overflow-y-auto"
          data-testid="dropdown-suggestions"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.placeId}
              type="button"
              className={cn(
                'w-full px-4 py-3 flex items-start gap-3 text-left transition-colors',
                index === highlightedIndex
                  ? 'bg-compass-navy/10'
                  : 'hover:bg-compass-navy/5'
              )}
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
              data-testid={`suggestion-${index}`}
            >
              <div className="mt-0.5">
                {getPlaceIcon(suggestion.types)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-compass-navy truncate">
                  {suggestion.mainText}
                </div>
                <div className="text-sm text-muted-foreground truncate">
                  {suggestion.secondaryText}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showDropdown && inputValue.length >= 2 && suggestions.length === 0 && !isLoading && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-background border border-compass-navy/20 rounded-xl shadow-lg p-4 text-center text-muted-foreground"
        >
          No places found for "{inputValue}"
        </div>
      )}
    </div>
  );
}
