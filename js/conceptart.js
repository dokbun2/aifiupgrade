// Concept Art Page JavaScript
let conceptData = {
    characters: [],
    locations: [],
    props: [],
    currentCharacter: null,
    currentLocation: null,
    currentProps: null,
    currentType: null,  // Track the current selection type
    prompts: {},
    images: {},
    universal: null,
    universal_translated: null
};

// Show notification message
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        font-size: 14px;
        font-weight: 500;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;

    // Add animation keyframes if not already added
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(400px); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== DOMContentLoaded - Initializing ConceptArt page ===');

    // 우선순위: conceptArtData (스토리보드에서 변환한 데이터) > mergedData > storyboardData
    const savedConceptData = localStorage.getItem('conceptArtData');
    const storyboardData = localStorage.getItem('mergedData') || localStorage.getItem('storyboardData');

    if (savedConceptData) {
        // 컨셉아트 데이터가 있으면 바로 로드 (이미 변환된 데이터)
        try {
            console.log('Loading concept art data from localStorage');
            loadSavedData();
            showNotification('컨셉아트 데이터가 자동으로 로드되었습니다!', 'success');
        } catch (error) {
            console.error('Failed to load concept art data:', error);
        }
    } else if (storyboardData) {
        // 컨셉아트 데이터가 없고 스토리보드 데이터만 있으면 변환 후 사용
        try {
            let jsonData = JSON.parse(storyboardData);
            console.log('Auto-loading data from storyboard:', jsonData);
            processJSONData(jsonData);
            showNotification('스토리보드 데이터가 자동으로 로드되었습니다!', 'success');
        } catch (error) {
            console.error('Failed to auto-load storyboard data:', error);
        }
    }

    // ConceptArtManager와 초기 동기화
    if (window.conceptArtManager) {
        console.log('🔄 ConceptArtManager와 초기 동기화 시작...');
        syncWithConceptArtManager();
        window.conceptArtManager.syncAll();
        console.log('✅ ConceptArtManager 초기 동기화 완료');
    }

    console.log('After data load - conceptData summary:', {
        characters: conceptData.characters?.length || 0,
        locations: conceptData.locations?.length || 0,
        props: conceptData.props?.length || 0,
        currentSelection: conceptData.currentCharacter || conceptData.currentLocation || conceptData.currentProps || 'None',
        currentType: conceptData.currentType || 'None',
        promptsCount: Object.keys(conceptData.prompts || {}).length,
        hasUniversal: !!conceptData.universal
    });

    initializeEventListeners();
    setDefaultDropdownValues();

    // 프롬프트가 제대로 로드되지 않았으면 기본값 설정
    if (!conceptData.universal && !conceptData.universal_translated && !conceptData.voice_style) {
        const universalElement = document.getElementById('universal-prompt');
        const universalTransElement = document.getElementById('universal-prompt-translated');
        const voiceStyleElement = document.getElementById('voice-style-display');

        if (universalElement) {
            universalElement.textContent = '기본 프롬프트가 여기에 표시됩니다...';
        }
        if (universalTransElement) {
            universalTransElement.textContent = '번역된 프롬프트가 여기에 표시됩니다...';
        }
        if (voiceStyleElement) {
            voiceStyleElement.textContent = '음성 스타일이 여기에 표시됩니다...';
        }
    } else {
        // 데이터가 있으면 표시
        updatePromptDisplay();
    }
});

// Set default dropdown values
function setDefaultDropdownValues() {
    // Set default text for dropdowns
    const characterBtn = document.querySelector('#character-dropdown')?.previousElementSibling;
    if (characterBtn && !conceptData.currentCharacter) {
        const span = characterBtn.querySelector('span');
        if (span) span.textContent = '캐릭터';
    }

    const locationBtn = document.querySelector('#location-dropdown')?.previousElementSibling;
    if (locationBtn && !conceptData.currentLocation) {
        const span = locationBtn.querySelector('span');
        if (span) span.textContent = '장소';
    }

    const propsBtn = document.querySelector('#props-dropdown')?.previousElementSibling;
    if (propsBtn && !conceptData.currentProps) {
        const span = propsBtn.querySelector('span');
        if (span) span.textContent = '소품';
    }
}

// Load saved data from localStorage
function loadSavedData() {
    const saved = localStorage.getItem('conceptArtData');
    console.log('loadSavedData - Raw data from localStorage:', saved ? 'Found' : 'Not found');
    if (saved) {
        try {
            conceptData = JSON.parse(saved);
            console.log('loadSavedData - Parsed conceptData:', conceptData);
            console.log('loadSavedData - 로드된 데이터 상세:', {
                universal: conceptData.universal ? '있음 (길이: ' + conceptData.universal.length + ')' : '없음',
                universal_translated: conceptData.universal_translated ? '있음 (길이: ' + conceptData.universal_translated.length + ')' : '없음',
                voice_style: conceptData.voice_style ? '있음' : '없음',
                prompts: Object.keys(conceptData.prompts || {}).length + '개',
                characters: conceptData.characters?.length || 0,
                locations: conceptData.locations?.length || 0,
                props: conceptData.props?.length || 0
            });

            // Rebuild dropdowns if data exists
            if (conceptData.characters && conceptData.characters.length > 0) {
                const characterDropdown = document.getElementById('character-dropdown');
                if (characterDropdown) {
                    characterDropdown.innerHTML = '';
                    conceptData.characters.forEach(char => {
                        const item = document.createElement('div');
                        item.className = 'dropdown-item';
                        item.onclick = () => selectItem('character', char.id);
                        // Display only the name, not the ID
                        item.textContent = char.name || char.id;
                        characterDropdown.appendChild(item);
                    });
                }

                // Auto-select the current character if saved, otherwise first character
                setTimeout(() => {
                    if (conceptData.currentCharacter) {
                        console.log('Selecting saved character:', conceptData.currentCharacter);
                        selectItem('character', conceptData.currentCharacter);
                        // Update dropdown button text with name
                        const character = conceptData.characters?.find(c => c.id === conceptData.currentCharacter);
                        const characterBtn = document.querySelector('#character-dropdown')?.previousElementSibling;
                        if (characterBtn && character) {
                            const span = characterBtn.querySelector('span');
                            if (span) span.textContent = character.name || conceptData.currentCharacter;
                        }
                    } else if (conceptData.characters.length > 0) {
                        const firstCharacter = conceptData.characters[0];
                        selectItem('character', firstCharacter.id);
                    }
                }, 100);
            }

            // Rebuild location dropdown
            if (conceptData.locations && conceptData.locations.length > 0) {
                const locationDropdown = document.getElementById('location-dropdown');
                if (locationDropdown) {
                    locationDropdown.innerHTML = '';
                    conceptData.locations.forEach(loc => {
                        const item = document.createElement('div');
                        item.className = 'dropdown-item';
                        item.onclick = () => selectItem('location', loc.id);
                        // Display only the name, not the ID
                        item.textContent = loc.name || loc.id;
                        locationDropdown.appendChild(item);
                    });
                }

                // Update button text if location was selected
                if (conceptData.currentLocation) {
                    const location = conceptData.locations?.find(l => l.id === conceptData.currentLocation);
                    const locationBtn = document.querySelector('#location-dropdown')?.previousElementSibling;
                    if (locationBtn && location) {
                        const span = locationBtn.querySelector('span');
                        if (span) span.textContent = location.name || conceptData.currentLocation;
                    }
                }
            }

            // Rebuild props dropdown
            if (conceptData.props && conceptData.props.length > 0) {
                const propsDropdown = document.getElementById('props-dropdown');
                if (propsDropdown) {
                    propsDropdown.innerHTML = '';
                    conceptData.props.forEach(prop => {
                        const item = document.createElement('div');
                        item.className = 'dropdown-item';
                        item.onclick = () => selectItem('props', prop.id);
                        // Display only the name, not the ID
                        item.textContent = prop.name || prop.id;
                        propsDropdown.appendChild(item);
                    });
                }

                // Update button text if props was selected
                if (conceptData.currentProps) {
                    const prop = conceptData.props?.find(p => p.id === conceptData.currentProps);
                    const propsBtn = document.querySelector('#props-dropdown')?.previousElementSibling;
                    if (propsBtn && prop) {
                        const span = propsBtn.querySelector('span');
                        if (span) span.textContent = prop.name || conceptData.currentProps;
                    }
                }
            }

            // Load universal prompts if they exist (줄바꿈 유지)
            console.log('📂 loadSavedData - universal 프롬프트 복원:', {
                있음: !!conceptData.universal,
                내용: conceptData.universal ? conceptData.universal.substring(0, 50) + '...' : '없음'
            });

            if (conceptData.universal && conceptData.universal !== '기본 프롬프트가 여기에 표시됩니다...') {
                const universalElement = document.getElementById('universal-prompt');
                if (universalElement) {
                    // formatPromptForDisplay 사용하지 않고 직접 줄바꿈 변환
                    universalElement.innerHTML = conceptData.universal.replace(/\n/g, '<br>');
                    console.log('✅ universal 프롬프트 화면에 표시됨');
                }
            } else {
                // 프롬프트가 없으면 기본 텍스트 표시
                const universalElement = document.getElementById('universal-prompt');
                if (universalElement) {
                    universalElement.textContent = '기본 프롬프트가 여기에 표시됩니다...';
                    console.log('⚠️ universal 프롬프트 없음 - 기본 텍스트 표시');
                }
            }

            if (conceptData.universal_translated && conceptData.universal_translated !== '번역된 프롬프트가 여기에 표시됩니다...' && conceptData.universal_translated !== 'No character detail available') {
                const universalTransElement = document.getElementById('universal-prompt-translated');
                if (universalTransElement) {
                    // formatPromptForDisplay 사용하지 않고 직접 줄바꿈 변환
                    universalTransElement.innerHTML = conceptData.universal_translated.replace(/\n/g, '<br>');
                }
            } else {
                // 번역된 프롬프트가 없으면 기본 텍스트 표시
                const universalTransElement = document.getElementById('universal-prompt-translated');
                if (universalTransElement) {
                    universalTransElement.textContent = '번역된 프롬프트가 여기에 표시됩니다...';
                }
            }

            if (conceptData.voice_style && conceptData.voice_style !== '음성 스타일이 여기에 표시됩니다...') {
                const voiceElement = document.getElementById('voice-style-display');
                if (voiceElement) {
                    voiceElement.innerHTML = conceptData.voice_style.replace(/\n/g, '<br>');
                }
            }

            // 모든 항목의 프롬프트 데이터 복원 (추가된 항목 포함)
            if (conceptData.prompts) {
                console.log('loadSavedData - 프롬프트 데이터 복원 중...', Object.keys(conceptData.prompts).length + '개 항목');

                // prompts 객체의 모든 항목을 순회하며 복원
                Object.keys(conceptData.prompts).forEach(itemId => {
                    const promptData = conceptData.prompts[itemId];

                    // 각 항목이 characters, locations, props에 존재하는지 확인
                    let found = false;

                    if (conceptData.characters?.some(c => c.id === itemId)) {
                        found = true;
                    } else if (conceptData.locations?.some(l => l.id === itemId)) {
                        found = true;
                    } else if (conceptData.props?.some(p => p.id === itemId)) {
                        found = true;
                    }

                    if (found) {
                        console.log(`✓ 프롬프트 복원: ${itemId}`, {
                            universal: promptData.universal ? '있음' : '없음',
                            universal_translated: promptData.universal_translated ? '있음' : '없음',
                            voice_style: promptData.voice_style ? '있음' : '없음'
                        });
                    }
                });
            }

            // Load the current selected item's data if available
            setTimeout(() => {
                if (conceptData.currentType && conceptData.prompts) {
                    let currentItemId = null;
                    if (conceptData.currentType === 'character' && conceptData.currentCharacter) {
                        currentItemId = conceptData.currentCharacter;
                    } else if (conceptData.currentType === 'location' && conceptData.currentLocation) {
                        currentItemId = conceptData.currentLocation;
                    } else if (conceptData.currentType === 'props' && conceptData.currentProps) {
                        currentItemId = conceptData.currentProps;
                    }

                    if (currentItemId && conceptData.prompts[currentItemId]) {
                        console.log('Loading data for current selection:', currentItemId);
                        // Call loadDataByTypeAndId to properly load the data
                        loadDataByTypeAndId(conceptData.currentType, currentItemId);
                    }
                }

                // Update image gallery after loading data
                console.log('Updating image gallery with loaded data');
                updateImageGallery();

                // Check if images exist for current selection
                if (conceptData.images && conceptData.currentCharacter) {
                    const currentImages = conceptData.images[conceptData.currentCharacter];
                    console.log(`Images for ${conceptData.currentCharacter}:`, currentImages ? currentImages.length : 0);
                }
            }, 200); // Wait a bit for DOM to be ready

            console.log('loadSavedData - Successfully loaded all data');
        } catch (e) {
            console.error('Failed to load saved data:', e);
            console.error('Error details:', e.stack);
        }
    } else {
        console.log('loadSavedData - No saved data found in localStorage');
    }
}

