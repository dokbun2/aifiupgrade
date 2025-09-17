# 🚀 AIFI Framework - Supabase 설정 가이드

## ✅ Supabase 자격 증명 (이미 설정됨)
- **Project URL**: `https://dhilswazlggfgfyozikq.supabase.co`
- **Anon Key**: 설정 완료 (`js/supabase-config.js`에 저장됨)

## 📋 설정 단계

### 1️⃣ 데이터베이스 테이블 생성

1. **Supabase SQL Editor 열기**:
   - [SQL Editor 바로가기](https://app.supabase.com/project/dhilswazlggfgfyozikq/sql/new)

2. **SQL 스크립트 실행**:
   - `supabase-init.sql` 파일의 전체 내용을 복사
   - SQL Editor에 붙여넣기
   - "Run" 버튼 클릭
   - ✅ 성공 메시지 확인

### 2️⃣ Storage 버킷 생성

1. **Storage 페이지 열기**:
   - [Storage 바로가기](https://app.supabase.com/project/dhilswazlggfgfyozikq/storage/buckets)

2. **avatars 버킷 생성**:
   - "New Bucket" 클릭
   - Bucket name: `avatars`
   - ✅ Public bucket 체크
   - File size limit: 5MB
   - "Create Bucket" 클릭

### 3️⃣ 인증 설정 (선택사항)

1. **이메일 템플릿 설정**:
   - [Authentication → Email Templates](https://app.supabase.com/project/dhilswazlggfgfyozikq/auth/templates)
   - 필요시 한국어로 커스터마이징

2. **URL 설정**:
   - [Authentication → URL Configuration](https://app.supabase.com/project/dhilswazlggfgfyozikq/auth/url-configuration)
   - Site URL: 실제 도메인 설정 (프로덕션용)

## 🧪 테스트

### 연결 테스트
1. 브라우저에서 `test-supabase.html` 파일 열기
2. 각 섹션의 버튼을 클릭하여 테스트:
   - ✅ 연결 상태 확인
   - ✅ 테이블 확인
   - ✅ 테스트 사용자 생성
   - ✅ Storage 버킷 확인

### 실제 사용
1. 로컬 서버 실행:
```bash
python3 -m http.server 8000
```

2. 브라우저에서 접속:
```
http://localhost:8000
```

3. 기능 테스트:
   - 회원가입: 로그인 버튼 → 회원가입
   - 로그인: 이메일/비밀번호 입력
   - 프로필 관리: 로그인 후 사용자 메뉴 → 프로필 관리
   - 프로필 사진 업로드
   - 비밀번호 변경

## 🎯 주요 파일

| 파일 | 설명 |
|------|------|
| `js/supabase-config.js` | Supabase 설정 및 인증 로직 |
| `js/auth.js` | 로그인/회원가입 UI 로직 |
| `js/profile.js` | 프로필 관리 로직 |
| `supabase-init.sql` | 데이터베이스 초기화 SQL |
| `test-supabase.html` | 연결 테스트 페이지 |

## ⚠️ 중요 사항

1. **이메일 확인**: 회원가입 시 이메일 확인이 필요할 수 있습니다.
2. **Storage 제한**: 프로필 이미지는 최대 5MB까지 업로드 가능합니다.
3. **보안**: 프로덕션 환경에서는 RLS(Row Level Security) 정책을 검토하세요.

## 🆘 문제 해결

### "relation "profiles" does not exist" 오류
→ SQL 스크립트를 먼저 실행하세요.

### 로그인이 안 될 때
→ 이메일 확인이 필요할 수 있습니다. Supabase 대시보드에서 확인하세요.

### 프로필 사진 업로드 실패
→ avatars 버킷이 생성되었는지, public으로 설정되었는지 확인하세요.

## ✨ 완료!

모든 설정이 완료되면:
- ✅ 사용자 인증 시스템
- ✅ 프로필 관리
- ✅ 프로필 사진 업로드
- ✅ 비밀번호 변경

이 모든 기능이 작동합니다!