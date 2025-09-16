// Theme Toggle Functionality
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;
const sunIcon = themeToggle.querySelector('.sun-icon');
const moonIcon = themeToggle.querySelector('.moon-icon');

// Load theme from localStorage or default to dark
const savedTheme = localStorage.getItem('theme') || 'dark';
if (savedTheme === 'dark') {
    body.classList.add('dark');
    sunIcon.style.display = 'none';
    moonIcon.style.display = 'block';
} else {
    body.classList.remove('dark');
    sunIcon.style.display = 'block';
    moonIcon.style.display = 'none';
}

// Toggle theme on button click
themeToggle.addEventListener('click', () => {
    if (body.classList.contains('dark')) {
        body.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    } else {
        body.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    }
});

// Sidebar Toggle Functionality
// Toggle sidebar function
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    if (sidebar) {
        sidebar.classList.toggle('open');

        // Show/hide overlay on mobile
        if (window.innerWidth <= 768 && sidebarOverlay) {
            sidebarOverlay.classList.toggle('active');
        }
    }
}

// Close sidebar when clicking overlay
document.addEventListener('DOMContentLoaded', () => {
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                sidebar.classList.remove('open');
                sidebarOverlay.classList.remove('active');
            }
        });
    }

    // Close dropdowns when clicking outside sidebar
    document.addEventListener('click', (e) => {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;

        // Check if sidebar is open and click is outside sidebar
        if (sidebar.classList.contains('open')) {
            const isClickInsideSidebar = sidebar.contains(e.target);
            const isSidebarToggle = e.target.closest('.sidebar-toggle-inside');

            // If click is outside sidebar and not on toggle button, close dropdowns
            if (!isClickInsideSidebar && !isSidebarToggle) {
                const allTitles = document.querySelectorAll('.sidebar-title.expandable');
                const allLists = document.querySelectorAll('.sidebar-list');

                allTitles.forEach(title => {
                    title.classList.remove('expanded');
                });
                allLists.forEach(list => {
                    list.classList.remove('expanded');
                });
            }
        }
    });
});

// Close sidebar on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        if (sidebar && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
            if (sidebarOverlay) {
                sidebarOverlay.classList.remove('active');
            }
        }
    }
});

// Copy Page Functionality (removed - not used in HTML)

// Search Functionality (removed - not used in HTML)

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add hover effect to component cards (removed - not used in HTML)

// Add active state to current page in sidebar
const currentPath = window.location.pathname;
document.querySelectorAll('.sidebar-link').forEach(link => {
    if (link.getAttribute('href') === currentPath) {
        link.classList.add('active');
    }
});

// Mobile Navigation Active State
function updateMobileNavActive() {
    const currentPage = window.location.pathname;
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');

    mobileNavItems.forEach(item => {
        item.classList.remove('active');
        const itemPath = item.getAttribute('href');

        // Check if current page matches the nav item
        if (currentPage.includes('/index.html') || currentPage === '/') {
            if (itemPath === 'index.html' || itemPath === '/') {
                item.classList.add('active');
            }
        } else if (currentPage.includes(itemPath) && itemPath !== 'index.html') {
            item.classList.add('active');
        }
    });
}

// Call on page load
updateMobileNavActive();