// Save data to localStorage and sync with ConceptArtManager
function saveData() {
    try {
        // 저장 전 데이터 확인 (디버깅)
        console.log('saveData - 저장할 데이터:', {
            universal: conceptData.universal ? '있음' : '없음',
            universal_translated: conceptData.universal_translated ? '있음' : '없음',
            voice_style: conceptData.voice_style ? '있음' : '없음',
            prompts: Object.keys(conceptData.prompts || {}).length + '개',
            characters: conceptData.characters?.length || 0,
            locations: conceptData.locations?.length || 0,
            props: conceptData.props?.length || 0,
            currentCharacter: conceptData.currentCharacter || '없음',
            currentLocation: conceptData.currentLocation || '없음',
            currentProps: conceptData.currentProps || '없음',
            currentType: conceptData.currentType || '없음'
        });

        // prompts 객체의 상세 정보 로깅
        if (conceptData.prompts && Object.keys(conceptData.prompts).length > 0) {
            console.log('saveData - prompts 상세:', Object.keys(conceptData.prompts).map(key => {
                const p = conceptData.prompts[key];
                return {
                    id: key,
                    universal: p.universal ? `${p.universal.substring(0, 30)}...` : '없음',
                    universal_translated: p.universal_translated ? `${p.universal_translated.substring(0, 30)}...` : '없음',
                    voice_style: p.voice_style ? '있음' : '없음'
                };
            }));
        }

        const dataToSave = JSON.stringify(conceptData);
        console.log('saveData - Saving data, size:', dataToSave.length, 'bytes');
        localStorage.setItem('conceptArtData', dataToSave);
        console.log('saveData - Data saved successfully');

        // ConceptArtManager와 동기화
        if (window.conceptArtManager) {
            syncWithConceptArtManager();
        }
    } catch (e) {
        console.error('Failed to save data:', e);
        if (e.name === 'QuotaExceededError') {
            console.error('localStorage quota exceeded!');
        }
    }
}

// ConceptArtManager와 데이터 동기화
function syncWithConceptArtManager() {
    if (!window.conceptArtManager) {
        console.warn('ConceptArtManager not available');
        return;
    }

    console.log('🔄 ConceptArtManager와 동기화 시작...');

    // 현재 conceptData의 캐릭터, 장소, 소품을 ConceptArtManager에 추가
    const currentData = window.conceptArtManager.getData() || { characters: [], locations: [], props: [] };

    // 캐릭터 동기화
    if (conceptData.characters && Array.isArray(conceptData.characters)) {
        conceptData.characters.forEach(char => {
            // 중복 체크
            const exists = currentData.characters.some(c =>
                c.name === char.name || c.id === char.id
            );

            if (!exists) {
                window.conceptArtManager.addCharacter({
                    name: char.name || `캐릭터 ${char.id}`,
                    description: char.description || '',
                    appearance: char.appearance || '',
                    personality: char.personality || '',
                    image: char.image || ''
                });
            }
        });
    }

    // 장소 동기화
    if (conceptData.locations && Array.isArray(conceptData.locations)) {
        conceptData.locations.forEach(loc => {
            // 중복 체크
            const exists = currentData.locations.some(l =>
                l.name === loc.name || l.id === loc.id
            );

            if (!exists) {
                window.conceptArtManager.addLocation({
                    name: loc.name || `장소 ${loc.id}`,
                    description: loc.description || '',
                    atmosphere: loc.atmosphere || '',
                    image: loc.image || ''
                });
            }
        });
    }

    // 소품 동기화
    if (conceptData.props && Array.isArray(conceptData.props)) {
        conceptData.props.forEach(prop => {
            // 중복 체크
            const exists = currentData.props.some(p =>
                p.name === prop.name || p.id === prop.id
            );

            if (!exists) {
                window.conceptArtManager.addProp({
                    name: prop.name || `소품 ${prop.id}`,
                    description: prop.description || '',
                    function: prop.function || '',
                    image: prop.image || ''
                });
            }
        });
    }

    console.log('✅ ConceptArtManager 동기화 완료');
}

// 드래그 앤 드롭 초기화 함수
function initializeDragAndDrop(urlInput) {
    const dropZone = urlInput.parentElement; // image-upload div

    // 드래그 이벤트 방지 (기본 동작 막기)
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // 드래그 오버 시 하이라이트
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('drag-over');
            urlInput.style.borderColor = '#ff6b6b';
            urlInput.style.backgroundColor = 'rgba(255, 107, 107, 0.05)';
            urlInput.placeholder = '이미지를 여기에 놓으세요...';
        }, false);
    });

    // 드래그 리브 시 하이라이트 제거
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('drag-over');
            urlInput.style.borderColor = '';
            urlInput.style.backgroundColor = '';
            urlInput.placeholder = '이미지 URL을 입력하세요...';
        }, false);
    });

    // 드롭 이벤트 처리
    dropZone.addEventListener('drop', handleDrop, false);

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    async function handleDrop(e) {
        const dt = e.dataTransfer;

        // 텍스트 데이터 처리 (URL 드래그)
        const text = dt.getData('text/plain');
        if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
            urlInput.value = convertDropboxUrl(text);
            return;
        }

        // HTML 데이터 처리 (이미지 태그 드래그)
        const html = dt.getData('text/html');
        if (html) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            const img = tempDiv.querySelector('img');
            if (img && img.src) {
                urlInput.value = convertDropboxUrl(img.src);
                return;
            }
        }

        // 파일 처리
        const files = dt.files;
        if (files && files.length > 0) {
            handleFiles(files);
        }
    }

    function handleFiles(files) {
        ([...files]).forEach(uploadFile);
    }

    function uploadFile(file) {
        // 이미지 파일인지 확인
        if (!file.type.match('image.*')) {
            alert('이미지 파일만 업로드 가능합니다.');
            return;
        }

        // 파일 크기 확인 (10MB 제한)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            alert('파일 크기는 10MB를 초과할 수 없습니다.');
            return;
        }

        // FileReader를 사용해 데이터 URL로 변환
        const reader = new FileReader();
        reader.onload = function(e) {
            const dataUrl = e.target.result;

            // 이미지 직접 추가
            addImageFromDataUrl(dataUrl, file.name);

            // URL 입력란 초기화
            urlInput.value = '';

            // 성공 피드백
            showUploadSuccess(file.name);
        };

        reader.onerror = function() {
            alert('파일을 읽는 중 오류가 발생했습니다.');
        };

        reader.readAsDataURL(file);
    }

    // 업로드 성공 피드백 표시
    function showUploadSuccess(filename) {
        const toast = document.createElement('div');
        toast.className = 'upload-toast';
        toast.textContent = `"${filename}" 업로드 완료!`;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// 데이터 URL로부터 이미지 추가
function addImageFromDataUrl(dataUrl, filename) {
    // 현재 선택된 항목 확인
    let currentKey = null;
    if (conceptData.currentType === 'character' && conceptData.currentCharacter) {
        currentKey = conceptData.currentCharacter;
    } else if (conceptData.currentType === 'location' && conceptData.currentLocation) {
        currentKey = conceptData.currentLocation;
    } else if (conceptData.currentType === 'props' && conceptData.currentProps) {
        currentKey = conceptData.currentProps;
    }

    if (!currentKey) {
        alert('캐릭터, 장소, 또는 소품을 먼저 선택해주세요.');
        return;
    }

    const imageId = Date.now();
    const imageData = {
        id: imageId,
        url: dataUrl,
        type: conceptData.currentType,
        itemId: currentKey,
        timestamp: new Date().toISOString(),
        filename: filename || 'uploaded-image',
        isLocal: true // 로컬 파일 표시
    };

    // Initialize images object if it doesn't exist
    if (!conceptData.images) {
        conceptData.images = {};
    }

    // Initialize array for current key if it doesn't exist
    if (!conceptData.images[currentKey]) {
        conceptData.images[currentKey] = [];
    }

    conceptData.images[currentKey].push(imageData);
    addImageToGallery(imageData);
    saveData();
}

// Initialize event listeners
function initializeEventListeners() {
    // Input field listeners for prompt generation
    const fields = ['style', 'medium', 'character', 'camera', 'gaze', 'body'];
    fields.forEach(field => {
        const originalInput = document.getElementById(`${field}-original`);
        const translatedInput = document.getElementById(`${field}-translated`);

        if (originalInput) {
            originalInput.addEventListener('input', updatePromptDisplay);
        }
        if (translatedInput) {
            translatedInput.addEventListener('input', updatePromptDisplay);
        }
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown-container')) {
            document.querySelectorAll('.dropdown-content').forEach(dropdown => {
                dropdown.classList.remove('show');
            });
        }
    });

    // Auto-convert Dropbox URLs on paste
    const urlInput = document.getElementById('image-url');
    if (urlInput) {
        urlInput.addEventListener('paste', (e) => {
            setTimeout(() => {
                const pastedUrl = urlInput.value;
                const convertedUrl = convertDropboxUrl(pastedUrl);
                if (pastedUrl !== convertedUrl) {
                    urlInput.value = convertedUrl;
                    console.log('Dropbox URL auto-converted:', convertedUrl);
                }
            }, 10);
        });

        // Also convert on blur (when user clicks away)
        urlInput.addEventListener('blur', () => {
            const currentUrl = urlInput.value;
            const convertedUrl = convertDropboxUrl(currentUrl);
            if (currentUrl !== convertedUrl) {
                urlInput.value = convertedUrl;
            }
        });

        // 드래그 앤 드롭 기능 추가
        initializeDragAndDrop(urlInput);
    }
}

// Toggle dropdown menu
function toggleDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    const allDropdowns = document.querySelectorAll('.dropdown-content');

    // Close other dropdowns
    allDropdowns.forEach(d => {
        if (d.id !== dropdownId) {
            d.classList.remove('show');
        }
    });

    // Toggle current dropdown
    dropdown.classList.toggle('show');
}

