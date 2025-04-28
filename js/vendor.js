// EV Charging Complaint Management System - Vendor Dashboard JavaScript

// DOM References
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    checkAuth();
    
    // Setup sidebar navigation
    setupSidebar();
    
    // Setup logout functionality
    setupLogout();
    
    // Load vendor dashboard data
    loadVendorDashboard();
    
    // Setup complaint detail modal
    setupComplaintDetailModal();
    
    // Setup status update modal
    setupStatusUpdateModal();
    
    // Setup profile forms
    setupProfileForms();
});

// Check if user is authenticated and is a vendor
function checkAuth() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    
    if (!currentUser || currentUser.role !== 'vendor') {
        // Redirect to login
        window.location.href = 'index.html';
        return;
    }
    
    // Update UI with vendor name
    updateVendorInfo(currentUser);
}

// Update vendor information in the UI
function updateVendorInfo(user) {
    const vendorNameElements = document.querySelectorAll('#vendorUserName, #vendorWelcomeName');
    vendorNameElements.forEach(el => {
        if (el) el.textContent = user.name;
    });
}

// Setup sidebar navigation
function setupSidebar() {
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    const dashboardSections = document.querySelectorAll('.dashboard-section');
    
    sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
            // Get target section
            const targetSection = item.getAttribute('data-section');
            
            // Update active sidebar item
            sidebarItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            // Show target section, hide others
            dashboardSections.forEach(section => {
                if (section.id === targetSection + 'Section') {
                    section.classList.remove('hidden');
                    
                    // Load section-specific data
                    switch(targetSection) {
                        case 'assignedComplaints':
                            loadAssignedComplaints();
                            break;
                        case 'resolvedComplaints':
                            loadResolvedComplaints();
                            break;
                        case 'vendorProfile':
                            loadVendorProfile();
                            break;
                    }
                } else {
                    section.classList.add('hidden');
                }
            });
        });
    });
    
    // Handle "View all assigned complaints" link
    document.getElementById('viewAllAssignedComplaints').addEventListener('click', (e) => {
        e.preventDefault();
        
        // Find and click the "Assigned Complaints" sidebar item
        const assignedComplaintsItem = document.querySelector('[data-section="assignedComplaints"]');
        if (assignedComplaintsItem) {
            assignedComplaintsItem.click();
        }
    });
}

// Setup logout functionality
function setupLogout() {
    document.getElementById('vendorLogoutBtn').addEventListener('click', () => {
        // Clear session storage
        sessionStorage.removeItem('currentUser');
        
        // Redirect to login page
        window.location.href = 'index.html';
    });
}

// Load vendor dashboard data
function loadVendorDashboard() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    // Get complaints data
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    
    // Filter complaints assigned to this vendor
    const vendorComplaints = complaints.filter(c => c.assignedTo === currentUser.name);
    
    // Calculate statistics
    updateDashboardStats(vendorComplaints);
    
    // Load assigned complaints table
    loadRecentAssignedComplaints(vendorComplaints);
}

// Update dashboard statistics
function updateDashboardStats(vendorComplaints) {
    // Assigned complaints count (Open and In Progress)
    const assignedCount = vendorComplaints.filter(c => 
        c.status.toLowerCase() === 'open' || c.status.toLowerCase() === 'in progress'
    ).length;
    document.getElementById('vendorAssignedCount').textContent = assignedCount;
    
    // Pending complaints (In Progress)
    const pendingCount = vendorComplaints.filter(c => 
        c.status.toLowerCase() === 'in progress'
    ).length;
    document.getElementById('vendorPendingCount').textContent = pendingCount;
    
    // Completed this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const completedThisMonth = vendorComplaints.filter(c => {
        if (c.status.toLowerCase() !== 'resolved') return false;
        
        const resolvedEvent = c.timeline && c.timeline.find(t => 
            t.status.toLowerCase().includes('resolved')
        );
        
        if (!resolvedEvent) return false;
        
        const resolvedDate = new Date(resolvedEvent.timestamp);
        return resolvedDate >= startOfMonth;
    }).length;
    document.getElementById('vendorCompletedCount').textContent = completedThisMonth;
    
    // Average resolution time
    let totalResolutionTime = 0;
    let resolutionCount = 0;
    
    vendorComplaints.forEach(complaint => {
        if (complaint.status.toLowerCase() !== 'resolved') return;
        
        const createDate = new Date(complaint.createdDate);
        const resolvedEvent = complaint.timeline && complaint.timeline.find(t => 
            t.status.toLowerCase().includes('resolved')
        );
        
        if (resolvedEvent) {
            const resolveDate = new Date(resolvedEvent.timestamp);
            const hoursDiff = Math.round((resolveDate - createDate) / (1000 * 60 * 60));
            
            totalResolutionTime += hoursDiff;
            resolutionCount++;
        }
    });
    
    const avgResolutionTime = resolutionCount > 0 
        ? Math.round(totalResolutionTime / resolutionCount) 
        : 0;
    
    const formattedResolutionTime = avgResolutionTime > 24 
        ? `${Math.round(avgResolutionTime / 24)}d` 
        : `${avgResolutionTime}h`;
    
    document.getElementById('vendorResolutionTime').textContent = formattedResolutionTime;
    
    // Update trend indicators with random values (for demonstration)
    // In a real system, these would be calculated based on historical data
    updateTrendIndicators();
}

