/**
 * Gemini API UI Functions
 * Handles API modal and settings on main page
 */

// Load API Status on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check if API is already configured
    if (window.geminiAPI) {
        updateAPIStatusInMenu();
    }
});

// Update API Status in User Menu
function updateAPIStatusInMenu() {
    if (!window.geminiAPI) return;

    const status = window.geminiAPI.getStatus();
    const apiMenuItem = document.querySelector('[onclick="openAPIModal(); return false;"]');

    if (apiMenuItem && status.isConnected) {
        // Add a visual indicator if API is connected
        const textNode = Array.from(apiMenuItem.childNodes).find(node => node.nodeType === 3);
        if (textNode) {
            textNode.textContent = '';
        }
    }
}

// Open API Modal
function openAPIModal() {
    const modal = document.getElementById('apiModal');
    if (modal) {
        modal.style.display = 'block';
        loadAPIStatus();
    }
}

// Close API Modal
function closeAPIModal() {
    const modal = document.getElementById('apiModal');
    if (modal) {
        modal.style.display = 'none';

        // Reset form if not connected
        const status = window.geminiAPI ? window.geminiAPI.getStatus() : {};
        if (!status.isConnected) {
            const form = document.getElementById('apiSettingForm');
            if (form) form.reset();
            const testResult = document.getElementById('apiTestResult');
            if (testResult) testResult.style.display = 'none';
            const apiStatus = document.getElementById('apiStatus');
            if (apiStatus) apiStatus.style.display = 'none';
        }
    }
}

// Load API Status
function loadAPIStatus() {
    if (window.geminiAPI) {
        const status = window.geminiAPI.getStatus();
        updateAPIStatusUI(status);
    }
}

// Update API Status UI
function updateAPIStatusUI(status) {
    const apiKeyInput = document.getElementById('apiKey');
    const saveBtn = document.getElementById('saveAPIBtn');
    const clearBtn = document.getElementById('clearBtn');
    const apiStatus = document.getElementById('apiStatus');

    if (status.hasKey && status.isConnected) {
        if (apiKeyInput) {
            apiKeyInput.value = '••••••••••••••••••••••••';
            apiKeyInput.disabled = true;
        }

        if (saveBtn) saveBtn.disabled = true;
        if (clearBtn) clearBtn.style.display = 'inline-block';

        // Show usage stats
        if (apiStatus) {
            apiStatus.style.display = 'block';
            const usageStats = window.geminiAPI.getUsageStats();

            document.getElementById('connectionStatus').textContent = '연결됨';
            document.getElementById('connectionStatus').className = 'status-value connected';
            document.getElementById('usageStatus').textContent =
                `텍스트: ${usageStats.textRequests}회, 이미지: ${usageStats.imageRequests}회`;
        }
    } else {
        if (clearBtn) clearBtn.style.display = 'none';
    }
}

// Toggle API Key visibility
function toggleAPIKeyVisibility() {
    const input = document.getElementById('apiKey');
    const icon = event.currentTarget.querySelector('svg');

    if (input.type === 'password') {
        input.type = 'text';
        // Change icon to eye-off
        icon.innerHTML = `
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
        `;
    } else {
        input.type = 'password';
        // Change icon back to eye
        icon.innerHTML = `
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        `;
    }
}

