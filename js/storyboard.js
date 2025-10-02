// Storyboard Management System with Auto-Merge
class StoryboardManager {
    constructor() {
        this.storyboardData = null;
        this.mergedData = null;
        this.currentSequence = null;
        this.currentScene = null;
        this.currentShot = null;
        this.uploadedFiles = new Map(); // 업로드된 파일 추적
        this.init();
    }

    init() {
        // Initialize event listeners
        document.addEventListener('DOMContentLoaded', () => {
            this.setupFileUpload();
            this.setupDropdowns();
            this.setupJSONUpload();
            this.loadFromLocalStorage();
            this.checkInitialData();
            this.setupMessageListener();
        });
    }

    setupMessageListener() {
        // iframe에서 보낸 메시지 처리
        window.addEventListener('message', (event) => {
            // 보안을 위해 origin 체크 (필요시)
            // if (event.origin !== 'http://localhost:8000') return;

            if (event.data && event.data.type === 'closeShotDetail') {
                console.log('Received close message from iframe');
                this.closeShotDetailModal();
            }
        });
    }

    setupFileUpload() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');

        if (!uploadArea || !fileInput) return;

        // Click to upload
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileUpload(files[0]);
            }
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileUpload(e.target.files[0]);
            }
        });
    }

    setupJSONUpload() {
        const jsonUploadInput = document.getElementById('jsonUploadInput');
        if (!jsonUploadInput) return;

        jsonUploadInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            files.forEach(file => this.handleFileUpload(file));
            e.target.value = ''; // Reset input
        });
    }

    async handleFileUpload(file) {
        if (file.type !== 'application/json') {
            this.showNotification('JSON 파일만 업로드 가능합니다.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                // JSON 텍스트 전처리 (±, BOM 제거 등)
                let jsonText = e.target.result;

                // BOM 제거
                if (jsonText.charCodeAt(0) === 0xFEFF) {
                    jsonText = jsonText.slice(1);
                }

                // 시작 부분의 ± 문자 제거
                jsonText = jsonText.replace(/^[±\u00B1]+\s*/, '');

                // 기타 제어 문자 제거
                jsonText = jsonText.replace(/^[\x00-\x1F\x7F-\x9F]+/, '');

                const data = JSON.parse(jsonText);
                await this.processUploadedFile(file.name, data);
            } catch (error) {
                console.error('JSON 파싱 에러 상세:', error);
                this.showNotification(`JSON 파일 파싱 오류: ${error.message}`, 'error');
            }
        };
        reader.readAsText(file, 'UTF-8');
    }

    async processUploadedFile(filename, data) {
        // 파일 타입 감지
        const fileType = this.detectFileType(data);
        console.log(`Processing ${filename} as ${fileType}`);

        // 파일 저장
        this.uploadedFiles.set(fileType, data);

        // 자동 병합 시도
        if (this.uploadedFiles.size > 0) {
            await this.autoMergeData();
        }
    }

    detectFileType(data) {
        // stage1 타입 감지 (visual_blocks가 있으면 stage1)
        if (data.visual_blocks) {
            // Stage 1 파일이 업로드되면 파싱하여 저장
            this.parseStage1Data(data);
            return 'stage1';
        }
        // stage1 타입 감지 (current_work.treatment.sequences 구조)
        else if (data.current_work && data.current_work.treatment && data.current_work.scenario) {
            // Stage 1 파일이 업로드되면 파싱하여 저장
            this.parseStage1Data(data);
            return 'stage1';
        }
        // concept_art 타입 감지
        else if (data.film_metadata && data.treatment && data.scenarios) {
            return 'concept_art';
        }
        // stage2 타입 감지
        else if (data.scenes && Array.isArray(data.scenes)) {
            // Stage 2 파일이 업로드되면 파싱하여 저장
            this.parseStage2Data(data);
            return 'stage2';
        }
        // 기본 스토리보드 타입
        else if (data.storyboard || data.shots) {
            return 'storyboard';
        }
        return 'unknown';
    }

    // Stage 1 데이터 파싱
    parseStage1Data(data) {
        // film_metadata가 있으면 localStorage에 캐시 저장
        if (data.film_metadata) {
            const cacheKey = 'aifi_film_metadata_cache';
            const cacheData = {
                filmMetadata: data.film_metadata,
                timestamp: Date.now(),
                filmId: data.film_id || 'unknown'
            };
            localStorage.setItem(cacheKey, JSON.stringify(cacheData));
            console.log('✅ Film metadata가 localStorage에 캐시되었습니다:', data.film_metadata);
        }

        // 원본 Stage1 데이터를 sessionStorage에 저장 (캐릭터 블록 등에서 직접 사용)
        sessionStorage.setItem('stage1OriginalData', JSON.stringify(data));
        console.log('✅ Stage1 원본 데이터가 sessionStorage에 저장되었습니다.');

        if (window.stage1Parser) {
            // Stage1JSONParser를 사용하여 데이터 파싱
            window.stage1Parser.data = data;
            window.stage1Parser.parseAllBlocks();

            // 파싱된 데이터를 세션 스토리지에 저장
            const parsedData = window.stage1Parser.parsedData;
            sessionStorage.setItem('stage1ParsedData', JSON.stringify(parsedData));

            console.log('✅ Stage 1 데이터가 파싱되어 저장되었습니다:', parsedData);
        } else {
            console.warn('⚠️ Stage 1 파서가 로드되지 않았습니다.');
        }
    }

    // Stage 2 데이터 파싱
    parseStage2Data(data) {
        console.log('🎬 Stage2 JSON 파싱 시작:', data.film_id);

        // Stage2 파서 초기화 및 파싱
        if (window.stage2Parser) {
            window.stage2Parser.data = data;
            window.stage2Parser.parseData();

            // 파싱된 데이터를 세션 스토리지에 저장
            const stage2CacheData = {
                data: data,
                shotsMap: Array.from(window.stage2Parser.shotsMap.entries()),
                scenesMap: Array.from(window.stage2Parser.scenesMap.entries()),
                timestamp: Date.now(),
                filmId: data.film_id || 'unknown'
            };
            sessionStorage.setItem('stage2ParsedData', JSON.stringify(stage2CacheData));

            console.log('✅ Stage2 데이터 파싱 완료:', {
                scenes: window.stage2Parser.scenesMap.size,
                shots: window.stage2Parser.shotsMap.size
            });

            // 연출 블록 자동 매핑 활성화 (shot-detail 모달에서 사용)
            this.enableStage2AutoMapping();

        } else {
            console.warn('⚠️ Stage2 파서가 로드되지 않았습니다.');

            // Stage2 파서 스크립트 동적 로드 시도
            this.loadStage2Parser().then(() => {
                console.log('🔄 Stage2 파서 동적 로드 완료, 재시도 중...');
                setTimeout(() => this.parseStage2Data(data), 500);
            }).catch(error => {
                console.error('❌ Stage2 파서 로드 실패:', error);
            });
        }
    }

    // Stage2 파서 동적 로드
    async loadStage2Parser() {
        return new Promise((resolve, reject) => {
            if (window.stage2Parser) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = '../js/stage2-parser.js';
            script.onload = () => {
                console.log('✅ Stage2 파서 스크립트 로드 완료');
                resolve();
            };
            script.onerror = () => {
                reject(new Error('Stage2 파서 스크립트 로드 실패'));
            };
            document.head.appendChild(script);
        });
    }

    // Stage2 자동 매핑 활성화
    enableStage2AutoMapping() {
        console.log('🎯 Stage2 자동 매핑 활성화됨');

        // 스토리보드 카드에 Stage2 매핑 표시 추가
        setTimeout(() => {
            this.addStage2IndicatorToCards();
        }, 1000);
    }

    // 스토리보드 카드에 Stage2 매핑 표시 추가
    addStage2IndicatorToCards() {
        const cards = document.querySelectorAll('.shot-card');
        cards.forEach(card => {
            // 기존 표시가 있으면 제거
            const existingIndicator = card.querySelector('.stage2-indicator');
            if (existingIndicator) {
                existingIndicator.remove();
            }

            // 샷 ID 추출
            const shotId = this.extractShotIdFromCard(card);
            if (!shotId || !window.stage2Parser) return;

            // Stage2 데이터가 있는지 확인
            const sceneData = window.stage2Parser.getSceneByshotId(shotId);
            if (sceneData) {
                // Stage2 매핑 표시 추가
                const indicator = document.createElement('div');
                indicator.className = 'stage2-indicator';
                indicator.style.cssText = `
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    background: rgba(0, 188, 212, 0.9);
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: 600;
                    z-index: 10;
                `;
                indicator.textContent = 'S2';
                indicator.title = 'Stage2 장면 데이터 매핑됨';

                card.style.position = 'relative';
                card.appendChild(indicator);
            }
        });
    }

    // 카드에서 샷 ID 추출
    extractShotIdFromCard(card) {
        // 카드의 제목이나 데이터 속성에서 샷 ID 추출
        const shotTitle = card.querySelector('.shot-title, .card-title, h3');
        if (shotTitle) {
            const match = shotTitle.textContent.match(/S\d{2}\.\d{2}\.\d{2}/);
            if (match) return match[0];
        }

        // 데이터 속성에서 추출
        const shotId = card.getAttribute('data-shot-id') || card.getAttribute('data-shot');
        if (shotId) return shotId;

        return null;
    }

    async autoMergeData() {
        console.log('Auto-merging data...');

        const stage1Data = this.uploadedFiles.get('stage1');
        const conceptArtData = this.uploadedFiles.get('concept_art');
        const stage2Data = this.uploadedFiles.get('stage2');
        const storyboardData = this.uploadedFiles.get('storyboard');

        // 병합 우선순위: stage1 + stage2 > concept_art + stage2 > stage2 > storyboard
        if (stage1Data && stage2Data) {
            this.mergedData = this.mergeStage1WithStage2(stage1Data, stage2Data);
        } else if (stage1Data) {
            this.mergedData = this.processStage1Data(stage1Data);
        } else if (conceptArtData && stage2Data) {
            this.mergedData = this.mergeConceptArtWithStage2(conceptArtData, stage2Data);
        } else if (stage2Data) {
            this.mergedData = this.processStage2Data(stage2Data);
        } else if (conceptArtData) {
            this.mergedData = this.processConceptArtData(conceptArtData);
        } else if (storyboardData) {
            this.mergedData = storyboardData;
        }

        if (this.mergedData) {
            this.storyboardData = this.mergedData;

            // 병합된 데이터에 Stage 1이 포함되어 있으면 파싱하여 저장
            if (this.mergedData.stage1_original || this.mergedData.visual_blocks) {
                const stage1Data = this.mergedData.stage1_original || this.mergedData;
                this.parseStage1Data(stage1Data);
            }

            this.saveToLocalStorage();
            this.updateMetadata();
            this.populateSequenceDropdown();
            this.populateSceneDropdown();
            this.renderStoryboard();
            this.hideUploadSection();
            this.showControls();
            this.showNotification('데이터가 성공적으로 병합되었습니다.', 'success');
        }
    }

    mergeStage1WithStage2(stage1, stage2) {
        console.log('Merging stage1 with stage2 data...');

        // stage1에서 기본 구조 가져오기
        const merged = {
            // 메타데이터는 stage1에서
            film_metadata: stage1.film_metadata || {},
            treatment: stage1.current_work?.treatment || {},

            // Stage 1의 visual_blocks 데이터 보존
            visual_blocks: stage1.visual_blocks || {},

            // Stage 1 원본 데이터 전체 보존
            stage1_original: stage1,

            // scenes 초기화
            scenes: []
        };

        // stage1의 scenario.scenes를 기반으로 초기 구조 생성
        const stage1Scenes = stage1.current_work?.scenario?.scenes || [];

        // stage2의 상세 정보를 병합
        if (stage2.scenes && Array.isArray(stage2.scenes)) {
            stage2.scenes.forEach(s2Scene => {
                // stage1에서 매칭되는 scene 찾기
                const matchingStage1Scene = stage1Scenes.find(s1 =>
                    s1.scene_id === s2Scene.scene_id ||
                    s1.scene_number === parseInt(s2Scene.scene_id.replace('S', ''))
                );

                // sequence_id 찾기
                let sequenceId = matchingStage1Scene?.sequence_id || null;

                merged.scenes.push({
                    ...s2Scene,
                    sequence_id: sequenceId,
                    scenario_text: matchingStage1Scene?.scenario_text || s2Scene.scene_scenario,
                    stage1_data: matchingStage1Scene || null
                });
            });

            // stage2에 없는 stage1 scene들도 추가 (scene을 shot처럼 표시)
            stage1Scenes.forEach(s1Scene => {
                const existsInStage2 = stage2.scenes.some(s2 =>
                    s2.scene_id === s1Scene.scene_id ||
                    s1Scene.scene_number === parseInt(s2.scene_id.replace('S', ''))
                );

                if (!existsInStage2) {
                    const sceneAsShot = {
                        shot_id: s1Scene.scene_id,
                        shot_type: 'scene',
                        shot_text: s1Scene.scenario_text,
                        shot_summary: s1Scene.scenario_text?.split('\n')[0] || `Scene ${s1Scene.scene_number}`,
                        camera_movement: {
                            type: 'establishing',
                            duration: 'N/A'
                        }
                    };

                    merged.scenes.push({
                        scene_id: s1Scene.scene_id,
                        scene_title: s1Scene.scenario_text?.split('\n')[0] || `Scene ${s1Scene.scene_number}`,
                        scene_scenario: s1Scene.scenario_text,
                        sequence_id: s1Scene.sequence_id,
                        shots: [sceneAsShot]
                    });
                }
            });
        } else {
            // stage2가 없으면 stage1의 scenes를 shot처럼 표시
            stage1Scenes.forEach(s1Scene => {
                const sceneAsShot = {
                    shot_id: s1Scene.scene_id,
                    shot_type: 'scene',
                    shot_text: s1Scene.scenario_text,
                    shot_summary: s1Scene.scenario_text?.split('\n')[0] || `Scene ${s1Scene.scene_number}`,
                    camera_movement: {
                        type: 'establishing',
                        duration: 'N/A'
                    }
                };

                merged.scenes.push({
                    scene_id: s1Scene.scene_id,
                    scene_title: s1Scene.scenario_text?.split('\n')[0] || `Scene ${s1Scene.scene_number}`,
                    scene_scenario: s1Scene.scenario_text,
                    sequence_id: s1Scene.sequence_id,
                    shots: [sceneAsShot]
                });
            });
        }

        return merged;
    }

    // Stage1 데이터를 컨셉아트 형식으로 변환
    transformAndSaveConceptArtData(stage1Data) {
        const conceptArtData = {
            characters: [],
            locations: [],
            props: [],
            prompts: {},
            images: {},
            universal: stage1Data.universal || stage1Data.universal_translated || null,
            universal_translated: stage1Data.universal_translated || null
        };

        // Process characters
        if (stage1Data.visual_blocks && stage1Data.visual_blocks.characters) {
            stage1Data.visual_blocks.characters.forEach(char => {
                const charData = {
                    id: char.id,
                    name: char.name || char.id,
                    blocks: char.blocks || {},
                    character_detail: char.character_detail || null,
                    voice_style: char.voice_style || null
                };

                // Store the character data
                conceptArtData.characters.push(charData);

                // Store the blocks as prompts for this character
                conceptArtData.prompts[char.id] = {
                    id: char.id,
                    type: 'character',
                    ...char.blocks,
                    character_detail: char.character_detail || null,
                    voice_style: char.voice_style || null,
                    universal: conceptArtData.universal,
                    universal_translated: conceptArtData.universal_translated
                };
            });
        }

        // Process locations
        if (stage1Data.visual_blocks && stage1Data.visual_blocks.locations) {
            stage1Data.visual_blocks.locations.forEach(loc => {
                const locData = {
                    id: loc.id,
                    name: loc.name || loc.id,
                    blocks: loc.blocks || {},
                    character_detail: loc.character_detail || null,
                    voice_style: loc.voice_style || null
                };

                conceptArtData.locations.push(locData);

                conceptArtData.prompts[loc.id] = {
                    id: loc.id,
                    type: 'location',
                    ...loc.blocks,
                    character_detail: loc.character_detail || null,
                    voice_style: loc.voice_style || null,
                    universal: conceptArtData.universal,
                    universal_translated: conceptArtData.universal_translated
                };
            });
        }

        // Process props
        if (stage1Data.visual_blocks && stage1Data.visual_blocks.props) {
            stage1Data.visual_blocks.props.forEach(prop => {
                const propData = {
                    id: prop.id,
                    name: prop.name || prop.id,
                    blocks: prop.blocks || {},
                    character_detail: prop.character_detail || null,
                    voice_style: prop.voice_style || null
                };

                conceptArtData.props.push(propData);

                conceptArtData.prompts[prop.id] = {
                    id: prop.id,
                    type: 'props',
                    ...prop.blocks,
                    character_detail: prop.character_detail || null,
                    voice_style: prop.voice_style || null,
                    universal: conceptArtData.universal,
                    universal_translated: conceptArtData.universal_translated
                };
            });
        }

        // Also store film metadata if available
        if (stage1Data.film_metadata) {
            conceptArtData.film_metadata = stage1Data.film_metadata;
        }

        // localStorage에 컨셉아트 데이터 저장
        localStorage.setItem('conceptArtData', JSON.stringify(conceptArtData));

        console.log('Stage1 data transformed and saved for concept art:', {
            characters: conceptArtData.characters.length,
            locations: conceptArtData.locations.length,
            props: conceptArtData.props.length,
            totalPrompts: Object.keys(conceptArtData.prompts).length
        });

        return conceptArtData;
    }

    processStage1Data(stage1) {
        console.log('Processing stage1 data...');

        // Stage1 데이터를 컨셉아트 형식으로 변환하여 저장
        this.transformAndSaveConceptArtData(stage1);

        const scenes = [];
        const stage1Scenes = stage1.current_work?.scenario?.scenes || [];

        stage1Scenes.forEach(scene => {
            // stage1의 각 scene을 하나의 shot처럼 처리
            const sceneAsShot = {
                shot_id: scene.scene_id,
                shot_type: 'scene',
                shot_text: scene.scenario_text,
                shot_summary: scene.scenario_text?.split('\n')[0] || `Scene ${scene.scene_number}`,
                camera_movement: {
                    type: 'establishing',
                    duration: 'N/A'
                }
            };

            scenes.push({
                scene_id: scene.scene_id,
                scene_title: scene.scenario_text?.split('\n')[0] || `Scene ${scene.scene_number}`,
                scene_scenario: scene.scenario_text,
                sequence_id: scene.sequence_id,
                shots: [sceneAsShot] // scene 자체를 shot으로 추가
            });
        });

        return {
            film_metadata: stage1.film_metadata || {},
            treatment: stage1.current_work?.treatment || {},
            visual_blocks: stage1.visual_blocks || {},
            scenes: scenes
        };
    }

    mergeConceptArtWithStage2(conceptArt, stage2) {
        console.log('Merging concept_art with stage2 data...');

        const merged = {
            // 메타데이터는 concept_art에서
            film_metadata: conceptArt.film_metadata || {},
            treatment: conceptArt.treatment || {},
            scenarios: conceptArt.scenarios || [],

            // scenes는 stage2에서 가져오되, concept_art 정보로 보강
            scenes: []
        };

        // stage2의 scenes를 기반으로 병합
        if (stage2.scenes && Array.isArray(stage2.scenes)) {
            merged.scenes = stage2.scenes.map(scene => {
                // concept_art의 scenarios에서 매칭되는 시나리오 찾기
                const matchingScenario = conceptArt.scenarios?.find(s =>
                    s.scene_number === scene.scene_id ||
                    s.title?.includes(scene.scene_title)
                );

                // treatment의 sequences에서 관련 sequence 찾기
                let sequenceId = null;
                if (conceptArt.treatment?.sequences) {
                    conceptArt.treatment.sequences.forEach(seq => {
                        if (seq.scenes?.includes(scene.scene_id)) {
                            sequenceId = seq.sequence_id || seq.title;
                        }
                    });
                }

                return {
                    ...scene,
                    sequence_id: sequenceId,
                    scenario_data: matchingScenario || null,
                    concept_art_refs: scene.concept_art_references || null
                };
            });
        }

        return merged;
    }

    processStage2Data(data) {
        // stage2 데이터만 있을 때 기본 구조 생성
        console.log('Processing Stage2 data:', data);

        // 각 scene의 concept_art_references 확인
        if (data.scenes) {
            data.scenes.forEach((scene, index) => {
                console.log(`Scene ${index + 1} (${scene.scene_id}):`, scene.concept_art_references);
            });
        }

        return {
            film_metadata: {
                title_working: "제목 없음",
                genre: "미정",
                duration: "미정"
            },
            scenes: data.scenes || []
        };
    }

    processConceptArtData(data) {
        // concept_art 데이터만 있을 때 scenes 구조 생성
        const scenes = [];

        if (data.scenarios && Array.isArray(data.scenarios)) {
            data.scenarios.forEach(scenario => {
                scenes.push({
                    scene_id: scenario.scene_number || `S${scenarios.indexOf(scenario) + 1}`,
                    scene_title: scenario.title || "제목 없음",
                    scene_scenario: scenario.content || "",
                    shots: [] // 샷 정보는 없음
                });
            });
        }

        return {
            ...data,
            scenes: scenes
        };
    }

    updateMetadata() {
        if (!this.mergedData) return;

        const metadata = this.mergedData.film_metadata || {};
        const metadataSection = document.getElementById('filmMetadata');

        if (metadataSection) {
            metadataSection.style.display = 'block';

            // 제목
            const titleEl = document.getElementById('filmTitle');
            if (titleEl) {
                titleEl.textContent = metadata.title_working || metadata.title || '제목 없음';
            }

            // 장르
            const genreEl = document.getElementById('filmGenre');
            if (genreEl) {
                genreEl.textContent = metadata.genre || '미정';
            }

            // 러닝타임
            const durationEl = document.getElementById('filmDuration');
            if (durationEl) {
                durationEl.textContent = metadata.duration || metadata.runtime || '미정';
            }

            // 샷 개수 업데이트
            this.updateShotCount();
        }
    }

    updateShotCount() {
        let totalShots = 0;

        if (this.mergedData?.scenes) {
            this.mergedData.scenes.forEach(scene => {
                if (scene.shots && Array.isArray(scene.shots)) {
                    totalShots += scene.shots.length;
                }
            });
        }

        const progressEl = document.getElementById('filmProgress');
        if (progressEl) {
            progressEl.textContent = `${totalShots} 샷`;
        }
    }

    populateSequenceDropdown() {
        const sequenceSelect = document.getElementById('sequenceSelect');
        if (!sequenceSelect) return;

        // Clear existing options
        sequenceSelect.innerHTML = '<option value="">전체 Sequence</option>';

        // Check for sequences in treatment
        const sequences = this.mergedData?.treatment?.sequences ||
                         this.storyboardData?.treatment?.sequences || [];

        if (sequences.length === 0) return;

        // Add sequence options
        sequences.forEach(sequence => {
            const option = document.createElement('option');
            option.value = sequence.sequence_id || sequence.sequence_title || sequence.title;
            option.textContent = sequence.sequence_title || sequence.title || sequence.sequence_id;
            sequenceSelect.appendChild(option);
        });
    }

    populateSceneDropdown(sequenceId = null) {
        const sceneSelect = document.getElementById('sceneSelect');
        if (!sceneSelect) return;

        // Clear existing options
        sceneSelect.innerHTML = '<option value="">전체 Scene</option>';

        if (!this.storyboardData?.scenes) return;

        let scenesToShow = this.storyboardData.scenes;

        // Filter by sequence if specified
        if (sequenceId) {
            scenesToShow = scenesToShow.filter(scene => scene.sequence_id === sequenceId);
        }

        // Add scene options
        scenesToShow.forEach(scene => {
            const option = document.createElement('option');
            option.value = scene.scene_id;
            option.textContent = `${scene.scene_id}: ${scene.scene_title}`;
            sceneSelect.appendChild(option);
        });
    }

    populateShotDropdown(sceneId) {
        const shotSelect = document.getElementById('shotSelect');
        if (!shotSelect) return;

        // Clear existing options
        shotSelect.innerHTML = '<option value="">전체 Shot</option>';

        if (!sceneId || !this.storyboardData) return;

        // Find the selected scene
        const scene = this.storyboardData.scenes?.find(s => s.scene_id === sceneId);
        if (!scene || !scene.shots) return;

        // Add shot options
        scene.shots.forEach(shot => {
            const option = document.createElement('option');
            option.value = shot.shot_id;
            option.textContent = shot.shot_id;
            shotSelect.appendChild(option);
        });
    }

    setupDropdowns() {
        const sequenceSelect = document.getElementById('sequenceSelect');
        const sceneSelect = document.getElementById('sceneSelect');
        const shotSelect = document.getElementById('shotSelect');

        if (sequenceSelect) {
            sequenceSelect.addEventListener('change', (e) => {
                this.currentSequence = e.target.value;
                this.currentScene = null;
                this.currentShot = null;
                this.populateSceneDropdown(this.currentSequence);
                this.renderStoryboard();

                // Reset downstream dropdowns
                if (sceneSelect) sceneSelect.value = '';
                if (shotSelect) shotSelect.value = '';
            });
        }

        if (sceneSelect) {
            sceneSelect.addEventListener('change', (e) => {
                this.currentScene = e.target.value;
                this.currentShot = null;
                this.populateShotDropdown(this.currentScene);
                this.renderStoryboard();

                // Reset shot dropdown
                if (shotSelect) shotSelect.value = '';
            });
        }

        if (shotSelect) {
            shotSelect.addEventListener('change', (e) => {
                this.currentShot = e.target.value;
                this.renderStoryboard();
            });
        }
    }

    renderStoryboard() {
        const container = document.getElementById('storyboardGrid');
        if (!container) return;

        // Clear container
        container.innerHTML = '';

        if (!this.storyboardData?.scenes || this.storyboardData.scenes.length === 0) {
            this.renderEmptyState();
            return;
        }

        let scenesToRender = this.storyboardData.scenes;

        // Filter by selected sequence
        if (this.currentSequence) {
            scenesToRender = scenesToRender.filter(s => s.sequence_id === this.currentSequence);
        }

        // Filter by selected scene
        if (this.currentScene) {
            scenesToRender = scenesToRender.filter(s => s.scene_id === this.currentScene);
        }

        // Render scenes
        scenesToRender.forEach(scene => {
            this.renderScene(scene, container);
        });
    }

    renderScene(scene, container) {
        // Create scene section
        const sceneSection = document.createElement('div');
        sceneSection.className = 'scene-section';
        sceneSection.id = `scene-${scene.scene_id}`;

        // Scene header
        const sceneHeader = document.createElement('div');
        sceneHeader.className = 'scene-header';

        const sequenceInfo = scene.sequence_id ? ` [${scene.sequence_id}]` : '';
        const fullDescription = scene.scene_scenario || '';
        const shortDescription = fullDescription.substring(0, 20);
        const needsToggle = fullDescription.length > 20;

        sceneHeader.innerHTML = `
            <h2 class="scene-title">${scene.scene_id}: ${scene.scene_title}${sequenceInfo}</h2>
            <div class="scene-description-wrapper">
                <p class="scene-description ${needsToggle ? 'collapsed' : ''}" data-full="${fullDescription.replace(/"/g, '&quot;')}">
                    ${needsToggle ? shortDescription + '...' : fullDescription}
                </p>
                ${needsToggle ? `
                    <button class="description-toggle-btn" onclick="window.toggleSceneDescription(this)">
                        <span class="toggle-text">더 보기</span>
                        <svg class="toggle-icon" width="12" height="12" viewBox="0 0 12 12">
                            <path d="M6 8L2 4h8z" fill="currentColor"/>
                        </svg>
                    </button>
                ` : ''}
            </div>
        `;
        sceneSection.appendChild(sceneHeader);

        // Shots grid
        const shotsGrid = document.createElement('div');
        shotsGrid.className = 'storyboard-container';

        let shotsToRender = scene.shots || [];

        // Filter by selected shot
        if (this.currentShot) {
            shotsToRender = shotsToRender.filter(s => s.shot_id === this.currentShot);
        }

        // Render shot cards
        shotsToRender.forEach(shot => {
            // scene의 concept_art_references를 shot에 전달
            const shotWithRefs = {
                ...shot,
                concept_art_references: shot.concept_art_references || scene.concept_art_references
            };

            // 디버깅용 로그
            console.log(`Shot ${shot.shot_id} in Scene ${scene.scene_id}:`, shotWithRefs.concept_art_references);

            const card = this.createShotCard(shotWithRefs);
            shotsGrid.appendChild(card);
        });

        sceneSection.appendChild(shotsGrid);
        container.appendChild(sceneSection);
    }

    /**
     * Shot ID로 mergedData에서 실제 샷 찾기
     */
    findShotById(shotId) {
        if (!this.mergedData || !this.mergedData.scenes) {
            console.warn('⚠️ mergedData가 없습니다.');
            return null;
        }

        for (const scene of this.mergedData.scenes) {
            if (scene.shots) {
                const foundShot = scene.shots.find(s => s.shot_id === shotId);
                if (foundShot) {
                    // scene의 concept_art_references도 함께 반환
                    return {
                        ...foundShot,
                        concept_art_references: foundShot.concept_art_references || scene.concept_art_references
                    };
                }
            }
        }

        console.warn(`⚠️ Shot ID '${shotId}'를 찾을 수 없습니다.`);
        return null;
    }

    createShotCard(shot) {
        console.log('🃏 카드 생성 중 - Shot ID:', shot.shot_id);
        const card = document.createElement('div');
        card.className = 'storyboard-card';
        card.dataset.shotId = shot.shot_id;

        // Extract camera movement info
        const cameraMovement = shot.camera_movement || {};
        const movementType = cameraMovement.type || 'static';
        const duration = cameraMovement.duration || 'N/A';

        // scene 타입일 때는 다른 스타일 적용
        const isScene = shot.shot_type === 'scene';
        const typeLabel = isScene ? 'SCENE' : (shot.shot_type || 'regular').toUpperCase();
        const typeClass = isScene ? 'scene-type' : 'shot-type';

        // scene일 때는 시나리오 텍스트를 줄여서 표시
        let displayText = shot.shot_text || shot.shot_summary || '';
        if (isScene && displayText.length > 200) {
            displayText = displayText.substring(0, 200) + '...';
        }

        // concept_art_references 정보 추출 및 포맷팅
        let conceptArtRefs = '';
        if (shot.concept_art_references) {
            const refs = shot.concept_art_references;

            // Characters 정보
            if (refs.characters && refs.characters.length > 0) {
                conceptArtRefs += `C: ${refs.characters.join(', ')}\n`;
            }

            // Location 정보
            if (refs.location) {
                conceptArtRefs += `L: ${refs.location}`;
            }
        }

        card.innerHTML = `
            <div class="card-header">
                <span class="shot-id">${shot.shot_id}</span>
            </div>
            <div class="card-thumbnail">
                <svg class="thumbnail-placeholder" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    ${isScene ?
                        `<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                         <line x1="3" y1="9" x2="21" y2="9"></line>
                         <line x1="9" y1="21" x2="9" y2="9"></line>` :
                        `<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                         <circle cx="8.5" cy="8.5" r="1.5"></circle>
                         <polyline points="21 15 16 10 5 21"></polyline>`
                    }
                </svg>
            </div>
            <div class="card-content">
                <p class="shot-text">${displayText}</p>
                ${conceptArtRefs ? `<div class="concept-art-refs">${conceptArtRefs}</div>` : ''}
            </div>
            <div class="card-footer">
                <div class="card-tags">
                    <span class="card-tag video-tag">Video</span>
                    <span class="card-tag">블록 수정</span>
                    <span class="card-tag">샷 복제</span>
                    <span class="card-tag">삭제</span>
                </div>
            </div>
        `;

        // Add click event for card
        card.addEventListener('click', (e) => {
            // Prevent tag buttons from triggering card click
            if (e.target.closest('.card-tags')) {
                const tag = e.target.closest('.card-tag');
                if (tag) {
                    // 카드의 data-shot-id로 실제 샷 찾기
                    const clickedCard = e.currentTarget;
                    const shotId = clickedCard.dataset.shotId;
                    const actualShot = this.findShotById(shotId);
                    console.log('🏷️ 태그 클릭:', tag.textContent, 'Shot:', shotId);
                    this.handleTagClick(tag, actualShot || shot);
                }
                return;
            }

            // 카드의 data-shot-id로 실제 샷 찾기
            const clickedCard = e.currentTarget;
            const shotId = clickedCard.dataset.shotId;
            const actualShot = this.findShotById(shotId);
            console.log('🎬 카드 클릭 - Card data-shot-id:', shotId, '실제 찾은 Shot:', actualShot);
            this.showShotDetails(actualShot || shot);
        });

        return card;
    }

    handleTagClick(tag, shot) {
        const tagText = tag.textContent.trim();

        switch(tagText) {
            case 'Video':
                console.log('Playing video for shot:', shot.shot_id);
                this.showNotification('비디오 재생 기능은 준비 중입니다.', 'info');
                break;
            case '블록 수정':
                console.log('Edit block for shot:', shot.shot_id);
                this.editShotBlock(shot);
                break;
            case '샷 복제':
                console.log('Duplicate shot:', shot.shot_id);
                this.duplicateShot(shot);
                break;
            case '삭제':
                if (confirm(`정말 ${shot.shot_id} 샷을 삭제하시겠습니까?`)) {
                    console.log('Delete shot:', shot.shot_id);
                    this.deleteShot(shot);
                }
                break;
            default:
                console.log('Unknown tag action:', tagText);
        }
    }

    editShotBlock(shot) {
        // Stage2 데이터 병합 (scene 필드 포함)
        let stage2Data = {};
        if (window.stage2Parser) {
            const sceneData = window.stage2Parser.getSceneByshotId(shot.shot_id);
            if (sceneData) {
                stage2Data = sceneData;
                console.log(`✅ Stage2 데이터 병합 (${shot.shot_id}):`, sceneData);
            }
        }

        // 현재 씬과 시퀀스 정보 포함하여 확장된 샷 데이터 생성
        const extendedShot = {
            ...shot,
            ...stage2Data, // Stage2의 scene 필드 포함
            scene_id: this.currentScene,
            sequence_id: this.currentSequence,
            merged_data: this.mergedData, // 병합된 전체 데이터 포함
            concept_art_references: shot.concept_art_references // concept_art_references 명시적 포함
        };

        // 디버깅: extendedShot 구조 확인
        console.log('📦 [editShotBlock] extendedShot 구조:', {
            shot_id: extendedShot.shot_id,
            hasConceptArtRefs: !!extendedShot.concept_art_references,
            conceptArtRefs: extendedShot.concept_art_references,
            hasMergedData: !!extendedShot.merged_data
        });

        // 샷 데이터를 sessionStorage에 저장
        sessionStorage.setItem(`shot_${shot.shot_id}`, JSON.stringify(extendedShot));

        // 모달 컨테이너 표시 (편집 모드)
        const modalContainer = document.getElementById('shotDetailModal');
        if (!modalContainer) return;

        // 모달 컨테이너 생성
        modalContainer.innerHTML = `
            <div class="shot-detail-modal-wrapper">
                <iframe id="shotDetailFrame"
                    src="../shot-detail.html?shotId=${shot.shot_id}&mode=edit"
                    style="width: 100%; height: 100%; border: none;">
                </iframe>
            </div>
        `;

        // 모달 표시
        modalContainer.style.display = 'flex';

        // iframe 로드 완료 후 Stage 1 데이터 전달
        const iframe = document.getElementById('shotDetailFrame');
        if (iframe) {
            iframe.onload = () => {
                // shotDetail 객체가 준비될 때까지 재시도
                const tryLoadStage1Data = (retries = 0) => {
                    const maxRetries = 10;
                    const stage1Data = sessionStorage.getItem('stage1ParsedData');

                    if (!stage1Data) {
                        console.log('❌ Stage 1 데이터가 sessionStorage에 없습니다.');
                        return;
                    }

                    try {
                        const parsedData = JSON.parse(stage1Data);

                        // iframe 내부의 shotDetail 객체 확인
                        if (iframe.contentWindow && iframe.contentWindow.shotDetail) {
                            iframe.contentWindow.shotDetail.loadStage1JSON(parsedData);
                            console.log('✅ Stage 1 데이터가 샷 디테일 모달에 전달되었습니다.');
                        } else if (retries < maxRetries) {
                            console.log(`⏳ shotDetail 객체 대기 중... (${retries + 1}/${maxRetries})`);
                            setTimeout(() => tryLoadStage1Data(retries + 1), 300);
                        } else {
                            console.error('❌ shotDetail 객체를 찾을 수 없습니다. (최대 재시도 횟수 초과)');
                        }
                    } catch (error) {
                        console.error('Stage 1 데이터 전달 실패:', error);
                    }
                };

                // 초기 지연 후 시작
                setTimeout(() => tryLoadStage1Data(), 500);
            };
        }

        // ESC 키로 닫기
        document.addEventListener('keydown', this.handleEscKey);

        // 모달 외부 클릭시 닫기
        modalContainer.addEventListener('click', (e) => {
            if (e.target === modalContainer) {
                this.closeShotDetailModal();
            }
        });
    }

    duplicateShot(shot) {
        this.showNotification('샷 복제 기능은 준비 중입니다.', 'info');
    }

    deleteShot(shot) {
        this.showNotification('샷 삭제 기능은 준비 중입니다.', 'info');
    }

    showShotDetails(shot) {
        console.log('📂 showShotDetails 호출됨 - Shot ID:', shot.shot_id, 'Shot 전체 데이터:', shot);

        // 기존 이벤트 리스너 제거
        document.removeEventListener('keydown', this.handleEscKey);

        // Stage2 데이터 병합 (scene 필드 포함)
        let stage2Data = {};
        if (window.stage2Parser) {
            const sceneData = window.stage2Parser.getSceneByshotId(shot.shot_id);
            if (sceneData) {
                stage2Data = sceneData;
                console.log(`✅ Stage2 데이터 병합 (${shot.shot_id}):`, sceneData);
            }
        }

        // Stage2 scene 필드를 포함한 샷 데이터 생성
        const extendedShot = {
            ...shot,
            ...stage2Data // Stage2의 scene 필드 포함
        };

        console.log('💾 sessionStorage 저장:', `shot_${shot.shot_id}`, extendedShot);

        // 샷 데이터를 sessionStorage에 저장
        sessionStorage.setItem(`shot_${shot.shot_id}`, JSON.stringify(extendedShot));

        // 모달 컨테이너 표시
        const modalContainer = document.getElementById('shotDetailModal');
        if (!modalContainer) return;

        // 기존 클릭 이벤트 제거를 위해 clone
        const newModalContainer = modalContainer.cloneNode(false);
        modalContainer.parentNode.replaceChild(newModalContainer, modalContainer);

        // 모달을 즉시 표시
        newModalContainer.style.display = 'flex';

        // 모달 컨테이너 생성
        newModalContainer.innerHTML = `
            <div class="shot-detail-modal-wrapper">
                <iframe id="shotDetailFrame"
                    src="../shot-detail.html?shotId=${shot.shot_id}"
                    style="width: 100%; height: 100%; border: none;">
                </iframe>
            </div>
        `;

        // iframe 로드 완료 후 Stage 1 데이터 전달
        const iframe = document.getElementById('shotDetailFrame');
        if (iframe) {
            iframe.onload = () => {
                const stage1Data = sessionStorage.getItem('stage1ParsedData');

                if (!stage1Data) {
                    console.log('Stage 1 데이터가 없습니다.');
                    return;
                }

                try {
                    const parsedData = JSON.parse(stage1Data);

                    // iframe 내부의 shotDetail 객체에 데이터 전달 시도
                    if (iframe.contentWindow && iframe.contentWindow.shotDetail) {
                        iframe.contentWindow.shotDetail.loadStage1JSON(parsedData);
                    }
                } catch (error) {
                    console.error('데이터 전달 오류:', error);
                }
            };
        }

        // ESC 키로 닫기 (한 번만 추가)
        document.addEventListener('keydown', this.handleEscKey);

        // 모달 외부 클릭시 닫기
        newModalContainer.addEventListener('click', (e) => {
            if (e.target === newModalContainer) {
                this.closeShotDetailModal();
            }
        });
    }

    handleEscKey = (e) => {
        if (e.key === 'Escape') {
            this.closeShotDetailModal();
        }
    }

    closeShotDetailModal() {
        const modalContainer = document.getElementById('shotDetailModal');
        if (modalContainer) {
            // iframe 완전히 제거
            const iframe = document.getElementById('shotDetailFrame');
            if (iframe && iframe.contentWindow) {
                // iframe 내부의 모든 타이머와 이벤트 정리
                try {
                    iframe.contentWindow.stop();
                } catch (e) {
                    // 크로스 오리진 오류 무시
                }
            }

            modalContainer.style.display = 'none';
            modalContainer.innerHTML = '';

            // 강제 가비지 컬렉션 힌트
            if (iframe) {
                iframe.src = 'about:blank';
            }

            // 초기화 플래그 리셋 (다음 모달 열기를 위해)
            window.shotDetailIframeInitialized = false;
            window.shotDetailScriptLoaded = false;

            // 블록별 매핑 플래그도 리셋
            if (iframe && iframe.contentWindow) {
                try {
                    iframe.contentWindow.isCharacterBlockMapped = false;
                    iframe.contentWindow.isLocationBlockMapped = false;
                    iframe.contentWindow.isPropsBlockMapped = false;
                } catch (e) {
                    // 크로스 오리진 오류 무시
                }
            }
        }
        document.removeEventListener('keydown', this.handleEscKey);
    }

    downloadMergedJSON() {
        if (!this.mergedData && !this.storyboardData) {
            this.showNotification('다운로드할 데이터가 없습니다.', 'error');
            return;
        }

        const dataToDownload = this.mergedData || this.storyboardData;
        const blob = new Blob([JSON.stringify(dataToDownload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');

        const title = dataToDownload.film_metadata?.title_working || 'storyboard';
        const filename = `${title}_storyboard_${new Date().toISOString().split('T')[0]}.json`;

        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('JSON 파일이 다운로드되었습니다.', 'success');
    }

    renderEmptyState() {
        const container = document.getElementById('storyboardGrid');
        if (!container) return;

        container.innerHTML = `
            <div class="empty-state">
                <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                    <polyline points="13 2 13 9 20 9"></polyline>
                </svg>
                <h3 class="empty-title">스토리보드가 없습니다</h3>
                <p class="empty-description">JSON 파일을 업로드하여 스토리보드를 생성하세요.</p>
            </div>
        `;
    }

    hideUploadSection() {
        const uploadSection = document.querySelector('.upload-section');
        if (uploadSection) {
            uploadSection.style.display = 'none';
        }
    }

    showControls() {
        const controls = document.querySelector('.storyboard-controls');
        if (controls) {
            controls.style.display = 'flex';
        }
    }

    saveToLocalStorage() {
        if (this.storyboardData) {
            localStorage.setItem('storyboardData', JSON.stringify(this.storyboardData));
        }
        if (this.mergedData) {
            localStorage.setItem('mergedData', JSON.stringify(this.mergedData));
        }
    }

    loadFromLocalStorage() {
        const savedMergedData = localStorage.getItem('mergedData');
        const savedData = localStorage.getItem('storyboardData');

        if (savedMergedData) {
            try {
                this.mergedData = JSON.parse(savedMergedData);
                this.storyboardData = this.mergedData;
                this.updateMetadata();
                this.populateSequenceDropdown();
                this.populateSceneDropdown();
                this.renderStoryboard();
                this.hideUploadSection();
                this.showControls();
            } catch (error) {
                console.error('Failed to load merged data:', error);
            }
        } else if (savedData) {
            try {
                this.storyboardData = JSON.parse(savedData);
                this.populateSceneDropdown();
                this.renderStoryboard();
                this.hideUploadSection();
                this.showControls();
            } catch (error) {
                console.error('Failed to load saved storyboard data:', error);
            }
        }
    }

    clearStoryboard() {
        if (!confirm('모든 데이터가 삭제됩니다. 계속하시겠습니까?')) return;

        this.storyboardData = null;
        this.mergedData = null;
        this.currentSequence = null;
        this.currentScene = null;
        this.currentShot = null;
        this.uploadedFiles.clear();
        localStorage.removeItem('storyboardData');
        localStorage.removeItem('mergedData');

        // Reset UI
        const uploadSection = document.querySelector('.upload-section');
        if (uploadSection) {
            uploadSection.style.display = 'block';
        }

        const controls = document.querySelector('.storyboard-controls');
        if (controls) {
            controls.style.display = 'none';
        }

        const metadataSection = document.getElementById('filmMetadata');
        if (metadataSection) {
            metadataSection.style.display = 'none';
        }

        this.renderEmptyState();
        this.showNotification('모든 데이터가 초기화되었습니다.', 'info');
    }

    checkInitialData() {
        // Check if there's no saved data
        if (!this.storyboardData && !this.mergedData) {
            const controls = document.querySelector('.storyboard-controls');
            if (controls) {
                controls.style.display = 'none';
            }
        }
    }

    showNotification(message, type = 'info') {
        // 토스트 알림 구현
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'error' ? '#ff4444' : type === 'success' ? '#44ff44' : '#4444ff'};
            color: white;
            border-radius: 8px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // 이전 processStoryboardData 메서드 유지 (하위 호환성)
    processStoryboardData(data) {
        // Validate data structure
        if (!data.scenes || !Array.isArray(data.scenes)) {
            this.showNotification('올바른 스토리보드 JSON 형식이 아닙니다.', 'error');
            return;
        }

        this.storyboardData = data;
        this.saveToLocalStorage();
        this.populateSceneDropdown();
        this.renderStoryboard();
        this.hideUploadSection();
        this.showControls();
    }
}

// Add CSS for notifications
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
`;
document.head.appendChild(style);

// Initialize Storyboard Manager
const storyboardManager = new StoryboardManager();

// Export for global access
// Toggle scene description function
window.toggleSceneDescription = function(button) {
    const wrapper = button.parentElement;
    const description = wrapper.querySelector('.scene-description');
    const toggleText = button.querySelector('.toggle-text');
    const toggleIcon = button.querySelector('.toggle-icon');

    if (description.classList.contains('collapsed')) {
        // Expand
        const fullText = description.getAttribute('data-full');
        description.textContent = fullText;
        description.classList.remove('collapsed');
        description.classList.add('expanded');
        toggleText.textContent = '접기';
        toggleIcon.style.transform = 'rotate(180deg)';
    } else {
        // Collapse
        const fullText = description.getAttribute('data-full');
        description.textContent = fullText.substring(0, 20) + '...';
        description.classList.remove('expanded');
        description.classList.add('collapsed');
        toggleText.textContent = '더 보기';
        toggleIcon.style.transform = 'rotate(0deg)';
    }
};

window.storyboardManager = storyboardManager;

// Scenario Modal Functions
window.openScenarioModal = function() {
    const modal = document.getElementById('scenarioModal');
    if (!modal) return;

    // Get merged data or storyboard data
    const data = storyboardManager.mergedData || storyboardManager.storyboardData;

    if (!data) {
        storyboardManager.showNotification('시나리오 데이터가 없습니다. JSON 파일을 먼저 업로드해주세요.', 'error');
        return;
    }

    // Populate modal with data
    populateScenarioModal(data);

    // Show modal
    modal.style.display = 'block';
};

window.closeScenarioModal = function() {
    const modal = document.getElementById('scenarioModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

window.showScenarioTab = function(tabName) {
    // Update tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.includes(getTabLabel(tabName))) {
            btn.classList.add('active');
        }
    });

    // Show selected tab content
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.remove('active');
    });

    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
};

function getTabLabel(tabName) {
    const labels = {
        'overview': '개요',
        'treatment': '트리트먼트',
        'scenario': '시나리오',
        'shots': '샷 리스트'
    };
    return labels[tabName] || tabName;
}

function populateScenarioModal(data) {
    // Get Stage 1 data if available
    const stage1Data = data.stage1_original || data;

    // Populate Overview Tab
    if (stage1Data.current_work) {
        // Logline
        const loglineEl = document.getElementById('scenario-logline');
        if (loglineEl && stage1Data.current_work.logline) {
            loglineEl.textContent = stage1Data.current_work.logline;
        }

        // Synopsis
        if (stage1Data.current_work.synopsis) {
            const synopsis = stage1Data.current_work.synopsis;

            const act1El = document.getElementById('scenario-act1');
            if (act1El && synopsis.act1) {
                act1El.textContent = synopsis.act1;
            }

            const act2El = document.getElementById('scenario-act2');
            if (act2El && synopsis.act2) {
                act2El.textContent = synopsis.act2;
            }

            const act3El = document.getElementById('scenario-act3');
            if (act3El && synopsis.act3) {
                act3El.textContent = synopsis.act3;
            }
        }
    }

    // Populate Treatment Tab
    const treatmentContent = document.getElementById('treatment-content');
    if (treatmentContent) {
        treatmentContent.innerHTML = '';

        const treatment = stage1Data.current_work?.treatment || data.treatment;
        if (treatment && treatment.sequences) {
            treatment.sequences.forEach(seq => {
                const seqDiv = document.createElement('div');
                seqDiv.className = 'treatment-sequence';
                seqDiv.innerHTML = `
                    <h4>${seq.sequence_id}: ${seq.sequence_title}</h4>
                    <div class="sequence-function">${seq.narrative_function || ''}</div>
                    <div class="scenario-text">${seq.treatment_text || ''}</div>
                `;
                treatmentContent.appendChild(seqDiv);
            });
        }
    }

    // Populate Scenario Tab
    const scenarioContent = document.getElementById('scenario-content');
    if (scenarioContent) {
        scenarioContent.innerHTML = '';

        // Get scenes from Stage 1
        const scenes = stage1Data.current_work?.scenario?.scenes || data.scenes || [];

        scenes.forEach(scene => {
            const sceneDiv = document.createElement('div');
            sceneDiv.className = 'scene-item';

            // Scene header with scene number
            const sceneTitle = scene.scene_title || scene.scenario_text?.split('\n')[0] || `Scene ${scene.scene_number}`;

            sceneDiv.innerHTML = `
                <h4>
                    <span class="scene-number">${scene.scene_id || `S${scene.scene_number}`}</span>
                    ${sceneTitle}
                </h4>
                <div class="scenario-text">${scene.scenario_text || scene.scene_scenario || ''}</div>
            `;
            scenarioContent.appendChild(sceneDiv);
        });
    }

    // Populate Shots Tab
    const shotsContent = document.getElementById('shots-content');
    if (shotsContent) {
        shotsContent.innerHTML = '';

        // Get Stage 2 scenes with shots
        const stage2Scenes = data.scenes || [];

        stage2Scenes.forEach(scene => {
            if (scene.shots && scene.shots.length > 0) {
                // Create scene section
                const sceneSection = document.createElement('div');
                sceneSection.className = 'scene-section';
                sceneSection.innerHTML = `<h3>${scene.scene_id}: ${scene.scene_title}</h3>`;

                // Add shots for this scene
                scene.shots.forEach(shot => {
                    const shotDiv = document.createElement('div');
                    shotDiv.className = 'shot-item';

                    const cameraMovement = shot.camera_movement || {};

                    shotDiv.innerHTML = `
                        <div class="shot-header">
                            <span class="shot-id">${shot.shot_id}</span>
                            <div class="shot-meta">
                                <span class="shot-type">${shot.shot_type || 'regular'}</span>
                                <span class="camera-type">${cameraMovement.type || 'static'}</span>
                            </div>
                        </div>
                        <div class="shot-text">${shot.shot_text || ''}</div>
                        ${cameraMovement.type ? `
                            <div class="shot-movement">
                                카메라: ${cameraMovement.type} |
                                시간: ${cameraMovement.duration || 'N/A'} |
                                속도: ${cameraMovement.speed || 'normal'}
                            </div>
                        ` : ''}
                    `;
                    sceneSection.appendChild(shotDiv);
                });

                shotsContent.appendChild(sceneSection);
            }
        });
    }
}

// Copy all scenario content
window.copyAllScenario = function() {
    const data = storyboardManager.mergedData || storyboardManager.storyboardData;
    if (!data) return;

    let fullText = '=== 시나리오 전체 내용 ===\n\n';

    // Get Stage 1 data
    const stage1Data = data.stage1_original || data;

    // Add Logline
    if (stage1Data.current_work?.logline) {
        fullText += '## 로그라인\n' + stage1Data.current_work.logline + '\n\n';
    }

    // Add Synopsis
    if (stage1Data.current_work?.synopsis) {
        const synopsis = stage1Data.current_work.synopsis;
        fullText += '## 시놉시스\n';
        if (synopsis.act1) fullText += '### Act 1\n' + synopsis.act1 + '\n\n';
        if (synopsis.act2) fullText += '### Act 2\n' + synopsis.act2 + '\n\n';
        if (synopsis.act3) fullText += '### Act 3\n' + synopsis.act3 + '\n\n';
    }

    // Add Treatment
    const treatment = stage1Data.current_work?.treatment || data.treatment;
    if (treatment?.sequences) {
        fullText += '## 트리트먼트\n';
        treatment.sequences.forEach(seq => {
            fullText += `### ${seq.sequence_id}: ${seq.sequence_title}\n`;
            fullText += `[${seq.narrative_function || ''}]\n`;
            fullText += `${seq.treatment_text || ''}\n\n`;
        });
    }

    // Add Scenarios
    const scenes = stage1Data.current_work?.scenario?.scenes || [];
    if (scenes.length > 0) {
        fullText += '## 시나리오\n';
        scenes.forEach(scene => {
            fullText += `### ${scene.scene_id || `S${scene.scene_number}`}\n`;
            fullText += `${scene.scenario_text || ''}\n\n`;
        });
    }

    // Add Shots
    const stage2Scenes = data.scenes || [];
    let hasShots = false;
    stage2Scenes.forEach(scene => {
        if (scene.shots && scene.shots.length > 0) {
            if (!hasShots) {
                fullText += '## 샷 리스트\n';
                hasShots = true;
            }
            fullText += `### ${scene.scene_id}: ${scene.scene_title}\n`;
            scene.shots.forEach(shot => {
                fullText += `- ${shot.shot_id} [${shot.shot_type || 'regular'}]: ${shot.shot_text}\n`;
                if (shot.camera_movement) {
                    fullText += `  카메라: ${shot.camera_movement.type} (${shot.camera_movement.duration || 'N/A'})\n`;
                }
            });
            fullText += '\n';
        }
    });

    // Copy to clipboard
    navigator.clipboard.writeText(fullText).then(() => {
        storyboardManager.showNotification('시나리오가 클립보드에 복사되었습니다.', 'success');
    }).catch(err => {
        console.error('복사 실패:', err);
        storyboardManager.showNotification('복사에 실패했습니다.', 'error');
    });
};

