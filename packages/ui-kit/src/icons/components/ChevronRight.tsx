import { forwardRef, type SVGProps } from 'react';

export const ChevronRight = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>((props, ref) => (
  <svg 
    viewBox="0 0 20 20"
    fill="none"
    version="1.1"
    id="svg1"
    xmlns="http://www.w3.org/2000/svg"
     {...props} ref={ref}>
    <path
        d="m 7,3 a 1,1 0 0 0 -0.7070313,0.2929688 1,1 0 0 0 0,1.4140624 L 11.585938,10 6.2929687,15.292969 a 1,1 0 0 0 0,1.414062 1,1 0 0 0 1.4140625,0 l 5.9999998,-6 a 1.0001,1.0001 0 0 0 0,-1.4140622 l -5.9999998,-6 A 1,1 0 0 0 7,3 Z"
        fill="currentColor" />
</svg>
));

ChevronRight.displayName = 'ChevronRight';