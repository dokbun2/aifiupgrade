// Shot Detail Modal JavaScript

// Stage 1 JSON 파서 스크립트 로드
const script = document.createElement('script');
script.src = '../js/stage1-parser.js';
document.head.appendChild(script);

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
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

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
        populateForm(data);

        // 헤더 업데이트
        document.querySelector('.shot-id').textContent = data.id;
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
        'style': basicData.style,
        'artist': basicData.artist,
        'medium': basicData.medium,
        'genre': basicData.genre,
        'era': basicData.era,
        'quality': 'professional, Masterpiece, Highly detailed',
        'parameter': basicData.aspectRatio ? `--ar ${basicData.aspectRatio}` : '--ar 9:16'
    };

    // 기본블록 탭의 입력 필드에 값 설정
    Object.entries(mapping).forEach(([field, value]) => {
        const input = document.querySelector(`.tab-pane[data-tab="basic"] .prompt-row-item[data-block="${field}"] .prompt-input`);
        if (input && value) {
            input.value = value;
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