// Mobile Menu Function
function openMobileMenu() {
    // Create mobile menu overlay
    const existingMenu = document.getElementById('mobile-menu-overlay');
    if (existingMenu) {
        existingMenu.remove();
        return;
    }

    const menuOverlay = document.createElement('div');
    menuOverlay.id = 'mobile-menu-overlay';
    menuOverlay.className = 'mobile-menu-overlay';
    menuOverlay.innerHTML = `
        <div class="mobile-menu">
            <div class="mobile-menu-header">
                <h2>메뉴</h2>
                <button class="mobile-menu-close" onclick="closeMobileMenu()">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="mobile-menu-content">
                <a href="${window.location.pathname.includes('/index.html') || window.location.pathname === '/' ? '' : '../'}start/index.html" class="mobile-menu-link">
                    <span>영상제작</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </a>
                <a href="${window.location.pathname.includes('/index.html') || window.location.pathname === '/' ? '' : '../'}storyboard/index.html" class="mobile-menu-link">
                    <span>스토리보드</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </a>
                <a href="${window.location.pathname.includes('/index.html') || window.location.pathname === '/' ? '' : '../'}conceptart/index.html" class="mobile-menu-link">
                    <span>컨셉아트</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </a>
                <a href="${window.location.pathname.includes('/index.html') || window.location.pathname === '/' ? '' : '../'}gallery/index.html" class="mobile-menu-link">
                    <span>갤러리</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </a>
                <a href="${window.location.pathname.includes('/index.html') || window.location.pathname === '/' ? '' : '../'}banana/index.html" class="mobile-menu-link">
                    <span>바나나</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </a>
                <div class="mobile-menu-divider"></div>
                <button class="mobile-menu-theme" onclick="toggleThemeFromMenu()">
                    <span>테마 변경</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="5"></circle>
                        <line x1="12" y1="1" x2="12" y2="3"></line>
                        <line x1="12" y1="21" x2="12" y2="23"></line>
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                        <line x1="1" y1="12" x2="3" y2="12"></line>
                        <line x1="21" y1="12" x2="23" y2="12"></line>
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                    </svg>
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(menuOverlay);

    // Add animation
    setTimeout(() => {
        menuOverlay.classList.add('active');
    }, 10);

    // Close on overlay click
    menuOverlay.addEventListener('click', (e) => {
        if (e.target === menuOverlay) {
            closeMobileMenu();
        }
    });
}

function closeMobileMenu() {
    const menuOverlay = document.getElementById('mobile-menu-overlay');
    if (menuOverlay) {
        menuOverlay.classList.remove('active');
        setTimeout(() => {
            menuOverlay.remove();
        }, 300);
    }
}

function toggleThemeFromMenu() {
    themeToggle.click();
    closeMobileMenu();
}

// Sidebar dropdown toggle functionality
function toggleSidebarSection(titleElement) {
    const allTitles = document.querySelectorAll('.sidebar-title.expandable');
    const allLists = document.querySelectorAll('.sidebar-list');
    const currentList = titleElement.nextElementSibling;
    const isCurrentlyExpanded = titleElement.classList.contains('expanded');

    // Close all other sections
    allTitles.forEach(title => {
        if (title !== titleElement) {
            title.classList.remove('expanded');
        }
    });

    allLists.forEach(list => {
        if (list !== currentList) {
            list.classList.remove('expanded');
        }
    });

    // Toggle current section
    if (!isCurrentlyExpanded) {
        titleElement.classList.add('expanded');
        currentList.classList.add('expanded');
    } else {
        titleElement.classList.remove('expanded');
        currentList.classList.remove('expanded');
    }
}

// Initialize sidebar sections on page load
function initializeSidebar() {
    const currentPath = window.location.pathname;
    const allTitles = document.querySelectorAll('.sidebar-title.expandable');
    const allLists = document.querySelectorAll('.sidebar-list');

    // First, close all sections
    allTitles.forEach(title => title.classList.remove('expanded'));
    allLists.forEach(list => list.classList.remove('expanded'));

    // Then, only open the section containing the active link
    const activeLink = document.querySelector('.sidebar-link.active');
    if (activeLink) {
        const parentList = activeLink.closest('.sidebar-list');
        const parentTitle = parentList?.previousElementSibling;

        if (parentList && parentTitle) {
            parentList.classList.add('expanded');
            parentTitle.classList.add('expanded');
        }
    }
}

// Open sidebar when icon is clicked
function openSidebarSection(iconElement) {
    const sidebar = document.getElementById('sidebar');
    const section = iconElement.closest('.sidebar-section');
    const title = section.querySelector('.sidebar-title');
    const list = section.querySelector('.sidebar-list');

    // Open the sidebar first
    sidebar.classList.add('open');

    // Then expand the clicked section after a small delay
    setTimeout(() => {
        // Close all other sections
        document.querySelectorAll('.sidebar-title.expandable').forEach(t => {
            if (t !== title) {
                t.classList.remove('expanded');
            }
        });
        document.querySelectorAll('.sidebar-list').forEach(l => {
            if (l !== list) {
                l.classList.remove('expanded');
            }
        });

        // Open the clicked section
        title.classList.add('expanded');
        list.classList.add('expanded');
    }, 100);
}

// Make functions globally available
window.openMobileMenu = openMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.toggleThemeFromMenu = toggleThemeFromMenu;
window.toggleSidebarSection = toggleSidebarSection;
window.toggleSidebar = toggleSidebar;
window.openSidebarSection = openSidebarSection;

// Initialize tooltips (placeholder for future implementation)
function initTooltips() {
    const elementsWithTooltips = document.querySelectorAll('[data-tooltip]');
    elementsWithTooltips.forEach(element => {
        // Tooltip logic would go here
    });
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    initTooltips();
    initializeSidebar();
});

// Handle page transitions
window.addEventListener('popstate', () => {
    // Handle back/forward navigation
});

// Error handling
window.addEventListener('error', (e) => {
    // Log errors in production environment if needed
});

// Resize handler for responsive adjustments
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Responsive adjustments would go here
    }, 250);
});