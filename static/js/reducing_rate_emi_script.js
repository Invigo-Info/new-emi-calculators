// Global variables
let loanChart;
let rateComparisonChart;
let balanceChart;
let chartsInitialized = false;
let isUpdatingCharts = false;
let enableCharts = true; // Re-enable charts

// Function to wait for Chart.js to load
function waitForChartJS(callback, maxRetries = 20, retryCount = 0) {
    if (typeof Chart !== 'undefined') {
        debugLog('Chart.js loaded successfully');
        callback();
    } else if (retryCount < maxRetries) {
        debugLog(`Waiting for Chart.js... Attempt ${retryCount + 1}/${maxRetries}`);
        setTimeout(() => {
            waitForChartJS(callback, maxRetries, retryCount + 1);
        }, 200);
    } else {
        console.error('Chart.js failed to load after maximum retries');
        debugLog('Chart.js failed to load, showing alternative display');
        enableCharts = false;
        showChartAlternative();
        callback();
    }
}

function showChartAlternative() {
    const chartContainers = document.querySelectorAll('.pie-chart-container');
    chartContainers.forEach(container => {
        if (container) {
            container.innerHTML = `
                <div class="chart-alternative">
                    <div class="alt-icon">📊</div>
                    <h4>${container.querySelector('h4')?.textContent || 'Chart'}</h4>
                    <p style="font-size: 14px; color: #64748b; margin: 10px 0;">
                        Chart data is shown in the summary below
                    </p>
                </div>
            `;
            container.style.display = 'flex';
            container.style.alignItems = 'center';
            container.style.justifyContent = 'center';
            container.style.minHeight = '200px';
            container.style.textAlign = 'center';
        }
    });
}

// Add debug logging
function debugLog(message) {
    console.log('[REDUCING RATE EMI]', message);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    debugLog('DOM Content Loaded - Starting initialization');
    
    try {
        setupEventListeners();
        debugLog('Event listeners set up');
        
        setupDownloadButtons();
        debugLog('Download buttons set up');
        
        setupMegaMenu();
        debugLog('Mega menu set up');
        
        loadFromUrlParameters();
        debugLog('URL parameters loaded');
        
        // Wait for Chart.js to load, then initialize
        waitForChartJS(() => {
            debugLog('Chart.js ready, initializing application');
            
            // Initialize chart containers
            initializeChartContainers();
            debugLog('Chart containers initialized');
            
            // Initial calculation after a short delay
            setTimeout(() => {
                debugLog('Starting initial calculation');
                calculateAndUpdate();
            }, 300);
        });
        
    } catch (error) {
        console.error('Error during initialization:', error);
        // Fallback: try to run without charts
        enableCharts = false;
        showChartAlternative();
        setTimeout(() => {
            calculateAndUpdate();
        }, 500);
    }
});

function initializeChartContainers() {
    // Ensure chart containers are properly set up
    const containers = [
        { selector: '.pie-chart-container', canvas: 'loanChart' }
    ];
    
    containers.forEach(({ selector, canvas }) => {
        const container = document.querySelector(selector);
        const canvasElement = document.getElementById(canvas);
        
        if (container && canvasElement) {
            container.style.display = 'block';
            canvasElement.style.display = 'block';
            debugLog(`Initialized container: ${selector}`);
        } else {
            console.warn(`Missing container or canvas: ${selector}, ${canvas}`);
        }
    });
}

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
            // Simple event listeners without validation to prevent loops
            inputElement.addEventListener('input', function() {
                if (this.dataset.updating) return;
                
                const value = Math.max(Math.min(parseFloat(this.value) || min, max), min);
                sliderElement.dataset.updating = 'true';
                sliderElement.value = value;
                delete sliderElement.dataset.updating;
                
                calculateAndUpdate();
            });
            
            sliderElement.addEventListener('input', function() {
                if (this.dataset.updating) return;
                
                inputElement.dataset.updating = 'true';
                inputElement.value = this.value;
                delete inputElement.dataset.updating;
                
                calculateAndUpdate();
            });
            
            // Validate on change event only
            inputElement.addEventListener('change', function() {
                validateAndCorrectInputs();
            });
        }
    });
}

