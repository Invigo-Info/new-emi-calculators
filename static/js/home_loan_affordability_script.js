// Global variables for charts
let affordabilityPieChart;
let affordabilityBarChart;
let currentPaymentSchedule = [];

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    calculateAndUpdate();
});

function setupEventListeners() {
    // Sync sliders with input fields
    syncSliderWithInput('grossMonthlyIncome', 'grossMonthlyIncomeSlider');
    syncSliderWithInput('otherMonthlyEmis', 'otherMonthlyEmisSlider');
    syncSliderWithInput('desiredLoanTenure', 'desiredLoanTenureSlider');
    syncSliderWithInput('rateOfInterest', 'rateOfInterestSlider');
    syncSliderWithInput('myFunds', 'myFundsSlider');

    // Add change listeners
    document.getElementById('grossMonthlyIncome').addEventListener('input', calculateAndUpdate);
    document.getElementById('grossMonthlyIncomeSlider').addEventListener('input', calculateAndUpdate);
    document.getElementById('otherMonthlyEmis').addEventListener('input', calculateAndUpdate);
    document.getElementById('otherMonthlyEmisSlider').addEventListener('input', calculateAndUpdate);
    document.getElementById('desiredLoanTenure').addEventListener('input', calculateAndUpdate);
    document.getElementById('desiredLoanTenureSlider').addEventListener('input', calculateAndUpdate);
    document.getElementById('rateOfInterest').addEventListener('input', calculateAndUpdate);
    document.getElementById('rateOfInterestSlider').addEventListener('input', calculateAndUpdate);
    document.getElementById('myFunds').addEventListener('input', calculateAndUpdate);
    document.getElementById('myFundsSlider').addEventListener('input', calculateAndUpdate);
}

function syncSliderWithInput(inputId, sliderId) {
    const input = document.getElementById(inputId);
    const slider = document.getElementById(sliderId);

    input.addEventListener('input', function() {
        slider.value = this.value;
    });

    slider.addEventListener('input', function() {
        input.value = this.value;
    });
}

