// Global variables
let paymentBreakupChart;
let paymentScheduleChart;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeCalculator();
    loadFromUrlParams();
    setupEventListeners();
    calculateAndUpdate();
    
    // Test Indian numbering format (for development - can be removed)
    testIndianNumbering();
});

function initializeCalculator() {
    // Set current date for start month
    const now = new Date();
    const currentMonth = now.toISOString().substr(0, 7);
    document.getElementById('startDate').value = currentMonth;
    
    // Set prepayment start dates
    document.getElementById('monthlyPrepaymentStart').value = currentMonth;
    document.getElementById('yearlyPrepaymentStart').value = currentMonth;
}

function loadFromUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // List of all parameters that can be loaded from URL
    const paramMapping = {
        homeValue: 'homeValue',
        downPaymentPercent: 'downPaymentPercent',
        downPaymentAmount: 'downPaymentAmount',
        loanInsurance: 'loanInsurance',
        interestRate: 'interestRate',
        tenureYears: 'tenureYears',
        tenureMonths: 'tenureMonths',
        loanFeesPercent: 'loanFeesPercent',
        loanFeesAmount: 'loanFeesAmount',
        oneTimeExpensesPercent: 'oneTimeExpensesPercent',
        oneTimeExpensesAmount: 'oneTimeExpensesAmount',
        propertyTaxesPercent: 'propertyTaxesPercent',
        propertyTaxesAmount: 'propertyTaxesAmount',
        homeInsurancePercent: 'homeInsurancePercent',
        homeInsuranceAmount: 'homeInsuranceAmount',
        maintenanceExpenses: 'maintenanceExpenses',
        monthlyPrepayment: 'monthlyPrepayment',
        yearlyPrepayment: 'yearlyPrepayment',
        quarterlyPrepayment: 'quarterlyPrepayment',
        onetimePrepayment: 'onetimePrepayment',
        startDate: 'startDate'
    };
    
    // Load values from URL parameters
    Object.keys(paramMapping).forEach(param => {
        const value = urlParams.get(param);
        if (value !== null) {
            const element = document.getElementById(paramMapping[param]);
            if (element) {
                element.value = decodeURIComponent(value);
            }
        }
    });
}

function setupEventListeners() {
    // Input change listeners
    const inputs = [
        'homeValue', 'downPaymentPercent', 'downPaymentAmount', 'loanInsurance',
        'interestRate', 'tenureYears', 'tenureMonths', 'loanFeesPercent', 'loanFeesAmount',
        'oneTimeExpensesPercent', 'oneTimeExpensesAmount', 'propertyTaxesPercent', 'propertyTaxesAmount',
        'homeInsurancePercent', 'homeInsuranceAmount', 'maintenanceExpenses',
        'monthlyPrepayment', 'yearlyPrepayment', 'quarterlyPrepayment', 'onetimePrepayment', 'startDate'
    ];
    
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', handleInputChange);
        }
    });
    
    // Prepayments toggle
    document.getElementById('addPrepaymentsBtn').addEventListener('click', togglePrepayments);
    
    // Download buttons
    document.getElementById('downloadPDF').addEventListener('click', downloadPDF);
    document.getElementById('downloadExcel').addEventListener('click', downloadExcel);
    document.getElementById('shareCalculation').addEventListener('click', shareCalculation);
}

function handleInputChange(event) {
    const id = event.target.id;
    
    // Handle percentage-amount syncing
    if (id === 'downPaymentPercent') {
        syncPercentageToAmount('downPaymentPercent', 'downPaymentAmount', 'homeValue');
    } else if (id === 'downPaymentAmount') {
        syncAmountToPercentage('downPaymentAmount', 'downPaymentPercent', 'homeValue');
    } else if (id === 'loanFeesPercent') {
        syncPercentageToAmount('loanFeesPercent', 'loanFeesAmount', 'loanAmount');
    } else if (id === 'loanFeesAmount') {
        syncAmountToPercentage('loanFeesAmount', 'loanFeesPercent', 'loanAmount');
    } else if (id === 'oneTimeExpensesPercent') {
        syncPercentageToAmount('oneTimeExpensesPercent', 'oneTimeExpensesAmount', 'homeValue');
    } else if (id === 'oneTimeExpensesAmount') {
        syncAmountToPercentage('oneTimeExpensesAmount', 'oneTimeExpensesPercent', 'homeValue');
    } else if (id === 'propertyTaxesPercent') {
        syncPercentageToAmount('propertyTaxesPercent', 'propertyTaxesAmount', 'homeValue');
    } else if (id === 'propertyTaxesAmount') {
        syncAmountToPercentage('propertyTaxesAmount', 'propertyTaxesPercent', 'homeValue');
    } else if (id === 'homeInsurancePercent') {
        syncPercentageToAmount('homeInsurancePercent', 'homeInsuranceAmount', 'homeValue');
    } else if (id === 'homeInsuranceAmount') {
        syncAmountToPercentage('homeInsuranceAmount', 'homeInsurancePercent', 'homeValue');
    }
    
    calculateAndUpdate();
}

