// Global variables
let paymentBreakupChart;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    setupDownloadButtons();
    setupDropdown();
    loadFromUrlParameters();
    calculateAndUpdate();
});

function setupEventListeners() {
    // Input change listeners for sliders and number inputs
    const inputs = [
        { input: 'phonePrice', slider: 'phonePriceSlider', min: 1000, max: 100000 },
        { input: 'downPayment', slider: 'downPaymentSlider', min: 0, max: 50000 },
        { input: 'interestRate', slider: 'interestRateSlider', min: 12, max: 42 }
    ];
    
    inputs.forEach(({ input, slider, min = 0, max }) => {
        const inputElement = document.getElementById(input);
        const sliderElement = document.getElementById(slider);
        
        if (inputElement && sliderElement) {
            // Sync input to slider
            inputElement.addEventListener('input', function() {
                const value = Math.max(Math.min(parseFloat(this.value) || min, max), min);
                sliderElement.value = value;
                updateDownPaymentMax();
                calculateAndUpdate();
            });
            
            // Sync slider to input
            sliderElement.addEventListener('input', function() {
                inputElement.value = this.value;
                updateDownPaymentMax();
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

function updateDownPaymentMax() {
    const phonePrice = parseFloat(document.getElementById('phonePrice').value) || 0;
    const downPaymentInput = document.getElementById('downPayment');
    const downPaymentSlider = document.getElementById('downPaymentSlider');
    
    // Update max value for down payment to phone price
    downPaymentInput.max = phonePrice;
    downPaymentSlider.max = phonePrice;
    
    // If current down payment exceeds phone price, adjust it
    const currentDownPayment = parseFloat(downPaymentInput.value) || 0;
    if (currentDownPayment > phonePrice) {
        downPaymentInput.value = phonePrice;
        downPaymentSlider.value = phonePrice;
    }
    
    // Update slider labels
    const sliderLabels = downPaymentSlider.parentElement.querySelector('.slider-labels');
    if (sliderLabels) {
        sliderLabels.innerHTML = `
            <span>₹0</span>
            <span>₹${formatCurrency(phonePrice)}</span>
        `;
    }
}

function calculateAndUpdate() {
    const phonePrice = parseFloat(document.getElementById('phonePrice').value) || 0;
    const downPayment = parseFloat(document.getElementById('downPayment').value) || 0;
    const tenureMonths = parseFloat(document.getElementById('tenureValue').value) || 6;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 18;
    
    // Make API call
    fetch('/calculate-mobile-phone-emi', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            phonePrice: phonePrice,
            downPayment: downPayment,
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
    document.getElementById('mobilePriceResult').textContent = `₹${formatCurrency(data.phonePrice)}`;
    document.getElementById('downPaymentResult').textContent = `₹${formatCurrency(data.downPayment)}`;
    document.getElementById('loanAmountResult').textContent = `₹${formatCurrency(data.loanAmount)}`;
    document.getElementById('monthlyEmi').textContent = `₹${formatCurrency(data.monthlyEmi)}`;
    document.getElementById('totalInterestResult').textContent = `₹${formatCurrency(data.totalInterest)}`;
    document.getElementById('totalPayment').textContent = `₹${formatCurrency(data.totalPayment)}`;
    document.getElementById('downPaymentDisplay').textContent = `₹${formatCurrency(data.downPayment)}`;
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
            labels: ['Down Payment', 'Loan Amount', 'Interest Amount'],
            datasets: [{
                data: [data.downPayment, data.loanAmount, data.totalInterest],
                backgroundColor: ['#3182ce', '#14B8A6', '#F59E0B'],
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
            <td class="year-cell" onclick="toggleMonthlyRows(this)">📅 2025</td>
            <td class="amount-cell">₹ ${formatCurrency(data.loanAmount)}</td>
            <td class="amount-cell">₹ ${formatCurrency(data.totalInterest)}</td>
            <td class="amount-cell">₹ ${formatCurrency(data.loanAmount)}</td>
            <td class="amount-cell">₹ 0</td>
            <td class="percentage-cell">100.00%</td>
        `;
        tableBody.appendChild(yearRow);
        
        // Add monthly breakdown rows (initially hidden)
        data.amortizationSchedule.forEach((payment, index) => {
            const row = document.createElement('tr');
            row.className = 'month-row';
            row.innerHTML = `
                <td class="month-cell">${payment.month}</td>
                <td class="amount-cell">₹ ${formatCurrency(payment.principal)}</td>
                <td class="amount-cell">₹ ${formatCurrency(payment.interest)}</td>
                <td class="amount-cell">₹ ${formatCurrency(payment.totalPayment)}</td>
                <td class="amount-cell">₹ ${formatCurrency(payment.balance)}</td>
                <td class="percentage-cell">${payment.loanPaidPercentage}%</td>
            `;
            tableBody.appendChild(row);
        });
    }
}

function toggleMonthlyRows(yearCell) {
    const monthRows = yearCell.closest('tbody').querySelectorAll('.month-row');
    const isExpanded = yearCell.classList.contains('expanded');
    
    if (isExpanded) {
        // Collapse
        yearCell.classList.remove('expanded');
        monthRows.forEach(row => {
            row.classList.remove('show');
        });
    } else {
        // Expand
        yearCell.classList.add('expanded');
        monthRows.forEach(row => {
            row.classList.add('show');
        });
    }
}

function setupDropdown() {
    const dropdown = document.querySelector('.dropdown');
    const dropdownBtn = document.querySelector('.dropdown-btn');
    const dropdownContent = document.querySelector('.dropdown-content');
    
    if (dropdownBtn && dropdown) {
        dropdownBtn.addEventListener('click', function(e) {
            e.preventDefault();
            dropdown.classList.toggle('open');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('open');
            }
        });
        
        // Close dropdown when pressing escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                dropdown.classList.remove('open');
            }
        });
    }
}

function setupDownloadButtons() {
    // Setup download and share functionality
    const pdfBtn = document.querySelector('.pdf-btn');
    const excelBtn = document.querySelector('.excel-btn');
    const shareBtn = document.querySelector('.share-btn');
    
    if (pdfBtn) pdfBtn.addEventListener('click', downloadPDF);
    if (excelBtn) excelBtn.addEventListener('click', downloadExcel);
    if (shareBtn) shareBtn.addEventListener('click', shareLink);
}

function downloadPDF() {
    const content = generatePrintableContent();
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Mobile Phone EMI Calculator Results</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .results { margin-bottom: 30px; }
                .result-item { margin: 10px 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
                th { background-color: #f2f2f2; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            ${content}
            <script>window.print(); window.close();</script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

function downloadExcel() {
    const phonePrice = parseFloat(document.getElementById('phonePrice').value) || 0;
    const downPayment = parseFloat(document.getElementById('downPayment').value) || 0;
    const tenureMonths = parseFloat(document.getElementById('tenureValue').value) || 6;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 18;
    const loanAmount = phonePrice - downPayment;
    
    // Calculate EMI and interest
    const monthlyRate = interestRate / (12 * 100);
    let emi, totalInterest;
    
    if (monthlyRate === 0) {
        emi = loanAmount / tenureMonths;
        totalInterest = 0;
    } else {
        emi = loanAmount * monthlyRate * ((1 + monthlyRate) ** tenureMonths) / (((1 + monthlyRate) ** tenureMonths) - 1);
        totalInterest = (emi * tenureMonths) - loanAmount;
    }
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Mobile Phone EMI Calculator Results\n\n";
    csvContent += "Input Parameters\n";
    csvContent += `Phone Price,₹${formatCurrency(phonePrice)}\n`;
    csvContent += `Down Payment,₹${formatCurrency(downPayment)}\n`;
    csvContent += `Loan Amount,₹${formatCurrency(loanAmount)}\n`;
    csvContent += `Interest Rate,${interestRate}%\n`;
    csvContent += `Tenure,${tenureMonths} months\n`;
    csvContent += `Monthly EMI,₹${formatCurrency(emi)}\n`;
    csvContent += `Total Interest,₹${formatCurrency(totalInterest)}\n\n`;
    
    csvContent += "Month,Principal,Interest,Total Payment,Balance,Loan Paid %\n";
    
    const tableRows = document.querySelectorAll('#amortizationTableBody .month-row');
    tableRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 6) {
            csvContent += `${cells[0].textContent},${cells[1].textContent},${cells[2].textContent},${cells[3].textContent},${cells[4].textContent},${cells[5].textContent}\n`;
        }
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "mobile_phone_emi_calculation.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Excel file downloaded successfully!', 'success');
}

function shareLink() {
    const phonePrice = document.getElementById('phonePrice').value;
    const downPayment = document.getElementById('downPayment').value;
    const tenureMonths = document.getElementById('tenureValue').value;
    const interestRate = document.getElementById('interestRate').value;
    
    const shareUrl = `${window.location.origin}/mobile-phone-emi-calculator/?phonePrice=${phonePrice}&downPayment=${downPayment}&tenure=${tenureMonths}&interestRate=${interestRate}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Mobile Phone EMI Calculator',
            text: 'Check out this mobile phone EMI calculation',
            url: shareUrl
        }).then(() => {
            showNotification('Shared successfully!', 'success');
        }).catch(err => {
            console.log('Error sharing:', err);
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
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#38a169' : '#e53e3e'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 1000;
        font-weight: 500;
        transition: all 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function generatePrintableContent() {
    const phonePrice = parseFloat(document.getElementById('phonePrice').value) || 0;
    const downPayment = parseFloat(document.getElementById('downPayment').value) || 0;
    const tenureMonths = parseFloat(document.getElementById('tenureValue').value) || 6;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 18;
    const loanAmount = phonePrice - downPayment;
    
    // Calculate EMI and interest
    const monthlyRate = interestRate / (12 * 100);
    let emi, totalInterest;
    
    if (monthlyRate === 0) {
        emi = loanAmount / tenureMonths;
        totalInterest = 0;
    } else {
        emi = loanAmount * monthlyRate * ((1 + monthlyRate) ** tenureMonths) / (((1 + monthlyRate) ** tenureMonths) - 1);
        totalInterest = (emi * tenureMonths) - loanAmount;
    }
    
    return `
        <div class="header">
            <h1>Mobile Phone EMI Calculator Results</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="results">
            <h2>Calculation Summary</h2>
            <div class="result-item"><strong>Phone Price:</strong> ₹${formatCurrency(phonePrice)}</div>
            <div class="result-item"><strong>Down Payment:</strong> ₹${formatCurrency(downPayment)}</div>
            <div class="result-item"><strong>Loan Amount:</strong> ₹${formatCurrency(loanAmount)}</div>
            <div class="result-item"><strong>Interest Rate:</strong> ${interestRate}%</div>
            <div class="result-item"><strong>Tenure:</strong> ${tenureMonths} months</div>
            <div class="result-item"><strong>Monthly EMI:</strong> ₹${formatCurrency(emi)}</div>
            <div class="result-item"><strong>Total Interest:</strong> ₹${formatCurrency(totalInterest)}</div>
        </div>
        
        ${generateAmortizationTableHTML()}
    `;
}

function generateAmortizationTableHTML() {
    const tableRows = document.querySelectorAll('#amortizationTableBody tr');
    let tableHTML = `
        <h2>Payment Schedule</h2>
        <table>
            <thead>
                <tr>
                    <th>Month</th>
                    <th>Principal</th>
                    <th>Interest</th>
                    <th>Total Payment</th>
                    <th>Balance</th>
                    <th>Loan Paid %</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    tableRows.forEach(row => {
        if (row.classList.contains('month-row')) {
            const cells = row.querySelectorAll('td');
            tableHTML += '<tr>';
            cells.forEach(cell => {
                tableHTML += `<td>${cell.textContent}</td>`;
            });
            tableHTML += '</tr>';
        }
    });
    
    tableHTML += '</tbody></table>';
    return tableHTML;
}

function loadFromUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    const phonePrice = urlParams.get('phonePrice');
    const downPayment = urlParams.get('downPayment');
    const tenure = urlParams.get('tenure');
    const interestRate = urlParams.get('interestRate');
    
    if (phonePrice) {
        document.getElementById('phonePrice').value = phonePrice;
        document.getElementById('phonePriceSlider').value = phonePrice;
    }
    
    if (downPayment) {
        document.getElementById('downPayment').value = downPayment;
        document.getElementById('downPaymentSlider').value = downPayment;
    }
    
    if (tenure) {
        document.getElementById('tenureValue').value = tenure;
        document.getElementById('tenureSlider').value = tenure;
    }
    
    if (interestRate) {
        document.getElementById('interestRate').value = interestRate;
        document.getElementById('interestRateSlider').value = interestRate;
    }
    
    updateDownPaymentMax();
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
