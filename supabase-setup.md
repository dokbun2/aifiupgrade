# Supabase 설정 가이드

## 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com) 웹사이트 접속
2. "Start your project" 버튼 클릭
3. GitHub으로 로그인
4. "New Project" 클릭
5. 프로젝트 정보 입력:
   - Organization: 선택 또는 생성
   - Project Name: aifi-framework (원하는 이름)
   - Database Password: 강력한 비밀번호 설정
   - Region: Seoul (ap-northeast-2) 선택

## 2. API 키 가져오기

1. 프로젝트 대시보드에서 Settings → API 메뉴 이동
2. 다음 정보를 복사:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon/Public Key**: `eyJhbGc...` (긴 문자열)

3. `js/supabase-config.js` 파일을 열고 다음 부분을 수정:
```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL'; // 여기에 Project URL 붙여넣기
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // 여기에 Anon Key 붙여넣기
```

## 3. 데이터베이스 테이블 생성

Supabase 대시보드의 SQL Editor에서 다음 쿼리 실행:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  nickname TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at();

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, nickname, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'nickname',
    COALESCE(
      new.raw_user_meta_data->>'avatar_url',
      'https://ui-avatars.com/api/?name=' || COALESCE(new.raw_user_meta_data->>'full_name', 'User') || '&background=6366f1&color=fff'
    )
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

## 4. Storage 버킷 생성 (프로필 이미지용)

1. Supabase 대시보드에서 Storage 메뉴 이동
2. "New Bucket" 클릭
3. Bucket 이름: `avatars`
4. Public bucket 체크
5. "Create Bucket" 클릭

## 5. Storage 정책 설정

Storage → Policies 에서 다음 정책 추가:

```sql
-- Allow public read access
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

## 6. 이메일 템플릿 설정 (선택사항)

1. Authentication → Email Templates
2. 각 템플릿을 한국어로 커스터마이징 가능

## 7. 도메인 설정 (프로덕션용)

1. Authentication → URL Configuration
2. Site URL: 실제 도메인 입력 (예: https://aififramework.com)
3. Redirect URLs에 허용할 URL 추가

## 완료!

이제 Supabase가 완전히 설정되었습니다.
index.html 파일을 열어서 로그인/회원가입을 테스트해보세요.