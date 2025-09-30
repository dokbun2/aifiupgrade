# Stage 1 JSON to Storyboard Integration PRD
## Product Requirements Document

### 1. 프로젝트 개요

#### 1.1 목적
Stage 1 JSON 파일의 구조화된 데이터를 스토리보드 인터페이스의 각 컴포넌트(시퀀스, 씬, 샷)에 자동으로 매칭하고 파싱하는 시스템 구축

#### 1.2 범위
- JSON 파일 업로드 및 파싱
- 스토리보드 메인 화면 데이터 반영
- 샷 디테일 모달의 5개 블록(기본, 연출, 캐릭터, 장소, 소품)에 데이터 매칭
- 프롬프트 텍스트 창 자동 채우기

### 2. JSON 파일 구조 분석

#### 2.1 최상위 구조
```json
{
  "film_id": "FILM_831101",
  "current_step": "concept_art_blocks_completed",
  "timestamp": "2025-09-30T01:58:32Z",
  "film_metadata": {...},
  "current_work": {
    "logline": "...",
    "synopsis": {...},
    "treatment": {
      "sequences": [...]
    },
    "scenario": {
      "scenes": [...]
    }
  },
  "visual_blocks": {
    "characters": [...],
    "locations": [...],
    "props": [...]
  }
}
```

#### 2.2 핵심 데이터 매칭 관계

##### 시퀀스 (Sequences)
- `current_work.treatment.sequences[]` → 스토리보드 시퀀스
  - `sequence_id`: 시퀀스 고유 ID
  - `sequence_title`: 시퀀스 제목
  - `narrative_function`: 서사 기능
  - `treatment_text`: 시퀀스 설명

##### 씬 (Scenes)
- `current_work.scenario.scenes[]` → 스토리보드 씬
  - `scene_id`: 씬 고유 ID
  - `scene_number`: 씬 번호
  - `sequence_id`: 연결된 시퀀스 ID
  - `scenario_text`: 씬 스크립트

##### 캐릭터 (Characters)
- `visual_blocks.characters[]` → 캐릭터 블록
  - `blocks.1_STYLE` ~ `blocks.25_PARAMETER`: 25개 필드
  - `character_detail`: 캐릭터 상세 설명
  - `voice_style`: 음성 스타일

##### 장소 (Locations)
- `visual_blocks.locations[]` → 장소 블록
  - `blocks.1_STYLE` ~ `blocks.28_PARAMETER`: 28개 필드

##### 소품 (Props)
- `visual_blocks.props[]` → 소품 블록
  - `blocks.1_STYLE` ~ `blocks.21_PARAMETER`: 21개 필드
  - `prop_detail`: 소품 상세 설명

### 3. 기능 요구사항

#### 3.1 JSON 파일 업로드
- **기능**: Stage 1 JSON 파일 업로드 인터페이스
- **위치**: 스토리보드 페이지 상단
- **동작**:
  1. 파일 선택 또는 드래그&드롭
  2. JSON 유효성 검증
  3. 구조 확인 및 오류 알림

#### 3.2 메인 스토리보드 반영
- **자동 생성**:
  - 시퀀스별 그룹화
  - 씬별 카드 생성
  - 샷 정보 표시
- **표시 정보**:
  - 시퀀스 제목
  - 씬 번호 및 ID
  - 간략한 텍스트 미리보기

#### 3.3 샷 디테일 모달 - 5개 블록 시스템

##### 3.3.1 기본블록 (Basic Block)
**Stage 1 JSON 매칭**:
```javascript
// film_metadata에서 추출
{
  "제목": film_metadata.title_working,
  "장르": film_metadata.genre,
  "시간": film_metadata.duration_minutes,
  "스타일": film_metadata.style,
  "아티스트": film_metadata.artist,
  "미디엄": film_metadata.medium,
  "시대": film_metadata.era,
  "종횡비": film_metadata.aspect_ratio
}
```

##### 3.3.2 연출블록 (Direction Block)
**Stage 1 JSON 매칭**:
```javascript
// scenes의 scenario_text에서 추출
{
  "씬텍스트": scenes[].scenario_text,
  "시퀀스정보": sequences[].treatment_text,
  "서사기능": sequences[].narrative_function
}
```

##### 3.3.3 캐릭터블록 (Character Block)
**Stage 1 JSON 매칭**:
```javascript
// characters[].blocks에서 추출
{
  "1_STYLE": "스타일",
  "2_ARTIST": "아티스트",
  "3_MEDIUM": "미디엄",
  "4_GENRE": "장르",
  "5_CHARACTER": "캐릭터",
  "6_MOOD_PERSONALITY": "분위기/성격",
  // ... 25개 필드 전체
}
```

##### 3.3.4 장소블록 (Location Block)
**Stage 1 JSON 매칭**:
```javascript
// locations[].blocks에서 추출
{
  "1_STYLE": "스타일",
  "5_LOCATION": "장소",
  "9_ATMOSPHERE": "분위기",
  "10_COLOR_TONE": "색조",
  // ... 28개 필드 전체
}
```

##### 3.3.5 소품블록 (Props Block)
**Stage 1 JSON 매칭**:
```javascript
// props[].blocks에서 추출
{
  "1_STYLE": "스타일",
  "5_ITEM_NAME": "아이템명",
  "10_MATERIAL": "재질",
  "11_COLOR": "색상",
  // ... 21개 필드 전체
}
```

### 4. UI/UX 요구사항

