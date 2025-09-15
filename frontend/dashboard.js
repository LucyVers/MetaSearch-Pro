/**
 * DASHBOARD.JS - Enterprise Analytics Dashboard
 *
 * This script handles:
 * - Chart.js integration for data visualization
 * - ROI calculations and display
 * - Real-time data loading from /api/dashboard-analytics
 * - Responsive design and animations
 *
 * Author: Lucy Sonberg - SONBERG STUDIO
 * Date: September 2025
 */

// Global variables for charts and data
let fileTypeChart = null;
let searchChart = null;
let storageChart = null;
let dashboardData = null;

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Dashboard initializing...');
    loadDashboardData();
});

/**
 * Load dashboard data from API endpoint
 * Implements caching and error handling
 */
async function loadDashboardData() {
    try {
        showLoadingState();

        // Fetch analytics data from backend
        const response = await fetch('/api/dashboard-analytics');

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        dashboardData = await response.json();
        console.log('📊 Dashboard data loaded:', dashboardData);

        // Initialize all dashboard components
        await initializeDashboard();

        hideLoadingState();

    } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
        showErrorState(error.message);
    }
}

/**
 * Initialize all dashboard components
 */
async function initializeDashboard() {
    // Display ROI metrics (most important section)
    displayROIMetrics();

    // Initialize charts
    initializeFileTypeChart();
    initializeSearchChart();
    initializeStorageChart();

    // Display system statistics
    displaySystemStats();

    // Display business insights
    displayBusinessInsights();

    // Show all sections with smooth animations
    showDashboardSections();
}

/**
 * Display ROI metrics - The most important business data
 */
function displayROIMetrics() {
    const roi = dashboardData.roiMetrics;

    // Animate numbers for visual impact
    animateNumber('roiTimeSaved', 0, roi.timeSavedPerWeek, 'h');
    animateNumber('roiMoneySaved', 0, roi.moneySavedPerMonth, ' kr');
    animateNumber('roiEfficiency', 0, roi.efficiencyIncrease, '%');
}

/**
 * Initialize File Type Distribution Pie Chart
 */
function initializeFileTypeChart() {
    const ctx = document.getElementById('fileTypeChart').getContext('2d');

    // Extract data for chart
    const labels = dashboardData.fileTypeDistribution.map(item => item.type);
    const data = dashboardData.fileTypeDistribution.map(item => item.count);
    const colors = {
        'PDF': '#ff6b6b',   // Red for PDFs
        'JPG': '#4ecdc4',   // Teal for images
        'MP3': '#45b7d1',   // Blue for audio
        'PPT': '#f39c12'    // Orange for presentations
    };
    const backgroundColors = labels.map(label => colors[label] || '#95a5a6');

    fileTypeChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderColor: '#ffffff',
                borderWidth: 2,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    callbacks: {
                        label: function(context) {
                            const item = dashboardData.fileTypeDistribution[context.dataIndex];
                            return `${item.type}: ${item.count} filer (${item.percentage}%)`;
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                duration: 2000
            }
        }
    });

    // Update summary statistics
    document.getElementById('totalFiles').textContent = dashboardData.summary.totalFiles;
    document.getElementById('totalSize').textContent = dashboardData.summary.totalSize;
}

/**
 * Initialize Search Statistics Bar Chart
 */
function initializeSearchChart() {
    const ctx = document.getElementById('searchChart').getContext('2d');

    const labels = dashboardData.searchStats.map(item => item.label);
    const data = dashboardData.searchStats.map(item => item.searches);

    searchChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sökningar',
                data: data,
                backgroundColor: [
                    'rgba(255, 107, 107, 0.8)',   // Red
                    'rgba(78, 205, 196, 0.8)',    // Teal
                    'rgba(69, 183, 209, 0.8)',    // Blue
                    'rgba(243, 156, 18, 0.8)'     // Orange
                ],
                borderColor: [
                    'rgb(255, 107, 107)',
                    'rgb(78, 205, 196)',
                    'rgb(69, 183, 209)',
                    'rgb(243, 156, 18)'
                ],
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: '#666'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#666'
                    }
                }
            },
            animation: {
                delay: 500,
                duration: 1500
            }
        }
    });

    // Calculate total searches
    const totalSearches = data.reduce((sum, count) => sum + count, 0);
    document.getElementById('totalSearches').textContent = totalSearches;
}

/**
 * Initialize Storage Analytics Chart
 */
function initializeStorageChart() {
    const ctx = document.getElementById('storageChart').getContext('2d');

    const labels = dashboardData.fileTypeDistribution.map(item => item.type);
    const data = dashboardData.fileTypeDistribution.map(item => item.size);

    storageChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    'rgba(255, 107, 107, 0.8)',
                    'rgba(78, 205, 196, 0.8)',
                    'rgba(69, 183, 209, 0.8)',
                    'rgba(243, 156, 18, 0.8)'
                ],
                borderColor: '#ffffff',
                borderWidth: 3,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '50%',
            plugins: {
                legend: {
                    display: false  // Custom storage breakdown below
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    callbacks: {
                        label: function(context) {
                            const item = dashboardData.fileTypeDistribution[context.dataIndex];
                            return `${item.type}: ${item.sizeFormatted}`;
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                duration: 2000,
                delay: 1000
            }
        }
    });

    // Update storage breakdown bars
    updateStorageBreakdown();
}

/**
 * Update storage breakdown visual bars
 */
