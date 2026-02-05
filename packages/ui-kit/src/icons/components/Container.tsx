import { forwardRef, type SVGProps } from 'react';

export const Container = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>((props, ref) => (
  <svg  fill="currentColor" viewBox="0 0 36 36" version="1.1" xmlns="http://www.w3.org/2000/svg" {...props} ref={ref}>
  <path d="M32,30H4a2,2,0,0,1-2-2V8A2,2,0,0,1,4,6H32a2,2,0,0,1,2,2V28A2,2,0,0,1,32,30ZM4,8V28H32V8Z" />
  <path d="M9,25.3a.8.8,0,0,1-.8-.8v-13a.8.8,0,0,1,1.6,0v13A.8.8,0,0,1,9,25.3Z" />
  <path d="M14.92,25.3a.8.8,0,0,1-.8-.8v-13a.8.8,0,0,1,1.6,0v13A.8.8,0,0,1,14.92,25.3Z" />
  <path d="M21,25.3a.8.8,0,0,1-.8-.8v-13a.8.8,0,0,1,1.6,0v13A.8.8,0,0,1,21,25.3Z" />
  <path d="M27,25.3a.8.8,0,0,1-.8-.8v-13a.8.8,0,0,1,1.6,0v13A.8.8,0,0,1,27,25.3Z" />
</svg>
));

Container.displayName = 'Container';