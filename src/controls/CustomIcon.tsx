import React, { useState, useEffect, useMemo } from 'react';
import { getIcon } from '@/services/IconRegistry';
import { IconName, IconSize } from '@/types/Icon';
import { mergeClassTokens, hasExplicitSize } from '@/utils/iconUtils';


export interface CustomIconProps {
  /** Name of the icon to display */
  icon: IconName;
  /** Alternative text for accessibility */
  alt?: string;
  /** Size of the icon in pixels */
  customSize?: number | string;
  /** Size of the icon: xs, sm, md, lg, xl */
  size?: IconSize;

  /** Additional CSS class names */
  className?: string;
  /** Click handler */
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  /** Whether the icon should use color or be monochrome */
  colored?: boolean;
  /** Primary color to use for the icon */
  color?: string;
  /** Hover color for the icon */
  hoverColor?: string;
  /** Force SVG rendering (for debugging) */
  forceSvg?: boolean;
}

const SIZE_CLASS_MAP: Record<IconSize, string> = {
  xs: 'h-4 w-4',
  sm: 'h-5 w-5',
  md: 'h-6 w-6',
  lg: 'h-7 w-7',
  xl: 'h-8 w-8',
};

const SIZE_PIXEL_MAP: Record<IconSize, number> = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 32,
};



export const CustomIcon: React.FC<CustomIconProps> = ({
  icon,
  alt = '',
  customSize = undefined,
  size = 'md',
  className = '',
  onClick,
  colored = false,
  color,
  hoverColor,
  forceSvg = false,
}) => {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<boolean>(false);

  useEffect(() => {
    setIsLoading(true);
    setSvgContent(null);
    setLoadError(false);

    const loadIcon = async () => {
      try {
        // Get the icon information from the registry
        const iconInfo = getIcon(icon);

        if (!iconInfo.url) {
          console.info(`[${icon}] No URL found for icon`);
          setIsLoading(false);
          setLoadError(true);
          return;
        }

        if (iconInfo.isSvg || forceSvg) {
          try {
            // For SVGs, fetch the content
            const content = await iconInfo.getSvgContent();

            if (content && content.trim()) {
              setSvgContent(content);
            } else {
              console.error(`Empty SVG content for ${icon}`);
              setLoadError(true);
            }
          } catch (err) {
            console.error(`Error processing SVG for ${icon}:`, err);
            setLoadError(true);
          }
        } else {
          console.info(`[${icon}] Not an SVG, skipping content fetch`);
        }

        setIsLoading(false);
      } catch (err) {
        console.error(`Failed to load icon: ${icon}`, err);
        setIsLoading(false);
        setLoadError(true);
      }
    };

    void loadIcon();
  }, [icon, forceSvg]);

  const iconInfo = getIcon(icon);
  const shouldRenderAsSvg = Boolean((iconInfo.isSvg || forceSvg) && svgContent);

  const dimension = useMemo(() => {
    if (!customSize) {
      return undefined;
    }
    if (typeof customSize === 'number') {
      return `${customSize}px`;
    }
    return customSize;
  }, [customSize]);

  const baseStyle = useMemo(() => {
    const style: React.CSSProperties = {};
    if (dimension) {
      style.width = dimension;
      style.height = dimension;
    }
    if (color && !colored) {
      (style as Record<string, string>)['--icon-color'] = color;
    }
    if (hoverColor && !colored) {
      (style as Record<string, string>)['--icon-hover-color'] = hoverColor;
    }
    return style;
  }, [dimension, color, hoverColor, colored]);

  const fallbackSizeClass = !dimension && !hasExplicitSize(className) ? SIZE_CLASS_MAP[size] : undefined;

  const iconClass = mergeClassTokens(
    'inline-flex items-center justify-center flex-shrink-0 [&>svg]:h-full [&>svg]:w-full [&>img]:h-full [&>img]:w-full',
    !colored ? 'fill-current' : '',
    fallbackSizeClass,
    className
  );

  const processedSvg = useMemo(() => {
    if (!svgContent) {
      return '';
    }
    const targetSize = dimension ?? `${SIZE_PIXEL_MAP[size]}px`;

    let result = svgContent.replace(/width=["'].*?["']/gi, `width="${targetSize}"`);
    result = result.replace(/height=["'].*?["']/gi, `height="${targetSize}"`);

    if (!/width=/.test(result)) {
      result = result.replace(/<svg([^>]*)>/i, `<svg$1 width="${targetSize}">`);
    }

    if (!/height=/.test(result)) {
      result = result.replace(/<svg([^>]*)>/i, `<svg$1 height="${targetSize}">`);
    }

    if (!/preserveAspectRatio=/.test(result)) {
      result = result.replace(
        /<svg([^>]*)>/i,
        `<svg$1 preserveAspectRatio="xMidYMid meet">`
      );
    }

    return result;
  }, [svgContent, size, dimension]);

  // Show fallback if the icon isn't found
  if (!isLoading && (loadError || !iconInfo.url)) {
    return (
      <span
        className={`flex items-center justify-center rounded bg-neutral-100 text-xs font-bold uppercase text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 ${className}`}
        style={baseStyle}
        title={alt}
        onClick={onClick}
      >
        {typeof icon === 'string' ? icon.charAt(0) : ''}
      </span>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <span
        className={`animate-pulse rounded bg-neutral-200 dark:bg-neutral-700 ${className}`}
        style={baseStyle}
        title={alt || 'Loading...'}
      />
    );
  }

  // Render SVG content directly in the DOM for color manipulation
  if (shouldRenderAsSvg) {
    return (
      <span
        className={iconClass}
        style={baseStyle}
        title={alt}
        dangerouslySetInnerHTML={{ __html: processedSvg }}
        onClick={onClick}
      />
    );
  }

  // Render standard image for non-SVG icons or if SVG content failed to load
  return (
    <img
      src={iconInfo.url || ''}
      alt={alt}
      className={iconClass}
      style={baseStyle}
      onClick={onClick}
    />
  );
};

export default CustomIcon;
