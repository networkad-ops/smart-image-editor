# 🔗 Smart Image Editor - API Integration Guide

## 📋 **연동 개요**
이 문서는 Smart Image Editor의 백엔드 API 연동을 위한 완전한 가이드입니다.

---

## 🛠️ **기술 스택**

### **Backend**
- **Database**: PostgreSQL 14+ (Supabase)
- **API**: Supabase REST API + Real-time
- **Storage**: Supabase Storage
- **Language**: TypeScript/JavaScript

### **Frontend** 
- **Framework**: React 18 + Vite
- **Language**: TypeScript
- **State**: React Hooks (useState, useEffect)
- **HTTP Client**: Supabase JS SDK
- **UI**: Tailwind CSS

---

## 🔌 **API 엔드포인트**

### **Base URL**
```
https://your-project-id.supabase.co/rest/v1/
```

### **인증 헤더**
```javascript
headers: {
  'apikey': 'your-anon-key',
  'Authorization': 'Bearer your-anon-key',
  'Content-Type': 'application/json'
}
```

---

## 📊 **주요 API 엔드포인트**

### 1. **배너 목록 (커서 페이지네이션)** ⭐
```javascript
// GET /banners
const getBanners = async (limit = 30, cursor = null, filters = {}) => {
  let query = supabase
    .from('banners')
    .select('id,title,thumbnail_url,canvas_width,canvas_height,created_at')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit);

  // 커서 적용
  if (cursor) {
    query = query.or(`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`);
  }

  // 필터 적용
  if (filters.search) {
    query = query.ilike('title', `%${filters.search}%`);
  }
  if (filters.banner_type) {
    query = query.eq('banner_type', filters.banner_type);
  }
  if (filters.device_type) {
    query = query.eq('device_type', filters.device_type);
  }
  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  return { data, error };
};
```

### 2. **배너 상세 조회**
```javascript
// GET /banners/{id}
const getBannerById = async (id) => {
  const { data, error } = await supabase
    .from('banners')
    .select(`
      *,
      projects (
        name,
        manager_name,
        manager_email,
        teams (
          name,
          color
        )
      ),
      banner_comments (
        id,
        comment,
        x_position,
        y_position,
        created_at
      )
    `)
    .eq('id', id)
    .single();

  return { data, error };
};
```

### 3. **배너 생성**
```javascript
// POST /banners
const createBanner = async (bannerData) => {
  const { data, error } = await supabase
    .from('banners')
    .insert([{
      project_id: bannerData.project_id,
      title: bannerData.title,
      description: bannerData.description,
      banner_type: bannerData.banner_type,
      device_type: bannerData.device_type,
      background_image_url: bannerData.background_image_url,
      logo_url: bannerData.logo_url,
      text_elements: bannerData.text_elements,
      canvas_width: bannerData.canvas_width,
      canvas_height: bannerData.canvas_height,
      tags: bannerData.tags || [],
      notes: bannerData.notes
    }])
    .select()
    .single();

  return { data, error };
};
```

### 4. **배너 업데이트**
```javascript
// PATCH /banners/{id}
const updateBanner = async (id, updateData) => {
  const { data, error } = await supabase
    .from('banners')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  return { data, error };
};
```

### 5. **프로젝트 목록**
```javascript
// GET /projects
const getProjects = async () => {
  const { data, error } = await supabase
    .from('project_overview')  // 뷰 사용
    .select('*')
    .order('created_at', { ascending: false });

  return { data, error };
};
```

### 6. **팀 목록**
```javascript
// GET /teams
const getTeams = async () => {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .order('name');

  return { data, error };
};
```

---

## 🖼️ **Storage API**