// Update trend indicators with random values (for demonstration)
function updateTrendIndicators() {
    // Assigned trend (negative)
    const assignedTrend = document.getElementById('assignedTrend');
    const assignedValue = Math.floor(Math.random() * 3 + 1);
    assignedTrend.innerHTML = `<i class="fas fa-arrow-up"></i> ${assignedValue}`;
    assignedTrend.className = 'stat-trend negative';
    
    // Pending trend (negative)
    const pendingTrend = document.getElementById('pendingTrend');
    const pendingValue = Math.floor(Math.random() * 2 + 1);
    pendingTrend.innerHTML = `<i class="fas fa-arrow-up"></i> ${pendingValue}`;
    pendingTrend.className = 'stat-trend negative';
    
    // Completed trend (positive)
    const completedTrend = document.getElementById('completedTrend');
    const completedValue = Math.floor(Math.random() * 5 + 1);
    completedTrend.innerHTML = `<i class="fas fa-arrow-up"></i> ${completedValue}`;
    completedTrend.className = 'stat-trend positive';
    
    // Resolution time trend (positive - lower is better)
    const resolutionTimeTrend = document.getElementById('resolutionTimeTrend');
    const timeValue = Math.floor(Math.random() * 3 + 1);
    resolutionTimeTrend.innerHTML = `<i class="fas fa-arrow-down"></i> ${timeValue}h`;
    resolutionTimeTrend.className = 'stat-trend positive';
}

