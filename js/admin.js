// EV Charging Complaint Management System - Admin JavaScript

// When DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in and has admin role
    checkAdminAuthStatus();
    
    // Setup admin dashboard
    setupAdminDashboard();
    
    // Setup toast notification system
    setupToastSystem();
});

// Check Admin Authentication Status
function checkAdminAuthStatus() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    
    if (!currentUser) {
        // Not logged in, redirect to login page
        window.location.href = 'index.html';
        return;
    }
    
    if (currentUser.role !== 'admin') {
        // Not an admin, redirect to login page
        window.location.href = 'index.html';
        return;
    }
    
    // Update user display name
    const userNameElement = document.querySelector('.user-name');
    if (userNameElement) {
        userNameElement.textContent = currentUser.name || 'Admin User';
    }
}

// Setup Admin Dashboard
function setupAdminDashboard() {
    // Set up logout button
    const logoutBtn = document.getElementById('adminLogoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Initialize sidebar navigation
    initializeSidebarNavigation();
    
    // Initialize notifications
    initializeNotifications();
    
    // Load dashboard statistics
    updateDashboardStats();
    
    // Load recent complaints table
    loadRecentComplaints();
    
    // Setup vendor management
    setupVendorManagement();
    
    // Setup division management
    setupDivisionManagement();
    
    // Setup charger management
    setupChargerManagement();
    
    // Setup all complaints management
    setupComplaintsManagement();
    
    // Setup settings management
    setupSettingsManagement();
}

// Logout Function
function logout() {
    // Clear session storage
    sessionStorage.removeItem('currentUser');
    
    // Redirect to login page
    window.location.href = 'index.html';
}

// Initialize Sidebar Navigation
function initializeSidebarNavigation() {
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    const dashboardSections = document.querySelectorAll('.dashboard-section');
    
    sidebarItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Get target section
            const targetSection = item.getAttribute('data-section');
            
            // Update active sidebar item
            sidebarItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            // Show target section, hide others
            dashboardSections.forEach(section => {
                if (section.id === targetSection + 'Section') {
                    section.classList.remove('hidden');
                } else {
                    section.classList.add('hidden');
                }
            });
            
            // Special handling for All Complaints tab
            if (targetSection === 'allComplaints') {
                loadFilteredComplaints();
            }
        });
    });
}

// Initialize Notifications
function initializeNotifications() {
    updateNotificationCount();
    
    const notificationBell = document.querySelector('.notification-bell');
    if (notificationBell) {
        notificationBell.addEventListener('click', showNotifications);
    }
}

// Toast Notification System
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

// Update Notification Badge
function updateNotificationCount() {
    const notificationBadge = document.querySelector('.notification-badge');
    if (!notificationBadge) return;
    
    // Get new complaints in the last 24 hours
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const newComplaints = complaints.filter(c => {
        const complaintDate = new Date(c.createdDate);
        return complaintDate >= yesterday;
    });
    
    const count = newComplaints.length;
    
    // Update badge
    notificationBadge.textContent = count;
    notificationBadge.style.display = count > 0 ? 'flex' : 'none';
}

// Show Notifications Dropdown
function showNotifications() {
    // Get new complaints in the last 24 hours
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const newComplaints = complaints.filter(c => {
        const complaintDate = new Date(c.createdDate);
        return complaintDate >= yesterday;
    }).sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
    
    // Create notification dropdown
    let notificationDropdown = document.getElementById('notificationDropdown');
    
    if (!notificationDropdown) {
        notificationDropdown = document.createElement('div');
        notificationDropdown.id = 'notificationDropdown';
        notificationDropdown.className = 'notifications-dropdown';
        document.body.appendChild(notificationDropdown);
    }
    
    // Position dropdown relative to notification bell
    const bell = document.querySelector('.notification-bell');
    if (bell) {
        const bellRect = bell.getBoundingClientRect();
        notificationDropdown.style.position = 'fixed';
        notificationDropdown.style.top = `${bellRect.bottom + 5}px`;
        notificationDropdown.style.right = `${window.innerWidth - bellRect.right + 10}px`;
    }
    
    // Generate notification content
    let notificationHTML = `
        <div class="notifications-header">
            <h3>Notifications</h3>
            <button id="markAllReadBtn" class="btn btn-sm btn-outline">Mark All Read</button>
        </div>
        <div class="notifications-body">
    `;
    
    if (newComplaints.length === 0) {
        notificationHTML += `<div class="no-notifications">No new notifications</div>`;
    } else {
        newComplaints.slice(0, 5).forEach(complaint => {
            notificationHTML += `
                <div class="notification-item">
                    <div class="notification-icon blue">
                        <i class="fas fa-file-alt"></i>
                    </div>
                    <div class="notification-content">
                        <div class="notification-title">New Complaint Filed</div>
                        <div class="notification-details">Tracking ID: ${complaint.trackingId}</div>
                        <div class="notification-time">${timeAgo(new Date(complaint.createdDate))}</div>
                    </div>
                    <button class="notification-action btn-sm btn-outline" data-id="${complaint.trackingId}">
                        View
                    </button>
                </div>
            `;
        });
    }
    
    notificationHTML += `</div>`;
    
    notificationDropdown.innerHTML = notificationHTML;
    notificationDropdown.classList.add('active');
    
    // Add event listener to close when clicking outside
    document.addEventListener('click', function closeNotifications(e) {
        if (!notificationDropdown.contains(e.target) && 
            !e.target.closest('.notification-bell')) {
            notificationDropdown.classList.remove('active');
            document.removeEventListener('click', closeNotifications);
        }
    });
    
    // Add event listeners to notification actions
    const actionButtons = notificationDropdown.querySelectorAll('.notification-action');
    actionButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const complaintId = btn.getAttribute('data-id');
            showComplaintDetails(complaintId);
            notificationDropdown.classList.remove('active');
        });
    });
    
    // Mark all read button
    const markAllReadBtn = document.getElementById('markAllReadBtn');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', () => {
            updateNotificationCount();
            notificationDropdown.classList.remove('active');
        });
    }
}

// Helper function to format time ago
function timeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval > 1) return interval + ' years ago';
    
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) return interval + ' months ago';
    
    interval = Math.floor(seconds / 86400);
    if (interval > 1) return interval + ' days ago';
    
    interval = Math.floor(seconds / 3600);
    if (interval > 1) return interval + ' hours ago';
    
    interval = Math.floor(seconds / 60);
    if (interval > 1) return interval + ' minutes ago';
    
    if(seconds < 10) return 'just now';
    
    return Math.floor(seconds) + ' seconds ago';
}

// Dashboard Statistics Update
function updateDashboardStats() {
    const chargers = JSON.parse(localStorage.getItem('chargers') || '[]');
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    const divisions = JSON.parse(localStorage.getItem('divisions') || '[]');
    const vendors = JSON.parse(localStorage.getItem('vendors') || '[]');
    
    // Total Chargers
    document.getElementById('totalChargersCount').textContent = chargers.length;
    
    // Active Users (sum of divisions and vendors)
    const activeUsers = divisions.length + vendors.length;
    document.getElementById('activeUsersCount').textContent = activeUsers;
    
    // Open Complaints
    const openComplaints = complaints.filter(c => 
        c.status && (c.status.toLowerCase() === 'open' || c.status.toLowerCase() === 'in progress')
    ).length;
    document.getElementById('openComplaintsCount').textContent = openComplaints;
    
    // Resolution Rate
    const resolvedComplaints = complaints.filter(c => c.status && c.status.toLowerCase() === 'resolved').length;
    const resolutionRate = complaints.length > 0 
        ? Math.round((resolvedComplaints / complaints.length) * 100) 
        : 0;
    document.getElementById('resolutionRateValue').textContent = `${resolutionRate}%`;
    
    // Trend indicators (using small random values for demonstration)
    document.getElementById('chargersChange').textContent = '+' + Math.floor(Math.random() * 5 + 1);
    document.getElementById('usersChange').textContent = '+' + Math.floor(Math.random() * 3 + 1);
    document.getElementById('complaintsChange').textContent = '+' + Math.floor(Math.random() * 10 + 1);
    document.getElementById('resolutionChange').textContent = '+' + Math.floor(Math.random() * 3 + 1) + '%';
}

// Load Recent Complaints
function loadRecentComplaints() {
    const tableBody = document.querySelector('#recentComplaintsTable tbody');
    if (!tableBody) return;
    
    // Clear table
    tableBody.innerHTML = '';
    
    // Get complaints
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    
    // Sort by date (newest first) and take top 5
    const recentComplaints = complaints
        .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate))
        .slice(0, 5);
    
    if (recentComplaints.length === 0) {
        // Show no data message
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No complaints found</td></tr>';
        return;
    }
    
    // Add complaints to table
    recentComplaints.forEach(complaint => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${complaint.trackingId}</td>
            <td>${complaint.chargerID}</td>
            <td>${complaint.division || 'Unassigned'}</td>
            <td>${complaint.type}</td>
            <td><span class="status-badge ${getStatusClass(complaint.status)}">${complaint.status}</span></td>
            <td>${new Date(complaint.createdDate).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-sm btn-outline view-complaint-btn" data-id="${complaint.trackingId}">
                    View Details
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
    
    // View all complaints link
    const viewAllLink = document.getElementById('viewAllComplaintsLink');
    if (viewAllLink) {
        viewAllLink.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Switch to all complaints tab
            const allComplaintsTab = document.querySelector('.sidebar-item[data-section="allComplaints"]');
            if (allComplaintsTab) {
                allComplaintsTab.click();
            }
        });
    }
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

