// Shot Detail Modal JavaScript

// 샷 상세 데이터 관리
const shotDetailManager = {
    currentShot: null,
    currentTab: 'basic',

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

            // 타임라인 섹션 표시/숨김 (언출 블록에서만 표시)
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

    // 드롭다운 변경 감지 (존재하는 경우만)
    document.querySelectorAll('.prompt-dropdown, .request-dropdown').forEach(select => {
        if (select) {
            select.addEventListener('change', updatePromptPreview);
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
    // iframe 내부에서 실행되는지 확인
    if (window.parent !== window) {
        // 부모 창의 모달 닫기 함수 호출
        window.parent.storyboardManager.closeShotDetailModal();
    } else if (window.opener) {
        window.close();
    } else if (window.history.length > 1) {
        window.history.back();
    } else {
        // 스토리보드 페이지로 이동
        window.location.href = 'storyboard/index.html';
    }
}

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
    }
};