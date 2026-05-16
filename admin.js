// Storage functions
function getRequests() {
    const data = localStorage.getItem('payment_requests');
    return data ? JSON.parse(data) : [];
}

function saveRequests(requests) {
    localStorage.setItem('payment_requests', JSON.stringify(requests));
}

// Check if already logged in
if (localStorage.getItem('adminLoggedIn') === 'true') {
    document.getElementById('adminLogin').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    loadAdminDashboard();
}

// Login form
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (username === 'admin' && password === 'admin123') {
            localStorage.setItem('adminLoggedIn', 'true');
            document.getElementById('adminLogin').style.display = 'none';
            document.getElementById('adminDashboard').style.display = 'block';
            loadAdminDashboard();
        } else {
            document.getElementById('loginError').style.display = 'block';
        }
    });
}

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', function() {
    localStorage.removeItem('adminLoggedIn');
    document.getElementById('adminLogin').style.display = 'block';
    document.getElementById('adminDashboard').style.display = 'none';
});

function loadAdminDashboard() {
    loadStats();
    loadRequestsTable();
    
    document.getElementById('searchInput')?.addEventListener('input', loadRequestsTable);
    document.getElementById('statusFilter')?.addEventListener('change', loadRequestsTable);
}

function loadStats() {
    const requests = getRequests();
    document.getElementById('totalRequests').textContent = requests.length;
    document.getElementById('pendingApproval').textContent = requests.filter(r => r.status === 'pending').length;
    document.getElementById('approvedCount').textContent = requests.filter(r => r.status === 'approved').length;
    document.getElementById('completedCount').textContent = requests.filter(r => r.status === 'completed').length;
}

function loadRequestsTable() {
    const status = document.getElementById('statusFilter')?.value || 'all';
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    let requests = getRequests();
    
    if (status !== 'all') {
        requests = requests.filter(r => r.status === status);
    }
    
    if (searchTerm) {
        requests = requests.filter(r => 
            r.fullName.toLowerCase().includes(searchTerm) ||
            r.email.toLowerCase().includes(searchTerm) ||
            r.accountNumber.toLowerCase().includes(searchTerm)
        );
    }
    
    const tbody = document.getElementById('requestsTableBody');
    
    if (requests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">No requests found</td></tr>';
        return;
    }
    
    tbody.innerHTML = requests.map(req => `
        <tr>
            <td>${req.id}</td>
            <td>${escapeHtml(req.fullName)}</td>
            <td>${escapeHtml(req.email)}</td>
            <td>${req.accountNumber}</td>
            <td>₦${req.amount.toLocaleString()}</td>
            <td>${req.serviceType}</td>
            <td>${new Date(req.date).toLocaleDateString()}</td>
            <td><span class="status-badge status-${req.status}">${req.status.toUpperCase()}</span></td>
            <td>${getActionButtons(req)}</td>
        </tr>
    `).join('');
}

function getActionButtons(req) {
    if (req.status === 'pending') {
        return `<button onclick="approveRequest(${req.id})" class="btn-approve">Approve</button>`;
    } else if (req.status === 'approved') {
        return `<button onclick="openReceiptModal(${req.id})" class="btn-pay-action">Upload Receipt</button>`;
    } else if (req.status === 'paid') {
        return `<button onclick="completePayment(${req.id})" class="btn-approve">Complete</button>`;
    } else if (req.status === 'completed' && req.receipt) {
        return `<button onclick="viewReceipt(${req.id})" class="view-receipt">View Receipt</button>`;
    }
    return 'Completed';
}

function approveRequest(id) {
    if (confirm('Approve this payment request?')) {
        const requests = getRequests();
        const index = requests.findIndex(r => r.id == id);
        if (index !== -1) {
            requests[index].status = 'approved';
            saveRequests(requests);
            loadStats();
            loadRequestsTable();
            alert('Request approved! User can now make payment.');
        }
    }
}

function openReceiptModal(id) {
    document.getElementById('receiptModal').style.display = 'block';
    document.getElementById('receiptRequestId').value = id;
}

function completePayment(id) {
    if (confirm('Mark this payment as completed?')) {
        const requests = getRequests();
        const index = requests.findIndex(r => r.id == id);
        if (index !== -1) {
            requests[index].status = 'completed';
            saveRequests(requests);
            loadStats();
            loadRequestsTable();
            alert('Payment completed successfully!');
        }
    }
}

// Receipt upload
document.getElementById('receiptForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const id = document.getElementById('receiptRequestId').value;
    const transactionRef = document.getElementById('transactionRef').value;
    const amount = document.getElementById('paidAmount').value;
    const file = document.getElementById('receiptFile').files[0];
    
    if (!file) {
        alert('Please upload a receipt image');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(event) {
        const requests = getRequests();
        const index = requests.findIndex(r => r.id == id);
        if (index !== -1) {
            requests[index].status = 'paid';
            requests[index].receipt = {
                transactionRef: transactionRef,
                amount: parseInt(amount),
                image: event.target.result,
                uploadedAt: new Date().toISOString()
            };
            saveRequests(requests);
            loadStats();
            loadRequestsTable();
            document.getElementById('receiptModal').style.display = 'none';
            document.getElementById('receiptForm').reset();
            alert('Receipt uploaded! Payment marked as paid.');
        }
    };
    reader.readAsDataURL(file);
});

// Close receipt modal
document.querySelector('.close-receipt')?.addEventListener('click', () => {
    document.getElementById('receiptModal').style.display = 'none';
});

function viewReceipt(id) {
    const requests = getRequests();
    const req = requests.find(r => r.id == id);
    if (req && req.receipt) {
        const modal = document.getElementById('receiptModal');
        const content = modal.querySelector('.modal-content');
        content.innerHTML = `
            <span class="close-receipt">&times;</span>
            <h3>Payment Receipt</h3>
            <p><strong>Transaction Ref:</strong> ${req.receipt.transactionRef}</p>
            <p><strong>Amount Paid:</strong> ₦${req.receipt.amount.toLocaleString()}</p>
            <p><strong>Uploaded:</strong> ${new Date(req.receipt.uploadedAt).toLocaleString()}</p>
            <img src="${req.receipt.image}" style="max-width: 100%; margin-top: 1rem; border-radius: 0.5rem;">
            <button onclick="location.reload()" class="btn-primary" style="margin-top: 1rem; width: 100%;">Close</button>
        `;
        modal.style.display = 'block';
        
        const closeBtn = content.querySelector('.close-receipt');
        if (closeBtn) closeBtn.onclick = () => location.reload();
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
