import React from 'react';
import { Input, message } from 'antd';
import { validateInput, sanitizeInput } from '../utils/security';

interface SecureInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}

export const SecureInput: React.FC<SecureInputProps> = ({
  value,
  onChange,
  placeholder,
  type = 'text',
  className
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    if (!validateInput(inputValue)) {
      message.error('Invalid input detected. Please remove special characters.');
      return;
    }
    
    const sanitizedValue = sanitizeInput(inputValue);
    onChange?.(sanitizedValue);
  };

  return (
    <Input
      type={type}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
    />
  );
};