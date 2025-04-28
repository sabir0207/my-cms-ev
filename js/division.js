// EV Charging Complaint Management System - Division Dashboard JavaScript

// Global Variables
let currentDivision = null;
let complaintsPagination = {
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 10
};
let chargersPagination = {
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 10
};

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    checkAuth();
    
    // Setup sidebar navigation
    setupSidebarNavigation();
    
    // Setup logout button
    setupLogout();
    
    // Setup notification system
    setupToastSystem();
    
    // Setup modals
    setupModals();
    
    // Load division dashboard data
    loadDashboardData();
    
    // Setup filters for complaints
    setupComplaintsFilters();
    
    // Setup filters for chargers
    setupChargersFilters();
    
    // Setup pagination
    setupPagination();
});

// Authentication Check
function checkAuth() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    
    if (!currentUser || currentUser.role !== 'division') {
        // Not logged in or not a division user, redirect to login
        window.location.href = 'index.html';
        return;
    }
    
    // Get division from session storage
    currentDivision = JSON.parse(sessionStorage.getItem('currentDivision'));
    
    if (!currentDivision || !currentDivision.name) {
        // No division information, redirect to login
        window.location.href = 'index.html';
        return;
    }
    
    // Update user name display
    document.getElementById('divisionUserName').textContent = currentDivision.name;
    document.getElementById('divisionWelcomeName').textContent = currentDivision.name;
}

// Sidebar Navigation
function setupSidebarNavigation() {
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    const dashboardSections = document.querySelectorAll('.dashboard-section');
    
    sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetSection = item.getAttribute('data-section');
            
            // Update active sidebar item
            sidebarItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            // Show target section, hide others
            dashboardSections.forEach(section => {
                if (section.id === targetSection + 'Section') {
                    section.classList.remove('hidden');
                    
                    // Load section data if needed
                    if (targetSection === 'divisionComplaints') {
                        loadFilteredDivisionComplaints(1);
                    } else if (targetSection === 'divisionChargers') {
                        loadFilteredDivisionChargers(1);
                    } else if (targetSection === 'assignedVendors') {
                        loadDivisionVendors();
                    }
                } else {
                    section.classList.add('hidden');
                }
            });
        });
    });
    
    // Set up "View all complaints" link
    document.getElementById('viewAllDivisionComplaints').addEventListener('click', (e) => {
        e.preventDefault();
        // Find complaints sidebar item and click it
        const complaintsItem = document.querySelector('.sidebar-item[data-section="divisionComplaints"]');
        if (complaintsItem) {
            complaintsItem.click();
        }
    });
}

// Logout Functionality
function setupLogout() {
    const logoutBtn = document.getElementById('divisionLogoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            // Clear session storage
            sessionStorage.removeItem('currentUser');
            sessionStorage.removeItem('currentDivision');
            
            // Redirect to login page
            window.location.href = 'index.html';
        });
    }
}

// Setup Toast Notification System
function setupToastSystem() {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
}

// Show Toast Notification
function showToast(type, title, message, duration = 3000) {
    // Get toast container
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Determine icon based on type
    const iconClass = type === 'success' ? 'fa-check-circle' : 
                     type === 'error' ? 'fa-times-circle' : 
                     type === 'warning' ? 'fa-exclamation-circle' : 'fa-info-circle';
    
    toast.innerHTML = `
        <i class="fas ${iconClass} toast-icon ${type}"></i>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">×</button>
    `;
    
    // Add toast to container
    toastContainer.appendChild(toast);
    
    // Add event listener to close button
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        toast.remove();
    });
    
    // Auto remove after duration
    setTimeout(() => {
        toast.classList.add('fading');
        
        // Remove after fade animation
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, duration);
}

// Set up modals
function setupModals() {
    // Close modal buttons
    const closeButtons = document.querySelectorAll('.modal-close, .btn-secondary[id^="cancel"]');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Find closest modal parent
            const modal = button.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // Set up assign to vendor form
    const assignToVendorForm = document.getElementById('assignToVendorForm');
    if (assignToVendorForm) {
        assignToVendorForm.addEventListener('submit', handleAssignToVendor);
    }
    
    // Set up update status form
    const updateStatusForm = document.getElementById('updateStatusForm');
    if (updateStatusForm) {
        updateStatusForm.addEventListener('submit', handleUpdateStatus);
    }
}

// Load Dashboard Data
function loadDashboardData() {
    if (!currentDivision) return;
    
    // Update statistics
    updateDivisionDashboardStats();
    
    // Load recent complaints
    loadDivisionRecentComplaints();
    
    // Create charger status chart
    createChargerStatusChart();
}