// Show Complaint Details
function showComplaintDetails(trackingId) {
    // Get complaint data
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    const complaint = complaints.find(c => c.trackingId === trackingId);
    
    if (!complaint) {
        showToast('error', 'Complaint Not Found', 'The requested complaint information could not be found');
        return;
    }
    
    // Get modal
    const complaintModal = document.getElementById('complaintDetailsModal');
    if (!complaintModal) return;
    
    // Get charger info if available
    const chargers = JSON.parse(localStorage.getItem('chargers') || '[]');
    const charger = chargers.find(c => c.id === complaint.chargerID);
    const chargerLocation = charger ? charger.location : 'Unknown Location';
    
    // Update modal body
    const modalBody = complaintModal.querySelector('.modal-body');
    
    modalBody.innerHTML = `
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
                        <div class="detail-label">Division:</div>
                        <div class="detail-value">${complaint.division || 'Unassigned'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Issue Type:</div>
                        <div class="detail-value">${complaint.type}${complaint.subType ? ` - ${complaint.subType}` : ''}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Reported By:</div>
                        <div class="detail-value">${complaint.consumerName}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Contact:</div>
                        <div class="detail-value">${complaint.consumerPhone} / ${complaint.consumerEmail || 'N/A'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Submitted On:</div>
                        <div class="detail-value">${new Date(complaint.createdDate).toLocaleString()}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Assigned To:</div>
                        <div class="detail-value">${complaint.assignedTo || 'Not Assigned'}</div>
                    </div>
                </div>
                
                <div class="description-section">
                    <div class="detail-label">Description:</div>
                    <div class="detail-value description">${complaint.description}</div>
                </div>
            </div>
            
            <div class="detail-section">
                <h3>Timeline</h3>
                <div class="tracking-timeline">
    `;
    
    // Add timeline events
    if (complaint.timeline && complaint.timeline.length > 0) {
        complaint.timeline.forEach((event, index) => {
            const statusClass = 
                event.status.toLowerCase().includes('resolved') ? 'green' :
                event.status.toLowerCase().includes('progress') ? 'yellow' : 'blue';
            
            modalBody.innerHTML += `
                <div class="timeline-item">
                    <div class="timeline-icon ${statusClass}"></div>
                    <div class="timeline-content">
                        <div class="timeline-title">${event.status}</div>
                        <div class="timeline-date">${new Date(event.timestamp).toLocaleString()}</div>
                        <div class="timeline-description">${event.description}</div>
                    </div>
                </div>
            `;
        });
    } else {
        modalBody.innerHTML += `
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
    
    // Close timeline and detail sections
    modalBody.innerHTML += `
                </div>
            </div>
        </div>
    `;
    
    // Update action buttons based on complaint status
    const assignBtn = document.getElementById('assignComplaintBtn');
    const updateStatusBtn = document.getElementById('updateStatusBtn');
    
    if (assignBtn) {
        if (complaint.status.toLowerCase() === 'resolved') {
            assignBtn.style.display = 'none';
        } else {
            assignBtn.style.display = 'block';
            assignBtn.addEventListener('click', () => {
                complaintModal.classList.remove('active');
                showAssignToDivisionModal(complaint.trackingId);
            });
        }
    }
    
    if (updateStatusBtn) {
        if (complaint.status.toLowerCase() === 'resolved') {
            updateStatusBtn.style.display = 'none';
        } else {
            updateStatusBtn.style.display = 'block';
            updateStatusBtn.addEventListener('click', () => {
                complaintModal.classList.remove('active');
                showUpdateStatusModal(complaint.trackingId);
            });
        }
    }
    
    // Show modal
    complaintModal.classList.add('active');
    
    // Setup close button handlers
    const closeButtons = complaintModal.querySelectorAll('#closeComplaintModal, #closeDetailsBtn');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            complaintModal.classList.remove('active');
        });
    });
}

// Show Assign To Division Modal
function showAssignToDivisionModal(trackingId) {
    // Get complaint data
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    const complaintIndex = complaints.findIndex(c => c.trackingId === trackingId);
    
    if (complaintIndex === -1) {
        showToast('error', 'Complaint Not Found', 'The requested complaint information could not be found');
        return;
    }
    
    // Get modal
    const assignModal = document.getElementById('assignToDivisionModal');
    if (!assignModal) return;
    
    // Get divisions
    const divisions = JSON.parse(localStorage.getItem('divisions') || '[]');
    const activeDivisions = divisions.filter(d => d.status === 'active');
    
    // Populate division select
    const divisionSelect = document.getElementById('divisionSelect');
    if (divisionSelect) {
        // Clear existing options except first
        while (divisionSelect.options.length > 1) {
            divisionSelect.remove(1);
        }
        
        // Add division options
        activeDivisions.forEach(division => {
            const option = document.createElement('option');
            option.value = division.name;
            option.textContent = division.name;
            divisionSelect.appendChild(option);
        });
    }
    
    // Set complaint tracking ID
    document.getElementById('complaintTrackingId').value = trackingId;
    
    // Show modal
    assignModal.classList.add('active');
    
    // Setup close buttons
    const closeButtons = assignModal.querySelectorAll('#closeAssignModal, #cancelAssignBtn');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            assignModal.classList.remove('active');
        });
    });
    
    // Setup form submission
    const assignForm = document.getElementById('assignToDivisionForm');
    if (assignForm) {
        // Remove existing listeners
        const newForm = assignForm.cloneNode(true);
        assignForm.parentNode.replaceChild(newForm, assignForm);
        
        // Add new listener
        newForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const selectedDivision = document.getElementById('divisionSelect').value;
            const assignmentNote = document.getElementById('assignmentNote').value;
            const updateStatus = document.getElementById('updateStatusToInProgress').checked;
            const complaintId = document.getElementById('complaintTrackingId').value;
            
            if (!selectedDivision) {
                showToast('error', 'Division Required', 'Please select a division');
                return;
            }
            
            // Update complaint
            const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
            const complaintIndex = complaints.findIndex(c => c.trackingId === complaintId);
            
            if (complaintIndex === -1) {
                showToast('error', 'Complaint Not Found', 'The complaint could not be found');
                return;
            }
            
            const complaint = complaints[complaintIndex];
            complaint.division = selectedDivision;
            
            if (updateStatus) {
                const prevStatus = complaint.status;
                complaint.status = 'In Progress';
                
                // Add to timeline
                if (!complaint.timeline) {
                    complaint.timeline = [];
                }
                
                complaint.timeline.push({
                    status: 'In Progress',
                    timestamp: new Date().toISOString(),
                    description: `Complaint assigned to ${selectedDivision}${assignmentNote ? ': ' + assignmentNote : ''}`
                });
            } else {
                // Add assignment to timeline even if status not changed
                if (!complaint.timeline) {
                    complaint.timeline = [];
                }
                
                complaint.timeline.push({
                    status: complaint.status,
                    timestamp: new Date().toISOString(),
                    description: `Complaint assigned to ${selectedDivision}${assignmentNote ? ': ' + assignmentNote : ''}`
                });
            }
            
            complaint.lastUpdated = new Date().toISOString();
            
            // Save updated complaints
            localStorage.setItem('complaints', JSON.stringify(complaints));
            
            // Close modal
            assignModal.classList.remove('active');
            
            // Show success message
            showToast('success', 'Complaint Assigned', `Complaint has been assigned to ${selectedDivision}`);
            
            // Refresh tables
            loadFilteredComplaints();
            loadRecentComplaints();
            updateNotificationCount();
        });
    }
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
    
    // Get modal
    const statusModal = document.getElementById('updateStatusModal');
    if (!statusModal) return;
    
    // Update tracking ID and current status
    document.getElementById('statusTrackingId').textContent = trackingId;
    const currentStatusBadge = document.getElementById('currentStatusBadge');
    currentStatusBadge.textContent = complaint.status;
    currentStatusBadge.className = 'status-badge ' + getStatusClass(complaint.status);
    
    // Populate status options
    const newStatusSelect = document.getElementById('newStatus');
    if (newStatusSelect) {
        // Clear existing options except first
        while (newStatusSelect.options.length > 1) {
            newStatusSelect.remove(1);
        }
        
        // Define available statuses (exclude current status)
        const statuses = ['Open', 'In Progress', 'Resolved'];
        const availableStatuses = statuses.filter(status => 
            status.toLowerCase() !== complaint.status.toLowerCase()
        );
        
        // Add status options
        availableStatuses.forEach(status => {
            const option = document.createElement('option');
            option.value = status;
            option.textContent = status;
            newStatusSelect.appendChild(option);
        });
    }
    
    // Show modal
    statusModal.classList.add('active');
    
    // Setup close buttons
    const closeButtons = statusModal.querySelectorAll('#closeStatusModal, #cancelStatusBtn');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            statusModal.classList.remove('active');
        });
    });
    
    // Setup form submission
    const statusForm = document.getElementById('updateStatusForm');
    if (statusForm) {
        // Remove existing listeners
        const newForm = statusForm.cloneNode(true);
        statusForm.parentNode.replaceChild(newForm, statusForm);
        
        // Add new listener
        newForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const newStatus = document.getElementById('newStatus').value;
            const statusNote = document.getElementById('statusNote').value;
            
            if (!newStatus) {
                showToast('error', 'Status Required', 'Please select a new status');
                return;
            }
            
            // Update complaint
            const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
            const complaintIndex = complaints.findIndex(c => c.trackingId === trackingId);
            
            if (complaintIndex === -1) {
                showToast('error', 'Complaint Not Found', 'The complaint could not be found');
                return;
            }
            
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
            statusModal.classList.remove('active');
            
            // Show success message
            showToast('success', 'Status Updated', `Complaint status has been updated to ${newStatus}`);
            
            // Refresh tables
            loadFilteredComplaints();
            loadRecentComplaints();
            updateNotificationCount();
        });
    }
}

// Setup Vendor Management
function setupVendorManagement() {
    // Add Vendor Button
    const addVendorBtn = document.getElementById('addVendorBtn');
    if (addVendorBtn) {
        addVendorBtn.addEventListener('click', () => {
            // Populate service areas in the form
            populateServiceAreas();
            
            // Reset form to add mode
            resetVendorForm();
            
            // Show modal
            document.getElementById('addVendorModal').classList.add('active');
        });
    }
    
    // Close Vendor Modal
    const closeVendorModal = document.getElementById('closeVendorModal');
    const cancelVendorBtn = document.getElementById('cancelVendorBtn');
    
    if (closeVendorModal) {
        closeVendorModal.addEventListener('click', () => {
            document.getElementById('addVendorModal').classList.remove('active');
        });
    }
    
    if (cancelVendorBtn) {
        cancelVendorBtn.addEventListener('click', () => {
            document.getElementById('addVendorModal').classList.remove('active');
        });
    }
    
    // Add Vendor Form Submission
    const addVendorForm = document.getElementById('addVendorForm');
    if (addVendorForm) {
        addVendorForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form data
            const vendorName = document.getElementById('vendorName').value;
            const contactPerson = document.getElementById('contactPerson').value;
            const vendorEmail = document.getElementById('vendorEmail').value;
            const vendorPhone = document.getElementById('vendorPhone').value;
            const vendorAddress = document.getElementById('vendorAddress').value;
            const vendorUsername = document.getElementById('vendorUsername').value;
            const vendorPassword = document.getElementById('vendorPassword').value;
            const vendorStatus = document.getElementById('vendorStatus').value;
            
            // Get selected service areas
            const serviceAreas = [];
            const checkboxes = document.querySelectorAll('#vendorServiceAreas input[type="checkbox"]:checked');
            checkboxes.forEach(checkbox => {
                serviceAreas.push(checkbox.value);
            });
            
            if (serviceAreas.length === 0) {
                showToast('error', 'Validation Error', 'Please select at least one service area');
                return;
            }
            
            // Check if this is an edit operation
            const isEditing = addVendorForm.hasAttribute('data-vendor-id');
            const vendorId = addVendorForm.getAttribute('data-vendor-id');
            
            // Get vendors list
            const vendors = JSON.parse(localStorage.getItem('vendors') || '[]');
            
            if (isEditing) {
                // Editing existing vendor
                const vendorIndex = vendors.findIndex(v => v.id === vendorId);
                if (vendorIndex === -1) {
                    showToast('error', 'Vendor Not Found', 'The vendor you are trying to edit could not be found');
                    return;
                }
                
                const originalName = vendors[vendorIndex].name;
                
                // Update vendor object
                vendors[vendorIndex] = {
                    ...vendors[vendorIndex],
                    name: vendorName,
                    contactPerson,
                    email: vendorEmail,
                    phone: vendorPhone,
                    address: vendorAddress,
                    serviceAreas,
                    status: vendorStatus,
                    lastUpdated: new Date().toISOString()
                };
                
                // Save updated vendors
                localStorage.setItem('vendors', JSON.stringify(vendors));
                
                // Update system users if name changed
                if (originalName !== vendorName) {
                    updateVendorUserName(originalName, vendorName);
                    updateVendorNameInComplaints(originalName, vendorName);
                }
                
                // Show success message
                showToast('success', 'Vendor Updated', `${vendorName} has been successfully updated`);
                
            } else {
                // Creating new vendor
                
                // Check for duplicates
                if (vendors.some(v => v.name.toLowerCase() === vendorName.toLowerCase())) {
                    showToast('error', 'Duplicate Vendor', `A vendor with the name "${vendorName}" already exists`);
                    return;
                }
                
                // Create new vendor object
                const newVendor = {
                    id: 'ven' + Date.now().toString().slice(-6),
                    name: vendorName,
                    contactPerson,
                    email: vendorEmail,
                    phone: vendorPhone,
                    address: vendorAddress,
                    serviceAreas,
                    status: vendorStatus,
                    createdDate: new Date().toISOString()
                };
                
                // Add to vendors list
                vendors.push(newVendor);
                localStorage.setItem('vendors', JSON.stringify(vendors));
                
                // Add vendor user account
                const systemUsers = JSON.parse(localStorage.getItem('systemUsers') || '{}');
                if (!systemUsers.vendors) {
                    systemUsers.vendors = [];
                }
                
                // Check if username exists
                if (systemUsers.vendors.some(u => u.username === vendorUsername)) {
                    showToast('error', 'Username Taken', `The username "${vendorUsername}" is already in use`);
                    return;
                }
                
                systemUsers.vendors.push({
                    username: vendorUsername,
                    password: vendorPassword,
                    name: vendorName,
                    role: 'vendor'
                });
                
                localStorage.setItem('systemUsers', JSON.stringify(systemUsers));
                
                // Show success message
                showToast('success', 'Vendor Added', `${vendorName} has been successfully added to the system`);
            }
            
            // Close modal and reset form
            document.getElementById('addVendorModal').classList.remove('active');
            resetVendorForm();
            
            // Refresh vendors table
            loadVendorsTable();
            
            // Update dashboard stats
            updateDashboardStats();
        });
    }
    
    // Load Vendors Table
    loadVendorsTable();
}

// Update Vendor User Name
function updateVendorUserName(oldName, newName) {
    const systemUsers = JSON.parse(localStorage.getItem('systemUsers') || '{}');
    
    if (systemUsers.vendors) {
        const vendorUserIndex = systemUsers.vendors.findIndex(u => u.name === oldName);
        
        if (vendorUserIndex >= 0) {
            systemUsers.vendors[vendorUserIndex].name = newName;
            localStorage.setItem('systemUsers', JSON.stringify(systemUsers));
        }
    }
}

// Update Vendor Name In Complaints
function updateVendorNameInComplaints(oldName, newName) {
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    let complaintsUpdated = false;
    
    complaints.forEach(complaint => {
        if (complaint.assignedTo === oldName) {
            complaint.assignedTo = newName;
            complaintsUpdated = true;
            
            // Also update timeline entries if applicable
            if (complaint.timeline && Array.isArray(complaint.timeline)) {
                complaint.timeline.forEach(entry => {
                    if (entry.description && entry.description.includes(oldName)) {
                        entry.description = entry.description.replace(oldName, newName);
                    }
                });
            }
        }
    });
    
    if (complaintsUpdated) {
        localStorage.setItem('complaints', JSON.stringify(complaints));
    }
}


// Populate Service Areas
function populateServiceAreas() {
    const serviceAreasContainer = document.getElementById('vendorServiceAreas');
    if (!serviceAreasContainer) return;
    
    // Clear existing options
    serviceAreasContainer.innerHTML = '';
    
    // Get divisions
    const divisions = JSON.parse(localStorage.getItem('divisions') || '[]');
    
    if (divisions.length === 0) {
        // No divisions available, show a message
        serviceAreasContainer.innerHTML = '<p class="no-vendors-message">No divisions available. Please create divisions first.</p>';
        return;
    }
    
    // Add checkbox for each division
    divisions.filter(d => d.status === 'active').forEach(division => {
        const checkbox = document.createElement('div');
        checkbox.className = 'checkbox-label';
        
        checkbox.innerHTML = `
            <input type="checkbox" id="area-${division.id}" name="serviceAreas" value="${division.name}">
            <label for="area-${division.id}">${division.name}</label>
        `;
        
        serviceAreasContainer.appendChild(checkbox);
    });
}

// Reset Vendor Form
function resetVendorForm() {
    const form = document.getElementById('addVendorForm');
    if (!form) return;
    
    // Reset form
    form.reset();
    
    // Reset form title
    const modalTitle = document.querySelector('#addVendorModal .modal-title');
    if (modalTitle) {
        modalTitle.textContent = 'Add New Vendor';
    }
    
    // Reset submit button text
    const submitButton = document.querySelector('#addVendorForm button[type="submit"]');
    if (submitButton) {
        submitButton.textContent = 'Create Vendor';
    }
    
    // Show username and password fields
    const usernameField = document.querySelector('#addVendorForm .form-row:nth-of-type(3)');
    if (usernameField) {
        usernameField.style.display = 'flex';
    }
    
    // Remove data attributes
    form.removeAttribute('data-vendor-id');
}

// Load Vendors Table
function loadVendorsTable() {
    const tableBody = document.querySelector('#vendorsTable tbody');
    if (!tableBody) return;
    
    // Clear table
    tableBody.innerHTML = '';
    
    // Get vendors
    const vendors = JSON.parse(localStorage.getItem('vendors') || '[]');
    
    if (vendors.length === 0) {
        // Show no data message
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center">No vendors found</td></tr>';
        return;
    }
    
    // Add vendors to table
    vendors.forEach(vendor => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${vendor.id}</td>
            <td>${vendor.name}</td>
            <td>${vendor.contactPerson}</td>
            <td>${vendor.email}</td>
            <td>${vendor.phone}</td>
            <td>${vendor.serviceAreas ? vendor.serviceAreas.join(', ') : ''}</td>
            <td><span class="status-badge ${vendor.status === 'active' ? 'green' : 'red'}">${vendor.status}</span></td>
            <td>
                <button class="btn btn-sm btn-outline vendor-view-btn" data-id="${vendor.id}">
                    View
                </button>
                <button class="btn btn-sm btn-primary vendor-edit-btn" data-id="${vendor.id}">
                    Edit
                </button>
                <button class="btn btn-sm btn-danger vendor-delete-btn" data-id="${vendor.id}">
                    Delete
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to buttons
    tableBody.querySelectorAll('.vendor-view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const vendorId = btn.getAttribute('data-id');
            showVendorDetails(vendorId);
        });
    });
    
    tableBody.querySelectorAll('.vendor-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const vendorId = btn.getAttribute('data-id');
            if (confirm('Are you sure you want to delete this vendor?')) {
                deleteVendor(vendorId);
            }
        });
    });

    tableBody.querySelectorAll('.vendor-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const vendorId = btn.getAttribute('data-id');
            showEditVendorModal(vendorId);
        });
    });
}

// Show Vendor Details
function showVendorDetails(vendorId) {
    // Get vendor data
    const vendors = JSON.parse(localStorage.getItem('vendors') || '[]');
    const vendor = vendors.find(v => v.id === vendorId);
    
    if (!vendor) {
        showToast('error', 'Vendor Not Found', 'The requested vendor information could not be found');
        return;
    }
    
    // Create modal if doesn't exist
    let vendorModal = document.getElementById('vendorDetailsModal');
    
    if (!vendorModal) {
        vendorModal = document.createElement('div');
        vendorModal.id = 'vendorDetailsModal';
        vendorModal.className = 'modal';
        document.body.appendChild(vendorModal);
    }
    
    // Get vendor stats
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    const vendorComplaints = complaints.filter(c => c.assignedTo === vendor.name);
    
    const openComplaints = vendorComplaints.filter(c => 
        c.status.toLowerCase() === 'open' || c.status.toLowerCase() === 'in progress'
    ).length;
    
    const resolvedComplaints = vendorComplaints.filter(c => 
        c.status.toLowerCase() === 'resolved'
    ).length;
    
    // Create modal content
    vendorModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">${vendor.name} Details</h2>
                <button class="modal-close" id="closeVendorDetailsModal">×</button>
            </div>
            <div class="modal-body">
                <div class="detail-section">
                    <h3>Vendor Information</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <div class="detail-label">Vendor ID:</div>
                            <div class="detail-value">${vendor.id}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Contact Person:</div>
                            <div class="detail-value">${vendor.contactPerson}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Email:</div>
                            <div class="detail-value">${vendor.email}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Phone:</div>
                            <div class="detail-value">${vendor.phone}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Address:</div>
                            <div class="detail-value">${vendor.address}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Service Areas:</div>
                            <div class="detail-value">${vendor.serviceAreas ? vendor.serviceAreas.join(', ') : 'None'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Status:</div>
                            <div class="detail-value">
                                <span class="status-badge ${vendor.status === 'active' ? 'green' : 'red'}">
                                    ${vendor.status}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h3>Vendor Statistics</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <div class="detail-label">Open Complaints:</div>
                            <div class="detail-value">${openComplaints}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Resolved Complaints:</div>
                            <div class="detail-value">${resolvedComplaints}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Total Complaints:</div>
                            <div class="detail-value">${vendorComplaints.length}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" id="editVendorDetailsBtn" data-id="${vendor.id}">Edit Vendor</button>
                <button class="btn btn-secondary" id="closeVendorDetailsBtn">Close</button>
            </div>
        </div>
    `;
    
    // Show modal
    vendorModal.classList.add('active');
    
    // Add event listeners for buttons
    document.getElementById('closeVendorDetailsModal').addEventListener('click', () => {
        vendorModal.classList.remove('active');
    });
    
    document.getElementById('closeVendorDetailsBtn').addEventListener('click', () => {
        vendorModal.classList.remove('active');
    });
    
    document.getElementById('editVendorDetailsBtn').addEventListener('click', () => {
        vendorModal.classList.remove('active');
        showEditVendorModal(vendor.id);
    });
}

// Show Edit Vendor Modal
function showEditVendorModal(vendorId) {
    // Get vendor data
    const vendors = JSON.parse(localStorage.getItem('vendors') || '[]');
    const vendor = vendors.find(v => v.id === vendorId);
    
    if (!vendor) {
        showToast('error', 'Vendor Not Found', 'The requested vendor information could not be found');
        return;
    }
    
    // Populate service areas in the form
    populateServiceAreas();
    
    // Fill form with vendor data
    document.getElementById('vendorName').value = vendor.name;
    document.getElementById('contactPerson').value = vendor.contactPerson;
    document.getElementById('vendorEmail').value = vendor.email;
    document.getElementById('vendorPhone').value = vendor.phone;
    document.getElementById('vendorAddress').value = vendor.address;
    document.getElementById('vendorStatus').value = vendor.status;
    
    // Check service areas
    setTimeout(() => {
        vendor.serviceAreas.forEach(area => {
            const checkbox = document.querySelector(`input[name="serviceAreas"][value="${area}"]`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
    }, 100);
    
    // Change form title to indicate editing
    const modalTitle = document.querySelector('#addVendorModal .modal-title');
    if (modalTitle) {
        modalTitle.textContent = 'Edit Vendor';
    }
    
    // Change submit button text
    const submitButton = document.querySelector('#addVendorForm button[type="submit"]');
    if (submitButton) {
        submitButton.textContent = 'Update Vendor';
    }
    
    // Hide username and password fields
    const usernameField = document.querySelector('#addVendorForm .form-row:nth-of-type(3)');
    if (usernameField) {
        usernameField.style.display = 'none';
    }
    
    // Store vendor ID for updating
    document.getElementById('addVendorForm').setAttribute('data-vendor-id', vendorId);
    
    // Show modal
    document.getElementById('addVendorModal').classList.add('active');
}

// Delete Vendor
function deleteVendor(vendorId) {
    const vendors = JSON.parse(localStorage.getItem('vendors') || '[]');
    const vendorToDelete = vendors.find(v => v.id === vendorId);
    
    if (!vendorToDelete) {
        showToast('error', 'Vendor Not Found', 'The vendor you are trying to delete could not be found');
        return;
    }
    
    // Check if vendor has assigned complaints
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    const assignedComplaints = complaints.filter(c => c.assignedTo === vendorToDelete.name);
    
    if (assignedComplaints.length > 0) {
        showToast('error', 'Cannot Delete', 'This vendor has assigned complaints. Please reassign or resolve them first.');
        return;
    }
    
    const updatedVendors = vendors.filter(v => v.id !== vendorId);
    
    // Remove vendor from system users
    const systemUsers = JSON.parse(localStorage.getItem('systemUsers') || '{}');
    if (systemUsers.vendors) {
        systemUsers.vendors = systemUsers.vendors.filter(u => u.name !== vendorToDelete.name);
        localStorage.setItem('systemUsers', JSON.stringify(systemUsers));
    }
    
    localStorage.setItem('vendors', JSON.stringify(updatedVendors));
    showToast('success', 'Vendor Deleted', 'Vendor has been successfully removed');
    loadVendorsTable();
}

// Setup Division Management
function setupDivisionManagement() {
    // Add Division Button
    const addDivisionBtn = document.getElementById('addDivisionBtn');
    if (addDivisionBtn) {
        addDivisionBtn.addEventListener('click', () => {
            // Reset form to add mode
            resetDivisionForm();
            // Show modal
            document.getElementById('addDivisionModal').classList.add('active');
        });
    }
    
    // Close Division Modal
    const closeDivisionModal = document.getElementById('closeDivisionModal');
    const cancelDivisionBtn = document.getElementById('cancelDivisionBtn');
    
    if (closeDivisionModal) {
        closeDivisionModal.addEventListener('click', () => {
            document.getElementById('addDivisionModal').classList.remove('active');
        });
    }
    
    if (cancelDivisionBtn) {
        cancelDivisionBtn.addEventListener('click', () => {
            document.getElementById('addDivisionModal').classList.remove('active');
        });
    }
    
    // Add Division Form Submission
    const addDivisionForm = document.getElementById('addDivisionForm');
    if (addDivisionForm) {
        addDivisionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form data
            const divisionName = document.getElementById('divisionName').value;
            const managerName = document.getElementById('managerName').value;
            const divisionEmail = document.getElementById('divisionEmail').value;
            const divisionPhone = document.getElementById('divisionPhone').value;
            const divisionAddress = document.getElementById('divisionAddress').value;
            const divisionUsername = document.getElementById('divisionUsername').value;
            const divisionPassword = document.getElementById('divisionPassword').value;
            const divisionStatus = document.getElementById('divisionStatus').value;
            
            // Check if this is an edit operation
            const divisionId = addDivisionForm.getAttribute('data-division-id');
            const isEditing = !!divisionId;
            
            // Get divisions
            const divisions = JSON.parse(localStorage.getItem('divisions') || '[]');
            
            if (isEditing) {
                // Editing existing division
                const divisionIndex = divisions.findIndex(d => d.id === divisionId);
                
                if (divisionIndex === -1) {
                    showToast('error', 'Division Not Found', 'The division you are trying to edit could not be found');
                    return;
                }
                
                const oldName = divisions[divisionIndex].name;
                
                // Check if name is changed and if it would create a duplicate
                if (oldName !== divisionName && 
                    divisions.some(d => d.name.toLowerCase() === divisionName.toLowerCase())) {
                    showToast('error', 'Duplicate Division', `A division with the name "${divisionName}" already exists`);
                    return;
                }
                
                // Update division data
                divisions[divisionIndex] = {
                    ...divisions[divisionIndex],
                    name: divisionName,
                    manager: managerName,
                    email: divisionEmail,
                    phone: divisionPhone,
                    address: divisionAddress,
                    status: divisionStatus,
                    lastUpdated: new Date().toISOString()
                };
                
                // Save updated divisions
                localStorage.setItem('divisions', JSON.stringify(divisions));
                
                // Update system users if name changed
                if (oldName !== divisionName) {
                    updateDivisionUserName(oldName, divisionName);
                    updateDivisionNameInRelatedData(oldName, divisionName);
                }
                
                // Show success message
                showToast('success', 'Division Updated', `${divisionName} has been successfully updated`);
            } else {
                // Adding new division
                
                // Check for duplicates
                if (divisions.some(d => d.name.toLowerCase() === divisionName.toLowerCase())) {
                    showToast('error', 'Duplicate Division', `A division with the name "${divisionName}" already exists`);
                    return;
                }
                
                // Create new division object
                const newDivision = {
                    id: 'div' + Date.now().toString().slice(-6),
                    name: divisionName,
                    manager: managerName,
                    email: divisionEmail,
                    phone: divisionPhone,
                    address: divisionAddress,
                    status: divisionStatus,
                    totalChargers: 0,
                    createdDate: new Date().toISOString()
                };
                
                // Add to divisions list
                divisions.push(newDivision);
                localStorage.setItem('divisions', JSON.stringify(divisions));
                
                // Add division user account
                const systemUsers = JSON.parse(localStorage.getItem('systemUsers') || '{}');
                if (!systemUsers.divisions) {
                    systemUsers.divisions = [];
                }
                
                // Check if username exists
                if (systemUsers.divisions.some(u => u.username === divisionUsername)) {
                    showToast('error', 'Username Taken', `The username "${divisionUsername}" is already in use`);
                    return;
                }
                
                systemUsers.divisions.push({
                    username: divisionUsername,
                    password: divisionPassword,
                    name: divisionName,
                    role: 'division'
                });
                
                localStorage.setItem('systemUsers', JSON.stringify(systemUsers));
                
                // Show success message
                showToast('success', 'Division Added', `${divisionName} has been successfully added to the system`);
            }
            
            // Close modal and reset form
            document.getElementById('addDivisionModal').classList.remove('active');
            resetDivisionForm();
            
            // Refresh divisions table
            loadDivisionsTable();
            
            // Update dashboard stats
            updateDashboardStats();
        });
    }
    
    // Load Divisions Table
    loadDivisionsTable();
}

// Update Division User Name
function updateDivisionUserName(oldName, newName) {
    const systemUsers = JSON.parse(localStorage.getItem('systemUsers') || '{}');
    
    if (systemUsers.divisions) {
        const divisionUserIndex = systemUsers.divisions.findIndex(u => u.name === oldName);
        
        if (divisionUserIndex >= 0) {
            systemUsers.divisions[divisionUserIndex].name = newName;
            localStorage.setItem('systemUsers', JSON.stringify(systemUsers));
        }
    }
}

// Update Division Name In Related Data
function updateDivisionNameInRelatedData(oldName, newName) {
    // Update chargers
    const chargers = JSON.parse(localStorage.getItem('chargers') || '[]');
    let chargersUpdated = false;
    
    chargers.forEach(charger => {
        if (charger.division === oldName) {
            charger.division = newName;
            chargersUpdated = true;
        }
    });
    
    if (chargersUpdated) {
        localStorage.setItem('chargers', JSON.stringify(chargers));
    }
    
    // Update complaints
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    let complaintsUpdated = false;
    
    complaints.forEach(complaint => {
        if (complaint.division === oldName) {
            complaint.division = newName;
            complaintsUpdated = true;
            
            // Also update timeline entries if applicable
            if (complaint.timeline && Array.isArray(complaint.timeline)) {
                complaint.timeline.forEach(entry => {
                    if (entry.description && entry.description.includes(oldName)) {
                        entry.description = entry.description.replace(oldName, newName);
                    }
                });
            }
        }
    });
    
    if (complaintsUpdated) {
        localStorage.setItem('complaints', JSON.stringify(complaints));
    }
    
    // Update vendors' service areas
    const vendors = JSON.parse(localStorage.getItem('vendors') || '[]');
    let vendorsUpdated = false;
    
    vendors.forEach(vendor => {
        if (vendor.serviceAreas && vendor.serviceAreas.includes(oldName)) {
            const areaIndex = vendor.serviceAreas.indexOf(oldName);
            if (areaIndex !== -1) {
                vendor.serviceAreas[areaIndex] = newName;
                vendorsUpdated = true;
            }
        }
    });
    
    if (vendorsUpdated) {
        localStorage.setItem('vendors', JSON.stringify(vendors));
    }
}

// Reset Division Form
function resetDivisionForm() {
    const form = document.getElementById('addDivisionForm');
    if (!form) return;
    
    // Reset form
    form.reset();
    
    // Reset form title
    const modalTitle = document.querySelector('#addDivisionModal .modal-title');
    if (modalTitle) {
        modalTitle.textContent = 'Add Division User';
    }
    
    // Reset submit button text
    const submitButton = document.querySelector('#addDivisionForm button[type="submit"]');
    if (submitButton) {
        submitButton.textContent = 'Create Division';
    }
    
    // Show username and password fields
    const usernameField = document.querySelector('#addDivisionForm .form-row:nth-of-type(3)');
    if (usernameField) {
        usernameField.style.display = 'flex';
    }
    
    // Remove data attributes
    form.removeAttribute('data-division-id');
}

// Load Divisions Table
function loadDivisionsTable() {
    const tableBody = document.querySelector('#divisionsTable tbody');
    if (!tableBody) return;
    
    // Clear table
    tableBody.innerHTML = '';
    
    // Get divisions
    const divisions = JSON.parse(localStorage.getItem('divisions') || '[]');
    
    if (divisions.length === 0) {
        // Show no data message
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center">No divisions found</td></tr>';
        return;
    }
    
    // Add divisions to table
    divisions.forEach(division => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${division.id}</td>
            <td>${division.name}</td>
            <td>${division.manager}</td>
            <td>${division.email}</td>
            <td>${division.phone}</td>
            <td>${division.totalChargers || 0}</td>
            <td><span class="status-badge ${division.status === 'active' ? 'green' : 'red'}">${division.status}</span></td>
            <td>
                <button class="btn btn-sm btn-outline division-view-btn" data-id="${division.id}">
                    View
                </button>
                <button class="btn btn-sm btn-primary division-edit-btn" data-id="${division.id}">
                    Edit
                </button>
                <button class="btn btn-sm btn-danger division-delete-btn" data-id="${division.id}">
                    Delete
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to buttons
    tableBody.querySelectorAll('.division-view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const divisionId = btn.getAttribute('data-id');
            showDivisionDetails(divisionId);
        });
    });

    tableBody.querySelectorAll('.division-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const divisionId = btn.getAttribute('data-id');
            if (confirm('Are you sure you want to delete this division? This will remove all associated data.')) {
                deleteDivision(divisionId);
            }
        });
    });

    tableBody.querySelectorAll('.division-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const divisionId = btn.getAttribute('data-id');
            showEditDivisionModal(divisionId);
        });
    });
}

