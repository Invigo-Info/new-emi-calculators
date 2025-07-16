// Global variables
let yearlyPaymentChart = null;
let paymentBreakupChart = null;
let currentLoanType = 'home';
let currentCalculationData = null;

// Global variables for tenure
let currentTenureType = 'month'; // 'month' or 'year'

// DOM Elements
const loanTabs = document.querySelectorAll('.tab-button');
const loanAmountInput = document.getElementById('loanAmount');
const loanAmountSlider = document.getElementById('loanAmountSlider');
const loanAmountLabel = document.getElementById('loanAmountLabel');
const interestRateInput = document.getElementById('interestRate');
const interestRateSlider = document.getElementById('interestRateSlider');
const tenureValueInput = document.getElementById('tenureValue');
const tenureSlider = document.getElementById('tenureSlider');
const tenureLabels = document.getElementById('tenureLabels');
const yearTab = document.getElementById('yearTab');
const monthTab = document.getElementById('monthTab');
const emiSchemeGroup = document.getElementById('emiSchemeGroup');
const emiAmountElement = document.getElementById('emiAmount');
const totalInterestElement = document.getElementById('totalInterest');
const totalPaymentElement = document.getElementById('totalPayment');
const startMonthInput = document.getElementById('startMonth');

// Loan type configurations
const loanConfigs = {
    home: {
        label: 'Home Loan Amount',
        maxAmount: 20000000,
        defaultAmount: 2500000,
        showEmiScheme: false
    },
    personal: {
        label: 'Personal Loan Amount',
        maxAmount: 5000000,
        defaultAmount: 500000,
        showEmiScheme: false
    },
    car: {
        label: 'Car Loan Amount',
        maxAmount: 5000000,
        defaultAmount: 800000,
        showEmiScheme: true
    }
};

// Mega Menu Functionality
function initMegaMenu() {
    const megaMenuContainers = document.querySelectorAll('.mega-menu-container');
    
    megaMenuContainers.forEach(container => {
        const trigger = container.querySelector('.mega-menu-trigger');
        const megaMenu = container.querySelector('.mega-menu');
        let hoverTimeout;
        
        // Mouse enter events
        container.addEventListener('mouseenter', () => {
            clearTimeout(hoverTimeout);
            megaMenu.style.display = 'block';
            // Force reflow
            megaMenu.offsetHeight;
            megaMenu.style.opacity = '1';
            megaMenu.style.visibility = 'visible';
        });
        
        // Mouse leave events
        container.addEventListener('mouseleave', () => {
            hoverTimeout = setTimeout(() => {
                megaMenu.style.opacity = '0';
                megaMenu.style.visibility = 'hidden';
                setTimeout(() => {
                    if (megaMenu.style.opacity === '0') {
                        megaMenu.style.display = 'none';
                    }
                }, 300);
            }, 100);
        });
        
        // Prevent menu from closing when clicking inside
        megaMenu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // Close mega menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                megaMenu.style.opacity = '0';
                megaMenu.style.visibility = 'hidden';
                setTimeout(() => {
                    if (megaMenu.style.opacity === '0') {
                        megaMenu.style.display = 'none';
                    }
                }, 300);
            }
        });
        
        // Keyboard navigation
        trigger.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const isVisible = megaMenu.style.visibility === 'visible';
                if (isVisible) {
                    megaMenu.style.opacity = '0';
                    megaMenu.style.visibility = 'hidden';
                } else {
                    megaMenu.style.display = 'block';
                    megaMenu.style.opacity = '1';
                    megaMenu.style.visibility = 'visible';
                }
            }
            
            if (e.key === 'Escape') {
                megaMenu.style.opacity = '0';
                megaMenu.style.visibility = 'hidden';
                trigger.focus();
            }
        });
    });
}

