#!/usr/bin/env python3
"""
갤러리 목록 자동 생성 스크립트
사용법: python generate_gallery.py

gallery/photos/, gallery/videos/ 폴더를 스캔하여
assets/gallery-list.js 파일을 생성합니다.
"""

import os
import json
from datetime import datetime
from pathlib import Path

# 지원 파일 형식
PHOTO_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.heic', '.heif', '.webp', '.gif'}
VIDEO_EXTENSIONS = {'.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'}

# 폴더 경로 (스크립트 위치 기준)
SCRIPT_DIR = Path(__file__).parent
GALLERY_DIR = SCRIPT_DIR / 'gallery'
OUTPUT_FILE = SCRIPT_DIR / 'assets' / 'gallery-list.js'

# DAY 폴더 정보 (날짜 매핑)
DAY_INFO = {
    'DAY1_251226': {'day': 1, 'date': '12/26(금)', 'title': '1일차 - 출발'},
    'DAY2_251227': {'day': 2, 'date': '12/27(토)', 'title': '2일차 - 빈원더스/골프'},
    'DAY3_251228': {'day': 3, 'date': '12/28(일)', 'title': '3일차 - 호핑투어'},
    'DAY4_251229': {'day': 4, 'date': '12/29(월)', 'title': '4일차 - 관광/귀국'},
    'DAY5_251230': {'day': 5, 'date': '12/30(화)', 'title': '5일차 - 도착'},
}


def scan_folder(base_path, extensions):
    """폴더를 스캔하여 파일 목록 반환"""
    result = {}
    
    if not base_path.exists():
        print(f"  ⚠️  폴더 없음: {base_path}")
        return result
    
    for day_folder in sorted(base_path.iterdir()):
        if not day_folder.is_dir():
            continue
        
        folder_name = day_folder.name
        files = []
        
        for file in sorted(day_folder.iterdir()):
            if file.is_file() and file.suffix.lower() in extensions:
                files.append(file.name)
        
        if files:
            result[folder_name] = files
            print(f"  📁 {folder_name}: {len(files)}개 파일")
    
    return result


def generate_js(photos, videos):
    """JavaScript 파일 내용 생성"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    # DAY 정보 포함
    day_info_js = json.dumps(DAY_INFO, ensure_ascii=False, indent=2)
    photos_js = json.dumps(photos, ensure_ascii=False, indent=2)
    videos_js = json.dumps(videos, ensure_ascii=False, indent=2)
    
    content = f"""// 자동 생성됨 - 직접 수정하지 마세요
// 생성 시간: {timestamp}
// 사용법: python generate_gallery.py

window.CONEXTT = window.CONEXTT || {{}};

window.CONEXTT.dayInfo = {day_info_js};

window.CONEXTT.gallery = {{
  photos: {photos_js},
  videos: {videos_js}
}};
"""
    return content


def main():
    print("=" * 50)
    print("🖼️  갤러리 목록 생성 스크립트")
    print("=" * 50)
    
    # 폴더 스캔
    print("\n📷 사진 폴더 스캔...")
    photos = scan_folder(GALLERY_DIR / 'photos', PHOTO_EXTENSIONS)
    
    print("\n🎬 동영상 폴더 스캔...")
    videos = scan_folder(GALLERY_DIR / 'videos', VIDEO_EXTENSIONS)
    
    # 통계
    total_photos = sum(len(v) for v in photos.values())
    total_videos = sum(len(v) for v in videos.values())
    
    print("\n" + "=" * 50)
    print(f"📊 총계: 사진 {total_photos}장, 동영상 {total_videos}개")
    
    # JS 파일 생성
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    
    js_content = generate_js(photos, videos)
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    print(f"\n✅ 생성 완료: {OUTPUT_FILE}")
    print("=" * 50)
    
    # 빈 폴더 확인
    if not photos and not videos:
        print("\n💡 힌트: gallery/photos/, gallery/videos/ 폴더에")
        print("   DAY1_251226, DAY2_251227 등의 하위 폴더를 만들고")
        print("   사진/동영상을 넣은 후 다시 실행하세요.")


if __name__ == '__main__':
    main()
