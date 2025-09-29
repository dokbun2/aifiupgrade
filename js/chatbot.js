// AI Chatbot Module
class AIChatbot {
    constructor() {
        this.container = null;
        this.floatingBtn = null;
        this.messages = [];
        this.isOpen = false;
        this.isTyping = false;
        this.geminiAPI = null;
        this.conversationHistory = [];

        this.init();
    }

    init() {
        // Create chatbot elements
        this.createFloatingButton();
        this.createChatContainer();

        // Load saved messages
        this.loadMessages();

        // Check API availability
        this.checkAPIStatus();

        // Add to all pages
        this.injectToPage();
    }

    createFloatingButton() {
        const btnHTML = `
            <button class="chatbot-floating-btn" id="chatbot-floating-btn">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v13c0 1.1.9 2 2 2h4l3 3 3-3h6c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 13h-2v-2h2v2zm0-4h-2V7h2v4z"/>
                </svg>
                <span class="chatbot-notification-badge" style="display: none;">1</span>
            </button>
        `;

        const btnContainer = document.createElement('div');
        btnContainer.innerHTML = btnHTML;
        this.floatingBtn = btnContainer.firstElementChild;

        // Add click event
        this.floatingBtn.addEventListener('click', () => this.toggleChat());
    }

    createChatContainer() {
        const containerHTML = `
            <div class="chatbot-container" id="chatbot-container">
                <!-- Header -->
                <div class="chatbot-header">
                    <div class="chatbot-header-title">
                        <svg viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                        </svg>
                        <h3>AI Assistant</h3>
                    </div>
                    <div class="chatbot-header-actions">
                        <button class="chatbot-header-btn" id="chatbot-export-btn" title="대화 내보내기">
                            <svg viewBox="0 0 24 24">
                                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                            </svg>
                        </button>
                        <button class="chatbot-header-btn" id="chatbot-clear-btn" title="새 대화">
                            <svg viewBox="0 0 24 24">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                        <button class="chatbot-header-btn" id="chatbot-minimize-btn" title="최소화">
                            <svg viewBox="0 0 24 24">
                                <path d="M19 13H5v-2h14v2z"/>
                            </svg>
                        </button>
                        <button class="chatbot-header-btn" id="chatbot-close-btn" title="닫기">
                            <svg viewBox="0 0 24 24">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Messages -->
                <div class="chatbot-messages" id="chatbot-messages">
                    <div class="chatbot-welcome">
                        <h4>안녕하세요! AI Assistant입니다 👋</h4>
                        <p>창의적인 아이디어나 프로젝트에 대해 도움이 필요하시면 언제든지 물어보세요!</p>
                        <div class="chatbot-suggestions">
                            <button class="chatbot-suggestion-chip" data-suggestion="컨셉 아트 아이디어 추천해줘">컨셉 아트 아이디어</button>
                            <button class="chatbot-suggestion-chip" data-suggestion="스토리보드 작성 팁 알려줘">스토리보드 팁</button>
                            <button class="chatbot-suggestion-chip" data-suggestion="영상 제작 프로세스 설명해줘">제작 프로세스</button>
                        </div>
                    </div>
                </div>

                <!-- Typing Indicator -->
                <div class="chatbot-typing" id="chatbot-typing" style="display: none;">
                    <div class="chatbot-message-avatar">
                        <svg viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                        </svg>
                    </div>
                    <div class="chatbot-typing-indicator">
                        <span class="chatbot-typing-dot"></span>
                        <span class="chatbot-typing-dot"></span>
                        <span class="chatbot-typing-dot"></span>
                    </div>
                </div>

                <!-- Input -->
                <div class="chatbot-input-container">
                    <div class="chatbot-input-wrapper">
                        <textarea
                            class="chatbot-input-field"
                            id="chatbot-input"
                            placeholder="메시지를 입력하세요..."
                            rows="1"
                        ></textarea>
                        <button class="chatbot-send-btn" id="chatbot-send-btn">
                            <svg viewBox="0 0 24 24">
                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;

        const container = document.createElement('div');
        container.innerHTML = containerHTML;
        this.container = container.firstElementChild;

        // Add event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Close button
        const closeBtn = this.container.querySelector('#chatbot-close-btn');
        closeBtn.addEventListener('click', () => this.toggleChat());

        // Minimize button
        const minimizeBtn = this.container.querySelector('#chatbot-minimize-btn');
        minimizeBtn.addEventListener('click', () => this.toggleChat());

        // Clear button
        const clearBtn = this.container.querySelector('#chatbot-clear-btn');
        clearBtn.addEventListener('click', () => this.clearChat());

        // Send button
        const sendBtn = this.container.querySelector('#chatbot-send-btn');
        sendBtn.addEventListener('click', () => this.sendMessage());

        // Input field
        const inputField = this.container.querySelector('#chatbot-input');
        inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize textarea
        inputField.addEventListener('input', () => {
            inputField.style.height = 'auto';
            inputField.style.height = Math.min(inputField.scrollHeight, 120) + 'px';
        });

        // Suggestion chips
        this.container.addEventListener('click', (e) => {
            if (e.target.classList.contains('chatbot-suggestion-chip')) {
                const suggestion = e.target.dataset.suggestion;
                this.container.querySelector('#chatbot-input').value = suggestion;
                this.sendMessage();
            }
        });
    }

    injectToPage() {
        // Add elements to page
        document.body.appendChild(this.floatingBtn);
        document.body.appendChild(this.container);
    }

    toggleChat() {
        this.isOpen = !this.isOpen;

        if (this.isOpen) {
            this.container.classList.add('active');
            this.floatingBtn.classList.add('active');

            // Focus input
            setTimeout(() => {
                this.container.querySelector('#chatbot-input').focus();
            }, 300);

            // Hide notification badge
            const badge = this.floatingBtn.querySelector('.chatbot-notification-badge');
            if (badge) {
                badge.style.display = 'none';
            }
        } else {
            this.container.classList.remove('active');
            this.floatingBtn.classList.remove('active');
        }
    }

    async sendMessage() {
        const inputField = this.container.querySelector('#chatbot-input');
        const message = inputField.value.trim();

        if (!message || this.isTyping) return;

        // Clear input
        inputField.value = '';
        inputField.style.height = 'auto';

        // Add user message
        this.addMessage(message, 'user');

        // Hide welcome message
        const welcome = this.container.querySelector('.chatbot-welcome');
        if (welcome) {
            welcome.style.display = 'none';
        }

        // Show typing indicator
        this.showTyping();

        try {
            // Get AI response
            const response = await this.getAIResponse(message);

            // Hide typing indicator
            this.hideTyping();

            // Add AI message
            this.addMessage(response, 'assistant');

        } catch (error) {
            console.error('Error getting AI response:', error);
            this.hideTyping();
            this.addMessage('죄송합니다. 응답을 생성하는 중 오류가 발생했습니다. 다시 시도해주세요.', 'assistant');
        }

        // Save messages
        this.saveMessages();
    }

    async getAIResponse(message) {
        // Check if Gemini API is available
        if (window.geminiAPI && window.geminiAPI.isInitialized()) {
            try {
                // Build conversation context with system prompt
                const systemPrompt = `당신은 창의적인 프로젝트, 컨셉 아트, 스토리보드 제작을 돕는 AI 어시스턴트입니다.
                사용자의 창의적인 비전을 이해하고 구체적이고 실용적인 조언을 제공해주세요.
                항상 친절하고 전문적인 톤을 유지하며, 한국어로 응답해주세요.

                현재 사용자는 AIFI FRAMEWORK를 사용하여 영상 제작 프로젝트를 진행하고 있습니다.
                다음 기능들에 대한 도움을 제공할 수 있습니다:
                - 스토리보드 작성 및 구성
                - 컨셉 아트 아이디어 및 프롬프트 제안
                - 영상 제작 워크플로우
                - 창의적인 비주얼 컨셉 개발`;

                const context = this.buildContext();
                const prompt = `${systemPrompt}\n\n${context}\n\nUser: ${message}\n\nAssistant:`;

                // Call Gemini API with improved parameters
                const response = await window.geminiAPI.generateText(prompt, {
                    temperature: 0.8,
                    maxLength: 1000,
                    topP: 0.9
                });

                // Update conversation history
                this.conversationHistory.push({
                    role: 'user',
                    content: message
                });
                this.conversationHistory.push({
                    role: 'assistant',
                    content: response
                });

                // Keep only last 10 exchanges
                if (this.conversationHistory.length > 20) {
                    this.conversationHistory = this.conversationHistory.slice(-20);
                }

                return response;
            } catch (error) {
                console.error('Gemini API error:', error);
                return this.getFallbackResponse(message);
            }
        } else {
            // Use fallback responses if API is not available
            return this.getFallbackResponse(message);
        }
    }

    buildContext() {
        let context = `You are an AI assistant helping with creative projects, concept art, and storyboarding.
        Please provide helpful, creative, and detailed responses in Korean.

        Previous conversation:`;

        this.conversationHistory.forEach(msg => {
            context += `\n${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`;
        });

        return context;
    }

    getFallbackResponse(message) {
        // Simple fallback responses for when API is not available
        const responses = {
            '컨셉 아트': '컨셉 아트는 시각적 스토리텔링의 핵심입니다. 캐릭터, 환경, 소품 등을 디자인할 때는 스토리와 분위기를 고려하는 것이 중요합니다.',
            '스토리보드': '스토리보드는 영상의 청사진입니다. 각 장면의 구도, 카메라 앵글, 캐릭터 동작을 명확히 표현하세요.',
            '영상 제작': '영상 제작은 기획, 제작, 후반 작업의 3단계로 진행됩니다. 각 단계별로 체계적인 계획이 필요합니다.',
            'default': '질문해 주셔서 감사합니다. 더 자세한 정보를 위해서는 API 설정이 필요합니다. 상단의 API 설정 버튼을 클릭해주세요.'
        };

        for (const [key, response] of Object.entries(responses)) {
            if (message.toLowerCase().includes(key)) {
                return response;
            }
        }

        return responses.default;
    }

    addMessage(content, sender) {
        const messagesContainer = this.container.querySelector('#chatbot-messages');
        const messageHTML = `
            <div class="chatbot-message ${sender}">
                <div class="chatbot-message-avatar">
                    <svg viewBox="0 0 24 24">
                        ${sender === 'user' ?
                            '<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>' :
                            '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>'
                        }
                    </svg>
                </div>
                <div>
                    <div class="chatbot-message-content">${this.formatMessage(content)}</div>
                    <div class="chatbot-message-time">${this.getCurrentTime()}</div>
                </div>
            </div>
        `;

        messagesContainer.insertAdjacentHTML('beforeend', messageHTML);

        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Add to messages array
        this.messages.push({
            content,
            sender,
            timestamp: new Date().toISOString()
        });
    }

    formatMessage(content) {
        // Basic markdown support
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
            .replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>')
            .replace(/`(.*?)`/g, '<code>$1</code>');
    }

    getCurrentTime() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    showTyping() {
        this.isTyping = true;
        const typingIndicator = this.container.querySelector('#chatbot-typing');
        typingIndicator.style.display = 'flex';

        // Scroll to bottom
        const messagesContainer = this.container.querySelector('#chatbot-messages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideTyping() {
        this.isTyping = false;
        const typingIndicator = this.container.querySelector('#chatbot-typing');
        typingIndicator.style.display = 'none';
    }

    clearChat() {
        if (confirm('대화 내용을 모두 삭제하시겠습니까?')) {
            const messagesContainer = this.container.querySelector('#chatbot-messages');
            messagesContainer.innerHTML = `
                <div class="chatbot-welcome">
                    <h4>안녕하세요! AI Assistant입니다 👋</h4>
                    <p>창의적인 아이디어나 프로젝트에 대해 도움이 필요하시면 언제든지 물어보세요!</p>
                    <div class="chatbot-suggestions">
                        <button class="chatbot-suggestion-chip" data-suggestion="컨셉 아트 아이디어 추천해줘">컨셉 아트 아이디어</button>
                        <button class="chatbot-suggestion-chip" data-suggestion="스토리보드 작성 팁 알려줘">스토리보드 팁</button>
                        <button class="chatbot-suggestion-chip" data-suggestion="영상 제작 프로세스 설명해줘">제작 프로세스</button>
                    </div>
                </div>
            `;

            this.messages = [];
            this.conversationHistory = [];
            this.saveMessages();
        }
    }

    saveMessages() {
        localStorage.setItem('chatbot_messages', JSON.stringify(this.messages));
        localStorage.setItem('chatbot_history', JSON.stringify(this.conversationHistory));
    }

    loadMessages() {
        const savedMessages = localStorage.getItem('chatbot_messages');
        const savedHistory = localStorage.getItem('chatbot_history');

        if (savedMessages) {
            try {
                this.messages = JSON.parse(savedMessages);

                // Restore messages to UI
                if (this.messages.length > 0) {
                    const messagesContainer = this.container.querySelector('#chatbot-messages');
                    const welcome = messagesContainer.querySelector('.chatbot-welcome');
                    if (welcome) {
                        welcome.style.display = 'none';
                    }

                    this.messages.forEach(msg => {
                        this.addMessage(msg.content, msg.sender);
                    });
                }
            } catch (error) {
                console.error('Error loading messages:', error);
            }
        }

        if (savedHistory) {
            try {
                this.conversationHistory = JSON.parse(savedHistory);
            } catch (error) {
                console.error('Error loading conversation history:', error);
            }
        }
    }

    checkAPIStatus() {
        // Check if Gemini API is initialized
        if (window.geminiAPI && window.geminiAPI.isInitialized()) {
            console.log('Chatbot: Gemini API is available');
            this.geminiAPI = window.geminiAPI;
        } else {
            console.log('Chatbot: Gemini API not available, using fallback responses');
        }
    }

    showNotification(count = 1) {
        const badge = this.floatingBtn.querySelector('.chatbot-notification-badge');
        if (badge && !this.isOpen) {
            badge.textContent = count;
            badge.style.display = 'flex';
        }
    }
}

// Initialize chatbot when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.aiChatbot = new AIChatbot();
    });
} else {
    window.aiChatbot = new AIChatbot();
}

// Export for use in other modules
window.AIChatbot = AIChatbot;