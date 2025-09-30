// Shot Detail Modal JavaScript

// Stage 1 JSON 파서 스크립트 로드
const script1 = document.createElement('script');
script1.src = '../js/stage1-parser.js';
document.head.appendChild(script1);

// Stage 2 JSON 파서 스크립트 로드
const script2 = document.createElement('script');
script2.src = '../js/stage2-parser.js';
document.head.appendChild(script2);

// 이미지 업로드 관리
const imageUploadManager = {
    maxImages: 5,
    uploadedImages: [],

    init() {
        const imageInput = document.getElementById('imageUploadInput');
        const container = document.querySelector('.image-preview-container');
        const placeholder = document.getElementById('uploadPlaceholder');

        // 파일 선택 이벤트
        if (imageInput) {
            imageInput.addEventListener('change', (e) => this.handleImageSelect(e));
        }

        // 드래그 앤 드롭 이벤트
        if (container) {
            container.addEventListener('dragover', (e) => this.handleDragOver(e));
            container.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            container.addEventListener('drop', (e) => this.handleDrop(e));
        }

        // 플레이스홀더 클릭 시 파일 선택
        if (placeholder) {
            placeholder.addEventListener('click', () => {
                imageInput?.click();
            });
        }
    },

    handleImageSelect(e) {
        const files = Array.from(e.target.files);
        this.addImages(files);
    },

    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    },

    handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over');
    },

    handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');

        const files = Array.from(e.dataTransfer.files);
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        this.addImages(imageFiles);
    },

    addImages(files) {
        const remainingSlots = this.maxImages - this.uploadedImages.length;
        const filesToAdd = files.slice(0, remainingSlots);

        if (filesToAdd.length === 0) {
            alert(`최대 ${this.maxImages}개까지만 업로드할 수 있습니다.`);
            return;
        }

        filesToAdd.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageData = {
                    id: Date.now() + Math.random(),
                    src: e.target.result,
                    name: file.name
                };
                this.uploadedImages.push(imageData);
                this.renderImages();
            };
            reader.readAsDataURL(file);
        });
    },

    renderImages() {
        const grid = document.getElementById('imagePreviewGrid');
        if (!grid) return;

        grid.innerHTML = '';

        this.uploadedImages.forEach((image, index) => {
            const item = document.createElement('div');
            item.className = 'image-preview-item';
            item.innerHTML = `
                <img src="${image.src}" alt="${image.name}">
                <span class="image-number">#${index + 1}</span>
                <button class="image-remove-btn" onclick="imageUploadManager.removeImage(${image.id})">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            `;
            grid.appendChild(item);
        });

        // 플레이스홀더 표시/숨김
        const placeholder = document.getElementById('uploadPlaceholder');
        if (placeholder) {
            placeholder.style.display = this.uploadedImages.length === 0 ? 'flex' : 'none';
        }
    },

    removeImage(id) {
        this.uploadedImages = this.uploadedImages.filter(img => img.id !== id);
        this.renderImages();
    },

    clearAll() {
        this.uploadedImages = [];
        this.renderImages();
    }
};

// 전체 이미지 삭제 함수
window.clearAllImages = function() {
    if (confirm('모든 이미지를 삭제하시겠습니까?')) {
        imageUploadManager.clearAll();
    }
};

// 샷 상세 데이터 관리
const shotDetailManager = {
    currentShot: null,
    currentTab: 'basic',
    stage1Data: null, // Stage 1 JSON 데이터 저장

    // 샷 데이터 구조
    shotData: {
        id: 'S01.01.01',
        type: 'REGULAR',
        text: '햇살이 먼지처럼 부유하는 낡은 부엌.',
        camera: 'dolly_in',
        duration: '6s',
        blocks: {
            basic: {
                style: '',
                artist: '',
                medium: '',
                genre: '',
                era: '',
                quality: '',
                parameter: ''
            },
            scene: {
                scene: '',
                camera: '',
                camera_tech: ''
            },
            character: {
                characters: []
            },
            location: {
                location: '',
                atmosphere: '',
                color_tone: '',
                scale: '',
                architecture: '',
                material: '',
                object: '',
                weather: '',
                natural_light: '',
                artificial_light: ''
            },
            props: {
                props_detail: '',
                lighting: '',
                foreground: '',
                midground: '',
                background: '',
                left_side: '',
                right_side: '',
                ceiling_sky: '',
                floor_ground: ''
            }
        },
        prompts: {
            basic: '',
            scene: '',
            character: '',
            location: '',
            props: ''
        },
        requests: []
    }
};

// 업로드된 이미지 관리
let uploadedImages = [];
let selectedImageIndex = 0;

// 초기화 플래그
let isInitialized = false;

// START 버튼 클릭 시 디폴트 값 설정
function setStartDefaults() {
    // 기본 블록 디폴트 값
    const basicDefaults = {
        genre: 'drama',
        mood: 'warm',
        shot_size: 'medium',
        shot_angle: 'eye-level',
        shot_movement: 'static',
        depth_of_field: 'normal',
        focus: 'center',
        lighting: 'natural',
        time_of_day: 'morning',
        weather: 'clear',
        season: 'spring'
    };

    // 연출 블록 디폴트 값
    const sceneDefaults = {
        color_palette: 'warm-tones',
        contrast: 'normal',
        saturation: 'normal',
        tone: 'bright',
        texture: 'smooth',
        pattern: 'none',
        visual_effects: 'none',
        special_effects: 'none',
        transition_in: 'fade-in',
        transition_out: 'fade-out',
        timeline_duration: '3'
    };

    // 캐릭터 블록 디폴트
    const characterDefaults = {
        age: 'young-adult',
        gender: 'neutral',
        ethnicity: 'asian',
        body_type: 'average',
        hair_style: 'short',
        hair_color: 'black',
        clothing_style: 'casual',
        clothing_color: 'neutral'
    };

    // 장소 블록 디폴트
    const locationDefaults = {
        type: 'interior',
        specific: 'home',
        architecture: 'modern',
        size: 'medium',
        condition: 'clean',
        decoration: 'minimal'
    };

    // 소품 블록 디폴트
    const propsDefaults = ['furniture', 'electronics'];

    // 값 적용
    applyDefaultValues('basic', basicDefaults);
    applyDefaultValues('scene', sceneDefaults);
    applyDefaultValues('character', characterDefaults);
    applyDefaultValues('location', locationDefaults);
    applyPropsDefaults(propsDefaults);

    showNotification('START 기본값이 적용되었습니다.', 'success');
}

// END 버튼 클릭 시 변경된 값 설정
function setEndDefaults() {
    // 기본 블록 변경된 값
    const basicDefaults = {
        genre: 'thriller',
        mood: 'dark',
        shot_size: 'close-up',
        shot_angle: 'low-angle',
        shot_movement: 'tracking',
        depth_of_field: 'shallow',
        focus: 'selective',
        lighting: 'dramatic',
        time_of_day: 'night',
        weather: 'rain',
        season: 'winter'
    };

    // 연출 블록 변경된 값
    const sceneDefaults = {
        color_palette: 'cool-tones',
        contrast: 'high',
        saturation: 'desaturated',
        tone: 'dark',
        texture: 'gritty',
        pattern: 'geometric',
        visual_effects: 'blur',
        special_effects: 'smoke',
        transition_in: 'cut',
        transition_out: 'fade-to-black',
        timeline_duration: '5'
    };

    // 캐릭터 블록 변경
    const characterDefaults = {
        age: 'middle-aged',
        gender: 'male',
        ethnicity: 'caucasian',
        body_type: 'athletic',
        hair_style: 'long',
        hair_color: 'gray',
        clothing_style: 'formal',
        clothing_color: 'dark'
    };

    // 장소 블록 변경
    const locationDefaults = {
        type: 'exterior',
        specific: 'street',
        architecture: 'urban',
        size: 'large',
        condition: 'worn',
        decoration: 'industrial'
    };

    // 소품 블록 변경
    const propsDefaults = ['vehicles', 'weapons', 'technology'];

    // 값 적용
    applyDefaultValues('basic', basicDefaults);
    applyDefaultValues('scene', sceneDefaults);
    applyDefaultValues('character', characterDefaults);
    applyDefaultValues('location', locationDefaults);
    applyPropsDefaults(propsDefaults);

    showNotification('END 변경값이 적용되었습니다.', 'success');
}

