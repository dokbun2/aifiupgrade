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

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadSavedData();
    initializeEventListeners();
    setDefaultDropdownValues();
    updatePromptDisplay();
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
    if (saved) {
        try {
            conceptData = JSON.parse(saved);

            // Rebuild dropdowns if data exists
            if (conceptData.characters && conceptData.characters.length > 0) {
                const characterDropdown = document.getElementById('character-dropdown');
                if (characterDropdown) {
                    characterDropdown.innerHTML = '';
                    conceptData.characters.forEach(char => {
                        const item = document.createElement('div');
                        item.className = 'dropdown-item';
                        item.onclick = () => selectItem('character', char.id);
                        item.textContent = char.id;
                        characterDropdown.appendChild(item);
                    });
                }

                // Auto-select the first character after DOM is ready
                setTimeout(() => {
                    const firstCharacter = conceptData.characters[0];
                    selectItem('character', firstCharacter.id);
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
                        item.textContent = loc.id;
                        locationDropdown.appendChild(item);
                    });
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
                        item.textContent = prop.id;
                        propsDropdown.appendChild(item);
                    });
                }
            }

            // Load universal prompts if they exist
            if (conceptData.universal) {
                const universalElement = document.getElementById('universal-prompt');
                if (universalElement) {
                    universalElement.textContent = conceptData.universal;
                }
            }
            if (conceptData.universal_translated) {
                const universalTransElement = document.getElementById('universal-prompt-translated');
                if (universalTransElement) {
                    universalTransElement.textContent = conceptData.universal_translated;
                }
            }

            updateImageGallery();
        } catch (e) {
            console.error('Failed to load saved data');
        }
    }
}

// Save data to localStorage
function saveData() {
    try {
        localStorage.setItem('conceptArtData', JSON.stringify(conceptData));
    } catch (e) {
        console.error('Failed to save data');
    }
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
    // Set the current type to track latest selection
    conceptData.currentType = type;

    if (type === 'character') {
        conceptData.currentCharacter = value;
        // Update button text
        const button = document.querySelector('#character-dropdown')?.previousElementSibling;
        if (button) {
            const span = button.querySelector('span');
            if (span) span.textContent = value;
        }

        // Load data based on type
        loadDataByTypeAndId('character', value);
    } else if (type === 'location') {
        conceptData.currentLocation = value;
        // Update button text
        const button = document.querySelector('#location-dropdown')?.previousElementSibling;
        if (button) {
            const span = button.querySelector('span');
            if (span) span.textContent = value;
        }

        // Load data based on type
        loadDataByTypeAndId('location', value);
    } else if (type === 'props') {
        conceptData.currentProps = value;
        // Update button text
        const button = document.querySelector('#props-dropdown')?.previousElementSibling;
        if (button) {
            const span = button.querySelector('span');
            if (span) span.textContent = value;
        }

        // Load data based on type
        loadDataByTypeAndId('prop', value);
    }

    // Close dropdown
    document.querySelectorAll('.dropdown-content').forEach(dropdown => {
        dropdown.classList.remove('show');
    });

    // Update image gallery for the selected item
    updateImageGallery();

    saveData();
}

