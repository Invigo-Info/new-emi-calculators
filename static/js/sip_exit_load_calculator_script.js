// Global variables
let sipExitLoadBreakupChart;

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
        { input: 'exitLoadRate', slider: 'exitLoadRateSlider', min: 0, max: 5 },
        { input: 'exitPeriodYears', slider: 'exitPeriodYearsSlider', min: 0, max: 5 },
        { input: 'redemptionPercentage', slider: 'redemptionPercentageSlider', min: 10, max: 100 },
        { input: 'purchaseNav', slider: 'purchaseNavSlider', min: 1, max: 10000 },
        { input: 'currentNav', slider: 'currentNavSlider', min: 1, max: 10000 }
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
    const exitLoadRate = parseFloat(document.getElementById('exitLoadRate').value) || 1;
    const exitPeriodYears = parseFloat(document.getElementById('exitPeriodYears').value) || 1;
    const redemptionPercentage = parseFloat(document.getElementById('redemptionPercentage').value) || 100;
    const purchaseNav = parseFloat(document.getElementById('purchaseNav').value) || 10;
    const currentNav = parseFloat(document.getElementById('currentNav').value) || 15;
    
    // Make API call
    fetch('/calculate-sip-exit-load', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            sipAmount: sipAmount,
            returnRate: returnRate,
            tenureYears: tenureYears,
            exitLoadRate: exitLoadRate,
            exitPeriodYears: exitPeriodYears,
            redemptionPercentage: redemptionPercentage,
            purchaseNav: purchaseNav,
            currentNav: currentNav
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
    document.getElementById('exitLoadChargesResult').textContent = formatCurrency(data.exitLoadCharges);
    document.getElementById('netReturnsResult').textContent = formatCurrency(data.netReturns);
    document.getElementById('maturityAmountResult').textContent = formatCurrency(data.finalAmount);
    
    // Update chart summary
    document.getElementById('investedAmountDisplay').textContent = formatCurrency(data.totalInvested);
    document.getElementById('netReturnsAmountDisplay').textContent = formatCurrency(data.netReturns);
    document.getElementById('exitLoadAmountDisplay').textContent = formatCurrency(data.exitLoadCharges);
}

function updateChart(data) {
    const ctx = document.getElementById('sipExitLoadBreakupChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (sipExitLoadBreakupChart) {
        sipExitLoadBreakupChart.destroy();
    }
    
    sipExitLoadBreakupChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Total Invested', 'Net Returns', 'Exit Load Charges'],
            datasets: [{
                data: [data.totalInvested, data.netReturns, data.exitLoadCharges],
                backgroundColor: [
                    '#4facfe',  // Blue for invested amount
                    '#43e97b',  // Green for net returns
                    '#fa709a'   // Pink for exit load charges
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
                            const total = data.totalInvested + data.netReturns + data.exitLoadCharges;
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
        yearRow.innerHTML = `
            <td class="year-cell">
                <strong>Year ${yearData.year}</strong>
            </td>
            <td style="text-align: right;">${formatCurrency(yearData.yearly_invested)}</td>
            <td style="text-align: right;">${formatCurrency(yearData.cumulative_invested)}</td>
            <td style="text-align: right;">${formatCurrency(yearData.gross_value)}</td>
            <td style="text-align: right;">${formatCurrency(yearData.exit_load_charges)}</td>
            <td style="text-align: right;">${formatCurrency(yearData.net_value)}</td>
        `;
        
        tableBody.appendChild(yearRow);
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
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!megaMenu.contains(e.target)) {
                megaMenu.classList.remove('open');
            }
        });
        
        // Close menu when clicking on a link
        const megaLinks = document.querySelectorAll('.mega-link');
        megaLinks.forEach(link => {
            link.addEventListener('click', function() {
                megaMenu.classList.remove('open');
            });
        });
    }
}

function setupDownloadButtons() {
    // Setup download button handlers
}

function downloadPDF() {
    // Get current calculation data
    const sipAmount = parseFloat(document.getElementById('sipAmount').value) || 5000;
    const returnRate = parseFloat(document.getElementById('returnRate').value) || 12;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 10;
    const exitLoadRate = parseFloat(document.getElementById('exitLoadRate').value) || 1;
    const exitPeriodYears = parseFloat(document.getElementById('exitPeriodYears').value) || 1;
    const redemptionPercentage = parseFloat(document.getElementById('redemptionPercentage').value) || 100;
    
    // Get results
    const totalInvested = document.getElementById('totalInvestedResult').textContent;
    const grossReturns = document.getElementById('grossReturnsResult').textContent;
    const exitLoadCharges = document.getElementById('exitLoadChargesResult').textContent;
    const netReturns = document.getElementById('netReturnsResult').textContent;
    const finalAmount = document.getElementById('maturityAmountResult').textContent;
    
    // Generate PDF content
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(40);
    doc.text('SIP Exit Load Calculator Report', 20, 30);
    
    // Input parameters
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Investment Parameters:', 20, 50);
    
    doc.setFontSize(12);
    doc.text(`Monthly SIP Amount: ₹${sipAmount.toLocaleString()}`, 25, 65);
    doc.text(`Expected Return Rate: ${returnRate}% per annum`, 25, 75);
    doc.text(`Investment Period: ${tenureYears} years`, 25, 85);
    doc.text(`Exit Load Rate: ${exitLoadRate}%`, 25, 95);
    doc.text(`Exit Load Period: ${exitPeriodYears} years`, 25, 105);
    doc.text(`Redemption Percentage: ${redemptionPercentage}%`, 25, 115);
    
    // Results
    doc.setFontSize(14);
    doc.text('Calculation Results:', 20, 135);
    
    doc.setFontSize(12);
    doc.text(`Total Invested: ${totalInvested}`, 25, 150);
    doc.text(`Gross Returns: ${grossReturns}`, 25, 160);
    doc.text(`Exit Load Charges: ${exitLoadCharges}`, 25, 170);
    doc.text(`Net Returns: ${netReturns}`, 25, 180);
    doc.text(`Final Amount: ${finalAmount}`, 25, 190);
    
    // Footer
    doc.setFontSize(10);
    doc.setTextColor(128);
    doc.text('Generated on: ' + new Date().toLocaleDateString(), 20, 280);
    doc.text('This is a computer-generated document.', 20, 290);
    
    // Save the PDF
    doc.save('sip-exit-load-calculation.pdf');
    
    showNotification('PDF downloaded successfully!', 'success');
}

