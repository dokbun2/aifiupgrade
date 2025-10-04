/**
 * ShotDetailDataSync - 스토리보드 모달 데이터 동기화 시스템
 *
 * 주요 기능:
 * - ConceptArtManager와 실시간 동기화
 * - 드롭다운 셀렉터 자동 업데이트
 * - BroadcastChannel 통신
 * - Storage 이벤트 감지
 */

class ShotDetailDataSync {
    constructor() {
        this.initialized = false;
        this.selectors = {
            character: null,
            location: null,
            prop: null
        };

        // BroadcastChannel 설정
        try {
            this.eventChannel = new BroadcastChannel('concept_art_updates');
            this.setupBroadcastListener();
        } catch (e) {
            console.warn('BroadcastChannel not supported');
            this.eventChannel = null;
        }

        // Custom event 리스너
        this.setupEventListeners();

        // 초기 데이터 로드
        this.loadInitialData();
    }

    /**
     * 브로드캐스트 리스너 설정
     */
    setupBroadcastListener() {
        if (this.eventChannel) {
            this.eventChannel.onmessage = (event) => {
                console.log('📨 Shot Detail 브로드캐스트 수신:', event.data);

                const { action, type, item, data, source } = event.data;

                // 컨셉아트 페이지에서 온 동기화 메시지 우선 처리
                if (source === 'conceptart_page') {
                    console.log('🎨 컨셉아트 페이지에서 동기화 요청');
                    this.handleConceptArtSync(data);
                    return;
                }

                switch (action) {
                    case 'add':
                        this.handleItemAdded(type, item);
                        break;
                    case 'update':
                        this.handleItemUpdated(type, item);
                        break;
                    case 'delete':
                        this.handleItemDeleted(type, item);
                        break;
                    case 'sync':
                        this.handleFullSync(data);
                        break;
                }

                // 전체 동기화
                if (event.data.type === 'full_sync' || event.data.type === 'sync_response') {
                    this.refreshAllSelectors(data);
                    this.showNotification('📦 데이터가 동기화되었습니다');
                }
            };
        }
    }

    /**
     * 컨셉아트 페이지 동기화 처리
     */
    handleConceptArtSync(data) {
        console.log('🔄 컨셉아트 페이지 데이터 동기화 처리중...');

        if (!data) {
            console.warn('동기화할 데이터가 없습니다');
            return;
        }

        // 모든 셀렉터 즉시 업데이트
        this.refreshAllSelectors(data);

        // 성공 알림
        this.showNotification('✅ 컨셉아트 페이지에서 데이터가 저장되었습니다', 'success');

        // 새로 추가된 항목 하이라이트
        this.highlightNewItems(data);
    }

    /**
     * 전체 동기화 처리
     */
    handleFullSync(data) {
        console.log('🔄 전체 데이터 동기화 중...');
        this.refreshAllSelectors(data);
        this.showNotification('✅ 모든 데이터가 동기화되었습니다', 'success');
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // Custom event 리스너
        window.addEventListener('conceptArtUpdate', (event) => {
            console.log('🔄 ConceptArt 업데이트 이벤트:', event.detail);
            const { action, type, item } = event.detail;

            if (action === 'add') {
                this.handleItemAdded(type, item);
            }
        });

        // Storage 변경 감지
        window.addEventListener('storage', (e) => {
            if (e.key === 'conceptArtData' || e.key === 'conceptArtData_backup') {
                console.log('💾 Storage 변경 감지:', e.key);
                this.loadInitialData();
            }
        });
    }

    /**
     * 초기 데이터 로드
     */
    loadInitialData() {
        console.log('📦 Shot Detail 초기 데이터 로드 중...');

        // ConceptArtManager 데이터 가져오기
        const conceptArtData = this.getConceptArtData();

        if (conceptArtData) {
            this.refreshAllSelectors(conceptArtData);
        } else {
            // ConceptArtManager가 없으면 Stage1 데이터 직접 로드
            this.loadFromStage1();
        }

        this.initialized = true;
    }

    /**
     * ConceptArt 데이터 가져오기
     */
    getConceptArtData() {
        // SessionStorage 우선
        let data = sessionStorage.getItem('conceptArtData');
        if (data) {
            try {
                return JSON.parse(data);
            } catch (e) {
                console.error('ConceptArt 데이터 파싱 오류:', e);
            }
        }

        // LocalStorage 폴백
        data = localStorage.getItem('conceptArtData_backup');
        if (data) {
            try {
                return JSON.parse(data);
            } catch (e) {
                console.error('ConceptArt 백업 데이터 파싱 오류:', e);
            }
        }

        return null;
    }

    /**
     * Stage1 데이터에서 직접 로드 (폴백)
     */
    loadFromStage1() {
        console.log('⚠️ ConceptArt 데이터 없음, Stage1에서 직접 로드');

        const stage1Data = sessionStorage.getItem('stage1ParsedData');
        if (stage1Data) {
            try {
                const parsed = JSON.parse(stage1Data);
                this.updateCharacterSelector(parsed.characters || []);
                this.updateLocationSelector(parsed.locations || []);
                this.updatePropSelector(parsed.props || []);
            } catch (e) {
                console.error('Stage1 데이터 파싱 오류:', e);
            }
        }
    }

