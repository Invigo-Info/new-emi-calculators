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
        { input: 'sipAmount', slider: 'sipAmountSlider', min: 1500, max: 300000 },
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
    const sipAmount = parseFloat(document.getElementById('sipAmount').value) || 15000;
    const returnRate = parseFloat(document.getElementById('returnRate').value) || 12;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 10;
    const inflationRate = parseFloat(document.getElementById('inflationRate').value) || 6;
    
    // Make API call to Quarterly SIP calculation endpoint
    fetch('/calculate-quarterly-sip', {
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
        
        // Add click event to show/hide quarterly data
        yearRow.addEventListener('click', function() {
            toggleQuarterlyRows(this, yearData, index);
        });
        
        tableBody.appendChild(yearRow);
    });
}

function toggleQuarterlyRows(yearRow, yearData, yearIndex) {
    const expandIcon = yearRow.querySelector('.expand-icon');
    const isExpanded = expandIcon.textContent === '▼';
    
    if (isExpanded) {
        // Collapse - remove quarterly rows
        let nextRow = yearRow.nextSibling;
        while (nextRow && nextRow.classList && nextRow.classList.contains('quarter-row')) {
            const rowToRemove = nextRow;
            nextRow = nextRow.nextSibling;
            rowToRemove.remove();
        }
        expandIcon.textContent = '▶';
        yearRow.style.backgroundColor = '#f8fafc';
    } else {
        // Expand - generate and add quarterly rows
        expandIcon.textContent = '▼';
        yearRow.style.backgroundColor = '#edf2f7';
        
        const quarterlyData = generateQuarterlyData(yearData, yearIndex);
        let insertAfter = yearRow;
        
        quarterlyData.forEach(quarterData => {
            const quarterRow = document.createElement('tr');
            quarterRow.className = 'quarter-row';
            quarterRow.style.backgroundColor = '#f7fafc';
            quarterRow.innerHTML = `
                <td style="padding-left: 30px; color: #4a5568;">
                    <span style="color: #718096; font-size: 0.9em;">Q${quarterData.quarter}</span>
                </td>
                <td style="color: #4a5568; font-size: 0.9em;">${formatCurrency(quarterData.quarterly_investment)}</td>
                <td style="color: #4a5568; font-size: 0.9em;">${formatCurrency(quarterData.cumulative_invested)}</td>
                <td style="color: #4a5568; font-size: 0.9em;">${formatCurrency(quarterData.quarter_end_value)}</td>
                <td style="color: #4a5568; font-size: 0.9em;">${formatCurrency(quarterData.quarter_returns)}</td>
                <td style="color: #4a5568; font-size: 0.9em;">${formatCurrency(quarterData.inflation_adjusted)}</td>
            `;
            
            insertAfter.insertAdjacentElement('afterend', quarterRow);
            insertAfter = quarterRow;
        });
    }
}

function generateQuarterlyData(yearData, yearIndex) {
    const quarterlyData = [];
    const quarterlySipAmount = parseFloat(document.getElementById('sipAmount').value) || 15000;
    const returnRate = parseFloat(document.getElementById('returnRate').value) || 12;
    const inflationRate = parseFloat(document.getElementById('inflationRate').value) || 6;
    
    // Calculate quarterly return rate
    const quarterlyRate = returnRate / (4 * 100);
    
    // Starting values for this year
    const yearStartQuarter = (yearData.year - 1) * 4 + 1;
    
    for (let quarter = 1; quarter <= 4; quarter++) {
        const currentQuarter = yearStartQuarter + quarter - 1;
        const quarterly_investment = quarterlySipAmount;
        const cumulative_invested = quarterly_investment * currentQuarter;
        
        // Calculate quarter end value using compound interest formula
        let quarter_end_value = 0;
        if (quarterlyRate === 0) {
            quarter_end_value = cumulative_invested;
        } else {
            quarter_end_value = quarterlySipAmount * (((1 + quarterlyRate) ** currentQuarter - 1) / quarterlyRate) * (1 + quarterlyRate);
        }
        
        const quarter_returns = quarter_end_value - cumulative_invested;
        const quarterYears = currentQuarter / 4;
        const inflation_adjusted = quarter_end_value / ((1 + inflationRate / 100) ** quarterYears);
        
        quarterlyData.push({
            quarter: quarter,
            quarterly_investment: quarterly_investment,
            cumulative_invested: cumulative_invested,
            quarter_end_value: quarter_end_value,
            quarter_returns: quarter_returns,
            inflation_adjusted: inflation_adjusted
        });
    }
    
    return quarterlyData;
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
        
        // Prevent mega menu from closing when clicking inside it
        const megaMenuContent = document.querySelector('.mega-menu-content');
        if (megaMenuContent) {
            megaMenuContent.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }
    }
}