// Load recent assigned complaints
function loadRecentAssignedComplaints(vendorComplaints) {
    const tableBody = document.querySelector('#vendorAssignedTable tbody');
    if (!tableBody) return;
    
    // Clear table
    tableBody.innerHTML = '';
    
    // Filter for open and in progress complaints
    const activeComplaints = vendorComplaints.filter(c => 
        c.status.toLowerCase() === 'open' || c.status.toLowerCase() === 'in progress'
    );
    
    // Sort by date (newest first) and take top 5
    const recentComplaints = activeComplaints
        .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate))
        .slice(0, 5);
    
    if (recentComplaints.length === 0) {
        // No complaints message
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center">No assigned complaints found</td></tr>';
        return;
    }
    
    // Add complaints to table
    recentComplaints.forEach(complaint => {
        // Get assigned date from timeline
        const assignedEvent = complaint.timeline && complaint.timeline.find(t => 
            t.status.toLowerCase().includes('assigned to vendor')
        );
        
        const assignedDate = assignedEvent ? new Date(assignedEvent.timestamp).toLocaleDateString() : 
                                           new Date(complaint.createdDate).toLocaleDateString();
        
        // Get charger location if available
        const chargers = JSON.parse(localStorage.getItem('chargers') || '[]');
        const charger = chargers.find(c => c.id === complaint.chargerID);
        const location = charger ? charger.location : 'Unknown';
        
        // Create row
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${complaint.trackingId}</td>
            <td>${complaint.chargerID}</td>
            <td>${complaint.division || 'Unassigned'}</td>
            <td>${location}</td>
            <td>${complaint.type}</td>
            <td><span class="status-badge ${getStatusClass(complaint.status)}">${complaint.status}</span></td>
            <td>${assignedDate}</td>
            <td>
                <button class="btn btn-sm btn-outline view-complaint-btn" data-id="${complaint.trackingId}">
                    View
                </button>
                <button class="btn btn-sm btn-primary update-status-btn" data-id="${complaint.trackingId}">
                    Update
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to buttons
    addComplaintButtonListeners(tableBody);
}

// Load all assigned complaints
function loadAssignedComplaints(page = 1) {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    // Setup filter buttons
    setupFilterButtons('assigned');
    
    // Get filters
    const statusFilter = document.getElementById('vendorStatusFilter').value;
    const typeFilter = document.getElementById('vendorTypeFilter').value;
    const globalSearch = document.getElementById('globalSearch').value.toLowerCase();
    const dateFrom = document.getElementById('vendorDateFrom').value;
    const dateTo = document.getElementById('vendorDateTo').value;
    
    // Get complaints
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    
    // Filter complaints assigned to this vendor
    let filteredComplaints = complaints.filter(c => c.assignedTo === currentUser.name);
    
    // Apply status filter
    if (statusFilter !== 'all') {
        filteredComplaints = filteredComplaints.filter(c => 
            c.status.toLowerCase() === statusFilter.toLowerCase()
        );
    } else {
        // For assigned complaints, we only want open and in-progress
        filteredComplaints = filteredComplaints.filter(c => 
            c.status.toLowerCase() === 'open' || c.status.toLowerCase() === 'in progress'
        );
    }
    
    // Apply type filter
    if (typeFilter !== 'all') {
        filteredComplaints = filteredComplaints.filter(c => 
            c.type.toLowerCase().includes(typeFilter.toLowerCase())
        );
    }
    
    // Apply global search
    if (globalSearch) {
        filteredComplaints = filteredComplaints.filter(c => 
            (c.trackingId && c.trackingId.toLowerCase().includes(globalSearch)) ||
            (c.chargerID && c.chargerID.toLowerCase().includes(globalSearch)) ||
            (c.division && c.division.toLowerCase().includes(globalSearch)) ||
            (c.type && c.type.toLowerCase().includes(globalSearch)) ||
            (c.consumerName && c.consumerName.toLowerCase().includes(globalSearch))
        );
    }
    
    // Apply date filters
    if (dateFrom) {
        const fromDate = new Date(dateFrom);
        filteredComplaints = filteredComplaints.filter(c => new Date(c.createdDate) >= fromDate);
    }
    
    if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59); // End of day
        filteredComplaints = filteredComplaints.filter(c => new Date(c.createdDate) <= toDate);
    }
    
    // Sort by date (newest first)
    filteredComplaints.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
    
    // Pagination
    const itemsPerPage = 10;
    const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage);
    
    // Update pagination info
    document.getElementById('currentVendorPage').textContent = page;
    document.getElementById('totalVendorPages').textContent = totalPages || 1;
    
    // Enable/disable pagination buttons
    document.getElementById('prevVendorPage').disabled = page <= 1;
    document.getElementById('nextVendorPage').disabled = page >= totalPages;
    
    // Get current page data
    const startIndex = (page - 1) * itemsPerPage;
    const pageComplaints = filteredComplaints.slice(startIndex, startIndex + itemsPerPage);
    
    // Populate table
    const tableBody = document.querySelector('#assignedComplaintsTable tbody');
    if (!tableBody) return;
    
    // Clear table
    tableBody.innerHTML = '';
    
    if (pageComplaints.length === 0) {
        // No complaints message
        tableBody.innerHTML = '<tr><td colspan="10" class="text-center">No assigned complaints found</td></tr>';
        return;
    }
    
    // Add complaints to table
    pageComplaints.forEach(complaint => {
        // Get assigned date from timeline
        const assignedEvent = complaint.timeline && complaint.timeline.find(t => 
            t.status.toLowerCase().includes('assigned to vendor')
        );
        
        const assignedDate = assignedEvent ? new Date(assignedEvent.timestamp).toLocaleDateString() : 
                                           new Date(complaint.createdDate).toLocaleDateString();
        
        // Get charger location if available
        const chargers = JSON.parse(localStorage.getItem('chargers') || '[]');
        const charger = chargers.find(c => c.id === complaint.chargerID);
        const location = charger ? charger.location : 'Unknown';
        
        // Get expected resolution date
        const expectedResolution = complaint.expectedResolutionDate ? 
            new Date(complaint.expectedResolutionDate).toLocaleDateString() : 'Not specified';
        
        // Create row
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${complaint.trackingId}</td>
            <td>${complaint.chargerID}</td>
            <td>${complaint.division || 'Unassigned'}</td>
            <td>${location}</td>
            <td>${complaint.consumerName || 'Unknown'}</td>
            <td>${complaint.type}</td>
            <td><span class="status-badge ${getStatusClass(complaint.status)}">${complaint.status}</span></td>
            <td>${assignedDate}</td>
            <td>${expectedResolution}</td>
            <td>
                <button class="btn btn-sm btn-outline view-complaint-btn" data-id="${complaint.trackingId}">
                    View
                </button>
                <button class="btn btn-sm btn-primary update-status-btn" data-id="${complaint.trackingId}">
                    Update
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to buttons
    addComplaintButtonListeners(tableBody);
    
    // Setup pagination
    setupVendorPagination();
}

// Load resolved complaints
function loadResolvedComplaints(page = 1) {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    // Setup filter buttons
    setupFilterButtons('resolved');
    
    // Get filters
    const typeFilter = document.getElementById('resolvedTypeFilter').value;
    const resolutionTimeFilter = document.getElementById('resolutionTimeFilter').value;
    const resolvedSearch = document.getElementById('resolvedSearch').value.toLowerCase();
    const dateFrom = document.getElementById('resolvedDateFrom').value;
    const dateTo = document.getElementById('resolvedDateTo').value;
    
    // Get complaints
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    
    // Filter complaints assigned to this vendor and resolved
    let filteredComplaints = complaints.filter(c => 
        c.assignedTo === currentUser.name && c.status.toLowerCase() === 'resolved'
    );
    
    // Apply type filter
    if (typeFilter !== 'all') {
        filteredComplaints = filteredComplaints.filter(c => 
            c.type.toLowerCase().includes(typeFilter.toLowerCase())
        );
    }
    
    // Apply global search
    if (resolvedSearch) {
        filteredComplaints = filteredComplaints.filter(c => 
            (c.trackingId && c.trackingId.toLowerCase().includes(resolvedSearch)) ||
            (c.chargerID && c.chargerID.toLowerCase().includes(resolvedSearch)) ||
            (c.division && c.division.toLowerCase().includes(resolvedSearch)) ||
            (c.type && c.type.toLowerCase().includes(resolvedSearch)) ||
            (c.consumerName && c.consumerName.toLowerCase().includes(resolvedSearch))
        );
    }
    
    // Apply SLA filter (simplified, in real system would use actual SLA values)
    if (resolutionTimeFilter !== 'all') {
        filteredComplaints = filteredComplaints.filter(complaint => {
            // Calculate resolution time
            const createDate = new Date(complaint.createdDate);
            const resolvedEvent = complaint.timeline && complaint.timeline.find(t => 
                t.status.toLowerCase().includes('resolved')
            );
            
            if (!resolvedEvent) return false;
            
            const resolveDate = new Date(resolvedEvent.timestamp);
            const hoursDiff = Math.round((resolveDate - createDate) / (1000 * 60 * 60));
            
            // Assume SLA is 24 hours for simplicity
            const sla = 24;
            
            if (resolutionTimeFilter === 'within-sla') {
                return hoursDiff <= sla;
            } else if (resolutionTimeFilter === 'outside-sla') {
                return hoursDiff > sla;
            }
            
            return true;
        });
    }
    
    // Apply date filters
    if (dateFrom) {
        const fromDate = new Date(dateFrom);
        filteredComplaints = filteredComplaints.filter(complaint => {
            const resolvedEvent = complaint.timeline && complaint.timeline.find(t => 
                t.status.toLowerCase().includes('resolved')
            );
            
            if (!resolvedEvent) return false;
            
            return new Date(resolvedEvent.timestamp) >= fromDate;
        });
    }
    
    if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59); // End of day
        filteredComplaints = filteredComplaints.filter(complaint => {
            const resolvedEvent = complaint.timeline && complaint.timeline.find(t => 
                t.status.toLowerCase().includes('resolved')
            );
            
            if (!resolvedEvent) return false;
            
            return new Date(resolvedEvent.timestamp) <= toDate;
        });
    }
    
    // Sort by resolved date (newest first)
    filteredComplaints.sort((a, b) => {
        const aEvent = a.timeline && a.timeline.find(t => t.status.toLowerCase().includes('resolved'));
        const bEvent = b.timeline && b.timeline.find(t => t.status.toLowerCase().includes('resolved'));
        
        const aDate = aEvent ? new Date(aEvent.timestamp) : new Date(a.lastUpdated);
        const bDate = bEvent ? new Date(bEvent.timestamp) : new Date(b.lastUpdated);
        
        return bDate - aDate;
    });
    
    // Pagination
    const itemsPerPage = 10;
    const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage);
    
    // Update pagination info
    document.getElementById('currentResolvedPage').textContent = page;
    document.getElementById('totalResolvedPages').textContent = totalPages || 1;
    
    // Enable/disable pagination buttons
    document.getElementById('prevResolvedPage').disabled = page <= 1;
    document.getElementById('nextResolvedPage').disabled = page >= totalPages;
    
    // Get current page data
    const startIndex = (page - 1) * itemsPerPage;
    const pageComplaints = filteredComplaints.slice(startIndex, startIndex + itemsPerPage);
    
    // Populate table
    const tableBody = document.querySelector('#resolvedComplaintsTable tbody');
    if (!tableBody) return;
    
    // Clear table
    tableBody.innerHTML = '';
    
    if (pageComplaints.length === 0) {
        // No complaints message
        tableBody.innerHTML = '<tr><td colspan="9" class="text-center">No resolved complaints found</td></tr>';
        return;
    }
    
    // Add complaints to table
    pageComplaints.forEach(complaint => {
        // Get assigned and resolved dates
        const assignedEvent = complaint.timeline && complaint.timeline.find(t => 
            t.status.toLowerCase().includes('assigned to vendor')
        );
        
        const resolvedEvent = complaint.timeline && complaint.timeline.find(t => 
            t.status.toLowerCase().includes('resolved')
        );
        
        const assignedDate = assignedEvent ? new Date(assignedEvent.timestamp).toLocaleDateString() : 
                                           new Date(complaint.createdDate).toLocaleDateString();
        
        const resolvedDate = resolvedEvent ? new Date(resolvedEvent.timestamp).toLocaleDateString() : 
                                           new Date(complaint.lastUpdated).toLocaleDateString();
        
        // Calculate resolution time
        let resolutionTime = '-';
        if (resolvedEvent) {
            const resolveDateTime = new Date(resolvedEvent.timestamp);
            const assignedDateTime = assignedEvent ? new Date(assignedEvent.timestamp) : new Date(complaint.createdDate);
            
            const hoursDiff = Math.round((resolveDateTime - assignedDateTime) / (1000 * 60 * 60));
            
            resolutionTime = hoursDiff < 24 ? `${hoursDiff} hours` : `${Math.round(hoursDiff / 24)} days`;
        }
        
        // Create row
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${complaint.trackingId}</td>
            <td>${complaint.chargerID}</td>
            <td>${complaint.division || 'Unassigned'}</td>
            <td>${complaint.type}</td>
            <td>${complaint.consumerName || 'Unknown'}</td>
            <td>${assignedDate}</td>
            <td>${resolvedDate}</td>
            <td>${resolutionTime}</td>
            <td>
                <button class="btn btn-sm btn-outline view-complaint-btn" data-id="${complaint.trackingId}">
                    View Details
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to buttons
    addComplaintButtonListeners(tableBody);
    
    // Setup pagination
    setupResolvedPagination();
}

// Load vendor profile
function loadVendorProfile() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    // Get vendor data
    const vendors = JSON.parse(localStorage.getItem('vendors') || '[]');
    const vendor = vendors.find(v => v.name === currentUser.name);
    
    if (!vendor) return;
    
    // Populate vendor information form
    document.getElementById('profileVendorName').value = vendor.name;
    document.getElementById('profileContactPerson').value = vendor.contactPerson || '';
    document.getElementById('profileEmail').value = vendor.email || '';
    document.getElementById('profilePhone').value = vendor.phone || '';
    document.getElementById('profileAddress').value = vendor.address || '';
}

