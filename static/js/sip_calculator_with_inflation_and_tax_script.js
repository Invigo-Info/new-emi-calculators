// Global variables
let sipInflationTaxBreakupChart;

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
        { input: 'sipAmount', slider: 'sipAmountSlider', min: 0, max: 1000000 },
        { input: 'returnRate', slider: 'returnRateSlider', min: 0, max: 25 },
        { input: 'tenureYears', slider: 'tenureYearsSlider', min: 1, max: 30 },
        { input: 'inflationRate', slider: 'inflationRateSlider', min: 0, max: 15 },
        { input: 'taxRate', slider: 'taxRateSlider', min: 0, max: 30 }
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
    const sipAmount = parseFloat(document.getElementById('sipAmount').value) || 5000;
    const returnRate = parseFloat(document.getElementById('returnRate').value) || 12;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 10;
    const inflationRate = parseFloat(document.getElementById('inflationRate').value) || 6;
    const taxRate = parseFloat(document.getElementById('taxRate').value) || 10;
    
    // Make API call
    fetch('/calculate-sip-with-inflation-and-tax', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            sipAmount: sipAmount,
            returnRate: returnRate,
            tenureYears: tenureYears,
            inflationRate: inflationRate,
            taxRate: taxRate
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
    // Get current tax rate and inflation rate to check if they're 0
    const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
    const inflationRate = parseFloat(document.getElementById('inflationRate').value) || 0;
    
    // Update result cards
    document.getElementById('totalInvestedResult').textContent = formatCurrency(data.totalInvested);
    document.getElementById('grossReturnsResult').textContent = formatCurrency(data.grossReturns);
    document.getElementById('inflationImpactResult').textContent = inflationRate === 0 ? 'N/A' : formatCurrency(data.inflationImpact);
    document.getElementById('taxImpactResult').textContent = taxRate === 0 ? 'N/A' : formatCurrency(data.taxImpact);
    document.getElementById('netReturnsResult').textContent = formatCurrency(data.netReturns);
    document.getElementById('maturityAmountResult').textContent = formatCurrency(data.finalAmount);
    document.getElementById('realValueResult').textContent = inflationRate === 0 ? formatCurrency(data.finalAmount) : formatCurrency(data.realValue);
    
    // Update chart summary
    document.getElementById('investedAmountDisplay').textContent = formatCurrency(data.totalInvested);
    document.getElementById('netReturnsAmountDisplay').textContent = formatCurrency(data.netReturns);
    document.getElementById('inflationImpactDisplay').textContent = inflationRate === 0 ? 'N/A' : formatCurrency(data.inflationImpact);
    document.getElementById('taxImpactDisplay').textContent = taxRate === 0 ? 'N/A' : formatCurrency(data.taxImpact);
}

