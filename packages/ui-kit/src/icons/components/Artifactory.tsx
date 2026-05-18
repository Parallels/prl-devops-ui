import { forwardRef, type SVGProps } from "react";

export const Artifactory = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(
  (props, ref) => (
    <svg
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      {...props}
      ref={ref}
    >
      <rect x="5" y="42.4" width="38" height="2.92"></rect>
      <path d="M23.93,34.48A16.24,16.24,0,1,1,40.17,18.24,16.25,16.25,0,0,1,23.93,34.48Zm0-29.38A13.14,13.14,0,1,0,37.07,18.24,13.16,13.16,0,0,0,23.93,5.1Z"></path>
    </svg>
  ),
);

Artifactory.displayName = "Artifactory";
