// Storyboard Management System
class StoryboardManager {
    constructor() {
        this.storyboardData = null;
        this.currentScene = null;
        this.currentShot = null;
        this.init();
    }

    init() {
        // Initialize event listeners
        document.addEventListener('DOMContentLoaded', () => {
            this.setupFileUpload();
            this.setupDropdowns();
            this.loadFromLocalStorage();
            this.checkInitialData();
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

    handleFileUpload(file) {
        if (file.type !== 'application/json') {
            alert('JSON 파일만 업로드 가능합니다.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.processStoryboardData(data);
            } catch (error) {
                alert('JSON 파일 파싱 오류: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    processStoryboardData(data) {
        // Validate data structure
        if (!data.scenes || !Array.isArray(data.scenes)) {
            alert('올바른 스토리보드 JSON 형식이 아닙니다.');
            return;
        }

        this.storyboardData = data;
        this.saveToLocalStorage();
        this.populateSceneDropdown();
        this.renderStoryboard();

        // Hide upload area after successful upload
        const uploadSection = document.querySelector('.upload-section');
        if (uploadSection) {
            uploadSection.style.display = 'none';
        }

        // Show controls
        const controls = document.querySelector('.storyboard-controls');
        if (controls) {
            controls.style.display = 'flex';
        }
    }

    populateSceneDropdown() {
        const sceneSelect = document.getElementById('sceneSelect');
        if (!sceneSelect || !this.storyboardData) return;

        // Clear existing options
        sceneSelect.innerHTML = '<option value="">전체 Scene</option>';

        // Add scene options
        this.storyboardData.scenes.forEach(scene => {
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
        const scene = this.storyboardData.scenes.find(s => s.scene_id === sceneId);
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
        const sceneSelect = document.getElementById('sceneSelect');
        const shotSelect = document.getElementById('shotSelect');

        if (sceneSelect) {
            sceneSelect.addEventListener('change', (e) => {
                this.currentScene = e.target.value;
                this.currentShot = null;
                this.populateShotDropdown(this.currentScene);
                this.renderStoryboard();

                // Reset shot dropdown
                if (shotSelect) {
                    shotSelect.value = '';
                }
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

        if (!this.storyboardData || !this.storyboardData.scenes) {
            this.renderEmptyState();
            return;
        }

        let scenesToRender = this.storyboardData.scenes;

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
        sceneHeader.innerHTML = `
            <h2 class="scene-title">${scene.scene_id}: ${scene.scene_title}</h2>
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
            const card = this.createShotCard(shot);
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

        card.innerHTML = `
            <div class="card-header">
                <span class="shot-id">${shot.shot_id}</span>
                <span class="shot-type">${shot.shot_type || 'regular'}</span>
            </div>
            <div class="card-thumbnail">
                <svg class="thumbnail-placeholder" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
            </div>
            <div class="card-content">
                <p class="shot-text">${shot.shot_text || shot.shot_summary || ''}</p>
                <div class="card-meta">
                    <div class="meta-item">
                        <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                        <span class="meta-label">Camera:</span>
                        <span class="meta-value">${movementType}</span>
                    </div>
                    <div class="meta-item">
                        <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span class="meta-label">Duration:</span>
                        <span class="meta-value">${duration}</span>
                    </div>
                </div>
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
                // TODO: Implement video playback
                alert('비디오 재생 기능은 준비 중입니다.');
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
            alert('PT북사에 복사되었습니다.');
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    }

    editShotBlock(shot) {
        // TODO: Implement shot editing modal
        alert('블록 수정 기능은 준비 중입니다.');
    }

    duplicateShot(shot) {
        // TODO: Implement shot duplication
        alert('샷 복제 기능은 준비 중입니다.');
    }

    deleteShot(shot) {
        // TODO: Implement shot deletion from data
        alert('샷 삭제 기능은 준비 중입니다.');
    }

    showShotDetails(shot) {
        // Create a modal or expand view to show detailed shot information
        console.log('Shot details:', shot);
        // TODO: Implement detailed view modal

        // For now, show basic info in alert
        const details = `
Shot ID: ${shot.shot_id}
Type: ${shot.shot_type || 'regular'}
Text: ${shot.shot_text || shot.shot_summary || 'No description'}
Camera: ${shot.camera_movement?.type || 'static'}
Duration: ${shot.camera_movement?.duration || 'N/A'}
        `;
        alert(details);
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

    saveToLocalStorage() {
        if (this.storyboardData) {
            localStorage.setItem('storyboardData', JSON.stringify(this.storyboardData));
        }
    }

    loadFromLocalStorage() {
        const savedData = localStorage.getItem('storyboardData');
        if (savedData) {
            try {
                this.storyboardData = JSON.parse(savedData);
                this.populateSceneDropdown();
                this.renderStoryboard();

                // Hide upload area if data exists
                const uploadSection = document.querySelector('.upload-section');
                if (uploadSection) {
                    uploadSection.style.display = 'none';
                }

                // Show controls
                const controls = document.querySelector('.storyboard-controls');
                if (controls) {
                    controls.style.display = 'flex';
                }
            } catch (error) {
                console.error('Failed to load saved storyboard data:', error);
            }
        }
    }

    clearStoryboard() {
        this.storyboardData = null;
        this.currentScene = null;
        this.currentShot = null;
        localStorage.removeItem('storyboardData');

        // Reset UI
        const uploadSection = document.querySelector('.upload-section');
        if (uploadSection) {
            uploadSection.style.display = 'block';
        }

        const controls = document.querySelector('.storyboard-controls');
        if (controls) {
            controls.style.display = 'none';
        }

        this.renderEmptyState();
    }

    checkInitialData() {
        // Check if there's no saved data
        if (!this.storyboardData) {
            const controls = document.querySelector('.storyboard-controls');
            if (controls) {
                controls.style.display = 'none';
            }
        }
    }
}

// Initialize Storyboard Manager
const storyboardManager = new StoryboardManager();

// Export for global access
window.storyboardManager = storyboardManager;