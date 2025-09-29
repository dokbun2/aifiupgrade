// AI Chatbot Module - Safe Version
class AIChatbot {
    constructor() {
        this.container = null;
        this.floatingBtn = null;
        this.messages = [];
        this.isOpen = false;
        this.isTyping = false;
        this.geminiAPI = null;
        this.conversationHistory = [];
        this.initialized = false;

        // Delay initialization to prevent blocking
        setTimeout(() => this.init(), 100);
    }

    init() {
        try {
            // Check if already initialized
            if (this.initialized) return;

            // Create chatbot elements FIRST
            this.createFloatingButton();
            this.createChatContainer();

            // Add to all pages BEFORE loading messages
            this.injectToPage();

            // Load saved messages AFTER elements are created
            this.loadMessages();

            // Check API availability
            this.checkAPIStatus();

            this.initialized = true;
        } catch (error) {
            console.error('[Chatbot] Initialization error:', error);
            // Don't throw - allow page to continue
        }
    }

    createFloatingButton() {
        try {
            const btnHTML = `
                <button class="chatbot-floating-btn" id="chatbot-floating-btn"
                        aria-label="AI 챗봇 열기"
                        role="button"
                        tabindex="0">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v13c0 1.1.9 2 2 2h4l3 3 3-3h6c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 13h-2v-2h2v2zm0-4h-2V7h2v4z"/>
                    </svg>
                    <span class="chatbot-notification-badge" style="display: none;" aria-live="polite">1</span>
                </button>
            `;

            const btnContainer = document.createElement('div');
            btnContainer.innerHTML = btnHTML;
            this.floatingBtn = btnContainer.firstElementChild;

            // Add click event with error handling
            this.floatingBtn.addEventListener('click', () => {
                try {
                    this.toggleChat();
                } catch (e) {
                    console.error('[Chatbot] Toggle error:', e);
                }
            });

            // Add keyboard support
            this.floatingBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    try {
                        this.toggleChat();
                    } catch (err) {
                        console.error('[Chatbot] Keyboard toggle error:', err);
                    }
                }
            });
        } catch (error) {
            console.error('[Chatbot] Error creating button:', error);
        }
    }

    createChatContainer() {
        try {
            const containerHTML = `
                <div class="chatbot-container" id="chatbot-container">
                    <!-- Header -->
                    <div class="chatbot-header">
                        <div class="chatbot-header-title">
                            <svg viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                            </svg>
                            <h3>AIFI BOT</h3>
                        </div>
                        <div class="chatbot-header-actions">
                            <button class="chatbot-header-btn" id="chatbot-clear-btn" title="새 대화">
                                <svg viewBox="0 0 24 24">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
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
                            <h4>안녕하세요! AIFI BOT입니다 👋</h4>
                            <p>창의적인 아이디어나 프로젝트에 대해 도움이 필요하시면 언제든지 물어보세요!</p>
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

            // Add event listeners with error handling
            this.setupEventListeners();
        } catch (error) {
            console.error('[Chatbot] Error creating container:', error);
        }
    }

    setupEventListeners() {
        try {
            // Close button
            const closeBtn = this.container?.querySelector('#chatbot-close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    try {
                        this.toggleChat();
                    } catch (e) {
                        console.error('[Chatbot] Close error:', e);
                    }
                });
            }

            // Clear button
            const clearBtn = this.container?.querySelector('#chatbot-clear-btn');
            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    try {
                        this.clearChat();
                    } catch (e) {
                        console.error('[Chatbot] Clear error:', e);
                    }
                });
            }

            // Send button
            const sendBtn = this.container?.querySelector('#chatbot-send-btn');
            if (sendBtn) {
                sendBtn.addEventListener('click', () => {
                    try {
                        this.sendMessage();
                    } catch (e) {
                        console.error('[Chatbot] Send error:', e);
                    }
                });
            }

            // Input field
            const inputField = this.container?.querySelector('#chatbot-input');
            if (inputField) {
                inputField.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        try {
                            this.sendMessage();
                        } catch (err) {
                            console.error('[Chatbot] Send error:', err);
                        }
                    }
                });
            }
        } catch (error) {
            console.error('[Chatbot] Error setting up event listeners:', error);
        }
    }

    injectToPage() {
        try {
            // Add elements to page only if they don't exist
            if (this.floatingBtn && !document.getElementById('chatbot-floating-btn')) {
                document.body.appendChild(this.floatingBtn);
            }
            if (this.container && !document.getElementById('chatbot-container')) {
                document.body.appendChild(this.container);
            }
        } catch (error) {
            console.error('[Chatbot] Error injecting to page:', error);
        }
    }

    toggleChat() {
        try {
            this.isOpen = !this.isOpen;

            if (this.isOpen) {
                this.container?.classList.add('active');
                this.floatingBtn?.classList.add('active');

                // Focus input
                setTimeout(() => {
                    const input = this.container?.querySelector('#chatbot-input');
                    if (input) input.focus();
                }, 300);
            } else {
                this.container?.classList.remove('active');
                this.floatingBtn?.classList.remove('active');
            }
        } catch (error) {
            console.error('[Chatbot] Error toggling chat:', error);
        }
    }

    async sendMessage() {
        try {
            const inputField = this.container?.querySelector('#chatbot-input');
            if (!inputField) return;

            const message = inputField.value.trim();
            if (!message || this.isTyping) return;

            // Clear input
            inputField.value = '';

            // Add user message
            this.addMessage(message, 'user');

            // Hide welcome message
            const welcome = this.container?.querySelector('.chatbot-welcome');
            if (welcome) {
                welcome.style.display = 'none';
            }

            // Get AI response
            const response = await this.getAIResponse(message);

            // Add AI message
            this.addMessage(response, 'assistant');

            // Save messages
            this.saveMessages();
        } catch (error) {
            console.error('[Chatbot] Error sending message:', error);
            this.addMessage('죄송합니다. 오류가 발생했습니다.', 'assistant');
        }
    }

    async getAIResponse(message) {
        try {
            // Check if Gemini API is available
            if (window.geminiAPI && window.geminiAPI.isInitialized && window.geminiAPI.isInitialized()) {
                const prompt = `사용자: ${message}\n\nAI 어시스턴트:`;

                const apiResponse = await window.geminiAPI.generateText(prompt, {
                    temperature: 0.8,
                    maxOutputTokens: 500,
                    topP: 0.9
                });

                // Extract text from API response
                if (apiResponse?.candidates?.[0]?.content?.parts?.[0]?.text) {
                    return apiResponse.candidates[0].content.parts[0].text;
                }
            }
        } catch (error) {
            console.error('[Chatbot] API error:', error);
        }

        // Fallback response
        return '죄송합니다. 현재 API가 연결되어 있지 않습니다. 상단의 "API 연동" 버튼을 클릭하여 Gemini API를 설정해주세요.';
    }

    addMessage(content, sender) {
        try {
            const messagesContainer = this.container?.querySelector('#chatbot-messages');
            if (!messagesContainer) return;

            const messageHTML = `
                <div class="chatbot-message ${sender}">
                    <div class="chatbot-message-content">${content}</div>
                    <div class="chatbot-message-time">${this.getCurrentTime()}</div>
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
        } catch (error) {
            console.error('[Chatbot] Error adding message:', error);
        }
    }

    getCurrentTime() {
        const now = new Date();
        return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    }

    clearChat() {
        try {
            if (confirm('대화 내용을 모두 삭제하시겠습니까?')) {
                const messagesContainer = this.container?.querySelector('#chatbot-messages');
                if (messagesContainer) {
                    messagesContainer.innerHTML = `
                        <div class="chatbot-welcome">
                            <h4>안녕하세요! AIFI BOT입니다 👋</h4>
                            <p>창의적인 아이디어나 프로젝트에 대해 도움이 필요하시면 언제든지 물어보세요!</p>
                        </div>
                    `;
                }

                this.messages = [];
                this.conversationHistory = [];
                this.saveMessages();
            }
        } catch (error) {
            console.error('[Chatbot] Error clearing chat:', error);
        }
    }

    saveMessages() {
        try {
            localStorage.setItem('chatbot_messages', JSON.stringify(this.messages));
            localStorage.setItem('chatbot_history', JSON.stringify(this.conversationHistory));
        } catch (error) {
            console.error('[Chatbot] Error saving messages:', error);
        }
    }

    loadMessages() {
        try {
            const savedMessages = localStorage.getItem('chatbot_messages');
            const savedHistory = localStorage.getItem('chatbot_history');

            if (savedMessages) {
                this.messages = JSON.parse(savedMessages) || [];
            }

            if (savedHistory) {
                this.conversationHistory = JSON.parse(savedHistory) || [];
            }
        } catch (error) {
            console.error('[Chatbot] Error loading messages:', error);
            this.messages = [];
            this.conversationHistory = [];
        }
    }

    checkAPIStatus() {
        try {
            // Check if Gemini API is initialized
            if (window.geminiAPI && window.geminiAPI.isInitialized && window.geminiAPI.isInitialized()) {
                this.geminiAPI = window.geminiAPI;
            }
        } catch (error) {
            console.error('[Chatbot] Error checking API status:', error);
        }
    }
}

// Initialize chatbot when DOM is ready - with error handling
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        try {
            window.aiChatbot = new AIChatbot();
        } catch (error) {
            console.error('[Chatbot] Failed to initialize:', error);
        }
    });
} else {
    try {
        window.aiChatbot = new AIChatbot();
    } catch (error) {
        console.error('[Chatbot] Failed to initialize:', error);
    }
}

// Export for use in other modules
window.AIChatbot = AIChatbot;