// CLCSS Constants
const CLCSS_SUBSIDY_PCT = 15;               // %
const CLCSS_SUBSIDY_CAP = 1_500_000;        // ₹15 lakh
const ELIGIBLE_CREDIT_CEILING = 10_000_000; // ₹1 crore

// Global variables
let clcssPaymentBreakupChart;
let clcssCurrentTenureUnit = 'years'; // 'years' or 'months'
let clcssCurrentChartMode = 'gross'; // 'gross' or 'illustrative'

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    clcssSetupEventListeners();
    
    // Ensure initial slider synchronization
    clcssUpdateSliderFromInput();
    
    clcssCalculateAndUpdate();
});

function clcssSetupEventListeners() {
    // Input change listeners for sliders and number inputs
    const inputs = [
        { input: 'clcssLoanAmount', slider: 'clcssLoanAmountSlider', min: 100000, max: 100000000 },
        { input: 'clcssInterestRate', slider: 'clcssInterestRateSlider', min: 0, max: 40 }
    ];
    
    inputs.forEach(({ input, slider, min = 0, max }) => {
        const inputElement = document.getElementById(input);
        const sliderElement = document.getElementById(slider);
        
        if (inputElement && sliderElement) {
            // Sync input to slider
            inputElement.addEventListener('input', function() {
                const value = Math.max(Math.min(parseFloat(this.value) || min, max), min);
                sliderElement.value = value;
                clcssCalculateAndUpdate();
            });
            
            // Sync slider to input
            sliderElement.addEventListener('input', function() {
                inputElement.value = this.value;
                clcssCalculateAndUpdate();
            });
        }
    });
    
    // Special handling for tenure
    clcssSetupTenureEventListeners();
    
    // Subsidy toggle
    const subsidyToggle = document.getElementById('clcssApplySubsidyUpfront');
    if (subsidyToggle) {
        subsidyToggle.addEventListener('change', function() {
            clcssToggleSubsidyIllustration();
            clcssCalculateAndUpdate();
        });
    }
    
    // Chart tabs
    const grossChartTab = document.getElementById('clcssGrossChartTab');
    const illustrativeChartTab = document.getElementById('clcssIllustrativeChartTab');
    
    if (grossChartTab) {
        grossChartTab.addEventListener('click', function() {
            clcssSetChartMode('gross');
        });
    }
    
    if (illustrativeChartTab) {
        illustrativeChartTab.addEventListener('click', function() {
            clcssSetChartMode('illustrative');
        });
    }
}

function clcssSetupTenureEventListeners() {
    const tenureValueInput = document.getElementById('clcssTenureValue');
    const tenureSlider = document.getElementById('clcssTenureSlider');
    const tenureYrBtn = document.getElementById('clcssTenureYrBtn');
    const tenureMoBtn = document.getElementById('clcssTenureMoBtn');
    
    // Initialize in years mode
    clcssSetTenureMode('years');
    
    // Input value changes
    if (tenureValueInput) {
        tenureValueInput.addEventListener('input', function() {
            clcssUpdateSliderFromInput();
            clcssCalculateAndUpdate();
        });
    }
    
    // Slider changes
    if (tenureSlider) {
        tenureSlider.addEventListener('input', function() {
            clcssUpdateInputFromSlider();
            clcssCalculateAndUpdate();
        });
    }
    
    // Year button click
    if (tenureYrBtn) {
        tenureYrBtn.addEventListener('click', function() {
            if (clcssCurrentTenureUnit !== 'years') {
                clcssSetTenureMode('years');
            }
        });
    }
    
    // Month button click
    if (tenureMoBtn) {
        tenureMoBtn.addEventListener('click', function() {
            if (clcssCurrentTenureUnit !== 'months') {
                clcssSetTenureMode('months');
            }
        });
    }
}

