/**
 * ConceptArtManager - 컨셉아트 데이터 중앙 관리 시스템
 *
 * 주요 기능:
 * - Stage1 데이터와 사용자 추가 데이터 통합 관리
 * - 실시간 데이터 동기화 (BroadcastChannel)
 * - SessionStorage/LocalStorage 이중 백업
 * - 스토리보드 모달과 자동 동기화
 */

class ConceptArtManager {
    constructor() {
        this.dataKey = 'conceptArtData';
        this.backupKey = 'conceptArtData_backup';
        this.version = '1.0.0';

        // BroadcastChannel for real-time sync
        try {
            this.eventChannel = new BroadcastChannel('concept_art_updates');
            this.setupBroadcastListener();
        } catch (e) {
            console.warn('BroadcastChannel not supported, falling back to storage events');
            this.eventChannel = null;
        }

        this.initializeData();
    }

    /**
     * 데이터 초기화
     */
    initializeData() {
        // 기존 데이터 체크
        let data = this.getData();

        if (!data || !data.version) {
            console.log('📦 ConceptArt 데이터 초기화 중...');

            // Stage1 데이터 파싱
            const stage1Data = this.parseStage1Data();

            // 사용자 데이터 로드
            const userData = this.loadUserData();

            // 병합 및 저장
            data = this.mergeData(stage1Data, userData);
            this.saveData(data);

            console.log('✅ ConceptArt 데이터 초기화 완료');
        } else {
            console.log('📦 기존 ConceptArt 데이터 로드:', data);
        }

        return data;
    }

    /**
     * Stage1 데이터 파싱
     */
    parseStage1Data() {
        const data = {
            characters: [],
            locations: [],
            props: []
        };

        // Stage1 원본 데이터 가져오기
        const stage1Raw = sessionStorage.getItem('stage1OriginalData');
        if (!stage1Raw) {
            console.log('⚠️ Stage1 데이터가 없습니다.');
            return data;
        }

        try {
            const stage1 = JSON.parse(stage1Raw);

            // visual_blocks에서 캐릭터 추출
            if (stage1.visual_blocks?.characters) {
                stage1.visual_blocks.characters.forEach((char, index) => {
                    data.characters.push({
                        id: `stage1_char_${index}`,
                        name: char.name || `Character ${index + 1}`,
                        description: char.description || '',
                        appearance: char.appearance || '',
                        personality: char.personality || '',
                        image: char.generated_image || '',
                        source: 'stage1',
                        created_at: Date.now()
                    });
                });
            }

            // visual_blocks에서 장소 추출
            if (stage1.visual_blocks?.locations) {
                stage1.visual_blocks.locations.forEach((loc, index) => {
                    data.locations.push({
                        id: `stage1_loc_${index}`,
                        name: loc.name || `Location ${index + 1}`,
                        description: loc.description || '',
                        atmosphere: loc.atmosphere || '',
                        image: loc.generated_image || '',
                        source: 'stage1',
                        created_at: Date.now()
                    });
                });
            }

            // visual_blocks에서 소품 추출
            if (stage1.visual_blocks?.props) {
                stage1.visual_blocks.props.forEach((prop, index) => {
                    data.props.push({
                        id: `stage1_prop_${index}`,
                        name: prop.name || `Prop ${index + 1}`,
                        description: prop.description || '',
                        function: prop.function || '',
                        image: prop.generated_image || '',
                        source: 'stage1',
                        created_at: Date.now()
                    });
                });
            }

            console.log('✅ Stage1 데이터 파싱 완료:', data);
        } catch (error) {
            console.error('❌ Stage1 파싱 오류:', error);
        }

        return data;
    }

