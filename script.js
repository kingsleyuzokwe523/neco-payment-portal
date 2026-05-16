// Service prices
const servicePrices = {
    'SSCE Registration': 15000,
    'Result Checker': 3000,
    'Certificate Reissuance': 25000
};

// Storage functions
function getRequests() {
    const data = localStorage.getItem('payment_requests');
    return data ? JSON.parse(data) : [];
}

function saveRequest(request) {
    const requests = getRequests();
    request.id = Date.now();
    request.status = 'pending';
    request.date = new Date().toISOString();
    request.receipt = null;
    requests.push(request);
    localStorage.setItem('payment_requests', JSON.stringify(requests));
    return request;
}

// Payment form handling
if (document.getElementById('paymentRequestForm')) {
    const serviceSelect = document.getElementById('serviceType');
    const amountInput = document.getElementById('amount');
    
    serviceSelect.addEventListener('change', function() {
        if (this.value && servicePrices[this.value]) {
            amountInput.value = servicePrices[this.value];
        } else {
            amountInput.value = '';
        }
    });
    
    document.getElementById('paymentRequestForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const requestData = {
            fullName: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            accountNumber: document.getElementById('accountNumber').value,
            serviceType: document.getElementById('serviceType').value,
            amount: parseInt(document.getElementById('amount').value),
            purpose: document.getElementById('purpose').value
        };
        
        const saved = saveRequest(requestData);
        
        const modal = document.getElementById('successModal');
        document.getElementById('requestId').textContent = saved.id;
        modal.style.display = 'block';
        
        this.reset();
        amountInput.value = '';
        
        displayRecentPayments();
    });
    
    // Modal close
    const modal = document.getElementById('successModal');
    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
        closeBtn.onclick = () => modal.style.display = 'none';
    }
    window.onclick = (event) => {
        if (event.target === modal) modal.style.display = 'none';
    };
}

// Display recent payments on homepage
if (document.getElementById('recentPayments')) {
    displayRecentPayments();
}

function displayRecentPayments() {
    const requests = getRequests();
    const recent = requests.slice(-5).reverse();
    const container = document.getElementById('recentPayments');
    
    if (recent.length === 0) {
        container.innerHTML = '<div class="payment-item">No recent requests</div>';
        return;
    }
    
    container.innerHTML = recent.map(req => `
        <div class="payment-item">
            <div>
                <strong>${escapeHtml(req.fullName)}</strong><br>
                <small>${req.serviceType} • ${new Date(req.date).toLocaleDateString()}</small>
            </div>
            <div>
                <span class="status-badge status-${req.status}">${req.status.toUpperCase()}</span>
                <strong style="margin-left: 1rem;">₦${req.amount.toLocaleString()}</strong>
            </div>
        </div>
    `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Sample data for demo
if (!localStorage.getItem('payment_requests')) {
    const sampleRequests = [
        {
            id: 1700000000001,
            fullName: "John Doe",
            email: "john@example.com",
            phone: "08012345678",
            accountNumber: "NECO2024001",
            serviceType: "SSCE Registration",
            amount: 15000,
            purpose: "SSCE Exam Registration",
            status: "approved",
            date: new Date(Date.now() - 86400000).toISOString(),
            receipt: null
        },
        {
            id: 1700000000002,
            fullName: "Jane Smith",
            email: "jane@example.com",
            phone: "08087654321",
            accountNumber: "NECO2024002",
            serviceType: "Result Checker",
            amount: 3000,
            purpose: "Result Checker Token",
            status: "pending",
            date: new Date(Date.now() - 3600000).toISOString(),
            receipt: null
        }
    ];
    localStorage.setItem('payment_requests', JSON.stringify(sampleRequests));
}
