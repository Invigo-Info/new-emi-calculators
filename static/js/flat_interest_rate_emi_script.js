// Global variables
let flatEmiChart;

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
        { input: 'loanAmount', slider: 'loanAmountSlider', min: 1000, max: 50000000 },
        { input: 'interestRate', slider: 'interestRateSlider', min: 0.1, max: 36 },
        { input: 'tenureYears', slider: 'tenureYearsSlider', min: 1, max: 30 }
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
    const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 500000;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 12.0;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 5;
    
    // Make API call
    fetch('/calculate-flat-interest-rate-emi', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            loanAmount: loanAmount,
            interestRate: interestRate,
            tenureYears: tenureYears
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
    // Update main result cards
    document.getElementById('flatEmiResult').textContent = formatCurrency(data.flatEmi);
    document.getElementById('totalInterestResult').textContent = formatCurrency(data.totalInterest);
    document.getElementById('totalAmountResult').textContent = formatCurrency(data.totalAmount);
    document.getElementById('effectiveRateResult').textContent = data.effectiveRate.toFixed(2) + '%';

    // Update chart summary
    document.getElementById('principalDisplay').textContent = formatCurrency(data.loanAmount);
    document.getElementById('interestDisplay').textContent = formatCurrency(data.totalInterest);
}

function updateChart(data) {
    const ctx = document.getElementById('flatEmiChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (flatEmiChart) {
        flatEmiChart.destroy();
    }

    const chartData = [data.loanAmount, data.totalInterest];
    const chartLabels = ['Principal Amount', 'Interest Amount'];
    const chartColors = ['#4facfe', '#43e97b'];
    
    flatEmiChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: chartLabels,
            datasets: [{
                data: chartData,
                backgroundColor: chartColors,
                borderColor: ['#ffffff', '#ffffff'],
                borderWidth: 2,
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
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    },
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#ffffff',
                    borderWidth: 1
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1000
            }
        }
    });
}

function updateYearlyBreakdownTable(yearlyBreakdown) {
    const tbody = document.getElementById('amortizationTableBody');
    tbody.innerHTML = '';

    yearlyBreakdown.forEach((yearData, yearIndex) => {
        // Create year row
        const yearRow = document.createElement('tr');
        yearRow.className = 'year-row';
        yearRow.dataset.year = yearData.year;
        yearRow.innerHTML = `
            <td class="year-cell">
                <span class="expand-icon">▶</span>
                ${yearData.year}
            </td>
            <td class="amount-cell">${formatCurrency(yearData.total_payment)}</td>
            <td class="amount-cell">${formatCurrency(yearData.principal)}</td>
            <td class="amount-cell">${formatCurrency(yearData.interest)}</td>
            <td class="balance-cell">${formatCurrency(yearData.balance)}</td>
            <td class="percentage-cell">${yearData.loan_paid_percentage.toFixed(1)}%</td>
        `;
        
        // Add click event to year row for expansion
        yearRow.addEventListener('click', function() {
            toggleYearExpansion(yearData.year);
        });
        
        tbody.appendChild(yearRow);
        
        // Create monthly rows (initially hidden)
        yearData.monthly_data.forEach((monthData, monthIndex) => {
            const monthRow = document.createElement('tr');
            monthRow.className = 'month-row';
            monthRow.dataset.year = yearData.year;
            monthRow.style.display = 'none';
            monthRow.innerHTML = `
                <td class="month-cell">&nbsp;&nbsp;&nbsp;&nbsp;${monthData.month}</td>
                <td class="amount-cell">${formatCurrency(monthData.total_payment)}</td>
                <td class="amount-cell">${formatCurrency(monthData.principal)}</td>
                <td class="amount-cell">${formatCurrency(monthData.interest)}</td>
                <td class="balance-cell">${formatCurrency(monthData.balance)}</td>
                <td class="percentage-cell">${monthData.loan_paid_percentage.toFixed(1)}%</td>
            `;
            tbody.appendChild(monthRow);
        });
    });
}

function toggleYearExpansion(year) {
    const yearRow = document.querySelector(`.year-row[data-year="${year}"]`);
    const monthRows = document.querySelectorAll(`.month-row[data-year="${year}"]`);
    const expandIcon = yearRow.querySelector('.expand-icon');
    
    const isExpanded = expandIcon.textContent === '▼';
    
    if (isExpanded) {
        // Collapse
        expandIcon.textContent = '▶';
        monthRows.forEach(row => {
            row.style.display = 'none';
        });
    } else {
        // Expand
        expandIcon.textContent = '▼';
        monthRows.forEach(row => {
            row.style.display = 'table-row';
        });
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
        const megaLinks = document.querySelectorAll('.mega-link');
        megaLinks.forEach(link => {
            link.addEventListener('click', function() {
                megaMenu.classList.remove('open');
            });
        });
    }
}

function setupDownloadButtons() {
    // Download buttons are already set up with onclick handlers in HTML
}

