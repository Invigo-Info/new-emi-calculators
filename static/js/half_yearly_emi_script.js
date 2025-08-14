// Global variables for half-yearly EMI calculator
let halfYearlyPaymentBreakupChart;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupHalfYearlyEventListeners();
    setupHalfYearlyDropdownMenu();
    calculateAndUpdateHalfYearly();
});

function setupHalfYearlyEventListeners() {
    // Input change listeners for sliders and number inputs
    const inputs = [
        { input: 'halfYearlyLoanAmount', slider: 'halfYearlyLoanAmountSlider', min: 1000, max: 10000000, sliderMin: 0 },
        { input: 'halfYearlyInterestRate', slider: 'halfYearlyInterestRateSlider', min: 0, max: 36 },
        { input: 'halfYearlyTenureYears', slider: 'halfYearlyTenureYearsSlider', min: 1, max: 30 }
    ];
    
    inputs.forEach(({ input, slider, min = 0, max, sliderMin }) => {
        const inputElement = document.getElementById(input);
        const sliderElement = document.getElementById(slider);
        const actualSliderMin = sliderMin !== undefined ? sliderMin : min;
        
        if (inputElement && sliderElement) {
            // Sync input to slider
            inputElement.addEventListener('input', function() {
                let value = parseFloat(this.value) || min;
                // For input validation, use the input min value
                value = Math.max(Math.min(value, max), min);
                this.value = value;
                // For slider, ensure it's within slider range
                sliderElement.value = Math.max(value, actualSliderMin);
                calculateAndUpdateHalfYearly();
            });
            
            // Sync slider to input
            sliderElement.addEventListener('input', function() {
                let sliderValue = parseFloat(this.value);
                // If slider is at minimum but input needs higher minimum, use input minimum
                if (sliderValue < min) {
                    inputElement.value = min;
                } else {
                    inputElement.value = sliderValue;
                }
                calculateAndUpdateHalfYearly();
            });
        }
    });

    // Setup download CSV button
    const downloadBtn = document.getElementById('downloadCsvBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadHalfYearlyScheduleAsCSV);
    }
}

function calculateAndUpdateHalfYearly() {
    const loanAmount = parseFloat(document.getElementById('halfYearlyLoanAmount').value) || 0;
    const interestRate = parseFloat(document.getElementById('halfYearlyInterestRate').value) || 0;
    const tenureYears = parseInt(document.getElementById('halfYearlyTenureYears').value) || 0;
    
    if (loanAmount < 1000 || tenureYears <= 0) {
        return;
    }
    
    // Calculate half-yearly values
    const numberOfHalfYears = tenureYears * 2; // 2 half-years per year
    const halfYearlyRate = interestRate / (2 * 100); // Convert annual rate to half-yearly rate
    
    // Calculate half-yearly EMI using standard EMI formula
    let halfYearlyEmi;
    let totalInterest;
    
    if (halfYearlyRate === 0) {
        halfYearlyEmi = loanAmount / numberOfHalfYears;
        totalInterest = 0;
    } else {
        halfYearlyEmi = loanAmount * halfYearlyRate * Math.pow(1 + halfYearlyRate, numberOfHalfYears) / (Math.pow(1 + halfYearlyRate, numberOfHalfYears) - 1);
        totalInterest = (halfYearlyEmi * numberOfHalfYears) - loanAmount;
    }
    
    const totalPayment = halfYearlyEmi * numberOfHalfYears;
    
    // Generate half-yearly amortization schedule
    const amortizationSchedule = [];
    let remainingPrincipal = loanAmount;
    
    for (let period = 1; period <= numberOfHalfYears; period++) {
        const interestPayment = remainingPrincipal * halfYearlyRate;
        const principalPayment = halfYearlyEmi - interestPayment;
        remainingPrincipal = Math.max(0, remainingPrincipal - principalPayment);
        
        amortizationSchedule.push({
            period: period,
            principal: principalPayment,
            interest: interestPayment,
            halfYearlyPayment: halfYearlyEmi,
            balance: remainingPrincipal
        });
    }
    
    const data = {
        status: 'success',
        principal: loanAmount,
        halfYearlyEmi: halfYearlyEmi,
        numberOfPayments: numberOfHalfYears,
        totalInterest: totalInterest,
        totalPayment: totalPayment,
        amortizationSchedule: amortizationSchedule
    };
    
    updateHalfYearlyResults(data);
    updateHalfYearlyChart(data);
    updateHalfYearlyScheduleTable(data);
}