    /**
     * 사용자 추가 데이터 로드
     */
    loadUserData() {
        const data = {
            characters: [],
            locations: [],
            props: []
        };

        // 기존 localStorage에서 사용자 추가 데이터 확인
        const savedData = localStorage.getItem(this.backupKey);
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                // 사용자 추가 데이터만 필터링
                if (parsed.characters) {
                    data.characters = parsed.characters.filter(c => c.source === 'user_added');
                }
                if (parsed.locations) {
                    data.locations = parsed.locations.filter(l => l.source === 'user_added');
                }
                if (parsed.props) {
                    data.props = parsed.props.filter(p => p.source === 'user_added');
                }
            } catch (error) {
                console.error('❌ 사용자 데이터 로드 오류:', error);
            }
        }

        return data;
    }

    /**
     * 데이터 병합
     */
    mergeData(stage1Data, userData) {
        return {
            version: this.version,
            characters: [...stage1Data.characters, ...userData.characters],
            locations: [...stage1Data.locations, ...userData.locations],
            props: [...stage1Data.props, ...userData.props],
            lastUpdated: Date.now()
        };
    }

    /**
     * 데이터 가져오기
     */
    getData() {
        // SessionStorage 우선
        let data = sessionStorage.getItem(this.dataKey);
        if (data) {
            try {
                return JSON.parse(data);
            } catch (e) {
                console.error('SessionStorage 파싱 오류:', e);
            }
        }

        // LocalStorage 폴백
        data = localStorage.getItem(this.backupKey);
        if (data) {
            try {
                const parsed = JSON.parse(data);
                // SessionStorage 복원
                sessionStorage.setItem(this.dataKey, data);
                return parsed;
            } catch (e) {
                console.error('LocalStorage 파싱 오류:', e);
            }
        }

        return null;
    }

    /**
     * 데이터 저장
     */
    saveData(data) {
        const jsonData = JSON.stringify(data);

        // SessionStorage 저장
        sessionStorage.setItem(this.dataKey, jsonData);

        // LocalStorage 백업
        localStorage.setItem(this.backupKey, jsonData);

        console.log('💾 ConceptArt 데이터 저장 완료');
    }

    /**
     * 캐릭터 추가
     */
    addCharacter(character) {
        const data = this.getData() || this.initializeData();

        const newCharacter = {
            ...character,
            id: this.generateId('char'),
            source: 'user_added',
            created_at: Date.now()
        };

        data.characters.push(newCharacter);
        data.lastUpdated = Date.now();

        this.saveData(data);
        this.broadcast({
            action: 'add',
            type: 'character',
            item: newCharacter
        });

        console.log('✅ 캐릭터 추가:', newCharacter.name);
        return newCharacter;
    }

    /**
     * 장소 추가
     */
    addLocation(location) {
        const data = this.getData() || this.initializeData();

        const newLocation = {
            ...location,
            id: this.generateId('loc'),
            source: 'user_added',
            created_at: Date.now()
        };

        data.locations.push(newLocation);
        data.lastUpdated = Date.now();

        this.saveData(data);
        this.broadcast({
            action: 'add',
            type: 'location',
            item: newLocation
        });

        console.log('✅ 장소 추가:', newLocation.name);
        return newLocation;
    }

    /**
     * 소품 추가
     */
    addProp(prop) {
        const data = this.getData() || this.initializeData();

        const newProp = {
            ...prop,
            id: this.generateId('prop'),
            source: 'user_added',
            created_at: Date.now()
        };

        data.props.push(newProp);
        data.lastUpdated = Date.now();

        this.saveData(data);
        this.broadcast({
            action: 'add',
            type: 'prop',
            item: newProp
        });

        console.log('✅ 소품 추가:', newProp.name);
        return newProp;
    }

    /**
     * 특정 타입의 모든 데이터 가져오기
     */
    getCharacters() {
        const data = this.getData();
        return data?.characters || [];
    }

    getLocations() {
        const data = this.getData();
        return data?.locations || [];
    }

    getProps() {
        const data = this.getData();
        return data?.props || [];
    }

    /**
     * ID 생성
     */
    generateId(prefix) {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 브로드캐스트 메시지 전송
     */
    broadcast(message) {
        // BroadcastChannel 사용
        if (this.eventChannel) {
            this.eventChannel.postMessage(message);
        }

        // Storage 이벤트 트리거 (다른 탭/창)
        const event = new CustomEvent('conceptArtUpdate', { detail: message });
        window.dispatchEvent(event);
    }

    /**
     * 브로드캐스트 리스너 설정
     */
    setupBroadcastListener() {
        if (this.eventChannel) {
            this.eventChannel.onmessage = (event) => {
                console.log('📨 ConceptArt 브로드캐스트 수신:', event.data);

                // 외부에서 동기화 요청이 오면 데이터 전송
                if (event.data.type === 'sync_request') {
                    this.broadcast({
                        type: 'sync_response',
                        data: this.getData()
                    });
                }
            };
        }
    }

    /**
     * 전체 데이터 동기화
     */
    syncAll() {
        const data = this.getData();
        this.broadcast({
            type: 'full_sync',
            data: data
        });
        console.log('🔄 전체 데이터 동기화 완료');
    }

    /**
     * 데이터 초기화
     */
    clearAllData() {
        sessionStorage.removeItem(this.dataKey);
        localStorage.removeItem(this.backupKey);
        console.log('🗑️ 모든 ConceptArt 데이터 삭제됨');
        this.initializeData();
    }

    /**
     * Stage1 데이터 재파싱
     */
    refreshFromStage1() {
        console.log('🔄 Stage1 데이터 재파싱 중...');
        const stage1Data = this.parseStage1Data();
        const userData = this.loadUserData();
        const mergedData = this.mergeData(stage1Data, userData);
        this.saveData(mergedData);
        this.syncAll();
        console.log('✅ Stage1 데이터 재파싱 완료');
    }

    /**
     * 컨셉아트 페이지에서 직접 동기화
     */
    syncFromConceptArtPage(newData) {
        console.log('📦 컨셉아트 페이지에서 직접 동기화 중...');

        if (!newData) {
            console.error('동기화할 데이터가 없습니다');
            return;
        }

        // 새 데이터로 완전히 교체
        this.saveData(newData);

        // 브로드캐스트
        this.broadcast({
            type: 'full_sync',
            data: newData,
            source: 'conceptart_page'
        });

        console.log('✅ 컨셉아트 페이지 동기화 완료:', {
            characters: newData.characters?.length || 0,
            locations: newData.locations?.length || 0,
            props: newData.props?.length || 0
        });

        return newData;
    }

    /**
     * 데이터 병합 (중복 제거)
     */
    mergeWithExisting(newData) {
        const currentData = this.getData() || {
            version: this.version,
            characters: [],
            locations: [],
            props: [],
            lastUpdated: Date.now()
        };

        // 중복 제거하며 병합
        const mergedData = {
            version: this.version,
            characters: this.removeDuplicates([...currentData.characters, ...newData.characters]),
            locations: this.removeDuplicates([...currentData.locations, ...newData.locations]),
            props: this.removeDuplicates([...currentData.props, ...newData.props]),
            lastUpdated: Date.now()
        };

        this.saveData(mergedData);
        return mergedData;
    }

    /**
     * 중복 제거 헬퍼
     */
    removeDuplicates(items) {
        const seen = new Map();
        items.forEach(item => {
            // name과 source를 키로 사용
            const key = `${item.name}_${item.source}`;
            if (!seen.has(key)) {
                seen.set(key, item);
            }
        });
        return Array.from(seen.values());
    }
}

// 전역 인스턴스 생성
window.conceptArtManager = new ConceptArtManager();
console.log('🎨 ConceptArtManager 초기화 완료');