// Show Division Details
function showDivisionDetails(divisionId) {
    // Get division data
    const divisions = JSON.parse(localStorage.getItem('divisions') || '[]');
    const division = divisions.find(d => d.id === divisionId);
    
    if (!division) {
        showToast('error', 'Division Not Found', 'The requested division information could not be found');
        return;
    }
    
    // Create modal if doesn't exist
    let divisionModal = document.getElementById('divisionDetailsModal');
    
    if (!divisionModal) {
        divisionModal = document.createElement('div');
        divisionModal.id = 'divisionDetailsModal';
        divisionModal.className = 'modal';
        document.body.appendChild(divisionModal);
    }
    
    // Get division stats
    const chargers = JSON.parse(localStorage.getItem('chargers') || '[]');
    const divisionChargers = chargers.filter(c => c.division === division.name);
    
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    const divisionComplaints = complaints.filter(c => c.division === division.name);
    
    const openComplaints = divisionComplaints.filter(c => 
        c.status.toLowerCase() === 'open' || c.status.toLowerCase() === 'in progress'
    ).length;
    
    const resolvedComplaints = divisionComplaints.filter(c => 
        c.status.toLowerCase() === 'resolved'
    ).length;
    
    // Create modal content
    divisionModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">${division.name} Details</h2>
                <button class="modal-close" id="closeDivisionDetailsModal">×</button>
            </div>
            <div class="modal-body">
                <div class="detail-section">
                    <h3>Division Information</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <div class="detail-label">Division ID:</div>
                            <div class="detail-value">${division.id}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Manager:</div>
                            <div class="detail-value">${division.manager}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Email:</div>
                            <div class="detail-value">${division.email}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Phone:</div>
                            <div class="detail-value">${division.phone}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Address:</div>
                            <div class="detail-value">${division.address}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Total Chargers:</div>
                            <div class="detail-value">${division.totalChargers || 0}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Status:</div>
                            <div class="detail-value">
                                <span class="status-badge ${division.status === 'active' ? 'green' : 'red'}">
                                    ${division.status}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h3>Division Statistics</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <div class="detail-label">Active Chargers:</div>
                            <div class="detail-value">${divisionChargers.filter(c => c.status === 'active').length}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Open Complaints:</div>
                            <div class="detail-value">${openComplaints}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Resolved Complaints:</div>
                            <div class="detail-value">${resolvedComplaints}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Total Complaints:</div>
                            <div class="detail-value">${divisionComplaints.length}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" id="editDivisionDetailsBtn" data-id="${division.id}">Edit Division</button>
                <button class="btn btn-secondary" id="closeDivisionDetailsBtn">Close</button>
            </div>
        </div>
    `;
    
    // Show modal
    divisionModal.classList.add('active');
    
    // Add event listeners for buttons
    document.getElementById('closeDivisionDetailsModal').addEventListener('click', () => {
        divisionModal.classList.remove('active');
    });
    
    document.getElementById('closeDivisionDetailsBtn').addEventListener('click', () => {
        divisionModal.classList.remove('active');
    });
    
    document.getElementById('editDivisionDetailsBtn').addEventListener('click', () => {
        divisionModal.classList.remove('active');
        showEditDivisionModal(division.id);
    });
}

// Show Edit Division Modal
function showEditDivisionModal(divisionId) {
    // Get division data
    const divisions = JSON.parse(localStorage.getItem('divisions') || '[]');
    const division = divisions.find(d => d.id === divisionId);
    
    if (!division) {
        showToast('error', 'Division Not Found', 'The requested division information could not be found');
        return;
    }
    
    // Fill form with division data
    document.getElementById('divisionName').value = division.name;
    document.getElementById('managerName').value = division.manager;
    document.getElementById('divisionEmail').value = division.email;
    document.getElementById('divisionPhone').value = division.phone;
    document.getElementById('divisionAddress').value = division.address;
    document.getElementById('divisionStatus').value = division.status;
    
    // Change form title to indicate editing
    const modalTitle = document.querySelector('#addDivisionModal .modal-title');
    if (modalTitle) {
        modalTitle.textContent = 'Edit Division';
    }
    
    // Change submit button text
    const submitButton = document.querySelector('#addDivisionForm button[type="submit"]');
    if (submitButton) {
        submitButton.textContent = 'Update Division';
    }
    
    // Hide username and password fields
    const usernameField = document.querySelector('#addDivisionForm .form-row:nth-of-type(3)');
    if (usernameField) {
        usernameField.style.display = 'none';
    }
    
    // Store division ID for updating
    document.getElementById('addDivisionForm').setAttribute('data-division-id', divisionId);
    
    // Show modal
    document.getElementById('addDivisionModal').classList.add('active');
}

// Delete Division
function deleteDivision(divisionId) {
    const divisions = JSON.parse(localStorage.getItem('divisions') || '[]');
    const divisionToDelete = divisions.find(d => d.id === divisionId);
    
    if (!divisionToDelete) {
        showToast('error', 'Division Not Found', 'The division you are trying to delete could not be found');
        return;
    }
    
    // Check if division has chargers
    const chargers = JSON.parse(localStorage.getItem('chargers') || '[]');
    const divisionChargers = chargers.filter(c => c.division === divisionToDelete.name);
    
    if (divisionChargers.length > 0) {
        showToast('error', 'Cannot Delete', 'This division has assigned chargers. Please reassign them first.');
        return;
    }
    
    // Check if division has complaints
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    const divisionComplaints = complaints.filter(c => c.division === divisionToDelete.name);
    
    if (divisionComplaints.length > 0) {
        showToast('error', 'Cannot Delete', 'This division has assigned complaints. Please reassign or resolve them first.');
        return;
    }
    
    const updatedDivisions = divisions.filter(d => d.id !== divisionId);
    
    // Remove division from system users
    const systemUsers = JSON.parse(localStorage.getItem('systemUsers') || '{}');
    if (systemUsers.divisions) {
        systemUsers.divisions = systemUsers.divisions.filter(u => u.name !== divisionToDelete.name);
        localStorage.setItem('systemUsers', JSON.stringify(systemUsers));
    }
    
    // Remove division from vendor service areas
    const vendors = JSON.parse(localStorage.getItem('vendors') || '[]');
    let vendorsUpdated = false;
    
    vendors.forEach(vendor => {
        if (vendor.serviceAreas && vendor.serviceAreas.includes(divisionToDelete.name)) {
            vendor.serviceAreas = vendor.serviceAreas.filter(area => area !== divisionToDelete.name);
            vendorsUpdated = true;
        }
    });
    
    if (vendorsUpdated) {
        localStorage.setItem('vendors', JSON.stringify(vendors));
    }
    
    localStorage.setItem('divisions', JSON.stringify(updatedDivisions));
    showToast('success', 'Division Deleted', 'Division has been successfully removed');
    loadDivisionsTable();
}

// Setup Charger Management
function setupChargerManagement() {
    // Add Charger Button
    const addChargerBtn = document.getElementById('addChargerBtn');
    if (addChargerBtn) {
        addChargerBtn.addEventListener('click', () => {
            // Populate divisions dropdown
            populateDivisionsDropdown();
            
            // Reset form to add mode
            resetChargerForm();
            
            // Show modal
            document.getElementById('addChargerModal').classList.add('active');
        });
    }
    
    // Close Charger Modal
    const closeChargerModal = document.getElementById('closeChargerModal');
    const cancelChargerBtn = document.getElementById('cancelChargerBtn');
    
    if (closeChargerModal) {
        closeChargerModal.addEventListener('click', () => {
            document.getElementById('addChargerModal').classList.remove('active');
        });
    }
    
    if (cancelChargerBtn) {
        cancelChargerBtn.addEventListener('click', () => {
            document.getElementById('addChargerModal').classList.remove('active');
        });
    }
    
    // Setup charger filters
    setupChargerFilters();
    
    // Add Charger Form
    const addChargerForm = document.getElementById('addChargerForm');
    if (addChargerForm) {
        addChargerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form data
            const chargerCPID = document.getElementById('chargerCPID').value.trim();
            const chargerSerialNumber = document.getElementById('chargerSerialNumber').value.trim();
            const chargerLocation = document.getElementById('chargerLocation').value.trim();
            const chargerMake = document.getElementById('chargerMake').value.trim();
            const chargerModel = document.getElementById('chargerModel').value.trim();
            const chargerDivision = document.getElementById('chargerDivision').value;
            const chargerType = document.getElementById('chargerType').value;
            const chargerAddress = document.getElementById('chargerAddress').value.trim();
            const chargerStatus = document.getElementById('chargerStatus').value;
            const qrCodeGeneration = document.getElementById('qrCodeGeneration').checked;
            
            // Basic validation
            if (!chargerCPID) {
                showToast('error', 'Validation Error', 'Charge Point ID is required');
                return;
            }
            
            if (!chargerLocation) {
                showToast('error', 'Validation Error', 'Location Name is required');
                return;
            }
            
            if (!chargerDivision) {
                showToast('error', 'Validation Error', 'Division is required');
                return;
            }
            
            // Check if division exists
            const divisions = JSON.parse(localStorage.getItem('divisions') || '[]');
            const divisionExists = divisions.some(d => d.name === chargerDivision);
            
            if (!divisionExists) {
                showToast('error', 'Invalid Division', 'The selected division does not exist');
                return;
            }
            
            // Get original division (if editing)
            const originalDivision = addChargerForm.getAttribute('data-original-division');
            
            // Get chargers
            const chargers = JSON.parse(localStorage.getItem('chargers') || '[]');
            
            // Check if editing or adding
            const isEditing = document.getElementById('chargerCPID').readOnly;
            const existingIndex = chargers.findIndex(c => c.id === chargerCPID);
            
            // Validate for duplicates
            if (!isEditing) {
                // Check for duplicate Charge Point ID
                if (chargers.some(c => c.id === chargerCPID)) {
                    showToast('error', 'Duplicate Error', 'A charger with this Charge Point ID already exists');
                    return;
                }
                
                // Check for duplicate Serial Number if provided
                if (chargerSerialNumber && chargers.some(c => c.serialNumber === chargerSerialNumber)) {
                    showToast('error', 'Duplicate Error', 'A charger with this Serial Number already exists');
                    return;
                }
            } else {
                // When editing, check if serial number is being changed to one that already exists
                if (existingIndex >= 0 && 
                    chargerSerialNumber !== chargers[existingIndex].serialNumber &&
                    chargers.some(c => c.serialNumber === chargerSerialNumber && c.id !== chargerCPID)) {
                    showToast('error', 'Duplicate Error', 'A different charger with this Serial Number already exists');
                    return;
                }
            }
            
            if (existingIndex >= 0) {
                // Editing existing charger
                const updatedCharger = {
                    ...chargers[existingIndex],
                    serialNumber: chargerSerialNumber,
                    location: chargerLocation,
                    make: chargerMake,
                    model: chargerModel,
                    division: chargerDivision,
                    type: chargerType,
                    address: chargerAddress,
                    status: chargerStatus,
                    lastUpdated: new Date().toISOString()
                };
                
                // Update charger in array
                chargers[existingIndex] = updatedCharger;
                localStorage.setItem('chargers', JSON.stringify(chargers));
                
                // Update division counts if division changed
                if (originalDivision && originalDivision !== chargerDivision) {
                    // Decrease count for old division
                    updateDivisionChargerCount(originalDivision, -1);
                    // Increase count for new division
                    updateDivisionChargerCount(chargerDivision, 1);
                }
                
                // Update complaints for this charger if division changed
                if (originalDivision && originalDivision !== chargerDivision) {
                    updateChargerDivisionInComplaints(chargerCPID, chargerDivision);
                }
                
                // Show success message
                showToast('success', 'Charger Updated', `Charger ${chargerCPID} has been successfully updated`);
                
                // Generate QR code if requested
                if (qrCodeGeneration) {
                    generateChargerQRCode(updatedCharger);
                }
            } else {
                // Adding new charger
                const newCharger = {
                    id: chargerCPID,
                    serialNumber: chargerSerialNumber,
                    location: chargerLocation,
                    make: chargerMake,
                    model: chargerModel,
                    division: chargerDivision,
                    type: chargerType,
                    address: chargerAddress,
                    status: chargerStatus,
                    commissionDate: new Date().toISOString(),
                    lastUpdated: new Date().toISOString()
                };
                
                // Add to chargers list
                chargers.push(newCharger);
                localStorage.setItem('chargers', JSON.stringify(chargers));
                
                // Update division charger count
                updateDivisionChargerCount(chargerDivision, 1);
                
                // Show success message
                showToast('success', 'Charger Added', `Charger ${chargerCPID} has been successfully commissioned`);
                
                // Generate QR code if selected
                if (qrCodeGeneration) {
                    generateChargerQRCode(newCharger);
                }
            }
            
            // Close modal and reset form
            resetChargerForm();
            document.getElementById('addChargerModal').classList.remove('active');
            
            // Refresh chargers table
            loadFilteredChargers();
            
            // Update dashboard stats
            updateDashboardStats();
        });
    }
    
    // Load Chargers Table
    loadFilteredChargers();
}

// Populate Divisions Dropdown
function populateDivisionsDropdown() {
    const divisionsDropdown = document.getElementById('chargerDivision');
    if (!divisionsDropdown) return;
    
    // Clear existing options
    divisionsDropdown.innerHTML = '';
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select Division';
    divisionsDropdown.appendChild(defaultOption);
    
    // Get divisions
    const divisions = JSON.parse(localStorage.getItem('divisions') || '[]');
    
    // Add active divisions
    divisions.filter(d => d.status === 'active').forEach(division => {
        const option = document.createElement('option');
        option.value = division.name;
        option.textContent = division.name;
        divisionsDropdown.appendChild(option);
    });
}

// Setup Charger Filters
function setupChargerFilters() {
    // Populate division filter
    const divisionFilter = document.getElementById('chargerDivisionFilter');
    if (divisionFilter) {
        // Clear existing options except first
        while (divisionFilter.options.length > 1) {
            divisionFilter.remove(1);
        }
        
        // Get divisions
        const divisions = JSON.parse(localStorage.getItem('divisions') || '[]');
        
        // Add active divisions
        divisions.filter(d => d.status === 'active').forEach(division => {
            const option = document.createElement('option');
            option.value = division.name;
            option.textContent = division.name;
            divisionFilter.appendChild(option);
        });
    }
    
    // Apply filters button
    const applyFilters = document.getElementById('applyChargerFilters');
    if (applyFilters) {
        applyFilters.addEventListener('click', () => {
            loadFilteredChargers();
        });
    }
    
    // Reset filters button
    const resetFilters = document.getElementById('resetChargerFilters');
    if (resetFilters) {
        resetFilters.addEventListener('click', () => {
            // Reset filter inputs
            const statusFilter = document.getElementById('chargerStatusFilter');
            const divisionFilter = document.getElementById('chargerDivisionFilter');
            const typeFilter = document.getElementById('chargerTypeFilter');
            const search = document.getElementById('chargerSearch');
            
            if (statusFilter) statusFilter.value = 'all';
            if (divisionFilter) divisionFilter.value = 'all';
            if (typeFilter) typeFilter.value = 'all';
            if (search) search.value = '';
            
            // Load unfiltered chargers
            loadFilteredChargers();
        });
    }
    
    // Setup pagination
    setupChargerPagination();
}

// Load Filtered Chargers
function loadFilteredChargers(page = 1) {
    const tableBody = document.querySelector('#chargersTable tbody');
    if (!tableBody) return;
    
    // Clear table
    tableBody.innerHTML = '';
    
    // Get filter values
    const statusFilter = document.getElementById('chargerStatusFilter')?.value || 'all';
    const divisionFilter = document.getElementById('chargerDivisionFilter')?.value || 'all';
    const typeFilter = document.getElementById('chargerTypeFilter')?.value || 'all';
    const search = document.getElementById('chargerSearch')?.value?.toLowerCase() || '';
    
    // Get all chargers
    const chargers = JSON.parse(localStorage.getItem('chargers') || '[]');
    
    // Apply filters
    let filteredChargers = chargers;
    
    if (statusFilter !== 'all') {
        filteredChargers = filteredChargers.filter(c => 
            c.status && c.status.toLowerCase() === statusFilter.toLowerCase()
        );
    }
    
    if (divisionFilter !== 'all') {
        filteredChargers = filteredChargers.filter(c => 
            c.division === divisionFilter
        );
    }
    
    if (typeFilter !== 'all') {
        filteredChargers = filteredChargers.filter(c => 
            c.type && (
                (typeFilter === 'ac' && c.type.toLowerCase().includes('ac')) ||
                (typeFilter === 'dc' && c.type.toLowerCase().includes('dc'))
            )
        );
    }
    
    if (search) {
        filteredChargers = filteredChargers.filter(c => 
            (c.id && c.id.toLowerCase().includes(search)) ||
            (c.location && c.location.toLowerCase().includes(search)) ||
            (c.division && c.division.toLowerCase().includes(search))
        );
    }
    
    // Sort by date (newest first)
    filteredChargers.sort((a, b) => new Date(b.commissionDate) - new Date(a.commissionDate));
    
    // Update pagination info
    const itemsPerPage = 10;
    const totalPages = Math.ceil(filteredChargers.length / itemsPerPage);
    
    document.getElementById('currentChargerPage').textContent = page;
    document.getElementById('totalChargerPages').textContent = totalPages || 1;
    
    // Enable/disable pagination buttons
    document.getElementById('prevChargerPage').disabled = page <= 1;
    document.getElementById('nextChargerPage').disabled = page >= totalPages;
    
    // Get current page data
    const startIndex = (page - 1) * itemsPerPage;
    const pageChargers = filteredChargers.slice(startIndex, startIndex + itemsPerPage);
    
    if (pageChargers.length === 0) {
        // Show no data message
        tableBody.innerHTML = '<tr><td colspan="10" class="text-center">No chargers found</td></tr>';
        return;
    }
    
    // Store current filter state for pagination
    sessionStorage.setItem('chargerFilters', JSON.stringify({
        status: statusFilter,
        division: divisionFilter,
        type: typeFilter,
        search: search,
        totalPages: totalPages,
        currentPage: page
    }));
    
    // Add chargers to table
    pageChargers.forEach(charger => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${charger.id}</td>
            <td>${charger.serialNumber || 'N/A'}</td>
            <td>${charger.location || 'Unknown'}</td>
            <td>${charger.make || 'N/A'}</td>
            <td>${charger.model || 'N/A'}</td>
            <td>${charger.division || 'Unassigned'}</td>
            <td><span class="status-badge ${getChargerStatusClass(charger.status)}">${charger.status || 'Unknown'}</span></td>
            <td>${charger.commissionDate ? new Date(charger.commissionDate).toLocaleDateString() : 'N/A'}</td>
            <td>
                <button class="btn btn-sm btn-outline view-charger-btn" data-id="${charger.id}">
                    View
                </button>
                <button class="btn btn-sm btn-primary edit-charger-btn" data-id="${charger.id}">
                    Edit
                </button>
                <button class="btn btn-sm btn-danger delete-charger-btn" data-id="${charger.id}">
                    Delete
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to buttons
    tableBody.querySelectorAll('.view-charger-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const chargerId = btn.getAttribute('data-id');
            showChargerDetails(chargerId);
        });
    });
    
    tableBody.querySelectorAll('.delete-charger-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const chargerId = btn.getAttribute('data-id');
            if (confirm('Are you sure you want to delete this charger? This may affect associated complaints.')) {
                deleteCharger(chargerId);
            }
        });
    });

    tableBody.querySelectorAll('.edit-charger-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const chargerId = btn.getAttribute('data-id');
            showEditChargerModal(chargerId);
        });
    });
}

// Setup Charger Pagination
function setupChargerPagination() {
    const prevPageBtn = document.getElementById('prevChargerPage');
    const nextPageBtn = document.getElementById('nextChargerPage');
    
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            const currentFilters = JSON.parse(sessionStorage.getItem('chargerFilters') || '{}');
            const currentPage = currentFilters.currentPage || 1;
            
            if (currentPage > 1) {
                loadFilteredChargers(currentPage - 1);
            }
        });
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            const currentFilters = JSON.parse(sessionStorage.getItem('chargerFilters') || '{}');
            const currentPage = currentFilters.currentPage || 1;
            const totalPages = currentFilters.totalPages || 1;
            
            if (currentPage < totalPages) {
                loadFilteredChargers(currentPage + 1);
            }
        });
    }
}

// Reset Charger Form
function resetChargerForm() {
    const form = document.getElementById('addChargerForm');
    if (!form) return;
    
    // Reset form
    form.reset();
    
    // Enable ID field
    document.getElementById('chargerCPID').readOnly = false;
    
    // Reset form title
    const modalTitle = document.querySelector('#addChargerModal .modal-title');
    if (modalTitle) {
        modalTitle.textContent = 'Commission New Charger';
    }
    
    // Reset submit button text
    const submitButton = document.querySelector('#addChargerForm button[type="submit"]');
    if (submitButton) {
        submitButton.textContent = 'Commission Charger';
    }
    
    // Remove data attributes
    form.removeAttribute('data-original-division');
}

// Show Edit Charger Modal
function showEditChargerModal(chargerId) {
    // Populate divisions dropdown
    populateDivisionsDropdown();
    
    // Get charger data
    const chargers = JSON.parse(localStorage.getItem('chargers') || '[]');
    const charger = chargers.find(c => c.id === chargerId);
    
    if (!charger) {
        showToast('error', 'Charger Not Found', 'The requested charger information could not be found');
        return;
    }
    
    // Fill form with charger data
    document.getElementById('chargerCPID').value = charger.id;
    document.getElementById('chargerCPID').readOnly = true; // Prevent changing ID
    document.getElementById('chargerSerialNumber').value = charger.serialNumber || '';
    document.getElementById('chargerLocation').value = charger.location || '';
    document.getElementById('chargerMake').value = charger.make || '';
    document.getElementById('chargerModel').value = charger.model || '';
    document.getElementById('chargerDivision').value = charger.division || '';
    document.getElementById('chargerType').value = charger.type || '';
    document.getElementById('chargerAddress').value = charger.address || '';
    document.getElementById('chargerStatus').value = charger.status || '';
    document.getElementById('qrCodeGeneration').checked = false;
    
    // Change form title to indicate editing
    const modalTitle = document.querySelector('#addChargerModal .modal-title');
    if (modalTitle) {
        modalTitle.textContent = 'Edit Charger';
    }
    
    // Change submit button text
    const submitButton = document.querySelector('#addChargerForm button[type="submit"]');
    if (submitButton) {
        submitButton.textContent = 'Update Charger';
    }
    
    // Store original division for updating counts later
    document.getElementById('addChargerForm').setAttribute('data-original-division', charger.division || '');
    
    // Show modal
    document.getElementById('addChargerModal').classList.add('active');
}

// Update Division Charger Count
function updateDivisionChargerCount(divisionName, increment) {
    if (!divisionName) return;
    
    const divisions = JSON.parse(localStorage.getItem('divisions') || '[]');
    const divisionIndex = divisions.findIndex(d => d.name === divisionName);
    
    if (divisionIndex >= 0) {
        // Make sure totalChargers is initialized
        if (typeof divisions[divisionIndex].totalChargers !== 'number') {
            divisions[divisionIndex].totalChargers = 0;
        }
        
        // Update counter
        divisions[divisionIndex].totalChargers += increment;
        
        // Ensure count doesn't go negative
        if (divisions[divisionIndex].totalChargers < 0) {
            divisions[divisionIndex].totalChargers = 0;
        }
        
        localStorage.setItem('divisions', JSON.stringify(divisions));
    }
}

// Update Charger Division In Complaints
function updateChargerDivisionInComplaints(chargerId, newDivision) {
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    let updated = false;
    
    complaints.forEach(complaint => {
        if (complaint.chargerID === chargerId) {
            // Update the division
            complaint.division = newDivision;
            updated = true;
            
            // Add a timeline entry about the division change
            if (!complaint.timeline) {
                complaint.timeline = [];
            }
            
            complaint.timeline.push({
                status: 'Division Changed',
                timestamp: new Date().toISOString(),
                description: `Charger has been reassigned to ${newDivision}`
            });
            
            complaint.lastUpdated = new Date().toISOString();
        }
    });
    
    if (updated) {
        localStorage.setItem('complaints', JSON.stringify(complaints));
    }
}

// Delete Charger
function deleteCharger(chargerId) {
    const chargers = JSON.parse(localStorage.getItem('chargers') || '[]');
    const chargerToDelete = chargers.find(c => c.id === chargerId);
    
    if (!chargerToDelete) {
        showToast('error', 'Charger Not Found', 'The charger you are trying to delete could not be found');
        return;
    }
    
    // Check if charger has complaints
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    const chargerComplaints = complaints.filter(c => c.chargerID === chargerId);
    
    if (chargerComplaints.length > 0) {
        showToast('error', 'Cannot Delete', 'This charger has associated complaints. Please resolve them first.');
        return;
    }
    
    const updatedChargers = chargers.filter(c => c.id !== chargerId);
    
    // Decrease division charger count
    if (chargerToDelete.division) {
        updateDivisionChargerCount(chargerToDelete.division, -1);
    }
    
    localStorage.setItem('chargers', JSON.stringify(updatedChargers));
    showToast('success', 'Charger Deleted', 'Charger has been successfully removed');
    loadFilteredChargers();
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
    
    // Update modal with charger details
    document.getElementById('detailCPID').textContent = charger.id;
    document.getElementById('detailSerialNumber').textContent = charger.serialNumber || 'N/A';
    document.getElementById('detailLocation').textContent = charger.location || 'Unknown';
    document.getElementById('detailMakeModel').textContent = 
        (charger.make && charger.model) ? `${charger.make} ${charger.model}` : 
        (charger.make || charger.model || 'N/A');
    document.getElementById('detailDivision').textContent = charger.division || 'Unassigned';
    
    const statusElement = document.getElementById('detailStatus');
    statusElement.textContent = charger.status || 'Unknown';
    statusElement.className = 'info-value';
    statusElement.classList.add(getChargerStatusClass(charger.status));
    
    document.getElementById('detailCommissionDate').textContent = 
        charger.commissionDate ? new Date(charger.commissionDate).toLocaleDateString() : 'N/A';
    
    // Load complaint history for this charger
    loadChargerComplaintHistory(chargerId);
    
    // Setup action buttons
    document.getElementById('editChargerBtn').addEventListener('click', () => {
        document.getElementById('chargerDetailsModal').classList.remove('active');
        showEditChargerModal(chargerId);
    });
    
    document.getElementById('printChargerQRBtn').addEventListener('click', () => {
        generateChargerQRCode(charger);
    });
    
    // Show modal
    document.getElementById('chargerDetailsModal').classList.add('active');
    
    // Setup close buttons
    const closeButtons = document.querySelectorAll('#closeChargerDetailsModal, #closeChargerDetailBtn');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('chargerDetailsModal').classList.remove('active');
        });
    });
}

// Load Charger Complaint History
function loadChargerComplaintHistory(chargerId) {
    const tableBody = document.querySelector('#chargerComplaintsTable tbody');
    if (!tableBody) return;
    
    // Clear table
    tableBody.innerHTML = '';
    
    // Get complaints for this charger
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    const chargerComplaints = complaints.filter(c => c.chargerID === chargerId);
    
    if (chargerComplaints.length === 0) {
        // Show no data message
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No complaint history found</td></tr>';
        return;
    }
    
    // Sort by date (newest first)
    chargerComplaints.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
    
    // Add complaints to table
    chargerComplaints.forEach(complaint => {
        const row = document.createElement('tr');
        
        // Calculate resolution time
        let resolutionTime = '-';
        if (complaint.status.toLowerCase() === 'resolved') {
            const createDate = new Date(complaint.createdDate);
            const resolveEvent = complaint.timeline && complaint.timeline.find(t => 
                t.status.toLowerCase().includes('resolved')
            );
            
            if (resolveEvent) {
               const resolveDate = new Date(resolveEvent.timestamp);
                const hoursDiff = Math.round((resolveDate - createDate) / (1000 * 60 * 60));
                
                resolutionTime = hoursDiff < 24 
                    ? `${hoursDiff} hours` 
                    : `${Math.round(hoursDiff / 24)} days`;
            }
        }
        
        row.innerHTML = `
            <td>${complaint.trackingId}</td>
            <td>${new Date(complaint.createdDate).toLocaleDateString()}</td>
            <td>${complaint.type}${complaint.subType ? ' - ' + complaint.subType : ''}</td>
            <td><span class="status-badge ${getStatusClass(complaint.status)}">${complaint.status}</span></td>
            <td>${resolutionTime}</td>
            <td>
                <button class="btn btn-sm btn-outline view-complaint-from-charger-btn" data-id="${complaint.trackingId}">
                    View
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to view buttons
    tableBody.querySelectorAll('.view-complaint-from-charger-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const trackingId = btn.getAttribute('data-id');
            
            // Close charger details modal first
            document.getElementById('chargerDetailsModal').classList.remove('active');
            
            // Show complaint details
            showComplaintDetails(trackingId);
        });
    });
}

