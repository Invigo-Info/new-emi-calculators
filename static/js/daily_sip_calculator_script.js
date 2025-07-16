// Global variables
let sipBreakupChart;

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
        { input: 'sipAmount', slider: 'sipAmountSlider', min: 50, max: 10000 },
        { input: 'returnRate', slider: 'returnRateSlider', min: 8, max: 25 },
        { input: 'tenureYears', slider: 'tenureYearsSlider', min: 1, max: 30 },
        { input: 'inflationRate', slider: 'inflationRateSlider', min: 3, max: 12 }
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
    const sipAmount = parseFloat(document.getElementById('sipAmount').value) || 200;
    const returnRate = parseFloat(document.getElementById('returnRate').value) || 12;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 10;
    const inflationRate = parseFloat(document.getElementById('inflationRate').value) || 6;
    
    // Make API call to Daily SIP calculation endpoint
    fetch('/calculate-daily-sip', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            sipAmount: sipAmount,
            returnRate: returnRate,
            tenureYears: tenureYears,
            inflationRate: inflationRate
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
    document.getElementById('totalReturnsResult').textContent = formatCurrency(data.totalReturns);
    document.getElementById('maturityAmountResult').textContent = formatCurrency(data.futureValue);
    document.getElementById('inflationAdjustedResult').textContent = formatCurrency(data.inflationAdjustedValue);
    
    // Update chart summary
    document.getElementById('investedAmountDisplay').textContent = formatCurrency(data.totalInvested);
    document.getElementById('returnsAmountDisplay').textContent = formatCurrency(data.totalReturns);
}

function updateChart(data) {
    const ctx = document.getElementById('sipBreakupChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (sipBreakupChart) {
        sipBreakupChart.destroy();
    }
    
    sipBreakupChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Total Invested', 'Expected Returns'],
            datasets: [{
                data: [data.totalInvested, data.totalReturns],
                backgroundColor: [
                    '#4facfe',  // Blue gradient for invested amount
                    '#43e97b'   // Green gradient for returns
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
                            const percentage = ((context.parsed / data.futureValue) * 100).toFixed(1);
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
        yearRow.innerHTML = `
            <td class="year-cell">
                <span class="expand-icon">▶</span>
                <strong>Year ${yearData.year}</strong>
            </td>
            <td>${formatCurrency(yearData.yearly_invested)}</td>
            <td>${formatCurrency(yearData.cumulative_invested)}</td>
            <td>${formatCurrency(yearData.cumulative_value)}</td>
            <td>${formatCurrency(yearData.yearly_returns)}</td>
            <td>${formatCurrency(yearData.inflation_adjusted_value)}</td>
        `;
        
        // Add click event to show/hide monthly data
        yearRow.addEventListener('click', function() {
            toggleMonthlyRows(this, yearData, index);
        });
        
        tableBody.appendChild(yearRow);
    });
}

function toggleMonthlyRows(yearRow, yearData, yearIndex) {
    const expandIcon = yearRow.querySelector('.expand-icon');
    const isExpanded = expandIcon.textContent === '▼';
    
    if (isExpanded) {
        // Collapse - remove monthly rows
        let nextRow = yearRow.nextSibling;
        while (nextRow && nextRow.classList && nextRow.classList.contains('month-row')) {
            const rowToRemove = nextRow;
            nextRow = nextRow.nextSibling;
            rowToRemove.remove();
        }
        expandIcon.textContent = '▶';
        yearRow.style.backgroundColor = '#f8fafc';
    } else {
        // Expand - generate and add monthly rows
        expandIcon.textContent = '▼';
        yearRow.style.backgroundColor = '#edf2f7';
        
        const monthlyData = generateMonthlyData(yearData, yearIndex);
        let insertAfter = yearRow;
        
        monthlyData.forEach(monthData => {
            const monthRow = document.createElement('tr');
            monthRow.className = 'month-row';
            monthRow.innerHTML = `
                <td style="padding-left: 40px;">${monthData.month}</td>
                <td>${formatCurrency(monthData.yearly_invested / 12)}</td>
                <td>${formatCurrency(monthData.cumulative_invested)}</td>
                <td>${formatCurrency(monthData.cumulative_value)}</td>
                <td>${formatCurrency(monthData.monthly_returns)}</td>
                <td>${formatCurrency(monthData.inflation_adjusted_value)}</td>
            `;
            
            insertAfter.parentNode.insertBefore(monthRow, insertAfter.nextSibling);
            insertAfter = monthRow;
        });
    }
}

function generateMonthlyData(yearData, yearIndex) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = [];
    
    // Get daily SIP amount
    const dailySipAmount = parseFloat(document.getElementById('sipAmount').value) || 200;
    const annualReturn = parseFloat(document.getElementById('returnRate').value) || 12;
    const inflationRate = parseFloat(document.getElementById('inflationRate').value) || 6;
    
    // Calculate monthly breakdown for daily SIP
    const yearlyInvestment = dailySipAmount * 365; // 365 days per year
    const monthlyInvestment = yearlyInvestment / 12;
    
    for (let month = 1; month <= 12; month++) {
        const monthsFromStart = (yearIndex * 12) + month;
        const cumulativeInvested = monthlyInvestment * monthsFromStart;
        
        // Simplified monthly value calculation (approximation)
        const periodsCompleted = monthsFromStart * 30.44; // Average days per month
        const dailyRate = annualReturn / (100 * 365);
        
        let cumulativeValue;
        if (dailyRate === 0) {
            cumulativeValue = cumulativeInvested;
        } else {
            cumulativeValue = dailySipAmount * (((1 + dailyRate) ** periodsCompleted - 1) / dailyRate) * (1 + dailyRate);
        }
        
        const monthlyReturns = cumulativeValue - cumulativeInvested;
        const inflationAdjusted = cumulativeValue / ((1 + inflationRate / 100) ** (monthsFromStart / 12));
        
        monthlyData.push({
            month: months[month - 1],
            yearly_invested: yearlyInvestment,
            cumulative_invested: cumulativeInvested,
            cumulative_value: cumulativeValue,
            monthly_returns: monthlyReturns,
            inflation_adjusted_value: inflationAdjusted
        });
    }
    
    return monthlyData;
}