// 디폴트 값 적용 헬퍼 함수
function applyDefaultValues(blockType, values) {
    Object.keys(values).forEach(key => {
        // 셀렉트 요소 찾기
        const selectElement = document.querySelector(`[data-block="${blockType}"] select[data-field="${key}"],
                                                     .tab-pane[data-tab="${blockType}"] select[data-field="${key}"],
                                                     select[name="${key}"]`);
        if (selectElement) {
            selectElement.value = values[key];
            // 이벤트 발생시켜 UI 업데이트
            selectElement.dispatchEvent(new Event('change'));
        }

        // 입력 필드 찾기
        const inputElement = document.querySelector(`[data-block="${blockType}"] input[data-field="${key}"],
                                                    .tab-pane[data-tab="${blockType}"] input[data-field="${key}"],
                                                    input[name="${key}"]`);
        if (inputElement) {
            inputElement.value = values[key];
            inputElement.dispatchEvent(new Event('input'));
        }
    });
}

// 소품 디폴트 적용 함수
function applyPropsDefaults(props) {
    // 모든 체크박스 해제
    const allCheckboxes = document.querySelectorAll('.props-options input[type="checkbox"]');
    allCheckboxes.forEach(cb => {
        cb.checked = false;
    });

    // 선택된 소품 체크
    props.forEach(prop => {
        const checkbox = document.querySelector(`.props-options input[value="${prop}"]`);
        if (checkbox) {
            checkbox.checked = true;
            checkbox.dispatchEvent(new Event('change'));
        }
    });
}

// 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 중복 초기화 방지
    if (isInitialized) return;
    isInitialized = true;

    try {
        initializeTabs();
        initializeFormEvents();
        initializeImageUpload();
        initializeBasicBlockLabels();
        initializeScrollSync();
        loadShotData();

        // localStorage에서 캐시된 film_metadata 로드
        loadCachedFilmMetadata();

        // URL 파라미터에서 샷 ID 가져오기
        const urlParams = new URLSearchParams(window.location.search);
        const shotId = urlParams.get('shotId');
        if (shotId) {
            loadShotById(shotId);
        }
    } catch (error) {
        console.error('초기화 중 오류:', error);
    }
});

// 탭 네비게이션 초기화
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn:not(.tab-action-btn)');
    const actionButtons = document.querySelectorAll('.tab-action-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    // 초기 상태 설정: 첫 번째 탭만 활성화
    if (tabButtons.length > 0 && tabPanes.length > 0) {
        // 모든 탭 비활성화
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));

        // 첫 번째 탭 활성화
        tabButtons[0].classList.add('active');
        const firstTabName = tabButtons[0].getAttribute('data-tab');
        const firstPane = document.querySelector(`.tab-pane[data-tab="${firstTabName}"]`);
        if (firstPane) {
            firstPane.classList.add('active');
        }
    }

    // 일반 탭 버튼 이벤트
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');

            // 모든 탭 비활성화
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));

            // 선택한 탭 활성화
            this.classList.add('active');
            document.querySelector(`.tab-pane[data-tab="${targetTab}"]`).classList.add('active');

            // 현재 탭 저장
            shotDetailManager.currentTab = targetTab;

            // 타임라인 섹션 표시/숨김 (연출 블록에서만 표시)
            const timelineSection = document.querySelector('.timeline-section');
            if (timelineSection) {
                timelineSection.style.display = targetTab === 'scene' ? 'block' : 'none';
            }
        });
    });

    // START/END 액션 버튼 이벤트
    actionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            if (action === 'start') {
                setStartDefaults();
                this.classList.add('active');
                document.querySelector('.tab-action-btn[data-action="end"]').classList.remove('active');
            } else if (action === 'end') {
                setEndDefaults();
                this.classList.add('active');
                document.querySelector('.tab-action-btn[data-action="start"]').classList.remove('active');
            }
        });
    });
}

// 기본 블록 라벨 초기화 (모든 블록이 표시되므로 선택 로직 불필요)
function initializeBasicBlockLabels() {
    // 라벨 클릭시 해당 행 하이라이트 효과만 추가
    const labelItems = document.querySelectorAll('.labels-column .label-item');

    labelItems.forEach(item => {
        item.addEventListener('click', function() {
            const blockType = this.getAttribute('data-block');

            // 해당하는 프롬프트 행과 요청 행에 포커스 효과
            const promptRow = document.querySelector(`.prompt-row-item[data-block="${blockType}"]`);
            const requestRow = document.querySelector(`.request-row-item[data-block="${blockType}"]`);

            if (promptRow) {
                promptRow.querySelector('.prompt-input')?.focus();
            }
        });
    });
}

// 스크롤 동기화 초기화
function initializeScrollSync() {
    // 모든 탭 패널에 대해 스크롤 동기화 설정
    document.querySelectorAll('.tab-pane').forEach(tabPane => {
        const labelList = tabPane.querySelector('.label-list');
        const promptBlocks = tabPane.querySelector('.prompt-blocks');
        const requestBlocks = tabPane.querySelector('.request-blocks');

        if (!labelList || !promptBlocks || !requestBlocks) return;

        let syncRAF = null;

        // 부드러운 스크롤 동기화 함수
        const syncScroll = (scrollTop) => {
            // 이전 애니메이션 프레임 취소
            if (syncRAF) {
                cancelAnimationFrame(syncRAF);
            }

            // requestAnimationFrame을 사용하여 부드럽게 동기화
            syncRAF = requestAnimationFrame(() => {
                labelList.scrollTop = scrollTop;
                promptBlocks.scrollTop = scrollTop;
                requestBlocks.scrollTop = scrollTop;
            });
        };

        // 오른쪽 컬럼(스크롤바 있는 컬럼)의 스크롤 이벤트만 감지
        requestBlocks.addEventListener('scroll', function() {
            syncScroll(this.scrollTop);
        });

        // 왼쪽과 중간 컬럼에서 휠 이벤트 발생시 오른쪽 컬럼으로 전달
        [labelList, promptBlocks].forEach(element => {
            element.addEventListener('wheel', function(e) {
                // Ctrl/Cmd 키가 눌려있으면 줌 동작이므로 무시
                if (e.ctrlKey || e.metaKey) return;

                // 기본 동작 방지
                e.preventDefault();

                // 스크롤을 오른쪽 컬럼으로 전달
                const delta = e.deltaY || e.detail || e.wheelDelta;
                requestBlocks.scrollTop += delta;
            }, { passive: false });
        });
    });
}

// 폼 이벤트 초기화
function initializeFormEvents() {
    // 프롬프트 태그 클릭 이벤트
    document.querySelectorAll('.prompt-tag').forEach(tag => {
        tag.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.toggle('active');
        });
    });

    // 생성 버튼 클릭 이벤트
    const generateBtn = document.querySelector('.generate-btn');
    if (generateBtn) {
        generateBtn.addEventListener('click', generatePrompt);
    }

    // 복사 버튼 클릭 이벤트
    const copyBtn = document.querySelector('.copy-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', copyPrompt);
    }

    // 저장 버튼 클릭 이벤트
    const saveBtn = document.querySelector('.save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveShotData);
    }

    // 이미지 생성 버튼 (존재하는 경우에만)
    const generateImageBtn = document.querySelector('.generate-image-btn');
    if (generateImageBtn) {
        generateImageBtn.addEventListener('click', generateImage);
    }

    // 타임라인 버튼
    document.querySelectorAll('.timeline-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.timeline-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // 소품 복사 버튼
    const copyPropsBtn = document.querySelector('.copy-props-btn');
    if (copyPropsBtn) {
        copyPropsBtn.addEventListener('click', copyPropsData);
    }

    // 입력 필드 변경 감지 (안전하게 처리)
    document.querySelectorAll('.prompt-input').forEach(input => {
        if (input) {
            // 디바운스를 위한 타이머
            let debounceTimer;

            input.addEventListener('input', function(e) {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    updatePromptPreview();
                }, 300); // 300ms 지연
            });

            input.addEventListener('change', updatePromptPreview);
        }
    });

    // 드롭다운 및 입력 필드 변경 감지 (존재하는 경우만)
    document.querySelectorAll('.prompt-dropdown, .request-dropdown, .request-input').forEach(element => {
        if (element) {
            const eventType = element.tagName === 'SELECT' ? 'change' : 'input';
            element.addEventListener(eventType, updatePromptPreview);
        }
    });

    // 파싱 버튼 (존재하는 경우만)
    const fileBtn = document.querySelector('.file-btn');
    if (fileBtn) {
        fileBtn.addEventListener('click', parseFileData);
    }
}

