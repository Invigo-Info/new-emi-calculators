// Home Construction Cost Calculator JavaScript
// Unique function and variable names to avoid conflicts

// Construction cost calculator constants and configuration
const constructionCostConstants = {
    // Material percentage breakup (thumb-rule)
    materialPercentages: {
        cement: 16.4,
        sand: 12.3,
        aggregate: 7.4,
        steel: 24.6,
        paint: 4.1,
        tiles: 8.0,
        bricks: 4.4,
        windows: 3.0,
        doors: 3.4,
        plumbing: 5.5,
        electrical: 6.8,
        sanitary: 4.1
    },
    
    // Base quantities for 1000 sq ft
    baseQuantities: {
        cement: 400, // bags
        sand: { volume: 51, weight: 81.6 }, // m³, tonnes
        aggregate: { volume: 38, weight: 60.8 }, // m³, tonnes
        steel: 4000, // kg (also 4 kg/ft²)
        paint: 180, // liters
        bricks: 8000, // pieces (also 8/ft²)
        flooring: { area: 1300, tiles: 325 } // ft², tiles
    },
    
    // Chart colors for cost distribution
    chartColors: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
        '#FF6384', '#C9CBCF', '#4BC0C0', '#36A2EB', '#FFCE56', '#9966FF'
    ]
};

let constructionCostChart = null;

// Initialize the construction cost calculator
function initializeConstructionCostCalculator() {
    // Get DOM elements
    const builtUpAreaInput = document.getElementById('builtUpArea');
    const builtUpAreaSlider = document.getElementById('builtUpAreaSlider');
    const costPerSqFtInput = document.getElementById('costPerSqFt');
    const costPerSqFtSlider = document.getElementById('costPerSqFtSlider');
    const showDetailedBreakupToggle = document.getElementById('showDetailedBreakup');
    const showMaterialQuantitiesToggle = document.getElementById('showMaterialQuantities');
    
    // Sync input and slider values
    syncInputAndSlider(builtUpAreaInput, builtUpAreaSlider);
    syncInputAndSlider(costPerSqFtInput, costPerSqFtSlider);
    
    // Add event listeners for live calculations
    builtUpAreaInput.addEventListener('input', handleConstructionInputChange);
    builtUpAreaSlider.addEventListener('input', handleConstructionInputChange);
    costPerSqFtInput.addEventListener('input', handleConstructionInputChange);
    costPerSqFtSlider.addEventListener('input', handleConstructionInputChange);
    
    // Add toggle event listeners
    showDetailedBreakupToggle.addEventListener('change', handleToggleChange);
    showMaterialQuantitiesToggle.addEventListener('change', handleToggleChange);
    
    // Add action button event listeners
    document.getElementById('downloadReportBtn').addEventListener('click', downloadConstructionReport);
    document.getElementById('shareResultsBtn').addEventListener('click', shareConstructionResults);
    
    // Initial calculation
    calculateConstructionCost();
}

// Handle input changes with validation and enhanced sync
function handleConstructionInputChange(event) {
    const input = event.target;
    const inputId = input.id;
    
    // Validate input values and sync
    if (inputId === 'builtUpArea' || inputId === 'builtUpAreaSlider') {
        let value = parseFloat(input.value);
        
        // Handle empty or invalid values
        if (isNaN(value)) {
            value = 1000; // Default value
        }
        
        // Apply constraints
        if (value < 100) {
            value = 100;
        } else if (value > 50000) {
            value = 50000;
        }
        
        // Update the current input if value was corrected
        if (input.value != value) {
            input.value = value;
        }
        
        // Sync the paired input/slider
        if (inputId === 'builtUpArea') {
            document.getElementById('builtUpAreaSlider').value = value;
        } else {
            document.getElementById('builtUpArea').value = value;
        }
        
        // Visual feedback for validation
        showInputValidationFeedback(input, value >= 100 && value <= 50000);
        
    } else if (inputId === 'costPerSqFt' || inputId === 'costPerSqFtSlider') {
        let value = parseFloat(input.value);
        
        // Handle empty or invalid values
        if (isNaN(value)) {
            value = 1500; // Default value
        }
        
        // Apply constraints
        if (value < 500) {
            value = 500;
        } else if (value > 5000) {
            value = 5000;
        }
        
        // Update the current input if value was corrected
        if (input.value != value) {
            input.value = value;
        }
        
        // Sync the paired input/slider
        if (inputId === 'costPerSqFt') {
            document.getElementById('costPerSqFtSlider').value = value;
        } else {
            document.getElementById('costPerSqFt').value = value;
        }
        
        // Visual feedback for validation
        showInputValidationFeedback(input, value >= 500 && value <= 5000);
    }
    
    // Recalculate construction cost
    calculateConstructionCost();
}

