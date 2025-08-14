// Rent vs Buy Calculator JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Global variables
    let netWorthChart = null;
    let cashFlowChart = null;

    // DOM Elements - Inputs
    const inputElements = {
        propertyPrice: document.getElementById('rvbPropertyPrice'),
        propertyPriceSlider: document.getElementById('rvbPropertyPriceSlider'),
        downPayment: document.getElementById('rvbDownPayment'),
        downPaymentSlider: document.getElementById('rvbDownPaymentSlider'),
        loanRate: document.getElementById('rvbLoanRate'),
        loanRateSlider: document.getElementById('rvbLoanRateSlider'),
        loanTenure: document.getElementById('rvbLoanTenure'),
        loanTenureSlider: document.getElementById('rvbLoanTenureSlider'),
        stampDuty: document.getElementById('rvbStampDuty'),
        stampDutySlider: document.getElementById('rvbStampDutySlider'),
        processingFees: document.getElementById('rvbProcessingFees'),
        processingFeesSlider: document.getElementById('rvbProcessingFeesSlider'),
        maintenance: document.getElementById('rvbMaintenance'),
        maintenanceSlider: document.getElementById('rvbMaintenanceSlider'),
        propertyTax: document.getElementById('rvbPropertyTax'),
        propertyTaxSlider: document.getElementById('rvbPropertyTaxSlider'),
        homeInsurance: document.getElementById('rvbHomeInsurance'),
        homeInsuranceSlider: document.getElementById('rvbHomeInsuranceSlider'),
        appreciation: document.getElementById('rvbAppreciation'),
        appreciationSlider: document.getElementById('rvbAppreciationSlider'),
        sellingCost: document.getElementById('rvbSellingCost'),
        sellingCostSlider: document.getElementById('rvbSellingCostSlider'),
        monthlyRent: document.getElementById('rvbMonthlyRent'),
        monthlyRentSlider: document.getElementById('rvbMonthlyRentSlider'),
        rentIncrease: document.getElementById('rvbRentIncrease'),
        rentIncreaseSlider: document.getElementById('rvbRentIncreaseSlider'),
        securityDeposit: document.getElementById('rvbSecurityDeposit'),
        securityDepositSlider: document.getElementById('rvbSecurityDepositSlider'),
        investmentReturn: document.getElementById('rvbInvestmentReturn'),
        investmentReturnSlider: document.getElementById('rvbInvestmentReturnSlider'),
        analysisHorizon: document.getElementById('rvbAnalysisHorizon'),
        analysisHorizonSlider: document.getElementById('rvbAnalysisHorizonSlider')
    };

    // DOM Elements - Results
    const resultElements = {
        recommendation: document.getElementById('rvbRecommendation'),
        advantageAmount: document.getElementById('rvbAdvantageAmount'),
        buyTotalCashOut: document.getElementById('rvbBuyTotalCashOut'),
        buyInterestPaid: document.getElementById('rvbBuyInterestPaid'),
        buyMaintenance: document.getElementById('rvbBuyMaintenance'),
        ownerEquity: document.getElementById('rvbOwnerEquity'),
        totalRentPaid: document.getElementById('rvbTotalRentPaid'),
        investedCorpus: document.getElementById('rvbInvestedCorpus'),
        breakevenYear: document.getElementById('rvbBreakevenYear')
    };

    // Initialize calculator
    initializeCalculator();

    function initializeCalculator() {
        // Set up input-slider synchronization
        setupInputSliderSync();
        
        // Initial calculation
        calculateAndUpdate();
        
        // Add event listeners
        addEventListeners();
    }

    function setupInputSliderSync() {
        // Sync all input fields with their corresponding sliders
        Object.keys(inputElements).forEach(key => {
            if (key.includes('Slider')) {
                const inputKey = key.replace('Slider', '');
                if (inputElements[inputKey]) {
                    syncInputSlider(inputElements[inputKey], inputElements[key]);
                }
            }
        });
    }

    function syncInputSlider(inputElement, sliderElement) {
        inputElement.addEventListener('input', function() {
            sliderElement.value = this.value;
            calculateAndUpdate();
        });

        sliderElement.addEventListener('input', function() {
            inputElement.value = this.value;
            calculateAndUpdate();
        });
    }

    function addEventListeners() {
        // Add input event listeners for all input elements
        Object.values(inputElements).forEach(element => {
            if (element) {
                element.addEventListener('input', calculateAndUpdate);
            }
        });
    }

    function calculateAndUpdate() {
        const inputs = getInputValues();
        const results = calculateRentVsBuy(inputs);
        updateResults(results);
        updateCharts(results);
    }

    function getInputValues() {
        return {
            propertyPrice: parseFloat(inputElements.propertyPrice.value) || 7500000,
            downPayment: parseFloat(inputElements.downPayment.value) || 20,
            loanRate: parseFloat(inputElements.loanRate.value) || 8.5,
            loanTenure: parseFloat(inputElements.loanTenure.value) || 20,
            stampDuty: parseFloat(inputElements.stampDuty.value) || 7,
            processingFees: parseFloat(inputElements.processingFees.value) || 25000,
            maintenance: parseFloat(inputElements.maintenance.value) || 1.5,
            propertyTax: parseFloat(inputElements.propertyTax.value) || 15000,
            homeInsurance: parseFloat(inputElements.homeInsurance.value) || 5000,
            appreciation: parseFloat(inputElements.appreciation.value) || 5,
            sellingCost: parseFloat(inputElements.sellingCost.value) || 2,
            monthlyRent: parseFloat(inputElements.monthlyRent.value) || 25000,
            rentIncrease: parseFloat(inputElements.rentIncrease.value) || 5,
            securityDeposit: parseFloat(inputElements.securityDeposit.value) || 2,
            investmentReturn: parseFloat(inputElements.investmentReturn.value) || 10,
            analysisHorizon: parseFloat(inputElements.analysisHorizon.value) || 10
        };
    }

    function calculateRentVsBuy(inputs) {
        const months = inputs.analysisHorizon * 12;
        const downPaymentValue = inputs.propertyPrice * inputs.downPayment / 100;
        const loanPrincipal = inputs.propertyPrice - downPaymentValue;
        const stampRegValue = inputs.propertyPrice * inputs.stampDuty / 100;
        const oneTimeBuyCash = downPaymentValue + stampRegValue + inputs.processingFees;
        
        // Calculate EMI
        const monthlyRate = inputs.loanRate / 12 / 100;
        const loanMonths = inputs.loanTenure * 12;
        let emi = 0;
        
        if (monthlyRate === 0) {
            emi = loanPrincipal / loanMonths;
        } else {
            emi = loanPrincipal * (monthlyRate * Math.pow(1 + monthlyRate, loanMonths)) / 
                  (Math.pow(1 + monthlyRate, loanMonths) - 1);
        }

        // Initialize tracking variables
        let outstandingLoan = loanPrincipal;
        let totalInterestPaid = 0;
        let totalMaintenanceTaxes = 0;
        let totalRentPaid = 0;
        let investedAmount = oneTimeBuyCash - (inputs.monthlyRent * inputs.securityDeposit);
        let currentRent = inputs.monthlyRent;
        
        // Monthly tracking arrays
        const buyNetWorth = [];
        const rentNetWorth = [];
        const buyCashFlow = [];
        const rentCashFlow = [];
        const years = [];
        
        let breakevenYear = null;

        // Month-by-month simulation
        for (let month = 1; month <= months; month++) {
            // BUY PATH
            let monthlyInterest = 0;
            let monthlyPrincipal = 0;
            
            if (month <= loanMonths && outstandingLoan > 0) {
                monthlyInterest = outstandingLoan * monthlyRate;
                monthlyPrincipal = Math.min(emi - monthlyInterest, outstandingLoan);
                outstandingLoan = Math.max(0, outstandingLoan - monthlyPrincipal);
                totalInterestPaid += monthlyInterest;
            }
            
            // Monthly maintenance, tax, insurance
            const monthlyMaintenance = (inputs.propertyPrice * inputs.maintenance / 100) / 12;
            const monthlyPropertyTax = inputs.propertyTax / 12;
            const monthlyInsurance = inputs.homeInsurance / 12;
            const monthlyOwningCosts = monthlyMaintenance + monthlyPropertyTax + monthlyInsurance;
            totalMaintenanceTaxes += monthlyOwningCosts;
            
            // RENT PATH
            // Update rent annually
            if (month > 1 && (month - 1) % 12 === 0) {
                currentRent = currentRent * (1 + inputs.rentIncrease / 100);
            }
            totalRentPaid += currentRent;
            
            // Investment calculation
            const monthlySurplus = Math.max(0, emi + monthlyOwningCosts - currentRent);
            investedAmount = investedAmount * (1 + inputs.investmentReturn / 12 / 100) + monthlySurplus;
            
            // Calculate net worth at end of month
            if (month % 12 === 0 || month === months) {
                const year = Math.ceil(month / 12);
                const currentPropertyValue = inputs.propertyPrice * Math.pow(1 + inputs.appreciation / 100, year);
                
                // Buy net worth (property value minus outstanding loan)
                const buyEquity = currentPropertyValue - outstandingLoan;
                
                // Rent net worth (invested corpus plus security deposit)
                let rentCorpus = investedAmount;
                if (month === months) {
                    rentCorpus += inputs.monthlyRent * inputs.securityDeposit; // Return security deposit
                }
                
                buyNetWorth.push(buyEquity);
                rentNetWorth.push(rentCorpus);
                years.push(year);
                
                // Calculate annual cash flows
                const buyAnnualCash = (emi + monthlyOwningCosts) * 12;
                const rentAnnualCash = currentRent * 12;
                buyCashFlow.push(buyAnnualCash);
                rentCashFlow.push(rentAnnualCash);
                
                // Check for breakeven
                if (breakevenYear === null && buyEquity >= rentCorpus) {
                    breakevenYear = year;
                }
            }
        }

        // Final calculations at horizon
        const finalPropertyValue = inputs.propertyPrice * Math.pow(1 + inputs.appreciation / 100, inputs.analysisHorizon);
        const netSaleValue = finalPropertyValue * (1 - inputs.sellingCost / 100);
        const finalOwnerEquity = netSaleValue - outstandingLoan;
        
        const finalRentCorpus = investedAmount + (inputs.monthlyRent * inputs.securityDeposit);
        
        const recommendation = finalOwnerEquity > finalRentCorpus ? 'BUY' : 'RENT';
        const netAdvantage = Math.abs(finalOwnerEquity - finalRentCorpus);

        return {
            // Summary results
            recommendation,
            netAdvantage,
            buyTotalCashOut: oneTimeBuyCash,
            buyInterestPaid: totalInterestPaid,
            buyMaintenanceTaxes: totalMaintenanceTaxes,
            ownerEquity: finalOwnerEquity,
            totalRentPaid,
            investedCorpus: finalRentCorpus,
            breakevenYear: breakevenYear || 'None within horizon',
            
            // Chart data
            years,
            buyNetWorth,
            rentNetWorth,
            buyCashFlow,
            rentCashFlow,
            
            // Additional details
            emi,
            finalPropertyValue,
            outstandingLoan: Math.max(0, outstandingLoan)
        };
    }

    function updateResults(results) {
        // Update recommendation
        resultElements.recommendation.textContent = results.recommendation;
        resultElements.recommendation.className = `rvb-recommendation-choice ${results.recommendation.toLowerCase()}`;
        
        // Update advantage amount
        resultElements.advantageAmount.textContent = formatCurrency(results.netAdvantage);
        
        // Update buy summary
        resultElements.buyTotalCashOut.textContent = formatCurrency(results.buyTotalCashOut);
        resultElements.buyInterestPaid.textContent = formatCurrency(results.buyInterestPaid);
        resultElements.buyMaintenance.textContent = formatCurrency(results.buyMaintenanceTaxes);
        resultElements.ownerEquity.textContent = formatCurrency(results.ownerEquity);
        
        // Update rent summary
        resultElements.totalRentPaid.textContent = formatCurrency(results.totalRentPaid);
        resultElements.investedCorpus.textContent = formatCurrency(results.investedCorpus);
        
        // Update breakeven
        resultElements.breakevenYear.textContent = 
            typeof results.breakevenYear === 'number' ? `Year ${results.breakevenYear}` : results.breakevenYear;
    }

    function updateCharts(results) {
        updateNetWorthChart(results);
        updateCashFlowChart(results);
    }

    function updateNetWorthChart(results) {
        const ctx = document.getElementById('rvbNetWorthChart').getContext('2d');
        
        if (netWorthChart) {
            netWorthChart.destroy();
        }

        netWorthChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: results.years.map(year => `Year ${year}`),
                datasets: [{
                    label: 'Buy (Owner Equity)',
                    data: results.buyNetWorth,
                    borderColor: '#48bb78',
                    backgroundColor: 'rgba(72, 187, 120, 0.1)',
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: '#48bb78',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5
                }, {
                    label: 'Rent (Invested Corpus)',
                    data: results.rentNetWorth,
                    borderColor: '#ed8936',
                    backgroundColor: 'rgba(237, 137, 54, 0.1)',
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: '#ed8936',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatCurrencyShort(value);
                            }
                        },
                        title: {
                            display: true,
                            text: 'Net Worth (₹)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Time Period'
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

    function updateCashFlowChart(results) {
        const ctx = document.getElementById('rvbCashFlowChart').getContext('2d');
        
        if (cashFlowChart) {
            cashFlowChart.destroy();
        }

        cashFlowChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: results.years.map(year => `Year ${year}`),
                datasets: [{
                    label: 'Buy (EMI + Maintenance)',
                    data: results.buyCashFlow,
                    backgroundColor: 'rgba(72, 187, 120, 0.8)',
                    borderColor: '#48bb78',
                    borderWidth: 1
                }, {
                    label: 'Rent (Annual Rent)',
                    data: results.rentCashFlow,
                    backgroundColor: 'rgba(237, 137, 54, 0.8)',
                    borderColor: '#ed8936',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatCurrencyShort(value);
                            }
                        },
                        title: {
                            display: true,
                            text: 'Annual Cash Outflow (₹)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Time Period'
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

    // Utility functions
    function formatCurrency(amount) {
        if (amount >= 10000000) { // 1 crore
            return '₹' + (amount / 10000000).toFixed(2) + ' Cr';
        } else if (amount >= 100000) { // 1 lakh
            return '₹' + (amount / 100000).toFixed(2) + ' L';
        } else if (amount >= 1000) { // 1 thousand
            return '₹' + (amount / 1000).toFixed(0) + 'K';
        } else {
            return '₹' + Math.round(amount).toLocaleString('en-IN');
        }
    }

    function formatCurrencyShort(amount) {
        if (amount >= 10000000) {
            return (amount / 10000000).toFixed(1) + 'Cr';
        } else if (amount >= 100000) {
            return (amount / 100000).toFixed(1) + 'L';
        } else if (amount >= 1000) {
            return (amount / 1000).toFixed(0) + 'K';
        } else {
            return Math.round(amount).toString();
        }
    }

    // Input validation
    function validateInputs() {
        const inputs = getInputValues();
        
        // Basic validation
        if (inputs.propertyPrice < 100000 || inputs.propertyPrice > 100000000) {
            alert('Property price should be between ₹1L and ₹10Cr');
            return false;
        }
        
        if (inputs.downPayment < 5 || inputs.downPayment > 100) {
            alert('Down payment should be between 5% and 100%');
            return false;
        }
        
        if (inputs.loanRate < 5 || inputs.loanRate > 20) {
            alert('Loan interest rate should be between 5% and 20%');
            return false;
        }
        
        if (inputs.analysisHorizon < 1 || inputs.analysisHorizon > 30) {
            alert('Analysis horizon should be between 1 and 30 years');
            return false;
        }
        
        return true;
    }

    // Handle window resize for charts
    window.addEventListener('resize', function() {
        if (netWorthChart) {
            netWorthChart.resize();
        }
        if (cashFlowChart) {
            cashFlowChart.resize();
        }
    });

    // Export functionality (if needed in future)
    window.rentVsBuyCalculator = {
        calculate: calculateRentVsBuy,
        getInputs: getInputValues,
        formatCurrency: formatCurrency
    };
});