function validateAndCorrectInputs() {
    // Basic validation for input ranges
    const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 1000000;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 10;
    const tenureYears = parseInt(document.getElementById('tenureYears').value) || 15;
    
    let correctionsMade = false;
    
    // Validate loan amount range
    if (loanAmount < 1000) {
        document.getElementById('loanAmount').value = 1000;
        document.getElementById('loanAmountSlider').value = 1000;
        correctionsMade = true;
        showNotification('Loan amount adjusted to minimum ₹1,000', 'error');
    }
    
    // Validate interest rate range
    if (interestRate < 0.1) {
        document.getElementById('interestRate').value = 0.1;
        document.getElementById('interestRateSlider').value = 0.1;
        correctionsMade = true;
        showNotification('Interest rate adjusted to minimum 0.1%', 'error');
    }
    
    // Trigger calculation after corrections
    if (correctionsMade) {
        setTimeout(() => {
            calculateAndUpdate();
        }, 100);
    }
}

// Add throttling to prevent rapid successive calls
let calculationTimeout;
let isCalculating = false;

function calculateAndUpdate() {
    // Clear any pending calculation
    if (calculationTimeout) {
        clearTimeout(calculationTimeout);
    }
    
    // Throttle calculations to prevent rapid successive calls
    calculationTimeout = setTimeout(() => {
        if (!isCalculating) {
            performCalculation();
        }
    }, 200);
}

function performCalculation() {
    if (isCalculating) {
        return;
    }
    
    isCalculating = true;
    
    try {
        const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 1000000;
        const interestRate = parseFloat(document.getElementById('interestRate').value) || 10.0;
        const tenureYears = parseInt(document.getElementById('tenureYears').value) || 15;
        
        debugLog(`Calculating with: Loan=${loanAmount}, InterestRate=${interestRate}, Tenure=${tenureYears}`);
        
        // Basic validation
        if (loanAmount < 1000 || loanAmount > 50000000 || 
            interestRate < 0.1 || interestRate > 36 || 
            tenureYears < 1 || tenureYears > 30) {
            
            console.log('Invalid input values, skipping calculation');
            isCalculating = false;
            return;
        }
        
        // Calculate EMI using standard formula
        const monthlyRate = interestRate / (12 * 100);
        const tenureMonths = tenureYears * 12;
        
        let emi;
        if (monthlyRate === 0) {
            emi = loanAmount / tenureMonths;
        } else {
            const numerator = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths);
            const denominator = Math.pow(1 + monthlyRate, tenureMonths) - 1;
            emi = numerator / denominator;
        }
        
        const totalAmount = emi * tenureMonths;
        const totalInterest = totalAmount - loanAmount;
        
        // Generate balance schedule
        const balanceSchedule = generateBalanceSchedule(loanAmount, monthlyRate, emi, tenureMonths, 2025);
        
        const calculationData = {
            emi: Math.round(emi * 100) / 100,
            principalAmount: loanAmount,
            totalInterest: Math.round(totalInterest * 100) / 100,
            totalAmount: Math.round(totalAmount * 100) / 100,
            balanceSchedule: balanceSchedule
        };
        
        debugLog('Calculation completed:', calculationData);
        updateResults(calculationData);
        updateCharts(calculationData);
        updateBalanceReductionTable(calculationData.balanceSchedule || []);
        
    } catch (error) {
        console.error('Error in performCalculation:', error);
        showNotification('Calculation error. Please check your inputs.', 'error');
    } finally {
        isCalculating = false;
    }
}

