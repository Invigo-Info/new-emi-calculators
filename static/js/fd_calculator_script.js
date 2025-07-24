// FD Calculator JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Global variables
    let fdChart = null;

    // DOM Elements
    const principalAmountInput = document.getElementById('principalAmount');
    const principalAmountSlider = document.getElementById('principalAmountSlider');
    const interestRateInput = document.getElementById('interestRate');
    const interestRateSlider = document.getElementById('interestRateSlider');
    const tenureInput = document.getElementById('tenureYears');
    const tenureSlider = document.getElementById('tenureSlider');
    const compoundingFrequencySelect = document.getElementById('compoundingFrequency');

    // Result elements
    const maturityAmountResult = document.getElementById('maturityAmountResult');
    const interestEarnedResult = document.getElementById('interestEarnedResult');
    const principalAmountResult = document.getElementById('principalAmountResult');
    const totalReturnResult = document.getElementById('totalReturnResult');

    // Initialize calculator
    init();

    function init() {
        // Sync input fields with sliders
        syncInputSlider(principalAmountInput, principalAmountSlider);
        syncInputSlider(interestRateInput, interestRateSlider);
        syncInputSlider(tenureInput, tenureSlider);

        // Add event listeners
        principalAmountInput.addEventListener('input', calculateAndUpdate);
        principalAmountSlider.addEventListener('input', calculateAndUpdate);
        interestRateInput.addEventListener('input', calculateAndUpdate);
        interestRateSlider.addEventListener('input', calculateAndUpdate);
        tenureInput.addEventListener('input', calculateAndUpdate);
        tenureSlider.addEventListener('input', calculateAndUpdate);
        compoundingFrequencySelect.addEventListener('change', calculateAndUpdate);

        // Initial calculation
        calculateAndUpdate();

        // Load URL parameters if any
        loadFromUrlParameters();
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
        const principalAmountValue = principalAmountInput.value;
        const interestRateValue = interestRateInput.value;
        const tenureValue = tenureInput.value;
        
        const principalAmount = parseFloat(principalAmountValue);
        const annualInterestRate = parseFloat(interestRateValue);
        const tenureYears = parseInt(tenureValue);
        const compoundingFrequency = compoundingFrequencySelect.value || 'quarterly';

        // Check for empty or zero values
        if (!principalAmountValue || principalAmount === 0) {
            const zeroResult = {
                principalAmount: 0,
                annualInterestRate: annualInterestRate || 0,
                tenureYears: tenureYears || 0,
                compoundingFrequency: compoundingFrequency,
                maturityAmount: 0,
                interestEarned: 0,
                totalReturnPercentage: 0
            };
            updateResultsDisplay(zeroResult);
            updateChart(zeroResult);
            return;
        }

        if (!interestRateValue || annualInterestRate === 0) {
            const zeroInterestResult = {
                principalAmount: principalAmount,
                annualInterestRate: 0,
                tenureYears: tenureYears || 0,
                compoundingFrequency: compoundingFrequency,
                maturityAmount: principalAmount,
                interestEarned: 0,
                totalReturnPercentage: 0
            };
            updateResultsDisplay(zeroInterestResult);
            updateChart(zeroInterestResult);
            return;
        }

        if (!tenureValue || tenureYears === 0) {
            const zeroTenureResult = {
                principalAmount: principalAmount,
                annualInterestRate: annualInterestRate,
                tenureYears: 0,
                compoundingFrequency: compoundingFrequency,
                maturityAmount: principalAmount,
                interestEarned: 0,
                totalReturnPercentage: 0
            };
            updateResultsDisplay(zeroTenureResult);
            updateChart(zeroTenureResult);
            return;
        }

        // Validate inputs (only show errors for invalid ranges, not zero values)
        if (principalAmount < 1000 || principalAmount > 10000000) {
            showNotification('Principal amount should be between ₹1,000 and ₹1,00,00,000', 'error');
            return;
        }
        
        if (annualInterestRate < 0 || annualInterestRate > 15) {
            showNotification('Interest rate should be between 0% and 15%', 'error');
            return;
        }
        
        if (tenureYears < 0 || tenureYears > 20) {
            showNotification('Tenure should be between 0 and 20 years', 'error');
            return;
        }

        // Calculate FD returns
        const result = calculateFDReturns(principalAmount, annualInterestRate, tenureYears, compoundingFrequency);
        
        // Update results display
        updateResultsDisplay(result);
        updateChart(result);
    }

    function calculateFDReturns(principalAmount, annualInterestRate, tenureYears, compoundingFrequency) {
        try {
            // Handle zero or invalid inputs
            if (!principalAmount || principalAmount <= 0) {
                return {
                    principalAmount: 0,
                    annualInterestRate: annualInterestRate || 0,
                    tenureYears: tenureYears || 0,
                    compoundingFrequency: compoundingFrequency,
                    maturityAmount: 0,
                    interestEarned: 0,
                    totalReturnPercentage: 0
                };
            }

            if (!annualInterestRate || annualInterestRate <= 0) {
                return {
                    principalAmount: principalAmount,
                    annualInterestRate: 0,
                    tenureYears: tenureYears || 0,
                    compoundingFrequency: compoundingFrequency,
                    maturityAmount: principalAmount,
                    interestEarned: 0,
                    totalReturnPercentage: 0
                };
            }

            if (!tenureYears || tenureYears <= 0) {
                return {
                    principalAmount: principalAmount,
                    annualInterestRate: annualInterestRate,
                    tenureYears: 0,
                    compoundingFrequency: compoundingFrequency,
                    maturityAmount: principalAmount,
                    interestEarned: 0,
                    totalReturnPercentage: 0
                };
            }

            // Convert annual rate to decimal
            const annualRateDecimal = annualInterestRate / 100;
            
            // Determine compounding periods per year
            const compoundingPeriods = {
                'monthly': 12,
                'quarterly': 4,
                'half-yearly': 2,
                'yearly': 1
            };
            
            const n = compoundingPeriods[compoundingFrequency] || 4; // Default to quarterly
            
            // Calculate maturity amount using compound interest formula
            // A = P(1 + r/n)^(nt)
            const maturityAmount = principalAmount * Math.pow((1 + annualRateDecimal / n), (n * tenureYears));
            
            // Calculate interest earned
            const interestEarned = maturityAmount - principalAmount;
            
            // Calculate total return percentage
            const totalReturnPercentage = (interestEarned / principalAmount) * 100;
            
            return {
                principalAmount: principalAmount,
                annualInterestRate: annualInterestRate,
                tenureYears: tenureYears,
                compoundingFrequency: compoundingFrequency,
                maturityAmount: Math.round(maturityAmount),
                interestEarned: Math.round(interestEarned),
                totalReturnPercentage: Math.round(totalReturnPercentage * 100) / 100
            };
        } catch (error) {
            console.error('Calculation error:', error);
            return {
                principalAmount: 0,
                maturityAmount: 0,
                interestEarned: 0,
                totalReturnPercentage: 0
            };
        }
    }

    function updateResultsDisplay(result) {
        maturityAmountResult.textContent = formatCurrency(result.maturityAmount);
        interestEarnedResult.textContent = formatCurrency(result.interestEarned);
        principalAmountResult.textContent = formatCurrency(result.principalAmount);
        totalReturnResult.textContent = result.totalReturnPercentage + '%';
    }

    function updateChart(result) {
        const ctx = document.getElementById('fdChart').getContext('2d');
        
        if (fdChart) {
            fdChart.destroy();
        }
        
        // Handle zero values in chart
        const principalAmount = result.principalAmount || 0;
        const interestEarned = result.interestEarned || 0;
        
        // If both values are zero, show a placeholder
        if (principalAmount === 0 && interestEarned === 0) {
            fdChart = new Chart(ctx, {
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
        
        fdChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Principal Amount', 'Interest Earned'],
                datasets: [{
                    data: [principalAmount, interestEarned],
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

    function toggleMegaMenu() {
        const megaMenu = document.querySelector('.mega-menu');
        megaMenu.classList.toggle('open');
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!megaMenu.contains(e.target)) {
                megaMenu.classList.remove('open');
            }
        });
    }

    // Export functions for global access
    window.FDCalculator = {
        calculateFDReturns,
        formatCurrency,
        showNotification,
        toggleMegaMenu
    };

    // Make toggleMegaMenu globally accessible
    window.toggleMegaMenu = toggleMegaMenu;

    // Handle URL parameters
    function loadFromUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        
        if (urlParams.get('principalAmount')) {
            principalAmountInput.value = urlParams.get('principalAmount');
            principalAmountSlider.value = urlParams.get('principalAmount');
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

    // Print functionality
    function generatePrintableContent() {
        const principalAmount = parseFloat(principalAmountInput.value) || 100000;
        const interestRate = parseFloat(interestRateInput.value) || 6.5;
        const tenure = parseInt(tenureInput.value) || 5;
        const compounding = compoundingFrequencySelect.value || 'quarterly';
        
        const result = calculateFDReturns(principalAmount, interestRate, tenure, compounding);
        
        return `
            <div class="header">
                <h1>FD Calculator Results</h1>
                <p>Principal Amount: ${formatCurrency(principalAmount)} | Interest Rate: ${interestRate}% | Tenure: ${tenure} years | Compounding: ${compounding}</p>
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
                    <div class="result-label">Principal Amount</div>
                    <div class="result-value">${formatCurrency(result.principalAmount)}</div>
                </div>
                <div class="result-item">
                    <div class="result-label">Total Return</div>
                    <div class="result-value">${result.totalReturnPercentage}%</div>
                </div>
            </div>
        `;
    }

    // Add print functionality
    window.printResults = function() {
        const printContent = generatePrintableContent();
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <html>
                <head>
                    <title>FD Calculator - Results</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .results-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
                        .result-item { padding: 15px; border: 1px solid #ddd; border-radius: 8px; text-align: center; }
                        .result-label { font-weight: bold; margin-bottom: 5px; }
                        .result-value { font-size: 1.2em; color: #2563eb; font-weight: bold; }
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
        const principalAmount = parseFloat(principalAmountInput.value) || 100000;
        const interestRate = parseFloat(interestRateInput.value) || 6.5;
        const tenure = parseInt(tenureInput.value) || 5;
        const compounding = compoundingFrequencySelect.value || 'quarterly';
        
        const result = calculateFDReturns(principalAmount, interestRate, tenure, compounding);
        
        const shareUrl = `${window.location.origin}${window.location.pathname}?principalAmount=${principalAmount}&interestRate=${interestRate}&tenure=${tenure}&compounding=${compounding}`;
        
        const shareText = `FD Calculator Results:
Principal Amount: ${formatCurrency(principalAmount)}
Interest Rate: ${interestRate}%
Tenure: ${tenure} years
Maturity Amount: ${formatCurrency(result.maturityAmount)}
Interest Earned: ${formatCurrency(result.interestEarned)}

Calculate your FD returns: ${shareUrl}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'FD Calculator Results',
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

    // Excel export functionality
    window.exportToExcel = function() {
        try {
            const principalAmount = parseFloat(principalAmountInput.value) || 100000;
            const interestRate = parseFloat(interestRateInput.value) || 6.5;
            const tenure = parseInt(tenureInput.value) || 5;
            const compounding = compoundingFrequencySelect.value || 'quarterly';
            
            const result = calculateFDReturns(principalAmount, interestRate, tenure, compounding);
            
            // Create CSV content
            let csvContent = "FD Calculator Results\n\n";
            csvContent += "Input Parameters\n";
            csvContent += `Principal Amount,${formatCurrency(principalAmount)}\n`;
            csvContent += `Interest Rate,${interestRate}%\n`;
            csvContent += `Tenure,${tenure} years\n`;
            csvContent += `Compounding Frequency,${compounding}\n\n`;
            
            csvContent += "Results\n";
            csvContent += `Maturity Amount,${formatCurrency(result.maturityAmount)}\n`;
            csvContent += `Interest Earned,${formatCurrency(result.interestEarned)}\n`;
            csvContent += `Total Return,${result.totalReturnPercentage}%\n\n`;
            
            // Generate year-wise breakdown
            csvContent += "Year-wise Breakdown\n";
            csvContent += "Year,Amount at End of Year,Interest for Year,Cumulative Interest\n";
            
            let cumulativeInterest = 0;
            for (let year = 1; year <= tenure; year++) {
                const amountAtEndOfYear = principalAmount * Math.pow((1 + (interestRate/100) / (result.compoundingFrequency === 'quarterly' ? 4 : result.compoundingFrequency === 'monthly' ? 12 : result.compoundingFrequency === 'half-yearly' ? 2 : 1)), year * (result.compoundingFrequency === 'quarterly' ? 4 : result.compoundingFrequency === 'monthly' ? 12 : result.compoundingFrequency === 'half-yearly' ? 2 : 1));
                const interestForYear = year === 1 ? amountAtEndOfYear - principalAmount : amountAtEndOfYear - (principalAmount * Math.pow((1 + (interestRate/100) / (result.compoundingFrequency === 'quarterly' ? 4 : result.compoundingFrequency === 'monthly' ? 12 : result.compoundingFrequency === 'half-yearly' ? 2 : 1)), (year-1) * (result.compoundingFrequency === 'quarterly' ? 4 : result.compoundingFrequency === 'monthly' ? 12 : result.compoundingFrequency === 'half-yearly' ? 2 : 1)));
                cumulativeInterest += interestForYear;
                
                csvContent += `${year},${formatCurrency(Math.round(amountAtEndOfYear))},${formatCurrency(Math.round(interestForYear))},${formatCurrency(Math.round(cumulativeInterest))}\n`;
            }
            
            // Create and download file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'fd-calculator-results.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showNotification('Excel file downloaded successfully!', 'success');
        } catch (error) {
            console.error('Excel export error:', error);
            showNotification('Error generating Excel file. Please try again.', 'error');
        }
    };

    // Reset functionality
    window.resetCalculator = function() {
        principalAmountInput.value = 100000;
        principalAmountSlider.value = 100000;
        interestRateInput.value = 6.5;
        interestRateSlider.value = 6.5;
        tenureInput.value = 5;
        tenureSlider.value = 5;
        compoundingFrequencySelect.value = 'quarterly';
        
        calculateAndUpdate();
        showNotification('Calculator reset to default values', 'info');
    };

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl+P for print
        if (e.ctrlKey && e.key === 'p') {
            e.preventDefault();
            window.printResults();
        }
        
        // Ctrl+S for share
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            window.shareResults();
        }
        
        // Ctrl+R for reset
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            window.resetCalculator();
        }
        
        // Escape to close mega menu
        if (e.key === 'Escape') {
            const megaMenu = document.querySelector('.mega-menu');
            if (megaMenu && megaMenu.classList.contains('open')) {
                megaMenu.classList.remove('open');
            }
        }
    });

    // Touch/swipe support for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    
    document.addEventListener('touchstart', function(e) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    });
    
    document.addEventListener('touchend', function(e) {
        if (!touchStartX || !touchStartY) {
            return;
        }
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const diffX = touchStartX - touchEndX;
        const diffY = touchStartY - touchEndY;
        
        // Swipe left to share (mobile)
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 100) {
            if (diffX > 0) {
                // Swiped left
                window.shareResults();
            }
        }
        
        touchStartX = 0;
        touchStartY = 0;
    });

    // Auto-save to localStorage (optional)
    function saveToLocalStorage() {
        const data = {
            principalAmount: principalAmountInput.value,
            interestRate: interestRateInput.value,
            tenure: tenureInput.value,
            compounding: compoundingFrequencySelect.value,
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem('fdCalculatorData', JSON.stringify(data));
        } catch (e) {
            console.log('localStorage not available');
        }
    }

    function loadFromLocalStorage() {
        try {
            const savedData = localStorage.getItem('fdCalculatorData');
            if (savedData) {
                const data = JSON.parse(savedData);
                // Only load if saved within last 24 hours
                if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
                    principalAmountInput.value = data.principalAmount || 100000;
                    principalAmountSlider.value = data.principalAmount || 100000;
                    interestRateInput.value = data.interestRate || 6.5;
                    interestRateSlider.value = data.interestRate || 6.5;
                    tenureInput.value = data.tenure || 5;
                    tenureSlider.value = data.tenure || 5;
                    compoundingFrequencySelect.value = data.compounding || 'quarterly';
                }
            }
        } catch (e) {
            console.log('Error loading from localStorage');
        }
    }

    // Save data on input change (debounced)
    let saveTimeout;
    function debouncedSave() {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveToLocalStorage, 1000);
    }

    // Add save listeners
    [principalAmountInput, interestRateInput, tenureInput, compoundingFrequencySelect].forEach(element => {
        element.addEventListener('input', debouncedSave);
        element.addEventListener('change', debouncedSave);
    });

    // Load saved data on initialization (if no URL parameters)
    if (!window.location.search) {
        loadFromLocalStorage();
    }

    // Analytics tracking (if needed)
    function trackCalculation(result) {
        // Example: Send data to analytics service
        if (typeof gtag !== 'undefined') {
            gtag('event', 'fd_calculation', {
                'principal_amount': result.principalAmount,
                'interest_rate': result.annualInterestRate,
                'tenure': result.tenureYears,
                'maturity_amount': result.maturityAmount
            });
        }
    }

    // Enhanced error handling
    window.addEventListener('error', function(e) {
        console.error('FD Calculator error:', e.error);
        showNotification('An error occurred. Please refresh the page and try again.', 'error');
    });

    // Performance monitoring
    const performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
            if (entry.entryType === 'measure' && entry.name === 'fd-calculation') {
                console.log(`FD calculation took ${entry.duration.toFixed(2)}ms`);
            }
        }
    });
    
    try {
        performanceObserver.observe({entryTypes: ['measure']});
    } catch (e) {
        // Performance API not supported
    }

    // Wrap calculation with performance measurement
    const originalCalculateAndUpdate = calculateAndUpdate;
    calculateAndUpdate = function() {
        performance.mark('calc-start');
        originalCalculateAndUpdate();
        performance.mark('calc-end');
        try {
            performance.measure('fd-calculation', 'calc-start', 'calc-end');
        } catch (e) {
            // Performance API not supported
        }
    };
});