function setupMegaMenu() {
    const megaMenuBtn = document.querySelector('.mega-menu-btn');
    const megaMenu = document.querySelector('.mega-menu');
    const megaMenuContent = document.querySelector('.mega-menu-content');
    
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
        
        // Prevent mega menu from closing when clicking inside it
        if (megaMenuContent) {
            megaMenuContent.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }
    }
}

function setupDownloadButtons() {
    // Download button functionality will be implemented here
}

function downloadPDF() {
    const sipAmount = parseFloat(document.getElementById('sipAmount').value) || 200;
    const returnRate = parseFloat(document.getElementById('returnRate').value) || 12;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 10;
    const inflationRate = parseFloat(document.getElementById('inflationRate').value) || 6;
    
    const printContent = generatePrintableContent();
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Daily SIP Calculator Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
                .summary-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
                .summary-card h3 { margin: 0 0 10px 0; color: #333; }
                .summary-card .value { font-size: 24px; font-weight: bold; color: #2563eb; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                th { background-color: #f5f5f5; }
                .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
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
    const sipAmount = parseFloat(document.getElementById('sipAmount').value) || 200;
    const returnRate = parseFloat(document.getElementById('returnRate').value) || 12;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 10;
    const inflationRate = parseFloat(document.getElementById('inflationRate').value) || 6;
    
    // Get current results
    const totalInvested = document.getElementById('totalInvestedResult').textContent;
    const totalReturns = document.getElementById('totalReturnsResult').textContent;
    const maturityAmount = document.getElementById('maturityAmountResult').textContent;
    const inflationAdjusted = document.getElementById('inflationAdjustedResult').textContent;
    
    // Create CSV content
    let csvContent = "Daily SIP Calculator Report\n\n";
    csvContent += "Input Parameters:\n";
    csvContent += `Daily SIP Amount,₹${sipAmount}\n`;
    csvContent += `Expected Return Rate,${returnRate}%\n`;
    csvContent += `Investment Period,${tenureYears} years\n`;
    csvContent += `Inflation Rate,${inflationRate}%\n\n`;
    csvContent += "Results Summary:\n";
    csvContent += `Total Invested,${totalInvested}\n`;
    csvContent += `Expected Returns,${totalReturns}\n`;
    csvContent += `Maturity Amount,${maturityAmount}\n`;
    csvContent += `Inflation Adjusted Value,${inflationAdjusted}\n\n`;
    csvContent += "Year-wise Breakdown:\n";
    csvContent += "Year,Yearly Investment,Cumulative Investment,Expected Value,Returns Earned,Inflation Adjusted Value\n";
    
    // Add yearly breakdown data
    const yearlyRows = document.querySelectorAll('#yearlyBreakdownBody .year-row');
    yearlyRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 6) {
            const year = cells[0].textContent.replace(/[▶▼\s]/g, '').replace('Year', '');
            const yearlyInvestment = cells[1].textContent;
            const cumulativeInvestment = cells[2].textContent;
            const expectedValue = cells[3].textContent;
            const returnsEarned = cells[4].textContent;
            const inflationAdjustedValue = cells[5].textContent;
            
            csvContent += `${year},${yearlyInvestment},${cumulativeInvestment},${expectedValue},${returnsEarned},${inflationAdjustedValue}\n`;
        }
    });
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'daily_sip_calculator_report.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Excel file downloaded successfully!', 'success');
}

