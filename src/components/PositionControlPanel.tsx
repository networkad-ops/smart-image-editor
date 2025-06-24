import React from 'react';
import { TextElement } from '../types';

interface PositionControlPanelProps {
  selectedElement: TextElement | null;
  onUpdateElement: (id: string, updates: Partial<TextElement>) => void;
  canvasWidth: number;
  canvasHeight: number;
}

export const PositionControlPanel: React.FC<PositionControlPanelProps> = ({
  selectedElement,
  onUpdateElement,
  canvasWidth,
  canvasHeight
}) => {
  if (!selectedElement) {
    return null;
  }

  // 고정된 요소의 경우 제한된 편집만 허용
  const isFixedElement = selectedElement.type === 'fixed';
  const canEditPosition = selectedElement.editable?.position || isFixedElement;
  const canEditSize = selectedElement.editable?.size && !isFixedElement;

  if (!canEditPosition && !canEditSize) {
    return null;
  }

  const handlePositionChange = (property: 'x' | 'y', value: number) => {
    onUpdateElement(selectedElement.id, { [property]: Math.max(0, value) });
  };

  const handleSizeChange = (property: 'width' | 'height', value: number) => {
    if (!canEditSize) return;
    onUpdateElement(selectedElement.id, { [property]: Math.max(10, value) });
  };

  const handleAlignLeft = () => {
    onUpdateElement(selectedElement.id, { x: 0 });
  };

  const handleAlignCenter = () => {
    const centerX = Math.max(0, (canvasWidth - selectedElement.width) / 2);
    onUpdateElement(selectedElement.id, { x: centerX });
  };

  const handleAlignRight = () => {
    const rightX = Math.max(0, canvasWidth - selectedElement.width);
    onUpdateElement(selectedElement.id, { x: rightX });
  };

  const handleAlignTop = () => {
    onUpdateElement(selectedElement.id, { y: 0 });
  };

  const handleAlignMiddle = () => {
    const middleY = Math.max(0, (canvasHeight - selectedElement.height) / 2);
    onUpdateElement(selectedElement.id, { y: middleY });
  };

  const handleAlignBottom = () => {
    const bottomY = Math.max(0, canvasHeight - selectedElement.height);
    onUpdateElement(selectedElement.id, { y: bottomY });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
      {/* 요소 정보 */}
      <div className="bg-gray-50 rounded-lg p-2 mb-4">
        <div className="text-xs text-gray-600">
          <span className="font-medium">선택된 요소:</span> {
            selectedElement.id === 'main-title' ? '메인 타이틀' : 
            selectedElement.id === 'sub-title' ? '서브 타이틀' : 
            selectedElement.id === 'button-text' ? '버튼 텍스트' : 
            '자유 텍스트'
          }
          {isFixedElement && (
            <span className="ml-2 text-orange-600">(고정 요소 - 위치만 조정 가능)</span>
          )}
          {selectedElement.id === 'button-text' && (
            <div className="mt-1 flex items-center space-x-2">
              <span className="text-xs">배경색:</span>
              <div 
                className="w-4 h-4 rounded border border-gray-300"
                style={{ backgroundColor: selectedElement.backgroundColor || '#4F46E5' }}
              />
              <span className="text-xs">{selectedElement.backgroundColor || '#4F46E5'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Position Section */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Position</h3>
        
        {/* Alignment Controls */}
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-2">Alignment</label>
            <div className="grid grid-cols-6 gap-1">
              {/* 수평 정렬 */}
              <button
                onClick={handleAlignLeft}
                className="p-2 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                title="Align Left"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
              
              <button
                onClick={handleAlignCenter}
                className="p-2 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                title="Align Center"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zM6 7a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </button>
              
              <button
                onClick={handleAlignRight}
                className="p-2 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                title="Align Right"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm6 4a1 1 0 011-1h6a1 1 0 110 2h-6a1 1 0 01-1-1zM3 12a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm6 4a1 1 0 011-1h6a1 1 0 110 2h-6a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
              
              <button
                onClick={handleAlignTop}
                className="p-2 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                title="Align Top"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM4 7a1 1 0 011-1h4a1 1 0 110 2H5a1 1 0 01-1-1zm0 4a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zm0 4a1 1 0 011-1h4a1 1 0 110 2H5a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
              
              <button
                onClick={handleAlignMiddle}
                className="p-2 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                title="Align Middle"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM7 6a1 1 0 000 2h6a1 1 0 100-2H7zm0 8a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
              </button>
              
              <button
                onClick={handleAlignBottom}
                className="p-2 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                title="Align Bottom"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 17a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM4 3a1 1 0 011-1h4a1 1 0 110 2H5a1 1 0 01-1-1zm0 4a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zm0 4a1 1 0 011-1h4a1 1 0 110 2H5a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Position Inputs */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">X</label>
            <div className="flex items-center space-x-1">
              <input
                type="number"
                value={Math.round(selectedElement.x)}
                onChange={(e) => handlePositionChange('x', parseInt(e.target.value) || 0)}
                className="w-16 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                min="0"
                max={canvasWidth}
              />
              <span className="text-xs text-gray-400">px</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Y</label>
            <div className="flex items-center space-x-1">
              <input
                type="number"
                value={Math.round(selectedElement.y)}
                onChange={(e) => handlePositionChange('y', parseInt(e.target.value) || 0)}
                className="w-16 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                min="0"
                max={canvasHeight}
              />
              <span className="text-xs text-gray-400">px</span>
            </div>
          </div>
        </div>
      </div>

      {/* Constraints Section */}
      {canEditSize && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Constraints</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Width</label>
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  value={Math.round(selectedElement.width)}
                  onChange={(e) => handleSizeChange('width', parseInt(e.target.value) || 10)}
                  className="w-16 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  min="10"
                  max={canvasWidth}
                />
                <span className="text-xs text-gray-400">px</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Height</label>
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  value={Math.round(selectedElement.height)}
                  onChange={(e) => handleSizeChange('height', parseInt(e.target.value) || 10)}
                  className="w-16 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  min="10"
                  max={canvasHeight}
                />
                <span className="text-xs text-gray-400">px</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rotation Section - Future Implementation */}
      <div className="opacity-50">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Rotation</h3>
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <input
            type="number"
            value={0}
            disabled
            className="w-16 px-2 py-1 text-sm border border-gray-200 rounded bg-gray-50 text-gray-400"
          />
          <span className="text-xs text-gray-400">°</span>
        </div>
      </div>
    </div>
  );
}; 