// Setup filter buttons
function setupFilterButtons(section) {
    if (section === 'assigned') {
        const applyBtn = document.getElementById('applyVendorFilters');
        const resetBtn = document.getElementById('resetVendorFilters');
        
        if (applyBtn) {
            applyBtn.onclick = () => loadAssignedComplaints(1);
        }
        
        if (resetBtn) {
            resetBtn.onclick = () => {
                // Reset filter inputs
                document.getElementById('vendorStatusFilter').value = 'all';
                document.getElementById('vendorTypeFilter').value = 'all';
                document.getElementById('globalSearch').value = '';
                document.getElementById('vendorDateFrom').value = '';
                document.getElementById('vendorDateTo').value = '';
                
                // Reload complaints
                loadAssignedComplaints(1);
            };
        }
    } else if (section === 'resolved') {
        const applyBtn = document.getElementById('applyResolvedFilters');
        const resetBtn = document.getElementById('resetResolvedFilters');
        
        if (applyBtn) {
            applyBtn.onclick = () => loadResolvedComplaints(1);
        }
        
        if (resetBtn) {
            resetBtn.onclick = () => {
                // Reset filter inputs
                document.getElementById('resolvedTypeFilter').value = 'all';
                document.getElementById('resolutionTimeFilter').value = 'all';
                document.getElementById('resolvedSearch').value = '';
                document.getElementById('resolvedDateFrom').value = '';
                document.getElementById('resolvedDateTo').value = '';
                
                // Reload complaints
                loadResolvedComplaints(1);
            };
        }
    }
}