// Mobile responsive mega menu
function handleMobileMenu() {
    const isMobile = window.innerWidth <= 768;
    const megaMenus = document.querySelectorAll('.mega-menu');
    
    if (isMobile) {
        megaMenus.forEach(menu => {
            menu.style.position = 'static';
            menu.style.transform = 'none';
            menu.style.width = '100%';
            menu.style.maxWidth = 'none';
            menu.style.minWidth = 'auto';
            menu.style.left = 'auto';
            menu.style.marginLeft = '0';
        });
    } else {
        megaMenus.forEach(menu => {
            menu.style.position = 'absolute';
            menu.style.transform = '';
            menu.style.width = '';
            menu.style.maxWidth = '';
            menu.style.minWidth = '';
            menu.style.left = '';
            menu.style.marginLeft = '';
        });
    }
}

// Initialize the calculator
document.addEventListener('DOMContentLoaded', function() {
    // Initialize mega menu
    initMegaMenu();
    handleMobileMenu();
    
    // Initialize calculator
    initializeEventListeners();
    setCurrentMonthYear();
    switchLoanType('home');
    // Small delay to ensure DOM is fully loaded
    setTimeout(calculateEMI, 100);
    
    // Handle resize for mega menu
    window.addEventListener('resize', handleMobileMenu);
});

function initializeEventListeners() {
    // Create debounced calculation function
    const debouncedCalculateEMI = debounce(calculateEMI, 300);

    // Tab switching
    loanTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const loanType = this.dataset.loan;
            switchLoanType(loanType);
        });
    });

    // Input synchronization with debounced calculation
    loanAmountInput.addEventListener('input', function() {
        loanAmountSlider.value = this.value;
        debouncedCalculateEMI();
    });

    loanAmountSlider.addEventListener('input', function() {
        loanAmountInput.value = this.value;
        debouncedCalculateEMI();
    });

    interestRateInput.addEventListener('input', function() {
        interestRateSlider.value = this.value;
        debouncedCalculateEMI();
    });

    interestRateSlider.addEventListener('input', function() {
        interestRateInput.value = this.value;
        debouncedCalculateEMI();
    });

    tenureValueInput.addEventListener('input', function() {
        tenureSlider.value = this.value;
        debouncedCalculateEMI();
    });

    tenureSlider.addEventListener('input', function() {
        tenureValueInput.value = this.value;
        debouncedCalculateEMI();
    });

    // Start month change
    startMonthInput.addEventListener('change', debouncedCalculateEMI);

    // EMI scheme radio buttons
    document.querySelectorAll('input[name="emiScheme"]').forEach(radio => {
        radio.addEventListener('change', calculateEMI);
    });

    // Download button event listeners
    document.getElementById('downloadPDF').addEventListener('click', downloadPDF);
    document.getElementById('downloadExcel').addEventListener('click', downloadExcel);
    document.getElementById('shareCalculation').addEventListener('click', shareCalculation);

    // Tenure tab event listeners
    yearTab.addEventListener('click', () => switchTenureType('year'));
    monthTab.addEventListener('click', () => switchTenureType('month'));
}

function switchLoanType(loanType) {
    currentLoanType = loanType;
    const config = loanConfigs[loanType];

    // Update active tab
    loanTabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.loan === loanType) {
            tab.classList.add('active');
        }
    });

    // Update loan amount settings
    loanAmountLabel.textContent = config.label;
    loanAmountInput.max = config.maxAmount;
    loanAmountSlider.max = config.maxAmount;
    loanAmountInput.value = config.defaultAmount;
    loanAmountSlider.value = config.defaultAmount;

    // Show/hide EMI scheme
    emiSchemeGroup.style.display = config.showEmiScheme ? 'block' : 'none';

    // Update slider labels based on max amount
    updateSliderLabels();
    calculateEMI();
}

