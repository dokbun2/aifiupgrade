// Projects Management JavaScript

// Global variables
let projects = [];
let currentProjectId = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    const user = await window.supabaseAuth.getUser();
    if (!user) {
        window.location.href = '/index.html';
        return;
    }

    // Load user profile for display
    loadUserInfo();

    // Load projects from localStorage
    loadProjects();

    // Update statistics
    updateStatistics();
});

// Load user info
async function loadUserInfo() {
    const profile = await window.supabaseAuth.getUserProfile();
    const user = await window.supabaseAuth.getUser();

    if (profile || user) {
        // Show user menu container
        const userMenuContainer = document.querySelector('.user-menu-container');
        if (userMenuContainer) {
            userMenuContainer.style.display = 'block';
        }

        const userName = document.querySelector('.user-name');
        const userAvatar = document.querySelector('.user-avatar-img');

        if (userName) {
            userName.textContent = profile?.nickname || profile?.full_name || user?.email?.split('@')[0] || '사용자';
        }

        if (userAvatar) {
            userAvatar.src = profile?.avatar_url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'User')}&background=6366f1&color=fff`;
        }
    }
}

// Load projects from localStorage
function loadProjects() {
    // Load saved projects
    const savedProjects = localStorage.getItem('aifi_projects');
    if (savedProjects) {
        projects = JSON.parse(savedProjects);
    }

    renderProjects();
}

// Save projects to localStorage
function saveProjects() {
    localStorage.setItem('aifi_projects', JSON.stringify(projects));
}

// Render projects grid
function renderProjects(filteredProjects = null) {
    const grid = document.getElementById('projectsGrid');
    const projectsToRender = filteredProjects || projects;

    if (projectsToRender.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" id="emptyState">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                    <polyline points="13 2 13 9 20 9"></polyline>
                </svg>
                <h3>프로젝트가 없습니다</h3>
                <p>스토리보드나 컨셉아트에서 프로젝트를 백업하세요</p>
                <button class="btn-primary" onclick="openBackupModal()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 5v14"></path>
                        <path d="M5 12h14"></path>
                    </svg>
                    첫 프로젝트 백업하기
                </button>
            </div>
        `;
        return;
    }

    grid.innerHTML = projectsToRender.map(project => `
        <div class="project-card" onclick="viewProject('${project.id}')">
            <div class="project-card-header">
                <span class="project-type-badge type-${project.type}">${project.type}</span>
                <h3>${project.name}</h3>
            </div>
            <div class="project-card-body">
                <p class="project-card-description">${project.description || '설명이 없습니다'}</p>
                <div class="project-card-meta">
                    <span>${formatDate(project.createdAt)}</span>
                    <span>${formatSize(project.size)}</span>
                </div>
                <div class="project-card-actions" onclick="event.stopPropagation()">
                    <button class="card-btn card-btn-restore" onclick="restoreProject('${project.id}'); event.stopPropagation()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="1 4 1 10 7 10"></polyline>
                            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                        </svg>
                        복원
                    </button>
                    <button class="card-btn" onclick="downloadProject('${project.id}'); event.stopPropagation()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        다운로드
                    </button>
                    <button class="card-btn card-btn-delete" onclick="deleteProject('${project.id}'); event.stopPropagation()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        삭제
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Update statistics
function updateStatistics() {
    const totalProjects = projects.length;
    const storyboardCount = projects.filter(p => p.type === 'storyboard').length;
    const conceptArtCount = projects.filter(p => p.type === 'conceptart').length;
    const totalSize = projects.reduce((sum, p) => sum + (p.size || 0), 0);

    document.getElementById('totalProjects').textContent = totalProjects;
    document.getElementById('storyboardCount').textContent = storyboardCount;
    document.getElementById('conceptArtCount').textContent = conceptArtCount;
    document.getElementById('totalSize').textContent = formatSize(totalSize);
}

// Create new backup
function createBackup() {
    const name = document.getElementById('backupName').value || `백업 ${new Date().toLocaleString('ko-KR')}`;
    const type = document.getElementById('backupType').value;
    const description = document.getElementById('backupDescription').value;

    const backupData = {};

    // Get data from localStorage based on type
    if (type === 'storyboard' || type === 'both') {
        const storyboardData = localStorage.getItem('storyboard_project');
        if (storyboardData) {
            backupData.storyboard = JSON.parse(storyboardData);
        }
    }

    if (type === 'conceptart' || type === 'both') {
        const conceptArtData = localStorage.getItem('conceptart_project');
        if (conceptArtData) {
            backupData.conceptart = JSON.parse(conceptArtData);
        }
    }

    if (Object.keys(backupData).length === 0) {
        showToast('백업할 데이터가 없습니다', 'error');
        return;
    }

    // Create project object
    const project = {
        id: generateId(),
        name,
        type: type === 'both' ? 'storyboard' : type,
        description,
        data: backupData,
        size: JSON.stringify(backupData).length,
        createdAt: new Date().toISOString(),
        itemCount: countItems(backupData)
    };

    // Add to projects array
    projects.unshift(project);
    saveProjects();

    // Update UI
    renderProjects();
    updateStatistics();
    closeBackupModal();

    showToast('백업이 성공적으로 생성되었습니다', 'success');
}

// View project details
function viewProject(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    currentProjectId = projectId;

    document.getElementById('projectModalTitle').textContent = project.name;
    document.getElementById('projectDate').textContent = formatDate(project.createdAt);
    document.getElementById('projectType').textContent = project.type === 'both' ? '스토리보드 & 컨셉아트' : project.type;
    document.getElementById('projectSize').textContent = formatSize(project.size);
    document.getElementById('projectItems').textContent = project.itemCount + '개';
    document.getElementById('projectDescription').textContent = project.description || '설명이 없습니다';

    // Show preview of data
    const preview = document.getElementById('projectPreview');
    preview.textContent = JSON.stringify(project.data, null, 2);

    document.getElementById('projectModal').classList.add('show');
}

// Restore project
function restoreProject(projectId) {
    if (!projectId && currentProjectId) {
        projectId = currentProjectId;
    }

    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    if (!confirm(`"${project.name}" 프로젝트를 복원하시겠습니까?\n\n현재 저장된 데이터는 덮어쓰기됩니다.`)) {
        return;
    }

    // Restore data to localStorage
    if (project.data.storyboard) {
        localStorage.setItem('storyboard_project', JSON.stringify(project.data.storyboard));
    }

    if (project.data.conceptart) {
        localStorage.setItem('conceptart_project', JSON.stringify(project.data.conceptart));
    }

    showToast('프로젝트가 성공적으로 복원되었습니다', 'success');
    closeProjectModal();
}

// Download project
function downloadProject(projectId) {
    if (!projectId && currentProjectId) {
        projectId = currentProjectId;
    }

    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const dataStr = JSON.stringify(project, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '_')}_${project.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('프로젝트가 다운로드되었습니다', 'success');
}

// Delete project
function deleteProject(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    if (!confirm(`"${project.name}" 프로젝트를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
        return;
    }

    projects = projects.filter(p => p.id !== projectId);
    saveProjects();

    renderProjects();
    updateStatistics();

    showToast('프로젝트가 삭제되었습니다', 'info');
}

