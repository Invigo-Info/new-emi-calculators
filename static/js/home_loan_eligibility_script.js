// Global variables
let eligibilityBreakupChart = null;
let incomeVsEmiChart = null;
let currentEmiScheme = 'arrears'; // 'arrears' or 'advance'
let currentCalculationData = null;

// DOM Elements
const schemeTabButtons = document.querySelectorAll('.scheme-tab-button');
const grossIncomeInput = document.getElementById('grossIncome');
const grossIncomeSlider = document.getElementById('grossIncomeSlider');
const tenureInput = document.getElementById('tenure');
const tenureSlider = document.getElementById('tenureSlider');
const interestRateInput = document.getElementById('interestRate');
const interestRateSlider = document.getElementById('interestRateSlider');
const otherEmisInput = document.getElementById('otherEmis');
const otherEmisSlider = document.getElementById('otherEmisSlider');

// Result Elements
const maxLoanAmountElement = document.getElementById('maxLoanAmount');
const monthlyEmiElement = document.getElementById('monthlyEmi');
const foirRatioElement = document.getElementById('foirRatio');
const availableIncomeElement = document.getElementById('availableIncome');
const totalInterestElement = document.getElementById('totalInterest');
const totalAmountElement = document.getElementById('totalAmount');

// Chart Summary Elements
const chartPrincipalElement = document.getElementById('chartPrincipal');
const chartInterestElement = document.getElementById('chartInterest');
const chartOtherEmisElement = document.getElementById('chartOtherEmis');
const chartTotalElement = document.getElementById('chartTotal');

// Initialize the calculator
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    calculateEligibility();
});

function initializeEventListeners() {
    // Create debounced calculation function
    const debouncedCalculateEligibility = debounce(calculateEligibility, 300);

    // Scheme tab switching
    schemeTabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const scheme = this.dataset.scheme;
            switchEmiScheme(scheme);
        });
    });

    // Input synchronization with debounced calculation
    const inputPairs = [
        ['grossIncome', 'grossIncomeSlider'],
        ['tenure', 'tenureSlider'],
        ['interestRate', 'interestRateSlider'],
        ['otherEmis', 'otherEmisSlider']
    ];

    inputPairs.forEach(([inputId, sliderId]) => {
        const input = document.getElementById(inputId);
        const slider = document.getElementById(sliderId);
        
        input.addEventListener('input', function() {
            slider.value = this.value;
            debouncedCalculateEligibility();
        });
        
        slider.addEventListener('input', function() {
            input.value = this.value;
            debouncedCalculateEligibility();
        });
    });

    // Download button event listeners
    document.getElementById('downloadPDF').addEventListener('click', downloadPDF);
    document.getElementById('downloadExcel').addEventListener('click', downloadExcel);
    document.getElementById('shareCalculation').addEventListener('click', shareCalculation);
}

function switchEmiScheme(scheme) {
    currentEmiScheme = scheme;

    // Update active tab
    schemeTabButtons.forEach(button => {
        button.classList.remove('active');
        if (button.dataset.scheme === scheme) {
            button.classList.add('active');
        }
    });

    calculateEligibility();
}

async function calculateEligibility() {
    const grossIncome = parseFloat(grossIncomeInput.value) || 0;
    const tenure = parseInt(tenureInput.value) || 0;
    const interestRate = parseFloat(interestRateInput.value) || 0;
    const otherEmis = parseFloat(otherEmisInput.value) || 0;

    // Validate inputs
    if (grossIncome <= 0 || tenure <= 0 || interestRate <= 0) {
        updateResults({
            maxLoanAmount: 0,
            monthlyEmi: 0,
            foirRatio: 0,
            availableIncome: 0,
            totalInterest: 0,
            totalAmount: 0,
            yearlySchedule: []
        });
        return;
    }

    try {
        const response = await fetch('/calculate-home-loan-eligibility', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                grossIncome: grossIncome,
                tenure: tenure,
                interestRate: interestRate,
                otherEmis: otherEmis,
                emiScheme: currentEmiScheme
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            console.error('Calculation error:', data.error);
            return;
        }

        updateResults(data);

    } catch (error) {
        console.error('Error calculating eligibility:', error);
        // Fallback to client-side calculation
        const data = calculateEligibilityClientSide(grossIncome, tenure, interestRate, otherEmis);
        updateResults(data);
    }
}