// 샷 데이터 로드
function loadShotData() {
    // 로컬 스토리지 또는 서버에서 데이터 로드
    const savedData = localStorage.getItem('currentShotData');
    if (savedData) {
        const data = JSON.parse(savedData);
        shotDetailManager.shotData = data;
        populateForm(data);
    }
}

// 특정 샷 ID로 데이터 로드
function loadShotById(shotId) {
    // 스토리보드에서 전달된 데이터 로드
    const shotData = sessionStorage.getItem(`shot_${shotId}`);
    if (shotData) {
        const data = JSON.parse(shotData);
        shotDetailManager.shotData = data;

        // 병합된 데이터가 있으면 현재 샷에 맞는 데이터 추출
        if (data.merged_data) {
            extractAndMapShotSpecificData(data);
        }

        populateForm(data);

        // 헤더 업데이트
        document.querySelector('.shot-id').textContent = data.id || data.shot_id;
    }
}

// 현재 샷에 해당하는 시퀀스/씬 데이터 추출 및 매칭
function extractAndMapShotSpecificData(shotData) {
    const mergedData = shotData.merged_data;

    // Stage 1 데이터가 있으면 파싱
    if (mergedData.stage1_original || mergedData.visual_blocks || mergedData.film_metadata) {
        const stage1Data = mergedData.stage1_original || mergedData;

        // film_metadata가 있으면 기본블록에 매핑
        if (stage1Data.film_metadata) {
            mapFilmMetadataToBasicBlock(stage1Data.film_metadata);
            // localStorage에 캐시 저장
            cacheFilmMetadata(stage1Data.film_metadata);
        }

        // Stage1JSONParser를 사용하여 데이터 파싱
        if (window.stage1Parser) {
            window.stage1Parser.data = stage1Data;
            window.stage1Parser.parseAllBlocks();
            const parsedData = window.stage1Parser.parsedData;

            // 현재 샷의 씬/시퀀스에 해당하는 데이터 찾기
            const currentSequenceId = shotData.sequence_id;
            const currentSceneId = shotData.scene_id;

            // 시퀀스에서 해당 데이터 찾기
            let sequenceData = null;
            if (parsedData.direction && parsedData.direction.sequences) {
                sequenceData = parsedData.direction.sequences.find(seq =>
                    seq.sequence_id === currentSequenceId
                );
            }

            // 씬에서 해당 데이터 찾기
            let sceneData = null;
            if (parsedData.direction && parsedData.direction.scenes) {
                sceneData = parsedData.direction.scenes.find(scene =>
                    scene.scene_id === currentSceneId ||
                    scene.sequence_id === currentSequenceId
                );
            }

            // 각 블록에 매칭
            mapStage1DataToBlocks(parsedData);

            console.log(`✅ 샷 ${shotData.shot_id}에 대한 데이터 매칭 완료`);
            console.log('  - Sequence:', currentSequenceId, sequenceData);
            console.log('  - Scene:', currentSceneId, sceneData);
        }
    }
}

// 폼에 데이터 채우기
function populateForm(data) {
    // 기본 정보 업데이트
    document.querySelector('.shot-id').textContent = data.id;

    // 각 탭의 입력 필드 채우기
    if (data.blocks) {
        // 기본 블록
        if (data.blocks.basic) {
            Object.keys(data.blocks.basic).forEach(key => {
                const input = document.querySelector(`[data-field="basic_${key}"]`);
                if (input) {
                    input.value = data.blocks.basic[key];
                }
            });
        }

        // 다른 블록들도 동일하게 처리
    }

    // 변경 요청 목록 표시
    if (data.requests && data.requests.length > 0) {
        displayRequests(data.requests);
    }
}

// 변경 요청 표시
function displayRequests(requests) {
    const requestContainer = document.querySelector('.request-section .request-list');
    if (!requestContainer) return;

    requests.forEach(request => {
        const requestItem = createRequestItem(request);
        requestContainer.appendChild(requestItem);
    });
}

// 변경 요청 아이템 생성
function createRequestItem(request) {
    const div = document.createElement('div');
    div.className = 'request-item';
    div.innerHTML = `
        <input type="checkbox" id="req_${request.id}">
        <label for="req_${request.id}">${request.text}</label>
        <span class="request-actions">복사 삭제</span>
    `;
    return div;
}

// 프롬프트 생성
function generatePrompt() {
    const currentTab = shotDetailManager.currentTab;
    const promptData = collectFormData(currentTab);
    const generatedPrompt = buildPrompt(promptData);

    // 최종 프롬프트 텍스트영역에 표시
    const textareaElems = document.querySelectorAll('.final-prompt-textarea');
    textareaElems.forEach(elem => {
        if (elem.closest('.tab-pane.active')) {
            elem.value = generatedPrompt;
        }
    });

    // 프롬프트 저장
    shotDetailManager.shotData.prompts[currentTab] = generatedPrompt;

    // 알림 표시
    showNotification('프롬프트가 생성되었습니다.');
}

// 폼 데이터 수집
function collectFormData(tabName) {
    try {
        const activePane = document.querySelector(`.tab-pane[data-tab="${tabName}"]`);
        if (!activePane) return {};

        const data = {};

        // 기본 블록 탭의 경우
        if (tabName === 'basic') {
            activePane.querySelectorAll('.prompt-row-item').forEach(item => {
                const blockType = item.getAttribute('data-block');
                const input = item.querySelector('.prompt-input');
                if (blockType && input && input.value && input.value.trim() !== '') {
                    data[blockType] = input.value;
                }
            });
        } else {
            // 다른 탭들의 경우 (안전한 선택자 사용)
            const inputs = activePane.querySelectorAll('.prompt-input');
            const selects = activePane.querySelectorAll('.prompt-select');

            [...inputs, ...selects].forEach(input => {
                const row = input.closest('.prompt-row');
                if (row) {
                    const label = row.querySelector('.prompt-label')?.textContent;
                    const tag = row.querySelector('.prompt-tag')?.textContent;
                    const value = input.value;

                    if (value && value.trim() !== '' && value !== '▼') {
                        data[tag || label] = value;
                    }
                }
            });
        }

        return data;
    } catch (error) {
        console.warn('폼 데이터 수집 중 오류:', error);
        return {};
    }
}

// 프롬프트 빌드
function buildPrompt(data) {
    let prompt = '';

    Object.entries(data).forEach(([key, value]) => {
        if (value) {
            prompt += `${key}: ${value}, `;
        }
    });

    // 마지막 쉼표 제거
    return prompt.slice(0, -2);
}

// 프롬프트 복사
function copyPrompt() {
    const activeTextarea = document.querySelector('.tab-pane.active .final-prompt-textarea');
    if (activeTextarea && activeTextarea.value) {
        navigator.clipboard.writeText(activeTextarea.value).then(() => {
            showNotification('프롬프트가 클립보드에 복사되었습니다.');
        });
    }
}

// 최종 프롬프트 복사 (헤더의 복사 버튼용)
function copyFinalPrompt() {
    const activeTextarea = document.querySelector('.tab-pane.active .final-prompt-textarea');
    if (activeTextarea && activeTextarea.value) {
        navigator.clipboard.writeText(activeTextarea.value).then(() => {
            // 복사 버튼 애니메이션
            const copyBtn = document.querySelector('.tab-pane.active .copy-prompt-btn');
            if (copyBtn) {
                copyBtn.classList.add('copied');
                copyBtn.setAttribute('title', '복사됨!');

                // 체크 아이콘으로 변경
                const icon = copyBtn.querySelector('svg');
                if (icon) {
                    const originalPath = icon.innerHTML;
                    icon.innerHTML = '<path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" fill="currentColor"/>';

                    setTimeout(() => {
                        icon.innerHTML = originalPath;
                        copyBtn.classList.remove('copied');
                        copyBtn.setAttribute('title', '복사');
                    }, 2000);
                }
            }

            showNotification('프롬프트가 클립보드에 복사되었습니다.');
        }).catch(err => {
            console.error('복사 실패:', err);
            showNotification('복사에 실패했습니다. 텍스트를 선택하여 수동으로 복사해주세요.', 'error');
        });
    } else {
        showNotification('복사할 프롬프트가 없습니다.', 'warning');
    }
}

