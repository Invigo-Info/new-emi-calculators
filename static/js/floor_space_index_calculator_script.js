// Floor Space Index Calculator JavaScript
// Global variables
let fsiChart;
let isUpdating = false; // Prevent recursive updates

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    fsiSetupEventListeners();
    fsiInitializeChart();
    fsiResetResults(); // Initialize with empty results
});

function fsiSetupEventListeners() {
    // Input change listeners for number inputs with live calculation
    const fsiInputs = [
        { input: 'fsiTotalFloorArea', slider: 'fsiTotalFloorAreaSlider', min: 0, max: 100000 },
        { input: 'fsiTotalPlotArea', slider: 'fsiTotalPlotAreaSlider', min: 0, max: 50000 },
        { input: 'fsiFloorSpaceIndex', slider: 'fsiFloorSpaceIndexSlider', min: 0, max: 5 }
    ];
    
    fsiInputs.forEach(({ input, slider, min = 0, max }) => {
        const inputElement = document.getElementById(input);
        const sliderElement = document.getElementById(slider);
        
        if (inputElement) {
            // Enhanced input event listener for user typing only
            inputElement.addEventListener('input', function() {
                if (isUpdating) return;
                
                // Update slider for visual feedback only (no constraints)
                if (sliderElement) {
                    const value = parseFloat(this.value) || 0;
                    const clampedValue = Math.max(Math.min(value, max), min);
                    sliderElement.value = clampedValue;
                }
                
                // Live calculation on every input change
                fsiCalculateAndUpdate();
            });
            
            // Clear input field completely when user selects all text
            inputElement.addEventListener('focus', function() {
                this.select();
            });
            
            // Allow all keyboard input for numbers and decimals
            inputElement.addEventListener('keydown', function(e) {
                // Allow: backspace, delete, tab, escape, enter
                if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
                    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                    (e.keyCode === 65 && e.ctrlKey === true) ||
                    (e.keyCode === 67 && e.ctrlKey === true) ||
                    (e.keyCode === 86 && e.ctrlKey === true) ||
                    (e.keyCode === 88 && e.ctrlKey === true) ||
                    // Allow: home, end, left, right
                    (e.keyCode >= 35 && e.keyCode <= 39)) {
                    return;
                }
                // Ensure that it's a number and stop the keypress
                if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105) && e.keyCode !== 190) {
                    e.preventDefault();
                }
            });
        }
        
        // Keep slider for visual feedback but disable user interaction
        if (sliderElement) {
            sliderElement.style.pointerEvents = 'none';
            sliderElement.style.opacity = '0.7';
        }
    });

    // Unit change listeners with live calculation
    const unitSelectors = ['fsiFloorAreaUnit', 'fsiPlotAreaUnit'];
    unitSelectors.forEach(unitId => {
        const unitElement = document.getElementById(unitId);
        if (unitElement) {
            unitElement.addEventListener('change', fsiCalculateAndUpdate);
        }
    });
}

function fsiCalculateAndUpdate() {
    const floorAreaValue = parseFloat(document.getElementById('fsiTotalFloorArea').value) || 0;
    const plotAreaValue = parseFloat(document.getElementById('fsiTotalPlotArea').value) || 0;
    const fsiValue = parseFloat(document.getElementById('fsiFloorSpaceIndex').value) || 0;
    
    const floorAreaUnit = document.getElementById('fsiFloorAreaUnit').value;
    const plotAreaUnit = document.getElementById('fsiPlotAreaUnit').value;
    
    // Convert to square feet for calculation
    const floorAreaSqFt = fsiConvertToSqFt(floorAreaValue, floorAreaUnit);
    const plotAreaSqFt = fsiConvertToSqFt(plotAreaValue, plotAreaUnit);
    
    // Check if we have at least 2 values to calculate
    const hasFloorArea = floorAreaValue > 0;
    const hasPlotArea = plotAreaValue > 0;
    const hasFSI = fsiValue > 0;
    
    const validInputs = [hasFloorArea, hasPlotArea, hasFSI].filter(Boolean).length;
    
    if (validInputs < 2) {
        fsiResetResults();
        return;
    }
    
    // Send data to backend for calculation
    const requestData = {
        totalFloorArea: floorAreaSqFt,
        totalPlotArea: plotAreaSqFt,
        floorSpaceIndex: fsiValue
    };
    
    fetch('/calculate-floor-space-index', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            fsiUpdateResults(data, floorAreaUnit, plotAreaUnit);
        } else {
            console.error('Calculation error:', data.error);
            fsiResetResults();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        fsiResetResults();
    });
}

function fsiConvertToSqFt(value, unit) {
    switch (unit) {
        case 'sq m':
            return value * 10.764; // 1 sq m = 10.764 sq ft
        case 'acres':
            return value * 43560; // 1 acre = 43,560 sq ft
        default:
            return value; // already in sq ft
    }
}

function fsiConvertFromSqFt(value, unit) {
    switch (unit) {
        case 'sq m':
            return value / 10.764;
        case 'acres':
            return value / 43560;
        default:
            return value; // keep in sq ft
    }
}

function fsiFormatArea(value, unit) {
    const convertedValue = fsiConvertFromSqFt(value, unit);
    return `${fsiFormatNumber(convertedValue)} ${unit}`;
}

