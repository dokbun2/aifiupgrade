# 동영상 호스팅 가이드

## 현재 문제
- GitHub raw URL은 동영상 스트리밍에 적합하지 않음
- Cloudflare Pages는 25MB 파일 크기 제한이 있음
- 대용량 동영상(hero.mp4 37.7MB)은 외부 호스팅 필요

## 추천 솔루션

### 1. Cloudflare R2 (무료 플랜 사용 가능)
```bash
# R2 버킷 생성
1. Cloudflare Dashboard → R2 → Create bucket
2. 버킷 이름: aifiupgrade-videos
3. Public access 활성화

# 동영상 업로드
4. hero.mp4 파일 업로드
5. Public URL 복사

# index.html에 URL 적용
<source src="https://[your-r2-url].r2.dev/hero.mp4" type="video/mp4">
```

### 2. Cloudinary (무료 25GB/월)
```bash
# 계정 생성 후
1. Media Library → Upload
2. hero.mp4 업로드
3. URL 복사하여 index.html에 적용
```

### 3. Bunny.net CDN (저렴한 유료)
```bash
# Storage Zone 생성
1. Edge Storage 생성
2. FTP/API로 동영상 업로드
3. Pull Zone 연결
4. CDN URL 사용
```

### 4. YouTube/Vimeo 임베드 (무료)
```html
<!-- YouTube 임베드 예시 -->
<iframe
  src="https://www.youtube.com/embed/VIDEO_ID?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&playlist=VIDEO_ID"
  frameborder="0"
  allow="autoplay; encrypted-media"
  allowfullscreen>
</iframe>
```

## 임시 해결책 (현재 적용됨)
- 테스트용 공개 동영상 URL 사용 중
- 실제 hero.mp4는 위 방법 중 하나로 호스팅 후 교체 필요

## 동영상 최적화 팁
```bash
# FFmpeg로 파일 크기 줄이기
ffmpeg -i hero.mp4 -c:v libx264 -crf 23 -preset fast -c:a aac -b:a 128k hero_optimized.mp4

# WebM 포맷 추가 (더 나은 압축)
ffmpeg -i hero.mp4 -c:v libvpx-vp9 -crf 30 -b:v 0 hero.webm
```

## 권장 사항
1. **Cloudflare R2**를 사용하면 같은 Cloudflare 생태계 내에서 관리 가능
2. 동영상은 **1080p, 30fps, 10-15초** 정도로 최적화 권장
3. 여러 포맷 제공 (mp4, webm) for 브라우저 호환성