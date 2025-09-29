/**
 * Gemini Button
 * Google Gemini 링크를 새 창/탭으로 여는 플로팅 버튼
 */

class GeminiButton {
    constructor() {
        this.floatingBtn = null;
        this.geminiUrl = 'https://gemini.google.com/gem/1tWO58mOJuoVdeKxEOCNYWHHUvUeAEXla?usp=sharing';

        this.init();
    }

    init() {
        this.createFloatingButton();
        this.attachEventListeners();
    }

    createFloatingButton() {
        // 플로팅 버튼 생성
        const btnHTML = `
            <button class="gemini-floating-btn" id="gemini-floating-btn" aria-label="Gemini AI 열기" title="Google Gemini AI로 대화하기">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
        `;

        const btnContainer = document.createElement('div');
        btnContainer.innerHTML = btnHTML;
        this.floatingBtn = btnContainer.firstElementChild;
        document.body.appendChild(this.floatingBtn);
    }

    attachEventListeners() {
        // 플로팅 버튼 클릭 - 새 탭으로 열기
        this.floatingBtn.addEventListener('click', () => {
            // 새 탭으로 열기
            window.open(this.geminiUrl, '_blank');

            // 팝업 창으로 열고 싶다면 아래 코드 사용:
            // window.open(this.geminiUrl, 'gemini-window', 'width=1200,height=800,menubar=no,toolbar=no,location=yes,status=yes,scrollbars=yes,resizable=yes');
        });
    }
}

// DOM 로드 완료 시 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.geminiButton = new GeminiButton();
    });
} else {
    // 이미 로드된 경우
    window.geminiButton = new GeminiButton();
}