function clcssSetTenureMode(unit) {
    const previousUnit = clcssCurrentTenureUnit;
    clcssCurrentTenureUnit = unit;
    
    const tenureValueInput = document.getElementById('clcssTenureValue');
    const tenureSlider = document.getElementById('clcssTenureSlider');
    const tenureYrBtn = document.getElementById('clcssTenureYrBtn');
    const tenureMoBtn = document.getElementById('clcssTenureMoBtn');
    const tenureSliderLabels = document.getElementById('clcssTenureSliderLabels');
    
    // Update button states
    if (tenureYrBtn) tenureYrBtn.classList.toggle('active', unit === 'years');
    if (tenureMoBtn) tenureMoBtn.classList.toggle('active', unit === 'months');
    
    // Get current value before conversion
    const currentValue = parseFloat(tenureValueInput?.value) || (unit === 'years' ? 5 : 60);
    
    if (unit === 'years') {
        // Converting to years mode
        let years;
        if (previousUnit === 'months') {
            // Convert months to years exactly
            years = Math.round(currentValue / 12 * 10) / 10; // Round to 1 decimal
        } else {
            years = currentValue;
        }
        
        if (tenureValueInput) {
            tenureValueInput.value = years;
            tenureValueInput.step = '0.5';
            tenureValueInput.min = '0.5';
            tenureValueInput.max = '10';
        }
        
        // Update slider for years (0.5-10 years)
        if (tenureSlider) {
            tenureSlider.min = '0.5';
            tenureSlider.max = '10';
            tenureSlider.step = '0.5';
            tenureSlider.value = years;
        }
        
        // Update slider labels for years
        if (tenureSliderLabels) {
            tenureSliderLabels.innerHTML = `
                <span>0.5</span>
                <span>2.5</span>
                <span>5</span>
                <span>7.5</span>
                <span>10</span>
            `;
        }
    } else {
        // Converting to months mode
        let months;
        if (previousUnit === 'years') {
            // Convert years to months exactly
            months = Math.round(currentValue * 12);
        } else {
            months = Math.round(currentValue);
        }
        
        if (tenureValueInput) {
            tenureValueInput.value = months;
            tenureValueInput.step = '1';
            tenureValueInput.min = '6';
            tenureValueInput.max = '120';
        }
        
        // Update slider for months (6-120 months)
        if (tenureSlider) {
            tenureSlider.min = '6';
            tenureSlider.max = '120';
            tenureSlider.step = '1';
            tenureSlider.value = months;
        }
        
        // Update slider labels for months
        if (tenureSliderLabels) {
            tenureSliderLabels.innerHTML = `
                <span>6</span>
                <span>30</span>
                <span>60</span>
                <span>90</span>
                <span>120</span>
            `;
        }
    }
    
    // Ensure slider is synchronized after mode change
    clcssUpdateSliderFromInput();
    
    // Recalculate after mode change
    clcssCalculateAndUpdate();
}

function clcssUpdateSliderFromInput() {
    const tenureValueInput = document.getElementById('clcssTenureValue');
    const tenureSlider = document.getElementById('clcssTenureSlider');
    
    if (tenureValueInput && tenureSlider) {
        const value = parseFloat(tenureValueInput.value) || 0;
        const min = parseFloat(tenureSlider.min);
        const max = parseFloat(tenureSlider.max);
        
        tenureSlider.value = Math.min(Math.max(value, min), max);
    }
}

function clcssUpdateInputFromSlider() {
    const tenureValueInput = document.getElementById('clcssTenureValue');
    const tenureSlider = document.getElementById('clcssTenureSlider');
    
    if (tenureValueInput && tenureSlider) {
        tenureValueInput.value = tenureSlider.value;
    }
}

function clcssToggleSubsidyIllustration() {
    const subsidyToggle = document.getElementById('clcssApplySubsidyUpfront');
    const illustrativePanel = document.getElementById('clcssIllustrativePanel');
    const savingsPanel = document.getElementById('clcssSavingsPanel');
    const illustrativeChartTab = document.getElementById('clcssIllustrativeChartTab');
    
    const isEnabled = subsidyToggle?.checked;
    
    if (illustrativePanel) {
        illustrativePanel.style.display = isEnabled ? 'block' : 'none';
    }
    
    if (savingsPanel) {
        savingsPanel.style.display = isEnabled ? 'block' : 'none';
    }
    
    if (illustrativeChartTab) {
        illustrativeChartTab.style.display = isEnabled ? 'inline-block' : 'none';
    }
    
    // Switch to gross chart if illustrative is hidden
    if (!isEnabled && clcssCurrentChartMode === 'illustrative') {
        clcssSetChartMode('gross');
    }
}

function clcssSetChartMode(mode) {
    clcssCurrentChartMode = mode;
    
    const grossTab = document.getElementById('clcssGrossChartTab');
    const illustrativeTab = document.getElementById('clcssIllustrativeChartTab');
    
    if (grossTab) {
        grossTab.classList.toggle('active', mode === 'gross');
    }
    
    if (illustrativeTab) {
        illustrativeTab.classList.toggle('active', mode === 'illustrative');
    }
    
    // Re-render chart with current data
    clcssCalculateAndUpdate();
}

// Pure calculation functions
function clcssMonthlyRate(annualPct) {
    return (annualPct / 12) / 100;
}

function clcssEmi(P, annualPct, months) {
    const r = clcssMonthlyRate(annualPct);
    if (months <= 0) return 0;
    if (r === 0) return P / months;
    const x = Math.pow(1 + r, months);
    return P * r * x / (x - 1);
}

function clcssSubsidyAmount(loanAmount) {
    const base = Math.min(loanAmount, ELIGIBLE_CREDIT_CEILING);
    return Math.min(base * (CLCSS_SUBSIDY_PCT / 100), CLCSS_SUBSIDY_CAP);
}

function clcssTotals(P, annualPct, months) {
    const E = clcssEmi(P, annualPct, months);
    const totalPayment = E * months;
    const totalInterest = totalPayment - P;
    return { emi: E, totalPayment, totalInterest };
}

