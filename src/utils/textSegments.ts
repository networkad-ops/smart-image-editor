import { ColorSegment } from '../types';

// 색상 세그먼트 병합 함수
export const mergeSegments = (
  segments: ColorSegment[],
  range: { start: number; end: number },
  color: string
): ColorSegment[] => {
  const newSegment: ColorSegment = { start: range.start, end: range.end, color };
  
  // 기존 세그먼트와 겹치지 않는 부분만 유지
  let updatedSegments = segments.filter(segment => 
    segment.end <= range.start || segment.start >= range.end
  );
  
  // 겹치는 세그먼트들을 분할
  segments.forEach(segment => {
    if (segment.start < range.start && segment.end > range.start && segment.end <= range.end) {
      // 왼쪽 부분만 유지
      updatedSegments.push({ ...segment, end: range.start });
    } else if (segment.start >= range.start && segment.start < range.end && segment.end > range.end) {
      // 오른쪽 부분만 유지
      updatedSegments.push({ ...segment, start: range.end });
    } else if (segment.start < range.start && segment.end > range.end) {
      // 양쪽 부분 모두 유지
      updatedSegments.push({ ...segment, end: range.start });
      updatedSegments.push({ ...segment, start: range.end });
    }
  });
  
  // 새 세그먼트 추가
  updatedSegments.push(newSegment);
  
  // 시작 위치로 정렬
  updatedSegments.sort((a, b) => a.start - b.start);
  
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

// 텍스트 런 빌드 함수
export const buildRuns = (
  text: string,
  baseColor: string,
  colorSegments: ColorSegment[] = [],
  previewSegments: ColorSegment[] = []
): Array<{ text: string; color: string }> => {
  // 정규화: \r\n을 \n으로 변환
  const normalizedText = text.replace(/\r\n/g, '\n');
  
  // 모든 세그먼트를 하나의 배열로 합치고 정렬
  const allSegments = [...colorSegments, ...previewSegments]
    .sort((a, b) => a.start - b.start);
  
  const runs: Array<{ text: string; color: string }> = [];
  let currentIndex = 0;
  
  for (const segment of allSegments) {
    // 세그먼트 시작 전까지의 텍스트
    if (currentIndex < segment.start) {
      const textBefore = normalizedText.slice(currentIndex, segment.start);
      if (textBefore) {
        runs.push({ text: textBefore, color: baseColor });
      }
    }
    
    // 세그먼트 텍스트
    const segmentText = normalizedText.slice(segment.start, segment.end);
    if (segmentText) {
      runs.push({ text: segmentText, color: segment.color });
    }
    
    currentIndex = Math.max(currentIndex, segment.end);
  }
  
  // 남은 텍스트
  if (currentIndex < normalizedText.length) {
    const remainingText = normalizedText.slice(currentIndex);
    if (remainingText) {
      runs.push({ text: remainingText, color: baseColor });
    }
  }
  
  // 텍스트가 비어있으면 기본 런 반환
  if (runs.length === 0 && normalizedText) {
    runs.push({ text: normalizedText, color: baseColor });
  }
  
  return runs;
};
