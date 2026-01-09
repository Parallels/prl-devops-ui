import {
  forwardRef,
  InputHTMLAttributes,
  ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
} from 'react';
import classNames from 'classnames';
import { getCheckboxColorClasses } from './Theme';

export type CheckboxColor = 'indigo' | 'blue' | 'emerald' | 'amber' | 'rose' | 'slate';

type CheckboxSize = 'sm' | 'md' | 'lg';
type CheckboxDescriptionPlacement = 'bottom' | 'inline';
type CheckboxAlign = 'left' | 'right';

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'color' | 'children'> {
  /**
   * Optional label rendered next to the checkbox control.
   */
  label?: ReactNode;
  /**
   * Optional description displayed under the label.
   */
  description?: ReactNode;
  /**
   * Controls if the description is stacked under the label (default) or inline beside it.
   */
  descriptionPlacement?: CheckboxDescriptionPlacement;
  /**
   * Adjusts checkbox dimensions and typography.
   */
  size?: CheckboxSize;
  /**
   * Accent color applied to the checkbox.
   */
  color?: CheckboxColor;
  /**
   * Enables the native indeterminate visual state.
   */
  indeterminate?: boolean;
  /**
   * When true the container will stretch to the available width.
   */
  fullWidth?: boolean;
  /**
   * Renders the checkbox control on the left (default) or right side of the label block.
   */
  controlAlign?: CheckboxAlign;
  /**
   * Additional classes applied to the root label element.
   */
  className?: string;
  /**
   * Additional classes applied directly to the input element.
   */
  inputClassName?: string;
}

const sizeTokens: Record<
  CheckboxSize,
  {
    gap: string;
    control: string;
    label: string;
    description: string;
    descriptionOffset: string;
    checkboxOffset: string;
  }
> = {
  sm: {
    gap: 'gap-1.5',
    control: 'h-4 w-4',
    label: 'text-sm',
    description: 'text-xs',
    descriptionOffset: '',
    checkboxOffset: 'mt-1',
  },
  md: {
    gap: 'gap-1.5',
    control: 'h-5 w-5',
    label: 'text-md',
    description: 'text-xs',
    descriptionOffset: 'mt-0.5',
    checkboxOffset: 'mt-0.5',
  },
  lg: {
    gap: 'gap-1.5',
    control: 'h-6 w-6',
    label: 'text-base',
    description: 'text-sm',
    descriptionOffset: 'mt-1',
    checkboxOffset: 'mt-0.2',
  },
};

/**
 * Accessible checkbox control styled exclusively with Tailwind utilities.
 */
const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      id,
      label,
      description,
      descriptionPlacement = 'bottom',
      size = 'md',
      color = 'blue',
      indeterminate = false,
      fullWidth = false,
      controlAlign = 'left',
      className,
      inputClassName,
      disabled,
      ...inputProps
    },
    forwardedRef
  ) => {
    const generatedId = useId();
    const controlId = id ?? generatedId;
    const descriptionId = description ? `${controlId}-description` : undefined;
    const innerRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (!innerRef.current) return;
      innerRef.current.indeterminate = Boolean(indeterminate);
    }, [indeterminate]);

    const setRefs = useCallback(
      (node: HTMLInputElement | null) => {
        innerRef.current = node;
        if (typeof forwardedRef === 'function') {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      },
      [forwardedRef]
    );

    const sizeStyles = sizeTokens[size] ?? sizeTokens.md;
    const colorStyles = getCheckboxColorClasses(color);

    const descriptionNode = description ? (
      descriptionPlacement === 'inline' ? (
        <span
          id={descriptionId}
          className={classNames(
            sizeStyles.description,
            'text-neutral-500 dark:text-neutral-400',
            disabled && 'text-neutral-400 dark:text-neutral-500'
          )}
        >
          {description}
        </span>
      ) : (
        <span
          id={descriptionId}
          className={classNames(
            sizeStyles.description,
            sizeStyles.descriptionOffset,
            'block text-neutral-500 dark:text-neutral-400',
            disabled && 'text-neutral-400 dark:text-neutral-500'
          )}
        >
          {description}
        </span>
      )
    ) : null;

    const controlNode = (
      <input
        id={controlId}
        ref={setRefs}
        type="checkbox"
        aria-describedby={descriptionId}
        disabled={disabled}
        className={classNames(
          `peer ${sizeStyles.checkboxOffset} shrink-0 rounded border border-neutral-300 bg-white text-white transition-colors duration-150`,
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'checked:border-transparent hover:border-neutral-400',
          'dark:border-neutral-600 dark:bg-neutral-900 dark:hover:border-neutral-500',
          'disabled:border-neutral-200 disabled:bg-neutral-100 disabled:hover:border-neutral-200',
          sizeStyles.control,
          colorStyles,
          inputClassName
        )}
        {...inputProps}
      />
    );

    const textNode =
      label || descriptionNode ? (
        <span
          className={classNames(
            'min-w-0',
            descriptionPlacement === 'inline' &&
            Boolean(label) &&
            'flex flex-wrap items-center gap-1',
            descriptionPlacement === 'inline' && !label && 'flex items-center'
          )}
        >
          {label && (
            <span
              className={classNames(
                sizeStyles.label,
                'font-medium text-neutral-900 dark:text-neutral-100',
                disabled && 'text-neutral-500 dark:text-neutral-400'
              )}
            >
              {label}
            </span>
          )}
          {descriptionNode}
        </span>
      ) : null;

    return (
      <label
        className={classNames(
          'group flex items-start',
          controlAlign === 'right' && 'flex-row-reverse',
          sizeStyles.gap,
          fullWidth && 'w-full',
          disabled && 'cursor-not-allowed opacity-60',
          !disabled && 'cursor-pointer',
          className
        )}
      >
        {controlNode}
        {textNode}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