// Setup vendor pagination
function setupVendorPagination() {
    const prevBtn = document.getElementById('prevVendorPage');
    const nextBtn = document.getElementById('nextVendorPage');
    
    // Remove old event listeners
    const newPrevBtn = prevBtn.cloneNode(true);
    const newNextBtn = nextBtn.cloneNode(true);
    
    prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
    nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
    
    // Add new event listeners
    newPrevBtn.addEventListener('click', () => {
        const currentPage = parseInt(document.getElementById('currentVendorPage').textContent);
        if (currentPage > 1) {
            loadAssignedComplaints(currentPage - 1);
        }
    });
    
    newNextBtn.addEventListener('click', () => {
        const currentPage = parseInt(document.getElementById('currentVendorPage').textContent);
        const totalPages = parseInt(document.getElementById('totalVendorPages').textContent);
        if (currentPage < totalPages) {
            loadAssignedComplaints(currentPage + 1);
        }
    });
}

// Setup resolved pagination
function setupResolvedPagination() {
    const prevBtn = document.getElementById('prevResolvedPage');
    const nextBtn = document.getElementById('nextResolvedPage');
    
    // Remove old event listeners
    const newPrevBtn = prevBtn.cloneNode(true);
    const newNextBtn = nextBtn.cloneNode(true);
    
    prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
    nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
    
    // Add new event listeners
    newPrevBtn.addEventListener('click', () => {
        const currentPage = parseInt(document.getElementById('currentResolvedPage').textContent);
        if (currentPage > 1) {
            loadResolvedComplaints(currentPage - 1);
        }
    });
    
    newNextBtn.addEventListener('click', () => {
        const currentPage = parseInt(document.getElementById('currentResolvedPage').textContent);
        const totalPages = parseInt(document.getElementById('totalResolvedPages').textContent);
        if (currentPage < totalPages) {
            loadResolvedComplaints(currentPage + 1);
        }
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

// Add event listeners to complaint action buttons
function addComplaintButtonListeners(tableBody) {
    // View complaint buttons
    const viewButtons = tableBody.querySelectorAll('.view-complaint-btn');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const trackingId = btn.getAttribute('data-id');
            showComplaintDetails(trackingId);
        });
    });
    
    // Update status buttons
    const updateButtons = tableBody.querySelectorAll('.update-status-btn');
    updateButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const trackingId = btn.getAttribute('data-id');
            showStatusUpdateModal(trackingId);
        });
    });
}