function setupDownloadButtons() {
    // Download buttons setup will be implemented here
}

function downloadPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Set document properties
        doc.setProperties({
            title: 'Quarterly SIP Calculator Report',
            subject: 'Investment Analysis',
            author: 'SIP Calculator',
            creator: 'Web Application'
        });
        
        // Add title
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text('Quarterly SIP Calculator Report', 105, 20, { align: 'center' });
        
        // Add calculation parameters
        const sipAmount = document.getElementById('sipAmount').value;
        const returnRate = document.getElementById('returnRate').value;
        const tenureYears = document.getElementById('tenureYears').value;
        const inflationRate = document.getElementById('inflationRate').value;
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        let yPos = 40;
        
        doc.text('Investment Parameters:', 20, yPos);
        yPos += 10;
        doc.text(`Quarterly SIP Amount: ₹${Number(sipAmount).toLocaleString('en-IN')}`, 25, yPos);
        yPos += 8;
        doc.text(`Expected Return Rate: ${returnRate}% per annum`, 25, yPos);
        yPos += 8;
        doc.text(`Investment Period: ${tenureYears} years`, 25, yPos);
        yPos += 8;
        doc.text(`Inflation Rate: ${inflationRate}% per annum`, 25, yPos);
        yPos += 15;
        
        // Add results
        const totalInvested = document.getElementById('totalInvestedResult').textContent;
        const totalReturns = document.getElementById('totalReturnsResult').textContent;
        const maturityAmount = document.getElementById('maturityAmountResult').textContent;
        const inflationAdjusted = document.getElementById('inflationAdjustedResult').textContent;
        
        doc.setFont(undefined, 'bold');
        doc.text('Investment Results:', 20, yPos);
        yPos += 10;
        
        doc.setFont(undefined, 'normal');
        doc.text(`Total Amount Invested: ${totalInvested}`, 25, yPos);
        yPos += 8;
        doc.text(`Expected Returns: ${totalReturns}`, 25, yPos);
        yPos += 8;
        doc.text(`Maturity Amount: ${maturityAmount}`, 25, yPos);
        yPos += 8;
        doc.text(`Inflation Adjusted Value: ${inflationAdjusted}`, 25, yPos);
        yPos += 15;
        
        // Add year-wise breakdown table
        doc.setFont(undefined, 'bold');
        doc.text('Year-wise Investment Breakdown:', 20, yPos);
        yPos += 10;
        
        // Table headers
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        const tableHeaders = ['Year', 'Yearly Investment', 'Cumulative Investment', 'Expected Value', 'Returns Earned'];
        let xPos = 20;
        const colWidths = [20, 35, 40, 35, 35];
        
        tableHeaders.forEach((header, index) => {
            doc.text(header, xPos, yPos);
            xPos += colWidths[index];
        });
        yPos += 8;
        
        // Table data
        doc.setFont(undefined, 'normal');
        const tableBody = document.getElementById('yearlyBreakdownBody');
        const rows = tableBody.querySelectorAll('.year-row');
        
        rows.forEach((row, index) => {
            if (yPos > 270) { // Check if we need a new page
                doc.addPage();
                yPos = 20;
            }
            
            const cells = row.querySelectorAll('td');
            xPos = 20;
            
            cells.forEach((cell, cellIndex) => {
                if (cellIndex < 5) { // Only first 5 columns
                    let text = cell.textContent.trim();
                    if (cellIndex === 0) {
                        text = text.replace('▶', '').replace('▼', '').trim();
                    }
                    doc.text(text, xPos, yPos);
                    xPos += colWidths[cellIndex];
                }
            });
            yPos += 6;
        });
        
        // Add footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setFont(undefined, 'normal');
            doc.text(`Generated on ${new Date().toLocaleDateString('en-IN')} | Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
        }
        
        // Save the PDF
        doc.save('quarterly-sip-calculator-report.pdf');
        
        showNotification('PDF downloaded successfully!', 'success');
    } catch (error) {
        console.error('PDF generation error:', error);
        showNotification('Error generating PDF. Please try again.', 'error');
    }
}

function downloadExcel() {
    try {
        // Get current calculation data
        const sipAmount = document.getElementById('sipAmount').value;
        const returnRate = document.getElementById('returnRate').value;
        const tenureYears = document.getElementById('tenureYears').value;
        const inflationRate = document.getElementById('inflationRate').value;
        
        const totalInvested = document.getElementById('totalInvestedResult').textContent;
        const totalReturns = document.getElementById('totalReturnsResult').textContent;
        const maturityAmount = document.getElementById('maturityAmountResult').textContent;
        const inflationAdjusted = document.getElementById('inflationAdjustedResult').textContent;
        
        // Create CSV content
        let csvContent = "data:text/csv;charset=utf-8,";
        
        // Add header information
        csvContent += "Quarterly SIP Calculator Report\n";
        csvContent += `Generated on: ${new Date().toLocaleDateString('en-IN')}\n\n`;
        
        // Add input parameters
        csvContent += "Investment Parameters\n";
        csvContent += `Quarterly SIP Amount,₹${Number(sipAmount).toLocaleString('en-IN')}\n`;
        csvContent += `Expected Return Rate,${returnRate}% per annum\n`;
        csvContent += `Investment Period,${tenureYears} years\n`;
        csvContent += `Inflation Rate,${inflationRate}% per annum\n\n`;
        
        // Add results
        csvContent += "Investment Results\n";
        csvContent += `Total Amount Invested,${totalInvested}\n`;
        csvContent += `Expected Returns,${totalReturns}\n`;
        csvContent += `Maturity Amount,${maturityAmount}\n`;
        csvContent += `Inflation Adjusted Value,${inflationAdjusted}\n\n`;
        
        // Add table headers
        csvContent += "Year-wise Investment Breakdown\n";
        csvContent += "Year,Yearly Investment,Cumulative Investment,Expected Value,Returns Earned,Inflation Adjusted Value\n";
        
        // Add table data
        const tableBody = document.getElementById('yearlyBreakdownBody');
        const rows = tableBody.querySelectorAll('.year-row');
        
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            const rowData = [];
            
            cells.forEach((cell, index) => {
                let text = cell.textContent.trim();
                if (index === 0) {
                    text = text.replace('▶', '').replace('▼', '').trim();
                }
                rowData.push(`"${text}"`);
            });
            
            csvContent += rowData.join(',') + '\n';
        });
        
        // Create and trigger download
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'quarterly-sip-calculator-report.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('Excel file downloaded successfully!', 'success');
    } catch (error) {
        console.error('Excel generation error:', error);
        showNotification('Error generating Excel file. Please try again.', 'error');
    }
}

function shareLink() {
    const sipAmount = document.getElementById('sipAmount').value;
    const returnRate = document.getElementById('returnRate').value;
    const tenureYears = document.getElementById('tenureYears').value;
    const inflationRate = document.getElementById('inflationRate').value;
    
    const shareUrl = `${window.location.origin}/quarterly-sip-calculator/?sipAmount=${sipAmount}&returnRate=${returnRate}&tenureYears=${tenureYears}&inflationRate=${inflationRate}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Quarterly SIP Calculator',
            text: `Check out my quarterly SIP calculation: ₹${Number(sipAmount).toLocaleString('en-IN')} quarterly investment for ${tenureYears} years at ${returnRate}% return rate`,
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
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Link copied to clipboard!', 'success');
        }).catch((error) => {
            console.error('Clipboard copy failed:', error);
            legacyCopyToClipboard(text);
        });
    } else {
        legacyCopyToClipboard(text);
    }
}

function legacyCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showNotification('Link copied to clipboard!', 'success');
        } else {
            showNotification('Unable to copy link. Please copy manually: ' + text, 'info');
        }
    } catch (err) {
        console.error('Copy command failed:', err);
        showNotification('Unable to copy link. Please copy manually: ' + text, 'info');
    }
    
    document.body.removeChild(textArea);
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#4299e1'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        font-weight: 500;
        z-index: 10000;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 4 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

function loadFromUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('sipAmount')) {
        document.getElementById('sipAmount').value = urlParams.get('sipAmount');
        document.getElementById('sipAmountSlider').value = urlParams.get('sipAmount');
    }
    if (urlParams.get('returnRate')) {
        document.getElementById('returnRate').value = urlParams.get('returnRate');
        document.getElementById('returnRateSlider').value = urlParams.get('returnRate');
    }
    if (urlParams.get('tenureYears')) {
        document.getElementById('tenureYears').value = urlParams.get('tenureYears');
        document.getElementById('tenureYearsSlider').value = urlParams.get('tenureYears');
    }
    if (urlParams.get('inflationRate')) {
        document.getElementById('inflationRate').value = urlParams.get('inflationRate');
        document.getElementById('inflationRateSlider').value = urlParams.get('inflationRate');
    }
}

function formatCurrency(amount) {
    return '₹' + Number(amount).toLocaleString('en-IN');
} 