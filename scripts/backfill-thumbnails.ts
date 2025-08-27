#!/usr/bin/env node

/**
 * 썸네일 백필 스크립트
 * 기존 배너들의 썸네일을 생성하여 thumbnails 버킷에 저장하고 DB를 업데이트
 */

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import fetch from 'node-fetch';

// Supabase 설정
const supabaseUrl = 'https://vznpflqvmbbglfhqftvz.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'your-service-key-here';

if (!supabaseServiceKey || supabaseServiceKey === 'your-service-key-here') {
  console.error('❌ SUPABASE_SERVICE_KEY 환경변수가 설정되지 않았습니다.');
  console.error('사용법: SUPABASE_SERVICE_KEY=your-key npm run backfill-thumbnails');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Banner {
  id: string;
  title: string;
  background_image_url?: string;
  final_banner_url?: string;
  thumbnail_url?: string;
}

/**
 * 이미지를 다운로드하고 썸네일 생성
 */
async function generateThumbnail(imageUrl: string): Promise<Buffer> {
  console.log(`  📥 이미지 다운로드: ${imageUrl}`);
  
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`이미지 다운로드 실패: ${response.status} ${response.statusText}`);
  }

  const imageBuffer = Buffer.from(await response.arrayBuffer());
  
  console.log(`  🖼️  썸네일 생성 중... (max 320x320)`);
  
  // Sharp로 썸네일 생성 (최대 320x320, 품질 유지)
  const thumbnail = await sharp(imageBuffer)
    .resize(320, 320, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .jpeg({
      quality: 85,
      progressive: true
    })
    .toBuffer();

  return thumbnail;
}

/**
 * 썸네일을 Supabase Storage에 업로드
 */
async function uploadThumbnail(bannerId: string, thumbnailBuffer: Buffer): Promise<string> {
  const fileName = `thumb-${bannerId}-${Date.now()}.jpg`;
  
  console.log(`  📤 썸네일 업로드: ${fileName}`);
  
  const { data, error } = await supabase.storage
    .from('thumbnails')
    .upload(fileName, thumbnailBuffer, {
      contentType: 'image/jpeg',
      cacheControl: 'public, max-age=31536000, immutable', // 1년 캐시
      upsert: false
    });

  if (error) {
    throw new Error(`썸네일 업로드 실패: ${error.message}`);
  }

  // 공개 URL 생성
  const { data: urlData } = supabase.storage
    .from('thumbnails')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

/**
 * 배너의 thumbnail_url 업데이트
 */
async function updateBannerThumbnail(bannerId: string, thumbnailUrl: string): Promise<void> {
  console.log(`  💾 DB 업데이트: ${bannerId}`);
  
  const { error } = await supabase
    .from('banners')
    .update({ thumbnail_url: thumbnailUrl })
    .eq('id', bannerId);

  if (error) {
    throw new Error(`DB 업데이트 실패: ${error.message}`);
  }
}

/**
 * 단일 배너 처리
 */
async function processBanner(banner: Banner): Promise<void> {
  console.log(`\n🎯 처리 중: ${banner.title} (${banner.id})`);

  // 이미 썸네일이 있는 경우 스킵
  if (banner.thumbnail_url) {
    console.log(`  ⏭️  이미 썸네일 존재, 스킵`);
    return;
  }

  // 원본 이미지 URL 결정
  const sourceImageUrl = banner.final_banner_url || banner.background_image_url;
  if (!sourceImageUrl) {
    console.log(`  ⚠️  원본 이미지 없음, 스킵`);
    return;
  }

  try {
    // 썸네일 생성
    const thumbnailBuffer = await generateThumbnail(sourceImageUrl);
    
    // 썸네일 업로드
    const thumbnailUrl = await uploadThumbnail(banner.id, thumbnailBuffer);
    
    // DB 업데이트
    await updateBannerThumbnail(banner.id, thumbnailUrl);
    
    console.log(`  ✅ 완료: ${thumbnailUrl}`);
  } catch (error) {
    console.error(`  ❌ 실패: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🚀 썸네일 백필 스크립트 시작\n');

  try {
    // 썸네일이 없는 배너들 조회
    console.log('📋 썸네일이 없는 배너들 조회 중...');
    
    const { data: banners, error } = await supabase
      .from('banners')
      .select('id, title, background_image_url, final_banner_url, thumbnail_url')
      .is('thumbnail_url', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`배너 조회 실패: ${error.message}`);
    }

    if (!banners || banners.length === 0) {
      console.log('✨ 처리할 배너가 없습니다. 모든 배너에 썸네일이 있습니다.');
      return;
    }

    console.log(`📊 총 ${banners.length}개의 배너를 처리합니다.\n`);

    // 배너들 순차 처리 (동시 처리 시 리소스 부족 방지)
    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    for (const banner of banners) {
      processed++;
      console.log(`\n[${processed}/${banners.length}]`);
      
      try {
        await processBanner(banner);
        succeeded++;
      } catch (error) {
        failed++;
        console.error(`❌ 배너 처리 실패: ${banner.id}`, error);
      }

      // 진행률 표시
      const progress = Math.round((processed / banners.length) * 100);
      console.log(`📈 진행률: ${progress}% (성공: ${succeeded}, 실패: ${failed})`);

      // API 레이트 리밋 방지를 위한 지연
      if (processed % 10 === 0) {
        console.log('⏳ 잠시 대기 중... (API 레이트 리밋 방지)');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log('\n🎉 썸네일 백필 완료!');
    console.log(`📊 최종 결과: 총 ${processed}개 처리, 성공 ${succeeded}개, 실패 ${failed}개`);

  } catch (error) {
    console.error('💥 스크립트 실행 실패:', error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  main().catch(console.error);
}

export { main as backfillThumbnails };