function calculateAndUpdate() {
    // Get input values
    const grossMonthlyIncome = parseFloat(document.getElementById('grossMonthlyIncome').value) || 0;
    const otherMonthlyEmis = parseFloat(document.getElementById('otherMonthlyEmis').value) || 0;
    const desiredLoanTenure = parseInt(document.getElementById('desiredLoanTenure').value) || 0;
    const rateOfInterest = parseFloat(document.getElementById('rateOfInterest').value) || 0;
    const myFunds = parseFloat(document.getElementById('myFunds').value) || 0;

    // Make API call to calculate affordability
    const data = {
        grossMonthlyIncome: grossMonthlyIncome,
        otherMonthlyEmis: otherMonthlyEmis,
        desiredLoanTenure: desiredLoanTenure,
        rateOfInterest: rateOfInterest,
        myFunds: myFunds
    };

    fetch('/calculate-affordability', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        if (result.error) {
            console.error('Calculation error:', result.error);
            return;
        }

        // Store payment schedule globally
        currentPaymentSchedule = result.payment_schedule || [];
        
        // Update the UI with results
        updateResults(result);
        updateCharts(result);
        updatePaymentScheduleTable(currentPaymentSchedule);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function updateResults(result) {
    // Update eligible amount
    document.getElementById('eligibleAmount').textContent = formatCurrency(result.eligible_loan_amount) + '*';
    
    // Update EMI amount
    document.getElementById('emiAmount').textContent = formatCurrency(result.monthly_emi) + '*';
    
    // Update property cost affordable
    document.getElementById('propertyCostAffordable').textContent = formatCurrency(result.property_cost_affordable);
    
    // Update remaining balance salary
    document.getElementById('remainingBalanceSalary').textContent = formatCurrency(result.remaining_balance_salary);
    
    // Update chart summary values
    document.getElementById('chartLoanAmount').textContent = formatCurrency(result.eligible_loan_amount);
    document.getElementById('chartDownPayment').textContent = formatCurrency(result.down_payment);
    document.getElementById('chartTotalInterest').textContent = formatCurrency(result.total_interest);
    document.getElementById('chartTotalCost').textContent = formatCurrency(result.property_cost_affordable);
}

function updateCharts(result) {
    updatePieChart(result);
    updateBarChart(result);
}

function updatePieChart(result) {
    const ctx = document.getElementById('affordabilityPieChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (affordabilityPieChart) {
        affordabilityPieChart.destroy();
    }
    
    const data = {
        labels: ['Loan Amount', 'Down Payment', 'Total Interest'],
        datasets: [{
            data: [
                result.eligible_loan_amount,
                result.down_payment,
                result.total_interest
            ],
            backgroundColor: [
                '#3182ce',
                '#38a169',
                '#e53e3e'
            ],
            borderWidth: 2,
            borderColor: '#fff'
        }]
    };
    
    affordabilityPieChart = new Chart(ctx, {
        type: 'pie',
        data: data,
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
                            const value = formatCurrency(context.parsed);
                            const percentage = ((context.parsed / (result.eligible_loan_amount + result.down_payment + result.total_interest)) * 100).toFixed(1);
                            return `${context.label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function updateBarChart(result) {
    const ctx = document.getElementById('affordabilityBarChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (affordabilityBarChart) {
        affordabilityBarChart.destroy();
    }
    
    // Prepare yearly data for bar chart
    const yearlyData = currentPaymentSchedule.map(year => ({
        year: year.year,
        principal: year.principal,
        interest: year.interest,
        balance: year.balance
    }));
    
    const labels = yearlyData.map(item => item.year.toString());
    const principalData = yearlyData.map(item => item.principal);
    const interestData = yearlyData.map(item => item.interest);
    const balanceData = yearlyData.map(item => item.balance);
    
    affordabilityBarChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Principal Payment',
                    data: principalData,
                    backgroundColor: '#3182ce',
                    borderColor: '#2c5aa0',
                    borderWidth: 1
                },
                {
                    label: 'Interest Payment',
                    data: interestData,
                    backgroundColor: '#e53e3e',
                    borderColor: '#c53030',
                    borderWidth: 1
                },
                {
                    label: 'Remaining Balance',
                    data: balanceData,
                    backgroundColor: '#38a169',
                    borderColor: '#2f855a',
                    borderWidth: 1,
                    type: 'line',
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Year'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Payment Amount (₹)'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrencyShort(value);
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Balance (₹)'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrencyShort(value);
                        }
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                }
            }
        }
    });
}

function updatePaymentScheduleTable(schedule) {
    const tableBody = document.getElementById('paymentScheduleTableBody');
    tableBody.innerHTML = '';
    
    schedule.forEach((yearData, index) => {
        // Create year row
        const yearRow = document.createElement('tr');
        yearRow.className = 'year-row';
        yearRow.dataset.year = yearData.year;
        
        yearRow.innerHTML = `
            <td>
                <span class="expand-icon">▶</span>
                <span class="year-text">${yearData.year}</span>
            </td>
            <td>${formatCurrency(yearData.principal)}</td>
            <td>${formatCurrency(yearData.interest)}</td>
            <td>${formatCurrency(yearData.emi)}</td>
            <td>${formatCurrency(yearData.totalPayment)}</td>
            <td>${formatCurrency(yearData.balance)}</td>
            <td>${yearData.loanPaidPercentage}%</td>
        `;
        
        // Add click event to toggle monthly data
        yearRow.addEventListener('click', function() {
            toggleYearExpansion(yearData.year, yearData.monthlyData);
        });
        
        tableBody.appendChild(yearRow);
        
        // Create monthly rows (initially hidden)
        yearData.monthlyData.forEach(monthData => {
            const monthRow = document.createElement('tr');
            monthRow.className = 'month-row';
            monthRow.dataset.year = yearData.year;
            
            monthRow.innerHTML = `
                <td class="month-cell">${monthData.month}</td>
                <td>${formatCurrency(monthData.principal)}</td>
                <td>${formatCurrency(monthData.interest)}</td>
                <td>${formatCurrency(monthData.emi)}</td>
                <td>${formatCurrency(monthData.principal + monthData.interest)}</td>
                <td>${formatCurrency(monthData.balance)}</td>
                <td>${monthData.loan_paid_percentage}%</td>
            `;
            
            tableBody.appendChild(monthRow);
        });
    });
}

function toggleYearExpansion(year, monthlyData) {
    const yearRow = document.querySelector(`tr.year-row[data-year="${year}"]`);
    const monthRows = document.querySelectorAll(`tr.month-row[data-year="${year}"]`);
    
    if (yearRow.classList.contains('expanded')) {
        // Collapse
        yearRow.classList.remove('expanded');
        monthRows.forEach(row => row.classList.remove('show'));
    } else {
        // Expand
        yearRow.classList.add('expanded');
        monthRows.forEach(row => row.classList.add('show'));
    }
}

function formatCurrency(amount) {
    if (amount === 0) return '₹0';
    
    // Convert to Indian numbering system (Lakhs and Crores)
    const numStr = Math.round(amount).toString();
    let result = '';
    
    // Process from right to left for Indian numbering
    let len = numStr.length;
    
    // Add commas according to Indian numbering system
    for (let i = 0; i < len; i++) {
        if (i > 0) {
            // Add comma after first 3 digits from right, then every 2 digits
            if (i === 3) {
                result = ',' + result;
            } else if (i > 3 && (i - 3) % 2 === 0) {
                result = ',' + result;
            }
        }
        result = numStr[len - 1 - i] + result;
    }
    
    return '₹' + result;
}

function formatCurrencyShort(amount) {
    if (amount >= 10000000) {
        return '₹' + (amount / 10000000).toFixed(1) + 'Cr';
    } else if (amount >= 100000) {
        return '₹' + (amount / 100000).toFixed(1) + 'L';
    } else if (amount >= 1000) {
        return '₹' + (amount / 1000).toFixed(1) + 'K';
    }
    return '₹' + Math.round(amount);
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