# 🧪 컨셉아트 Persistence 수정 테스트 가이드

## 준비사항
1. 로컬 서버가 실행 중인지 확인:
   ```bash
   python3 -m http.server 8000
   ```

2. 브라우저에서 다음 중 하나를 실행:
   - Chrome 개발자 도구 열기: `Cmd+Option+I` (Mac) / `F12` (Windows)
   - Console 탭 열어두기

---

## 테스트 시나리오 1: 기본 Persistence 테스트

### Step 1: 테스트 페이지 접속
```
http://localhost:8000/test-persistence.html
```

### Step 2: 테스트 데이터 저장
1. "테스트 데이터 저장" 버튼 클릭
2. 화면에 표시되는 내용 확인:
   ```
   ✅ 테스트 데이터 저장 완료!
   저장된 데이터 크기: XXX bytes
   ```

### Step 3: 저장소 상태 확인
1. "저장소 확인" 버튼 클릭
2. 다음 항목 확인:
   ```
   ✅ sessionStorage: 있음 (XXX bytes)
     - 캐릭터: 1개
     - 장소: 1개
     - 소품: 1개
     - 프롬프트: 1개
   
   ✅ localStorage: 있음 (XXX bytes)
     - 캐릭터: 1개
     - 장소: 1개
     - 소품: 1개
     - 프롬프트: 1개
   ```

### Step 4: 새로고침 테스트 ⭐
1. "새로고침 테스트" 버튼 클릭 (페이지 새로고침됨)
2. 새로고침 후 자동으로 저장소 상태가 표시됨
3. **데이터가 여전히 유지되는지 확인** ✅

### Step 5: 초기화
1. "모든 저장소 초기화" 버튼 클릭
2. 확인 대화상자에서 "확인" 클릭
3. 저장소가 비워졌는지 확인

---

## 테스트 시나리오 2: 실제 컨셉아트 페이지 테스트

### Step 1: 컨셉아트 페이지 접속
```
http://localhost:8000/conceptart/index.html
```

### Step 2: 새 섹션 추가
1. "구분 선택" 드롭다운에서 "캐릭터" 선택
2. "추가" 버튼 클릭
3. 새 캐릭터 섹션 생성 확인

### Step 3: 프롬프트 입력
1. "BASIC PROMPT" 영역에서 "수정" 버튼 클릭
2. 프롬프트 입력:
   ```
   테스트 캐릭터
   20대 남성, 검은 머리
   파란색 옷을 입고 있음
   ```
3. "저장" 버튼 클릭

### Step 4: 이미지 추가
1. 이미지 URL 입력란에 테스트 URL 입력:
   ```
   https://via.placeholder.com/300x400?text=Test+Character
   ```
2. "이미지 추가" 버튼 클릭
3. 이미지 갤러리에 이미지가 표시되는지 확인

### Step 5: 새로고침 테스트 ⭐⭐⭐
1. 브라우저 새로고침 (`Cmd+R` 또는 `F5`)
2. 다음 항목이 유지되는지 확인:
   - ✅ 추가한 캐릭터 섹션
   - ✅ 입력한 프롬프트 내용
   - ✅ 추가한 이미지
   - ✅ 드롭다운 선택 상태

### Step 6: Console 로그 확인
브라우저 개발자 도구 Console에서 다음 로그 확인:
```
📦 localStorage → sessionStorage 복원 완료
✅ saveData - sessionStorage 저장 완료
✅ saveData - localStorage 저장 완료
💾 saveData - 이중 저장 완료 (sessionStorage + localStorage)
```

---

## 테스트 시나리오 3: 탭 간 데이터 동기화 테스트

### Step 1: 첫 번째 탭
1. http://localhost:8000/conceptart/index.html 접속
2. 캐릭터 추가 및 프롬프트 입력
3. 데이터 저장 확인

### Step 2: 두 번째 탭
1. 새 탭에서 http://localhost:8000/conceptart/index.html 접속
2. localStorage에서 데이터가 자동으로 로드되는지 확인
3. sessionStorage로 복원되는지 Console 확인

---

## 예상 결과

### ✅ 성공 케이스
- 새로고침 시 모든 데이터 유지
- sessionStorage + localStorage 이중 저장 확인
- 브라우저 닫고 다시 열어도 localStorage 데이터 복원
- Console에 저장/로드 로그 표시

### ❌ 실패 케이스 (수정 전 동작)
- 새로고침 시 데이터 손실
- localStorage만 저장
- sessionStorage 미사용
- 복원 메커니즘 없음

---

## 디버깅 팁

### Console에서 직접 확인
```javascript
// sessionStorage 확인
console.log('sessionStorage:', sessionStorage.getItem('conceptArtData'));

// localStorage 확인
console.log('localStorage:', localStorage.getItem('conceptArtData'));

// 파싱된 데이터 확인
const data = JSON.parse(sessionStorage.getItem('conceptArtData'));
console.log('Parsed data:', data);
```

### 수동 데이터 삭제
```javascript
// sessionStorage만 삭제
sessionStorage.removeItem('conceptArtData');

// localStorage만 삭제
localStorage.removeItem('conceptArtData');

// 모두 삭제
sessionStorage.clear();
localStorage.clear();
```

---

## 테스트 체크리스트

- [ ] 테스트 페이지에서 데이터 저장/로드 확인
- [ ] 새로고침 후 데이터 유지 확인
- [ ] 컨셉아트 페이지에서 캐릭터/장소/소품 추가
- [ ] 프롬프트 입력 및 저장
- [ ] 이미지 추가 및 갤러리 표시
- [ ] 새로고침 후 모든 데이터 유지 확인
- [ ] Console 로그에서 저장/로드 메시지 확인
- [ ] 브라우저 닫고 다시 열어서 데이터 복원 확인

---

## 문제 발생 시

1. **데이터가 여전히 사라지는 경우**:
   - 브라우저 캐시 삭제 후 재시도
   - 하드 리프레시: `Cmd+Shift+R` (Mac) / `Ctrl+Shift+R` (Windows)

2. **Console 오류 발생 시**:
   - 오류 메시지 복사
   - `/Users/sohee/Downloads/run/dev/aifiupgrade/js/conceptart.js.backup` 파일로 롤백

3. **서버 문제 시**:
   ```bash
   # 서버 재시작
   killall python3
   python3 -m http.server 8000
   ```

---

## 성공 확인

다음 조건이 모두 충족되면 수정 완료:

✅ 테스트 페이지에서 새로고침 후 데이터 유지
✅ 컨셉아트 페이지에서 새로고침 후 프롬프트/이미지 유지
✅ Console에 "이중 저장 완료" 메시지 표시
✅ sessionStorage와 localStorage 모두 데이터 존재
