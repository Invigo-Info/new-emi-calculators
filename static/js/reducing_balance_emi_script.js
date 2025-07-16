// Global variables
let loanChart;
let balanceChart;

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
    
    // Track to prevent circular updates
    let isUpdatingFromSlider = false;
    let isUpdatingFromInput = false;
    
    inputs.forEach(({ input, slider, min = 0, max }) => {
        const inputElement = document.getElementById(input);
        const sliderElement = document.getElementById(slider);
        
        if (inputElement && sliderElement) {
            // Sync input to slider
            inputElement.addEventListener('input', function() {
                if (isUpdatingFromSlider) return; // Prevent circular updates
                
                isUpdatingFromInput = true;
                const value = Math.max(Math.min(parseFloat(this.value) || min, max), min);
                sliderElement.value = value;
                isUpdatingFromInput = false;
                
                calculateAndUpdate();
            });
            
            // Sync slider to input  
            sliderElement.addEventListener('input', function() {
                if (isUpdatingFromInput) return; // Prevent circular updates
                
                isUpdatingFromSlider = true;
                inputElement.value = this.value;
                isUpdatingFromSlider = false;
                
                calculateAndUpdate();
            });
            
            // Add change event for when user finishes typing
            inputElement.addEventListener('change', function() {
                if (isUpdatingFromSlider) return;
                
                const value = Math.max(Math.min(parseFloat(this.value) || min, max), min);
                this.value = value;
                sliderElement.value = value;
                calculateAndUpdate();
            });
        }
    });
}

// Add throttling to prevent rapid successive calls
let calculationTimeout;
let isCalculating = false;

function calculateAndUpdate() {
    // Prevent multiple simultaneous calculations
    if (isCalculating) {
        return;
    }
    
    // Clear any pending calculation
    if (calculationTimeout) {
        clearTimeout(calculationTimeout);
    }
    
    // Throttle calculations to prevent rapid successive calls
    calculationTimeout = setTimeout(() => {
        performCalculation();
    }, 300);
}

function performCalculation() {
    isCalculating = true;
    
    try {
        const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 1000000;
        const interestRate = parseFloat(document.getElementById('interestRate').value) || 12.0;
        const tenureYears = parseInt(document.getElementById('tenureYears').value) || 15;
        
        // Validate input ranges
        if (loanAmount < 1000 || loanAmount > 50000000) {
            console.error('Invalid loan amount');
            isCalculating = false;
            return;
        }
        
        if (interestRate < 0.1 || interestRate > 36) {
            console.error('Invalid interest rate');
            isCalculating = false;
            return;
        }
        
        if (tenureYears < 1 || tenureYears > 30) {
            console.error('Invalid tenure');
            isCalculating = false;
            return;
        }
        
        // Make API call
        fetch('/calculate-reducing-balance-emi', {
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
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                updateResults(data);
                updateCharts(data);
                updateBalanceReductionTable(data.balanceSchedule);
            } else {
                console.error('Calculation error:', data.error);
                showNotification('Calculation error: ' + (data.error || 'Unknown error'), 'error');
            }
        })
        .catch(error => {
            console.error('Network error:', error);
            showNotification('Network error: Unable to calculate EMI', 'error');
        })
        .finally(() => {
            isCalculating = false;
        });
        
    } catch (error) {
        console.error('Calculation error:', error);
        showNotification('Error: ' + error.message, 'error');
        isCalculating = false;
    }
}

function updateResults(data) {
    // Update result cards
    document.getElementById('emiResult').textContent = formatCurrency(data.emi);
    document.getElementById('totalInterestResult').textContent = formatCurrency(data.totalInterest);
    document.getElementById('totalAmountResult').textContent = formatCurrency(data.totalAmount);
    document.getElementById('principalAmountResult').textContent = formatCurrency(data.principalAmount);

    // Update chart summary
    document.getElementById('principalDisplay').textContent = formatCurrency(data.principalAmount);
    document.getElementById('interestDisplay').textContent = formatCurrency(data.totalInterest);
}

function updateCharts(data) {
    updateLoanChart(data);
    updateBalanceChart(data);
}