// Setup profile forms
function setupProfileForms() {
    // Vendor profile form
    const profileForm = document.getElementById('vendorProfileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
            if (!currentUser) return;
            
            // Get form data
            const contactPerson = document.getElementById('profileContactPerson').value;
            const email = document.getElementById('profileEmail').value;
            const phone = document.getElementById('profilePhone').value;
            const address = document.getElementById('profileAddress').value;
            
            // Update vendor in localStorage
            const vendors = JSON.parse(localStorage.getItem('vendors') || '[]');
            const vendorIndex = vendors.findIndex(v => v.name === currentUser.name);
            
            if (vendorIndex !== -1) {
                vendors[vendorIndex] = {
                    ...vendors[vendorIndex],
                    contactPerson,
                    email,
                    phone,
                    address,
                    lastUpdated: new Date().toISOString()
                };
                
                localStorage.setItem('vendors', JSON.stringify(vendors));
                
                showToast('success', 'Profile Updated', 'Your profile information has been successfully updated');
            }
        });
    }
    
    // Password change form
    const passwordForm = document.getElementById('vendorPasswordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
            if (!currentUser) return;
            
            // Get form data
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            // Validate current password
            const systemUsers = JSON.parse(localStorage.getItem('systemUsers') || '{}');
            const vendorUsers = systemUsers.vendors || [];
            const userIndex = vendorUsers.findIndex(u => 
                u.username === currentUser.username && u.password === currentPassword
            );
            
            if (userIndex === -1) {
                showToast('error', 'Invalid Password', 'Your current password is incorrect');
                return;
            }
            
            // Validate new password
            if (newPassword !== confirmPassword) {
                showToast('error', 'Password Mismatch', 'New password and confirmation do not match');
                return;
            }
            
            if (newPassword.length < 6) {
                showToast('error', 'Weak Password', 'Password must be at least 6 characters long');
                return;
            }
            
            // Update password
            systemUsers.vendors[userIndex].password = newPassword;
            localStorage.setItem('systemUsers', JSON.stringify(systemUsers));
            
            // Update session storage
            currentUser.password = newPassword;
            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showToast('success', 'Password Changed', 'Your password has been successfully updated');
            
            // Reset form
            passwordForm.reset();
        });
    }
    
    // Notification settings form
    const notificationForm = document.getElementById('vendorNotificationForm');
    if (notificationForm) {
        notificationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // In a real system, these would be saved to the user's profile
            // For this demo, we'll just show a success message
            
            showToast('success', 'Preferences Saved', 'Your notification preferences have been updated');
        });
    }
}

