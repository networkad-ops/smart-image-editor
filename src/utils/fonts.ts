export async function ensureFontsLoaded(): Promise<void> {
  if (document && 'fonts' in document) {
    // 이미 로드된 경우 빠르게 반환
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyDoc: any = document;
    if (anyDoc.fonts && typeof anyDoc.fonts.ready?.then === 'function') {
      await anyDoc.fonts.ready;
      return;
    }
  }
  // 폴백: 약간의 지연 후 진행
  await new Promise(resolve => setTimeout(resolve, 50));
}

