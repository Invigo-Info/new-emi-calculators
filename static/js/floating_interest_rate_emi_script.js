// Global variables
let loanChart;
let balanceChart;
let rateImpactChart;

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
        { input: 'initialRate', slider: 'initialRateSlider', min: 0.1, max: 36 },
        { input: 'revisedRate', slider: 'revisedRateSlider', min: 0.1, max: 36 },
        { input: 'transitionYear', slider: 'transitionYearSlider', min: 1, max: 30 },
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
                
                // Update transition year slider max based on tenure
                if (input === 'tenureYears') {
                    const transitionYearSlider = document.getElementById('transitionYearSlider');
                    const transitionYearInput = document.getElementById('transitionYear');
                    transitionYearSlider.max = value;
                    if (parseInt(transitionYearInput.value) > value) {
                        transitionYearInput.value = value;
                        transitionYearSlider.value = value;
                    }
                }
                
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
                
                // Update transition year slider max based on tenure
                if (input === 'tenureYears') {
                    const transitionYearSlider = document.getElementById('transitionYearSlider');
                    const transitionYearInput = document.getElementById('transitionYear');
                    transitionYearSlider.max = value;
                    if (parseInt(transitionYearInput.value) > value) {
                        transitionYearInput.value = value;
                        transitionYearSlider.value = value;
                    }
                }
                
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
        const initialRate = parseFloat(document.getElementById('initialRate').value) || 10.0;
        const revisedRate = parseFloat(document.getElementById('revisedRate').value) || 12.0;
        const transitionYear = parseInt(document.getElementById('transitionYear').value) || 3;
        const tenureYears = parseInt(document.getElementById('tenureYears').value) || 15;
        
        // Validate input ranges
        if (loanAmount < 1000 || loanAmount > 50000000) {
            console.error('Invalid loan amount');
            isCalculating = false;
            return;
        }
        
        if (initialRate < 0.1 || initialRate > 36) {
            console.error('Invalid initial interest rate');
            isCalculating = false;
            return;
        }
        
        if (revisedRate < 0.1 || revisedRate > 36) {
            console.error('Invalid revised interest rate');
            isCalculating = false;
            return;
        }
        
        if (transitionYear < 1 || transitionYear > tenureYears) {
            console.error('Invalid transition year');
            isCalculating = false;
            return;
        }
        
        if (tenureYears < 1 || tenureYears > 30) {
            console.error('Invalid tenure');
            isCalculating = false;
            return;
        }
        
        // Make API call
        fetch('/calculate-floating-interest-rate-emi', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                loanAmount: loanAmount,
                initialRate: initialRate,
                revisedRate: revisedRate,
                transitionYear: transitionYear,
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
    document.getElementById('initialEmiResult').textContent = formatCurrency(data.initial_emi);
    document.getElementById('revisedEmiResult').textContent = formatCurrency(data.revised_emi);
    document.getElementById('totalInterestResult').textContent = formatCurrency(data.total_interest);
    document.getElementById('totalAmountResult').textContent = formatCurrency(data.total_amount);
    document.getElementById('principalAmountResult').textContent = formatCurrency(data.principal);
    document.getElementById('outstandingResult').textContent = formatCurrency(data.outstanding_at_transition);

    // Update chart summary
    document.getElementById('principalDisplay').textContent = formatCurrency(data.principal);
    document.getElementById('interestDisplay').textContent = formatCurrency(data.total_interest);
}

function updateCharts(data) {
    updateLoanChart(data);
    updateBalanceChart(data);
    updateRateImpactChart(data);
}

