// Profile Management JavaScript

// Check authentication on page load
document.addEventListener('DOMContentLoaded', async function() {
    const user = await window.supabaseAuth.getUser();

    if (!user) {
        // Redirect to home if not logged in
        window.location.href = '/index.html';
        return;
    }

    // Load user profile
    loadProfile();
});

// Load user profile data
async function loadProfile() {
    try {
        const profile = await window.supabaseAuth.getUserProfile();
        const user = await window.supabaseAuth.getUser();

        if (profile) {
            // Update form fields
            document.getElementById('profileName').value = profile.full_name || '';
            document.getElementById('profileNickname').value = profile.nickname || '';
            document.getElementById('profileEmail').value = profile.email || user.email || '';
            document.getElementById('profileBio').value = profile.bio || '';

            // Update avatar
            const avatarImg = document.getElementById('profileAvatar');
            const userAvatarImg = document.querySelector('.user-avatar-img');
            const avatarUrl = profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || 'User')}&background=6366f1&color=fff`;

            if (avatarImg) avatarImg.src = avatarUrl;
            if (userAvatarImg) userAvatarImg.src = avatarUrl;

            // Update user menu
            const userName = document.querySelector('.user-name');
            if (userName) {
                userName.textContent = profile.nickname || profile.full_name || user.email.split('@')[0];
            }

            // Update activity info
            if (profile.created_at) {
                const joinDate = new Date(profile.created_at);
                document.getElementById('joinDate').textContent = joinDate.toLocaleDateString('ko-KR');
            }

            if (profile.updated_at) {
                const lastUpdate = new Date(profile.updated_at);
                document.getElementById('lastUpdate').textContent = lastUpdate.toLocaleDateString('ko-KR');
            }

            // Check email verification status
            if (user.email_confirmed_at) {
                document.getElementById('emailVerificationStatus').textContent = '이메일 인증이 완료되었습니다';
                document.getElementById('verifyEmailBtn').style.display = 'none';
            } else {
                document.getElementById('emailVerificationStatus').textContent = '이메일 인증이 필요합니다';
                document.getElementById('verifyEmailBtn').style.display = 'inline-block';
            }
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showToast('프로필을 불러오는 중 오류가 발생했습니다', 'error');
    }
}

// Handle profile form submission
document.getElementById('profileForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const fullName = document.getElementById('profileName').value;
    const nickname = document.getElementById('profileNickname').value;
    const bio = document.getElementById('profileBio').value;

    const button = e.target.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = '저장 중...';

    try {
        const result = await window.supabaseAuth.updateProfile({
            full_name: fullName,
            nickname: nickname,
            bio: bio
        });

        if (result.success) {
            showToast('프로필이 성공적으로 업데이트되었습니다', 'success');

            // Update UI
            const userName = document.querySelector('.user-name');
            if (userName) {
                userName.textContent = nickname || fullName || '사용자';
            }
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        showToast('프로필 업데이트 중 오류가 발생했습니다', 'error');
        console.error('Profile update error:', error);
    } finally {
        button.disabled = false;
        button.textContent = '저장';
    }
});

// Handle avatar upload
async function handleAvatarUpload(event) {
    const file = event.target.files[0];

    if (!file) return;

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
        showToast('파일 크기는 5MB 이하여야 합니다', 'error');
        return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
        showToast('이미지 파일만 업로드 가능합니다', 'error');
        return;
    }

    try {
        showToast('이미지 업로드 중...', 'info');

        const result = await window.supabaseAuth.uploadProfileImage(file);

        if (result.success) {
            // Update avatar displays
            document.getElementById('profileAvatar').src = result.url;
            document.querySelector('.user-avatar-img').src = result.url;

            showToast('프로필 사진이 업데이트되었습니다', 'success');
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        showToast('이미지 업로드 중 오류가 발생했습니다', 'error');
        console.error('Avatar upload error:', error);
    }
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

// Delete account confirmation
function confirmDeleteAccount() {
    if (confirm('정말 계정을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 모든 데이터가 영구적으로 삭제됩니다.')) {
        if (confirm('정말로 확실하신가요? 마지막 확인입니다.')) {
            deleteAccount();
        }
    }
}

// Delete account
async function deleteAccount() {
    try {
        // Note: Supabase doesn't have a direct delete account method
        // You would need to implement this on your backend
        showToast('계정 삭제 기능은 현재 개발 중입니다', 'info');

        // In production, you would call a backend API to delete the account
        // const result = await fetch('/api/delete-account', {
        //     method: 'DELETE',
        //     headers: {
        //         'Authorization': `Bearer ${token}`
        //     }
        // });

    } catch (error) {
        showToast('계정 삭제 중 오류가 발생했습니다', 'error');
        console.error('Delete account error:', error);
    }
}

// Helper Functions
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

function clearErrors() {
    document.querySelectorAll('.error-message').forEach(el => {
        el.textContent = '';
        el.classList.remove('show');
    });
    document.querySelectorAll('input.error').forEach(el => {
        el.classList.remove('error');
    });
}

// Toast notification
function showToast(message, type = 'info') {
    // Remove existing toasts
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    // Create new toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<div class="toast-message">${message}</div>`;

    document.body.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
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

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const passwordModal = document.getElementById('passwordModal');
    if (event.target == passwordModal) {
        closePasswordModal();
    }
});