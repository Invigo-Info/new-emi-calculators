// Global variables
let stockBreakdownChart;
let purchaseCount = 0;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    setupDownloadButtons();
    setupMegaMenu();
    addInitialPurchases();
    loadFromUrlParameters();
    calculateAndUpdate();
});

function setupEventListeners() {
    // Current market price input and slider sync
    const currentMarketPriceInput = document.getElementById('currentMarketPrice');
    const currentMarketPriceSlider = document.getElementById('currentMarketPriceSlider');
    
    if (currentMarketPriceInput && currentMarketPriceSlider) {
        currentMarketPriceInput.addEventListener('input', function() {
            const value = Math.max(Math.min(parseFloat(this.value) || 1, 5000), 0.01);
            currentMarketPriceSlider.value = value;
            calculateAndUpdate();
        });
        
        currentMarketPriceSlider.addEventListener('input', function() {
            currentMarketPriceInput.value = this.value;
            calculateAndUpdate();
        });
    }

    // Add purchase button
    const addPurchaseBtn = document.getElementById('addPurchaseBtn');
    if (addPurchaseBtn) {
        addPurchaseBtn.addEventListener('click', addPurchaseRow);
    }
}

function addInitialPurchases() {
    // Add default purchase rows with sample data
    addPurchaseRow(100, 120.00);
    addPurchaseRow(50, 140.00);
    addPurchaseRow(75, 160.00);
}

function addPurchaseRow(defaultShares = '', defaultPrice = '') {
    purchaseCount++;
    const purchasesContainer = document.getElementById('purchasesContainer');
    
    const purchaseRow = document.createElement('div');
    purchaseRow.className = 'purchase-row';
    purchaseRow.id = `purchase-${purchaseCount}`;
    
    purchaseRow.innerHTML = `
        <div class="purchase-row-header">Purchase ${purchaseCount}</div>
        <div class="input-group">
            <label class="input-label">Shares</label>
            <div class="input-field-container">
                <input type="number" class="purchase-shares" value="${defaultShares}" min="0.01" step="0.01" placeholder="0">
                <span class="input-suffix">Qty</span>
            </div>
        </div>
        <div class="input-group">
            <label class="input-label">Price per Share</label>
            <div class="input-field-container">
                <input type="number" class="purchase-price" value="${defaultPrice}" min="0.01" step="0.01" placeholder="0.00">
                <span class="input-suffix">₹</span>
            </div>
        </div>
        <button class="remove-purchase-btn" onclick="removePurchaseRow('${purchaseRow.id}')">Remove</button>
    `;
    
    purchasesContainer.appendChild(purchaseRow);
    
    // Add event listeners to the new inputs
    const sharesInput = purchaseRow.querySelector('.purchase-shares');
    const priceInput = purchaseRow.querySelector('.purchase-price');
    
    sharesInput.addEventListener('input', calculateAndUpdate);
    priceInput.addEventListener('input', calculateAndUpdate);
    
    calculateAndUpdate();
}

function removePurchaseRow(purchaseId) {
    const purchaseRow = document.getElementById(purchaseId);
    const totalPurchases = document.querySelectorAll('.purchase-row').length;
    
    if (purchaseRow && totalPurchases > 1) { // Keep at least one purchase row
        purchaseRow.remove();
        // Re-number the remaining purchases
        renumberPurchases();
        calculateAndUpdate();
    }
}

function renumberPurchases() {
    const purchaseRows = document.querySelectorAll('.purchase-row');
    purchaseRows.forEach((row, index) => {
        const header = row.querySelector('.purchase-row-header');
        if (header) {
            header.textContent = `Purchase ${index + 1}`;
        }
        // Update the row ID
        row.id = `purchase-${index + 1}`;
        // Update the remove button onclick
        const removeBtn = row.querySelector('.remove-purchase-btn');
        if (removeBtn) {
            removeBtn.setAttribute('onclick', `removePurchaseRow('purchase-${index + 1}')`);
        }
    });
    // Update the purchase count
    purchaseCount = purchaseRows.length;
}

