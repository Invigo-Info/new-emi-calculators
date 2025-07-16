// Global variables
let bulletEmiChart;

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
        { input: 'loanAmount', slider: 'loanAmountSlider', min: 10000, max: 50000000 },
        { input: 'downPayment', slider: 'downPaymentSlider', min: 0, max: 50000000 },
        { input: 'interestRate', slider: 'interestRateSlider', min: 0.1, max: 36 },
        { input: 'tenureYears', slider: 'tenureYearsSlider', min: 1, max: 20 }
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
    const totalAmount = parseFloat(document.getElementById('loanAmount').value) || 1000000;
    const downPayment = parseFloat(document.getElementById('downPayment').value) || 0;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 10.5;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 3;
    
    // Calculate actual loan amount (Total Amount - Down Payment)
    const actualLoanAmount = Math.max(0, totalAmount - downPayment);
    
    // Make API call
    fetch('/calculate-bullet-emi', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            totalAmount: totalAmount,
            downPayment: downPayment,
            actualLoanAmount: actualLoanAmount,
            interestRate: interestRate,
            tenureYears: tenureYears
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            updateResults(data);
            updateChart(data);
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
    // Update main result cards
    document.getElementById('actualLoanAmountResult').textContent = formatCurrency(data.actualLoanAmount);
    document.getElementById('monthlyEmiResult').textContent = formatCurrency(data.monthlyEmi);
    document.getElementById('monthlyInterestResult').textContent = formatCurrency(data.monthlyInterest);
    document.getElementById('principalPaymentResult').textContent = formatCurrency(data.actualLoanAmount);
    document.getElementById('totalInterestResult').textContent = formatCurrency(data.totalInterest);
    document.getElementById('totalAmountResult').textContent = formatCurrency(data.totalPayable);
    document.getElementById('downPaymentResult').textContent = formatCurrency(data.downPayment);
    document.getElementById('regularEmiForTotalResult').textContent = formatCurrency(data.regularEmiForTotal);

    // Update chart summary
    document.getElementById('principalDisplay').textContent = formatCurrency(data.actualLoanAmount);
    document.getElementById('interestDisplay').textContent = formatCurrency(data.totalInterest);
    document.getElementById('downPaymentDisplay').textContent = formatCurrency(data.downPayment);
}