// Generate Charger QR Code
function generateChargerQRCode(charger) {
    // Create QR code display
    let qrCodeContent = charger.id;
    
    // Get QR code modal
    const qrCodeModal = document.getElementById('qrCodeModal');
    if (!qrCodeModal) return;
    
    // Set QR code info
    document.getElementById('qrCPID').textContent = charger.id;
    document.getElementById('qrLocation').textContent = charger.location || 'Unknown Location';
    
    // Generate QR code
    const qrCodeDisplay = document.getElementById('qrCodeDisplay');
    qrCodeDisplay.innerHTML = '';
    
    // Create canvas for QR code
    const canvas = document.createElement('canvas');
    qrCodeDisplay.appendChild(canvas);
    
    // Load QRious if needed
    if (typeof QRious === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js';
        script.onload = () => {
            createQRCode(canvas, qrCodeContent);
            qrCodeModal.classList.add('active');
        };
        document.head.appendChild(script);
    } else {
        createQRCode(canvas, qrCodeContent);
        qrCodeModal.classList.add('active');
    }
    
    // Setup close button
    document.getElementById('closeQRModal').addEventListener('click', () => {
        qrCodeModal.classList.remove('active');
    });
    
    // Setup download button
    document.getElementById('downloadQRBtn').addEventListener('click', () => {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `QR_${charger.id}.png`;
        link.click();
    });
    
    // Setup print button
    document.getElementById('printQRBtn').addEventListener('click', () => {
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <html>
            <head>
                <title>Charger QR Code - ${charger.id}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        text-align: center;
                        padding: 20px;
                    }
                    .qr-container {
                        margin: 20px auto;
                        max-width: 300px;
                    }
                    img {
                        max-width: 100%;
                        height: auto;
                    }
                    .charger-info {
                        margin-top: 10px;
                        font-size: 14px;
                    }
                    .charger-id {
                        font-weight: bold;
                        font-size: 18px;
                        margin-bottom: 5px;
                    }
                </style>
            </head>
            <body>
                <div class="qr-container">
                    <img src="${canvas.toDataURL('image/png')}" alt="Charger QR Code">
                    <div class="charger-info">
                        <div class="charger-id">Charger ID: ${charger.id}</div>
                        <div>Location: ${charger.location || 'Unknown'}</div>
                    </div>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() { window.close(); }, 500);
                    };
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
    });
}