// Update Dashboard Statistics
function updateDivisionDashboardStats() {
    if (!currentDivision) return;
    
    // Get data from localStorage
    const chargers = JSON.parse(localStorage.getItem('chargers') || '[]');
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    
    // Filter for this division
    const divisionChargers = chargers.filter(c => c.division === currentDivision.name);
    const divisionComplaints = complaints.filter(c => c.division === currentDivision.name);
    
    // Calculate statistics
    const totalChargers = divisionChargers.length;
    const activeChargers = divisionChargers.filter(c => c.status === 'active').length;
    
    const openComplaints = divisionComplaints.filter(c => 
        c.status === 'Open' || c.status === 'In Progress'
    ).length;
    
    const resolvedComplaints = divisionComplaints.filter(c => c.status === 'Resolved').length;
    let resolutionRate = 0;
    if (divisionComplaints.length > 0) {
        resolutionRate = Math.round((resolvedComplaints / divisionComplaints.length) * 100);
    }
    
    // Update DOM elements
    document.getElementById('divTotalChargers').textContent = totalChargers;
    document.getElementById('divActiveChargers').textContent = activeChargers;
    document.getElementById('divOpenComplaints').textContent = openComplaints;
    document.getElementById('divResolutionRate').textContent = `${resolutionRate}%`;
    
    // Set random trend indicators for demonstration purposes
    document.getElementById('divChargersChange').textContent = `${Math.floor(Math.random() * 5 + 1)}`;
    
    // Update trend classes and icons
    const activeChargersTrend = document.getElementById('activeChargersTrend');
    const openComplaintsTrend = document.getElementById('openComplaintsTrend');
    const resolutionRateTrend = document.getElementById('resolutionRateTrend');
    
    if (activeChargersTrend) {
        const isPositive = Math.random() > 0.5;
        activeChargersTrend.className = isPositive ? 'stat-trend positive' : 'stat-trend negative';
        activeChargersTrend.innerHTML = `
            <i class="fas fa-arrow-${isPositive ? 'up' : 'down'}"></i>
            ${Math.floor(Math.random() * 3 + 1)}
        `;
    }
    
    if (openComplaintsTrend) {
        // More complaints is negative
        openComplaintsTrend.className = 'stat-trend negative';
        openComplaintsTrend.innerHTML = `
            <i class="fas fa-arrow-up"></i>
            ${Math.floor(Math.random() * 5 + 1)}
        `;
    }
    
    if (resolutionRateTrend) {
        // Higher resolution rate is positive
        resolutionRateTrend.className = 'stat-trend positive';
        resolutionRateTrend.innerHTML = `
            <i class="fas fa-arrow-up"></i>
            ${Math.floor(Math.random() * 5 + 1)}%
        `;
    }
}

// Load Recent Complaints for Dashboard
function loadDivisionRecentComplaints() {
    if (!currentDivision) return;
    
    const tableBody = document.querySelector('#divisionComplaintsTable tbody');
    if (!tableBody) return;
    
    // Clear table
    tableBody.innerHTML = '';
    
    // Get complaints from localStorage
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    
    // Filter for division and sort by date (newest first)
    const divisionComplaints = complaints
        .filter(c => c.division === currentDivision.name)
        .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate))
        .slice(0, 5); // Get only 5 most recent
    
    if (divisionComplaints.length === 0) {
        // Show no data message
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center">No complaints found</td></tr>';
        return;
    }
    
    // Add complaints to table
    divisionComplaints.forEach(complaint => {
        // Get charger info
        const chargers = JSON.parse(localStorage.getItem('chargers') || '[]');
        const charger = chargers.find(c => c.id === complaint.chargerID);
        const location = charger ? charger.location : 'Unknown Location';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${complaint.trackingId}</td>
            <td>${complaint.chargerID}</td>
            <td>${location}</td>
            <td>${complaint.type || 'General'}</td>
            <td>${new Date(complaint.createdDate).toLocaleDateString()}</td>
            <td><span class="status-badge ${getStatusClass(complaint.status)}">${complaint.status}</span></td>
            <td>${complaint.assignedTo || 'Not Assigned'}</td>
            <td>
                <button class="btn btn-sm btn-outline view-complaint-btn" data-id="${complaint.trackingId}">
                    View
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to view buttons
    const viewButtons = tableBody.querySelectorAll('.view-complaint-btn');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const trackingId = btn.getAttribute('data-id');
            showComplaintDetails(trackingId);
        });
    });
}

