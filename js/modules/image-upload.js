// Image Upload Manager Module
// 이미지 업로드, 드래그앤드롭, URL 추가 관리

export const imageUploadManager = {
    maxImages: 5,
    uploadedImages: [],
    isInitialized: false,
    currentShotId: null,

    init(forceShotId = null) {
        // 샷 ID 확인 - forceShotId가 있으면 우선 사용, 없으면 URL에서 가져오기
        const urlParams = new URLSearchParams(window.location.search);
        const urlShotId = urlParams.get('shotId');
        const shotIdElement = document.querySelector('.shot-id');
        const elementShotId = shotIdElement?.textContent.trim();

        const newShotId = forceShotId || urlShotId || elementShotId;

        console.log(`📸 Image Upload Manager init 호출`);
        console.log(`  - Force Shot ID: ${forceShotId}`);
        console.log(`  - URL Shot ID: ${urlShotId}`);
        console.log(`  - Element Shot ID: ${elementShotId}`);
        console.log(`  - 최종 선택된 Shot ID: ${newShotId}`);
        console.log(`  - 현재 저장된 Shot ID: ${this.currentShotId}`);

        // 샷이 변경되었으면 이미지 배열 완전히 초기화하고 새로 로드
        if (this.currentShotId !== newShotId) {
            console.log(`🔄 샷 변경 감지: ${this.currentShotId} → ${newShotId}`);

            // 완전히 초기화
            this.uploadedImages = [];
            this.currentShotId = newShotId;

            // 화면 먼저 초기화
            this.renderImages();

            // 새 샷의 이미지를 즉시 로드
            this.loadFromStorage();
        }

        // 이벤트 리스너는 한 번만 등록
        if (!this.isInitialized) {
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
        }

        // 이벤트 리스너 등록 후에만 저장된 이미지 로드 (샷이 변경되지 않은 경우)
        if (this.currentShotId === newShotId && this.uploadedImages.length === 0) {
            this.loadFromStorage();
        }
    },

    // localStorage에서 이미지 로드
    loadFromStorage() {
        try {
            if (this.currentShotId) {
                const storageKey = `uploadedImages_${this.currentShotId}`;
                const savedData = localStorage.getItem(storageKey);

                console.log(`🔍 이미지 로드 시도 - 샷 ID: ${this.currentShotId}, 스토리지 키: ${storageKey}`);

                if (savedData) {
                    const parsed = JSON.parse(savedData);
                    this.uploadedImages = parsed;
                    console.log(`✅ 저장된 이미지 로드 성공: ${this.uploadedImages.length}개 (${this.currentShotId})`, this.uploadedImages);
                } else {
                    this.uploadedImages = [];
                    console.log(`📭 저장된 이미지 없음 (${this.currentShotId})`);
                }
                this.renderImages();
            } else {
                console.warn(`⚠️ 샷 ID가 없어서 이미지를 로드할 수 없습니다.`);
            }
        } catch (error) {
            console.error('❌ 이미지 로드 실패:', error);
            this.uploadedImages = [];
            this.renderImages();
        }
    },

    // localStorage에 이미지 저장
    saveToStorage() {
        try {
            if (this.currentShotId) {
                const storageKey = `uploadedImages_${this.currentShotId}`;
                localStorage.setItem(storageKey, JSON.stringify(this.uploadedImages));
                console.log(`💾 이미지 저장됨: ${this.uploadedImages.length}개 (샷: ${this.currentShotId}, 키: ${storageKey})`);
            } else {
                console.warn(`⚠️ 샷 ID가 없어서 이미지를 저장할 수 없습니다.`);
            }
        } catch (error) {
            console.error('❌ 이미지 저장 실패:', error);
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
                this.saveToStorage();
            };
            reader.readAsDataURL(file);
        });
    },

    renderImages() {
        const grid = document.getElementById('imagePreviewGrid');
        if (!grid) {
            console.warn('⚠️ imagePreviewGrid 요소를 찾을 수 없습니다.');
            return;
        }

        // 완전히 초기화
        grid.innerHTML = '';

        console.log(`🎨 이미지 렌더링 - 샷 ID: ${this.currentShotId}, 이미지 수: ${this.uploadedImages.length}`);

        this.uploadedImages.forEach((image, index) => {
            const item = document.createElement('div');
            item.className = 'image-preview-item';
            item.innerHTML = `
                <img src="${image.src}" alt="${image.name}" onclick="window.openUploadedImageViewer('${image.src.replace(/'/g, "\\'")}', '${image.name.replace(/'/g, "\\'")}', ${image.id})" style="cursor: pointer;">
                <span class="image-number">#${index + 1}</span>
                <button class="image-remove-btn" onclick="window.imageUploadManager.removeImage(${image.id})">
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
        this.saveToStorage();
    },

    clearAll() {
        this.uploadedImages = [];
        this.renderImages();
        this.saveToStorage();
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
                id: Date.now() + Math.random(),
                src: url,
                name: url.split('/').pop() || 'image-from-url'
            };
            this.uploadedImages.push(imageData);
            this.renderImages();
            this.saveToStorage();

            // 입력 필드 초기화
            const urlInput = document.getElementById('imageUrlInput');
            if (urlInput) urlInput.value = '';
        };

        img.onerror = () => {
            alert('이미지를 로드할 수 없습니다. URL을 확인해주세요.');
        };

        img.src = url;
    },

    getUploadedImages() {
        return this.uploadedImages;
    }
};

// Global helper functions
export function clearAllImages() {
    if (confirm('모든 이미지를 삭제하시겠습니까?')) {
        imageUploadManager.clearAll();
    }
}

export function toggleUrlInput() {
    const wrapper = document.getElementById('urlInputWrapper');
    const toggleBtn = document.getElementById('toggleUrlBtn');

    if (wrapper && toggleBtn) {
        if (wrapper.style.display === 'none') {
            wrapper.style.display = 'flex';
            toggleBtn.classList.add('active');
        } else {
            wrapper.style.display = 'none';
            toggleBtn.classList.remove('active');
        }
    }
}

export function addImageFromUrl() {
    const urlInput = document.getElementById('imageUrlInput');
    if (urlInput) {
        imageUploadManager.addFromUrl(urlInput.value.trim());
        urlInput.value = '';
    }
}
