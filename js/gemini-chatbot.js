/**
 * Gemini Chatbot Modal
 * 브라우저 스타일의 대형 모달창에서 Google Gemini와 대화
 */

class GeminiChatbotModal {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.conversationHistory = [];
        this.isTyping = false;
        this.modal = null;
        this.messageContainer = null;
        this.inputField = null;
        this.sendButton = null;

        this.init();
    }

    init() {
        // 모달이 이미 존재하는지 확인
        if (document.getElementById('gemini-chatbot-modal')) {
            this.modal = document.getElementById('gemini-chatbot-modal');
            this.attachExistingElements();
        } else {
            this.createModal();
        }

        this.loadConversationHistory();
        this.attachEventListeners();
        this.checkAPIConnection();
    }

    createModal() {
        const modalHTML = `
            <div id="gemini-chatbot-modal" class="gemini-modal" style="display: none;">
                <div class="gemini-modal-overlay"></div>
                <div class="gemini-modal-container">
                    <div class="gemini-modal-header">
                        <div class="gemini-modal-title">
                            <svg class="gemini-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <span>Google Gemini AI Assistant</span>
                        </div>
                        <button class="gemini-modal-close" id="gemini-modal-close">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </button>
                    </div>

                    <div class="gemini-modal-status" id="gemini-api-status">
                        <div class="status-indicator">
                            <span class="status-dot"></span>
                            <span class="status-text">연결 확인중...</span>
                        </div>
                    </div>

                    <div class="gemini-modal-messages" id="gemini-messages">
                        <div class="gemini-welcome-message">
                            <div class="welcome-icon">🤖</div>
                            <h3>안녕하세요! Gemini AI입니다</h3>
                            <p>무엇을 도와드릴까요? 궁금한 점을 자유롭게 물어보세요.</p>
                        </div>
                    </div>

                    <div class="gemini-typing-indicator" id="gemini-typing" style="display: none;">
                        <div class="typing-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                        <span class="typing-text">Gemini가 답변을 작성중입니다...</span>
                    </div>

                    <div class="gemini-modal-input">
                        <textarea
                            id="gemini-input"
                            class="gemini-input-field"
                            placeholder="메시지를 입력하세요... (Shift+Enter로 줄바꿈)"
                            rows="1"></textarea>
                        <button id="gemini-send" class="gemini-send-button" disabled>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // 모달을 body에 추가
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer.firstElementChild);

        this.modal = document.getElementById('gemini-chatbot-modal');
        this.attachExistingElements();
    }

    attachExistingElements() {
        this.messageContainer = document.getElementById('gemini-messages');
        this.inputField = document.getElementById('gemini-input');
        this.sendButton = document.getElementById('gemini-send');
        this.typingIndicator = document.getElementById('gemini-typing');
        this.statusElement = document.getElementById('gemini-api-status');
    }

    attachEventListeners() {
        // 닫기 버튼
        const closeBtn = document.getElementById('gemini-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // 오버레이 클릭으로 닫기
        const overlay = this.modal.querySelector('.gemini-modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => this.close());
        }

        // ESC 키로 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // 입력 필드 이벤트
        if (this.inputField) {
            this.inputField.addEventListener('input', () => this.handleInputChange());
            this.inputField.addEventListener('keydown', (e) => this.handleKeyPress(e));
        }

        // 전송 버튼
        if (this.sendButton) {
            this.sendButton.addEventListener('click', () => this.sendMessage());
        }

        // 플로팅 챗봇 버튼과 연결
        this.connectFloatingButton();
    }

    connectFloatingButton() {
        // 기존 플로팅 버튼 찾기
        const floatingBtn = document.getElementById('chatbot-floating-btn');
        if (floatingBtn) {
            // 기존 이벤트 리스너 제거하고 새로 추가
            const newBtn = floatingBtn.cloneNode(true);
            floatingBtn.parentNode.replaceChild(newBtn, floatingBtn);

            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.open();
            });
        }
    }

    handleInputChange() {
        // Auto-resize textarea
        this.inputField.style.height = 'auto';
        this.inputField.style.height = Math.min(this.inputField.scrollHeight, 120) + 'px';

        // Enable/disable send button
        const hasContent = this.inputField.value.trim().length > 0;
        this.sendButton.disabled = !hasContent || !this.isAPIConnected();
    }

    handleKeyPress(e) {
        // Enter로 전송 (Shift+Enter는 줄바꿈)
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!this.sendButton.disabled) {
                this.sendMessage();
            }
        }
    }

    async sendMessage() {
        const message = this.inputField.value.trim();
        if (!message || !this.isAPIConnected()) return;

        // 사용자 메시지 추가
        this.addMessage('user', message);

        // 입력 필드 초기화
        this.inputField.value = '';
        this.inputField.style.height = 'auto';
        this.sendButton.disabled = true;

        // 타이핑 표시
        this.showTypingIndicator(true);

        try {
            // Gemini API 호출
            const response = await this.getGeminiResponse(message);

            // AI 응답 추가
            this.addMessage('assistant', response);

            // 대화 기록 저장
            this.saveConversationHistory();
        } catch (error) {
            console.error('Error getting Gemini response:', error);
            this.addMessage('error', '죄송합니다. 응답을 생성하는 중 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            this.showTypingIndicator(false);
        }
    }

    async getGeminiResponse(message) {
        if (!window.geminiAPI) {
            throw new Error('Gemini API가 초기화되지 않았습니다');
        }

        // 대화 컨텍스트 구성
        const context = this.buildConversationContext();
        const fullPrompt = context + '\n\nUser: ' + message + '\n\nAssistant:';

        try {
            const result = await window.geminiAPI.generateText(fullPrompt, {
                temperature: 0.7,
                maxOutputTokens: 1000,
                topP: 0.95,
                topK: 40
            });

            if (result && result.candidates && result.candidates[0]) {
                const response = result.candidates[0].content?.parts?.[0]?.text || '';
                if (response) {
                    return response.trim();
                }
            }

            throw new Error('응답을 받지 못했습니다');
        } catch (error) {
            console.error('Gemini API Error:', error);
            throw error;
        }
    }

    buildConversationContext() {
        // 최근 대화 내역으로 컨텍스트 구성 (최대 5턴)
        const recentMessages = this.messages.slice(-10);
        let context = "You are a helpful AI assistant powered by Google Gemini. Please respond in Korean.\n\n";

        if (recentMessages.length > 0) {
            context += "Previous conversation:\n";
            recentMessages.forEach(msg => {
                if (msg.role === 'user') {
                    context += `User: ${msg.content}\n`;
                } else if (msg.role === 'assistant') {
                    context += `Assistant: ${msg.content}\n`;
                }
            });
        }

        return context;
    }

    addMessage(role, content) {
        const message = {
            role: role,
            content: content,
            timestamp: new Date().toISOString()
        };

        this.messages.push(message);

        // 웰컴 메시지 제거
        const welcomeMsg = this.messageContainer.querySelector('.gemini-welcome-message');
        if (welcomeMsg) {
            welcomeMsg.remove();
        }

        // 메시지 요소 생성
        const messageElement = document.createElement('div');
        messageElement.className = `gemini-message gemini-message-${role}`;

        if (role === 'error') {
            messageElement.innerHTML = `
                <div class="message-content error-content">
                    <svg class="error-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                        <path d="M12 8v4m0 4h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    <span>${content}</span>
                </div>
            `;
        } else {
            const avatar = role === 'user' ? '👤' : '🤖';
            const label = role === 'user' ? '나' : 'Gemini';

            messageElement.innerHTML = `
                <div class="message-avatar">${avatar}</div>
                <div class="message-content">
                    <div class="message-label">${label}</div>
                    <div class="message-text">${this.formatMessage(content)}</div>
                    <div class="message-time">${this.formatTime(new Date())}</div>
                </div>
            `;
        }

        this.messageContainer.appendChild(messageElement);

        // 스크롤을 최하단으로
        this.scrollToBottom();
    }

    formatMessage(content) {
        // 기본적인 마크다운 처리
        return content
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>');
    }

    formatTime(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    showTypingIndicator(show) {
        if (this.typingIndicator) {
            this.typingIndicator.style.display = show ? 'flex' : 'none';
            if (show) {
                this.scrollToBottom();
            }
        }
    }

    scrollToBottom() {
        if (this.messageContainer) {
            setTimeout(() => {
                this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
            }, 100);
        }
    }

    checkAPIConnection() {
        const statusDot = this.statusElement?.querySelector('.status-dot');
        const statusText = this.statusElement?.querySelector('.status-text');

        if (this.isAPIConnected()) {
            if (statusDot) statusDot.className = 'status-dot connected';
            if (statusText) statusText.textContent = 'API 연결됨';
            this.sendButton.disabled = !this.inputField.value.trim();
        } else {
            if (statusDot) statusDot.className = 'status-dot disconnected';
            if (statusText) statusText.textContent = 'API 연결 필요';
            this.sendButton.disabled = true;

            // API 설정 안내 메시지
            if (this.messages.length === 0) {
                setTimeout(() => {
                    this.addMessage('error', 'Gemini API가 설정되지 않았습니다. 헤더의 "API 연동" 버튼을 클릭하여 API를 설정해주세요.');
                }, 1000);
            }
        }
    }

    isAPIConnected() {
        return window.geminiAPI &&
               window.geminiAPI.getStatus &&
               window.geminiAPI.getStatus().isConnected;
    }

    open() {
        if (this.modal) {
            this.modal.style.display = 'block';
            this.isOpen = true;

            // API 상태 재확인
            this.checkAPIConnection();

            // 입력 필드에 포커스
            setTimeout(() => {
                if (this.inputField) {
                    this.inputField.focus();
                }
                this.scrollToBottom();
            }, 100);

            // body 스크롤 방지
            document.body.style.overflow = 'hidden';
        }
    }

    close() {
        if (this.modal) {
            this.modal.style.display = 'none';
            this.isOpen = false;

            // body 스크롤 복원
            document.body.style.overflow = '';
        }
    }

    loadConversationHistory() {
        try {
            const saved = localStorage.getItem('gemini_chat_history');
            if (saved) {
                const data = JSON.parse(saved);
                this.messages = data.messages || [];

                // 저장된 메시지 표시
                if (this.messages.length > 0) {
                    // 웰컴 메시지 제거
                    const welcomeMsg = this.messageContainer.querySelector('.gemini-welcome-message');
                    if (welcomeMsg) {
                        welcomeMsg.remove();
                    }

                    // 메시지 재생성
                    this.messages.forEach(msg => {
                        if (msg.role !== 'error') {
                            this.addMessageWithoutSaving(msg.role, msg.content, msg.timestamp);
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error loading conversation history:', error);
        }
    }

    addMessageWithoutSaving(role, content, timestamp) {
        // 메시지 요소만 생성 (messages 배열에 추가하지 않음)
        const messageElement = document.createElement('div');
        messageElement.className = `gemini-message gemini-message-${role}`;

        const avatar = role === 'user' ? '👤' : '🤖';
        const label = role === 'user' ? '나' : 'Gemini';
        const time = new Date(timestamp);

        messageElement.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="message-label">${label}</div>
                <div class="message-text">${this.formatMessage(content)}</div>
                <div class="message-time">${this.formatTime(time)}</div>
            </div>
        `;

        this.messageContainer.appendChild(messageElement);
    }

    saveConversationHistory() {
        try {
            // error 메시지는 제외하고 저장
            const messagesToSave = this.messages.filter(m => m.role !== 'error');

            localStorage.setItem('gemini_chat_history', JSON.stringify({
                messages: messagesToSave,
                lastUpdated: new Date().toISOString()
            }));
        } catch (error) {
            console.error('Error saving conversation history:', error);
        }
    }

    clearHistory() {
        if (confirm('모든 대화 내역을 삭제하시겠습니까?')) {
            this.messages = [];
            localStorage.removeItem('gemini_chat_history');

            // 메시지 컨테이너 초기화
            this.messageContainer.innerHTML = `
                <div class="gemini-welcome-message">
                    <div class="welcome-icon">🤖</div>
                    <h3>안녕하세요! Gemini AI입니다</h3>
                    <p>무엇을 도와드릴까요? 궁금한 점을 자유롭게 물어보세요.</p>
                </div>
            `;
        }
    }
}

// 전역 인스턴스 생성
let geminiChatbot = null;

// DOM 로드 완료 시 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        geminiChatbot = new GeminiChatbotModal();
    });
} else {
    // 이미 로드된 경우
    geminiChatbot = new GeminiChatbotModal();
}

// 전역 함수로 노출 (다른 스크립트에서 접근 가능)
window.openGeminiChat = function() {
    if (geminiChatbot) {
        geminiChatbot.open();
    } else {
        geminiChatbot = new GeminiChatbotModal();
        geminiChatbot.open();
    }
};

window.closeGeminiChat = function() {
    if (geminiChatbot) {
        geminiChatbot.close();
    }
};

// API 상태 변경 감지
window.addEventListener('geminiAPIReady', () => {
    if (geminiChatbot) {
        geminiChatbot.checkAPIConnection();
    }
});