// EPF Calculator Script

let chart = null;
let yearwiseChart = null;

// Input elements
const basicSalaryInput = document.getElementById('basicSalary');
const basicSalarySlider = document.getElementById('basicSalarySlider');
const employeeContributionInput = document.getElementById('employeeContribution');
const employeeContributionSlider = document.getElementById('employeeContributionSlider');
const employerContributionInput = document.getElementById('employerContribution');
const employerContributionSlider = document.getElementById('employerContributionSlider');
const interestRateInput = document.getElementById('interestRate');
const interestRateSlider = document.getElementById('interestRateSlider');
const yearsOfServiceInput = document.getElementById('yearsOfService');
const yearsOfServiceSlider = document.getElementById('yearsOfServiceSlider');
const salaryIncreaseInput = document.getElementById('salaryIncrease');
const salaryIncreaseSlider = document.getElementById('salaryIncreaseSlider');

// Custom Chart.js plugin to display Total Return in center
const centerTextPlugin = {
    id: 'centerText',
    beforeDraw: function(chart) {
        if (chart.config.options.plugins.centerText && chart.config.options.plugins.centerText.display) {
            const ctx = chart.ctx;
            const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
            const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;
            
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Draw Total Corpus value
            ctx.font = 'bold 24px Inter, sans-serif';
            ctx.fillStyle = '#1a202c';
            ctx.fillText(chart.config.options.plugins.centerText.text, centerX, centerY - 8);
            
            // Draw "EPF Corpus" label
            ctx.font = '12px Inter, sans-serif';
            ctx.fillStyle = '#6b7280';
            ctx.fillText('EPF Corpus', centerX, centerY + 12);
            
            ctx.restore();
        }
    }
};

// Register the plugin
Chart.register(centerTextPlugin);

// Initialize sliders and event listeners
document.addEventListener('DOMContentLoaded', function() {
    setupSliders();
    addEventListeners();
    initialSyncValues();
    calculateAndUpdateResults();
    setupMegaMenu();
    setupResponsiveCharts();
});

function setupSliders() {
    syncInputs(basicSalaryInput, basicSalarySlider);
    syncInputs(employeeContributionInput, employeeContributionSlider);
    syncInputs(employerContributionInput, employerContributionSlider);
    syncInputs(interestRateInput, interestRateSlider);
    syncInputs(yearsOfServiceInput, yearsOfServiceSlider);
    syncInputs(salaryIncreaseInput, salaryIncreaseSlider);
}

function initialSyncValues() {
    // Set all initial values to 0, except interest rate (8.15% - official EPF rate)
    basicSalaryInput.value = 0;
    basicSalarySlider.value = 0;
    employeeContributionInput.value = 0;
    employeeContributionSlider.value = 0;
    employerContributionInput.value = 0;
    employerContributionSlider.value = 0;
    interestRateInput.value = 8.15;
    interestRateSlider.value = 8.15;
    yearsOfServiceInput.value = 0;
    yearsOfServiceSlider.value = 0;
    salaryIncreaseInput.value = 0;
    salaryIncreaseSlider.value = 0;
}

function syncInputs(input, slider) {
    // Sync input to slider
    input.addEventListener('input', function() {
        const value = parseFloat(this.value) || 0;
        if (value >= parseFloat(slider.min) && value <= parseFloat(slider.max)) {
            slider.value = value;
        }
        calculateAndUpdateResults();
    });

    // Sync slider to input
    slider.addEventListener('input', function() {
        input.value = this.value;
        calculateAndUpdateResults();
    });

    // Add change event for input field to handle direct typing
    input.addEventListener('change', function() {
        const value = parseFloat(this.value) || 0;
        if (value >= parseFloat(slider.min) && value <= parseFloat(slider.max)) {
            slider.value = value;
        } else if (value < parseFloat(slider.min)) {
            this.value = slider.min;
            slider.value = slider.min;
        } else if (value > parseFloat(slider.max)) {
            this.value = slider.max;
            slider.value = slider.max;
        }
        calculateAndUpdateResults();
    });
}

function addEventListeners() {
    // Add change listeners for all inputs
    [basicSalaryInput, employeeContributionInput, employerContributionInput, interestRateInput, yearsOfServiceInput, salaryIncreaseInput].forEach(input => {
        input.addEventListener('change', calculateAndUpdateResults);
        input.addEventListener('keyup', calculateAndUpdateResults);
    });

    // Add input listeners for sliders
    [basicSalarySlider, employeeContributionSlider, employerContributionSlider, interestRateSlider, yearsOfServiceSlider, salaryIncreaseSlider].forEach(slider => {
        slider.addEventListener('input', calculateAndUpdateResults);
    });
}

