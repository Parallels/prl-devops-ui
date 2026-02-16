import { forwardRef, type SVGProps } from 'react';

export const LXC = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>((props, ref) => (
  <svg  viewBox="0 0 16 16" version="1.1" xmlns="http://www.w3.org/2000/svg"
     fill="currentColor" {...props} ref={ref}>
    <path fill="currentColor"
        d="M12 6v-4l-4-2-4 2v4l-4 2v5l4 2 4-2 4 2 4-2v-5zM8.090 1.12l2.91 1.44-2.6 1.3-2.91-1.44zM5 2.78l3 1.5v3.6l-3-1.5v-3.6zM4 13.88l-3-1.5v-3.6l3 1.5v3.6zM4.28 9.88l-2.88-1.46 2.6-1.3 2.88 1.44zM12 13.88l-3-1.5v-3.6l3 1.5v3.6zM12.28 9.88l-2.88-1.46 2.6-1.3 2.88 1.44z"></path>
</svg>
));

LXC.displayName = 'LXC';