function calculateEligibilityClientSide(grossIncome, tenure, interestRate, otherEmis) {
    // FOIR (Fixed Obligation to Income Ratio) - typically 40%
    const foirLimit = 0.40; // 40%
    
    // Available income for EMI after existing EMIs
    const availableIncome = (grossIncome * foirLimit) - otherEmis;
    
    if (availableIncome <= 0) {
        return {
            maxLoanAmount: 0,
            monthlyEmi: 0,
            foirRatio: (otherEmis / grossIncome) * 100,
            availableIncome: 0,
            totalInterest: 0,
            totalAmount: 0,
            yearlySchedule: []
        };
    }

    // Calculate EMI and loan amount
    const monthlyRate = interestRate / (12 * 100);
    const totalMonths = tenure * 12;
    
    let maxLoanAmount;
    let actualEmi;
    
    if (monthlyRate > 0) {
        // Calculate loan amount from EMI using reverse EMI formula
        // P = EMI * [((1+r)^n - 1) / (r * (1+r)^n)]
        const denominator = monthlyRate * Math.pow(1 + monthlyRate, totalMonths);
        const numerator = Math.pow(1 + monthlyRate, totalMonths) - 1;
        maxLoanAmount = availableIncome * (numerator / denominator);
        
        // Adjust for EMI in advance
        if (currentEmiScheme === 'advance') {
            maxLoanAmount = maxLoanAmount * (1 + monthlyRate);
        }
        
        // Calculate actual EMI based on the loan amount
        if (currentEmiScheme === 'advance') {
            // For EMI in advance
            actualEmi = (maxLoanAmount / (1 + monthlyRate)) * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
        } else {
            // For EMI in arrears (standard)
            actualEmi = maxLoanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
        }
    } else {
        maxLoanAmount = availableIncome * totalMonths;
        actualEmi = availableIncome;
    }

    const totalInterest = (actualEmi * totalMonths) - maxLoanAmount;
    const totalAmount = maxLoanAmount + totalInterest;
    const foirRatio = ((actualEmi + otherEmis) / grossIncome) * 100;

    // Generate yearly schedule
    const yearlySchedule = generateYearlySchedule(maxLoanAmount, monthlyRate, totalMonths, actualEmi, otherEmis, grossIncome);

    return {
        maxLoanAmount: Math.round(maxLoanAmount),
        monthlyEmi: Math.round(actualEmi),
        foirRatio: Math.round(foirRatio * 100) / 100,
        availableIncome: Math.round(availableIncome),
        totalInterest: Math.round(totalInterest),
        totalAmount: Math.round(totalAmount),
        yearlySchedule: yearlySchedule
    };
}

function generateYearlySchedule(loanAmount, monthlyRate, totalMonths, emi, otherEmis, grossIncome) {
    const schedule = [];
    let remainingBalance = loanAmount;
    const currentYear = new Date().getFullYear();

    for (let year = 1; year <= Math.ceil(totalMonths / 12); year++) {
        const monthsInYear = Math.min(12, totalMonths - ((year - 1) * 12));
        let yearlyPrincipal = 0;
        let yearlyInterest = 0;

        for (let month = 1; month <= monthsInYear; month++) {
            if (remainingBalance <= 0) break;

            const interestPayment = remainingBalance * monthlyRate;
            const principalPayment = Math.min(emi - interestPayment, remainingBalance);

            yearlyPrincipal += principalPayment;
            yearlyInterest += interestPayment;
            remainingBalance -= principalPayment;
        }

        const totalEmiPayments = (yearlyPrincipal + yearlyInterest);
        const annualOtherEmis = otherEmis * 12;
        const totalAnnualPayment = totalEmiPayments + annualOtherEmis;
        const annualGrossIncome = grossIncome * 12;
        const foirPercentage = (totalAnnualPayment / annualGrossIncome) * 100;

        schedule.push({
            year: currentYear + year - 1,
            principal: Math.round(yearlyPrincipal),
            interest: Math.round(yearlyInterest),
            monthlyEmi: Math.round((yearlyPrincipal + yearlyInterest) / monthsInYear),
            otherEmis: Math.round(annualOtherEmis),
            totalAnnualPayment: Math.round(totalAnnualPayment),
            balance: Math.round(Math.max(0, remainingBalance)),
            foirPercentage: Math.round(foirPercentage * 100) / 100
        });

        if (remainingBalance <= 0) break;
    }

    return schedule;
}