function updateChart(data) {
    const ctx = document.getElementById('bulletEmiChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (bulletEmiChart) {
        bulletEmiChart.destroy();
    }

    const chartData = [data.actualLoanAmount, data.totalInterest, data.downPayment];
    const chartLabels = ['Loan Principal', 'Interest Amount', 'Down Payment'];
    const chartColors = ['#4facfe', '#43e97b', '#17a2b8'];
    
    bulletEmiChart = new Chart(ctx, {
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
    const tbody = document.getElementById('amortizationTableBody');
    tbody.innerHTML = '';

    paymentSchedule.forEach((yearData, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="period-cell">${yearData.year}</td>
            <td class="amount-cell">${formatCurrency(yearData.interestPayment)}</td>
            <td class="amount-cell">${formatCurrency(yearData.principalPayment)}</td>
            <td class="amount-cell">${formatCurrency(yearData.totalPayment)}</td>
            <td class="amount-cell">${formatCurrency(yearData.outstandingPrincipal)}</td>
            <td class="amount-cell">${yearData.loanPaidPercentage.toFixed(1)}%</td>
        `;
        tbody.appendChild(row);
    });
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
        
        // Close mega menu when pressing Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                megaMenu.classList.remove('open');
            }
        });
    }
}

function setupDownloadButtons() {
    // Download buttons setup will be implemented when needed
}

function downloadPDF() {
    const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 1000000;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 10.5;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 3;
    
    const monthlyInterest = document.getElementById('monthlyInterestResult').textContent;
    const totalInterest = document.getElementById('totalInterestResult').textContent;
    const totalAmount = document.getElementById('totalAmountResult').textContent;
    
    const content = generatePrintableContent();
    
    // Simple implementation - in production, you'd use a proper PDF library
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write(`
        <html>
        <head>
            <title>Bullet EMI Calculator Results</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .results { margin-bottom: 30px; }
                .result-item { margin: 10px 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .amount { text-align: right; }
            </style>
        </head>
        <body>
            ${content}
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

function downloadExcel() {
    const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 1000000;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 10.5;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 3;
    
    // Create CSV content
    let csvContent = "Bullet EMI Calculator Results\n\n";
    csvContent += "Input Parameters\n";
    csvContent += `Loan Amount,${formatCurrency(loanAmount)}\n`;
    csvContent += `Interest Rate,${interestRate}%\n`;
    csvContent += `Tenure,${tenureYears} years\n\n`;
    
    csvContent += "Results\n";
    csvContent += `Monthly Interest Payment,${document.getElementById('monthlyInterestResult').textContent}\n`;
    csvContent += `Principal Payment at End,${document.getElementById('principalPaymentResult').textContent}\n`;
    csvContent += `Total Interest Paid,${document.getElementById('totalInterestResult').textContent}\n`;
    csvContent += `Total Amount Payable,${document.getElementById('totalAmountResult').textContent}\n\n`;
    
    csvContent += "Payment Schedule\n";
    csvContent += "Year,Interest Payment,Principal Payment,Total Payment,Outstanding Principal,Loan Paid %\n";
    
    const table = document.getElementById('amortizationTableBody');
    const rows = table.getElementsByTagName('tr');
    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName('td');
        const rowData = [];
        for (let j = 0; j < cells.length; j++) {
            rowData.push(cells[j].textContent.replace(/,/g, ''));
        }
        csvContent += rowData.join(',') + '\n';
    }
    
    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'bullet_emi_calculation.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function generatePrintableContent() {
    const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 1000000;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 10.5;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 3;
    
    return `
        <div class="header">
            <h1>Bullet EMI Calculator Results</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="results">
            <h2>Input Parameters</h2>
            <div class="result-item"><strong>Loan Amount:</strong> ${formatCurrency(loanAmount)}</div>
            <div class="result-item"><strong>Interest Rate:</strong> ${interestRate}% per annum</div>
            <div class="result-item"><strong>Tenure:</strong> ${tenureYears} years</div>
            
            <h2>Results</h2>
            <div class="result-item"><strong>Monthly Interest Payment:</strong> ${document.getElementById('monthlyInterestResult').textContent}</div>
            <div class="result-item"><strong>Principal Payment at End:</strong> ${document.getElementById('principalPaymentResult').textContent}</div>
            <div class="result-item"><strong>Total Interest Paid:</strong> ${document.getElementById('totalInterestResult').textContent}</div>
            <div class="result-item"><strong>Total Amount Payable:</strong> ${document.getElementById('totalAmountResult').textContent}</div>
        </div>
    `;
}

function shareLink() {
    const loanAmount = document.getElementById('loanAmount').value;
    const downPayment = document.getElementById('downPayment').value;
    const interestRate = document.getElementById('interestRate').value;
    const tenureYears = document.getElementById('tenureYears').value;
    
    const url = `${window.location.origin}/bullet-emi-calculator/?amount=${loanAmount}&downPayment=${downPayment}&rate=${interestRate}&tenure=${tenureYears}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Bullet EMI Calculator',
            text: 'Check out this Bullet EMI calculation',
            url: url
        });
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
            showNotification('Link copied to clipboard!', 'success');
        });
    } else {
        fallbackCopyTextToClipboard(url);
    }
}

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showNotification('Link copied to clipboard!', 'success');
        } else {
            showNotification('Failed to copy link', 'error');
        }
    } catch (err) {
        showNotification('Failed to copy link', 'error');
    }
    
    document.body.removeChild(textArea);
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function loadFromUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    const amount = urlParams.get('amount');
    const downPayment = urlParams.get('downPayment');
    const rate = urlParams.get('rate');
    const tenure = urlParams.get('tenure');
    
    if (amount) {
        document.getElementById('loanAmount').value = amount;
        document.getElementById('loanAmountSlider').value = amount;
    }
    
    if (downPayment) {
        document.getElementById('downPayment').value = downPayment;
        document.getElementById('downPaymentSlider').value = downPayment;
    }
    
    if (rate) {
        document.getElementById('interestRate').value = rate;
        document.getElementById('interestRateSlider').value = rate;
    }
    
    if (tenure) {
        document.getElementById('tenureYears').value = tenure;
        document.getElementById('tenureYearsSlider').value = tenure;
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