// Select item from dropdown
function selectItem(type, value) {
    console.log(`Selecting ${type}: ${value}`);

    // Set the current type to track latest selection
    conceptData.currentType = type;

    if (type === 'character') {
        conceptData.currentCharacter = value;
        // Clear other selections
        conceptData.currentLocation = null;
        conceptData.currentProps = null;

        // Find the character name by ID
        const character = conceptData.characters?.find(c => c.id === value);
        const displayName = character?.name || value;

        // Update button text with name instead of ID
        const button = document.querySelector('#character-dropdown')?.previousElementSibling;
        if (button) {
            const span = button.querySelector('span');
            if (span) span.textContent = displayName;
        }

        // Load data based on type
        loadDataByTypeAndId('character', value);
    } else if (type === 'location') {
        conceptData.currentLocation = value;
        // Clear other selections
        conceptData.currentCharacter = null;
        conceptData.currentProps = null;

        // Find the location name by ID
        const location = conceptData.locations?.find(l => l.id === value);
        const displayName = location?.name || value;

        // Update button text with name instead of ID
        const button = document.querySelector('#location-dropdown')?.previousElementSibling;
        if (button) {
            const span = button.querySelector('span');
            if (span) span.textContent = displayName;
        }

        // Load data based on type
        loadDataByTypeAndId('location', value);
    } else if (type === 'props') {
        conceptData.currentProps = value;
        // Clear other selections
        conceptData.currentCharacter = null;
        conceptData.currentLocation = null;

        // Find the prop name by ID
        const prop = conceptData.props?.find(p => p.id === value);
        const displayName = prop?.name || value;

        // Update button text with name instead of ID
        const button = document.querySelector('#props-dropdown')?.previousElementSibling;
        if (button) {
            const span = button.querySelector('span');
            if (span) span.textContent = displayName;
        }

        // Load data based on type
        loadDataByTypeAndId('props', value);
    }

    // Close dropdown
    document.querySelectorAll('.dropdown-content').forEach(dropdown => {
        dropdown.classList.remove('show');
    });

    // Update image gallery for the selected item
    updateImageGallery();

    saveData();
}

// Format prompt for display
function formatPromptForDisplay(promptText) {
    if (!promptText || promptText === '기본 프롬프트가 여기에 표시됩니다...' || promptText === '번역된 프롬프트가 여기에 표시됩니다...') {
        return promptText;
    }

    // Split by semicolon and format each part
    const parts = promptText.split(';').map(part => part.trim()).filter(part => part);

    // Join with proper formatting - each item on new line with semicolon
    // Don't add semicolon to the last item
    const formatted = parts.map((part, index) => {
        const isLast = index === parts.length - 1;
        return isLast ? part : part + ';';
    }).join('\n');

    return formatted;
}

// Load data by type and ID
function loadDataByTypeAndId(type, id) {
    console.log(`Loading data for ${type}: ${id}`);

    // 디버깅: prompts 객체의 키 목록 확인
    if (conceptData.prompts) {
        const allKeys = Object.keys(conceptData.prompts);
        console.log('📋 prompts 객체의 모든 키:', allKeys.length > 10 ? `${allKeys.slice(0, 10).join(', ')}... (총 ${allKeys.length}개)` : allKeys.join(', '));

        // 선택된 id와 유사한 키 찾기
        const similarKeys = allKeys.filter(key => key.includes(id) || id.includes(key));
        if (similarKeys.length > 0) {
            console.log(`🔍 "${id}"와 유사한 키 발견:`, similarKeys);
        }

        // 정확히 일치하는 키 확인
        if (conceptData.prompts[id]) {
            console.log(`✅ prompts["${id}"] 존재함:`, conceptData.prompts[id]);
        } else {
            console.log(`❌ prompts["${id}"] 존재하지 않음`);
        }
    }

    if (!conceptData.prompts || !conceptData.prompts[id]) {
        console.log(`⚠️ No data found for ${type}: ${id}`);
        // Clear the display when no data
        const universalElement = document.getElementById('universal-prompt');
        const universalTransElement = document.getElementById('universal-prompt-translated');
        const voiceStyleSection = document.getElementById('voice-style-section');
        const voiceStyleDisplay = document.getElementById('voice-style-display');
        const voiceStyleActions = document.getElementById('voice-style-actions');

        if (universalElement) {
            universalElement.innerHTML = '기본 프롬프트가 여기에 표시됩니다...';
        }
        if (universalTransElement) {
            universalTransElement.innerHTML = '번역된 프롬프트가 여기에 표시됩니다...';
        }

        // Hide voice style section when no data
        if (voiceStyleSection) {
            voiceStyleSection.style.display = 'none';
        }
        if (voiceStyleActions) {
            voiceStyleActions.style.display = 'none';
        }
        if (voiceStyleDisplay) {
            voiceStyleDisplay.innerHTML = '음성 스타일이 여기에 표시됩니다...';
        }
        conceptData.voice_style = null;

        return;
    }

    const data = conceptData.prompts[id];
    console.log(`Found data for ${id}:`, data);

    // Check if data has blocks (Stage1 format) or universal prompts
    if (data && typeof data === 'object') {
        // Check for blocks (Stage1 format) - exclude character_detail and voice_style from blocks check
        const hasBlocks = Object.keys(data).some(key => key.includes('_') && key !== 'character_detail' && key !== 'voice_style');

        if (hasBlocks) {
            // Stage1 format - sort blocks by number
            const blockKeys = Object.keys(data)
                .filter(key => key.includes('_') && key !== 'character_detail' && key !== 'voice_style')
                .sort((a, b) => {
                    // Extract numbers from keys like "1_STYLE", "10_CHARACTER_SHEET"
                    const numA = parseInt(a.split('_')[0]);
                    const numB = parseInt(b.split('_')[0]);
                    return numA - numB;
                });

            // Format blocks with line breaks and semicolons
            const validBlocks = blockKeys
                .map(key => {
                    const value = data[key];
                    // Only include blocks with actual values
                    if (value && value.trim()) {
                        const label = key.substring(key.indexOf('_') + 1);
                        return { label, value };
                    }
                    return null;
                })
                .filter(item => item !== null);

            // Format blocks with semicolons (except the last one)
            const formattedBlocks = validBlocks
                .map((block, index) => {
                    const isLast = index === validBlocks.length - 1;
                    return `${block.label}: ${block.value}${isLast ? '' : ';'}`;
                });

            // Display version with line breaks
            const displayVersion = formattedBlocks.join('\n');

            // Copy version - all on one line with proper formatting
            const combinedPrompt = formattedBlocks.join('\n');

            conceptData.universal = combinedPrompt;
            conceptData.universal_translated = data.character_detail || null;

            // Display the formatted blocks with line breaks
            const universalElement = document.getElementById('universal-prompt');
            if (universalElement) {
                // Use <br> for HTML line breaks and preserve formatting
                universalElement.innerHTML = displayVersion.replace(/\n/g, '<br>');
                console.log(`Updated universal prompt from blocks for ${id}`);
            }

            // Display character_detail in translated area (if exists)
            const universalTransElement = document.getElementById('universal-prompt-translated');
            if (universalTransElement) {
                if (data.character_detail && data.character_detail !== 'No character detail available') {
                    universalTransElement.innerHTML = data.character_detail.replace(/\n/g, '<br>');
                    conceptData.universal_translated = data.character_detail;
                } else {
                    universalTransElement.textContent = '번역된 프롬프트가 여기에 표시됩니다...';
                    conceptData.universal_translated = null;
                }
            }

            // Display voice_style in voice style area
            const voiceStyleSection = document.getElementById('voice-style-section');
            const voiceStyleDisplay = document.getElementById('voice-style-display');
            const voiceStyleActions = document.getElementById('voice-style-actions');

            if (voiceStyleSection && voiceStyleDisplay) {
                if (data.voice_style && data.voice_style.trim()) {
                    // Show the voice style section
                    voiceStyleSection.style.display = 'block';
                    if (voiceStyleActions) voiceStyleActions.style.display = 'flex';

                    // Display the voice style
                    voiceStyleDisplay.innerHTML = data.voice_style;

                    // Store voice_style in conceptData for copying
                    conceptData.voice_style = data.voice_style;
                } else {
                    // Hide the voice style section when no data
                    voiceStyleSection.style.display = 'none';
                    if (voiceStyleActions) voiceStyleActions.style.display = 'none';
                    voiceStyleDisplay.innerHTML = '음성 스타일이 여기에 표시됩니다...';
                    conceptData.voice_style = null;
                }
            }
        } else {
            // Original format with universal prompts
            conceptData.universal = data.universal || null;
            conceptData.universal_translated = data.universal_translated || null;

            // Load universal prompts (줄바꿈만 변환, 포맷 변경 없음)
            if (data.universal) {
                const universalElement = document.getElementById('universal-prompt');
                if (universalElement) {
                    // formatPromptForDisplay 사용하지 않고 직접 줄바꿈만 변환
                    universalElement.innerHTML = data.universal.replace(/\n/g, '<br>');
                    console.log(`Updated universal prompt for ${id}`);
                }
            }
            if (data.universal_translated) {
                const universalTransElement = document.getElementById('universal-prompt-translated');
                if (universalTransElement) {
                    // formatPromptForDisplay 사용하지 않고 직접 줄바꿈만 변환
                    universalTransElement.innerHTML = data.universal_translated.replace(/\n/g, '<br>');
                }
            }
        }
    }

    updatePromptDisplay();
}


// Update prompt display
function updatePromptDisplay() {
    console.log('updatePromptDisplay 호출됨, 현재 데이터:', {
        universal: conceptData.universal ? '있음' : '없음',
        universal_translated: conceptData.universal_translated ? '있음' : '없음',
        voice_style: conceptData.voice_style ? '있음' : '없음'
    });

    // HTML에 input 필드가 없으므로 conceptData에서 직접 가져옴
    const universalPromptElement = document.getElementById('universal-prompt');
    const universalTransElement = document.getElementById('universal-prompt-translated');
    const voiceStyleElement = document.getElementById('voice-style-display');

    // Universal prompt 표시
    if (universalPromptElement) {
        if (conceptData.universal && conceptData.universal !== '기본 프롬프트가 여기에 표시됩니다...' && conceptData.universal !== '') {
            universalPromptElement.innerHTML = conceptData.universal.replace(/\n/g, '<br>');
        } else {
            universalPromptElement.textContent = '기본 프롬프트가 여기에 표시됩니다...';
        }
    }

    // Universal translated 표시
    if (universalTransElement) {
        if (conceptData.universal_translated &&
            conceptData.universal_translated !== '번역된 프롬프트가 여기에 표시됩니다...' &&
            conceptData.universal_translated !== 'No character detail available' &&
            conceptData.universal_translated !== '') {
            universalTransElement.innerHTML = conceptData.universal_translated.replace(/\n/g, '<br>');
        } else {
            universalTransElement.textContent = '번역된 프롬프트가 여기에 표시됩니다...';
        }
    }

    // Voice style 표시
    if (voiceStyleElement) {
        if (conceptData.voice_style && conceptData.voice_style !== '음성 스타일이 여기에 표시됩니다...' && conceptData.voice_style !== '') {
            voiceStyleElement.innerHTML = conceptData.voice_style.replace(/\n/g, '<br>');
        } else {
            voiceStyleElement.textContent = '음성 스타일이 여기에 표시됩니다...';
        }
    }

    // 데이터는 이미 conceptData.prompts에 저장되어 있음
    // 추가 저장 로직 불필요
}

