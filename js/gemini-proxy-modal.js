/**
 * Gemini Proxy Modal
 * 프록시 서버를 통해 Google Gemini를 iframe으로 표시
 */

class GeminiProxyModal {
    constructor() {
        this.isOpen = false;
        this.modal = null;
        this.floatingBtn = null;

        // 프록시 서버 URL들 (여러 방법 시도)
        this.proxyUrls = [
            'http://localhost:3001/gemini-embed',
            'http://localhost:3001/gemini-proxy/gem/1tWO58mOJuoVdeKxEOCNYWHHUvUeAEXla?usp=sharing',
            'http://localhost:3001/gemini-iframe/gem/1tWO58mOJuoVdeKxEOCNYWHHUvUeAEXla?usp=sharing'
        ];

        this.currentProxyIndex = 0;
        this.directUrl = 'https://gemini.google.com/gem/1tWO58mOJuoVdeKxEOCNYWHHUvUeAEXla?usp=sharing';

        this.init();
    }

    init() {
        this.createFloatingButton();
        this.createModal();
        this.attachEventListeners();
    }

    createFloatingButton() {
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

    createModal() {
        const modalHTML = `
            <div id="gemini-proxy-modal" class="gemini-proxy-modal" style="display: none;">
                <div class="gemini-proxy-overlay"></div>
                <div class="gemini-proxy-container">
                    <div class="gemini-proxy-header">
                        <div class="gemini-proxy-title">
                            <svg class="gemini-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <span>Google Gemini AI</span>
                        </div>
                        <div class="gemini-proxy-controls">
                            <button class="proxy-retry-btn" id="proxy-retry-btn" title="다른 방법 시도">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>
                            <button class="proxy-external-btn" id="proxy-external-btn" title="새 탭에서 열기">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>
                            <button class="gemini-proxy-close" id="gemini-proxy-close">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div class="proxy-status" id="proxy-status">
                        <span class="status-text">연결 시도중...</span>
                    </div>

                    <div class="gemini-proxy-body">
                        <iframe
                            id="gemini-proxy-iframe"
                            src=""
                            frameborder="0"
                            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-downloads"
                            allow="clipboard-write; clipboard-read; microphone; camera"
                            allowfullscreen>
                        </iframe>

                        <div class="proxy-fallback" id="proxy-fallback" style="display: none;">
                            <div class="fallback-content">
                                <svg class="fallback-icon" width="48" height="48" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                    <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                                <h3>iframe 로드 실패</h3>
                                <p>보안 정책으로 인해 직접 임베드가 차단되었습니다.</p>
                                <div class="fallback-actions">
                                    <button onclick="geminiProxyModal.tryNextProxy()">다른 방법 시도</button>
                                    <button onclick="geminiProxyModal.openExternal()">새 탭에서 열기</button>
                                </div>
                            </div>
                        </div>
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
        const closeBtn = document.getElementById('gemini-proxy-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // 재시도 버튼
        const retryBtn = document.getElementById('proxy-retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.tryNextProxy());
        }

        // 외부 열기 버튼
        const externalBtn = document.getElementById('proxy-external-btn');
        if (externalBtn) {
            externalBtn.addEventListener('click', () => this.openExternal());
        }

        // 오버레이 클릭으로 닫기
        const overlay = this.modal.querySelector('.gemini-proxy-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => this.close());
        }

        // ESC 키로 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // iframe 로드 이벤트
        const iframe = document.getElementById('gemini-proxy-iframe');
        if (iframe) {
            iframe.addEventListener('load', () => this.onIframeLoad());
            iframe.addEventListener('error', () => this.onIframeError());
        }
    }

    open() {
        if (this.modal) {
            this.modal.style.display = 'block';
            this.isOpen = true;

            // 첫 번째 프록시 URL 시도
            this.loadProxy(0);

            // body 스크롤 방지
            document.body.style.overflow = 'hidden';

            // 애니메이션
            setTimeout(() => {
                this.modal.classList.add('open');
            }, 10);
        }
    }

    loadProxy(index) {
        const iframe = document.getElementById('gemini-proxy-iframe');
        const status = document.getElementById('proxy-status');
        const fallback = document.getElementById('proxy-fallback');

        if (index < this.proxyUrls.length) {
            this.currentProxyIndex = index;
            const url = this.proxyUrls[index];

            console.log(`Trying proxy method ${index + 1}: ${url}`);

            if (status) {
                status.style.display = 'block';
                status.querySelector('.status-text').textContent = `연결 시도중... (방법 ${index + 1}/${this.proxyUrls.length})`;
            }

            if (fallback) {
                fallback.style.display = 'none';
            }

            if (iframe) {
                iframe.style.display = 'block';
                iframe.src = url;
            }

            // 5초 후 타임아웃
            setTimeout(() => {
                if (this.currentProxyIndex === index && iframe.src === url) {
                    console.log(`Proxy method ${index + 1} timeout`);
                    this.tryNextProxy();
                }
            }, 5000);

        } else {
            // 모든 방법 실패
            this.showFallback();
        }
    }

    tryNextProxy() {
        const nextIndex = this.currentProxyIndex + 1;
        if (nextIndex < this.proxyUrls.length) {
            this.loadProxy(nextIndex);
        } else {
            this.showFallback();
        }
    }

    onIframeLoad() {
        const iframe = document.getElementById('gemini-proxy-iframe');
        const status = document.getElementById('proxy-status');

        try {
            // iframe 콘텐츠에 접근 가능한지 확인
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            if (iframeDoc) {
                console.log('iframe loaded successfully');
                if (status) {
                    status.style.display = 'none';
                }
            }
        } catch (e) {
            console.log('iframe loaded but cross-origin access blocked');
            // 크로스 오리진이지만 로드는 성공
            if (status) {
                status.querySelector('.status-text').textContent = '연결됨 (제한된 접근)';
                setTimeout(() => {
                    status.style.display = 'none';
                }, 2000);
            }
        }
    }

    onIframeError() {
        console.log('iframe load error');
        this.tryNextProxy();
    }

    showFallback() {
        const iframe = document.getElementById('gemini-proxy-iframe');
        const status = document.getElementById('proxy-status');
        const fallback = document.getElementById('proxy-fallback');

        if (iframe) iframe.style.display = 'none';
        if (status) status.style.display = 'none';
        if (fallback) fallback.style.display = 'flex';
    }

    openExternal() {
        window.open(this.directUrl, '_blank');
        this.close();
    }

    close() {
        if (this.modal) {
            this.modal.classList.remove('open');

            setTimeout(() => {
                this.modal.style.display = 'none';
                this.isOpen = false;

                // iframe src 초기화
                const iframe = document.getElementById('gemini-proxy-iframe');
                if (iframe) {
                    iframe.src = '';
                }

                // body 스크롤 복원
                document.body.style.overflow = '';
            }, 300);
        }
    }
}

// 전역 인스턴스 생성
let geminiProxyModal = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        geminiProxyModal = new GeminiProxyModal();
        window.geminiProxyModal = geminiProxyModal;
    });
} else {
    geminiProxyModal = new GeminiProxyModal();
    window.geminiProxyModal = geminiProxyModal;
}