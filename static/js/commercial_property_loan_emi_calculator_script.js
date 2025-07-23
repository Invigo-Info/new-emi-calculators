// Global variables
let paymentBreakupChart;
let currentTenureUnit = 'years'; // Track current tenure unit

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    setupDownloadButtons();
    setupMegaMenu();
    setupTenureButtons();
    loadFromUrlParameters();
    calculateAndUpdate();
});

function setupEventListeners() {
    // Input change listeners for sliders and number inputs
    const inputs = [
        { input: 'propertyPrice', slider: 'propertyPriceSlider', min: 500000, max: 100000000 },
        { input: 'interestRate', slider: 'interestRateSlider', min: 9, max: 18 }
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
    
    // Special handling for tenure
    setupTenureEventListeners();
}

function setupTenureEventListeners() {
    const tenureValueInput = document.getElementById('tenureValue');
    const tenureSlider = document.getElementById('tenureSlider');
    
    // Input value changes
    tenureValueInput.addEventListener('input', function() {
        updateSliderFromInput();
        calculateAndUpdate();
    });
    
    // Slider changes
    tenureSlider.addEventListener('input', function() {
        updateInputFromSlider();
        calculateAndUpdate();
    });
}

function setupTenureButtons() {
    const monthBtn = document.getElementById('tenureMoBtn');
    const yearBtn = document.getElementById('tenureYrBtn');
    
    monthBtn.addEventListener('click', function() {
        switchTenureUnit('months');
    });
    
    yearBtn.addEventListener('click', function() {
        switchTenureUnit('years');
    });
}

function switchTenureUnit(unit) {
    const monthBtn = document.getElementById('tenureMoBtn');
    const yearBtn = document.getElementById('tenureYrBtn');
    const tenureValueInput = document.getElementById('tenureValue');
    const tenureSlider = document.getElementById('tenureSlider');
    const sliderLabels = document.getElementById('tenureSliderLabels');
    
    // Store previous unit before updating
    const previousUnit = currentTenureUnit;
    currentTenureUnit = unit;
    
    if (unit === 'months') {
        monthBtn.classList.add('active');
        yearBtn.classList.remove('active');
        
        // Convert current value from years to months if switching from years
        const currentValue = parseFloat(tenureValueInput.value) || 1;
        if (previousUnit === 'years') {
            const monthsValue = Math.round(currentValue * 12);
            tenureValueInput.value = Math.max(12, Math.min(300, monthsValue));
        }
        
        // Update slider range for months (12 to 300 months = 1 to 25 years)
        tenureSlider.min = 12;
        tenureSlider.max = 300;
        tenureSlider.step = 12;
        
        // Set slider value to match the converted input value
        const inputValue = parseFloat(tenureValueInput.value) || 12;
        tenureSlider.value = Math.max(12, Math.min(300, inputValue));
        
        // Update input constraints
        tenureValueInput.min = 12;
        tenureValueInput.max = 300;
        tenureValueInput.step = 12;
        
        // Update slider labels
        sliderLabels.innerHTML = `
            <span>12</span>
            <span>84</span>
            <span>156</span>
            <span>228</span>
            <span>300</span>
        `;
    } else {
        yearBtn.classList.add('active');
        monthBtn.classList.remove('active');
        
        // Convert current value from months to years if switching from months
        const currentValue = parseFloat(tenureValueInput.value) || 12;
        if (previousUnit === 'months') {
            const yearsValue = Math.round(currentValue / 12);
            tenureValueInput.value = Math.max(1, Math.min(25, yearsValue));
        }
        
        // Update slider range for years (1 to 25 years)
        tenureSlider.min = 1;
        tenureSlider.max = 25;
        tenureSlider.step = 1;
        
        // Set slider value to match the converted input value
        const inputValue = parseFloat(tenureValueInput.value) || 15;
        tenureSlider.value = Math.max(1, Math.min(25, inputValue));
        
        // Update input constraints
        tenureValueInput.min = 1;
        tenureValueInput.max = 25;
        tenureValueInput.step = 1;
        
        // Update slider labels
        sliderLabels.innerHTML = `
            <span>1</span>
            <span>7</span>
            <span>13</span>
            <span>19</span>
            <span>25</span>
        `;
    }
    
    calculateAndUpdate();
}

function updateSliderFromInput() {
    const tenureValueInput = document.getElementById('tenureValue');
    const tenureSlider = document.getElementById('tenureSlider');
    
    const value = parseFloat(tenureValueInput.value) || 0;
    const min = parseFloat(tenureSlider.min);
    const max = parseFloat(tenureSlider.max);
    
    tenureSlider.value = Math.min(Math.max(value, min), max);
}

function updateInputFromSlider() {
    const tenureValueInput = document.getElementById('tenureValue');
    const tenureSlider = document.getElementById('tenureSlider');
    
    tenureValueInput.value = tenureSlider.value;
}

function calculateAndUpdate() {
    const propertyPrice = parseFloat(document.getElementById('propertyPrice').value) || 0;
    const tenureValue = parseFloat(document.getElementById('tenureValue').value) || (currentTenureUnit === 'years' ? 15 : 180);
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 11.5;
    
    // Convert tenure to months if currently in years
    const tenureMonths = currentTenureUnit === 'years' ? tenureValue * 12 : tenureValue;
    
    // For commercial property loan, loan amount = property price (no down payment)
    const loanAmount = propertyPrice;
    
    // Make API call
    fetch('/calculate-commercial-property-emi', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            propertyPrice: propertyPrice,
            loanAmount: loanAmount,
            tenureMonths: tenureMonths,
            interestRate: interestRate
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            updateResults(data);
            updateChart(data);
            updateAmortizationTable(data);
        } else {
            console.error('Calculation error:', data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function updateResults(data) {
    document.getElementById('loanAmountResult').textContent = formatCurrency(data.loanAmount);
    document.getElementById('monthlyEmi').textContent = formatCurrency(data.monthlyEmi);
    document.getElementById('totalInterestResult').textContent = formatCurrency(data.totalInterest);
    document.getElementById('totalPayment').textContent = formatCurrency(data.totalPayment);
    
    document.getElementById('loanAmountDisplay').textContent = formatCurrency(data.loanAmount);
    document.getElementById('interestAmountDisplay').textContent = formatCurrency(data.totalInterest);
}

function updateChart(data) {
    const ctx = document.getElementById('paymentBreakupChart').getContext('2d');
    
    if (paymentBreakupChart) {
        paymentBreakupChart.destroy();
    }
    
    paymentBreakupChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Loan Amount', 'Interest Amount'],
            datasets: [{
                data: [data.loanAmount, data.totalInterest],
                backgroundColor: ['#3182ce', '#e53e3e'],
                borderWidth: 0,
                cutout: '70%'
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
                    callbacks: {
                        label: function(context) {
                            const label = context.label;
                            const value = formatCurrency(context.raw);
                            const percentage = ((context.raw / data.totalPayment) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function updateAmortizationTable(data) {
    const tableBody = document.getElementById('amortizationTableBody');
    tableBody.innerHTML = '';
    
    if (data.amortizationSchedule && data.amortizationSchedule.length > 0) {
        data.amortizationSchedule.forEach(yearData => {
            // Add yearly summary row
            const yearRow = document.createElement('tr');
            yearRow.className = 'year-row';
            yearRow.innerHTML = `
                <td class="year-cell" onclick="toggleMonthlyRows(this)" data-year="${yearData.year}">
                    ${yearData.year}
                </td>
                <td class="amount-cell">${formatCurrency(yearData.principal)}</td>
                <td class="amount-cell">${formatCurrency(yearData.interest)}</td>
                <td class="amount-cell">${formatCurrency(yearData.total_payment)}</td>
                <td class="amount-cell">${formatCurrency(yearData.balance)}</td>
                <td class="percentage-cell">${yearData.loan_paid_percentage}%</td>
            `;
            tableBody.appendChild(yearRow);
            
            // Add monthly rows for this year (initially hidden)
            if (yearData.monthly_data && yearData.monthly_data.length > 0) {
                yearData.monthly_data.forEach(month => {
                    const monthRow = document.createElement('tr');
                    monthRow.className = 'month-row';
                    monthRow.setAttribute('data-parent-year', yearData.year);
                    monthRow.innerHTML = `
                        <td class="month-cell">${month.month}</td>
                        <td class="amount-cell">${formatCurrency(month.principal)}</td>
                        <td class="amount-cell">${formatCurrency(month.interest)}</td>
                        <td class="amount-cell">${formatCurrency(month.total_payment)}</td>
                        <td class="amount-cell">${formatCurrency(month.balance)}</td>
                        <td class="percentage-cell">${month.loan_paid_percentage}%</td>
                    `;
                    tableBody.appendChild(monthRow);
                });
            }
        });
    }
}

function toggleMonthlyRows(yearCell) {
    const yearRow = yearCell.parentElement;
    let nextRow = yearRow.nextElementSibling;
    
    // Toggle expanded class
    yearCell.classList.toggle('expanded');
    
    // Show/hide monthly rows
    while (nextRow && nextRow.classList.contains('month-row')) {
        nextRow.classList.toggle('show');
        nextRow = nextRow.nextElementSibling;
    }
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
        const megaMenuLinks = megaMenu.querySelectorAll('.mega-link');
        megaMenuLinks.forEach(link => {
            link.addEventListener('click', function() {
                megaMenu.classList.remove('open');
            });
        });
        
        // Close mega menu on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && megaMenu.classList.contains('open')) {
                megaMenu.classList.remove('open');
            }
        });
    }
}

function setupDownloadButtons() {
    // Download buttons functionality will be implemented here
}

function downloadPDF() {
    const propertyPrice = parseFloat(document.getElementById('propertyPrice').value) || 0;
    const tenureValue = parseFloat(document.getElementById('tenureValue').value) || 15;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 11.5;
    
    const loanAmount = propertyPrice;
    const monthlyEmi = document.getElementById('monthlyEmi').textContent;
    const totalInterest = document.getElementById('totalInterestResult').textContent;
    const totalPayment = document.getElementById('totalPayment').textContent;
    
    const printContent = generatePrintableContent();
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
}

function downloadExcel() {
    showNotification('Excel download functionality will be implemented soon.', 'info');
}

function shareLink() {
    const propertyPrice = parseFloat(document.getElementById('propertyPrice').value) || 0;
    const tenureValue = parseFloat(document.getElementById('tenureValue').value) || 15;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 11.5;
    
    const params = new URLSearchParams({
        propertyPrice: propertyPrice,
        tenure: tenureValue,
        tenureUnit: currentTenureUnit,
        interestRate: interestRate
    });
    
    const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Commercial Property Loan EMI Calculator',
            text: `Check out my commercial property loan calculation: Property Value: ${formatCurrency(propertyPrice)}`,
            url: shareUrl
        });
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl).then(() => {
            showNotification('Link copied to clipboard!', 'success');
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
        showNotification('Link copied to clipboard!', 'success');
    } catch (err) {
        showNotification('Failed to copy link. Please copy manually.', 'error');
    }
    
    document.body.removeChild(textArea);
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#38a169' : type === 'error' ? '#e53e3e' : '#3182ce'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        font-weight: 500;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        animation: slideInRight 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function generatePrintableContent() {
    const propertyPrice = parseFloat(document.getElementById('propertyPrice').value) || 0;
    const tenureValue = parseFloat(document.getElementById('tenureValue').value) || 15;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 11.5;
    
    const loanAmount = propertyPrice;
    const monthlyEmi = document.getElementById('monthlyEmi').textContent;
    const totalInterest = document.getElementById('totalInterestResult').textContent;
    const totalPayment = document.getElementById('totalPayment').textContent;
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Commercial Property Loan EMI Calculation</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .calculation-details { margin-bottom: 20px; }
                .result-table { width: 100%; border-collapse: collapse; }
                .result-table th, .result-table td { padding: 10px; border: 1px solid #ddd; text-align: left; }
                .result-table th { background-color: #f2f2f2; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Commercial Property Loan EMI Calculator</h1>
                <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            <div class="calculation-details">
                <table class="result-table">
                    <tr><th>Property Value</th><td>${formatCurrency(propertyPrice)}</td></tr>
                    <tr><th>Loan Amount</th><td>${formatCurrency(loanAmount)}</td></tr>
                    <tr><th>Interest Rate</th><td>${interestRate}% per annum</td></tr>
                    <tr><th>Loan Tenure</th><td>${tenureValue} ${currentTenureUnit}</td></tr>
                    <tr><th>Monthly EMI</th><td>${monthlyEmi}</td></tr>
                    <tr><th>Total Interest</th><td>${totalInterest}</td></tr>
                    <tr><th>Total Payment</th><td>${totalPayment}</td></tr>
                </table>
            </div>
        </body>
        </html>
    `;
}

function loadFromUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('propertyPrice')) {
        document.getElementById('propertyPrice').value = urlParams.get('propertyPrice');
        document.getElementById('propertyPriceSlider').value = urlParams.get('propertyPrice');
    }
    
    if (urlParams.get('interestRate')) {
        document.getElementById('interestRate').value = urlParams.get('interestRate');
        document.getElementById('interestRateSlider').value = urlParams.get('interestRate');
    }
    
    if (urlParams.get('tenure')) {
        document.getElementById('tenureValue').value = urlParams.get('tenure');
        document.getElementById('tenureSlider').value = urlParams.get('tenure');
    }
    
    if (urlParams.get('tenureUnit')) {
        switchTenureUnit(urlParams.get('tenureUnit'));
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
} 