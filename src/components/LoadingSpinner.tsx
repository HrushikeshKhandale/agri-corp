import React from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

interface LoadingSpinnerProps {
  size?: 'small' | 'default' | 'large';
  tip?: string;
  spinning?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'default',
  tip = 'Loading...',
  spinning = true,
  children,
  className = ''
}) => {
  const antIcon = <LoadingOutlined style={{ fontSize: size === 'large' ? 32 : size === 'small' ? 16 : 24, color: 'hsl(var(--primary))' }} spin />;

  if (children) {
    return (
      <Spin 
        indicator={antIcon} 
        spinning={spinning} 
        tip={tip}
        size={size}
        className={className}
      >
        {children}
      </Spin>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <Spin 
        indicator={antIcon} 
        size={size}
        tip={tip}
      />
    </div>
  );
};

export default LoadingSpinner;