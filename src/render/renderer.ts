import { BannerConfig, TextElement } from '../types';
import { drawTextWithLetterSpacing } from '../utils/canvasUtils';

// 렌더링 데이터 타입
export interface RenderData {
  width: number;
  height: number;
  image?: {
    src: string;
    crop?: {
      sx: number;
      sy: number;
      sw: number;
      sh: number;
    };
  };
  text: {
    subTitle?: TextElement;
    mainTitle?: TextElement;
    bottomSubTitle?: TextElement;
    buttonText?: TextElement;
  };
  logo?: {
    src: string;
    x: number;
    y: number;
    width: number;
    height: number;
  };
  multiLogo?: {
    srcs: string[];
    x: number;
    y: number;
    maxHeight: number;
    logoGap: number;
    separatorWidth: number;
  };
}

// 통합 배너 렌더러
export async function renderBanner(
  canvas: HTMLCanvasElement,
  size: { width: number; height: number },
  data: RenderData,
  config: BannerConfig
): Promise<void> {
  // ① 폰트 로딩 완료 대기
  await document.fonts.ready;
  
  // DPR 설정 (내부 픽셀 버퍼에만 적용)
  const dpr = window.devicePixelRatio || 1;
  canvas.width = size.width * dpr;
  canvas.height = size.height * dpr;
  
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // 다운로드와 동일한 변환
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // 캔버스 클리어
  ctx.clearRect(0, 0, size.width, size.height);
  
  // ② 배경 이미지 렌더링
  if (data.image) {
    await renderBackgroundImage(ctx, data.image, size);
  }
  
  // 로고 렌더링
  if (data.logo) {
    await renderLogo(ctx, data.logo);
  }
  
  if (data.multiLogo) {
    await renderMultiLogo(ctx, data.multiLogo);
  }
  
  // ③ 텍스트 렌더링
  if (data.text.subTitle) {
    renderTextBlock(ctx, data.text.subTitle, size);
  }
  if (data.text.mainTitle) {
    renderTextBlock(ctx, data.text.mainTitle, size);
  }
  if (data.text.bottomSubTitle) {
    renderTextBlock(ctx, data.text.bottomSubTitle, size);
  }
  if (data.text.buttonText) {
    renderTextBlock(ctx, data.text.buttonText, size);
  }
}

// 배경 이미지 렌더링
async function renderBackgroundImage(
  ctx: CanvasRenderingContext2D,
  imageData: RenderData['image'],
  size: { width: number; height: number }
): Promise<void> {
  if (!imageData) return;
  
  const img = new Image();
  img.crossOrigin = 'anonymous';
  
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('이미지 로딩 실패'));
    img.src = imageData.src;
  });
  
  if (imageData.crop) {
    // 자르기된 이미지: 원본 픽셀 좌표 사용
    ctx.drawImage(
      img,
      imageData.crop.sx, imageData.crop.sy, imageData.crop.sw, imageData.crop.sh,
      0, 0, size.width, size.height
    );
  } else {
    // 일반 이미지: contain 계산으로 중앙 배치
    const imageRatio = img.width / img.height;
    const canvasRatio = size.width / size.height;
    
    let drawWidth = size.width;
    let drawHeight = size.height;
    let offsetX = 0;
    let offsetY = 0;
    
    if (imageRatio > canvasRatio) {
      drawHeight = size.width / imageRatio;
      offsetY = (size.height - drawHeight) / 2;
    } else {
      drawWidth = size.height * imageRatio;
      offsetX = (size.width - drawWidth) / 2;
    }
    
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  }
}

// 로고 렌더링
async function renderLogo(
  ctx: CanvasRenderingContext2D,
  logoData: RenderData['logo']
): Promise<void> {
  if (!logoData) return;
  
  const img = new Image();
  img.crossOrigin = 'anonymous';
  
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('로고 로딩 실패'));
    img.src = logoData.src;
  });
  
  ctx.drawImage(
    img,
    logoData.x, logoData.y, logoData.width, logoData.height
  );
}