function updateLoanChart(data) {
    const ctx = document.getElementById('loanChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (loanChart) {
        loanChart.destroy();
    }

    const chartData = [data.principal, data.total_interest];
    const chartLabels = ['Principal Amount', 'Interest Amount'];
    const chartColors = ['#14B8A6', '#F59E0B'];
    
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

function updateRateImpactChart(data) {
    const ctx = document.getElementById('rateImpactChart');
    if (!ctx) {
        console.error('Rate impact chart canvas not found');
        return;
    }
    
    const chartContext = ctx.getContext('2d');
    
    // Destroy existing chart if it exists
    if (rateImpactChart) {
        rateImpactChart.destroy();
        rateImpactChart = null;
    }

    // Create data for rate impact visualization
    const years = [];
    const initialRateData = [];
    const revisedRateData = [];
    const emiData = [];
    
    for (let year = 1; year <= data.tenure_years; year++) {
        years.push(`Year ${year}`);
        
        if (year <= data.transition_year) {
            initialRateData.push(data.initial_rate);
            revisedRateData.push(null);
            emiData.push(data.initial_emi);
        } else {
            initialRateData.push(null);
            revisedRateData.push(data.revised_rate);
            emiData.push(data.revised_emi);
        }
    }
    
    rateImpactChart = new Chart(chartContext, {
        type: 'line',
        data: {
            labels: years,
            datasets: [
                {
                    label: 'Initial Rate (%)',
                    data: initialRateData,
                    borderColor: '#4facfe',
                    backgroundColor: 'rgba(79, 172, 254, 0.1)',
                    borderWidth: 3,
                    pointRadius: 5,
                    pointBackgroundColor: '#4facfe',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    tension: 0.4,
                    spanGaps: false
                },
                {
                    label: 'Revised Rate (%)',
                    data: revisedRateData,
                    borderColor: '#fa709a',
                    backgroundColor: 'rgba(250, 112, 154, 0.1)',
                    borderWidth: 3,
                    pointRadius: 5,
                    pointBackgroundColor: '#fa709a',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    tension: 0.4,
                    spanGaps: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Interest Rate Changes Over Time',
                    font: {
                        size: 16,
                        weight: 'bold'
                    },
                    color: '#2d3748'
                },
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            size: 12,
                            weight: '500'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#ffffff',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            if (context.parsed.y !== null) {
                                return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}%`;
                            }
                            return null;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: '#4a5568',
                        font: {
                            size: 11
                        }
                    }
                },
                y: {
                    beginAtZero: false,
                    grid: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: '#4a5568',
                        font: {
                            size: 11
                        },
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Interest Rate (%)',
                        color: '#4a5568',
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    }
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeInOutQuart'
            }
        }
    });
}

function updateBalanceChart(data) {
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

        // Prepare data for chart
        const years = data.balanceSchedule.map(item => `Year ${item.year}`);
        const balances = data.balanceSchedule.map(item => item.balance);
        
        // Create gradient
        const gradient = chartContext.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(79, 172, 254, 0.3)');
        gradient.addColorStop(1, 'rgba(79, 172, 254, 0.05)');
        
        balanceChart = new Chart(chartContext, {
            type: 'line',
            data: {
                labels: years,
                datasets: [{
                    label: 'Outstanding Balance',
                    data: balances,
                    borderColor: '#4facfe',
                    backgroundColor: gradient,
                    borderWidth: 3,
                    pointRadius: 6,
                    pointBackgroundColor: '#4facfe',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    tension: 0.4,
                    fill: true
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
                    title: {
                        display: true,
                        text: 'Outstanding Balance Reduction',
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        color: '#2d3748'
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#ffffff',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                return `Outstanding Balance: ${formatCurrency(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            color: '#4a5568',
                            font: {
                                size: 11
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            color: '#4a5568',
                            font: {
                                size: 11
                            },
                            callback: function(value) {
                                return formatCurrencyShort(value);
                            }
                        },
                        title: {
                            display: true,
                            text: 'Outstanding Balance (₹)',
                            color: '#4a5568',
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        }
                    }
                },
                animation: {
                    duration: 1500,
                    easing: 'easeInOutQuart'
                }
            }
        });
    } catch (error) {
        console.error('Error updating balance chart:', error);
    }
}

function updateBalanceReductionTable(balanceSchedule) {
    const tbody = document.getElementById('balanceReductionTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    balanceSchedule.forEach((yearData, yearIndex) => {
        // Create year row
        const yearRow = document.createElement('tr');
        yearRow.className = 'year-row';
        yearRow.innerHTML = `
            <td class="year-cell">
                <span class="expand-icon">▶</span>
                <strong>${yearData.year}</strong>
            </td>
            <td>${formatCurrency(yearData.balance + yearData.principal)}</td>
            <td>${formatCurrency(yearData.total_payment)}</td>
            <td>${formatCurrency(yearData.principal)}</td>
            <td>${formatCurrency(yearData.interest)}</td>
            <td>${formatCurrency(yearData.balance)}</td>
            <td>${yearData.monthly_data && yearData.monthly_data[0] ? yearData.monthly_data[0].rate_used + '%' : '-'}</td>
        `;
        
        yearRow.addEventListener('click', () => toggleMonthlyData(yearData, yearIndex));
        tbody.appendChild(yearRow);
    });
}

function toggleMonthlyData(yearData, yearIndex) {
    const yearRow = document.querySelector(`.year-row:nth-child(${yearIndex + 1})`);
    if (!yearRow) return;
    
    const isExpanded = yearRow.classList.contains('expanded');
    
    if (isExpanded) {
        collapseMonthlyData(yearData.year);
        yearRow.classList.remove('expanded');
    } else {
        expandMonthlyData(yearData, yearIndex);
        yearRow.classList.add('expanded');
    }
}

