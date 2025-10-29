// Global variables
let flatInterestChart;
let reducingInterestChart;

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
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 12.0;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 5;
    
    // Make API call
    fetch('/calculate-flat-vs-reducing-rate-interest', {
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
            updateComparisonTable(data.comparisonSchedule);
        } else {
            console.error('Calculation error:', data.error);
        }
    })
    .catch(error => {
        console.error('Network error:', error);
    });
}

function updateResults(data) {
    // Update Flat Interest Rate column
    document.getElementById('flatEmiResult').textContent = formatCurrency(data.flatEmi);
    document.getElementById('flatTotalInterestResult').textContent = formatCurrency(data.flatTotalInterest);
    document.getElementById('flatTotalAmountResult').textContent = formatCurrency(data.flatTotalAmount);
    
    // Update Reducing Interest Rate column
    document.getElementById('reducingEmiResult').textContent = formatCurrency(data.reducingEmi);
    document.getElementById('reducingTotalInterestResult').textContent = formatCurrency(data.reducingTotalInterest);
    document.getElementById('reducingTotalAmountResult').textContent = formatCurrency(data.reducingTotalAmount);
    
    // Update Comparison Summary section
    document.getElementById('emiDifferenceResult').textContent = formatCurrency(data.emiDifference);
    document.getElementById('totalSavingsResult').textContent = formatCurrency(data.totalSavings);

    // Update chart summary
    document.getElementById('flatPrincipalDisplay').textContent = formatCurrency(data.loanAmount);
    document.getElementById('flatInterestDisplay').textContent = formatCurrency(data.flatTotalInterest);
    document.getElementById('reducingPrincipalDisplay').textContent = formatCurrency(data.loanAmount);
    document.getElementById('reducingInterestDisplay').textContent = formatCurrency(data.reducingTotalInterest);
}

function updateCharts(data) {
    updateFlatInterestChart(data);
    updateReducingInterestChart(data);
}