function downloadPDF() {
    const { jsPDF } = window.jsPDF || {};
    if (!jsPDF) {
        showNotification('PDF library not loaded. Please try again.', 'error');
        return;
    }

    try {
        const doc = new jsPDF();
        const content = generatePrintableContent();
        
        // Add title
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text('Flat Interest Rate EMI Calculator', 20, 30);
        
        // Add content
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        let yPosition = 50;
        
        content.forEach(line => {
            if (yPosition > 270) {
                doc.addPage();
                yPosition = 30;
            }
            doc.text(line, 20, yPosition);
            yPosition += 8;
        });
        
        // Save the PDF
        doc.save('flat-interest-emi-calculation.pdf');
        showNotification('PDF downloaded successfully!', 'success');
    } catch (error) {
        console.error('PDF generation error:', error);
        showNotification('Error generating PDF. Please try again.', 'error');
    }
}

function downloadExcel() {
    try {
        const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 500000;
        const interestRate = parseFloat(document.getElementById('interestRate').value) || 12.0;
        const tenureYears = parseInt(document.getElementById('tenureYears').value) || 5;
        
        // Get amortization data
        const schedule = [];
        const tbody = document.getElementById('amortizationTableBody');
        const rows = tbody.querySelectorAll('tr');
        
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            schedule.push({
                'Period': cells[0].textContent,
                'EMI Amount': cells[1].textContent,
                'Principal': cells[2].textContent,
                'Interest': cells[3].textContent,
                'Outstanding Balance': cells[4].textContent
            });
        });
        
        // Create workbook
        const ws = XLSX.utils.json_to_sheet(schedule);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'EMI Schedule');
        
        // Add summary sheet
        const summaryData = [
            ['Loan Amount', formatCurrency(loanAmount)],
            ['Interest Rate', interestRate + '%'],
            ['Tenure', tenureYears + ' years'],
            ['EMI Amount', document.getElementById('flatEmiResult').textContent],
            ['Total Interest', document.getElementById('totalInterestResult').textContent],
            ['Total Amount', document.getElementById('totalAmountResult').textContent],
            ['Effective Interest Rate', document.getElementById('effectiveRateResult').textContent]
        ];
        
        const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
        
        // Save file
        XLSX.writeFile(wb, 'flat-interest-emi-calculation.xlsx');
        showNotification('Excel file downloaded successfully!', 'success');
    } catch (error) {
        console.error('Excel generation error:', error);
        showNotification('Excel library not loaded. Please try again.', 'error');
    }
}

function generatePrintableContent() {
    const loanAmount = document.getElementById('loanAmount').value;
    const interestRate = document.getElementById('interestRate').value;
    const tenureYears = document.getElementById('tenureYears').value;
    
    const flatEmi = document.getElementById('flatEmiResult').textContent;
    const totalInterest = document.getElementById('totalInterestResult').textContent;
    const totalAmount = document.getElementById('totalAmountResult').textContent;
    const effectiveRate = document.getElementById('effectiveRateResult').textContent;
    
    return [
        `Generated on: ${new Date().toLocaleDateString()}`,
        '',
        'LOAN DETAILS:',
        `Loan Amount: ₹${Number(loanAmount).toLocaleString('en-IN')}`,
        `Flat Interest Rate: ${interestRate}% per annum`,
        `Tenure: ${tenureYears} years`,
        '',
        'CALCULATION RESULTS:',
        `Monthly EMI: ${flatEmi}`,
        `Total Interest: ${totalInterest}`,
        `Total Amount: ${totalAmount}`,
        `Effective Interest Rate: ${effectiveRate}`,
        '',
        'PAYMENT SCHEDULE:',
        '(See attached table for detailed breakdown)'
    ];
}

function shareLink() {
    const params = new URLSearchParams({
        loanAmount: document.getElementById('loanAmount').value,
        interestRate: document.getElementById('interestRate').value,
        tenureYears: document.getElementById('tenureYears').value
    });
    
    const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Flat Interest Rate EMI Calculator',
            text: 'Check out this EMI calculation',
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
            showNotification('Link copied to clipboard!', 'success');
        } else {
            showNotification('Failed to copy link. Please copy manually.', 'error');
        }
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
        showNotification('Failed to copy link. Please copy manually.', 'error');
    }
    
    document.body.removeChild(textArea);
}

function showNotification(message, type) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
        notification.remove();
    });
    
    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

function loadFromUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    const paramMappings = [
        { param: 'loanAmount', element: 'loanAmount', slider: 'loanAmountSlider' },
        { param: 'interestRate', element: 'interestRate', slider: 'interestRateSlider' },
        { param: 'tenureYears', element: 'tenureYears', slider: 'tenureYearsSlider' }
    ];
    
    paramMappings.forEach(({ param, element, slider }) => {
        const value = urlParams.get(param);
        const elementNode = document.getElementById(element);
        
        if (value && elementNode) {
            elementNode.value = value;
            if (slider) {
                const sliderNode = document.getElementById(slider);
                if (sliderNode) {
                    sliderNode.value = value;
                }
            }
        }
    });
}

function formatCurrency(amount) {
    // Round the amount to avoid decimal places for display
    const roundedAmount = Math.round(amount);
    
    // Format using Indian number system
    const formatted = roundedAmount.toLocaleString('en-IN');
    
    return '₹' + formatted;
} 