// Copy prompt to clipboard
function copyPrompt() {
    // Use the combined prompt from conceptData (comma-separated version)
    const promptText = conceptData.universal;

    if (promptText && promptText !== '기본 프롬프트가 여기에 표시됩니다...') {
        navigator.clipboard.writeText(promptText).then(() => {
            // Change button text temporarily
            const copyBtn = event.target.closest('.copy-btn');
            if (copyBtn) {
                const originalHTML = copyBtn.innerHTML;
                copyBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    복사됨!
                `;

                setTimeout(() => {
                    copyBtn.innerHTML = originalHTML;
                }, 2000);
            }
        });
    }
}

// Convert Dropbox URL from dl=0 to raw=1 for direct image access
function convertDropboxUrl(url) {
    // Check if it's a Dropbox URL
    if (url.includes('dropbox.com')) {
        // Replace dl=0 with raw=1
        if (url.includes('dl=0')) {
            url = url.replace('dl=0', 'raw=1');
        }
        // If no dl parameter, add raw=1
        else if (!url.includes('raw=1')) {
            // Check if URL already has parameters
            const separator = url.includes('?') ? '&' : '?';
            url = url + separator + 'raw=1';
        }
    }
    return url;
}

// Add image from URL
function addImage() {
    const urlInput = document.getElementById('image-url');
    let url = urlInput.value.trim();

    if (url) {
        // Auto-convert Dropbox URLs
        url = convertDropboxUrl(url);
        // Get current selection key based on the latest selection type
        let currentKey = null;
        if (conceptData.currentType === 'character' && conceptData.currentCharacter) {
            currentKey = conceptData.currentCharacter;
        } else if (conceptData.currentType === 'location' && conceptData.currentLocation) {
            currentKey = conceptData.currentLocation;
        } else if (conceptData.currentType === 'props' && conceptData.currentProps) {
            currentKey = conceptData.currentProps;
        }

        if (!currentKey) {
            alert('캐릭터, 장소, 또는 소품을 먼저 선택해주세요.');
            return;
        }

        const imageId = Date.now();
        const imageData = {
            id: imageId,
            url: url,
            type: conceptData.currentType,
            itemId: currentKey,
            timestamp: new Date().toISOString()
        };

        // Initialize images object if it doesn't exist
        if (!conceptData.images) {
            conceptData.images = {};
        }

        // Initialize array for current key if it doesn't exist
        if (!conceptData.images[currentKey]) {
            conceptData.images[currentKey] = [];
        }

        conceptData.images[currentKey].push(imageData);
        addImageToGallery(imageData);
        urlInput.value = '';
        saveData();
    }
}

// Add image to gallery
function addImageToGallery(imageData) {
    const gallery = document.getElementById('image-gallery');

    // Remove placeholder if it exists
    const placeholder = gallery.querySelector('.image-placeholder');
    if (placeholder) {
        placeholder.remove();
    }

    // Create image element
    const imageItem = document.createElement('div');
    imageItem.className = 'image-item';
    imageItem.dataset.imageId = imageData.id;

    imageItem.innerHTML = `
        <img src="${imageData.url}" alt="Concept Art"
             onclick="openImageViewer('${imageData.url}', ${imageData.id}, ${imageData.saved || false})"
             onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22150%22 height=%22150%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23666%22 stroke-width=%222%22%3E%3Crect x=%223%22 y=%223%22 width=%2218%22 height=%2218%22 rx=%222%22/%3E%3Cline x1=%223%22 y1=%223%22 x2=%2221%22 y2=%2221%22/%3E%3Cline x1=%2221%22 y1=%223%22 x2=%223%22 y2=%2221%22/%3E%3C/svg%3E'">
        <div class="image-controls">
            <button class="control-btn delete-btn" onclick="deleteImage(${imageData.id})">×</button>
        </div>
    `;

    gallery.appendChild(imageItem);
}

// Update image gallery
function updateImageGallery() {
    const gallery = document.getElementById('image-gallery');
    if (!gallery) return;

    // Clear gallery
    gallery.innerHTML = '';

    // Get current selection key based on the latest selection type
    let currentKey = null;
    if (conceptData.currentType === 'character' && conceptData.currentCharacter) {
        currentKey = conceptData.currentCharacter;
    } else if (conceptData.currentType === 'location' && conceptData.currentLocation) {
        currentKey = conceptData.currentLocation;
    } else if (conceptData.currentType === 'props' && conceptData.currentProps) {
        currentKey = conceptData.currentProps;
    }

    // Get images for current selection
    let imagesToShow = [];
    if (currentKey && conceptData.images && conceptData.images[currentKey]) {
        imagesToShow = conceptData.images[currentKey];
    }

    if (imagesToShow && imagesToShow.length > 0) {
        imagesToShow.forEach(image => {
            addImageToGallery(image);
        });
    } else {
        // Add placeholder
        gallery.innerHTML = `
            <div class="image-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" opacity="0.3">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <p>이미지가 여기에 표시됩니다</p>
            </div>
        `;
    }
}

// Delete image
function deleteImage(imageId) {
    // Get current selection key based on the latest selection type
    let currentKey = null;
    if (conceptData.currentType === 'character' && conceptData.currentCharacter) {
        currentKey = conceptData.currentCharacter;
    } else if (conceptData.currentType === 'location' && conceptData.currentLocation) {
        currentKey = conceptData.currentLocation;
    } else if (conceptData.currentType === 'props' && conceptData.currentProps) {
        currentKey = conceptData.currentProps;
    }

    if (currentKey && conceptData.images && conceptData.images[currentKey]) {
        conceptData.images[currentKey] = conceptData.images[currentKey].filter(img => img.id !== imageId);

        // Remove empty array
        if (conceptData.images[currentKey].length === 0) {
            delete conceptData.images[currentKey];
        }
    }

    const imageItem = document.querySelector(`[data-image-id="${imageId}"]`);
    if (imageItem) {
        imageItem.remove();
    }

    // Show placeholder if no images left
    const gallery = document.getElementById('image-gallery');
    if (gallery && gallery.children.length === 0) {
        updateImageGallery();
    }
    saveData();
}

// Transform Stage1 data (visual_blocks) to our format
function transformStage1Data(data) {
    const transformed = {
        characters: [],
        locations: [],
        props: [],
        prompts: {},
        images: {},
        universal: data.universal || data.universal_translated || null,
        universal_translated: data.universal_translated || null
    };

    // Process characters
    if (data.visual_blocks && data.visual_blocks.characters) {
        data.visual_blocks.characters.forEach(char => {
            const charData = {
                id: char.id,
                name: char.name || char.id,
                blocks: char.blocks || {},
                character_detail: char.character_detail || null,
                voice_style: char.voice_style || null
            };

            // Store the character data
            transformed.characters.push(charData);

            // Store the blocks, character_detail and voice_style as prompts for this character
            // ID와 type을 함께 저장
            transformed.prompts[char.id] = {
                id: char.id,
                type: 'character',
                ...char.blocks,
                character_detail: char.character_detail || null,
                voice_style: char.voice_style || null,
                universal: transformed.universal,
                universal_translated: transformed.universal_translated
            };
        });
    }

    // Process locations
    if (data.visual_blocks && data.visual_blocks.locations) {
        data.visual_blocks.locations.forEach(loc => {
            const locData = {
                id: loc.id,
                name: loc.name || loc.id,
                blocks: loc.blocks || {},
                character_detail: loc.character_detail || null,
                voice_style: loc.voice_style || null
            };

            transformed.locations.push(locData);
            transformed.prompts[loc.id] = {
                id: loc.id,
                type: 'location',
                ...loc.blocks,
                character_detail: loc.character_detail || null,
                voice_style: loc.voice_style || null,
                universal: transformed.universal,
                universal_translated: transformed.universal_translated
            };
        });
    }

    // Process props
    if (data.visual_blocks && data.visual_blocks.props) {
        data.visual_blocks.props.forEach(prop => {
            const propData = {
                id: prop.id,
                name: prop.name || prop.id,
                blocks: prop.blocks || {},
                character_detail: prop.character_detail || null,
                voice_style: prop.voice_style || null
            };

            transformed.props.push(propData);
            transformed.prompts[prop.id] = {
                id: prop.id,
                type: 'props',
                ...prop.blocks,
                character_detail: prop.character_detail || null,
                voice_style: prop.voice_style || null,
                universal: transformed.universal,
                universal_translated: transformed.universal_translated
            };
        });
    }

    // Also store any film metadata if available
    if (data.film_metadata) {
        transformed.film_metadata = data.film_metadata;
    }

    console.log('Transformed Stage1 data:', {
        characters: transformed.characters.length,
        locations: transformed.locations.length,
        props: transformed.props.length,
        totalPrompts: Object.keys(transformed.prompts).length
    });

    return transformed;
}

// Transform Samurai Kid format to our format
function transformSamuraiKidData(data) {
    const transformed = {
        characters: [],
        locations: [],
        props: [],
        prompts: {}  // Changed from array to object
    };

    // Transform characters
    if (data.concept_art_collection?.characters) {
        Object.entries(data.concept_art_collection.characters).forEach(([key, char]) => {
            transformed.characters.push({ id: char.name });

            // Transform prompt data with type
            const prompt = {
                id: char.name,
                type: 'character',
                universal: char.prompts?.universal || '',
                universal_translated: char.prompts?.universal_translated || '',
                ...char.csv_data
            };
            // Store in prompts object with ID as key
            transformed.prompts[char.name] = prompt;
        });
    }

    // Transform locations
    if (data.concept_art_collection?.locations) {
        Object.entries(data.concept_art_collection.locations).forEach(([key, loc]) => {
            transformed.locations.push({ id: loc.name });

            // Add location prompts with type
            const prompt = {
                id: loc.name,
                type: 'location',
                universal: loc.prompts?.universal || '',
                universal_translated: loc.prompts?.universal_translated || '',
                ...loc.csv_data
            };
            // Store in prompts object with ID as key
            transformed.prompts[loc.name] = prompt;
        });
    }

    // Transform props
    if (data.concept_art_collection?.props) {
        Object.entries(data.concept_art_collection.props).forEach(([key, prop]) => {
            transformed.props.push({ id: prop.name });

            // Add prop prompts with type
            const prompt = {
                id: prop.name,
                type: 'props',
                universal: prop.prompts?.universal || '',
                universal_translated: prop.prompts?.universal_translated || '',
                ...prop.csv_data
            };
            // Store in prompts object with ID as key
            transformed.prompts[prop.name] = prompt;
        });
    }

    return transformed;
}

// Load JSON file - 개선된 ID 매칭 시스템
function loadJSON() {
    // 먼저 스토리보드에서 업로드된 데이터가 있는지 확인
    const storyboardData = localStorage.getItem('mergedData') || localStorage.getItem('storyboardData');

    if (storyboardData) {
        // 스토리보드 데이터가 있으면 선택 옵션 제공
        const useStoryboard = confirm('스토리보드에서 업로드된 JSON 데이터가 있습니다.\n사용하시겠습니까?\n\n[확인]: 스토리보드 데이터 사용\n[취소]: 새 파일 업로드');

        if (useStoryboard) {
            try {
                let jsonData = JSON.parse(storyboardData);
                console.log('Loading data from storyboard:', jsonData);
                processJSONData(jsonData);
                showNotification('스토리보드 데이터가 로드되었습니다!', 'success');
                return;
            } catch (error) {
                console.error('Failed to parse storyboard data:', error);
                showNotification('스토리보드 데이터 로드 실패. 새 파일을 업로드해주세요.', 'error');
            }
        }
    }

    // 파일 업로드 처리
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    let jsonData = JSON.parse(event.target.result);
                    console.log('Original JSON data from file:', jsonData);
                    processJSONData(jsonData);
                    showNotification('JSON 파일이 성공적으로 로드되었습니다!', 'success');
                } catch (error) {
                    alert('JSON 파일 로드 실패: ' + error.message);
                    console.error('JSON Load Error:', error);
                }
            };
            reader.readAsText(file);
        }
    };

    input.click();
}

// JSON 데이터 처리 함수
function processJSONData(jsonData) {
    console.log('Processing JSON data:', jsonData);

    // Check if it's Stage1 format (visual_blocks)
    if (jsonData.visual_blocks) {
        console.log('Stage1 JSON format detected');
        console.log('Visual blocks:', jsonData.visual_blocks);
        jsonData = transformStage1Data(jsonData);
        console.log('Transformed data:', jsonData);
        showNotification('Stage1 JSON 파일이 성공적으로 로드되었습니다!', 'success');
    }
    // Check if it's Samurai Kid format
    else if (jsonData.concept_art_collection) {
        console.log('Samurai Kid format detected');
        jsonData = transformSamuraiKidData(jsonData);
    }

    // characters 배열로부터 드롭다운 업데이트
    if (jsonData.characters && jsonData.characters.length > 0) {
        const characterDropdown = document.getElementById('character-dropdown');
        if (characterDropdown) {
            characterDropdown.innerHTML = '';
            jsonData.characters.forEach(char => {
                            const item = document.createElement('div');
                            item.className = 'dropdown-item';
                            item.onclick = () => selectItem('character', char.id);
                            // Display only the name, not the ID
                item.textContent = char.name || char.id;
                characterDropdown.appendChild(item);
            });
        }
        conceptData.characters = jsonData.characters;

        // Auto-select the first character after a short delay to ensure DOM is ready
        setTimeout(() => {
            const firstCharacter = jsonData.characters[0];
            selectItem('character', firstCharacter.id);
        }, 100);
    }

    // locations 배열로부터 드롭다운 업데이트
    if (jsonData.locations && jsonData.locations.length > 0) {
        const locationDropdown = document.getElementById('location-dropdown');
        if (locationDropdown) {
            locationDropdown.innerHTML = '';
            jsonData.locations.forEach(loc => {
                const item = document.createElement('div');
                item.className = 'dropdown-item';
                item.onclick = () => selectItem('location', loc.id);
                // Display only the name, not the ID
                item.textContent = loc.name || loc.id;
                locationDropdown.appendChild(item);
            });
        }
        conceptData.locations = jsonData.locations;
    }

    // props 배열로부터 드롭다운 업데이트
    if (jsonData.props && jsonData.props.length > 0) {
        const propsDropdown = document.getElementById('props-dropdown');
        if (propsDropdown) {
            propsDropdown.innerHTML = '';
            jsonData.props.forEach(prop => {
                const item = document.createElement('div');
                item.className = 'dropdown-item';
                item.onclick = () => selectItem('props', prop.id);
                // Display only the name, not the ID
                item.textContent = prop.name || prop.id;
                propsDropdown.appendChild(item);
            });
        }
        conceptData.props = jsonData.props;
    }

    // prompts 객체 저장 - ID와 type으로 매칭
    if (jsonData.prompts) {
        // prompts가 이미 객체인 경우 그대로 사용
        if (typeof jsonData.prompts === 'object' && !Array.isArray(jsonData.prompts)) {
            conceptData.prompts = jsonData.prompts;

            // Fix type information for each prompt if missing
            Object.keys(conceptData.prompts).forEach(key => {
                const prompt = conceptData.prompts[key];
                if (!prompt.type) {
                    // Determine type based on which array contains this ID
                    if (jsonData.characters?.find(c => c.id === key)) {
                        prompt.type = 'character';
                    } else if (jsonData.locations?.find(l => l.id === key)) {
                        prompt.type = 'location';
                    } else if (jsonData.props?.find(p => p.id === key)) {
                        prompt.type = 'props';
                    }
                }
            });
        }
        // prompts가 배열인 경우 객체로 변환
        else if (Array.isArray(jsonData.prompts)) {
            conceptData.prompts = {};
            jsonData.prompts.forEach(prompt => {
                if (prompt.id) {
                    // Add type information if not present
                    if (!prompt.type) {
                        // Determine type based on which array contains this ID
                        if (jsonData.characters?.find(c => c.id === prompt.id)) {
                            prompt.type = 'character';
                        } else if (jsonData.locations?.find(l => l.id === prompt.id)) {
                            prompt.type = 'location';
                        } else if (jsonData.props?.find(p => p.id === prompt.id)) {
                            prompt.type = 'props';
                        }
                    }

                    conceptData.prompts[prompt.id] = prompt;

                    // universal 프롬프트 저장 (첫 번째 항목의 universal 사용)
                    if (prompt.universal && !conceptData.universal) {
                        conceptData.universal = prompt.universal;
                        const universalElement = document.getElementById('universal-prompt');
                        if (universalElement) {
                            universalElement.innerHTML = formatPromptForDisplay(prompt.universal).replace(/\n/g, '<br>');
                        }
                    }
                    if (prompt.universal_translated && !conceptData.universal_translated) {
                        conceptData.universal_translated = prompt.universal_translated;
                        const universalTransElement = document.getElementById('universal-prompt-translated');
                        if (universalTransElement) {
                            universalTransElement.innerHTML = formatPromptForDisplay(prompt.universal_translated).replace(/\n/g, '<br>');
                        }
                    }
                }
            });
        }
    }

    // Universal prompts 처리
    if (jsonData.universal) {
        conceptData.universal = jsonData.universal;
        const universalElement = document.getElementById('universal-prompt');
        if (universalElement) {
            universalElement.innerHTML = formatPromptForDisplay(jsonData.universal).replace(/\n/g, '<br>');
        }
    }
    if (jsonData.universal_translated) {
        conceptData.universal_translated = jsonData.universal_translated;
        const universalTransElement = document.getElementById('universal-prompt-translated');
        if (universalTransElement) {
            universalTransElement.innerHTML = formatPromptForDisplay(jsonData.universal_translated).replace(/\n/g, '<br>');
        }
    }

    // 이미지 데이터 로드
    if (jsonData.images) {
        // Check if images is in old array format or new object format
        if (Array.isArray(jsonData.images)) {
            // Convert old array format to new object format
            conceptData.images = {};
            jsonData.images.forEach(image => {
                let key = null;
                if (image.character) {
                    key = image.character;
                } else if (image.location) {
                    key = image.location;
                } else if (image.props) {
                    key = image.props;
                }

                if (key) {
                    if (!conceptData.images[key]) {
                        conceptData.images[key] = [];
                    }
                    // Convert to new format
                    const newImageData = {
                        id: image.id,
                        url: image.url,
                        type: image.character ? 'character' : (image.location ? 'location' : 'props'),
                        itemId: key,
                        timestamp: image.timestamp || new Date().toISOString()
                    };
                    conceptData.images[key].push(newImageData);
                }
            });
        } else {
            // Already in new object format
            conceptData.images = jsonData.images;
        }

        // Log loaded images for debugging
        console.log('Images loaded:', conceptData.images);
        const totalImages = Object.values(conceptData.images || {}).reduce((sum, arr) => sum + (arr ? arr.length : 0), 0);
        console.log('Total images loaded:', totalImages);

        // Force update image gallery after a delay
        setTimeout(() => {
            updateImageGallery();
            console.log('Image gallery updated after JSON load');
        }, 500);
    }

    // currentCharacter, currentLocation, currentProps 복원
    if (jsonData.currentCharacter) {
        conceptData.currentCharacter = jsonData.currentCharacter;
    }
    if (jsonData.currentLocation) {
        conceptData.currentLocation = jsonData.currentLocation;
    }
    if (jsonData.currentProps) {
        conceptData.currentProps = jsonData.currentProps;
    }
    if (jsonData.currentType) {
        conceptData.currentType = jsonData.currentType;
    }

    // Save all data to localStorage
    console.log('Before saveData - conceptData:', conceptData);
    saveData();

    // Verify save
    const savedData = localStorage.getItem('conceptArtData');
    console.log('After saveData - localStorage data exists:', savedData ? 'Yes' : 'No');
    if (savedData) {
        const parsed = JSON.parse(savedData);
        console.log('Saved data summary:', {
            characters: parsed.characters?.length || 0,
            locations: parsed.locations?.length || 0,
            props: parsed.props?.length || 0,
            prompts: Object.keys(parsed.prompts || {}).length,
            images: Object.keys(parsed.images || {}).length,
            hasUniversal: !!parsed.universal,
            hasTranslated: !!parsed.universal_translated
        });
    }

    // Force select first character after data is loaded
    if (jsonData.characters && jsonData.characters.length > 0) {
        const firstCharacter = jsonData.characters[0];
        selectItem('character', firstCharacter.id);
    }
}

// Download JSON file
function downloadJSON() {
    // Prepare data for export with proper type information
    const exportData = {
        ...conceptData,
        prompts: {}
    };

    // Ensure all prompts have proper type information
    if (conceptData.prompts) {
        Object.keys(conceptData.prompts).forEach(key => {
            const prompt = { ...conceptData.prompts[key] };

            // Ensure type is set
            if (!prompt.type) {
                if (conceptData.characters?.find(c => c.id === key)) {
                    prompt.type = 'character';
                } else if (conceptData.locations?.find(l => l.id === key)) {
                    prompt.type = 'location';
                } else if (conceptData.props?.find(p => p.id === key)) {
                    prompt.type = 'props';
                }
            }

            exportData.prompts[key] = prompt;
        });
    }

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `concept-art-data-${Date.now()}.json`;
    link.click();

    URL.revokeObjectURL(url);
}

// Reset all data
function resetData() {
    if (confirm('모든 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
        conceptData = {
            characters: [],
            locations: [],
            props: [],
            currentCharacter: null,
            currentLocation: null,
            currentProps: null,
            currentType: null,
            prompts: {},
            images: {},
            universal: null,
            universal_translated: null
        };

        // Clear all input fields
        document.querySelectorAll('.input-field, .textarea-field').forEach(input => {
            input.value = '';
        });

        // Reset dropdowns
        document.querySelectorAll('.dropdown-button span').forEach(span => {
            const button = span.closest('.dropdown-button');
            if (button && button.nextElementSibling) {
                const dropdownId = button.nextElementSibling.id;
                if (dropdownId === 'character-dropdown') {
                    span.textContent = '캐릭터';
                } else if (dropdownId === 'location-dropdown') {
                    span.textContent = '장소';
                } else if (dropdownId === 'props-dropdown') {
                    span.textContent = '소품';
                }
            }
        });

        // Clear dropdown contents
        const characterDropdown = document.getElementById('character-dropdown');
        if (characterDropdown) characterDropdown.innerHTML = '';

        const locationDropdown = document.getElementById('location-dropdown');
        if (locationDropdown) locationDropdown.innerHTML = '';

        const propsDropdown = document.getElementById('props-dropdown');
        if (propsDropdown) propsDropdown.innerHTML = '';

        // Clear universal prompts display
        const universalElement = document.getElementById('universal-prompt');
        if (universalElement) {
            universalElement.textContent = '기본 프롬프트가 여기에 표시됩니다...';
        }
        const universalTransElement = document.getElementById('universal-prompt-translated');
        if (universalTransElement) {
            universalTransElement.textContent = '번역된 프롬프트가 여기에 표시됩니다...';
        }

        // Clear localStorage
        localStorage.removeItem('conceptArtData');

        updatePromptDisplay();
        updateImageGallery();

        alert('데이터가 초기화되었습니다.');
    }
}

// Copy universal prompt
function copyUniversalPrompt() {
    const element = document.getElementById('universal-prompt');
    if (element) {
        const text = element.textContent;
        if (text && text !== '기본 프롬프트가 여기에 표시됩니다...') {
            copyToClipboard(text, event.target.closest('.copy-btn'));
        }
    }
}

// Copy universal prompt translated
function copyUniversalPromptTranslated() {
    const element = document.getElementById('universal-prompt-translated');
    if (element) {
        const text = element.textContent;
        if (text && text !== '번역된 프롬프트가 여기에 표시됩니다...') {
            copyToClipboard(text, event.target.closest('.copy-btn'));
        }
    }
}

// Helper function for copying to clipboard
function copyToClipboard(text, buttonElement) {
    navigator.clipboard.writeText(text).then(() => {
        const originalHTML = buttonElement.innerHTML;
        buttonElement.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            복사됨!
        `;
        setTimeout(() => {
            buttonElement.innerHTML = originalHTML;
        }, 2000);
    });
}

// 이미지 뷰어 열기
function openImageViewer(imageUrl, imageId, isSaved = false) {
    const modal = document.getElementById('imageViewerModal');
    const modalImg = document.getElementById('modalImage');
    modalImg.src = imageUrl;
    modalImg.dataset.imageId = imageId;
    modalImg.dataset.isSaved = isSaved;

    // 저장 버튼 추가/업데이트
    updateModalSaveButton(imageId, isSaved);

    modal.style.display = 'flex';
}

// 모달에 저장 버튼 업데이트
function updateModalSaveButton(imageId, isSaved) {
    const modalControls = document.querySelector('.modal-controls');
    if (!modalControls) return;

    // 기존 저장 버튼 제거
    const existingSaveBtn = modalControls.querySelector('.save-modal-btn');
    if (existingSaveBtn) {
        existingSaveBtn.remove();
    }

    // 새로운 저장 버튼 생성
    const saveBtn = document.createElement('button');
    saveBtn.className = isSaved ? 'btn btn-secondary save-modal-btn' : 'btn btn-primary save-modal-btn';
    saveBtn.onclick = function() { saveImageFromModal(imageId); };
    saveBtn.innerHTML = isSaved ?
        `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
        </svg>
        저장됨` :
        `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
        </svg>
        저장하기`;

    if (isSaved) {
        saveBtn.disabled = true;
    }

    // 다운로드 버튼 앞에 삽입
    const downloadBtn = modalControls.querySelector('.btn-primary');
    if (downloadBtn && !isSaved) {
        modalControls.insertBefore(saveBtn, downloadBtn);
    } else if (!downloadBtn) {
        // 다운로드 버튼이 없으면 파일 이름 span 다음에 추가
        const filenameSpan = modalControls.querySelector('.image-filename');
        if (filenameSpan && filenameSpan.nextSibling) {
            modalControls.insertBefore(saveBtn, filenameSpan.nextSibling);
        } else {
            modalControls.appendChild(saveBtn);
        }
    }
}

// 모달에서 이미지 저장
function saveImageFromModal(imageId) {
    saveImagePermanently(imageId);
    // 버튼 상태 업데이트
    updateModalSaveButton(imageId, true);
    // 데이터 속성 업데이트
    const modalImg = document.getElementById('modalImage');
    if (modalImg) {
        modalImg.dataset.isSaved = 'true';
    }
}

// 이미지 뷰어 닫기
function closeImageViewer() {
    const modal = document.getElementById('imageViewerModal');
    modal.style.display = 'none';
}

// 모달에서 이미지 다운로드
function downloadModalImage() {
    const modalImg = document.getElementById('modalImage');
    const imageId = modalImg.dataset.imageId;
    downloadSingleImage(modalImg.src, imageId);
}

// 개별 이미지 다운로드
async function downloadSingleImage(url, filename) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `concept-art-${filename}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    } catch (error) {
        console.error('다운로드 실패:', error);
        alert('이미지 다운로드에 실패했습니다.');
    }
}

// 이미지 영구 저장 (JSON에 포함)
function saveImagePermanently(imageId) {
    let currentKey = null;
    if (conceptData.currentType === 'character' && conceptData.currentCharacter) {
        currentKey = conceptData.currentCharacter;
    } else if (conceptData.currentType === 'location' && conceptData.currentLocation) {
        currentKey = conceptData.currentLocation;
    } else if (conceptData.currentType === 'props' && conceptData.currentProps) {
        currentKey = conceptData.currentProps;
    }

    if (!currentKey) {
        alert('먼저 캐릭터, 장소, 또는 소품을 선택해주세요.');
        return;
    }

    // 이미지 찾기 및 saved 상태 업데이트
    if (conceptData.images && conceptData.images[currentKey]) {
        const image = conceptData.images[currentKey].find(img => img.id === imageId);
        if (image) {
            image.saved = true;
            saveData();

            // UI 업데이트
            const imageItem = document.querySelector(`[data-image-id="${imageId}"]`);
            if (imageItem) {
                const saveBtn = imageItem.querySelector('.save-btn');
                if (saveBtn) {
                    saveBtn.className = 'control-btn save-btn saved';
                    saveBtn.disabled = true;
                    saveBtn.title = '저장됨';
                    saveBtn.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                    `;
                }
            }
        }
    }
}

