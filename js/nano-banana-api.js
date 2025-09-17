/**
 * Nano Banana (Gemini 2.5 Flash Image Preview) API Manager
 * Google's state-of-the-art image generation and editing model
 *
 * Key Features:
 * - Image generation from text prompts
 * - Image editing with natural language
 * - Multi-image composition (up to 3 images)
 * - Character consistency across images
 * - Text rendering in images
 *
 * Pricing: $0.039 per image (1290 tokens)
 */

class NanoBananaAPI {
    constructor() {
        this.modelName = 'gemini-2.5-flash-image-preview';
        this.baseURL = 'https://generativelanguage.googleapis.com/v1beta';
        this.apiKey = null;
        this.tokensPerImage = 1290; // Each image costs 1290 tokens
        this.costPerImage = 0.039; // $0.039 per image
    }

    /**
     * Initialize with API key from geminiAPI if available
     */
    init() {
        if (window.geminiAPI && window.geminiAPI.apiKey) {
            this.apiKey = window.geminiAPI.apiKey;
            console.log('Nano Banana initialized with Gemini API key');
            return true;
        }
        return false;
    }

    /**
     * Generate image using Nano Banana
     */
    async generateImage(prompt, options = {}) {
        if (!this.apiKey) {
            this.init(); // Try to get API key from geminiAPI
            if (!this.apiKey) {
                throw new Error('API Key가 설정되지 않았습니다');
            }
        }

        const endpoint = `${this.baseURL}/models/${this.modelName}:generateContent?key=${this.apiKey}`;

        // Nano Banana specific prompt format for image generation
        // The model responds with image data in a special format
        const requestBody = {
            contents: [{
                parts: [{
                    text: `Create an image: ${prompt}`
                }]
            }],
            generationConfig: {
                temperature: options.temperature || 1.0,
                candidateCount: 1,
                maxOutputTokens: 2048, // Enough for image metadata + base64
                // Request image output format
                responseMimeType: "image/png"
            },
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                }
            ]
        };

        try {
            console.log('🍌 Nano Banana: Generating image for prompt:', prompt);

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('Nano Banana error:', error);
                throw new Error(error.error?.message || `HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log('Nano Banana response:', data);

            // Parse the response
            if (data.candidates && data.candidates.length > 0) {
                const candidate = data.candidates[0];

                // Check if the response contains an image
                if (candidate.content && candidate.content.parts) {
                    for (const part of candidate.content.parts) {
                        // Check for inline image data
                        if (part.inlineData) {
                            const imageData = part.inlineData.data;
                            const mimeType = part.inlineData.mimeType || 'image/png';

                            // Create data URL from base64
                            const imageUrl = `data:${mimeType};base64,${imageData}`;

                            console.log('✅ Nano Banana: Image generated successfully');
                            return {
                                success: true,
                                imageUrl: imageUrl,
                                mimeType: mimeType,
                                tokensUsed: this.tokensPerImage,
                                cost: this.costPerImage
                            };
                        }

                        // Check if text contains image generation info
                        if (part.text) {
                            // Sometimes Nano Banana returns a description instead of an image
                            // This happens when the model can't generate the requested image
                            console.warn('⚠️ Nano Banana returned text instead of image:', part.text);

                            // Try alternative generation method
                            return await this.generateImageAlternative(prompt, part.text);
                        }
                    }
                }
            }

            throw new Error('No image data in response');

        } catch (error) {
            console.error('Nano Banana generation failed:', error);
            throw error;
        }
    }

    /**
     * Alternative image generation when Nano Banana returns text
     */
    async generateImageAlternative(originalPrompt, responseText) {
        // When Nano Banana can't generate an image directly,
        // we can try a different approach or use a fallback

        console.log('🔄 Trying alternative generation method...');

        // Option 1: Try with a more specific prompt format
        const specificPrompt = `[IMAGE GENERATION REQUEST] Create a digital artwork: ${originalPrompt}. Output format: PNG image.`;

        // Option 2: Return a placeholder with the description
        // For now, we'll return an error with helpful info
        return {
            success: false,
            error: 'Image generation not available',
            description: responseText,
            suggestion: 'Nano Banana는 현재 텍스트 설명만 제공했습니다. 다른 프롬프트를 시도해보세요.',
            originalPrompt: originalPrompt
        };
    }

    /**
     * Edit existing image with Nano Banana
     */
    async editImage(imageBase64, editPrompt, options = {}) {
        if (!this.apiKey) {
            throw new Error('API Key가 설정되지 않았습니다');
        }

        const endpoint = `${this.baseURL}/models/${this.modelName}:generateContent?key=${this.apiKey}`;

        const requestBody = {
            contents: [{
                parts: [
                    {
                        inlineData: {
                            mimeType: options.mimeType || 'image/jpeg',
                            data: imageBase64
                        }
                    },
                    {
                        text: `Edit this image: ${editPrompt}`
                    }
                ]
            }],
            generationConfig: {
                temperature: options.temperature || 0.7,
                candidateCount: 1,
                maxOutputTokens: 2048
            }
        };

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();
            // Process response similar to generateImage
            return this.parseImageResponse(data);
        } catch (error) {
            console.error('Nano Banana edit failed:', error);
            throw error;
        }
    }

    /**
     * Compose multiple images into one
     */
    async composeImages(images, prompt, options = {}) {
        // Nano Banana can blend up to 3 images
        if (images.length > 3) {
            throw new Error('Nano Banana supports up to 3 images for composition');
        }

        const parts = images.map(img => ({
            inlineData: {
                mimeType: img.mimeType || 'image/jpeg',
                data: img.base64
            }
        }));

        parts.push({
            text: `Compose these images: ${prompt}`
        });

        const requestBody = {
            contents: [{ parts }],
            generationConfig: {
                temperature: options.temperature || 0.8,
                candidateCount: 1,
                maxOutputTokens: 2048
            }
        };

        // Send request similar to other methods
        // ...implementation
    }

    /**
     * Parse image response from API
     */
    parseImageResponse(data) {
        if (data.candidates && data.candidates.length > 0) {
            const candidate = data.candidates[0];
            if (candidate.content && candidate.content.parts) {
                for (const part of candidate.content.parts) {
                    if (part.inlineData) {
                        return {
                            success: true,
                            imageUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
                            tokensUsed: this.tokensPerImage,
                            cost: this.costPerImage
                        };
                    }
                }
            }
        }
        return {
            success: false,
            error: 'No image data in response'
        };
    }

    /**
     * Check if API is ready
     */
    isReady() {
        return !!this.apiKey;
    }

    /**
     * Get generation cost estimate
     */
    getCostEstimate(numberOfImages) {
        return {
            images: numberOfImages,
            totalTokens: numberOfImages * this.tokensPerImage,
            totalCost: numberOfImages * this.costPerImage,
            currency: 'USD'
        };
    }
}

// Create global instance
window.nanoBananaAPI = new NanoBananaAPI();

// Auto-initialize when Gemini API is ready
window.addEventListener('geminiAPIReady', () => {
    window.nanoBananaAPI.init();
    console.log('🍌 Nano Banana API initialized');
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NanoBananaAPI;
}