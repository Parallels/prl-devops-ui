import React from 'react';
import { Button, Input } from '@prl/ui-kit';

export interface HeaderRow {
    key: string;
    value: string;
}

interface HeaderEditorProps {
    rows: HeaderRow[];
    onChange: (rows: HeaderRow[]) => void;
    onDirty: () => void;
    disabled: boolean;
    emptyLabel: string;
    addLabel: string;
}

/** Editable list of key/value HTTP header pairs. */
const HeaderEditor: React.FC<HeaderEditorProps> = ({
    rows, onChange, onDirty, disabled, emptyLabel, addLabel,
}) => {
    const update = (i: number, patch: Partial<HeaderRow>) => {
        onChange(rows.map((r, j) => j === i ? { ...r, ...patch } : r));
        onDirty();
    };

    return (
        <div className="space-y-2">
            {rows.length === 0 && (
                <p className="text-xs text-neutral-400 dark:text-neutral-500 italic">{emptyLabel}</p>
            )}
            {rows.map((row, i) => (
                <div key={i} className="flex gap-2">
                    <Input
                        placeholder="Header name"
                        value={row.key}
                        onChange={e => update(i, { key: e.target.value })}
                        className="font-mono flex-1"
                        size="sm"
                        disabled={disabled}
                    />
                    <Input
                        placeholder="Value"
                        value={row.value}
                        onChange={e => update(i, { value: e.target.value })}
                        className="font-mono flex-1"
                        size="sm"
                        disabled={disabled}
                    />
                    {!disabled && (
                        <Button
                            variant="ghost" color="rose" size="sm" leadingIcon="Trash"
                            onClick={() => { onChange(rows.filter((_, j) => j !== i)); onDirty(); }}
                        />
                    )}
                </div>
            ))}
            {!disabled && (
                <Button
                    variant="outline" color="slate" size="sm" leadingIcon="Add"
                    onClick={() => { onChange([...rows, { key: '', value: '' }]); onDirty(); }}
                >
                    {addLabel}
                </Button>
            )}
        </div>
    );
};

export default HeaderEditor;
