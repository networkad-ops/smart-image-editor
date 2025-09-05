import { TextElement } from '../types';

// 텍스트 박스 좌표/크기 계산 유틸리티
export function computeTextBoxRect(block: TextElement, previewScale: number) {
  return {
    x: block.x * previewScale,
    y: block.y * previewScale,
    w: block.width * previewScale,
    h: block.height * previewScale,
    fontSize: block.fontSize * previewScale,
    lineHeight: (block.lineHeight || block.fontSize * 1.2) * previewScale,
    letterSpacing: (block.letterSpacing || 0) * previewScale,
  };
}

// 폰트 로딩 보장 유틸리티
export async function ensureFontsLoaded(f: {
  fontWeight: number | string;
  fontSize: number;
  fontFamily: string;
}) {
  await (document as any).fonts?.ready;
  try {
    await (document as any).fonts?.load(`${f.fontWeight} ${f.fontSize}px ${f.fontFamily}`);
  } catch {}
}

// 디버그 단일 스냅샷 체크
export function assertBlock(el: HTMLElement, b: TextElement, scale: number) {
  const cs = getComputedStyle(el);
  console.assert(
    cs.fontSize === `${b.fontSize * scale}px`,
    'fontSize 배율 불일치',
    { expected: `${b.fontSize * scale}px`, actual: cs.fontSize }
  );
  console.assert(
    cs.lineHeight === `${(b.lineHeight || b.fontSize * 1.2) * scale}px`,
    'lineHeight 배율 불일치',
    { expected: `${(b.lineHeight || b.fontSize * 1.2) * scale}px`, actual: cs.lineHeight }
  );
  console.assert(
    cs.letterSpacing === `${(b.letterSpacing || 0) * scale}px`,
    'letterSpacing 배율 불일치',
    { expected: `${(b.letterSpacing || 0) * scale}px`, actual: cs.letterSpacing }
  );
  console.assert(
    el.style.left === `${b.x * scale}px` && el.style.top === `${b.y * scale}px`,
    '좌표 불일치',
    { expected: `${b.x * scale}px, ${b.y * scale}px`, actual: `${el.style.left}, ${el.style.top}` }
  );
}
