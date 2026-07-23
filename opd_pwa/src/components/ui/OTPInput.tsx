import React, { useRef } from 'react';
import { clsx } from 'clsx';

export interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  error?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({ value, onChange, length = 6, error }) => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, digit: string) => {
    if (!/^\d*$/.test(digit)) return;

    const valArray = value.split('');
    valArray[index] = digit.slice(-1);
    const newValue = valArray.join('');
    onChange(newValue);

    if (digit && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pasted) {
      onChange(pasted);
      const nextIndex = Math.min(pasted.length, length - 1);
      inputsRef.current[nextIndex]?.focus();
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 w-full max-w-xs mx-auto my-3">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={clsx(
            'w-11 h-13 text-center text-xl font-bold rounded-[14px] border bg-white outline-none transition-all focus:ring-2 focus:ring-[#0B6875]/20 focus:border-[#0B6875]',
            error ? 'border-[#C94B4B] text-[#C94B4B]' : value[i] ? 'border-[#0B6875] text-[#16343C]' : 'border-[#DCE6E7] text-[#16343C]'
          )}
        />
      ))}
    </div>
  );
};
