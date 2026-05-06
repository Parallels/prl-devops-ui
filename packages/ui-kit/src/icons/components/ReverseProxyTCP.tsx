import { forwardRef, type SVGProps } from "react";

export const ReverseProxyTCP = forwardRef<
  SVGSVGElement,
  SVGProps<SVGSVGElement>
>((props, ref) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    width="100%"
    height="100%"
    {...props}
    ref={ref}
  >
    <path
      d="M 40 90 H 15 V 15 H 85 V 35 H 15"
      stroke="currentColor"
      strokeWidth="10"
      strokeLinejoin="miter"
      strokeLinecap="square"
      strokeOpacity="0.5"
      fill="none"
    />

    <g fill="currentColor">
      <path d="M 30 48 H 47 V 55 H 42 V 80 H 35 V 55 H 30 Z" />

      <path d="M 69 48 H 52 V 80 H 69 V 73 H 59 V 55 H 69 Z" />

      <path d="M 74 48 V 80 H 81 V 68 H 91 V 48 Z M 81 55 H 84 V 61 H 81 Z" />
    </g>
  </svg>
));

ReverseProxyTCP.displayName = "ReverseProxyTCP";
