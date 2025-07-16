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
    fetch('/calculate-expense-ratio', {
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
    document.getElementById('grossReturnsResult').textContent = formatCurrency(data.grossReturns);
    document.getElementById('expenseImpactResult').textContent = formatCurrency(data.expenseImpact);
    document.getElementById('netReturnsResult').textContent = formatCurrency(data.netReturns);
    document.getElementById('finalAmountResult').textContent = formatCurrency(data.finalAmount);
    
    // Update chart summary
    document.getElementById('investedAmountDisplay').textContent = formatCurrency(data.totalInvested);
    document.getElementById('netReturnsDisplay').textContent = formatCurrency(data.netReturns);
    document.getElementById('expenseImpactDisplay').textContent = formatCurrency(data.expenseImpact);
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
            labels: ['Total Invested', 'Net Returns', 'Expense Impact'],
            datasets: [{
                data: [data.totalInvested, data.netReturns, data.expenseImpact],
                backgroundColor: [
                    '#4facfe',  // Blue for invested amount
                    '#43e97b',  // Green for net returns
                    '#fa709a'   // Pink for expense impact
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
                            const total = data.totalInvested + data.netReturns + data.expenseImpact;
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
    const tableBody = document.getElementById('yearlyBreakdownBody');
    tableBody.innerHTML = '';
    
    yearlyBreakdown.forEach((yearData, index) => {
        // Create year row
        const yearRow = document.createElement('tr');
        yearRow.className = 'year-row';
        yearRow.style.cursor = 'pointer';
        yearRow.style.backgroundColor = '#f8fafc';
        yearRow.setAttribute('data-year', yearData.year);
        // Calculate yearly investment amount
        const yearlyInvestment = yearData.monthlyData.reduce((sum, month) => sum + month.investment, 0);
        
        yearRow.innerHTML = `
            <td class="year-cell">
                <span class="expand-icon">▶</span>
                <strong>Year ${yearData.year}</strong>
            </td>
            <td style="text-align: right;">${formatCurrency(yearlyInvestment)}</td>
            <td style="text-align: right;">${formatCurrency(yearData.grossValue)}</td>
            <td style="text-align: right;">${formatCurrency(yearData.expenseCost)}</td>
            <td style="text-align: right;">${formatCurrency(yearData.netValue)}</td>
        `;
        
        // Add click event listener for expansion
        yearRow.addEventListener('click', function() {
            toggleYearExpansion(this, yearData);
        });
        
        tableBody.appendChild(yearRow);
    });
}

function toggleYearExpansion(yearRow, yearData) {
    const expandIcon = yearRow.querySelector('.expand-icon');
    const year = yearRow.getAttribute('data-year');
    const isExpanded = expandIcon.textContent === '▼';
    
    if (isExpanded) {
        // Collapse - remove monthly rows
        let nextRow = yearRow.nextElementSibling;
        while (nextRow && nextRow.classList.contains('month-row')) {
            const rowToRemove = nextRow;
            nextRow = nextRow.nextElementSibling;
            rowToRemove.remove();
        }
        expandIcon.textContent = '▶';
    } else {
        // Expand - display monthly data
        expandIcon.textContent = '▼';
        displayMonthlyRows(yearRow, yearData.monthlyData);
    }
}

function displayMonthlyRows(yearRow, monthlyData) {
    let insertAfter = yearRow;
    
    monthlyData.forEach((monthData, index) => {
        const monthRow = document.createElement('tr');
        monthRow.className = 'month-row';
        monthRow.style.backgroundColor = index % 2 === 0 ? '#fafafa' : '#ffffff';
        
        monthRow.innerHTML = `
            <td style="padding-left: 30px; color: #64748b; font-size: 13px;">
                ${monthData.month}
            </td>
            <td style="text-align: right; color: #64748b; font-size: 13px;">
                ${formatCurrency(monthData.investment)}
            </td>
            <td style="text-align: right; color: #64748b; font-size: 13px;">
                ${formatCurrency(monthData.grossValue)}
            </td>
            <td style="text-align: right; color: #64748b; font-size: 13px;">
                ${formatCurrency(monthData.expenseCost)}
            </td>
            <td style="text-align: right; color: #64748b; font-size: 13px;">
                ${formatCurrency(monthData.netValue)}
            </td>
        `;
        
        // Insert after the current row
        insertAfter.parentNode.insertBefore(monthRow, insertAfter.nextSibling);
        insertAfter = monthRow;
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
    // Download buttons are already set up with onclick attributes in HTML
}

function downloadPDF() {
    const investmentAmount = parseFloat(document.getElementById('investmentAmount').value) || 100000;
    const investmentType = document.getElementById('investmentType').value || 'lumpsum';
    const expectedReturn = parseFloat(document.getElementById('expectedReturn').value) || 12;
    const expenseRatio = parseFloat(document.getElementById('expenseRatio').value) || 1.5;
    const investmentPeriod = parseInt(document.getElementById('investmentPeriod').value) || 10;
    
    const totalInvested = document.getElementById('totalInvestedResult').textContent;
    const grossReturns = document.getElementById('grossReturnsResult').textContent;
    const expenseImpact = document.getElementById('expenseImpactResult').textContent;
    const netReturns = document.getElementById('netReturnsResult').textContent;
    const finalAmount = document.getElementById('finalAmountResult').textContent;
    
    const printableContent = generatePrintableContent();
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Expense Ratio Calculator Results</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3182ce; padding-bottom: 15px; }
                .results-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 30px; }
                .result-item { padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; }
                .result-label { font-weight: bold; color: #4a5568; margin-bottom: 5px; }
                .result-value { font-size: 1.2em; color: #2d3748; font-weight: bold; }
                .inputs-section { margin-bottom: 30px; }
                .input-item { margin-bottom: 10px; display: flex; justify-content: space-between; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: right; }
                th { background: #3182ce; color: white; }
                .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #64748b; }
            </style>
        </head>
        <body>
            ${printableContent}
        </body>
        </html>
    `);
    
    printWindow.document.close();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
}

function downloadExcel() {
    const tableData = [];
    const tableBody = document.getElementById('yearlyBreakdownBody');
    const rows = tableBody.querySelectorAll('tr');
    
    // Add headers
    tableData.push(['Year/Month', 'Investment', 'Gross Value', 'Expense Cost', 'Net Value']);
    
    // Add data rows
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const rowData = [];
        cells.forEach(cell => {
            let cellText = cell.textContent.trim();
            // Remove currency symbols and commas for numeric values
            if (cellText.includes('₹')) {
                cellText = cellText.replace(/₹|,/g, '');
            }
            rowData.push(cellText);
        });
        tableData.push(rowData);
    });
    
    // Create CSV content
    const csvContent = tableData.map(row => row.join(',')).join('\n');
    
    // Add summary information at the top
    const investmentAmount = document.getElementById('investmentAmount').value;
    const investmentType = document.getElementById('investmentType').value;
    const expectedReturn = document.getElementById('expectedReturn').value;
    const expenseRatio = document.getElementById('expenseRatio').value;
    const investmentPeriod = document.getElementById('investmentPeriod').value;
    
    const totalInvested = document.getElementById('totalInvestedResult').textContent.replace(/₹|,/g, '');
    const grossReturns = document.getElementById('grossReturnsResult').textContent.replace(/₹|,/g, '');
    const expenseImpact = document.getElementById('expenseImpactResult').textContent.replace(/₹|,/g, '');
    const netReturns = document.getElementById('netReturnsResult').textContent.replace(/₹|,/g, '');
    const finalAmount = document.getElementById('finalAmountResult').textContent.replace(/₹|,/g, '');
    
    const summaryContent = `Expense Ratio Calculator Results
Investment Amount,${investmentAmount}
Investment Type,${investmentType}
Expected Return,${expectedReturn}%
Expense Ratio,${expenseRatio}%
Investment Period,${investmentPeriod} years

Summary Results
Total Invested,${totalInvested}
Gross Returns,${grossReturns}
Expense Impact,${expenseImpact}
Net Returns,${netReturns}
Final Amount,${finalAmount}

Year-wise Breakdown
${csvContent}`;
    
    // Create and download file
    const blob = new Blob([summaryContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'expense_ratio_calculator_results.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function generatePrintableContent() {
    const investmentAmount = document.getElementById('investmentAmount').value;
    const investmentType = document.getElementById('investmentType').value;
    const expectedReturn = document.getElementById('expectedReturn').value;
    const expenseRatio = document.getElementById('expenseRatio').value;
    const investmentPeriod = document.getElementById('investmentPeriod').value;
    
    const totalInvested = document.getElementById('totalInvestedResult').textContent;
    const grossReturns = document.getElementById('grossReturnsResult').textContent;
    const expenseImpact = document.getElementById('expenseImpactResult').textContent;
    const netReturns = document.getElementById('netReturnsResult').textContent;
    const finalAmount = document.getElementById('finalAmountResult').textContent;
    
    // Get table data
    const tableBody = document.getElementById('yearlyBreakdownBody');
    const tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Year/Month</th>
                    <th>Investment</th>
                    <th>Gross Value</th>
                    <th>Expense Cost</th>
                    <th>Net Value</th>
                </tr>
            </thead>
            <tbody>
                ${tableBody.innerHTML}
            </tbody>
        </table>
    `;
    
    return `
        <div class="header">
            <h1>Expense Ratio Calculator Results</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="inputs-section">
            <h2>Input Parameters</h2>
            <div class="input-item"><span>Investment Amount:</span><span>₹${parseInt(investmentAmount).toLocaleString('en-IN')}</span></div>
            <div class="input-item"><span>Investment Type:</span><span>${investmentType}</span></div>
            <div class="input-item"><span>Expected Return:</span><span>${expectedReturn}%</span></div>
            <div class="input-item"><span>Expense Ratio:</span><span>${expenseRatio}%</span></div>
            <div class="input-item"><span>Investment Period:</span><span>${investmentPeriod} years</span></div>
        </div>
        
        <div class="results-grid">
            <div class="result-item">
                <div class="result-label">Total Invested</div>
                <div class="result-value">${totalInvested}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Gross Returns</div>
                <div class="result-value">${grossReturns}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Expense Impact</div>
                <div class="result-value">${expenseImpact}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Net Returns</div>
                <div class="result-value">${netReturns}</div>
            </div>
            <div class="result-item" style="grid-column: 1 / -1;">
                <div class="result-label">Final Amount</div>
                <div class="result-value">${finalAmount}</div>
            </div>
        </div>
        
        <h2>Year-wise Investment Breakdown</h2>
        ${tableHTML}
        
        <div class="footer">
            <p>This report was generated using the Expense Ratio Calculator</p>
        </div>
    `;
}

function shareLink() {
    const investmentAmount = document.getElementById('investmentAmount').value;
    const investmentType = document.getElementById('investmentType').value;
    const expectedReturn = document.getElementById('expectedReturn').value;
    const expenseRatio = document.getElementById('expenseRatio').value;
    const investmentPeriod = document.getElementById('investmentPeriod').value;
    
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
            title: 'Expense Ratio Calculator',
            text: 'Check out this expense ratio calculation!',
            url: shareUrl
        }).then(() => {
            showNotification('Link shared successfully!', 'success');
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
    textArea.style.opacity = '0';
    
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
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        font-size: 14px;
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        ${type === 'success' ? 'background: #10b981;' : 'background: #ef4444;'}
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
            document.body.removeChild(notification);
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
    return `₹${Math.round(amount).toLocaleString('en-IN')}`;
} 