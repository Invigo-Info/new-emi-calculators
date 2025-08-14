// Home Renovation Loan Calculator JavaScript
let hrBalanceChart;
let hrDebounceTimer;
let hrCurrentSchedule = [];

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    hrInitializeCalculator();
    hrSetupEventListeners();
    hrCalculateAndUpdate();
});

function hrInitializeCalculator() {
    // Set initial slider values
    hrSyncSliderWithInput('hrLoanAmount', 'hrLoanAmountSlider');
    hrSyncSliderWithInput('hrInterestRate', 'hrInterestRateSlider');
    hrSyncSliderWithInput('hrTenure', 'hrTenureSlider');
    
    // Update tenure slider based on type
    hrUpdateTenureSlider();
}

function hrSetupEventListeners() {
    // Input field listeners
    const inputs = ['hrLoanAmount', 'hrInterestRate', 'hrTenure', 'hrProcessingFee'];
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', hrDebounceCalculation);
            element.addEventListener('blur', hrValidateInput);
        }
    });
    
    // Slider listeners
    const sliders = ['hrLoanAmountSlider', 'hrInterestRateSlider', 'hrTenureSlider'];
    sliders.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', function() {
                const inputId = id.replace('Slider', '');
                hrSyncInputWithSlider(inputId, id);
                hrDebounceCalculation();
            });
        }
    });
    
    // Tenure type listeners
    const tenureRadios = document.querySelectorAll('input[name="hrTenureType"]');
    tenureRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            hrUpdateTenureSlider();
            hrDebounceCalculation();
            // Update table and chart immediately if we have data
            if (hrCurrentSchedule && hrCurrentSchedule.length > 0) {
                hrUpdateAmortizationTable(hrCurrentSchedule);
                hrUpdateChart(hrCurrentSchedule);
            }
        });
    });
    
    // Fee type listeners
    const feeRadios = document.querySelectorAll('input[name="hrFeeType"]');
    feeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            hrUpdateFeeUnit();
            hrDebounceCalculation();
        });
    });
    
    // GST toggle listener
    const gstToggle = document.getElementById('hrGstToggle');
    if (gstToggle) {
        gstToggle.addEventListener('change', hrDebounceCalculation);
    }
    
    // Disbursal mode listener
    const disbursalMode = document.getElementById('hrDisbursalMode');
    if (disbursalMode) {
        disbursalMode.addEventListener('change', hrDebounceCalculation);
    }
    
    // Download button listener
    const downloadBtn = document.getElementById('hrDownloadBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', hrDownloadSchedule);
    }
}

function hrDebounceCalculation() {
    clearTimeout(hrDebounceTimer);
    hrDebounceTimer = setTimeout(hrCalculateAndUpdate, 300);
}

function hrSyncSliderWithInput(inputId, sliderId) {
    const input = document.getElementById(inputId);
    const slider = document.getElementById(sliderId);
    
    if (input && slider) {
        let value = parseFloat(input.value) || 0;
        
        // Special handling for tenure conversion
        if (inputId === 'hrTenure') {
            const tenureType = document.querySelector('input[name="hrTenureType"]:checked')?.value;
            if (tenureType === 'years') {
                value = Math.min(value, 25); // Max 25 years
            } else {
                value = Math.min(value * 12, 300); // Convert years to months, max 300 months
            }
        }
        
        slider.value = Math.min(Math.max(value, slider.min), slider.max);
    }
}

function hrSyncInputWithSlider(inputId, sliderId) {
    const input = document.getElementById(inputId);
    const slider = document.getElementById(sliderId);
    
    if (input && slider) {
        let value = parseFloat(slider.value);
        
        // Special handling for tenure conversion
        if (inputId === 'hrTenure') {
            const tenureType = document.querySelector('input[name="hrTenureType"]:checked')?.value;
            if (tenureType === 'years') {
                value = Math.min(value, 25);
            }
        }
        
        input.value = value;
    }
}

function hrUpdateTenureSlider() {
    const tenureType = document.querySelector('input[name="hrTenureType"]:checked')?.value;
    const slider = document.getElementById('hrTenureSlider');
    const input = document.getElementById('hrTenure');
    const minLabel = document.getElementById('hrTenureMinLabel');
    const maxLabel = document.getElementById('hrTenureMaxLabel');
    
    if (tenureType === 'years') {
        slider.min = '1';
        slider.max = '25';
        slider.step = '1';
        minLabel.textContent = '1 Year';
        maxLabel.textContent = '25 Years';
        
        // Convert current months to years if needed
        const currentValue = parseInt(input.value) || 12;
        if (currentValue > 25) {
            input.value = Math.round(currentValue / 12);
            slider.value = input.value;
        }
    } else {
        slider.min = '1';
        slider.max = '300';
        slider.step = '1';
        minLabel.textContent = '1 Month';
        maxLabel.textContent = '300 Months';
        
        // Convert current years to months if needed
        const currentValue = parseInt(input.value) || 12;
        if (currentValue <= 25) {
            const tenureInMonths = currentValue * 12;
            input.value = tenureInMonths;
            slider.value = tenureInMonths;
        }
    }
}

