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
    isInitialized: false,

    init() {
        // 중복 초기화 방지
        if (this.isInitialized) {
            console.log('Image upload manager already initialized, skipping...');
            return;
        }
        this.isInitialized = true;

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
    // Stage2 데이터가 있으면 starting_frame의 camera_composition 적용
    if (currentShotData && currentShotData.starting_frame) {
        const cameraComposition = currentShotData.starting_frame.camera_composition || '';
        const cameraInput = document.querySelector('.tab-pane[data-tab="scene"] .prompt-row-item[data-block="camera"] .prompt-input');

        if (cameraInput && cameraComposition) {
            cameraInput.value = cameraComposition;
            console.log('✅ START 프레임 카메라 구도 적용:', cameraComposition);
            showNotification('START 프레임이 적용되었습니다.', 'success');
            return;
        }
    }

    // Stage2 데이터가 없으면 기본값 적용
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
    // Stage2 데이터가 있으면 ending_frame의 camera_composition 적용
    if (currentShotData && currentShotData.ending_frame) {
        const cameraComposition = currentShotData.ending_frame.camera_composition || '';
        const cameraInput = document.querySelector('.tab-pane[data-tab="scene"] .prompt-row-item[data-block="camera"] .prompt-input');

        if (cameraInput && cameraComposition) {
            cameraInput.value = cameraComposition;
            console.log('✅ END 프레임 카메라 구도 적용:', cameraComposition);
            showNotification('END 프레임이 적용되었습니다.', 'success');
            return;
        }
    }

    // Stage2 데이터가 없으면 START와 동일한 기본값 적용
    const basicDefaults = {
        'style': 'cinematic style',
        'artist': 'Roger Deakins',
        'medium': 'digital film',
        'genre': 'drama',
        'era': 'contemporary',
        'quality': 'high quality, 8k',
        'parameter': 'natural lighting'
    };

    // 연출 블록
    const sceneDefaults = {
        'scene': 'peaceful morning scene',
        'camera': 'medium shot, eye level',
        'camera-tech': 'ARRI ALEXA, 50mm lens'
    };

    // 캐릭터 블록
    const characterDefaults = {
        'character1': 'young professional',
        'character1-detail': 'friendly smile, casual attire, relaxed posture',
        'character1-action': 'walking through park, enjoying coffee'
    };

    // 장소 블록
    const locationDefaults = {
        'location': 'modern urban park',
        'atmosphere': 'calm, refreshing',
        'color-tone': 'warm, natural colors',
        'scale': 'medium, open space',
        'architecture': 'contemporary landscape',
        'material': 'natural stone and wood',
        'object': 'park benches, trees',
        'weather': 'clear sunny day',
        'natural-light': 'soft morning sunlight',
        'artificial-light': 'none',
        'lighting': 'natural, soft shadows',
        'foreground': 'walking path',
        'midground': 'character walking',
        'background': 'trees and sky',
        'left-side': 'green foliage',
        'right-side': 'modern buildings',
        'ceiling': 'clear blue sky',
        'floor': 'paved walkway'
    };

    // 소품 블록
    const propsDefaults = {
        'props': 'coffee cup, smartphone, backpack'
    };

    // 값 적용
    applyDefaultValues('basic', basicDefaults);
    applyDefaultValues('scene', sceneDefaults);
    applyDefaultValues('character', characterDefaults);
    applyDefaultValues('location', locationDefaults);
    applyDefaultValues('props', propsDefaults);

    showNotification('END 변경값이 적용되었습니다.', 'success');
}