function generateBalanceSchedule(principal, monthlyRate, emi, totalMonths, startYear = 2025) {
    const schedule = [];
    let remainingBalance = principal;
    let currentYear = startYear;
    let monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    let totalMonthsProcessed = 0;
    let currentMonth = 0;
    
    while (totalMonthsProcessed < totalMonths && remainingBalance > 0.01) {
        let yearPrincipal = 0;
        let yearInterest = 0;
        let yearPayments = 0;
        let monthlyData = [];
        let openingBalanceYear = remainingBalance;
        
        // Calculate months for this year
        let monthsRemainingInYear = 12 - currentMonth;
        let monthsToProcess = Math.min(monthsRemainingInYear, totalMonths - totalMonthsProcessed);
        
        for (let monthIdx = 0; monthIdx < monthsToProcess; monthIdx++) {
            if (totalMonthsProcessed >= totalMonths || remainingBalance <= 0.01) break;
            
            totalMonthsProcessed++;
            
            let interestPayment = remainingBalance * monthlyRate;
            let principalPayment = emi - interestPayment;
            
            // Ensure we don't pay more principal than remaining
            if (principalPayment > remainingBalance) {
                principalPayment = remainingBalance;
                interestPayment = emi - principalPayment;
            }
            
            yearPrincipal += principalPayment;
            yearInterest += interestPayment;
            yearPayments += emi;
            
            remainingBalance -= principalPayment;
            
            let monthName = monthNames[(currentMonth + monthIdx) % 12];
            
            monthlyData.push({
                month: monthName,
                emi: Math.round(emi * 100) / 100,
                principal: Math.round(principalPayment * 100) / 100,
                interest: Math.round(interestPayment * 100) / 100,
                balance: Math.round(Math.max(0, remainingBalance) * 100) / 100,
                openingBalance: Math.round((remainingBalance + principalPayment) * 100) / 100
            });
        }
        
        schedule.push({
            year: currentYear,
            openingBalance: Math.round(openingBalanceYear * 100) / 100,
            emiPaid: Math.round(yearPayments * 100) / 100,
            principalPaid: Math.round(yearPrincipal * 100) / 100,
            interestPaid: Math.round(yearInterest * 100) / 100,
            closingBalance: Math.round(Math.max(0, remainingBalance) * 100) / 100,
            months_in_year: monthsToProcess,
            monthly_data: monthlyData
        });
        
        currentYear++;
        currentMonth = 0;
        
        if (remainingBalance <= 0.01) break;
    }
    
    return schedule;
}

function updateResults(data) {
    debugLog('Updating results with data:', data);
    
    try {
        // Update result cards with error checking
        const resultElements = [
            { id: 'emiResult', value: data.emi },
            { id: 'totalInterestResult', value: data.totalInterest },
            { id: 'totalAmountResult', value: data.totalAmount },
            { id: 'principalAmountResult', value: data.principalAmount }
        ];

        resultElements.forEach(({ id, value }) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = formatCurrency(value);
                debugLog(`Updated ${id}: ${formatCurrency(value)}`);
            } else {
                console.warn(`Element with id '${id}' not found`);
            }
        });

        // Update chart summary with error checking
        const summaryElements = [
            { id: 'principalDisplay', value: data.principalAmount },
            { id: 'interestDisplay', value: data.totalInterest }
        ];

        summaryElements.forEach(({ id, value }) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = formatCurrency(value);
            } else {
                console.warn(`Summary element with id '${id}' not found`);
            }
        });
        
        debugLog('Results updated successfully');
        
    } catch (error) {
        console.error('Error updating results:', error);
    }
}

function updateCharts(data) {
    // Always update chart summary values first
    updateChartSummaryValues(data);
    
    if (!enableCharts) {
        debugLog('Charts disabled, showing summary only');
        return;
    }
    
    if (isUpdatingCharts) {
        debugLog('Charts already updating, skipping...');
        return;
    }
    
    isUpdatingCharts = true;
    
    try {
        // Check if Chart.js is available
        if (typeof Chart === 'undefined') {
            debugLog('Chart.js not available, falling back to alternative display');
            showChartAlternative();
            isUpdatingCharts = false;
            return;
        }
        
        debugLog('Starting chart updates');
        
        // Update charts sequentially with proper error handling
        updateLoanChart(data);
        
        setTimeout(() => {
            if (!isUpdatingCharts) return;
            
            debugLog('All charts updated successfully');
            chartsInitialized = true;
            isUpdatingCharts = false;
        }, 100);
        
    } catch (error) {
        console.error('Error updating charts:', error);
        debugLog('Chart update failed, showing alternative display');
        showChartAlternative();
        isUpdatingCharts = false;
    }
}

function updateChartSummaryOnly(data) {
    // Just update the summary without charts
    try {
        const principalDisplay = document.getElementById('principalDisplay');
        const interestDisplay = document.getElementById('interestDisplay');
        const phase1InterestDisplay = document.getElementById('phase1InterestDisplay');
        const phase2InterestDisplay = document.getElementById('phase2InterestDisplay');
        
        if (principalDisplay) principalDisplay.textContent = formatCurrency(data.principalAmount);
        if (interestDisplay) interestDisplay.textContent = formatCurrency(data.totalInterest);
        if (phase1InterestDisplay) phase1InterestDisplay.textContent = formatCurrency(data.phase1Interest);
        if (phase2InterestDisplay) phase2InterestDisplay.textContent = formatCurrency(data.phase2Interest);
        
        // Hide chart containers and show summary only
        const chartContainers = document.querySelectorAll('.pie-chart-container, .rate-comparison-container, .balance-chart-container');
        chartContainers.forEach(container => {
            if (container) {
                container.style.display = 'none';
            }
        });
        
        // Show the chart summary
        const chartSummary = document.querySelector('.chart-summary');
        if (chartSummary) {
            chartSummary.style.display = 'block';
        }
        
    } catch (error) {
        console.error('Error updating chart summary:', error);
    }
}

