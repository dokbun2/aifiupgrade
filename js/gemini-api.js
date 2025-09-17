/**
 * Gemini API Manager
 * Google AI Gemini API integration module
 * Models:
 * - Text: gemini-2.5-flash
 * - Image: gemini-2.5-flash-image-preview (Nano Banana)
 */

class GeminiAPIManager {
    constructor() {
        // Model configurations
        this.models = {
            text: 'gemini-2.5-flash',
            image: 'gemini-2.5-flash-image-preview'  // Nano Banana model for image generation
        };

        // API endpoints
        this.baseURL = 'https://generativelanguage.googleapis.com/v1beta';

        // State
        this.apiKey = null;
        this.isConnected = false;
        this.lastTestDate = null;

        // Usage tracking
        this.usage = {
            textRequests: 0,
            imageRequests: 0,
            lastReset: Date.now()
        };

        // Load saved state
        this.loadFromSession();
    }

    /**
     * Initialize with API Key
     */
    init(apiKey) {
        if (!apiKey || typeof apiKey !== 'string') {
            throw new Error('유효한 API Key를 입력해주세요');
        }

        this.apiKey = apiKey.trim();
        this.saveToSession();

        console.log('Gemini API initialized with models:', this.models);
    }

    /**
     * Save API Key and state to sessionStorage
     */
    saveToSession() {
        if (!this.apiKey) return;

        const state = {
            apiKey: this.apiKey,
            isConnected: this.isConnected,
            lastTestDate: this.lastTestDate,
            usage: this.usage,
            models: this.models
        };

        try {
            sessionStorage.setItem('gemini_api_state', JSON.stringify(state));
            console.log('Gemini API state saved to session');
        } catch (error) {
            console.error('Failed to save API state:', error);
        }
    }

    /**
     * Load API Key and state from sessionStorage
     */
    loadFromSession() {
        try {
            const savedState = sessionStorage.getItem('gemini_api_state');

            if (savedState) {
                const state = JSON.parse(savedState);
                this.apiKey = state.apiKey;
                this.isConnected = state.isConnected || false;
                this.lastTestDate = state.lastTestDate;
                this.usage = state.usage || this.usage;

                console.log('Gemini API state loaded from session');
                return true;
            }
        } catch (error) {
            console.error('Failed to load API state:', error);
        }

        return false;
    }

    /**
     * Clear session and reset state
     */
    clearSession() {
        sessionStorage.removeItem('gemini_api_state');
        this.apiKey = null;
        this.isConnected = false;
        this.lastTestDate = null;
        this.usage = {
            textRequests: 0,
            imageRequests: 0,
            lastReset: Date.now()
        };

        console.log('Gemini API state cleared');
    }

