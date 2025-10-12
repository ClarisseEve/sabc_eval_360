import React from 'react';
import { cn } from '@/utils/helpers';

export interface RangeSliderProps extends React.HTMLAttributes<HTMLDivElement> {
  min?: number;
  max?: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  formatLabel?: (value: number) => string;
  disabled?: boolean;
  marks?: Array<{ value: number; label: string }>;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const snapToStep = (value: number, min: number, max: number, step: number) => {
  const bounded = clamp(value, min, max);
  const snapped = Math.round((bounded - min) / step) * step + min;
  return clamp(Number(snapped.toFixed(5)), min, max);
};

export const RangeSlider: React.FC<RangeSliderProps> = ({
  className,
  min = 0,
  max = 100,
  step = 1,
  value,
  onChange,
  disabled = false,
  formatLabel,
  marks = [],
  ...props
}) => {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [activeHandle, setActiveHandle] = React.useState<'min' | 'max' | null>(null);
  const [minValue, maxValue] = value;

  const format = React.useCallback((val: number) => (formatLabel ? formatLabel(val) : val.toString()), [formatLabel]);

  const updateMin = React.useCallback(
    (next: number) => {
      const snapped = snapToStep(next, min, max, step);
      const limited = Math.min(snapped, maxValue - step);
      const safe = clamp(limited, min, max - step);
      if (safe !== minValue) {
        onChange([safe, maxValue]);
      }
    },
    [max, maxValue, min, minValue, onChange, step]
  );

  const updateMax = React.useCallback(
    (next: number) => {
      const snapped = snapToStep(next, min, max, step);
      const limited = Math.max(snapped, minValue + step);
      const safe = clamp(limited, min + step, max);
      if (safe !== maxValue) {
        onChange([minValue, safe]);
      }
    },
    [max, maxValue, min, minValue, onChange, step]
  );

  const valueFromClientX = React.useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return null;
      const rect = track.getBoundingClientRect();
      if (rect.width === 0) return null;
      const ratio = (clientX - rect.left) / rect.width;
      const raw = min + ratio * (max - min);
      return snapToStep(raw, min, max, step);
    },
    [max, min, step]
  );

  const handlePointerMove = React.useCallback(
    (event: PointerEvent) => {
      if (disabled || !activeHandle) return;
      const next = valueFromClientX(event.clientX);
      if (next === null) return;
      if (activeHandle === 'min') {
        updateMin(next);
      } else {
        updateMax(next);
      }
    },
    [activeHandle, disabled, updateMax, updateMin, valueFromClientX]
  );

  React.useEffect(() => {
    if (!activeHandle) return;

    const handlePointerUp = () => setActiveHandle(null);

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [activeHandle, handlePointerMove]);

  const startDrag = React.useCallback(
    (handle: 'min' | 'max') => (event: React.PointerEvent<HTMLButtonElement>) => {
      if (disabled) return;
      event.preventDefault();
      (event.target as HTMLButtonElement).focus();
      setActiveHandle(handle);
    },
    [disabled]
  );

  const handleTrackPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    event.preventDefault();
    const next = valueFromClientX(event.clientX);
    if (next === null) return;
    const distanceToMin = Math.abs(next - minValue);
    const distanceToMax = Math.abs(next - maxValue);
    if (distanceToMin <= distanceToMax) {
      updateMin(next);
      setActiveHandle('min');
    } else {
      updateMax(next);
      setActiveHandle('max');
    }
  };

  const handleKeyDown = React.useCallback(
    (handle: 'min' | 'max') => (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return;
      let delta = 0;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') delta = -step;
      if (event.key === 'ArrowRight' || event.key === 'ArrowUp') delta = step;
      if (delta === 0) return;
      event.preventDefault();
      if (handle === 'min') {
        updateMin(minValue + delta);
      } else {
        updateMax(maxValue + delta);
      }
    },
    [disabled, maxValue, minValue, step, updateMax, updateMin]
  );

  const minPercent = ((minValue - min) / (max - min)) * 100;
  const maxPercent = ((maxValue - min) / (max - min)) * 100;

  return (
    <div className={cn('select-none', className)} {...props}>
      <div className="flex items-center justify-between text-xs text-sabc-gray-500">
        <span>
          Min : <strong className="text-sabc-gray-700">{format(minValue)}</strong>
        </span>
        <span>
          Max : <strong className="text-sabc-gray-700">{format(maxValue)}</strong>
        </span>
      </div>

      <div
        ref={trackRef}
        className={cn(
          'relative mt-3 h-12 rounded-md bg-transparent px-1',
          disabled && 'cursor-not-allowed opacity-60'
        )}
        onPointerDown={handleTrackPointerDown}
      >
        <div className="absolute left-1 right-1 top-1/2 h-1 -translate-y-1/2 rounded-full bg-sabc-gray-200" />

        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-sabc-red-primary"
          style={{ left: `calc(${minPercent}% + 0.25rem)`, right: `calc(${100 - maxPercent}% + 0.25rem)` }}
        />

        <button
          type="button"
          className={cn(
            'absolute top-1/2 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-sabc-red-primary shadow focus:outline-none focus:ring-2 focus:ring-sabc-red-primary/40',
            !disabled ? 'cursor-pointer' : 'cursor-not-allowed'
          )}
          style={{ left: `calc(${minPercent}% + 0.25rem)` }}
          onPointerDown={startDrag('min')}
          onKeyDown={handleKeyDown('min')}
          role="slider"
          aria-label="Valeur minimale"
          aria-valuemin={min}
          aria-valuemax={maxValue - step}
          aria-valuenow={minValue}
          aria-disabled={disabled}
        />

        <button
          type="button"
          className={cn(
            'absolute top-1/2 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-sabc-red-primary shadow focus:outline-none focus:ring-2 focus:ring-sabc-red-primary/40',
            !disabled ? 'cursor-pointer' : 'cursor-not-allowed'
          )}
          style={{ left: `calc(${maxPercent}% + 0.25rem)` }}
          onPointerDown={startDrag('max')}
          onKeyDown={handleKeyDown('max')}
          role="slider"
          aria-label="Valeur maximale"
          aria-valuemin={minValue + step}
          aria-valuemax={max}
          aria-valuenow={maxValue}
          aria-disabled={disabled}
        />
      </div>

      {marks.length > 0 && (
        <div className="mt-1 flex flex-wrap items-center justify-between text-[11px] text-sabc-gray-400">
          {marks.map(mark => (
            <span key={mark.value}>{mark.label}</span>
          ))}
        </div>
      )}
    </div>
  );
};

export default RangeSlider;
