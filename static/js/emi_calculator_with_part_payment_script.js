// Global variables
let emiPartPaymentChart;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    setupDownloadButtons();
    setupMegaMenu();
    loadFromUrlParameters();
    updateDynamicLabels(); // Update labels immediately
    calculateAndUpdate();
});

function updateDynamicLabels() {
    // Update the current loan amount label based on part payment month
    const partPaymentMonth = parseInt(document.getElementById('partPaymentMonth').value) || 24;
    const currentLoanAmountCard = document.querySelector('.current-loan-amount-card .card-label');
    if (currentLoanAmountCard) {
        currentLoanAmountCard.textContent = `Balance After ${partPaymentMonth} Months`;
    }
}

function setupEventListeners() {
    // Input change listeners for sliders and number inputs
    const inputs = [
        { input: 'loanAmount', slider: 'loanAmountSlider', min: 1000, max: 100000000 },
        { input: 'interestRate', slider: 'interestRateSlider', min: 0.1, max: 30 },
        { input: 'tenureYears', slider: 'tenureYearsSlider', min: 1, max: 30 },
        { input: 'partPaymentAmount', slider: 'partPaymentAmountSlider', min: 0, max: 50000000 },
        { input: 'partPaymentMonth', slider: 'partPaymentMonthSlider', min: 1, max: 360 }
    ];
    
    inputs.forEach(({ input, slider, min = 0, max }) => {
        const inputElement = document.getElementById(input);
        const sliderElement = document.getElementById(slider);
        
        if (inputElement && sliderElement) {
            // Sync input to slider
            inputElement.addEventListener('input', function() {
                const value = Math.max(Math.min(parseFloat(this.value) || min, max), min);
                sliderElement.value = value;
                
                // Update dynamic labels if this is the part payment month field
                if (input === 'partPaymentMonth') {
                    updateDynamicLabels();
                }
                
                calculateAndUpdate();
            });
            
            // Sync slider to input
            sliderElement.addEventListener('input', function() {
                inputElement.value = this.value;
                
                // Update dynamic labels if this is the part payment month field
                if (input === 'partPaymentMonth') {
                    updateDynamicLabels();
                }
                
                calculateAndUpdate();
            });
        }
    });

    // Add event listeners for radio buttons
    const radioButtons = document.querySelectorAll('input[name="partPaymentOption"]');
    radioButtons.forEach(radio => {
        radio.addEventListener('change', function() {
            calculateAndUpdate();
        });
    });
}

