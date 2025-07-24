// RD Calculator JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Global variables
    let rdChart = null;

    // DOM Elements
    const monthlyDepositInput = document.getElementById('monthlyDeposit');
    const monthlyDepositSlider = document.getElementById('monthlyDepositSlider');
    const interestRateInput = document.getElementById('interestRate');
    const interestRateSlider = document.getElementById('interestRateSlider');
    const tenureInput = document.getElementById('tenureYears');
    const tenureSlider = document.getElementById('tenureSlider');
    const compoundingFrequencySelect = document.getElementById('compoundingFrequency');

    // Result elements
    const maturityAmountResult = document.getElementById('maturityAmountResult');
    const interestEarnedResult = document.getElementById('interestEarnedResult');
    const totalDepositsResult = document.getElementById('totalDepositsResult');
    const totalReturnResult = document.getElementById('totalReturnResult');
    const investmentTableBody = document.getElementById('investmentTableBody');

    // Initialize calculator
    init();

    function init() {
        // Sync input fields with sliders
        syncInputSlider(monthlyDepositInput, monthlyDepositSlider);
        syncInputSlider(interestRateInput, interestRateSlider);
        syncInputSlider(tenureInput, tenureSlider);

        // Add event listeners
        monthlyDepositInput.addEventListener('input', calculateAndUpdate);
        monthlyDepositSlider.addEventListener('input', calculateAndUpdate);
        interestRateInput.addEventListener('input', calculateAndUpdate);
        interestRateSlider.addEventListener('input', calculateAndUpdate);
        tenureInput.addEventListener('input', calculateAndUpdate);
        tenureSlider.addEventListener('input', calculateAndUpdate);
        compoundingFrequencySelect.addEventListener('change', calculateAndUpdate);

        // Initial calculation
        calculateAndUpdate();

        // Initialize navigation dropdown
        initializeNavigation();
    }

    function syncInputSlider(input, slider) {
        input.addEventListener('input', () => {
            slider.value = input.value;
        });
        
        slider.addEventListener('input', () => {
            input.value = slider.value;
        });
    }

    function calculateAndUpdate() {
        // Get actual input values without fallbacks
        const monthlyDepositValue = monthlyDepositInput.value;
        const interestRateValue = interestRateInput.value;
        const tenureValue = tenureInput.value;
        
        const monthlyDeposit = parseFloat(monthlyDepositValue);
        const annualInterestRate = parseFloat(interestRateValue);
        const tenureYears = parseInt(tenureValue);
        const compoundingFrequency = compoundingFrequencySelect.value || 'quarterly';

        // Check for empty or zero values
        if (!monthlyDepositValue || monthlyDeposit === 0) {
            const zeroResult = {
                monthlyDeposit: 0,
                annualInterestRate: annualInterestRate || 0,
                tenureYears: tenureYears || 0,
                compoundingFrequency: compoundingFrequency,
                totalDeposits: 0,
                maturityAmount: 0,
                interestEarned: 0,
                totalReturnPercentage: 0,
                yearlyBreakdown: []
            };
            updateResultsDisplay(zeroResult);
            updateChart(zeroResult);
            updateTable(zeroResult);
            return;
        }

        if (!interestRateValue || annualInterestRate === 0) {
            const totalDeposits = monthlyDeposit * (tenureYears || 0) * 12;
            const zeroInterestResult = {
                monthlyDeposit: monthlyDeposit,
                annualInterestRate: 0,
                tenureYears: tenureYears || 0,
                compoundingFrequency: compoundingFrequency,
                totalDeposits: totalDeposits,
                maturityAmount: totalDeposits,
                interestEarned: 0,
                totalReturnPercentage: 0,
                yearlyBreakdown: generateYearlyBreakdown(monthlyDeposit, 0, tenureYears || 0)
            };
            updateResultsDisplay(zeroInterestResult);
            updateChart(zeroInterestResult);
            updateTable(zeroInterestResult);
            return;
        }

        if (!tenureValue || tenureYears === 0) {
            const zeroTenureResult = {
                monthlyDeposit: monthlyDeposit,
                annualInterestRate: annualInterestRate,
                tenureYears: 0,
                compoundingFrequency: compoundingFrequency,
                totalDeposits: 0,
                maturityAmount: 0,
                interestEarned: 0,
                totalReturnPercentage: 0,
                yearlyBreakdown: []
            };
            updateResultsDisplay(zeroTenureResult);
            updateChart(zeroTenureResult);
            updateTable(zeroTenureResult);
            return;
        }

        // Validate inputs (only show errors for invalid ranges, not zero values)
        if (monthlyDeposit < 100 || monthlyDeposit > 100000) {
            showNotification('Monthly deposit should be between ₹100 and ₹1,00,000', 'error');
            return;
        }
        
        if (annualInterestRate < 0 || annualInterestRate > 15) {
            showNotification('Interest rate should be between 0% and 15%', 'error');
            return;
        }
        
        if (tenureYears < 0 || tenureYears > 30) {
            showNotification('Tenure should be between 0 and 30 years', 'error');
            return;
        }

        // Calculate RD returns
        const result = calculateRDReturns(monthlyDeposit, annualInterestRate, tenureYears, compoundingFrequency);
        
        // Update results display
        updateResultsDisplay(result);
        updateChart(result);
        updateTable(result);
    }

    function calculateRDReturns(monthlyDeposit, annualInterestRate, tenureYears, compoundingFrequency) {
        try {
            // Handle zero or invalid inputs
            if (!monthlyDeposit || monthlyDeposit <= 0) {
                return {
                    monthlyDeposit: 0,
                    annualInterestRate: annualInterestRate || 0,
                    tenureYears: tenureYears || 0,
                    compoundingFrequency: compoundingFrequency,
                    totalDeposits: 0,
                    maturityAmount: 0,
                    interestEarned: 0,
                    totalReturnPercentage: 0,
                    yearlyBreakdown: []
                };
            }

            if (!tenureYears || tenureYears <= 0) {
                return {
                    monthlyDeposit: monthlyDeposit,
                    annualInterestRate: annualInterestRate || 0,
                    tenureYears: 0,
                    compoundingFrequency: compoundingFrequency,
                    totalDeposits: 0,
                    maturityAmount: 0,
                    interestEarned: 0,
                    totalReturnPercentage: 0,
                    yearlyBreakdown: []
                };
            }

            // Convert annual rate to monthly rate (decimal)
            const monthlyRate = annualInterestRate / 12 / 100;
            
            // Total number of months
            const totalMonths = tenureYears * 12;
            
            // Calculate total deposits
            const totalDeposits = monthlyDeposit * totalMonths;
            
            let maturityAmount;
            
            if (!annualInterestRate || annualInterestRate <= 0 || monthlyRate === 0) {
                // If interest rate is 0, maturity amount is just total deposits
                maturityAmount = totalDeposits;
            } else {
                // RD compound interest formula
                // M = R * [((1+i)^n - 1) / i] * (1+i)
                // Where: M = Maturity Amount, R = Monthly deposit, i = Monthly interest rate, n = Number of months
                maturityAmount = monthlyDeposit * (((1 + monthlyRate) ** totalMonths - 1) / monthlyRate) * (1 + monthlyRate);
            }
            
            // Calculate interest earned
            const interestEarned = maturityAmount - totalDeposits;
            
            // Calculate total return percentage
            const totalReturnPercentage = totalDeposits > 0 ? (interestEarned / totalDeposits) * 100 : 0;
            
            // Generate yearly breakdown
            const yearlyBreakdown = generateYearlyBreakdown(monthlyDeposit, monthlyRate, tenureYears);
            
            return {
                monthlyDeposit: monthlyDeposit,
                annualInterestRate: annualInterestRate || 0,
                tenureYears: tenureYears,
                compoundingFrequency: compoundingFrequency,
                totalDeposits: Math.round(totalDeposits),
                maturityAmount: Math.round(maturityAmount),
                interestEarned: Math.round(interestEarned),
                totalReturnPercentage: Math.round(totalReturnPercentage * 100) / 100,
                yearlyBreakdown: yearlyBreakdown
            };
        } catch (error) {
            console.error('Calculation error:', error);
            return {
                monthlyDeposit: 0,
                totalDeposits: 0,
                maturityAmount: 0,
                interestEarned: 0,
                totalReturnPercentage: 0,
                yearlyBreakdown: []
            };
        }
    }

    function generateYearlyBreakdown(monthlyDeposit, monthlyRate, tenureYears) {
        const breakdown = [];
        
        // Handle zero or invalid inputs
        if (!monthlyDeposit || monthlyDeposit <= 0 || !tenureYears || tenureYears <= 0) {
            return breakdown;
        }
        
        let cumulativeDeposits = 0;
        let currentBalance = 0;
        
        for (let year = 1; year <= tenureYears; year++) {
            const annualDeposits = monthlyDeposit * 12;
            cumulativeDeposits += annualDeposits;
            
            // Calculate balance at end of year
            if (!monthlyRate || monthlyRate <= 0) {
                // No interest case
                currentBalance = cumulativeDeposits;
            } else {
                // With interest case
                for (let month = 1; month <= 12; month++) {
                    currentBalance = (currentBalance + monthlyDeposit) * (1 + monthlyRate);
                }
            }
            
            const interestEarned = currentBalance - cumulativeDeposits;
            
            breakdown.push({
                year: year,
                annualDeposits: annualDeposits,
                cumulativeDeposits: cumulativeDeposits,
                interestEarned: Math.round(interestEarned),
                totalValue: Math.round(currentBalance)
            });
        }
        
        return breakdown;
    }

    function updateResultsDisplay(result) {
        maturityAmountResult.textContent = formatCurrency(result.maturityAmount);
        interestEarnedResult.textContent = formatCurrency(result.interestEarned);
        totalDepositsResult.textContent = formatCurrency(result.totalDeposits);
        totalReturnResult.textContent = result.totalReturnPercentage + '%';
    }

    function updateChart(result) {
        const ctx = document.getElementById('rdChart').getContext('2d');
        
        if (rdChart) {
            rdChart.destroy();
        }
        
        // Handle zero values in chart
        const totalDeposits = result.totalDeposits || 0;
        const interestEarned = result.interestEarned || 0;
        
        // If both values are zero, show a placeholder
        if (totalDeposits === 0 && interestEarned === 0) {
            rdChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['No Data'],
                    datasets: [{
                        data: [1],
                        backgroundColor: ['#E5E7EB'],
                        borderWidth: 2,
                        borderColor: '#ffffff'
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
                            enabled: false
                        }
                    },
                    cutout: '60%'
                }
            });
            return;
        }
        
        rdChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Total Deposits', 'Interest Earned'],
                datasets: [{
                    data: [totalDeposits, interestEarned],
                    backgroundColor: ['#3B82F6', '#10B981'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 14,
                                weight: 500
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + formatCurrency(context.raw);
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }

    function updateTable(result) {
        let tableHTML = '';
        
        // Handle empty breakdown
        if (!result.yearlyBreakdown || result.yearlyBreakdown.length === 0) {
            tableHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: #6b7280; font-style: italic; padding: 20px;">
                        No data to display. Please enter valid input values.
                    </td>
                </tr>
            `;
        } else {
            result.yearlyBreakdown.forEach(row => {
                tableHTML += `
                    <tr>
                        <td>${row.year}</td>
                        <td>${formatCurrency(row.annualDeposits)}</td>
                        <td>${formatCurrency(row.cumulativeDeposits)}</td>
                        <td>${formatCurrency(row.interestEarned)}</td>
                        <td>${formatCurrency(row.totalValue)}</td>
                    </tr>
                `;
            });
        }
        
        if (investmentTableBody) {
            investmentTableBody.innerHTML = tableHTML;
        }
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    }

    function showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => {
            notification.remove();
        });

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    function initializeNavigation() {
        // Handle dropdown navigation
        const dropdown = document.querySelector('.dropdown');
        const dropdownToggle = document.querySelector('.dropdown-toggle');
        
        if (dropdown && dropdownToggle) {
            let isOpen = false;
            
            dropdownToggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                isOpen = !isOpen;
                dropdown.classList.toggle('open', isOpen);
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', function(e) {
                if (!dropdown.contains(e.target)) {
                    isOpen = false;
                    dropdown.classList.remove('open');
                }
            });
            
            // Close dropdown when pressing Escape
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && isOpen) {
                    isOpen = false;
                    dropdown.classList.remove('open');
                }
            });
        }
    }

    // Export functions for global access if needed
    window.RDCalculator = {
        calculateRDReturns,
        formatCurrency,
        showNotification
    };

    // Handle URL parameters if any
    function loadFromUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        
        if (urlParams.get('monthlyDeposit')) {
            monthlyDepositInput.value = urlParams.get('monthlyDeposit');
            monthlyDepositSlider.value = urlParams.get('monthlyDeposit');
        }
        
        if (urlParams.get('interestRate')) {
            interestRateInput.value = urlParams.get('interestRate');
            interestRateSlider.value = urlParams.get('interestRate');
        }
        
        if (urlParams.get('tenure')) {
            tenureInput.value = urlParams.get('tenure');
            tenureSlider.value = urlParams.get('tenure');
        }
        
        if (urlParams.get('compounding')) {
            compoundingFrequencySelect.value = urlParams.get('compounding');
        }
        
        // Recalculate with URL parameters
        if (urlParams.toString()) {
            calculateAndUpdate();
        }
    }

    // Load URL parameters on initialization
    loadFromUrlParameters();

    // Print functionality
    function generatePrintableContent() {
        const monthlyDeposit = parseFloat(monthlyDepositInput.value) || 5000;
        const interestRate = parseFloat(interestRateInput.value) || 6.5;
        const tenure = parseInt(tenureInput.value) || 5;
        const compounding = compoundingFrequencySelect.value || 'quarterly';
        
        const result = calculateRDReturns(monthlyDeposit, interestRate, tenure, compounding);
        
        return `
            <div class="header">
                <h1>RD Calculator Results</h1>
                <p>Monthly Deposit: ${formatCurrency(monthlyDeposit)} | Interest Rate: ${interestRate}% | Tenure: ${tenure} years | Compounding: ${compounding}</p>
            </div>
            
            <div class="results-grid">
                <div class="result-item">
                    <div class="result-label">Maturity Amount</div>
                    <div class="result-value">${formatCurrency(result.maturityAmount)}</div>
                </div>
                <div class="result-item">
                    <div class="result-label">Interest Earned</div>
                    <div class="result-value">${formatCurrency(result.interestEarned)}</div>
                </div>
                <div class="result-item">
                    <div class="result-label">Total Deposits</div>
                    <div class="result-value">${formatCurrency(result.totalDeposits)}</div>
                </div>
                <div class="result-item">
                    <div class="result-label">Total Return</div>
                    <div class="result-value">${result.totalReturnPercentage}%</div>
                </div>
            </div>
            
            <h3>Year-wise Investment Growth</h3>
            <table>
                <thead>
                    <tr>
                        <th>Year</th>
                        <th>Annual Deposits</th>
                        <th>Cumulative Deposits</th>
                        <th>Interest Earned</th>
                        <th>Total Value</th>
                    </tr>
                </thead>
                <tbody>
                    ${result.yearlyBreakdown.map(row => `
                        <tr>
                            <td>${row.year}</td>
                            <td>${formatCurrency(row.annualDeposits)}</td>
                            <td>${formatCurrency(row.cumulativeDeposits)}</td>
                            <td>${formatCurrency(row.interestEarned)}</td>
                            <td>${formatCurrency(row.totalValue)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    // Add print functionality
    window.printResults = function() {
        const printContent = generatePrintableContent();
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <html>
                <head>
                    <title>RD Calculator - Results</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .results-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
                        .result-item { padding: 15px; border: 1px solid #ddd; border-radius: 8px; text-align: center; }
                        .result-label { font-weight: bold; margin-bottom: 5px; }
                        .result-value { font-size: 1.2em; color: #2563eb; font-weight: bold; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { padding: 10px; border: 1px solid #ddd; text-align: center; }
                        th { background: #f5f5f5; font-weight: bold; }
                        h3 { margin-top: 30px; }
                        @media print { 
                            body { margin: 0; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    ${printContent}
                </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    // Share functionality
    window.shareResults = function() {
        const monthlyDeposit = parseFloat(monthlyDepositInput.value) || 5000;
        const interestRate = parseFloat(interestRateInput.value) || 6.5;
        const tenure = parseInt(tenureInput.value) || 5;
        const compounding = compoundingFrequencySelect.value || 'quarterly';
        
        const result = calculateRDReturns(monthlyDeposit, interestRate, tenure, compounding);
        
        const shareUrl = `${window.location.origin}${window.location.pathname}?monthlyDeposit=${monthlyDeposit}&interestRate=${interestRate}&tenure=${tenure}&compounding=${compounding}`;
        
        const shareText = `RD Calculator Results:
Monthly Deposit: ${formatCurrency(monthlyDeposit)}
Interest Rate: ${interestRate}%
Tenure: ${tenure} years
Maturity Amount: ${formatCurrency(result.maturityAmount)}
Interest Earned: ${formatCurrency(result.interestEarned)}

Calculate your RD returns: ${shareUrl}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'RD Calculator Results',
                text: shareText,
                url: shareUrl
            }).then(() => {
                showNotification('Results shared successfully!', 'success');
            }).catch(() => {
                copyToClipboard(shareText);
            });
        } else {
            copyToClipboard(shareText);
        }
    };

    function copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                showNotification('Results copied to clipboard!', 'success');
            }).catch(() => {
                fallbackCopyToClipboard(text);
            });
        } else {
            fallbackCopyToClipboard(text);
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
            document.execCommand('copy');
            showNotification('Results copied to clipboard!', 'success');
        } catch (err) {
            showNotification('Failed to copy results', 'error');
        } finally {
            document.body.removeChild(textArea);
        }
    }
});