function clcssCalculateAndUpdate() {
    const loanAmount = parseFloat(document.getElementById('clcssLoanAmount')?.value) || 0;
    const interestRate = parseFloat(document.getElementById('clcssInterestRate')?.value) || 0;
    const tenureValue = parseFloat(document.getElementById('clcssTenureValue')?.value) || 0;
    const applySubsidyUpfront = document.getElementById('clcssApplySubsidyUpfront')?.checked || false;
    
    // Convert tenure to months
    let totalMonths = 0;
    
    if (clcssCurrentTenureUnit === 'years') {
        totalMonths = Math.round(tenureValue * 12);
    } else {
        totalMonths = Math.round(tenureValue);
    }
    
    if (loanAmount > 0 && interestRate >= 0 && totalMonths > 0) {
        // Calculate subsidy amount
        const subsidyAmount = clcssSubsidyAmount(loanAmount);
        const effectivePrincipal = loanAmount - subsidyAmount;
        
        // Gross calculations (without subsidy consideration for EMI)
        const grossResults = clcssTotals(loanAmount, interestRate, totalMonths);
        
        // Illustrative calculations (with reduced principal)
        const illustrativeResults = clcssTotals(effectivePrincipal, interestRate, totalMonths);
        
        // Calculate savings
        const savings = grossResults.totalPayment - illustrativeResults.totalPayment;
        
        const resultData = {
            gross: {
                emi: grossResults.emi,
                principal: loanAmount,
                totalInterest: grossResults.totalInterest,
                totalPayment: grossResults.totalPayment
            },
            illustrative: {
                emi: illustrativeResults.emi,
                principal: effectivePrincipal,
                totalInterest: illustrativeResults.totalInterest,
                totalPayment: illustrativeResults.totalPayment
            },
            subsidy: {
                amount: subsidyAmount,
                effectivePrincipal: effectivePrincipal
            },
            savings: savings
        };
        
        clcssUpdateResults(resultData);
        clcssUpdateChart(resultData);
        clcssToggleSubsidyIllustration();
    }
}

function clcssUpdateResults(data) {
    // Update gross results
    clcssUpdateElement('clcssGrossEmi', data.gross.emi);
    clcssUpdateElement('clcssGrossPrincipal', data.gross.principal);
    clcssUpdateElement('clcssGrossTotalInterest', data.gross.totalInterest);
    clcssUpdateElement('clcssGrossTotalPayment', data.gross.totalPayment);
    
    // Update subsidy information
    clcssUpdateElement('clcssSubsidyAmount', data.subsidy.amount);
    clcssUpdateElement('clcssEffectivePrincipal', data.subsidy.effectivePrincipal);
    
    // Update illustrative results
    clcssUpdateElement('clcssIllustrativeEmi', data.illustrative.emi);
    clcssUpdateElement('clcssIllustrativePrincipal', data.illustrative.principal);
    clcssUpdateElement('clcssIllustrativeTotalInterest', data.illustrative.totalInterest);
    clcssUpdateElement('clcssIllustrativeTotalPayment', data.illustrative.totalPayment);
    
    // Update savings
    clcssUpdateElement('clcssSavingsAmount', data.savings);
    
    // Update chart percentages
    const currentData = clcssCurrentChartMode === 'gross' ? data.gross : data.illustrative;
    const principalPercentage = (currentData.principal / currentData.totalPayment) * 100;
    const interestPercentage = (currentData.totalInterest / currentData.totalPayment) * 100;
    
    const principalPercentageElement = document.getElementById('clcssPrincipalPercentage');
    const interestPercentageElement = document.getElementById('clcssInterestPercentage');
    
    if (principalPercentageElement) {
        principalPercentageElement.textContent = principalPercentage.toFixed(1) + '%';
    }
    
    if (interestPercentageElement) {
        interestPercentageElement.textContent = interestPercentage.toFixed(1) + '%';
    }
}

function clcssUpdateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = clcssFormatCurrency(value);
    }
}

function clcssUpdateChart(data) {
    const ctx = document.getElementById('clcssPaymentBreakupChart');
    if (!ctx) return;
    
    const context = ctx.getContext('2d');
    
    if (clcssPaymentBreakupChart) {
        clcssPaymentBreakupChart.destroy();
    }
    
    const currentData = clcssCurrentChartMode === 'gross' ? data.gross : data.illustrative;
    
    clcssPaymentBreakupChart = new Chart(context, {
        type: 'doughnut',
        data: {
            labels: ['Principal Amount', 'Total Interest'],
            datasets: [{
                data: [currentData.principal, currentData.totalInterest],
                backgroundColor: ['#3182ce', '#e53e3e'],
                borderWidth: 0,
                cutout: '60%'
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
                            const value = context.parsed;
                            const percentage = ((value / currentData.totalPayment) * 100).toFixed(1);
                            return context.label + ': ₹' + value.toLocaleString('en-IN') + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

function clcssFormatCurrency(amount) {
    return '₹ ' + Math.round(amount).toLocaleString('en-IN');
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
