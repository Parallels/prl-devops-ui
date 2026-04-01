import { forwardRef, type SVGProps } from 'react';

export const Drag = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>((props, ref) => (
  <svg viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props} ref={ref}>
    <circle cx="6" cy="5" r="1.1" />
    <circle cx="6" cy="10" r="1.1" />
    <circle cx="6" cy="15" r="1.1" />
    <circle cx="12" cy="5" r="1.1" />
    <circle cx="12" cy="10" r="1.1" />
    <circle cx="12" cy="15" r="1.1" />
</svg>
));

Drag.displayName = 'Drag';