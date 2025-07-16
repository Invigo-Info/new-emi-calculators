// Global variables
let sipInflationBreakupChart;

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
        { input: 'inflationRate', slider: 'inflationRateSlider', min: 1, max: 15 }
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
    
    // Make API call
    fetch('/calculate-sip-with-inflation', {
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
    document.getElementById('nominalReturnsResult').textContent = formatCurrency(data.nominalReturns);
    document.getElementById('inflationImpactResult').textContent = formatCurrency(data.inflationImpact);
    document.getElementById('realReturnsResult').textContent = formatCurrency(data.realReturns);
    document.getElementById('maturityAmountResult').textContent = formatCurrency(data.finalAmount);
    document.getElementById('realValueResult').textContent = formatCurrency(data.realValue);
    
    // Update chart summary
    document.getElementById('investedAmountDisplay').textContent = formatCurrency(data.totalInvested);
    document.getElementById('realReturnsAmountDisplay').textContent = formatCurrency(data.realReturns);
    document.getElementById('inflationImpactDisplay').textContent = formatCurrency(data.inflationImpact);
}

function updateChart(data) {
    const ctx = document.getElementById('sipInflationBreakupChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (sipInflationBreakupChart) {
        sipInflationBreakupChart.destroy();
    }
    
    sipInflationBreakupChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Total Invested', 'Real Returns', 'Inflation Impact'],
            datasets: [{
                data: [data.totalInvested, data.realReturns, data.inflationImpact],
                backgroundColor: [
                    '#4facfe',  // Blue for invested amount
                    '#43e97b',  // Green for real returns
                    '#fa709a'   // Pink for inflation impact
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
                            const percentage = ((context.parsed / data.finalAmount) * 100).toFixed(1);
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
        yearRow.innerHTML = `
            <td class="year-cell">
                <span class="expand-icon">▶</span>
                <strong>Year ${yearData.year}</strong>
            </td>
            <td>${formatCurrency(yearData.yearly_invested)}</td>
            <td>${formatCurrency(yearData.cumulative_invested)}</td>
            <td>${formatCurrency(yearData.nominal_value)}</td>
            <td>${formatCurrency(yearData.inflation_impact)}</td>
            <td>${formatCurrency(yearData.real_value)}</td>
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
    // Get current input values
    const sipAmount = parseFloat(document.getElementById('sipAmount').value) || 5000;
    const returnRate = parseFloat(document.getElementById('returnRate').value) || 12;
    const inflationRate = parseFloat(document.getElementById('inflationRate').value) || 6;
    
    // Calculate monthly data (client-side for now)
    const monthlyData = calculateMonthlyData(year, sipAmount, returnRate, inflationRate, yearData);
    displayMonthlyRows(yearRow, monthlyData);
}

function calculateMonthlyData(year, sipAmount, annualRate, inflationRate, yearData) {
    const monthlyRate = annualRate / 12 / 100;
    const months = [];
    
    // Calculate starting values from previous years
    let cumulativeInvested = (year - 1) * 12 * sipAmount;
    let nominalCorpus = 0;
    
    // Calculate previous year's ending nominal corpus
    if (year > 1) {
        let tempCorpus = 0;
        
        for (let y = 1; y < year; y++) {
            // Add 12 months of SIP with compounding
            for (let m = 1; m <= 12; m++) {
                tempCorpus = (tempCorpus + sipAmount) * (1 + monthlyRate);
            }
        }
        
        nominalCorpus = tempCorpus;
    }
    
    // Calculate monthly data for current year
    for (let month = 1; month <= 12; month++) {
        cumulativeInvested += sipAmount;
        
        // Calculate nominal value up to this month
        let nominalValue = 0;
        const totalMonthsUpToNow = (year - 1) * 12 + month;
        for (let m = 1; m <= totalMonthsUpToNow; m++) {
            nominalValue = (nominalValue + sipAmount) * (1 + monthlyRate);
        }
        
        // Calculate real value considering inflation for this period
        const inflationFactor = Math.pow(1 + inflationRate / 100, totalMonthsUpToNow / 12);
        const realValue = nominalValue / inflationFactor;
        const inflationImpact = nominalValue - realValue;
        
        months.push({
            month: month,
            monthName: getMonthName(month),
            monthly_invested: sipAmount,
            cumulative_invested: cumulativeInvested,
            nominal_value: nominalValue,
            inflation_impact: inflationImpact,
            real_value: realValue
        });
    }
    
    return months;
}

function getMonthName(monthNum) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthNum - 1];
}

function displayMonthlyRows(yearRow, monthlyData) {
    let insertAfter = yearRow;
    
    monthlyData.forEach((monthData, index) => {
        const monthRow = document.createElement('tr');
        monthRow.className = 'month-row';
        monthRow.innerHTML = `
            <td>
                ${monthData.monthName}
            </td>
            <td>${formatCurrency(monthData.monthly_invested)}</td>
            <td>${formatCurrency(monthData.cumulative_invested)}</td>
            <td>${formatCurrency(monthData.nominal_value)}</td>
            <td>${formatCurrency(monthData.inflation_impact)}</td>
            <td>${formatCurrency(monthData.real_value)}</td>
        `;
        
        // Insert after the previous row
        insertAfter.insertAdjacentElement('afterend', monthRow);
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
        const megaLinks = document.querySelectorAll('.mega-link');
        megaLinks.forEach(link => {
            link.addEventListener('click', function() {
                megaMenu.classList.remove('open');
            });
        });
    }
}

function setupDownloadButtons() {
    // Download buttons setup will be implemented here
}

function downloadPDF() {
    const sipAmount = parseFloat(document.getElementById('sipAmount').value) || 5000;
    const returnRate = parseFloat(document.getElementById('returnRate').value) || 12;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 10;
    const inflationRate = parseFloat(document.getElementById('inflationRate').value) || 6;
    
    // Get current results
    const totalInvested = document.getElementById('totalInvestedResult').textContent;
    const nominalReturns = document.getElementById('nominalReturnsResult').textContent;
    const inflationImpact = document.getElementById('inflationImpactResult').textContent;
    const realReturns = document.getElementById('realReturnsResult').textContent;
    const finalAmount = document.getElementById('maturityAmountResult').textContent;
    const realValue = document.getElementById('realValueResult').textContent;
    
    // Generate PDF content
    const content = generatePrintableContent();
    
    // Create a temporary window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
    
    showNotification('PDF download initiated', 'success');
}

function downloadExcel() {
    const sipAmount = parseFloat(document.getElementById('sipAmount').value) || 5000;
    const returnRate = parseFloat(document.getElementById('returnRate').value) || 12;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 10;
    const inflationRate = parseFloat(document.getElementById('inflationRate').value) || 6;
    
    // Create CSV content
    let csvContent = "SIP Calculator with Inflation Results\n\n";
    csvContent += "Input Parameters:\n";
    csvContent += `Monthly SIP Amount,${formatCurrency(sipAmount)}\n`;
    csvContent += `Expected Return Rate,${returnRate}%\n`;
    csvContent += `Investment Period,${tenureYears} years\n`;
    csvContent += `Inflation Rate,${inflationRate}%\n\n`;
    
    csvContent += "Results:\n";
    csvContent += `Total Invested,${document.getElementById('totalInvestedResult').textContent}\n`;
    csvContent += `Nominal Returns,${document.getElementById('nominalReturnsResult').textContent}\n`;
    csvContent += `Inflation Impact,${document.getElementById('inflationImpactResult').textContent}\n`;
    csvContent += `Real Returns,${document.getElementById('realReturnsResult').textContent}\n`;
    csvContent += `Final Amount,${document.getElementById('maturityAmountResult').textContent}\n`;
    csvContent += `Real Value,${document.getElementById('realValueResult').textContent}\n\n`;
    
    // Add yearly breakdown
    csvContent += "Year-wise Breakdown:\n";
    csvContent += "Year,Yearly Investment,Cumulative Investment,Nominal Value,Inflation Impact,Real Value\n";
    
    const rows = document.querySelectorAll('#yearlyBreakdownTable tbody tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 6) {
            const year = cells[0].textContent.replace('▶', '').replace('Year ', '').trim();
            csvContent += `${year},${cells[1].textContent},${cells[2].textContent},${cells[3].textContent},${cells[4].textContent},${cells[5].textContent}\n`;
        }
    });
    
    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'sip_inflation_calculation.csv');
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
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>SIP Calculator with Inflation Results</title>
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
                <h1>SIP Calculator with Inflation</h1>
                <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="summary">
                <h3>Input Parameters:</h3>
                <div class="parameter">Monthly SIP Amount: ${formatCurrency(sipAmount)}</div>
                <div class="parameter">Expected Return Rate: ${returnRate}%</div>
                <div class="parameter">Investment Period: ${tenureYears} years</div>
                <div class="parameter">Inflation Rate: ${inflationRate}%</div>
            </div>
            
            <div class="results">
                <h3>Results:</h3>
                <div class="result">Total Invested: ${document.getElementById('totalInvestedResult').textContent}</div>
                <div class="result">Nominal Returns: ${document.getElementById('nominalReturnsResult').textContent}</div>
                <div class="result">Inflation Impact: ${document.getElementById('inflationImpactResult').textContent}</div>
                <div class="result">Real Returns: ${document.getElementById('realReturnsResult').textContent}</div>
                <div class="result">Final Amount: ${document.getElementById('maturityAmountResult').textContent}</div>
                <div class="result">Real Value: ${document.getElementById('realValueResult').textContent}</div>
            </div>
            
            <div class="disclaimer">
                <p><strong>Disclaimer:</strong> This calculation is for informational purposes only. 
                Actual returns may vary based on market conditions and inflation rates. 
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
    
    const url = new URL(window.location.href);
    url.searchParams.set('sipAmount', sipAmount);
    url.searchParams.set('returnRate', returnRate);
    url.searchParams.set('tenureYears', tenureYears);
    url.searchParams.set('inflationRate', inflationRate);
    
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
        const inflationRate = Math.max(1, Math.min(15, parseFloat(urlParams.get('inflationRate'))));
        document.getElementById('inflationRate').value = inflationRate;
        document.getElementById('inflationRateSlider').value = inflationRate;
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