function showChartContainers() {
    // Show chart containers when charts are enabled
    const chartContainers = document.querySelectorAll('.pie-chart-container, .rate-comparison-container, .balance-chart-container');
    chartContainers.forEach(container => {
        if (container) {
            container.style.display = 'block';
        }
    });
}

function updateChartSummaryValues(data) {
    // Update the chart summary values
    try {
        const principalDisplay = document.getElementById('principalDisplay');
        const interestDisplay = document.getElementById('interestDisplay');
        
        if (principalDisplay) principalDisplay.textContent = formatCurrency(data.principalAmount);
        if (interestDisplay) interestDisplay.textContent = formatCurrency(data.totalInterest);
    } catch (error) {
        console.error('Error updating chart summary values:', error);
    }
}

function updateLoanChart(data) {
    try {
        // Check if Chart.js is loaded
        if (typeof Chart === 'undefined') {
            console.error('Chart.js library not loaded');
            return;
        }
        
        const canvas = document.getElementById('loanChart');
        if (!canvas) {
            console.error('Loan chart canvas not found');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart if it exists
        if (loanChart && typeof loanChart.destroy === 'function') {
            loanChart.destroy();
            loanChart = null;
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
            maintainAspectRatio: false,
            animation: {
                duration: 300
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 12,
                            family: 'Inter'
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = formatCurrency(context.raw);
                            const percentage = ((context.raw / (data.principalAmount + data.totalInterest)) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            layout: {
                padding: 10
            }
        }
    });
    } catch (error) {
        console.error('Error updating loan chart:', error);
    }
}

function updateRateComparisonChart(data) {
    try {
        // Check if Chart.js is loaded
        if (typeof Chart === 'undefined') {
            console.error('Chart.js library not loaded');
            return;
        }
        
        const canvas = document.getElementById('rateComparisonChart');
        if (!canvas) {
            console.error('Rate comparison chart canvas not found');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart if it exists
        if (rateComparisonChart && typeof rateComparisonChart.destroy === 'function') {
            rateComparisonChart.destroy();
            rateComparisonChart = null;
        }

    const chartData = [data.phase1Interest, data.phase2Interest];
    const chartLabels = ['Phase 1 Interest', 'Phase 2 Interest'];
    const chartColors = ['#ef4444', '#10b981'];
    
    rateComparisonChart = new Chart(ctx, {
        type: 'doughnut',
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
            maintainAspectRatio: false,
            animation: {
                duration: 300
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 12,
                            family: 'Inter'
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = formatCurrency(context.raw);
                            const percentage = ((context.raw / data.totalInterest) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            layout: {
                padding: 10
            },
            cutout: '50%'
        }
    });
    } catch (error) {
        console.error('Error updating rate comparison chart:', error);
    }
}

function updateBalanceChart(data) {
    try {
        // Check if Chart.js is loaded
        if (typeof Chart === 'undefined') {
            console.error('Chart.js library not loaded');
            return;
        }
        
        const canvas = document.getElementById('balanceChart');
        if (!canvas) {
            console.error('Balance chart canvas not found');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart if it exists
        if (balanceChart && typeof balanceChart.destroy === 'function') {
            balanceChart.destroy();
            balanceChart = null;
        }

    // Prepare data for balance chart
    const years = data.balanceSchedule.map(item => item.year);
    const balances = data.balanceSchedule.map(item => item.closingBalance);
    const transitionYear = parseInt(document.getElementById('transitionYear').value) || 3;
    const startYear = years[0] || 2025;
    
    // Create color array based on transition
    const backgroundColors = years.map(year => {
        return (year - startYear + 1) <= transitionYear ? '#ef4444' : '#10b981';
    });
    
    const borderColors = years.map(year => {
        return (year - startYear + 1) <= transitionYear ? '#dc2626' : '#059669';
    });
    
    balanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [{
                label: 'Outstanding Balance',
                data: balances,
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: backgroundColors,
                pointBorderColor: borderColors,
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 300
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const year = context.label;
                            const balance = formatCurrency(context.raw);
                            const yearNum = parseInt(year) - startYear + 1;
                            const phase = yearNum <= transitionYear ? 'Phase 1' : 'Phase 2';
                            return `${balance} (${phase})`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrencyShort(value);
                        },
                        font: {
                            size: 11,
                            family: 'Inter'
                        }
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    },
                    ticks: {
                        font: {
                            size: 11,
                            family: 'Inter'
                        }
                    }
                }
            },
            elements: {
                point: {
                    hoverBorderWidth: 3
                }
            }
        }
    });
    } catch (error) {
        console.error('Error updating balance chart:', error);
    }
}