// 전역으로 노출
window.copyFinalPrompt = copyFinalPrompt;

// Translation function for request dropdowns
window.translateRequests = function(button) {
    const currentLang = button.getAttribute('data-lang');
    const newLang = currentLang === 'ko' ? 'en' : 'ko';
    const requestColumn = button.closest('.request-column');

    if (!requestColumn) return;

    // Find all select options in this column
    const selects = requestColumn.querySelectorAll('.request-dropdown');

    selects.forEach(select => {
        const options = select.querySelectorAll('option');
        options.forEach(option => {
            const text = option.textContent;
            if (text && text.includes(' - ')) {
                // Toggle between Korean and English
                if (newLang === 'en') {
                    // Show only English (before the dash)
                    const englishText = text.split(' - ')[0];
                    option.textContent = englishText;
                } else {
                    // Show full text with Korean
                    // Store original text in data attribute if not already stored
                    if (!option.hasAttribute('data-original')) {
                        option.setAttribute('data-original', text);
                    }
                    const original = option.getAttribute('data-original');
                    if (original) {
                        option.textContent = original;
                    }
                }
            }
        });
    });

    // Update button state
    button.setAttribute('data-lang', newLang);
    button.querySelector('.translate-text').textContent = newLang === 'en' ? 'KO' : 'EN';
};

// 샷 데이터 저장
function saveShotData() {
    // 모든 탭의 데이터 수집
    const tabs = ['basic', 'scene', 'character', 'location', 'props'];
    tabs.forEach(tab => {
        shotDetailManager.shotData.blocks[tab] = collectFormData(tab);
    });

    // 로컬 스토리지에 저장
    localStorage.setItem('currentShotData', JSON.stringify(shotDetailManager.shotData));

    // 세션 스토리지에도 저장 (스토리보드 페이지와 공유)
    sessionStorage.setItem(`shot_${shotDetailManager.shotData.id}`, JSON.stringify(shotDetailManager.shotData));

    showNotification('데이터가 저장되었습니다.');
}

// 이미지 생성
async function generateImage() {
    const button = document.querySelector('.generate-image-btn');
    if (!button) return;

    button.textContent = '생성 중...';
    button.disabled = true;

    try {
        // 현재 활성 탭의 프롬프트 가져오기
        const activeTextarea = document.querySelector('.tab-pane.active .final-prompt-textarea');
        const prompt = activeTextarea?.value || '';

        if (!prompt) {
            throw new Error('프롬프트를 먼저 생성해주세요.');
        }

        // 여기서 실제 이미지 생성 API 호출
        // 예시: const imageUrl = await callImageGenerationAPI(prompt);

        // 임시로 플레이스홀더 이미지 표시
        const imagePreview = document.getElementById('generatedImage');
        const placeholderText = document.getElementById('placeholderText');

        if (imagePreview && placeholderText) {
            // 테스트용 이미지 URL
            imagePreview.src = 'https://via.placeholder.com/350x250/333/999?text=Generated+Image';
            imagePreview.style.display = 'block';
            placeholderText.style.display = 'none';
        }

        showNotification('이미지가 생성되었습니다.');
    } catch (error) {
        showNotification('이미지 생성에 실패했습니다: ' + error.message, 'error');
    } finally {
        if (button) {
            button.textContent = '이미지 생성';
            button.disabled = false;
        }
    }
}

// 프롬프트 미리보기 업데이트
function updatePromptPreview() {
    try {
        const currentTab = shotDetailManager.currentTab;
        const promptData = collectFormData(currentTab);
        const previewText = buildPrompt(promptData);

        // 미리보기 영역이 있으면 업데이트
        const previewArea = document.querySelector('.prompt-display p');
        if (previewArea) {
            previewArea.textContent = previewText || '프롬프트가 여기에 표시됩니다.';
        }
    } catch (error) {
        console.warn('프롬프트 미리보기 업데이트 중 오류:', error);
    }
}

// 소품 데이터 복사
function copyPropsData() {
    const propsData = collectFormData('props');
    const propsText = JSON.stringify(propsData, null, 2);

    navigator.clipboard.writeText(propsText).then(() => {
        showNotification('소품 데이터가 클립보드에 복사되었습니다.');
    });
}

// 파일 데이터 파싱
function parseFileData() {
    const fileDropdown = document.querySelector('.file-dropdown');
    const selectedFile = fileDropdown.value;

    if (selectedFile && selectedFile !== '▼') {
        // 파일 파싱 로직
        showNotification(`${selectedFile} 파일을 파싱합니다.`);

        // 파싱된 데이터로 폼 업데이트
        // updateFormWithParsedData(parsedData);
    }
}

// 모달 닫기
function closeShotDetail() {
    console.log('closeShotDetail called');

    // iframe 내부에서 실행되는지 확인
    if (window.parent !== window) {
        try {
            // 1. postMessage로 부모에게 알림 (권장)
            window.parent.postMessage({ type: 'closeShotDetail' }, '*');
            console.log('Sent close message to parent');

            // 2. 직접 DOM 접근 시도 (fallback)
            setTimeout(() => {
                try {
                    const parentModal = window.parent.document.getElementById('shotDetailModal');
                    if (parentModal) {
                        parentModal.style.display = 'none';
                        parentModal.innerHTML = '';
                        console.log('Closed modal via direct DOM access');
                    }
                } catch (e) {
                    console.log('Direct DOM access failed:', e);
                }
            }, 100);

        } catch (error) {
            console.error('Failed to close modal:', error);
        }
    } else {
        // iframe이 아닌 경우
        if (window.opener) {
            window.close();
        } else if (window.history.length > 1) {
            window.history.back();
        } else {
            // 스토리보드 페이지로 이동
            window.location.href = '../storyboard/index.html';
        }
    }
}

// 전역으로 노출
window.closeShotDetail = closeShotDetail;

// 캐릭터 관리 함수
let activeCharacters = [1]; // 기본적으로 캐릭터 1이 선택됨

function addCharacterToList() {
    const selector = document.getElementById('characterSelector');
    const characterNum = parseInt(selector.value);

    if (!activeCharacters.includes(characterNum)) {
        activeCharacters.push(characterNum);
        activeCharacters.sort();
        updateCharacterChips();
        updateCharacterVisibility();
    }
}

function removeCharacter(characterNum) {
    // 최소 1개의 캐릭터는 유지
    if (activeCharacters.length > 1) {
        const index = activeCharacters.indexOf(characterNum);
        if (index > -1) {
            activeCharacters.splice(index, 1);
            updateCharacterChips();
            updateCharacterVisibility();
        }
    }
}

function updateCharacterChips() {
    const listContainer = document.getElementById('addedCharactersList');
    if (!listContainer) return;

    listContainer.innerHTML = activeCharacters.map(num => `
        <div class="selected-character-chip" data-character-num="${num}">
            <span>캐릭터 ${num}</span>
            <button class="chip-remove-btn" onclick="removeCharacter(${num})">×</button>
        </div>
    `).join('');
}

function updateCharacterVisibility() {
    // 모든 캐릭터 컨테이너 숨기기
    document.querySelectorAll('.character-container').forEach(container => {
        const charNum = parseInt(container.dataset.character);
        if (charNum) {
            container.style.display = activeCharacters.includes(charNum) ? 'block' : 'none';
        }
    });
}

function clearAllCharacters() {
    activeCharacters = [1]; // 캐릭터 1로 초기화
    updateCharacterChips();
    updateCharacterVisibility();
}

