export interface SampleImage {
  id: string;
  name: string;
  url: string;
  category: 'business' | 'lifestyle' | 'technology' | 'food' | 'travel' | 'fashion';
  description?: string;
}

export const sampleImages: SampleImage[] = [
  // 비즈니스 카테고리
  {
    id: 'business-1',
    name: '비즈니스 미팅',
    url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&h=600&fit=crop',
    category: 'business',
    description: '전문적인 비즈니스 환경'
  },
  {
    id: 'business-2',
    name: '오피스 환경',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=600&fit=crop',
    category: 'business',
    description: '현대적인 사무실 공간'
  },
  {
    id: 'business-3',
    name: '팀워크',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=600&fit=crop',
    category: 'business',
    description: '협업하는 팀'
  },

  // 라이프스타일 카테고리
  {
    id: 'lifestyle-1',
    name: '도시 풍경',
    url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1200&h=600&fit=crop',
    category: 'lifestyle',
    description: '활기찬 도시 생활'
  },
  {
    id: 'lifestyle-2',
    name: '자연 풍경',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=600&fit=crop',
    category: 'lifestyle',
    description: '평화로운 자연'
  },
  {
    id: 'lifestyle-3',
    name: '카페 분위기',
    url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&h=600&fit=crop',
    category: 'lifestyle',
    description: '아늑한 카페 공간'
  },

  // 기술 카테고리
  {
    id: 'technology-1',
    name: '디지털 기술',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200&h=600&fit=crop',
    category: 'technology',
    description: '최신 기술 트렌드'
  },
  {
    id: 'technology-2',
    name: '데이터 시각화',
    url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=600&fit=crop',
    category: 'technology',
    description: '데이터와 분석'
  },
  {
    id: 'technology-3',
    name: '혁신적 아이디어',
    url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&h=600&fit=crop',
    category: 'technology',
    description: '창의적 사고'
  },

  // 음식 카테고리
  {
    id: 'food-1',
    name: '맛있는 요리',
    url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=1200&h=600&fit=crop',
    category: 'food',
    description: '고급 요리'
  },
  {
    id: 'food-2',
    name: '신선한 재료',
    url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1200&h=600&fit=crop',
    category: 'food',
    description: '신선한 식재료'
  },
  {
    id: 'food-3',
    name: '베이커리',
    url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&h=600&fit=crop',
    category: 'food',
    description: '갓 구운 빵'
  },

  // 여행 카테고리
  {
    id: 'travel-1',
    name: '해변 휴양지',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=600&fit=crop',
    category: 'travel',
    description: '아름다운 해변'
  },
  {
    id: 'travel-2',
    name: '산악 지대',
    url: 'https://images.unsplash.com/photo-1464822759844-d150baec3e5e?w=1200&h=600&fit=crop',
    category: 'travel',
    description: '웅장한 산맥'
  },
  {
    id: 'travel-3',
    name: '도시 여행',
    url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&h=600&fit=crop',
    category: 'travel',
    description: '유럽 도시 탐방'
  },

  // 패션 카테고리
  {
    id: 'fashion-1',
    name: '모던 패션',
    url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop',
    category: 'fashion',
    description: '세련된 스타일'
  },
  {
    id: 'fashion-2',
    name: '액세서리',
    url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&h=600&fit=crop',
    category: 'fashion',
    description: '고급 액세서리'
  },
  {
    id: 'fashion-3',
    name: '라이프스타일 패션',
    url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&h=600&fit=crop',
    category: 'fashion',
    description: '일상 속 패션'
  }
];

export const getBannerPreviewImage = (bannerType: string): string => {
  // 각 배너 타입별 대표 미리보기 이미지
  const previewImages: Record<string, string> = {
    'basic-no-logo-pc': 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=400&fit=crop',
    'basic-no-logo-mobile': 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop',
    'basic-with-logo-pc': 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=400&fit=crop',
    'basic-with-logo-mobile': 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop',
    'interactive-pc': 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=400&fit=crop',
    'interactive-mobile': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
    'fullscreen-pc': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=300&fit=crop'
  };
  
  return previewImages[bannerType] || previewImages['basic-no-logo-pc'];
};

export const getSampleImagesByCategory = (category?: string): SampleImage[] => {
  if (!category) return sampleImages;
  return sampleImages.filter(img => img.category === category);
};

export const categories = [
  { id: 'business', name: '비즈니스', icon: '💼' },
  { id: 'lifestyle', name: '라이프스타일', icon: '🌟' },
  { id: 'technology', name: '기술', icon: '💻' },
  { id: 'food', name: '음식', icon: '🍽️' },
  { id: 'travel', name: '여행', icon: '✈️' },
  { id: 'fashion', name: '패션', icon: '👗' }
]; 