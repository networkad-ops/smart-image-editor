import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

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