// 이미지 생성 함수
async function generateImageFromNanoBanana() {
    const promptElement = document.getElementById('universal-prompt');
    const prompt = promptElement ? promptElement.textContent : '';

    if (!prompt || prompt === '기본 프롬프트가 여기에 표시됩니다...' || prompt.trim() === '') {
        alert('먼저 프롬프트를 입력해주세요.');
        return;
    }

    // Find the button that was clicked
    const btn = event ? event.target.closest('.generate-btn') : document.querySelector('.generate-btn');
    if (!btn) {
        console.error('Generate button not found');
        return;
    }

    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `
        <svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
            <path d="M12 2a10 10 0 0 1 0 20" stroke-opacity="0.75"/>
        </svg>
        생성 중...
    `;

    try {
        let imageUrl = '';

        // Check if Gemini API is available and ready
        if (window.geminiAPI && window.geminiAPI.isReady()) {
            try {
                console.log('Generating image with Nano Banana (Gemini 2.5 Flash Image Preview):', prompt);

                // Use Nano Banana to generate image
                const result = await window.geminiAPI.generateImage(prompt, {
                    temperature: 1.0,
                    topK: 40,
                    topP: 0.95
                });

                if (result.success && result.imageUrl) {
                    imageUrl = result.imageUrl;
                    console.log('Nano Banana generated image successfully');

                    // Show success notification
                    if (typeof showToast === 'function') {
                        showToast('이미지가 성공적으로 생성되었습니다!', 'success');
                    }
                } else {
                    throw new Error('이미지 생성 실패: 응답에 이미지가 없습니다');
                }
            } catch (apiError) {
                console.error('Nano Banana generation error:', apiError);

                // Offer test mode as fallback
                const useTestMode = confirm(
                    `Nano Banana 이미지 생성 실패:\n${apiError.message}\n\n` +
                    '테스트 모드로 진행하시겠습니까?'
                );

                if (useTestMode) {
                    const timestamp = Date.now();
                    const promptHash = btoa(prompt.substring(0, 100)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
                    imageUrl = `https://picsum.photos/seed/${promptHash}-${timestamp}/1024/1024`;
                } else {
                    btn.disabled = false;
                    btn.innerHTML = originalHTML;
                    return;
                }
            }
        } else {
            // API가 설정되지 않은 경우
            const useTestMode = confirm(
                'Gemini API가 설정되지 않았습니다.\n' +
                '메인 페이지에서 API를 설정하면 Nano Banana로 이미지를 생성할 수 있습니다.\n\n' +
                '테스트 모드로 진행하시겠습니까?'
            );

            if (useTestMode) {
                const timestamp = Date.now();
                imageUrl = `https://picsum.photos/1024/1024?random=${timestamp}`;
            } else {
                // Try to open API modal if available
                if (typeof openAPIModal === 'function') {
                    openAPIModal();
                }
                btn.disabled = false;
                btn.innerHTML = originalHTML;
                return;
            }
        }

        // 현재 선택 확인
        let currentKey = null;
        if (conceptData.currentType === 'character' && conceptData.currentCharacter) {
            currentKey = conceptData.currentCharacter;
        } else if (conceptData.currentType === 'location' && conceptData.currentLocation) {
            currentKey = conceptData.currentLocation;
        } else if (conceptData.currentType === 'props' && conceptData.currentProps) {
            currentKey = conceptData.currentProps;
        }

        if (!currentKey) {
            alert('먼저 캐릭터, 장소, 또는 소품을 선택해주세요.');
            btn.disabled = false;
            btn.innerHTML = originalHTML;
            return;
        }

        // 이미지 데이터 생성
        const imageData = {
            id: Date.now(),
            url: imageUrl,
            saved: false,
            type: conceptData.currentType,
            itemId: currentKey,
            timestamp: new Date().toISOString(),
            prompt: prompt
        };

        // 이미지 배열에 추가
        if (!conceptData.images) conceptData.images = {};
        if (!conceptData.images[currentKey]) conceptData.images[currentKey] = [];

        conceptData.images[currentKey].push(imageData);

        // 갤러리에 이미지 추가
        addImageToGallery(imageData);

        // Success message
        console.log('Image generated successfully:', imageUrl);

    } catch (error) {
        console.error('이미지 생성 실패:', error);
        alert('이미지 생성에 실패했습니다.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHTML;
    }
}

// 프롬프트 편집 모달 함수들
let currentEditType = null;  // 'universal' or 'translated'

// Define prompt fields
const PROMPT_FIELDS = [
    { key: 'STYLE', label: 'STYLE', placeholder: '예: 3D render, cinematic dark fantasy' },
    { key: 'MEDIUM', label: 'MEDIUM', placeholder: '예: hyperrealistic 3D render' },
    { key: 'CHARACTER', label: 'CHARACTER', placeholder: '예: Korean male late 20s' },
    { key: 'CAMERA', label: 'CAMERA', placeholder: '예: full body shots various angles' },
    { key: 'GAZE', label: 'GAZE', placeholder: '예: consistent neutral expression' },
    { key: 'CHARACTER_SHEET', label: 'CHARACTER_SHEET', placeholder: '예: detailed character sheet' },
    { key: 'BODY_TYPE', label: 'BODY_TYPE', placeholder: '예: lean athletic build 180cm' },
    { key: 'HAIR', label: 'HAIR', placeholder: '예: black short stylishly messy hair' },
    { key: 'FACE_SHAPE', label: 'FACE_SHAPE', placeholder: '예: sharp angular jaw' },
    { key: 'FACIAL_FEATURES', label: 'FACIAL_FEATURES', placeholder: '예: sharp intense eyes' },
    { key: 'SKIN', label: 'SKIN', placeholder: '예: fair skin' },
    { key: 'EXPRESSION', label: 'EXPRESSION', placeholder: '예: neutral, confident' },
    { key: 'CLOTHING', label: 'CLOTHING', placeholder: '예: white t-shirt, dark hoodie' },
    { key: 'ACCESSORIES', label: 'ACCESSORIES', placeholder: '예: faint purple aura' },
    { key: 'POSE', label: 'POSE', placeholder: '예: multiple poses for character sheet' },
    { key: 'BACKGROUND', label: 'BACKGROUND', placeholder: '예: pure white studio background' },
    { key: 'LIGHTING', label: 'LIGHTING', placeholder: '예: even studio lighting' },
    { key: 'QUALITY', label: 'QUALITY', placeholder: '예: cinematic ultra detailed' },
    { key: 'PARAMETERS', label: 'PARAMETERS', placeholder: '예: --ar 16:9 --v 6' }
];

function parsePromptToFields(promptText) {
    const fields = {};

    if (!promptText) return fields;

    // Split by semicolon
    const parts = promptText.split(';').map(p => p.trim()).filter(p => p);

    parts.forEach(part => {
        // Find the first colon
        const colonIndex = part.indexOf(':');
        if (colonIndex > -1) {
            const key = part.substring(0, colonIndex).trim();
            const value = part.substring(colonIndex + 1).trim();
            fields[key] = value;
        } else {
            // Handle PARAMETERS or other fields without colon
            if (part.includes('--')) {
                fields['PARAMETERS'] = part;
            }
        }
    });

    return fields;
}

function editPrompt(type) {
    currentEditType = type;
    const modal = document.getElementById('promptEditModal');
    const container = modal?.querySelector('.prompt-fields-container');

    if (!modal || !container) return;

    // Get current prompt text from conceptData (not from display)
    let currentText = '';
    if (type === 'universal') {
        currentText = conceptData.universal || '';
        if (currentText === '기본 프롬프트가 여기에 표시됩니다...') currentText = '';
    } else if (type === 'translated') {
        currentText = conceptData.universal_translated || '';
        if (currentText === '번역된 프롬프트가 여기에 표시됩니다...') currentText = '';
    } else if (type === 'voice') {
        currentText = conceptData.voice_style || '';
        if (currentText === '음성 스타일이 여기에 표시됩니다...') currentText = '';
    }

    // Create single textarea
    container.innerHTML = '';
    const textarea = document.createElement('textarea');
    textarea.className = 'prompt-edit-textarea';
    textarea.id = 'prompt-edit-textarea';
    textarea.placeholder = '프롬프트를 입력하세요...';
    textarea.value = currentText;
    textarea.style.cssText = `
        width: 100%;
        min-height: 400px;
        padding: 15px;
        font-size: 14px;
        line-height: 1.6;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--bg-secondary);
        color: var(--text-primary);
        resize: vertical;
        font-family: inherit;
    `;

    container.appendChild(textarea);
    modal.style.display = 'flex';

    // Focus textarea
    setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }, 100);
}