function hrUpdateFeeUnit() {
    const feeType = document.querySelector('input[name="hrFeeType"]:checked')?.value;
    const feeUnit = document.getElementById('hrFeeUnit');
    const feeInput = document.getElementById('hrProcessingFee');
    
    if (feeUnit) {
        feeUnit.textContent = feeType;
    }
    
    // Reset fee value when switching types
    if (feeInput) {
        if (feeType === '%') {
            feeInput.value = '3';
            feeInput.max = '10';
            feeInput.step = '0.1';
        } else {
            feeInput.value = '3000';
            feeInput.max = '100000';
            feeInput.step = '100';
        }
    }
}

function hrValidateInput(event) {
    const input = event.target;
    const value = parseFloat(input.value) || 0;
    
    // Remove error class
    input.classList.remove('hr-error');
    
    // Validate based on input type
    switch (input.id) {
        case 'hrLoanAmount':
            if (value < 10000) {
                hrShowError(input, 'Minimum loan amount is ₹10,000');
                return false;
            }
            if (value > 50000000) {
                hrShowError(input, 'Maximum loan amount is ₹5 Crores');
                return false;
            }
            break;
            
        case 'hrInterestRate':
            if (value < 1 || value > 30) {
                hrShowError(input, 'Interest rate must be between 1% and 30%');
                return false;
            }
            break;
            
        case 'hrTenure':
            const tenureType = document.querySelector('input[name="hrTenureType"]:checked')?.value;
            const maxTenure = tenureType === 'years' ? 25 : 300;
            if (value < 1 || value > maxTenure) {
                hrShowError(input, `Tenure must be between 1 and ${maxTenure} ${tenureType}`);
                return false;
            }
            break;
    }
    
    return true;
}

function hrShowError(input, message) {
    input.classList.add('hr-error');
    
    // Remove existing error message
    const existingError = input.parentNode.querySelector('.hr-error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Add new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'hr-error-message';
    errorDiv.textContent = message;
    input.parentNode.appendChild(errorDiv);
    
    // Remove error after 3 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
        input.classList.remove('hr-error');
    }, 3000);
}

function hrCalculateAndUpdate() {
    try {
        // Get input values
        const loanAmount = parseFloat(document.getElementById('hrLoanAmount').value) || 100000;
        const interestRate = parseFloat(document.getElementById('hrInterestRate').value) || 18;
        const tenure = parseInt(document.getElementById('hrTenure').value) || 12;
        const tenureType = document.querySelector('input[name="hrTenureType"]:checked')?.value || 'months';
        const feeType = document.querySelector('input[name="hrFeeType"]:checked')?.value || '%';
        const feeValue = parseFloat(document.getElementById('hrProcessingFee').value) || 3;
        const gstEnabled = document.getElementById('hrGstToggle').checked;
        const disbursalMode = document.getElementById('hrDisbursalMode').value;
        
        // Convert tenure to months
        const tenureMonths = tenureType === 'years' ? tenure * 12 : tenure;
        
        // Prepare data for API call
        const requestData = {
            loanAmount: loanAmount,
            interestRate: interestRate,
            tenureMonths: tenureMonths,
            feeType: feeType,
            feeValue: feeValue,
            gstEnabled: gstEnabled,
            disbursalMode: disbursalMode
        };
        
        // Make API call
        fetch('/calculate-home-renovation-loan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                hrUpdateResults(data);
                hrCurrentSchedule = data.schedule;
                hrUpdateAmortizationTable(data.schedule);
                hrUpdateChart(data.schedule);
            } else {
                console.error('Calculation error:', data.error);
                hrShowCalculationError(data.error);
            }
        })
        .catch(error => {
            console.error('API error:', error);
            hrShowCalculationError('Unable to calculate. Please check your inputs.');
        });
        
    } catch (error) {
        console.error('Calculation error:', error);
        hrShowCalculationError('An error occurred during calculation.');
    }
}

