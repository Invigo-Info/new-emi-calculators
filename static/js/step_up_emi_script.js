// Global variables
let stepUpEmiChart;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    setupDownloadButtons();
    setupMegaMenu();
    loadFromUrlParameters();
    calculateAndUpdate();
});

function setupEventListeners() {
    // Input change listeners for sliders and number inputs
    const inputs = [
        { input: 'loanAmount', slider: 'loanAmountSlider', min: 1000, max: 50000000 },
        { input: 'interestRate', slider: 'interestRateSlider', min: 0.1, max: 36 },
        { input: 'tenureYears', slider: 'tenureYearsSlider', min: 1, max: 30 },
        { input: 'initialEmi', slider: 'initialEmiSlider', min: 100, max: 1000000 },
        { input: 'stepUpAmount', slider: 'stepUpAmountSlider', min: 100, max: 50000 }
    ];
    
    inputs.forEach(({ input, slider, min = 0, max }) => {
        const inputElement = document.getElementById(input);
        const sliderElement = document.getElementById(slider);
        
        if (inputElement && sliderElement) {
            // Sync input to slider
            inputElement.addEventListener('input', function() {
                const value = Math.max(Math.min(parseFloat(this.value) || min, max), min);
                sliderElement.value = value;
                calculateAndUpdate();
            });
            
            // Sync slider to input
            sliderElement.addEventListener('input', function() {
                inputElement.value = this.value;
                calculateAndUpdate();
            });
            
            // Also add 'change' event for inputs
            inputElement.addEventListener('change', function() {
                const value = Math.max(Math.min(parseFloat(this.value) || min, max), min);
                sliderElement.value = value;
                calculateAndUpdate();
            });
        }
    });

    // Step Up Frequency change listener
    const stepUpFrequencyElement = document.getElementById('stepUpFrequency');
    if (stepUpFrequencyElement) {
        stepUpFrequencyElement.addEventListener('change', function() {
            calculateAndUpdate();
        });
    }
}

function calculateAndUpdate() {
    const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 500000;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 12.0;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 10;
    const initialEmi = parseFloat(document.getElementById('initialEmi').value) || 5000;
    const stepUpAmount = parseFloat(document.getElementById('stepUpAmount').value) || 500;
    const stepUpFrequency = document.getElementById('stepUpFrequency').value || 'yearly';
    
    // Make API call
    fetch('/calculate-step-up-emi', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            loanAmount: loanAmount,
            interestRate: interestRate,
            tenureYears: tenureYears,
            initialEmi: initialEmi,
            stepUpAmount: stepUpAmount,
            stepUpFrequency: stepUpFrequency
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.status === 'success') {
            updateResults(data);
            updateChart(data);
            updateYearlyBreakdownTable(data.yearlyBreakdown);
        } else {
            console.error('Calculation error:', data.error);
            showNotification('Calculation error: ' + data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Network error:', error);
        showNotification('Network error: ' + error.message, 'error');
    });
}

function updateResults(data) {
    // Update main result cards
    document.getElementById('initialEmiResult').textContent = formatCurrency(data.initialEmi);
    document.getElementById('finalEmiResult').textContent = formatCurrency(data.finalEmi);
    document.getElementById('averageEmiResult').textContent = formatCurrency(data.averageEmi);
    document.getElementById('totalInterestResult').textContent = formatCurrency(data.totalInterest);
    document.getElementById('totalAmountResult').textContent = formatCurrency(data.totalAmount);
    
    // Calculate and display savings (can be negative if step-up costs more)
    const savings = data.savings || 0;
    const savingsElement = document.getElementById('savingsResult');
    if (savings >= 0) {
        savingsElement.textContent = formatCurrency(savings);
        savingsElement.style.color = '#48bb78'; // Green for positive savings
    } else {
        savingsElement.textContent = formatCurrency(Math.abs(savings));
        savingsElement.style.color = '#f56565'; // Red for additional cost
    }

    // Update chart summary
    document.getElementById('principalDisplay').textContent = formatCurrency(data.loanAmount);
    document.getElementById('interestDisplay').textContent = formatCurrency(data.totalInterest);
}

function updateChart(data) {
    const ctx = document.getElementById('stepUpEmiChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (stepUpEmiChart) {
        stepUpEmiChart.destroy();
    }

    const chartData = [data.loanAmount, data.totalInterest];
    const chartLabels = ['Principal Amount', 'Interest Amount'];
    const chartColors = ['#14B8A6', '#F59E0B'];
    
    stepUpEmiChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: chartLabels,
            datasets: [{
                data: chartData,
                backgroundColor: chartColors,
                borderColor: ['#ffffff', '#ffffff'],
                borderWidth: 2,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    },
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#ffffff',
                    borderWidth: 1
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1000
            }
        }
    });
}

