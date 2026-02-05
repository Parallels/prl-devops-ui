import React, { useState } from 'react';
import { PlaygroundSection } from '../PlaygroundSection';
import { KeyValueArrayField, Input } from '../../..';
import type { KeyValuePair } from '../../../controls/KeyValueArrayField';

export const KeyValueFieldDemo: React.FC = () => {
    const [keyValuePairs, setKeyValuePairs] = useState<KeyValuePair[]>([
        { key: 'ENV', value: 'production' },
        { key: 'DEBUG', value: 'false' },
        { key: 'host', value: 'localhost' },
        { key: 'port', value: '27017' },
    ]);

    return (
        <PlaygroundSection
            title="Key/Value Array"
            label="[KeyValueArrayField]"
            description="Collect arbitrary metadata pairs."
            controls={
                <div className="space-y-4 text-sm">
                    <label className="flex flex-col gap-2">
                        <span>Add button label</span>
                        <Input size="sm" value="Add entry" readOnly />
                        <span className="text-xs text-neutral-500">(Static in demo)</span>
                    </label>
                </div>
            }
            preview={
                <KeyValueArrayField
                    label="Metadata"
                    hint="Store extra settings via key/value pairs"
                    value={keyValuePairs}
                    onChange={setKeyValuePairs}
                    help="Use this field to supply extra environment variables or service metadata."
                />
            }
        />
    );
};