function updateResults(data) {
    // Update result display elements
    maxLoanAmountElement.textContent = formatCurrency(data.maxLoanAmount);
    monthlyEmiElement.textContent = formatCurrency(data.monthlyEmi);
    foirRatioElement.textContent = `${data.foirRatio}%`;
    availableIncomeElement.textContent = formatCurrency(data.availableIncome);
    totalInterestElement.textContent = formatCurrency(data.totalInterest);
    totalAmountElement.textContent = formatCurrency(data.totalAmount);

    // Update chart summary
    const otherEmisOverTenure = parseFloat(otherEmisInput.value) * parseFloat(tenureInput.value) * 12;
    
    chartPrincipalElement.textContent = formatCurrency(data.maxLoanAmount);
    chartInterestElement.textContent = formatCurrency(data.totalInterest);
    chartOtherEmisElement.textContent = formatCurrency(otherEmisOverTenure);
    chartTotalElement.textContent = formatCurrency(data.totalAmount + otherEmisOverTenure);

    // Store current calculation data for downloads
    currentCalculationData = data;

    // Update charts
    updateEligibilityBreakupChart(data, otherEmisOverTenure);
    updateIncomeVsEmiChart(data);

    // Update table
    updateEligibilityTable(data.yearlySchedule);
}

function updateEligibilityBreakupChart(data, otherEmisOverTenure) {
    const ctx = document.getElementById('eligibilityBreakupChart').getContext('2d');

    // Destroy existing chart if it exists
    if (eligibilityBreakupChart) {
        eligibilityBreakupChart.destroy();
    }

    const chartData = [data.maxLoanAmount, data.totalInterest, otherEmisOverTenure];
    const labels = ['Loan Amount (Principal)', 'Total Interest', 'Other EMIs (Over Tenure)'];
    const colors = ['#416cfa', '#6684e8', '#8b5cf6'];

    eligibilityBreakupChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: chartData,
                backgroundColor: colors,
                borderWidth: 0,
                cutout: '50%'
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
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.raw / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            elements: {
                arc: {
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }
            }
        },
        plugins: [{
            afterDraw: function(chart) {
                const ctx = chart.ctx;
                const data = chart.data.datasets[0].data;
                const total = data.reduce((a, b) => a + b, 0);

                chart.data.datasets[0].data.forEach((value, index) => {
                    const meta = chart.getDatasetMeta(0);
                    const arc = meta.data[index];
                    
                    if (value > 0) {
                        const percentage = ((value / total) * 100).toFixed(1);

                        // Calculate label position
                        const midAngle = (arc.startAngle + arc.endAngle) / 2;
                        const x = arc.x + Math.cos(midAngle) * (arc.outerRadius * 0.7);
                        const y = arc.y + Math.sin(midAngle) * (arc.outerRadius * 0.7);

                        // Draw percentage text
                        ctx.fillStyle = '#ffffff';
                        ctx.font = 'bold 14px Inter';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(percentage + '%', x, y);
                    }
                });
            }
        }]
    });
}