// Setup complaint detail modal
function setupComplaintDetailModal() {
    // Close buttons
    document.getElementById('closeComplaintDetailModal').addEventListener('click', () => {
        document.getElementById('complaintDetailModal').classList.remove('active');
    });
    
    document.getElementById('closeDetailBtn').addEventListener('click', () => {
        document.getElementById('complaintDetailModal').classList.remove('active');
    });
}

// Show complaint details
function showComplaintDetails(trackingId) {
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    const complaint = complaints.find(c => c.trackingId === trackingId);
    
    if (!complaint) {
        showToast('error', 'Not Found', 'The requested complaint could not be found');
        return;
    }
    
    // Get charger info
    const chargers = JSON.parse(localStorage.getItem('chargers') || '[]');
    const charger = chargers.find(c => c.id === complaint.chargerID);
    const chargerLocation = charger ? charger.location : 'Unknown';
    
    // Create detail HTML
    let detailContent = `
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
                    <div class="detail-label">Expected Resolution:</div>
                    <div class="detail-value">${complaint.expectedResolutionDate ? new Date(complaint.expectedResolutionDate).toLocaleDateString() : 'Not specified'}</div>
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
        complaint.timeline.forEach((event) => {
            const statusClass = 
                event.status.toLowerCase().includes('resolved') ? 'green' :
                event.status.toLowerCase().includes('progress') ? 'yellow' : 'blue';
            
            detailContent += `
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
        detailContent += `
            <div class="timeline-item">
                <div class="timeline-icon blue"></div>
                <div class="timeline-content">
                    <div class="timeline-title">Complaint Received</div>
                    <div class="timeline-date">${new Date(complaint.createdDate).toLocaleString()}</div>
                    <div class="timeline-description">Complaint has been registered in the system.</div>
                </div>
            </div>
        `;
    }
    
    detailContent += `
            </div>
        </div>
    `;
    
    // Update modal content
    document.getElementById('complaintDetailContent').innerHTML = detailContent;
    
    // Update footer buttons based on status
    const footerButtons = [];
    
    if (complaint.status.toLowerCase() !== 'resolved') {
        footerButtons.push(`
            <button class="btn btn-primary update-complaint-status-btn" data-id="${complaint.trackingId}">
                Update Status
            </button>
        `);
    }
    
    footerButtons.push(`<button class="btn btn-secondary" id="closeDetailBtn">Close</button>`);
    
    document.getElementById('complaintDetailFooter').innerHTML = footerButtons.join('');
    
    // Add event listener to update status button
    const updateBtn = document.querySelector('.update-complaint-status-btn');
    if (updateBtn) {
        updateBtn.addEventListener('click', () => {
            document.getElementById('complaintDetailModal').classList.remove('active');
            showStatusUpdateModal(trackingId);
        });
    }
    
    // Reset close button event listener
    document.getElementById('closeDetailBtn').addEventListener('click', () => {
        document.getElementById('complaintDetailModal').classList.remove('active');
    });
    
    // Show modal
    document.getElementById('complaintDetailModal').classList.add('active');
}

