import { ColorSegment } from '../types';

// 줄과 컬럼 위치 변환 함수
export const getLineAndColFromOffset = (text: string, offset: number) => {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  let count = 0;
  for (let i = 0; i < lines.length; i++) {
    const lineLen = lines[i].length + 1; // +1 for '\n'
    if (offset < count + lineLen) {
      return { line: i, col: offset - count };
    }
    count += lineLen;
  }
  return { line: lines.length - 1, col: lines[lines.length - 1].length };
};

// 다중 줄 범위 변환 함수
export const getMultiLineRanges = (text: string, start: number, end: number) => {
  const s = getLineAndColFromOffset(text, start);
  const e = getLineAndColFromOffset(text, end);
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const ranges = [];
  
  for (let l = s.line; l <= e.line; l++) {
    const startCol = l === s.line ? s.col : 0;
    const endCol = l === e.line ? e.col : lines[l].length;
    ranges.push({ line: l, start: startCol, end: endCol });
  }
  return ranges;
};

// 색상 세그먼트 병합 함수 (줄 단위)
export const mergeSegments = (
  segments: ColorSegment[],
  ranges: Array<{ line: number; start: number; end: number }>,
  color: string
): ColorSegment[] => {
  const newSegments: ColorSegment[] = ranges.map(range => ({
    line: range.line,
    start: range.start,
    end: range.end,
    color
  }));
  
  // 기존 세그먼트와 겹치지 않는 부분만 유지
  let updatedSegments: ColorSegment[] = [];
  
  // 각 줄별로 처리
  const lines = new Set([...segments.map(s => s.line), ...ranges.map(r => r.line)]);
  
  lines.forEach(lineNum => {
    const lineSegments = segments.filter(s => s.line === lineNum);
    const lineRanges = ranges.filter(r => r.line === lineNum);
    
    if (lineRanges.length === 0) {
      // 해당 줄에 새 범위가 없으면 기존 세그먼트 유지
      updatedSegments.push(...lineSegments);
      return;
    }
    
    // 해당 줄의 기존 세그먼트들을 새 범위와 병합
    let lineUpdatedSegments = [...lineSegments];
    
    lineRanges.forEach(range => {
      // 겹치는 기존 세그먼트 제거
      lineUpdatedSegments = lineUpdatedSegments.filter(segment => 
        segment.end <= range.start || segment.start >= range.end
      );
      
      // 겹치는 세그먼트들을 분할
      lineSegments.forEach(segment => {
        if (segment.start < range.start && segment.end > range.start && segment.end <= range.end) {
          // 왼쪽 부분만 유지
          lineUpdatedSegments.push({ ...segment, end: range.start });
        } else if (segment.start >= range.start && segment.start < range.end && segment.end > range.end) {
          // 오른쪽 부분만 유지
          lineUpdatedSegments.push({ ...segment, start: range.end });
        } else if (segment.start < range.start && segment.end > range.end) {
          // 양쪽 부분 모두 유지
          lineUpdatedSegments.push({ ...segment, end: range.start });
          lineUpdatedSegments.push({ ...segment, start: range.end });
        }
      });
      
      // 새 세그먼트 추가
      lineUpdatedSegments.push({
        line: range.line,
        start: range.start,
        end: range.end,
        color
      });
    });
    
    updatedSegments.push(...lineUpdatedSegments);
  });
  
  // 줄 번호와 시작 위치로 정렬
  updatedSegments.sort((a, b) => {
    if (a.line !== b.line) return a.line - b.line;
    return a.start - b.start;
  });
  
  return updatedSegments;
};

// 색상 세그먼트 제거 함수
export const subtractSegments = (
  segments: ColorSegment[],
  range: { start: number; end: number }
): ColorSegment[] => {
  return segments.filter(segment => 
    segment.end <= range.start || segment.start >= range.end
  );
};

// 텍스트 런 빌드 함수 (줄 단위)
export const buildRuns = (
  text: string,
  baseColor: string,
  colorSegments: ColorSegment[] = [],
  previewSegments: ColorSegment[] = []
): Array<{ text: string; color: string; line: number }> => {
  // 정규화: \r\n을 \n으로 변환
  const normalizedText = text.replace(/\r\n/g, '\n');
  const lines = normalizedText.split('\n');
  
  const allRuns: Array<{ text: string; color: string; line: number }> = [];
  
  lines.forEach((line, lineIndex) => {
    // 해당 줄의 세그먼트들 필터링
    const segmentsForLine = [...colorSegments, ...previewSegments]
      .filter(s => s.line === lineIndex)
      .sort((a, b) => a.start - b.start);
    
    const lineRuns: Array<{ text: string; color: string; line: number }> = [];
    let currentIndex = 0;
    
    for (const segment of segmentsForLine) {
      // 세그먼트 시작 전까지의 텍스트
      if (currentIndex < segment.start) {
        const textBefore = line.slice(currentIndex, segment.start);
        if (textBefore) {
          lineRuns.push({ text: textBefore, color: baseColor, line: lineIndex });
        }
      }
      
      // 세그먼트 텍스트
      const segmentText = line.slice(segment.start, segment.end);
      if (segmentText) {
        lineRuns.push({ text: segmentText, color: segment.color, line: lineIndex });
      }
      
      currentIndex = Math.max(currentIndex, segment.end);
    }
    
    // 남은 텍스트
    if (currentIndex < line.length) {
      const remainingText = line.slice(currentIndex);
      if (remainingText) {
        lineRuns.push({ text: remainingText, color: baseColor, line: lineIndex });
      }
    }
    
    // 텍스트가 비어있으면 기본 런 반환
    if (lineRuns.length === 0 && line) {
      lineRuns.push({ text: line, color: baseColor, line: lineIndex });
    }
    
    allRuns.push(...lineRuns);
  });
  
  return allRuns;
};