function updateSliderLabels() {
    const maxAmount = parseInt(loanAmountSlider.max);
    const labels = document.querySelector('.slider-labels');
    const spans = labels.querySelectorAll('span');
    
    // For loan amount slider, use fixed labels regardless of loan type
    if (loanAmountSlider.closest('.input-group').querySelector('#loanAmount')) {
        // Fixed labels for loan amount: 0, 25L, 50L, 75L, 100L, 125L, 150L, 175L, 200L
        const fixedLabels = ['0', '25L', '50L', '75L', '100L', '125L', '150L', '175L', '200L'];
        spans.forEach((span, index) => {
            if (fixedLabels[index]) {
                span.textContent = fixedLabels[index];
            }
        });
    }
    // Note: Interest Rate and Loan Tenure sliders now have fixed HTML labels, 
    // so no JavaScript updates needed for them
}

function formatLakhCrore(amount) {
    if (amount >= 10000000) {
        return Math.round(amount / 10000000) + 'Cr';
    } else if (amount >= 100000) {
        return Math.round(amount / 100000) + 'L';
    } else {
        return Math.round(amount / 1000) + 'K';
    }
}

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

// Flags to prevent multiple simultaneous operations
let isCalculating = false;
let isUpdatingCharts = false;

async function calculateEMI() {
    // Prevent multiple simultaneous calculations
    if (isCalculating) {
        return;
    }

    const principal = parseFloat(loanAmountInput.value);
    const rate = parseFloat(interestRateInput.value);
    const tenureValue = parseInt(tenureValueInput.value) || 0;
    const emiSchemeElement = document.querySelector('input[name="emiScheme"]:checked');
    const emiAdvance = currentLoanType === 'car' && emiSchemeElement && emiSchemeElement.value === 'advance';

    // Get start year from month picker
    const startYear = startMonthInput.value ? new Date(startMonthInput.value).getFullYear() : new Date().getFullYear();
    const startMonth = startMonthInput.value ? new Date(startMonthInput.value).getMonth() + 1 : new Date().getMonth() + 1;

    // Calculate tenure in years and months based on current mode
    let tenureYears, tenureMonths;
    if (currentTenureType === 'year') {
        tenureYears = tenureValue;
        tenureMonths = 0;
    } else {
        tenureYears = Math.floor(tenureValue / 12);
        tenureMonths = tenureValue % 12;
    }

    // Calculate total months for validation
    const totalMonths = (tenureYears * 12) + tenureMonths;

    // Validate inputs
    if (!principal || principal <= 0 || !rate || rate <= 0 || totalMonths <= 0) {
        // Set default values to prevent empty display
        updateResults({
            emi: 0,
            totalInterest: 0,
            totalAmount: principal || 0,
            loanAmount: principal || 0,
            yearlyPaymentSchedule: []
        });
        return;
    }

    isCalculating = true;

    try {
        const response = await fetch('/calculate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                loanAmount: principal,
                interestRate: rate,
                tenureYears: tenureYears,
                tenureMonths: tenureMonths,
                loanType: currentLoanType,
                emiAdvance: emiAdvance,
                startYear: startYear,
                startMonth: startMonth
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
        updateYearlyPaymentSchedule(data);

    } catch (error) {
        console.error('Error calculating EMI:', error);
        // Show user-friendly error in console
        console.log('Please check if the Flask server is running on http://localhost:5000');
    } finally {
        isCalculating = false;
    }
}

function updateResults(data) {
    emiAmountElement.textContent = formatCurrency(data.emi);
    totalInterestElement.textContent = formatCurrency(data.totalInterest);
    totalPaymentElement.textContent = formatCurrency(data.totalAmount);
    
    // Store current calculation data for downloads
    currentCalculationData = data;
    
    // Update payment schedule table
    updatePaymentScheduleTable(data.yearlyPaymentSchedule);
    
    // Update pie chart with correct data structure
    const chartData = {
        principal: data.loanAmount,
        total_interest: data.totalInterest,
        total_payment: data.totalAmount
    };
    updatePaymentBreakupChart(chartData);
    
    // Update yearly chart
    const yearlyData = {
        yearly_summary: data.yearlyPaymentSchedule,
        principal: data.loanAmount
    };
    updateYearlyPaymentSchedule(yearlyData);
}

function updatePaymentScheduleTable(yearlySchedule) {
    const tableBody = document.getElementById('paymentScheduleTableBody');
    if (!tableBody || !yearlySchedule) return;
    
    tableBody.innerHTML = '';
    
    yearlySchedule.forEach((yearData, index) => {
        const row = document.createElement('tr');
        row.className = 'expandable';
        row.dataset.year = yearData.year;
        
        row.innerHTML = `
            <td class="year-cell">
                <div class="expand-icon" onclick="toggleYearDetails(${yearData.year})">+</div>
                ${yearData.year}
            </td>
            <td>₹${formatNumber(yearData.principal)}</td>
            <td>₹${formatNumber(yearData.interest)}</td>
            <td>₹${formatNumber(yearData.total_payment)}</td>
            <td>₹${formatNumber(yearData.balance)}</td>
            <td class="loan-paid-percentage">${yearData.loan_paid_percentage.toFixed(2)}%</td>
        `;
        
        tableBody.appendChild(row);
        
        // Add monthly details row (initially hidden)
        const detailsRow = document.createElement('tr');
        detailsRow.className = 'monthly-details';
        detailsRow.id = `details-${yearData.year}`;
        
        // Generate monthly breakdown table
        let monthlyTableHTML = '';
        if (yearData.monthly_data && yearData.monthly_data.length > 0) {
            monthlyTableHTML = `
                <table class="monthly-table">
                    <tbody>
            `;
            
            yearData.monthly_data.forEach(monthData => {
                monthlyTableHTML += `
                    <tr>
                        <td style="background: #f8fafc; font-weight: 600;">${monthData.month}</td>
                        <td>₹${formatNumber(monthData.principal)}</td>
                        <td>₹${formatNumber(monthData.interest)}</td>
                        <td>₹${formatNumber(monthData.total_payment)}</td>
                        <td>₹${formatNumber(monthData.balance)}</td>
                        <td class="loan-paid-percentage">${monthData.loan_paid_percentage.toFixed(2)}%</td>
                    </tr>
                `;
            });
            
            monthlyTableHTML += `
                    </tbody>
                </table>
            `;
        }
        
        detailsRow.innerHTML = `
            <td colspan="6" style="padding: 0;">
                ${monthlyTableHTML}
            </td>
        `;
        
        tableBody.appendChild(detailsRow);
    });
}

function toggleYearDetails(year) {
    const detailsRow = document.getElementById(`details-${year}`);
    const expandIcon = document.querySelector(`[data-year="${year}"] .expand-icon`);
    
    if (detailsRow && expandIcon) {
        const isExpanded = detailsRow.classList.contains('show');
        
        if (isExpanded) {
            detailsRow.classList.remove('show');
            expandIcon.textContent = '+';
            expandIcon.classList.remove('expanded');
        } else {
            detailsRow.classList.add('show');
            expandIcon.textContent = '−';
            expandIcon.classList.add('expanded');
        }
    }
}

function downloadPDF() {
    if (!currentCalculationData) {
        alert('Please calculate EMI first');
        return;
    }
    
    // Create a simple PDF download link or trigger server-side PDF generation
    const principal = parseFloat(loanAmountInput.value);
    const rate = parseFloat(interestRateInput.value);
    const tenure = parseInt(tenureValueInput.value);
    
    const content = generatePDFContent();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EMI_Schedule_${currentLoanType}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function downloadExcel() {
    if (!currentCalculationData) {
        alert('Please calculate EMI first');
        return;
    }
    
    const csvContent = generateCSVContent();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EMI_Schedule_${currentLoanType}_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function shareCalculation() {
    if (!currentCalculationData) {
        alert('Please calculate EMI first');
        return;
    }
    
    const shareData = {
        principal: loanAmountInput.value,
        rate: interestRateInput.value,
        tenure_value: tenureValueInput.value,
        loan_type: currentLoanType,
        emi_advance: document.querySelector('input[name="emiScheme"]:checked')?.value === 'advance'
    };
    
    const shareUrl = `${window.location.origin}${window.location.pathname}?` + 
                    Object.entries(shareData).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&');
    
    if (navigator.share) {
        navigator.share({
            title: 'EMI Calculator Results',
            text: `Check out my EMI calculation: ₹${formatNumber(currentCalculationData.emi)} monthly EMI`,
            url: shareUrl
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('Calculation link copied to clipboard!');
        }).catch(() => {
            prompt('Copy this link to share your calculation:', shareUrl);
        });
    }
}

function generatePDFContent() {
    let content = `EMI CALCULATION REPORT\n`;
    content += `======================\n\n`;
    content += `Loan Type: ${currentLoanType.toUpperCase()}\n`;
    content += `Principal Amount: ₹${formatNumber(parseFloat(loanAmountInput.value))}\n`;
    content += `Interest Rate: ${interestRateInput.value}% per annum\n`;
    content += `Loan Tenure: ${tenureValueInput.value} months\n\n`;
    content += `RESULTS:\n`;
    content += `--------\n`;
    content += `Monthly EMI: ₹${formatNumber(currentCalculationData.emi)}\n`;
    content += `Total Interest: ₹${formatNumber(currentCalculationData.total_interest)}\n`;
    content += `Total Payment: ₹${formatNumber(currentCalculationData.total_payment)}\n\n`;
    
    if (currentCalculationData.yearly_payment_schedule) {
        content += `YEARLY PAYMENT SCHEDULE:\n`;
        content += `Year\tPrincipal\tInterest\tTotal Payment\tBalance\tLoan Paid\n`;
        currentCalculationData.yearly_payment_schedule.forEach(year => {
            content += `${year.year}\t₹${formatNumber(year.principal)}\t₹${formatNumber(year.interest)}\t₹${formatNumber(year.total_payment)}\t₹${formatNumber(year.balance)}\t${year.loan_paid_percentage.toFixed(2)}%\n`;
        });
    }
    
    return content;
}

function generateCSVContent() {
    let csv = 'Year,Principal (₹),Interest (₹),Total Payment (₹),Balance (₹),Loan Paid (%)\n';
    
    if (currentCalculationData.yearly_payment_schedule) {
        currentCalculationData.yearly_payment_schedule.forEach(year => {
            csv += `${year.year},${year.principal},${year.interest},${year.total_payment},${year.balance},${year.loan_paid_percentage.toFixed(2)}\n`;
        });
    }
    
    return csv;
}

// Yearly Payment Schedule Functions
function updateYearlyPaymentSchedule(data) {
    if (!data || !data.yearly_summary) return;
    
    updateYearlyPaymentChart(data);
}

function updateYearlyPaymentChart(data) {
    try {
        const chartContainer = document.querySelector('.yearly-chart-container');
        if (!chartContainer) return;
        
        let canvas = document.getElementById('yearlyPaymentChart');
        if (canvas && yearlyPaymentChart) {
            yearlyPaymentChart.destroy();
            yearlyPaymentChart = null;
            canvas.remove();
        }
        
        // Create new canvas
        canvas = document.createElement('canvas');
        canvas.id = 'yearlyPaymentChart';
        chartContainer.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        
        if (!data.yearly_summary || data.yearly_summary.length === 0) return;

        // Get start year from month picker
        const startMonth = document.getElementById('startMonth').value;
        const startYear = parseInt(startMonth.split('-')[0]);
        
        // Prepare data - ensure all years are shown clearly
        const allYears = data.yearly_summary.map((item) => item.year);
        const principalData = data.yearly_summary.map(item => item.principal);
        const interestData = data.yearly_summary.map(item => item.interest);
        
        // Use balance data directly from the schedule
        const balanceData = data.yearly_summary.map(item => item.balance);

        // Show all years clearly on X-axis (no hiding)
        const years = allYears;

        yearlyPaymentChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: years,
                datasets: [
                    {
                        label: 'Principal',
                        data: principalData,
                        backgroundColor: '#4ade80',
                        borderColor: '#22c55e',
                        borderWidth: 0,
                        borderRadius: {
                            topLeft: 0,
                            topRight: 0,
                            bottomLeft: 4,
                            bottomRight: 4
                        },
                        borderSkipped: false,
                        yAxisID: 'y',
                        order: 2,
                        barThickness: 'flex',
                        maxBarThickness: 40
                    },
                    {
                        label: 'Interest',
                        data: interestData,
                        backgroundColor: '#fb923c',
                        borderColor: '#f97316',
                        borderWidth: 0,
                        borderRadius: {
                            topLeft: 4,
                            topRight: 4,
                            bottomLeft: 0,
                            bottomRight: 0
                        },
                        borderSkipped: false,
                        yAxisID: 'y',
                        order: 2,
                        barThickness: 'flex',
                        maxBarThickness: 40
                    },
                    {
                        label: 'Balance',
                        data: balanceData,
                        type: 'line',
                        borderColor: '#e91e63',
                        backgroundColor: 'transparent',
                        borderWidth: 3,
                        pointBackgroundColor: '#e91e63',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        tension: 0.3,
                        yAxisID: 'y1',
                        order: 1,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1200,
                    easing: 'easeInOutQuart'
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                layout: {
                    padding: {
                        top: 30,
                        right: 40,
                        bottom: 40,
                        left: 30
                    }
                },
                elements: {
                    bar: {
                        borderWidth: 0,
                        borderSkipped: false
                    },
                    point: {
                        hoverBorderWidth: 3
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        grid: {
                            display: false,
                            drawBorder: false
                        },
                        ticks: {
                            maxRotation: 0,
                            color: '#374151',
                            font: {
                                size: 13,
                                weight: '700'
                            },
                            padding: 12,
                            autoSkip: false,
                            maxTicksLimit: 30,
                            callback: function(value, index) {
                                // Show all years clearly
                                const year = this.getLabelForValue(value);
                                return year;
                            }
                        },
                        border: {
                            display: false
                        },
                        title: {
                            display: true,
                            text: 'Years',
                            color: '#1f2937',
                            font: {
                                size: 16,
                                weight: '700'
                            },
                            padding: {
                                top: 15
                            }
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        stacked: true,
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'EMI Payment / Year',
                            color: '#4b5563',
                            font: {
                                size: 14,
                                weight: '600'
                            }
                        },
                        ticks: {
                            callback: function(value) {
                                return '₹' + formatLakhCrore(value);
                            },
                            color: '#6b7280',
                            font: {
                                size: 11,
                                weight: '500'
                            },
                            padding: 10
                        },
                        grid: {
                            color: '#e5e7eb',
                            lineWidth: 1,
                            drawBorder: false
                        },
                        border: {
                            display: false
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Balance',
                            color: '#4b5563',
                            font: {
                                size: 14,
                                weight: '600'
                            }
                        },
                        ticks: {
                            callback: function(value) {
                                return '₹' + formatLakhCrore(value);
                            },
                            color: '#6b7280',
                            font: {
                                size: 11,
                                weight: '500'
                            },
                            padding: 10
                        },
                        grid: {
                            drawOnChartArea: false,
                            drawBorder: false
                        },
                        border: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 25,
                            usePointStyle: true,
                            pointStyle: 'rect',
                            font: {
                                size: 13,
                                weight: '600',
                                family: 'Inter, sans-serif'
                            },
                            color: '#374151',
                            boxWidth: 14,
                            boxHeight: 14
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#374151',
                        borderWidth: 1,
                        cornerRadius: 10,
                        caretPadding: 10,
                        displayColors: true,
                        titleFont: {
                            size: 14,
                            weight: '600'
                        },
                        bodyFont: {
                            size: 13,
                            weight: '500'
                        },
                        callbacks: {
                            title: function(context) {
                                return `Year ${context[0].label}`;
                            },
                            label: function(context) {
                                const label = context.dataset.label;
                                const value = formatCurrency(context.parsed.y);
                                return `${label}: ${value}`;
                            },
                            afterBody: function(context) {
                                if (context.length > 1) {
                                    const principal = context.find(item => item.dataset.label === 'Principal');
                                    const interest = context.find(item => item.dataset.label === 'Interest');
                                    if (principal && interest) {
                                        const total = principal.parsed.y + interest.parsed.y;
                                        return [``, `Total EMI: ${formatCurrency(total)}`];
                                    }
                                }
                                return [];
                            }
                        }
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('Error updating yearly payment chart:', error);
    }
}

// Event listeners for yearly schedule controls
document.addEventListener('DOMContentLoaded', function() {
    const scheduleViewSelect = document.getElementById('scheduleView');
    
    if (scheduleViewSelect) {
        scheduleViewSelect.addEventListener('change', function() {
            // Recalculate when view type changes
            calculateEMI();
        });
    }
});

// Utility function to debounce input events
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

function setCurrentMonthYear() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // getMonth() returns 0-11, so add 1
    const currentMonthYear = `${year}-${month}`;
    
    if (startMonthInput) {
        startMonthInput.value = currentMonthYear;
    }
}

function switchTenureType(type) {
    currentTenureType = type;
    
    // Update active tab
    yearTab.classList.toggle('active', type === 'year');
    monthTab.classList.toggle('active', type === 'month');
    
    if (type === 'month') {
        // Month mode: 0-360 months
        tenureSlider.min = 1;
        tenureSlider.max = 360;
        tenureSlider.step = 1;
        tenureValueInput.min = 1;
        tenureValueInput.max = 360;
        
        // Update slider value if it's in year format
        if (tenureValueInput.value <= 30) {
            tenureValueInput.value = tenureValueInput.value * 12;
            tenureSlider.value = tenureValueInput.value;
        }
        
        // Update labels for months
        updateTenureLabels(['0', '60', '120', '180', '240', '300', '360']);
        
    } else {
        // Year mode: 0-30 years
        tenureSlider.min = 1;
        tenureSlider.max = 30;
        tenureSlider.step = 1;
        tenureValueInput.min = 1;
        tenureValueInput.max = 30;
        
        // Update slider value if it's in month format
        if (tenureValueInput.value > 30) {
            tenureValueInput.value = Math.round(tenureValueInput.value / 12);
            tenureSlider.value = tenureValueInput.value;
        }
        
        // Update labels for years
        updateTenureLabels(['0', '5', '10', '15', '20', '25', '30']);
    }
    
    calculateEMI();
}

function updateTenureLabels(labels) {
    const spans = tenureLabels.querySelectorAll('span');
    labels.forEach((label, index) => {
        if (spans[index]) {
            spans[index].textContent = label;
        }
    });
}

function updatePaymentBreakupChart(data) {
    const ctx = document.getElementById('paymentBreakupChart').getContext('2d');
    
    const principal = data.principal;
    const totalInterest = data.total_interest;
    const totalPayment = principal + totalInterest;
    
    const principalPercentage = ((principal / totalPayment) * 100).toFixed(1);
    const interestPercentage = ((totalInterest / totalPayment) * 100).toFixed(1);
    
    // Destroy existing chart if it exists
    if (paymentBreakupChart) {
        paymentBreakupChart.destroy();
    }
    
    paymentBreakupChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Principal Loan Amount', 'Total Interest'],
            datasets: [{
                data: [principal, totalInterest],
                backgroundColor: ['#22c55e', '#f97316'],
                borderWidth: 0,
                cutout: '0%'
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
                            const percentage = context.dataset.data[context.dataIndex] / totalPayment * 100;
                            return `${label}: ${value} (${percentage.toFixed(1)}%)`;
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
                });
            }
        }]
    });
} 