function calculateAndUpdateResults() {
    const data = {
        basic_salary: parseFloat(basicSalaryInput.value) || 0,
        employee_contribution: parseFloat(employeeContributionInput.value) || 0,
        employer_contribution: parseFloat(employerContributionInput.value) || 0,
        interest_rate: parseFloat(interestRateInput.value) || 0,
        years_of_service: parseFloat(yearsOfServiceInput.value) || 0,
        salary_increase: parseFloat(salaryIncreaseInput.value) || 0
    };
    
    // Validate inputs - allow 0 and positive values
    if (data.basic_salary < 0 || data.employee_contribution < 0 || data.employer_contribution < 0 || 
        data.interest_rate < 0 || data.years_of_service < 0 || data.salary_increase < 0) {
        return;
    }

    // Send calculation request
    fetch('/calculate-epf', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        updateResultsDisplay(result);
        updateChart(result);
        updateYearwiseChart(result);
        updateYearwiseTable(result);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function updateResultsDisplay(result) {
    const totalContribution = result.total_employee_contribution + result.total_employer_contribution;
    
    document.getElementById('finalCorpusResult').textContent = formatCurrency(result.total_corpus);
    document.getElementById('totalContributionResult').textContent = formatCurrency(totalContribution);
    document.getElementById('employeeContributionResult').textContent = formatCurrency(result.total_employee_contribution);
    document.getElementById('employerContributionResult').textContent = formatCurrency(result.total_employer_contribution);
    document.getElementById('interestEarnedResult').textContent = formatCurrency(result.total_interest);
    
    // Update chart summary
    document.getElementById('employeeContributionDisplay').textContent = formatCurrency(result.total_employee_contribution);
    document.getElementById('employerContributionDisplay').textContent = formatCurrency(result.total_employer_contribution);
    document.getElementById('interestEarnedDisplay').textContent = formatCurrency(result.total_interest);
}

function updateChart(result) {
    const ctx = document.getElementById('epfChart').getContext('2d');
    
    if (chart) {
        chart.destroy();
    }

    const centerText = formatCurrency(result.total_corpus);

    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Employee Contribution', 'Employer Contribution', 'Interest Earned'],
            datasets: [{
                data: [
                    result.total_employee_contribution,
                    result.total_employer_contribution,
                    result.total_interest
                ],
                backgroundColor: [
                    '#10b981', // Green for employee contribution
                    '#8b5cf6', // Purple for employer contribution
                    '#f59e0b'  // Orange for interest earned
                ],
                borderWidth: 0,
                cutout: '70%'
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
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                },
                centerText: {
                    display: true,
                    text: centerText
                }
            }
        }
    });
}

function updateYearwiseChart(result) {
    const ctx = document.getElementById('yearwiseChart').getContext('2d');
    
    if (yearwiseChart) {
        yearwiseChart.destroy();
    }

    const years = result.yearly_breakdown.map(item => `Year ${item.year}`);
    const employeeContributions = result.yearly_breakdown.map(item => item.employee_contribution);
    const employerContributions = result.yearly_breakdown.map(item => item.employer_contribution);
    const interestEarned = result.yearly_breakdown.map(item => item.interest_earned);

    yearwiseChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: years,
            datasets: [
                {
                    label: 'Employee Contribution',
                    data: employeeContributions,
                    backgroundColor: '#10b981',
                    borderRadius: 4
                },
                {
                    label: 'Employer Contribution',
                    data: employerContributions,
                    backgroundColor: '#8b5cf6',
                    borderRadius: 4
                },
                {
                    label: 'Interest Earned',
                    data: interestEarned,
                    backgroundColor: '#f59e0b',
                    borderRadius: 4
                }
            ]
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
                            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        display: false
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

function updateYearwiseTable(result) {
    const tableBody = document.getElementById('breakdownTableBody');
    tableBody.innerHTML = '';

    result.yearly_breakdown.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.year}</td>
            <td>${formatCurrency(item.basic_salary)}</td>
            <td>${formatCurrency(item.employee_contribution)}</td>
            <td>${formatCurrency(item.employer_contribution)}</td>
            <td>${formatCurrency(item.interest_earned)}</td>
            <td>${formatCurrency(item.total_balance)}</td>
        `;
        tableBody.appendChild(row);
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function setupMegaMenu() {
    const megaMenuBtn = document.querySelector('.mega-menu-btn');
    const megaMenu = document.querySelector('.mega-menu');
    
    if (megaMenuBtn && megaMenu) {
        megaMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            megaMenu.classList.toggle('open');
        });
        
        // Close mega menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!megaMenu.contains(event.target)) {
                megaMenu.classList.remove('open');
            }
        });
    }
}

function setupResponsiveCharts() {
    // Handle responsive chart resizing
    window.addEventListener('resize', function() {
        if (chart) {
            chart.resize();
        }
        if (yearwiseChart) {
            yearwiseChart.resize();
        }
    });
}

function isMobileDevice() {
    return window.innerWidth <= 768;
}

function getResponsiveChartOptions(baseOptions) {
    if (isMobileDevice()) {
        return {
            ...baseOptions,
            plugins: {
                ...baseOptions.plugins,
                legend: {
                    ...baseOptions.plugins.legend,
                    position: 'bottom'
                }
            }
        };
    }
    return baseOptions;
} 