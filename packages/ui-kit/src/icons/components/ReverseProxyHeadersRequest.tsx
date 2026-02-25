import { forwardRef, type SVGProps } from 'react';

export const ReverseProxyHeadersRequest = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>((props, ref) => (
  <svg width="16px" height="16px" viewBox="0 0 16 16" version="1.1" xmlns="http://www.w3.org/2000/svg" {...props} ref={ref}>
    <path
      d="M6.25052955,2.68829789 L9.07895667,5.51672502 L6.25052955,8.34515214 L5.54342276,7.63804536 L7.18849382,5.99229789 L2.01449382,5.99309336 L2.01449382,4.99309336 L7.14049382,4.99229789 L5.54342276,3.39540467 L6.25052955,2.68829789 Z M14,3 L14,8 L9.01449382,8 L9.79949382,7.003 L13.0232075,7.00366338 L13.0232075,4.01062736 L9.82349382,4.01 L9.01449382,3 L14,3 Z"
      fill="currentColor"></path>
    <path d="M14,9 L14,14 L2,14 L2,9 L14,9 Z M13,10 L3,10 L3,13 L13,13 L13,10 Z"
      fill-opacity="0.5" fill="currentColor"></path>
  </svg>
));

ReverseProxyHeadersRequest.displayName = 'ReverseProxyHeadersRequest';