function hrUpdateResults(data) {
    // Update EMI
    const emiElement = document.getElementById('hrEmiAmount');
    if (emiElement) {
        emiElement.textContent = hrFormatIndianCurrency(data.emi);
        emiElement.classList.add('hr-value-changing');
        setTimeout(() => emiElement.classList.remove('hr-value-changing'), 300);
    }
    
    // Update metrics
    const metrics = {
        'hrTotalInterest': data.totalInterest,
        'hrProcessingFeeAmount': data.feeAmount,
        'hrGstAmount': data.gstAmount,
        'hrTotalPayable': data.totalPayable
    };
    
    Object.entries(metrics).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = hrFormatIndianCurrency(value);
            element.classList.add('hr-value-changing');
            setTimeout(() => element.classList.remove('hr-value-changing'), 300);
        }
    });
    
    // Update APR
    const aprElement = document.getElementById('hrAprRate');
    if (aprElement) {
        aprElement.textContent = data.apr.toFixed(2) + '%';
        aprElement.classList.add('hr-value-changing');
        setTimeout(() => aprElement.classList.remove('hr-value-changing'), 300);
    }
}

function hrUpdateAmortizationTable(schedule) {
    const tableBody = document.getElementById('hrTableBody');
    const periodHeader = document.getElementById('hrTablePeriodHeader');
    if (!tableBody) return;
    
    // Get current tenure type
    const tenureType = document.querySelector('input[name="hrTenureType"]:checked')?.value || 'months';
    
    // Update table header
    if (periodHeader) {
        periodHeader.textContent = tenureType === 'years' ? 'Year' : 'Month';
    }
    
    tableBody.innerHTML = '';
    
    if (tenureType === 'years') {
        // Group schedule by years and show yearly summary
        const yearlyData = hrGroupScheduleByYears(schedule);
        yearlyData.forEach(yearRow => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${yearRow.year}</td>
                <td>${hrFormatIndianCurrency(yearRow.totalEmi)}</td>
                <td>${hrFormatIndianCurrency(yearRow.totalInterest)}</td>
                <td>${hrFormatIndianCurrency(yearRow.totalPrincipal)}</td>
                <td>${hrFormatIndianCurrency(yearRow.endingBalance)}</td>
            `;
            tableBody.appendChild(tr);
        });
    } else {
        // Show monthly data as usual
        schedule.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.month}</td>
                <td>${hrFormatIndianCurrency(row.emi)}</td>
                <td>${hrFormatIndianCurrency(row.interest)}</td>
                <td>${hrFormatIndianCurrency(row.principal)}</td>
                <td>${hrFormatIndianCurrency(row.balance)}</td>
            `;
            tableBody.appendChild(tr);
        });
    }
}

function hrGroupScheduleByYears(schedule) {
    const yearlyData = [];
    let currentYear = 1;
    let yearlyEmi = 0;
    let yearlyInterest = 0;
    let yearlyPrincipal = 0;
    let endingBalance = 0;
    
    schedule.forEach((row, index) => {
        yearlyEmi += row.emi;
        yearlyInterest += row.interest;
        yearlyPrincipal += row.principal;
        endingBalance = row.balance;
        
        // If it's the end of a year (every 12 months) or the last row
        if ((index + 1) % 12 === 0 || index === schedule.length - 1) {
            yearlyData.push({
                year: currentYear,
                totalEmi: yearlyEmi,
                totalInterest: yearlyInterest,
                totalPrincipal: yearlyPrincipal,
                endingBalance: endingBalance
            });
            
            // Reset for next year
            currentYear++;
            yearlyEmi = 0;
            yearlyInterest = 0;
            yearlyPrincipal = 0;
        }
    });
    
    return yearlyData;
}