    /**
     * 모든 셀렉터 새로고침
     */
    refreshAllSelectors(data) {
        if (!data) return;

        console.log('🔄 모든 셀렉터 새로고침');

        if (data.characters) {
            this.updateCharacterSelector(data.characters);
        }
        if (data.locations) {
            this.updateLocationSelector(data.locations);
        }
        if (data.props) {
            this.updatePropSelector(data.props);
        }
    }

    /**
     * 아이템 추가 처리
     */
    handleItemAdded(type, item) {
        console.log(`➕ ${type} 추가:`, item);

        switch (type) {
            case 'character':
                this.addCharacterOption(item);
                break;
            case 'location':
                this.addLocationOption(item);
                break;
            case 'prop':
                this.addPropOption(item);
                break;
        }

        // 사용자에게 알림
        this.showNotification(`새로운 ${this.getTypeKorean(type)}이(가) 추가되었습니다: ${item.name}`);
    }

    /**
     * 아이템 업데이트 처리
     */
    handleItemUpdated(type, item) {
        console.log(`📝 ${type} 업데이트:`, item);
        // 필요시 구현
    }

    /**
     * 아이템 삭제 처리
     */
    handleItemDeleted(type, item) {
        console.log(`🗑️ ${type} 삭제:`, item);
        // 필요시 구현
    }

    /**
     * 캐릭터 셀렉터 업데이트
     */
    updateCharacterSelector(characters) {
        const selector = this.findCharacterSelector();
        if (!selector) return;

        // 기존 옵션 제거 (첫 번째 옵션 유지)
        while (selector.options.length > 1) {
            selector.remove(1);
        }

        // 새 옵션 추가
        characters.forEach(char => {
            const option = document.createElement('option');
            option.value = char.id || char.name;
            option.textContent = char.name;
            option.dataset.description = char.description || '';
            selector.appendChild(option);
        });

        console.log(`✅ 캐릭터 셀렉터 업데이트: ${characters.length}개`);
    }

    /**
     * 장소 셀렉터 업데이트
     */
    updateLocationSelector(locations) {
        const selector = this.findLocationSelector();
        if (!selector) return;

        // 기존 옵션 제거 (첫 번째 옵션 유지)
        while (selector.options.length > 1) {
            selector.remove(1);
        }

        // 새 옵션 추가
        locations.forEach(loc => {
            const option = document.createElement('option');
            option.value = loc.id || loc.name;
            option.textContent = loc.name;
            option.dataset.description = loc.description || '';
            selector.appendChild(option);
        });

        console.log(`✅ 장소 셀렉터 업데이트: ${locations.length}개`);
    }

    /**
     * 소품 셀렉터 업데이트
     */
    updatePropSelector(props) {
        const selector = this.findPropSelector();
        if (!selector) return;

        // 기존 옵션 제거 (첫 번째 옵션 유지)
        while (selector.options.length > 1) {
            selector.remove(1);
        }

        // 새 옵션 추가
        props.forEach(prop => {
            const option = document.createElement('option');
            option.value = prop.id || prop.name;
            option.textContent = prop.name;
            option.dataset.description = prop.description || '';
            selector.appendChild(option);
        });

        console.log(`✅ 소품 셀렉터 업데이트: ${props.length}개`);
    }

    /**
     * 개별 옵션 추가
     */
    addCharacterOption(character) {
        const selector = this.findCharacterSelector();
        if (!selector) return;

        // 중복 체크
        const existing = Array.from(selector.options).find(opt =>
            opt.value === (character.id || character.name)
        );
        if (existing) return;

        const option = document.createElement('option');
        option.value = character.id || character.name;
        option.textContent = character.name;
        option.dataset.description = character.description || '';
        selector.appendChild(option);

        // 시각적 피드백
        this.highlightSelector(selector);
    }

    addLocationOption(location) {
        const selector = this.findLocationSelector();
        if (!selector) return;

        // 중복 체크
        const existing = Array.from(selector.options).find(opt =>
            opt.value === (location.id || location.name)
        );
        if (existing) return;

        const option = document.createElement('option');
        option.value = location.id || location.name;
        option.textContent = location.name;
        option.dataset.description = location.description || '';
        selector.appendChild(option);

        // 시각적 피드백
        this.highlightSelector(selector);
    }

    addPropOption(prop) {
        const selector = this.findPropSelector();
        if (!selector) return;

        // 중복 체크
        const existing = Array.from(selector.options).find(opt =>
            opt.value === (prop.id || prop.name)
        );
        if (existing) return;

        const option = document.createElement('option');
        option.value = prop.id || prop.name;
        option.textContent = prop.name;
        option.dataset.description = prop.description || '';
        selector.appendChild(option);

        // 시각적 피드백
        this.highlightSelector(selector);
    }

    /**
     * 셀렉터 찾기
     */
    findCharacterSelector() {
        // 여러 가능한 셀렉터 찾기
        const selectors = [
            '#characterSelector',  // 실제 ID
            '#characterSelect',
            '#character-selector',
            '[data-type="character"]',
            '.character-selector',
            '.character-select',
            'select[name="character"]'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                this.selectors.character = element;
                return element;
            }
        }