function updateYearlyBreakdownTable(yearlyBreakdown) {
    const tbody = document.getElementById('amortizationTableBody');
    tbody.innerHTML = '';

    yearlyBreakdown.forEach((yearData, yearIndex) => {
        // Create year row
        const yearRow = document.createElement('tr');
        yearRow.className = 'year-row';
        yearRow.dataset.year = yearData.year;
        yearRow.innerHTML = `
            <td class="year-cell">
                <span class="expand-icon">▶</span>
                ${yearData.year}
            </td>
            <td class="amount-cell">${formatCurrency(yearData.total_payment)}</td>
            <td class="amount-cell">${formatCurrency(yearData.principal)}</td>
            <td class="amount-cell">${formatCurrency(yearData.interest)}</td>
            <td class="balance-cell">${formatCurrency(yearData.balance)}</td>
            <td class="percentage-cell">${yearData.loan_paid_percentage.toFixed(1)}%</td>
        `;
        
        // Add click event to year row for expansion
        yearRow.addEventListener('click', function() {
            toggleYearExpansion(yearData.year);
        });
        
        tbody.appendChild(yearRow);
        
        // Create monthly rows (initially hidden)
        yearData.monthly_data.forEach((monthData, monthIndex) => {
            const monthRow = document.createElement('tr');
            monthRow.className = 'month-row';
            monthRow.dataset.year = yearData.year;
            monthRow.style.display = 'none';
            monthRow.innerHTML = `
                <td class="month-cell">&nbsp;&nbsp;&nbsp;&nbsp;${monthData.month}</td>
                <td class="amount-cell">${formatCurrency(monthData.total_payment)}</td>
                <td class="amount-cell">${formatCurrency(monthData.principal)}</td>
                <td class="amount-cell">${formatCurrency(monthData.interest)}</td>
                <td class="balance-cell">${formatCurrency(monthData.balance)}</td>
                <td class="percentage-cell">${monthData.loan_paid_percentage.toFixed(1)}%</td>
            `;
            tbody.appendChild(monthRow);
        });
    });
}

function toggleYearExpansion(year) {
    const yearRow = document.querySelector(`.year-row[data-year="${year}"]`);
    const monthRows = document.querySelectorAll(`.month-row[data-year="${year}"]`);
    const expandIcon = yearRow.querySelector('.expand-icon');
    
    const isExpanded = expandIcon.textContent === '▼';
    
    if (isExpanded) {
        // Collapse
        expandIcon.textContent = '▶';
        monthRows.forEach(row => {
            row.style.display = 'none';
        });
    } else {
        // Expand
        expandIcon.textContent = '▼';
        monthRows.forEach(row => {
            row.style.display = 'table-row';
        });
    }
}

function setupMegaMenu() {
    const megaMenuBtn = document.querySelector('.mega-menu-btn');
    const megaMenu = document.querySelector('.mega-menu');
    
    if (megaMenuBtn && megaMenu) {
        megaMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            megaMenu.classList.toggle('open');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!megaMenu.contains(e.target)) {
                megaMenu.classList.remove('open');
            }
        });
        
        // Close menu when pressing Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                megaMenu.classList.remove('open');
            }
        });
    }
}

function setupDownloadButtons() {
    // Download buttons will be implemented based on existing functionality
}

