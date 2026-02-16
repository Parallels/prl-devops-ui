import { forwardRef, type SVGProps } from 'react';

export const Equal = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>((props, ref) => (
  <svg 
    viewBox="0 0 24 24"
    fill="none"
    version="1.1"
    id="svg2"
    xmlns="http://www.w3.org/2000/svg"
     {...props} ref={ref}>

    <path
        fill="currentColor"
        d="m 9,9 a 1,1 0 0 0 -1,1 1,1 0 0 0 1,1 h 6 a 1,1 0 0 0 1,-1 1,1 0 0 0 -1,-1 z"
    />
    <path
        fill="currentColor"
        d="m 9,13 a 1,1 0 0 0 -1,1 1,1 0 0 0 1,1 h 6 a 1,1 0 0 0 1,-1 1,1 0 0 0 -1,-1 z"
    />

</svg>
));

Equal.displayName = 'Equal';