// 전역으로 노출
window.addCharacterToList = addCharacterToList;
window.removeCharacter = removeCharacter;
window.clearAllCharacters = clearAllCharacters;

// 이미지 업로드 기능 초기화
function initializeImageUpload() {
    // 파일 업로드 트리거 함수를 전역으로 설정
    window.triggerFileUpload = function() {
        document.getElementById('imageUpload').click();
    };

    // 이미지 업로드 핸들러를 전역으로 설정
    window.handleImageUpload = function(event) {
        const files = Array.from(event.target.files);
        const maxImages = 8;
        const remainingSlots = maxImages - uploadedImages.length;

        if (files.length > remainingSlots) {
            showNotification(`최대 ${maxImages}개까지만 업로드 가능합니다. ${remainingSlots}개만 추가됩니다.`, 'warning');
            files.splice(remainingSlots);
        }

        files.forEach(file => {
            if (uploadedImages.length >= maxImages) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                const imageData = {
                    id: Date.now() + Math.random(),
                    url: e.target.result,
                    file: file
                };
                uploadedImages.push(imageData);
                renderUploadedImages();
            };
            reader.readAsDataURL(file);
        });

        // 입력 초기화
        event.target.value = '';
    };
}

// 업로드된 이미지 렌더링
function renderUploadedImages() {
    const container = document.getElementById('uploadedImages');
    container.innerHTML = '';

    uploadedImages.forEach((image, index) => {
        const imageThumb = document.createElement('div');
        imageThumb.className = 'image-thumb';
        if (index === selectedImageIndex) {
            imageThumb.classList.add('selected');
        }

        imageThumb.innerHTML = `
            <img src="${image.url}" alt="Uploaded ${index + 1}">
            <button class="remove-image" onclick="removeImage(${index})">×</button>
        `;

        imageThumb.onclick = function(e) {
            if (e.target.classList.contains('remove-image')) return;
            selectImage(index);
        };

        container.appendChild(imageThumb);
    });

    // 첫 이미지가 업로드되면 자동 선택
    if (uploadedImages.length > 0 && selectedImageIndex === 0) {
        selectImage(0);
    }
}

// 이미지 선택
function selectImage(index) {
    selectedImageIndex = index;
    const mainImage = document.getElementById('mainImage');
    const placeholder = document.getElementById('placeholderImage');

    if (uploadedImages[index]) {
        mainImage.src = uploadedImages[index].url;
        mainImage.style.display = 'block';
        placeholder.style.display = 'none';
    }

    // 선택된 이미지 표시 업데이트
    document.querySelectorAll('.image-thumb').forEach((thumb, i) => {
        if (i === index) {
            thumb.classList.add('selected');
        } else {
            thumb.classList.remove('selected');
        }
    });
}

// 이미지 제거
window.removeImage = function(index) {
    uploadedImages.splice(index, 1);

    // 선택된 인덱스 조정
    if (selectedImageIndex >= uploadedImages.length) {
        selectedImageIndex = uploadedImages.length - 1;
    }
    if (selectedImageIndex < 0) {
        selectedImageIndex = 0;
    }

    renderUploadedImages();

    // 이미지가 없으면 플레이스홀더 표시
    if (uploadedImages.length === 0) {
        const mainImage = document.getElementById('mainImage');
        const placeholder = document.getElementById('placeholderImage');
        mainImage.style.display = 'none';
        placeholder.style.display = 'flex';
    } else {
        selectImage(selectedImageIndex);
    }
};

// 알림 표시
function showNotification(message, type = 'success') {
    // 간단한 알림 표시 (실제로는 토스트 메시지 등으로 구현)
    console.log(`[${type}] ${message}`);

    // 임시 알림 표시
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background-color: ${type === 'success' ? '#4caf50' : '#f44336'};
        color: white;
        border-radius: 4px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    // 3초 후 제거
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Stage 1 JSON 파일 업로드 처리
function handleStage1Upload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // JSON 파일 확인
    if (!file.name.endsWith('.json')) {
        showNotification('JSON 파일만 업로드 가능합니다.', 'error');
        return;
    }

    // Stage1JSONParser 사용
    if (window.stage1Parser) {
        window.stage1Parser.loadJSON(file).then(parsedData => {
            shotDetailManager.stage1Data = parsedData;

            // 각 블록에 데이터 매칭
            mapStage1DataToBlocks(parsedData);

            showNotification('Stage 1 JSON 파일이 성공적으로 로드되었습니다.');
        }).catch(error => {
            console.error('JSON 파싱 에러:', error);
            showNotification('JSON 파일 파싱에 실패했습니다.', 'error');
        });
    } else {
        showNotification('파서가 로드되지 않았습니다. 잠시 후 다시 시도해주세요.', 'error');
    }
}

// Stage 1 데이터를 각 블록에 매칭
function mapStage1DataToBlocks(parsedData) {
    // 1. 기본블록 매칭
    mapBasicBlock(parsedData.basic);

    // 2. 연출블록 매칭
    mapDirectionBlock(parsedData.direction);

    // 3. 캐릭터블록 매칭 (첫 번째 캐릭터)
    if (parsedData.characters && parsedData.characters.length > 0) {
        mapCharacterBlock(parsedData.characters);
    }

    // 4. 장소블록 매칭 (첫 번째 장소)
    if (parsedData.locations && parsedData.locations.length > 0) {
        mapLocationBlock(parsedData.locations[0]);
    }

    // 5. 소품블록 매칭
    if (parsedData.props && parsedData.props.length > 0) {
        mapPropsBlock(parsedData.props[0], parsedData.locations[0]);
    }
}

// 기본블록 데이터 매칭
function mapBasicBlock(basicData) {
    if (!basicData) return;

    const mapping = {
        'style': basicData.style || 'Cinematic',  // film_metadata.style 값
        'artist': basicData.artist || '',
        'medium': basicData.medium || '',
        'genre': basicData.genre || '',
        'era': basicData.era || '',
        'quality': 'professional, Masterpiece, Highly detailed',
        'parameter': basicData.aspectRatio ? `--ar ${basicData.aspectRatio}` : '--ar 9:16'
    };

    // 기본블록 탭의 입력 필드에 값 설정
    Object.entries(mapping).forEach(([field, value]) => {
        const input = document.querySelector(`.tab-pane[data-tab="basic"] .prompt-row-item[data-block="${field}"] .prompt-input`);
        if (input && value) {
            input.value = value;
            console.log(`✅ ${field} 필드에 값 설정: ${value}`);
        }
    });
}

// 연출블록 데이터 매칭
function mapDirectionBlock(directionData) {
    if (!directionData) return;

    // 첫 번째 씬 데이터 사용
    const firstScene = directionData.scenes && directionData.scenes[0];
    if (!firstScene) return;

    const mapping = {
        'scene': firstScene.scenario_text ? firstScene.scenario_text.split('\n')[0] : '',
        'camera': 'Medium Shot, front view, eye level',
        'camera-tech': 'Canon EOS R5, 50mm f/1.2',
        'lighting': 'flat, high-key lighting, minimal shadows',
        'mood': directionData.sequences && directionData.sequences[0] ?
                directionData.sequences[0].narrative_function : ''
    };

    // 연출블록 탭의 입력 필드에 값 설정
    Object.entries(mapping).forEach(([field, value]) => {
        const input = document.querySelector(`.tab-pane[data-tab="scene"] .prompt-row-item[data-block="${field}"] .prompt-input`);
        if (input && value) {
            input.value = value;
        }
    });
}

// 캐릭터블록 데이터 매칭
function mapCharacterBlock(charactersData) {
    if (!charactersData || charactersData.length === 0) return;

    // 최대 2명의 캐릭터 처리
    const char1 = charactersData[0];
    const char2 = charactersData[1];

    if (char1) {
        const mapping1 = {
            'character1': char1.blocks.character || '',
            'character1-detail': char1.detail || '',
            'character1-action': char1.blocks.pose || ''
        };

        Object.entries(mapping1).forEach(([field, value]) => {
            const input = document.querySelector(`.tab-pane[data-tab="character"] .prompt-row-item[data-block="${field}"] .prompt-input`);
            if (input && value) {
                input.value = value;
            }
        });
    }

    if (char2) {
        const mapping2 = {
            'character2': char2.blocks.character || '',
            'character2-detail': char2.detail || '',
            'character2-action': char2.blocks.pose || ''
        };

        Object.entries(mapping2).forEach(([field, value]) => {
            const input = document.querySelector(`.tab-pane[data-tab="character"] .prompt-row-item[data-block="${field}"] .prompt-input`);
            if (input && value) {
                input.value = value;
            }
        });
    }
}

