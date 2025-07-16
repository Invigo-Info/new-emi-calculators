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
        { input: 'tractorPrice', slider: 'tractorPriceSlider', min: 100000, max: 2500000 },
        { input: 'interestRate', slider: 'interestRateSlider', min: 6, max: 25 }
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
            tenureValueInput.value = Math.max(12, Math.min(120, monthsValue));
        }
        
        // Update slider range for months (12 to 120 months = 1 to 10 years)
        tenureSlider.min = 12;
        tenureSlider.max = 120;
        tenureSlider.step = 12;
        
        // Set slider value to match the converted input value
        const inputValue = parseFloat(tenureValueInput.value) || 12;
        tenureSlider.value = Math.max(12, Math.min(120, inputValue));
        
        // Update input constraints
        tenureValueInput.min = 12;
        tenureValueInput.max = 120;
        tenureValueInput.step = 12;
        
        // Update slider labels
        sliderLabels.innerHTML = `
            <span>12</span>
            <span>36</span>
            <span>60</span>
            <span>84</span>
            <span>120</span>
        `;
    } else {
        yearBtn.classList.add('active');
        monthBtn.classList.remove('active');
        
        // Convert current value from months to years if switching from months
        const currentValue = parseFloat(tenureValueInput.value) || 12;
        if (previousUnit === 'months') {
            const yearsValue = Math.round(currentValue / 12);
            tenureValueInput.value = Math.max(1, Math.min(10, yearsValue));
        }
        
        // Update slider range for years (1 to 10 years)
        tenureSlider.min = 1;
        tenureSlider.max = 10;
        tenureSlider.step = 1;
        
        // Set slider value to match the converted input value
        const inputValue = parseFloat(tenureValueInput.value) || 1;
        tenureSlider.value = Math.max(1, Math.min(10, inputValue));
        
        // Update input constraints
        tenureValueInput.min = 1;
        tenureValueInput.max = 10;
        tenureValueInput.step = 1;
        
        // Update slider labels
        sliderLabels.innerHTML = `
            <span>1</span>
            <span>3</span>
            <span>5</span>
            <span>8</span>
            <span>10</span>
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
    const tractorPrice = parseFloat(document.getElementById('tractorPrice').value) || 0;
    const tenureValue = parseFloat(document.getElementById('tenureValue').value) || (currentTenureUnit === 'years' ? 1 : 12);
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 6.5;
    
    // Convert tenure to months if currently in years
    const tenureMonths = currentTenureUnit === 'years' ? tenureValue * 12 : tenureValue;
    
    // For tractor loan, loan amount = tractor price (no down payment)
    const loanAmount = tractorPrice;
    
    // Make API call
    fetch('/calculate-tractor-loan-emi', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            tractorPrice: tractorPrice,
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
    const tractorPrice = parseFloat(document.getElementById('tractorPrice').value) || 0;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 6.5;
    const tenureValue = parseFloat(document.getElementById('tenureValue').value) || 1;
    const tenureMonths = currentTenureUnit === 'years' ? tenureValue * 12 : tenureValue;
    
    // Create printable content
    const printContent = generatePrintableContent();
    
    // Open print dialog
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Tractor Loan EMI Calculator - Results</title>
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
    const tractorPrice = parseFloat(document.getElementById('tractorPrice').value) || 0;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 6.5;
    const tenureValue = parseFloat(document.getElementById('tenureValue').value) || 1;
    
    const params = new URLSearchParams({
        tractorPrice: tractorPrice,
        interestRate: interestRate,
        tenure: tenureValue,
        tenureUnit: currentTenureUnit
    });
    
    const shareUrl = `${window.location.origin}/tractor-loan-emi-calculator/?${params.toString()}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Tractor Loan EMI Calculator',
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
        const successful = document.execCommand('copy');
        const msg = successful ? 'Link copied to clipboard!' : 'Failed to copy link';
        showNotification(msg, successful ? 'success' : 'error');
    } catch (err) {
        showNotification('Failed to copy link', 'error');
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
        font-weight: 600;
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        ${type === 'success' ? 'background: #38a169;' : 'background: #e53e3e;'}
    `;
    
    document.body.appendChild(notification);
    
    // Trigger slide-in animation
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

function generatePrintableContent() {
    const tractorPrice = parseFloat(document.getElementById('tractorPrice').value) || 0;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 6.5;
    const tenureValue = parseFloat(document.getElementById('tenureValue').value) || 1;
    const monthlyEmi = document.getElementById('monthlyEmi').textContent;
    const totalInterest = document.getElementById('totalInterestResult').textContent;
    const totalPayment = document.getElementById('totalPayment').textContent;
    
    return `
        <div class="header">
            <h1>Tractor Loan EMI Calculator Results</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        <div class="results">
            <h2>Loan Details</h2>
            <p><strong>Tractor Price:</strong> ₹${formatCurrency(tractorPrice)}</p>
            <p><strong>Interest Rate:</strong> ${interestRate}% per annum</p>
            <p><strong>Loan Tenure:</strong> ${tenureValue} ${currentTenureUnit}</p>
            <p><strong>Monthly EMI:</strong> ${monthlyEmi}</p>
            <p><strong>Total Interest:</strong> ${totalInterest}</p>
            <p><strong>Total Payment:</strong> ${totalPayment}</p>
        </div>
    `;
}

function loadFromUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.has('tractorPrice')) {
        const tractorPrice = parseFloat(urlParams.get('tractorPrice'));
        if (!isNaN(tractorPrice)) {
            document.getElementById('tractorPrice').value = tractorPrice;
            document.getElementById('tractorPriceSlider').value = tractorPrice;
        }
    }
    
    if (urlParams.has('interestRate')) {
        const interestRate = parseFloat(urlParams.get('interestRate'));
        if (!isNaN(interestRate)) {
            document.getElementById('interestRate').value = interestRate;
            document.getElementById('interestRateSlider').value = interestRate;
        }
    }
    
    if (urlParams.has('tenure') && urlParams.has('tenureUnit')) {
        const tenure = parseFloat(urlParams.get('tenure'));
        const tenureUnit = urlParams.get('tenureUnit');
        if (!isNaN(tenure) && (tenureUnit === 'years' || tenureUnit === 'months')) {
            switchTenureUnit(tenureUnit);
            document.getElementById('tenureValue').value = tenure;
            document.getElementById('tenureSlider').value = tenure;
        }
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        maximumFractionDigits: 0
    }).format(amount);
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