// @ts-nocheck
import React, { useState } from 'react';
import { PlaygroundSection } from '../PlaygroundSection';
import { Accordion, MultiToggle, Toggle, Button, useAccordion } from '../../..';
import {
    AccordionVariant,
    AccordionSize,
    AccordionIndicator,
    AccordionChevronPlacement,
} from '../../..';
import { PanelTone } from '../../..';
import {
    accordionVariantOptions,
    accordionSizeOptions,
    accordionIndicatorOptions,
    accordionChevronPlacementOptions,
    panelToneOptions,
} from '../constants';

export const AccordionDemo: React.FC = () => {
    const [accordionVariant, setAccordionVariant] = useState<AccordionVariant>('default');
    const [accordionTone, setAccordionTone] = useState<PanelTone>('neutral');
    const [accordionSize, setAccordionSize] = useState<AccordionSize>('md');
    const [accordionIndicator, setAccordionIndicator] = useState<AccordionIndicator>('chevron');
    const [accordionChevronPlacement, setAccordionChevronPlacement] =
        useState<AccordionChevronPlacement>('left');
    const [accordionAllowMultipleOpen, setAccordionAllowMultipleOpen] = useState<boolean>(false);
    const [loadingAccordionIds, setLoadingAccordionIds] = useState<string[]>([]);

    const accordion = useAccordion({
        defaultOpenIds: ['region-us'],
        multiple: false,
    });

    const handleAccordionRefresh = (id: string) => {
        setLoadingAccordionIds((ids) => [...ids, id]);
        setTimeout(() => {
            setLoadingAccordionIds((ids) => ids.filter((item) => item !== id));
        }, 1500);
    };

    const accordionItems = [
        {
            id: 'region-us',
            title: 'United States',
            subtitle: 'us-east-1 · N. Virginia',
            description: 'Low latency for east coast workloads.',
            badge: 'Primary',
            content: (
                <div className="space-y-2">
                    <p>
                        Availability zones: <strong>3</strong>
                    </p>
                    <p>Average latency: 22 ms</p>
                    <ul className="list-disc pl-5 text-sm">
                        <li>GPU instances available</li>
                        <li>Supports spot capacity</li>
                    </ul>
                </div>
            ),
            actions: (
                <Button
                    size="sm"
                    variant="ghost"
                    color="blue"
                    onClick={() => handleAccordionRefresh('region-us')}
                >
                    Refresh
                </Button>
            ),
            loading: loadingAccordionIds.includes('region-us'),
        },
        {
            id: 'region-eu',
            title: 'Europe',
            subtitle: 'eu-central-1 · Frankfurt',
            description: 'Ideal for GDPR-compliant workloads.',
            badge: 'High demand',
            content: (
                <div className="space-y-2">
                    <p>Availability zones: 2</p>
                    <p>Average latency: 39 ms</p>
                    <p>Maintenance window: Sundays 02:00–04:00 CET</p>
                </div>
            ),
            actions: (
                <Button size="sm" variant="ghost" color="slate">
                    View metrics
                </Button>
            ),
        },
        {
            id: 'region-apac',
            title: 'Asia Pacific',
            subtitle: 'ap-southeast-1 · Singapore',
            description: 'Great for APAC users and low-latency APIs.',
            content: (
                <div className="space-y-2">
                    <p>Availability zones: 3</p>
                    <p>Average latency: 55 ms</p>
                    <p>Dedicated bare-metal hosts available on request.</p>
                </div>
            ),
        },
    ];

    return (
        <PlaygroundSection
            title="Accordion"
            label="[Accordion]"
            description="Stacked disclosure list with multiple variants."
            controls={
                <div className="space-y-4 text-sm">
                    <div className="grid gap-3 md:grid-cols-2">
                        <label className="flex flex-col gap-2">
                            <span>Variant</span>
                            <MultiToggle
                                fullWidth
                                options={accordionVariantOptions}
                                value={accordionVariant}
                                size="sm"
                                onChange={(value) => setAccordionVariant(value as AccordionVariant)}
                            />
                        </label>
                        <label className="flex flex-col gap-2">
                            <span>Tone</span>
                            <MultiToggle
                                fullWidth
                                options={panelToneOptions}
                                value={accordionTone}
                                size="sm"
                                onChange={(value) => setAccordionTone(value as PanelTone)}
                            />
                        </label>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                        <label className="flex flex-col gap-2">
                            <span>Size</span>
                            <MultiToggle
                                fullWidth
                                options={accordionSizeOptions}
                                value={accordionSize}
                                size="sm"
                                onChange={(value) => setAccordionSize(value as AccordionSize)}
                            />
                        </label>
                        <label className="flex flex-col gap-2">
                            <span>Indicator</span>
                            <MultiToggle
                                fullWidth
                                options={accordionIndicatorOptions}
                                value={accordionIndicator}
                                size="sm"
                                onChange={(value) => setAccordionIndicator(value as AccordionIndicator)}
                            />
                        </label>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                        <label className="flex flex-col gap-2">
                            <span>Caret placement</span>
                            <MultiToggle
                                fullWidth
                                options={accordionChevronPlacementOptions}
                                value={accordionChevronPlacement}
                                size="sm"
                                onChange={(value) =>
                                    setAccordionChevronPlacement(value as AccordionChevronPlacement)
                                }
                            />
                        </label>
                        <label className="flex items-center justify-between">
                            <span>Allow multiple open</span>
                            <Toggle
                                size="sm"
                                checked={accordionAllowMultipleOpen}
                                onChange={(event) => setAccordionAllowMultipleOpen(event.target.checked)}
                            />
                        </label>
                    </div>
                </div>
            }
            preview={
                <Accordion
                    items={accordionItems}
                    variant={accordionVariant}
                    tone={accordionTone}
                    size={accordionSize}
                    indicator={accordionIndicator}
                    chevronPlacement={accordionChevronPlacement}
                    multiple={accordionAllowMultipleOpen}
                    openIds={accordion.openIds}
                    onChange={accordion.setOpenIds}
                    onItemToggle={(id, isOpen) => console.log(`item ${id} toggled`, isOpen)}
                    ariaLabel="Cloud regions"
                />
            }
        />
    );
};