// Handle toggle changes
function handleToggleChange(event) {
    const toggleId = event.target.id;
    
    if (toggleId === 'showDetailedBreakup') {
        const breakupSection = document.getElementById('costBreakupSection');
        if (event.target.checked) {
            breakupSection.classList.remove('hidden');
        } else {
            breakupSection.classList.add('hidden');
        }
    } else if (toggleId === 'showMaterialQuantities') {
        const quantitiesSection = document.getElementById('materialQuantitiesSection');
        if (event.target.checked) {
            quantitiesSection.classList.remove('hidden');
        } else {
            quantitiesSection.classList.add('hidden');
        }
    }
}

// Enhanced sync function for input field and slider values
function syncInputAndSlider(input, slider) {
    // Only add listeners if they haven't been added already
    if (!input.hasAttribute('data-synced')) {
        input.setAttribute('data-synced', 'true');
        slider.setAttribute('data-synced', 'true');
        
        // Enhanced input to slider sync with validation
        input.addEventListener('input', (e) => {
            let value = parseFloat(e.target.value);
            
            // Get constraints from slider
            const min = parseFloat(slider.min);
            const max = parseFloat(slider.max);
            
            // Validate and constrain
            if (isNaN(value)) {
                value = parseFloat(slider.value); // Keep current slider value
            } else {
                value = Math.max(min, Math.min(max, value));
            }
            
            slider.value = value;
            
            // Visual feedback
            showInputValidationFeedback(input, value >= min && value <= max);
        });
        
        // Enhanced slider to input sync
        slider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            input.value = value;
            
            // Show sync indicator
            showSyncIndicator(input);
            
            // Clear any validation styling when using slider
            showInputValidationFeedback(input, true);
        });
        
        // Real-time visual updates on focus/blur
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('input-focused');
            input.select(); // Select all text for easy editing
        });
        
        input.addEventListener('blur', () => {
            input.parentElement.classList.remove('input-focused');
        });
        
        // Enhanced keyboard navigation
        input.addEventListener('keydown', (e) => {
            const step = parseFloat(slider.step) || 1;
            const currentValue = parseFloat(input.value) || 0;
            
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                const newValue = Math.min(parseFloat(slider.max), currentValue + step);
                input.value = newValue;
                slider.value = newValue;
                input.dispatchEvent(new Event('input'));
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                const newValue = Math.max(parseFloat(slider.min), currentValue - step);
                input.value = newValue;
                slider.value = newValue;
                input.dispatchEvent(new Event('input'));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                input.blur(); // Remove focus and trigger validation
            }
        });
    }
}

// Show visual feedback for input validation
function showInputValidationFeedback(input, isValid) {
    const container = input.parentElement;
    
    // Remove existing validation classes
    container.classList.remove('input-valid', 'input-invalid');
    
    // Add appropriate validation class
    if (isValid) {
        container.classList.add('input-valid');
        // Remove invalid class after a short delay to show the green flash
        setTimeout(() => {
            container.classList.remove('input-valid');
        }, 1000);
    } else {
        container.classList.add('input-invalid');
        // Keep invalid class longer to show the error
        setTimeout(() => {
            container.classList.remove('input-invalid');
        }, 2000);
    }
}

// Show sync indicator when input and slider are syncing
function showSyncIndicator(input) {
    const container = input.parentElement;
    
    // Add sync indicator class
    container.classList.add('input-synced');
    
    // Remove sync indicator after animation
    setTimeout(() => {
        container.classList.remove('input-synced');
    }, 1000);
}

// Main calculation function
function calculateConstructionCost() {
    try {
        // Get input values
        const builtUpArea = parseFloat(document.getElementById('builtUpArea').value) || 1000;
        const costPerSqFt = parseFloat(document.getElementById('costPerSqFt').value) || 1500;
        
        // Calculate total construction cost
        const totalCost = builtUpArea * costPerSqFt;
        
        // Update main result card
        updateMainResultCard(totalCost, costPerSqFt);
        
        // Calculate and update material costs
        updateMaterialCosts(totalCost);
        
        // Calculate and update material quantities
        updateMaterialQuantities(builtUpArea);
        
        // Update cost distribution chart
        updateConstructionCostChart(totalCost);
        
    } catch (error) {
        console.error('Error calculating construction cost:', error);
        showErrorMessage('An error occurred while calculating construction cost. Please check your inputs.');
    }
}