function calculateAndUpdate() {
    const currentMarketPrice = parseFloat(document.getElementById('currentMarketPrice').value) || 0;
    const purchases = [];
    
    // Collect all purchase data
    const purchaseRows = document.querySelectorAll('.purchase-row');
    
    purchaseRows.forEach((row, index) => {
        const sharesInput = row.querySelector('.purchase-shares');
        const priceInput = row.querySelector('.purchase-price');
        
        if (!sharesInput || !priceInput) {
            return;
        }
        
        const shares = parseFloat(sharesInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        
        if (shares > 0 && price > 0) {
            purchases.push({
                shares: shares,
                price: price
            });
        }
    });
    
    if (purchases.length === 0 || currentMarketPrice <= 0) {
        // Reset all displays to zero
        updateResults({
            totalShares: 0,
            totalInvestment: 0,
            averagePrice: 0,
            currentValue: 0,
            profitLoss: 0,
            profitLossPercentage: 0
        });
        updateBreakdownTable([]);
        return;
    }
    
    // Make API call
    const requestData = {
        purchases: purchases,
        currentMarketPrice: currentMarketPrice
    };
    
    fetch('/calculate-stock-average', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            updateResults(data);
            updateChart(data);
            updateBreakdownTable(data.breakdownByPurchase);
        } else {
            console.error('Calculation error:', data.error);
        }
    })
    .catch(error => {
        console.error('Network error:', error);
    });
}

function updateResults(data) {
    // Update result cards with proper formatting
    const totalSharesElement = document.getElementById('totalSharesResult');
    const totalInvestmentElement = document.getElementById('totalInvestmentResult');
    const averagePriceElement = document.getElementById('averagePriceResult');
    const currentValueElement = document.getElementById('currentValueResult');
    const profitLossElement = document.getElementById('profitLossResult');
    const profitLossPercentageElement = document.getElementById('profitLossPercentageResult');
    
    if (totalSharesElement) totalSharesElement.textContent = formatNumber(data.totalShares || 0);
    if (totalInvestmentElement) totalInvestmentElement.textContent = formatCurrency(data.totalInvestment || 0);
    if (averagePriceElement) averagePriceElement.textContent = formatCurrency(data.averagePrice || 0);
    if (currentValueElement) currentValueElement.textContent = formatCurrency(data.currentValue || 0);
    if (profitLossElement) profitLossElement.textContent = formatCurrency(data.profitLoss || 0);
    if (profitLossPercentageElement) profitLossPercentageElement.textContent = formatPercentage(data.profitLossPercentage || 0);
    
    // Update chart summary
    const totalInvestmentDisplay = document.getElementById('totalInvestmentDisplay');
    const profitLossDisplay = document.getElementById('profitLossDisplay');
    
    if (totalInvestmentDisplay) totalInvestmentDisplay.textContent = formatCurrency(data.totalInvestment || 0);
    if (profitLossDisplay) profitLossDisplay.textContent = formatCurrency(data.profitLoss || 0);
    
    // Update profit/loss card styling based on positive/negative
    const profitLossCard = document.querySelector('.profit-loss-card');
    if (profitLossCard && data.profitLoss !== undefined) {
        if (data.profitLoss >= 0) {
            profitLossCard.style.background = 'linear-gradient(135deg, #f0fdf4, #dcfce7)';
            // Update color indicators for profit
            const profitLossIndicator = document.querySelector('.color-indicator.profit-loss-amount');
            if (profitLossIndicator) {
                profitLossIndicator.style.background = '#43e97b';
            }
        } else {
            profitLossCard.style.background = 'linear-gradient(135deg, #fff1f2, #fecaca)';
            // Update color indicators for loss
            const profitLossIndicator = document.querySelector('.color-indicator.profit-loss-amount');
            if (profitLossIndicator) {
                profitLossIndicator.style.background = '#fa709a';
            }
        }
    }
}

