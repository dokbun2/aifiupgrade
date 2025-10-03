/**
 * Stage 2 JSON Parser for Shot Detail Mapping
 * Stage2 JSON의 shots 데이터를 파싱하여 연출 블록에 scene 필드 매핑
 */

class Stage2JSONParser {
    constructor() {
        this.data = null;
        this.shotsMap = new Map(); // shot_id -> shot data 매핑
        this.scenesMap = new Map(); // scene_id -> scene data 매핑

        // 병합 기능을 위한 추가 속성
        this.mergedData = {
            film_id: null,
            scenes: []
        };
        this.fileHistory = []; // 업로드된 파일 기록
        this.duplicateHandling = 'skip'; // 중복 처리 방식: skip, replace, merge
    }

    /**
     * Stage2 JSON 파일 로드 및 파싱
     */
    async loadJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    this.data = JSON.parse(e.target.result);
                    console.log('✅ Stage2 JSON 파일 로드 성공:', this.data.film_id);
                    this.parseData();
                    resolve(this.data);
                } catch (error) {
                    console.error('❌ Stage2 JSON 파싱 에러:', error);
                    reject(error);
                }
            };

            reader.onerror = (error) => {
                console.error('❌ 파일 읽기 에러:', error);
                reject(error);
            };

            reader.readAsText(file);
        });
    }

    /**
     * Stage2 데이터 파싱 및 맵 생성
     */
    parseData() {
        if (!this.data?.scenes) {
            console.warn('⚠️ Stage2 JSON에 scenes 데이터가 없습니다.');
            return;
        }

        // scenes와 shots 데이터를 맵으로 정리
        this.data.scenes.forEach(scene => {
            this.scenesMap.set(scene.scene_id, scene);

            if (scene.shots) {
                scene.shots.forEach(shot => {
                    this.shotsMap.set(shot.shot_id, {
                        ...shot,
                        scene_id: scene.scene_id,
                        scene_title: scene.scene_title
                    });
                });
            }
        });

        console.log(`📋 Stage2 파싱 완료: ${this.scenesMap.size}개 시퀀스, ${this.shotsMap.size}개 샷`);
    }

    /**
     * 샷 ID로 scene 필드 값 조회
     */
    getSceneByshotId(shotId) {
        const shot = this.shotsMap.get(shotId);
        if (!shot) {
            console.warn(`⚠️ 샷 ID '${shotId}'를 찾을 수 없습니다.`);
            return null;
        }

        return {
            scene: shot.scene || '',
            shot_text: shot.shot_text || '',
            scene_id: shot.scene_id || '',
            scene_title: shot.scene_title || '',
            movement_description: shot.movement_description || {},
            camera_movement: shot.camera_movement || {},
            starting_frame: shot.starting_frame || {},
            ending_frame: shot.ending_frame || {}
        };
    }

    /**
     * 모든 샷 ID 목록 반환
     */
    getAllShotIds() {
        return Array.from(this.shotsMap.keys());
    }

    /**
     * 시퀀스별 샷 목록 반환
     */
    getShotsBySceneId(sceneId) {
        const scene = this.scenesMap.get(sceneId);
        if (!scene?.shots) {
            return [];
        }
        return scene.shots.map(shot => shot.shot_id);
    }

    /**
     * 샷 ID 형식 검증 (S01.01.01 등)
     */
    validateShotId(shotId) {
        const pattern = /^S\d{2}\.\d{2}\.\d{2}$/;
        return pattern.test(shotId);
    }

    /**
     * 샷 ID에서 시퀀스 번호 추출 (S01.01.01 -> S01)
     */
    extractSceneIdFromShotId(shotId) {
        if (!this.validateShotId(shotId)) {
            return null;
        }
        return shotId.split('.')[0];
    }

    /**
     * 연출 블록에 장면 프롬프트 적용
     */
    applySceneToDirectionBlock(shotId) {
        const sceneData = this.getSceneByshotId(shotId);
        if (!sceneData) {
            return false;
        }

        // 연출 블록의 장면 프롬프트 입력 필드 찾기
        // 정확한 셀렉터: 연출 블록 탭(data-tab="scene") 내의 장면 필드(data-block="scene")
        const scenePromptInput = document.querySelector('.tab-pane[data-tab="scene"] .prompt-blocks .prompt-row-item[data-block="scene"] .prompt-input');
        if (scenePromptInput) {
            scenePromptInput.value = sceneData.scene;

            // 입력 이벤트 트리거 (UI 업데이트를 위해)
            scenePromptInput.dispatchEvent(new Event('input', { bubbles: true }));

            console.log(`✅ 연출 블록 장면 필드에 샷 ${shotId}의 Stage2 scene 데이터 적용:`, sceneData.scene);
            return true;
        } else {
            console.warn('⚠️ 연출 블록의 장면 프롬프트 입력 필드를 찾을 수 없습니다.');
            console.warn('   셀렉터: .tab-pane[data-tab="scene"] .prompt-blocks .prompt-row-item[data-block="scene"] .prompt-input');
            return false;
        }
    }

    /**
     * 현재 샷 ID에 해당하는 모든 정보 표시 (디버깅용)
     */
    displayShotInfo(shotId) {
        const sceneData = this.getSceneByshotId(shotId);
        if (!sceneData) {
            console.log(`❌ 샷 ID '${shotId}' 정보가 없습니다.`);
            return;
        }

        console.group(`🎬 샷 정보: ${shotId}`);
        console.log('📝 Scene:', sceneData.scene);
        console.log('📖 Shot Text:', sceneData.shot_text);
        console.log('🎭 Scene ID:', sceneData.scene_id);
        console.log('🎪 Scene Title:', sceneData.scene_title);
        console.log('🎮 Movement:', sceneData.movement_description);
        console.log('📷 Camera:', sceneData.camera_movement);
        console.groupEnd();
    }

    /**
     * 새로운 Stage2 JSON 파일을 기존 데이터와 병합
     */
    async mergeJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    const newData = JSON.parse(e.target.result);
                    console.log('🔄 Stage2 JSON 병합 시작:', file.name);

                    // 첫 파일이면 초기화
                    if (!this.data) {
                        this.data = {
                            film_id: newData.film_id,
                            current_step: newData.current_step,
                            timestamp: newData.timestamp,
                            scenes: []
                        };
                        this.mergedData = {
                            film_id: newData.film_id,
                            scenes: []
                        };
                    }

                    // film_id 확인
                    if (this.data.film_id && this.data.film_id !== newData.film_id) {
                        console.warn(`⚠️ 다른 프로젝트 파일: 기존(${this.data.film_id}) vs 새파일(${newData.film_id})`);
                    }

                    // scenes 병합
                    let newScenesCount = 0;
                    let newShotsCount = 0;
                    let duplicatesCount = 0;

                    newData.scenes.forEach(newScene => {
                        const existingSceneIndex = this.data.scenes.findIndex(s => s.scene_id === newScene.scene_id);

                        if (existingSceneIndex >= 0) {
                            // 기존 scene이 있으면 shots만 추가
                            const existingScene = this.data.scenes[existingSceneIndex];

                            newScene.shots.forEach(shot => {
                                const existingShotIndex = existingScene.shots.findIndex(s => s.shot_id === shot.shot_id);

                                if (existingShotIndex < 0) {
                                    // 새로운 shot 추가
                                    existingScene.shots.push(shot);
                                    this.shotsMap.set(shot.shot_id, {
                                        ...shot,
                                        scene_id: newScene.scene_id,
                                        scene_title: newScene.scene_title
                                    });
                                    newShotsCount++;
                                } else {
                                    // 중복 shot 처리 (기본: skip)
                                    if (this.duplicateHandling === 'replace') {
                                        existingScene.shots[existingShotIndex] = shot;
                                        this.shotsMap.set(shot.shot_id, {
                                            ...shot,
                                            scene_id: newScene.scene_id,
                                            scene_title: newScene.scene_title
                                        });
                                    }
                                    duplicatesCount++;
                                }
                            });
                        } else {
                            // 새로운 scene 전체 추가
                            this.data.scenes.push(newScene);
                            this.scenesMap.set(newScene.scene_id, newScene);
                            newScenesCount++;

                            newScene.shots.forEach(shot => {
                                this.shotsMap.set(shot.shot_id, {
                                    ...shot,
                                    scene_id: newScene.scene_id,
                                    scene_title: newScene.scene_title
                                });
                                newShotsCount++;
                            });
                        }
                    });

                    // 파일 기록 저장
                    this.fileHistory.push({
                        filename: file.name,
                        timestamp: Date.now(),
                        shotsAdded: newShotsCount,
                        duplicates: duplicatesCount,
                        totalShots: newData.scenes.reduce((acc, s) => acc + s.shots.length, 0)
                    });

                    // 병합 데이터 업데이트
                    this.updateMergedData();

                    console.log(`✅ Stage2 병합 완료:
                        - 파일: ${file.name}
                        - 새로운 샷: ${newShotsCount}개
                        - 중복 샷: ${duplicatesCount}개
                        - 전체 샷: ${this.shotsMap.size}개`);

                    resolve({
                        success: true,
                        newShots: newShotsCount,
                        duplicates: duplicatesCount,
                        totalShots: this.shotsMap.size
                    });

                } catch (error) {
                    console.error('❌ Stage2 병합 에러:', error);
                    reject(error);
                }
            };

            reader.onerror = (error) => {
                console.error('❌ 파일 읽기 에러:', error);
                reject(error);
            };

            reader.readAsText(file);
        });
    }

    /**
     * 중복 샷 처리
     */
    handleDuplicateShot(newShot, newScene) {
        const action = this.duplicateHandling || 'skip';

        switch(action) {
            case 'replace':
                // 새 데이터로 교체
                this.shotsMap.set(newShot.shot_id, {
                    ...newShot,
                    scene_id: newScene.scene_id,
                    scene_title: newScene.scene_title
                });
                console.log(`🔄 샷 교체: ${newShot.shot_id}`);
                break;

            case 'merge':
                // 필드별 병합 (빈 필드만 채우기)
                const existing = this.shotsMap.get(newShot.shot_id);
                Object.keys(newShot).forEach(key => {
                    if (!existing[key] && newShot[key]) {
                        existing[key] = newShot[key];
                    }
                });
                console.log(`🔀 샷 병합: ${newShot.shot_id}`);
                break;

            case 'skip':
            default:
                // 기존 데이터 유지
                console.log(`⏭️ 중복 샷 건너뛰기: ${newShot.shot_id}`);
                break;
        }
    }

    /**
     * 병합된 데이터 업데이트
     */
    updateMergedData() {
        // scenes 배열을 정렬하여 업데이트
        const sortedScenes = this.data.scenes.sort((a, b) => {
            // scene_id에서 숫자 추출 (S06 -> 6, S10 -> 10)
            const numA = parseInt(a.scene_id.replace(/^S/, ''));
            const numB = parseInt(b.scene_id.replace(/^S/, ''));
            return numA - numB;
        });

        // data 속성을 정렬된 데이터로 업데이트
        this.data.scenes = sortedScenes;

        // mergedData도 업데이트
        this.mergedData.scenes = sortedScenes;

        // scenesMap도 재구성
        this.scenesMap.clear();
        sortedScenes.forEach(scene => {
            this.scenesMap.set(scene.scene_id, scene);
        });
    }

    /**
     * 모든 데이터 초기화
     */
    clearAllData() {
        this.data = null;
        this.mergedData = {
            film_id: null,
            scenes: []
        };
        this.scenesMap.clear();
        this.shotsMap.clear();
        this.fileHistory = [];

        // 세션 및 로컬 스토리지 삭제
        sessionStorage.removeItem('stage2ParsedData');
        sessionStorage.removeItem('stage2MergedData');
        localStorage.removeItem('stage2ParsedData_backup');

        console.log('🗑️ 모든 Stage2 데이터가 초기화되었습니다.');
    }

    /**
     * 파일 업로드 기록 조회
     */
    getFileHistory() {
        return this.fileHistory;
    }

    /**
     * 중복 처리 방식 설정
     */
    setDuplicateHandling(mode) {
        if (['skip', 'replace', 'merge'].includes(mode)) {
            this.duplicateHandling = mode;
            console.log(`📋 중복 처리 방식 변경: ${mode}`);
        }
    }

    /**
     * 전체 데이터 구조 출력 (디버깅용)
     */
    debugPrintStructure() {
        console.group('🔍 Stage2 JSON 구조');
        console.log('Film ID:', this.data?.film_id);
        console.log('Current Step:', this.data?.current_step);
        console.log('Scenes Count:', this.scenesMap.size);
        console.log('Total Shots:', this.shotsMap.size);

        console.group('📋 시퀀스별 샷 수:');
        this.scenesMap.forEach((scene, sceneId) => {
            console.log(`${sceneId} (${scene.scene_title}): ${scene.shots?.length || 0}개 샷`);
        });
        console.groupEnd();

        console.group('🎯 모든 샷 ID:');
        this.getAllShotIds().forEach(shotId => {
            console.log(shotId);
        });
        console.groupEnd();

        console.groupEnd();
    }
}

