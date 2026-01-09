import React, { useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import Button, { type ButtonProps } from './Button';
import DropdownMenu, { type DropdownMenuOption } from './DropdownMenu';
import type { ButtonSize } from './Button';

export interface DropdownButtonOption extends DropdownMenuOption {
  value: string;
}

export interface DropdownButtonProps
  extends Omit<
    ButtonProps,
    'children' | 'leadingIcon' | 'trailingIcon' | 'iconOnly' | 'fullWidth'
  > {
  label: React.ReactNode;
  options: DropdownButtonOption[];
  onPrimaryClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onOptionSelect?: (option: DropdownButtonOption) => void;
  dropdownIcon?: ButtonProps['leadingIcon'];
  fullWidth?: boolean;
  split?: boolean;
  menuWidth?: number | 'trigger';
  menuClassName?: string;
}

export const DropdownButton: React.FC<DropdownButtonProps> = ({
  label,
  options,
  onPrimaryClick,
  onOptionSelect,
  dropdownIcon = 'ArrowDown',
  variant = 'solid',
  color = 'blue',
  size = 'md',
  className,
  disabled,
  fullWidth = false,
  split = true,
  menuWidth = 220,
  menuClassName,
  ...buttonProps
}) => {
  const [open, setOpen] = useState(false);
  const caretRef = useRef<HTMLButtonElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const containerClasses = classNames(
    'inline-flex items-stretch',
    fullWidth && 'w-full',
    className
  );

  const handleSelect = (option: DropdownButtonOption) => {
    onOptionSelect?.(option);
    setOpen(false);
  };

  const { onClick: restOnClick, ...restButtonProps } = buttonProps;

  const handlePrimaryClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    restOnClick?.(event);
    onPrimaryClick?.(event);
  };

  const handleCaretToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setOpen((prev) => !prev);
  };

  const caretWidthMap: Record<ButtonSize, string> = {
    xs: 'min-w-[2rem]',
    sm: 'min-w-[2.25rem]',
    md: 'min-w-[2.5rem]',
    lg: 'min-w-[2.75rem]',
    xl: 'min-w-[3rem]',
  };

  const caretIconClassMap: Record<ButtonSize, string> = {
    xs: '[&>svg]:h-3 [&>svg]:w-3 [&>svg]:min-w-[0.75rem]',
    sm: '[&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:min-w-[0.875rem]',
    md: '[&>svg]:h-4 [&>svg]:w-4 [&>svg]:min-w-4',
    lg: '[&>svg]:h-4.5 [&>svg]:w-4.5 [&>svg]:min-w-[1.125rem]',
    xl: '[&>svg]:h-5 [&>svg]:w-5 [&>svg]:min-w-[1.25rem]',
  };

  const renderCaretButton = () => (
    <Button
      ref={caretRef as React.Ref<HTMLButtonElement>}
      type="button"
      variant={variant}
      color={color}
      size={size}
      iconOnly
      aria-label="Toggle dropdown menu"
      leadingIcon={dropdownIcon}
      data-dropdown-caret
      className={classNames(
        'rounded-l-none border-l border-white/20 text-inherit dark:border-white/10',
        split && caretWidthMap[size],
        caretIconClassMap[size]
      )}
      onClick={handleCaretToggle}
      disabled={disabled || options.length === 0}
    />
  );

  const mainButton = (
    <Button
      type="button"
      variant={variant}
      color={color}
      size={size}
      className={classNames(split && 'rounded-r-none', fullWidth ? 'flex-1' : '')}
      disabled={disabled}
      onClick={handlePrimaryClick}
      {...restButtonProps}
    >
      {label}
    </Button>
  );

  const caretButton = renderCaretButton();

  const menuOptions = useMemo(() => options ?? [], [options]);

  return (
    <div ref={anchorRef} className={containerClasses}>
      {mainButton}
      {caretButton}
      <DropdownMenu
        anchorRef={anchorRef}
        open={open && menuOptions.length > 0}
        onClose={() => setOpen(false)}
        items={menuOptions}
        onSelect={handleSelect}
        width={menuWidth}
        align="end"
        side="auto"
        className={menuClassName}
      />
    </div>
  );
};

DropdownButton.displayName = 'DropdownButton';

export default DropdownButton;