function downloadPDF() {
    const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 500000;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 12.0;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 10;
    const initialEmi = parseFloat(document.getElementById('initialEmi').value) || 5000;
    const stepUpAmount = parseFloat(document.getElementById('stepUpAmount').value) || 500;
    const stepUpFrequency = document.getElementById('stepUpFrequency').value || 'yearly';
    
    // Get current results
    const initialEmiResult = document.getElementById('initialEmiResult').textContent;
    const finalEmiResult = document.getElementById('finalEmiResult').textContent;
    const averageEmiResult = document.getElementById('averageEmiResult').textContent;
    const totalInterestResult = document.getElementById('totalInterestResult').textContent;
    const totalAmountResult = document.getElementById('totalAmountResult').textContent;
    const savingsResult = document.getElementById('savingsResult').textContent;
    
    const printableContent = generatePrintableContent();
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Step Up EMI Calculator Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .summary { margin-bottom: 30px; }
                .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
                .summary-item { padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
                .summary-label { font-weight: bold; color: #666; }
                .summary-value { font-size: 18px; font-weight: bold; color: #333; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                th { background-color: #f5f5f5; font-weight: bold; }
                .no-print { display: none; }
            </style>
        </head>
        <body>
            ${printableContent}
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
}

function downloadExcel() {
    showNotification('Excel download feature will be implemented soon!', 'success');
}

function generatePrintableContent() {
    const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 500000;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 12.0;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 10;
    const initialEmi = parseFloat(document.getElementById('initialEmi').value) || 5000;
    const stepUpAmount = parseFloat(document.getElementById('stepUpAmount').value) || 500;
    const stepUpFrequency = document.getElementById('stepUpFrequency').value || 'yearly';
    
    // Get current results
    const initialEmiResult = document.getElementById('initialEmiResult').textContent;
    const finalEmiResult = document.getElementById('finalEmiResult').textContent;
    const averageEmiResult = document.getElementById('averageEmiResult').textContent;
    const totalInterestResult = document.getElementById('totalInterestResult').textContent;
    const totalAmountResult = document.getElementById('totalAmountResult').textContent;
    const savingsResult = document.getElementById('savingsResult').textContent;
    
    return `
        <div class="header">
            <h1>Step Up EMI Calculator Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="summary">
            <h2>Loan Details</h2>
            <div class="summary-grid">
                <div class="summary-item">
                    <div class="summary-label">Loan Amount:</div>
                    <div class="summary-value">${formatCurrency(loanAmount)}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Interest Rate:</div>
                    <div class="summary-value">${interestRate}% per annum</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Tenure:</div>
                    <div class="summary-value">${tenureYears} years</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Initial EMI:</div>
                    <div class="summary-value">${formatCurrency(initialEmi)}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Step Up Amount:</div>
                    <div class="summary-value">${formatCurrency(stepUpAmount)} ${stepUpFrequency}</div>
                </div>
            </div>
        </div>
        
        <div class="summary">
            <h2>Payment Summary</h2>
            <div class="summary-grid">
                <div class="summary-item">
                    <div class="summary-label">Initial EMI:</div>
                    <div class="summary-value">${initialEmiResult}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Final EMI:</div>
                    <div class="summary-value">${finalEmiResult}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Average EMI:</div>
                    <div class="summary-value">${averageEmiResult}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Total Interest:</div>
                    <div class="summary-value">${totalInterestResult}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Total Amount:</div>
                    <div class="summary-value">${totalAmountResult}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Interest Savings:</div>
                    <div class="summary-value">${savingsResult}</div>
                </div>
            </div>
        </div>
    `;
}

function shareLink() {
    const loanAmount = document.getElementById('loanAmount').value;
    const interestRate = document.getElementById('interestRate').value;
    const tenureYears = document.getElementById('tenureYears').value;
    const initialEmi = document.getElementById('initialEmi').value;
    const stepUpAmount = document.getElementById('stepUpAmount').value;
    const stepUpFrequency = document.getElementById('stepUpFrequency').value;
    
    const params = new URLSearchParams({
        loanAmount,
        interestRate,
        tenureYears,
        initialEmi,
        stepUpAmount,
        stepUpFrequency
    });
    
    const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    
    // Try to use modern clipboard API
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(shareUrl).then(() => {
            showNotification('Share link copied to clipboard!', 'success');
        }).catch(() => {
            fallbackCopyTextToClipboard(shareUrl);
        });
    } else {
        fallbackCopyTextToClipboard(shareUrl);
    }
}

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showNotification('Share link copied to clipboard!', 'success');
        } else {
            showNotification('Failed to copy link. Please copy manually: ' + text, 'error');
        }
    } catch (err) {
        showNotification('Failed to copy link. Please copy manually: ' + text, 'error');
    }
    
    document.body.removeChild(textArea);
}

function showNotification(message, type) {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function loadFromUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Load parameters from URL if they exist
    const loanAmount = urlParams.get('loanAmount');
    const interestRate = urlParams.get('interestRate');
    const tenureYears = urlParams.get('tenureYears');
    const initialEmi = urlParams.get('initialEmi');
    const stepUpAmount = urlParams.get('stepUpAmount');
    const stepUpFrequency = urlParams.get('stepUpFrequency');
    
    if (loanAmount) {
        document.getElementById('loanAmount').value = loanAmount;
        document.getElementById('loanAmountSlider').value = loanAmount;
    }
    if (interestRate) {
        document.getElementById('interestRate').value = interestRate;
        document.getElementById('interestRateSlider').value = interestRate;
    }
    if (tenureYears) {
        document.getElementById('tenureYears').value = tenureYears;
        document.getElementById('tenureYearsSlider').value = tenureYears;
    }
    if (initialEmi) {
        document.getElementById('initialEmi').value = initialEmi;
        document.getElementById('initialEmiSlider').value = initialEmi;
    }
    if (stepUpAmount) {
        document.getElementById('stepUpAmount').value = stepUpAmount;
        document.getElementById('stepUpAmountSlider').value = stepUpAmount;
    }
    if (stepUpFrequency) {
        document.getElementById('stepUpFrequency').value = stepUpFrequency;
    }
}

function formatCurrency(amount) {
    // Convert to number and handle edge cases
    const num = parseFloat(amount) || 0;
    
    // Format with Indian numbering system
    return '₹' + num.toLocaleString('en-IN', {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0
    });
} 