function generatePrintableContent() {
    const sipAmount = parseFloat(document.getElementById('sipAmount').value) || 200;
    const returnRate = parseFloat(document.getElementById('returnRate').value) || 12;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 10;
    const inflationRate = parseFloat(document.getElementById('inflationRate').value) || 6;
    
    const totalInvested = document.getElementById('totalInvestedResult').textContent;
    const totalReturns = document.getElementById('totalReturnsResult').textContent;
    const maturityAmount = document.getElementById('maturityAmountResult').textContent;
    const inflationAdjusted = document.getElementById('inflationAdjustedResult').textContent;
    
    let printContent = `
        <div class="header">
            <h1>Daily SIP Calculator Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="summary">
            <div class="summary-card">
                <h3>Daily SIP Amount</h3>
                <div class="value">₹${sipAmount.toLocaleString()}</div>
            </div>
            <div class="summary-card">
                <h3>Investment Period</h3>
                <div class="value">${tenureYears} Years</div>
            </div>
            <div class="summary-card">
                <h3>Expected Return Rate</h3>
                <div class="value">${returnRate}%</div>
            </div>
            <div class="summary-card">
                <h3>Inflation Rate</h3>
                <div class="value">${inflationRate}%</div>
            </div>
        </div>
        
        <div class="summary">
            <div class="summary-card">
                <h3>Total Invested</h3>
                <div class="value">${totalInvested}</div>
            </div>
            <div class="summary-card">
                <h3>Expected Returns</h3>
                <div class="value">${totalReturns}</div>
            </div>
            <div class="summary-card">
                <h3>Maturity Amount</h3>
                <div class="value">${maturityAmount}</div>
            </div>
            <div class="summary-card">
                <h3>Inflation Adjusted Value</h3>
                <div class="value">${inflationAdjusted}</div>
            </div>
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>Year</th>
                    <th>Yearly Investment</th>
                    <th>Cumulative Investment</th>
                    <th>Expected Value</th>
                    <th>Returns Earned</th>
                    <th>Inflation Adjusted Value</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    const yearlyRows = document.querySelectorAll('#yearlyBreakdownBody .year-row');
    yearlyRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 6) {
            printContent += `
                <tr>
                    <td>${cells[0].textContent.replace(/[▶▼\s]/g, '').replace('Year', '')}</td>
                    <td>${cells[1].textContent}</td>
                    <td>${cells[2].textContent}</td>
                    <td>${cells[3].textContent}</td>
                    <td>${cells[4].textContent}</td>
                    <td>${cells[5].textContent}</td>
                </tr>
            `;
        }
    });
    
    printContent += `
            </tbody>
        </table>
        
        <div class="footer">
            <p>This report is generated by Daily SIP Calculator. Values are approximate and for illustrative purposes only.</p>
        </div>
    `;
    
    return printContent;
}

function shareLink() {
    const sipAmount = parseFloat(document.getElementById('sipAmount').value) || 200;
    const returnRate = parseFloat(document.getElementById('returnRate').value) || 12;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 10;
    const inflationRate = parseFloat(document.getElementById('inflationRate').value) || 6;
    
    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams({
        sipAmount: sipAmount,
        returnRate: returnRate,
        tenureYears: tenureYears,
        inflationRate: inflationRate
    });
    
    const shareUrl = `${baseUrl}?${params.toString()}`;
    
    // Try to use the Clipboard API
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
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#48bb78' : '#f56565'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 400px;
        word-wrap: break-word;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    notification.style.transform = 'translateX(100%)';
    notification.style.transition = 'transform 0.3s ease';
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

function loadFromUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    const sipAmount = urlParams.get('sipAmount');
    const returnRate = urlParams.get('returnRate');
    const tenureYears = urlParams.get('tenureYears');
    const inflationRate = urlParams.get('inflationRate');
    
    if (sipAmount) {
        document.getElementById('sipAmount').value = sipAmount;
        document.getElementById('sipAmountSlider').value = sipAmount;
    }
    if (returnRate) {
        document.getElementById('returnRate').value = returnRate;
        document.getElementById('returnRateSlider').value = returnRate;
    }
    if (tenureYears) {
        document.getElementById('tenureYears').value = tenureYears;
        document.getElementById('tenureYearsSlider').value = tenureYears;
    }
    if (inflationRate) {
        document.getElementById('inflationRate').value = inflationRate;
        document.getElementById('inflationRateSlider').value = inflationRate;
    }
}

function formatCurrency(amount) {
    if (typeof amount === 'string') {
        // If it's already formatted, return as is
        return amount;
    }
    
    const num = parseFloat(amount);
    if (isNaN(num)) return '₹0';
    
    // Format in Indian numbering system with commas
    return '₹' + num.toLocaleString('en-IN', { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 0 
    });
} 