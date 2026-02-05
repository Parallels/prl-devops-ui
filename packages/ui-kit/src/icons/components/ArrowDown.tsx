import { forwardRef, type SVGProps } from 'react';

export const ArrowDown = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>((props, ref) => (
  <svg    viewBox="0 0 24 24" fill="currentColor"
  xmlns="http://www.w3.org/2000/svg" {...props} ref={ref}>
  <path
    d="M12.146 16.157c-.27 0-.516-.11-.739-.328L6.26 10.565a1.013 1.013 0 0 1-.198-.293.95.95 0 0 1-.062-.35.925.925 0 0 1 .451-.8.91.91 0 0 1 .465-.122.93.93 0 0 1 .67.28l4.874 5.004h-.622l4.86-5.004a.93.93 0 0 1 1.128-.157.909.909 0 0 1 .458.8c0 .25-.089.462-.266.636l-5.134 5.27c-.11.11-.226.191-.349.246a1.08 1.08 0 0 1-.39.082z"
    fill="currentColor" />
</svg>
));

ArrowDown.displayName = 'ArrowDown';