function downloadExcel() {
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Get current values
    const sipAmount = parseFloat(document.getElementById('sipAmount').value) || 5000;
    const returnRate = parseFloat(document.getElementById('returnRate').value) || 12;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 10;
    const exitLoadRate = parseFloat(document.getElementById('exitLoadRate').value) || 1;
    const exitPeriodYears = parseFloat(document.getElementById('exitPeriodYears').value) || 1;
    const redemptionPercentage = parseFloat(document.getElementById('redemptionPercentage').value) || 100;
    
    // Create summary sheet
    const summaryData = [
        ['SIP Exit Load Calculator Report'],
        [''],
        ['Investment Parameters'],
        ['Monthly SIP Amount', `₹${sipAmount.toLocaleString()}`],
        ['Expected Return Rate', `${returnRate}% per annum`],
        ['Investment Period', `${tenureYears} years`],
        ['Exit Load Rate', `${exitLoadRate}%`],
        ['Exit Load Period', `${exitPeriodYears} years`],
        ['Redemption Percentage', `${redemptionPercentage}%`],
        [''],
        ['Results'],
        ['Total Invested', document.getElementById('totalInvestedResult').textContent],
        ['Gross Returns', document.getElementById('grossReturnsResult').textContent],
        ['Exit Load Charges', document.getElementById('exitLoadChargesResult').textContent],
        ['Net Returns', document.getElementById('netReturnsResult').textContent],
        ['Final Amount', document.getElementById('maturityAmountResult').textContent]
    ];
    
    const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary');
    
    // Create yearly breakdown sheet if table exists
    const table = document.getElementById('yearlyBreakdownBody');
    if (table && table.rows.length > 0) {
        const breakdownData = [
            ['Year', 'Annual Investment', 'Cumulative Investment', 'Gross Value', 'Exit Load Charges', 'Net Value']
        ];
        
        for (let i = 0; i < table.rows.length; i++) {
            const row = table.rows[i];
            if (row.cells.length >= 6) {
                breakdownData.push([
                    row.cells[0].textContent.replace('Year ', ''),
                    row.cells[1].textContent,
                    row.cells[2].textContent,
                    row.cells[3].textContent,
                    row.cells[4].textContent,
                    row.cells[5].textContent
                ]);
            }
        }
        
        const breakdownWS = XLSX.utils.aoa_to_sheet(breakdownData);
        XLSX.utils.book_append_sheet(wb, breakdownWS, 'Yearly Breakdown');
    }
    
    // Download the file
    XLSX.writeFile(wb, 'sip-exit-load-calculation.xlsx');
    
    showNotification('Excel file downloaded successfully!', 'success');
}

function shareLink() {
    // Get current parameters
    const sipAmount = document.getElementById('sipAmount').value;
    const returnRate = document.getElementById('returnRate').value;
    const tenureYears = document.getElementById('tenureYears').value;
    const exitLoadRate = document.getElementById('exitLoadRate').value;
    const exitPeriodYears = document.getElementById('exitPeriodYears').value;
    const redemptionPercentage = document.getElementById('redemptionPercentage').value;
    
    // Create URL with parameters
    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams({
        sipAmount,
        returnRate,
        tenureYears,
        exitLoadRate,
        exitPeriodYears,
        redemptionPercentage,
        purchaseNav: document.getElementById('purchaseNav').value,
        currentNav: document.getElementById('currentNav').value
    });
    
    const shareUrl = `${baseUrl}?${params.toString()}`;
    
    // Copy to clipboard
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(shareUrl).then(() => {
            showNotification('Link copied to clipboard!', 'success');
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
    
    // Avoid scrolling to bottom
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
            showNotification('Failed to copy link. Please copy manually.', 'error');
        }
    } catch (err) {
        showNotification('Failed to copy link. Please copy manually.', 'error');
    }
    
    document.body.removeChild(textArea);
}

function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s ease;
        ${type === 'success' ? 'background-color: #10b981;' : 'background-color: #ef4444;'}
    `;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function loadFromUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    const params = {
        'sipAmount': 'sipAmount',
        'returnRate': 'returnRate',
        'tenureYears': 'tenureYears',
        'exitLoadRate': 'exitLoadRate',
        'exitPeriodYears': 'exitPeriodYears',
        'redemptionPercentage': 'redemptionPercentage',
        'purchaseNav': 'purchaseNav',
        'currentNav': 'currentNav'
    };
    
    Object.entries(params).forEach(([urlParam, elementId]) => {
        const value = urlParams.get(urlParam);
        if (value) {
            const element = document.getElementById(elementId);
            const slider = document.getElementById(elementId + 'Slider');
            if (element) {
                element.value = value;
                if (slider) {
                    slider.value = value;
                }
            }
        }
    });
}

function formatCurrency(amount) {
    // Always display full amount with Indian number formatting
    return '₹' + Math.round(amount).toLocaleString('en-IN');
} 