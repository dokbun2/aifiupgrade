/**
 * Gemini Iframe Modal
 * Google Gemini 공유 링크를 iframe으로 띄우는 모달
 */

class GeminiIframeModal {
    constructor() {
        this.isOpen = false;
        this.modal = null;
        this.floatingBtn = null;
        this.geminiUrl = 'https://gemini.google.com/gem/1tWO58mOJuoVdeKxEOCNYWHHUvUeAEXla?usp=sharing';

        this.init();
    }

    init() {
        this.createFloatingButton();
        this.createModal();
        this.attachEventListeners();
    }

    createFloatingButton() {
        // 플로팅 버튼 생성
        const btnHTML = `
            <button class="gemini-floating-btn" id="gemini-floating-btn" aria-label="Gemini AI 열기">
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

    createModal() {
        // 모달 생성
        const modalHTML = `
            <div id="gemini-iframe-modal" class="gemini-iframe-modal" style="display: none;">
                <div class="gemini-iframe-overlay"></div>
                <div class="gemini-iframe-container">
                    <div class="gemini-iframe-header">
                        <div class="gemini-iframe-title">
                            <svg class="gemini-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <span>Google Gemini AI</span>
                        </div>
                        <button class="gemini-iframe-close" id="gemini-iframe-close">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </button>
                    </div>
                    <div class="gemini-iframe-body">
                        <iframe
                            id="gemini-iframe"
                            src=""
                            frameborder="0"
                            allow="clipboard-write; clipboard-read"
                            allowfullscreen>
                        </iframe>
                    </div>
                </div>
            </div>
        `;

        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        this.modal = modalContainer.firstElementChild;
        document.body.appendChild(this.modal);
    }

    attachEventListeners() {
        // 플로팅 버튼 클릭
        this.floatingBtn.addEventListener('click', () => this.open());

        // 닫기 버튼
        const closeBtn = document.getElementById('gemini-iframe-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // 오버레이 클릭으로 닫기
        const overlay = this.modal.querySelector('.gemini-iframe-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => this.close());
        }

        // ESC 키로 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    open() {
        // iframe 대신 새 창으로 열기
        window.open(this.geminiUrl, '_blank', 'width=1200,height=800,menubar=no,toolbar=no,location=no,status=no');

        // 또는 새 탭으로 열기 원한다면:
        // window.open(this.geminiUrl, '_blank');
    }

    close() {
        if (this.modal) {
            this.modal.classList.remove('open');

            setTimeout(() => {
                this.modal.style.display = 'none';
                this.isOpen = false;

                // body 스크롤 복원
                document.body.style.overflow = '';
            }, 300);
        }
    }
}

// DOM 로드 완료 시 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.geminiIframe = new GeminiIframeModal();
    });
} else {
    // 이미 로드된 경우
    window.geminiIframe = new GeminiIframeModal();
}