// Create Charger Status Chart
function createChargerStatusChart() {
    if (!currentDivision) return;
    
    const chartCanvas = document.getElementById('chargerStatusChart');
    if (!chartCanvas) return;
    
    // Get chargers from localStorage
    const chargers = JSON.parse(localStorage.getItem('chargers') || '[]');
    
    // Filter for division
    const divisionChargers = chargers.filter(c => c.division === currentDivision.name);
    
    // Count chargers by status
    const statusCounts = {
        active: 0,
        inactive: 0,
        maintenance: 0
    };
    
    divisionChargers.forEach(charger => {
        const status = charger.status ? charger.status.toLowerCase() : 'inactive';
        if (statusCounts.hasOwnProperty(status)) {
            statusCounts[status]++;
        }
    });
    
    // Create or update chart
    if (window.chargerStatusChart) {
        window.chargerStatusChart.destroy();
    }
    
    window.chargerStatusChart = new Chart(chartCanvas, {
        type: 'doughnut',
        data: {
            labels: ['Active', 'Inactive', 'Under Maintenance'],
            datasets: [{
                data: [
                    statusCounts.active,
                    statusCounts.inactive,
                    statusCounts.maintenance
                ],
                backgroundColor: [
                    '#4CAF50', // Green for active
                    '#F44336', // Red for inactive
                    '#FFC107'  // Yellow for maintenance
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: true,
                    text: 'Charger Status Distribution'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Setup Complaints Filters
function setupComplaintsFilters() {
    const applyFiltersBtn = document.getElementById('applyDivFilters');
    const resetFiltersBtn = document.getElementById('resetDivFilters');
    
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', () => {
            complaintsPagination.currentPage = 1;
            loadFilteredDivisionComplaints(1);
        });
    }
    
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', () => {
            // Reset filter inputs
            document.getElementById('divComplaintStatusFilter').value = 'all';
            document.getElementById('divComplaintTypeFilter').value = 'all';
            document.getElementById('divComplaintSearch').value = '';
            document.getElementById('divDateFrom').value = '';
            document.getElementById('divDateTo').value = '';
            
            complaintsPagination.currentPage = 1;
            loadFilteredDivisionComplaints(1);
        });
    }
}

// Load Filtered Division Complaints
function loadFilteredDivisionComplaints(page = 1) {
    if (!currentDivision) return;
    
    const tableBody = document.querySelector('#divComplaintsTable tbody');
    if (!tableBody) return;
    
    // Clear table
    tableBody.innerHTML = '';
    
    // Get filter values
    const statusFilter = document.getElementById('divComplaintStatusFilter').value;
    const typeFilter = document.getElementById('divComplaintTypeFilter').value;
    const searchInput = document.getElementById('divComplaintSearch').value.toLowerCase();
    const dateFrom = document.getElementById('divDateFrom').value;
    const dateTo = document.getElementById('divDateTo').value;
    
    // Get complaints from localStorage
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    
    // Filter for division
    let filteredComplaints = complaints.filter(c => c.division === currentDivision.name);
    
    // Apply filters
    if (statusFilter !== 'all') {
        filteredComplaints = filteredComplaints.filter(c => 
            c.status.toLowerCase().replace(' ', '-') === statusFilter.toLowerCase()
        );
    }
    
    if (typeFilter !== 'all') {
        filteredComplaints = filteredComplaints.filter(c => 
            c.type.toLowerCase().includes(typeFilter.toLowerCase())
        );
    }
    
    if (searchInput) {
        filteredComplaints = filteredComplaints.filter(c => 
            (c.trackingId && c.trackingId.toLowerCase().includes(searchInput)) ||
            (c.chargerID && c.chargerID.toLowerCase().includes(searchInput)) ||
            (c.consumerName && c.consumerName.toLowerCase().includes(searchInput)) ||
            (c.description && c.description.toLowerCase().includes(searchInput))
        );
    }
    
    if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        filteredComplaints = filteredComplaints.filter(c => 
            new Date(c.createdDate) >= fromDate
        );
    }
    
    if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        filteredComplaints = filteredComplaints.filter(c => 
            new Date(c.createdDate) <= toDate
        );
    }
    
    // Sort by date (newest first)
    filteredComplaints.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
    
    // Update pagination
    complaintsPagination.totalPages = Math.ceil(filteredComplaints.length / complaintsPagination.itemsPerPage) || 1;
    complaintsPagination.currentPage = page > complaintsPagination.totalPages ? 1 : page;
    
    // Update pagination controls
    document.getElementById('currentDivComplaintPage').textContent = complaintsPagination.currentPage;
    document.getElementById('totalDivComplaintPages').textContent = complaintsPagination.totalPages;
    document.getElementById('prevDivComplaintPage').disabled = complaintsPagination.currentPage <= 1;
    document.getElementById('nextDivComplaintPage').disabled = complaintsPagination.currentPage >= complaintsPagination.totalPages;
    
    // Get page data
    const startIndex = (complaintsPagination.currentPage - 1) * complaintsPagination.itemsPerPage;
    const endIndex = startIndex + complaintsPagination.itemsPerPage;
    const pageComplaints = filteredComplaints.slice(startIndex, endIndex);
    
    if (pageComplaints.length === 0) {
        // Show no data message
        tableBody.innerHTML = '<tr><td colspan="9" class="text-center">No complaints found</td></tr>';
        return;
    }
    
    // Add complaints to table
    pageComplaints.forEach(complaint => {
        // Get charger info
        const chargers = JSON.parse(localStorage.getItem('chargers') || '[]');
        const charger = chargers.find(c => c.id === complaint.chargerID);
        const location = charger ? charger.location : 'Unknown Location';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${complaint.trackingId}</td>
            <td>${complaint.chargerID}</td>
            <td>${location}</td>
            <td>${complaint.consumerName || 'Anonymous'}</td>
            <td>${complaint.type || 'General'}</td>
            <td><span class="status-badge ${getStatusClass(complaint.status)}">${complaint.status}</span></td>
            <td>${complaint.assignedTo || 'Not Assigned'}</td>
            <td>${new Date(complaint.createdDate).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-sm btn-outline view-complaint-btn" data-id="${complaint.trackingId}">
                    View
                </button>
                ${complaint.status !== 'Resolved' ? `
                <button class="btn btn-sm btn-primary assign-complaint-btn" data-id="${complaint.trackingId}">
                    Assign
                </button>
                <button class="btn btn-sm btn-secondary update-status-btn" data-id="${complaint.trackingId}">
                    Update
                </button>
                ` : ''}
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners
    tableBody.querySelectorAll('.view-complaint-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const trackingId = btn.getAttribute('data-id');
            showComplaintDetails(trackingId);
        });
    });
    
    tableBody.querySelectorAll('.assign-complaint-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const trackingId = btn.getAttribute('data-id');
            showAssignToVendorModal(trackingId);
        });
    });
    
    tableBody.querySelectorAll('.update-status-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const trackingId = btn.getAttribute('data-id');
            showUpdateStatusModal(trackingId);
        });
    });
}