// 다중 로고 렌더링
async function renderMultiLogo(
  ctx: CanvasRenderingContext2D,
  multiLogoData: RenderData['multiLogo']
): Promise<void> {
  if (!multiLogoData || multiLogoData.srcs.length === 0) return;
  
  const logoImgs = await Promise.all(
    multiLogoData.srcs.map(async (src) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('다중 로고 로딩 실패'));
        img.src = src;
      });
      return img;
    })
  );
  
  let currentX = multiLogoData.x;
  const baseY = multiLogoData.y;
  
  logoImgs.forEach((img, index) => {
    const aspectRatio = img.width / img.height;
    const logoWidth = multiLogoData.maxHeight * aspectRatio;
    
    // 로고 그리기
    ctx.drawImage(img, currentX, baseY, logoWidth, multiLogoData.maxHeight);
    currentX += logoWidth;
    
    // 마지막 로고가 아니면 구분자 그리기
    if (index < logoImgs.length - 1) {
      const separatorHeight = multiLogoData.maxHeight * 0.8;
      const separatorX = currentX + ((multiLogoData.logoGap - multiLogoData.separatorWidth) / 2);
      const separatorY = baseY + (multiLogoData.maxHeight - separatorHeight) / 2;
      
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(separatorX, separatorY, multiLogoData.separatorWidth, separatorHeight);
      currentX += multiLogoData.logoGap;
    }
  });
}

// 텍스트 블록 렌더링
function renderTextBlock(
  ctx: CanvasRenderingContext2D,
  textElement: TextElement,
  size: { width: number; height: number }
): void {
  // ④ overflow:hidden을 ctx.clip(rect)로 처리
  ctx.save();
  ctx.beginPath();
  ctx.rect(textElement.x, textElement.y, textElement.width, textElement.height);
  ctx.clip();
  
  // 폰트 설정
  const fontWeight = textElement.fontWeight || 400;
  const fontSize = textElement.fontPxAtBase || textElement.fontSize;
  ctx.font = `${fontWeight} ${fontSize}px ${textElement.fontFamily}`;
  ctx.textBaseline = 'top';
  
  // 텍스트 정렬 설정
  const isInteractiveBanner = textElement.id.includes('interactive') || 
    (textElement.id === 'sub-title' || textElement.id === 'main-title' || textElement.id === 'bottom-sub-title');
  
  if (textElement.id === 'button-text') {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
  } else if (isInteractiveBanner) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
  } else {
    ctx.textAlign = 'start';
    ctx.textBaseline = 'top';
  }
  
  // 줄바꿈 처리
  const lines = textElement.text.replace(/\r\n/g, '\n').split('\n');
  const maxLines = textElement.id === 'sub-title' ? 1 : 2;
  const limitedLines = lines.slice(0, maxLines);
  
  // lineHeight 계산
  const lineHeight = textElement.lineHeight || fontSize * 1.2;
  
  limitedLines.forEach((line, lineIndex) => {
    let y, currentX;
    
    if (textElement.id === 'button-text') {
      y = textElement.y + textElement.height / 2 + (lineIndex * lineHeight);
      currentX = textElement.x + textElement.width / 2;
    } else if (isInteractiveBanner) {
      y = textElement.y + (lineIndex * lineHeight);
      currentX = textElement.x + textElement.width / 2;
    } else {
      y = textElement.y + (lineIndex * lineHeight);
      currentX = textElement.x;
    }
    
    // 부분 색상 처리
    if (textElement.colorSegments && textElement.colorSegments.length > 0) {
      renderColoredText(ctx, line, currentX, y, textElement);
    } else {
      // 단색 텍스트
      if (textElement.gradient) {
        const grad = ctx.createLinearGradient(textElement.x, textElement.y, textElement.x + textElement.width, textElement.y);
        grad.addColorStop(0, textElement.gradient.from);
        grad.addColorStop(1, textElement.gradient.to);
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = textElement.color;
      }
      
      if (textElement.letterSpacing) {
        drawTextWithLetterSpacing(ctx, line, currentX, y, textElement.letterSpacing);
      } else {
        ctx.fillText(line, currentX, y);
      }
    }
  });
  
  ctx.restore();
}

// 부분 색상 텍스트 렌더링
function renderColoredText(
  ctx: CanvasRenderingContext2D,
  line: string,
  startX: number,
  y: number,
  textElement: TextElement
): void {
  const lineStart = 0; // 현재 줄의 시작 인덱스
  const lineSegments = (textElement.colorSegments || []).filter(s => s.line === 0);
  
  let x = startX;
  
  lineSegments.forEach(segment => {
    const segmentText = line.slice(segment.start - lineStart, segment.end - lineStart);
    if (segmentText) {
      ctx.fillStyle = segment.color;
      if (textElement.letterSpacing) {
        drawTextWithLetterSpacing(ctx, segmentText, x, y, textElement.letterSpacing);
      } else {
        ctx.fillText(segmentText, x, y);
      }
      x += ctx.measureText(segmentText).width;
    }
  });
}
