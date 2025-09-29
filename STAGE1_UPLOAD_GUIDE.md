# Stage1 JSON 업로드 기능 사용 가이드

## 🎯 기능 개요
컨셉아트 페이지에 Stage1 JSON 파일을 업로드하면 자동으로 캐릭터, 장소, 소품 정보가 드롭다운에 추가되고, 선택 시 프롬프트가 자동으로 채워집니다.

## 📋 사용 방법

### 1. 컨셉아트 페이지 접속
```
http://localhost:8000/conceptart/
```

### 2. JSON 파일 업로드
1. 페이지 우측 상단의 **"JSON 업로드"** 버튼 클릭
2. Stage1 JSON 파일 선택 (예: `Gieokui_Siktak_stage1.json`)
3. 업로드 성공 시 "Stage1 JSON 파일이 성공적으로 로드되었습니다!" 메시지 표시

### 3. 드롭다운 확인
업로드 후 자동으로 드롭다운이 업데이트됩니다:
- **캐릭터**: CHAR_001 - Seojun, CHAR_002 - Grandmother 등
- **장소**: LOC_001 - Kitchen, LOC_002 - Street, LOC_003 - Table 등
- **소품**: PROP_001 - Wooden Spoon, PROP_002 - Recipe Notebook 등

### 4. 프롬프트 자동 생성
1. 드롭다운에서 원하는 항목 선택
2. 자동으로 프롬프트 블록이 결합되어 표시됨
3. **"프롬프트 복사"** 버튼으로 클립보드에 복사 가능

## 🔍 Stage1 JSON 구조

```json
{
  "visual_blocks": {
    "characters": [
      {
        "id": "CHAR_001",
        "name": "Seojun",
        "blocks": {
          "1_STYLE": "Photorealistic portrait",
          "2_ARTIST_REF": "Steve McCurry style",
          // ... 25개 블록
        }
      }
    ],
    "locations": [
      {
        "id": "LOC_001",
        "name": "Kitchen",
        "blocks": {
          // ... 28개 블록
        }
      }
    ],
    "props": [
      {
        "id": "PROP_001",
        "name": "Wooden Spoon",
        "blocks": {
          // ... 21개 블록
        }
      }
    ]
  }
}
```

## ✨ 주요 기능

### 자동 변환
- visual_blocks 구조를 자동으로 감지
- 각 항목의 ID와 이름을 드롭다운에 표시
- blocks 데이터를 프롬프트로 변환

### 프롬프트 처리
- **캐릭터**: 25개 블록 자동 결합
- **장소**: 28개 블록 자동 결합
- **소품**: 21개 블록 자동 결합
- 모든 블록이 쉼표로 구분되어 하나의 프롬프트로 생성

### 데이터 저장
- localStorage에 자동 저장
- 페이지 새로고침 후에도 데이터 유지
- 다운로드 기능으로 백업 가능

## 🧪 테스트 파일

### 테스트용 Stage1 JSON 파일 위치
```
/data/stage1_test.json
```

### 테스트 페이지
```
http://localhost:8000/test-stage1-api.html
```

## 📝 주의사항

1. **파일 형식**: Stage1 JSON 형식만 지원 (visual_blocks 필수)
2. **브라우저 호환성**: Chrome, Firefox, Safari 최신 버전 권장
3. **파일 크기**: 10MB 이하 권장

## 🐛 문제 해결

### "Not a Stage1 format" 오류
- visual_blocks 속성이 있는지 확인
- JSON 형식이 올바른지 검증

### 드롭다운이 업데이트되지 않음
- 브라우저 콘솔에서 에러 메시지 확인
- 페이지 새로고침 후 재시도

### 프롬프트가 표시되지 않음
- 드롭다운에서 항목을 다시 선택
- localStorage 초기화 후 재시도

## 🚀 추가 기능

- **다중 선택**: 여러 캐릭터/장소/소품 동시 선택 (예정)
- **프롬프트 편집**: 생성된 프롬프트 수정 기능 (예정)
- **이미지 미리보기**: 생성된 이미지 자동 표시 (예정)

---

작성일: 2025-09-29
버전: 1.0