function updateHalfYearlyResults(data) {
    document.getElementById('halfYearlyEmi').textContent = formatHalfYearlyCurrency(data.halfYearlyEmi);
    document.getElementById('halfYearlyNumberOfPayments').textContent = data.numberOfPayments;
    document.getElementById('halfYearlyPrincipalAmount').textContent = formatHalfYearlyCurrency(data.principal);
    document.getElementById('halfYearlyTotalInterest').textContent = formatHalfYearlyCurrency(data.totalInterest);
    document.getElementById('halfYearlyTotalPayment').textContent = formatHalfYearlyCurrency(data.totalPayment);
    
    // Update percentages
    const principalPercentage = (data.principal / data.totalPayment * 100).toFixed(1);
    const interestPercentage = (data.totalInterest / data.totalPayment * 100).toFixed(1);
    
    document.getElementById('halfYearlyPrincipalPercentage').textContent = principalPercentage + '%';
    document.getElementById('halfYearlyInterestPercentage').textContent = interestPercentage + '%';
}

function updateHalfYearlyChart(data) {
    const ctx = document.getElementById('halfYearlyPaymentBreakupChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (halfYearlyPaymentBreakupChart) {
        halfYearlyPaymentBreakupChart.destroy();
    }
    
    halfYearlyPaymentBreakupChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Principal', 'Interest'],
            datasets: [{
                data: [data.principal, data.totalInterest],
                backgroundColor: ['#3182ce', '#f56565'],
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
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return context.label + ': ₹' + formatHalfYearlyNumber(value) + ' (' + percentage + '%)';
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
}

function updateHalfYearlyScheduleTable(data) {
    const tableBody = document.getElementById('halfYearlyScheduleTableBody');
    tableBody.innerHTML = '';
    
    if (data.amortizationSchedule && data.amortizationSchedule.length > 0) {
        data.amortizationSchedule.forEach(periodData => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${periodData.period}</td>
                <td>₹${formatHalfYearlyNumber(periodData.principal)}</td>
                <td>₹${formatHalfYearlyNumber(periodData.interest)}</td>
                <td>₹${formatHalfYearlyNumber(periodData.halfYearlyPayment)}</td>
                <td>₹${formatHalfYearlyNumber(periodData.balance)}</td>
            `;
            tableBody.appendChild(row);
        });
    }
}

function downloadHalfYearlyScheduleAsCSV() {
    const loanAmount = parseFloat(document.getElementById('halfYearlyLoanAmount').value) || 0;
    const interestRate = parseFloat(document.getElementById('halfYearlyInterestRate').value) || 0;
    const tenureYears = parseInt(document.getElementById('halfYearlyTenureYears').value) || 0;
    
    if (loanAmount < 1000 || tenureYears <= 0) {
        alert('Please enter valid loan details to download the schedule. Minimum loan amount is ₹1,000.');
        return;
    }
    
    // Calculate the schedule data
    const numberOfHalfYears = tenureYears * 2;
    const halfYearlyRate = interestRate / (2 * 100);
    
    let halfYearlyEmi;
    if (halfYearlyRate === 0) {
        halfYearlyEmi = loanAmount / numberOfHalfYears;
    } else {
        halfYearlyEmi = loanAmount * halfYearlyRate * Math.pow(1 + halfYearlyRate, numberOfHalfYears) / (Math.pow(1 + halfYearlyRate, numberOfHalfYears) - 1);
    }
    
    // Generate CSV content
    let csvContent = 'Period,Principal (₹),Interest (₹),Half-Yearly Payment (₹),Remaining Balance (₹)\n';
    
    let remainingPrincipal = loanAmount;
    for (let period = 1; period <= numberOfHalfYears; period++) {
        const interestPayment = remainingPrincipal * halfYearlyRate;
        const principalPayment = halfYearlyEmi - interestPayment;
        remainingPrincipal = Math.max(0, remainingPrincipal - principalPayment);
        
        csvContent += `${period},${principalPayment.toFixed(2)},${interestPayment.toFixed(2)},${halfYearlyEmi.toFixed(2)},${remainingPrincipal.toFixed(2)}\n`;
    }
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'half_yearly_emi_schedule.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function formatHalfYearlyCurrency(amount) {
    return '₹ ' + formatHalfYearlyNumber(amount);
}

function formatHalfYearlyNumber(num) {
    if (typeof num !== 'number') return '0';
    return num.toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

// Input validation and formatting - only validate on blur to allow free typing
document.addEventListener('blur', function(e) {
    if (e.target.type === 'number' && e.target.id.startsWith('halfYearly')) {
        const value = parseFloat(e.target.value);
        const min = parseFloat(e.target.min);
        const max = parseFloat(e.target.max);
        
        // Enforce constraints only when user finishes typing (on blur)
        if (!isNaN(value) && !isNaN(min) && !isNaN(max)) {
            if (value < min) {
                e.target.value = min;
            } else if (value > max) {
                e.target.value = max;
            }
            calculateAndUpdateHalfYearly();
        }
    }
}, true);

function setupHalfYearlyDropdownMenu() {
    const dropdown = document.querySelector('.dropdown');
    const dropdownBtn = document.querySelector('.dropdown-btn');
    
    if (dropdown && dropdownBtn) {
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
        
        // Prevent dropdown from closing when clicking inside
        dropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
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
