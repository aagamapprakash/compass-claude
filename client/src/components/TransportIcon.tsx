export type TransportMode = 'airplane' | 'train' | 'car' | 'bus' | 'other';

interface TransportIconProps {
  mode: TransportMode;
  size?: 'sm' | 'md' | 'lg';
}

const transportEmojis: Record<TransportMode, string> = {
  airplane: '\u2708\uFE0F',
  train: '\uD83D\uDE86',
  car: '\uD83D\uDE97',
  bus: '\uD83D\uDE8C',
  other: '\uD83D\uDDFA\uFE0F',
};

const sizeClasses = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-4xl',
};

export default function TransportIcon({ mode, size = 'md' }: TransportIconProps) {
  return (
    <span className={sizeClasses[size]} role="img" aria-label={mode}>
      {transportEmojis[mode]}
    </span>
  );
}
