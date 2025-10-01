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
        const urlInput = document.getElementById('imageUrlInput');

        // 파일 선택 이벤트
        if (imageInput) {
            imageInput.addEventListener('change', (e) => this.handleImageSelect(e));
        }

        // URL 입력 Enter 키 이벤트
        if (urlInput) {
            urlInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addFromUrl(urlInput.value.trim());
                }
            });
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
    },

    addFromUrl(url) {
        if (this.uploadedImages.length >= 5) {
            alert('최대 5개까지만 업로드할 수 있습니다.');
            return;
        }

        if (!url || !url.trim()) {
            alert('URL을 입력해주세요.');
            return;
        }

        // URL 유효성 검사
        try {
            new URL(url);
        } catch (e) {
            alert('올바른 URL 형식이 아닙니다.');
            return;
        }

        // 이미지 로드 테스트
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            const imageData = {
                src: url,
                name: url.split('/').pop() || 'image-from-url'
            };
            this.uploadedImages.push(imageData);
            this.renderImages();

            // 입력 필드 초기화
            const urlInput = document.getElementById('imageUrlInput');
            if (urlInput) urlInput.value = '';
        };

        img.onerror = () => {
            alert('이미지를 로드할 수 없습니다. URL을 확인해주세요.');
        };

        img.src = url;
    }
};

// 전체 이미지 삭제 함수
window.clearAllImages = function() {
    if (confirm('모든 이미지를 삭제하시겠습니까?')) {
        imageUploadManager.clearAll();
    }
};

