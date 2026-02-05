import { forwardRef, type SVGProps } from 'react';

export const ArrowLeft = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>((props, ref) => (
  <svg 
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
   {...props} ref={ref}>

  <path
    
    d="M 11,7 A 1,1 0 0 0 10.292969,7.2929687 L 6.2929687,11.292969 A 1,1 0 0 0 6,12 1,1 0 0 0 6.2929687,12.707031 l 4.0000003,4 a 1,1 0 0 0 1.414062,0 1,1 0 0 0 0,-1.414062 L 9.4140625,13 H 17 a 1,1 0 0 0 1,-1 1,1 0 0 0 -1,-1 H 9.4140625 L 11.707031,8.7070313 a 1,1 0 0 0 0,-1.4140626 A 1,1 0 0 0 11,7 Z"
    id="Vector" />
</svg>
));

ArrowLeft.displayName = 'ArrowLeft';