// Export all projects
function exportAllProjects() {
    if (projects.length === 0) {
        showToast('내보낼 프로젝트가 없습니다', 'error');
        return;
    }

    const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        projects: projects
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `AIFI_Projects_Export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`${projects.length}개의 프로젝트를 내보냈습니다`, 'success');
}

// Import projects
function importProjects(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importData = JSON.parse(e.target.result);

            if (importData.projects && Array.isArray(importData.projects)) {
                // Import multiple projects
                const newProjects = importData.projects.map(p => ({
                    ...p,
                    id: generateId() // Generate new IDs to avoid conflicts
                }));

                projects.push(...newProjects);
                showToast(`${newProjects.length}개의 프로젝트를 가져왔습니다`, 'success');
            } else if (importData.id && importData.data) {
                // Import single project
                const newProject = {
                    ...importData,
                    id: generateId()
                };

                projects.unshift(newProject);
                showToast('프로젝트를 가져왔습니다', 'success');
            } else {
                throw new Error('Invalid file format');
            }

            saveProjects();
            renderProjects();
            updateStatistics();

        } catch (error) {
            showToast('파일을 가져오는 중 오류가 발생했습니다', 'error');
            console.error('Import error:', error);
        }
    };

    reader.readAsText(file);
    event.target.value = ''; // Reset file input
}

// Search projects
function searchProjects() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    if (!searchTerm) {
        renderProjects();
        return;
    }

    const filtered = projects.filter(p =>
        p.name.toLowerCase().includes(searchTerm) ||
        (p.description && p.description.toLowerCase().includes(searchTerm)) ||
        p.type.toLowerCase().includes(searchTerm)
    );

    renderProjects(filtered);
}

// Filter projects
function filterProjects() {
    const filterType = document.getElementById('filterType').value;

    if (filterType === 'all') {
        renderProjects();
        return;
    }

    const filtered = projects.filter(p => p.type === filterType);
    renderProjects(filtered);
}

// Sort projects
function sortProjects() {
    const sortBy = document.getElementById('sortBy').value;

    let sorted = [...projects];

    switch(sortBy) {
        case 'date-desc':
            sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'date-asc':
            sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            break;
        case 'name-asc':
            sorted.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
            break;
        case 'name-desc':
            sorted.sort((a, b) => b.name.localeCompare(a.name, 'ko'));
            break;
        case 'size-desc':
            sorted.sort((a, b) => (b.size || 0) - (a.size || 0));
            break;
        case 'size-asc':
            sorted.sort((a, b) => (a.size || 0) - (b.size || 0));
            break;
    }

    renderProjects(sorted);
}

// Modal functions
function openBackupModal() {
    document.getElementById('backupModal').classList.add('show');
}

function closeBackupModal() {
    document.getElementById('backupModal').classList.remove('show');
    document.getElementById('backupName').value = '';
    document.getElementById('backupDescription').value = '';
}

function closeProjectModal() {
    document.getElementById('projectModal').classList.remove('show');
    currentProjectId = null;
}

// Helper functions
function generateId() {
    return 'project_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function countItems(data) {
    let count = 0;
    if (data.storyboard) {
        count += Object.keys(data.storyboard).length;
    }
    if (data.conceptart) {
        count += Object.keys(data.conceptart).length;
    }
    return count;
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// User menu toggle
function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.classList.toggle('show');
}

// Handle logout
async function handleLogout() {
    await window.supabaseAuth.signOut();
    window.location.href = '/index.html';
}

// Password modal functions
function openPasswordModal() {
    const modal = document.getElementById('passwordModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closePasswordModal() {
    const modal = document.getElementById('passwordModal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('passwordChangeForm').reset();
        clearErrors();
    }
}

function clearErrors() {
    document.querySelectorAll('.error-message').forEach(el => {
        el.textContent = '';
        el.classList.remove('show');
    });
    document.querySelectorAll('input.error').forEach(el => {
        el.classList.remove('error');
    });
}

// Handle password change form
document.getElementById('passwordChangeForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    clearErrors();

    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;

    // Validation
    let hasError = false;
    if (!newPassword) {
        showError('newPassword', '새 비밀번호를 입력해주세요');
        hasError = true;
    } else if (newPassword.length < 6) {
        showError('newPassword', '비밀번호는 최소 6자 이상이어야 합니다');
        hasError = true;
    }
    if (newPassword !== confirmNewPassword) {
        showError('confirmNewPassword', '비밀번호가 일치하지 않습니다');
        hasError = true;
    }

    if (hasError) return;

    const button = e.target.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = '변경 중...';

    try {
        const result = await window.supabaseAuth.changePassword(newPassword);

        if (result.success) {
            showToast(result.message, 'success');
            closePasswordModal();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        showError('newPassword', '비밀번호 변경에 실패했습니다');
        console.error('Password change error:', error);
    } finally {
        button.disabled = false;
        button.textContent = '비밀번호 변경';
    }
});

function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(fieldId + 'Error');

    if (field) {
        field.classList.add('error');
    }
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    if (!event.target.closest('.user-menu-dropdown')) {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.classList.remove('show');
        }
    }
});

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('show');
        currentProjectId = null;
    }
});