// Update main result card
function updateMainResultCard(totalCost, costPerSqFt) {
    document.getElementById('totalConstructionCost').textContent = formatIndianCurrency(totalCost);
    document.getElementById('costPerSqFtDisplay').textContent = `${formatIndianCurrency(costPerSqFt)} per ft²`;
}

// Update material costs breakdown
function updateMaterialCosts(totalCost) {
    const materials = constructionCostConstants.materialPercentages;
    
    // Update individual material costs
    Object.keys(materials).forEach(material => {
        const cost = totalCost * (materials[material] / 100);
        const elementId = material + 'Cost';
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = formatIndianCurrency(cost);
        }
    });
    
    // Calculate and update group totals
    const finishersTotal = totalCost * ((materials.paint + materials.tiles + materials.bricks) / 100);
    const fittingsTotal = totalCost * ((materials.windows + materials.doors + materials.plumbing + materials.electrical + materials.sanitary) / 100);
    
    document.getElementById('finishersTotal').textContent = formatIndianCurrency(finishersTotal);
    document.getElementById('fittingsTotal').textContent = formatIndianCurrency(fittingsTotal);
    
    // Update percentages
    const finishersPercent = ((materials.paint + materials.tiles + materials.bricks)).toFixed(1);
    const fittingsPercent = ((materials.windows + materials.doors + materials.plumbing + materials.electrical + materials.sanitary)).toFixed(1);
    
    // Update group percentage displays
    const finishersPercentElement = document.querySelector('.finishers-card .group-percent');
    const fittingsPercentElement = document.querySelector('.fittings-card .group-percent');
    
    if (finishersPercentElement) finishersPercentElement.textContent = `${finishersPercent}%`;
    if (fittingsPercentElement) fittingsPercentElement.textContent = `${fittingsPercent}%`;
}

// Update material quantities
function updateMaterialQuantities(builtUpArea) {
    const baseQuantities = constructionCostConstants.baseQuantities;
    const scaleFactor = builtUpArea / 1000;
    
    // Calculate scaled quantities
    const cement = Math.round(baseQuantities.cement * scaleFactor);
    const sandVolume = (baseQuantities.sand.volume * scaleFactor).toFixed(1);
    const sandWeight = (baseQuantities.sand.weight * scaleFactor).toFixed(1);
    const aggregateVolume = (baseQuantities.aggregate.volume * scaleFactor).toFixed(1);
    const aggregateWeight = (baseQuantities.aggregate.weight * scaleFactor).toFixed(1);
    const steel = Math.round(4 * builtUpArea); // Direct calculation: 4 kg/ft²
    const paint = Math.round(baseQuantities.paint * scaleFactor);
    const bricks = Math.round(8 * builtUpArea); // Direct calculation: 8 pieces/ft²
    const flooringArea = Math.round(baseQuantities.flooring.area * scaleFactor);
    const flooringTiles = Math.round(baseQuantities.flooring.tiles * scaleFactor);
    
    // Update quantity displays
    document.getElementById('cementQuantity').textContent = `${cement} bags`;
    document.getElementById('sandQuantity').textContent = `${sandVolume} m³ (≈ ${sandWeight} t)`;
    document.getElementById('aggregateQuantity').textContent = `${aggregateVolume} m³ (≈ ${aggregateWeight} t)`;
    document.getElementById('steelQuantity').textContent = `${formatNumber(steel)} kg`;
    document.getElementById('paintQuantity').textContent = `${paint} L`;
    document.getElementById('bricksQuantity').textContent = `${formatNumber(bricks)} pcs`;
    document.getElementById('flooringQuantity').textContent = `${formatNumber(flooringArea)} ft²`;
    
    // Update steel and bricks subtexts with per sq ft calculations
    const steelPerSqFt = (steel / builtUpArea).toFixed(1);
    const bricksPerSqFt = (bricks / builtUpArea).toFixed(1);
    const flooringTilesText = `(≈ ${formatNumber(flooringTiles)} tiles)`;
    
    // Update subtitle elements
    const steelSubElement = document.querySelector('#steelQuantity').nextElementSibling;
    const bricksSubElement = document.querySelector('#bricksQuantity').nextElementSibling;
    const flooringSubElement = document.querySelector('#flooringQuantity').nextElementSibling;
    
    if (steelSubElement) steelSubElement.textContent = `(${steelPerSqFt} kg/ft²)`;
    if (bricksSubElement) bricksSubElement.textContent = `(${bricksPerSqFt} pcs/ft²)`;
    if (flooringSubElement) flooringSubElement.textContent = flooringTilesText;
}

