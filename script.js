// script.js – handles login check, dynamic agent rows and commission calculations

document.addEventListener('DOMContentLoaded', () => {
  // Redirect to login page if not logged in
  if (!localStorage.getItem('loggedIn')) {
    // In case we landed on calculator page without authentication
    if (window.location.pathname.endsWith('calculator.html')) {
      window.location.href = 'login.html';
      return;
    }
  }

  // If on calculator page, initialise calculator features
  if (window.location.pathname.endsWith('calculator.html')) {
    initCalculator();
  }
});

function initCalculator() {
  // Display logged in user's name
  const welcomeEl = document.getElementById('welcomeUser');
  const username = localStorage.getItem('username') || '';
  if (welcomeEl) {
    welcomeEl.textContent = `Welcome, ${username}`;
  }
  // Logout handler
  const logoutBtn = document.getElementById('logoutBtn');
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('username');
    window.location.href = 'login.html';
  });

  // DOM references
  const listingContainer = document.getElementById('listingAgents');
  const soleContainer = document.getElementById('soleAgents');
  const sellingContainer = document.getElementById('sellingAgents');
  const addListingBtn = document.getElementById('addListingAgent');
  const addSellingBtn = document.getElementById('addSellingAgent');
  const recalcBtn = document.getElementById('recalcBtn');

  // Export and share buttons (may not exist on login page)
  const exportPdfBtn = document.getElementById('exportPdfBtn');
  const whatsappBtn = document.getElementById('whatsappBtn');

  const purchasePriceInput = document.getElementById('purchasePrice');
  const grossCommissionInput = document.getElementById('grossCommission');
  const vatRateInput = document.getElementById('vatRate');
  const vatRateLabel = document.getElementById('vatRateLabel');
  const adminFeeInput = document.getElementById('adminFee');
  const serviceFeeInput = document.getElementById('serviceFee');
  const totalFeesInput = document.getElementById('totalFees');

  // Result display elements
  const purchasePriceDisplay = document.getElementById('purchasePriceDisplay');
  const grossCommissionDisplay = document.getElementById('grossCommissionDisplay');
  const vatOnGrossCommissionDisplay = document.getElementById('vatOnGrossCommissionDisplay');
  const grossCommissionExclDisplay = document.getElementById('grossCommissionExclDisplay');
  const serviceFeeExclDisplay = document.getElementById('serviceFeeExclDisplay');
  const serviceFeeVatDisplay = document.getElementById('serviceFeeVatDisplay');
  const serviceFeeInclDisplay = document.getElementById('serviceFeeInclDisplay');
  const adminFeeDisplay = document.getElementById('adminFeeDisplay');
  const netBeforeSplitDisplay = document.getElementById('netBeforeSplitDisplay');
  // Key totals
  const netBeforeSplitTotal = document.getElementById('netBeforeSplitTotal');
  const totalOfficeShareDisplay = document.getElementById('totalOfficeShareDisplay');
  const commissionPayableOfficeDisplay = document.getElementById('commissionPayableOfficeDisplay');
  const totalVatCollectedDisplay = document.getElementById('totalVatCollectedDisplay');
  const totalVatPayableDisplay = document.getElementById('totalVatPayableDisplay');
  const totalPayeDisplay = document.getElementById('totalPayeDisplay');
  const totalNetToAgentsDisplay = document.getElementById('totalNetToAgentsDisplay');

  const agentSummaryDiv = document.getElementById('agentSummary');

  // Chart instance
  let distributionChart = null;

  // Data structures for agents
  const listingAgents = [];
  const soleAgents = [];
  const sellingAgents = [];

  let agentIdCounter = 1;

  // Utility to format numbers as currency (R ZAR)
  function formatCurrency(value) {
    if (isNaN(value)) return 'R 0.00';
    return (
      'R ' +
      value
        .toLocaleString('en-ZA', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
    );
  }

  function createAgentRow(type, defaults = {}) {
    const id = agentIdCounter++;
    const row = document.createElement('div');
    row.classList.add('agent-row');
    row.dataset.id = id;
    // Name field
    const nameField = document.createElement('div');
    nameField.classList.add('field', 'field-name');
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Name';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'Agent name';
    nameInput.value = defaults.name || '';
    nameField.appendChild(nameLabel);
    nameField.appendChild(nameInput);
    // Pool split % slider
    const poolField = document.createElement('div');
    poolField.classList.add('field');
    const poolLabel = document.createElement('label');
    // span to show value
    const poolValueSpan = document.createElement('span');
    poolValueSpan.classList.add('value-display');
    poolValueSpan.textContent = defaults.pool != null ? defaults.pool : 0;
    poolLabel.innerHTML = 'Pool %: ';
    poolLabel.appendChild(poolValueSpan);
    poolLabel.insertAdjacentHTML('beforeend', '%');
    const poolInput = document.createElement('input');
    poolInput.type = 'range';
    poolInput.min = '0';
    poolInput.max = '100';
    poolInput.step = '0.1';
    poolInput.value = defaults.pool || 0;
    poolField.appendChild(poolLabel);
    poolField.appendChild(poolInput);
    poolInput.addEventListener('input', () => {
      poolValueSpan.textContent = poolInput.value;
      recalc();
    });
    // PAYE % slider
    const payeField = document.createElement('div');
    payeField.classList.add('field');
    const payeLabel = document.createElement('label');
    const payeValueSpan = document.createElement('span');
    payeValueSpan.classList.add('value-display');
    payeValueSpan.textContent = defaults.paye != null ? defaults.paye : 0;
    payeLabel.innerHTML = 'PAYE %: ';
    payeLabel.appendChild(payeValueSpan);
    payeLabel.insertAdjacentHTML('beforeend', '%');
    const payeInput = document.createElement('input');
    payeInput.type = 'range';
    payeInput.min = '0';
    payeInput.max = '100';
    payeInput.step = '0.1';
    payeInput.value = defaults.paye || 0;
    payeField.appendChild(payeLabel);
    payeField.appendChild(payeInput);
    payeInput.addEventListener('input', () => {
      payeValueSpan.textContent = payeInput.value;
      recalc();
    });
    // Office split % slider
    const officeField = document.createElement('div');
    officeField.classList.add('field');
    const officeLabel = document.createElement('label');
    const officeValueSpan = document.createElement('span');
    officeValueSpan.classList.add('value-display');
    officeValueSpan.textContent = defaults.office != null ? defaults.office : 0;
    officeLabel.innerHTML = 'Office Split %: ';
    officeLabel.appendChild(officeValueSpan);
    officeLabel.insertAdjacentHTML('beforeend', '%');
    const officeInput = document.createElement('input');
    officeInput.type = 'range';
    officeInput.min = '0';
    officeInput.max = '100';
    officeInput.step = '0.1';
    officeInput.value = defaults.office || 0;
    officeField.appendChild(officeLabel);
    officeField.appendChild(officeInput);
    officeInput.addEventListener('input', () => {
      officeValueSpan.textContent = officeInput.value;
      recalc();
    });
    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.classList.add('remove-btn');
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => {
      row.remove();
      // Remove from array
      let arr;
      if (type === 'listing') arr = listingAgents;
      else if (type === 'sole') arr = soleAgents;
      else arr = sellingAgents;
      const idx = arr.findIndex((a) => a.id === id);
      if (idx > -1) arr.splice(idx, 1);
      recalc();
    });
    // Append to row
    row.appendChild(nameField);
    row.appendChild(poolField);
    row.appendChild(payeField);
    row.appendChild(officeField);
    // Only allow removal for listing/selling. For sole we may restrict removal if there is only one row.
    if (!(type === 'sole')) {
      row.appendChild(removeBtn);
    }
    // Append row to container
    if (type === 'listing') {
      listingContainer.appendChild(row);
      listingAgents.push({ id, nameInput, poolInput, payeInput, officeInput });
    } else if (type === 'sole') {
      soleContainer.appendChild(row);
      soleAgents.push({ id, nameInput, poolInput, payeInput, officeInput });
    } else {
      sellingContainer.appendChild(row);
      sellingAgents.push({ id, nameInput, poolInput, payeInput, officeInput });
    }
    // Attach change listener for name input only. Sliders call recalc inside their input handlers.
    nameInput.addEventListener('input', () => {
      recalc();
    });
    return row;
  }

  // Add default rows similar to the example
  createAgentRow('listing', { name: 'Lee', pool: 20, paye: 18, office: 75 });
  createAgentRow('sole', { name: 'Desiree', pool: 10, paye: 18, office: 75 });
  createAgentRow('selling', { name: 'Sanet', pool: 70, paye: 18, office: 75 });

  addListingBtn.addEventListener('click', () => {
    createAgentRow('listing', { pool: 0, paye: 0, office: 70 });
    recalc();
  });
  addSellingBtn.addEventListener('click', () => {
    createAgentRow('selling', { pool: 0, paye: 0, office: 70 });
    recalc();
  });

  // Recalculate when general inputs change
  [purchasePriceInput, grossCommissionInput, vatRateInput, adminFeeInput].forEach(
    (el) => {
      el.addEventListener('input', () => {
        if (el === vatRateInput && vatRateLabel) {
          vatRateLabel.textContent = el.value;
        }
        recalc();
      });
    }
  );

  recalcBtn.addEventListener('click', () => {
    recalc();
  });

  // Export the calculator view as a downloadable PDF using html2canvas and jsPDF
  if (exportPdfBtn) {
    exportPdfBtn.addEventListener('click', async () => {
      try {
        // Capture the main calculator body (excluding header and footer) as a canvas
        const mainEl = document.querySelector('.calc-body');
        const canvas = await html2canvas(mainEl, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        // Create a new PDF and fit the captured image to A4 size
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        // Compute image dimensions while preserving aspect ratio
        const imgProps = { width: canvas.width, height: canvas.height };
        const ratio = Math.min(pdfWidth / imgProps.width, pdfHeight / imgProps.height);
        const imgWidth = imgProps.width * ratio;
        const imgHeight = imgProps.height * ratio;
        const x = (pdfWidth - imgWidth) / 2;
        const y = 10; // top margin
        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
        pdf.save('commission_calculator.pdf');
      } catch (err) {
        console.error('PDF export failed:', err);
        alert('Failed to export PDF. Please try again.');
      }
    });
  }

  // Share detailed summary via WhatsApp using encoded URL
  if (whatsappBtn) {
    whatsappBtn.addEventListener('click', () => {
      // helper to get plain text content by id
      const getText = (id) => {
        const el = document.getElementById(id);
        return el ? el.textContent.trim() : '';
      };
      // helper to parse currency string like "R 1,234.56" into number
      const parseCurrency = (str) => {
        if (!str) return 0;
        return parseFloat(str.replace(/[^0-9.-]+/g, '')) || 0;
      };
      const lines = [];
      lines.push('Commission Calculator Summary');
      lines.push('');
      // Overall deal breakdown
      lines.push('--- Overall Deal Breakdown ---');
      lines.push('Purchase Price: ' + getText('purchasePriceDisplay'));
      lines.push('Gross Commission (incl VAT): ' + getText('grossCommissionDisplay'));
      lines.push('VAT on Gross Commission: ' + getText('vatOnGrossCommissionDisplay'));
      lines.push('Gross Commission (excl VAT): ' + getText('grossCommissionExclDisplay'));
      lines.push('Remax SA Service Fee (excl VAT): ' + getText('serviceFeeExclDisplay'));
      lines.push('VAT on Remax SA Service Fee: ' + getText('serviceFeeVatDisplay'));
      lines.push('Total Remax SA Fees (incl VAT): ' + getText('serviceFeeInclDisplay'));
      lines.push('Admin Fee (to Office): ' + getText('adminFeeDisplay'));
      lines.push('Net Commission before Office Split (excl VAT): ' + getText('netBeforeSplitDisplay'));
      lines.push('');
      // Key totals
      lines.push('--- Key Financial Totals ---');
      lines.push('Net Commission before Office Split (All Agents): ' + getText('netBeforeSplitTotal'));
      lines.push('Total Office Share (from Agents): ' + getText('totalOfficeShareDisplay'));
      lines.push('Commission Payable to Office: ' + getText('commissionPayableOfficeDisplay'));
      lines.push('Total VAT Collected (SARS): ' + getText('totalVatCollectedDisplay'));
      lines.push('Total VAT Payable (SARS): ' + getText('totalVatPayableDisplay'));
      lines.push('Total PAYE Payable (SARS): ' + getText('totalPayeDisplay'));
      lines.push('Total Net Commissions to Agents (Take Home): ' + getText('totalNetToAgentsDisplay'));
      lines.push('');
      // Include detailed agent breakdowns. Compute values using current inputs.
      lines.push('--- Agent Commission Summary ---');
      // Determine net before split value for calculations
      const netBeforeSplitVal = parseCurrency(getText('netBeforeSplitDisplay'));
      // Function to build lines for a group of agents
      const buildAgentLines = (agents, header) => {
        if (agents.length > 0) {
          lines.push(header);
          agents.forEach((agent) => {
            const name = agent.nameInput.value || 'Unnamed';
            const pool = parseFloat(agent.poolInput.value) || 0;
            const paye = parseFloat(agent.payeInput.value) || 0;
            const office = parseFloat(agent.officeInput.value) || 0;
            const share = (netBeforeSplitVal * pool) / 100;
            const officeShare = share * (1 - office / 100);
            const agentShareBeforePaye = share * (office / 100);
            const payeAmount = agentShareBeforePaye * (paye / 100);
            const takeHome = agentShareBeforePaye - payeAmount;
            lines.push(
              `${name}: Pool ${pool.toFixed(2)}%, Office Share ${formatCurrency(
                officeShare
              )}, PAYE ${formatCurrency(payeAmount)}, Take Home ${formatCurrency(takeHome)}`
            );
          });
          lines.push('');
        }
      };
      buildAgentLines(listingAgents, 'Listing Agent(s):');
      buildAgentLines(soleAgents, 'Sole Mandate Agent(s):');
      buildAgentLines(sellingAgents, 'Selling Agent(s):');
      const message = encodeURIComponent(lines.join('\n'));
      const url = `https://wa.me/?text=${message}`;
      window.open(url, '_blank');
    });
  }

  // Perform initial calculation
  recalc();

  function recalc() {
    const purchasePrice = parseFloat(purchasePriceInput.value) || 0;
    const grossCommissionIncl = parseFloat(grossCommissionInput.value) || 0;
    const vatRate = (parseFloat(vatRateInput.value) || 0) / 100;
    const adminFee = parseFloat(adminFeeInput.value) || 0;

    // Compute VAT on gross commission and exclude VAT values
    const grossCommissionExcl = grossCommissionIncl / (1 + vatRate);
    const vatOnGrossCommission = grossCommissionIncl - grossCommissionExcl;

    // Service fee (5% of gross commission inclusive). Excludes VAT.
    const serviceFeeExcl = grossCommissionIncl * 0.05;
    const serviceFeeVat = serviceFeeExcl * vatRate;
    const serviceFeeIncl = serviceFeeExcl + serviceFeeVat;

    // Update service fee field and total fees field
    serviceFeeInput.value = serviceFeeExcl.toFixed(2);

    const totalConfiguredFeesExcl = serviceFeeExcl + adminFee;
    totalFeesInput.value = totalConfiguredFeesExcl.toFixed(2);

    // Net commission before office split (excl VAT)
    const netCommissionBeforeSplit = grossCommissionExcl - totalConfiguredFeesExcl;

    // Iterate through agents to compute shares
    let totalOfficeShare = 0;
    let totalPaye = 0;
    let totalNetToAgents = 0;
    // group nets
    let listingNet = 0;
    let soleNet = 0;
    let sellingNet = 0;

    function processAgents(array, type) {
      array.forEach((agent) => {
        const name = agent.nameInput.value || '';
        const pool = parseFloat(agent.poolInput.value) || 0;
        const paye = parseFloat(agent.payeInput.value) || 0;
        const officeSplit = parseFloat(agent.officeInput.value) || 0;
        const share = (netCommissionBeforeSplit * pool) / 100;
        const officeShare = share * (1 - officeSplit / 100);
        const agentShareBeforePaye = share * (officeSplit / 100);
        const payeAmount = agentShareBeforePaye * (paye / 100);
        const agentTakeHome = agentShareBeforePaye - payeAmount;
        totalOfficeShare += officeShare;
        totalPaye += payeAmount;
        totalNetToAgents += agentTakeHome;
        if (type === 'listing') {
          listingNet += agentTakeHome;
        } else if (type === 'sole') {
          soleNet += agentTakeHome;
        } else {
          sellingNet += agentTakeHome;
        }
      });
    }
    processAgents(listingAgents, 'listing');
    processAgents(soleAgents, 'sole');
    processAgents(sellingAgents, 'selling');

    const commissionPayableOffice = totalOfficeShare + serviceFeeExcl + adminFee;
    const totalVatCollected = vatOnGrossCommission + serviceFeeVat + adminFee * vatRate;
    const totalVatPayable = serviceFeeVat + adminFee * vatRate;

    // Update display values
    if (purchasePriceDisplay) purchasePriceDisplay.textContent = formatCurrency(purchasePrice);
    if (grossCommissionDisplay) grossCommissionDisplay.textContent = formatCurrency(grossCommissionIncl);
    if (vatOnGrossCommissionDisplay)
      vatOnGrossCommissionDisplay.textContent = formatCurrency(vatOnGrossCommission);
    if (grossCommissionExclDisplay)
      grossCommissionExclDisplay.textContent = formatCurrency(grossCommissionExcl);
    if (serviceFeeExclDisplay)
      serviceFeeExclDisplay.textContent = formatCurrency(serviceFeeExcl);
    if (serviceFeeVatDisplay)
      serviceFeeVatDisplay.textContent = formatCurrency(serviceFeeVat);
    if (serviceFeeInclDisplay)
      serviceFeeInclDisplay.textContent = formatCurrency(serviceFeeIncl);
    if (adminFeeDisplay) adminFeeDisplay.textContent = formatCurrency(adminFee);
    if (netBeforeSplitDisplay)
      netBeforeSplitDisplay.textContent = formatCurrency(netCommissionBeforeSplit);

    // Key totals
    if (netBeforeSplitTotal)
      netBeforeSplitTotal.textContent = formatCurrency(netCommissionBeforeSplit);
    if (totalOfficeShareDisplay)
      totalOfficeShareDisplay.textContent = formatCurrency(totalOfficeShare);
    if (commissionPayableOfficeDisplay)
      commissionPayableOfficeDisplay.textContent = formatCurrency(commissionPayableOffice);
    if (totalVatCollectedDisplay)
      totalVatCollectedDisplay.textContent = formatCurrency(totalVatCollected);
    if (totalVatPayableDisplay)
      totalVatPayableDisplay.textContent = formatCurrency(totalVatPayable);
    if (totalPayeDisplay)
      totalPayeDisplay.textContent = formatCurrency(totalPaye);
    if (totalNetToAgentsDisplay)
      totalNetToAgentsDisplay.textContent = formatCurrency(totalNetToAgents);

    // Agent summary table
    updateAgentSummary(listingAgents, soleAgents, sellingAgents, netCommissionBeforeSplit);

    // Update pie chart
    updateChart({
      listingNet,
      soleNet,
      sellingNet,
      totalPaye,
      totalVat: totalVatCollected,
      officeShare: totalOfficeShare,
      saShare: serviceFeeExcl + adminFee,
    });
  }

  function updateAgentSummary(listing, sole, selling, netBeforeSplit) {
    // Build HTML table summarising each agent's contribution
    let html = '<table><thead><tr><th>Name</th><th>Pool %</th><th>Office Share</th><th>PAYE</th><th>Take Home</th></tr></thead><tbody>';
    function row(agent, type) {
      const name = agent.nameInput.value || '';
      const pool = parseFloat(agent.poolInput.value) || 0;
      const paye = parseFloat(agent.payeInput.value) || 0;
      const officeSplit = parseFloat(agent.officeInput.value) || 0;
      const share = (netBeforeSplit * pool) / 100;
      const officeShare = share * (1 - officeSplit / 100);
      const agentShareBeforePaye = share * (officeSplit / 100);
      const payeAmount = agentShareBeforePaye * (paye / 100);
      const agentTakeHome = agentShareBeforePaye - payeAmount;
      html += `<tr><td>${name}</td><td>${pool.toFixed(2)}%</td><td>${formatCurrency(
        officeShare
      )}</td><td>${formatCurrency(payeAmount)}</td><td>${formatCurrency(
        agentTakeHome
      )}</td></tr>`;
    }
    listing.forEach((a) => row(a, 'listing'));
    sole.forEach((a) => row(a, 'sole'));
    selling.forEach((a) => row(a, 'selling'));
    html += '</tbody></table>';
    agentSummaryDiv.innerHTML = html;
  }

  function updateChart(data) {
    const ctx = document.getElementById('distributionChart').getContext('2d');
    const labels = [
      'Remax Platinum Share',
      'Remax SA Share',
      'Total PAYE',
      'Total VAT',
      'Listing Agents Net',
      'Sole Mandate Net',
      'Selling Agents Net',
    ];
    let values = [
      data.officeShare,
      data.saShare,
      data.totalPaye,
      data.totalVat,
      data.listingNet,
      data.soleNet,
      data.sellingNet,
    ];
    // Ensure the pie chart is always visible. If all values are zero, assign equal parts.
    const total = values.reduce((acc, val) => acc + val, 0);
    if (total === 0) {
      values = values.map(() => 1);
    }
    const colors = [
      '#feca57',
      '#ff9f43',
      '#ee5253',
      '#48dbfb',
      '#1dd1a1',
      '#5f27cd',
      '#54a0ff',
    ];
    // Destroy any existing chart instance before creating a new one
    if (distributionChart) {
      distributionChart.destroy();
    }

    // Compute the total value for calculating percentages in labels
    const totalVal = values.reduce((acc, val) => acc + val, 0);

    // Custom plugin to draw data labels directly on the pie chart
    const pieDataLabelsPlugin = {
      id: 'pieDataLabelsPlugin',
      afterDraw(chart, args, pluginOptions) {
        const { ctx } = chart;
        const dataset = chart.data.datasets[0];
        const meta = chart.getDatasetMeta(0);
        ctx.save();
        meta.data.forEach((arc, index) => {
          const pos = arc.tooltipPosition();
          const value = dataset.data[index];
          // Calculate percentage only if the total is greater than zero
          const percentage = totalVal > 0 ? ((value / totalVal) * 100).toFixed(1) + '%' : '';
          const label = chart.data.labels[index];
          // Draw label and percentage in two lines for readability
          ctx.fillStyle = '#333'; // use a dark color to contrast against pastel segments
          ctx.font = '10px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, pos.x, pos.y - 6);
          ctx.fillText(percentage, pos.x, pos.y + 6);
        });
        ctx.restore();
      },
    };

    distributionChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [
          {
            data: values,
            backgroundColor: colors,
            borderWidth: 1,
            borderColor: '#ffffff20',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: {
          duration: 300,
        },
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 14,
            },
          },
        },
      },
      plugins: [pieDataLabelsPlugin],
    });
  }
}