# 동기화 시스템 테스트 가이드

## 🎯 테스트 목적
컨셉아트 페이지와 스토리보드 모달 간의 데이터 동기화가 제대로 작동하는지 확인

## 📋 테스트 절차

### 1. 기본 테스트 (test-sync.html)
```bash
# 서버 시작
python3 -m http.server 8000

# 브라우저에서 접속
http://localhost:8000/test-sync.html
```

**테스트 항목:**
1. 왼쪽 패널에서 캐릭터/장소/소품 추가
2. 오른쪽 패널의 셀렉터가 자동 업데이트되는지 확인
3. "동기화 요청" 버튼으로 수동 동기화 테스트

### 2. 실제 페이지 테스트

#### A. 컨셉아트 → 스토리보드 동기화
1. **컨셉아트 페이지 열기**: `http://localhost:8000/conceptart/`
2. **캐릭터 추가**:
   - 이름: "테스트 캐릭터"
   - 설명: "동기화 테스트용"
3. **스토리보드 모달 열기**: `http://localhost:8000/shot-detail.html`
4. **확인사항**:
   - 캐릭터 선택 드롭다운에 "테스트 캐릭터" 표시
   - 알림 메시지 확인

#### B. 멀티탭 동기화
1. **두 개의 탭에서 컨셉아트 페이지 열기**
2. **첫 번째 탭에서 데이터 추가**
3. **두 번째 탭에서 자동 반영 확인**

#### C. 스토리보드 모달 실시간 업데이트
1. **shot-detail.html 열기**
2. **다른 탭에서 컨셉아트 페이지 열기**
3. **컨셉아트에서 항목 추가**
4. **모달의 드롭다운 즉시 업데이트 확인**

## 🔍 확인 포인트

### 콘솔 로그 확인
```javascript
// 성공 시 표시되는 로그
🎨 ConceptArtManager 초기화 완료
🎯 ShotDetailDataSync 초기화 완료
📨 Shot Detail 브로드캐스트 수신
✅ 캐릭터 셀렉터 업데이트: N개
```

### 데이터 저장 확인
```javascript
// 개발자 도구 > Application > Storage
// SessionStorage 확인
conceptArtData: {...}  // 현재 세션 데이터

// LocalStorage 확인
conceptArtData_backup: {...}  // 영구 백업 데이터
```

## 🐛 문제 해결

### 1. 동기화가 안 되는 경우
- BroadcastChannel 지원 확인 (Chrome, Firefox, Edge)
- 콘솔 에러 확인
- Storage 권한 확인

### 2. 드롭다운이 업데이트되지 않는 경우
- 셀렉터 ID 확인 (#characterSelector, #locationSelector, #propsSelector)
- DOM 로드 타이밍 확인

### 3. 데이터 손실
- LocalStorage 백업 확인
- conceptArtManager.refreshFromStage1() 실행으로 복구

## ✅ 예상 결과

1. **즉시 동기화**: 데이터 추가 시 1초 이내 반영
2. **영구 저장**: 페이지 새로고침 후에도 데이터 유지
3. **멀티탭 지원**: 여러 탭/창에서 실시간 동기화
4. **시각적 피드백**: 업데이트 시 하이라이트 효과
5. **알림 표시**: 동기화 성공 메시지

## 📊 성능 지표

- 동기화 지연: < 100ms
- 메모리 사용: < 5MB
- CPU 사용률: < 5%
- 지원 브라우저: Chrome 89+, Firefox 88+, Edge 89+

## 🔧 디버깅 명령어

```javascript
// 콘솔에서 실행
// 현재 데이터 확인
window.conceptArtManager.getData()

// 수동 동기화
window.conceptArtManager.syncAll()

// 데이터 재파싱
window.conceptArtManager.refreshFromStage1()

// 셀렉터 상태 확인
window.shotDetailSync.getCurrentData()
```