function updateStorageBreakdown() {
    const totalSize = dashboardData.summary.totalSizeBytes;

    dashboardData.fileTypeDistribution.forEach((item, index) => {
        const percentage = totalSize > 0 ? (item.size / totalSize) * 100 : 0;
        const barElement = document.querySelector(`.${item.type.toLowerCase()}-bar`);
        const sizeElement = document.getElementById(`${item.type.toLowerCase()}Storage`);

        if (barElement && sizeElement) {
            // Animate bar width
            setTimeout(() => {
                barElement.style.width = `${percentage}%`;
            }, index * 200);

            sizeElement.textContent = item.sizeFormatted;
        }
    });
}

/**
 * Display system performance statistics
 */
function displaySystemStats() {
    const perf = dashboardData.performance;

    document.getElementById('responseTime').textContent = perf.responseTime;
    document.getElementById('systemUptime').textContent = perf.uptime;
    document.getElementById('databaseStatus').textContent = perf.databaseStatus;
}

/**
 * Display business insights
 */
function displayBusinessInsights() {
    const insights = dashboardData.insights;

    insights.forEach((insight, index) => {
        setTimeout(() => {
            // Find insight cards and update content
            const cards = document.querySelectorAll('.insight-card');
            if (cards[index]) {
                const icon = cards[index].querySelector('.insight-icon');
                const title = cards[index].querySelector('h3');
                const description = cards[index].querySelector('p');

                if (icon) icon.textContent = insight.icon;
                if (title) title.textContent = insight.title;
                if (description) description.textContent = insight.description;

                // Add animation class
                cards[index].classList.add('insight-animated');
            }
        }, index * 300);
    });
}

/**
 * Animate numbers for visual impact
 */
function animateNumber(elementId, start, end, suffix = '') {
    const element = document.getElementById(elementId);
    if (!element) return;

    const duration = 2000; // 2 seconds
    const stepTime = Math.abs(Math.floor(duration / (end - start)));
    const current = start;
    const increment = end > start ? 1 : -1;

    let counter = start;
    const timer = setInterval(() => {
        counter += increment * Math.ceil((end - start) / 50);
        if ((increment > 0 && counter >= end) || (increment < 0 && counter <= end)) {
            counter = end;
            clearInterval(timer);
        }
        element.textContent = Math.floor(counter) + suffix;
    }, stepTime);
}

/**
 * Show loading state
 */
function showLoadingState() {
    document.getElementById('dashboardLoading').style.display = 'flex';
    // Hide all sections
    const sections = document.querySelectorAll('.dashboard-section');
    sections.forEach(section => section.style.display = 'none');

    // Hide charts-grid specifically
    const chartsGrid = document.querySelector('.charts-grid');
    if (chartsGrid) {
        chartsGrid.style.display = 'none';
    }
}

/**
 * Hide loading state and show dashboard sections
 */
function hideLoadingState() {
    document.getElementById('dashboardLoading').style.display = 'none';
}

/**
 * Show dashboard sections with smooth animations
 */
function showDashboardSections() {
    const sections = [
        { selector: '.roi-section', display: 'block' },
        { selector: '.charts-grid', display: 'grid' },
        { selector: '.system-section', display: 'block' },
        { selector: '.insights-section', display: 'block' }
    ];

    sections.forEach((sectionConfig, index) => {
        setTimeout(() => {
            const section = document.querySelector(sectionConfig.selector);
            if (section) {
                section.style.display = sectionConfig.display;
                section.style.opacity = '0';
                section.style.transform = 'translateY(20px)';

                // Special handling for charts-grid: show all chart-sections
                if (sectionConfig.selector === '.charts-grid') {
                    const chartSections = section.querySelectorAll('.chart-section');
                    chartSections.forEach(chartSection => {
                        chartSection.style.display = 'block';
                    });
                }

                // Trigger animation
                setTimeout(() => {
                    section.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                    section.style.opacity = '1';
                    section.style.transform = 'translateY(0)';
                }, 100);
            }
        }, index * 300);
    });
}

/**
 * Show error state
 */
function showErrorState(errorMessage) {
    document.getElementById('dashboardLoading').innerHTML = `
        <div class="error-container">
            <div class="error-icon">❌</div>
            <h3>Kunde inte ladda dashboard-data</h3>
            <p>Fel: ${errorMessage}</p>
            <button onclick="location.reload()" class="retry-button">🔄 Försök igen</button>
        </div>
    `;
}

/**
 * Refresh dashboard data
 */
function refreshDashboard() {
    console.log('🔄 Refreshing dashboard data...');

    // Destroy existing charts
    if (fileTypeChart) fileTypeChart.destroy();
    if (searchChart) searchChart.destroy();
    if (storageChart) storageChart.destroy();

    // Reload data
    loadDashboardData();
}

/**
 * Export dashboard data as PDF (future enhancement)
 */
function exportDashboard() {
    console.log('📄 Dashboard export feature coming soon...');
    alert('Export-funktionen kommer snart! Detta är en placeholder för framtida utveckling.');
}

// Make functions available globally for HTML onclick handlers
window.refreshDashboard = refreshDashboard;
window.exportDashboard = exportDashboard;

/**
 * Console info for developers
 */
console.log('🎯 Dashboard.js loaded successfully');
console.log('📊 Enterprise Analytics Dashboard - SONBERG STUDIO');
console.log('🔗 API Endpoint: /api/dashboard-analytics');