function updateIncomeVsEmiChart(data) {
    const ctx = document.getElementById('incomeVsEmiChart').getContext('2d');

    // Destroy existing chart if it exists
    if (incomeVsEmiChart) {
        incomeVsEmiChart.destroy();
    }

    const grossIncome = parseFloat(grossIncomeInput.value);
    const otherEmis = parseFloat(otherEmisInput.value);
    const availableIncome = data.availableIncome;

    const chartData = {
        labels: ['Gross Monthly Income', 'Other EMIs', 'Available for Home Loan EMI', 'Utilized for Home Loan EMI'],
        datasets: [{
            label: 'Income Analysis',
            data: [grossIncome, otherEmis, availableIncome, data.monthlyEmi],
            backgroundColor: ['#3b82f6', '#ef4444', '#22c55e', '#f97316'],
            borderColor: ['#2563eb', '#dc2626', '#16a34a', '#ea580c'],
            borderWidth: 2,
            categoryPercentage: 0.6,
            barPercentage: 0.7
        }]
    };

    incomeVsEmiChart = new Chart(ctx, {
        type: 'bar',
        data: chartData,
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
                            return `${context.label}: ${formatCurrency(context.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Amount (₹)',
                        color: '#6b7280',
                        font: {
                            size: 14,
                            weight: '600'
                        }
                    },
                    ticks: {
                        callback: function(value) {
                            return formatLakhCrore(value);
                        },
                        color: '#6b7280'
                    },
                    grid: {
                        color: '#f3f4f6'
                    }
                },
                x: {
                    ticks: {
                        color: '#374151',
                        font: {
                            weight: '600'
                        },
                        maxRotation: 45
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function updateEligibilityTable(yearlySchedule) {
    const tableBody = document.getElementById('eligibilityTableBody');
    if (!tableBody || !yearlySchedule) return;

    tableBody.innerHTML = '';

    yearlySchedule.forEach((yearData, yearIndex) => {
        // Create year row
        const yearRow = document.createElement('tr');
        yearRow.className = 'year-row';
        yearRow.dataset.year = yearIndex;

        yearRow.innerHTML = `
            <td class="year-cell">
                <span class="expand-icon">▶</span>
                <span class="year-text">${yearData.year}</span>
            </td>
            <td>₹${formatNumber(yearData.principal)}</td>
            <td>₹${formatNumber(yearData.interest)}</td>
            <td>₹${formatNumber(yearData.monthlyEmi)}</td>
            <td>₹${formatNumber(yearData.otherEmis)}</td>
            <td>₹${formatNumber(yearData.totalAnnualPayment)}</td>
            <td>₹${formatNumber(yearData.balance)}</td>
            <td>${yearData.foirPercentage}%</td>
        `;

        // Add click handler for year row
        yearRow.addEventListener('click', function() {
            toggleYearExpansion(yearIndex, yearData);
        });

        tableBody.appendChild(yearRow);
    });
}

function toggleYearExpansion(yearIndex, yearData) {
    const tableBody = document.getElementById('eligibilityTableBody');
    const yearRow = tableBody.querySelector(`tr[data-year="${yearIndex}"]`);
    const expandIcon = yearRow.querySelector('.expand-icon');
    const isExpanded = yearRow.classList.contains('expanded');

    if (isExpanded) {
        // Collapse: Remove month rows
        yearRow.classList.remove('expanded');
        expandIcon.textContent = '▶';
        expandIcon.style.transform = 'rotate(0deg)';
        
        // Remove all month rows for this year
        let nextRow = yearRow.nextElementSibling;
        while (nextRow && nextRow.classList.contains('month-row') && nextRow.dataset.yearIndex == yearIndex) {
            const rowToRemove = nextRow;
            nextRow = nextRow.nextElementSibling;
            rowToRemove.remove();
        }
    } else {
        // Expand: Add month rows
        yearRow.classList.add('expanded');
        expandIcon.textContent = '▼';
        expandIcon.style.transform = 'rotate(0deg)';
        
        // Generate monthly data for this year
        const monthlyData = generateMonthlyDataForYear(yearData, yearIndex);
        
        // Insert month rows after year row
        let insertAfter = yearRow;
        monthlyData.forEach((monthData, monthIndex) => {
            const monthRow = document.createElement('tr');
            monthRow.className = 'month-row';
            monthRow.dataset.yearIndex = yearIndex;
            monthRow.dataset.monthIndex = monthIndex;

            monthRow.innerHTML = `
                <td class="month-cell">${monthData.month}</td>
                <td>₹${formatNumber(monthData.principal)}</td>
                <td>₹${formatNumber(monthData.interest)}</td>
                <td>₹${formatNumber(monthData.monthlyEmi)}</td>
                <td>₹${formatNumber(monthData.otherEmis)}</td>
                <td>₹${formatNumber(monthData.totalMonthlyPayment)}</td>
                <td>₹${formatNumber(monthData.balance)}</td>
                <td>${monthData.foirPercentage}%</td>
            `;

            insertAfter.insertAdjacentElement('afterend', monthRow);
            insertAfter = monthRow;
        });
    }
}

function generateMonthlyDataForYear(yearData, yearIndex) {
    const grossIncome = parseFloat(grossIncomeInput.value);
    const tenure = parseInt(tenureInput.value);
    const interestRate = parseFloat(interestRateInput.value);
    const otherEmis = parseFloat(otherEmisInput.value);
    
    const loanAmount = currentCalculationData.maxLoanAmount;
    const monthlyRate = interestRate / 12 / 100;
    const totalMonths = tenure * 12;
    const emi = currentCalculationData.monthlyEmi;
    
    const monthlyData = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Calculate remaining balance at the start of this year
    let remainingBalance = loanAmount;
    const monthsBeforeThisYear = yearIndex * 12;
    
    for (let i = 0; i < monthsBeforeThisYear; i++) {
        if (remainingBalance <= 0) break;
        const interestPayment = remainingBalance * monthlyRate;
        const principalPayment = Math.min(emi - interestPayment, remainingBalance);
        remainingBalance -= principalPayment;
    }
    
    // Generate monthly data for this year
    const monthsInYear = Math.min(12, totalMonths - monthsBeforeThisYear);
    
    for (let month = 0; month < monthsInYear; month++) {
        if (remainingBalance <= 0) break;
        
        const interestPayment = remainingBalance * monthlyRate;
        const principalPayment = Math.min(emi - interestPayment, remainingBalance);
        
        const monthlyOtherEmis = otherEmis;
        const totalMonthlyPayment = emi + monthlyOtherEmis;
        const monthlyGrossIncome = grossIncome;
        const foirPercentage = (totalMonthlyPayment / monthlyGrossIncome) * 100;
        
        remainingBalance -= principalPayment;
        
        monthlyData.push({
            month: `${monthNames[month]} ${yearData.year}`,
            principal: Math.round(principalPayment),
            interest: Math.round(interestPayment),
            monthlyEmi: Math.round(emi),
            otherEmis: Math.round(monthlyOtherEmis),
            totalMonthlyPayment: Math.round(totalMonthlyPayment),
            balance: Math.round(Math.max(0, remainingBalance)),
            foirPercentage: Math.round(foirPercentage * 100) / 100
        });
    }
    
    return monthlyData;
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function formatNumber(number) {
    return new Intl.NumberFormat('en-IN').format(Math.round(number));
}

function formatLakhCrore(amount) {
    if (amount >= 10000000) {
        return '₹' + (amount / 10000000).toFixed(1) + 'Cr';
    } else if (amount >= 100000) {
        return '₹' + (amount / 100000).toFixed(1) + 'L';
    } else if (amount >= 1000) {
        return '₹' + (amount / 1000).toFixed(1) + 'K';
    } else {
        return '₹' + amount.toFixed(0);
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Download functions
function downloadPDF() {
    if (!currentCalculationData) {
        showAlert('Please calculate loan eligibility first', 'warning');
        return;
    }

    try {
        const grossIncome = parseFloat(grossIncomeInput.value);
        const tenure = parseInt(tenureInput.value);
        const interestRate = parseFloat(interestRateInput.value);
        const otherEmis = parseFloat(otherEmisInput.value);

        const content = generatePDFContent(grossIncome, tenure, interestRate, otherEmis);
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Home_Loan_Eligibility_Report_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showAlert('PDF report downloaded successfully!', 'success');
    } catch (error) {
        console.error('PDF download error:', error);
        showAlert('Error downloading PDF. Please try again.', 'error');
    }
}

function downloadExcel() {
    if (!currentCalculationData) {
        showAlert('Please calculate loan eligibility first', 'warning');
        return;
    }

    try {
        const csvContent = generateCSVContent();
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Home_Loan_Eligibility_Data_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showAlert('Excel file downloaded successfully!', 'success');
    } catch (error) {
        console.error('Excel download error:', error);
        showAlert('Error downloading Excel file. Please try again.', 'error');
    }
}

function shareCalculation() {
    if (!currentCalculationData) {
        showAlert('Please calculate loan eligibility first', 'warning');
        return;
    }

    try {
        const currentUrl = new URL(window.location);
        currentUrl.searchParams.set('grossIncome', grossIncomeInput.value);
        currentUrl.searchParams.set('tenure', tenureInput.value);
        currentUrl.searchParams.set('interestRate', interestRateInput.value);
        currentUrl.searchParams.set('otherEmis', otherEmisInput.value);
        currentUrl.searchParams.set('emiScheme', currentEmiScheme);

        // Try modern clipboard API first
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(currentUrl.toString()).then(() => {
                showAlert('Share link copied to clipboard!', 'success');
            }).catch(() => {
                fallbackCopyToClipboard(currentUrl.toString());
            });
        } else {
            fallbackCopyToClipboard(currentUrl.toString());
        }
    } catch (error) {
        console.error('Share error:', error);
        showAlert('Error creating share link. Please try again.', 'error');
    }
}

function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showAlert('Share link copied to clipboard!', 'success');
        } else {
            prompt('Copy this share link:', text);
        }
    } catch (err) {
        prompt('Copy this share link:', text);
    } finally {
        document.body.removeChild(textArea);
    }
}

function showAlert(message, type = 'info') {
    // Remove any existing alerts
    const existingAlert = document.querySelector('.custom-alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    // Create alert element
    const alert = document.createElement('div');
    alert.className = `custom-alert custom-alert-${type}`;
    alert.innerHTML = `
        <span class="alert-message">${message}</span>
        <button class="alert-close" onclick="this.parentElement.remove()">×</button>
    `;

    // Add styles
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 300px;
        animation: slideIn 0.3s ease-out;
    `;

    // Set background color based on type
    const colors = {
        'success': '#10b981',
        'error': '#ef4444',
        'warning': '#f59e0b',
        'info': '#3b82f6'
    };
    alert.style.backgroundColor = colors[type] || colors.info;

    // Style the close button
    const closeBtn = alert.querySelector('.alert-close');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        margin-left: auto;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s;
    `;

    closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.backgroundColor = 'rgba(255,255,255,0.2)';
    });

    closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.backgroundColor = 'transparent';
    });

    // Add animation keyframes if not already added
    if (!document.querySelector('#alert-animations')) {
        const style = document.createElement('style');
        style.id = 'alert-animations';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(alert);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alert.parentElement) {
            alert.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => alert.remove(), 300);
        }
    }, 5000);
}

function generatePDFContent(grossIncome, tenure, interestRate, otherEmis) {
    const data = currentCalculationData;
    const totalEmiOverTenure = data.monthlyEmi * tenure * 12;
    const totalOtherEmisOverTenure = otherEmis * tenure * 12;
    
    let content = `HOME LOAN ELIGIBILITY CALCULATION REPORT
==========================================

Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}

INPUT PARAMETERS:
================
• Gross Monthly Income      : ${formatCurrency(grossIncome)}
• Loan Tenure              : ${tenure} years (${tenure * 12} months)
• Interest Rate            : ${interestRate}% per annum
• Other Monthly EMIs       : ${formatCurrency(otherEmis)}
• EMI Payment Scheme       : ${currentEmiScheme === 'advance' ? 'EMI in Advance' : 'EMI in Arrears'}

CALCULATED RESULTS:
==================
• Maximum Loan Eligibility : ${formatCurrency(data.maxLoanAmount)}
• Monthly EMI Amount       : ${formatCurrency(data.monthlyEmi)}
• FOIR Ratio              : ${data.foirRatio}% (Fixed Obligation to Income Ratio)
• Available Income for EMI : ${formatCurrency(data.availableIncome)}
• Total Interest Payable   : ${formatCurrency(data.totalInterest)}
• Total Amount Payable     : ${formatCurrency(data.totalAmount)}

FINANCIAL BREAKDOWN:
===================
• Principal Amount         : ${formatCurrency(data.maxLoanAmount)}
• Total Interest Cost      : ${formatCurrency(data.totalInterest)}
• Interest as % of Principal: ${((data.totalInterest / data.maxLoanAmount) * 100).toFixed(1)}%
• Total EMI Payments       : ${formatCurrency(totalEmiOverTenure)}
• Total Other EMI Payments : ${formatCurrency(totalOtherEmisOverTenure)}
• Total Financial Outflow  : ${formatCurrency(totalEmiOverTenure + totalOtherEmisOverTenure)}

YEARLY PAYMENT SCHEDULE:
=======================
Year | Principal | Interest | Monthly EMI | Other EMIs | Annual Total | Balance | FOIR%
-----|-----------|----------|-------------|------------|--------------|---------|------\n`;

    data.yearlySchedule.forEach(row => {
        content += `${row.year.toString().padEnd(4)} | ${formatCurrency(row.principal).padEnd(9)} | ${formatCurrency(row.interest).padEnd(8)} | ${formatCurrency(row.monthlyEmi).padEnd(11)} | ${formatCurrency(row.otherEmis).padEnd(10)} | ${formatCurrency(row.totalAnnualPayment).padEnd(12)} | ${formatCurrency(row.balance).padEnd(7)} | ${row.foirPercentage}%\n`;
    });

    content += `\nIMPORTANT NOTES:
================
• FOIR (Fixed Obligation to Income Ratio) is calculated as total monthly obligations divided by gross monthly income
• This calculation assumes a fixed interest rate throughout the loan tenure
• Actual loan eligibility may vary based on bank policies, credit score, and other factors
• Consider inflation and potential income changes when making financial decisions
• This is an estimate for planning purposes only

Generated by Home Loan Eligibility Calculator
URL: ${window.location.href}`;

    return content;
}

function generateCSVContent() {
    const data = currentCalculationData;
    const grossIncome = parseFloat(grossIncomeInput.value);
    const tenure = parseInt(tenureInput.value);
    const interestRate = parseFloat(interestRateInput.value);
    const otherEmis = parseFloat(otherEmisInput.value);
    
    let csv = `"Home Loan Eligibility Calculation Report"\n`;
    csv += `"Generated on","${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}"\n\n`;
    
    csv += `"INPUT PARAMETERS"\n`;
    csv += `"Gross Monthly Income","${grossIncome}"\n`;
    csv += `"Loan Tenure (Years)","${tenure}"\n`;
    csv += `"Interest Rate (%)","${interestRate}"\n`;
    csv += `"Other Monthly EMIs","${otherEmis}"\n`;
    csv += `"EMI Scheme","${currentEmiScheme === 'advance' ? 'EMI in Advance' : 'EMI in Arrears'}"\n\n`;
    
    csv += `"CALCULATED RESULTS"\n`;
    csv += `"Maximum Loan Eligibility","${data.maxLoanAmount}"\n`;
    csv += `"Monthly EMI","${data.monthlyEmi}"\n`;
    csv += `"FOIR Ratio (%)","${data.foirRatio}"\n`;
    csv += `"Available Income for EMI","${data.availableIncome}"\n`;
    csv += `"Total Interest Payable","${data.totalInterest}"\n`;
    csv += `"Total Amount Payable","${data.totalAmount}"\n\n`;
    
    csv += `"YEARLY PAYMENT SCHEDULE"\n`;
    csv += `"Year","Principal","Interest","Monthly EMI","Other EMIs","Total Annual Payment","Remaining Balance","FOIR %"\n`;
    
    data.yearlySchedule.forEach(row => {
        csv += `"${row.year}","${row.principal}","${row.interest}","${row.monthlyEmi}","${row.otherEmis}","${row.totalAnnualPayment}","${row.balance}","${row.foirPercentage}"\n`;
    });
    
    csv += `\n"Note: This is an estimate for planning purposes only. Actual loan terms may vary."`;
    
    return csv;
}

// Load URL parameters on page load
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('grossIncome')) grossIncomeInput.value = urlParams.get('grossIncome');
    if (urlParams.get('tenure')) tenureInput.value = urlParams.get('tenure');
    if (urlParams.get('interestRate')) interestRateInput.value = urlParams.get('interestRate');
    if (urlParams.get('otherEmis')) otherEmisInput.value = urlParams.get('otherEmis');
    if (urlParams.get('emiScheme')) switchEmiScheme(urlParams.get('emiScheme'));
    
    // Sync sliders with inputs
    grossIncomeSlider.value = grossIncomeInput.value;
    tenureSlider.value = tenureInput.value;
    interestRateSlider.value = interestRateInput.value;
    otherEmisSlider.value = otherEmisInput.value;
}); 

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
