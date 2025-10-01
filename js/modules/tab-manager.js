// Tab Manager Module
// 탭 네비게이션 및 전환 관리

export const tabManager = {
    currentTab: 'basic',
    onTabChange: null, // 탭 변경 콜백

    /**
     * 탭 시스템 초기화
     * @param {Function} onTabChangeCallback - 탭 변경 시 호출될 콜백
     */
    init(onTabChangeCallback = null) {
        this.onTabChange = onTabChangeCallback;

        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabPanes = document.querySelectorAll('.tab-pane');

        // 초기 상태: 첫 번째 탭 활성화
        if (tabButtons.length > 0 && tabPanes.length > 0) {
            this.activateFirstTab(tabButtons, tabPanes);
        }

        // 탭 버튼 이벤트 리스너 등록
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handleTabClick(e, tabButtons, tabPanes));
        });

        console.log('✅ Tab Manager 초기화 완료');
    },

    /**
     * 첫 번째 탭 활성화
     */
    activateFirstTab(tabButtons, tabPanes) {
        // 모든 탭 비활성화
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));

        // 첫 번째 탭 활성화
        tabButtons[0].classList.add('active');
        const firstTabName = tabButtons[0].getAttribute('data-tab');
        const firstPane = document.querySelector(`.tab-pane[data-tab="${firstTabName}"]`);
        if (firstPane) {
            firstPane.classList.add('active');
        }

        this.currentTab = firstTabName;
    },

    /**
     * 탭 클릭 핸들러
     */
    handleTabClick(event, tabButtons, tabPanes) {
        const button = event.currentTarget;
        const targetTab = button.getAttribute('data-tab');

        // 모든 탭 비활성화
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));

        // 선택한 탭 활성화
        button.classList.add('active');
        const targetPane = document.querySelector(`.tab-pane[data-tab="${targetTab}"]`);
        if (targetPane) {
            targetPane.classList.add('active');
        }

        // 현재 탭 저장
        this.currentTab = targetTab;

        // 탭 변경 콜백 실행
        if (this.onTabChange) {
            this.onTabChange(targetTab);
        }

        console.log(`🔄 탭 전환: ${targetTab}`);
    },

    /**
     * 특정 탭으로 전환
     * @param {string} tabName - 전환할 탭 이름
     */
    switchToTab(tabName) {
        const button = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
        if (button) {
            button.click();
        }
    },

    /**
     * 현재 활성화된 탭 이름 반환
     */
    getCurrentTab() {
        return this.currentTab;
    }
};

// 전역 함수로 노출 (HTML onclick 핸들러용)
export function switchToTab(tabName) {
    tabManager.switchToTab(tabName);
}