// Create QR Code
function createQRCode(canvas, content) {
    new QRious({
        element: canvas,
        value: content,
        size: 250,
        level: 'H' // High error correction
    });
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

// Setup Complaints Management
function setupComplaintsManagement() {
    // Setup filter buttons
    const applyFilters = document.getElementById('applyFilters');
    const resetFilters = document.getElementById('resetFilters');
    
    if (applyFilters) {
        applyFilters.addEventListener('click', () => {
            loadFilteredComplaints();
        });
    }
    
    if (resetFilters) {
        resetFilters.addEventListener('click', () => {
            // Reset filter inputs
            const statusFilter = document.getElementById('statusFilter');
            const divisionFilter = document.getElementById('divisionFilter');
            const typeFilter = document.getElementById('typeFilter');
            const globalSearch = document.getElementById('globalSearch');
            const dateFrom = document.getElementById('dateFrom');
            const dateTo = document.getElementById('dateTo');
            
            if (statusFilter) statusFilter.value = 'all';
            if (divisionFilter) divisionFilter.value = 'all';
            if (typeFilter) typeFilter.value = 'all';
            if (globalSearch) globalSearch.value = '';
            if (dateFrom) dateFrom.value = '';
            if (dateTo) dateTo.value = '';
            
            // Load unfiltered complaints
            loadFilteredComplaints();
        });
    }
    
    // Populate division filter
    const divisionFilter = document.getElementById('divisionFilter');
    if (divisionFilter) {
        // Clear existing options except first
        while (divisionFilter.options.length > 1) {
            divisionFilter.remove(1);
        }
        
        // Get divisions
        const divisions = JSON.parse(localStorage.getItem('divisions') || '[]');
        
        // Add division options
        divisions.forEach(division => {
            const option = document.createElement('option');
            option.value = division.name;
            option.textContent = division.name;
            divisionFilter.appendChild(option);
        });
    }
    
    // Setup pagination
    setupComplaintsPagination();
}

// Load Filtered Complaints
function loadFilteredComplaints(page = 1) {
    const tableBody = document.querySelector('#complaintsTable tbody');
    if (!tableBody) return;
    
    // Clear table
    tableBody.innerHTML = '';
    
    // Get filter values
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    const divisionFilter = document.getElementById('divisionFilter')?.value || 'all';
    const typeFilter = document.getElementById('typeFilter')?.value || 'all';
    const globalSearch = document.getElementById('globalSearch')?.value?.toLowerCase() || '';
    const dateFrom = document.getElementById('dateFrom')?.value;
    const dateTo = document.getElementById('dateTo')?.value;
    
    // Get all complaints
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    
    // Apply filters
    let filteredComplaints = complaints;
    
    if (statusFilter !== 'all') {
        filteredComplaints = filteredComplaints.filter(c => 
            c.status && c.status.toLowerCase() === statusFilter.toLowerCase()
        );
    }
    
    if (divisionFilter !== 'all') {
        filteredComplaints = filteredComplaints.filter(c => 
            c.division === divisionFilter
        );
    }
    
    if (typeFilter !== 'all') {
        filteredComplaints = filteredComplaints.filter(c => 
            c.type && (
                (typeFilter === 'charger' && !c.type.toLowerCase().includes('billing')) ||
                (typeFilter === 'billing' && c.type.toLowerCase().includes('billing'))
            )
        );
    }
    
    if (globalSearch) {
        filteredComplaints = filteredComplaints.filter(complaint => 
            (complaint.trackingId && complaint.trackingId.toLowerCase().includes(globalSearch)) ||
            (complaint.chargerID && complaint.chargerID.toLowerCase().includes(globalSearch)) ||
            (complaint.consumerName && complaint.consumerName.toLowerCase().includes(globalSearch)) ||
            (complaint.consumerPhone && complaint.consumerPhone.toLowerCase().includes(globalSearch)) ||
            (complaint.type && complaint.type.toLowerCase().includes(globalSearch)) ||
            (complaint.division && complaint.division.toLowerCase().includes(globalSearch))
        );
    }
    
    if (dateFrom) {
        const fromDate = new Date(dateFrom);
        filteredComplaints = filteredComplaints.filter(c => 
            new Date(c.createdDate) >= fromDate
        );
    }
    
    if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59); // End of the day
        filteredComplaints = filteredComplaints.filter(c => 
            new Date(c.createdDate) <= toDate
        );
    }
    
    // Sort by date (newest first)
    filteredComplaints.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
    
    // Update pagination info
    const itemsPerPage = 10;
    const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage);
    
    document.getElementById('currentPage').textContent = page;
    document.getElementById('totalPages').textContent = totalPages || 1;
    
    // Enable/disable pagination buttons
    document.getElementById('prevPage').disabled = page <= 1;
    document.getElementById('nextPage').disabled = page >= totalPages;
    
    // Get current page data
    const startIndex = (page - 1) * itemsPerPage;
    const pageComplaints = filteredComplaints.slice(startIndex, startIndex + itemsPerPage);
    
    if (pageComplaints.length === 0) {
        // Show no data message
        tableBody.innerHTML = '<tr><td colspan="10" class="text-center">No complaints found</td></tr>';
        return;
    }
    
    // Store current filter state for pagination
    sessionStorage.setItem('complaintFilters', JSON.stringify({
        status: statusFilter,
        division: divisionFilter,
        type: typeFilter,
        globalSearch: globalSearch,
        dateFrom: dateFrom,
        dateTo: dateTo,
        totalPages: totalPages,
        currentPage: page
    }));
    
    // Add complaints to table
    pageComplaints.forEach(complaint => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${complaint.trackingId}</td>
            <td>${complaint.consumerName}</td>
            <td>${complaint.chargerID}</td>
            <td>${complaint.division || 'Unassigned'}</td>
            <td>${complaint.type}${complaint.subType ? ' - ' + complaint.subType : ''}</td>
            <td><span class="status-badge ${getStatusClass(complaint.status)}">${complaint.status}</span></td>
            <td>${complaint.assignedTo || 'Not Assigned'}</td>
            <td>${new Date(complaint.createdDate).toLocaleDateString()}</td>
            <td>${new Date(complaint.lastUpdated).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-sm btn-outline view-admin-complaint-btn" data-id="${complaint.trackingId}">
                    View
                </button>
                <button class="btn btn-sm btn-danger delete-complaint-btn" data-id="${complaint.trackingId}">
                    Delete
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to buttons
    tableBody.querySelectorAll('.view-admin-complaint-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const trackingId = btn.getAttribute('data-id');
            showComplaintDetails(trackingId);
        });
    });
    
    tableBody.querySelectorAll('.delete-complaint-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const trackingId = btn.getAttribute('data-id');
            if (confirm('Are you sure you want to delete this complaint?')) {
                deleteComplaint(trackingId);
            }
        });
    });
}

