import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('🔧 환경 변수 확인:', {
  supabaseUrl,
  supabaseAnonKey: supabaseAnonKey ? `${supabaseAnonKey.slice(0, 20)}...` : undefined,
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey
});

// Supabase 환경 변수가 없을 때는 Mock 모드로 동작
export const isMockMode = !supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your_supabase_project_url'

console.log('🔍 모드 결정:', { isMockMode });

let supabase: any = null

if (!isMockMode) {
  console.log('🎯 실제 Supabase DB에 연결 중...');
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  })
  console.log('✅ Supabase 클라이언트 생성 완료');
} else {
  // Mock Supabase 클라이언트
  console.log('🚀 Mock 모드로 실행 중입니다. 실제 데이터베이스 대신 로컬 데이터를 사용합니다.')
  supabase = {
    from: (_table: string) => ({
      select: () => ({
        order: () => ({ data: [], error: null }),
        single: () => ({ data: null, error: null }),
        eq: () => ({
          single: () => ({ data: null, error: null }),
          order: () => ({ data: [], error: null })
        })
      }),
      insert: () => ({
        select: () => ({
          single: () => ({ 
            data: { 
              id: `mock-${Date.now()}`, 
              name: 'Mock Data',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, 
            error: null 
          })
        })
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () => ({ 
              data: { 
                id: `mock-${Date.now()}`, 
                name: 'Updated Mock Data',
                updated_at: new Date().toISOString()
              }, 
              error: null 
            })
          })
        })
      }),
      delete: () => ({
        eq: () => ({ error: null })
      })
    }),
    storage: {
      from: () => ({
        upload: () => ({ data: { path: 'mock-path' }, error: null }),
        remove: () => ({ error: null }),
        getPublicUrl: () => ({ data: { publicUrl: 'https://mock-url.com/image.jpg' } })
      })
    },
    rpc: () => ({ data: {}, error: null }),
    auth: {
      getUser: () => ({ data: { user: { id: 'temp-user-id' } } })
    }
  }
}

export { supabase }

// 데이터베이스 타입 정의
export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
          user_id?: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
      banners: {
        Row: {
          id: string
          project_id: string
          title: string
          banner_type: string
          device_type: string
          image_url: string
          logo_url?: string
          text_elements: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          banner_type: string
          device_type: string
          image_url: string
          logo_url?: string
          text_elements: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          title?: string
          banner_type?: string
          device_type?: string
          image_url?: string
          logo_url?: string
          text_elements?: any
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
} 