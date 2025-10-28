document.addEventListener('DOMContentLoaded', function() {
    // Gold rates per gram (these could be fetched from an API in a real application)
    const goldRates = {
        '24K': 6500,
        '23K': 6000,
        '22K': 5800,
        '21K': 5600,
        '20K': 5400,
        '18K': 4900,
        '16K': 4300,
        '14K': 3800
    };

    // Get form elements
    const interestRateSlider = document.getElementById('interest_rate');
    const rateValueSpan = document.getElementById('rate_value');
    const numOrnamentsSelect = document.getElementById('num_ornaments');
    const ornamentsTableBody = document.getElementById('ornaments_tbody');
    const goldLoanForm = document.getElementById('goldLoanForm');

    // Result elements
    const eligibleAmountSpan = document.getElementById('eligible_amount');
    const monthlyEmiSpan = document.getElementById('monthly_emi');
    const totalPayableSpan = document.getElementById('total_payable');
    const interestPayableSpan = document.getElementById('interest_payable');
    const totalGoldValueSpan = document.getElementById('total_gold_value');
    const ltvRatioSpan = document.getElementById('ltv_ratio');
    const scheduleSection = document.getElementById('schedule_section');
    const scheduleTableBody = document.getElementById('schedule_tbody');
    
    // Chart variables
    let paymentChart = null;

    // Update interest rate display
    interestRateSlider.addEventListener('input', function() {
        rateValueSpan.textContent = this.value;
        calculateRealTime();
    });

    // Handle number of ornaments change
    numOrnamentsSelect.addEventListener('change', function() {
        updateOrnamentsTable(parseInt(this.value));
        calculateRealTime();
    });

    // Function to update ornaments table
    function updateOrnamentsTable(numOrnaments) {
        // Clear existing rows
        ornamentsTableBody.innerHTML = '';

        // Add rows based on selected number
        for (let i = 0; i < numOrnaments; i++) {
            const row = document.createElement('tr');
            row.className = 'ornament-row';
            row.setAttribute('data-index', i);
            
            row.innerHTML = `
                <td>${i + 1}</td>
                <td>
                    <select class="carat-select" name="carat_${i}" onchange="calculateRealTime()">
                        <option value="24K" ${i === 0 ? 'selected' : ''}>24K</option>
                        <option value="23K">23K</option>
                        <option value="22K">22K</option>
                        <option value="21K">21K</option>
                        <option value="20K">20K</option>
                        <option value="18K">18K</option>
                        <option value="16K">16K</option>
                        <option value="14K">14K</option>
                    </select>
                </td>
                <td>
                    <input type="number" class="weight-input" name="weight_${i}" 
                           value="${i === 0 ? '20' : '10'}" min="0.1" step="0.1" 
                           placeholder="Weight" oninput="calculateRealTime()">
                </td>
                <td class="amount-cell">
                    <span class="ornament-amount">₹ 0</span>
                </td>
            `;
            
            ornamentsTableBody.appendChild(row);
        }
        
        // Calculate amounts for the new rows
        calculateOrnamentAmounts();
    }

    // Function to calculate ornament amounts in real-time
    function calculateOrnamentAmounts() {
        const ornamentRows = document.querySelectorAll('.ornament-row');
        let totalValue = 0;

        ornamentRows.forEach(row => {
            const caratSelect = row.querySelector('.carat-select');
            const weightInput = row.querySelector('.weight-input');
            const amountSpan = row.querySelector('.ornament-amount');

            if (caratSelect && weightInput && amountSpan) {
                const carat = caratSelect.value;
                const weight = parseFloat(weightInput.value) || 0;
                const ratePerGram = goldRates[carat] || goldRates['24K'];
                const amount = weight * ratePerGram;

                amountSpan.textContent = `₹ ${amount.toLocaleString('en-IN')}`;
                totalValue += amount;
            }
        });

        // Update total gold value display
        totalGoldValueSpan.textContent = totalValue.toLocaleString('en-IN');
        
        // Calculate eligible loan amount (75% LTV)
        const ltvRatio = 75; // 75% LTV ratio
        const eligibleAmount = totalValue * (ltvRatio / 100);
        eligibleAmountSpan.textContent = eligibleAmount.toLocaleString('en-IN');
        ltvRatioSpan.textContent = ltvRatio;

        return { totalValue, eligibleAmount };
    }

    // Function to generate amortization schedule
    function generateAmortizationSchedule(principal, annualRate, tenureMonths) {
        const monthlyRate = annualRate / (12 * 100);
        let emi = 0;
        
        if (monthlyRate === 0) {
            emi = principal / tenureMonths;
        } else {
            emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) / 
                  (Math.pow(1 + monthlyRate, tenureMonths) - 1);
        }
        
        const schedule = [];
        let remainingPrincipal = principal;
        
        for (let month = 1; month <= tenureMonths; month++) {
            const interestPayment = remainingPrincipal * monthlyRate;
            const principalPayment = emi - interestPayment;
            remainingPrincipal -= principalPayment;
            
            schedule.push({
                month: month,
                emi: Math.round(emi * 100) / 100,
                principal: Math.round(principalPayment * 100) / 100,
                interest: Math.round(interestPayment * 100) / 100,
                balance: Math.round(Math.max(0, remainingPrincipal) * 100) / 100
            });
        }
        
        return schedule;
    }

    // Function to create/update pie chart
    function updatePieChart(principal, totalInterest) {
        const ctx = document.getElementById('paymentChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (paymentChart) {
            paymentChart.destroy();
        }
        
        paymentChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Principal Amount', 'Interest Amount'],
                datasets: [{
                    data: [principal, totalInterest],
                    backgroundColor: [
                        '#14B8A6',
                        '#F59E0B'
                    ],
                    borderColor: [
                        '#14B8A6',
                        '#F59E0B'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            color: '#ffffff',
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
                }
            }
        });
    }

    // Real-time calculation function
    function calculateRealTime() {
        const { totalValue, eligibleAmount } = calculateOrnamentAmounts();
        
        // Get current values
        const tenureMonths = parseInt(document.querySelector('input[name="tenure_months"]:checked')?.value) || 6;
        const annualRate = parseFloat(interestRateSlider.value);
        
        // Calculate EMI
        const monthlyRate = annualRate / (12 * 100);
        let emi = 0;
        
        if (eligibleAmount > 0) {
            if (monthlyRate === 0) {
                emi = eligibleAmount / tenureMonths;
            } else {
                emi = eligibleAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) / 
                      (Math.pow(1 + monthlyRate, tenureMonths) - 1);
            }
        }
        
        const totalPayment = emi * tenureMonths;
        const totalInterest = totalPayment - eligibleAmount;
        
        // Update display
        monthlyEmiSpan.textContent = emi.toLocaleString('en-IN');
        totalPayableSpan.textContent = totalPayment.toLocaleString('en-IN');
        interestPayableSpan.textContent = totalInterest.toLocaleString('en-IN');
        
        // Generate and show schedule
        if (eligibleAmount > 0 && emi > 0) {
            const schedule = generateAmortizationSchedule(eligibleAmount, annualRate, tenureMonths);
            showSchedule(schedule);
            updatePieChart(eligibleAmount, totalInterest);
        }
    }



    // Function to show amortization schedule
    function showSchedule(schedule) {
        // Clear existing schedule
        scheduleTableBody.innerHTML = '';
        
        // Add schedule rows
        schedule.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.month}</td>
                <td>₹ ${row.emi.toLocaleString('en-IN')}</td>
                <td>₹ ${row.principal.toLocaleString('en-IN')}</td>
                <td>₹ ${row.interest.toLocaleString('en-IN')}</td>
                <td>₹ ${row.balance.toLocaleString('en-IN')}</td>
            `;
            scheduleTableBody.appendChild(tr);
        });
    }

    // Handle tenure radio button changes
    document.querySelectorAll('input[name="tenure_months"]').forEach(radio => {
        radio.addEventListener('change', calculateRealTime);
    });

    // Initialize the calculator
    updateOrnamentsTable(1);
    calculateRealTime();

    // Make calculateRealTime available globally for inline event handlers
    window.calculateRealTime = calculateRealTime;
});

// Utility function to format numbers as Indian currency
function formatIndianCurrency(amount) {
    return amount.toLocaleString('en-IN', {
        maximumFractionDigits: 0,
        style: 'currency',
        currency: 'INR'
    });
} 