#### 4.1 업로드 인터페이스
```html
<div class="json-upload-section">
  <div class="upload-area">
    <input type="file" accept=".json" id="stage1-json-upload">
    <label for="stage1-json-upload">
      Stage 1 JSON 파일 업로드
    </label>
  </div>
  <div class="upload-status">
    <!-- 업로드 상태 표시 -->
  </div>
</div>
```

#### 4.2 블록별 프롬프트 텍스트 창
```html
<div class="block-section" data-block="basic">
  <h3>기본블록</h3>
  <div class="prompt-fields">
    <div class="field-group">
      <label>제목</label>
      <input type="text" id="basic-title" readonly>
    </div>
    <div class="field-group">
      <label>장르</label>
      <input type="text" id="basic-genre" readonly>
    </div>
    <!-- 추가 필드들 -->
  </div>
  <button class="generate-prompt-btn">프롬프트 생성</button>
</div>
```

### 5. 기술 구현 상세

#### 5.1 JSON 파서 모듈
```javascript
class Stage1JSONParser {
  constructor() {
    this.data = null;
  }

  async loadJSON(file) {
    // JSON 파일 로드 및 파싱
  }

  extractBasicBlock() {
    // 기본블록 데이터 추출
    return {
      title: this.data.film_metadata.title_working,
      genre: this.data.film_metadata.genre,
      // ...
    };
  }

  extractCharacterBlocks() {
    // 캐릭터블록 데이터 추출
    return this.data.visual_blocks.characters.map(char => ({
      id: char.id,
      name: char.name,
      fields: char.blocks
    }));
  }

  // 다른 블록들도 동일하게 구현
}
```

#### 5.2 데이터 바인딩
```javascript
class StoryboardDataBinder {
  bindToUI(parsedData) {
    // 기본블록 바인딩
    this.bindBasicBlock(parsedData.basic);

    // 연출블록 바인딩
    this.bindDirectionBlock(parsedData.direction);

    // 캐릭터블록 바인딩
    this.bindCharacterBlock(parsedData.characters);

    // 장소블록 바인딩
    this.bindLocationBlock(parsedData.locations);

    // 소품블록 바인딩
    this.bindPropsBlock(parsedData.props);
  }

  bindBasicBlock(data) {
    document.getElementById('basic-title').value = data.title;
    document.getElementById('basic-genre').value = data.genre;
    // ...
  }
}
```

### 6. 구현 단계

#### Phase 1: 기초 구현 (Week 1)
1. JSON 파일 업로드 UI 구현
2. JSON 파서 모듈 개발
3. 기본블록 매칭 구현

#### Phase 2: 블록 시스템 완성 (Week 2)
1. 5개 블록 전체 매칭 로직
2. UI 데이터 바인딩
3. 프롬프트 텍스트 자동 생성

#### Phase 3: 통합 및 최적화 (Week 3)
1. 스토리보드 메인 화면 통합
2. 에러 처리 및 유효성 검증
3. 사용자 피드백 및 개선

### 7. 검증 기준

#### 7.1 기능 검증
- [ ] JSON 파일 업로드 성공
- [ ] 모든 필드 정확한 매칭
- [ ] UI 자동 업데이트
- [ ] 프롬프트 생성 정확도

#### 7.2 성능 검증
- [ ] 파일 로드 시간 < 2초
- [ ] UI 업데이트 시간 < 1초
- [ ] 메모리 사용량 최적화

### 8. 리스크 및 대응방안

#### 8.1 데이터 불일치
- **리스크**: JSON 구조 변경 가능성
- **대응**: 버전 관리 및 스키마 검증

#### 8.2 대용량 파일
- **리스크**: 큰 JSON 파일 처리
- **대응**: 청크 단위 처리 및 프로그레시브 로딩

### 9. 향후 확장 계획

1. **Stage 2, 3 지원**: 추가 스테이지 JSON 포맷 지원
2. **실시간 동기화**: JSON 변경사항 실시간 반영
3. **Export 기능**: 편집된 데이터 JSON으로 내보내기
4. **템플릿 시스템**: 자주 사용하는 설정 저장/불러오기

---

## 부록: 필드 매핑 상세표

### A. 캐릭터 블록 25개 필드
1. 1_STYLE → 스타일
2. 2_ARTIST → 아티스트
3. 3_MEDIUM → 미디엄
4. 4_GENRE → 장르
5. 5_CHARACTER → 캐릭터명
6. 6_MOOD_PERSONALITY → 분위기/성격
7. 7_ERA → 시대
8. 8_CAMERA → 카메라 설정
9. 9_GAZE → 시선
10. 10_CHARACTER_SHEET → 캐릭터 시트
11. 11_BODY_TYPE → 체형
12. 12_HAIR → 헤어
13. 13_FACE_SHAPE → 얼굴형
14. 14_FACIAL_FEATURES → 얼굴 특징
15. 15_SKIN → 피부
16. 16_EXPRESSION → 표정
17. 17_CLOTHING → 의상
18. 18_ACCESSORIES → 액세서리
19. 19_PROPS → 소품
20. 20_POSE → 포즈
21. 21_BACKGROUND → 배경
22. 22_LIGHTING → 조명
23. 23_CAMERA_TECH → 카메라 기술
24. 24_QUALITY → 품질
25. 25_PARAMETER → 파라미터

### B. 장소 블록 28개 필드
[28개 필드 상세 목록...]

### C. 소품 블록 21개 필드
[21개 필드 상세 목록...]

---

이 PRD를 기반으로 단계별 구현을 진행합니다.