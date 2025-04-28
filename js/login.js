// EV Charging Complaint Management System - Login JavaScript

// Constants
const APP_CONFIG = {
    version: '1.0.0',
    defaultCredentials: {
        admin: { username: 'admin', password: 'admin123' }
    }
};

// DOM References
document.addEventListener('DOMContentLoaded', () => {
    // Initialize authentication system
    initializeAuth();
    
    // Setup login and tracking functionality
    setupLoginSystem();
    
    // Setup toast notification system
    setupToastSystem();
});

// Authentication Management
function initializeAuth() {
    // Initialize default users in localStorage if not exists
    if (!localStorage.getItem('systemUsers')) {
        const defaultUsers = {
            admin: [{ 
                username: 'admin', 
                password: 'admin123', 
                role: 'admin',
                name: 'Administrator'
            }],
            divisions: [],
            vendors: []
        };
        localStorage.setItem('systemUsers', JSON.stringify(defaultUsers));
    }
    
    // Initialize empty arrays for entities if they don't exist
    if (!localStorage.getItem('divisions')) {
        localStorage.setItem('divisions', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('vendors')) {
        localStorage.setItem('vendors', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('chargers')) {
        localStorage.setItem('chargers', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('complaints')) {
        localStorage.setItem('complaints', JSON.stringify([]));
    }
}

function login(username, password, role) {
    const systemUsers = JSON.parse(localStorage.getItem('systemUsers'));
    const userGroup = role === 'admin' ? systemUsers.admin : systemUsers[role + 's'] || [];
    
    const user = userGroup.find(u => 
        u.username === username && u.password === password
    );

    if (user) {
        // Store current user in session storage
        sessionStorage.setItem('currentUser', JSON.stringify({
            ...user,
            loginTime: new Date().toISOString()
        }));
        return user;
    }
    return null;
}

function logout() {
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentDivision');
    window.location.href = 'index.html';
}

// Login System Setup
function setupLoginSystem() {
    const loginForm = document.getElementById('userLoginForm');
    const trackingForm = document.getElementById('trackComplaintForm');
    const loginTab = document.getElementById('loginTab');
    const trackingTab = document.getElementById('trackingTab');

    // Tab Switching
    if (loginTab && trackingTab) {
        loginTab.addEventListener('click', () => {
            loginTab.classList.add('active');
            trackingTab.classList.remove('active');
            document.getElementById('loginForm').classList.remove('hidden');
            document.getElementById('trackingForm').classList.add('hidden');
        });

        trackingTab.addEventListener('click', () => {
            trackingTab.classList.add('active');
            loginTab.classList.remove('active');
            document.getElementById('trackingForm').classList.remove('hidden');
            document.getElementById('loginForm').classList.add('hidden');
        });
    }

    // Login Form Handler
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const userType = document.getElementById('userType').value;

            const user = login(username, password, userType);

            if (user) {
                showToast('success', 'Login Successful', `Welcome to ${user.name || userType} Dashboard`);
                
                // Redirect based on user role
                setTimeout(() => {
                    switch(userType) {
                        case 'admin':
                            window.location.href = 'admin.html';
                            break;
                        case 'division':
                            // Store division info in session storage
                            sessionStorage.setItem('currentDivision', JSON.stringify({
                                name: user.name,
                                role: 'division'
                            }));
                            window.location.href = 'division.html';
                            break;
                        case 'vendor':
                            window.location.href = 'vendor.html';
                            break;
                    }
                }, 1000);
            } else {
                showToast('error', 'Login Failed', 'Invalid credentials');
            }
        });
    }

    // Tracking Form Handler
    if (trackingForm) {
        trackingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const phoneNumber = document.getElementById('trackingId').value.trim();
            if (!phoneNumber) {
                showToast('error', 'Invalid Input', 'Please enter your phone number');
                return;
            }
            
            // Track complaints by phone number
            trackComplaintsByPhone(phoneNumber);
        });
    }
}

