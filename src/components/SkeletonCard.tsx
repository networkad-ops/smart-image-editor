import React from 'react';

interface SkeletonCardProps {
  aspectRatio?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ 
  aspectRatio = '16/9' 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* 썸네일 스켈레톤 */}
      <div 
        className="relative bg-gray-200 animate-pulse"
        style={{ aspectRatio }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-gray-300 rounded animate-pulse"></div>
        </div>
      </div>

      {/* 콘텐츠 스켈레톤 */}
      <div className="p-4">
        {/* 제목 스켈레톤 */}
        <div className="space-y-2 mb-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
        </div>
        
        {/* 날짜 스켈레톤 */}
        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3 mb-3"></div>

        {/* 버튼 스켈레톤 */}
        <div className="flex space-x-2">
          <div className="flex-1 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};
