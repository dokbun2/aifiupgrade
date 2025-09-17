// Admin Dashboard JavaScript

// API Configuration
const API_BASE = 'http://localhost:3000/api/v1';
let authToken = localStorage.getItem('adminAuthToken');

// API Helper Functions
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers
        });

        if (response.status === 401) {
            // Token expired or invalid, redirect to login
            localStorage.removeItem('adminAuthToken');
            window.location.href = '/admin/login.html';
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Toggle Admin Sidebar
function toggleAdminSidebar() {
    const sidebar = document.querySelector('.admin-sidebar');
    sidebar.classList.toggle('collapsed');

    // Save state to localStorage
    const isCollapsed = sidebar.classList.contains('collapsed');
    localStorage.setItem('adminSidebarCollapsed', isCollapsed);
}

// Initialize Admin Dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Restore sidebar state
    const sidebarCollapsed = localStorage.getItem('adminSidebarCollapsed') === 'true';
    if (sidebarCollapsed) {
        document.querySelector('.admin-sidebar')?.classList.add('collapsed');
    }

    // Handle search shortcut (Cmd/Ctrl + K)
    document.addEventListener('keydown', function(e) {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.querySelector('.search-input');
            if (searchInput) {
                searchInput.focus();
            }
        }
    });

    // Handle sidebar navigation active state
    const currentPath = window.location.pathname;
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));
            // Add active class to clicked item
            this.classList.add('active');
        });
    });

    // Initialize Chart (Placeholder)
    initializeChart();

    // Handle responsive sidebar
    handleResponsiveSidebar();
});

// Initialize Chart
function initializeChart() {
    const canvas = document.getElementById('overview-chart');
    if (canvas) {
        // This is a placeholder for chart initialization
        // You can integrate with Chart.js or any other charting library
        console.log('Chart initialized');
    }
}

// Handle Responsive Sidebar
function handleResponsiveSidebar() {
    const sidebar = document.querySelector('.admin-sidebar');
    let startX = null;
    let currentX = null;
    let sidebarWidth = 240;

    // Touch events for mobile swipe
    if (window.innerWidth <= 768) {
        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: true });
        document.addEventListener('touchend', handleTouchEnd);

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', function(e) {
            if (window.innerWidth <= 768) {
                const sidebar = document.querySelector('.admin-sidebar');
                const sidebarToggle = document.querySelector('.sidebar-toggle');

                if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
                    sidebar.classList.remove('show');
                }
            }
        });
    }

    function handleTouchStart(e) {
        startX = e.touches[0].clientX;
    }

    function handleTouchMove(e) {
        if (!startX) return;
        currentX = e.touches[0].clientX;
    }

    function handleTouchEnd() {
        if (!startX || !currentX) return;

        const diffX = startX - currentX;
        const sidebar = document.querySelector('.admin-sidebar');

        // Swipe left to close sidebar
        if (diffX > 50 && sidebar.classList.contains('show')) {
            sidebar.classList.remove('show');
        }

        // Swipe right to open sidebar
        if (diffX < -50 && !sidebar.classList.contains('show') && startX < 50) {
            sidebar.classList.add('show');
        }

        startX = null;
        currentX = null;
    }
}

// Export functions for global use
window.toggleAdminSidebar = toggleAdminSidebar;

// Mobile sidebar toggle for responsive
if (window.innerWidth <= 768) {
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            const sidebar = document.querySelector('.admin-sidebar');
            sidebar.classList.toggle('show');
        });
    }
}

// Load Dashboard Data
async function loadDashboardData() {
    try {
        // Check if user is authenticated
        if (!authToken) {
            window.location.href = '/admin/login.html';
            return;
        }

        // Fetch dashboard stats
        const data = await apiRequest('/stats/dashboard');

        // Update stat cards
        updateStatCards(data.stats);

        // Update recent sales
        updateRecentSales(data.recentSales);

        // Update orders table
        updateOrdersTable(data.recentOrders);

        // Load chart data
        loadChartData();

    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        showNotification('Failed to load dashboard data', 'error');
    }
}

