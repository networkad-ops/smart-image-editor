import { createClient } from '@supabase/supabase-js'

// 환경 변수 강제 설정 (개발 중 문제 해결용)
const supabaseUrl = 'https://vznpflqvmbbglfhqftvz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6bnBmbHF2bWJiZ2xmaHFmdHZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1OTgyMzMsImV4cCI6MjA2NjE3NDIzM30.VPJ9At-GOb2GIxjV_1w8Gf6hWdBaNeKfO7yT5I2b8pM'

console.log('🔧 새로운 API 키로 업데이트 완료!');

console.log('🔧 환경 변수 확인:', {
  supabaseUrl,
  supabaseAnonKey: supabaseAnonKey ? `${supabaseAnonKey.slice(0, 20)}...` : undefined,
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  envMode: import.meta.env.MODE,
  allEnvVars: import.meta.env
});

// Supabase 환경 변수가 없을 때는 Mock 모드로 동작
export const isMockMode = false // 강제로 실제 DB 모드로 설정

console.log('🔍 모드 결정:', { isMockMode });

let supabase: any = null

if (!isMockMode) {
  console.log('🎯 실제 Supabase DB에 연결 중...');
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('✅ Supabase 클라이언트 생성 완료 (가장 단순한 표준 설정)');
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