function syncPercentageToAmount(percentId, amountId, baseId) {
    const percent = parseFloat(document.getElementById(percentId).value) || 0;
    const base = parseFloat(document.getElementById(baseId).value) || 0;
    const amount = (base * percent) / 100;
    document.getElementById(amountId).value = Math.round(amount);
}

function syncAmountToPercentage(amountId, percentId, baseId) {
    const amount = parseFloat(document.getElementById(amountId).value) || 0;
    const base = parseFloat(document.getElementById(baseId).value) || 0;
    const percent = base > 0 ? (amount / base) * 100 : 0;
    document.getElementById(percentId).value = percent.toFixed(2);
}

function calculateAndUpdate() {
    // Get input values
    const homeValue = parseFloat(document.getElementById('homeValue').value) || 0;
    const downPaymentAmount = parseFloat(document.getElementById('downPaymentAmount').value) || 0;
    const loanInsurance = parseFloat(document.getElementById('loanInsurance').value) || 0;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;
    const tenureYears = parseFloat(document.getElementById('tenureYears').value) || 0;
    const tenureMonths = parseFloat(document.getElementById('tenureMonths').value) || 0;
    const loanFeesAmount = parseFloat(document.getElementById('loanFeesAmount').value) || 0;
    
    const oneTimeExpensesAmount = parseFloat(document.getElementById('oneTimeExpensesAmount').value) || 0;
    const propertyTaxesAmount = parseFloat(document.getElementById('propertyTaxesAmount').value) || 0;
    const homeInsuranceAmount = parseFloat(document.getElementById('homeInsuranceAmount').value) || 0;
    const maintenanceExpenses = parseFloat(document.getElementById('maintenanceExpenses').value) || 0;
    
    const monthlyPrepayment = parseFloat(document.getElementById('monthlyPrepayment').value) || 0;
    const yearlyPrepayment = parseFloat(document.getElementById('yearlyPrepayment').value) || 0;
    const quarterlyPrepayment = parseFloat(document.getElementById('quarterlyPrepayment').value) || 0;
    const onetimePrepayment = parseFloat(document.getElementById('onetimePrepayment').value) || 0;
    
    // Calculate loan amount
    const loanAmount = homeValue + loanInsurance - downPaymentAmount;
    document.getElementById('loanAmount').value = loanAmount;
    
    // Calculate EMI
    const totalMonths = (tenureYears * 12) + tenureMonths;
    const monthlyRate = interestRate / (12 * 100);
    
    let emi = 0;
    if (monthlyRate > 0 && totalMonths > 0) {
        emi = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
              (Math.pow(1 + monthlyRate, totalMonths) - 1);
    }
    
    // Calculate monthly expenses
    const monthlyPropertyTax = propertyTaxesAmount / 12;
    const monthlyHomeInsurance = homeInsuranceAmount / 12;
    const totalMonthlyPayment = emi + monthlyPropertyTax + monthlyHomeInsurance + maintenanceExpenses;
    
    // Calculate total amounts
    const totalDownPayment = downPaymentAmount + loanFeesAmount + oneTimeExpensesAmount;
    const totalInterest = (emi * totalMonths) - loanAmount;
    const totalTaxes = (propertyTaxesAmount + homeInsuranceAmount) * tenureYears + (maintenanceExpenses * totalMonths);
    const grandTotal = totalDownPayment + loanAmount + totalInterest + totalTaxes;
    
    // Update UI
    updateResults(emi, monthlyPrepayment, monthlyPropertyTax, monthlyHomeInsurance, 
                  maintenanceExpenses, totalMonthlyPayment);
    updateSummary(totalDownPayment, loanAmount, 0, totalInterest, totalTaxes, grandTotal);
    updateCharts(totalDownPayment, loanAmount, totalInterest, totalTaxes);
    generatePaymentSchedule(loanAmount, monthlyRate, totalMonths, emi, 
                           monthlyPropertyTax, monthlyHomeInsurance, maintenanceExpenses);
}

function updateResults(emi, extraPayment, propertyTax, homeInsurance, maintenance, total) {
    document.getElementById('emiAmount').textContent = formatCurrency(emi);
    document.getElementById('extraPayment').textContent = formatCurrency(extraPayment);
    document.getElementById('monthlyPropertyTax').textContent = formatCurrency(propertyTax);
    document.getElementById('monthlyHomeInsurance').textContent = formatCurrency(homeInsurance);
    document.getElementById('monthlyMaintenance').textContent = formatCurrency(maintenance);
    document.getElementById('totalMonthlyPayment').textContent = formatCurrency(total);
}

