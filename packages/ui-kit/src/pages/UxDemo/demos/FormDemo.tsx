import React, { useState } from 'react';
import { PlaygroundSection } from '../PlaygroundSection';
import { FormSection, FormLayout, FormField, Select, Toggle, Input } from '../../..';

export const FormDemo: React.FC = () => {
    const [formFieldValidation, setFormFieldValidation] = useState<'none' | 'error' | 'success'>('none');
    const [formFieldRequired, setFormFieldRequired] = useState(false);
    const [formFieldLayout, setFormFieldLayout] = useState<'stacked' | 'inline'>('stacked');
    const [formFieldWidth, setFormFieldWidth] = useState<'auto' | 'full'>('full');

    const [formLayoutColumns, setFormLayoutColumns] = useState<1 | 2 | 3>(1);
    const [formLayoutGap] = useState<'sm' | 'md' | 'lg'>('md');

    const [formSectionPadding, setFormSectionPadding] = useState<'sm' | 'md' | 'lg'>('md');

    return (
        <PlaygroundSection
            title="Form Components"
            label="[FormSection, FormLayout, FormField]"
            description="Components for building structured forms."
            controls={
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-neutral-500">Field Layout</label>
                            <Select
                                value={formFieldLayout}
                                onChange={(e) => setFormFieldLayout(e.target.value as "stacked" | "inline")}
                            >
                                <option value="stacked">Stacked</option>
                                <option value="inline">Inline</option>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-neutral-500">Field Validation</label>
                            <Select
                                value={formFieldValidation}
                                onChange={(e) => setFormFieldValidation(e.target.value as "none" | "error" | "success")}
                            >
                                <option value="none">None</option>
                                <option value="error">Error</option>
                                <option value="success">Success</option>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-neutral-500">Layout Columns</label>
                            <Select
                                value={formLayoutColumns.toString()}
                                onChange={(e) => setFormLayoutColumns(Number(e.target.value) as 1 | 2 | 3)}
                            >
                                <option value="1">1 Column</option>
                                <option value="2">2 Columns</option>
                                <option value="3">3 Columns</option>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-neutral-500">Section Padding</label>
                            <Select
                                value={formSectionPadding}
                                onChange={(e) => setFormSectionPadding(e.target.value as "sm" | "md" | "lg")}
                            >
                                <option value="sm">Small</option>
                                <option value="md">Medium</option>
                                <option value="lg">Large</option>
                            </Select>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <Toggle
                            label="Field Required"
                            checked={formFieldRequired}
                            onChange={(e) => setFormFieldRequired(e.target.checked)}
                        />
                        <Toggle
                            label="Field Full Width"
                            checked={formFieldWidth === 'full'}
                            onChange={(e) => setFormFieldWidth(e.target.checked ? 'full' : 'auto')}
                        />
                    </div>
                </div>
            }
            preview={
                <div className="w-full rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
                    <FormSection
                        title="User Settings"
                        description="Manage your account preferences."
                        padding={formSectionPadding}
                    >
                        <FormLayout columns={formLayoutColumns} gap={formLayoutGap}>
                            <FormField
                                label="Username"
                                hint="This will be public."
                                required={formFieldRequired}
                                layout={formFieldLayout}
                                width={formFieldWidth}
                                validationStatus={formFieldValidation}
                            >
                                <Input placeholder="jdoe" />
                            </FormField>
                            <FormField
                                label="Email"
                                required={formFieldRequired}
                                layout={formFieldLayout}
                                width={formFieldWidth}
                            >
                                <Input placeholder="john@example.com" />
                            </FormField>
                        </FormLayout>
                    </FormSection>
                </div>
            }
        />
    );
};
