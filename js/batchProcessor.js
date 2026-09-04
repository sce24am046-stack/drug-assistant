/**
 * ==========================================================================
 * BATCHPROCESSOR.JS - High-Throughput Molecular Screening & Batch Analytics
 * ==========================================================================
 */

const BatchProcessor = (() => {
  let dataset = [];
  let scatterChart = null;
  let currentXAxis = 'mw'; // 'mw' or 'cLogP'

  function init() {
    setupDropZone();
    setupTableSorting();
    initChart();
  }

  function setupDropZone() {
    const dropZone = document.getElementById('batchDropZone');
    const fileInput = document.getElementById('csvFileInput');

    if (!dropZone || !fileInput) return;

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
      }
    });
  }

  function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      processBatchText(text, file.name);
    };
    reader.readAsText(file);
  }

  /**
   * Parse CSV or newline-delimited SMILES
   */
  function processBatchText(text, sourceName = 'Input Batch') {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) {
      App.showToast('File is empty', 'error');
      return;
    }

    const results = [];
    const isCsvHeader = lines[0].toLowerCase().includes('smiles');
    const startIndex = isCsvHeader ? 1 : 0;

    let smilesIdx = 0;
    let nameIdx = -1;
    let idIdx = -1;

    if (isCsvHeader) {
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
      smilesIdx = headers.findIndex(h => h.includes('smiles'));
      nameIdx = headers.findIndex(h => h.includes('name') || h.includes('compound'));
      idIdx = headers.findIndex(h => h.includes('id') || h.includes('cid'));
      if (smilesIdx === -1) smilesIdx = 0;
    }

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      let smiles = '';
      let name = `CMPD-${String(results.length + 1).padStart(3, '0')}`;
      let cid = null;

      if (line.includes(',')) {
        const parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
        smiles = parts[smilesIdx] || '';
        if (nameIdx !== -1 && parts[nameIdx]) name = parts[nameIdx];
        if (idIdx !== -1 && parts[idIdx]) cid = parts[idIdx];
      } else {
        smiles = line;
      }

      if (!smiles) continue;

      try {
        const analysis = ChemEngine.analyze(smiles);
        results.push({
          id: cid || `MOL-${results.length + 1}`,
          name,
          smiles,
          mw: analysis.descriptors.mw,
          cLogP: analysis.descriptors.cLogP,
          hbd: analysis.descriptors.hbd,
          hba: analysis.descriptors.hba,
          rb: analysis.descriptors.rotatableBonds,
          tpsa: analysis.descriptors.tpsa,
          logS: analysis.solubility.logS,
          mgPerMl: analysis.solubility.mgPerMl,
          classification: analysis.solubility.classification,
          color: analysis.solubility.color,
          ro5Passed: analysis.lipinski.complies,
          ro5Violations: analysis.lipinski.violations
        });
      } catch (err) {
        console.warn(`Skipping invalid SMILES at line ${i + 1}: ${smiles}`);
      }
    }

    if (results.length === 0) {
      App.showToast('No valid SMILES found in input', 'error');
      return;
    }

    dataset = results;
    renderTable();
    updateScatterChart();
    updateBatchStats();
    App.showToast(`Successfully analyzed ${results.length} compounds`, 'success');
  }

  function loadSampleData() {
    const results = PRESET_COMPOUNDS.map((c, idx) => {
      const analysis = ChemEngine.analyze(c.smiles);
      return {
        id: `CMPD-${String(idx + 1).padStart(3, '0')}`,
        name: c.shortName,
        smiles: c.smiles,
        mw: analysis.descriptors.mw,
        cLogP: analysis.descriptors.cLogP,
        hbd: analysis.descriptors.hbd,
        hba: analysis.descriptors.hba,
        rb: analysis.descriptors.rotatableBonds,
        tpsa: analysis.descriptors.tpsa,
        logS: analysis.solubility.logS,
        mgPerMl: analysis.solubility.mgPerMl,
        classification: analysis.solubility.classification,
        color: analysis.solubility.color,
        ro5Passed: analysis.lipinski.complies,
        ro5Violations: analysis.lipinski.violations
      };
    });

    dataset = results;
    renderTable();
    updateScatterChart();
    updateBatchStats();
    App.showToast(`Loaded ${results.length} clinical drug reference compounds`, 'info');
  }

  function renderTable(filterQuery = '') {
    const tbody = document.getElementById('batchTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    const filtered = dataset.filter(item => {
      if (!filterQuery) return true;
      const q = filterQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.smiles.toLowerCase().includes(q) || item.classification.toLowerCase().includes(q);
    });

    filtered.forEach(item => {
      const tr = document.createElement('tr');
      tr.style.cursor = 'pointer';
      tr.title = 'Click to open in Single Molecule Playground';
      tr.onclick = () => {
        App.loadCompoundIntoPlayground(item.smiles, item.name);
      };

      const ro5Badge = item.ro5Passed
        ? `<span style="color: var(--accent-emerald)"><i data-lucide="check-circle" style="width:14px;height:14px;vertical-align:middle;"></i> Pass (${item.ro5Violations})</span>`
        : `<span style="color: var(--accent-rose)"><i data-lucide="alert-circle" style="width:14px;height:14px;vertical-align:middle;"></i> Fail (${item.ro5Violations})</span>`;

      tr.innerHTML = `
        <td style="font-weight: 700; color: #fff;">${item.name}</td>
        <td style="font-family: var(--font-mono); font-size: 0.78rem; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.smiles}</td>
        <td style="font-family: var(--font-mono);">${item.mw.toFixed(1)}</td>
        <td style="font-family: var(--font-mono);">${item.cLogP.toFixed(2)}</td>
        <td style="font-family: var(--font-mono); font-weight: 700; color: ${item.color}">${item.logS.toFixed(2)}</td>
        <td>
          <span class="badge-sol" style="background: ${item.color}22; color: ${item.color}; border: 1px solid ${item.color}55;">
            ${item.classification}
          </span>
        </td>
        <td>${ro5Badge}</td>
      `;
      tbody.appendChild(tr);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  function updateBatchStats() {
    if (dataset.length === 0) return;
    const countEl = document.getElementById('batchCount');
    const avgLogSEl = document.getElementById('batchAvgLogS');
    const solublePctEl = document.getElementById('batchSolublePct');

    if (countEl) countEl.innerText = dataset.length;

    const avg = dataset.reduce((sum, d) => sum + d.logS, 0) / dataset.length;
    if (avgLogSEl) avgLogSEl.innerText = avg.toFixed(2);

    const solubleCount = dataset.filter(d => d.logS >= -4.0).length;
    const pct = Math.round((solubleCount / dataset.length) * 100);
    if (solublePctEl) solublePctEl.innerText = `${pct}%`;
  }

  function initChart() {
    const ctx = document.getElementById('scatterChart');
    if (!ctx || typeof Chart === 'undefined') return;

    scatterChart = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Molecules',
          data: [],
          backgroundColor: '#00f2fe',
          pointRadius: 6,
          pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(10, 15, 29, 0.95)',
            borderColor: 'rgba(0, 242, 254, 0.4)',
            borderWidth: 1,
            titleFont: { family: 'Outfit', size: 13, weight: 'bold' },
            bodyFont: { family: 'Inter', size: 12 },
            callbacks: {
              label: (context) => {
                const item = dataset[context.dataIndex];
                if (!item) return '';
                return [
                  `Compound: ${item.name}`,
                  `LogS: ${item.logS.toFixed(2)} mol/L`,
                  `MW: ${item.mw.toFixed(1)} Da | cLogP: ${item.cLogP.toFixed(2)}`,
                  `Class: ${item.classification}`
                ];
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Molecular Weight (Da)',
              color: '#94a3b8',
              font: { weight: '600' }
            },
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#64748b' }
          },
          y: {
            title: {
              display: true,
              text: 'Predicted LogS (mol/L)',
              color: '#94a3b8',
              font: { weight: '600' }
            },
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#64748b' }
          }
        }
      }
    });
  }

  function setChartXAxis(axis) {
    currentXAxis = axis;
    if (!scatterChart) return;
    scatterChart.options.scales.x.title.text = axis === 'mw' ? 'Molecular Weight (Da)' : 'Lipophilicity (cLogP)';
    updateScatterChart();
  }

  function updateScatterChart() {
    if (!scatterChart || dataset.length === 0) return;

    const points = dataset.map(d => ({
      x: currentXAxis === 'mw' ? d.mw : d.cLogP,
      y: d.logS
    }));

    const colors = dataset.map(d => d.color);

    scatterChart.data.datasets[0].data = points;
    scatterChart.data.datasets[0].pointBackgroundColor = colors;
    scatterChart.update();
  }

  function setupTableSorting() {
    const searchInput = document.getElementById('batchSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        renderTable(e.target.value);
      });
    }
  }

  function exportCSV() {
    if (dataset.length === 0) {
      App.showToast('No data to export', 'error');
      return;
    }

    const headers = ['Compound_ID', 'Name', 'SMILES', 'Molecular_Weight', 'cLogP', 'HBD', 'HBA', 'Rotatable_Bonds', 'TPSA', 'Predicted_LogS_mol_L', 'Solubility_mg_mL', 'Classification', 'Lipinski_Ro5_Pass', 'Ro5_Violations'];
    const rows = dataset.map(d => [
      d.id,
      `"${d.name}"`,
      `"${d.smiles}"`,
      d.mw,
      d.cLogP,
      d.hbd,
      d.hba,
      d.rb,
      d.tpsa,
      d.logS,
      d.mgPerMl.toExponential(4),
      `"${d.classification}"`,
      d.ro5Passed ? 'TRUE' : 'FALSE',
      d.ro5Violations
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DrugDiscovery_Solubility_Batch_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    App.showToast('CSV Export generated successfully', 'success');
  }

  return {
    init,
    processBatchText,
    loadSampleData,
    setChartXAxis,
    exportCSV
  };
})();
