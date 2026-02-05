import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Input,
  Button,
} from '../../components';


import { BadgeIconDemo } from './demos/BadgeIconDemo';
import { InputGroupDemo } from './demos/InputGroupDemo';
import { DetailItemCardDemo } from './demos/DetailItemCardDemo';
import { DynamicImgDemo } from './demos/DynamicImgDemo';
import { HeaderGroupDemo } from './demos/HeaderGroupDemo';
import { ModalDemo } from './demos/ModalDemo';
import { MultiSelectPillsDemo } from './demos/MultiSelectPillsDemo';
import { InputDemo } from './demos/InputDemo';
import { SelectDemo } from './demos/SelectDemo';
import { CustomIconDemo } from './demos/CustomIconDemo';
import { EmptyStateDemo } from './demos/EmptyStateDemo';
import { CheckboxDemo } from './demos/CheckboxDemo';
import { PillDemo } from './demos/PillDemo';
import { TableDemo } from './demos/TableDemo';
import { AlertDemo } from './demos/AlertDemo';
import { ProgressDemo } from './demos/ProgressDemo';
import { SpinnerDemo } from './demos/SpinnerDemo';
import { ButtonDemo } from './demos/ButtonDemo';


import { TabsDemo } from './demos/TabsDemo';
import { DropdownButtonDemo } from './demos/DropdownButtonDemo';
import { IconButtonDemo } from './demos/IconButtonDemo';
import { ToggleDemo } from './demos/ToggleDemo';
import { StatusSpinnerDemo } from './demos/StatusSpinnerDemo';
import { PanelDemo } from './demos/PanelDemo';
import { AccordionDemo } from './demos/AccordionDemo';
import { StepperDemo } from './demos/StepperDemo';
import { TextareaDemo } from './demos/TextareaDemo';
import { SearchBarDemo } from './demos/SearchBarDemo';
import { FormDemo } from './demos/FormDemo';
import { BottomSheetDemo } from './demos/BottomSheetDemo';
import { CollapsibleHelpDemo } from './demos/CollapsibleHelpDemo';
import { CollapsiblePanelDemo } from './demos/CollapsiblePanelDemo';
import { KeyValueFieldDemo } from './demos/KeyValueFieldDemo';
import { InfiniteScrollDemo } from './demos/InfiniteScrollDemo';
import { AppDividerDemo } from './demos/AppDividerDemo';
import { BadgeDemo } from './demos/BadgeDemo';