// Update stat cards with real data
function updateStatCards(stats) {
    // Update Total Revenue
    const revenueCard = document.querySelector('.stat-card:nth-child(1)');
    if (revenueCard) {
        revenueCard.querySelector('.stat-value').textContent = `$${stats.totalRevenue?.toFixed(2) || '0.00'}`;
        revenueCard.querySelector('.stat-change').innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                <polyline points="17 6 23 6 23 12"></polyline>
            </svg>
            +${stats.revenueGrowth || 0}% from last month
        `;
    }

    // Update Subscriptions
    const subsCard = document.querySelector('.stat-card:nth-child(2)');
    if (subsCard) {
        subsCard.querySelector('.stat-value').textContent = `+${stats.totalUsers || 0}`;
        subsCard.querySelector('.stat-change').innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                <polyline points="17 6 23 6 23 12"></polyline>
            </svg>
            +${stats.userGrowth || 0}% from last month
        `;
    }

    // Update Sales
    const salesCard = document.querySelector('.stat-card:nth-child(3)');
    if (salesCard) {
        salesCard.querySelector('.stat-value').textContent = `+${stats.totalOrders || 0}`;
        salesCard.querySelector('.stat-change').innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                <polyline points="17 6 23 6 23 12"></polyline>
            </svg>
            +${stats.salesGrowth || 0}% from last month
        `;
    }

    // Update Active Now
    const activeCard = document.querySelector('.stat-card:nth-child(4)');
    if (activeCard) {
        activeCard.querySelector('.stat-value').textContent = `+${stats.activeUsers || 0}`;
        activeCard.querySelector('.stat-change').innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                <polyline points="17 6 23 6 23 12"></polyline>
            </svg>
            +${stats.activeGrowth || 0} since last hour
        `;
    }
}

// Update recent sales list
function updateRecentSales(sales) {
    const salesList = document.querySelector('.sales-list');
    if (!salesList || !sales || sales.length === 0) return;

    salesList.innerHTML = sales.map(sale => `
        <div class="sale-item">
            <div class="sale-avatar">
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(sale.customer_name)}&background=6366f1&color=fff" alt="${sale.customer_name}">
            </div>
            <div class="sale-info">
                <p class="sale-name">${sale.customer_name}</p>
                <p class="sale-email">${sale.customer_email}</p>
            </div>
            <div class="sale-amount">+$${sale.amount.toFixed(2)}</div>
        </div>
    `).join('');
}

// Update orders table
function updateOrdersTable(orders) {
    const tableBody = document.querySelector('.data-table tbody');
    if (!tableBody || !orders || orders.length === 0) return;

    tableBody.innerHTML = orders.map(order => {
        const statusClass = {
            'paid': 'badge-success',
            'pending': 'badge-warning',
            'failed': 'badge-danger',
            'processing': 'badge-warning',
            'delivered': 'badge-success'
        }[order.status] || 'badge-warning';

        const statusText = order.status.charAt(0).toUpperCase() + order.status.slice(1);

        return `
            <tr>
                <td class="font-medium">${order.order_number}</td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>${order.customer_name}</td>
                <td>${new Date(order.created_at).toLocaleDateString()}</td>
                <td class="text-right">$${order.total_amount.toFixed(2)}</td>
            </tr>
        `;
    }).join('');
}

// Load chart data
async function loadChartData() {
    try {
        const data = await apiRequest('/stats/chart/week');
        // Here you would update the chart with the data
        // For now, just log it
        console.log('Chart data:', data);
    } catch (error) {
        console.error('Failed to load chart data:', error);
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'error' ? '#ef4444' : '#10b981'};
        color: white;
        border-radius: 8px;
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animation for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Load dashboard data when page loads
if (window.location.pathname.includes('/admin/index.html') || window.location.pathname === '/admin/') {
    loadDashboardData();

    // Refresh data every 30 seconds
    setInterval(function() {
        if (document.visibilityState === 'visible') {
            loadDashboardData();
        }
    }, 30000);
}