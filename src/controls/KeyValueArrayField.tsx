import React, { useEffect, useState } from 'react';
import Button from './Button';
import CollapsibleHelpText from './CollapsibleHelpText';
import Input from './Input';

export interface KeyValuePair {
  key: string;
  value: string;
}

export interface KeyValueArrayFieldProps {
  label: string;
  hint?: string;
  value: KeyValuePair[];
  onChange: (value: KeyValuePair[]) => void;
  error?: string;
  help?: string;
  isVisible?: boolean;
  addLabel?: string;
}

const KeyValueArrayField: React.FC<KeyValueArrayFieldProps> = ({
  label,
  hint,
  value,
  onChange,
  error,
  help,
  isVisible = true,
  addLabel,
}) => {
  const [pairs, setPairs] = useState(value || []);

  useEffect(() => {
    setPairs(value || []);
  }, [value]);

  const handleAddPair = () => {
    const nextPairs = [...pairs, { key: '', value: '' }];
    setPairs(nextPairs);
    onChange(nextPairs);
  };

  const handleRemovePair = (index: number) => {
    const nextPairs = pairs.filter((_, i) => i !== index);
    setPairs(nextPairs);
    onChange(nextPairs);
  };

  const handlePairChange = (index: number, field: 'key' | 'value', fieldValue: string) => {
    const nextPairs = pairs.map((pair, i) =>
      i === index ? { ...pair, [field]: fieldValue } : pair
    );
    setPairs(nextPairs);
    onChange(nextPairs);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/50">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</span>
        {hint && <span className="text-xs text-slate-500 dark:text-slate-400">{hint}</span>}
      </div>
      {help && <CollapsibleHelpText text={help} tone="indigo" maxLength={200} showIcon />}
      <div className="space-y-3">
        {pairs.map((pair, index) => (
          <div key={`${pair.key}-${index}`} className="flex flex-wrap gap-3">
            <Input
              className="flex-1 min-w-[140px]"
              size="sm"
              placeholder="Key"
              value={pair.key}
              onChange={(event) => handlePairChange(index, 'key', event.target.value)}
            />
            <Input
              className="flex-1 min-w-[140px]"
              size="sm"
              placeholder="Value"
              value={pair.value}
              onChange={(event) => handlePairChange(index, 'value', event.target.value)}
            />
            <Button
              variant="soft"
              color="rose"
              size="sm"
              onClick={() => handleRemovePair(index)}
              className="flex-shrink-0"
            >
              Remove
            </Button>
          </div>
        ))}
      </div>
      <Button variant="outline" color="blue" size="sm" onClick={handleAddPair}>
        {addLabel ?? `Add ${label}`}
      </Button>
      {error && <span className="text-xs text-rose-500">{error}</span>}
    </div>
  );
};

export default KeyValueArrayField;