// Setup Chargers Filters
function setupChargersFilters() {
    const applyFiltersBtn = document.getElementById('applyDivChargerFilters');
    const resetFiltersBtn = document.getElementById('resetDivChargerFilters');
    
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', () => {
            chargersPagination.currentPage = 1;
            loadFilteredDivisionChargers(1);
        });
    }
    
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', () => {
            // Reset filter inputs
            document.getElementById('divChargerStatusFilter').value = 'all';
            document.getElementById('divChargerTypeFilter').value = 'all';
            document.getElementById('divChargerSearch').value = '';
            
            chargersPagination.currentPage = 1;
            loadFilteredDivisionChargers(1);
        });
    }
}

// Load Filtered Division Chargers
function loadFilteredDivisionChargers(page = 1) {
    if (!currentDivision) return;
    
    const tableBody = document.querySelector('#divisionChargersTable tbody');
    if (!tableBody) return;
    
    // Clear table
    tableBody.innerHTML = '';
    
    // Get filter values
    const statusFilter = document.getElementById('divChargerStatusFilter').value;
    const typeFilter = document.getElementById('divChargerTypeFilter').value;
    const searchInput = document.getElementById('divChargerSearch').value.toLowerCase();
    
    // Get chargers from localStorage
    const chargers = JSON.parse(localStorage.getItem('chargers') || '[]');
    
    // Filter for division
    let filteredChargers = chargers.filter(c => c.division === currentDivision.name);
    
    // Apply filters
    if (statusFilter !== 'all') {
        filteredChargers = filteredChargers.filter(c => 
            c.status && c.status.toLowerCase() === statusFilter.toLowerCase()
        );
    }
    
    if (typeFilter !== 'all') {
        filteredChargers = filteredChargers.filter(c => {
            const chargerType = c.type ? c.type.toLowerCase() : '';
            if (typeFilter === 'ac') {
                return chargerType.includes('ac') || chargerType.includes('type 2');
            } else if (typeFilter === 'dc') {
                return chargerType.includes('dc') || chargerType.includes('ccs') || chargerType.includes('chademo');
            }
            return true;
        });
    }
    
    if (searchInput) {
        filteredChargers = filteredChargers.filter(c => 
            (c.id && c.id.toLowerCase().includes(searchInput)) ||
            (c.location && c.location.toLowerCase().includes(searchInput)) ||
            (c.serialNumber && c.serialNumber.toLowerCase().includes(searchInput))
        );
    }
    
    // Update pagination
    chargersPagination.totalPages = Math.ceil(filteredChargers.length / chargersPagination.itemsPerPage) || 1;
    chargersPagination.currentPage = page > chargersPagination.totalPages ? 1 : page;
    
    // Update pagination controls
    document.getElementById('currentDivChargerPage').textContent = chargersPagination.currentPage;
    document.getElementById('totalDivChargerPages').textContent = chargersPagination.totalPages;
    document.getElementById('prevDivChargerPage').disabled = chargersPagination.currentPage <= 1;
    document.getElementById('nextDivChargerPage').disabled = chargersPagination.currentPage >= chargersPagination.totalPages;
    
    // Get page data
    const startIndex = (chargersPagination.currentPage - 1) * chargersPagination.itemsPerPage;
    const endIndex = startIndex + chargersPagination.itemsPerPage;
    const pageChargers = filteredChargers.slice(startIndex, endIndex);
    
    if (pageChargers.length === 0) {
        // Show no data message
        tableBody.innerHTML = '<tr><td colspan="9" class="text-center">No chargers found</td></tr>';
        return;
    }
    
    // Get complaints for open count
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    
    // Add chargers to table
    pageChargers.forEach(charger => {
        // Count open complaints for this charger
        const openComplaints = complaints.filter(c => 
            c.chargerID === charger.id && 
            (c.status === 'Open' || c.status === 'In Progress')
        ).length;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${charger.id}</td>
            <td>${charger.serialNumber || 'N/A'}</td>
            <td>${charger.location || 'Unknown'}</td>
            <td>${(charger.make || '') + ' ' + (charger.model || '')}</td>
            <td>${charger.type || 'Unknown'}</td>
            <td><span class="status-badge ${getChargerStatusClass(charger.status)}">${charger.status || 'Unknown'}</span></td>
            <td>${openComplaints}</td>
            <td>${charger.commissionDate ? new Date(charger.commissionDate).toLocaleDateString() : 'N/A'}</td>
            <td>
                <button class="btn btn-sm btn-outline view-charger-btn" data-id="${charger.id}">
                    View
                </button>
                <button class="btn btn-sm btn-primary edit-charger-btn" data-id="${charger.id}">
                    Edit
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners
    tableBody.querySelectorAll('.view-charger-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const chargerId = btn.getAttribute('data-id');
            showChargerDetails(chargerId);
        });
    });
    
    tableBody.querySelectorAll('.edit-charger-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const chargerId = btn.getAttribute('data-id');
            // TO-DO: Implement edit charger functionality
            showToast('info', 'Feature Coming Soon', 'Charger editing will be available in a future update');
        });
    });
}

