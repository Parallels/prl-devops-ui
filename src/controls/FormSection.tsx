import classNames from 'classnames';
import React, { ReactNode } from 'react';

export interface FormSectionProps {
  title?: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

const paddingMap: Record<'sm' | 'md' | 'lg', { body: string; header: string; footer: string }> = {
  sm: {
    header: 'px-4 py-4',
    body: 'px-4 py-4',
    footer: 'px-4 py-4',
  },
  md: {
    header: 'px-6 py-5',
    body: 'px-6 py-6',
    footer: 'px-6 py-4',
  },
  lg: {
    header: 'px-8 py-6',
    body: 'px-8 py-8',
    footer: 'px-8 py-6',
  },
};

const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  footer,
  children,
  className,
  padding = 'md',
}) => {
  const pad = paddingMap[padding];
  return (
    <section
      className={classNames(
        'rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900',
        className
      )}
    >
      {(title || description) && (
        <div className={classNames('border-b border-neutral-200 dark:border-neutral-700', pad.header)}>
          <div>
            {title && (
              <h2 className="text-base font-semibold leading-6 text-neutral-900 dark:text-neutral-100">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{description}</p>
            )}
          </div>
        </div>
      )}
      <div className={classNames('space-y-6', pad.body)}>{children}</div>
      {footer && (
        <div className={classNames('border-t border-neutral-200 dark:border-neutral-700', pad.footer)}>
          {footer}
        </div>
      )}
    </section>
  );
};

export default FormSection;