function expandMonthlyData(yearData, yearIndex) {
    const tbody = document.getElementById('balanceReductionTableBody');
    const yearRow = tbody.children[yearIndex];
    
    if (yearData.monthly_data && yearData.monthly_data.length > 0) {
        yearData.monthly_data.forEach((monthData, monthIndex) => {
            const monthRow = document.createElement('tr');
            monthRow.className = `month-row month-${yearData.year}`;
            monthRow.innerHTML = `
                <td class="month-cell">${monthData.month}</td>
                <td class="month-indent">${formatCurrency(monthData.balance + monthData.principal)}</td>
                <td class="month-indent">${formatCurrency(monthData.total_payment)}</td>
                <td class="month-indent">${formatCurrency(monthData.principal)}</td>
                <td class="month-indent">${formatCurrency(monthData.interest)}</td>
                <td class="month-indent">${formatCurrency(monthData.balance)}</td>
                <td class="month-indent">${monthData.rate_used}%</td>
            `;
            
            // Insert after year row + existing months
            const insertIndex = yearIndex + 1 + monthIndex;
            if (insertIndex < tbody.children.length) {
                tbody.insertBefore(monthRow, tbody.children[insertIndex]);
            } else {
                tbody.appendChild(monthRow);
            }
        });
    }
}

function collapseMonthlyData(year) {
    const monthRows = document.querySelectorAll(`.month-${year}`);
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
        
        // Close menu when clicking outside
        document.addEventListener('click', function() {
            megaMenu.classList.remove('open');
        });
        
        // Prevent menu from closing when clicking inside
        megaMenu.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
}

function setupDownloadButtons() {
    const pdfBtn = document.querySelector('.pdf-btn');
    const excelBtn = document.querySelector('.excel-btn');
    const shareBtn = document.querySelector('.share-btn');
    
    if (pdfBtn) {
        pdfBtn.addEventListener('click', downloadPDF);
    }
    
    if (excelBtn) {
        excelBtn.addEventListener('click', downloadExcel);
    }
    
    if (shareBtn) {
        shareBtn.addEventListener('click', shareLink);
    }
}

function downloadPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Get current values
        const loanAmount = document.getElementById('loanAmount').value;
        const initialRate = document.getElementById('initialRate').value;
        const revisedRate = document.getElementById('revisedRate').value;
        const transitionYear = document.getElementById('transitionYear').value;
        const tenureYears = document.getElementById('tenureYears').value;
        const initialEmi = document.getElementById('initialEmiResult').textContent;
        const revisedEmi = document.getElementById('revisedEmiResult').textContent;
        const totalInterest = document.getElementById('totalInterestResult').textContent;
        const totalAmount = document.getElementById('totalAmountResult').textContent;
        
        // Add header
        doc.setFontSize(20);
        doc.text('Floating Interest Rate EMI Calculator', 20, 20);
        
        // Add input details
        doc.setFontSize(12);
        doc.text('Loan Details:', 20, 40);
        doc.text(`Principal Amount: ₹${loanAmount}`, 20, 50);
        doc.text(`Initial Interest Rate: ${initialRate}%`, 20, 60);
        doc.text(`Revised Interest Rate: ${revisedRate}%`, 20, 70);
        doc.text(`Rate Change Year: ${transitionYear}`, 20, 80);
        doc.text(`Loan Tenure: ${tenureYears} years`, 20, 90);
        
        // Add results
        doc.text('Calculation Results:', 20, 110);
        doc.text(`Initial EMI: ${initialEmi}`, 20, 120);
        doc.text(`Revised EMI: ${revisedEmi}`, 20, 130);
        doc.text(`Total Interest: ${totalInterest}`, 20, 140);
        doc.text(`Total Amount: ${totalAmount}`, 20, 150);
        
        // Add footer
        doc.setFontSize(10);
        doc.text('Generated on: ' + new Date().toLocaleDateString(), 20, 280);
        doc.text('Floating Interest Rate EMI Calculator', 20, 290);
        
        // Save the PDF
        doc.save('floating-rate-emi-calculation.pdf');
        showNotification('PDF downloaded successfully!', 'success');
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        showNotification('Error generating PDF. Please try again.', 'error');
    }
}