function updateChart(data) {
    const ctx = document.getElementById('stockBreakdownChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (stockBreakdownChart) {
        stockBreakdownChart.destroy();
    }
    
    // Prepare chart data
    const labels = [];
    const chartData = [];
    const colors = [];
    
    if (data.totalInvestment > 0) {
        labels.push('Total Investment');
        chartData.push(data.totalInvestment);
        colors.push('#4facfe');
    }
    
    if (data.profitLoss !== 0) {
        labels.push(data.profitLoss >= 0 ? 'Profit' : 'Loss');
        chartData.push(Math.abs(data.profitLoss));
        colors.push(data.profitLoss >= 0 ? '#43e97b' : '#fa709a');
    }
    
    // If no data, show a placeholder
    if (chartData.length === 0) {
        labels.push('No Data');
        chartData.push(1);
        colors.push('#e2e8f0');
    }
    
    stockBreakdownChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: chartData,
                backgroundColor: colors,
                borderWidth: 0,
                hoverOffset: 15
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
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#fff',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = formatCurrency(context.parsed);
                            const total = data.totalInvestment + Math.abs(data.profitLoss);
                            const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : '0.0';
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true,
                duration: 1000,
                easing: 'easeOutCubic'
            }
        }
    });
}

function updateBreakdownTable(breakdownData) {
    const tableBody = document.getElementById('breakdownTableBody');
    if (!tableBody) {
        return;
    }
    
    tableBody.innerHTML = '';
    
    if (!breakdownData || breakdownData.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="7" style="text-align: center; color: #64748b; padding: 20px;">No valid purchases found</td>';
        tableBody.appendChild(emptyRow);
        return;
    }
    
    breakdownData.forEach((purchase, index) => {
        const row = document.createElement('tr');
        
        // Determine profit/loss styling
        const profitLossColor = purchase.profit_loss >= 0 ? '#22c55e' : '#ef4444';
        
        row.innerHTML = `
            <td style="font-weight: 600;">Purchase ${purchase.purchase_number || (index + 1)}</td>
            <td style="text-align: right;">${formatNumber(purchase.shares)}</td>
            <td style="text-align: right;">${formatCurrency(purchase.price_per_share)}</td>
            <td style="text-align: right;">${formatCurrency(purchase.investment)}</td>
            <td style="text-align: right;">${formatCurrency(purchase.current_value)}</td>
            <td style="color: ${profitLossColor}; font-weight: 600; text-align: right;">${formatCurrency(purchase.profit_loss)}</td>
            <td style="color: ${profitLossColor}; font-weight: 600; text-align: right;">${formatPercentage(purchase.profit_loss_percentage)}</td>
        `;
        
        tableBody.appendChild(row);
    });
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
        document.addEventListener('click', function(e) {
            if (!megaMenu.contains(e.target)) {
                megaMenu.classList.remove('open');
            }
        });
        
        // Prevent menu from closing when clicking inside
        const megaMenuContent = document.querySelector('.mega-menu-content');
        if (megaMenuContent) {
            megaMenuContent.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }
    }
}

function setupDownloadButtons() {
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    const downloadExcelBtn = document.getElementById('downloadExcelBtn');
    const shareBtn = document.getElementById('shareBtn');
    
    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener('click', downloadPDF);
    }
    
    if (downloadExcelBtn) {
        downloadExcelBtn.addEventListener('click', downloadExcel);
    }
    
    if (shareBtn) {
        shareBtn.addEventListener('click', shareLink);
    }
}