// 장소블록 데이터 매칭
function mapLocationBlock(locationData) {
    if (!locationData) return;

    const mapping = {
        'location': locationData.blocks.location || '',
        'atmosphere': locationData.blocks.atmosphere || '',
        'color-tone': locationData.blocks.colorTone || '',
        'scale': locationData.blocks.scale || '',
        'architecture': locationData.blocks.architecture || '',
        'material': locationData.blocks.material || '',
        'weather': locationData.blocks.weather || '',
        'natural-light': locationData.blocks.naturalLight || ''
    };

    // 장소블록 탭의 입력 필드에 값 설정
    Object.entries(mapping).forEach(([field, value]) => {
        const input = document.querySelector(`.tab-pane[data-tab="location"] .prompt-row-item[data-block="${field}"] .prompt-input`);
        if (input && value) {
            input.value = value;
        }
    });
}

// 소품블록 데이터 매칭
function mapPropsBlock(propsData, locationData) {
    if (!propsData && !locationData) return;

    const mapping = {
        'props': propsData?.blocks?.itemName || '',
        'lighting-tech': locationData?.blocks?.lighting || '',
        'foreground': locationData?.blocks?.foreground || '',
        'midground': locationData?.blocks?.midground || '',
        'background': locationData?.blocks?.background || '',
        'left-side': locationData?.blocks?.leftSide || '',
        'right-side': locationData?.blocks?.rightSide || '',
        'ceiling': locationData?.blocks?.ceilingSky || ''
    };

    // 소품블록 탭의 입력 필드에 값 설정
    Object.entries(mapping).forEach(([field, value]) => {
        const input = document.querySelector(`.tab-pane[data-tab="props"] .prompt-row-item[data-block="${field}"] .prompt-input`);
        if (input && value) {
            input.value = value;
        }
    });
}

// Stage 1 JSON 업로드 버튼 추가를 위한 전역 함수
window.uploadStage1JSON = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = handleStage1Upload;
    input.click();
};

// 이미지 생성 관련 함수
window.regenerateImage = function() {
    const generationResult = document.getElementById('generationResult');
    if (!generationResult) return;

    // 로딩 상태 표시
    generationResult.innerHTML = `
        <div style="text-align: center;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin">
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                <path d="M9 12l2 2 4-4" stroke-opacity="0.3"/>
            </svg>
            <p>이미지 생성 중...</p>
        </div>
    `;

    // 실제 이미지 생성 로직은 API 연동 후 구현
    setTimeout(() => {
        // 테스트용: 플레이스홀더 이미지로 대체
        generationResult.classList.add('has-image');
        generationResult.innerHTML = `
            <img src="https://via.placeholder.com/220x220/ff6b6b/ffffff?text=Generated" alt="Generated Image">
        `;
    }, 2000);
};

// 외부에서 호출 가능한 함수들
window.shotDetail = {
    open: function(shotId) {
        // 새 창으로 열기
        const width = 1400;
        const height = 900;
        const left = (screen.width - width) / 2;
        const top = (screen.height - height) / 2;

        window.open(
            `shot-detail.html?shotId=${shotId}`,
            'shotDetail',
            `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
        );
    },

    loadData: function(data) {
        shotDetailManager.shotData = data;
        populateForm(data);
    },

    getData: function() {
        return shotDetailManager.shotData;
    },

    // Stage 1 JSON 로드
    loadStage1JSON: function(jsonData) {
        if (window.stage1Parser) {
            shotDetailManager.stage1Data = jsonData;
            mapStage1DataToBlocks(jsonData);
        }
    }
};

// film_metadata를 기본블록에 매핑하는 함수
function mapFilmMetadataToBasicBlock(filmMetadata) {
    console.log('Mapping film_metadata to basic block:', filmMetadata);

    // 매핑 정의
    // style → 아트스타일 프롬프트
    // artist → 아티스트 프롬프트
    // medium → 매체
    // genre → 장르
    // era → 시대
    // aspect_ratio → 매개변수

    const mapping = {
        'style': filmMetadata.style || '',  // "Cinematic"
        'artist': filmMetadata.artist || '',  // "Wes Anderson"
        'medium': filmMetadata.medium || '',  // "Digital Cinematography"
        'genre': filmMetadata.genre || '',  // "Office Comedy"
        'era': filmMetadata.era || '',  // "Modern Office, 2025"
        'parameter': filmMetadata.aspect_ratio ? `--ar ${filmMetadata.aspect_ratio}` : ''  // "--ar 9:16"
    };

    // quality 필드는 기본값 설정
    const qualityField = document.querySelector('.tab-pane[data-tab="basic"] .prompt-row-item[data-block="quality"] .prompt-input');
    if (qualityField && !qualityField.value) {
        qualityField.value = 'professional, Masterpiece, Highly detailed';
    }

    // 기본블록 탭의 입력 필드에 값 설정
    Object.entries(mapping).forEach(([field, value]) => {
        const input = document.querySelector(`.tab-pane[data-tab="basic"] .prompt-row-item[data-block="${field}"] .prompt-input`);
        if (input && value) {
            input.value = value;
            console.log(`Set ${field}: ${value}`);
        }
    });

    // shotDetailManager에도 저장
    if (shotDetailManager.shotData && shotDetailManager.shotData.blocks) {
        shotDetailManager.shotData.blocks.basic = {
            ...shotDetailManager.shotData.blocks.basic,
            ...mapping,
            quality: 'professional, Masterpiece, Highly detailed'
        };
    }
}

// film_metadata를 localStorage에 캐시하는 함수
function cacheFilmMetadata(filmMetadata) {
    try {
        const cacheKey = 'aifi_film_metadata_cache';
        const cacheData = {
            filmMetadata: filmMetadata,
            timestamp: Date.now(),
            filmId: filmMetadata.film_id || 'unknown'
        };

        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        console.log('Film metadata cached to localStorage');
    } catch (error) {
        console.error('Error caching film metadata:', error);
    }
}

// localStorage에서 캐시된 film_metadata 로드하는 함수
function loadCachedFilmMetadata() {
    try {
        const cacheKey = 'aifi_film_metadata_cache';
        const cachedData = localStorage.getItem(cacheKey);

        if (cachedData) {
            const parsed = JSON.parse(cachedData);
            console.log('Loading cached film metadata:', parsed);

            // 24시간 이내 캐시만 사용 (옵션)
            const cacheAge = Date.now() - parsed.timestamp;
            const maxAge = 24 * 60 * 60 * 1000; // 24시간

            if (cacheAge < maxAge && parsed.filmMetadata) {
                // 캐시된 데이터를 기본블록에 매핑
                mapFilmMetadataToBasicBlock(parsed.filmMetadata);
                return true;
            }
        }
    } catch (error) {
        console.error('Error loading cached film metadata:', error);
    }
    return false;
}

// 캐시 삭제 함수 (필요시 사용)
window.clearFilmMetadataCache = function() {
    localStorage.removeItem('aifi_film_metadata_cache');
    console.log('Film metadata cache cleared');
};

// 추가된 캐릭터 목록 관리
const addedCharacters = new Set([1]); // 기본으로 캐릭터 1이 추가되어 있음

// 캐릭터를 리스트에 추가하는 함수
window.addCharacterToList = function() {
    const selector = document.getElementById('characterSelector');
    const characterNum = parseInt(selector.value);

    // 이미 추가된 캐릭터인지 확인
    if (addedCharacters.has(characterNum)) {
        showNotification(`캐릭터 ${characterNum}은(는) 이미 추가되어 있습니다.`, 'warning');
        return;
    }

    // 캐릭터 추가
    addedCharacters.add(characterNum);

    // UI 업데이트
    updateCharactersList();
    updateCharacterContainers();

    showNotification(`캐릭터 ${characterNum}이(가) 추가되었습니다.`, 'success');
};

// 캐릭터를 리스트에서 제거하는 함수
window.removeCharacter = function(characterNum) {
    // 최소 1개의 캐릭터는 유지
    if (addedCharacters.size <= 1) {
        showNotification('최소 1개의 캐릭터는 필요합니다.', 'warning');
        return;
    }

    addedCharacters.delete(characterNum);
    updateCharactersList();
    updateCharacterContainers();

    showNotification(`캐릭터 ${characterNum}이(가) 제거되었습니다.`, 'info');
};

// 모든 캐릭터 지우기
window.clearAllCharacters = function() {
    addedCharacters.clear();
    addedCharacters.add(1); // 기본 캐릭터 1 추가
    updateCharactersList();
    updateCharacterContainers();

    showNotification('모든 캐릭터가 제거되었습니다. (캐릭터 1 기본 유지)', 'info');
};

// 캐릭터 리스트 UI 업데이트
function updateCharactersList() {
    const listContainer = document.getElementById('addedCharactersList');
    if (!listContainer) return;

    // 리스트 초기화
    listContainer.innerHTML = '';

    // 추가된 캐릭터들을 정렬하여 표시
    const sortedCharacters = Array.from(addedCharacters).sort((a, b) => a - b);

    sortedCharacters.forEach(num => {
        const item = document.createElement('div');
        item.className = 'added-character-item';
        item.setAttribute('data-character-num', num);
        item.innerHTML = `
            <span class="character-name">캐릭터 ${num}</span>
            <button class="remove-character-btn" onclick="removeCharacter(${num})" title="제거">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;
        listContainer.appendChild(item);
    });

    // "모두 지우기" 버튼 표시/숨김
    const clearAllBtn = document.querySelector('.clear-all-btn');
    if (clearAllBtn) {
        clearAllBtn.style.display = addedCharacters.size > 1 ? 'block' : 'none';
    }
}