function updateSummary(downPayment, principal, prepayments, interest, taxes, grandTotal) {
    document.getElementById('totalDownPayment').textContent = formatCurrency(downPayment);
    document.getElementById('totalPrincipal').textContent = formatCurrency(principal);
    document.getElementById('totalPrepayments').textContent = formatCurrency(prepayments);
    document.getElementById('totalInterest').textContent = formatCurrency(interest);
    document.getElementById('totalTaxes').textContent = formatCurrency(taxes);
    document.getElementById('grandTotal').textContent = formatCurrency(grandTotal);
}

function updateCharts(downPayment, principal, interest, taxes) {
    updatePieChart(downPayment, principal, interest, taxes);
    updateScheduleChart();
}

function updatePieChart(downPayment, principal, interest, taxes) {
    const ctx = document.getElementById('paymentBreakupChart').getContext('2d');
    
    if (paymentBreakupChart) {
        paymentBreakupChart.destroy();
    }
    
    paymentBreakupChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Down Payment & Fees', 'Principal', 'Interest', 'Taxes & Insurance'],
            datasets: [{
                data: [downPayment, principal, interest, taxes],
                backgroundColor: ['#805ad5', '#38a169', '#dd6b20', '#3182ce'],
                borderWidth: 2,
                borderColor: '#fff'
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
                            return context.label + ': ₹' + context.parsed.toLocaleString('en-IN');
                        }
                    }
                }
            }
        }
    });
}

