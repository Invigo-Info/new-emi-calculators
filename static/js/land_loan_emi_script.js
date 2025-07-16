// Global variables
let paymentBreakupChart;
let currentTenureUnit = 'years'; // Track current tenure unit

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    setupDownloadButtons();
    setupDropdown();
    setupTenureButtons();
    loadFromUrlParameters();
    calculateAndUpdate();
});

function setupEventListeners() {
    // Input change listeners for sliders and number inputs
    const inputs = [
        { input: 'landPrice', slider: 'landPriceSlider', min: 100000, max: 50000000 },
        { input: 'interestRate', slider: 'interestRateSlider', min: 8, max: 18 }
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
            tenureValueInput.value = Math.max(12, Math.min(360, monthsValue));
        }
        
        // Update slider range for months (12 to 360 months = 1 to 30 years)
        tenureSlider.min = 12;
        tenureSlider.max = 360;
        tenureSlider.step = 12;
        
        // Set slider value to match the converted input value
        const inputValue = parseFloat(tenureValueInput.value) || 12;
        tenureSlider.value = Math.max(12, Math.min(360, inputValue));
        
        // Update input constraints
        tenureValueInput.min = 12;
        tenureValueInput.max = 360;
        tenureValueInput.step = 12;
        
        // Update slider labels
        sliderLabels.innerHTML = `
            <span>12</span>
            <span>96</span>
            <span>180</span>
            <span>264</span>
            <span>360</span>
        `;
    } else {
        yearBtn.classList.add('active');
        monthBtn.classList.remove('active');
        
        // Convert current value from months to years if switching from months
        const currentValue = parseFloat(tenureValueInput.value) || 12;
        if (previousUnit === 'months') {
            const yearsValue = Math.round(currentValue / 12);
            tenureValueInput.value = Math.max(1, Math.min(30, yearsValue));
        }
        
        // Update slider range for years (1 to 30 years)
        tenureSlider.min = 1;
        tenureSlider.max = 30;
        tenureSlider.step = 1;
        
        // Set slider value to match the converted input value
        const inputValue = parseFloat(tenureValueInput.value) || 10;
        tenureSlider.value = Math.max(1, Math.min(30, inputValue));
        
        // Update input constraints
        tenureValueInput.min = 1;
        tenureValueInput.max = 30;
        tenureValueInput.step = 1;
        
        // Update slider labels
        sliderLabels.innerHTML = `
            <span>1</span>
            <span>8</span>
            <span>15</span>
            <span>23</span>
            <span>30</span>
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
    const landPrice = parseFloat(document.getElementById('landPrice').value) || 0;
    const tenureValue = parseFloat(document.getElementById('tenureValue').value) || (currentTenureUnit === 'years' ? 10 : 120);
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 10.5;
    
    // Convert tenure to months if currently in years
    const tenureMonths = currentTenureUnit === 'years' ? tenureValue * 12 : tenureValue;
    
    // For land loan, loan amount = land price (no down payment)
    const loanAmount = landPrice;
    
    // Make API call
    fetch('/calculate-land-loan-emi', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            landPrice: landPrice,
            loanAmount: loanAmount,
            tenureMonths: tenureMonths,
            interestRate: interestRate
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'error') {
            console.error('Error:', data.error);
            return;
        }
        updateResults(data);
        updateChart(data);
        updateAmortizationTable(data);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function updateResults(data) {
    document.getElementById('loanAmountResult').textContent = `₹${formatCurrency(data.loanAmount)}`;
    document.getElementById('monthlyEmi').textContent = `₹${formatCurrency(data.monthlyEmi)}`;
    document.getElementById('totalInterestResult').textContent = `₹${formatCurrency(data.totalInterest)}`;
    document.getElementById('totalPayment').textContent = `₹${formatCurrency(data.totalPayment)}`;
    document.getElementById('loanAmountDisplay').textContent = `₹${formatCurrency(data.loanAmount)}`;
    document.getElementById('interestAmountDisplay').textContent = `₹${formatCurrency(data.totalInterest)}`;
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
                backgroundColor: ['#e53e3e', '#38a169'],
                borderWidth: 0,
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
                            const value = context.raw;
                            const percentage = ((value / data.totalPayment) * 100).toFixed(1);
                            return `${context.label}: ₹${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
}

function updateAmortizationTable(data) {
    const tableBody = document.getElementById('amortizationTableBody');
    tableBody.innerHTML = '';
    
    if (data.amortizationSchedule && data.amortizationSchedule.length > 0) {
        // Add yearly summary row first
        const yearRow = document.createElement('tr');
        yearRow.className = 'year-row';
        yearRow.innerHTML = `
            <td class="year-cell" onclick="toggleMonthlyRows(this)">
                Year ${data.amortizationSchedule[0].year}
            </td>
            <td class="amount-cell">₹${formatCurrency(data.amortizationSchedule[0].principal)}</td>
            <td class="amount-cell">₹${formatCurrency(data.amortizationSchedule[0].interest)}</td>
            <td class="amount-cell">₹${formatCurrency(data.amortizationSchedule[0].total_payment)}</td>
            <td class="amount-cell">₹${formatCurrency(data.amortizationSchedule[0].balance)}</td>
            <td class="percentage-cell">${data.amortizationSchedule[0].loan_paid_percentage}%</td>
        `;
        tableBody.appendChild(yearRow);
        
        // Add monthly rows (initially hidden)
        if (data.amortizationSchedule[0].monthly_data) {
            data.amortizationSchedule[0].monthly_data.forEach(month => {
                const monthRow = document.createElement('tr');
                monthRow.className = 'month-row';
                monthRow.innerHTML = `
                    <td class="month-cell">${month.month}</td>
                    <td class="amount-cell">₹${formatCurrency(month.principal)}</td>
                    <td class="amount-cell">₹${formatCurrency(month.interest)}</td>
                    <td class="amount-cell">₹${formatCurrency(month.total_payment)}</td>
                    <td class="amount-cell">₹${formatCurrency(month.balance)}</td>
                    <td class="percentage-cell">${month.loan_paid_percentage}%</td>
                `;
                tableBody.appendChild(monthRow);
            });
        }
        
        // Add remaining years
        for (let i = 1; i < data.amortizationSchedule.length; i++) {
            const yearData = data.amortizationSchedule[i];
            const yearRow = document.createElement('tr');
            yearRow.className = 'year-row';
            yearRow.innerHTML = `
                <td class="year-cell" onclick="toggleMonthlyRows(this)">
                    Year ${yearData.year}
                </td>
                <td class="amount-cell">₹${formatCurrency(yearData.principal)}</td>
                <td class="amount-cell">₹${formatCurrency(yearData.interest)}</td>
                <td class="amount-cell">₹${formatCurrency(yearData.total_payment)}</td>
                <td class="amount-cell">₹${formatCurrency(yearData.balance)}</td>
                <td class="percentage-cell">${yearData.loan_paid_percentage}%</td>
            `;
            tableBody.appendChild(yearRow);
            
            // Add monthly rows for this year
            if (yearData.monthly_data) {
                yearData.monthly_data.forEach(month => {
                    const monthRow = document.createElement('tr');
                    monthRow.className = 'month-row';
                    monthRow.innerHTML = `
                        <td class="month-cell">${month.month}</td>
                        <td class="amount-cell">₹${formatCurrency(month.principal)}</td>
                        <td class="amount-cell">₹${formatCurrency(month.interest)}</td>
                        <td class="amount-cell">₹${formatCurrency(month.total_payment)}</td>
                        <td class="amount-cell">₹${formatCurrency(month.balance)}</td>
                        <td class="percentage-cell">${month.loan_paid_percentage}%</td>
                    `;
                    tableBody.appendChild(monthRow);
                });
            }
        }
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

function setupDropdown() {
    const dropdown = document.querySelector('.dropdown');
    const dropdownBtn = document.querySelector('.dropdown-btn');
    const dropdownContent = document.querySelector('.dropdown-content');
    
    if (dropdownBtn && dropdownContent) {
        dropdownBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdown.classList.toggle('open');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('open');
            }
        });
        
        // Close dropdown when clicking on a link
        const dropdownLinks = dropdownContent.querySelectorAll('a');
        dropdownLinks.forEach(link => {
            link.addEventListener('click', function() {
                dropdown.classList.remove('open');
            });
        });
    }
}