// Load data by type and ID
function loadDataByTypeAndId(type, id) {
    if (!conceptData.prompts || !conceptData.prompts[id]) {
        console.log(`No data found for ${type}: ${id}`);
        return;
    }

    const data = conceptData.prompts[id];

    // Check if the data type matches
    if (data.type !== type) {
        console.log(`Type mismatch: expected ${type}, got ${data.type}`);
        return;
    }

    // Load universal prompts
    if (data.universal) {
        const universalElement = document.getElementById('universal-prompt');
        if (universalElement) {
            universalElement.textContent = data.universal;
        }
        conceptData.universal = data.universal;
    }
    if (data.universal_translated) {
        const universalTransElement = document.getElementById('universal-prompt-translated');
        if (universalTransElement) {
            universalTransElement.textContent = data.universal_translated;
        }
        conceptData.universal_translated = data.universal_translated;
    }

    // Load all fields
    const fieldMapping = {
        'STYLE': 'style',
        'MEDIUM': 'medium',
        'CHARACTER': 'character',
        'CAMERA': 'camera',
        'GAZE': 'gaze',
        'BODY_TYPE': 'body',
        'HAIR': 'hair',
        'FACE_SHAPE': 'face-shape',
        'FACIAL_FEATURES': 'facial-features',
        'SKIN': 'skin',
        'EXPRESSION': 'expression',
        'CLOTHING': 'clothing',
        'ACCESSORIES': 'accessories',
        'PROPS': 'props',
        'POSE': 'pose',
        'BACKGROUND': 'background',
        'LIGHTING': 'lighting',
        'QUALITY': 'quality'
    };

    // Clear all fields first
    Object.keys(fieldMapping).forEach(jsonField => {
        const htmlField = fieldMapping[jsonField];
        const originalElement = document.getElementById(`${htmlField}-original`);
        const translatedElement = document.getElementById(`${htmlField}-translated`);
        if (originalElement) originalElement.value = '';
        if (translatedElement) translatedElement.value = '';
    });

    // Fill fields from data
    Object.keys(fieldMapping).forEach(jsonField => {
        const htmlField = fieldMapping[jsonField];

        if (data[jsonField]) {
            const element = document.getElementById(`${htmlField}-original`);
            if (element) element.value = data[jsonField];
        }

        const translatedField = jsonField === 'BODY_TYPE' ? 'BODY_TYPE_translated' : `${jsonField}_translated`;
        if (data[translatedField]) {
            const element = document.getElementById(`${htmlField}-translated`);
            if (element) element.value = data[translatedField];
        }
    });

    // Parameters field
    if (data.PARAMETERS) {
        const element = document.getElementById('parameters');
        if (element) element.value = data.PARAMETERS;
    }

    updatePromptDisplay();
}


// Update prompt display
function updatePromptDisplay() {
    const fields = [
        'style', 'medium', 'character', 'camera', 'gaze', 'body',
        'hair', 'face-shape', 'facial-features', 'skin', 'expression',
        'clothing', 'accessories', 'props', 'pose', 'background',
        'lighting', 'quality'
    ];
    let promptParts = [];

    fields.forEach(field => {
        const input = document.getElementById(`${field}-original`);
        if (input && input.value.trim()) {
            promptParts.push(input.value.trim());
        }
    });

    // Add parameters at the end if exists
    const parameters = document.getElementById('parameters');
    if (parameters && parameters.value.trim()) {
        promptParts.push(parameters.value.trim());
    }

    const prompt = promptParts.join('; ');
    const generatedPromptElement = document.getElementById('generated-prompt');
    if (generatedPromptElement) {
        generatedPromptElement.textContent = prompt || '프롬프트가 여기에 표시됩니다...';
    }

    // Save current character data
    if (conceptData.currentCharacter) {
        if (!conceptData.prompts) conceptData.prompts = {};

        const dataToSave = {
            id: conceptData.currentCharacter,
            universal: conceptData.universal,
            universal_translated: conceptData.universal_translated
        };

        // Save all fields
        const fieldList = [
            'STYLE', 'MEDIUM', 'CHARACTER', 'CAMERA', 'GAZE', 'BODY_TYPE',
            'HAIR', 'FACE_SHAPE', 'FACIAL_FEATURES', 'SKIN', 'EXPRESSION',
            'CLOTHING', 'ACCESSORIES', 'PROPS', 'POSE', 'BACKGROUND',
            'LIGHTING', 'QUALITY'
        ];

        fieldList.forEach(field => {
            const htmlFieldName = field.toLowerCase().replace('_', '-');
            const originalElement = document.getElementById(`${htmlFieldName}-original`);
            const translatedElement = document.getElementById(`${htmlFieldName}-translated`);

            if (originalElement) dataToSave[field] = originalElement.value;
            if (translatedElement) dataToSave[`${field}_translated`] = translatedElement.value;
        });

        // Save parameters
        if (parameters) dataToSave.PARAMETERS = parameters.value;

        conceptData.prompts[conceptData.currentCharacter] = dataToSave;

        // Save location data if selected
        if (conceptData.currentLocation) {
            const locationKey = `location_${conceptData.currentLocation}`;
            const locationData = {
                BACKGROUND: document.getElementById('background-original')?.value || '',
                BACKGROUND_translated: document.getElementById('background-translated')?.value || '',
                LIGHTING: document.getElementById('lighting-original')?.value || '',
                LIGHTING_translated: document.getElementById('lighting-translated')?.value || ''
            };
            conceptData.prompts[locationKey] = locationData;
        }

        // Save props data if selected
        if (conceptData.currentProps) {
            const propsKey = `props_${conceptData.currentProps}`;
            const propsData = {
                PROPS: document.getElementById('props-original')?.value || '',
                PROPS_translated: document.getElementById('props-translated')?.value || ''
            };
            conceptData.prompts[propsKey] = propsData;
        }
        saveData();
    }
}