// Complaint Tracking Functions
function trackComplaintsByPhone(phoneNumber) {
    // Retrieve complaints from localStorage
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    
    // Find complaints matching the phone number
    const userComplaints = complaints.filter(c => 
        c.consumerPhone && c.consumerPhone.replace(/\D/g, '') === phoneNumber.replace(/\D/g, '')
    );

    if (userComplaints.length > 0) {
        // Sort by date (most recent first)
        userComplaints.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
        
        // Take up to 5 most recent complaints
        const recentComplaints = userComplaints.slice(0, 5);
        
        const trackingResultSection = document.getElementById('trackingResultSection');
        const trackingResult = document.getElementById('trackingResult');

        if (trackingResultSection && trackingResult) {
            trackingResultSection.classList.remove('hidden');

            // Generate header
            let resultHTML = `
                <div class="tracking-header">
                    <h3>Your Complaints (${recentComplaints.length})</h3>
                    <p class="text-gray">Showing your ${recentComplaints.length} most recent complaints</p>
                </div>
            `;
            
            // Generate complaint cards
            resultHTML += '<div class="complaint-cards">';
            
            recentComplaints.forEach(complaint => {
                resultHTML += `
                    <div class="complaint-card">
                        <div class="complaint-card-header">
                            <div class="complaint-info">
                                <div class="complaint-id">Tracking ID: <span class="highlight-text">${complaint.trackingId}</span></div>
                                <div class="complaint-status">
                                    <span class="status-badge ${getStatusClass(complaint.status)}">${complaint.status}</span>
                                </div>
                            </div>
                            <div class="complaint-date">${new Date(complaint.createdDate).toLocaleDateString()}</div>
                        </div>
                        <div class="complaint-card-content">
                            <div class="detail-row">
                                <div class="detail-label">Charger ID:</div>
                                <div class="detail-value">${complaint.chargerID}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">Location:</div>
                                <div class="detail-value">${complaint.location || 'Not specified'}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">Type:</div>
                                <div class="detail-value">${complaint.type}${complaint.subType ? ' - ' + complaint.subType : ''}</div>
                            </div>
                        </div>
                        <div class="complaint-card-footer">
                            <button class="btn btn-sm btn-outline view-simple-timeline-btn" data-id="${complaint.trackingId}">
                                View Status <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
            
            resultHTML += '</div>';
            
            trackingResult.innerHTML = resultHTML;
            trackingResultSection.scrollIntoView({ behavior: 'smooth' });
            
            // Add event listeners to timeline buttons
            const timelineButtons = document.querySelectorAll('.view-simple-timeline-btn');
            timelineButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const trackingId = btn.getAttribute('data-id');
                    showSimpleComplaintTimeline(trackingId);
                });
            });
        }
    } else {
        showToast('error', 'No Complaints Found', 'We could not find any complaints associated with this phone number');
    }
}

// Show Simple Timeline for Consumers
function showSimpleComplaintTimeline(trackingId) {
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    const complaint = complaints.find(c => c.trackingId === trackingId);
    
    if (!complaint) return;
    
    // Get modal element
    let timelineModal = document.getElementById('complaintTimelineModal');
    
    // Simplified timeline - only show status changes, not all remarks
    const statusTimeline = [];
    if (complaint.timeline && complaint.timeline.length > 0) {
        // Add initial submission
        statusTimeline.push({
            status: 'Complaint Submitted',
            timestamp: complaint.createdDate,
            description: 'Your complaint has been registered in our system.'
        });
        
        // Add current status if different from submission
        const currentStatus = complaint.status;
        if (currentStatus.toLowerCase() !== 'open') {
            // Find latest entry with this status
            const statusEntries = complaint.timeline.filter(t => 
                t.status.toLowerCase().includes(currentStatus.toLowerCase())
            );
            
            if (statusEntries.length > 0) {
                const latestEntry = statusEntries[statusEntries.length - 1];
                statusTimeline.push({
                    status: currentStatus,
                    timestamp: latestEntry.timestamp,
                    description: latestEntry.description
                });
            }
        }
    } else {
        statusTimeline.push({
            status: 'Complaint Received',
            timestamp: complaint.createdDate,
            description: 'Your complaint has been registered in our system.'
        });
    }
    
    // Generate timeline HTML
    let timelineHTML = `
        <div class="tracking-header">
            <div class="tracking-id">Tracking ID: <span class="highlight-text">${complaint.trackingId}</span></div>
            <div class="tracking-status">Status: <span class="status-badge ${getStatusClass(complaint.status)}">${complaint.status}</span></div>
        </div>
        
        <div class="tracking-timeline">
    `;
    
    // Add simplified timeline events
    statusTimeline.forEach((event) => {
        const statusClass = 
            event.status.toLowerCase().includes('resolved') ? 'green' :
            event.status.toLowerCase().includes('progress') ? 'yellow' : 'blue';
        
        timelineHTML += `
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
    
    timelineHTML += `</div>`;
    
    // Update modal content
    const modalBody = timelineModal.querySelector('.modal-body');
    if (modalBody) {
        modalBody.innerHTML = timelineHTML;
    }
    
    // Show modal
    timelineModal.classList.add('active');
    
    // Add event listeners to close buttons
    document.getElementById('closeTimelineModal').addEventListener('click', () => {
        timelineModal.classList.remove('active');
    });
    document.getElementById('closeTimelineBtn').addEventListener('click', () => {
        timelineModal.classList.remove('active');
    });
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

// Check if user is already logged in
function checkAuthStatus() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    
    if (currentUser) {
        // Redirect to appropriate dashboard
        switch(currentUser.role) {
            case 'admin':
                window.location.href = 'admin.html';
                break;
            case 'division':
                window.location.href = 'division.html';
                break;
            case 'vendor':
                window.location.href = 'vendor.html';
                break;
        }
    }
}

// Check authentication status when page loads
checkAuthStatus();