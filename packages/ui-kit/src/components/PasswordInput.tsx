import { useState, forwardRef, type ForwardedRef } from 'react';
import Input, { type InputProps } from './Input';
import { EyeOpen } from '../icons/components/EyeOpen';
import { EyeClosed } from '../icons/components/EyeClosed';

export type PasswordInputProps = Omit<InputProps, 'type' | 'trailingIcon' | 'onTrailingIconClick'>;

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  props,
  ref: ForwardedRef<HTMLInputElement>,
) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Input
      {...props}
      ref={ref}
      type={showPassword ? 'text' : 'password'}
      trailingIcon={
        showPassword
          ? <EyeClosed className="w-4 h-4" />
          : <EyeOpen className="w-4 h-4" />
      }
      onTrailingIconClick={() => setShowPassword((v) => !v)}
    />
  );
});

PasswordInput.displayName = 'PasswordInput';

export default PasswordInput;
