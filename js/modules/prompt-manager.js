// Prompt Manager Module
// 프롬프트 생성, 저장, 복사 관리

import { showNotification, copyToClipboard } from './utils.js';

export const promptManager = {
    savedPrompts: [],

    /**
     * 프롬프트 매니저 초기화
     */
    init() {
        this.loadSavedPrompts();
        console.log('✅ Prompt Manager 초기화 완료');
    },

    /**
     * 폼 데이터를 수집하여 객체로 반환
     * @param {string} tabName - 탭 이름 (basic, scene, character, location, props)
     * @returns {Object} 수집된 데이터 객체
     */
    collectFormData(tabName) {
        try {
            const activePane = document.querySelector(`.tab-pane[data-tab="${tabName}"]`);
            if (!activePane) return {};

            const data = {};

            // 기본 블록 탭의 경우
            if (tabName === 'basic') {
                activePane.querySelectorAll('.prompt-row-item').forEach(item => {
                    const blockType = item.getAttribute('data-block');
                    const input = item.querySelector('.prompt-input');
                    if (blockType && input && input.value && input.value.trim() !== '') {
                        data[blockType] = input.value;
                    }
                });
            } else {
                // 다른 탭들의 경우
                const inputs = activePane.querySelectorAll('.prompt-input');
                const selects = activePane.querySelectorAll('.prompt-select');

                [...inputs, ...selects].forEach(input => {
                    const row = input.closest('.prompt-row');
                    if (row) {
                        const label = row.querySelector('.prompt-label')?.textContent;
                        const tag = row.querySelector('.prompt-tag')?.textContent;
                        const value = input.value;

                        if (value && value.trim() !== '' && value !== '▼') {
                            data[tag || label] = value;
                        }
                    }
                });
            }

            return data;
        } catch (error) {
            console.warn('폼 데이터 수집 중 오류:', error);
            return {};
        }
    },

    /**
     * 데이터 객체를 프롬프트 문자열로 변환
     * @param {Object} data - 프롬프트 데이터
     * @returns {string} 생성된 프롬프트
     */
    buildPrompt(data) {
        let prompt = '';

        Object.entries(data).forEach(([key, value]) => {
            if (value) {
                prompt += `${key}: ${value}, `;
            }
        });

        // 마지막 쉼표 제거
        return prompt.slice(0, -2);
    },

    /**
     * 현재 탭의 프롬프트 생성
     * @param {string} currentTab - 현재 활성화된 탭
     */
    generatePrompt(currentTab) {
        const promptData = this.collectFormData(currentTab);
        const generatedPrompt = this.buildPrompt(promptData);

        // 활성 탭의 프롬프트 텍스트영역에 표시
        const textareaElems = document.querySelectorAll('.final-prompt-textarea');
        textareaElems.forEach(elem => {
            if (elem.closest('.tab-pane.active')) {
                elem.value = generatedPrompt;
            }
        });

        // 글로벌 최종 프롬프트에도 표시
        const globalFinalPrompt = document.getElementById('globalFinalPrompt');
        if (globalFinalPrompt) {
            globalFinalPrompt.value = generatedPrompt;

            // 프롬프트 영역으로 스크롤
            setTimeout(() => {
                const promptSection = document.querySelector('.global-final-prompt-section');
                if (promptSection) {
                    promptSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }, 100);
        }

        showNotification('프롬프트가 생성되었습니다.');
        return generatedPrompt;
    },

    /**
     * 활성 탭의 프롬프트 복사
     */
    copyActivePrompt() {
        const activeTextarea = document.querySelector('.tab-pane.active .final-prompt-textarea');
        if (activeTextarea && activeTextarea.value) {
            copyToClipboard(activeTextarea.value, '프롬프트가 클립보드에 복사되었습니다.');
        } else {
            showNotification('복사할 프롬프트가 없습니다.', 'warning');
        }
    },

    /**
     * localStorage에서 저장된 프롬프트 불러오기
     */
    loadSavedPrompts() {
        const saved = localStorage.getItem('savedPrompts');
        if (saved) {
            this.savedPrompts = JSON.parse(saved);
        }
        this.renderPromptList();
    },

    /**
     * localStorage에 프롬프트 저장
     */
    saveToStorage() {
        localStorage.setItem('savedPrompts', JSON.stringify(this.savedPrompts));
    },

    /**
     * 저장된 프롬프트 목록 렌더링
     */
    renderPromptList() {
        const fileList = document.querySelector('.file-list');
        if (!fileList) return;

        fileList.innerHTML = '';

        this.savedPrompts.forEach((item, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <input type="checkbox" id="file${index}">
                <label for="file${index}">${item.label}</label>
                <span class="file-actions">
                    <button class="action-btn" onclick="window.promptManager.copySavedPrompt(${index})">복사</button>
                    <button class="action-btn" onclick="window.promptManager.deletePrompt(${index})">삭제</button>
                </span>
            `;
            fileList.appendChild(fileItem);
        });
    },

    /**
     * 프롬프트 저장
     */
    savePrompt() {
        const finalPromptTextarea = document.getElementById('globalFinalPrompt');
        const shotIdElement = document.querySelector('.shot-id');

        if (!finalPromptTextarea || !shotIdElement) {
            alert('프롬프트를 찾을 수 없습니다.');
            return;
        }

        const promptText = finalPromptTextarea.value.trim();
        if (!promptText || promptText === '생성된 프롬프트가 여기에 표시됩니다...') {
            alert('저장할 프롬프트가 없습니다.');
            return;
        }

        const shotId = shotIdElement.textContent.trim();
        const now = new Date();
        const timeString = now.toLocaleString('ko-KR', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).replace(/\. /g, '.').replace(/, /g, ' ');

        // 넘버링 생성 (기존 항목 개수 + 1)
        const number = this.savedPrompts.length + 1;
        const label = `${number}. ${shotId} ${timeString}`;

        this.savedPrompts.push({
            label: label,
            prompt: promptText,
            timestamp: now.getTime()
        });

        this.saveToStorage();
        this.renderPromptList();
        alert('프롬프트가 저장되었습니다!');
    },

    /**
     * 저장된 프롬프트 복사
     * @param {number} index - 프롬프트 인덱스
     */
    copySavedPrompt(index) {
        if (index < 0 || index >= this.savedPrompts.length) return;

        const prompt = this.savedPrompts[index].prompt;
        copyToClipboard(prompt, '프롬프트가 복사되었습니다!');
    },

    /**
     * 프롬프트 삭제
     * @param {number} index - 프롬프트 인덱스
     */
    deletePrompt(index) {
        if (index < 0 || index >= this.savedPrompts.length) return;

        if (confirm('이 프롬프트를 삭제하시겠습니까?')) {
            this.savedPrompts.splice(index, 1);

            // 넘버링 재정렬
            this.savedPrompts.forEach((item, idx) => {
                const parts = item.label.split('. ');
                if (parts.length > 1) {
                    parts[0] = (idx + 1).toString();
                    item.label = parts.join('. ');
                }
            });

            this.saveToStorage();
            this.renderPromptList();
            alert('프롬프트가 삭제되었습니다.');
        }
    }
};

// 전역 함수로 노출 (HTML onclick 핸들러용)
export function savePrompt() {
    promptManager.savePrompt();
}

export function copyPrompt(index) {
    if (typeof index === 'number') {
        promptManager.copySavedPrompt(index);
    } else {
        promptManager.copyActivePrompt();
    }
}

export function deletePrompt(index) {
    promptManager.deletePrompt(index);
}