function fsiFormatNumber(num) {
    if (num >= 10000000) {
        return (num / 10000000).toFixed(2) + ' Cr';
    } else if (num >= 100000) {
        return (num / 100000).toFixed(2) + ' L';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(2) + ' K';
    } else {
        return num.toFixed(2);
    }
}

function fsiUpdateResults(data, floorAreaUnit, plotAreaUnit) {
    const result = data.result;
    
    // Update result displays
    document.getElementById('fsiResultFloorArea').textContent = fsiFormatArea(result.totalFloorArea, floorAreaUnit);
    document.getElementById('fsiResultPlotArea').textContent = fsiFormatArea(result.totalPlotArea, plotAreaUnit);
    document.getElementById('fsiResultIndex').textContent = result.floorSpaceIndex.toFixed(3);
    document.getElementById('fsiResultEfficiency').textContent = data.efficiencyRating;
    document.getElementById('fsiResultCategory').textContent = data.fsiCategory;
    document.getElementById('fsiResultUtilization').textContent = data.utilizationPercentage + '%';
    
    // Update chart summary
    document.getElementById('fsiFloorAreaSummary').textContent = fsiFormatArea(result.totalFloorArea, floorAreaUnit);
    document.getElementById('fsiPlotAreaSummary').textContent = fsiFormatArea(result.totalPlotArea, plotAreaUnit);
    
    // Update chart
    fsiUpdateChart(result.totalFloorArea, result.totalPlotArea, floorAreaUnit, plotAreaUnit);
    
    // Update missing input field if calculated (prevent recursive updates)
    isUpdating = true;
    if (data.result.calculationType === 'FSI') {
        // FSI was calculated, update the FSI input only
        document.getElementById('fsiFloorSpaceIndex').value = result.floorSpaceIndex.toFixed(3);
        // Update slider for visual feedback only
        const sliderElement = document.getElementById('fsiFloorSpaceIndexSlider');
        if (sliderElement) sliderElement.value = result.floorSpaceIndex;
    } else if (data.result.calculationType === 'FloorArea') {
        // Floor Area was calculated, update the floor area input only
        const convertedFloorArea = fsiConvertFromSqFt(result.totalFloorArea, floorAreaUnit);
        document.getElementById('fsiTotalFloorArea').value = convertedFloorArea.toFixed(2);
        // Update slider for visual feedback only
        const sliderElement = document.getElementById('fsiTotalFloorAreaSlider');
        if (sliderElement) sliderElement.value = Math.min(convertedFloorArea, 100000);
    } else if (data.result.calculationType === 'PlotArea') {
        // Plot Area was calculated, update the plot area input only
        const convertedPlotArea = fsiConvertFromSqFt(result.totalPlotArea, plotAreaUnit);
        document.getElementById('fsiTotalPlotArea').value = convertedPlotArea.toFixed(2);
        // Update slider for visual feedback only
        const sliderElement = document.getElementById('fsiTotalPlotAreaSlider');
        if (sliderElement) sliderElement.value = Math.min(convertedPlotArea, 50000);
    }
    setTimeout(() => { isUpdating = false; }, 100); // Reset flag after a brief delay
}

function fsiInitializeChart() {
    const ctx = document.getElementById('fsiChart');
    if (!ctx) return;
    
    fsiChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Floor Area', 'Available Plot Area'],
            datasets: [{
                data: [0, 100],
                backgroundColor: ['#3b82f6', '#10b981'],
                borderWidth: 0,
                hoverBackgroundColor: ['#2563eb', '#059669']
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
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            return `${label}: ${value.toFixed(1)}%`;
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
}

function fsiUpdateChart(floorArea, plotArea, floorAreaUnit, plotAreaUnit) {
    if (!fsiChart) return;
    
    // Calculate percentages for visualization
    const floorAreaPct = (floorArea / (floorArea + plotArea)) * 100;
    const plotAreaPct = (plotArea / (floorArea + plotArea)) * 100;
    
    fsiChart.data.datasets[0].data = [floorAreaPct, plotAreaPct];
    fsiChart.data.labels = [
        `Floor Area (${fsiFormatArea(floorArea, floorAreaUnit)})`,
        `Plot Area (${fsiFormatArea(plotArea, plotAreaUnit)})`
    ];
    fsiChart.update();
}

function fsiResetResults() {
    // Reset all result displays
    const resultElements = [
        'fsiResultFloorArea',
        'fsiResultPlotArea', 
        'fsiResultIndex',
        'fsiResultEfficiency',
        'fsiResultCategory',
        'fsiResultUtilization',
        'fsiFloorAreaSummary',
        'fsiPlotAreaSummary'
    ];
    
    resultElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = '-';
        }
    });
    
    // Reset chart
    if (fsiChart) {
        fsiChart.data.datasets[0].data = [0, 100];
        fsiChart.data.labels = ['Floor Area', 'Available Plot Area'];
        fsiChart.update();
    }
}



// Utility function to format currency (if needed for future enhancements)
function fsiFormatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Export functions for potential external use
window.fsiCalculator = {
    calculate: fsiCalculateAndUpdate,
    formatNumber: fsiFormatNumber,
    formatArea: fsiFormatArea
};
