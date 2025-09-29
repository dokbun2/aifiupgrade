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
                const data = JSON.parse(e.target.result);
                await this.processUploadedFile(file.name, data);
            } catch (error) {
                this.showNotification('JSON 파일 파싱 오류: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
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
            return 'stage1';
        }
        // stage1 타입 감지 (current_work.treatment.sequences 구조)
        else if (data.current_work && data.current_work.treatment && data.current_work.scenario) {
            return 'stage1';
        }
        // concept_art 타입 감지
        else if (data.film_metadata && data.treatment && data.scenarios) {
            return 'concept_art';
        }
        // stage2 타입 감지
        else if (data.scenes && Array.isArray(data.scenes)) {
            return 'stage2';
        }
        // 기본 스토리보드 타입
        else if (data.storyboard || data.shots) {
            return 'storyboard';
        }
        return 'unknown';
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
                    appearance_summary: char.appearance_summary || null,
                    voice_style: char.voice_style || null
                };

                // Store the character data
                conceptArtData.characters.push(charData);

                // Store the blocks as prompts for this character
                conceptArtData.prompts[char.id] = {
                    id: char.id,
                    type: 'character',
                    ...char.blocks,
                    appearance_summary: char.appearance_summary || null,
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
                    appearance_summary: loc.appearance_summary || null,
                    voice_style: loc.voice_style || null
                };

                conceptArtData.locations.push(locData);

                conceptArtData.prompts[loc.id] = {
                    id: loc.id,
                    type: 'location',
                    ...loc.blocks,
                    appearance_summary: loc.appearance_summary || null,
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
                    appearance_summary: prop.appearance_summary || null,
                    voice_style: prop.voice_style || null
                };

                conceptArtData.props.push(propData);

                conceptArtData.prompts[prop.id] = {
                    id: prop.id,
                    type: 'props',
                    ...prop.blocks,
                    appearance_summary: prop.appearance_summary || null,
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
        sceneHeader.innerHTML = `
            <h2 class="scene-title">${scene.scene_id}: ${scene.scene_title}${sequenceInfo}</h2>
            <p class="scene-description">${scene.scene_scenario ? scene.scene_scenario.substring(0, 150) + '...' : ''}</p>
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

    createShotCard(shot) {
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
                <span class="${typeClass}">${typeLabel}</span>
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
                    <span class="card-tag">PT북사</span>
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
                    this.handleTagClick(tag, shot);
                }
                return;
            }
            this.showShotDetails(shot);
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
            case 'PT북사':
                console.log('PT book copy for shot:', shot.shot_id);
                this.copyToPTBook(shot);
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

    copyToPTBook(shot) {
        // Copy shot information to clipboard in PT format
        const ptText = `Shot ID: ${shot.shot_id}\nType: ${shot.shot_type || 'regular'}\n${shot.shot_text || shot.shot_summary || ''}`;
        navigator.clipboard.writeText(ptText).then(() => {
            this.showNotification('PT북사에 복사되었습니다.', 'success');
        }).catch(err => {
            console.error('Failed to copy:', err);
            this.showNotification('복사 실패', 'error');
        });
    }

    editShotBlock(shot) {
        // 샷 데이터를 sessionStorage에 저장
        sessionStorage.setItem(`shot_${shot.shot_id}`, JSON.stringify(shot));

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
        // 샷 데이터를 sessionStorage에 저장
        sessionStorage.setItem(`shot_${shot.shot_id}`, JSON.stringify(shot));

        // 모달 컨테이너 표시
        const modalContainer = document.getElementById('shotDetailModal');
        if (!modalContainer) return;

        // 모달 컨테이너 생성
        modalContainer.innerHTML = `
            <div class="shot-detail-modal-wrapper">
                <iframe id="shotDetailFrame"
                    src="../shot-detail.html?shotId=${shot.shot_id}"
                    style="width: 100%; height: 100%; border: none;">
                </iframe>
            </div>
        `;

        // 모달 표시
        modalContainer.style.display = 'flex';

        // ESC 키로 닫기
        document.addEventListener('keydown', this.handleEscKey);

        // 모달 외부 클릭시 닫기
        modalContainer.addEventListener('click', (e) => {
            if (e.target === modalContainer) {
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
            modalContainer.style.display = 'none';
            modalContainer.innerHTML = '';
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
window.storyboardManager = storyboardManager;