function updateBalanceReductionTable(balanceSchedule) {
    const tableBody = document.querySelector('#paymentScheduleTable tbody');
    tableBody.innerHTML = '';
    
    balanceSchedule.forEach((yearData, yearIndex) => {
        // Create year row
        const yearRow = document.createElement('tr');
        yearRow.className = 'year-row';
        yearRow.innerHTML = `
            <td class="year-cell">
                ${yearData.year}
                <span class="expand-icon">▶</span>
            </td>
            <td>${formatCurrency(yearData.openingBalance)}</td>
            <td>${formatCurrency(yearData.emiPaid)}</td>
            <td>${formatCurrency(yearData.principalPaid)}</td>
            <td>${formatCurrency(yearData.interestPaid)}</td>
            <td>${formatCurrency(yearData.closingBalance)}</td>
        `;
        
        // Add click event to expand/collapse
        yearRow.addEventListener('click', () => toggleMonthlyData(yearData, yearIndex));
        
        tableBody.appendChild(yearRow);
    });
}

function toggleMonthlyData(yearData, yearIndex) {
    const yearRow = document.querySelectorAll('.year-row')[yearIndex];
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
    const yearRow = document.querySelectorAll('.year-row')[yearIndex];
    
    // Remove existing monthly rows for this year
    collapseMonthlyData(yearData.year);
    
    // Add monthly data rows in correct order
    let lastInsertedRow = yearRow;
    yearData.monthly_data.forEach(monthData => {
        const monthRow = document.createElement('tr');
        monthRow.className = `month-row month-row-${yearData.year}`;
        monthRow.innerHTML = `
            <td class="month-cell">
                <div class="month-indent">${monthData.month}</div>
            </td>
            <td>${formatCurrency(monthData.openingBalance)}</td>
            <td>${formatCurrency(monthData.emi)}</td>
            <td>${formatCurrency(monthData.principal)}</td>
            <td>${formatCurrency(monthData.interest)}</td>
            <td>${formatCurrency(monthData.balance)}</td>
        `;
        
        // Insert after the last inserted row to maintain correct order
        lastInsertedRow.insertAdjacentElement('afterend', monthRow);
        lastInsertedRow = monthRow; // Update the reference for the next insertion
    });
}

function collapseMonthlyData(year) {
    const monthRows = document.querySelectorAll(`.month-row-${year}`);
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
        document.addEventListener('click', function(e) {
            if (!megaMenu.contains(e.target)) {
                megaMenu.classList.remove('open');
            }
        });
    }
}

function setupDownloadButtons() {
    // Setup download button event listeners
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
        const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 1000000;
        const interestRate = parseFloat(document.getElementById('interestRate').value) || 10.0;
        const tenureYears = parseInt(document.getElementById('tenureYears').value) || 15;
        
        const emi = document.getElementById('emiResult').textContent;
        const totalInterest = document.getElementById('totalInterestResult').textContent;
        const totalAmount = document.getElementById('totalAmountResult').textContent;
        const principalAmount = document.getElementById('principalAmountResult').textContent;
        
        // Add title
        doc.setFontSize(20);
        doc.setTextColor(40, 40, 40);
        doc.text('EMI Calculator Report', 20, 20);
        
        // Add input parameters
        doc.setFontSize(14);
        doc.setTextColor(60, 60, 60);
        doc.text('Input Parameters:', 20, 40);
        
        doc.setFontSize(12);
        doc.setTextColor(80, 80, 80);
        doc.text(`Principal Amount: ${formatCurrency(loanAmount)}`, 20, 55);
        doc.text(`Interest Rate: ${interestRate}%`, 20, 65);
        doc.text(`Loan Tenure: ${tenureYears} years`, 20, 75);
        
        // Add results
        doc.setFontSize(14);
        doc.setTextColor(60, 60, 60);
        doc.text('Calculation Results:', 20, 95);
        
        doc.setFontSize(12);
        doc.setTextColor(80, 80, 80);
        doc.text(`Monthly EMI: ${emi}`, 20, 110);
        doc.text(`Total Interest: ${totalInterest}`, 20, 120);
        doc.text(`Total Amount Payable: ${totalAmount}`, 20, 130);
        doc.text(`Principal Amount: ${principalAmount}`, 20, 140);
        
        // Add footer
        doc.setFontSize(10);
        doc.setTextColor(120, 120, 120);
        doc.text('Generated on: ' + new Date().toLocaleDateString(), 20, 280);
        doc.text('EMI Calculator', 20, 290);
        
        // Save the PDF
        doc.save('emi-calculation.pdf');
        
        showNotification('PDF downloaded successfully!', 'success');
    } catch (error) {
        console.error('PDF generation error:', error);
        showNotification('Error generating PDF', 'error');
    }
}

