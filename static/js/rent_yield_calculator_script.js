// Rent Yield Calculator JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Global variables
    let debounceTimer = null;
    let savedScenarios = JSON.parse(localStorage.getItem('rentYieldScenarios') || '[]');

    // DOM Elements - Inputs
    const inputElements = {
        purchasePrice: document.getElementById('rycPurchasePrice'),
        purchasePriceSlider: document.getElementById('rycPurchasePriceSlider'),
        monthlyRent: document.getElementById('rycMonthlyRent'),
        monthlyRentSlider: document.getElementById('rycMonthlyRentSlider'),
        annualCosts: document.getElementById('rycAnnualCosts'),
        annualCostsSlider: document.getElementById('rycAnnualCostsSlider'),
        vacancyMonths: document.getElementById('rycVacancyMonths'),
        vacancyMonthsSlider: document.getElementById('rycVacancyMonthsSlider')
    };

    // DOM Elements - Results
    const resultElements = {
        grossYield: document.getElementById('rycGrossYield'),
        netYield: document.getElementById('rycNetYield'),
        grossIncome: document.getElementById('rycGrossIncome'),
        annualCostsDisplay: document.getElementById('rycAnnualCostsDisplay'),
        netIncome: document.getElementById('rycNetIncome'),
        investmentAmount: document.getElementById('rycInvestmentAmount'),
        monthlyIncomeDisplay: document.getElementById('rycMonthlyIncomeDisplay'),
        paybackPeriod: document.getElementById('rycPaybackPeriod'),
        grossBar: document.getElementById('rycGrossBar'),
        netBar: document.getElementById('rycNetBar'),
        grossBarValue: document.getElementById('rycGrossBarValue'),
        netBarValue: document.getElementById('rycNetBarValue'),
        vacancySection: document.getElementById('rycVacancySection'),
        grossIncomeNoVacancy: document.getElementById('rycGrossIncomeNoVacancy'),
        effectiveIncome: document.getElementById('rycEffectiveIncome'),
        vacancyLoss: document.getElementById('rycVacancyLoss')
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
        
        // Load saved scenarios
        displaySavedScenarios();
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
            if (validateInput(this)) {
                sliderElement.value = this.value;
                debouncedCalculate();
            }
        });

        sliderElement.addEventListener('input', function() {
            inputElement.value = this.value;
            debouncedCalculate();
        });
    }

    function addEventListeners() {
        // Add input event listeners for all input elements
        Object.values(inputElements).forEach(element => {
            if (element && !element.id.includes('Slider')) {
                element.addEventListener('input', function() {
                    if (validateInput(this)) {
                        debouncedCalculate();
                    }
                });
                
                element.addEventListener('blur', function() {
                    enforceInputLimits(this);
                });
            }
        });
    }

    function debouncedCalculate() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            calculateAndUpdate();
        }, 150);
    }

    function calculateAndUpdate() {
        const inputs = getInputValues();
        
        if (!validateAllInputs(inputs)) {
            return;
        }
        
        const results = calculateRentYield(inputs);
        updateResults(results);
        updateCharts(results);
        updateVacancySection(inputs, results);
    }

    function getInputValues() {
        return {
            purchasePrice: parseFloat(inputElements.purchasePrice.value) || 10000000,
            monthlyRent: parseFloat(inputElements.monthlyRent.value) || 35000,
            annualCosts: parseFloat(inputElements.annualCosts.value) || 12000,
            vacancyMonths: parseFloat(inputElements.vacancyMonths.value) || 0
        };
    }

    function calculateRentYield(inputs) {
        // Input validation
        if (inputs.purchasePrice <= 0) {
            throw new Error('Purchase price must be greater than 0');
        }
        
        if (inputs.monthlyRent < 0) {
            throw new Error('Monthly rent cannot be negative');
        }
        
        if (inputs.annualCosts < 0) {
            throw new Error('Annual costs cannot be negative');
        }
        
        if (inputs.vacancyMonths < 0 || inputs.vacancyMonths > 12) {
            throw new Error('Vacancy months must be between 0 and 12');
        }

        // Perform calculations as specified
        const grossIncome = inputs.monthlyRent * 12;
        const effectiveAnnualRent = inputs.vacancyMonths > 0 
            ? grossIncome * (1 - inputs.vacancyMonths / 12) 
            : grossIncome;
        const annualIncome = effectiveAnnualRent - inputs.annualCosts;

        const grossYieldPct = (effectiveAnnualRent / inputs.purchasePrice) * 100;
        const netYieldPct = (annualIncome / inputs.purchasePrice) * 100;

        const paybackYears = annualIncome > 0 ? (inputs.purchasePrice / annualIncome) : Infinity;

        // Round yields to 2 decimals; show payback with 1 decimal
        return {
            grossIncome: grossIncome,
            effectiveAnnualRent: effectiveAnnualRent,
            annualIncome: annualIncome,
            grossYieldPct: Math.round(grossYieldPct * 100) / 100,
            netYieldPct: Math.round(netYieldPct * 100) / 100,
            paybackYears: paybackYears === Infinity ? null : Math.round(paybackYears * 10) / 10,
            vacancyLoss: grossIncome - effectiveAnnualRent
        };
    }

    function updateResults(results) {
        try {
            const inputs = getInputValues();
            
            // Update primary metrics
            resultElements.grossYield.textContent = `${results.grossYieldPct}%`;
            resultElements.netYield.textContent = `${results.netYieldPct}%`;
            
            // Update income summary
            resultElements.grossIncome.textContent = formatCurrency(results.grossIncome);
            resultElements.annualCostsDisplay.textContent = formatCurrency(inputs.annualCosts);
            resultElements.netIncome.textContent = formatCurrency(results.annualIncome);
            
            // Update investment analysis
            resultElements.investmentAmount.textContent = formatCurrency(inputs.purchasePrice);
            resultElements.monthlyIncomeDisplay.textContent = formatCurrency(inputs.monthlyRent);
            
            // Update payback period
            if (results.paybackYears === null) {
                resultElements.paybackPeriod.textContent = 'Never (Negative income)';
                resultElements.paybackPeriod.className = 'ryc-analysis-value ryc-error';
            } else {
                resultElements.paybackPeriod.textContent = `${results.paybackYears} years`;
                resultElements.paybackPeriod.className = 'ryc-analysis-value';
            }
            
        } catch (error) {
            console.error('Error updating results:', error);
            showError('Error calculating results. Please check your inputs.');
        }
    }

    function updateCharts(results) {
        // Update yield comparison bars
        const maxYield = Math.max(results.grossYieldPct, results.netYieldPct, 6); // Min 6% for better visualization
        
        const grossWidth = Math.min((results.grossYieldPct / maxYield) * 100, 100);
        const netWidth = Math.min((results.netYieldPct / maxYield) * 100, 100);
        
        resultElements.grossBar.style.width = `${Math.max(grossWidth, 10)}%`;
        resultElements.netBar.style.width = `${Math.max(netWidth, 10)}%`;
        
        resultElements.grossBarValue.textContent = `${results.grossYieldPct}%`;
        resultElements.netBarValue.textContent = `${results.netYieldPct}%`;
        
        // Add animation
        setTimeout(() => {
            resultElements.grossBar.style.transition = 'width 0.5s ease';
            resultElements.netBar.style.transition = 'width 0.5s ease';
        }, 100);
    }

    function updateVacancySection(inputs, results) {
        if (inputs.vacancyMonths > 0) {
            resultElements.vacancySection.style.display = 'block';
            resultElements.grossIncomeNoVacancy.textContent = formatCurrency(results.grossIncome);
            resultElements.effectiveIncome.textContent = formatCurrency(results.effectiveAnnualRent);
            resultElements.vacancyLoss.textContent = formatCurrency(results.vacancyLoss);
        } else {
            resultElements.vacancySection.style.display = 'none';
        }
    }

    function validateInput(inputElement) {
        const value = parseFloat(inputElement.value);
        const min = parseFloat(inputElement.min);
        const max = parseFloat(inputElement.max);
        
        if (isNaN(value)) {
            showInputError(inputElement, 'Please enter a valid number');
            return false;
        }
        
        if (value < min) {
            showInputError(inputElement, `Value must be at least ${min}`);
            return false;
        }
        
        if (value > max) {
            showInputError(inputElement, `Value must not exceed ${max}`);
            return false;
        }
        
        clearInputError(inputElement);
        return true;
    }

    function validateAllInputs(inputs) {
        if (inputs.purchasePrice <= 0) {
            showError('Purchase price must be greater than 0');
            return false;
        }
        
        if (inputs.purchasePrice < 1000000 || inputs.purchasePrice > 100000000) {
            showError('Purchase price should be between ₹10L and ₹10Cr');
            return false;
        }
        
        if (inputs.monthlyRent < 1000 || inputs.monthlyRent > 1000000) {
            showError('Monthly rent should be between ₹1K and ₹10L');
            return false;
        }
        
        if (inputs.annualCosts < 0 || inputs.annualCosts > 1000000) {
            showError('Annual costs should be between ₹0 and ₹10L');
            return false;
        }
        
        if (inputs.vacancyMonths < 0 || inputs.vacancyMonths > 12) {
            showError('Vacancy months should be between 0 and 12');
            return false;
        }
        
        return true;
    }

    function enforceInputLimits(inputElement) {
        const value = parseFloat(inputElement.value);
        const min = parseFloat(inputElement.min);
        const max = parseFloat(inputElement.max);
        
        if (value < min) {
            inputElement.value = min;
        } else if (value > max) {
            inputElement.value = max;
        }
        
        // Update corresponding slider
        const sliderId = inputElement.id + 'Slider';
        const slider = document.getElementById(sliderId);
        if (slider) {
            slider.value = inputElement.value;
        }
        
        calculateAndUpdate();
    }

    function showInputError(inputElement, message) {
        inputElement.style.borderColor = '#e53e3e';
        inputElement.title = message;
        
        // Clear error after a delay
        setTimeout(() => {
            clearInputError(inputElement);
        }, 3000);
    }

    function clearInputError(inputElement) {
        inputElement.style.borderColor = '';
        inputElement.title = '';
    }

    function showError(message) {
        // You can implement a toast notification or alert here
        console.error(message);
    }

    // Utility functions
    function formatCurrency(amount) {
        if (isNaN(amount) || amount === null || amount === undefined) {
            return '₹0';
        }
        
        // Indian currency formatting
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

    function formatNumber(num) {
        return new Intl.NumberFormat('en-IN').format(Math.round(num));
    }

    // Scenario Management Functions
    window.saveScenario = function() {
        const scenarioName = document.getElementById('rycScenarioName').value.trim();
        
        if (!scenarioName) {
            alert('Please enter a scenario name');
            return;
        }
        
        const inputs = getInputValues();
        const results = calculateRentYield(inputs);
        
        const scenario = {
            id: Date.now(),
            name: scenarioName,
            inputs: inputs,
            results: results,
            timestamp: new Date().toISOString()
        };
        
        // Check if scenario name already exists
        const existingIndex = savedScenarios.findIndex(s => s.name === scenarioName);
        if (existingIndex >= 0) {
            if (confirm('A scenario with this name already exists. Do you want to overwrite it?')) {
                savedScenarios[existingIndex] = scenario;
            } else {
                return;
            }
        } else {
            savedScenarios.push(scenario);
        }
        
        // Keep only the latest 10 scenarios
        if (savedScenarios.length > 10) {
            savedScenarios = savedScenarios.slice(-10);
        }
        
        localStorage.setItem('rentYieldScenarios', JSON.stringify(savedScenarios));
        document.getElementById('rycScenarioName').value = '';
        displaySavedScenarios();
        
        alert('Scenario saved successfully!');
    };

    window.showComparison = function() {
        if (savedScenarios.length === 0) {
            alert('No saved scenarios to compare. Please save some scenarios first.');
            return;
        }
        
        const savedScenariosDiv = document.getElementById('rycSavedScenarios');
        savedScenariosDiv.style.display = savedScenariosDiv.style.display === 'none' ? 'block' : 'none';
    };

    function displaySavedScenarios() {
        const savedScenariosDiv = document.getElementById('rycSavedScenarios');
        
        if (savedScenarios.length === 0) {
            savedScenariosDiv.innerHTML = '<p style="color: #718096; font-style: italic;">No saved scenarios yet.</p>';
            return;
        }
        
        let html = '<h5 style="margin-bottom: 10px; color: #2d3748;">Saved Scenarios</h5>';
        html += '<div style="max-height: 200px; overflow-y: auto;">';
        
        savedScenarios.forEach(scenario => {
            html += `
                <div class="ryc-scenario-item" style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; margin-bottom: 8px; background: white;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <strong style="color: #2d3748;">${scenario.name}</strong>
                        <div>
                            <button onclick="loadScenario(${scenario.id})" class="ryc-btn" style="padding: 4px 8px; font-size: 0.8rem; background: #4299e1; color: white; margin-right: 5px;">Load</button>
                            <button onclick="deleteScenario(${scenario.id})" class="ryc-btn" style="padding: 4px 8px; font-size: 0.8rem; background: #e53e3e; color: white;">Delete</button>
                        </div>
                    </div>
                    <div style="font-size: 0.85rem; color: #718096; margin-top: 5px;">
                        Gross Yield: ${scenario.results.grossYieldPct}% | Net Yield: ${scenario.results.netYieldPct}% | 
                        Property: ${formatCurrency(scenario.inputs.purchasePrice)}
                    </div>
                    <div style="font-size: 0.75rem; color: #a0aec0; margin-top: 3px;">
                        Saved: ${new Date(scenario.timestamp).toLocaleDateString()}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        savedScenariosDiv.innerHTML = html;
    }

    window.loadScenario = function(scenarioId) {
        const scenario = savedScenarios.find(s => s.id === scenarioId);
        if (!scenario) {
            alert('Scenario not found');
            return;
        }
        
        // Load inputs
        inputElements.purchasePrice.value = scenario.inputs.purchasePrice;
        inputElements.purchasePriceSlider.value = scenario.inputs.purchasePrice;
        inputElements.monthlyRent.value = scenario.inputs.monthlyRent;
        inputElements.monthlyRentSlider.value = scenario.inputs.monthlyRent;
        inputElements.annualCosts.value = scenario.inputs.annualCosts;
        inputElements.annualCostsSlider.value = scenario.inputs.annualCosts;
        inputElements.vacancyMonths.value = scenario.inputs.vacancyMonths;
        inputElements.vacancyMonthsSlider.value = scenario.inputs.vacancyMonths;
        
        // Recalculate
        calculateAndUpdate();
        
        alert(`Scenario "${scenario.name}" loaded successfully!`);
    };

    window.deleteScenario = function(scenarioId) {
        if (!confirm('Are you sure you want to delete this scenario?')) {
            return;
        }
        
        savedScenarios = savedScenarios.filter(s => s.id !== scenarioId);
        localStorage.setItem('rentYieldScenarios', JSON.stringify(savedScenarios));
        displaySavedScenarios();
    };

    // Export functionality
    window.rentYieldCalculator = {
        calculate: calculateRentYield,
        getInputs: getInputValues,
        formatCurrency: formatCurrency,
        formatNumber: formatNumber
    };

    // Handle window resize for responsive updates
    window.addEventListener('resize', function() {
        // Update charts on resize if needed
        setTimeout(() => {
            const inputs = getInputValues();
            const results = calculateRentYield(inputs);
            updateCharts(results);
        }, 100);
    });
});