// 디폴트 값 적용 헬퍼 함수
function applyDefaultValues(blockType, values) {
    Object.keys(values).forEach(key => {
        // 현재 탭의 프롬프트 입력 필드 찾기 (data-block 속성 사용)
        const inputElement = document.querySelector(`.tab-pane[data-tab="${blockType}"] .prompt-row-item[data-block="${key}"] .prompt-input`);

        if (inputElement) {
            inputElement.value = values[key];
            inputElement.dispatchEvent(new Event('input'));
            console.log(`✅ END 값 적용 [${blockType}] ${key}: ${values[key]}`);
        } else {
            console.warn(`⚠️ 입력 필드를 찾을 수 없음 [${blockType}] ${key}`);
        }

        // 변경 요청 드롭다운도 업데이트 (있는 경우)
        const selectElement = document.querySelector(`.tab-pane[data-tab="${blockType}"] .request-row-item[data-block="${key}"] .request-dropdown`);
        if (selectElement) {
            // 드롭다운에 해당 값이 있으면 선택
            const option = Array.from(selectElement.options).find(opt =>
                opt.value === values[key] || opt.textContent.toLowerCase().includes(values[key].toLowerCase())
            );
            if (option) {
                selectElement.value = option.value;
                selectElement.dispatchEvent(new Event('change'));
            }
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

        // 이미지 업로드 관리자 초기화
        imageUploadManager.init();

        // 소품 셀렉터 이벤트 리스너
        const propsSelector = document.getElementById('propsSelector');
        if (propsSelector) {
            propsSelector.addEventListener('change', updatePropsPromptInput);
        }

        // localStorage에서 캐시된 film_metadata 로드
        loadCachedFilmMetadata();

        // Stage1 자동 로드 (sessionStorage에서)
        setTimeout(() => {
            const stage1Data = sessionStorage.getItem('stage1ParsedData');
            if (stage1Data) {
                try {
                    const parsedData = JSON.parse(stage1Data);
                    console.log('📂 Stage1 데이터 자동 로드:', parsedData);
                    mapStage1DataToBlocks(parsedData);
                } catch (error) {
                    console.error('Stage1 데이터 파싱 에러:', error);
                }
            }

            // 현재 샷의 Stage2 데이터 로드
            const urlParams = new URLSearchParams(window.location.search);
            const shotId = urlParams.get('shotId');
            if (shotId) {
                loadShotById(shotId);

                // 샷별 Stage2 데이터 로드
                const shotDataKey = `shot_${shotId}`;
                const shotDataStr = sessionStorage.getItem(shotDataKey);
                if (shotDataStr) {
                    try {
                        const shotData = JSON.parse(shotDataStr);
                        console.log('📂 샷 데이터 로드 완료:', shotData);

                        // 연출 블록의 장면 필드에 scene 값 설정
                        if (shotData.scene) {
                            const sceneInput = document.querySelector('.tab-pane[data-tab="scene"] .prompt-row-item[data-block="scene"] .prompt-input');
                            if (sceneInput) {
                                sceneInput.value = shotData.scene;
                                console.log('✅ 장면 필드에 값 설정:', shotData.scene);
                            }
                        }
                    } catch (error) {
                        console.error('샷 데이터 파싱 에러:', error);
                    }
                }
            }
        }, 100);

        // Stage2 자동 매핑 기능
        setTimeout(() => {
            loadStage2FromSessionStorage();

            setTimeout(() => {
                if (window.stage2Parser && window.stage2Parser.data && window.stage2Integration) {
                    window.stage2Integration.autoApplySceneFromStage2();
                }
            }, 500);
        }, 500);
    } catch (error) {
        console.error('초기화 중 오류:', error);
    }
});

// 탭 네비게이션 초기화
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const actionButtons = document.querySelectorAll('.action-btn');
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
                const endBtn = document.querySelector('.action-btn[data-action="end"]');
                if (endBtn) endBtn.classList.remove('active');
            } else if (action === 'end') {
                setEndDefaults();
                this.classList.add('active');
                const startBtn = document.querySelector('.action-btn[data-action="start"]');
                if (startBtn) startBtn.classList.remove('active');
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
let isFormEventsInitialized = false;

function initializeFormEvents() {
    // 중복 초기화 방지
    if (isFormEventsInitialized) {
        console.log('Form events already initialized, skipping...');
        return;
    }
    isFormEventsInitialized = true;

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

    // START 버튼 클릭 이벤트
    const startBtn = document.querySelector('.start-btn');
    if (startBtn) {
        startBtn.addEventListener('click', handleStartButton);
    }

    // END 버튼 클릭 이벤트
    const endBtn = document.querySelector('.end-btn');
    if (endBtn) {
        endBtn.addEventListener('click', handleEndButton);
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
        // populateForm 호출하지 않음 - 기본 블록 보호
        console.log('✅ [loadShotData] localStorage 데이터 로드됨, populateForm 스킵');
    }
}

// 샷 로드 캐시
let loadedShotId = null;

// 특정 샷 ID로 데이터 로드
function loadShotById(shotId) {
    // 이미 로드된 샷이면 스킵
    if (loadedShotId === shotId) {
        console.log('⚠️ 샷', shotId, '이미 로드됨, 스킵');
        return;
    }

    console.log('📂 샷 로드 시작:', shotId);
    console.log('   현재 style 상태 - isStyleFieldInitialized:', isStyleFieldInitialized, 'originalStage1Style:', originalStage1Style);
    loadedShotId = shotId;

    // 스토리보드에서 전달된 데이터 로드
    const shotData = sessionStorage.getItem(`shot_${shotId}`);
    if (shotData) {
        const data = JSON.parse(shotData);

        console.log('📦 Stage2 샷 데이터 구조:', {
            hasScene: !!data.scene,
            hasStyle: !!data.style,
            hasMergedData: !!data.merged_data,
            sceneValue: data.scene?.substring(0, 50)
        });

        shotDetailManager.shotData = data;

        // 병합된 데이터가 있으면 현재 샷에 맞는 데이터 추출
        if (data.merged_data) {
            extractAndMapShotSpecificData(data);
        }

        // populateForm은 사용하지 않음 - extractAndMapShotSpecificData가 모든 것을 처리
        console.log('✅ [loadShotById] populateForm 스킵 - extractAndMapShotSpecificData가 처리함');

        // 헤더 업데이트
        document.querySelector('.shot-id').textContent = data.id || data.shot_id;
        console.log('✅ 샷 로드 완료:', shotId);
    }
}

// ============================================================
// 샷 데이터 로드 시 Stage1 + Stage2 통합 파싱
// ============================================================

/**
 * 스토리보드에서 샷을 클릭했을 때 실행
 * Stage1 (film_metadata) + Stage2 (scene) 데이터를 통합 처리
 */
function extractAndMapShotSpecificData(shotData) {
    console.log('📦 [통합파싱] 샷 데이터 처리 시작:', shotData.shot_id);

    const mergedData = shotData.merged_data;

    if (!mergedData) {
        console.warn('⚠️ [통합파싱] merged_data 없음');
        return;
    }

    // ========================================
    // 1단계: Stage1 film_metadata로 기본블록 초기화
    // ========================================
    const stage1Data = mergedData.stage1_original || mergedData;

    if (stage1Data.film_metadata) {
        console.log('📥 [통합파싱] Stage1 film_metadata 발견');
        initBasicBlock(stage1Data.film_metadata);
    }

    // ========================================
    // 2단계: Stage2 scene으로 연출블록 장면 설정
    // ========================================
    if (shotData.shot_id) {
        console.log('📥 [통합파싱] Stage2 scene 설정 시도');
        setSceneFromStage2(shotData.shot_id);
    }

    // ========================================
    // 3단계: 기타 블록 매핑 (캐릭터, 장소 등 - 기존 로직 유지)
    // ========================================
    if (window.stage1Parser && stage1Data) {
        window.stage1Parser.data = stage1Data;
        window.stage1Parser.parseAllBlocks();
        const parsedData = window.stage1Parser.parsedData;

        // 캐릭터 블록
        if (parsedData.characters && parsedData.characters.length > 0) {
            mapCharacterBlock(parsedData.characters);
        }

        // 장소 블록
        if (parsedData.locations && parsedData.locations.length > 0) {
            mapLocationBlock(parsedData.locations[0]);
        }

        // 소품 블록
        if (parsedData.props && parsedData.props.length > 0) {
            mapPropsBlock(parsedData.props);
        }
    }

    console.log('✅ [통합파싱] 샷 데이터 처리 완료:', shotData.shot_id);
}

// 폼에 데이터 채우기 (레거시 함수 - 사용하지 않음)
function populateForm(data) {
    console.warn('⚠️ populateForm() 호출됨 - 레거시 함수, 사용 안 함');
    console.log('   → extractAndMapShotSpecificData() 사용 권장');

    // 기본 블록은 절대 건드리지 않음!
    // extractAndMapShotSpecificData()가 모든 것을 처리

    // 헤더 정보만 업데이트
    if (data.id) {
        document.querySelector('.shot-id').textContent = data.id;
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

// START 버튼 핸들러 - 파싱된 데이터를 모든 필드에 자동으로 채움
function handleStartButton() {
    const startBtn = document.querySelector('.start-btn');

    // 버튼 활성화 상태 토글
    startBtn.classList.toggle('active');

    if (startBtn.classList.contains('active')) {
        console.log('🟢 START 버튼 활성화 - 파싱 데이터 자동 채우기 시작');

        // sessionStorage에서 Stage1 데이터 가져오기
        const stage1Data = sessionStorage.getItem('stage1ParsedData');
        if (stage1Data) {
            try {
                const parsedData = JSON.parse(stage1Data);
                console.log('📂 Stage1 데이터 로드:', parsedData);

                // Stage1 데이터를 각 블록에 매핑 (강제 업데이트)
                mapStage1DataToBlocks(parsedData, true);

                // Stage2 데이터에서 starting_frame의 camera_composition 가져와서 구도 필드 업데이트
                updateCameraCompositionFromFrame('starting_frame');

                // 모든 탭에 대해 프롬프트 생성
                generateAllTabPrompts();

                showNotification('✅ START: 파싱 데이터가 자동으로 적용되었습니다.', 'success');
            } catch (error) {
                console.error('Stage1 데이터 파싱 에러:', error);
                showNotification('❌ 데이터 로드 실패', 'error');
            }
        } else {
            showNotification('⚠️ 파싱된 데이터가 없습니다. JSON 파일을 먼저 업로드해주세요.', 'warning');
        }
    } else {
        console.log('⚪ START 버튼 비활성화');
        showNotification('START 비활성화', 'info');
    }
}

// END 버튼 핸들러
function handleEndButton() {
    const endBtn = document.querySelector('.end-btn');

    // 버튼 활성화 상태 토글
    endBtn.classList.toggle('active');

    if (endBtn.classList.contains('active')) {
        console.log('🔴 END 버튼 활성화');

        // Stage2 데이터에서 ending_frame의 camera_composition 가져와서 구도 필드 업데이트
        updateCameraCompositionFromFrame('ending_frame');

        // 프롬프트 재생성
        generateAllTabPrompts();

        showNotification('✅ END: ending_frame 데이터가 적용되었습니다.', 'success');
    } else {
        console.log('⚪ END 버튼 비활성화');
        showNotification('END 비활성화', 'info');
    }
}

// Stage2 데이터에서 camera_composition 값을 가져와서 구도 필드 업데이트
function updateCameraCompositionFromFrame(frameType) {
    try {
        // URL에서 shotId 가져오기
        const urlParams = new URLSearchParams(window.location.search);
        const shotId = urlParams.get('shotId');

        if (!shotId) {
            console.warn('shotId가 없습니다.');
            return;
        }

        // sessionStorage에서 Stage2 샷 데이터 가져오기
        const shotDataKey = `shot_${shotId}`;
        const shotDataStr = sessionStorage.getItem(shotDataKey);

        if (!shotDataStr) {
            console.warn(`Stage2 데이터를 찾을 수 없습니다: ${shotDataKey}`);
            return;
        }

        const shotData = JSON.parse(shotDataStr);

        // starting_frame 또는 ending_frame에서 camera_composition 가져오기
        const frame = shotData[frameType];
        if (!frame || !frame.camera_composition) {
            console.warn(`${frameType}의 camera_composition을 찾을 수 없습니다.`);
            return;
        }

        const cameraValue = frame.camera_composition;
        console.log(`📷 ${frameType} camera_composition: ${cameraValue}`);

        // scene 탭의 direction 블록에서 camera 필드 찾기
        const sceneTab = document.querySelector('.tab-pane[data-tab="scene"]');
        if (!sceneTab) {
            console.warn('scene 탭을 찾을 수 없습니다.');
            return;
        }

        // direction 블록의 camera 필드 (구도) 찾기
        const cameraInput = sceneTab.querySelector('.prompt-row-item[data-block="camera"] .prompt-input');
        if (cameraInput) {
            cameraInput.value = cameraValue;
            console.log(`✅ 구도 필드 업데이트: ${cameraValue}`);
        } else {
            console.warn('구도(camera) 입력 필드를 찾을 수 없습니다.');
        }

    } catch (error) {
        console.error('Camera composition 업데이트 에러:', error);
    }
}

// 모든 탭의 프롬프트 자동 생성
function generateAllTabPrompts() {
    const tabs = ['basic', 'scene', 'character', 'location', 'props'];

    tabs.forEach(tabName => {
        try {
            const promptData = collectFormData(tabName);
            const generatedPrompt = buildPrompt(promptData);

            // 해당 탭의 프롬프트 텍스트영역에 표시
            const tabPane = document.querySelector(`.tab-pane[data-tab="${tabName}"]`);
            if (tabPane) {
                const textarea = tabPane.querySelector('.final-prompt-textarea');
                if (textarea) {
                    textarea.value = generatedPrompt;
                    console.log(`✅ ${tabName} 탭 프롬프트 생성 완료`);
                }
            }

            // 프롬프트 저장
            shotDetailManager.shotData.prompts[tabName] = generatedPrompt;
        } catch (error) {
            console.error(`${tabName} 탭 프롬프트 생성 에러:`, error);
        }
    });
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

// 파싱 캐시 - 한 번만 실행되도록
let isStage1Mapped = false;
let cachedStage1Data = null;

// 레거시 함수 - 더 이상 사용하지 않음
// extractAndMapShotSpecificData()가 대체
function mapStage1DataToBlocks(parsedData, forceUpdate = false) {
    console.warn('⚠️ mapStage1DataToBlocks() 호출됨 - 레거시 함수');
    console.log('   → extractAndMapShotSpecificData() 사용 권장');

    // 기본 블록은 건드리지 않음 (이미 잠김)
    // 캐릭터, 장소, 소품만 처리
    if (parsedData.characters && parsedData.characters.length > 0) {
        mapCharacterBlock(parsedData.characters);
    }

    if (parsedData.locations && parsedData.locations.length > 0) {
        mapLocationBlock(parsedData.locations[0]);
    }

    if (parsedData.props && parsedData.props.length > 0) {
        mapPropsBlock(parsedData.props);
    }
}

// ============================================================
// 기본 블록 파싱 (Stage1 film_metadata 전용)
// ============================================================

let basicBlockLocked = false; // 기본 블록 잠금 상태

/**
 * Stage1 film_metadata로 기본 블록 초기화
 * 최초 1회만 실행되며, 이후 영구 잠금
 */
function initBasicBlock(filmMetadata) {
    if (basicBlockLocked) {
        console.log('🔒 [기본블록] 잠김 상태 - 초기화 차단');
        return false;
    }

    if (!filmMetadata) {
        console.warn('⚠️ [기본블록] film_metadata 없음');
        return false;
    }

    console.log('🎬 [기본블록] Stage1 film_metadata로 초기화:', filmMetadata);

    const fields = {
        'style': filmMetadata.style || 'Cinematic',
        'artist': filmMetadata.artist || '',
        'medium': filmMetadata.medium || '',
        'genre': filmMetadata.genre || '',
        'era': filmMetadata.era || '',
        'quality': 'professional, Masterpiece, Highly detailed',
        'parameter': filmMetadata.aspect_ratio ? `--ar ${filmMetadata.aspect_ratio}` : '--ar 9:16'
    };

    // DOM 필드에 값 설정
    Object.entries(fields).forEach(([fieldName, value]) => {
        const input = document.querySelector(
            `.tab-pane[data-tab="basic"] .prompt-row-item[data-block="${fieldName}"] .prompt-input`
        );
        if (input && value) {
            input.value = value;
            console.log(`  ✅ ${fieldName}: "${value}"`);
        }
    });

    // 기본 블록 영구 잠금
    basicBlockLocked = true;
    console.log('🔐 [기본블록] 초기화 완료 및 영구 잠금');
    return true;
}

/**
 * 기본 블록 잠금 상태 확인
 */
function isBasicBlockLocked() {
    return basicBlockLocked;
}

// 레거시 함수 제거 - 더 이상 사용하지 않음
function mapBasicBlock() {
    console.warn('⚠️ mapBasicBlock() 호출됨 - 레거시 함수, 무시됨');
}

// ============================================================
// 연출 블록 파싱 (Stage2 scene 전용)
// ============================================================

/**
 * Stage2 샷 데이터로 연출 블록의 "장면" 필드 설정
 */
function setSceneFromStage2(shotId) {
    if (!shotId) {
        console.warn('⚠️ [연출블록] shotId 없음');
        return false;
    }

    try {
        const shotDataKey = `shot_${shotId}`;
        const shotDataStr = sessionStorage.getItem(shotDataKey);

        if (!shotDataStr) {
            console.warn(`⚠️ [연출블록] Stage2 데이터 없음: ${shotDataKey}`);
            return false;
        }

        const shotData = JSON.parse(shotDataStr);

        if (!shotData.scene) {
            console.warn('⚠️ [연출블록] scene 필드 없음');
            return false;
        }

        console.log('🎬 [연출블록] Stage2 scene 설정:', shotData.scene);

        // "장면" 필드에만 설정
        const sceneInput = document.querySelector(
            `.tab-pane[data-tab="scene"] .prompt-row-item[data-block="scene"] .prompt-input`
        );

        if (sceneInput) {
            sceneInput.value = shotData.scene;
            console.log('  ✅ 장면 필드 설정 완료');
            return true;
        } else {
            console.error('  ❌ 장면 필드를 찾을 수 없음');
            return false;
        }

    } catch (error) {
        console.error('❌ [연출블록] scene 설정 에러:', error);
        return false;
    }
}

// 레거시 함수 제거
function mapDirectionBlock() {
    console.warn('⚠️ mapDirectionBlock() 호출됨 - 레거시 함수, 무시됨');
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
        'object': locationData.blocks.object || '',
        'weather': locationData.blocks.weather || '',
        'natural-light': locationData.blocks.naturalLight || '',
        'artificial-light': locationData.blocks.artificialLight || '',
        'lighting': locationData.blocks.lighting || '',
        'foreground': locationData.blocks.foreground || '',
        'midground': locationData.blocks.midground || '',
        'background': locationData.blocks.background || '',
        'left-side': locationData.blocks.leftSide || '',
        'right-side': locationData.blocks.rightSide || '',
        'ceiling': locationData.blocks.ceiling || locationData.blocks.sky || '',
        'floor': locationData.blocks.floor || locationData.blocks.ground || ''
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
function mapPropsBlock(propsDataArray) {
    if (!propsDataArray || propsDataArray.length === 0) {
        console.log('❌ 소품 데이터가 없습니다.');
        return;
    }

    console.log('🎭 소품 데이터 매칭 시작:', propsDataArray);

    // 1. 소품 셀렉터 업데이트
    const propsForSelector = propsDataArray.map((prop, index) => ({
        index: index + 1,
        name: prop.name || `소품 ${index + 1}`,
        itemName: prop.blocks?.itemName || '',
        propDetail: prop.detail || ''
    }));

    console.log('🔄 소품 셀렉터 데이터:', propsForSelector);
    updatePropsSelector(propsForSelector);

    // 2. 파싱된 소품 데이터를 전역 변수에 저장
    parsedPropsData = {};
    propsDataArray.forEach((prop, index) => {
        const propNum = index + 1;
        parsedPropsData[propNum] = {
            name: prop.name || `소품 ${propNum}`,
            itemName: prop.blocks?.itemName || '',
            propDetail: prop.detail || ''
        };
    });
    console.log('💾 소품 데이터 저장 완료:', parsedPropsData);

    // 3. addedProps Set을 초기화하고 모든 소품 추가
    addedProps.clear();
    propsDataArray.forEach((_, index) => {
        addedProps.add(index + 1);
    });

    // 4. 소품 리스트 및 컨테이너 업데이트
    updatePropsList();
    updatePropsContainers();

    console.log('✅ 소품 블록 매칭 완료');
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
        console.log('🔵 loadStage1JSON 호출됨:', jsonData);
        if (jsonData) {
            shotDetailManager.stage1Data = jsonData;
            mapStage1DataToBlocks(jsonData);
            console.log('✅ Stage1 데이터 매핑 완료');
        } else {
            console.log('❌ jsonData가 없습니다.');
        }
    }
};

// 레거시 함수 - 새로운 initBasicBlock() 사용
function mapFilmMetadataToBasicBlock(filmMetadata) {
    console.log('⚠️ mapFilmMetadataToBasicBlock() 호출됨 - 새로운 함수로 리다이렉트');
    return initBasicBlock(filmMetadata);
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
let parsedPropsData = {}; // 파싱된 소품 데이터를 저장 (propNum: {itemName, propDetail})

// ===== 연출블록 데이터 저장 =====
let currentShotData = null; // 현재 샷의 Stage2 데이터 저장

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

    // 각 컬럼 가져오기
    const labelsColumn = propsTab.querySelector('.labels-column .label-list');
    const promptColumn = propsTab.querySelector('.prompt-column .prompt-blocks');
    const requestColumn = propsTab.querySelector('.request-column .request-blocks');

    if (!labelsColumn || !promptColumn || !requestColumn) {
        console.error('소품 블록 컬럼을 찾을 수 없습니다.');
        return;
    }

    // 기존 입력값 저장 (사용자가 수정한 값 우선 보존)
    const existingPromptValues = {};
    const existingRequestValues = {};

    promptColumn.querySelectorAll('.prompt-input[data-props-num]').forEach(input => {
        const propNum = input.getAttribute('data-props-num');
        if (propNum && input.value) {
            existingPromptValues[propNum] = input.value;
        }
    });

    requestColumn.querySelectorAll('.request-input[data-props-num]').forEach(input => {
        const propNum = input.getAttribute('data-props-num');
        if (propNum && input.value) {
            existingRequestValues[propNum] = input.value;
        }
    });

    // 기존 컨테이너 모두 제거
    labelsColumn.innerHTML = '';
    promptColumn.innerHTML = '';
    requestColumn.innerHTML = '';

    // 추가된 소품들에 대해 각 컬럼에 행 생성
    const sortedProps = Array.from(addedProps).sort((a, b) => a - b);

    sortedProps.forEach(num => {
        // 소품 선택기에서 해당 소품 이름 가져오기
        const selector = document.getElementById('propsSelector');
        const option = selector ? selector.querySelector(`option[value="${num}"]`) : null;
        const propsName = option ? option.textContent : `소품 ${num}`;

        // Column 1: 라벨
        const labelItem = document.createElement('div');
        labelItem.className = 'label-item';
        labelItem.setAttribute('data-block', `props${num}`);
        labelItem.innerHTML = `
            <span class="label-text">${propsName}</span>
            <button class="label-tag">PROPS_${num}</button>
        `;
        labelsColumn.appendChild(labelItem);

        // Column 2: 프롬프트 입력 (기존 값 or 파싱된 데이터 복원)
        const promptItem = document.createElement('div');
        promptItem.className = 'prompt-row-item';
        promptItem.setAttribute('data-block', `props${num}`);

        // 우선순위: 사용자가 수정한 값 > 파싱된 원본 데이터
        let promptValue = existingPromptValues[num];
        if (!promptValue && parsedPropsData[num]) {
            const { itemName, propDetail } = parsedPropsData[num];
            promptValue = [itemName, propDetail].filter(Boolean).join(', ');
        }

        promptItem.innerHTML = `
            <input type="text" class="prompt-input" placeholder="" value="${promptValue || ''}" data-props-num="${num}">
        `;
        promptColumn.appendChild(promptItem);

        // Column 3: 변경 요청 (기존 값 복원)
        const requestItem = document.createElement('div');
        requestItem.className = 'request-row-item';
        requestItem.setAttribute('data-block', `props${num}`);
        const savedRequestValue = existingRequestValues[num] || '';
        requestItem.innerHTML = `
            <input type="text" class="request-input" placeholder="" value="${savedRequestValue}" data-props-num="${num}">
        `;
        requestColumn.appendChild(requestItem);
    });

    console.log('✅ 소품 컨테이너 업데이트 완료:', sortedProps);
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

// ⚠️ 중복 제거됨 - 메인 DOMContentLoaded 리스너(421줄)에 통합됨
// document.addEventListener('DOMContentLoaded', function() { ... });

// Stage2 로드 캐시
let isStage2Loaded = false;

// 세션 스토리지에서 Stage2 데이터 로드
function loadStage2FromSessionStorage() {
    // 이미 로드됨
    if (isStage2Loaded) {
        console.log('⚠️ Stage2 이미 로드됨, 스킵');
        return;
    }

    try {
        const stage2CacheData = sessionStorage.getItem('stage2ParsedData');
        if (!stage2CacheData) {
            console.log('💡 세션 스토리지에 Stage2 데이터가 없습니다.');
            return;
        }

        isStage2Loaded = true;
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

// ===== 소품 데이터 파싱 및 표시 =====
let propsData = []; // 전역 소품 데이터 저장

// Stage1 JSON 파일에서 소품 데이터 파싱
function parsePropsFromStage1(jsonData) {
    try {
        if (!jsonData || !jsonData.visual_blocks || !jsonData.visual_blocks.props) {
            console.warn('소품 데이터가 없습니다.');
            return [];
        }

        const props = jsonData.visual_blocks.props;
        console.log('📦 소품 데이터 파싱:', props.length, '개');

        return props.map((prop, index) => ({
            id: prop.id,
            name: prop.name,
            itemName: prop.blocks['5_ITEM_NAME'] || '',
            propDetail: prop.prop_detail || '',
            index: index + 1
        }));
    } catch (error) {
        console.error('소품 데이터 파싱 오류:', error);
        return [];
    }
}

// 소품 셀렉터 업데이트
function updatePropsSelector(props) {
    console.log('🔵 updatePropsSelector 호출됨:', props);

    const selector = document.getElementById('propsSelector');
    if (!selector) {
        console.error('❌ 소품 셀렉터를 찾을 수 없습니다. #propsSelector');
        return;
    }

    console.log('✅ 소품 셀렉터 DOM 요소 찾음:', selector);

    // 기존 옵션 제거
    selector.innerHTML = '';

    // 새로운 옵션 추가
    props.forEach((prop, idx) => {
        const option = document.createElement('option');
        option.value = prop.index;
        option.textContent = `${prop.name}`;
        option.dataset.itemName = prop.itemName;
        option.dataset.propDetail = prop.propDetail;
        selector.appendChild(option);
        console.log(`📌 옵션 추가 [${idx}]:`, {
            value: prop.index,
            text: prop.name,
            itemName: prop.itemName,
            propDetail: prop.propDetail
        });
    });

    console.log('✅ 소품 셀렉터 업데이트 완료:', props.length, '개');
}

// 소품 선택 시 프롬프트 입력창 업데이트
function updatePropsPromptInput() {
    const selector = document.getElementById('propsSelector');
    const selectedOption = selector.options[selector.selectedIndex];

    if (!selectedOption) return;

    const itemName = selectedOption.dataset.itemName || '';
    const propDetail = selectedOption.dataset.propDetail || '';

    // 프롬프트 조합: itemName, propDetail
    const promptText = [itemName, propDetail].filter(Boolean).join(', ');

    // 소품 블록의 프롬프트 입력창 찾기
    const propsPromptInput = document.querySelector('.tab-pane[data-tab="props"] .prompt-row-item[data-block="props"] .prompt-input');

    if (propsPromptInput) {
        propsPromptInput.value = promptText;
        console.log('✅ 소품 프롬프트 업데이트:', promptText);
    }
}

// ⚠️ 중복 제거됨 - 메인 DOMContentLoaded 리스너(421줄)에 통합됨
// 소품 셀렉터 변경 이벤트 리스너

// JSON 업로드 시 소품 데이터 파싱 (기존 파일 업로드 핸들러와 연동)
window.parseAndLoadPropsData = function(jsonData) {
    propsData = parsePropsFromStage1(jsonData);

    if (propsData.length > 0) {
        updatePropsSelector(propsData);
        // 첫 번째 소품 자동 선택 및 프롬프트 표시
        updatePropsPromptInput();
    }
};