function downloadPDF() {
    try {
        const printableContent = generatePrintableContent();
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Stock Average Calculator Results</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .results-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; }
                    .result-item { padding: 15px; border: 1px solid #ddd; border-radius: 8px; text-align: center; }
                    .result-label { font-weight: bold; color: #666; margin-bottom: 8px; }
                    .result-value { font-size: 18px; font-weight: bold; color: #333; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { padding: 10px; border: 1px solid #ddd; text-align: right; }
                    th { background-color: #f5f5f5; font-weight: bold; }
                    th:first-child, td:first-child { text-align: left; }
                    .profit { color: #22c55e; }
                    .loss { color: #ef4444; }
                </style>
            </head>
            <body>
                ${printableContent}
            </body>
            </html>
        `);
        
        printWindow.document.close();
        
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
        
        showNotification('PDF download initiated', 'success');
    } catch (error) {
        console.error('PDF generation error:', error);
        showNotification('Error generating PDF', 'error');
    }
}

function downloadExcel() {
    try {
        const currentMarketPrice = parseFloat(document.getElementById('currentMarketPrice').value) || 0;
        const purchases = [];
        
        // Collect purchase data
        document.querySelectorAll('.purchase-row').forEach(row => {
            const shares = parseFloat(row.querySelector('.purchase-shares').value) || 0;
            const price = parseFloat(row.querySelector('.purchase-price').value) || 0;
            
            if (shares > 0 && price > 0) {
                purchases.push({ shares, price });
            }
        });
        
        // Create CSV content
        let csvContent = "Stock Average Calculator Results\n\n";
        csvContent += "Purchase Details:\n";
        csvContent += "Purchase,Shares,Price per Share,Investment,Current Value,Profit/Loss,Returns %\n";
        
        let totalShares = 0;
        let totalInvestment = 0;
        
        purchases.forEach((purchase, index) => {
            const investment = purchase.shares * purchase.price;
            const currentValue = purchase.shares * currentMarketPrice;
            const profitLoss = currentValue - investment;
            const profitLossPercentage = (profitLoss / investment) * 100;
            
            totalShares += purchase.shares;
            totalInvestment += investment;
            
            csvContent += `Purchase ${index + 1},${purchase.shares},${purchase.price},${investment.toFixed(2)},${currentValue.toFixed(2)},${profitLoss.toFixed(2)},${profitLossPercentage.toFixed(2)}%\n`;
        });
        
        const averagePrice = totalInvestment / totalShares;
        const currentValue = totalShares * currentMarketPrice;
        const totalProfitLoss = currentValue - totalInvestment;
        const totalProfitLossPercentage = (totalProfitLoss / totalInvestment) * 100;
        
        csvContent += "\nSummary:\n";
        csvContent += `Total Shares,${totalShares.toFixed(2)}\n`;
        csvContent += `Total Investment,${totalInvestment.toFixed(2)}\n`;
        csvContent += `Average Price,${averagePrice.toFixed(2)}\n`;
        csvContent += `Current Market Price,${currentMarketPrice.toFixed(2)}\n`;
        csvContent += `Current Portfolio Value,${currentValue.toFixed(2)}\n`;
        csvContent += `Total Profit/Loss,${totalProfitLoss.toFixed(2)}\n`;
        csvContent += `Total Returns %,${totalProfitLossPercentage.toFixed(2)}%\n`;
        
        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'stock_average_calculation.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showNotification('Excel file downloaded successfully', 'success');
    } catch (error) {
        console.error('Excel generation error:', error);
        showNotification('Error generating Excel file', 'error');
    }
}

function generatePrintableContent() {
    const currentMarketPrice = parseFloat(document.getElementById('currentMarketPrice').value) || 0;
    const totalShares = document.getElementById('totalSharesResult').textContent;
    const totalInvestment = document.getElementById('totalInvestmentResult').textContent;
    const averagePrice = document.getElementById('averagePriceResult').textContent;
    const currentValue = document.getElementById('currentValueResult').textContent;
    const profitLoss = document.getElementById('profitLossResult').textContent;
    const profitLossPercentage = document.getElementById('profitLossPercentageResult').textContent;
    
    let tableRows = '';
    document.querySelectorAll('#breakdownTableBody tr').forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 1) {
            tableRows += '<tr>';
            cells.forEach(cell => {
                tableRows += `<td>${cell.textContent}</td>`;
            });
            tableRows += '</tr>';
        }
    });
    
    return `
        <div class="header">
            <h1>Stock Average Calculator Results</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="results-grid">
            <div class="result-item">
                <div class="result-label">Total Shares</div>
                <div class="result-value">${totalShares}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Total Investment</div>
                <div class="result-value">${totalInvestment}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Average Price</div>
                <div class="result-value">${averagePrice}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Current Market Price</div>
                <div class="result-value">₹${currentMarketPrice.toFixed(2)}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Current Value</div>
                <div class="result-value">${currentValue}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Profit/Loss</div>
                <div class="result-value">${profitLoss} (${profitLossPercentage})</div>
            </div>
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>Purchase</th>
                    <th>Shares</th>
                    <th>Price/Share</th>
                    <th>Investment</th>
                    <th>Current Value</th>
                    <th>Profit/Loss</th>
                    <th>Returns %</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>
    `;
}

function shareLink() {
    try {
        const currentUrl = window.location.href.split('?')[0];
        const params = new URLSearchParams();
        
        // Add current market price
        const currentMarketPrice = document.getElementById('currentMarketPrice').value;
        params.append('currentMarketPrice', currentMarketPrice);
        
        // Add purchase data
        const purchases = [];
        document.querySelectorAll('.purchase-row').forEach(row => {
            const shares = row.querySelector('.purchase-shares').value;
            const price = row.querySelector('.purchase-price').value;
            
            if (shares && price) {
                purchases.push(`${shares},${price}`);
            }
        });
        
        if (purchases.length > 0) {
            params.append('purchases', purchases.join('|'));
        }
        
        const shareUrl = `${currentUrl}?${params.toString()}`;
        
        // Copy to clipboard
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(shareUrl).then(() => {
                showNotification('Link copied to clipboard!', 'success');
            }).catch(() => {
                fallbackCopyTextToClipboard(shareUrl);
            });
        } else {
            fallbackCopyTextToClipboard(shareUrl);
        }
    } catch (error) {
        console.error('Share link error:', error);
        showNotification('Error generating share link', 'error');
    }
}

function fallbackCopyTextToClipboard(text) {
    try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
            showNotification('Link copied to clipboard!', 'success');
        } else {
            showNotification('Unable to copy link. Please copy manually.', 'error');
        }
    } catch (error) {
        console.error('Fallback copy error:', error);
        showNotification('Error copying to clipboard', 'error');
    }
}

function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        border-radius: 6px;
        font-weight: 500;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function loadFromUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Load current market price
    const currentMarketPrice = urlParams.get('currentMarketPrice');
    if (currentMarketPrice) {
        document.getElementById('currentMarketPrice').value = currentMarketPrice;
        document.getElementById('currentMarketPriceSlider').value = currentMarketPrice;
    }
    
    // Load purchases
    const purchasesParam = urlParams.get('purchases');
    if (purchasesParam) {
        // Clear existing purchases first
        document.getElementById('purchasesContainer').innerHTML = '';
        purchaseCount = 0;
        
        const purchases = purchasesParam.split('|');
        purchases.forEach(purchase => {
            const [shares, price] = purchase.split(',');
            if (shares && price) {
                addPurchaseRow(parseFloat(shares), parseFloat(price));
            }
        });
    }
}

function formatCurrency(amount) {
    if (amount === 0 || isNaN(amount)) return '₹0.00';
    
    // Handle negative values
    const isNegative = amount < 0;
    const absAmount = Math.abs(amount);
    
    let formattedValue;
    if (absAmount >= 10000000) {
        formattedValue = '₹' + (absAmount / 10000000).toFixed(2) + ' Cr';
    } else if (absAmount >= 100000) {
        formattedValue = '₹' + (absAmount / 100000).toFixed(2) + ' L';
    } else if (absAmount >= 1000) {
        formattedValue = '₹' + (absAmount / 1000).toFixed(2) + ' K';
    } else {
        // For amounts less than 1000, show exact value with Indian number formatting
        formattedValue = '₹' + absAmount.toLocaleString('en-IN', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        });
    }
    
    return isNegative ? '-' + formattedValue : formattedValue;
}

function formatNumber(number) {
    if (number === 0 || isNaN(number)) return '0';
    return number.toLocaleString('en-IN', { 
        minimumFractionDigits: 0,
        maximumFractionDigits: 2 
    });
}

function formatPercentage(percentage) {
    return percentage.toFixed(2) + '%';
} 