function updateScheduleChart() {
    const ctx = document.getElementById('paymentScheduleChart').getContext('2d');
    
    if (paymentScheduleChart) {
        paymentScheduleChart.destroy();
    }
    
    // Get calculation data
    const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 0;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;
    const tenureYears = parseFloat(document.getElementById('tenureYears').value) || 0;
    const tenureMonths = parseFloat(document.getElementById('tenureMonths').value) || 0;
    const startDate = new Date(document.getElementById('startDate').value);
    
    const monthlyPropertyTax = parseFloat(document.getElementById('propertyTaxesAmount').value) / 12 || 0;
    const monthlyHomeInsurance = parseFloat(document.getElementById('homeInsuranceAmount').value) / 12 || 0;
    const maintenanceExpenses = parseFloat(document.getElementById('maintenanceExpenses').value) || 0;
    const monthlyPrepayment = parseFloat(document.getElementById('monthlyPrepayment').value) || 0;
    const yearlyPrepayment = parseFloat(document.getElementById('yearlyPrepayment').value) || 0;
    const quarterlyPrepayment = parseFloat(document.getElementById('quarterlyPrepayment').value) || 0;
    const onetimePrepayment = parseFloat(document.getElementById('onetimePrepayment').value) || 0;
    
    const totalMonths = (tenureYears * 12) + tenureMonths;
    const monthlyRate = interestRate / (12 * 100);
    
    let emi = 0;
    if (monthlyRate > 0 && totalMonths > 0) {
        emi = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
              (Math.pow(1 + monthlyRate, totalMonths) - 1);
    }
    
    // Calculate yearly data
    let balance = loanAmount;
    const years = [];
    const principalData = [];
    const interestData = [];
    const prepaymentsData = [];
    const taxesData = [];
    const balanceData = [];
    
    const currentYear = startDate.getFullYear();
    
    for (let year = 0; year < tenureYears; year++) {
        let yearlyPrincipal = 0;
        let yearlyInterest = 0;
        let yearlyPrepayments = 0;
        let yearlyTaxes = (monthlyPropertyTax + monthlyHomeInsurance + maintenanceExpenses) * 12;
        
        const monthsInYear = year === tenureYears - 1 ? (totalMonths % 12) || 12 : 12;
        
        for (let month = 1; month <= monthsInYear; month++) {
            if (balance <= 0) break;
            
            const interestPayment = balance * monthlyRate;
            const principalPayment = Math.min(emi - interestPayment, balance);
            
            yearlyPrincipal += principalPayment;
            yearlyInterest += interestPayment;
            balance -= principalPayment;
            
            // Add prepayments
            if (monthlyPrepayment > 0) {
                const prepayment = Math.min(monthlyPrepayment, balance);
                yearlyPrepayments += prepayment;
                balance -= prepayment;
            }
            
            // Add quarterly prepayment (every 3 months)
            if (quarterlyPrepayment > 0 && month % 3 === 0) {
                const prepayment = Math.min(quarterlyPrepayment, balance);
                yearlyPrepayments += prepayment;
                balance -= prepayment;
            }
        }
        
        // Add yearly prepayment
        if (yearlyPrepayment > 0) {
            const prepayment = Math.min(yearlyPrepayment, balance);
            yearlyPrepayments += prepayment;
            balance -= prepayment;
        }
        
        // Add one-time prepayment (only in the first year)
        if (onetimePrepayment > 0 && year === 0) {
            const prepayment = Math.min(onetimePrepayment, balance);
            yearlyPrepayments += prepayment;
            balance -= prepayment;
        }
        
        years.push((currentYear + year).toString());
        principalData.push(yearlyPrincipal);
        interestData.push(yearlyInterest);
        prepaymentsData.push(yearlyPrepayments);
        taxesData.push(yearlyTaxes);
        balanceData.push(Math.max(0, balance));
    }
    
    paymentScheduleChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: years,
            datasets: [
                {
                    label: 'Taxes, Home Insurance & Maintenance',
                    data: taxesData,
                    backgroundColor: '#6B46C1',
                    borderWidth: 0,
                    stack: 'payment',
                    order: 4
                },
                {
                    label: 'Interest',
                    data: interestData,
                    backgroundColor: '#F59E0B',
                    borderWidth: 0,
                    stack: 'payment',
                    order: 3
                },
                {
                    label: 'Prepayments',
                    data: prepaymentsData,
                    backgroundColor: '#EF4444',
                    borderWidth: 0,
                    stack: 'payment',
                    order: 2
                },
                {
                    label: 'Principal',
                    data: principalData,
                    backgroundColor: '#10B981',
                    borderWidth: 0,
                    stack: 'payment',
                    order: 1
                },
                {
                    label: 'Balance',
                    data: balanceData,
                    type: 'line',
                    borderColor: '#8B4513',
                    backgroundColor: 'transparent',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.1,
                    pointBackgroundColor: '#8B4513',
                    pointBorderColor: '#8B4513',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    yAxisID: 'y1',
                    order: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'dataset',
                intersect: true,
            },
            onHover: function(event, activeElements, chart) {
                // Change cursor on hover
                event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
                
                if (activeElements.length > 0) {
                    const activeIndex = activeElements[0].datasetIndex;
                    
                    // Dim all datasets except the hovered one
                    chart.data.datasets.forEach((dataset, index) => {
                        if (dataset.type !== 'line') { // Don't affect the line chart
                            if (index === activeIndex) {
                                // Highlight the active dataset
                                if (!dataset._originalColor) {
                                    dataset._originalColor = dataset.backgroundColor;
                                }
                                dataset.backgroundColor = dataset._originalColor;
                                dataset.borderWidth = 3;
                                dataset.borderColor = '#ffffff';
                                dataset.hoverBackgroundColor = dataset._originalColor;
                            } else {
                                // Dim other datasets
                                if (!dataset._originalColor) {
                                    dataset._originalColor = dataset.backgroundColor;
                                }
                                // Create dimmed version with 80% opacity
                                const color = dataset._originalColor;
                                if (color.startsWith('#')) {
                                    // Convert hex to rgba with 80% opacity
                                    const r = parseInt(color.slice(1, 3), 16);
                                    const g = parseInt(color.slice(3, 5), 16);
                                    const b = parseInt(color.slice(5, 7), 16);
                                    dataset.backgroundColor = `rgba(${r}, ${g}, ${b}, 0.8)`;
                                } else {
                                    dataset.backgroundColor = color + 'CC'; // 80% opacity in hex
                                }
                                dataset.borderWidth = 0;
                            }
                        }
                    });
                } else {
                    // Reset all datasets to original colors when not hovering
                    chart.data.datasets.forEach((dataset, index) => {
                        if (dataset.type !== 'line') {
                            if (dataset._originalColor) {
                                dataset.backgroundColor = dataset._originalColor;
                            }
                            dataset.borderWidth = 0;
                        }
                    });
                }
                chart.update('none'); // Update without animation for smooth hover
            },
            plugins: {
                title: {
                    display: true,
                    text: `Home Loan Payment Schedule (${years[0]} - ${years[years.length - 1]})`,
                    font: {
                        size: 16,
                        weight: 'bold'
                    },
                    padding: 20
                },
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    mode: 'nearest',
                    intersect: true,
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    cornerRadius: 8,
                    displayColors: true,
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    caretPadding: 10,
                    caretSize: 6,
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        title: function(context) {
                            return 'Year ' + context[0].label;
                        },
                        label: function(context) {
                            const value = context.parsed.y;
                            const label = context.dataset.label;
                            
                            if (label === 'Balance') {
                                return '🏠 ' + label + ': ' + formatCurrency(value);
                            } else if (label === 'Principal') {
                                return '💰 ' + label + ': ' + formatCurrency(value);
                            } else if (label === 'Interest') {
                                return '📈 ' + label + ': ' + formatCurrency(value);
                            } else if (label === 'Prepayments') {
                                return '⚡ ' + label + ': ' + formatCurrency(value);
                            } else if (label === 'Taxes, Home Insurance & Maintenance') {
                                return '🏢 ' + label + ': ' + formatCurrency(value);
                            } else {
                                return label + ': ' + formatCurrency(value);
                            }
                        },
                        afterLabel: function(context) {
                            // Calculate percentage of total payment for this component
                            const currentValue = context.parsed.y;
                            let totalPayment = 0;
                            
                            // Get all bar datasets (exclude line)
                            context.chart.data.datasets.forEach((dataset, index) => {
                                if (dataset.type !== 'line' && dataset.data[context.dataIndex]) {
                                    totalPayment += dataset.data[context.dataIndex];
                                }
                            });
                            
                            if (totalPayment > 0 && context.dataset.type !== 'line') {
                                const percentage = ((currentValue / totalPayment) * 100).toFixed(1);
                                return `(${percentage}% of total payment)`;
                            }
                            return '';
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: false
                    },
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 11
                        }
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Home Loan Payment / Year',
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        },
                        font: {
                            size: 10
                        }
                    },
                    beginAtZero: true
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Balance',
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        },
                        font: {
                            size: 10
                        }
                    },
                    beginAtZero: true
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeInOutQuart',
                delay: function(context) {
                    return context.dataIndex * 100;
                }
            },
            elements: {
                bar: {
                    borderRadius: 2,
                    hoverBorderWidth: 2,
                    hoverBorderColor: '#ffffff'
                }
            }
        }
    });
}

