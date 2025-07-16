// Global variables
let loanChart;

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
        { input: 'tenureYears', slider: 'tenureYearsSlider', min: 1, max: 30 }
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
        }
    });
}

function calculateAndUpdate() {
    const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 500000;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 10.5;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 20;
    
    // Make API call
    fetch('/calculate-reducing-loan-emi', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            loanAmount: loanAmount,
            interestRate: interestRate,
            tenureYears: tenureYears
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            updateResults(data);
            updateCharts(data);
            updatePaymentScheduleTable(data.paymentSchedule);
        } else {
            console.error('Calculation error:', data.error);
        }
    })
    .catch(error => {
        console.error('Network error:', error);
    });
}

function updateResults(data) {
    // Update result cards
    document.getElementById('emiResult').textContent = formatCurrency(data.emi);
    document.getElementById('totalInterestResult').textContent = formatCurrency(data.totalInterest);
    document.getElementById('totalAmountResult').textContent = formatCurrency(data.totalAmount);
    document.getElementById('principalAmountResult').textContent = formatCurrency(data.principalAmount);

    // Update chart summary
    document.getElementById('principalDisplay').textContent = formatCurrency(data.principalAmount);
    document.getElementById('interestDisplay').textContent = formatCurrency(data.totalInterest);
}

function updateCharts(data) {
    updateLoanChart(data);
}