function updateLoanChart(data) {
    const ctx = document.getElementById('loanChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (loanChart) {
        loanChart.destroy();
    }

    const chartData = [data.principalAmount, data.totalInterest];
    const chartLabels = ['Principal Amount', 'Interest Amount'];
    const chartColors = ['#4facfe', '#f59e0b'];
    
    loanChart = new Chart(ctx, {
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

function updateBalanceChart(data) {
    // Add proper error handling to prevent infinite loops
    try {
        const ctx = document.getElementById('balanceChart');
        if (!ctx) {
            console.error('Balance chart canvas not found');
            return;
        }
        
        const chartContext = ctx.getContext('2d');
        
        // Destroy existing chart if it exists
        if (balanceChart) {
            balanceChart.destroy();
            balanceChart = null;
        }

        // Validate data structure
        if (!data || !data.balanceSchedule || !Array.isArray(data.balanceSchedule) || data.balanceSchedule.length === 0) {
            console.error('Invalid balance schedule data');
            return;
        }

        // Prepare data for balance reduction chart with proper validation
        const years = data.balanceSchedule.map(item => item.year || 'Unknown');
        const balances = data.balanceSchedule.map(item => parseFloat(item.closingBalance) || 0);
        
        // Add starting balance (opening balance of first year)
        const startingBalance = data.balanceSchedule.length > 0 ? (parseFloat(data.balanceSchedule[0].openingBalance) || 0) : 0;
        const chartYears = ['Start', ...years];
        const chartBalances = [startingBalance, ...balances];
        
        // Validate chart data
        if (chartBalances.some(val => isNaN(val) || val < 0)) {
            console.error('Invalid chart data values');
            return;
        }
        
        balanceChart = new Chart(chartContext, {
            type: 'line',
            data: {
                labels: chartYears,
                datasets: [{
                    label: 'Outstanding Balance',
                    data: chartBalances,
                    borderColor: '#16a085',
                    backgroundColor: 'rgba(22, 160, 133, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#16a085',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y;
                                if (isNaN(value)) return 'Invalid data';
                                return `Outstanding Balance: ${formatCurrency(value)}`;
                            }
                        },
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#ffffff',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                if (isNaN(value)) return '';
                                return formatCurrencyShort(value);
                            },
                            maxTicksLimit: 10
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            maxTicksLimit: 15
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                },
                onResize: function() {
                    // Prevent recursive resize calls
                    clearTimeout(this.resizeTimeout);
                    this.resizeTimeout = setTimeout(() => {
                        if (this.chart && !this.chart.destroyed) {
                            this.chart.resize();
                        }
                    }, 100);
                }
            }
        });
        
    } catch (error) {
        console.error('Error creating balance chart:', error);
        // Fallback: show a simple message
        const ctx = document.getElementById('balanceChart');
        if (ctx) {
            const chartContext = ctx.getContext('2d');
            chartContext.clearRect(0, 0, ctx.width, ctx.height);
            chartContext.fillStyle = '#666';
            chartContext.font = '14px Arial';
            chartContext.textAlign = 'center';
            chartContext.fillText('Chart data unavailable', ctx.width / 2, ctx.height / 2);
        }
    }
}

function updateBalanceReductionTable(balanceSchedule) {
    const tableBody = document.getElementById('balanceReductionTableBody');
    tableBody.innerHTML = '';
    
    balanceSchedule.forEach((yearData, index) => {
        const row = document.createElement('tr');
        row.classList.add('year-row');
        row.setAttribute('data-year', yearData.year);
        row.setAttribute('data-expanded', 'false');
        
        // Add click handler for expandable rows
        row.style.cursor = 'pointer';
        row.addEventListener('click', () => toggleMonthlyData(yearData, index));
        
        row.innerHTML = `
            <td class="year-cell">
                <span class="expand-icon">▶</span>
                ${yearData.year}
            </td>
            <td>${formatCurrency(yearData.openingBalance)}</td>
            <td>${formatCurrency(yearData.emiPaid)}</td>
            <td>${formatCurrency(yearData.principalPaid)}</td>
            <td>${formatCurrency(yearData.interestPaid)}</td>
            <td>${formatCurrency(yearData.closingBalance)}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

function toggleMonthlyData(yearData, yearIndex) {
    const yearRow = document.querySelector(`tr[data-year="${yearData.year}"]`);
    const isExpanded = yearRow.getAttribute('data-expanded') === 'true';
    const expandIcon = yearRow.querySelector('.expand-icon');
    
    if (isExpanded) {
        // Collapse - remove monthly rows
        collapseMonthlyData(yearData.year);
        yearRow.setAttribute('data-expanded', 'false');
        expandIcon.textContent = '▶';
        yearRow.classList.remove('expanded');
    } else {
        // Expand - add monthly rows
        expandMonthlyData(yearData, yearIndex);
        yearRow.setAttribute('data-expanded', 'true');
        expandIcon.textContent = '▼';
        yearRow.classList.add('expanded');
    }
}

function expandMonthlyData(yearData, yearIndex) {
    const tableBody = document.getElementById('balanceReductionTableBody');
    const yearRow = document.querySelector(`tr[data-year="${yearData.year}"]`);
    
    // Create monthly data rows
    if (yearData.monthly_data && yearData.monthly_data.length > 0) {
        let lastInsertedRow = yearRow; // Keep track of the last inserted row
        
        yearData.monthly_data.forEach((monthData, monthIndex) => {
            const monthRow = document.createElement('tr');
            monthRow.classList.add('month-row');
            monthRow.setAttribute('data-parent-year', yearData.year);
            
            monthRow.innerHTML = `
                <td class="month-cell">
                    <span class="month-indent">└─</span>
                    ${monthData.month}
                </td>
                <td>${formatCurrency(monthData.openingBalance || 0)}</td>
                <td>${formatCurrency(monthData.emi)}</td>
                <td>${formatCurrency(monthData.principal)}</td>
                <td>${formatCurrency(monthData.interest)}</td>
                <td>${formatCurrency(monthData.balance)}</td>
            `;
            
            // Insert after the last inserted row to maintain chronological order
            const nextSibling = lastInsertedRow.nextElementSibling;
            if (nextSibling) {
                tableBody.insertBefore(monthRow, nextSibling);
            } else {
                tableBody.appendChild(monthRow);
            }
            
            // Update the last inserted row reference
            lastInsertedRow = monthRow;
        });
    }
}

function collapseMonthlyData(year) {
    const monthRows = document.querySelectorAll(`tr[data-parent-year="${year}"]`);
    monthRows.forEach(row => row.remove());
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
    }
}

function setupDownloadButtons() {
    // Set up PDF download button
    const pdfBtn = document.querySelector('.pdf-btn');
    if (pdfBtn) {
        pdfBtn.addEventListener('click', function(e) {
            e.preventDefault();
            downloadPDF();
        });
    }
    
    // Set up Excel download button
    const excelBtn = document.querySelector('.excel-btn');
    if (excelBtn) {
        excelBtn.addEventListener('click', function(e) {
            e.preventDefault();
            downloadExcel();
        });
    }
    
    // Set up Share button
    const shareBtn = document.querySelector('.share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', function(e) {
            e.preventDefault();
            shareLink();
        });
    }
}

function downloadPDF() {
    // Check if jsPDF is available
    if (typeof window.jspdf === 'undefined') {
        console.error('jsPDF library not loaded');
        showNotification('PDF generation not available. Please refresh the page and try again.', 'error');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Get current values
        const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 1000000;
        const interestRate = parseFloat(document.getElementById('interestRate').value) || 12.0;
        const tenureYears = parseInt(document.getElementById('tenureYears').value) || 15;
        
        // Get results (remove currency symbols for clean display)
        const emi = document.getElementById('emiResult').textContent;
        const totalInterest = document.getElementById('totalInterestResult').textContent;
        const totalAmount = document.getElementById('totalAmountResult').textContent;
        const principalAmount = document.getElementById('principalAmountResult').textContent;
        
        // Set up the PDF
        doc.setFont('helvetica');
        
        // Add title
        doc.setFontSize(22);
        doc.setTextColor(40, 40, 40);
        doc.text('Reducing Balance EMI Calculator Report', 20, 25);
        
        // Add a line under title
        doc.setLineWidth(0.5);
        doc.setDrawColor(100, 100, 100);
        doc.line(20, 30, 190, 30);
        
        // Add input details section
        doc.setFontSize(16);
        doc.setTextColor(50, 50, 50);
        doc.text('Loan Details:', 20, 45);
        
        doc.setFontSize(12);
        doc.setTextColor(70, 70, 70);
        doc.text(`Principal Loan Amount: ${formatCurrency(loanAmount)}`, 25, 55);
        doc.text(`Annual Interest Rate: ${interestRate}%`, 25, 65);
        doc.text(`Loan Tenure: ${tenureYears} years (${tenureYears * 12} months)`, 25, 75);
        
        // Add results section
        doc.setFontSize(16);
        doc.setTextColor(50, 50, 50);
        doc.text('Calculation Results:', 20, 95);
        
        doc.setFontSize(12);
        doc.setTextColor(70, 70, 70);
        doc.text(`Monthly EMI: ${emi}`, 25, 105);
        doc.text(`Total Interest Payable: ${totalInterest}`, 25, 115);
        doc.text(`Total Amount Payable: ${totalAmount}`, 25, 125);
        doc.text(`Principal Amount: ${principalAmount}`, 25, 135);
        
        // Add breakdown section
        doc.setFontSize(16);
        doc.setTextColor(50, 50, 50);
        doc.text('Key Information:', 20, 155);
        
        doc.setFontSize(11);
        doc.setTextColor(80, 80, 80);
        doc.text('• This calculator uses the reducing balance method where interest is', 25, 165);
        doc.text('  calculated on the outstanding loan balance.', 25, 173);
        doc.text('• EMI remains constant throughout the loan tenure.', 25, 183);
        doc.text('• Early payments go more toward interest, later payments toward principal.', 25, 193);
        doc.text('• The outstanding balance reduces with each payment.', 25, 203);
        
        // Add footer
        doc.setFontSize(10);
        doc.setTextColor(120, 120, 120);
        const currentDate = new Date().toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        doc.text(`Generated on: ${currentDate}`, 20, 270);
        doc.text('This is a computer-generated report for estimation purposes only.', 20, 280);
        
        // Save the PDF
        doc.save('reducing-balance-emi-calculation.pdf');
        showNotification('PDF downloaded successfully!', 'success');
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        showNotification('Error generating PDF: ' + error.message, 'error');
    }
}

function downloadExcel() {
    try {
        // Get balance schedule data
        const balanceSchedule = [];
        const rows = document.querySelectorAll('.balance-reduction-table tbody tr.year-row');
        
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 6) {
                balanceSchedule.push({
                    'Year': cells[0].textContent.replace('▶', '').replace('▼', '').trim(),
                    'Opening Balance': cells[1].textContent,
                    'EMI Paid': cells[2].textContent,
                    'Principal Paid': cells[3].textContent,
                    'Interest Paid': cells[4].textContent,
                    'Closing Balance': cells[5].textContent
                });
            }
        });
        
        // Convert to CSV format
        const headers = Object.keys(balanceSchedule[0] || {});
        const csvContent = [
            headers.join(','),
            ...balanceSchedule.map(row => headers.map(header => `"${row[header]}"`).join(','))
        ].join('\n');
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'reducing-balance-emi-schedule.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('Excel file downloaded successfully!', 'success');
        
    } catch (error) {
        console.error('Error generating Excel:', error);
        showNotification('Error generating Excel file', 'error');
    }
}

function shareLink() {
    const loanAmount = document.getElementById('loanAmount').value;
    const interestRate = document.getElementById('interestRate').value;
    const tenureYears = document.getElementById('tenureYears').value;
    
    const url = new URL(window.location.href);
    url.searchParams.set('amount', loanAmount);
    url.searchParams.set('rate', interestRate);
    url.searchParams.set('tenure', tenureYears);
    
    const shareUrl = url.toString();
    
    if (navigator.share) {
        navigator.share({
            title: 'Reducing Balance EMI Calculator',
            text: `Check out my EMI calculation: EMI ${document.getElementById('emiResult').textContent} for ${formatCurrency(loanAmount)} loan`,
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
            showNotification('Failed to copy link', 'error');
        }
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
        showNotification('Failed to copy link', 'error');
    }
    
    document.body.removeChild(textArea);
}

function showNotification(message, type = 'success') {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function loadFromUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    const amount = urlParams.get('amount');
    const rate = urlParams.get('rate');
    const tenure = urlParams.get('tenure');
    
    if (amount) {
        document.getElementById('loanAmount').value = amount;
        document.getElementById('loanAmountSlider').value = amount;
    }
    
    if (rate) {
        document.getElementById('interestRate').value = rate;
        document.getElementById('interestRateSlider').value = rate;
    }
    
    if (tenure) {
        document.getElementById('tenureYears').value = tenure;
        document.getElementById('tenureYearsSlider').value = tenure;
    }
}

function formatCurrency(amount) {
    const formatter = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
    return formatter.format(amount);
}

function formatCurrencyShort(amount) {
    if (amount >= 10000000) {
        return `₹${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
        return `₹${(amount / 1000).toFixed(1)}K`;
    } else {
        return `₹${amount}`;
    }
} 