// Load Division Vendors
function loadDivisionVendors() {
    if (!currentDivision) return;
    
    const tableBody = document.querySelector('#divVendorsTable tbody');
    if (!tableBody) return;
    
    // Clear table
    tableBody.innerHTML = '';
    
    // Get vendors from localStorage
    const vendors = JSON.parse(localStorage.getItem('vendors') || '[]');
    
    // Filter for vendors that serve this division
    const divisionVendors = vendors.filter(v => 
        v.status === 'active' && 
        v.serviceAreas && 
        v.serviceAreas.includes(currentDivision.name)
    );
    
    if (divisionVendors.length === 0) {
        // Show no data message
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No vendors available for your division</td></tr>';
        return;
    }
    
    // Get complaints for vendor stats
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    
    // Add vendors to table
    divisionVendors.forEach(vendor => {
        // Get vendor's complaints for this division
        const vendorComplaints = complaints.filter(c => 
            c.assignedTo === vendor.name && 
            c.division === currentDivision.name
        );
        
        // Count open complaints
        const openTickets = vendorComplaints.filter(c => 
            c.status === 'Open' || c.status === 'In Progress'
        ).length;
        
        // Calculate average resolution time
        let avgResolutionTime = 'N/A';
        const resolvedComplaints = vendorComplaints.filter(c => c.status === 'Resolved');
        
        if (resolvedComplaints.length > 0) {
            let totalHours = 0;
            let count = 0;
            
            resolvedComplaints.forEach(complaint => {
                const createdDate = new Date(complaint.createdDate);
                
                // Find resolution event in timeline
                if (complaint.timeline) {
                    const resolutionEvent = complaint.timeline.find(e => e.status === 'Resolved');
                    if (resolutionEvent) {
                        const resolvedDate = new Date(resolutionEvent.timestamp);
                        const hours = Math.round((resolvedDate - createdDate) / (1000 * 60 * 60));
                        totalHours += hours;
                        count++;
                    }
                }
            });
            
            if (count > 0) {
                const avgHours = Math.round(totalHours / count);
                avgResolutionTime = avgHours < 24 ? `${avgHours} hours` : `${Math.round(avgHours / 24)} days`;
            }
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${vendor.name}</td>
            <td>${vendor.contactPerson || 'N/A'}</td>
            <td>${vendor.email || 'N/A'}</td>
            <td>${vendor.phone || 'N/A'}</td>
            <td>${openTickets}</td>
            <td>${avgResolutionTime}</td>
            <td>
                <button class="btn btn-sm btn-outline view-vendor-btn" data-id="${vendor.id}">
                    View
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners
    tableBody.querySelectorAll('.view-vendor-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const vendorId = btn.getAttribute('data-id');
            // TO-DO: Implement view vendor details
            showToast('info', 'Feature Coming Soon', 'Vendor details will be available in a future update');
        });
    });
}