// Setup Complaints Pagination
function setupComplaintsPagination() {
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            const currentFilters = JSON.parse(sessionStorage.getItem('complaintFilters') || '{}');
            const currentPage = currentFilters.currentPage || 1;
            
            if (currentPage > 1) {
                loadFilteredComplaints(currentPage - 1);
            }
        });
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            const currentFilters = JSON.parse(sessionStorage.getItem('complaintFilters') || '{}');
            const currentPage = currentFilters.currentPage || 1;
            const totalPages = currentFilters.totalPages || 1;
            
            if (currentPage < totalPages) {
                loadFilteredComplaints(currentPage + 1);
            }
        });
    }
}

// Delete Complaint
function deleteComplaint(trackingId) {
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    const updatedComplaints = complaints.filter(c => c.trackingId !== trackingId);
    
    localStorage.setItem('complaints', JSON.stringify(updatedComplaints));
    showToast('success', 'Complaint Deleted', 'Complaint has been successfully removed');
    
    // Refresh complaints table
    loadFilteredComplaints();
    
    // Refresh recent complaints
    loadRecentComplaints();
    
    // Update dashboard stats
    updateDashboardStats();
    
    // Update notification count
    updateNotificationCount();
}

// Setup Settings Management
function setupSettingsManagement() {
    // General Settings Form
    const generalSettingsForm = document.getElementById('generalSettingsForm');
    if (generalSettingsForm) {
        generalSettingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form data
            const systemName = document.getElementById('systemName').value;
            const companyName = document.getElementById('companyName').value;
            const contactEmail = document.getElementById('contactEmail').value;
            const supportPhone = document.getElementById('supportPhone').value;
            
            // Create settings object
            const settings = {
                systemName,
                companyName,
                contactEmail,
                supportPhone,
                lastUpdated: new Date().toISOString()
            };
            
            // Save settings
            localStorage.setItem('systemSettings', JSON.stringify(settings));
            
            // Show success message
            showToast('success', 'Settings Saved', 'General settings have been updated');
        });
    }
    
    // Notification Settings Form
    const notificationSettingsForm = document.getElementById('notificationSettingsForm');
    if (notificationSettingsForm) {
        notificationSettingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form data
            const emailNotifications = document.querySelector('input[name="emailNotifications"]').checked;
            const smsNotifications = document.querySelector('input[name="smsNotifications"]').checked;
            const pushNotifications = document.querySelector('input[name="pushNotifications"]').checked;
            const notificationFrequency = document.getElementById('notificationFrequency').value;
            
            // Create settings object
            const settings = {
                emailNotifications,
                smsNotifications,
                pushNotifications,
                notificationFrequency,
                lastUpdated: new Date().toISOString()
            };
            
            // Save settings
            localStorage.setItem('notificationSettings', JSON.stringify(settings));
            
            // Show success message
            showToast('success', 'Settings Saved', 'Notification settings have been updated');
        });
    }
    
    // SLA Settings Form
    const slaSettingsForm = document.getElementById('slaSettingsForm');
    if (slaSettingsForm) {
        slaSettingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form data
            const criticalSLA = document.getElementById('criticalSLA').value;
            const highSLA = document.getElementById('highSLA').value;
            const mediumSLA = document.getElementById('mediumSLA').value;
            const lowSLA = document.getElementById('lowSLA').value;
            
            // Create settings object
            const settings = {
                criticalSLA,
                highSLA,
                mediumSLA,
                lowSLA,
                lastUpdated: new Date().toISOString()
            };
            
            // Save settings
            localStorage.setItem('slaSettings', JSON.stringify(settings));
            
            // Show success message
            showToast('success', 'Settings Saved', 'SLA settings have been updated');
        });
    }
    
    // Load saved settings
    loadSavedSettings();
}

