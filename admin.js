const STORAGE_KEYS = {
    REQUESTS: 'payment_requests'
};

function getRequests() {
    const data = localStorage.getItem(STORAGE_KEYS.REQUESTS);
    return data ? JSON.parse(data) : [];
}

function saveRequests(requests) {
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
}

if (localStorage.getItem('adminLoggedIn') === 'true') {
    document.getElementById('adminLogin').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    loadAdminDashboard();
}

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
            alert('Invalid credentials! Use admin / admin123');
        }
    });
}

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
    const total = requests.length;
    const pending = requests.filter(r => r.status === 'pending').length;
    const approved = requests.filter(r => r.status === 'approved').length;
    const completed = requests.filter(r => r.status === 'completed').length;
    
    document.getElementById('totalRequests').textContent = total;
    document.getElementById('pendingApproval').textContent = pending;
    document.getElementById('approvedCount').textContent = approved;
    document.getElementById('completedCount').textContent = completed;
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
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center">No requests found</td></tr>';
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
            <td><span class="status-badge status-${req.status}">${req.status.toUpperCase()}</span></td>
            <td>${req.receipt ? '<button onclick="viewReceipt(' + req.id + ')" class="view-receipt">View</button>' : 'No receipt'}</td>
            <td>${getActionButtons(req)}</td>
        </tr>
    `).join('');
}

function getActionButtons(req) {
    if (req.status === 'pending') {
        return `<button onclick="approveRequest(${req.id})" class="btn-approve">Approve</button>`;
    } else if (req.status === 'approved') {
        return `<button onclick="markAsPaid(${req.id})" class="btn-pay-action">Mark as Paid</button>`;
    } else if (req.status === 'paid') {
        return `<button onclick="completePayment(${req.id})" class="btn-approve">Complete</button>`;
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

function markAsPaid(id) {
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
            <p><strong>Amount:</strong> ₦${req.receipt.amount.toLocaleString()}</p>
            <p><strong>Uploaded:</strong> ${new Date(req.receipt.uploadedAt).toLocaleString()}</p>
            <img src="${req.receipt.image}" style="max-width:100%; margin-top:1rem; border:1px solid #ddd; border-radius:4px;">
            <button onclick="closeReceiptModal()" class="btn-primary" style="margin-top:1rem">Close</button>
        `;
        modal.style.display = 'block';
        
        const closeBtn = content.querySelector('.close-receipt');
        if (closeBtn) closeBtn.onclick = () => closeReceiptModal();
    }
}

function closeReceiptModal() {
    const modal = document.getElementById('receiptModal');
    const content = modal.querySelector('.modal-content');
    modal.style.display = 'none';
    location.reload();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