// Setup Pagination
function setupPagination() {
    // Complaints pagination
    const prevComplaintBtn = document.getElementById('prevDivComplaintPage');
    const nextComplaintBtn = document.getElementById('nextDivComplaintPage');
    
    if (prevComplaintBtn) {
        prevComplaintBtn.addEventListener('click', () => {
            if (complaintsPagination.currentPage > 1) {
                loadFilteredDivisionComplaints(complaintsPagination.currentPage - 1);
            }
        });
    }
    
    if (nextComplaintBtn) {
        nextComplaintBtn.addEventListener('click', () => {
            if (complaintsPagination.currentPage < complaintsPagination.totalPages) {
                loadFilteredDivisionComplaints(complaintsPagination.currentPage + 1);
            }
        });
    }
    
    // Chargers pagination
    const prevChargerBtn = document.getElementById('prevDivChargerPage');
    const nextChargerBtn = document.getElementById('nextDivChargerPage');
    
    if (prevChargerBtn) {
        prevChargerBtn.addEventListener('click', () => {
            if (chargersPagination.currentPage > 1) {
                loadFilteredDivisionChargers(chargersPagination.currentPage - 1);
            }
        });
    }
    
    if (nextChargerBtn) {
        nextChargerBtn.addEventListener('click', () => {
            if (chargersPagination.currentPage < chargersPagination.totalPages) {
                loadFilteredDivisionChargers(chargersPagination.currentPage + 1);
            }
        });
    }
}

// Show Complaint Details
function showComplaintDetails(trackingId) {
    // Get complaint data
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    const complaint = complaints.find(c => c.trackingId === trackingId);
    
    if (!complaint) {
        showToast('error', 'Complaint Not Found', 'The requested complaint information could not be found');
        return;
    }
    
    // Get modal elements
    const modal = document.getElementById('complaintDetailsModal');
    const modalContent = document.getElementById('complaintDetailsContent');
    const actionButtons = document.getElementById('complaintActionButtons');
    
    if (!modal || !modalContent || !actionButtons) return;
    
    // Get charger info
    const chargers = JSON.parse(localStorage.getItem('chargers') || '[]');
    const charger = chargers.find(c => c.id === complaint.chargerID);
    const chargerLocation = charger ? charger.location : 'Unknown Location';
    
    // Build complaint details HTML
    let detailsHTML = `
        <div class="complaint-details-container">
            <div class="complaint-header">
                <div class="tracking-id">Tracking ID: <span class="highlight-text">${complaint.trackingId}</span></div>
                <div class="tracking-status">Status: <span class="status-badge ${getStatusClass(complaint.status)}">${complaint.status}</span></div>
            </div>
            
            <div class="detail-section">
                <h3>Complaint Information</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <div class="detail-label">Charger ID:</div>
                        <div class="detail-value">${complaint.chargerID}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Location:</div>
                        <div class="detail-value">${chargerLocation}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Issue Type:</div>
                        <div class="detail-value">${complaint.type}${complaint.subType ? ` - ${complaint.subType}` : ''}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Reported By:</div>
                        <div class="detail-value">${complaint.consumerName || 'Anonymous'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Contact:</div>
                        <div class="detail-value">${complaint.consumerPhone || 'N/A'} / ${complaint.consumerEmail || 'N/A'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Submitted On:</div>
                        <div class="detail-value">${new Date(complaint.createdDate).toLocaleString()}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Assigned To:</div>
                        <div class="detail-value">${complaint.assignedTo || 'Not Assigned'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Expected Resolution:</div>
                        <div class="detail-value">${complaint.expectedResolutionDate ? new Date(complaint.expectedResolutionDate).toLocaleDateString() : 'Not Specified'}</div>
                    </div>
                </div>
                
                <div class="description-section">
                    <div class="detail-label">Description:</div>
                    <div class="detail-value description">${complaint.description || 'No description provided'}</div>
                </div>
            </div>
            
            <div class="detail-section">
                <h3>Timeline</h3>
                <div class="tracking-timeline">
    `;
    
    // Add timeline events
    if (complaint.timeline && complaint.timeline.length > 0) {
        complaint.timeline.forEach(event => {
            const statusClass = 
                event.status.toLowerCase().includes('resolved') ? 'green' :
                event.status.toLowerCase().includes('progress') ? 'yellow' : 'blue';
            
            detailsHTML += `
                <div class="timeline-item">
                    <div class="timeline-icon ${statusClass}"></div>
                    <div class="timeline-content">
                        <div class="timeline-title">${event.status}</div>
                        <div class="timeline-date">${new Date(event.timestamp).toLocaleString()}</div>
                        <div class="timeline-description">${event.description || ''}</div>
                    </div>
                </div>
            `;
        });
    } else {
        detailsHTML += `
            <div class="timeline-item">
                <div class="timeline-icon"></div>
                <div class="timeline-content">
                    <div class="timeline-title">Complaint Received</div>
                    <div class="timeline-date">${new Date(complaint.createdDate).toLocaleString()}</div>
                    <div class="timeline-description">Complaint has been registered in the system.</div>
                </div>
            </div>
        `;
    }
    
    detailsHTML += `
                </div>
            </div>
        </div>
    `;
    
    // Update modal content
    modalContent.innerHTML = detailsHTML;
    
    // Update action buttons
    let buttonsHTML = `<button type="button" class="btn btn-secondary" id="closeDetailsBtn">Close</button>`;
    
    if (complaint.status !== 'Resolved') {
        buttonsHTML = `
            <button type="button" class="btn btn-primary assign-vendor-modal-btn" data-id="${complaint.trackingId}">
                <i class="fas fa-user-plus"></i> Assign to Vendor
            </button>
            <button type="button" class="btn btn-primary update-status-modal-btn" data-id="${complaint.trackingId}">
                <i class="fas fa-edit"></i> Update Status
            </button>
            ${buttonsHTML}
        `;
    }
    
    actionButtons.innerHTML = buttonsHTML;
    
    // Add event listeners to action buttons
    actionButtons.querySelector('#closeDetailsBtn').addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    const assignVendorBtn = actionButtons.querySelector('.assign-vendor-modal-btn');
    if (assignVendorBtn) {
        assignVendorBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            showAssignToVendorModal(complaint.trackingId);
        });
    }
    
    const updateStatusBtn = actionButtons.querySelector('.update-status-modal-btn');
    if (updateStatusBtn) {
        updateStatusBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            showUpdateStatusModal(complaint.trackingId);
        });
    }
    
    // Show modal
    modal.classList.add('active');
}