function calculateAndUpdate() {
    const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 1000000;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 8.5;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 15;
    const partPaymentAmount = parseFloat(document.getElementById('partPaymentAmount').value) || 0;
    const partPaymentMonth = parseInt(document.getElementById('partPaymentMonth').value) || 24;
    const partPaymentOption = document.querySelector('input[name="partPaymentOption"]:checked')?.value || 'reduceTenure';
    
    // Make API call
    fetch('/calculate-emi-with-part-payment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            loanAmount: loanAmount,
            interestRate: interestRate,
            tenureYears: tenureYears,
            partPaymentAmount: partPaymentAmount,
            partPaymentMonth: partPaymentMonth,
            partPaymentOption: partPaymentOption
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
    document.getElementById('originalEmiResult').textContent = formatCurrency(data.originalEmi);
    document.getElementById('interestSavingsResult').textContent = formatCurrency(data.interestSavings);
    document.getElementById('totalSavingsResult').textContent = formatCurrency(data.totalSavings);
    
    // Update dynamic labels
    updateDynamicLabels();
    
    // Update display based on part payment option
    const partPaymentOption = data.part_payment_option || 'reduceTenure';
    
    if (partPaymentOption === 'reduceEmi') {
        // Show revised EMI and hide/modify tenure reduction
        document.getElementById('tenureReductionLabel').textContent = 'EMI Reduction';
        const emiReduction = data.originalEmi - data.revisedEmi;
        document.getElementById('tenureReductionResult').textContent = formatCurrency(emiReduction);
        
        document.getElementById('revisedEmiLabel').textContent = 'Revised EMI';
        document.getElementById('revisedEmiResult').textContent = formatCurrency(data.revisedEmi);
        
        // Update card icons and styles
        document.getElementById('tenureReductionCard').querySelector('.card-icon').textContent = '💰';
        document.getElementById('revisedEmiCard').querySelector('.card-icon').textContent = '📊';
        
    } else {
        // Show tenure reduction (default)
        document.getElementById('tenureReductionLabel').textContent = 'Tenure Reduction';
        const tenureReduction = data.tenureReduction;
        const years = Math.floor(tenureReduction / 12);
        const months = tenureReduction % 12;
        let tenureText = '';
        if (years > 0) {
            tenureText += `${years} year${years > 1 ? 's' : ''}`;
        }
        if (months > 0) {
            if (years > 0) tenureText += ', ';
            tenureText += `${months} month${months > 1 ? 's' : ''}`;
        }
        if (tenureReduction === 0) {
            tenureText = 'No reduction';
        }
        document.getElementById('tenureReductionResult').textContent = tenureText;
        
        // Update revised tenure
        const revisedTenure = data.revisedTenure;
        const revisedYears = Math.floor(revisedTenure / 12);
        const revisedMonths = revisedTenure % 12;
        let revisedText = `${revisedYears} year${revisedYears > 1 ? 's' : ''}`;
        if (revisedMonths > 0) {
            revisedText += `, ${revisedMonths} month${revisedMonths > 1 ? 's' : ''}`;
        }
        document.getElementById('revisedEmiLabel').textContent = 'Revised Tenure';
        document.getElementById('revisedEmiResult').textContent = revisedText;
        
        // Update card icons
        document.getElementById('tenureReductionCard').querySelector('.card-icon').textContent = '⏱️';
        document.getElementById('revisedEmiCard').querySelector('.card-icon').textContent = '📅';
    }
    
    // Update loan amounts
    document.getElementById('currentLoanAmountResult').textContent = formatCurrency(data.current_principle_outstanding);
    document.getElementById('newLoanAmountResult').textContent = formatCurrency(data.new_principle_outstanding);
    
    // Update chart summary
    document.getElementById('originalTotalDisplay').textContent = formatCurrency(data.originalTotalAmount);
    document.getElementById('revisedTotalDisplay').textContent = formatCurrency(data.revisedTotalAmount);
    document.getElementById('totalSavingsDisplay').textContent = formatCurrency(data.totalSavings);
}

function updateChart(data) {
    const ctx = document.getElementById('emiPartPaymentChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (emiPartPaymentChart) {
        emiPartPaymentChart.destroy();
    }
    
    emiPartPaymentChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Original Total Payment', 'Revised Total Payment', 'Total Savings'],
            datasets: [{
                data: [data.originalTotalAmount, data.revisedTotalAmount, data.totalSavings],
                backgroundColor: [
                    '#93b0ff',  // Original total
                    '#416cfa',  // Revised total
                    '#8B5CF6'   // Total savings
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
                            const total = data.originalTotalAmount + data.revisedTotalAmount + data.totalSavings;
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
                <span class="expand-icon">▶</span>
                <strong>Year ${yearData.year}</strong>
            </td>
            <td style="text-align: right;">${formatCurrency(yearData.principal)}</td>
            <td style="text-align: right;">${formatCurrency(yearData.interest)}</td>
            <td style="text-align: right;">${formatCurrency(yearData.part_payment || 0)}</td>
            <td style="text-align: right;">${formatCurrency(yearData.total_payment)}</td>
            <td style="text-align: right;">${formatCurrency(yearData.balance)}</td>
        `;
        
        tableBody.appendChild(yearRow);
    });
}

function setupMegaMenu() {
    const megaMenuBtn = document.querySelector('.mega-menu-btn');
    const megaMenu = document.querySelector('.mega-menu');
    const megaMenuContent = document.querySelector('.mega-menu-content');
    
    if (megaMenuBtn && megaMenu) {
        megaMenuBtn.addEventListener('click', function(e) {
            e.preventDefault();
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
        if (megaMenuContent) {
            megaMenuContent.addEventListener('click', function(e) {
                if (e.target.classList.contains('mega-link')) {
                    megaMenu.classList.remove('open');
                }
            });
        }
    }
}

function setupDownloadButtons() {
    // Download buttons are handled by onclick attributes in HTML
}

function downloadPDF() {
    const printContent = generatePrintableContent();
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>EMI Calculator with Part Payment Results</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .results-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
                    .result-item { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
                    .result-label { font-weight: bold; color: #333; }
                    .result-value { font-size: 18px; color: #2563eb; margin-top: 5px; }
                    .table-section { margin-top: 30px; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                    th { background-color: #f8f9fa; font-weight: bold; }
                    .year-header { background-color: #e9ecef; font-weight: bold; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                ${printContent}
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

function downloadExcel() {
    const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 1000000;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 8.5;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 15;
    const partPaymentAmount = parseFloat(document.getElementById('partPaymentAmount').value) || 0;
    const partPaymentMonth = parseInt(document.getElementById('partPaymentMonth').value) || 24;
    
    // Get current results
    const originalEmi = document.getElementById('originalEmiResult').textContent;
    const interestSavings = document.getElementById('interestSavingsResult').textContent;
    const totalSavings = document.getElementById('totalSavingsResult').textContent;
    const tenureReduction = document.getElementById('tenureReductionResult').textContent;
    const revisedTenure = document.getElementById('revisedTenureResult').textContent;
    
    // Create CSV content
    let csvContent = "EMI Calculator with Part Payment Results\n\n";
    csvContent += "Input Parameters:\n";
    csvContent += `Loan Amount,${formatCurrency(loanAmount)}\n`;
    csvContent += `Interest Rate,${interestRate}%\n`;
    csvContent += `Tenure,${tenureYears} years\n`;
    csvContent += `Part Payment Amount,${formatCurrency(partPaymentAmount)}\n`;
    csvContent += `Part Payment After,${partPaymentMonth} months\n\n`;
    
    csvContent += "Results:\n";
    csvContent += `Monthly EMI,${originalEmi}\n`;
    csvContent += `Interest Savings,${interestSavings}\n`;
    csvContent += `Total Savings,${totalSavings}\n`;
    csvContent += `Tenure Reduction,${tenureReduction}\n`;
    csvContent += `Revised Tenure,${revisedTenure}\n\n`;
    
    // Add yearly breakdown if available
    const tableBody = document.getElementById('yearlyBreakdownBody');
    if (tableBody && tableBody.children.length > 0) {
        csvContent += "Year-wise Breakdown:\n";
        csvContent += "Year,Principal,Interest,Part Payment,Total Payment,Balance\n";
        
        for (let i = 0; i < tableBody.children.length; i++) {
            const row = tableBody.children[i];
            if (row.classList.contains('year-row')) {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 6) {
                    const year = cells[0].textContent.replace('Year ', '').trim();
                    const principal = cells[1].textContent.trim();
                    const interest = cells[2].textContent.trim();
                    const partPayment = cells[3].textContent.trim();
                    const totalPayment = cells[4].textContent.trim();
                    const balance = cells[5].textContent.trim();
                    csvContent += `${year},${principal},${interest},${partPayment},${totalPayment},${balance}\n`;
                }
            }
        }
    }
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'emi_calculator_with_part_payment_results.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Excel file downloaded successfully!', 'success');
}

function generatePrintableContent() {
    const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 1000000;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 8.5;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 15;
    const partPaymentAmount = parseFloat(document.getElementById('partPaymentAmount').value) || 0;
    const partPaymentMonth = parseInt(document.getElementById('partPaymentMonth').value) || 24;
    
    // Get current results
    const originalEmi = document.getElementById('originalEmiResult').textContent;
    const interestSavings = document.getElementById('interestSavingsResult').textContent;
    const totalSavings = document.getElementById('totalSavingsResult').textContent;
    const tenureReduction = document.getElementById('tenureReductionResult').textContent;
    const revisedTenure = document.getElementById('revisedTenureResult').textContent;
    
    return `
        <div class="header">
            <h1>EMI Calculator with Part Payment Results</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="results-grid">
            <div class="result-item">
                <div class="result-label">Loan Amount:</div>
                <div class="result-value">${formatCurrency(loanAmount)}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Interest Rate:</div>
                <div class="result-value">${interestRate}%</div>
            </div>
            <div class="result-item">
                <div class="result-label">Tenure:</div>
                <div class="result-value">${tenureYears} years</div>
            </div>
            <div class="result-item">
                <div class="result-label">Part Payment Amount:</div>
                <div class="result-value">${formatCurrency(partPaymentAmount)}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Part Payment After:</div>
                <div class="result-value">${partPaymentMonth} months</div>
            </div>
            <div class="result-item">
                <div class="result-label">Monthly EMI:</div>
                <div class="result-value">${originalEmi}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Interest Savings:</div>
                <div class="result-value">${interestSavings}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Total Savings:</div>
                <div class="result-value">${totalSavings}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Tenure Reduction:</div>
                <div class="result-value">${tenureReduction}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Revised Tenure:</div>
                <div class="result-value">${revisedTenure}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Current Loan Amount:</div>
                <div class="result-value">${document.getElementById('currentLoanAmountResult').textContent}</div>
            </div>
            <div class="result-item">
                <div class="result-label">New Current Loan Amount:</div>
                <div class="result-value">${document.getElementById('newLoanAmountResult').textContent}</div>
            </div>
        </div>
    `;
}

function shareLink() {
    const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 1000000;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 8.5;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 15;
    const partPaymentAmount = parseFloat(document.getElementById('partPaymentAmount').value) || 0;
    const partPaymentMonth = parseInt(document.getElementById('partPaymentMonth').value) || 24;
    const partPaymentOption = document.querySelector('input[name="partPaymentOption"]:checked')?.value || 'reduceTenure';
    
    const params = new URLSearchParams({
        loanAmount: loanAmount,
        interestRate: interestRate,
        tenureYears: tenureYears,
        partPaymentAmount: partPaymentAmount,
        partPaymentMonth: partPaymentMonth,
        partPaymentOption: partPaymentOption
    });
    
    const shareUrl = `${window.location.origin}/emi-calculator-with-part-payment/?${params.toString()}`;
    
    const optionText = partPaymentOption === 'reduceEmi' ? 'Reduce EMI' : 'Reduce Tenure';
    
    // Try to use the Web Share API if available
    if (navigator.share) {
        navigator.share({
            title: 'EMI Calculator with Part Payment Results',
            text: `Check out my EMI calculation: Monthly EMI ${document.getElementById('originalEmiResult').textContent}, Interest Savings ${document.getElementById('interestSavingsResult').textContent}, Option: ${optionText}`,
            url: shareUrl
        }).then(() => {
            showNotification('Link shared successfully!', 'success');
        }).catch((error) => {
            fallbackCopyTextToClipboard(shareUrl);
        });
    } else {
        // Fallback to clipboard copy
        fallbackCopyTextToClipboard(shareUrl);
    }
}

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showNotification('Link copied to clipboard!', 'success');
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
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    
    if (type === 'success') {
        notification.style.backgroundColor = '#10b981';
    } else if (type === 'error') {
        notification.style.backgroundColor = '#ef4444';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function loadFromUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    const loanAmount = urlParams.get('loanAmount');
    const interestRate = urlParams.get('interestRate');
    const tenureYears = urlParams.get('tenureYears');
    const partPaymentAmount = urlParams.get('partPaymentAmount');
    const partPaymentMonth = urlParams.get('partPaymentMonth');
    const partPaymentOption = urlParams.get('partPaymentOption');
    
    if (loanAmount) document.getElementById('loanAmount').value = loanAmount;
    if (interestRate) document.getElementById('interestRate').value = interestRate;
    if (tenureYears) document.getElementById('tenureYears').value = tenureYears;
    if (partPaymentAmount) document.getElementById('partPaymentAmount').value = partPaymentAmount;
    if (partPaymentMonth) document.getElementById('partPaymentMonth').value = partPaymentMonth;
    
    // Set radio button
    if (partPaymentOption) {
        const radioButton = document.querySelector(`input[name="partPaymentOption"][value="${partPaymentOption}"]`);
        if (radioButton) radioButton.checked = true;
    }
    
    // Update sliders to match inputs
    if (loanAmount) document.getElementById('loanAmountSlider').value = loanAmount;
    if (interestRate) document.getElementById('interestRateSlider').value = interestRate;
    if (tenureYears) document.getElementById('tenureYearsSlider').value = tenureYears;
    if (partPaymentAmount) document.getElementById('partPaymentAmountSlider').value = partPaymentAmount;
    if (partPaymentMonth) document.getElementById('partPaymentMonthSlider').value = partPaymentMonth;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style); 