// 캐릭터 컨테이너 표시/숨김 업데이트
function updateCharacterContainers() {
    const characterTab = document.querySelector('.tab-pane[data-tab="character"]');
    if (!characterTab) return;

    // 모든 캐릭터 컨테이너 숨기기
    const allContainers = characterTab.querySelectorAll('.character-container');
    allContainers.forEach(container => {
        const characterNum = parseInt(container.getAttribute('data-character'));
        if (addedCharacters.has(characterNum)) {
            container.style.display = 'block';
        } else {
            container.style.display = 'none';
        }
    });

    // 스크롤 위치 초기화
    const labelList = characterTab.querySelector('.label-list');
    const promptBlocks = characterTab.querySelector('.prompt-blocks');
    const requestBlocks = characterTab.querySelector('.request-blocks');

    if (labelList && promptBlocks && requestBlocks) {
        labelList.scrollTop = 0;
        promptBlocks.scrollTop = 0;
        requestBlocks.scrollTop = 0;
    }
}

// 알림 메시지 표시 함수
function showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);

    // 기존 알림이 있으면 제거
    const existingNotification = document.querySelector('.character-notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // 새 알림 생성
    const notification = document.createElement('div');
    notification.className = `character-notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'success' ? 'rgba(76, 175, 80, 0.9)' :
                     type === 'warning' ? 'rgba(255, 152, 0, 0.9)' :
                     type === 'error' ? 'rgba(244, 67, 54, 0.9)' :
                     'rgba(33, 150, 243, 0.9)'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-size: 14px;
    `;

    document.body.appendChild(notification);

    // 3초 후 제거
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// 애니메이션 스타일 추가
if (!document.querySelector('#character-notification-styles')) {
    const style = document.createElement('style');
    style.id = 'character-notification-styles';
    style.innerHTML = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// ===== 장소 관리 함수들 =====
const addedLocations = new Set([1]); // 기본으로 장소 1이 추가되어 있음

// 장소를 리스트에 추가하는 함수
window.addLocationToList = function() {
    const selector = document.getElementById('locationSelector');
    const locationNum = parseInt(selector.value);

    if (addedLocations.has(locationNum)) {
        showNotification(`장소 ${locationNum}은(는) 이미 추가되어 있습니다.`, 'warning');
        return;
    }

    addedLocations.add(locationNum);
    updateLocationsList();
    updateLocationContainers();

    showNotification(`장소 ${locationNum}이(가) 추가되었습니다.`, 'success');
};

// 장소를 리스트에서 제거하는 함수
window.removeLocation = function(locationNum) {
    if (addedLocations.size <= 1) {
        showNotification('최소 1개의 장소는 필요합니다.', 'warning');
        return;
    }

    addedLocations.delete(locationNum);
    updateLocationsList();
    updateLocationContainers();

    showNotification(`장소 ${locationNum}이(가) 제거되었습니다.`, 'info');
};

// 모든 장소 지우기
window.clearAllLocations = function() {
    addedLocations.clear();
    addedLocations.add(1);
    updateLocationsList();
    updateLocationContainers();

    showNotification('모든 장소가 제거되었습니다. (장소 1 기본 유지)', 'info');
};

// 장소 리스트 UI 업데이트
function updateLocationsList() {
    const listContainer = document.getElementById('addedLocationsList');
    if (!listContainer) return;

    listContainer.innerHTML = '';
    const sortedLocations = Array.from(addedLocations).sort((a, b) => a - b);

    sortedLocations.forEach(num => {
        const item = document.createElement('div');
        item.className = 'added-location-item';
        item.setAttribute('data-location-num', num);
        item.innerHTML = `
            <span class="location-name">장소 ${num}</span>
            <button class="remove-location-btn" onclick="removeLocation(${num})" title="제거">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;
        listContainer.appendChild(item);
    });

    const clearAllBtn = document.querySelector('.added-locations-container .clear-all-btn');
    if (clearAllBtn) {
        clearAllBtn.style.display = addedLocations.size > 1 ? 'block' : 'none';
    }
}

// 장소 컨테이너 표시/숨김 업데이트
function updateLocationContainers() {
    const locationTab = document.querySelector('.tab-pane[data-tab="location"]');
    if (!locationTab) return;

    // 현재는 장소 블록이 컨테이너 구조가 아니므로,
    // 필요시 여기에 컨테이너별 표시/숨김 로직 추가 가능
    console.log('Selected locations:', Array.from(addedLocations));
}

// ===== 소품 관리 함수들 =====
const addedProps = new Set([1]); // 기본으로 소품 1이 추가되어 있음

// 소품을 리스트에 추가하는 함수
window.addPropsToList = function() {
    const selector = document.getElementById('propsSelector');
    const propsNum = parseInt(selector.value);

    if (addedProps.has(propsNum)) {
        showNotification(`소품 ${propsNum}은(는) 이미 추가되어 있습니다.`, 'warning');
        return;
    }

    addedProps.add(propsNum);
    updatePropsList();
    updatePropsContainers();

    showNotification(`소품 ${propsNum}이(가) 추가되었습니다.`, 'success');
};

// 소품을 리스트에서 제거하는 함수
window.removeProps = function(propsNum) {
    if (addedProps.size <= 1) {
        showNotification('최소 1개의 소품은 필요합니다.', 'warning');
        return;
    }

    addedProps.delete(propsNum);
    updatePropsList();
    updatePropsContainers();

    showNotification(`소품 ${propsNum}이(가) 제거되었습니다.`, 'info');
};

// 모든 소품 지우기
window.clearAllProps = function() {
    addedProps.clear();
    addedProps.add(1);
    updatePropsList();
    updatePropsContainers();

    showNotification('모든 소품이 제거되었습니다. (소품 1 기본 유지)', 'info');
};

// 소품 리스트 UI 업데이트
function updatePropsList() {
    const listContainer = document.getElementById('addedPropsList');
    if (!listContainer) return;

    listContainer.innerHTML = '';
    const sortedProps = Array.from(addedProps).sort((a, b) => a - b);

    sortedProps.forEach(num => {
        const item = document.createElement('div');
        item.className = 'added-props-item';
        item.setAttribute('data-props-num', num);
        item.innerHTML = `
            <span class="props-name">소품 ${num}</span>
            <button class="remove-props-btn" onclick="removeProps(${num})" title="제거">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;
        listContainer.appendChild(item);
    });

    const clearAllBtn = document.querySelector('.added-props-container .clear-all-btn');
    if (clearAllBtn) {
        clearAllBtn.style.display = addedProps.size > 1 ? 'block' : 'none';
    }
}

// 소품 컨테이너 표시/숨김 업데이트
function updatePropsContainers() {
    const propsTab = document.querySelector('.tab-pane[data-tab="props"]');
    if (!propsTab) return;

    // 현재는 소품 블록이 컨테이너 구조가 아니므로,
    // 필요시 여기에 컨테이너별 표시/숨김 로직 추가 가능
    console.log('Selected props:', Array.from(addedProps));
}

// ===== Stage2 JSON 통합 기능들 =====

// Stage2 파서를 이용한 장면 프롬프트 매핑
// Stage2 자동 매핑 (UI 없이 백그라운드에서 동작)
const stage2Integration = {
    /**
     * Stage2 데이터에서 현재 샷의 scene 자동 적용
     */
    autoApplySceneFromStage2() {
        const currentShotId = this.extractCurrentShotId();
        if (!currentShotId) {
            console.log('💡 현재 샷 ID를 감지할 수 없습니다.');
            return;
        }

        if (!window.stage2Parser || !window.stage2Parser.data) {
            console.log('💡 Stage2 데이터가 로드되지 않았습니다.');
            return;
        }

        // 장면 데이터 자동 적용
        this.applySceneToPrompt(currentShotId);
        console.log(`✅ Stage2 데이터에서 샷 ${currentShotId}의 scene 자동 적용 완료`);
    },

    /**
     * 현재 샷 ID 추출
     */
    extractCurrentShotId() {
        // URL 파라미터에서 추출
        const urlParams = new URLSearchParams(window.location.search);
        let shotId = urlParams.get('shot_id');

        if (shotId) return shotId;

        // 모달 제목에서 추출
        const modalTitle = document.querySelector('.modal-title');
        if (modalTitle) {
            const match = modalTitle.textContent.match(/S\d{2}\.\d{2}\.\d{2}/);
            if (match) return match[0];
        }

        // 페이지 제목에서 추출
        const match = document.title.match(/S\d{2}\.\d{2}\.\d{2}/);
        if (match) return match[0];

        return null;
    },

    /**
     * 장면 데이터를 연출 블록 프롬프트에 적용
     */
    applySceneToPrompt(shotId) {
        if (!window.stage2Parser) {
            this.showMessage('Stage2 파서가 준비되지 않았습니다.', 'error');
            return;
        }

        const sceneData = window.stage2Parser.getSceneByshotId(shotId);
        if (!sceneData) {
            this.showMessage(`샷 ID '${shotId}'에 대한 데이터를 찾을 수 없습니다.`, 'error');
            return;
        }

        // 연출 블록의 장면 프롬프트 입력 필드 찾기
        const sceneInput = this.findScenePromptInput();
        if (!sceneInput) {
            this.showMessage('연출 블록의 장면 프롬프트 입력 필드를 찾을 수 없습니다.', 'error');
            return;
        }

        // 장면 데이터 적용
        sceneInput.value = sceneData.scene;

        // 입력 이벤트 트리거 (다른 시스템과 동기화)
        sceneInput.dispatchEvent(new Event('input', { bubbles: true }));
        sceneInput.dispatchEvent(new Event('change', { bubbles: true }));

        // 성공 메시지 표시
        this.showMessage(`✅ 샷 ${shotId}의 장면 정보가 적용되었습니다.`, 'success');

        // 디버그 정보 출력
        console.log(`🎬 샷 ${shotId} 장면 데이터 적용:`, sceneData);
    },

    /**
     * 연출 블록의 장면 프롬프트 입력 필드 찾기
     */
    findScenePromptInput() {
        // 여러 가능한 선택자로 시도
        const selectors = [
            '[data-prompt="scene"]',
            '.scene-prompt-input',
            '.prompt-input[data-field="scene"]',
            '.prompt-blocks .prompt-input:first-child',
            '.tab-pane[data-tab="scene"] .prompt-input:first-child'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) return element;
        }

        // 연출 탭의 첫 번째 프롬프트 입력 필드 찾기
        const sceneTab = document.querySelector('.tab-pane[data-tab="scene"]');
        if (sceneTab) {
            const promptInput = sceneTab.querySelector('.prompt-input');
            if (promptInput) return promptInput;
        }

        return null;
    },

    /**
     * 메시지 표시
     */
    showMessage(message, type = 'info') {
        console.log(`[Stage2 Integration] ${message}`);

        // 기존 알림 시스템이 있으면 사용
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            // 간단한 알림 표시
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196f3'};
                color: white;
                border-radius: 6px;
                z-index: 10000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                font-size: 14px;
                max-width: 400px;
            `;
            notification.textContent = message;
            document.body.appendChild(notification);

            setTimeout(() => {
                notification.remove();
            }, 4000);
        }
    }
};

// 전역 함수 등록
window.stage2Integration = stage2Integration;

// 페이지 로드 시 이미지 업로드 관리자 초기화
document.addEventListener('DOMContentLoaded', function() {
    imageUploadManager.init();

    // Stage2 자동 매핑 기능 (UI 없이 백그라운드에서 동작)
    setTimeout(() => {
        // 세션 스토리지에서 Stage2 데이터 로드
        loadStage2FromSessionStorage();

        // Stage2 데이터가 있으면 자동으로 scene 적용
        setTimeout(() => {
            if (window.stage2Parser && window.stage2Parser.data) {
                stage2Integration.autoApplySceneFromStage2();
            }
        }, 1500);
    }, 1000);
});

// 세션 스토리지에서 Stage2 데이터 로드
function loadStage2FromSessionStorage() {
    try {
        const stage2CacheData = sessionStorage.getItem('stage2ParsedData');
        if (!stage2CacheData) {
            console.log('💡 세션 스토리지에 Stage2 데이터가 없습니다.');
            return;
        }

        const parsedCache = JSON.parse(stage2CacheData);
        console.log('🔄 세션 스토리지에서 Stage2 데이터 로드 중...', parsedCache.filmId);

        // Stage2 파서가 로드될 때까지 대기 후 데이터 복원
        waitForStage2Parser().then(() => {
            // Stage2 파서 데이터 복원
            window.stage2Parser.data = parsedCache.data;
            window.stage2Parser.shotsMap = new Map(parsedCache.shotsMap);
            window.stage2Parser.scenesMap = new Map(parsedCache.scenesMap);

            console.log('✅ Stage2 데이터 세션 복원 완료:', {
                scenes: window.stage2Parser.scenesMap.size,
                shots: window.stage2Parser.shotsMap.size
            });

            // 자동 매핑 활성화
            window.stage2AutoMappingEnabled = true;

        }).catch(error => {
            console.error('❌ Stage2 파서 로드 실패:', error);
        });

    } catch (error) {
        console.error('❌ Stage2 세션 데이터 로드 에러:', error);
    }
}

// Stage2 파서 로드 대기 (shot-detail 전용)
async function waitForStage2Parser() {
    // 이미 로드되어 있으면 바로 반환
    if (window.stage2Parser) {
        return Promise.resolve();
    }

    let attempts = 0;
    const maxAttempts = 30; // 3초 대기

    return new Promise((resolve, reject) => {
        const checkParser = () => {
            if (window.stage2Parser) {
                resolve();
            } else if (attempts >= maxAttempts) {
                // Stage2 파서 동적 로드 시도
                loadStage2ParserScript().then(resolve).catch(reject);
            } else {
                attempts++;
                setTimeout(checkParser, 100);
            }
        };
        checkParser();
    });
}

// Stage2 파서 스크립트 동적 로드 (shot-detail 전용)
async function loadStage2ParserScript() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'js/stage2-parser.js'; // shot-detail.html 기준 경로
        script.onload = () => {
            console.log('✅ Stage2 파서 스크립트 동적 로드 완료');
            resolve();
        };
        script.onerror = () => {
            reject(new Error('Stage2 파서 스크립트 로드 실패'));
        };
        document.head.appendChild(script);
    });
}