function setupDownloadButtons() {
    // Download buttons setup would go here
    console.log('Download buttons setup');
}

function downloadPDF() {
    const landPrice = parseFloat(document.getElementById('landPrice').value) || 0;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 10.5;
    const tenureValue = parseFloat(document.getElementById('tenureValue').value) || 10;
    const tenureMonths = currentTenureUnit === 'years' ? tenureValue * 12 : tenureValue;
    
    // Create printable content
    const printContent = generatePrintableContent();
    
    // Open print dialog
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Land Loan EMI Calculator - Results</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
                    th { background-color: #f2f2f2; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .results { margin: 20px 0; }
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
    // Excel download functionality
    console.log('Excel download functionality would be implemented here');
}

function shareLink() {
    const landPrice = parseFloat(document.getElementById('landPrice').value) || 0;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 10.5;
    const tenureValue = parseFloat(document.getElementById('tenureValue').value) || 10;
    
    const params = new URLSearchParams({
        landPrice: landPrice,
        interestRate: interestRate,
        tenure: tenureValue,
        tenureUnit: currentTenureUnit
    });
    
    const shareUrl = `${window.location.origin}/land-loan-emi-calculator/?${params.toString()}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Land Loan EMI Calculator',
            url: shareUrl
        }).catch(console.error);
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl).then(function() {
            showNotification('Link copied to clipboard!', 'success');
        }).catch(function() {
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
        document.execCommand('copy');
        showNotification('Link copied to clipboard!', 'success');
    } catch (err) {
        showNotification('Failed to copy link', 'error');
    }
    
    document.body.removeChild(textArea);
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#48bb78' : '#f56565'};
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
        style.remove();
    }, 3000);
}

function generatePrintableContent() {
    const landPrice = parseFloat(document.getElementById('landPrice').value) || 0;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 10.5;
    const monthlyEmi = document.getElementById('monthlyEmi').textContent;
    const totalInterest = document.getElementById('totalInterestResult').textContent;
    const totalPayment = document.getElementById('totalPayment').textContent;
    
    return `
        <div class="header">
            <h1>Land Loan EMI Calculator Results</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="results">
            <h2>Loan Details</h2>
            <table>
                <tr><td><strong>Land Price</strong></td><td>₹${formatCurrency(landPrice)}</td></tr>
                <tr><td><strong>Loan Amount</strong></td><td>₹${formatCurrency(landPrice)}</td></tr>
                <tr><td><strong>Interest Rate</strong></td><td>${interestRate}%</td></tr>
                <tr><td><strong>Monthly EMI</strong></td><td>${monthlyEmi}</td></tr>
                <tr><td><strong>Total Interest</strong></td><td>${totalInterest}</td></tr>
                <tr><td><strong>Total Payment</strong></td><td>${totalPayment}</td></tr>
            </table>
        </div>
    `;
}

function loadFromUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.has('landPrice')) {
        const landPrice = parseFloat(urlParams.get('landPrice'));
        if (landPrice >= 100000 && landPrice <= 50000000) {
            document.getElementById('landPrice').value = landPrice;
            document.getElementById('landPriceSlider').value = landPrice;
        }
    }
    
    if (urlParams.has('interestRate')) {
        const interestRate = parseFloat(urlParams.get('interestRate'));
        if (interestRate >= 8 && interestRate <= 18) {
            document.getElementById('interestRate').value = interestRate;
            document.getElementById('interestRateSlider').value = interestRate;
        }
    }
    
    if (urlParams.has('tenure')) {
        const tenure = parseFloat(urlParams.get('tenure'));
        const tenureUnit = urlParams.get('tenureUnit') || 'years';
        
        if (tenureUnit === 'months' && tenure >= 12 && tenure <= 360) {
            switchTenureUnit('months');
            document.getElementById('tenureValue').value = tenure;
            document.getElementById('tenureSlider').value = tenure;
        } else if (tenureUnit === 'years' && tenure >= 1 && tenure <= 30) {
            switchTenureUnit('years');
            document.getElementById('tenureValue').value = tenure;
            document.getElementById('tenureSlider').value = tenure;
        }
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN').format(Math.round(amount));
} 

// Mega Menu Functionality
document.addEventListener('DOMContentLoaded', function() {
    const megaMenu = document.querySelector('.mega-menu');
    const megaMenuBtn = document.querySelector('.mega-menu-btn');
    const megaMenuContent = document.querySelector('.mega-menu-content');

    if (megaMenuBtn && megaMenu) {
        // Toggle mega menu on button click
        megaMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            megaMenu.classList.toggle('active');
        });

        // Close mega menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!megaMenu.contains(e.target)) {
                megaMenu.classList.remove('active');
            }
        });

        // Close mega menu when clicking on any link inside
        if (megaMenuContent) {
            const megaLinks = megaMenuContent.querySelectorAll('.mega-link');
            megaLinks.forEach(function(link) {
                link.addEventListener('click', function() {
                    megaMenu.classList.remove('active');
                });
            });
        }

        // Prevent closing when clicking inside the mega menu content
        if (megaMenuContent) {
            megaMenuContent.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }
    }
});