function generatePaymentSchedule(loanAmount, monthlyRate, totalMonths, emi, 
                                monthlyPropertyTax, monthlyHomeInsurance, maintenanceExpenses) {
    const tableBody = document.getElementById('paymentTableBody');
    tableBody.innerHTML = '';
    
    let balance = loanAmount;
    let totalPrincipalPaid = 0;
    const startDate = new Date(document.getElementById('startDate').value);
    
    const tenureYears = Math.ceil(totalMonths / 12);
    let monthlyDetails = [];
    
    for (let year = 1; year <= tenureYears; year++) {
        let yearlyPrincipal = 0;
        let yearlyInterest = 0;
        const yearlyTaxes = (monthlyPropertyTax + monthlyHomeInsurance + maintenanceExpenses) * 12;
        
        const monthsInYear = year === tenureYears ? (totalMonths % 12) || 12 : 12;
        let yearMonths = [];
        
        for (let month = 1; month <= monthsInYear; month++) {
            if (balance <= 0) break;
            
            const interestPayment = balance * monthlyRate;
            const principalPayment = Math.min(emi - interestPayment, balance);
            
            const monthlyTaxes = monthlyPropertyTax + monthlyHomeInsurance + maintenanceExpenses;
            const monthlyTotal = principalPayment + interestPayment + monthlyTaxes;
            
            const currentDate = new Date(startDate);
            currentDate.setFullYear(startDate.getFullYear() + year - 1);
            currentDate.setMonth(startDate.getMonth() + month - 1);
            
            const monthName = currentDate.toLocaleString('default', { month: 'short' });
            
            yearMonths.push({
                month: monthName,
                principal: principalPayment,
                interest: interestPayment,
                taxes: monthlyTaxes,
                total: monthlyTotal,
                balance: Math.max(0, balance - principalPayment),
                loanPaid: ((totalPrincipalPaid + principalPayment) / loanAmount) * 100
            });
            
            yearlyPrincipal += principalPayment;
            yearlyInterest += interestPayment;
            balance -= principalPayment;
            totalPrincipalPaid += principalPayment;
        }
        
        const totalYearlyPayment = yearlyPrincipal + yearlyInterest + yearlyTaxes;
        const loanPaidPercentage = (totalPrincipalPaid / loanAmount) * 100;
        
        // Create year row
        const yearRow = document.createElement('tr');
        yearRow.className = 'year-row';
        yearRow.dataset.year = year;
        yearRow.innerHTML = `
            <td class="year-cell">
                <span class="expand-icon">⊞</span>
                <span class="year-text">${startDate.getFullYear() + year - 1}</span>
            </td>
            <td class="principal-col">${formatCurrency(yearlyPrincipal)}</td>
            <td class="interest-col">${formatCurrency(yearlyInterest)}</td>
            <td class="taxes-col">${formatCurrency(yearlyTaxes)}</td>
            <td class="total-col">${formatCurrency(totalYearlyPayment)}</td>
            <td class="balance-col">${formatCurrency(Math.max(0, balance))}</td>
            <td class="loan-paid-col">${loanPaidPercentage.toFixed(2)}%</td>
        `;
        
        yearRow.addEventListener('click', function() {
            toggleYearExpansion(year);
        });
        
        tableBody.appendChild(yearRow);
        
        // Create month rows (initially hidden)
        yearMonths.forEach(monthData => {
            const monthRow = document.createElement('tr');
            monthRow.className = 'month-row';
            monthRow.dataset.year = year;
            monthRow.style.display = 'none';
            monthRow.innerHTML = `
                <td class="month-cell">${monthData.month}</td>
                <td class="principal-col">${formatCurrency(monthData.principal)}</td>
                <td class="interest-col">${formatCurrency(monthData.interest)}</td>
                <td class="taxes-col">${formatCurrency(monthData.taxes)}</td>
                <td class="total-col">${formatCurrency(monthData.total)}</td>
                <td class="balance-col">${formatCurrency(monthData.balance)}</td>
                <td class="loan-paid-col">${monthData.loanPaid.toFixed(3)}%</td>
            `;
            
            tableBody.appendChild(monthRow);
        });
    }
}

