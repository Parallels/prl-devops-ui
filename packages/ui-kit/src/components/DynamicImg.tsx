import React from "react";
import { useIconRenderer } from "../contexts/IconContext";

export interface DynamicImgProps {
  base64: string;
  fill?: string;
  stroke?: string;
  className?: string;
  title?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  style?: React.CSSProperties;
}

const sizeClasses = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-10 w-10",
};

const DynamicImg: React.FC<DynamicImgProps> = ({ base64, fill, stroke, className, title, size = "md", style }) => {
  const renderIcon = useIconRenderer();

  if (!base64) {
    return <>{renderIcon("Chat", size)}</>;
  }

  if (base64.toLowerCase().includes("data:image/png;base64,")) {
    return <img src={base64} alt="Dynamic Image" className={className} style={style} title={title} />;
  }

  if (!base64.toLowerCase().includes("data:image/svg+xml;base64,")) {
    return <>{renderIcon("Chat", size)}</>;
  }

  const svgDecoded = atob(base64.replace(/^data:image\/svg\+xml;base64,/, ""));

  const svgStyled = svgDecoded
    .replace(/fill=".*?"/g, `fill="${fill || "currentColor"}"`)
    .replace(/stroke=".*?"/g, `stroke="${stroke || "currentColor"}"`);

  return (
    <div
      className={`inline-flex select-none items-center justify-center p-[5px] text-current [&>svg]:h-full [&>svg]:w-full [&>svg_*]:fill-current [&>svg_*]:stroke-current ${sizeClasses[size]} ${className ?? ""}`}
      style={style}
      title={title}
      dangerouslySetInnerHTML={{ __html: svgStyled }}
    />
  );
};

DynamicImg.displayName = "DynamicImg";

export default DynamicImg;