        console.warn('⚠️ 캐릭터 셀렉터를 찾을 수 없습니다');
        return null;
    }

    findLocationSelector() {
        const selectors = [
            '#locationSelector',  // 실제 ID
            '#locationSelect',
            '#location-selector',
            '[data-type="location"]',
            '.location-selector',
            '.location-select',
            'select[name="location"]'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                this.selectors.location = element;
                return element;
            }
        }

        console.warn('⚠️ 장소 셀렉터를 찾을 수 없습니다');
        return null;
    }

    findPropSelector() {
        const selectors = [
            '#propsSelector',  // 실제 ID
            '#propSelect',
            '#prop-selector',
            '[data-type="prop"]',
            '.props-selector',
            '.prop-select',
            'select[name="prop"]'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                this.selectors.prop = element;
                return element;
            }
        }

        console.warn('⚠️ 소품 셀렉터를 찾을 수 없습니다');
        return null;
    }

    /**
     * 셀렉터 하이라이트
     */
    highlightSelector(selector) {
        if (!selector) return;

        selector.style.transition = 'all 0.3s ease';
        selector.style.boxShadow = '0 0 10px rgba(76, 175, 80, 0.8)';
        selector.style.border = '2px solid #4CAF50';

        setTimeout(() => {
            selector.style.boxShadow = '';
            selector.style.border = '';
        }, 2000);
    }

    /**
     * 알림 표시
     */
    showNotification(message, type = 'info') {
        // 기존 알림 제거
        const existing = document.querySelector('.sync-notification');
        if (existing) {
            existing.remove();
        }

        const notification = document.createElement('div');
        notification.className = 'sync-notification';
        notification.textContent = message;

        // 타입별 배경색 설정
        const bgColor = type === 'success' ? '#4CAF50' :
                       type === 'error' ? '#f44336' :
                       'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            font-size: 14px;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    /**
     * 새로 추가된 항목 하이라이트
     */
    highlightNewItems(data) {
        // 최근 5초 이내에 추가된 항목 찾기
        const fiveSecondsAgo = Date.now() - 5000;

        // 새 캐릭터 하이라이트
        if (data.characters) {
            data.characters.forEach(char => {
                if (char.created_at && char.created_at > fiveSecondsAgo) {
                    this.highlightOptionByValue(this.selectors.character, char.id || char.name);
                }
            });
        }

        // 새 장소 하이라이트
        if (data.locations) {
            data.locations.forEach(loc => {
                if (loc.created_at && loc.created_at > fiveSecondsAgo) {
                    this.highlightOptionByValue(this.selectors.location, loc.id || loc.name);
                }
            });
        }

        // 새 소품 하이라이트
        if (data.props) {
            data.props.forEach(prop => {
                if (prop.created_at && prop.created_at > fiveSecondsAgo) {
                    this.highlightOptionByValue(this.selectors.prop, prop.id || prop.name);
                }
            });
        }
    }

    /**
     * 특정 옵션 하이라이트
     */
    highlightOptionByValue(selector, value) {
        if (!selector || !value) return;

        const options = Array.from(selector.options);
        const option = options.find(opt => opt.value === value);

        if (option) {
            // 옵션에 하이라이트 스타일 추가
            const originalBg = option.style.background;
            option.style.background = '#4CAF50';
            option.style.color = 'white';
            option.style.fontWeight = 'bold';

            // 3초 후 원래대로
            setTimeout(() => {
                option.style.background = originalBg;
                option.style.color = '';
                option.style.fontWeight = '';
            }, 3000);
        }
    }

    /**
     * 타입 한글 변환
     */
    getTypeKorean(type) {
        const types = {
            'character': '캐릭터',
            'location': '장소',
            'prop': '소품'
        };
        return types[type] || type;
    }

    /**
     * 데이터 동기화 요청
     */
    requestSync() {
        if (this.eventChannel) {
            this.eventChannel.postMessage({
                type: 'sync_request',
                from: 'shot-detail'
            });
        }
    }

    /**
     * 현재 데이터 가져오기
     */
    getCurrentData() {
        return {
            characters: this.getCharacters(),
            locations: this.getLocations(),
            props: this.getProps()
        };
    }

    getCharacters() {
        const data = this.getConceptArtData();
        return data?.characters || [];
    }

    getLocations() {
        const data = this.getConceptArtData();
        return data?.locations || [];
    }

    getProps() {
        const data = this.getConceptArtData();
        return data?.props || [];
    }
}

// CSS 추가
const style = document.createElement('style');
style.textContent = `
@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}
@keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
}
.sync-notification {
    animation: slideIn 0.3s ease;
}
`;
document.head.appendChild(style);

// 전역 인스턴스 생성 (페이지 로드 시)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.shotDetailSync = new ShotDetailDataSync();
        console.log('🎯 ShotDetailDataSync 초기화 완료');
    });
} else {
    window.shotDetailSync = new ShotDetailDataSync();
    console.log('🎯 ShotDetailDataSync 초기화 완료');
}