import React, { useState, useCallback } from 'react';
import { BannerSelection, TextElement, Banner } from '../types';
import { ImageUpload } from './ImageUpload';
import { LogoUpload } from './LogoUpload';
import { MultiLogoUpload } from './MultiLogoUpload';
import { TextEditSidebar } from './TextEditSidebar';
import { BannerPreview } from './BannerPreview';

interface BannerEditorProps {
  selection: BannerSelection;
  uploadedImage: File | null;
  uploadedLogo: File | null;
  uploadedLogos: File[]; // 다중 로고
  textElements: TextElement[];
  onImageUpload: (file: File) => void;
  onLogoUpload: (file: File) => void;
  onMultiLogoUpload: (files: File[]) => void; // 다중 로고 업로드
  onAddText: (text: TextElement) => void;
  onTextUpdate: ({ target, patch }: { target: 'subtitle' | 'mainTitle'; patch: Partial<TextElement> }) => void;
  onTextUpdateLegacy: (id: string, updates: Partial<TextElement>) => void;
  onTextDelete: (id: string) => void;
  onComplete: (image: Blob) => void;
  onReset: () => void;
  onBack: () => void;
  onGoHome?: () => void;
  previewCanvasRef: React.RefObject<HTMLCanvasElement>;
  editingBanner: Banner | null;
  loading: boolean;
}