function updateFlatInterestChart(data) {
    const ctx = document.getElementById('flatInterestChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (flatInterestChart) {
        flatInterestChart.destroy();
    }

    const chartData = [data.loanAmount, data.flatTotalInterest];
    const chartLabels = ['Principal Amount', 'Interest Amount'];
    const chartColors = ['#4facfe', '#f59e0b'];
    
    flatInterestChart = new Chart(ctx, {
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

function updateReducingInterestChart(data) {
    const ctx = document.getElementById('reducingInterestChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (reducingInterestChart) {
        reducingInterestChart.destroy();
    }

    const chartData = [data.loanAmount, data.reducingTotalInterest];
    const chartLabels = ['Principal Amount', 'Interest Amount'];
    const chartColors = ['#4facfe', '#10b981'];
    
    reducingInterestChart = new Chart(ctx, {
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

function updateComparisonTable(comparisonSchedule) {
    const tbody = document.getElementById('comparisonTableBody');
    tbody.innerHTML = '';

    comparisonSchedule.forEach((yearData) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="year-cell">${yearData.year}</td>
            <td class="amount-cell">${formatCurrency(yearData.flatEmi)}</td>
            <td class="amount-cell">${formatCurrency(yearData.flatInterest)}</td>
            <td class="balance-cell">${formatCurrency(yearData.flatBalance)}</td>
            <td class="amount-cell">${formatCurrency(yearData.reducingEmi)}</td>
            <td class="amount-cell">${formatCurrency(yearData.reducingInterest)}</td>
            <td class="balance-cell">${formatCurrency(yearData.reducingBalance)}</td>
            <td class="savings-cell" style="color: #16a34a; font-weight: 600;">${formatCurrency(yearData.interestSavings)}</td>
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
    }
}

function setupDownloadButtons() {
    // Download buttons are already set up with onclick handlers in HTML
}

function downloadPDF() {
    const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 500000;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 12.0;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 5;
    
    const printableContent = generatePrintableContent();
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Flat vs Reducing Rate Interest Calculator - Results</title>
            <style>
                body { font-family: 'Inter', Arial, sans-serif; margin: 20px; color: #333; }
                .header { text-align: center; margin-bottom: 30px; }
                .results-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
                .result-item { padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; }
                .result-label { font-size: 14px; color: #6b7280; margin-bottom: 5px; }
                .result-value { font-size: 18px; font-weight: bold; color: #1f2937; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { padding: 12px; border: 1px solid #e5e7eb; text-align: center; }
                th { background: #f9fafb; font-weight: 600; }
                .savings { color: #16a34a; font-weight: bold; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            ${printableContent}
        </body>
        </html>
    `);
    
    printWindow.document.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
}

function downloadExcel() {
    const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 500000;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 12.0;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 5;
    
    // Get current calculation results
    const flatEmi = document.getElementById('flatEmiResult').textContent;
    const reducingEmi = document.getElementById('reducingEmiResult').textContent;
    const emiDifference = document.getElementById('emiDifferenceResult').textContent;
    const flatTotalInterest = document.getElementById('flatTotalInterestResult').textContent;
    const reducingTotalInterest = document.getElementById('reducingTotalInterestResult').textContent;
    const totalSavings = document.getElementById('totalSavingsResult').textContent;
    
    // Create CSV content
    let csvContent = "Flat vs Reducing Rate Interest Calculator Results\n";
    csvContent += `Loan Amount,${formatCurrency(loanAmount)}\n`;
    csvContent += `Interest Rate,${interestRate}%\n`;
    csvContent += `Tenure,${tenureYears} years\n\n`;
    
    csvContent += "Comparison Summary\n";
    csvContent += "Method,EMI,Total Interest\n";
    csvContent += `Flat Interest Rate,${flatEmi},${flatTotalInterest}\n`;
    csvContent += `Reducing Interest Rate,${reducingEmi},${reducingTotalInterest}\n`;
    csvContent += `Difference,${emiDifference},${totalSavings}\n\n`;
    
    csvContent += "Year-wise Comparison\n";
    csvContent += "Year,Flat EMI,Flat Interest,Flat Balance,Reducing EMI,Reducing Interest,Reducing Balance,Interest Savings\n";
    
    // Add table data
    const rows = document.querySelectorAll('#comparisonTableBody tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 0) {
            const rowData = Array.from(cells).map(cell => cell.textContent.trim()).join(',');
            csvContent += rowData + '\n';
        }
    });
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'flat_vs_reducing_rate_calculator.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Excel file downloaded successfully!', 'success');
}

function generatePrintableContent() {
    const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 500000;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 12.0;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 5;
    
    const flatEmi = document.getElementById('flatEmiResult').textContent;
    const reducingEmi = document.getElementById('reducingEmiResult').textContent;
    const emiDifference = document.getElementById('emiDifferenceResult').textContent;
    const flatTotalInterest = document.getElementById('flatTotalInterestResult').textContent;
    const reducingTotalInterest = document.getElementById('reducingTotalInterestResult').textContent;
    const totalSavings = document.getElementById('totalSavingsResult').textContent;
    
    return `
        <div class="header">
            <h1>Flat vs Reducing Rate Interest Calculator</h1>
            <p>Loan Amount: ${formatCurrency(loanAmount)} | Interest Rate: ${interestRate}% | Tenure: ${tenureYears} years</p>
        </div>
        
        <div class="results-grid">
            <div class="result-item">
                <div class="result-label">Flat Rate EMI</div>
                <div class="result-value">${flatEmi}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Reducing Rate EMI</div>
                <div class="result-value">${reducingEmi}</div>
            </div>
            <div class="result-item">
                <div class="result-label">EMI Difference</div>
                <div class="result-value">${emiDifference}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Flat Rate Total Interest</div>
                <div class="result-value">${flatTotalInterest}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Reducing Rate Total Interest</div>
                <div class="result-value">${reducingTotalInterest}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Total Interest Savings</div>
                <div class="result-value savings">${totalSavings}</div>
            </div>
        </div>
        
        <table>
            <thead>
                <tr>
                    <th rowspan="2">Year</th>
                    <th colspan="3">Flat Interest Rate</th>
                    <th colspan="3">Reducing Interest Rate</th>
                    <th rowspan="2">Interest Savings</th>
                </tr>
                <tr>
                    <th>EMI</th>
                    <th>Interest</th>
                    <th>Balance</th>
                    <th>EMI</th>
                    <th>Interest</th>
                    <th>Balance</th>
                </tr>
            </thead>
            <tbody>
                ${document.getElementById('comparisonTableBody').innerHTML}
            </tbody>
        </table>
        
        <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280;">
            Generated on ${new Date().toLocaleDateString()} - Flat vs Reducing Rate Interest Calculator
        </div>
    `;
}

function shareLink() {
    const loanAmount = document.getElementById('loanAmount').value;
    const interestRate = document.getElementById('interestRate').value;
    const tenureYears = document.getElementById('tenureYears').value;
    
    const url = new URL(window.location.href);
    url.searchParams.set('loanAmount', loanAmount);
    url.searchParams.set('interestRate', interestRate);
    url.searchParams.set('tenureYears', tenureYears);
    
    const shareUrl = url.toString();
    
    if (navigator.share) {
        navigator.share({
            title: 'Flat vs Reducing Rate Interest Calculator',
            text: `Compare EMI calculations: ₹${formatCurrency(loanAmount)} at ${interestRate}% for ${tenureYears} years`,
            url: shareUrl
        }).then(() => {
            showNotification('Shared successfully!', 'success');
        }).catch(() => {
            fallbackCopyTextToClipboard(shareUrl);
        });
    } else {
        fallbackCopyTextToClipboard(shareUrl);
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
            showNotification('Failed to copy link. Please copy manually.', 'error');
        }
    } catch (err) {
        showNotification('Failed to copy link. Please copy manually.', 'error');
    }
    
    document.body.removeChild(textArea);
}

function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

function loadFromUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    const loanAmount = urlParams.get('loanAmount');
    const interestRate = urlParams.get('interestRate');
    const tenureYears = urlParams.get('tenureYears');
    
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
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
} 