function updateChart(data) {
    const ctx = document.getElementById('sipInflationTaxBreakupChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (sipInflationTaxBreakupChart) {
        sipInflationTaxBreakupChart.destroy();
    }
    
    // Get current tax rate and inflation rate to check if they're 0
    const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
    const inflationRate = parseFloat(document.getElementById('inflationRate').value) || 0;
    
    // Prepare chart data based on tax rate and inflation rate
    let chartLabels, chartData, chartColors;
    
    if (taxRate === 0 && inflationRate === 0) {
        // Show only basic components when both are 0
        chartLabels = ['Total Invested', 'Net Returns'];
        chartData = [data.totalInvested, data.netReturns];
        chartColors = [
            '#4facfe',  // Blue for invested amount
            '#43e97b'   // Green for net returns
        ];
    } else if (taxRate === 0) {
        // Exclude tax impact from chart when tax rate is 0
        chartLabels = ['Total Invested', 'Net Returns', 'Inflation Impact'];
        chartData = [data.totalInvested, data.netReturns, data.inflationImpact];
        chartColors = [
            '#4facfe',  // Blue for invested amount
            '#43e97b',  // Green for net returns
            '#ff9500'   // Orange for inflation impact
        ];
    } else if (inflationRate === 0) {
        // Exclude inflation impact from chart when inflation rate is 0
        chartLabels = ['Total Invested', 'Net Returns', 'Tax Impact'];
        chartData = [data.totalInvested, data.netReturns, data.taxImpact];
        chartColors = [
            '#4facfe',  // Blue for invested amount
            '#43e97b',  // Green for net returns
            '#e91e63'   // Pink for tax impact
        ];
    } else {
        // Include both impacts when neither rate is 0
        chartLabels = ['Total Invested', 'Net Returns', 'Inflation Impact', 'Tax Impact'];
        chartData = [data.totalInvested, data.netReturns, data.inflationImpact, data.taxImpact];
        chartColors = [
            '#4facfe',  // Blue for invested amount
            '#43e97b',  // Green for net returns
            '#ff9500',  // Orange for inflation impact
            '#e91e63'   // Pink for tax impact
        ];
    }
    
    sipInflationTaxBreakupChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: chartLabels,
            datasets: [{
                data: chartData,
                backgroundColor: chartColors,
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
                            const total = chartData.reduce((sum, val) => sum + val, 0);
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
    
    // Get current tax rate and inflation rate to check if they're 0
    const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
    const inflationRate = parseFloat(document.getElementById('inflationRate').value) || 0;
    
    yearlyBreakdown.forEach((yearData, index) => {
        // Create year row
        const yearRow = document.createElement('tr');
        yearRow.className = 'year-row';
        yearRow.style.cursor = 'pointer';
        yearRow.style.backgroundColor = '#f8fafc';
        yearRow.setAttribute('data-year', yearData.year);
        yearRow.innerHTML = `
            <td class="year-cell">
                <span class="expand-icon">▶</span>
                <strong>Year ${yearData.year}</strong>
            </td>
            <td>${formatCurrency(yearData.yearly_invested)}</td>
            <td>${formatCurrency(yearData.cumulative_invested)}</td>
            <td>${formatCurrency(yearData.gross_value)}</td>
            <td>${taxRate === 0 ? 'N/A' : formatCurrency(yearData.tax_impact)}</td>
            <td>${formatCurrency(yearData.net_value)}</td>
            <td>${inflationRate === 0 ? formatCurrency(yearData.net_value) : formatCurrency(yearData.real_value)}</td>
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
        // Expand - fetch and display monthly data
        expandIcon.textContent = '▼';
        fetchMonthlyData(year, yearRow, yearData);
    }
}

function fetchMonthlyData(year, yearRow, yearData) {
    // Since we don't have a separate monthly API, calculate it on the frontend
    const sipAmount = parseFloat(document.getElementById('sipAmount').value) || 5000;
    const annualRate = parseFloat(document.getElementById('returnRate').value) || 12;
    const inflationRate = parseFloat(document.getElementById('inflationRate').value) || 6;
    const taxRate = parseFloat(document.getElementById('taxRate').value) || 10;
    
    const monthlyData = calculateMonthlyData(year, sipAmount, annualRate, inflationRate, taxRate, yearData);
    displayMonthlyRows(yearRow, monthlyData);
}

function calculateMonthlyData(year, sipAmount, annualRate, inflationRate, taxRate, yearData) {
    const monthlyRate = annualRate / (12 * 100);
    const monthlyInflationRate = inflationRate / (12 * 100);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = [];
    
    // Calculate cumulative invested amount at the start of this year
    const startOfYearInvested = (year - 1) * 12 * sipAmount;
    
    for (let month = 1; month <= 12; month++) {
        const monthIndex = month - 1;
        const totalMonthsElapsed = (year - 1) * 12 + month;
        
        // Monthly investment (always sipAmount)
        const monthlyInvestment = sipAmount;
        
        // Cumulative investment including this month
        const cumulativeInvestment = totalMonthsElapsed * sipAmount;
        
        // Calculate gross value using compound growth formula
        let grossValue = 0;
        for (let i = 1; i <= totalMonthsElapsed; i++) {
            const monthsToGrow = totalMonthsElapsed - i + 1;
            grossValue += sipAmount * Math.pow(1 + monthlyRate, monthsToGrow);
        }
        
        // Calculate gains
        const totalGains = grossValue - cumulativeInvestment;
        
        // Calculate tax impact (only on gains)
        const taxImpact = totalGains * (taxRate / 100);
        
        // Net value after tax
        const netValue = grossValue - taxImpact;
        
        // Calculate real value (adjusted for inflation)
        const inflationAdjustmentFactor = Math.pow(1 + monthlyInflationRate, totalMonthsElapsed);
        const realValue = netValue / inflationAdjustmentFactor;
        
        monthlyData.push({
            month: months[monthIndex],
            monthly_investment: monthlyInvestment,
            cumulative_investment: cumulativeInvestment,
            gross_value: grossValue,
            tax_impact: taxImpact,
            net_value: netValue,
            real_value: realValue
        });
    }
    
    return monthlyData;
}

function getMonthName(monthNum) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthNum - 1];
}

function displayMonthlyRows(yearRow, monthlyData) {
    // Get current tax rate and inflation rate to check if they're 0
    const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
    const inflationRate = parseFloat(document.getElementById('inflationRate').value) || 0;
    
    monthlyData.forEach(data => {
        const monthRow = document.createElement('tr');
        monthRow.className = 'month-row';
        monthRow.innerHTML = `
            <td>${data.month}</td>
            <td>${formatCurrency(data.monthly_investment)}</td>
            <td>${formatCurrency(data.cumulative_investment)}</td>
            <td>${formatCurrency(data.gross_value)}</td>
            <td>${taxRate === 0 ? 'N/A' : formatCurrency(data.tax_impact)}</td>
            <td>${formatCurrency(data.net_value)}</td>
            <td>${inflationRate === 0 ? formatCurrency(data.net_value) : formatCurrency(data.real_value)}</td>
        `;
        
        // Insert after the year row
        yearRow.parentNode.insertBefore(monthRow, yearRow.nextSibling);
    });
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
        
        // Close when clicking outside
        document.addEventListener('click', function(e) {
            if (!megaMenu.contains(e.target)) {
                megaMenu.classList.remove('open');
            }
        });
        
        // Prevent closing when clicking inside the menu content
        if (megaMenuContent) {
            megaMenuContent.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }
    }
}

function setupDownloadButtons() {
    // Download buttons are set up via onclick attributes in HTML
}

function downloadPDF() {
    const printableContent = generatePrintableContent();
    
    // Open a new window with the printable content
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printableContent);
    printWindow.document.close();
    
    // Trigger print dialog
    printWindow.onload = function() {
        printWindow.print();
        printWindow.close();
    };
    
    showNotification('PDF download initiated', 'success');
}

function downloadExcel() {
    // Create CSV content for Excel compatibility
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Year,Yearly Investment,Cumulative Investment,Gross Value,Tax Impact,Net Value (After Tax),Real Value (After Inflation)\n';
    
    const rows = document.querySelectorAll('#yearlyBreakdownTable tbody tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 7) {
            const year = cells[0].textContent.replace('▶', '').replace('Year ', '').trim();
            csvContent += `${year},${cells[1].textContent},${cells[2].textContent},${cells[3].textContent},${cells[4].textContent},${cells[5].textContent},${cells[6].textContent}\n`;
        }
    });
    
    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'sip_inflation_tax_calculation.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Excel file downloaded successfully', 'success');
}

function generatePrintableContent() {
    const sipAmount = parseFloat(document.getElementById('sipAmount').value) || 5000;
    const returnRate = parseFloat(document.getElementById('returnRate').value) || 12;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 10;
    const inflationRate = parseFloat(document.getElementById('inflationRate').value) || 6;
    const taxRate = parseFloat(document.getElementById('taxRate').value) || 10;
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>SIP Calculator with Inflation and Tax Results</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .summary { margin-bottom: 20px; }
                .parameter { margin: 5px 0; }
                .result { background: #f8f9fa; padding: 10px; margin: 5px 0; border-radius: 5px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                th { background-color: #f2f2f2; }
                .disclaimer { margin-top: 30px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>SIP Calculator with Inflation and Tax</h1>
                <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="summary">
                <h3>Input Parameters:</h3>
                <div class="parameter">Monthly SIP Amount: ${formatCurrency(sipAmount)}</div>
                <div class="parameter">Expected Return Rate: ${returnRate}%</div>
                <div class="parameter">Investment Period: ${tenureYears} years</div>
                <div class="parameter">Inflation Rate: ${inflationRate}%</div>
                <div class="parameter">Tax Rate: ${taxRate}%</div>
            </div>
            
            <div class="results">
                <h3>Results:</h3>
                <div class="result">Total Invested: ${document.getElementById('totalInvestedResult').textContent}</div>
                <div class="result">Gross Returns: ${document.getElementById('grossReturnsResult').textContent}</div>
                <div class="result">Inflation Impact: ${document.getElementById('inflationImpactResult').textContent}</div>
                <div class="result">Tax Impact: ${document.getElementById('taxImpactResult').textContent}</div>
                <div class="result">Net Returns: ${document.getElementById('netReturnsResult').textContent}</div>
                <div class="result">Final Amount: ${document.getElementById('maturityAmountResult').textContent}</div>
                <div class="result">Real Value (Today's Money): ${document.getElementById('realValueResult').textContent}</div>
            </div>
            
            <div class="disclaimer">
                <p><strong>Disclaimer:</strong> This calculation is for informational purposes only. 
                Actual returns may vary based on market conditions and fund performance. 
                Please consult with a financial advisor for investment decisions.</p>
            </div>
        </body>
        </html>
    `;
}

function shareLink() {
    const sipAmount = parseFloat(document.getElementById('sipAmount').value) || 5000;
    const returnRate = parseFloat(document.getElementById('returnRate').value) || 12;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 10;
    const inflationRate = parseFloat(document.getElementById('inflationRate').value) || 6;
    const taxRate = parseFloat(document.getElementById('taxRate').value) || 10;
    
    const url = new URL(window.location.href);
    url.searchParams.set('sipAmount', sipAmount);
    url.searchParams.set('returnRate', returnRate);
    url.searchParams.set('tenureYears', tenureYears);
    url.searchParams.set('inflationRate', inflationRate);
    url.searchParams.set('taxRate', taxRate);
    
    const shareUrl = url.toString();
    
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(shareUrl).then(() => {
            showNotification('Link copied to clipboard', 'success');
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
    textArea.style.opacity = "0";
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showNotification('Link copied to clipboard', 'success');
    } catch (err) {
        showNotification('Failed to copy link', 'error');
    }
    
    document.body.removeChild(textArea);
}

function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4ade80' : '#ef4444'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Animate out and remove
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
    
    if (urlParams.has('sipAmount')) {
        const sipAmount = Math.max(500, Math.min(1000000, parseFloat(urlParams.get('sipAmount'))));
        document.getElementById('sipAmount').value = sipAmount;
        document.getElementById('sipAmountSlider').value = sipAmount;
    }
    
    if (urlParams.has('returnRate')) {
        const returnRate = Math.max(8, Math.min(25, parseFloat(urlParams.get('returnRate'))));
        document.getElementById('returnRate').value = returnRate;
        document.getElementById('returnRateSlider').value = returnRate;
    }
    
    if (urlParams.has('tenureYears')) {
        const tenureYears = Math.max(1, Math.min(30, parseInt(urlParams.get('tenureYears'))));
        document.getElementById('tenureYears').value = tenureYears;
        document.getElementById('tenureYearsSlider').value = tenureYears;
    }
    
    if (urlParams.has('inflationRate')) {
        const inflationRate = Math.max(0, Math.min(15, parseFloat(urlParams.get('inflationRate'))));
        document.getElementById('inflationRate').value = inflationRate;
        document.getElementById('inflationRateSlider').value = inflationRate;
    }
    
    if (urlParams.has('taxRate')) {
        const taxRate = Math.max(0, Math.min(30, parseFloat(urlParams.get('taxRate'))));
        document.getElementById('taxRate').value = taxRate;
        document.getElementById('taxRateSlider').value = taxRate;
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