function hrUpdateChart(schedule) {
    const ctx = document.getElementById('hrBalanceChart');
    if (!ctx) return;
    
    // Get current tenure type
    const tenureType = document.querySelector('input[name="hrTenureType"]:checked')?.value || 'months';
    
    let labels, balanceData;
    
    if (tenureType === 'years' && schedule.length > 12) {
        // Show yearly data points for better visualization
        const yearlyData = hrGroupScheduleByYears(schedule);
        labels = yearlyData.map(row => `Year ${row.year}`);
        balanceData = yearlyData.map(row => row.endingBalance);
    } else {
        // Show monthly data
        labels = schedule.map(row => `Month ${row.month}`);
        balanceData = schedule.map(row => row.balance);
    }
    
    if (hrBalanceChart) {
        hrBalanceChart.destroy();
    }
    
    hrBalanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Outstanding Balance',
                data: balanceData,
                borderColor: '#3182ce',
                backgroundColor: 'rgba(49, 130, 206, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#3182ce',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
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
                            return `Outstanding: ${hrFormatIndianCurrency(context.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: tenureType === 'years' ? 'Loan Tenure (Years)' : 'Loan Tenure (Months)'
                    },
                    ticks: {
                        maxTicksLimit: 12
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Amount (₹)'
                    },
                    ticks: {
                        callback: function(value) {
                            return hrFormatIndianCurrency(value, true);
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

function hrFormatIndianCurrency(amount, short = false) {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return '₹0';
    }
    
    const absAmount = Math.abs(amount);
    
    if (short) {
        if (absAmount >= 10000000) { // 1 crore or more
            return '₹' + (amount / 10000000).toFixed(1) + 'Cr';
        } else if (absAmount >= 100000) { // 1 lakh or more
            return '₹' + (amount / 100000).toFixed(1) + 'L';
        } else if (absAmount >= 1000) { // 1 thousand or more
            return '₹' + (amount / 1000).toFixed(1) + 'K';
        }
    }
    
    // Full formatting with Indian numbering system
    const formatter = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
    
    return formatter.format(amount);
}

function hrShowCalculationError(message) {
    // Show error in EMI display
    const emiElement = document.getElementById('hrEmiAmount');
    if (emiElement) {
        emiElement.textContent = 'Error';
        emiElement.style.color = '#e53e3e';
        setTimeout(() => {
            emiElement.style.color = '';
        }, 3000);
    }
    
    // Show error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'hr-error-message';
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #fed7d7;
        border: 1px solid #e53e3e;
        color: #e53e3e;
        padding: 15px;
        border-radius: 8px;
        z-index: 1000;
        max-width: 300px;
        font-size: 0.9rem;
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 5000);
}

function hrDownloadSchedule() {
    if (!hrCurrentSchedule || hrCurrentSchedule.length === 0) {
        alert('No schedule data available to download.');
        return;
    }
    
    // Get loan details for header
    const loanAmountValue = parseFloat(document.getElementById('hrLoanAmount').value) || 0;
    const loanAmount = loanAmountValue > 0 ? hrFormatIndianCurrency(loanAmountValue) : '₹0';
    const interestRate = (document.getElementById('hrInterestRate').value || '0') + '%';
    const emi = document.getElementById('hrEmiAmount').textContent || '₹0';
    const tenureType = document.querySelector('input[name="hrTenureType"]:checked')?.value || 'months';
    const tenureValue = document.getElementById('hrTenure').value || '0';
    const tenure = tenureType === 'years' ? `${tenureValue} Years` : `${tenureValue} Months`;
    
    // Create CSV content with better formatting
    let csvContent = 'Home Renovation Loan - Amortization Schedule\n';
    csvContent += '=====================================\n';
    csvContent += `Loan Amount: ${loanAmount}\n`;
    csvContent += `Interest Rate: ${interestRate}\n`;
    csvContent += `Loan Tenure: ${tenure}\n`;
    csvContent += `Monthly EMI: ${emi}\n`;
    csvContent += `Generated on: ${new Date().toLocaleDateString('en-IN')}\n\n`;
    // Add appropriate header based on tenure type
    const currentTenureType = document.querySelector('input[name="hrTenureType"]:checked')?.value || 'months';
    const periodLabel = currentTenureType === 'years' ? 'Year' : 'Month';
    
    csvContent += `${periodLabel},EMI (₹),Interest (₹),Principal (₹),Outstanding Balance (₹)\n`;
    
    if (currentTenureType === 'years' && hrCurrentSchedule.length > 12) {
        // Export yearly data
        const yearlyData = hrGroupScheduleByYears(hrCurrentSchedule);
        yearlyData.forEach(row => {
            csvContent += `${row.year},${row.totalEmi.toFixed(2)},${row.totalInterest.toFixed(2)},${row.totalPrincipal.toFixed(2)},${row.endingBalance.toFixed(2)}\n`;
        });
    } else {
        // Export monthly data
        hrCurrentSchedule.forEach(row => {
            csvContent += `${row.month},${row.emi},${row.interest},${row.principal},${row.balance}\n`;
        });
    }
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'home_renovation_loan_schedule.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        alert('CSV download is not supported in this browser.');
    }
}

// Utility function to debounce input changes
function hrDebounce(func, wait) {
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

// Handle window resize for chart responsiveness
window.addEventListener('resize', hrDebounce(() => {
    if (hrBalanceChart) {
        hrBalanceChart.resize();
    }
}, 250));

// Handle visibility change to pause/resume chart animations
document.addEventListener('visibilitychange', () => {
    if (hrBalanceChart) {
        if (document.visibilityState === 'visible') {
            hrBalanceChart.update();
        }
    }
});

// Export functions for potential external use
window.hrCalculateAndUpdate = hrCalculateAndUpdate;
window.hrFormatIndianCurrency = hrFormatIndianCurrency;