### **이미지 업로드**
```javascript
// 배경 이미지 업로드
const uploadBackgroundImage = async (file) => {
  const fileName = `${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from('banner-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) return { data: null, error };

  // 공개 URL 생성
  const { data: { publicUrl } } = supabase.storage
    .from('banner-images')
    .getPublicUrl(fileName);

  return { data: { path: fileName, url: publicUrl }, error: null };
};

// 로고 이미지 업로드
const uploadLogo = async (file) => {
  const fileName = `${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from('logos')
    .upload(fileName, file);

  if (error) return { data: null, error };

  const { data: { publicUrl } } = supabase.storage
    .from('logos')
    .getPublicUrl(fileName);

  return { data: { path: fileName, url: publicUrl }, error: null };
};

// 썸네일 업로드
const uploadThumbnail = async (file) => {
  const fileName = `${Date.now()}-thumbnail.jpg`;
  const { data, error } = await supabase.storage
    .from('thumbnails')
    .upload(fileName, file, {
      cacheControl: '31536000',  // 1년 캐시
    });

  if (error) return { data: null, error };

  const { data: { publicUrl } } = supabase.storage
    .from('thumbnails')
    .getPublicUrl(fileName);

  return { data: { path: fileName, url: publicUrl }, error: null };
};
```

---

## 📡 **Real-time 구독**

### **배너 변경 실시간 감지**
```javascript
const subscribeToBannerChanges = (callback) => {
  const subscription = supabase
    .channel('banner-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'banners'
      },
      (payload) => {
        console.log('Banner change:', payload);
        callback(payload);
      }
    )
    .subscribe();

  return subscription;
};

// 사용 예시
const unsubscribe = subscribeToBannerChanges((change) => {
  if (change.eventType === 'INSERT') {
    // 새 배너 추가됨
    setBanners(prev => [change.new, ...prev]);
  } else if (change.eventType === 'UPDATE') {
    // 배너 업데이트됨
    setBanners(prev => prev.map(banner => 
      banner.id === change.new.id ? change.new : banner
    ));
  }
});

// 컴포넌트 언마운트 시
useEffect(() => {
  return () => {
    unsubscribe();
  };
}, []);
```

---

## 🔍 **검색 & 필터링**

### **텍스트 검색 (GIN 인덱스 활용)**
```javascript
const searchBanners = async (searchTerm) => {
  const { data, error } = await supabase
    .from('banners')
    .select('id,title,thumbnail_url,canvas_width,canvas_height,created_at')
    .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
    .order('created_at', { ascending: false })
    .limit(50);

  return { data, error };
};
```

### **복합 필터링**
```javascript
const getFilteredBanners = async (filters) => {
  let query = supabase
    .from('banners')
    .select('id,title,thumbnail_url,canvas_width,canvas_height,created_at');

  // 동적 필터 적용
  if (filters.project_id) {
    query = query.eq('project_id', filters.project_id);
  }
  if (filters.banner_type) {
    query = query.eq('banner_type', filters.banner_type);
  }
  if (filters.device_type) {
    query = query.eq('device_type', filters.device_type);
  }
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.tags && filters.tags.length > 0) {
    query = query.overlaps('tags', filters.tags);
  }
  if (filters.date_from) {
    query = query.gte('created_at', filters.date_from);
  }
  if (filters.date_to) {
    query = query.lte('created_at', filters.date_to);
  }

  query = query
    .order('created_at', { ascending: false })
    .limit(100);

  const { data, error } = await query;
  return { data, error };
};
```

---

## 🎯 **타입 정의**

### **TypeScript 인터페이스**
```typescript
// 배너 기본 타입
interface Banner {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  banner_type: string;
  device_type: 'pc' | 'mobile';
  status: 'draft' | 'in_progress' | 'review' | 'approved' | 'rejected' | 'completed';
  background_image_url: string;
  logo_url?: string;
  logo_urls?: string[];
  final_banner_url?: string;
  thumbnail_url?: string;
  text_elements: TextElement[];
  canvas_width: number;
  canvas_height: number;
  version: number;
  tags: string[];
  notes?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

// 텍스트 요소 타입
interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontWeight: number;
  color: string;
  fontFamily: string;
  textAlign: 'left' | 'center' | 'right';
  lineHeight: number;
  letterSpacing: number;
  rotation: number;
  opacity: number;
  shadow?: {
    enabled: boolean;
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
  stroke?: {
    enabled: boolean;
    color: string;
    width: number;
  };
}

// 프로젝트 타입
interface Project {
  id: string;
  name: string;
  description?: string;
  team_id?: string;
  manager_name?: string;
  manager_email?: string;
  manager_phone?: string;
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  deadline?: string;
  created_at: string;
  updated_at: string;
}

// 팀 타입
interface Team {
  id: string;
  name: string;
  description?: string;
  color: string;
  created_at: string;
  updated_at: string;
}

// API 응답 타입
interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
}

// 커서 페이지네이션 응답
interface CursorResponse<T> {
  items: T[];
  nextCursor?: {
    created_at: string;
    id: string;
  };
}
```

---

## 🔧 **유틸리티 함수**

### **에러 핸들링**
```javascript
const handleSupabaseError = (error) => {
  console.error('Supabase Error:', error);
  
  if (error.code === 'PGRST116') {
    return '데이터를 찾을 수 없습니다.';
  } else if (error.code === '23505') {
    return '중복된 데이터입니다.';
  } else if (error.code === '23503') {
    return '관련 데이터가 존재하지 않습니다.';
  } else {
    return error.message || '알 수 없는 오류가 발생했습니다.';
  }
};
```

### **재시도 로직**
```javascript
const withRetry = async (fn, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // 지수 백오프
    }
  }
};

// 사용 예시
const bannerData = await withRetry(() => getBannerById(bannerId));
```

---

## 🚀 **성능 최적화**

### **배치 요청**
```javascript
const getBannersWithProjects = async (bannerIds) => {
  // 배너와 프로젝트 정보를 한 번에 가져오기
  const { data, error } = await supabase
    .from('banners')
    .select(`
      *,
      projects (
        name,
        manager_name
      )
    `)
    .in('id', bannerIds);

  return { data, error };
};
```

### **캐싱 전략**
```javascript
// 메모리 캐시 (간단한 구현)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5분

const getCachedData = async (key, fetchFn) => {
  const cached = cache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const data = await fetchFn();
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
  
  return data;
};

// 사용 예시
const projects = await getCachedData('projects', getProjects);
```

---

## 📱 **모바일 최적화**

### **이미지 로딩 최적화**
```javascript
const loadImageWithFallback = (primaryUrl, fallbackUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => resolve(primaryUrl);
    img.onerror = () => {
      if (fallbackUrl) {
        const fallbackImg = new Image();
        fallbackImg.onload = () => resolve(fallbackUrl);
        fallbackImg.onerror = () => reject(new Error('모든 이미지 로딩 실패'));
        fallbackImg.src = fallbackUrl;
      } else {
        reject(new Error('이미지 로딩 실패'));
      }
    };
    
    img.src = primaryUrl;
  });
};
```

---

## 🔒 **보안 고려사항**

### **입력 검증**
```javascript
const validateBannerInput = (data) => {
  const errors = [];
  
  if (!data.title || data.title.trim().length === 0) {
    errors.push('제목은 필수입니다.');
  }
  if (data.title && data.title.length > 255) {
    errors.push('제목은 255자를 초과할 수 없습니다.');
  }
  if (!data.canvas_width || data.canvas_width <= 0) {
    errors.push('유효한 캔버스 너비가 필요합니다.');
  }
  if (!data.canvas_height || data.canvas_height <= 0) {
    errors.push('유효한 캔버스 높이가 필요합니다.');
  }
  
  return errors;
};
```

### **XSS 방지**
```javascript
const sanitizeText = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};
```

---

## 📊 **모니터링 & 로깅**

### **성능 메트릭**
```javascript
const measureApiCall = async (apiCall, operationName) => {
  const startTime = performance.now();
  
  try {
    const result = await apiCall();
    const duration = performance.now() - startTime;
    
    console.log(`✅ ${operationName}: ${duration.toFixed(2)}ms`);
    
    // 성능 경고 (2초 이상)
    if (duration > 2000) {
      console.warn(`⚠️ Slow API call: ${operationName} took ${duration.toFixed(2)}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`❌ ${operationName} failed after ${duration.toFixed(2)}ms:`, error);
    throw error;
  }
};
```

---

## 🎯 **통합 예시**

### **React Hook 구현**
```typescript
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL!,
  process.env.REACT_APP_SUPABASE_ANON_KEY!
);

export const useBanners = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<{created_at: string, id: string} | null>(null);

  const loadBanners = async (cursor?: {created_at: string, id: string}) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('banners')
        .select('id,title,thumbnail_url,canvas_width,canvas_height,created_at')
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(30);

      if (cursor) {
        query = query.or(`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`);
      }

      const { data, error: supabaseError } = await query;

      if (supabaseError) {
        throw supabaseError;
      }

      const newBanners = data || [];
      
      if (cursor) {
        setBanners(prev => [...prev, ...newBanners]);
      } else {
        setBanners(newBanners);
      }

      // 다음 커서 설정
      if (newBanners.length === 30) {
        const lastItem = newBanners[newBanners.length - 1];
        setNextCursor({
          created_at: lastItem.created_at,
          id: lastItem.id
        });
      } else {
        setNextCursor(null);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (nextCursor && !loading) {
      loadBanners(nextCursor);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  return {
    banners,
    loading,
    error,
    hasMore: !!nextCursor,
    loadMore,
    refresh: () => loadBanners()
  };
};
```

---

**🚀 이제 API 연동을 시작할 준비가 완료되었습니다!**

추가 질문이나 구체적인 구현 도움이 필요하시면 언제든 문의해주세요.
