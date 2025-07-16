// Global variables
let expenseRatioChart;

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
        { input: 'investmentAmount', slider: 'investmentAmountSlider', min: 1000, max: 10000000 },
        { input: 'expectedReturn', slider: 'expectedReturnSlider', min: 5, max: 30 },
        { input: 'expenseRatio', slider: 'expenseRatioSlider', min: 0.1, max: 3.5 },
        { input: 'investmentPeriod', slider: 'investmentPeriodSlider', min: 1, max: 30 }
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
    
    // Investment type dropdown change
    const investmentTypeSelect = document.getElementById('investmentType');
    if (investmentTypeSelect) {
        investmentTypeSelect.addEventListener('change', function() {
            calculateAndUpdate();
        });
    }
}

function calculateAndUpdate() {
    const investmentAmount = parseFloat(document.getElementById('investmentAmount').value) || 100000;
    const investmentType = document.getElementById('investmentType').value || 'lumpsum';
    const expectedReturn = parseFloat(document.getElementById('expectedReturn').value) || 12;
    const expenseRatio = parseFloat(document.getElementById('expenseRatio').value) || 1.5;
    const investmentPeriod = parseInt(document.getElementById('investmentPeriod').value) || 10;
    
    // Make API call
    fetch('/calculate-mutual-fund-expense-ratio', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            investmentAmount: investmentAmount,
            investmentType: investmentType,
            expectedReturn: expectedReturn,
            expenseRatio: expenseRatio,
            investmentPeriod: investmentPeriod
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            updateResults(data);
            updateChart(data);
            updateYearlyBreakdownTable(data.yearlyBreakdown);
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
    document.getElementById('totalInvestedResult').textContent = formatCurrency(data.totalInvested);
    document.getElementById('grossReturnsResult').textContent = formatCurrency(data.grossMaturityAmount);
    document.getElementById('expenseImpactResult').textContent = formatCurrency(data.totalExpenseCost);
    document.getElementById('netMaturityResult').textContent = formatCurrency(data.netMaturityAmount);
    document.getElementById('annualExpenseResult').textContent = formatCurrency(data.annualExpenseCost);
    
    // Update chart summary
    document.getElementById('investedAmountDisplay').textContent = formatCurrency(data.totalInvested);
    document.getElementById('netReturnsDisplay').textContent = formatCurrency(data.netReturns);
    document.getElementById('expenseCostDisplay').textContent = formatCurrency(data.totalExpenseCost);
}

function updateChart(data) {
    const ctx = document.getElementById('expenseRatioChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (expenseRatioChart) {
        expenseRatioChart.destroy();
    }
    
    expenseRatioChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Total Invested', 'Net Returns', 'Expense Cost'],
            datasets: [{
                data: [data.totalInvested, data.netReturns, data.totalExpenseCost],
                backgroundColor: [
                    '#4facfe',  // Blue for invested amount
                    '#43e97b',  // Green for net returns
                    '#fa709a'   // Pink for expense cost
                ],
                borderWidth: 0,
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#fff',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = formatCurrency(context.parsed);
                            const total = data.totalInvested + data.netReturns + data.totalExpenseCost;
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true,
                duration: 1000,
                easing: 'easeOutCubic'
            }
        }
    });
}