function toggleYearExpansion(year) {
    const yearRow = document.querySelector(`tr.year-row[data-year="${year}"]`);
    const monthRows = document.querySelectorAll(`tr.month-row[data-year="${year}"]`);
    const expandIcon = yearRow.querySelector('.expand-icon');
    
    if (monthRows[0].style.display === 'none') {
        // Expand
        monthRows.forEach(row => row.style.display = 'table-row');
        expandIcon.textContent = '⊟';
        yearRow.classList.add('expanded');
    } else {
        // Collapse
        monthRows.forEach(row => row.style.display = 'none');
        expandIcon.textContent = '⊞';
        yearRow.classList.remove('expanded');
    }
}

function togglePrepayments() {
    const container = document.getElementById('prepaymentsContainer');
    const btn = document.getElementById('addPrepaymentsBtn');
    
    if (container.style.display === 'none') {
        container.style.display = 'block';
        btn.innerHTML = '<span class="plus-icon">-</span> Remove Prepayments';
    } else {
        container.style.display = 'none';
        btn.innerHTML = '<span class="plus-icon">+</span> Add Prepayments';
    }
}

function formatCurrency(amount) {
    if (amount === 0) {
        return '₹0';
    }
    
    // Round the amount to avoid floating point issues
    amount = Math.round(amount);
    
    // Convert to string and format with Indian numbering system
    const amountStr = amount.toString();
    const isNegative = amount < 0;
    const positiveAmount = Math.abs(amount);
    const positiveAmountStr = positiveAmount.toString();
    
    // Indian numbering system formatting
    let formatted = '';
    let len = positiveAmountStr.length;
    
    if (len <= 3) {
        formatted = positiveAmountStr;
    } else if (len <= 5) {
        // For 4-5 digits: 12,345
        formatted = positiveAmountStr.slice(0, len-3) + ',' + positiveAmountStr.slice(len-3);
    } else if (len <= 7) {
        // For 6-7 digits: 12,34,567
        formatted = positiveAmountStr.slice(0, len-5) + ',' + 
                   positiveAmountStr.slice(len-5, len-3) + ',' + 
                   positiveAmountStr.slice(len-3);
    } else if (len <= 9) {
        // For 8-9 digits: 1,23,45,678
        formatted = positiveAmountStr.slice(0, len-7) + ',' + 
                   positiveAmountStr.slice(len-7, len-5) + ',' + 
                   positiveAmountStr.slice(len-5, len-3) + ',' + 
                   positiveAmountStr.slice(len-3);
    } else {
        // For 10+ digits: 12,34,56,78,901
        let groups = [];
        let remaining = positiveAmountStr;
        
        // Take last 3 digits
        groups.unshift(remaining.slice(-3));
        remaining = remaining.slice(0, -3);
        
        // Take groups of 2 digits from right to left
        while (remaining.length > 0) {
            if (remaining.length <= 2) {
                groups.unshift(remaining);
                break;
            } else {
                groups.unshift(remaining.slice(-2));
                remaining = remaining.slice(0, -2);
            }
        }
        
        formatted = groups.join(',');
    }
    
    return (isNegative ? '-₹' : '₹') + formatted;
}

// Test function to verify Indian numbering format (can be removed in production)
function testIndianNumbering() {
    console.log('Testing Indian Number Formatting:');
    console.log('42878 =>', formatCurrency(42878)); // Should be ₹42,878
    console.log('209045 =>', formatCurrency(209045)); // Should be ₹2,09,045
    console.log('26250 =>', formatCurrency(26250)); // Should be ₹26,250
    console.log('278173 =>', formatCurrency(278173)); // Should be ₹2,78,173
    console.log('3957122 =>', formatCurrency(3957122)); // Should be ₹39,57,122
}

