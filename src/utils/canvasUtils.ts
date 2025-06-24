export function drawTextWithLineBreaks(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, lineHeight: number) {
  const lines = text.split('\\n');
  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });
}

export function drawMultilineText(
  ctx: CanvasRenderingContext2D, 
  text: string, 
  x: number, 
  y: number, 
  maxWidth: number, 
  lineHeight: number,
  font: string,
  color: string
) {
  ctx.font = font;
  ctx.fillStyle = color;
  const words = text.split(' ');
  let line = '';
  let testY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, testY);
      line = words[n] + ' ';
      testY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, testY);
}

export function applyRangeColor(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  defaultColor: string,
  ranges: { start: number; end: number; color: string }[]
) {
  let currentX = x;
  ctx.fillStyle = defaultColor;

  if (!ranges || ranges.length === 0) {
    ctx.fillText(text, x, y);
    return;
  }

  let lastIndex = 0;
  
  ranges.forEach(({ start, end, color }) => {
    // 이전 부분 텍스트 (기본 색상)
    if (start > lastIndex) {
      const segment = text.substring(lastIndex, start);
      ctx.fillStyle = defaultColor;
      ctx.fillText(segment, currentX, y);
      currentX += ctx.measureText(segment).width;
    }

    // 색상 변경 부분 텍스트
    const segment = text.substring(start, end);
    ctx.fillStyle = color;
    ctx.fillText(segment, currentX, y);
    currentX += ctx.measureText(segment).width;
    
    lastIndex = end;
  });

  // 나머지 부분 텍스트 (기본 색상)
  if (lastIndex < text.length) {
    const segment = text.substring(lastIndex);
    ctx.fillStyle = defaultColor;
    ctx.fillText(segment, currentX, y);
  }
}

// Letter Spacing이 적용된 텍스트 그리기
export function drawTextWithLetterSpacing(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  letterSpacing: number = 0
) {
  if (letterSpacing === 0) {
    ctx.fillText(text, x, y);
    return;
  }

  // 중앙 정렬인 경우 시작 위치 계산
  let startX = x;
  if (ctx.textAlign === 'center') {
    // 전체 텍스트 너비 계산 (letterSpacing 포함)
    let totalWidth = 0;
    for (let i = 0; i < text.length; i++) {
      totalWidth += ctx.measureText(text[i]).width;
      if (i < text.length - 1) {
        totalWidth += letterSpacing;
      }
    }
    startX = x - totalWidth / 2;
  }

  let currentX = startX;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    // 개별 문자는 왼쪽 정렬로 그리기
    const originalAlign = ctx.textAlign;
    ctx.textAlign = 'start';
    ctx.fillText(char, currentX, y);
    ctx.textAlign = originalAlign;
    currentX += ctx.measureText(char).width + letterSpacing;
  }
} 