export const BannerEditor: React.FC<BannerEditorProps> = ({
  selection,
  uploadedImage,
  uploadedLogo,
  uploadedLogos,
  textElements,
  onImageUpload,
  onLogoUpload,
  onMultiLogoUpload,
  onAddText,
  onTextUpdate,
  onTextUpdateLegacy,
  onTextDelete,
  onComplete,
  onReset,
  onBack,
  onGoHome,
  previewCanvasRef,
  editingBanner,
  loading
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [drawReady, setDrawReady] = useState(false); // draw 완료 상태
  // 로고 크기 상태 (height만, width는 비율로 자동)
  const [logoHeight, setLogoHeight] = useState(selection.config.logo?.height || selection.config.multiLogo?.maxHeight || 56);

  const handleComplete = async () => {
    if (!previewCanvasRef.current || !uploadedImage) {
      alert('이미지를 업로드해주세요.');
      return;
    }

    try {
      setIsProcessing(true);
      
      // Canvas를 Blob으로 변환
      const blob = await new Promise<Blob>((resolve, reject) => {
        if (!previewCanvasRef.current) {
          reject(new Error('Canvas를 찾을 수 없습니다.'));
          return;
        }
        
        previewCanvasRef.current.toBlob((blob: Blob | null) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas에서 이미지를 생성할 수 없습니다.'));
          }
        }, 'image/png');
      });

      onComplete(blob);
    } catch (error) {
      console.error('이미지 처리 중 오류 발생:', error);
      alert(`이미지 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // BannerPreview에서 draw가 끝나면 호출되는 콜백
  const handleDrawComplete = useCallback(() => {
    setDrawReady(true);
  }, []);
  // draw가 시작될 때(의심되는 시점에) false로 초기화
  const handleDrawStart = useCallback(() => {
    setDrawReady(false);
  }, []);

  const handleDownloadJPG = async () => {
    if (!uploadedImage || !drawReady) return;
    try {
      setIsProcessing(true);
      // 캔버스 기반 내보내기 사용 (단일 경로)
      const { exportBanner } = await import('../utils/exportImage');
      const blob = await exportBanner(
        selection.config,
        textElements,
        uploadedImage,
        uploadedLogo,
        uploadedLogos,
        editingBanner?.background_image_url || editingBanner?.image_url,
        editingBanner?.logo_url,
        editingBanner?.logo_urls,
        logoHeight,
        { scale: 1, format: 'image/jpeg', quality: 0.99 }
      );

      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = editingBanner?.title 
        ? `${editingBanner.title.replace(/[^a-zA-Z0-9가-힣\s\-_]/g, '').trim()}_${Date.now()}.jpg`
        : `banner_${Date.now()}.jpg`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('JPG 다운로드 중 오류 발생:', error);
      alert('JPG 다운로드 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 
                className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={onGoHome}
                title="홈으로 이동"
              >
                배너 에디터
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                배너 타입을 선택한 후 이미지를 업로드하세요
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>뒤로</span>
              </button>
            </div>
          </div>
        </div>

        {/* 메인 컨텐츠: 좌우 7:3 비중 */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          {/* 좌측 70%: 이미지 업로드 + 미리보기 (flex 레이아웃으로 미리보기 영역 확대) */}
          <div className="lg:col-span-7 space-y-4">
            {/* 이미지 업로드 - 깔끔한 레이아웃 */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-medium mb-3">이미지 편집</h2>
              
              {/* 배경 이미지와 로고를 좌우 배치 */}
              <div className={`grid gap-4 ${selection.config.logo || selection.config.multiLogo ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {/* 배경 이미지 업로드 */}
                <div>
                  <h3 className="text-sm font-medium mb-2 text-gray-700">배경 이미지</h3>
                  <ImageUpload
                    onUpload={onImageUpload}
                    requiredWidth={selection.config.width}
                    requiredHeight={selection.config.height}
                  />
                </div>

                {/* 단일 로고 업로드 */}
                {selection.config.logo && (
                  <div>
                    <h3 className="text-sm font-medium mb-2 text-gray-700">로고 업로드</h3>
                    <LogoUpload
                      onUpload={onLogoUpload}
                      logoConfig={selection.config.logo}
                      uploadedLogo={uploadedLogo}
                    />
                  </div>
                )}

                {/* 다중 로고 업로드 (항공팀용) */}
                {selection.config.multiLogo && (
                  <div>
                    <h3 className="text-sm font-medium mb-2 text-gray-700">다중 로고 업로드</h3>
                    <MultiLogoUpload
                      onUpload={onMultiLogoUpload}
                      multiLogoConfig={selection.config.multiLogo}
                      uploadedLogos={uploadedLogos}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 미리보기 - 적절한 크기로 조정 */}
            <div className="w-full">
              {/* 로고 크기 조정 슬라이더 */}
              {(selection.config.logo || selection.config.multiLogo) && (
                <div className="mb-2 flex items-center gap-2">
                  <label className="text-sm text-gray-700">로고 크기</label>
                  <input
                    type="range"
                    min={24}
                    max={120}
                    value={logoHeight}
                    onChange={e => setLogoHeight(Number(e.target.value))}
                  />
                  <span className="text-xs text-gray-500">{logoHeight}px</span>
                </div>
              )}
              
              <BannerPreview
                ref={previewCanvasRef}
                config={selection.config}
                uploadedImage={uploadedImage}
                uploadedLogo={uploadedLogo}
                uploadedLogos={uploadedLogos}
                textElements={textElements}
                existingImageUrl={editingBanner?.background_image_url || editingBanner?.image_url}
                existingLogoUrl={editingBanner?.logo_url}
                existingLogoUrls={editingBanner?.logo_urls}
                logoHeight={logoHeight}
                onDrawStart={handleDrawStart}
                onDrawComplete={handleDrawComplete}
              />
            </div>

          </div>

          {/* 우측 30%: 텍스트 편집 + 액션 버튼 */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <h2 className="text-lg font-semibold mb-4">텍스트 편집</h2>
              
              {/* TextEditSidebar 컴포넌트 사용하여 색상 선택 기능 포함 */}
              <TextEditSidebar
                config={selection.config}
                textElements={textElements}
                onAddText={onAddText}
                onUpdateText={onTextUpdate}
                onUpdateTextLegacy={onTextUpdateLegacy}
                onDeleteText={onTextDelete}
                showTitle={false}
                showBackground={false}
              />

              {/* 액션 버튼들 */}
              <div className="mt-6 pt-4 border-t border-gray-200 space-y-3">
                {/* JPG 다운로드 버튼 */}
                <button
                  onClick={handleDownloadJPG}
                  disabled={!drawReady || isProcessing}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                >
                  {isProcessing ? '이미지 생성 중...' : 'JPG 다운로드'}
                </button>
                
                {/* 배너 저장 버튼 */}
                <button
                  onClick={handleComplete}
                  disabled={!uploadedImage || isProcessing || loading}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                >
                  {isProcessing || loading ? '처리 중...' : editingBanner ? '배너 업데이트' : '배너 저장'}
                </button>
                
                <button
                  onClick={onReset}
                  className="w-full px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium"
                >
                  초기화
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default BannerEditor; 