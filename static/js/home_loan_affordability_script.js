// Home Loan Affordability � restored, readable implementation
// Creates pie + bar charts and yearly payment table using /calculate-affordability

let affordabilityPieChart = null;
let affordabilityBarChart = null;

document.addEventListener('DOMContentLoaded', () => {
  bindInputs();
  calculateAndRender();
});

function bindInputs() {
  const pairs = [
    ['grossMonthlyIncome', 'grossMonthlyIncomeSlider'],
    ['otherMonthlyEmis', 'otherMonthlyEmisSlider'],
    ['desiredLoanTenure', 'desiredLoanTenureSlider'],
    ['rateOfInterest', 'rateOfInterestSlider'],
    ['myFunds', 'myFundsSlider'],
  ];

  for (const [inputId, sliderId] of pairs) {
    const input = document.getElementById(inputId);
    const slider = document.getElementById(sliderId);
    if (!input || !slider) continue;

    // initialize slider value from input
    slider.value = input.value;

    input.addEventListener('input', () => {
      slider.value = input.value;
      calculateAndRender();
    });
    slider.addEventListener('input', () => {
      input.value = slider.value;
      calculateAndRender();
    });
  }
}

async function calculateAndRender() {
  const payload = {
    grossMonthlyIncome: num('grossMonthlyIncome'),
    otherMonthlyEmis: num('otherMonthlyEmis'),
    desiredLoanTenure: num('desiredLoanTenure'),
    rateOfInterest: num('rateOfInterest'),
    myFunds: num('myFunds'),
  };

  try {
    const res = await fetch('/calculate-affordability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    if (result && !result.error) {
      updateResults(result);
      renderPie(result);
      renderBar(result);
      renderTable(result.payment_schedule || [], result.eligible_loan_amount || 0);
      return;
    }
    // fallback if server returns error
    renderFallback();
  } catch (e) {
    console.error('Affordability fetch error:', e);
    renderFallback();
  }
}

function renderFallback() {
  const zero = {
    eligible_loan_amount: 0,
    monthly_emi: 0,
    property_cost_affordable: 0,
    remaining_balance_salary: 0,
    total_interest: 0,
    down_payment: 0,
    payment_schedule: [],
  };
  updateResults(zero);
  renderPie(zero);
  renderBar({ payment_schedule: [], eligible_loan_amount: 0 });
  renderTable([], 0);
}

function updateResults(r) {
  setText('eligibleAmount', formatCurrency(r.eligible_loan_amount));
  setText('emiAmount', formatCurrency(r.monthly_emi));
  setText('propertyCostAffordable', formatCurrency(r.property_cost_affordable));
  setText('remainingBalanceSalary', formatCurrency(r.remaining_balance_salary));
  setText('chartLoanAmount', formatCurrency(r.eligible_loan_amount));
  setText('chartDownPayment', formatCurrency(r.down_payment));
  setText('chartTotalInterest', formatCurrency(r.total_interest));
  setText('chartTotalCost', formatCurrency(r.property_cost_affordable));
}

function renderPie(r) {
  const ctx = byId('affordabilityPieChart');
  if (!ctx) return;
  const c = ctx.getContext('2d');
  if (affordabilityPieChart) affordabilityPieChart.destroy();
  affordabilityPieChart = new Chart(c, {
    type: 'pie',
    data: {
      labels: ['Loan Amount', 'Down Payment', 'Total Interest'],
      datasets: [{
        data: [r.eligible_loan_amount || 0, r.down_payment || 0, r.total_interest || 0],
        // original palette restored
        backgroundColor: ['#14B8A6', '#F59E0B', '#8B5CF6'],
        borderColor: '#fff',
        borderWidth: 2,
      }],
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
  });
}

function renderBar(r) {
  const ctx = byId('affordabilityBarChart');
  if (!ctx) return;
  const c = ctx.getContext('2d');
  if (affordabilityBarChart) affordabilityBarChart.destroy();

  const rows = r.payment_schedule || [];
  const labels = rows.map(x => String(x.year));
  const principal = rows.map(x => x.principal || 0);
  const interest = rows.map(x => x.interest || 0);
  const balance = rows.map(x => x.balance || 0);

  affordabilityBarChart = new Chart(c, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Principal Payment', data: principal, backgroundColor: '#14B8A6', borderColor: '#14B8A6', borderWidth: 1, categoryPercentage: 0.7, barPercentage: 0.9 },
        { label: 'Interest Payment', data: interest, backgroundColor: '#F59E0B', borderColor: '#F59E0B', borderWidth: 1, categoryPercentage: 0.7, barPercentage: 0.9 },
        { label: 'Remaining Balance', data: balance, type: 'line', backgroundColor: '#8B5CF6', borderColor: '#8B5CF6', borderWidth: 1, pointRadius: 0, yAxisID: 'y1' },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}` } } },
      scales: {
        x: { title: { display: true, text: 'Year' } },
        y: { type: 'linear', position: 'left', ticks: { callback: v => formatCurrencyShort(v) } },
        y1: { type: 'linear', position: 'right', grid: { drawOnChartArea: false }, ticks: { callback: v => formatCurrencyShort(v) } },
      },
    },
  });
}

function renderTable(schedule, loanAmount) {
  const body = byId('paymentScheduleTableBody');
  if (!body) return;
  body.innerHTML = '';
  let cumulativePrincipal = 0;
  schedule.forEach(row => {
    cumulativePrincipal += row.principal || 0;
    const tr = document.createElement('tr');
    tr.className = 'year-row';
    tr.innerHTML = `
      <td><span class="year-text">${row.year || ''}</span></td>
      <td>${formatCurrency(row.principal || 0)}</td>
      <td>${formatCurrency(row.interest || 0)}</td>
      <td>${formatCurrency(((row.principal || 0) + (row.interest || 0)) / 12)}</td>
      <td>${formatCurrency((row.principal || 0) + (row.interest || 0))}</td>
      <td>${formatCurrency(row.balance || 0)}</td>
      <td>${loanAmount > 0 ? Math.min(100, ((cumulativePrincipal / loanAmount) * 100)).toFixed(1) : '0'}%</td>
    `;
    body.appendChild(tr);
  });
}

// Utilities
function num(id) { const el = document.getElementById(id); return el ? parseFloat(el.value) || 0 : 0; }
function byId(id) { return document.getElementById(id); }
function setText(id, text) { const el = byId(id); if (el) el.textContent = text; }

function formatCurrency(amount) {
  try { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0); } catch { return `?${Math.round(amount || 0)}`; }
}
function formatCurrencyShort(amount) {
  const a = amount || 0;
  if (a >= 10000000) return '?' + (a / 10000000).toFixed(1) + 'Cr';
  if (a >= 100000) return '?' + (a / 100000).toFixed(1) + 'L';
  if (a >= 1000) return '?' + (a / 1000).toFixed(1) + 'K';
  return '?' + Math.round(a);
}