// Download scenario as text file
window.downloadScenario = function() {
    const data = storyboardManager.mergedData || storyboardManager.storyboardData;
    if (!data) return;

    let fullText = '';

    // Get Stage 1 data
    const stage1Data = data.stage1_original || data;

    // Add metadata
    if (data.film_metadata) {
        fullText += `제목: ${data.film_metadata.title_working || '제목 없음'}\n`;
        fullText += `장르: ${data.film_metadata.genre || '미정'}\n`;
        fullText += `러닝타임: ${data.film_metadata.duration_minutes || '미정'}분\n`;
        fullText += '=' .repeat(50) + '\n\n';
    }

    // Add Logline
    if (stage1Data.current_work?.logline) {
        fullText += '# 로그라인\n' + stage1Data.current_work.logline + '\n\n';
    }

    // Add Synopsis
    if (stage1Data.current_work?.synopsis) {
        const synopsis = stage1Data.current_work.synopsis;
        fullText += '# 시놉시스\n\n';
        if (synopsis.act1) fullText += '## Act 1\n' + synopsis.act1 + '\n\n';
        if (synopsis.act2) fullText += '## Act 2\n' + synopsis.act2 + '\n\n';
        if (synopsis.act3) fullText += '## Act 3\n' + synopsis.act3 + '\n\n';
    }

    // Add Treatment
    const treatment = stage1Data.current_work?.treatment || data.treatment;
    if (treatment?.sequences) {
        fullText += '# 트리트먼트\n\n';
        treatment.sequences.forEach(seq => {
            fullText += `## ${seq.sequence_id}: ${seq.sequence_title}\n`;
            fullText += `기능: ${seq.narrative_function || ''}\n\n`;
            fullText += `${seq.treatment_text || ''}\n\n`;
        });
    }

    // Add Scenarios
    const scenes = stage1Data.current_work?.scenario?.scenes || [];
    if (scenes.length > 0) {
        fullText += '# 시나리오\n\n';
        scenes.forEach(scene => {
            fullText += `## ${scene.scene_id || `S${scene.scene_number}`}\n`;
            fullText += `${scene.scenario_text || ''}\n\n`;
            fullText += '-'.repeat(50) + '\n\n';
        });
    }

    // Add Shots if available
    const stage2Scenes = data.scenes || [];
    let hasShots = false;
    stage2Scenes.forEach(scene => {
        if (scene.shots && scene.shots.length > 0) {
            if (!hasShots) {
                fullText += '# 샷 리스트\n\n';
                hasShots = true;
            }
            fullText += `## ${scene.scene_id}: ${scene.scene_title}\n\n`;
            scene.shots.forEach(shot => {
                fullText += `### ${shot.shot_id}\n`;
                fullText += `타입: ${shot.shot_type || 'regular'}\n`;
                fullText += `내용: ${shot.shot_text}\n`;
                if (shot.camera_movement) {
                    fullText += `카메라: ${shot.camera_movement.type} (${shot.camera_movement.duration || 'N/A'})\n`;
                }
                fullText += '\n';
            });
            fullText += '-'.repeat(50) + '\n\n';
        }
    });

    // Create blob and download
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    const title = data.film_metadata?.title_working || 'scenario';
    const filename = `${title}_scenario_${new Date().toISOString().split('T')[0]}.txt`;

    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    storyboardManager.showNotification('시나리오 텍스트 파일이 다운로드되었습니다.', 'success');
};