function downloadPDF() {
    // Create a new window with printable content
    const printWindow = window.open('', '', 'height=600,width=800');
    const calculationData = getCalculationData();
    
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Home Loan EMI Calculator - Payment Schedule</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .summary { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
                .summary-section { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                th { background-color: #f5f5f5; font-weight: bold; }
                .year-row { background-color: #f0f0f0; font-weight: bold; }
                .month-row { background-color: #fafafa; }
                .principal-col { background-color: #d4edda; }
                .interest-col { background-color: #fff3cd; }
                .taxes-col { background-color: #e7e3ff; }
                .total-col { background-color: #f8f9fa; font-weight: bold; }
                .balance-col { background-color: #f8d7da; }
                .loan-paid-col { background-color: #d1ecf1; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Home Loan EMI Calculator</h1>
                <h2>Payment Schedule & Summary</h2>
                <p>Generated on: ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="summary">
                <div class="summary-section">
                    <h3>Loan Details</h3>
                    <p><strong>Home Value:</strong> ${formatCurrency(calculationData.homeValue)}</p>
                    <p><strong>Loan Amount:</strong> ${formatCurrency(calculationData.loanAmount)}</p>
                    <p><strong>Interest Rate:</strong> ${calculationData.interestRate}% per annum</p>
                    <p><strong>Tenure:</strong> ${calculationData.tenureYears} years ${calculationData.tenureMonths} months</p>
                    <p><strong>EMI Amount:</strong> ${formatCurrency(calculationData.emi)}</p>
                </div>
                
                <div class="summary-section">
                    <h3>Payment Summary</h3>
                    <p><strong>Total Principal:</strong> ${formatCurrency(calculationData.totalPrincipal)}</p>
                    <p><strong>Total Interest:</strong> ${formatCurrency(calculationData.totalInterest)}</p>
                    <p><strong>Total Taxes & Insurance:</strong> ${formatCurrency(calculationData.totalTaxes)}</p>
                    <p><strong>Grand Total:</strong> ${formatCurrency(calculationData.grandTotal)}</p>
                </div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Year/Month</th>
                        <th class="principal-col">Principal (A)</th>
                        <th class="interest-col">Interest (B)</th>
                        <th class="taxes-col">Taxes, Insurance & Maintenance (C)</th>
                        <th class="total-col">Total Payment (A + B + C)</th>
                        <th class="balance-col">Balance</th>
                        <th class="loan-paid-col">Loan Paid To Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${generatePrintableTable()}
                </tbody>
            </table>
        </body>
        </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load then trigger print
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
}

function downloadExcel() {
    const calculationData = getCalculationData();
    const tableData = generateExcelData();
    
    // Create CSV content
    let csvContent = "Home Loan EMI Calculator - Payment Schedule\n";
    csvContent += `Generated on: ${new Date().toLocaleDateString()}\n\n`;
    
    // Add loan details
    csvContent += "Loan Details:\n";
    csvContent += `Home Value,${calculationData.homeValue}\n`;
    csvContent += `Loan Amount,${calculationData.loanAmount}\n`;
    csvContent += `Interest Rate,${calculationData.interestRate}%\n`;
    csvContent += `Tenure,${calculationData.tenureYears} years ${calculationData.tenureMonths} months\n`;
    csvContent += `EMI Amount,${calculationData.emi}\n\n`;
    
    // Add payment summary
    csvContent += "Payment Summary:\n";
    csvContent += `Total Principal,${calculationData.totalPrincipal}\n`;
    csvContent += `Total Interest,${calculationData.totalInterest}\n`;
    csvContent += `Total Taxes & Insurance,${calculationData.totalTaxes}\n`;
    csvContent += `Grand Total,${calculationData.grandTotal}\n\n`;
    
    // Add table headers
    csvContent += "Year/Month,Principal (A),Interest (B),Taxes Insurance & Maintenance (C),Total Payment (A + B + C),Balance,Loan Paid To Date\n";
    
    // Add table data
    csvContent += tableData;
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'home_loan_payment_schedule.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function shareCalculation() {
    const params = getAllInputParams();
    const baseUrl = window.location.origin + window.location.pathname;
    const queryString = Object.keys(params).map(key => `${key}=${encodeURIComponent(params[key])}`).join('&');
    const shareUrl = `${baseUrl}?${queryString}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Home Loan EMI Calculator',
            text: 'Check out my home loan calculation with detailed payment schedule',
            url: shareUrl
        }).catch(err => {
            // Fallback to copy to clipboard
            copyToClipboard(shareUrl);
        });
    } else {
        // Fallback: copy to clipboard
        copyToClipboard(shareUrl);
    }
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Link copied to clipboard!');
        }).catch(err => {
            // Fallback for older browsers
            fallbackCopyTextToClipboard(text);
        });
    } else {
        fallbackCopyTextToClipboard(text);
    }
}

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showNotification('Link copied to clipboard!');
        } else {
            showNotification('Unable to copy link. Please copy manually: ' + text);
        }
    } catch (err) {
        showNotification('Unable to copy link. Please copy manually: ' + text);
    }
    
    document.body.removeChild(textArea);
}

function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 1000;
        font-family: Arial, sans-serif;
        font-size: 14px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

function getCalculationData() {
    return {
        homeValue: parseFloat(document.getElementById('homeValue').value) || 0,
        loanAmount: parseFloat(document.getElementById('loanAmount').value) || 0,
        interestRate: parseFloat(document.getElementById('interestRate').value) || 0,
        tenureYears: parseFloat(document.getElementById('tenureYears').value) || 0,
        tenureMonths: parseFloat(document.getElementById('tenureMonths').value) || 0,
        emi: parseFloat(document.getElementById('emiAmount').textContent.replace(/[₹,]/g, '')) || 0,
        totalPrincipal: parseFloat(document.getElementById('totalPrincipal').textContent.replace(/[₹,]/g, '')) || 0,
        totalInterest: parseFloat(document.getElementById('totalInterest').textContent.replace(/[₹,]/g, '')) || 0,
        totalTaxes: parseFloat(document.getElementById('totalTaxes').textContent.replace(/[₹,]/g, '')) || 0,
        grandTotal: parseFloat(document.getElementById('grandTotal').textContent.replace(/[₹,]/g, '')) || 0
    };
}

function getAllInputParams() {
    return {
        homeValue: document.getElementById('homeValue').value,
        downPaymentPercent: document.getElementById('downPaymentPercent').value,
        downPaymentAmount: document.getElementById('downPaymentAmount').value,
        loanInsurance: document.getElementById('loanInsurance').value,
        interestRate: document.getElementById('interestRate').value,
        tenureYears: document.getElementById('tenureYears').value,
        tenureMonths: document.getElementById('tenureMonths').value,
        loanFeesPercent: document.getElementById('loanFeesPercent').value,
        loanFeesAmount: document.getElementById('loanFeesAmount').value,
        oneTimeExpensesPercent: document.getElementById('oneTimeExpensesPercent').value,
        oneTimeExpensesAmount: document.getElementById('oneTimeExpensesAmount').value,
        propertyTaxesPercent: document.getElementById('propertyTaxesPercent').value,
        propertyTaxesAmount: document.getElementById('propertyTaxesAmount').value,
        homeInsurancePercent: document.getElementById('homeInsurancePercent').value,
        homeInsuranceAmount: document.getElementById('homeInsuranceAmount').value,
        maintenanceExpenses: document.getElementById('maintenanceExpenses').value,
        monthlyPrepayment: document.getElementById('monthlyPrepayment').value,
        yearlyPrepayment: document.getElementById('yearlyPrepayment').value,
        quarterlyPrepayment: document.getElementById('quarterlyPrepayment').value,
        onetimePrepayment: document.getElementById('onetimePrepayment').value,
        startDate: document.getElementById('startDate').value
    };
}

function generatePrintableTable() {
    const tableBody = document.getElementById('paymentTableBody');
    let printableContent = '';
    
    Array.from(tableBody.children).forEach(row => {
        if (row.classList.contains('year-row')) {
            const cells = Array.from(row.cells);
            printableContent += `<tr class="year-row">`;
            cells.forEach((cell, index) => {
                if (index === 0) {
                    printableContent += `<td>${cell.querySelector('.year-text').textContent}</td>`;
                } else {
                    printableContent += `<td class="${cell.className}">${cell.textContent}</td>`;
                }
            });
            printableContent += `</tr>`;
        }
    });
    
    return printableContent;
}

function generateExcelData() {
    const tableBody = document.getElementById('paymentTableBody');
    let csvData = '';
    
    Array.from(tableBody.children).forEach(row => {
        if (row.classList.contains('year-row')) {
            const cells = Array.from(row.cells);
            const rowData = [];
            
            cells.forEach((cell, index) => {
                if (index === 0) {
                    rowData.push(cell.querySelector('.year-text').textContent);
                } else {
                    // Remove currency symbols and formatting for CSV
                    let value = cell.textContent.replace(/[₹,]/g, '');
                    rowData.push(value);
                }
            });
            
            csvData += rowData.join(',') + '\n';
        }
    });
    
    return csvData;
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