// URL에서 이미지 추가 함수
window.addImageFromUrl = function() {
    const urlInput = document.getElementById('imageUrlInput');
    if (urlInput) {
        imageUploadManager.addFromUrl(urlInput.value.trim());
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


// ===== 레거시 함수 제거됨 (Line 218-420) =====
// setStartDefaults() - 제거: 하드코딩된 기본값 불필요
// setEndDefaults() - 제거: 하드코딩된 기본값 불필요
// applyDefaultValues() - 제거: 헬퍼 함수 불필요
// applyPropsDefaults() - 제거: 헬퍼 함수 불필요
//
// 기본 블록은 initBasicBlock()으로 Stage1 film_metadata에서 자동 파싱됨
// START/END는 updateCameraCompositionFromFrame()으로 연출 블록의 구도만 변경됨

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

        // 장소 셀렉터 이벤트 리스너
        const locationSelector = document.getElementById('locationSelector');
        if (locationSelector) {
            locationSelector.addEventListener('change', function() {
                const selectedLocation = parseInt(this.value);
                displayLocationData(selectedLocation);
            });
        }

        // 파싱 버튼 이벤트 리스너
        const parseBtn = document.querySelector('.file-btn');
        if (parseBtn) {
            parseBtn.addEventListener('click', parseAllBlocksToFinalPrompt);
        }

        // localStorage에서 캐시된 film_metadata 로드
        loadCachedFilmMetadata();

        // URL에서 shotId 추출하여 즉시 헤더 업데이트
        const urlParams = new URLSearchParams(window.location.search);
        const shotId = urlParams.get('shotId');
        if (shotId) {
            console.log('🎯 URL에서 추출한 Shot ID:', shotId);

            // 모든 shot-id 요소 즉시 업데이트
            const shotIdElements = document.querySelectorAll('.shot-id');
            shotIdElements.forEach(el => {
                el.textContent = shotId;
            });

            // 파일 선택 영역의 label도 업데이트
            const fileSelectionLabel = document.querySelector('.file-selection-section .file-selector label');
            if (fileSelectionLabel) {
                fileSelectionLabel.textContent = shotId;
            }

            console.log('✅ Shot ID 헤더 업데이트 완료:', shotId);
        }

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
                            // 정확한 셀렉터: 연출 블록 탭(data-tab="scene") 내의 장면 필드(data-block="scene")
                            const sceneInput = document.querySelector('.tab-pane[data-tab="scene"] .prompt-blocks .prompt-row-item[data-block="scene"] .prompt-input');
                            if (sceneInput) {
                                sceneInput.value = shotData.scene;
                                console.log('✅ 연출 블록 장면 필드에 Stage2 scene 값 설정:', shotData.scene);
                            } else {
                                console.warn('⚠️ 연출 블록 장면 입력 필드를 찾을 수 없습니다.');
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

            // 연출 블록 탭으로 전환 시 데이터 자동 채우기
            if (targetTab === 'scene') {
                console.log('📥 연출 블록 탭 전환 - 데이터 자동 적용');

                // starting_frame 구도 적용 (START 버튼이 활성화되어 있지 않은 경우)
                const startBtn = document.querySelector('.start-btn');
                const endBtn = document.querySelector('.end-btn');

                if (endBtn && endBtn.classList.contains('active')) {
                    // END 버튼이 활성화되어 있으면 ending_frame 적용
                    updateCameraCompositionFromFrame('ending_frame');
                } else {
                    // 기본값: starting_frame 적용
                    updateCameraCompositionFromFrame('starting_frame');
                }

                // CAMERA_TECH 채우기
                fillCameraTechField();
            }

            // 캐릭터 블록 탭으로 전환 시 액션 자동 채우기
            if (targetTab === 'character') {
                console.log('📥 캐릭터 블록 탭 전환 - 액션 자동 적용');

                const startBtn = document.querySelector('.start-btn');
                const endBtn = document.querySelector('.end-btn');

                if (endBtn && endBtn.classList.contains('active')) {
                    // END 버튼이 활성화되어 있으면 ending_frame 적용
                    updateCharacterActions('ending_frame');
                } else {
                    // 기본값: starting_frame 적용
                    updateCharacterActions('starting_frame');
                }

                // UI 업데이트 (캐릭터 리스트 및 컨테이너)
                updateCharactersList();
                updateCharacterContainers();
            }

            // 타임라인 섹션 표시/숨김 (연출 블록에서만 표시)
            const timelineSection = document.querySelector('.timeline-section');
            if (timelineSection) {
                timelineSection.style.display = targetTab === 'scene' ? 'block' : 'none';
            }
        });
    });

    // START/END 액션 버튼 이벤트
    // 주석 처리: 개별 핸들러(handleStartButton, handleEndButton)로 대체됨
    // actionButtons.forEach(button => {
    //     button.addEventListener('click', function() {
    //         const action = this.getAttribute('data-action');
    //         if (action === 'start') {
    //             setStartDefaults();
    //             this.classList.add('active');
    //             const endBtn = document.querySelector('.action-btn[data-action="end"]');
    //             if (endBtn) endBtn.classList.remove('active');
    //         } else if (action === 'end') {
    //             setEndDefaults();
    //             this.classList.add('active');
    //             const startBtn = document.querySelector('.action-btn[data-action="start"]');
    //             if (startBtn) startBtn.classList.remove('active');
    //         }
    //     });
    // });
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

    // 전역 디바운스 타이머
    let globalDebounceTimer = null;

    // 입력 필드 변경 감지 (안전하게 처리)
    document.querySelectorAll('.prompt-input').forEach(input => {
        if (input) {
            input.addEventListener('input', function(e) {
                clearTimeout(globalDebounceTimer);
                globalDebounceTimer = setTimeout(() => {
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
    // 2-1단계: starting_frame의 camera_composition 자동 적용
    // ========================================
    console.log('📥 [통합파싱] starting_frame 구도 자동 적용');
    updateCameraCompositionFromFrame('starting_frame');

    // ========================================
    // 2-2단계: CAMERA_TECH 자동 적용
    // ========================================
    console.log('📥 [통합파싱] CAMERA_TECH 자동 적용');
    fillCameraTechField();

    // ========================================
    // 3단계: 기타 블록 매핑 (캐릭터, 장소, 소품 - 원본 데이터 사용)
    // ========================================

    // 디버그: stage1Data 구조 확인
    console.log('🔍 [디버그] stage1Data 구조:', {
        hasVisualBlocks: !!stage1Data.visual_blocks,
        hasCharacters: !!(stage1Data.visual_blocks && stage1Data.visual_blocks.characters),
        charactersLength: stage1Data.visual_blocks?.characters?.length,
        firstCharacter: stage1Data.visual_blocks?.characters?.[0]
    });

    // 캐릭터 블록 - 원본 visual_blocks.characters 직접 사용
    if (stage1Data.visual_blocks && stage1Data.visual_blocks.characters) {
        console.log('📥 [통합파싱] 캐릭터 블록 매핑 (원본 데이터)');
        mapCharacterBlock(stage1Data.visual_blocks.characters);
    } else {
        console.error('❌ [통합파싱] visual_blocks.characters를 찾을 수 없음');
        console.log('   stage1Data 전체 구조:', stage1Data);
    }

    // 장소 블록 - 원본 visual_blocks.locations 직접 사용
    if (stage1Data.visual_blocks && stage1Data.visual_blocks.locations) {
        console.log('📥 [통합파싱] 장소 블록 매핑 (원본 데이터)');
        mapLocationBlock(stage1Data.visual_blocks.locations[0]);
    }

    // 소품 블록 - 원본 visual_blocks.props 직접 사용
    if (stage1Data.visual_blocks && stage1Data.visual_blocks.props) {
        console.log('📥 [통합파싱] 소품 블록 매핑 (원본 데이터)');
        mapPropsBlock(stage1Data.visual_blocks.props);
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

// START 버튼 핸들러 - starting_frame 데이터 적용
function handleStartButton() {
    const startBtn = document.querySelector('.start-btn');
    const endBtn = document.querySelector('.end-btn');

    // 버튼 활성화 상태 토글
    startBtn.classList.toggle('active');

    if (startBtn.classList.contains('active')) {
        // END 버튼 비활성화
        if (endBtn) endBtn.classList.remove('active');

        console.log('🟢 START 버튼 활성화 - starting_frame 데이터 적용');

        // Stage2 데이터에서 starting_frame의 camera_composition 가져와서 구도 필드 업데이트
        updateCameraCompositionFromFrame('starting_frame');

        // 캐릭터 액션 업데이트
        updateCharacterActions('starting_frame');

        // 모든 탭에 대해 프롬프트 생성
        generateAllTabPrompts();

        showNotification('✅ START: starting_frame 데이터가 적용되었습니다.', 'success');
    } else {
        console.log('⚪ START 버튼 비활성화');
        showNotification('START 비활성화', 'info');
    }
}

// END 버튼 핸들러
function handleEndButton() {
    const endBtn = document.querySelector('.end-btn');
    const startBtn = document.querySelector('.start-btn');

    // 버튼 활성화 상태 토글
    endBtn.classList.toggle('active');

    if (endBtn.classList.contains('active')) {
        // START 버튼 비활성화
        if (startBtn) startBtn.classList.remove('active');

        console.log('🔴 END 버튼 활성화');

        // Stage2 데이터에서 ending_frame의 camera_composition 가져와서 구도 필드 업데이트
        updateCameraCompositionFromFrame('ending_frame');

        // 캐릭터 액션 업데이트
        updateCharacterActions('ending_frame');

        // 프롬프트 재생성
        generateAllTabPrompts();

        showNotification('✅ END: ending_frame 데이터가 적용되었습니다.', 'success');
    } else {
        console.log('⚪ END 버튼 비활성화');
        showNotification('END 비활성화', 'info');
    }
}

// CAMERA_TECH 필드 채우기 (Stage1 데이터에서)
function fillCameraTechField() {
    try {
        // sessionStorage에서 Stage1 데이터 가져오기
        const stage1DataStr = sessionStorage.getItem('stage1ParsedData');
        if (!stage1DataStr) {
            console.log('💡 Stage1 데이터가 없어서 CAMERA_TECH를 채울 수 없음');
            return;
        }

        const stage1Data = JSON.parse(stage1DataStr);

        // visual_blocks.locations에서 CAMERA_TECH 찾기
        let cameraTech = '';

        if (stage1Data.locations && stage1Data.locations.length > 0) {
            const location = stage1Data.locations[0];
            // blocks 객체에서 CAMERA_TECH 찾기
            if (location.blocks) {
                // 23_CAMERA_TECH 또는 CAMERA_TECH 키 찾기
                cameraTech = location.blocks['23_CAMERA_TECH'] ||
                            location.blocks['CAMERA_TECH'] ||
                            location.blocks.camera_tech || '';
            }
        }

        if (cameraTech) {
            const cameraTechInput = document.querySelector('.tab-pane[data-tab="scene"] .prompt-row-item[data-block="camera-tech"] .prompt-input');
            if (cameraTechInput) {
                cameraTechInput.value = cameraTech;
                console.log(`✅ CAMERA_TECH 필드 업데이트: ${cameraTech}`);
            } else {
                console.warn('⚠️ CAMERA_TECH 입력 필드를 찾을 수 없음');
            }
        } else {
            console.log('💡 Stage1 데이터에 CAMERA_TECH가 없음');
        }
    } catch (error) {
        console.error('❌ CAMERA_TECH 채우기 에러:', error);
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

// 최종 프롬프트 복사 (globalFinalPrompt textarea용)
function copyFinalPrompt() {
    const finalPromptTextarea = document.getElementById('globalFinalPrompt');
    if (finalPromptTextarea && finalPromptTextarea.value) {
        navigator.clipboard.writeText(finalPromptTextarea.value).then(() => {
            // 복사 버튼 애니메이션
            const copyBtn = document.querySelector('.global-final-prompt-section .copy-prompt-btn');
            if (copyBtn) {
                copyBtn.classList.add('copied');
                const spanText = copyBtn.querySelector('span');
                if (spanText) {
                    const originalText = spanText.textContent;
                    spanText.textContent = '복사됨!';

                    setTimeout(() => {
                        spanText.textContent = originalText;
                        copyBtn.classList.remove('copied');
                    }, 2000);
                }
            }

            showNotification('최종 프롬프트가 클립보드에 복사되었습니다.', 'success');
        }).catch(err => {
            console.error('복사 실패:', err);
            showNotification('복사에 실패했습니다. 텍스트를 선택하여 수동으로 복사해주세요.', 'error');
        });
    } else {
        showNotification('복사할 프롬프트가 없습니다. 먼저 "파싱" 버튼을 눌러주세요.', 'warning');
    }
}

// 전역으로 노출
window.copyFinalPrompt = copyFinalPrompt;

// 모든 블록의 프롬프트를 수집해서 최종 프롬프트에 표시
function parseAllBlocksToFinalPrompt() {
    console.log('🔄 파싱 버튼 클릭 - 모든 블록 프롬프트 수집 시작');

    const promptLines = [];
    const parameters = []; // 매개변수 (--ar, --style 등) 따로 저장

    // 블록 라벨명 매핑 (data-block → 대문자 라벨)
    const labelMap = {
        // 기본 블록
        'style': 'STYLE',
        'artist': 'ARTIST',
        'medium': 'MEDIUM',
        'genre': 'GENRE',
        'era': 'ERA',
        'quality': 'QUALITY',
        'parameter': 'PARAMETER',
        // 연출 블록
        'scene': 'SCENE',
        'camera': 'CAMERA',
        'camera-tech': 'CAMERA_TECH',
        // 캐릭터 블록
        'character1': 'CHARACTER_1',
        'character1-detail': 'CHAR1_DETAIL',
        'character1-action': 'CHAR1_ACTION',
        'character2': 'CHARACTER_2',
        'character2-detail': 'CHAR2_DETAIL',
        'character2-action': 'CHAR2_ACTION',
        'character3': 'CHARACTER_3',
        'character3-detail': 'CHAR3_DETAIL',
        'character3-action': 'CHAR3_ACTION',
        'character4': 'CHARACTER_4',
        'character4-detail': 'CHAR4_DETAIL',
        'character4-action': 'CHAR4_ACTION',
        // 장소 블록
        'location': 'LOCATION',
        'atmosphere': 'ATMOSPHERE',
        'color-tone': 'COLOR_TONE',
        'scale': 'SCALE',
        'architecture': 'ARCHITECTURE',
        'material': 'MATERIAL',
        'object': 'OBJECT',
        'weather': 'WEATHER',
        'natural-light': 'NATURAL_LIGHT',
        'artificial-light': 'ARTIFICIAL_LIGHT',
        'lighting': 'LIGHTING',
        'foreground': 'FOREGROUND',
        'midground': 'MIDGROUND',
        'background': 'BACKGROUND',
        'left-side': 'LEFT_SIDE',
        'right-side': 'RIGHT_SIDE',
        'ceiling': 'CEILING',
        'floor': 'FLOOR',
        // 소품 블록
        'props': 'PROPS'
    };

    // 모든 탭의 프롬프트 입력 필드 수집
    const allInputs = document.querySelectorAll('.tab-pane .prompt-input');

    allInputs.forEach(input => {
        const value = input.value.trim();
        if (!value) return;

        // --로 시작하는 매개변수는 따로 저장
        if (value.startsWith('--')) {
            parameters.push(value);
            return;
        }

        // data-block 속성에서 라벨명 가져오기
        const promptRow = input.closest('.prompt-row-item');
        if (promptRow) {
            const blockName = promptRow.getAttribute('data-block');
            const label = labelMap[blockName] || blockName.toUpperCase();

            // "LABEL: value;" 형식으로 추가
            promptLines.push(`${label}: ${value};`);
        }
    });

    console.log('  📦 수집된 프롬프트:', promptLines.length, '개');
    console.log('  📊 매개변수:', parameters.length, '개');

    // 줄바꿈으로 연결
    let finalPrompt = promptLines.join('\n');

    // 매개변수가 있으면 마지막에 추가 (공백으로 구분)
    if (parameters.length > 0) {
        finalPrompt += '\n' + parameters.join(' ');
    }

    console.log('  ✅ 최종 프롬프트 길이:', finalPrompt.length, '자');

    // 최종 블록 프롬프트 textarea에 표시
    const finalPromptTextarea = document.getElementById('globalFinalPrompt');
    if (finalPromptTextarea) {
        finalPromptTextarea.value = finalPrompt;
        console.log('  ✅ 최종 프롬프트 텍스트창에 표시 완료');
        showNotification('프롬프트 파싱 완료!', 'success');
    } else {
        console.error('  ❌ 최종 프롬프트 텍스트창을 찾을 수 없습니다.');
        showNotification('프롬프트 텍스트창을 찾을 수 없습니다.', 'error');
    }
}

// 전역으로 노출
window.parseAllBlocksToFinalPrompt = parseAllBlocksToFinalPrompt;

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

        // "장면" 필드에만 설정 (정확한 셀렉터 사용)
        const sceneInput = document.querySelector(
            `.tab-pane[data-tab="scene"] .prompt-blocks .prompt-row-item[data-block="scene"] .prompt-input`
        );

        if (sceneInput) {
            sceneInput.value = shotData.scene;
            console.log('  ✅ 연출블록 장면 필드에 Stage2 scene 설정 완료:', shotData.scene);
            return true;
        } else {
            console.error('  ❌ 연출블록 장면 필드를 찾을 수 없음');
            console.error('  셀렉터:', '.tab-pane[data-tab="scene"] .prompt-blocks .prompt-row-item[data-block="scene"] .prompt-input');
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

// ===== 캐릭터 블록 파싱 (Stage1 + Stage2 통합) =====

// 전역 캐릭터 데이터 저장
let parsedCharactersData = [];

/**
 * 캐릭터 셀렉터에 모든 캐릭터 표시
 */
function updateCharacterSelector(charactersData) {
    if (!charactersData || charactersData.length === 0) {
        console.log('⚠️ 캐릭터 데이터가 없습니다.');
        return;
    }

    const selector = document.getElementById('characterSelector');
    if (!selector) {
        console.warn('⚠️ #characterSelector를 찾을 수 없습니다.');
        return;
    }

    // 기존 옵션 제거 (첫 번째 제외)
    selector.innerHTML = '';

    // 캐릭터 옵션 추가
    charactersData.forEach((char, index) => {
        const option = document.createElement('option');
        option.value = index + 1;
        option.textContent = char.name || `캐릭터 ${index + 1}`;
        selector.appendChild(option);
    });

    console.log(`✅ 캐릭터 셀렉터 업데이트 완료: ${charactersData.length}개`);
}

/**
 * 캐릭터 블록 데이터 매칭
 */
function mapCharacterBlock(charactersData) {
    if (!charactersData || charactersData.length === 0) {
        console.log('⚠️ 캐릭터 데이터가 없습니다.');
        return;
    }

    // 전역 변수에 저장
    parsedCharactersData = charactersData;

    console.log('🎭 캐릭터 블록 매핑 시작:', charactersData.length, '개');

    // 캐릭터 셀렉터 업데이트
    updateCharacterSelector(charactersData);

    // JSON 파일의 모든 캐릭터를 addedCharacters에 추가
    addedCharacters.clear();
    charactersData.forEach((char, index) => {
        addedCharacters.add(index + 1);
    });

    console.log(`✅ 캐릭터 ${addedCharacters.size}개 자동 추가:`, Array.from(addedCharacters));

    // 먼저 UI 업데이트 (컨테이너 표시)
    updateCharactersList();
    updateCharacterContainers();

    // sessionStorage에서 Stage1 원본 데이터 가져오기
    const stage1DataStr = sessionStorage.getItem('stage1OriginalData');
    let stage1Characters = null;

    if (stage1DataStr) {
        try {
            const stage1Data = JSON.parse(stage1DataStr);
            stage1Characters = stage1Data.visual_blocks?.characters;
            console.log('📦 sessionStorage에서 Stage1 캐릭터 데이터 로드:', stage1Characters);
        } catch (error) {
            console.error('❌ Stage1 데이터 파싱 에러:', error);
        }
    }

    // 그 다음 각 캐릭터 데이터 매핑
    charactersData.forEach((char, index) => {
        const charNum = index + 1;

        console.log(`🔍 [캐릭터${charNum}] 원본 데이터:`, {
            id: char.id,
            name: char.name,
            blocks: char.blocks,
            character_detail: char.character_detail
        });

        // 5_CHARACTER 값 (Stage1에서 직접 가져오기)
        let characterValue = '';
        if (stage1Characters && stage1Characters[index]) {
            characterValue = stage1Characters[index].blocks?.['5_CHARACTER'] ||
                           stage1Characters[index].blocks?.CHARACTER || '';
        }

        // character_detail 값 (현재 로직 유지)
        const detailValue = char.character_detail || char.detail || '';

        console.log(`📝 [캐릭터${charNum}] 추출된 값:`, {
            characterValue,
            detailValue: detailValue.substring(0, 50) + '...'
        });

        // 프롬프트 필드에 값 설정
        const characterInput = document.querySelector(
            `.tab-pane[data-tab="character"] .prompt-row-item[data-block="character${charNum}"] .prompt-input`
        );
        const detailInput = document.querySelector(
            `.tab-pane[data-tab="character"] .prompt-row-item[data-block="character${charNum}-detail"] .prompt-input`
        );

        console.log(`🎯 [캐릭터${charNum}] DOM 요소:`, {
            characterInput: characterInput ? '찾음' : '없음',
            detailInput: detailInput ? '찾음' : '없음'
        });

        if (characterInput) {
            characterInput.value = characterValue;
            console.log(`  ✅ 캐릭터${charNum} 프롬프트: ${characterValue}`);
        } else {
            console.error(`  ❌ 캐릭터${charNum} 프롬프트 입력 필드를 찾을 수 없음`);
        }

        if (detailInput) {
            detailInput.value = detailValue;
            console.log(`  ✅ 캐릭터${charNum} 디테일: ${detailValue.substring(0, 50)}...`);
        } else {
            console.error(`  ❌ 캐릭터${charNum} 디테일 입력 필드를 찾을 수 없음`);
        }
    });

    // starting_frame 액션 적용 (기본값)
    updateCharacterActions('starting_frame');

    console.log('✅ 캐릭터 블록 매핑 완료');
}

/**
 * 캐릭터 액션 업데이트 (START/END 버튼에 따라)
 */
function updateCharacterActions(frameType) {
    if (!parsedCharactersData || parsedCharactersData.length === 0) {
        console.log('⚠️ 캐릭터 데이터가 없어서 액션을 업데이트할 수 없습니다.');
        return;
    }

    try {
        // URL에서 shotId 가져오기
        const urlParams = new URLSearchParams(window.location.search);
        const shotId = urlParams.get('shotId');

        if (!shotId) {
            console.warn('⚠️ shotId가 없습니다.');
            return;
        }

        // sessionStorage에서 Stage2 샷 데이터 가져오기
        const shotDataStr = sessionStorage.getItem(`shot_${shotId}`);
        if (!shotDataStr) {
            console.warn(`⚠️ Stage2 데이터를 찾을 수 없습니다: shot_${shotId}`);
            return;
        }

        const shotData = JSON.parse(shotDataStr);
        const frame = shotData[frameType]; // starting_frame 또는 ending_frame

        if (!frame) {
            console.warn(`⚠️ ${frameType}이 없습니다.`);
            return;
        }

        console.log(`🎬 ${frameType} 캐릭터 액션 업데이트 시작`);

        // 각 캐릭터의 액션 업데이트
        parsedCharactersData.forEach((char, index) => {
            const charNum = index + 1;
            const charName = char.name; // 예: "Jinsu", "CEO"

            // frame 객체에서 캐릭터 이름으로 액션 찾기
            const actionValue = frame[charName] || '';

            if (actionValue) {
                const actionInput = document.querySelector(
                    `.tab-pane[data-tab="character"] .prompt-row-item[data-block="character${charNum}-action"] .prompt-input`
                );

                if (actionInput) {
                    actionInput.value = actionValue;
                    console.log(`  ✅ 캐릭터${charNum} (${charName}) 액션: ${actionValue}`);
                }
            }
        });

        console.log(`✅ ${frameType} 캐릭터 액션 업데이트 완료`);
    } catch (error) {
        console.error('❌ 캐릭터 액션 업데이트 에러:', error);
    }
}

// 전역 장소 데이터 저장
let parsedLocationsData = [];

/**
 * 장소 셀렉터에 모든 장소 표시
 */
function updateLocationSelector(locationsData) {
    if (!locationsData || locationsData.length === 0) {
        console.log('⚠️ 장소 데이터가 없습니다.');
        return;
    }

    const selector = document.getElementById('locationSelector');
    if (!selector) {
        console.warn('⚠️ #locationSelector를 찾을 수 없습니다.');
        return;
    }

    // 기존 옵션 제거
    selector.innerHTML = '';

    // 장소 옵션 추가
    locationsData.forEach((loc, index) => {
        const option = document.createElement('option');
        option.value = index + 1;
        option.textContent = loc.name || `장소 ${index + 1}`;
        selector.appendChild(option);
    });

    console.log(`✅ 장소 셀렉터 업데이트 완료: ${locationsData.length}개`);
}

/**
 * 특정 장소의 데이터를 UI에 표시
 */
function displayLocationData(locationNum) {
    if (!parsedLocationsData || parsedLocationsData.length === 0) {
        console.warn('⚠️ 장소 데이터가 없습니다.');
        return;
    }

    const locationIndex = locationNum - 1;
    if (locationIndex < 0 || locationIndex >= parsedLocationsData.length) {
        console.warn(`⚠️ 장소 ${locationNum} 데이터가 없습니다.`);
        return;
    }

    const locationData = parsedLocationsData[locationIndex];
    const blocks = locationData.blocks || {};

    console.log(`🏢 장소 ${locationNum} 데이터 표시:`, locationData.name);

    // Stage1 blocks 필드명 → HTML data-block 매핑
    const mapping = {
        'location': blocks['5_LOCATION'] || '',
        'atmosphere': blocks['9_ATMOSPHERE'] || '',
        'color-tone': blocks['10_COLOR_TONE'] || '',
        'scale': blocks['11_SCALE'] || '',
        'architecture': blocks['12_ARCHITECTURE'] || '',
        'material': blocks['13_MATERIAL'] || '',
        'object': blocks['14_OBJECT'] || '',
        'weather': blocks['15_WEATHER'] || '',
        'natural-light': blocks['16_NATURAL_LIGHT'] || '',
        'artificial-light': blocks['17_ARTIFICIAL_LIGHT'] || '',
        'lighting': blocks['18_LIGHTING'] || '',
        'foreground': blocks['19_FOREGROUND'] || '',
        'midground': blocks['20_MIDGROUND'] || '',
        'background': blocks['21_BACKGROUND'] || '',
        'left-side': blocks['22_LEFT_SIDE'] || '',
        'right-side': blocks['23_RIGHT_SIDE'] || '',
        'ceiling': blocks['24_CEILING/SKY'] || '',
        'floor': blocks['25_FLOOR/GROUND'] || ''
    };

    const locationTab = document.querySelector('.tab-pane[data-tab="location"]');
    if (!locationTab) return;

    // 장소블록 탭의 입력 필드에 값 설정 및 빈 값 숨기기
    Object.entries(mapping).forEach(([field, value]) => {
        // 라벨 아이템 찾기
        const labelItem = locationTab.querySelector(`.label-item[data-block="${field}"]`);
        // 프롬프트 입력 찾기
        const promptRow = locationTab.querySelector(`.prompt-row-item[data-block="${field}"]`);
        // 변경 요청 찾기
        const requestRow = locationTab.querySelector(`.request-row-item[data-block="${field}"]`);

        if (value) {
            // 값이 있으면 표시하고 값 설정
            if (labelItem) labelItem.style.display = '';
            if (promptRow) {
                promptRow.style.display = '';
                const input = promptRow.querySelector('.prompt-input');
                if (input) input.value = value;
            }
            if (requestRow) requestRow.style.display = '';
        } else {
            // 값이 없으면 숨기기
            if (labelItem) labelItem.style.display = 'none';
            if (promptRow) promptRow.style.display = 'none';
            if (requestRow) requestRow.style.display = 'none';
        }
    });
}

/**
 * 장소블록 데이터 매칭 (캐릭터 블록과 동일한 패턴)
 */
function mapLocationBlock(locationData) {
    if (!locationData) return;

    console.log('🏢 장소 블록 매핑 시작:', locationData);

    // sessionStorage에서 Stage1 원본 데이터 가져오기
    const stage1DataStr = sessionStorage.getItem('stage1OriginalData');
    let stage1Locations = null;

    if (stage1DataStr) {
        try {
            const stage1Data = JSON.parse(stage1DataStr);
            stage1Locations = stage1Data.visual_blocks?.locations;
            console.log('📦 Stage1 원본 장소 데이터 (전체):', stage1Locations);
        } catch (error) {
            console.error('❌ Stage1 데이터 파싱 에러:', error);
        }
    }

    if (!stage1Locations || stage1Locations.length === 0) {
        console.warn('⚠️ Stage1 장소 데이터가 없습니다.');
        return;
    }

    // 전역 변수에 저장
    parsedLocationsData = stage1Locations;

    // 장소 셀렉터 업데이트
    updateLocationSelector(stage1Locations);

    // JSON 파일의 모든 장소를 addedLocations에 추가
    addedLocations.clear();
    stage1Locations.forEach((loc, index) => {
        addedLocations.add(index + 1);
    });

    console.log(`✅ 장소 ${addedLocations.size}개 자동 추가:`, Array.from(addedLocations));

    // 장소 리스트 UI 업데이트
    updateLocationsList();
    updateLocationContainers();

    // 장소 선택 UI 표시
    const locationCompactContainer = document.querySelector('.location-compact-container');
    if (locationCompactContainer) {
        locationCompactContainer.style.display = '';
    }

    // 기본적으로 첫 번째 장소 표시
    displayLocationData(1);

    console.log('✅ 장소 블록 매핑 완료');
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
window.regenerateImage = async function() {
    console.log('🎨 이미지 생성 시작');

    const generationResult = document.getElementById('generationResult');
    const finalPromptTextarea = document.getElementById('globalFinalPrompt');

    if (!generationResult) {
        console.error('❌ 생성 결과 영역을 찾을 수 없습니다');
        return;
    }

    // 1. 프롬프트 확인
    const prompt = finalPromptTextarea?.value.trim();
    if (!prompt) {
        showNotification('먼저 "파싱" 버튼을 눌러 프롬프트를 생성해주세요.', 'warning');
        return;
    }

    // 2. API 키 확인
    if (!window.nanoBananaAPI || !window.nanoBananaAPI.isReady()) {
        // API 초기화 시도
        window.nanoBananaAPI?.init();

        if (!window.nanoBananaAPI || !window.nanoBananaAPI.isReady()) {
            showNotification('Gemini API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.', 'error');
            return;
        }
    }

    // 3. 업로드된 이미지 확인
    const uploadedImages = imageUploadManager.uploadedImages || [];
    console.log(`📸 업로드된 이미지: ${uploadedImages.length}개`);

    // 4. 로딩 상태 표시
    generationResult.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin" style="animation: spin 1s linear infinite;">
                <circle cx="12" cy="12" r="10" stroke-opacity="0.3"/>
                <path d="M12 2 A10 10 0 0 1 22 12" stroke-linecap="round"/>
            </svg>
            <p style="margin-top: 10px; color: #ccc;">이미지 생성 중...</p>
            <p style="font-size: 10px; color: #666; margin-top: 5px;">Nano Banana AI 사용</p>
        </div>
    `;

    try {
        let result;

        if (uploadedImages.length > 0) {
            // 이미지가 있으면 이미지 참조하여 생성
            console.log('🖼️ 참조 이미지와 함께 생성');

            // 이미지를 base64로 변환
            const imageData = uploadedImages.slice(0, 3).map(img => ({
                base64: img.src.split(',')[1], // data:image/...;base64, 제거
                mimeType: img.src.match(/data:(.*?);/)?.[1] || 'image/jpeg'
            }));

            // composeImages 사용
            if (imageData.length > 1) {
                result = await window.nanoBananaAPI.composeImages(imageData, prompt);
            } else {
                // 단일 이미지는 editImage 사용
                result = await window.nanoBananaAPI.editImage(
                    imageData[0].base64,
                    prompt,
                    { mimeType: imageData[0].mimeType }
                );
            }
        } else {
            // 이미지 없이 프롬프트만으로 생성
            console.log('📝 프롬프트만으로 생성');
            result = await window.nanoBananaAPI.generateImage(prompt);
        }

        // 5. 결과 표시
        if (result.success) {
            console.log('✅ 이미지 생성 성공');
            generationResult.classList.add('has-image');
            generationResult.innerHTML = `
                <img src="${result.imageUrl}" alt="Generated Image" style="width: 100%; height: 100%; object-fit: contain; border-radius: 8px;">
            `;

            // 비용 정보 표시
            const costInfo = `토큰: ${result.tokensUsed}, 비용: $${result.cost.toFixed(3)}`;
            showNotification(`이미지 생성 완료! (${costInfo})`, 'success');
        } else {
            console.error('❌ 이미지 생성 실패:', result.error);

            // 실패 상태 표시
            generationResult.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #ff6b6b;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                    <p style="margin-top: 10px;">생성 실패</p>
                    <p style="font-size: 11px; color: #999; margin-top: 5px;">${result.error || '알 수 없는 오류'}</p>
                    ${result.suggestion ? `<p style="font-size: 10px; color: #666; margin-top: 8px;">${result.suggestion}</p>` : ''}
                </div>
            `;

            showNotification(result.error || '이미지 생성에 실패했습니다.', 'error');
        }

    } catch (error) {
        console.error('❌ 이미지 생성 오류:', error);

        // 에러 상태 표시
        generationResult.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #ff6b6b;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                <p style="margin-top: 10px;">오류 발생</p>
                <p style="font-size: 11px; color: #999; margin-top: 5px;">${error.message}</p>
            </div>
        `;

        showNotification(`오류: ${error.message}`, 'error');
    }
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
        // populateForm 호출하지 않음 - 기본 블록 보호
        console.log('✅ [loadData] 데이터 로드됨, populateForm 스킵');
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
const addedCharacters = new Set(); // JSON 파일에서 자동으로 채워짐

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

    // JSON에서 파싱된 캐릭터가 있으면 그대로 유지, 없으면 캐릭터 1만 추가
    if (parsedCharactersData && parsedCharactersData.length > 0) {
        parsedCharactersData.forEach((char, index) => {
            addedCharacters.add(index + 1);
        });
        showNotification('JSON 파일의 캐릭터로 초기화되었습니다.', 'info');
    } else {
        addedCharacters.add(1);
        showNotification('모든 캐릭터가 제거되었습니다. (캐릭터 1 기본 유지)', 'info');
    }

    updateCharactersList();
    updateCharacterContainers();
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
        // JSON 데이터에서 캐릭터 이름 가져오기
        let characterName = `캐릭터 ${num}`;
        if (parsedCharactersData && parsedCharactersData[num - 1]) {
            characterName = parsedCharactersData[num - 1].name || `캐릭터 ${num}`;
        }

        const item = document.createElement('div');
        item.className = 'added-character-item';
        item.setAttribute('data-character-num', num);
        item.innerHTML = `
            <div class="item-header">
                <span class="character-name">${characterName}</span>
                <button class="remove-character-btn" onclick="removeCharacter(${num})" title="제거">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
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
        item.className = 'selected-location-chip';
        item.setAttribute('data-location-num', num);
        item.innerHTML = `
            <span>장소 ${num}</span>
            <button class="chip-remove-btn" onclick="removeLocation(${num})">×</button>
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
        item.className = 'selected-props-chip';
        item.setAttribute('data-props-num', num);

        item.innerHTML = `
            <span>소품 ${num}</span>
            <button class="chip-remove-btn" onclick="removeProps(${num})">×</button>
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
        let shotId = urlParams.get('shotId');

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
        // ✅ 정확한 셀렉터: 연출 블록 탭의 장면(scene) 필드만 찾기
        const sceneInput = document.querySelector(
            '.tab-pane[data-tab="scene"] .prompt-blocks .prompt-row-item[data-block="scene"] .prompt-input'
        );

        if (sceneInput) {
            console.log('✅ 연출 블록 장면 필드 찾음');
            return sceneInput;
        }

        console.error('❌ 연출 블록 장면 필드를 찾을 수 없음');
        console.error('   셀렉터:', '.tab-pane[data-tab="scene"] .prompt-blocks .prompt-row-item[data-block="scene"] .prompt-input');
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
// 페이지 언로드 시 정리
window.addEventListener('beforeunload', function() {
    // 모든 타이머 정리
    const highestId = setTimeout(() => {}, 0);
    for (let i = 0; i < highestId; i++) {
        clearTimeout(i);
    }
});

// iframe이 숨겨질 때 정리
window.addEventListener('pagehide', function() {
    // 초기화 플래그 리셋
    isInitialized = false;
    isFormEventsInitialized = false;
});