// 전역 인스턴스 생성
window.stage2Parser = new Stage2JSONParser();

/**
 * Stage2 병합 전용 파서 클래스
 */
class Stage2Parser {
    constructor() {
        this.data = {
            film_id: null,
            current_step: null,
            timestamp: null,
            scenes: []
        };
        this.scenesMap = new Map();
        this.shotsMap = new Map();
        this.duplicateStrategy = 'replace'; // 'replace', 'skip', 'duplicate'
    }

    /**
     * 기존 데이터 설정
     */
    setData(existingData) {
        this.data = { ...existingData };
        this.rebuildMaps();
    }

    /**
     * Map 재구성
     */
    rebuildMaps() {
        this.scenesMap.clear();
        this.shotsMap.clear();

        if (this.data.scenes && Array.isArray(this.data.scenes)) {
            this.data.scenes.forEach(scene => {
                this.scenesMap.set(scene.scene_id, scene);
                if (scene.shots && Array.isArray(scene.shots)) {
                    scene.shots.forEach(shot => {
                        this.shotsMap.set(shot.shot_id, shot);
                    });
                }
            });
        }
    }

    /**
     * 새 데이터 병합
     */
    async mergeData(newData) {
        try {
            console.log('🔄 병합 시작...');
            console.log('기존 씬 수:', this.data.scenes.length);
            console.log('새로운 씬 수:', newData.scenes ? newData.scenes.length : 0);

            // film_id 확인 (같은 프로젝트인지)
            if (this.data.film_id && newData.film_id && this.data.film_id !== newData.film_id) {
                console.warn('⚠️ 다른 film_id의 데이터를 병합하려고 합니다.');
            }

            // film_id가 없으면 설정
            if (!this.data.film_id && newData.film_id) {
                this.data.film_id = newData.film_id;
            }

            // 새 데이터의 각 씬 처리
            if (newData.scenes && Array.isArray(newData.scenes)) {
                newData.scenes.forEach(newScene => {
                    const existingScene = this.scenesMap.get(newScene.scene_id);

                    if (existingScene) {
                        // 기존 씬이 있으면 샷들만 병합
                        console.log(`씬 ${newScene.scene_id} 병합 중...`);

                        // 씬 정보 업데이트 (필요한 경우)
                        if (newScene.scene_title) existingScene.scene_title = newScene.scene_title;
                        if (newScene.scene_scenario) existingScene.scene_scenario = newScene.scene_scenario;
                        if (newScene.concept_art_references) {
                            existingScene.concept_art_references = newScene.concept_art_references;
                        }

                        // 샷 병합
                        if (newScene.shots && Array.isArray(newScene.shots)) {
                            newScene.shots.forEach(newShot => {
                                const existingShot = this.shotsMap.get(newShot.shot_id);

                                if (existingShot) {
                                    // 중복 샷 처리
                                    this.handleDuplicateShot(existingShot, newShot);
                                } else {
                                    // 새 샷 추가
                                    existingScene.shots.push(newShot);
                                    this.shotsMap.set(newShot.shot_id, newShot);
                                    console.log(`✅ 새 샷 ${newShot.shot_id} 추가됨`);
                                }
                            });
                        }
                    } else {
                        // 새 씬 전체 추가
                        this.data.scenes.push(newScene);
                        this.scenesMap.set(newScene.scene_id, newScene);

                        // 새 씬의 샷들도 Map에 추가
                        if (newScene.shots && Array.isArray(newScene.shots)) {
                            newScene.shots.forEach(shot => {
                                this.shotsMap.set(shot.shot_id, shot);
                            });
                        }

                        console.log(`✅ 새 씬 ${newScene.scene_id} 추가됨 (샷 ${newScene.shots ? newScene.shots.length : 0}개)`);
                    }
                });
            }

            // 씬 정렬 (S01, S02, ... S10 순서로)
            this.data.scenes.sort((a, b) => {
                const numA = parseInt(a.scene_id.replace('S', ''));
                const numB = parseInt(b.scene_id.replace('S', ''));
                return numA - numB;
            });

            // 메타데이터 업데이트 (필요한 경우)
            if (newData.film_metadata) {
                this.data.film_metadata = { ...this.data.film_metadata, ...newData.film_metadata };
            }

            // current_step 업데이트 (최신 것으로)
            if (newData.current_step) {
                this.data.current_step = newData.current_step;
            }

            // 타임스탬프 업데이트
            this.data.timestamp = new Date().toISOString();

            console.log(`✅ 병합 완료: ${this.data.scenes.length}개 씬, ${this.shotsMap.size}개 샷`);

            // 각 씬의 샷 수 출력
            this.data.scenes.forEach(scene => {
                console.log(`  - ${scene.scene_id}: ${scene.shots ? scene.shots.length : 0}개 샷`);
            });

            // sessionStorage 업데이트
            this.saveToSession();

            return this.data;
        } catch (error) {
            console.error('❌ 병합 중 오류:', error);
            throw error;
        }
    }

