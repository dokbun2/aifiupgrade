/**
 * Stage 2 JSON Parser for Shot Detail Mapping
 * Stage2 JSON의 shots 데이터를 파싱하여 연출 블록에 scene 필드 매핑
 */

class Stage2JSONParser {
    constructor() {
        this.data = null;
        this.shotsMap = new Map(); // shot_id -> shot data 매핑
        this.scenesMap = new Map(); // scene_id -> scene data 매핑
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