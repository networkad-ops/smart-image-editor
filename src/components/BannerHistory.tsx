import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Banner } from '../types';
import { bannerService } from '../services/supabaseService';
import { withLimit } from '../utils/limitConcurrency';
import { supabaseWithRetry } from '../utils/fetchWithRetry';
import { historyMetrics } from '../utils/metrics';

interface BannerHistoryProps {
  onBannerEdit: (banner: Banner) => void;
  onBack: () => void;
  onGoHome?: () => void;
}

type BannerListItem = Pick<Banner, 'id' | 'title' | 'thumbnail_url' | 'canvas_width' | 'canvas_height' | 'created_at'>;

export const BannerHistory: React.FC<BannerHistoryProps> = ({ onBannerEdit, onBack, onGoHome }) => {
  const [banners, setBanners] = useState<BannerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [nextCursor, setNextCursor] = useState<{ created_at: string; id: string } | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [imageLoadingStates, setImageLoadingStates] = useState<Record<string, boolean>>({});
  const sentinelRef = useRef<HTMLDivElement>(null);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // 초기 로드
  useEffect(() => {
    historyMetrics.startFirstListTTFB();
    historyMetrics.startFirstPaint();
    loadInitialBanners();
  }, []);

  // 검색어 디바운스 처리 (300ms)
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // 디바운스된 검색어 변경 시 새로운 검색 실행
  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) return; // 아직 디바운스 중
    
    // 검색어가 변경되면 처음부터 다시 로드
    setBanners([]);
    setNextCursor(undefined);
    setHasMore(true);
    setImageLoadingStates({});
    
    loadInitialBanners();
  }, [debouncedSearchTerm]);

  // 무한 스크롤 옵저버 설정
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMoreBanners();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, nextCursor]);

  // 컴포넌트 언마운트 시 모든 요청 취소
  useEffect(() => {
    return () => {
      abortControllersRef.current.forEach(controller => controller.abort());
      abortControllersRef.current.clear();
    };
  }, []);

  const loadInitialBanners = async () => {
    try {
      setLoading(true);
      
      // 서버 사이드 필터링 적용
      const filters = debouncedSearchTerm ? { search_term: debouncedSearchTerm } : undefined;
      
      const result = await supabaseWithRetry(
        () => bannerService.getBannersCursor(30, undefined, filters),
        '배너 목록 로드 실패'
      );
      
      setBanners(result.items);
      setNextCursor(result.nextCursor);
      setHasMore(!!result.nextCursor);
      
      // 성능 메트릭 기록
      historyMetrics.endFirstListTTFB();
      
      // 썸네일 로딩 시작
      preloadThumbnails(result.items);
      
      // First Paint 완료
      setTimeout(() => {
        historyMetrics.endFirstPaint();
        historyMetrics.startFirstInteractive();
        
        // 상호작용 가능 시점
        setTimeout(() => {
          historyMetrics.endFirstInteractive();
        }, 100);
      }, 0);
      
    } catch (error) {
      console.error('배너 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreBanners = async () => {
    if (!nextCursor || loadingMore) return;

    try {
      setLoadingMore(true);
      
      // 서버 사이드 필터링 적용
      const filters = debouncedSearchTerm ? { search_term: debouncedSearchTerm } : undefined;
      
      const result = await supabaseWithRetry(
        () => bannerService.getBannersCursor(30, nextCursor, filters),
        '추가 배너 로드 실패'
      );
      
      setBanners(prev => [...prev, ...result.items]);
      setNextCursor(result.nextCursor);
      setHasMore(!!result.nextCursor);
      
      // 새로운 썸네일 로딩 시작
      preloadThumbnails(result.items);
    } catch (error) {
      console.error('추가 배너 로드 실패:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const preloadThumbnails = useCallback((items: BannerListItem[]) => {
    const loadTasks = items.map(item => () => {
      return new Promise<void>((resolve) => {
        const controller = new AbortController();
        abortControllersRef.current.set(item.id, controller);

        const img = new Image();
        const imageUrl = item.thumbnail_url || `https://vznpflqvmbbglfhqftvz.supabase.co/storage/v1/object/public/banner-images/${item.id}`;
        
        img.onload = () => {
          setImageLoadingStates(prev => ({ ...prev, [item.id]: true }));
          resolve();
        };
        
        img.onerror = () => {
          resolve(); // 실패해도 계속 진행
        };

        if (controller.signal.aborted) {
          resolve();
          return;
        }

        img.src = imageUrl;
      });
    });

    // 환경변수 기반 동시 로딩 (기본값: 6개)
    withLimit(undefined, loadTasks).catch(console.error);
  }, []);

  const handleDelete = async (bannerId: string) => {
    if (!confirm('정말로 이 배너를 삭제하시겠습니까?')) return;
    
    try {
      await bannerService.deleteBanner(bannerId);
      setBanners(prev => prev.filter(banner => banner.id !== bannerId));
      
      // AbortController 정리
      const controller = abortControllersRef.current.get(bannerId);
      if (controller) {
        controller.abort();
        abortControllersRef.current.delete(bannerId);
      }
    } catch (error) {
      console.error('배너 삭제 실패:', error);
      alert('배너 삭제에 실패했습니다.');
    }
  };

  const handleBannerEdit = async (bannerItem: BannerListItem) => {
    try {
      // 상세 정보 조회 (Fetch-on-open)
      const fullBanner = await supabaseWithRetry(
        () => bannerService.getBannerById(bannerItem.id),
        '배너 상세 정보 로드 실패'
      );
      onBannerEdit(fullBanner);
    } catch (error) {
      console.error('배너 상세 정보 로드 실패:', error);
      alert('배너 정보를 불러오는데 실패했습니다.');
    }
  };

  // 서버 사이드 필터링을 사용하므로 클라이언트 필터링 제거
  const filteredBanners = banners;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'review': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '완료';
      case 'draft': return '임시저장';
      case 'review': return '검토중';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 
                className="text-3xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={onGoHome}
                title="홈으로 이동"
              >
                Smart Banner Editor
              </h1>
              <p className="mt-2 text-gray-600">
                생성된 모든 배너를 확인하고 관리하세요
              </p>
            </div>
            <button
              onClick={onBack}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>홈으로</span>
            </button>
          </div>
        </div>

        {/* 검색 */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="배너 제목, 설명, 타입으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            총 {filteredBanners.length}개의 배너 {searchTerm && `(검색: "${searchTerm}")`}
          </p>
        </div>

        {/* 배너 목록 */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredBanners.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? '검색 결과가 없습니다' : '생성된 배너가 없습니다'}
            </h3>
            <p className="text-gray-500">
              {searchTerm ? '다른 검색어를 시도해보세요' : '새 배너를 만들어보세요'}
            </p>
          </div>
        ) : (
          <>
            {/* 그리드 레이아웃으로 변경 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredBanners.map((banner) => (
                <div key={banner.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  {/* 썸네일 영역 */}
                  <div 
                    className="relative bg-gray-100"
                    style={{ aspectRatio: `${banner.canvas_width}/${banner.canvas_height}` }}
                  >
                    {imageLoadingStates[banner.id] ? (
                      <img
                        src={banner.thumbnail_url || `https://vznpflqvmbbglfhqftvz.supabase.co/storage/v1/object/public/banner-images/${banner.id}`}
                        alt={banner.title}
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        style={
                          banner.thumbnail_url 
                            ? { objectFit: 'cover' } 
                            : { maxWidth: '320px', height: 'auto', objectFit: 'cover' }
                        }
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      // 스켈레톤 UI
                      <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* 배너 정보 */}
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
                      {banner.title}
                    </h3>
                    
                    <div className="text-xs text-gray-500 mb-3">
                      {new Date(banner.created_at).toLocaleDateString('ko-KR')}
                    </div>

                    {/* 작업 버튼 */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleBannerEdit(banner)}
                        className="flex-1 bg-blue-500 text-white py-2 px-3 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                      >
                        편집
                      </button>
                      <button
                        onClick={() => handleDelete(banner.id)}
                        className="bg-red-500 text-white py-2 px-3 rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 무한 스크롤 센티널 */}
            <div ref={sentinelRef} className="h-10 flex items-center justify-center mt-8">
              {loadingMore && (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              )}
            </div>

            {!hasMore && banners.length > 0 && (
              <div className="text-center py-8 text-gray-500 text-sm">
                모든 배너를 불러왔습니다.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}; 