    /**
     * 중복 샷 처리
     */
    handleDuplicateShot(existingShot, newShot) {
        switch(this.duplicateStrategy) {
            case 'replace':
                // 새 샷으로 교체
                Object.assign(existingShot, newShot);
                console.log(`🔄 샷 ${newShot.shot_id} 교체됨`);
                break;
            case 'skip':
                // 기존 샷 유지
                console.log(`⏭️ 샷 ${newShot.shot_id} 건너뜀 (이미 존재)`);
                break;
            case 'duplicate':
                // 새 ID로 복제 (권장하지 않음)
                const duplicateId = `${newShot.shot_id}_dup${Date.now()}`;
                newShot.shot_id = duplicateId;
                existingShot.shots.push(newShot);
                this.shotsMap.set(duplicateId, newShot);
                console.log(`📋 샷 ${newShot.shot_id} 복제됨 -> ${duplicateId}`);
                break;
        }
    }

    /**
     * 병합된 데이터 반환
     */
    getMergedData() {
        return this.data;
    }

    /**
     * sessionStorage에 저장
     */
    saveToSession() {
        const cacheData = {
            data: this.data,
            shotsMap: Array.from(this.shotsMap.entries()),
            scenesMap: Array.from(this.scenesMap.entries()),
            timestamp: Date.now(),
            filmId: this.data.film_id || 'unknown'
        };

        sessionStorage.setItem('stage2ParsedData', JSON.stringify(cacheData));
        console.log('💾 Stage2 데이터가 sessionStorage에 저장됨');
    }

