import React, { useEffect } from 'react';
import { useLoading } from '../context/LoadingContext';
import { setLoadingHandler } from '../services/axiosInstance';

const GlobalLoader: React.FC = () => {
  const { isLoading, setLoading } = useLoading();

  useEffect(() => {
    setLoadingHandler(setLoading);
  }, [setLoading]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg p-6 shadow-xl flex flex-col items-center space-y-3">
        <div className="relative">
          <div className="w-8 h-8 border-3 border-green-200 border-t-green-600 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
          </div>
        </div>
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    </div>
  );
};

export default GlobalLoader;