function closePromptEdit() {
    const modal = document.getElementById('promptEditModal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentEditType = null;
}

function savePromptEdit() {
    const modal = document.getElementById('promptEditModal');
    const textarea = modal?.querySelector('#prompt-edit-textarea');
    if (!textarea) return;

    const newText = textarea.value.trim();

    if (currentEditType === 'universal') {
        const element = document.getElementById('universal-prompt');
        if (element) {
            if (newText) {
                // 줄바꿈을 유지하면서 표시 (formatPromptForDisplay 사용하지 않음)
                element.innerHTML = newText.replace(/\n/g, '<br>');
            } else {
                element.textContent = '기본 프롬프트가 여기에 표시됩니다...';
            }
            conceptData.universal = newText;

            // 현재 선택된 항목에 프롬프트 저장
            let currentKey = null;
            if (conceptData.currentType === 'character' && conceptData.currentCharacter) {
                currentKey = conceptData.currentCharacter;
            } else if (conceptData.currentType === 'location' && conceptData.currentLocation) {
                currentKey = conceptData.currentLocation;
            } else if (conceptData.currentType === 'props' && conceptData.currentProps) {
                currentKey = conceptData.currentProps;
            }

            if (currentKey) {
                // prompts 객체가 없으면 생성
                if (!conceptData.prompts) {
                    conceptData.prompts = {};
                    console.log('📦 prompts 객체 생성됨');
                }
                if (!conceptData.prompts[currentKey]) {
                    conceptData.prompts[currentKey] = {};
                    console.log(`📦 prompts["${currentKey}"] 생성됨`);
                }
                conceptData.prompts[currentKey].universal = newText;
                console.log(`✅ 프롬프트 저장됨 - prompts["${currentKey}"].universal:`, newText.substring(0, 50) + '...');

                // 저장 직후 확인
                if (conceptData.prompts[currentKey].universal === newText) {
                    console.log(`✅ 저장 확인: prompts["${currentKey}"].universal이 정상 저장됨`);
                } else {
                    console.error(`❌ 저장 실패: prompts["${currentKey}"].universal 불일치!`);
                }
            } else {
                // 선택된 항목이 없어도 전역 데이터는 저장됨 (새로고침 후에도 유지)
                console.log('⚠️ 선택된 항목 없음 - 전역 universal 프롬프트로 저장됨 (새로고침 후에도 유지됨)');
            }
        }
    } else if (currentEditType === 'translated') {
        const element = document.getElementById('universal-prompt-translated');
        if (element) {
            if (newText) {
                // 줄바꿈을 유지하면서 표시 (formatPromptForDisplay 사용하지 않음)
                element.innerHTML = newText.replace(/\n/g, '<br>');
            } else {
                element.textContent = '번역된 프롬프트가 여기에 표시됩니다...';
            }
            conceptData.universal_translated = newText;

            // 현재 선택된 항목에 프롬프트 저장
            let currentKey = null;
            if (conceptData.currentType === 'character' && conceptData.currentCharacter) {
                currentKey = conceptData.currentCharacter;
            } else if (conceptData.currentType === 'location' && conceptData.currentLocation) {
                currentKey = conceptData.currentLocation;
            } else if (conceptData.currentType === 'props' && conceptData.currentProps) {
                currentKey = conceptData.currentProps;
            }

            if (currentKey) {
                // prompts 객체가 없으면 생성
                if (!conceptData.prompts[currentKey]) {
                    conceptData.prompts[currentKey] = {};
                }
                conceptData.prompts[currentKey].universal_translated = newText;
                console.log(`✅ 번역된 프롬프트 저장됨 - ${currentKey}:`, newText.substring(0, 50) + '...');
            } else {
                console.log('⚠️ 선택된 항목 없음 - 전역 universal_translated 프롬프트로 저장됨 (새로고침 후에도 유지됨)');
            }
        }
    } else if (currentEditType === 'voice') {
        const element = document.getElementById('voice-style-display');
        if (element) {
            if (newText) {
                element.innerHTML = newText;
            } else {
                element.textContent = '음성 스타일이 여기에 표시됩니다...';
            }
            conceptData.voice_style = newText;

            // 현재 선택된 항목에 voice_style 저장
            let currentKey = null;
            if (conceptData.currentType === 'character' && conceptData.currentCharacter) {
                currentKey = conceptData.currentCharacter;
            } else if (conceptData.currentType === 'location' && conceptData.currentLocation) {
                currentKey = conceptData.currentLocation;
            } else if (conceptData.currentType === 'props' && conceptData.currentProps) {
                currentKey = conceptData.currentProps;
            }

            if (currentKey) {
                // prompts 객체가 없으면 생성
                if (!conceptData.prompts[currentKey]) {
                    conceptData.prompts[currentKey] = {};
                }
                conceptData.prompts[currentKey].voice_style = newText;
                console.log(`✅ 음성 스타일 저장됨 - ${currentKey}:`, newText.substring(0, 50) + '...');
            } else {
                console.log('⚠️ 선택된 항목 없음 - 전역 voice_style로 저장됨 (새로고침 후에도 유지됨)');
            }
        }
    }

    // 데이터 저장
    console.log('💾 savePromptEdit - 저장 전 conceptData:', {
        universal: conceptData.universal ? conceptData.universal.substring(0, 50) + '...' : '없음',
        universal_translated: conceptData.universal_translated ? conceptData.universal_translated.substring(0, 50) + '...' : '없음',
        voice_style: conceptData.voice_style ? conceptData.voice_style.substring(0, 50) + '...' : '없음',
        currentType: conceptData.currentType,
        currentCharacter: conceptData.currentCharacter,
        currentLocation: conceptData.currentLocation,
        currentProps: conceptData.currentProps
    });

    saveData();

    // localStorage 저장 확인 (즉시 확인)
    const savedData = localStorage.getItem('conceptArtData');
    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);
            console.log('✅ savePromptEdit - localStorage 저장 확인:', {
                universal: parsed.universal ? `저장됨 (${parsed.universal.substring(0, 30)}...)` : '없음',
                universal_translated: parsed.universal_translated ? `저장됨 (${parsed.universal_translated.substring(0, 30)}...)` : '없음',
                voice_style: parsed.voice_style ? '저장됨' : '없음',
                데이터크기: `${savedData.length} bytes`
            });
        } catch (e) {
            console.error('❌ localStorage 데이터 파싱 오류:', e);
        }
    } else {
        console.error('❌ localStorage에 데이터가 저장되지 않음!');
    }

    // 모달 닫기
    closePromptEdit();

    // 저장 성공 알림
    showNotification('프롬프트가 저장되었습니다', 'success');
}

