// Utility Functions Module
// 공통으로 사용되는 유틸리티 함수들

/**
 * 알림 표시 함수
 * @param {string} message - 표시할 메시지
 * @param {string} type - 알림 타입 ('success', 'error', 'info', 'warning')
 * @param {number} duration - 표시 시간 (밀리초, 기본값 3000)
 */
export function showNotification(message, type = 'success', duration = 3000) {
    console.log(`[${type.toUpperCase()}] ${message}`);

    // 기존 알림이 있으면 제거
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // 새 알림 생성
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        background: ${getNotificationColor(type)};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-size: 14px;
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    // 자동 제거
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

/**
 * 알림 타입별 색상 반환
 * @param {string} type - 알림 타입
 * @returns {string} - CSS 색상 값
 */
function getNotificationColor(type) {
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6',
        warning: '#f59e0b'
    };
    return colors[type] || colors.info;
}

/**
 * Textarea 높이 자동 조정
 * @param {HTMLTextAreaElement} textarea - 조정할 textarea 엘리먼트
 * @param {number} minHeight - 최소 높이 (기본값 100px)
 * @param {number} maxHeight - 최대 높이 (기본값 650px)
 */
export function autoResizeTextarea(textarea, minHeight = 100, maxHeight = 650) {
    if (!textarea) return;

    // 높이를 초기화하여 스크롤 높이를 정확하게 측정
    textarea.style.height = 'auto';

    // 내용에 맞춰 높이 조정
    const scrollHeight = textarea.scrollHeight;
    const newHeight = Math.max(minHeight, Math.min(scrollHeight, maxHeight));
    textarea.style.height = newHeight + 'px';
}

/**
 * 클립보드에 텍스트 복사
 * @param {string} text - 복사할 텍스트
 * @param {string} successMessage - 성공 메시지
 * @returns {Promise<boolean>} - 복사 성공 여부
 */
export async function copyToClipboard(text, successMessage = '클립보드에 복사되었습니다.') {
    if (!text) {
        showNotification('복사할 내용이 없습니다.', 'warning');
        return false;
    }

    try {
        await navigator.clipboard.writeText(text);
        showNotification(successMessage, 'success');
        return true;
    } catch (err) {
        console.error('클립보드 복사 실패:', err);
        showNotification('복사에 실패했습니다.', 'error');
        return false;
    }
}

/**
 * 프롬프트 복사 (활성화된 탭의 프롬프트)
 */
export function copyPrompt() {
    const activeTextarea = document.querySelector('.tab-pane.active .final-prompt-textarea');
    if (activeTextarea && activeTextarea.value) {
        copyToClipboard(activeTextarea.value, '프롬프트가 클립보드에 복사되었습니다.');
    } else {
        showNotification('복사할 프롬프트가 없습니다.', 'warning');
    }
}

/**
 * 최종 프롬프트 복사
 */
export function copyFinalPrompt() {
    const finalPromptTextarea = document.getElementById('globalFinalPrompt');
    if (finalPromptTextarea && finalPromptTextarea.value) {
        copyToClipboard(finalPromptTextarea.value, '최종 프롬프트가 클립보드에 복사되었습니다.').then(success => {
            if (success) {
                // 복사 버튼 애니메이션
                const copyBtn = document.querySelector('.global-final-prompt-section .copy-prompt-btn');
                if (copyBtn) {
                    copyBtn.classList.add('copied');
                    setTimeout(() => copyBtn.classList.remove('copied'), 2000);
                }
            }
        });
    } else {
        showNotification('복사할 프롬프트가 없습니다.', 'warning');
    }
}

/**
 * 로컬 스토리지에서 데이터 가져오기
 * @param {string} key - 스토리지 키
 * @param {*} defaultValue - 기본값
 * @returns {*} - 저장된 값 또는 기본값
 */
export function getFromStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (err) {
        console.error(`Storage get error for key "${key}":`, err);
        return defaultValue;
    }
}

/**
 * 로컬 스토리지에 데이터 저장
 * @param {string} key - 스토리지 키
 * @param {*} value - 저장할 값
 * @returns {boolean} - 저장 성공 여부
 */
export function saveToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (err) {
        console.error(`Storage save error for key "${key}":`, err);
        return false;
    }
}

/**
 * 세션 스토리지에서 데이터 가져오기
 * @param {string} key - 스토리지 키
 * @param {*} defaultValue - 기본값
 * @returns {*} - 저장된 값 또는 기본값
 */
export function getFromSessionStorage(key, defaultValue = null) {
    try {
        const item = sessionStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (err) {
        console.error(`Session storage get error for key "${key}":`, err);
        return defaultValue;
    }
}

/**
 * 세션 스토리지에 데이터 저장
 * @param {string} key - 스토리지 키
 * @param {*} value - 저장할 값
 * @returns {boolean} - 저장 성공 여부
 */
export function saveToSessionStorage(key, value) {
    try {
        sessionStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (err) {
        console.error(`Session storage save error for key "${key}":`, err);
        return false;
    }
}

/**
 * 디바운스 함수
 * @param {Function} func - 실행할 함수
 * @param {number} delay - 지연 시간 (밀리초)
 * @returns {Function} - 디바운스된 함수
 */
export function debounce(func, delay = 300) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * 쓰로틀 함수
 * @param {Function} func - 실행할 함수
 * @param {number} limit - 제한 시간 (밀리초)
 * @returns {Function} - 쓰로틀된 함수
 */
export function throttle(func, limit = 300) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * 딥 클론 함수
 * @param {*} obj - 복사할 객체
 * @returns {*} - 복사된 객체
 */
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (obj instanceof Object) {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
}

/**
 * UUID 생성 함수
 * @returns {string} - UUID 문자열
 */
export function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * 날짜 포맷 함수
 * @param {Date|string|number} date - 포맷할 날짜
 * @param {string} format - 포맷 문자열 (YYYY-MM-DD, YYYY.MM.DD HH:mm:ss 등)
 * @returns {string} - 포맷된 날짜 문자열
 */
export function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
}
