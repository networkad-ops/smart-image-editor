import { supabase } from '../lib/supabase'
import { 
  Team, 
  Project, 
  Banner, 
  BannerHistory, 
  BannerComment,
  TeamFormData,
  ProjectFormData,
  BannerFormData,
  FilterOptions,
  // SortOptions,
  // Pagination,
  ProjectStats
} from '../types'

// ===== Supabase Storage 버킷 생성 =====

export const createStorageBuckets = async (): Promise<{ success: boolean; message: string; details?: any }> => {
  try {
    console.log('🗂️ Storage 버킷 생성 시작...');
    
    const buckets = [
      { name: 'banner-images', public: true },
      { name: 'final-banners', public: true },
      { name: 'logos', public: true },
      { name: 'thumbnails', public: true }
    ];
    
    const results = [];
    
    for (const bucket of buckets) {
      try {
        console.log(`📁 버킷 '${bucket.name}' 생성 시도 중...`);
        
        const { data, error } = await supabase.storage.createBucket(bucket.name, {
          public: bucket.public,
          allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'],
          fileSizeLimit: 10485760 // 10MB
        });
        
        if (error) {
          if (error.message.includes('already exists')) {
            console.log(`✅ 버킷 '${bucket.name}' 이미 존재함`);
            results.push({ bucket: bucket.name, status: 'exists', error: null });
          } else {
            console.error(`❌ 버킷 '${bucket.name}' 생성 실패:`, error);
            results.push({ bucket: bucket.name, status: 'failed', error: error.message });
          }
        } else {
          console.log(`✅ 버킷 '${bucket.name}' 생성 성공`);
          results.push({ bucket: bucket.name, status: 'created', error: null });
        }
      } catch (err) {
        console.error(`💥 버킷 '${bucket.name}' 생성 예외:`, err);
        results.push({ 
          bucket: bucket.name, 
          status: 'error', 
          error: err instanceof Error ? err.message : '알 수 없는 오류' 
        });
      }
    }
    
    const failedBuckets = results.filter(r => r.status === 'failed' || r.status === 'error');
    
    if (failedBuckets.length > 0) {
      return {
        success: false,
        message: `일부 버킷 생성 실패: ${failedBuckets.map(b => b.bucket).join(', ')}`,
        details: { results }
      };
    }
    
    return {
      success: true,
      message: 'Storage 버킷 설정 완료',
      details: { results }
    };
    
  } catch (err) {
    console.error('💥 버킷 생성 프로세스 실패:', err);
    return {
      success: false,
      message: `버킷 생성 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      details: err
    };
  }
};

// ===== Supabase 연결 테스트 =====

export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string; details?: any }> => {
  try {
    console.log('🔍 Supabase 연결 상태 확인 중...');
    
    // 1. 기본 연결 테스트 (여러 테이블 시도)
    const testTables = ['teams', 'projects', 'banners'];
    let connectionSuccess = false;
    let lastError = null;
    
    for (const table of testTables) {
      try {
        console.log(`🔍 '${table}' 테이블 연결 시도...`);
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (!error) {
          console.log(`✅ '${table}' 테이블 연결 성공`);
          connectionSuccess = true;
          break;
        } else {
          console.warn(`⚠️ '${table}' 테이블 연결 실패:`, error.message);
          lastError = error;
        }
      } catch (err) {
        console.warn(`⚠️ '${table}' 테이블 연결 예외:`, err);
        lastError = err;
      }
    }
    
    if (!connectionSuccess) {
      console.error('❌ 모든 테이블 연결 실패:', lastError);
      return {
        success: false,
        message: `데이터베이스 연결 실패: ${lastError instanceof Error ? lastError.message : '모든 테이블에 접근할 수 없습니다'}`,
        details: lastError
      };
    }
    
    console.log('✅ 데이터베이스 연결 성공');
    
    // 2. Storage 버킷 확인 및 생성
    console.log('🗂️ Storage 버킷 상태 확인 중...');
    const buckets = ['banner-images', 'final-banners', 'logos', 'thumbnails'];
    const bucketStatus = [];
    
    for (const bucket of buckets) {
      try {
        const { data: bucketData, error: bucketError } = await supabase.storage
          .from(bucket)
          .list('', { limit: 1 });
          
        bucketStatus.push({
          bucket,
          exists: !bucketError,
          error: bucketError?.message,
          details: bucketError
        });
      } catch (err) {
        bucketStatus.push({
          bucket,
          exists: false,
          error: err instanceof Error ? err.message : '알 수 없는 오류',
          details: err
        });
      }
    }
    
    const missingBuckets = bucketStatus.filter(b => !b.exists);
    
    console.log('📊 Storage 버킷 상태:', bucketStatus);
    
    // 누락된 버킷이 있으면 자동 생성 시도
    if (missingBuckets.length > 0) {
      console.log(`⚠️ 누락된 버킷 발견: ${missingBuckets.map(b => b.bucket).join(', ')}`);
      console.log('🔄 자동으로 버킷 생성을 시도합니다...');
      
      const bucketCreation = await createStorageBuckets();
      
      if (!bucketCreation.success) {
        return {
          success: false,
          message: `Storage 버킷 생성 실패: ${bucketCreation.message}`,
          details: { bucketStatus, bucketCreation }
        };
      }
      
      console.log('✅ Storage 버킷 자동 생성 완료');
    }
    
    // 3. 간단한 테스트 업로드 (옵션)
    console.log('🧪 Storage 업로드 테스트 수행 중...');
    const uploadTestResult = await testStorageUpload();
    
    return {
      success: true,
      message: 'Supabase 연결 및 Storage 설정 정상',
      details: { bucketStatus, uploadTest: uploadTestResult }
    };
    
  } catch (err) {
    console.error('💥 연결 테스트 실패:', err);
    return {
      success: false,
      message: `연결 테스트 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      details: err
    };
  }
};