// 새 섹션 추가 함수
function addNewSection() {
    const selectElement = document.getElementById('section-type-select');
    if (!selectElement) return;

    const sectionType = selectElement.value;
    if (!sectionType) {
        alert('섹션 종류를 선택해주세요.');
        return;
    }

    // 섹션 이름 입력받기
    const sectionName = prompt(`새 ${sectionType === 'character' ? '캐릭터' : sectionType === 'location' ? '장소' : '소품'} 이름을 입력하세요:`);
    if (!sectionName || sectionName.trim() === '') return;

    const trimmedName = sectionName.trim();

    // 중복 체크
    let isDuplicate = false;
    if (sectionType === 'character') {
        isDuplicate = conceptData.characters.some(c => c.id === trimmedName);
    } else if (sectionType === 'location') {
        isDuplicate = conceptData.locations.some(l => l.id === trimmedName);
    } else if (sectionType === 'props') {
        isDuplicate = conceptData.props.some(p => p.id === trimmedName);
    }

    if (isDuplicate) {
        alert(`이미 존재하는 ${sectionType === 'character' ? '캐릭터' : sectionType === 'location' ? '장소' : '소품'} 이름입니다.`);
        return;
    }

    // 새 섹션 데이터 생성 (메타데이터 포함)
    const newSection = {
        id: trimmedName,
        name: trimmedName,
        source: 'user_added',
        created_at: Date.now()
    };
    const newPromptData = {
        id: trimmedName,
        type: sectionType === 'props' ? 'props' : sectionType,
        universal: '',
        universal_translated: '',
        voice_style: ''
    };

    // 데이터에 추가
    if (sectionType === 'character') {
        conceptData.characters.push(newSection);

        // 드롭다운에 추가
        const dropdown = document.getElementById('character-dropdown');
        if (dropdown) {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.onclick = () => selectItem('character', trimmedName);
            item.textContent = trimmedName;
            dropdown.appendChild(item);
        }
    } else if (sectionType === 'location') {
        conceptData.locations.push(newSection);

        // 드롭다운에 추가
        const dropdown = document.getElementById('location-dropdown');
        if (dropdown) {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.onclick = () => selectItem('location', trimmedName);
            item.textContent = trimmedName;
            dropdown.appendChild(item);
        }
    } else if (sectionType === 'props') {
        conceptData.props.push(newSection);

        // 드롭다운에 추가
        const dropdown = document.getElementById('props-dropdown');
        if (dropdown) {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.onclick = () => selectItem('props', trimmedName);
            item.textContent = trimmedName;
            dropdown.appendChild(item);
        }
    }

    // prompts 객체에 추가
    if (!conceptData.prompts) conceptData.prompts = {};
    conceptData.prompts[trimmedName] = newPromptData;

    // 선택 드롭다운 초기화
    selectElement.value = '';

    // 새로 추가한 섹션 자동 선택 (이것이 currentCharacter를 설정함)
    selectItem(sectionType, trimmedName);

    // 이미 selectItem 내부에서 saveData()가 호출되므로 여기서는 불필요
    // saveData(); // 제거됨 - selectItem이 이미 저장함

    // 프롬프트 입력 모달 열기
    setTimeout(() => {
        const openPromptModal = confirm(`"${trimmedName}" 섹션이 추가되었습니다.\n프롬프트를 입력하시겠습니까?`);
        if (openPromptModal) {
            editPrompt('universal');
        }
    }, 100);
}