// Show Assign to Vendor Modal
function showAssignToVendorModal(trackingId) {
    // Get complaint data
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    const complaint = complaints.find(c => c.trackingId === trackingId);
    
    if (!complaint) {
        showToast('error', 'Complaint Not Found', 'The requested complaint information could not be found');
        return;
    }
    
    // Get modal elements
    const modal = document.getElementById('assignToVendorModal');
    const vendorSelect = document.getElementById('vendorSelect');
    const trackingIdInput = document.getElementById('vendorComplaintTrackingId');
    
    if (!modal || !vendorSelect || !trackingIdInput) return;
    
    // Clear previous selections
    vendorSelect.innerHTML = '<option value="">Select Vendor</option>';
    
    // Set tracking ID
    trackingIdInput.value = trackingId;
    
    // Get vendors from localStorage
    const vendors = JSON.parse(localStorage.getItem('vendors') || '[]');
    
    // Filter for vendors that serve this division
    const divisionVendors = vendors.filter(v => 
        v.status === 'active' && 
        v.serviceAreas && 
        v.serviceAreas.includes(currentDivision.name)
    );
    
    if (divisionVendors.length === 0) {
        vendorSelect.innerHTML += '<option value="" disabled>No vendors available for this division</option>';
    } else {
        // Add vendor options
        divisionVendors.forEach(vendor => {
            vendorSelect.innerHTML += `<option value="${vendor.name}">${vendor.name}</option>`;
        });
    }
    
    // Set default expected resolution date (3 days from now)
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + 3);
    document.getElementById('expectedResolutionDate').valueAsDate = expectedDate;
    
    // Show modal
    modal.classList.add('active');
}

// Handle Assign to Vendor Form Submission
function handleAssignToVendor(e) {
    e.preventDefault();
    
    // Get form data
    const trackingId = document.getElementById('vendorComplaintTrackingId').value;
    const selectedVendor = document.getElementById('vendorSelect').value;
    const assignmentNote = document.getElementById('vendorAssignmentNote').value;
    const expectedResolutionDate = document.getElementById('expectedResolutionDate').value;
    const updateToInProgress = document.getElementById('updateToInProgress').checked;
    
    if (!trackingId || !selectedVendor) {
        showToast('error', 'Required Fields', 'Please select a vendor to assign the complaint');
        return;
    }
    
    // Get complaint data
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    const complaintIndex = complaints.findIndex(c => c.trackingId === trackingId);
    
    if (complaintIndex === -1) {
        showToast('error', 'Complaint Not Found', 'The complaint you are trying to assign could not be found');
        return;
    }
    
    // Update complaint
    const complaint = complaints[complaintIndex];
    complaint.assignedTo = selectedVendor;
    complaint.expectedResolutionDate = expectedResolutionDate || null;
    
    // Update status if checked
    if (updateToInProgress && complaint.status.toLowerCase() !== 'in progress') {
        complaint.status = 'In Progress';
    }
    
    // Add to timeline
    if (!complaint.timeline) {
        complaint.timeline = [];
    }
    
    complaint.timeline.push({
        status: 'Assigned to Vendor',
        timestamp: new Date().toISOString(),
        description: `Complaint assigned to ${selectedVendor}${assignmentNote ? ': ' + assignmentNote : ''}`
    });
    
    complaint.lastUpdated = new Date().toISOString();
    
    // Save updated complaints
    localStorage.setItem('complaints', JSON.stringify(complaints));
    
    // Close modal
    document.getElementById('assignToVendorModal').classList.remove('active');
    
    // Reset form
    document.getElementById('assignToVendorForm').reset();
    
    // Show success message
    showToast('success', 'Complaint Assigned', `Complaint has been assigned to ${selectedVendor}`);
    
    // Refresh complaints tables
    loadDivisionRecentComplaints();
    loadFilteredDivisionComplaints(complaintsPagination.currentPage);
}