// Setup status update modal
function setupStatusUpdateModal() {
    // Close buttons
    document.getElementById('closeStatusModal').addEventListener('click', () => {
        document.getElementById('updateStatusModal').classList.remove('active');
    });
    
    document.getElementById('cancelStatusBtn').addEventListener('click', () => {
        document.getElementById('updateStatusModal').classList.remove('active');
    });
    
    // Form submission
    document.getElementById('updateStatusForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const trackingId = document.getElementById('statusTrackingId').value;
        const newStatus = document.getElementById('newStatus').value;
        const statusNote = document.getElementById('statusNote').value;
        
        if (!trackingId || !newStatus) {
            showToast('error', 'Invalid Data', 'Please provide all required information');
            return;
        }
        
        // Update complaint status
        updateComplaintStatus(trackingId, newStatus, statusNote);
        
        // Close modal
        document.getElementById('updateStatusModal').classList.remove('active');
    });
}

// Show status update modal
function showStatusUpdateModal(trackingId) {
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    const complaint = complaints.find(c => c.trackingId === trackingId);
    
    if (!complaint) {
        showToast('error', 'Not Found', 'The requested complaint could not be found');
        return;
    }
    
    // Update current status info
    document.getElementById('currentStatusInfo').innerHTML = `
        <div class="tracking-id">Tracking ID: <span class="highlight-text">${complaint.trackingId}</span></div>
        <div class="tracking-status">Current Status: <span class="status-badge ${getStatusClass(complaint.status)}">${complaint.status}</span></div>
    `;
    
    // Update hidden field
    document.getElementById('statusTrackingId').value = trackingId;
    
    // Update status options (exclude current status)
    const statusSelect = document.getElementById('newStatus');
    statusSelect.innerHTML = '<option value="">Select New Status</option>';
    
    if (complaint.status.toLowerCase() !== 'in progress') {
        statusSelect.innerHTML += '<option value="In Progress">In Progress</option>';
    }
    
    if (complaint.status.toLowerCase() !== 'resolved') {
        statusSelect.innerHTML += '<option value="Resolved">Resolved</option>';
    }
    
    // Reset note field
    document.getElementById('statusNote').value = '';
    
    // Show modal
    document.getElementById('updateStatusModal').classList.add('active');
}

// Update complaint status
function updateComplaintStatus(trackingId, newStatus, statusNote) {
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    const complaintIndex = complaints.findIndex(c => c.trackingId === trackingId);
    
    if (complaintIndex === -1) {
        showToast('error', 'Not Found', 'The requested complaint could not be found');
        return;
    }
    
    const complaint = complaints[complaintIndex];
    const oldStatus = complaint.status;
    
    // Update status
    complaint.status = newStatus;
    complaint.lastUpdated = new Date().toISOString();
    
    // Add to timeline
    if (!complaint.timeline) {
        complaint.timeline = [];
    }
    
    complaint.timeline.push({
        status: newStatus,
        timestamp: new Date().toISOString(),
        description: statusNote || `Status changed from ${oldStatus} to ${newStatus}`
    });
    
    // Save updated complaints
    localStorage.setItem('complaints', JSON.stringify(complaints));
    
    // Show success message
    showToast('success', 'Status Updated', `Complaint status has been updated to ${newStatus}`);
    
    // Refresh data based on current view
    refreshCurrentView();
}

// Refresh the current view
function refreshCurrentView() {
    // Determine which section is currently visible
    const activeSection = document.querySelector('.sidebar-item.active').getAttribute('data-section');
    
    switch(activeSection) {
        case 'vendorHome':
            loadVendorDashboard();
            break;
        case 'assignedComplaints':
            loadAssignedComplaints(parseInt(document.getElementById('currentVendorPage').textContent));
            break;
        case 'resolvedComplaints':
            loadResolvedComplaints(parseInt(document.getElementById('currentResolvedPage').textContent));
            break;
    }
}

// Toast notification
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