function updateYearlyBreakdownTable(yearlyBreakdown) {
    const tableBody = document.getElementById('yearlyComparisonBody');
    tableBody.innerHTML = '';
    
    yearlyBreakdown.forEach((yearData) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>Year ${yearData.year}</strong></td>
            <td>${formatCurrency(yearData.totalInvestment)}</td>
            <td>${formatCurrency(yearData.grossValue)}</td>
            <td>${formatCurrency(yearData.expenseCost)}</td>
            <td>${formatCurrency(yearData.netValue)}</td>
        `;
        tableBody.appendChild(row);
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
        
        // Close mega menu when clicking on a link
        const megaLinks = megaMenu.querySelectorAll('.mega-link');
        megaLinks.forEach(link => {
            link.addEventListener('click', function() {
                megaMenu.classList.remove('open');
            });
        });
    }
}

function setupDownloadButtons() {
    // Download button functionality will be implemented here
}

function downloadPDF() {
    const investmentAmount = parseFloat(document.getElementById('investmentAmount').value) || 100000;
    const investmentType = document.getElementById('investmentType').value || 'lumpsum';
    const expectedReturn = parseFloat(document.getElementById('expectedReturn').value) || 12;
    const expenseRatio = parseFloat(document.getElementById('expenseRatio').value) || 1.5;
    const investmentPeriod = parseInt(document.getElementById('investmentPeriod').value) || 10;
    
    const printContent = generatePrintableContent();
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Mutual Fund Expense Ratio Calculator - Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .section { margin-bottom: 20px; }
                .input-table, .result-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                .input-table th, .input-table td, .result-table th, .result-table td { 
                    padding: 8px; border: 1px solid #ddd; text-align: left; 
                }
                .input-table th, .result-table th { background-color: #f5f5f5; }
                .highlight { background-color: #e8f5e8; font-weight: bold; }
            </style>
        </head>
        <body>
            ${printContent}
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
}

function downloadExcel() {
    const investmentAmount = parseFloat(document.getElementById('investmentAmount').value) || 100000;
    const investmentType = document.getElementById('investmentType').value || 'lumpsum';
    const expectedReturn = parseFloat(document.getElementById('expectedReturn').value) || 12;
    const expenseRatio = parseFloat(document.getElementById('expenseRatio').value) || 1.5;
    const investmentPeriod = parseInt(document.getElementById('investmentPeriod').value) || 10;
    
    // Get current results
    const totalInvested = document.getElementById('totalInvestedResult').textContent;
    const grossReturns = document.getElementById('grossReturnsResult').textContent;
    const expenseImpact = document.getElementById('expenseImpactResult').textContent;
    const netMaturity = document.getElementById('netMaturityResult').textContent;
    const afterTax = document.getElementById('afterTaxResult').textContent;
    const annualExpense = document.getElementById('annualExpenseResult').textContent;
    
    // Create CSV content
    let csvContent = "Mutual Fund Expense Ratio Calculator Report\n\n";
    csvContent += "Input Parameters\n";
    csvContent += "Parameter,Value\n";
    csvContent += `Investment Amount,${formatCurrency(investmentAmount)}\n`;
    csvContent += `Investment Type,${investmentType.charAt(0).toUpperCase() + investmentType.slice(1)}\n`;
    csvContent += `Expected Return,${expectedReturn}%\n`;
    csvContent += `Expense Ratio,${expenseRatio}%\n`;
    csvContent += `Investment Period,${investmentPeriod} years\n`;
    csvContent += "\n";
    csvContent += "Results\n";
    csvContent += "Metric,Amount\n";
    csvContent += `Total Invested,${totalInvested}\n`;
    csvContent += `Gross Returns,${grossReturns}\n`;
    csvContent += `Expense Impact,${expenseImpact}\n`;
    csvContent += `Net Maturity Amount,${netMaturity}\n`;
    csvContent += `Annual Expense Cost,${annualExpense}\n`;
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'mutual_fund_expense_ratio_calculation.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function generatePrintableContent() {
    const investmentAmount = parseFloat(document.getElementById('investmentAmount').value) || 100000;
    const investmentType = document.getElementById('investmentType').value || 'lumpsum';
    const expectedReturn = parseFloat(document.getElementById('expectedReturn').value) || 12;
    const expenseRatio = parseFloat(document.getElementById('expenseRatio').value) || 1.5;
    const investmentPeriod = parseInt(document.getElementById('investmentPeriod').value) || 10;
    
    // Get current results
    const totalInvested = document.getElementById('totalInvestedResult').textContent;
    const grossReturns = document.getElementById('grossReturnsResult').textContent;
    const expenseImpact = document.getElementById('expenseImpactResult').textContent;
    const netMaturity = document.getElementById('netMaturityResult').textContent;
    const afterTax = document.getElementById('afterTaxResult').textContent;
    const annualExpense = document.getElementById('annualExpenseResult').textContent;
    
    return `
        <div class="header">
            <h1>Mutual Fund Expense Ratio Calculator</h1>
            <p>Calculation Report - Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="section">
            <h2>Input Parameters</h2>
            <table class="input-table">
                <tr><td><strong>Investment Amount</strong></td><td>${formatCurrency(investmentAmount)}</td></tr>
                <tr><td><strong>Investment Type</strong></td><td>${investmentType.charAt(0).toUpperCase() + investmentType.slice(1)}</td></tr>
                <tr><td><strong>Expected Annual Return</strong></td><td>${expectedReturn}%</td></tr>
                <tr><td><strong>Expense Ratio</strong></td><td>${expenseRatio}%</td></tr>
                <tr><td><strong>Investment Period</strong></td><td>${investmentPeriod} years</td></tr>
            </table>
        </div>
        
        <div class="section">
            <h2>Calculation Results</h2>
            <table class="result-table">
                <tr><td><strong>Total Invested</strong></td><td>${totalInvested}</td></tr>
                <tr><td><strong>Gross Maturity Amount</strong></td><td>${grossReturns}</td></tr>
                <tr><td><strong>Total Expense Cost</strong></td><td>${expenseImpact}</td></tr>
                <tr class="highlight"><td><strong>Net Maturity Amount</strong></td><td>${netMaturity}</td></tr>
                <tr><td><strong>Annual Expense Cost</strong></td><td>${annualExpense}</td></tr>
            </table>
        </div>
    `;
}

function shareLink() {
    const investmentAmount = parseFloat(document.getElementById('investmentAmount').value) || 100000;
    const investmentType = document.getElementById('investmentType').value || 'lumpsum';
    const expectedReturn = parseFloat(document.getElementById('expectedReturn').value) || 12;
    const expenseRatio = parseFloat(document.getElementById('expenseRatio').value) || 1.5;
    const investmentPeriod = parseInt(document.getElementById('investmentPeriod').value) || 10;
    
    const params = new URLSearchParams({
        amount: investmentAmount,
        type: investmentType,
        return: expectedReturn,
        expense: expenseRatio,
        period: investmentPeriod
    });
    
    const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Mutual Fund Expense Ratio Calculator',
            text: `Calculate the impact of expense ratio on your mutual fund returns`,
            url: shareUrl
        }).then(() => {
            showNotification('Link shared successfully!', 'success');
        }).catch((error) => {
            console.log('Error sharing:', error);
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
            showNotification('Link copied to clipboard!', 'success');
        } else {
            showNotification('Failed to copy link', 'error');
        }
    } catch (err) {
        console.error('Fallback: Unable to copy', err);
        showNotification('Failed to copy link', 'error');
    }
    
    document.body.removeChild(textArea);
}

function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#48bb78' : '#f56565'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
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
    
    if (urlParams.get('amount')) {
        document.getElementById('investmentAmount').value = urlParams.get('amount');
        document.getElementById('investmentAmountSlider').value = urlParams.get('amount');
    }
    if (urlParams.get('type')) {
        document.getElementById('investmentType').value = urlParams.get('type');
    }
    if (urlParams.get('return')) {
        document.getElementById('expectedReturn').value = urlParams.get('return');
        document.getElementById('expectedReturnSlider').value = urlParams.get('return');
    }
    if (urlParams.get('expense')) {
        document.getElementById('expenseRatio').value = urlParams.get('expense');
        document.getElementById('expenseRatioSlider').value = urlParams.get('expense');
    }
    if (urlParams.get('period')) {
        document.getElementById('investmentPeriod').value = urlParams.get('period');
        document.getElementById('investmentPeriodSlider').value = urlParams.get('period');
    }
}

function formatCurrency(amount) {
    // Format numbers according to Indian numbering system with commas
    return '₹' + Math.round(amount).toLocaleString('en-IN');
} 