function downloadExcel() {
    try {
        // Get current values for CSV format
        const loanAmount = document.getElementById('loanAmount').value;
        const initialRate = document.getElementById('initialRate').value;
        const revisedRate = document.getElementById('revisedRate').value;
        const transitionYear = document.getElementById('transitionYear').value;
        const tenureYears = document.getElementById('tenureYears').value;
        const initialEmi = document.getElementById('initialEmiResult').textContent;
        const revisedEmi = document.getElementById('revisedEmiResult').textContent;
        const totalInterest = document.getElementById('totalInterestResult').textContent;
        const totalAmount = document.getElementById('totalAmountResult').textContent;
        
        // Create CSV content
        let csvContent = 'Floating Interest Rate EMI Calculator\n\n';
        csvContent += 'Input Parameters\n';
        csvContent += 'Parameter,Value\n';
        csvContent += `Principal Amount,₹${loanAmount}\n`;
        csvContent += `Initial Interest Rate,${initialRate}%\n`;
        csvContent += `Revised Interest Rate,${revisedRate}%\n`;
        csvContent += `Rate Change Year,${transitionYear}\n`;
        csvContent += `Loan Tenure,${tenureYears} years\n\n`;
        
        csvContent += 'Calculation Results\n';
        csvContent += 'Result,Value\n';
        csvContent += `Initial EMI,${initialEmi}\n`;
        csvContent += `Revised EMI,${revisedEmi}\n`;
        csvContent += `Total Interest,${totalInterest}\n`;
        csvContent += `Total Amount,${totalAmount}\n\n`;
        
        csvContent += `Generated on,${new Date().toLocaleDateString()}\n`;
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'floating-rate-emi-calculation.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('Excel file downloaded successfully!', 'success');
    } catch (error) {
        console.error('Error generating Excel file:', error);
        showNotification('Error generating Excel file. Please try again.', 'error');
    }
}

function shareLink() {
    const currentUrl = window.location.href;
    const params = new URLSearchParams();
    
    params.set('loanAmount', document.getElementById('loanAmount').value);
    params.set('initialRate', document.getElementById('initialRate').value);
    params.set('revisedRate', document.getElementById('revisedRate').value);
    params.set('transitionYear', document.getElementById('transitionYear').value);
    params.set('tenureYears', document.getElementById('tenureYears').value);
    
    const shareUrl = `${currentUrl.split('?')[0]}?${params.toString()}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Floating Interest Rate EMI Calculator',
            text: 'Check out this floating interest rate EMI calculation',
            url: shareUrl
        }).then(() => {
            showNotification('Link shared successfully!', 'success');
        }).catch((error) => {
            console.error('Error sharing:', error);
            fallbackCopyTextToClipboard(shareUrl);
        });
    } else {
        fallbackCopyTextToClipboard(shareUrl);
    }
}

function fallbackCopyTextToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Link copied to clipboard!', 'success');
        }).catch((error) => {
            console.error('Error copying to clipboard:', error);
            showNotification('Error copying link. Please copy manually: ' + text, 'error');
        });
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            showNotification('Link copied to clipboard!', 'success');
        } catch (err) {
            console.error('Error copying to clipboard:', err);
            showNotification('Error copying link. Please copy manually: ' + text, 'error');
        }
        
        document.body.removeChild(textArea);
    }
}

function showNotification(message, type = 'success') {
    // Remove existing notifications
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
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Hide notification after 3 seconds
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
    
    const loanAmount = urlParams.get('loanAmount');
    const initialRate = urlParams.get('initialRate');
    const revisedRate = urlParams.get('revisedRate');
    const transitionYear = urlParams.get('transitionYear');
    const tenureYears = urlParams.get('tenureYears');
    
    if (loanAmount) {
        document.getElementById('loanAmount').value = loanAmount;
        document.getElementById('loanAmountSlider').value = loanAmount;
    }
    if (initialRate) {
        document.getElementById('initialRate').value = initialRate;
        document.getElementById('initialRateSlider').value = initialRate;
    }
    if (revisedRate) {
        document.getElementById('revisedRate').value = revisedRate;
        document.getElementById('revisedRateSlider').value = revisedRate;
    }
    if (transitionYear) {
        document.getElementById('transitionYear').value = transitionYear;
        document.getElementById('transitionYearSlider').value = transitionYear;
    }
    if (tenureYears) {
        document.getElementById('tenureYears').value = tenureYears;
        document.getElementById('tenureYearsSlider').value = tenureYears;
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
}

function formatCurrencyShort(amount) {
    if (amount >= 10000000) {
        return '₹' + (amount / 10000000).toFixed(1) + 'Cr';
    } else if (amount >= 100000) {
        return '₹' + (amount / 100000).toFixed(1) + 'L';
    } else if (amount >= 1000) {
        return '₹' + (amount / 1000).toFixed(1) + 'K';
    }
    return '₹' + amount.toFixed(0);
} 