    /**
     * 중복 처리 전략 설정
     */
    setDuplicateStrategy(strategy) {
        if (['replace', 'skip', 'duplicate'].includes(strategy)) {
            this.duplicateStrategy = strategy;
            console.log(`📋 중복 처리 전략 설정: ${strategy}`);
        }
    }
}

// Stage2Parser도 전역에 노출
window.Stage2Parser = Stage2Parser;

// 샷 디테일 모달에서 사용할 유틸리티 함수들
window.Stage2Utils = {
    /**
     * 현재 샷 ID 기반으로 scene 데이터 자동 로드
     */
    loadSceneForCurrentShot() {
        // 현재 샷 ID 추출 (모달 제목이나 URL에서)
        const shotId = this.getCurrentShotId();
        if (shotId && window.stage2Parser.applySceneToDirectionBlock(shotId)) {
            this.showSuccessMessage(`샷 ${shotId}의 장면 정보가 로드되었습니다.`);
        }
    },

    /**
     * 현재 샷 ID 추출
     */
    getCurrentShotId() {
        // 모달 제목에서 샷 ID 추출
        const modalTitle = document.querySelector('.modal-title');
        if (modalTitle) {
            const match = modalTitle.textContent.match(/S\d{2}\.\d{2}\.\d{2}/);
            return match ? match[0] : null;
        }

        // URL 파라미터에서 추출
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('shot_id');
    },

    /**
     * 샷 ID 선택 드롭다운 생성
     */
    createShotSelector() {
        if (!window.stage2Parser.data) {
            console.warn('⚠️ Stage2 데이터가 로드되지 않았습니다.');
            return null;
        }

        const select = document.createElement('select');
        select.className = 'shot-selector';
        select.innerHTML = '<option value="">샷 선택...</option>';

        // 시퀀스별로 그룹화하여 옵션 생성
        window.stage2Parser.scenesMap.forEach((scene, sceneId) => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = `${sceneId} - ${scene.scene_title}`;

            if (scene.shots) {
                scene.shots.forEach(shot => {
                    const option = document.createElement('option');
                    option.value = shot.shot_id;
                    option.textContent = `${shot.shot_id} - ${shot.shot_text.substring(0, 50)}...`;
                    optgroup.appendChild(option);
                });
            }

            select.appendChild(optgroup);
        });

        // 선택 이벤트 핸들러
        select.addEventListener('change', (e) => {
            if (e.target.value) {
                window.stage2Parser.applySceneToDirectionBlock(e.target.value);
                window.stage2Parser.displayShotInfo(e.target.value);
            }
        });

        return select;
    },

    /**
     * 성공 메시지 표시
     */
    showSuccessMessage(message) {
        console.log(`✅ ${message}`);
        // UI에 토스트 메시지 표시 (기존 알림 시스템이 있다면 활용)
        if (window.showNotification) {
            window.showNotification(message, 'success');
        }
    },

    /**
     * Stage2 JSON 파일 로드 UI
     */
    createFileLoadUI() {
        const container = document.createElement('div');
        container.className = 'stage2-loader';
        container.innerHTML = `
            <div class="stage2-loader-header">
                <h4>Stage2 JSON 로드</h4>
                <input type="file" id="stage2-file-input" accept=".json" style="display: none;">
                <button type="button" onclick="document.getElementById('stage2-file-input').click()">
                    📁 Stage2 파일 선택
                </button>
                <span id="stage2-status"></span>
            </div>
            <div id="stage2-shot-selector-container" style="display: none;">
                <label>샷 선택:</label>
                <div id="stage2-shot-selector"></div>
            </div>
        `;

        // 파일 입력 이벤트 핸들러
        const fileInput = container.querySelector('#stage2-file-input');
        const statusSpan = container.querySelector('#stage2-status');
        const selectorContainer = container.querySelector('#stage2-shot-selector-container');
        const selectorDiv = container.querySelector('#stage2-shot-selector');

        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                statusSpan.textContent = '로딩 중...';
                await window.stage2Parser.loadJSON(file);
                statusSpan.textContent = `✅ ${file.name} 로드 완료`;

                // 샷 선택 드롭다운 생성
                const selector = this.createShotSelector();
                selectorDiv.innerHTML = '';
                selectorDiv.appendChild(selector);
                selectorContainer.style.display = 'block';

                // 현재 샷 ID가 있으면 자동 적용
                this.loadSceneForCurrentShot();

            } catch (error) {
                statusSpan.textContent = `❌ 로드 실패: ${error.message}`;
                console.error('Stage2 로드 에러:', error);
            }
        });

        return container;
    }
};