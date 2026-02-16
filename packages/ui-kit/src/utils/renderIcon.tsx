import React, { cloneElement } from "react";
import { type IconName, type IconSize, type IconRenderer } from "../types";
import { mergeClassTokens } from "./iconUtils";
import { default as CustomIcon } from "../components/CustomIcon";

export const renderIcon: IconRenderer = (icon, size, className) => {
    if (!icon) {
        return null;
    }

    const resolvedSize: IconSize = size ?? "md";

    if (typeof icon === "string") {
        return <CustomIcon icon={icon as IconName} className={className} size={resolvedSize} />;
    }

    if (React.isValidElement<{ className?: string }>(icon)) {
        return cloneElement(icon, {
            className: mergeClassTokens(icon.props.className, className),
        });
    }

    return <span className={className}> {icon} </span>;
};
