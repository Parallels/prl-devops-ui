import React, { useState } from 'react';
import classNames from 'classnames';
import { Section, type SectionSize, type SectionVariant } from './Section';
import { Pill, type PillVariant, type PillSize } from './Pill';
import { type ThemeColor } from '../theme/Theme';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TagPanelTag {
  id?: string;
  label: string;
  /** Pill tone. Defaults to `'neutral'`. */
  tone?: ThemeColor;
  /** Pill variant. Defaults to `'soft'`. */
  variant?: PillVariant;
  /** Pill size. Defaults to `'sm'`. */
  size?: PillSize;
  /** Optional leading icon inside the pill. */
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export interface TagPanelProps {
  /** Section heading. Omit entirely to hide the header. */
  title?: React.ReactNode;
  /** Optional secondary line below the title. */
  subtitle?: React.ReactNode;
  /** Tags to render as pills. */
  tags: TagPanelTag[];
  /**
   * Maximum number of pills shown before a `+N` overflow pill appears.
   * Set to `0` to always show all. Default: `5`.
   */
  tagLimit?: number;
  /**
   * Tone used for the `+N` overflow pill.
   * Defaults to `'neutral'`.
   */
  overflowTone?: ThemeColor;
  /** Rendered when `tags` is empty. */
  emptyState?: React.ReactNode;
  /** Optional actions rendered on the right side of the section header. */
  actions?: React.ReactNode;
  /** Controls header padding and font size. Defaults to `'md'`. */
  size?: SectionSize;
  /** Visual style of the section header. Defaults to `'uppercase'`. */
  variant?: SectionVariant;
  /** Extra classes for the root element. */
  className?: string;
  /** Extra classes for the tags container. */
  bodyClassName?: string;
  /** Remove all padding from the section header. */
  noPadding?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const TagPanel: React.FC<TagPanelProps> = ({ title, subtitle, tags, tagLimit = 5, overflowTone = 'neutral', emptyState, actions, size, variant, className, bodyClassName, noPadding }) => {
  const [expanded, setExpanded] = useState(false);

  const limited = tagLimit > 0 && !expanded && tags.length > tagLimit;
  const visible = limited ? tags.slice(0, tagLimit) : tags;
  const overflowCount = tags.length - tagLimit;

  return (
    <div className={classNames('flex flex-col', className)}>
      {title != null && <Section title={title} subtitle={subtitle} actions={actions} size={size} variant={variant} noPadding={noPadding} />}

      <div className={classNames('flex flex-wrap items-center gap-1 px-0 pb-1', bodyClassName)}>
        {tags.length === 0 ? (
          emptyState ? (
            <>{emptyState}</>
          ) : (
            <span className="text-xs text-neutral-400 dark:text-neutral-500 italic">No tags</span>
          )
        ) : (
          <>
            {visible.map((tag, i) => (
              <Pill key={tag.id ?? `${tag.label}-${i}`} tone={tag.tone ?? 'neutral'} variant={tag.variant ?? 'soft'} size={tag.size ?? 'sm'} icon={tag.icon}>
                {tag.children ?? tag.label}
              </Pill>
            ))}

            {limited && (
              <button type="button" onClick={() => setExpanded(true)} aria-label={`Show ${overflowCount} more tags`} className="inline-flex">
                <Pill tone={overflowTone} variant="soft" size={size}>
                  +{overflowCount}
                </Pill>
              </button>
            )}

            {expanded && tagLimit > 0 && tags.length > tagLimit && (
              <button type="button" onClick={() => setExpanded(false)} className="text-xs text-neutral-400 underline-offset-2 hover:underline dark:text-neutral-500">
                Show less
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TagPanel;
