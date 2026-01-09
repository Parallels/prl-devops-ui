import React, { cloneElement } from 'react';
import { CustomIcon } from '@/controls/CustomIcon';
import { IconName, IconSize } from '@/types/Icon';
import { mergeClassTokens } from '@/utils/iconUtils';

export const renderIcon = (
    icon: IconName | React.ReactElement | undefined,
    size: IconSize | undefined,
    className?: string
) => {
    if (!icon) {
        return null;
    }

    const resolvedSize: IconSize = size ?? 'md';

    if (typeof icon === 'string') {
        return <CustomIcon icon={icon} className={className} size={resolvedSize} />;
    }

    if (React.isValidElement<{ className?: string }>(icon)) {
        return cloneElement(icon, {
            className: mergeClassTokens(icon.props.className, className),
        });
    }

    return <span className={className}> {icon} </span>;
};