// 현재 선택된 섹션 삭제 함수
function deleteCurrentSection() {
    // 현재 선택된 항목 확인
    let currentKey = null;
    let sectionType = null;
    let sectionName = null;

    if (conceptData.currentType === 'character' && conceptData.currentCharacter) {
        currentKey = conceptData.currentCharacter;
        sectionType = 'character';
        sectionName = '캐릭터';
    } else if (conceptData.currentType === 'location' && conceptData.currentLocation) {
        currentKey = conceptData.currentLocation;
        sectionType = 'location';
        sectionName = '장소';
    } else if (conceptData.currentType === 'props' && conceptData.currentProps) {
        currentKey = conceptData.currentProps;
        sectionType = 'props';
        sectionName = '소품';
    }

    if (!currentKey) {
        alert('삭제할 섹션을 먼저 선택해주세요.');
        return;
    }

    // 확인 메시지
    if (!confirm(`"${currentKey}" ${sectionName}을(를) 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 관련된 모든 프롬프트와 이미지가 삭제됩니다.`)) {
        return;
    }

    // 데이터에서 삭제
    if (sectionType === 'character') {
        // 배열에서 제거
        conceptData.characters = conceptData.characters.filter(c => c.id !== currentKey);

        // 드롭다운에서 제거
        const dropdown = document.getElementById('character-dropdown');
        if (dropdown) {
            const items = dropdown.querySelectorAll('.dropdown-item');
            items.forEach(item => {
                if (item.textContent === currentKey) {
                    item.remove();
                }
            });
        }

        // 버튼 텍스트 초기화
        const button = document.querySelector('#character-dropdown')?.previousElementSibling;
        if (button) {
            const span = button.querySelector('span');
            if (span) span.textContent = '캐릭터';
        }

        conceptData.currentCharacter = null;
    } else if (sectionType === 'location') {
        // 배열에서 제거
        conceptData.locations = conceptData.locations.filter(l => l.id !== currentKey);

        // 드롭다운에서 제거
        const dropdown = document.getElementById('location-dropdown');
        if (dropdown) {
            const items = dropdown.querySelectorAll('.dropdown-item');
            items.forEach(item => {
                if (item.textContent === currentKey) {
                    item.remove();
                }
            });
        }

        // 버튼 텍스트 초기화
        const button = document.querySelector('#location-dropdown')?.previousElementSibling;
        if (button) {
            const span = button.querySelector('span');
            if (span) span.textContent = '장소';
        }

        conceptData.currentLocation = null;
    } else if (sectionType === 'props') {
        // 배열에서 제거
        conceptData.props = conceptData.props.filter(p => p.id !== currentKey);

        // 드롭다운에서 제거
        const dropdown = document.getElementById('props-dropdown');
        if (dropdown) {
            const items = dropdown.querySelectorAll('.dropdown-item');
            items.forEach(item => {
                if (item.textContent === currentKey) {
                    item.remove();
                }
            });
        }

        // 버튼 텍스트 초기화
        const button = document.querySelector('#props-dropdown')?.previousElementSibling;
        if (button) {
            const span = button.querySelector('span');
            if (span) span.textContent = '소품';
        }

        conceptData.currentProps = null;
    }

    // prompts 객체에서 제거
    if (conceptData.prompts && conceptData.prompts[currentKey]) {
        delete conceptData.prompts[currentKey];
    }

    // images 객체에서 제거
    if (conceptData.images && conceptData.images[currentKey]) {
        delete conceptData.images[currentKey];
    }

    // 현재 타입 초기화
    conceptData.currentType = null;

    // universal 프롬프트 표시 초기화
    const universalElement = document.getElementById('universal-prompt');
    if (universalElement) {
        universalElement.textContent = '기본 프롬프트가 여기에 표시됩니다...';
    }
    const universalTransElement = document.getElementById('universal-prompt-translated');
    if (universalTransElement) {
        universalTransElement.textContent = '번역된 프롬프트가 여기에 표시됩니다...';
    }

    conceptData.universal = null;
    conceptData.universal_translated = null;

    // 이미지 갤러리 업데이트
    updateImageGallery();

    // 데이터 저장
    saveData();

    alert(`"${currentKey}" ${sectionName}이(가) 삭제되었습니다.`);
}

// Copy voice style to clipboard
function copyVoiceStyle() {
    const voiceStyleText = conceptData.voice_style;

    if (voiceStyleText && voiceStyleText !== '음성 스타일이 여기에 표시됩니다...') {
        navigator.clipboard.writeText(voiceStyleText).then(() => {
            // Change button text temporarily
            const copyBtn = event.target.closest('.copy-btn');
            if (copyBtn) {
                const originalHTML = copyBtn.innerHTML;
                copyBtn.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    복사됨!
                `;

                setTimeout(() => {
                    copyBtn.innerHTML = originalHTML;
                }, 2000);
            }
        });
    }
}

// 저장 및 동기화 함수
function saveAndSync() {
    console.log('💾 저장 및 동기화 시작...');

    // 1. localStorage에 데이터 저장
    saveData();

    // 2. ConceptArtManager와 동기화
    if (window.conceptArtManager) {
        // 기존 데이터 가져오기
        const managerData = window.conceptArtManager.getData() || {
            characters: [],
            locations: [],
            props: [],
            version: '1.0.0',
            lastUpdated: Date.now()
        };

        // 현재 conceptData를 ConceptArtManager 형식으로 변환
        const updatedData = {
            version: managerData.version,
            characters: [],
            locations: [],
            props: [],
            lastUpdated: Date.now()
        };

        // 캐릭터 변환 및 병합 (프롬프트 데이터 포함)
        if (conceptData.characters && Array.isArray(conceptData.characters)) {
            conceptData.characters.forEach(char => {
                const charData = {
                    id: char.id || `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name: char.name || `캐릭터 ${char.id}`,
                    description: char.description || '',
                    appearance: char.appearance || '',
                    personality: char.personality || '',
                    image: char.image || '',
                    source: 'conceptart_page',
                    created_at: Date.now()
                };

                // 프롬프트 데이터 추가
                if (conceptData.prompts && conceptData.prompts[char.id]) {
                    charData.prompt = conceptData.prompts[char.id];
                }

                updatedData.characters.push(charData);
            });
        }

        // 장소 변환 및 병합 (프롬프트 데이터 포함)
        if (conceptData.locations && Array.isArray(conceptData.locations)) {
            conceptData.locations.forEach(loc => {
                const locData = {
                    id: loc.id || `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name: loc.name || `장소 ${loc.id}`,
                    description: loc.description || '',
                    atmosphere: loc.atmosphere || '',
                    image: loc.image || '',
                    source: 'conceptart_page',
                    created_at: Date.now()
                };

                // 프롬프트 데이터 추가
                if (conceptData.prompts && conceptData.prompts[loc.id]) {
                    locData.prompt = conceptData.prompts[loc.id];
                }

                updatedData.locations.push(locData);
            });
        }

        // 소품 변환 및 병합 (프롬프트 데이터 포함)
        if (conceptData.props && Array.isArray(conceptData.props)) {
            conceptData.props.forEach(prop => {
                const propData = {
                    id: prop.id || `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name: prop.name || `소품 ${prop.id}`,
                    description: prop.description || '',
                    function: prop.function || '',
                    image: prop.image || '',
                    source: 'conceptart_page',
                    created_at: Date.now()
                };

                // 프롬프트 데이터 추가
                if (conceptData.prompts && conceptData.prompts[prop.id]) {
                    propData.prompt = conceptData.prompts[prop.id];
                }

                updatedData.props.push(propData);
            });
        }

        // 전체 프롬프트 데이터도 별도로 저장
        updatedData.prompts = conceptData.prompts || {};
        updatedData.universal = conceptData.universal || null;
        updatedData.universal_translated = conceptData.universal_translated || null;
        updatedData.voice_style = conceptData.voice_style || null;
        updatedData.images = conceptData.images || {};

        // Stage1 데이터도 포함 (있다면)
        const stage1Data = sessionStorage.getItem('stage1OriginalData');
        if (stage1Data) {
            try {
                const stage1 = JSON.parse(stage1Data);

                // Stage1 캐릭터
                if (stage1.visual_blocks?.characters) {
                    stage1.visual_blocks.characters.forEach((char, index) => {
                        const charId = `stage1_char_${index}`;
                        if (!updatedData.characters.some(c => c.id === charId)) {
                            updatedData.characters.push({
                                id: charId,
                                name: char.name || `Character ${index + 1}`,
                                description: char.description || '',
                                appearance: char.appearance || '',
                                personality: char.personality || '',
                                image: char.generated_image || '',
                                source: 'stage1',
                                created_at: Date.now()
                            });
                        }
                    });
                }

                // Stage1 장소
                if (stage1.visual_blocks?.locations) {
                    stage1.visual_blocks.locations.forEach((loc, index) => {
                        const locId = `stage1_loc_${index}`;
                        if (!updatedData.locations.some(l => l.id === locId)) {
                            updatedData.locations.push({
                                id: locId,
                                name: loc.name || `Location ${index + 1}`,
                                description: loc.description || '',
                                atmosphere: loc.atmosphere || '',
                                image: loc.generated_image || '',
                                source: 'stage1',
                                created_at: Date.now()
                            });
                        }
                    });
                }

                // Stage1 소품
                if (stage1.visual_blocks?.props) {
                    stage1.visual_blocks.props.forEach((prop, index) => {
                        const propId = `stage1_prop_${index}`;
                        if (!updatedData.props.some(p => p.id === propId)) {
                            updatedData.props.push({
                                id: propId,
                                name: prop.name || `Prop ${index + 1}`,
                                description: prop.description || '',
                                function: prop.function || '',
                                image: prop.generated_image || '',
                                source: 'stage1',
                                created_at: Date.now()
                            });
                        }
                    });
                }
            } catch (e) {
                console.error('Stage1 데이터 파싱 오류:', e);
            }
        }

        // ConceptArtManager의 동기화 메서드 사용
        if (window.conceptArtManager.syncFromConceptArtPage) {
            window.conceptArtManager.syncFromConceptArtPage(updatedData);
        } else {
            // 폴백: 직접 저장
            const jsonData = JSON.stringify(updatedData);
            sessionStorage.setItem('conceptArtData', jsonData);
            localStorage.setItem('conceptArtData_backup', jsonData);

            // 브로드캐스트 메시지 전송
            if (window.conceptArtManager.eventChannel) {
                window.conceptArtManager.eventChannel.postMessage({
                    type: 'full_sync',
                    data: updatedData,
                    source: 'conceptart_page'
                });
            }
        }

        // Custom 이벤트 발생
        const event = new CustomEvent('conceptArtUpdate', {
            detail: {
                action: 'sync',
                data: updatedData
            }
        });
        window.dispatchEvent(event);

        console.log('✅ ConceptArtManager 동기화 완료:', {
            characters: updatedData.characters.length,
            locations: updatedData.locations.length,
            props: updatedData.props.length
        });
    }

    // 3. 성공 알림
    showNotification('✅ 저장 및 동기화가 완료되었습니다!', 'success');

    // 4. 저장 버튼 시각적 피드백
    const saveBtn = event?.target?.closest('button');
    if (saveBtn) {
        const originalHTML = saveBtn.innerHTML;
        saveBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>저장됨!</span>
        `;
        saveBtn.style.background = '#4caf50';

        setTimeout(() => {
            saveBtn.innerHTML = originalHTML;
            saveBtn.style.background = '';
        }, 2000);
    }
}

// Make functions globally available
window.toggleDropdown = toggleDropdown;
window.selectItem = selectItem;
window.copyPrompt = copyPrompt;
window.copyUniversalPrompt = copyUniversalPrompt;
window.saveAndSync = saveAndSync;
window.copyUniversalPromptTranslated = copyUniversalPromptTranslated;
window.copyVoiceStyle = copyVoiceStyle;
window.addImage = addImage;
window.deleteImage = deleteImage;
window.loadJSON = loadJSON;
window.downloadJSON = downloadJSON;
window.resetData = resetData;
window.openImageViewer = openImageViewer;
window.closeImageViewer = closeImageViewer;
window.downloadModalImage = downloadModalImage;
window.downloadSingleImage = downloadSingleImage;
window.saveImagePermanently = saveImagePermanently;
window.generateImageFromNanoBanana = generateImageFromNanoBanana;
window.editPrompt = editPrompt;
window.closePromptEdit = closePromptEdit;
window.savePromptEdit = savePromptEdit;
window.addNewSection = addNewSection;
window.deleteCurrentSection = deleteCurrentSection;