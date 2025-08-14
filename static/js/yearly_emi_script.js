// Yearly EMI Calculator Script
class YearlyEmiCalculator {
    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.chart = null;
        this.calculateEMI();
    }

    initializeElements() {
        // Input elements
        this.loanAmountInput = document.getElementById('loanAmount');
        this.loanAmountSlider = document.getElementById('loanAmountSlider');
        this.interestRateInput = document.getElementById('interestRate');
        this.interestRateSlider = document.getElementById('interestRateSlider');
        this.tenureYearsInput = document.getElementById('tenureYears');
        this.tenureSlider = document.getElementById('tenureSlider');

        // Result elements
        this.yearlyEmiResult = document.getElementById('yearlyEmiResult');
        this.numberOfPaymentsResult = document.getElementById('numberOfPaymentsResult');
        this.totalInterestResult = document.getElementById('totalInterestResult');
        this.totalPaymentResult = document.getElementById('totalPaymentResult');

        // Schedule elements
        this.scheduleTableBody = document.getElementById('scheduleTableBody');
        this.downloadCsvBtn = document.getElementById('downloadCsvBtn');

        // Chart elements
        this.chartCanvas = document.getElementById('yearlyEmiChart');
    }

    setupEventListeners() {
        // Input change listeners
        this.loanAmountInput.addEventListener('input', () => this.handleLoanAmountChange());
        this.loanAmountSlider.addEventListener('input', () => this.handleLoanAmountSliderChange());
        
        this.interestRateInput.addEventListener('input', () => this.handleInterestRateChange());
        this.interestRateSlider.addEventListener('input', () => this.handleInterestRateSliderChange());
        
        this.tenureYearsInput.addEventListener('input', () => this.handleTenureChange());
        this.tenureSlider.addEventListener('input', () => this.handleTenureSliderChange());

        // Download CSV listener
        this.downloadCsvBtn.addEventListener('click', () => this.downloadCsv());

        // Validation listeners
        this.loanAmountInput.addEventListener('blur', () => this.validateLoanAmount());
        this.interestRateInput.addEventListener('blur', () => this.validateInterestRate());
        this.tenureYearsInput.addEventListener('blur', () => this.validateTenure());
    }

    handleLoanAmountChange() {
        const value = parseFloat(this.loanAmountInput.value) || 0;
        this.loanAmountSlider.value = Math.min(Math.max(value, 50000), 20000000);
        this.calculateEMI();
    }

    handleLoanAmountSliderChange() {
        this.loanAmountInput.value = this.loanAmountSlider.value;
        this.calculateEMI();
    }

    handleInterestRateChange() {
        const value = parseFloat(this.interestRateInput.value) || 0;
        this.interestRateSlider.value = Math.min(Math.max(value, 0.1), 36.0);
        this.calculateEMI();
    }

    handleInterestRateSliderChange() {
        this.interestRateInput.value = this.interestRateSlider.value;
        this.calculateEMI();
    }

    handleTenureChange() {
        const value = parseInt(this.tenureYearsInput.value) || 0;
        this.tenureSlider.value = Math.min(Math.max(value, 1), 30);
        this.calculateEMI();
    }

    handleTenureSliderChange() {
        this.tenureYearsInput.value = this.tenureSlider.value;
        this.calculateEMI();
    }

    validateLoanAmount() {
        const value = parseFloat(this.loanAmountInput.value);
        if (isNaN(value) || value < 50000) {
            this.loanAmountInput.value = 50000;
            this.loanAmountSlider.value = 50000;
        } else if (value > 20000000) {
            this.loanAmountInput.value = 20000000;
            this.loanAmountSlider.value = 20000000;
        }
        this.calculateEMI();
    }

    validateInterestRate() {
        const value = parseFloat(this.interestRateInput.value);
        if (isNaN(value) || value < 0.1) {
            this.interestRateInput.value = 0.1;
            this.interestRateSlider.value = 0.1;
        } else if (value > 36.0) {
            this.interestRateInput.value = 36.0;
            this.interestRateSlider.value = 36.0;
        }
        this.calculateEMI();
    }

    validateTenure() {
        const value = parseInt(this.tenureYearsInput.value);
        if (isNaN(value) || value < 1) {
            this.tenureYearsInput.value = 1;
            this.tenureSlider.value = 1;
        } else if (value > 30) {
            this.tenureYearsInput.value = 30;
            this.tenureSlider.value = 30;
        }
        this.calculateEMI();
    }

    calculateEMI() {
        const principal = parseFloat(this.loanAmountInput.value) || 0;
        const interestRate = parseFloat(this.interestRateInput.value) || 0;
        const tenureYears = parseInt(this.tenureYearsInput.value) || 0;

        // Validate inputs
        if (principal <= 0 || tenureYears <= 0) {
            this.displayError('Please enter valid loan amount and tenure');
            return;
        }

        // Send request to backend
        fetch('/calculate-yearly-emi', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                principal: principal,
                interestRate: interestRate,
                tenureYears: tenureYears
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                this.displayResults(data);
                this.generateScheduleTable(data.amortizationSchedule);
                this.updateChart(data);
            } else {
                this.displayError(data.error || 'Calculation failed');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            this.displayError('Network error occurred');
        });
    }

    displayResults(data) {
        this.yearlyEmiResult.textContent = this.formatCurrency(data.yearlyEmi);
        this.numberOfPaymentsResult.textContent = data.numberOfPayments.toString();
        this.totalInterestResult.textContent = this.formatCurrency(data.totalInterest);
        this.totalPaymentResult.textContent = this.formatCurrency(data.totalPayment);
    }

    generateScheduleTable(schedule) {
        this.scheduleTableBody.innerHTML = '';
        
        schedule.forEach(payment => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${payment.year}</td>
                <td>${this.formatCurrency(payment.interest)}</td>
                <td>${this.formatCurrency(payment.principal)}</td>
                <td>${this.formatCurrency(payment.yearlyPayment)}</td>
                <td>${this.formatCurrency(payment.balance)}</td>
            `;
            this.scheduleTableBody.appendChild(row);
        });
    }

    updateChart(data) {
        const ctx = this.chartCanvas.getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.chart) {
            this.chart.destroy();
        }

        // Create pie chart showing principal vs interest
        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Principal Amount', 'Total Interest'],
                datasets: [{
                    data: [data.principal, data.totalInterest],
                    backgroundColor: [
                        'rgba(102, 126, 234, 0.8)',
                        'rgba(245, 87, 108, 0.8)'
                    ],
                    borderColor: [
                        'rgba(102, 126, 234, 1)',
                        'rgba(245, 87, 108, 1)'
                    ],
                    borderWidth: 2,
                    hoverBackgroundColor: [
                        'rgba(102, 126, 234, 0.9)',
                        'rgba(245, 87, 108, 0.9)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Loan Amount Breakdown',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
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
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ₹${value.toLocaleString('en-IN')} (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateScale: true,
                    animateRotate: true
                }
            }
        });
    }

    downloadCsv() {
        const principal = parseFloat(this.loanAmountInput.value) || 0;
        const interestRate = parseFloat(this.interestRateInput.value) || 0;
        const tenureYears = parseInt(this.tenureYearsInput.value) || 0;

        // Prepare CSV content
        let csvContent = 'Yearly EMI Calculator - Amortization Schedule\n\n';
        csvContent += `Loan Amount: ₹${principal.toLocaleString('en-IN')}\n`;
        csvContent += `Interest Rate: ${interestRate}% per annum\n`;
        csvContent += `Tenure: ${tenureYears} years\n`;
        csvContent += `Yearly EMI: ${this.yearlyEmiResult.textContent}\n`;
        csvContent += `Total Interest: ${this.totalInterestResult.textContent}\n`;
        csvContent += `Total Payment: ${this.totalPaymentResult.textContent}\n\n`;
        
        csvContent += 'Year #,Interest,Principal,Payment,Remaining Balance\n';
        
        // Add schedule rows
        const rows = this.scheduleTableBody.querySelectorAll('tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            const rowData = Array.from(cells).map(cell => cell.textContent.replace(/₹|,/g, ''));
            csvContent += rowData.join(',') + '\n';
        });

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `yearly-emi-schedule-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    formatCurrency(amount) {
        if (amount === undefined || amount === null || isNaN(amount)) {
            return '₹0';
        }
        return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
    }

    displayError(message) {
        // Create or update error message display
        let errorDiv = document.querySelector('.error-state');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'error-state';
            this.yearlyEmiResult.parentNode.appendChild(errorDiv);
        }
        errorDiv.textContent = message;
        
        // Hide error after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new YearlyEmiCalculator();
});

// Handle page visibility change to pause/resume calculations if needed
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // Page is hidden, could pause expensive operations
        console.log('Page hidden');
    } else {
        // Page is visible again
        console.log('Page visible');
    }
});