export const UxDemo: React.FC = () => {
  const [sectionSearch, setSectionSearch] = useState('');
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const sectionList = useMemo(() => [
    { id: 'sections-badge-icon', title: 'Badge Icon', render: () => <BadgeIconDemo /> },
    { id: 'sections-textarea', title: 'Textarea', render: () => <TextareaDemo /> },
    { id: 'sections-search-bar', title: 'Search Bar', render: () => <SearchBarDemo /> },
    { id: 'sections-form', title: 'Form Components', render: () => <FormDemo /> },
    { id: 'sections-panels', title: 'Panel Controls', render: () => <PanelDemo /> },
    { id: 'sections-bottom-sheet', title: 'Bottom Sheet', render: () => <BottomSheetDemo /> },
    { id: 'sections-help-text', title: 'Collapsible Help Text', render: () => <CollapsibleHelpDemo /> },
    { id: 'sections-collapsible-panel', title: 'Collapsible Panel', render: () => <CollapsiblePanelDemo /> },
    { id: 'sections-key-value', title: 'Key/Value Array', render: () => <KeyValueFieldDemo /> },
    { id: 'sections-infinite-scroll', title: 'Infinite Scroll', render: () => <InfiniteScrollDemo /> },
    { id: 'sections-app-divider', title: 'App Divider', render: () => <AppDividerDemo /> },
    { id: 'sections-badge', title: 'Badge', render: () => <BadgeDemo /> },
    { id: 'sections-custom-icon', title: 'Custom Icon', render: () => <CustomIconDemo /> },
    { id: 'sections-detail-item-card', title: 'Detail Item Card', render: () => <DetailItemCardDemo /> },
    { id: 'sections-dynamic-img', title: 'Dynamic Image', render: () => <DynamicImgDemo /> },
    { id: 'sections-header-group', title: 'Header Group', render: () => <HeaderGroupDemo /> },
    { id: 'sections-modal', title: 'Modal', render: () => <ModalDemo /> },
    { id: 'sections-multi-select-pills', title: 'Multi Select Pills', render: () => <MultiSelectPillsDemo /> },
    { id: 'sections-alerts', title: 'Alerts', render: () => <AlertDemo /> },
    { id: 'sections-empty-state', title: 'Empty States', render: () => <EmptyStateDemo /> },
    { id: 'sections-pills', title: 'Pills', render: () => <PillDemo /> },
    { id: 'sections-checkbox', title: 'Checkbox', render: () => <CheckboxDemo /> },
    { id: 'sections-input', title: 'Inputs', render: () => <InputDemo /> },
    { id: 'sections-select', title: 'Select', render: () => <SelectDemo /> },
    { id: 'sections-input-group', title: 'Input Group', render: () => <InputGroupDemo /> },
    { id: 'sections-progress', title: 'Progress', render: () => <ProgressDemo /> },
    { id: 'sections-spinner', title: 'Spinner', render: () => <SpinnerDemo /> },
    { id: 'sections-buttons', title: 'Buttons', render: () => <ButtonDemo /> },
    { id: 'sections-dropdown', title: 'Dropdowns', render: () => <DropdownButtonDemo /> },
    { id: 'sections-icon-button', title: 'Icon Buttons', render: () => <IconButtonDemo /> },
    { id: 'sections-tabs', title: 'Tabs', render: () => <TabsDemo /> },
    { id: 'sections-toggle', title: 'Toggles', render: () => <ToggleDemo /> },
    { id: 'sections-status-spinner', title: 'Status Spinner', render: () => <StatusSpinnerDemo /> },
    { id: 'sections-table', title: 'Tables', render: () => <TableDemo /> },

    { id: 'sections-accordion', title: 'Accordions', render: () => <AccordionDemo /> },
    { id: 'sections-stepper', title: 'Steppers', render: () => <StepperDemo /> },
  ], []);

  const [searchSuggestions, setSearchSuggestions] = useState<typeof sectionList>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const trimmed = sectionSearch.trim().toLowerCase();
    if (!trimmed) {
      setSearchSuggestions([]);
      return;
    }
    const matches = sectionList.filter((section) =>
      section.title.toLowerCase().includes(trimmed)
    );
    setSearchSuggestions(matches);
  }, [sectionSearch, sectionList]);

  const handleSuggestionClick = (sectionId: string) => {
    const target = sectionRefs.current[sectionId];
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setSectionSearch('');
    setShowSuggestions(false);
  };

  return (
    <div className=" flex flex-col gap-6">
      <div className="sticky top-0 z-20 flex flex-col gap-3 px-6 pt-0 pb-3 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
        <label className="text-sm font-semibold text-slate-600 dark:text-slate-200">
          Jump to component
        </label>
        <div className="relative flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Input
              ref={searchInputRef}
              className="w-full"
              size="sm"
              value={sectionSearch}
              onChange={(event) => {
                setSectionSearch(event.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Search for a control (e.g. Panels, Dropdown)"
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  const match = searchSuggestions[0];
                  if (match) {
                    handleSuggestionClick(match.id);
                  }
                }
              }}
            />
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-md border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
                {searchSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700"
                    onClick={() => handleSuggestionClick(suggestion.id)}
                  >
                    {suggestion.title}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="solid"
              color="blue"
              onClick={() => {
                const match = searchSuggestions[0];
                if (match) {
                  handleSuggestionClick(match.id);
                }
              }}
            >
              Go
            </Button>
            <Button
              size="sm"
              variant="outline"
              color="rose"
              onClick={() => {
                setSectionSearch('');
                setShowSuggestions(false);
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      </div>
      <div className="mx-6 mb-16 flex flex-col gap-6 overflow-hidden">
        {sectionList.map((section) => (
          <div
            key={section.id}
            ref={(node) => {
              sectionRefs.current[section.id] = node;
            }}
          >
            {section.render()}
          </div>
        ))}
      </div>
    </div>
  );
};