// Update construction cost distribution chart
function updateConstructionCostChart(totalCost) {
    const ctx = document.getElementById('constructionCostChart');
    if (!ctx) return;
    
    const materials = constructionCostConstants.materialPercentages;
    const chartData = {
        labels: Object.keys(materials).map(key => capitalizeFirstLetter(key)),
        datasets: [{
            data: Object.values(materials),
            backgroundColor: constructionCostConstants.chartColors,
            borderColor: '#ffffff',
            borderWidth: 2
        }]
    };
    
    // Destroy existing chart if it exists
    if (constructionCostChart) {
        constructionCostChart.destroy();
    }
    
    // Create new chart
    constructionCostChart = new Chart(ctx, {
        type: 'doughnut',
        data: chartData,
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
                            size: 12,
                            family: 'Inter'
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const percentage = context.parsed || 0;
                            const cost = totalCost * (percentage / 100);
                            return `${label}: ${formatIndianCurrency(cost)} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '60%',
            animation: {
                animateRotate: true,
                duration: 1000
            }
        }
    });
}

// Format number with Indian grouping (lakh/crore)
function formatIndianCurrency(amount) {
    if (amount >= 10000000) { // 1 crore
        const crore = amount / 10000000;
        return `₹${crore.toFixed(2)} Cr`;
    } else if (amount >= 100000) { // 1 lakh
        const lakh = amount / 100000;
        return `₹${lakh.toFixed(2)} L`;
    } else if (amount >= 1000) { // 1 thousand
        return `₹${(amount / 1000).toFixed(1)}K`;
    } else {
        return `₹${Math.round(amount).toLocaleString('en-IN')}`;
    }
}

// Format number with commas
function formatNumber(num) {
    return num.toLocaleString('en-IN');
}

// Capitalize first letter
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Download construction cost report
function downloadConstructionReport() {
    try {
        const builtUpArea = parseFloat(document.getElementById('builtUpArea').value) || 1000;
        const costPerSqFt = parseFloat(document.getElementById('costPerSqFt').value) || 1500;
        const totalCost = builtUpArea * costPerSqFt;
        
        // Create report data
        const reportData = {
            "Construction Cost Report": {
                "Project Details": {
                    "Built-up Area": `${builtUpArea} ft²`,
                    "Cost per Sq Ft": `₹${costPerSqFt}`,
                    "Total Construction Cost": formatIndianCurrency(totalCost),
                    "Generated On": new Date().toLocaleDateString('en-IN')
                },
                "Material Cost Breakdown": {},
                "Material Quantities": {},
                "Group Totals": {}
            }
        };
        
        // Add material costs
        const materials = constructionCostConstants.materialPercentages;
        Object.keys(materials).forEach(material => {
            const cost = totalCost * (materials[material] / 100);
            reportData["Construction Cost Report"]["Material Cost Breakdown"][capitalizeFirstLetter(material)] = {
                "Cost": formatIndianCurrency(cost),
                "Percentage": `${materials[material]}%`
            };
        });
        
        // Add material quantities
        const baseQuantities = constructionCostConstants.baseQuantities;
        const scaleFactor = builtUpArea / 1000;
        
        reportData["Construction Cost Report"]["Material Quantities"] = {
            "Cement": `${Math.round(baseQuantities.cement * scaleFactor)} bags`,
            "Sand": `${(baseQuantities.sand.volume * scaleFactor).toFixed(1)} m³ (≈ ${(baseQuantities.sand.weight * scaleFactor).toFixed(1)} t)`,
            "Aggregate": `${(baseQuantities.aggregate.volume * scaleFactor).toFixed(1)} m³ (≈ ${(baseQuantities.aggregate.weight * scaleFactor).toFixed(1)} t)`,
            "Steel": `${formatNumber(Math.round(4 * builtUpArea))} kg (4 kg/ft²)`,
            "Paint": `${Math.round(baseQuantities.paint * scaleFactor)} L`,
            "Bricks": `${formatNumber(Math.round(8 * builtUpArea))} pcs (8 pcs/ft²)`,
            "Flooring": `${formatNumber(Math.round(baseQuantities.flooring.area * scaleFactor))} ft² (≈ ${formatNumber(Math.round(baseQuantities.flooring.tiles * scaleFactor))} tiles)`
        };
        
        // Add group totals
        const finishersTotal = totalCost * ((materials.paint + materials.tiles + materials.bricks) / 100);
        const fittingsTotal = totalCost * ((materials.windows + materials.doors + materials.plumbing + materials.electrical + materials.sanitary) / 100);
        
        reportData["Construction Cost Report"]["Group Totals"] = {
            "Finishers (Paint + Tiles + Bricks)": formatIndianCurrency(finishersTotal),
            "Fittings (Windows + Doors + Plumbing + Electrical + Sanitary)": formatIndianCurrency(fittingsTotal)
        };
        
        // Download as JSON
        const dataStr = JSON.stringify(reportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Construction_Cost_Report_${builtUpArea}sqft_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showSuccessMessage('Construction cost report downloaded successfully!');
    } catch (error) {
        console.error('Error downloading report:', error);
        showErrorMessage('Failed to download report. Please try again.');
    }
}

// Share construction results
function shareConstructionResults() {
    try {
        const builtUpArea = parseFloat(document.getElementById('builtUpArea').value) || 1000;
        const costPerSqFt = parseFloat(document.getElementById('costPerSqFt').value) || 1500;
        const totalCost = builtUpArea * costPerSqFt;
        
        const shareText = `🏠 Home Construction Cost Estimate

📐 Built-up Area: ${builtUpArea} ft²
💰 Cost per Sq Ft: ₹${costPerSqFt}
🏗️ Total Construction Cost: ${formatIndianCurrency(totalCost)}

📊 Key Materials:
• Steel: ${formatNumber(Math.round(4 * builtUpArea))} kg (4 kg/ft²)
• Bricks: ${formatNumber(Math.round(8 * builtUpArea))} pcs (8 pcs/ft²)
• Cement: ${Math.round(constructionCostConstants.baseQuantities.cement * (builtUpArea / 1000))} bags

⚠️ This is a thumb-rule estimate. Actual costs may vary.

Calculate yours: ${window.location.href}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Home Construction Cost Calculator',
                text: shareText,
                url: window.location.href
            });
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(shareText).then(() => {
                showSuccessMessage('Construction cost details copied to clipboard!');
            }).catch(() => {
                fallbackCopyToClipboard(shareText);
            });
        } else {
            fallbackCopyToClipboard(shareText);
        }
    } catch (error) {
        console.error('Error sharing results:', error);
        showErrorMessage('Failed to share results. Please try again.');
    }
}