// Copy prompt to clipboard
function copyPrompt() {
    const promptText = document.getElementById('generated-prompt').textContent;

    if (promptText && promptText !== '프롬프트가 여기에 표시됩니다...') {
        navigator.clipboard.writeText(promptText).then(() => {
            // Change button text temporarily
            const copyBtn = document.querySelector('.copy-btn');
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
        });
    }
}

// Add image from URL
function addImage() {
    const urlInput = document.getElementById('image-url');
    const url = urlInput.value.trim();

    if (url) {
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
             onclick="openImageViewer('${imageData.url}', ${imageData.id})"
             onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22150%22 height=%22150%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23666%22 stroke-width=%222%22%3E%3Crect x=%223%22 y=%223%22 width=%2218%22 height=%2218%22 rx=%222%22/%3E%3Cline x1=%223%22 y1=%223%22 x2=%2221%22 y2=%2221%22/%3E%3Cline x1=%2221%22 y1=%223%22 x2=%223%22 y2=%2221%22/%3E%3C/svg%3E'">
        <div class="image-controls">
            ${!imageData.saved ?
                `<button class="control-btn save-btn" onclick="saveImagePermanently(${imageData.id})" title="갤러리에 저장">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                        <polyline points="17 21 17 13 7 13 7 21"/>
                        <polyline points="7 3 7 8 15 8"/>
                    </svg>
                </button>` :
                `<button class="control-btn save-btn saved" disabled title="저장됨">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                </button>`
            }
            <button class="control-btn download-btn" onclick="downloadSingleImage('${imageData.url}', '${imageData.id}')" title="다운로드">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
            </button>
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

// Transform Samurai Kid format to our format
function transformSamuraiKidData(data) {
    const transformed = {
        characters: [],
        locations: [],
        props: [],
        prompts: []
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
            transformed.prompts.push(prompt);
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
            transformed.prompts.push(prompt);
        });
    }

    // Transform props
    if (data.concept_art_collection?.props) {
        Object.entries(data.concept_art_collection.props).forEach(([key, prop]) => {
            transformed.props.push({ id: prop.name });

            // Add prop prompts with type
            const prompt = {
                id: prop.name,
                type: 'prop',
                universal: prop.prompts?.universal || '',
                universal_translated: prop.prompts?.universal_translated || '',
                ...prop.csv_data
            };
            transformed.prompts.push(prompt);
        });
    }

    return transformed;
}

