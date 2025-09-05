import React, { useMemo, useEffect, useRef } from 'react';
import { TextElement } from '../types';
import { computeTextBoxRect, ensureFontsLoaded, assertBlock } from '../utils/textLayout';

// 타입 정의
type ColorRange = { start: number; end: number; color: string };

// draft 우선 오버레이 병합
function mergeRanges(committed: ColorRange[] = [], draft?: ColorRange | null): ColorRange[] {
  const input: ColorRange[] = [...committed];
  if (draft && draft.end > draft.start) input.push(draft);
  input.sort((a, b) => a.start - b.start || a.end - b.end);
  const result: ColorRange[] = [];
  for (const curr of input) {
    let i = 0;
    while (i < result.length && result[i].end <= curr.start) i++;
    const before = result.slice(0, i);
    const after: ColorRange[] = [];
    for (let j = i; j < result.length; j++) {
      const prev = result[j];
      if (prev.start >= curr.end) { after.push(prev); continue; }
      if (prev.start < curr.start) before.push({ start: prev.start, end: curr.start, color: prev.color });
      if (prev.end > curr.end) after.push({ start: curr.end, end: prev.end, color: prev.color });
    }
    before.push({ ...curr });
    result.length = 0;
    const merged = [...before, ...after].sort((a, b) => a.start - b.start || a.end - b.end);
    for (const seg of merged) {
      if (seg.end <= seg.start) continue;
      const last = result[result.length - 1];
      if (last && last.color === seg.color && last.end === seg.start) last.end = seg.end; else result.push({ ...seg });
    }
  }
  return result;
}

// 텍스트를 라인 단위 세그먼트로 변환
function toSegments(text: string, ranges: ColorRange[]) {
  const normalized = text.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  const maxLen = normalized.length;
  const clamped = ranges
    .map(r => ({ start: Math.max(0, Math.min(maxLen, r.start)), end: Math.max(0, Math.min(maxLen, r.end)), color: r.color }))
    .filter(r => r.end > r.start)
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const segments: Array<{ text: string; color?: string; lineIdx: number; segIdx: number; start: number; end: number }> = [];
  let global = 0;
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    const lineStart = global;
    const lineEnd = lineStart + line.length;
    let cursor = lineStart;
    let segIdx = 0;
    for (const r of clamped) {
      if (r.end <= lineStart || r.start >= lineEnd) continue;
      const a = Math.max(lineStart, r.start);
      const b = Math.min(lineEnd, r.end);
      if (cursor < a) segments.push({ text: normalized.slice(cursor, a), color: undefined, lineIdx, segIdx: segIdx++, start: cursor, end: a });
      segments.push({ text: normalized.slice(a, b), color: r.color, lineIdx, segIdx: segIdx++, start: a, end: b });
      cursor = b;
    }
    if (cursor < lineEnd) segments.push({ text: normalized.slice(cursor, lineEnd), color: undefined, lineIdx, segIdx: segIdx++, start: cursor, end: lineEnd });
    global = lineEnd + 1; // '\n'
  }
  return segments;
}

// 텍스트 박스 컴포넌트 (배율 중복 제거)
export function TextBox({ 
  block, 
  previewScale, 
  committedRanges = [], 
  draftRange 
}: { 
  block: TextElement; 
  previewScale: number; 
  committedRanges?: ColorRange[]; 
  draftRange?: ColorRange | null; 
}) {
  const elementRef = useRef<HTMLDivElement>(null);
  
  // 폰트 로딩 보장
  useEffect(() => {
    ensureFontsLoaded({
      fontWeight: block.fontWeight || 400,
      fontSize: block.fontSize,
      fontFamily: block.fontFamily || 'Pretendard'
    });
  }, [block.fontWeight, block.fontSize, block.fontFamily]);

  // 좌표/크기 계산 (previewScale만 적용)
  const s = computeTextBoxRect(block, previewScale);
  
  // 스타일 정의 (인라인만 사용, Tailwind 클래스 금지)
  const style = {
    position: 'absolute' as const,
    left: `${s.x}px`,
    top: `${s.y}px`,
    width: `${s.w}px`,
    height: `${s.h}px`,
    fontFamily: block.fontFamily || 'Pretendard',
    fontWeight: block.fontWeight || 400,
    fontSize: `${s.fontSize}px`,          // ✅ previewScale만
    lineHeight: `${s.lineHeight}px`,      // ✅
    letterSpacing: `${s.letterSpacing}px`,// ✅
    whiteSpace: 'pre-wrap' as const,
    overflow: 'hidden' as const,
    color: block.color || '#000000',
    textAlign: block.textAlign || 'left' as const,
    // Tailwind 간섭 차단
    transform: 'none',
    zoom: 1,
  };

  // 세그먼트 렌더링
  const merged = useMemo(() => mergeRanges(committedRanges, draftRange), [committedRanges, draftRange]);
  const segments = useMemo(() => toSegments(block.text, merged), [block.text, merged]);

  // 디버그 검증
  useEffect(() => {
    if (elementRef.current) {
      assertBlock(elementRef.current, block, previewScale);
    }
  }, [block, previewScale]);

  return (
    <div ref={elementRef} className="text-box" style={style}>
      {segments.map(seg => (
        <span key={`${seg.lineIdx}:${seg.segIdx}:${seg.start}-${seg.end}`} style={{ color: seg.color ?? 'inherit' }}>
          {seg.text}
        </span>
      ))}
    </div>
  );
}

// 기존 TextPreview 컴포넌트 (하위 호환성)
export default function TextPreview(props: { rawText: string; committedRanges: ColorRange[]; draftRange?: ColorRange | null; className?: string }) {
  let { rawText, committedRanges, draftRange, className } = props;
  // TODO: remove deprecated colorRanges
  if ((props as any).colorRanges) {
    committedRanges = (props as any).colorRanges as ColorRange[];
  }
  const merged = useMemo(() => mergeRanges(committedRanges, draftRange), [committedRanges, draftRange]);
  const segments = useMemo(() => toSegments(rawText, merged), [rawText, merged]);
  return (
    <span style={{ whiteSpace: 'pre-wrap' }}>
      {segments.map(seg => (
        <span key={`${seg.lineIdx}:${seg.segIdx}:${seg.start}-${seg.end}`} style={{ color: seg.color ?? 'inherit' }}>{seg.text}</span>
      ))}
    </span>
  );
}