    /**
     * Test API connection with simple request
     */
    async testConnection() {
        if (!this.apiKey) {
            throw new Error('API Key가 설정되지 않았습니다');
        }

        try {
            // Simple text generation test
            const testPrompt = 'Say "Hello" in Korean';
            const response = await this.generateText(testPrompt, {
                maxOutputTokens: 10,
                temperature: 0.1
            });

            console.log('API Response:', response);

            if (response && response.candidates && response.candidates.length > 0) {
                const candidate = response.candidates[0];
                let responseText = '';

                // Safely extract text from response
                if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                    responseText = candidate.content.parts[0].text || '응답 성공';
                } else {
                    responseText = '연결 확인됨';
                }

                this.isConnected = true;
                this.lastTestDate = Date.now();
                this.saveToSession();

                console.log('API connection test successful:', responseText);
                return {
                    success: true,
                    message: '연결 테스트 성공!',
                    response: responseText
                };
            }

            throw new Error('Invalid response format');

        } catch (error) {
            this.isConnected = false;
            this.saveToSession();

            console.error('Connection test failed:', error);

            return {
                success: false,
                message: this.getErrorMessage(error),
                error: error
            };
        }
    }

    /**
     * Generate text using Gemini 2.5 Flash
     */
    async generateText(prompt, options = {}) {
        if (!this.apiKey) {
            throw new Error('API Key가 설정되지 않았습니다');
        }

        const endpoint = `${this.baseURL}/models/${this.models.text}:generateContent?key=${this.apiKey}`;

        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: options.temperature || 0.7,
                topK: options.topK || 40,
                topP: options.topP || 0.95,
                maxOutputTokens: options.maxOutputTokens || 8192,
                responseMimeType: options.responseMimeType || "text/plain"
            },
            safetySettings: options.safetySettings || [
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                }
            ]
        };

        try {
            console.log('Sending request to Gemini API...');
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}`;
                try {
                    const errorData = await response.json();
                    console.error('API Error Response:', errorData);
                    errorMessage = errorData.error?.message || errorMessage;
                } catch (e) {
                    console.error('Could not parse error response:', e);
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log('API Success Response structure:', {
                hasData: !!data,
                hasCandidates: !!(data && data.candidates),
                candidatesLength: data?.candidates?.length
            });

            this.usage.textRequests++;
            this.saveToSession();

            return data;

        } catch (error) {
            console.error('Text generation failed:', error);
            throw error;
        }
    }

    /**
     * Generate image using Nano Banana (Gemini 2.5 Flash Image Preview)
     * This is the new image generation model from Google
     */
    async generateImage(prompt, options = {}) {
        if (!this.apiKey) {
            throw new Error('API Key가 설정되지 않았습니다');
        }

        const endpoint = `${this.baseURL}/models/${this.models.image}:generateContent?key=${this.apiKey}`;

        // Nano Banana 이미지 생성을 위한 프롬프트
        const imagePrompt = `Generate an image: ${prompt}`;

        const requestBody = {
            contents: [{
                parts: [{
                    text: imagePrompt
                }]
            }],
            generationConfig: {
                temperature: options.temperature || 1.0,
                topK: options.topK || 40,
                topP: options.topP || 0.95,
                maxOutputTokens: options.maxOutputTokens || 8192,
                // Nano Banana 이미지 생성 설정
                candidateCount: 1
            }
        };

        try {
            console.log('Generating image with Nano Banana:', imagePrompt);

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('Nano Banana API error:', error);
                throw new Error(error.error?.message || `HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log('Nano Banana response:', data);

            // Parse the response to extract image data
            if (data.candidates && data.candidates.length > 0) {
                const content = data.candidates[0].content;
                if (content && content.parts && content.parts.length > 0) {
                    const part = content.parts[0];

                    // Check if response contains image data
                    if (part.inlineData) {
                        // Base64 encoded image
                        const imageData = part.inlineData.data;
                        const mimeType = part.inlineData.mimeType || 'image/png';
                        const imageUrl = `data:${mimeType};base64,${imageData}`;

                        this.usage.imageRequests++;
                        this.saveToSession();

                        return {
                            success: true,
                            imageUrl: imageUrl,
                            mimeType: mimeType
                        };
                    } else if (part.text) {
                        // Check if text contains image URL or base64
                        const text = part.text;

                        // Try to parse as JSON in case it contains structured data
                        try {
                            const parsed = JSON.parse(text);
                            if (parsed.imageUrl || parsed.image) {
                                this.usage.imageRequests++;
                                this.saveToSession();

                                return {
                                    success: true,
                                    imageUrl: parsed.imageUrl || parsed.image
                                };
                            }
                        } catch (e) {
                            // Not JSON, might be direct URL or base64
                            if (text.startsWith('http') || text.startsWith('data:')) {
                                this.usage.imageRequests++;
                                this.saveToSession();

                                return {
                                    success: true,
                                    imageUrl: text
                                };
                            }
                        }

                        // If we get here, no image was generated
                        console.log('No image in response, got text:', text);
                        throw new Error('Nano Banana did not generate an image. Response: ' + text.substring(0, 200));
                    }
                }
            }

            throw new Error('Invalid response format from Nano Banana');

        } catch (error) {
            console.error('Nano Banana generation failed:', error);
            throw error;
        }
    }

    /**
     * Edit existing image with prompt
     */
    async editImage(imageBase64, prompt, options = {}) {
        return this.generateImage(prompt, {
            ...options,
            imageBase64: imageBase64,
            imageMimeType: options.imageMimeType || "image/jpeg"
        });
    }

    /**
     * Get user-friendly error message
     */
    getErrorMessage(error) {
        console.log('Error details:', error);

        // Check if it's a response error with status
        if (error.message) {
            const errorMsg = error.message.toLowerCase();

            if (errorMsg.includes('400') || errorMsg.includes('api_key_invalid')) {
                return '유효하지 않은 API Key입니다. Google AI Studio에서 올바른 키를 복사했는지 확인해주세요.';
            } else if (errorMsg.includes('403') || errorMsg.includes('forbidden')) {
                return 'API 접근이 거부되었습니다. API Key의 권한을 확인해주세요.';
            } else if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('rate')) {
                return 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
            } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
                return '네트워크 연결을 확인해주세요.';
            } else if (errorMsg.includes('404') || errorMsg.includes('not found')) {
                return '요청한 모델을 찾을 수 없습니다. API가 활성화되었는지 확인해주세요.';
            } else if (errorMsg.includes('cannot read properties of undefined')) {
                return 'API 응답 형식이 예상과 다릅니다. API Key가 올바른지 확인해주세요.';
            }
        }

        // Default error message
        return `API 오류: ${error.message || error.toString()}`;
    }

    /**
     * Check if API is ready to use
     */
    isReady() {
        return this.apiKey && this.isConnected;
    }

    /**
     * Get current connection status
     */
    getStatus() {
        return {
            hasKey: !!this.apiKey,
            isConnected: this.isConnected,
            lastTestDate: this.lastTestDate,
            models: this.models,
            usage: this.usage
        };
    }

    /**
     * Get usage statistics
     */
    getUsageStats() {
        const now = Date.now();
        const hoursSinceReset = (now - this.usage.lastReset) / (1000 * 60 * 60);

        return {
            textRequests: this.usage.textRequests,
            imageRequests: this.usage.imageRequests,
            totalRequests: this.usage.textRequests + this.usage.imageRequests,
            hoursSinceReset: Math.round(hoursSinceReset * 10) / 10,
            lastReset: new Date(this.usage.lastReset).toLocaleString('ko-KR')
        };
    }

    /**
     * Reset usage statistics
     */
    resetUsageStats() {
        this.usage = {
            textRequests: 0,
            imageRequests: 0,
            lastReset: Date.now()
        };
        this.saveToSession();
    }
}

// Create global instance
window.geminiAPI = new GeminiAPIManager();

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    if (window.geminiAPI.loadFromSession()) {
        console.log('Gemini API auto-loaded from session');

        // Dispatch custom event for other modules
        window.dispatchEvent(new CustomEvent('geminiAPIReady', {
            detail: window.geminiAPI.getStatus()
        }));
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeminiAPIManager;
}