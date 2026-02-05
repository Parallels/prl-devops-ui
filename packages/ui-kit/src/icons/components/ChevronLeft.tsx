import { forwardRef, type SVGProps } from 'react';

export const ChevronLeft = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>((props, ref) => (
  <svg 
   viewBox="0 0 20 20"
   fill="none"
   version="1.1"
   id="svg1"
   xmlns="http://www.w3.org/2000/svg"
    {...props} ref={ref}>
   <path
      fill="currentColor"
      d="m 13,3 a 1,1 0 0 0 -0.707031,0.2929688 l -6.0000003,6 a 1.0001,1.0001 0 0 0 0,1.4140622 l 6.0000003,6 a 1,1 0 0 0 1.414062,0 1,1 0 0 0 0,-1.414062 L 8.4140625,10 13.707031,4.7070312 a 1,1 0 0 0 0,-1.4140624 A 1,1 0 0 0 13,3 Z" />
</svg>
));

ChevronLeft.displayName = 'ChevronLeft';