// Load Saved Settings
function loadSavedSettings() {
    // Load general settings
    const generalSettings = JSON.parse(localStorage.getItem('systemSettings') || '{}');
    
    if (generalSettings.systemName) {
        document.getElementById('systemName').value = generalSettings.systemName;
    }
    
    if (generalSettings.companyName) {
        document.getElementById('companyName').value = generalSettings.companyName;
    }
    
    if (generalSettings.contactEmail) {
        document.getElementById('contactEmail').value = generalSettings.contactEmail;
    }
    
    if (generalSettings.supportPhone) {
        document.getElementById('supportPhone').value = generalSettings.supportPhone;
    }
    
    // Load notification settings
    const notificationSettings = JSON.parse(localStorage.getItem('notificationSettings') || '{}');
    
    if (typeof notificationSettings.emailNotifications !== 'undefined') {
        document.querySelector('input[name="emailNotifications"]').checked = notificationSettings.emailNotifications;
    }
    
    if (typeof notificationSettings.smsNotifications !== 'undefined') {
        document.querySelector('input[name="smsNotifications"]').checked = notificationSettings.smsNotifications;
    }
    
    if (typeof notificationSettings.pushNotifications !== 'undefined') {
        document.querySelector('input[name="pushNotifications"]').checked = notificationSettings.pushNotifications;
    }
    
    if (notificationSettings.notificationFrequency) {
        document.getElementById('notificationFrequency').value = notificationSettings.notificationFrequency;
    }
    
    // Load SLA settings
    const slaSettings = JSON.parse(localStorage.getItem('slaSettings') || '{}');
    
    if (slaSettings.criticalSLA) {
        document.getElementById('criticalSLA').value = slaSettings.criticalSLA;
    }
    
    if (slaSettings.highSLA) {
        document.getElementById('highSLA').value = slaSettings.highSLA;
    }
    
    if (slaSettings.mediumSLA) {
        document.getElementById('mediumSLA').value = slaSettings.mediumSLA;
    }
    
    if (slaSettings.lowSLA) {
        document.getElementById('lowSLA').value = slaSettings.lowSLA;
    }
}