// Show Update Status Modal
function showUpdateStatusModal(trackingId) {
    // Get complaint data
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    const complaint = complaints.find(c => c.trackingId === trackingId);
    
    if (!complaint) {
        showToast('error', 'Complaint Not Found', 'The requested complaint information could not be found');
        return;
    }
    
    // Get modal elements
    const modal = document.getElementById('updateStatusModal');
    const currentStatusInfo = document.getElementById('currentStatusInfo');
    const newStatusSelect = document.getElementById('newStatus');
    const trackingIdInput = document.getElementById('statusComplaintId');
    
    if (!modal || !currentStatusInfo || !newStatusSelect || !trackingIdInput) return;
    
    // Update current status info
    currentStatusInfo.innerHTML = `
        <div class="tracking-id">Tracking ID: <span class="highlight-text">${complaint.trackingId}</span></div>
        <div class="tracking-status">Current Status: <span class="status-badge ${getStatusClass(complaint.status)}">${complaint.status}</span></div>
    `;
    
    // Set tracking ID
    trackingIdInput.value = trackingId;
    
    // Clear previous options
    newStatusSelect.innerHTML = '<option value="">Select New Status</option>';
    
    // Define available statuses (exclude current status)
    const statuses = ['Open', 'In Progress', 'Resolved'];
    const availableStatuses = statuses.filter(status => 
        status.toLowerCase() !== complaint.status.toLowerCase()
    );
    
    // Add status options
    availableStatuses.forEach(status => {
        newStatusSelect.innerHTML += `<option value="${status}">${status}</option>`;
    });
    
    // Show modal
    modal.classList.add('active');
}

// Handle Update Status Form Submission
function handleUpdateStatus(e) {
    e.preventDefault();
    
    // Get form data
    const trackingId = document.getElementById('statusComplaintId').value;
    const newStatus = document.getElementById('newStatus').value;
    const statusNote = document.getElementById('statusNote').value;
    
    if (!trackingId || !newStatus) {
        showToast('error', 'Required Fields', 'Please select a new status');
        return;
    }
    
    // Get complaint data
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    const complaintIndex = complaints.findIndex(c => c.trackingId === trackingId);
    
    if (complaintIndex === -1) {
        showToast('error', 'Complaint Not Found', 'The complaint you are trying to update could not be found');
        return;
    }
    
    // Update complaint
    const complaint = complaints[complaintIndex];
    const oldStatus = complaint.status;
    complaint.status = newStatus;
    
    // Add to timeline
    if (!complaint.timeline) {
        complaint.timeline = [];
    }
    
    complaint.timeline.push({
        status: newStatus,
        timestamp: new Date().toISOString(),
        description: statusNote || `Status changed from ${oldStatus} to ${newStatus}`
    });
    
    complaint.lastUpdated = new Date().toISOString();
    
    // Save updated complaints
    localStorage.setItem('complaints', JSON.stringify(complaints));
    
    // Close modal
    document.getElementById('updateStatusModal').classList.remove('active');
    
    // Reset form
    document.getElementById('updateStatusForm').reset();
    
    // Show success message
    showToast('success', 'Status Updated', `Complaint status has been updated to ${newStatus}`);
    
    // Refresh complaints tables
    loadDivisionRecentComplaints();
    loadFilteredDivisionComplaints(complaintsPagination.currentPage);
}

// Show Charger Details
function showChargerDetails(chargerId) {
    // Get charger data
    const chargers = JSON.parse(localStorage.getItem('chargers') || '[]');
    const charger = chargers.find(c => c.id === chargerId);
    
    if (!charger) {
        showToast('error', 'Charger Not Found', 'The requested charger information could not be found');
        return;
    }
    
    // TO-DO: Implement charger details modal
    showToast('info', 'Feature Coming Soon', 'Charger details will be available in a future update');
}

// Helper function to get status class
function getStatusClass(status) {
    if (!status) return '';
    
    switch(status.toLowerCase()) {
        case 'open': return 'red';
        case 'in progress': return 'yellow';
        case 'resolved': return 'green';
        default: return '';
    }
}

// Helper function to get charger status class
function getChargerStatusClass(status) {
    if (!status) return '';
    
    switch(status.toLowerCase()) {
        case 'active': return 'green';
        case 'inactive': return 'red';
        case 'maintenance': return 'yellow';
        default: return '';
    }
}