// ===== Storage 업로드 테스트 =====

export const testStorageUpload = async (): Promise<{ success: boolean; message: string; details?: any }> => {
  try {
    console.log('🧪 Storage 업로드 테스트 시작...');
    
    // 1x1 픽셀 투명 PNG 이미지 생성 (Base64)
    const testImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAG8SJUIjwAAAABJRU5ErkJggg==';
    
    // Base64를 Blob으로 변환
    const byteCharacters = atob(testImageData);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const testBlob = new Blob([byteArray], { type: 'image/png' });
    const testFile = new File([testBlob], 'test-upload.png', { type: 'image/png' });
    
    console.log('📁 테스트 파일 생성:', {
      name: testFile.name,
      size: testFile.size,
      type: testFile.type
    });
    
    // banner-images 버킷에 테스트 업로드
    const testBucket = 'banner-images';
    const testFileName = `test-${Date.now()}.png`;
    
    console.log(`📤 '${testBucket}' 버킷에 테스트 업로드 시도...`);
    
    const { data, error } = await supabase.storage
      .from(testBucket)
      .upload(testFileName, testFile, {
        cacheControl: '3600',
        upsert: true,
      });
    
    if (error) {
      console.error('❌ 테스트 업로드 실패:', {
        message: error.message,
        statusCode: (error as any).statusCode,
        details: error
      });
      
      return {
        success: false,
        message: `테스트 업로드 실패: ${error.message} (HTTP ${(error as any).statusCode || 'Unknown'})`,
        details: { error, bucket: testBucket, fileName: testFileName }
      };
    }
    
    console.log('✅ 테스트 업로드 성공:', data);
    
    // 업로드된 파일 즉시 삭제 (정리)
    try {
      const { error: deleteError } = await supabase.storage
        .from(testBucket)
        .remove([data.path]);
        
      if (!deleteError) {
        console.log('🗑️ 테스트 파일 삭제 완료');
      }
    } catch (deleteErr) {
      console.warn('⚠️ 테스트 파일 삭제 실패 (무시해도 됨):', deleteErr);
    }
    
    return {
      success: true,
      message: 'Storage 업로드 테스트 성공',
      details: { bucket: testBucket, uploadedPath: data.path }
    };
    
  } catch (err) {
    console.error('💥 Storage 업로드 테스트 예외:', err);
    return {
      success: false,
      message: `Storage 테스트 예외: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      details: err
    };
  }
};

// ===== 팀 관리 =====

export const teamService = {
  // 팀 목록 조회
  async getTeams(): Promise<Team[]> {
    console.log('📋 팀 목록 조회 시도...');
    
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('📋 팀 목록 조회 결과:', { data, error });

      if (error) {
        console.error('❌ 팀 목록 조회 오류:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      return data || []
    } catch (err) {
      console.error('💥 팀 목록 조회 실패:', err);
      throw err;
    }
  },

  // 팀 생성
  async createTeam(teamData: TeamFormData): Promise<Team> {
    console.log('🚀 팀 생성 시도:', teamData);
    
    try {
      const insertData = {
        ...teamData,
        user_id: null // 완전 공개 모드: user_id 없음
      };
      
      console.log('📝 삽입할 데이터:', insertData);
      
      const { data, error } = await supabase
        .from('teams')
        .insert([insertData])
        .select()
        .single()

      console.log('✅ Supabase 응답:', { data, error });

      if (error) {
        console.error('❌ Supabase 오류 상세:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log('🎉 팀 생성 성공:', data);
      return data
    } catch (err) {
      console.error('💥 팀 생성 실패:', err);
      throw err;
    }
  },

  // 팀 수정
  async updateTeam(id: string, teamData: Partial<TeamFormData>): Promise<Team> {
    const { data, error } = await supabase
      .from('teams')
      .update(teamData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 팀 삭제
  async deleteTeam(id: string): Promise<void> {
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

// ===== 프로젝트 관리 =====

export const projectService = {
  // 프로젝트 목록 조회 (팀 정보 포함)
  async getProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        team:teams(*),
        banners(id, status)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    // 배너 통계 계산
    return (data || []).map((project: any) => ({
      ...project,
      total_banners: project.banners?.length || 0,
      draft_banners: project.banners?.filter((b: any) => b.status === 'draft').length || 0,
      completed_banners: project.banners?.filter((b: any) => b.status === 'completed').length || 0,
      in_progress_banners: project.banners?.filter((b: any) => b.status === 'in_progress').length || 0
    }))
  },

  // 프로젝트 상세 조회
  async getProject(id: string): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        team:teams(*),
        banners(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // 프로젝트 생성
  async createProject(projectData: ProjectFormData): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .insert([{
        ...projectData,
        user_id: null // 완전 공개 모드: user_id 없음
      }])
      .select(`
        *,
        team:teams(*)
      `)
      .single()

    if (error) throw error
    return data
  },

  // 프로젝트 수정
  async updateProject(id: string, projectData: Partial<ProjectFormData>): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .update(projectData)
      .eq('id', id)
      .select(`
        *,
        team:teams(*)
      `)
      .single()

    if (error) throw error
    return data
  },

  // 프로젝트 삭제
  async deleteProject(id: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // 프로젝트 통계 조회
  async getProjectStats(id: string): Promise<ProjectStats> {
    const { data, error } = await supabase
      .rpc('get_project_stats', { project_uuid: id })

    if (error) throw error
    return data
  }
}

// ===== 배너 관리 =====

export const bannerService = {
  // 배너 목록 조회 (프로젝트, 팀 정보 포함)
  async getBanners(filters?: FilterOptions): Promise<Banner[]> {
    let query = supabase
      .from('banners')
      .select(`
        *,
        project:projects(
          *,
          team:teams(*)
        ),
        comments:banner_comments(id)
      `)

    // 필터 적용
    if (filters?.project_id) {
      query = query.eq('project_id', filters.project_id)
    }
    if (filters?.banner_status) {
      query = query.eq('status', filters.banner_status)
    }
    if (filters?.banner_type) {
      query = query.eq('banner_type', filters.banner_type)
    }
    if (filters?.device_type) {
      query = query.eq('device_type', filters.device_type)
    }
    if (filters?.search_term) {
      query = query.or(`title.ilike.%${filters.search_term}%,description.ilike.%${filters.search_term}%`)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query
    if (error) throw error

    // 댓글 수 계산
    return (data || []).map((banner: any) => ({
      ...banner,
      comment_count: banner.comments?.length || 0
    }))
  },

  // 배너 상세 조회
  async getBanner(id: string): Promise<Banner> {
    const { data, error } = await supabase
      .from('banners')
      .select(`
        *,
        project:projects(
          *,
          team:teams(*)
        ),
        comments:banner_comments(*),
        history:banner_history(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // 배너 생성
  async createBanner(bannerData: BannerFormData & {
    project_id: string;
    background_image_url: string;
    logo_url?: string;
    final_banner_url?: string;
    thumbnail_url?: string;
    text_elements: any[];
    canvas_width: number;
    canvas_height: number;
  }): Promise<Banner> {
    console.log('🚀 배너 생성 시작:', bannerData);
    
    try {
      const { data, error } = await supabase
        .from('banners')
        .insert([bannerData])
        .select(`
          *,
          project:projects(
            *,
            team:teams(*)
          )
        `)
        .single()

      console.log('✅ Supabase 응답:', { data, error });

      if (error) {
        console.error('❌ Supabase 오류 상세:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw new Error(`배너 생성 중 오류가 발생했습니다: ${error.message} (${error.code})`);
      }
      
      return data;
    } catch (err) {
      console.error('💥 배너 생성 실패:', err);
      throw err;
    }
  },

  // 배너 수정
  async updateBanner(id: string, bannerData: Partial<Banner>): Promise<Banner> {
    const { data, error } = await supabase
      .from('banners')
      .update(bannerData)
      .eq('id', id)
      .select(`
        *,
        project:projects(
          *,
          team:teams(*)
        )
      `)
      .single()

    if (error) throw error
    return data
  },

  // 배너 삭제
  async deleteBanner(id: string): Promise<void> {
    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // 배너 상태 변경
  async updateBannerStatus(id: string, status: string, approvedBy?: string): Promise<Banner> {
    const updateData: any = { status }
    if (status === 'approved' && approvedBy) {
      updateData.approved_by = approvedBy
      updateData.approved_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('banners')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 배경 이미지 업로드
  async uploadBackgroundImage(file: File, path?: string): Promise<string> {
    console.log('🚀 배경 이미지 업로드 시작:', { 
      fileName: file.name, 
      fileSize: file.size, 
      fileType: file.type,
      path 
    });
    
    try {
      // 파일 크기 검증 (10MB 제한)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error(`파일 크기가 너무 큽니다. 최대 10MB까지 업로드 가능합니다. (현재: ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      }

      // 파일 형식 검증
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`지원하지 않는 파일 형식입니다. JPG, PNG, WebP 파일만 업로드 가능합니다. (현재: ${file.type})`);
      }

      const bucket = 'banner-images';
      const fileExt = file.name.split('.').pop() || 'jpg';
      const randomName = Math.random().toString(36).substring(2);
      const fileName = path || `background-${Date.now()}-${randomName}.${fileExt}`;
      
      console.log('📝 업로드 정보:', { bucket, fileName, fileSize: file.size });

      // Supabase Storage 업로드
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      console.log('✅ Supabase Storage 응답:', { data, error });

      if (error) {
        console.error('❌ Supabase Storage 오류 상세:', {
          message: error.message,
          statusCode: (error as any).statusCode,
          details: (error as any).details,
          hint: (error as any).hint,
          stack: (error as any).stack,
        });
        
        // 구체적인 오류 메시지 제공
        let userMessage = '배경 이미지 업로드 중 오류가 발생했습니다.';
        if (error.message.includes('not found')) {
          userMessage = 'Storage 버킷을 찾을 수 없습니다. 관리자에게 문의하세요.';
        } else if (error.message.includes('permission')) {
          userMessage = '파일 업로드 권한이 없습니다. 관리자에게 문의하세요.';
        } else if (error.message.includes('size')) {
          userMessage = '파일 크기가 제한을 초과했습니다.';
        } else {
          userMessage = `업로드 오류: ${error.message}`;
        }
        
        throw new Error(userMessage);
      }

      if (!data?.path) {
        throw new Error('업로드된 파일 경로를 가져올 수 없습니다.');
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      console.log('🔗 생성된 공개 URL:', publicUrlData.publicUrl);
      
      if (!publicUrlData.publicUrl) {
        throw new Error('공개 URL을 생성할 수 없습니다.');
      }
      
      return publicUrlData.publicUrl;
    } catch (err) {
      console.error('💥 배경 이미지 업로드 실패:', {
        error: err,
        message: err instanceof Error ? err.message : '알 수 없는 오류',
        stack: err instanceof Error ? err.stack : undefined
      });
      throw err;
    }
  },

  // 최종 배너 업로드
  async uploadFinalBanner(file: File, path?: string): Promise<string> {
    console.log('🚀 최종 배너 업로드 시작:', { file, path });
    try {
      const bucket = 'final-banners';
      const fileExt = file.name.split('.').pop();
      const randomName = Math.random().toString(36).substring(2);
      const fileName = path || `final-${Date.now()}-${randomName}.${fileExt}`;
      
      console.log('📝 업로드 정보:', { bucket, fileName });

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      console.log('✅ Supabase Storage 응답:', { data, error });

      if (error) {
        console.error('❌ Supabase Storage 오류 상세:', {
          message: error.message,
          stack: (error as any).stack,
          originalError: (error as any).error,
        });
        throw new Error(`최종 배너 업로드 중 오류가 발생했습니다: ${error.message}`);
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      console.log('🔗 생성된 공개 URL:', publicUrlData.publicUrl);
      return publicUrlData.publicUrl;
    } catch (err) {
      console.error('💥 최종 배너 업로드 실패:', err);
      throw err;
    }
  },

  // 배너 이미지 업로드 (기존 호환성 유지)
  async uploadBannerImage(file: File, type?: string): Promise<string> {
    return this.uploadBackgroundImage(file, type);
  },

  // 로고 업로드
  async uploadLogo(file: File, path?: string): Promise<string> {
    const fileName = path || `${Date.now()}-${file.name}`
    const { data: _data, error } = await supabase.storage
      .from('logos')
      .upload(fileName, file)

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('logos')
      .getPublicUrl(fileName)

    return publicUrl
  },

  // 썸네일 업로드
  async uploadThumbnail(file: File, path?: string): Promise<string> {
    const fileName = path || `${Date.now()}-${file.name}`
    const { data: _data, error } = await supabase.storage
      .from('thumbnails')
      .upload(fileName, file)

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('thumbnails')
      .getPublicUrl(fileName)

    return publicUrl
  },

  // 파일 삭제
  async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) throw error
  }
}

// ===== 대시보드 통계 =====

export const dashboardService = {
  // 전체 통계 조회
  async getDashboardStats(): Promise<{
    totalTeams: number;
    totalProjects: number;
    totalBanners: number;
    completedBanners: number;
    inProgressBanners: number;
    draftBanners: number;
  }> {
    const [teamsResult, projectsResult, bannersResult] = await Promise.all([
      supabase.from('teams').select('id', { count: 'exact' }),
      supabase.from('projects').select('id', { count: 'exact' }),
      supabase.from('banners').select('id, status', { count: 'exact' })
    ])

    if (teamsResult.error) throw teamsResult.error
    if (projectsResult.error) throw projectsResult.error
    if (bannersResult.error) throw bannersResult.error

    const banners = bannersResult.data || []

    return {
      totalTeams: teamsResult.count || 0,
      totalProjects: projectsResult.count || 0,
      totalBanners: bannersResult.count || 0,
      completedBanners: banners.filter((b: any) => b.status === 'completed').length,
      inProgressBanners: banners.filter((b: any) => b.status === 'in_progress').length,
      draftBanners: banners.filter((b: any) => b.status === 'draft').length
    }
  },

  // 최근 활동 조회
  async getRecentActivity(): Promise<{
    recentProjects: Project[];
    recentBanners: Banner[];
  }> {
    const [projectsResult, bannersResult] = await Promise.all([
      supabase
        .from('projects')
        .select(`
          *,
          team:teams(*)
        `)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('banners')
        .select(`
          *,
          project:projects(
            name,
            team:teams(name, color)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10)
    ])

    if (projectsResult.error) throw projectsResult.error
    if (bannersResult.error) throw bannersResult.error

    return {
      recentProjects: projectsResult.data || [],
      recentBanners: bannersResult.data || []
    }
  }
}

// ===== 배너 히스토리 관리 =====

export const bannerHistoryService = {
  // 배너 히스토리 조회
  async getBannerHistory(bannerId: string): Promise<BannerHistory[]> {
    const { data, error } = await supabase
      .from('banner_history')
      .select('*')
      .eq('banner_id', bannerId)
      .order('version', { ascending: false })

    if (error) throw error
    return data || []
  },

  // 배너 히스토리 생성 (수동)
  async createBannerHistory(historyData: Omit<BannerHistory, 'id' | 'created_at'>): Promise<BannerHistory> {
    const { data, error } = await supabase
      .from('banner_history')
      .insert([historyData])
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// ===== 배너 댓글 관리 =====

export const bannerCommentService = {
  // 배너 댓글 조회
  async getBannerComments(bannerId: string): Promise<BannerComment[]> {
    const { data, error } = await supabase
      .from('banner_comments')
      .select('*')
      .eq('banner_id', bannerId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  },

  // 댓글 생성
  async createComment(commentData: {
    banner_id: string;
    comment: string;
    x_position?: number;
    y_position?: number;
  }): Promise<BannerComment> {
    const { data, error } = await supabase
      .from('banner_comments')
      .insert([{
        ...commentData,
        user_id: (await supabase.auth.getUser()).data.user?.id
      }])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 댓글 수정
  async updateComment(id: string, comment: string): Promise<BannerComment> {
    const { data, error } = await supabase
      .from('banner_comments')
      .update({ comment })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 댓글 삭제
  async deleteComment(id: string): Promise<void> {
    const { error } = await supabase
      .from('banner_comments')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

// ===== 파일 업로드 관리 =====

export const storageService = {
  // 배너 이미지 업로드
  async uploadBannerImage(file: File, type?: string): Promise<string> {
    console.log('🚀 StorageService 이미지 업로드 시작:', { 
      fileName: file.name, 
      fileSize: file.size, 
      fileType: file.type,
      uploadType: type 
    });

    try {
      // 파일 크기 검증 (10MB 제한)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error(`파일 크기가 너무 큽니다. 최대 10MB까지 업로드 가능합니다. (현재: ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      }

      // 파일 형식 검증
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`지원하지 않는 파일 형식입니다. JPG, PNG, WebP 파일만 업로드 가능합니다. (현재: ${file.type})`);
      }

      const bucket = type === 'background' ? 'banner-images' : 
                    type === 'final' ? 'final-banners' : 
                    type === 'thumbnail' ? 'thumbnails' : 'banner-images';
      
      const fileExt = file.name.split('.').pop() || 'jpg';
      const randomName = Math.random().toString(36).substring(2);
      const fileName = `${type || 'banner'}-${Date.now()}-${randomName}.${fileExt}`;
      
      console.log('📝 Storage 업로드 정보:', { bucket, fileName, fileSize: file.size });

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      console.log('✅ Storage 응답:', { data, error });

      if (error) {
        console.error('❌ Storage 오류 상세:', {
          message: error.message,
          statusCode: (error as any).statusCode,
          details: (error as any).details,
          hint: (error as any).hint,
          code: (error as any).code,
          name: (error as any).name,
          originalError: error,
          bucket,
          fileName,
          fileSize: file.size,
          fileType: file.type
        });
        
        // 구체적인 오류 메시지 제공
        let userMessage = '이미지 업로드 중 오류가 발생했습니다.';
        
        // HTTP 상태 코드별 처리
        const statusCode = (error as any).statusCode;
        if (statusCode === 400) {
          userMessage = `잘못된 요청입니다. 파일이 손상되었거나 지원하지 않는 형식일 수 있습니다. (버킷: ${bucket})`;
        } else if (statusCode === 401) {
          userMessage = '인증이 필요합니다. API 키를 확인해주세요.';
        } else if (statusCode === 403) {
          userMessage = `Storage 버킷 '${bucket}'에 대한 업로드 권한이 없습니다. 관리자에게 문의하세요.`;
        } else if (statusCode === 404) {
          userMessage = `Storage 버킷 '${bucket}'을 찾을 수 없습니다. 관리자에게 문의하세요.`;
        } else if (statusCode === 413) {
          userMessage = '파일 크기가 너무 큽니다. 더 작은 파일을 업로드해주세요.';
        } else if (error.message.includes('not found')) {
          userMessage = `Storage 버킷 '${bucket}'을 찾을 수 없습니다. 관리자에게 문의하세요.`;
        } else if (error.message.includes('permission') || error.message.includes('forbidden')) {
          userMessage = `파일 업로드 권한이 없습니다. 버킷: ${bucket}`;
        } else if (error.message.includes('size') || error.message.includes('too large')) {
          userMessage = '파일 크기가 제한을 초과했습니다.';
        } else {
          userMessage = `업로드 오류 (HTTP ${statusCode || 'Unknown'}): ${error.message}`;
        }
        
        throw new Error(userMessage);
      }

      if (!data?.path) {
        throw new Error('업로드된 파일 경로를 가져올 수 없습니다.');
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      console.log('🔗 생성된 공개 URL:', publicUrlData.publicUrl);
      
      if (!publicUrlData.publicUrl) {
        throw new Error('공개 URL을 생성할 수 없습니다.');
      }

      return publicUrlData.publicUrl;
    } catch (err) {
      console.error('💥 StorageService 업로드 실패:', {
        error: err,
        message: err instanceof Error ? err.message : '알 수 없는 오류',
        uploadType: type,
        fileName: file.name
      });
      throw err;
    }
  },

  // 로고 업로드
  async uploadLogo(file: File, path?: string): Promise<string> {
    console.log('🚀 StorageService 로고 업로드 시작:', { 
      fileName: file.name, 
      fileSize: file.size, 
      fileType: file.type,
      path 
    });

    try {
      // 파일 크기 검증 (5MB 제한)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error(`로고 파일 크기가 너무 큽니다. 최대 5MB까지 업로드 가능합니다. (현재: ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      }

      // 파일 형식 검증
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`지원하지 않는 로고 파일 형식입니다. JPG, PNG, WebP, SVG 파일만 업로드 가능합니다. (현재: ${file.type})`);
      }

      const bucket = 'logos';
      const fileExt = file.name.split('.').pop() || 'png';
      const randomName = Math.random().toString(36).substring(2);
      const fileName = path || `logo-${Date.now()}-${randomName}.${fileExt}`;

      console.log('📝 로고 업로드 정보:', { bucket, fileName, fileSize: file.size });

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      console.log('✅ 로고 Storage 응답:', { data, error });

      if (error) {
        console.error('❌ 로고 Storage 오류 상세:', {
          message: error.message,
          statusCode: (error as any).statusCode,
          details: (error as any).details,
          hint: (error as any).hint,
        });
        
        // 구체적인 오류 메시지 제공
        let userMessage = '로고 업로드 중 오류가 발생했습니다.';
        if (error.message.includes('not found')) {
          userMessage = `Storage 버킷 '${bucket}'을 찾을 수 없습니다. 관리자에게 문의하세요.`;
        } else if (error.message.includes('permission')) {
          userMessage = '로고 업로드 권한이 없습니다. 관리자에게 문의하세요.';
        } else if (error.message.includes('size')) {
          userMessage = '로고 파일 크기가 제한을 초과했습니다.';
        } else {
          userMessage = `로고 업로드 오류: ${error.message}`;
        }
        
        throw new Error(userMessage);
      }

      if (!data?.path) {
        throw new Error('업로드된 로고 파일 경로를 가져올 수 없습니다.');
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      console.log('🔗 생성된 로고 공개 URL:', publicUrlData.publicUrl);
      
      if (!publicUrlData.publicUrl) {
        throw new Error('로고 공개 URL을 생성할 수 없습니다.');
      }

      return publicUrlData.publicUrl;
    } catch (err) {
      console.error('💥 로고 업로드 실패:', {
        error: err,
        message: err instanceof Error ? err.message : '알 수 없는 오류',
        fileName: file.name
      });
      throw err;
    }
  },

  // 썸네일 업로드
  async uploadThumbnail(file: File, path?: string): Promise<string> {
    const fileName = path || `${Date.now()}-${file.name}`
    const { data: _data, error } = await supabase.storage
      .from('thumbnails')
      .upload(fileName, file)

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('thumbnails')
      .getPublicUrl(fileName)

    return publicUrl
  },

  // 파일 삭제
  async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) throw error
  }
}

// ===== 기본 프로젝트 생성 및 관리 =====

export const getOrCreateDefaultProject = async (): Promise<string> => {
  console.log('🔍 기본 프로젝트 확인 중...');
  
  try {
    // 먼저 기본 프로젝트가 있는지 확인
    const { data: existingProjects, error: searchError } = await supabase
      .from('projects')
      .select('id')
      .eq('name', 'Default Project')
      .limit(1);

    if (searchError) {
      console.error('❌ 기본 프로젝트 검색 실패:', searchError);
      throw searchError;
    }

    // 기존 기본 프로젝트가 있으면 그 ID 반환
    if (existingProjects && existingProjects.length > 0) {
      console.log('✅ 기존 기본 프로젝트 발견:', existingProjects[0].id);
      return existingProjects[0].id;
    }

    // 기본 프로젝트가 없으면 생성
    console.log('📝 새 기본 프로젝트 생성 중...');
    const { data: newProject, error: createError } = await supabase
      .from('projects')
      .insert([{
        name: 'Default Project',
        description: '자동 생성된 기본 프로젝트입니다.',
        status: 'active',
        priority: 'medium',
        user_id: null
      }])
      .select('id')
      .single();

    if (createError) {
      console.error('❌ 기본 프로젝트 생성 실패:', createError);
      throw createError;
    }

    console.log('✅ 새 기본 프로젝트 생성 완료:', newProject.id);
    return newProject.id;
    
  } catch (error) {
    console.error('💥 기본 프로젝트 처리 실패:', error);
    throw new Error(`기본 프로젝트 생성/확인 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}; 