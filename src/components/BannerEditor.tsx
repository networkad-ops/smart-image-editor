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
  onTextUpdate: (id: string, updates: Partial<TextElement>) => void;
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
    if (!previewCanvasRef.current || !drawReady) return;
    try {
      setIsProcessing(true);

      const config = selection.config;

      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = config.width;
      exportCanvas.height = config.height;
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) throw new Error('캔버스 컨텍스트를 생성할 수 없습니다.');

      const loadImage = (source: File | string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new window.Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = (e) => reject(e);
          img.src = typeof source === 'string' ? source : URL.createObjectURL(source);
        });
      };

      // 배경 이미지 그리기 (contain, 중앙 정렬)
      const backgroundSource: File | string | null = uploadedImage || (editingBanner?.background_image_url || editingBanner?.image_url) || null;
      if (backgroundSource) {
        try {
          const bgImg = await loadImage(backgroundSource);
          const imageRatio = bgImg.width / bgImg.height;
          const canvasRatio = exportCanvas.width / exportCanvas.height;
          let drawWidth = exportCanvas.width;
          let drawHeight = exportCanvas.height;
          let offsetX = 0;
          let offsetY = 0;
          if (imageRatio > canvasRatio) {
            drawHeight = exportCanvas.width / imageRatio;
            offsetY = (exportCanvas.height - drawHeight) / 2;
          } else {
            drawWidth = exportCanvas.height * imageRatio;
            offsetX = (exportCanvas.width - drawWidth) / 2;
          }
          ctx.drawImage(bgImg, offsetX, offsetY, drawWidth, drawHeight);
        } catch (e) {
          console.warn('배경 이미지 로드 실패, 배경 생략:', e);
        }
      }

      // 단일 로고 그리기
      const logoSource: File | string | null = uploadedLogo || (editingBanner?.logo_url || null);
      if (logoSource && config.logo) {
        try {
          const logoImg = await loadImage(logoSource);
          const fixedHeight = (logoHeight || 56);
          const aspectRatio = logoImg.width / logoImg.height;
          const calculatedWidth = fixedHeight * aspectRatio;
          ctx.drawImage(
            logoImg,
            config.logo.x,
            config.logo.y,
            calculatedWidth,
            fixedHeight
          );
        } catch (e) {
          console.warn('로고 로드 실패, 로고 생략:', e);
        }
      }

      // 다중 로고 그리기
      const multiLogoSources: (File | string)[] = (uploadedLogos && uploadedLogos.length > 0)
        ? uploadedLogos
        : (editingBanner?.logo_urls || []);
      if (multiLogoSources.length > 0 && config.multiLogo) {
        try {
          const images = await Promise.all(
            multiLogoSources.map(async (src) => {
              try {
                const img = await loadImage(src);
                return img;
              } catch {
                return null;
              }
            })
          );
          const validImages = images.filter((img): img is HTMLImageElement => !!img);
          if (validImages.length > 0) {
            const logoHe = (logoHeight || config.multiLogo.maxHeight);
            const logoGap = (config.multiLogo.logoGap ?? 16);
            const separatorWidth = (config.multiLogo.separatorWidth ?? 4);
            const logoWidths = validImages.map((img) => (logoHe * (img.width / img.height)));
            let currentX = (config.multiLogo?.x ?? 0);
            const baseY = (config.multiLogo?.y ?? 0);
            validImages.forEach((img, index) => {
              const logoWidth = logoWidths[index];
              ctx.drawImage(img, currentX, baseY, logoWidth, logoHe);
              currentX += logoWidth;
              if (index < validImages.length - 1 && config.multiLogo) {
                const separatorHeight = logoHe * 0.8;
                const separatorX = currentX + ((logoGap - separatorWidth) / 2);
                const separatorY = baseY + (logoHe - separatorHeight) / 2;
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(separatorX, separatorY, separatorWidth, separatorHeight);
                currentX += logoGap;
              }
            });
          }
        } catch (e) {
          console.warn('다중 로고 로드 실패, 생략:', e);
        }
      }

      // 텍스트 렌더링
      const isInteractiveBanner = config.name.includes('인터랙티브');

      const drawRoundedRect = (
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number
      ) => {
        const r = Math.min(radius, width / 2, height / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + width - r, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + r);
        ctx.lineTo(x + width, y + height - r);
        ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
        ctx.lineTo(x + r, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
      };

      textElements.forEach((element) => {
        ctx.save();
        const fontWeight = element.fontWeight || 400;
        const fixedFontSize = element.fontSize; // 폰트 크기를 고정
        ctx.font = `${fontWeight} ${fixedFontSize}px Pretendard`;
        ctx.textBaseline = 'top';

        if (element.id === 'button-text') {
          // 버튼 배경
          const bx = element.x;
          const by = element.y;
          const bw = element.width;
          const bh = element.height;
          const borderRadius = 20;
          ctx.fillStyle = element.backgroundColor || '#4F46E5';
          drawRoundedRect(bx, by, bw, bh, borderRadius);
          // 그림자
          ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
          ctx.shadowBlur = 6;
          ctx.shadowOffsetY = 3;
          ctx.fill();
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetY = 0;
        }

        if (element.id === 'button-text') {
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
        } else if ((element.id === 'sub-title' || element.id === 'main-title' || element.id === 'bottom-sub-title') && isInteractiveBanner) {
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
        } else {
          ctx.textAlign = 'start';
          ctx.textBaseline = 'top';
        }

        const lines = element.text.split('\n');
        const lineHeight = element.fontSize * 1.2;
        const letterSpacing = (element.letterSpacing || 0);

        lines.forEach((line, lineIndex) => {
          let y: number;
          let currentX: number;

          if (element.id === 'button-text') {
            y = element.y + (element.height) / 2 + (lineIndex * lineHeight);
            currentX = element.x + (element.width) / 2;
          } else if ((element.id === 'sub-title' || element.id === 'main-title' || element.id === 'bottom-sub-title') && isInteractiveBanner) {
            y = element.y + (lineIndex * lineHeight);
            currentX = element.x + (element.width) / 2;
          } else {
            y = element.y + (lineIndex * lineHeight);
            currentX = element.x;
          }

          if (element.id === 'button-text') {
            ctx.fillStyle = element.color;
            const displayText = line || 'Button';
            if (letterSpacing) {
              // letterSpacing 적용
              for (let i = 0; i < displayText.length; i++) {
                const char = displayText[i];
                const originalAlign = ctx.textAlign;
                ctx.textAlign = 'start';
                ctx.fillText(char, currentX, y);
                ctx.textAlign = originalAlign as CanvasTextAlign;
                currentX += ctx.measureText(char).width + letterSpacing;
              }
            } else {
              ctx.fillText(displayText, currentX, y);
            }
            return;
          }

          if (element.colorSegments && element.colorSegments.length > 0) {
            const lineStart = lines.slice(0, lineIndex).join('\n').length + (lineIndex > 0 ? 1 : 0);

            if ((element.id === 'sub-title' || element.id === 'main-title' || element.id === 'bottom-sub-title') && isInteractiveBanner) {
              const totalWidth = letterSpacing
                ? line.split('').reduce((sum, char, idx) => sum + ctx.measureText(char).width + (idx < line.length - 1 ? letterSpacing : 0), 0)
                : ctx.measureText(line).width;
              currentX = currentX - totalWidth / 2;
            }

            let lastIndex = 0;
            for (let i = 0; i < line.length; i++) {
              const globalIndex = lineStart + i;
              const segment = element.colorSegments.find(seg => globalIndex >= seg.start && globalIndex < seg.end);
              const nextChar = line[i + 1];
              const nextGlobalIndex = globalIndex + 1;
              const nextSegment = element.colorSegments.find(seg => nextGlobalIndex >= seg.start && nextGlobalIndex < seg.end);
              if (!nextChar || segment?.color !== nextSegment?.color) {
                const textPart = line.substring(lastIndex, i + 1);
                ctx.fillStyle = segment?.color || element.color;

                if (letterSpacing) {
                  for (let j = 0; j < textPart.length; j++) {
                    const char = textPart[j];
                    const originalAlign = ctx.textAlign;
                    ctx.textAlign = 'start';
                    ctx.fillText(char, currentX, y);
                    ctx.textAlign = originalAlign as CanvasTextAlign;
                    currentX += ctx.measureText(char).width + (j < textPart.length - 1 ? letterSpacing : 0);
                  }
                } else {
                  ctx.fillText(textPart, currentX, y);
                  currentX += ctx.measureText(textPart).width;
                }
                lastIndex = i + 1;
              }
            }
          } else {
            if (element.gradient) {
              const grad = ctx.createLinearGradient(
                element.x,
                element.y,
                (element.x + element.width),
                element.y
              );
              grad.addColorStop(0, element.gradient.from);
              grad.addColorStop(1, element.gradient.to);
              ctx.fillStyle = grad;
            } else {
              ctx.fillStyle = element.color;
            }
            if (letterSpacing) {
              for (let j = 0; j < line.length; j++) {
                const char = line[j];
                const originalAlign = ctx.textAlign;
                ctx.textAlign = 'start';
                ctx.fillText(char, currentX, y);
                ctx.textAlign = originalAlign as CanvasTextAlign;
                currentX += ctx.measureText(char).width + (j < line.length - 1 ? letterSpacing : 0);
              }
            } else {
              ctx.fillText(line, currentX, y);
            }
          }

          ctx.restore();
        });
      });

      const blob = await new Promise<Blob>((resolve, reject) => {
        exportCanvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('이미지 생성 실패'));
        }, 'image/jpeg', 0.92);
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = editingBanner?.title 
        ? `${editingBanner.title.replace(/[^-\s-]/g, '').trim()}_${Date.now()}.jpg`
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