// Fallback copy to clipboard function
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showSuccessMessage('Construction cost details copied to clipboard!');
    } catch (err) {
        showErrorMessage('Failed to copy to clipboard. Please select and copy manually.');
    }
    
    document.body.removeChild(textArea);
}

// Show success message
function showSuccessMessage(message) {
    showNotification(message, 'success');
}

// Show error message
function showErrorMessage(message) {
    showNotification(message, 'error');
}

// Show notification
function showNotification(message, type) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.construction-notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `construction-notification construction-notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        font-size: 14px;
        z-index: 10000;
        max-width: 300px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        transform: translateX(350px);
        transition: transform 0.3s ease;
        ${type === 'success' ? 'background: linear-gradient(135deg, #48bb78, #38a169);' : 'background: linear-gradient(135deg, #f56565, #e53e3e);'}
    `;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Hide notification after 4 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(350px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeConstructionCostCalculator();
});

// Handle page visibility change to recalculate if needed
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        calculateConstructionCost();
    }
});

// Prevent form submission if this is in a form
document.addEventListener('submit', function(e) {
    const form = e.target;
    if (form.querySelector('#builtUpArea')) {
        e.preventDefault();
        calculateConstructionCost();
    }
});

// Add input validation for number fields (only for our specific calculator inputs)
document.addEventListener('input', function(e) {
    if (e.target.type === 'number' && (e.target.id === 'builtUpArea' || e.target.id === 'costPerSqFt')) {
        const value = parseFloat(e.target.value);
        if (isNaN(value) || value < 0) {
            // Don't auto-correct here, let the handleConstructionInputChange function handle it
            return;
        }
    }
});

// Export functions for potential external use
window.constructionCostCalculator = {
    calculate: calculateConstructionCost,
    format: formatIndianCurrency,
    download: downloadConstructionReport,
    share: shareConstructionResults
};