// Load JSON file - 개선된 ID 매칭 시스템
function loadJSON() {
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

                    // Check if it's Samurai Kid format
                    if (jsonData.concept_art_collection) {
                        jsonData = transformSamuraiKidData(jsonData);
                    }

                    // characters 배열로부터 드롭다운 업데이트
                    if (jsonData.characters && jsonData.characters.length > 0) {
                        const characterDropdown = document.getElementById('character-dropdown');
                        characterDropdown.innerHTML = '';
                        jsonData.characters.forEach(char => {
                            const item = document.createElement('div');
                            item.className = 'dropdown-item';
                            item.onclick = () => selectItem('character', char.id);
                            item.textContent = char.id;
                            characterDropdown.appendChild(item);
                        });
                        conceptData.characters = jsonData.characters;

                        // Auto-select the first character after a short delay to ensure DOM is ready
                        setTimeout(() => {
                            const firstCharacter = jsonData.characters[0];
                            selectItem('character', firstCharacter.id);
                        }, 100);
                    }

                    // locations 배열로부터 드롭다운 업데이트
                    if (jsonData.locations) {
                        const locationDropdown = document.getElementById('location-dropdown');
                        locationDropdown.innerHTML = '';
                        jsonData.locations.forEach(loc => {
                            const item = document.createElement('div');
                            item.className = 'dropdown-item';
                            item.onclick = () => selectItem('location', loc.id);
                            item.textContent = loc.id;
                            locationDropdown.appendChild(item);
                        });
                        conceptData.locations = jsonData.locations;
                    }

                    // props 배열로부터 드롭다운 업데이트
                    if (jsonData.props) {
                        const propsDropdown = document.getElementById('props-dropdown');
                        propsDropdown.innerHTML = '';
                        jsonData.props.forEach(prop => {
                            const item = document.createElement('div');
                            item.className = 'dropdown-item';
                            item.onclick = () => selectItem('props', prop.id);
                            item.textContent = prop.id;
                            propsDropdown.appendChild(item);
                        });
                        conceptData.props = jsonData.props;
                    }

                    // prompts 객체 저장 - ID와 type으로 매칭
                    if (jsonData.prompts) {
                        // prompts가 이미 객체인 경우 그대로 사용
                        if (typeof jsonData.prompts === 'object' && !Array.isArray(jsonData.prompts)) {
                            conceptData.prompts = jsonData.prompts;
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
                                        prompt.type = 'prop';
                                    }
                                }

                                conceptData.prompts[prompt.id] = prompt;

                                // universal 프롬프트 저장 (첫 번째 항목의 universal 사용)
                                if (prompt.universal && !conceptData.universal) {
                                    conceptData.universal = prompt.universal;
                                    const universalElement = document.getElementById('universal-prompt');
                                    if (universalElement) {
                                        universalElement.textContent = prompt.universal;
                                    }
                                }
                                if (prompt.universal_translated && !conceptData.universal_translated) {
                                    conceptData.universal_translated = prompt.universal_translated;
                                    const universalTransElement = document.getElementById('universal-prompt-translated');
                                    if (universalTransElement) {
                                        universalTransElement.textContent = prompt.universal_translated;
                                    }
                                }
                            }
                        });
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
                        updateImageGallery();
                    }

                    // Save all data to localStorage
                    saveData();

                    // Alert success
                    alert('JSON 파일이 성공적으로 로드되었습니다!');

                    // Force select first character after alert is closed
                    if (jsonData.characters && jsonData.characters.length > 0) {
                        const firstCharacter = jsonData.characters[0];
                        selectItem('character', firstCharacter.id);
                    }
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
                    prompt.type = 'prop';
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

// Make functions globally available
window.toggleDropdown = toggleDropdown;
window.selectItem = selectItem;
window.copyPrompt = copyPrompt;
window.copyUniversalPrompt = copyUniversalPrompt;
window.copyUniversalPromptTranslated = copyUniversalPromptTranslated;
window.addImage = addImage;
window.deleteImage = deleteImage;
window.loadJSON = loadJSON;
window.downloadJSON = downloadJSON;
window.resetData = resetData;