// Authentication UI Logic

// Modal Functions
function openAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'block';
        showLogin();
    }
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'none';
        clearForms();
    }
}

function openPasswordModal() {
    const modal = document.getElementById('passwordModal');
    if (modal) {
        modal.style.display = 'block';
    }
    // Close user dropdown
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.remove('show');
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

// Form Display Functions
function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('forgotForm').style.display = 'none';
    document.getElementById('authTitle').textContent = '로그인';
    document.getElementById('authDescription').textContent = '계정에 로그인하여 서비스를 이용하세요';

    const footer = document.getElementById('authFooter');
    footer.innerHTML = `
        <span>계정이 없으신가요?</span>
        <a href="#" onclick="showSignup(); return false;">회원가입</a>
    `;
    clearErrors();
}

function showSignup() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
    document.getElementById('forgotForm').style.display = 'none';
    document.getElementById('authTitle').textContent = '회원가입';
    document.getElementById('authDescription').textContent = '새 계정을 만들어 서비스를 시작하세요';

    const footer = document.getElementById('authFooter');
    footer.innerHTML = `
        <span>이미 계정이 있으신가요?</span>
        <a href="#" onclick="showLogin(); return false;">로그인</a>
    `;
    clearErrors();
}

function showForgotPassword() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('forgotForm').style.display = 'block';
    document.getElementById('authTitle').textContent = '비밀번호 재설정';
    document.getElementById('authDescription').textContent = '이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다';
    document.getElementById('authFooter').style.display = 'none';
    clearErrors();
}

// User Menu Functions
function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const userMenu = document.querySelector('.user-menu-dropdown');
    if (userMenu && !userMenu.contains(event.target)) {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.classList.remove('show');
        }
    }
});

// Form Submissions
document.getElementById('loginForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    clearErrors();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        if (!email) showError('loginEmail', '이메일을 입력해주세요');
        if (!password) showError('loginPassword', '비밀번호를 입력해주세요');
        return;
    }

    // Disable button
    const button = e.target.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = '로그인 중...';

    try {
        const result = await window.supabaseAuth.signIn(email, password);

        if (result.success) {
            showSuccess('로그인 성공!');
            setTimeout(() => {
                closeAuthModal();
                location.reload(); // Refresh to update UI
            }, 1000);
        } else {
            showError('loginEmail', result.error || '로그인에 실패했습니다');
            button.disabled = false;
            button.textContent = '로그인';
        }
    } catch (error) {
        showError('loginEmail', '로그인 중 오류가 발생했습니다');
        button.disabled = false;
        button.textContent = '로그인';
    }
});

document.getElementById('signupForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    clearErrors();

    const fullName = document.getElementById('signupName').value;
    const nickname = document.getElementById('signupNickname').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const passwordConfirm = document.getElementById('signupPasswordConfirm').value;

    // Validation
    let hasError = false;
    if (!fullName) {
        showError('signupName', '이름을 입력해주세요');
        hasError = true;
    }
    if (!nickname) {
        showError('signupNickname', '닉네임을 입력해주세요');
        hasError = true;
    }
    if (!email) {
        showError('signupEmail', '이메일을 입력해주세요');
        hasError = true;
    } else if (!isValidEmail(email)) {
        showError('signupEmail', '올바른 이메일 형식이 아닙니다');
        hasError = true;
    }
    if (!password) {
        showError('signupPassword', '비밀번호를 입력해주세요');
        hasError = true;
    } else if (password.length < 6) {
        showError('signupPassword', '비밀번호는 최소 6자 이상이어야 합니다');
        hasError = true;
    }
    if (password !== passwordConfirm) {
        showError('signupPasswordConfirm', '비밀번호가 일치하지 않습니다');
        hasError = true;
    }

    if (hasError) return;

    // Disable button
    const button = e.target.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = '가입 중...';

    try {
        const result = await window.supabaseAuth.signUp(email, password, fullName, nickname);

        if (result.success) {
            showSuccess('회원가입이 완료되었습니다! 이메일을 확인해주세요.');
            setTimeout(() => {
                showLogin();
            }, 3000);
        } else {
            showError('signupEmail', result.error || '회원가입에 실패했습니다');
            button.disabled = false;
            button.textContent = '회원가입';
        }
    } catch (error) {
        showError('signupEmail', '회원가입 중 오류가 발생했습니다');
        button.disabled = false;
        button.textContent = '회원가입';
    }
});

document.getElementById('forgotForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    clearErrors();

    const email = document.getElementById('forgotEmail').value;

    if (!email) {
        showError('forgotEmail', '이메일을 입력해주세요');
        return;
    }

    if (!isValidEmail(email)) {
        showError('forgotEmail', '올바른 이메일 형식이 아닙니다');
        return;
    }

    // Disable button
    const button = e.target.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = '전송 중...';

    try {
        const result = await window.supabaseAuth.resetPassword(email);

        if (result.success) {
            showSuccess(result.message);
            setTimeout(() => {
                showLogin();
            }, 3000);
        } else {
            showError('forgotEmail', result.error || '요청 처리에 실패했습니다');
            button.disabled = false;
            button.textContent = '비밀번호 재설정 링크 보내기';
        }
    } catch (error) {
        showError('forgotEmail', '요청 처리 중 오류가 발생했습니다');
        button.disabled = false;
        button.textContent = '비밀번호 재설정 링크 보내기';
    }
});

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

    // Disable button
    const button = e.target.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = '변경 중...';

    try {
        const result = await window.supabaseAuth.changePassword(newPassword);

        if (result.success) {
            showSuccess(result.message);
            setTimeout(() => {
                closePasswordModal();
            }, 2000);
        } else {
            showError('newPassword', result.error || '비밀번호 변경에 실패했습니다');
            button.disabled = false;
            button.textContent = '비밀번호 변경';
        }
    } catch (error) {
        showError('newPassword', '비밀번호 변경 중 오류가 발생했습니다');
        button.disabled = false;
        button.textContent = '비밀번호 변경';
    }
});

// Logout Function
async function handleLogout() {
    if (confirm('정말 로그아웃 하시겠습니까?')) {
        try {
            const result = await window.supabaseAuth.signOut();
            if (result.success) {
                location.reload();
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
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

function showSuccess(message) {
    // You can implement a toast notification here
    alert(message);
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

function clearForms() {
    document.getElementById('loginForm')?.reset();
    document.getElementById('signupForm')?.reset();
    document.getElementById('forgotForm')?.reset();
    clearErrors();
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Close modals when clicking outside
window.onclick = function(event) {
    const authModal = document.getElementById('authModal');
    const passwordModal = document.getElementById('passwordModal');

    if (event.target == authModal) {
        closeAuthModal();
    }
    if (event.target == passwordModal) {
        closePasswordModal();
    }
}

// Export functions for global use
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.openPasswordModal = openPasswordModal;
window.closePasswordModal = closePasswordModal;
window.showLogin = showLogin;
window.showSignup = showSignup;
window.showForgotPassword = showForgotPassword;
window.toggleUserMenu = toggleUserMenu;
window.handleLogout = handleLogout;