function updateLoanChart(data) {
    const ctx = document.getElementById('loanChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (loanChart) {
        loanChart.destroy();
    }

    const chartData = [data.principalAmount, data.totalInterest];
    const chartLabels = ['Principal Amount', 'Interest Amount'];
    const chartColors = ['#4facfe', '#f59e0b'];
    
    loanChart = new Chart(ctx, {
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

function updatePaymentScheduleTable(paymentSchedule) {
    const tableBody = document.getElementById('paymentScheduleTableBody');
    tableBody.innerHTML = '';
    
    paymentSchedule.forEach((yearData, index) => {
        const row = document.createElement('tr');
        row.classList.add('year-row');
        row.setAttribute('data-year', yearData.year);
        row.setAttribute('data-expanded', 'false');
        
        // Add click handler for expandable rows
        row.style.cursor = 'pointer';
        row.addEventListener('click', () => toggleMonthlyData(yearData, index));
        
        row.innerHTML = `
            <td class="year-cell">
                <span class="expand-icon">▶</span>
                ${yearData.year}
            </td>
            <td>${formatCurrency(yearData.emi)}</td>
            <td>${formatCurrency(yearData.principal)}</td>
            <td>${formatCurrency(yearData.interest)}</td>
            <td>${formatCurrency(yearData.balance)}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

function toggleMonthlyData(yearData, yearIndex) {
    const yearRow = document.querySelector(`tr[data-year="${yearData.year}"]`);
    const isExpanded = yearRow.getAttribute('data-expanded') === 'true';
    const expandIcon = yearRow.querySelector('.expand-icon');
    
    if (isExpanded) {
        // Collapse - remove monthly rows
        collapseMonthlyData(yearData.year);
        yearRow.setAttribute('data-expanded', 'false');
        expandIcon.textContent = '▶';
        yearRow.classList.remove('expanded');
    } else {
        // Expand - add monthly rows
        expandMonthlyData(yearData, yearIndex);
        yearRow.setAttribute('data-expanded', 'true');
        expandIcon.textContent = '▼';
        yearRow.classList.add('expanded');
    }
}

function expandMonthlyData(yearData, yearIndex) {
    const tableBody = document.getElementById('paymentScheduleTableBody');
    const yearRow = document.querySelector(`tr[data-year="${yearData.year}"]`);
    
    // Create monthly data rows
    yearData.monthly_data.forEach((monthData, monthIndex) => {
        const monthRow = document.createElement('tr');
        monthRow.classList.add('month-row');
        monthRow.setAttribute('data-parent-year', yearData.year);
        
        monthRow.innerHTML = `
            <td class="month-cell">
                <span class="month-indent">└─</span>
                ${monthData.month}
            </td>
            <td>${formatCurrency(monthData.emi)}</td>
            <td>${formatCurrency(monthData.principal)}</td>
            <td>${formatCurrency(monthData.interest)}</td>
            <td>${formatCurrency(monthData.balance)}</td>
        `;
        
        // Insert after the year row
        const insertAfterRow = yearRow.nextElementSibling;
        if (insertAfterRow) {
            tableBody.insertBefore(monthRow, insertAfterRow);
        } else {
            tableBody.appendChild(monthRow);
        }
    });
}

function collapseMonthlyData(year) {
    const monthRows = document.querySelectorAll(`tr[data-parent-year="${year}"]`);
    monthRows.forEach(row => row.remove());
}

function setupMegaMenu() {
    const megaMenuBtn = document.querySelector('.mega-menu-btn');
    const megaMenu = document.querySelector('.mega-menu');
    
    if (megaMenuBtn && megaMenu) {
        megaMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            megaMenu.classList.toggle('open');
        });
        
        // Close mega menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!megaMenu.contains(e.target)) {
                megaMenu.classList.remove('open');
            }
        });
    }
}

function setupDownloadButtons() {
    // Download buttons will be implemented based on specific requirements
}

function downloadPDF() {
    const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 500000;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 10.5;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 20;
    
    // Get current results from the page
    const emi = document.getElementById('emiResult').textContent;
    const totalInterest = document.getElementById('totalInterestResult').textContent;
    const totalAmount = document.getElementById('totalAmountResult').textContent;
    const principalAmount = document.getElementById('principalAmountResult').textContent;
    
    // Get payment schedule data
    const paymentScheduleRows = document.querySelectorAll('#paymentScheduleTableBody .year-row');
    let scheduleTableHTML = '';
    
    paymentScheduleRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 5) {
            scheduleTableHTML += `
                <tr>
                    <td>${cells[0].textContent.replace('▶', '').replace('▼', '').trim()}</td>
                    <td>${cells[1].textContent}</td>
                    <td>${cells[2].textContent}</td>
                    <td>${cells[3].textContent}</td>
                    <td>${cells[4].textContent}</td>
                </tr>
            `;
        }
    });
    
    // Create a temporary window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Reducing Loan EMI Calculator - Results</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .results-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
                    .result-section { padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
                    .result-item { margin-bottom: 10px; }
                    .label { font-weight: bold; }
                    .value { color: #2563eb; font-weight: bold; }
                    .input-summary { margin-bottom: 30px; padding: 15px; background: #f8f9fa; border-radius: 8px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { padding: 8px; border: 1px solid #ddd; text-align: left; }
                    th { background: #f5f5f5; font-weight: bold; }
                    @media print { 
                        body { margin: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Reducing Loan EMI Calculator</h1>
                    <p>Generated on ${new Date().toLocaleDateString()}</p>
                </div>
                
                <div class="input-summary">
                    <h3>Input Parameters</h3>
                    <div>
                        <div><strong>Loan Amount:</strong> ${formatCurrency(loanAmount)}</div>
                        <div><strong>Interest Rate:</strong> ${interestRate}% p.a.</div>
                        <div><strong>Tenure:</strong> ${tenureYears} years</div>
                    </div>
                </div>
                
                <div class="results-grid">
                    <div class="result-section">
                        <h3>EMI Calculation Results</h3>
                        <div class="result-item">
                            <span class="label">Monthly EMI:</span>
                            <span class="value">${emi}</span>
                        </div>
                        <div class="result-item">
                            <span class="label">Total Interest:</span>
                            <span class="value">${totalInterest}</span>
                        </div>
                        <div class="result-item">
                            <span class="label">Total Amount:</span>
                            <span class="value">${totalAmount}</span>
                        </div>
                        <div class="result-item">
                            <span class="label">Principal Amount:</span>
                            <span class="value">${principalAmount}</span>
                        </div>
                    </div>
                    
                    <div class="result-section">
                        <h3>Loan Summary</h3>
                        <div class="result-item">
                            <span class="label">Monthly Payment:</span>
                            <span class="value">${emi}</span>
                        </div>
                        <div class="result-item">
                            <span class="label">Total Interest Paid:</span>
                            <span class="value">${totalInterest}</span>
                        </div>
                        <div class="result-item">
                            <span class="label">Total Cost of Loan:</span>
                            <span class="value">${totalAmount}</span>
                        </div>
                        <div class="result-item">
                            <span class="label">Interest Rate:</span>
                            <span class="value">${interestRate}% p.a.</span>
                        </div>
                    </div>
                </div>
                
                <div class="result-section">
                    <h3>Payment Schedule</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Year</th>
                                <th>EMI</th>
                                <th>Principal</th>
                                <th>Interest</th>
                                <th>Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${scheduleTableHTML}
                        </tbody>
                    </table>
                </div>
                
                <div style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
                    <p>This report was generated using the Reducing Loan EMI Calculator</p>
                    <p>Please verify all calculations with your lender before making financial decisions</p>
                </div>
            </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load, then print
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 1000);
    
    showNotification('PDF report generated successfully!', 'success');
}

function downloadExcel() {
    const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 500000;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 10.5;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 20;
    
    // Create CSV content
    let csvContent = "Reducing Loan EMI Calculator - Results\n";
    csvContent += `Generated on: ${new Date().toLocaleDateString()}\n\n`;
    
    // Input parameters
    csvContent += "Input Parameters\n";
    csvContent += `Loan Amount,${formatCurrency(loanAmount)}\n`;
    csvContent += `Interest Rate,${interestRate}% p.a.\n`;
    csvContent += `Tenure,${tenureYears} years\n\n`;
    
    // Results
    csvContent += "Results Summary\n";
    csvContent += `Monthly EMI,${document.getElementById('emiResult').textContent}\n`;
    csvContent += `Total Interest,${document.getElementById('totalInterestResult').textContent}\n`;
    csvContent += `Total Amount,${document.getElementById('totalAmountResult').textContent}\n`;
    csvContent += `Principal Amount,${document.getElementById('principalAmountResult').textContent}\n`;
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'reducing_loan_emi_calculator.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Excel file downloaded successfully!', 'success');
}

function generatePrintableContent() {
    // This function generates content for PDF generation
    return "Reducing Loan EMI Calculator Results";
}

function shareLink() {
    const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 500000;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 10.5;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 20;
    
    const params = new URLSearchParams({
        loanAmount: loanAmount,
        interestRate: interestRate,
        tenureYears: tenureYears
    });
    
    const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Reducing Loan EMI Calculator',
            text: `Check out this loan EMI calculation: Monthly EMI is ${document.getElementById('emiResult').textContent}`,
            url: shareUrl
        }).then(() => {
            showNotification('Link shared successfully!', 'success');
        }).catch(err => {
            fallbackCopyTextToClipboard(shareUrl);
        });
    } else {
        fallbackCopyTextToClipboard(shareUrl);
    }
}

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showNotification('Link copied to clipboard!', 'success');
    } catch (err) {
        showNotification('Failed to copy link. Please copy manually.', 'error');
    }
    
    document.body.removeChild(textArea);
}

function showNotification(message, type = 'success') {
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
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function loadFromUrlParameters() {
    const params = new URLSearchParams(window.location.search);
    
    if (params.has('loanAmount')) {
        const loanAmount = parseFloat(params.get('loanAmount'));
        document.getElementById('loanAmount').value = loanAmount;
        document.getElementById('loanAmountSlider').value = loanAmount;
    }
    
    if (params.has('interestRate')) {
        const interestRate = parseFloat(params.get('interestRate'));
        document.getElementById('interestRate').value = interestRate;
        document.getElementById('interestRateSlider').value = interestRate;
    }
    
    if (params.has('tenureYears')) {
        const tenureYears = parseInt(params.get('tenureYears'));
        document.getElementById('tenureYears').value = tenureYears;
        document.getElementById('tenureYearsSlider').value = tenureYears;
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
} 