function downloadExcel() {
    try {
        // Get the table data
        const table = document.getElementById('paymentScheduleTable');
        let csvContent = "data:text/csv;charset=utf-8,";
        
        // Add headers
        const headers = ['Year', 'Opening Balance', 'EMI Paid', 'Principal Paid', 'Interest Paid', 'Closing Balance'];
        csvContent += headers.join(',') + '\n';
        
        // Add year-wise data only (not monthly breakdown)
        const yearRows = table.querySelectorAll('.year-row');
        yearRows.forEach(row => {
            const cells = row.querySelectorAll('td');
            const rowData = [];
            cells.forEach((cell, index) => {
                if (index === 0) {
                    // Remove expand icon from year column
                    rowData.push(cell.textContent.replace('▶', '').trim());
                } else {
                    rowData.push(cell.textContent.trim());
                }
            });
            csvContent += rowData.join(',') + '\n';
        });
        
        // Create download link
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'emi-schedule.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('Excel file downloaded successfully!', 'success');
    } catch (error) {
        console.error('Excel generation error:', error);
        showNotification('Error generating Excel file', 'error');
    }
}

function shareLink() {
    try {
        // Get current form values
        const loanAmount = document.getElementById('loanAmount').value;
        const interestRate = document.getElementById('interestRate').value;
        const tenureYears = document.getElementById('tenureYears').value;
        
        // Create URL with parameters
        const baseUrl = window.location.origin + window.location.pathname;
        const params = new URLSearchParams({
            loanAmount: loanAmount,
            interestRate: interestRate,
            tenureYears: tenureYears
        });
        
        const shareUrl = `${baseUrl}?${params.toString()}`;
        
        // Try to copy to clipboard
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(shareUrl).then(() => {
                showNotification('Link copied to clipboard!', 'success');
            }).catch(() => {
                fallbackCopyTextToClipboard(shareUrl);
            });
        } else {
            fallbackCopyTextToClipboard(shareUrl);
        }
        
    } catch (error) {
        console.error('Share link error:', error);
        showNotification('Error generating share link', 'error');
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
            showNotification('Unable to copy link', 'error');
        }
    } catch (err) {
        console.error('Fallback copy error:', err);
        showNotification('Unable to copy link', 'error');
    }
    
    document.body.removeChild(textArea);
}

function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

function loadFromUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    const params = {
        loanAmount: urlParams.get('loanAmount'),
        interestRate: urlParams.get('interestRate'),
        tenureYears: urlParams.get('tenureYears')
    };
    
    // Set values if they exist in URL
    Object.keys(params).forEach(key => {
        if (params[key]) {
            const input = document.getElementById(key);
            const slider = document.getElementById(key + 'Slider');
            
            if (input) {
                input.value = params[key];
            }
            if (slider) {
                slider.value = params[key];
            }
        }
    });
}

function formatCurrency(amount) {
    if (amount >= 10000000) { // 1 crore
        return '₹' + (amount / 10000000).toFixed(2) + ' Cr';
    } else if (amount >= 100000) { // 1 lakh
        return '₹' + (amount / 100000).toFixed(2) + ' L';
    } else {
        return '₹' + amount.toLocaleString('en-IN');
    }
}

function formatCurrencyShort(amount) {
    if (amount >= 10000000) { // 1 crore
        return (amount / 10000000).toFixed(1) + 'Cr';
    } else if (amount >= 100000) { // 1 lakh
        return (amount / 100000).toFixed(1) + 'L';
    } else if (amount >= 1000) { // 1 thousand
        return (amount / 1000).toFixed(1) + 'K';
    } else {
        return amount.toString();
    }
} 