// Test API Connection
async function testAPIConnection() {
    const apiKeyInput = document.getElementById('apiKey');
    const testBtn = event?.currentTarget || document.querySelector('[onclick="testAPIConnection()"]');
    const saveBtn = document.getElementById('saveAPIBtn');
    const testResult = document.getElementById('apiTestResult');
    const testResultContent = testResult ? testResult.querySelector('.result-message') : null;

    if (!apiKeyInput || !testBtn) {
        console.error('Required elements not found for API test');
        return;
    }

    const apiKey = apiKeyInput.value.trim();

    if (!apiKey || apiKey === '••••••••••••••••••••••••') {
        showError('apiKey', 'API Key를 입력해주세요');
        return;
    }

    // Clear previous errors
    clearAPIErrors();

    // Show loading state
    testBtn.disabled = true;
    testBtn.textContent = '테스트 중...';
    if (testResult) testResult.style.display = 'none';

    try {
        // Initialize API with key
        window.geminiAPI.init(apiKey);

        // Test connection
        const result = await window.geminiAPI.testConnection();

        if (result.success) {
            // Show success
            if (testResult) {
                testResult.className = 'api-test-result success';
                testResult.style.display = 'block';
            }
            if (testResultContent) {
                testResultContent.innerHTML = `✅ 연결 성공! 테스트 응답: "${result.response}"`;
            }

            // Auto-save and close modal after success
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.classList.add('btn-success');
                saveBtn.innerHTML = `✅ 자동 저장 중...`;
            }

            // Save to session automatically
            window.geminiAPI.saveToSession();

            // Update status
            loadAPIStatus();
            updateAPIStatusInMenu();

            // shot-detail 페이지의 iframe에 API 키 전송
            if (typeof sendAPIKeyToIframe === 'function') {
                setTimeout(sendAPIKeyToIframe, 500);
                console.log('shot-detail iframe으로 API 키 전송 시도');
            }

            // storage 이벤트 수동 트리거 (같은 창의 다른 컨텍스트에 알림)
            try {
                window.dispatchEvent(new StorageEvent('storage', {
                    key: 'gemini_api_state',
                    newValue: sessionStorage.getItem('gemini_api_state'),
                    oldValue: null,
                    url: window.location.href,
                    storageArea: sessionStorage
                }));
            } catch (e) {
                console.log('Storage 이벤트 디스패치 실패 (정상적인 동작):', e);
            }

            // Show success toast and close modal after short delay
            setTimeout(() => {
                showToast('API 키가 성공적으로 저장되었습니다', 'success');
                closeAPIModal();
            }, 1000);

        } else {
            // Show error
            if (testResult) {
                testResult.className = 'api-test-result error';
                testResult.style.display = 'block';
            }
            if (testResultContent) {
                testResultContent.innerHTML = `❌ 연결 실패: ${result.message}`;
            }

            // Clear invalid key
            window.geminiAPI.clearSession();
        }

    } catch (error) {
        console.error('Connection test error:', error);
        if (testResult) {
            testResult.className = 'api-test-result error';
            testResult.style.display = 'block';
        }
        if (testResultContent) {
            testResultContent.innerHTML = `❌ 오류 발생: ${error.message || '알 수 없는 오류가 발생했습니다'}`;
        }
    } finally {
        // Reset button
        if (testBtn) {
            testBtn.disabled = false;
            testBtn.textContent = '연결 테스트';
        }
    }
}

// Save API Settings
document.getElementById('apiSettingForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    const status = window.geminiAPI.getStatus();

    if (!status.isConnected) {
        showToast('먼저 연결 테스트를 수행해주세요', 'error');
        return;
    }

    // Save to session
    window.geminiAPI.saveToSession();

    // Show success with faster UI response
    showToast('API 설정이 저장되었습니다', 'success');

    // Update UI
    loadAPIStatus();
    updateAPIStatusInMenu();

    // Close modal immediately for better UX
    closeAPIModal();
});

// Clear API Key
function clearAPIKey() {
    if (confirm('정말로 API Key를 삭제하시겠습니까?')) {
        // Clear session
        window.geminiAPI.clearSession();

        // Reset form
        const form = document.getElementById('apiSettingForm');
        if (form) form.reset();
        const apiKey = document.getElementById('apiKey');
        if (apiKey) apiKey.disabled = false;
        const saveBtn = document.getElementById('saveAPIBtn');
        if (saveBtn) saveBtn.disabled = true;
        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) clearBtn.style.display = 'none';
        const testResult = document.getElementById('apiTestResult');
        if (testResult) testResult.style.display = 'none';
        const apiStatus = document.getElementById('apiStatus');
        if (apiStatus) apiStatus.style.display = 'none';

        // Update status
        loadAPIStatus();
        updateAPIStatusInMenu();

        showToast('API Key가 삭제되었습니다', 'info');
    }
}

// Helper function to show errors
function showError(fieldId, message) {
    const errorElement = document.getElementById(fieldId + 'Error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

// Helper function to clear errors
function clearAPIErrors() {
    const apiKeyError = document.getElementById('apiKeyError');
    if (apiKeyError) {
        apiKeyError.textContent = '';
        apiKeyError.style.display = 'none';
    }
}

// Toast notification (if not already defined)
if (typeof showToast === 'undefined') {
    window.showToast = function(message, type = 'info') {
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
    };
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const apiModal = document.getElementById('apiModal');
    if (event.target == apiModal) {
        closeAPIModal();
    }
});

// Listen for Gemini API ready event
window.addEventListener('geminiAPIReady', function(event) {
    console.log('Gemini API Ready:', event.detail);
    loadAPIStatus();
    updateAPIStatusInMenu();
});

// Export functions for global use
window.openAPIModal = openAPIModal;
window.closeAPIModal = closeAPIModal;
window.testAPIConnection = testAPIConnection;
// saveAPIKey 함수는 제거됨 - 폼 submit 이벤트로 대체됨
window.clearAPIKey = clearAPIKey;
window.toggleAPIKeyVisibility = toggleAPIKeyVisibility;