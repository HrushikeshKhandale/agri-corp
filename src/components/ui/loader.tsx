import React from 'react';
import { cn } from '../../lib/utils';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'agriculture';
  className?: string;
}

const Loader: React.FC<LoaderProps> = ({ 
  size = 'md', 
  variant = 'default',
  className 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  };

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <div className={cn(
          'animate-spin rounded-full border-2 border-gray-300 border-t-primary',
          sizeClasses[size]
        )} />
      </div>
    );
  }

  if (variant === 'agriculture') {
    return (
      <div className={cn('flex flex-col items-center justify-center space-y-3', className)}>
        <div className="relative">
          <div className={cn(
            'animate-spin rounded-full border-3 border-green-200 border-t-green-600',
            sizeClasses[size]
          )} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
          </div>
        </div>
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="relative">
        <div className={cn(
          'animate-spin rounded-full border-3 border-primary/20 border-t-primary',
          sizeClasses[size]
        )} />
        <div className="absolute inset-0 animate-ping rounded-full border border-primary/30" />
      </div>
    </div>
  );
};

export default Loader;