/**
 * ==========================================================================
 * APP.JS - Main Application Orchestrator & UI Controller
 * ==========================================================================
 */

const App = (() => {
  let currentMolecule = null;
  let radarChart = null;

  function init() {
    initHeroCanvas();
    setupTabs();
    setupSmilesInput();
    setupPresets();
    setupViewerControls();
    setupRadarChart();
    setupCodeModal();

    // Initialize chemistry & batch modules
    Viewer2D.init();
    Viewer3D.init();
    BatchProcessor.init();

    // Load initial default drug (Aspirin)
    loadPreset('aspirin');

    // Initialize Lucide icons if loaded
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  /* -------------------------------------------------------------------------- */
  /* Hero Canvas Animated Chemistry Network                                    */
  /* -------------------------------------------------------------------------- */
  function initHeroCanvas() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = canvas.width = canvas.parentElement.clientWidth;
    let height = canvas.height = canvas.parentElement.clientHeight;

    window.addEventListener('resize', () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    });

    const particles = [];
    const numParticles = Math.floor((width * height) / 14000);

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 2.2 + 1.2,
        color: Math.random() > 0.4 ? '#00f2fe' : '#38bdf8'
      });
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Draw node
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw connections (chemical bonds)
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(0, 242, 254, ${(1 - dist / 110) * 0.18})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(animate);
    }

    animate();
  }

  /* -------------------------------------------------------------------------- */
  /* Tab Switching                                                              */
  /* -------------------------------------------------------------------------- */
  function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-tab');
        if (!targetId) return;

        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.tab-panel').forEach(panel => {
          panel.classList.remove('active');
        });

        const activePanel = document.getElementById(targetId);
        if (activePanel) {
          activePanel.classList.add('active');
        }

        // Re-render viewers on tab visibility change
        if (targetId === 'tab-playground' && currentMolecule) {
          setTimeout(() => {
            Viewer2D.render(currentMolecule.smiles, currentMolecule.name);
            Viewer3D.resetCamera();
          }, 50);
        }
      });
    });
  }

  /* -------------------------------------------------------------------------- */
  /* SMILES Input Handling                                                      */
  /* -------------------------------------------------------------------------- */
  function setupSmilesInput() {
    const input = document.getElementById('smilesInput');
    const predictBtn = document.getElementById('predictBtn');
    const clearBtn = document.getElementById('clearSmilesBtn');

    if (predictBtn) {
      predictBtn.addEventListener('click', () => {
        if (!input) return;
        const val = input.value.trim();
        if (val) {
          analyzeSmiles(val, 'Custom Molecule');
        } else {
          showToast('Please enter a valid SMILES string', 'error');
        }
      });
    }

    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const val = input.value.trim();
          if (val) analyzeSmiles(val, 'Custom Molecule');
        }
      });
    }

    if (clearBtn && input) {
      clearBtn.addEventListener('click', () => {
        input.value = '';
        input.focus();
      });
    }
  }

  /* -------------------------------------------------------------------------- */
  /* Presets Bar                                                                */
  /* -------------------------------------------------------------------------- */
  function setupPresets() {
    const container = document.getElementById('presetPills');
    if (!container) return;

    container.innerHTML = '';
    PRESET_COMPOUNDS.forEach(compound => {
      const chip = document.createElement('button');
      chip.className = 'preset-chip';
      chip.id = `preset-${compound.id}`;
      chip.innerText = compound.shortName;
      chip.onclick = () => loadPreset(compound.id);
      container.appendChild(chip);
    });
  }

  function loadPreset(compoundId) {
    const compound = PRESET_COMPOUNDS.find(c => c.id === compoundId);
    if (!compound) return;

    // Highlight active preset chip
    document.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
    const activeChip = document.getElementById(`preset-${compound.id}`);
    if (activeChip) activeChip.classList.add('active');

    const input = document.getElementById('smilesInput');
    if (input) input.value = compound.smiles;

    analyzeSmiles(compound.smiles, compound.name, compound);
  }

  function loadCompoundIntoPlayground(smiles, name) {
    // Switch tab to playground
    const playgroundTabBtn = document.querySelector('[data-tab="tab-playground"]');
    if (playgroundTabBtn) playgroundTabBtn.click();

    const input = document.getElementById('smilesInput');
    if (input) input.value = smiles;

    analyzeSmiles(smiles, name);
  }

  /* -------------------------------------------------------------------------- */
  /* Chemistry Analysis Pipeline Execution                                     */
  /* -------------------------------------------------------------------------- */
  function analyzeSmiles(smiles, name = 'Molecule', presetMeta = null) {
    try {
      const analysis = ChemEngine.analyze(smiles);
      currentMolecule = {
        name,
        smiles,
        analysis,
        meta: presetMeta
      };

      // Update UI displays
      updateResultsUI(currentMolecule);
      updateLipinskiUI(analysis.descriptors, analysis.lipinski);
      updateRadarChart(analysis.descriptors);

      // Render 2D & 3D visualizations
      Viewer2D.render(smiles, name);
      Viewer3D.render(presetMeta ? presetMeta.id : null, smiles, presetMeta ? presetMeta.cid : null);

      showToast(`Analyzed ${name}: LogS = ${analysis.solubility.logS} mol/L`, 'success');
    } catch (err) {
      console.error('Analysis error:', err);
      showToast(`Invalid SMILES: ${err.message}`, 'error');
    }
  }

  /* -------------------------------------------------------------------------- */
  /* Update Prediction Output & Descriptors UI                                  */
  /* -------------------------------------------------------------------------- */
  function updateResultsUI(mol) {
    const { analysis, name, smiles } = mol;
    const { descriptors, solubility } = analysis;

    // Compound Header Bar
    const titleEl = document.getElementById('currentCompoundName');
    const formulaEl = document.getElementById('currentFormula');
    if (titleEl) titleEl.innerText = name;
    if (formulaEl) formulaEl.innerText = descriptors.formula || 'C-H-O';

    // Main LogS Number & Colors
    const logSEl = document.getElementById('logSValue');
    const badgeEl = document.getElementById('solubilityBadge');
    const descEl = document.getElementById('solubilityNarrative');

    if (logSEl) {
      logSEl.innerText = solubility.logS.toFixed(2);
      logSEl.style.color = solubility.color;
    }

    if (badgeEl) {
      badgeEl.innerText = solubility.classification;
      badgeEl.style.color = solubility.color;
      badgeEl.style.borderColor = solubility.color;
      badgeEl.style.backgroundColor = `${solubility.color}20`;
    }

    if (descEl) {
      descEl.innerText = solubility.description;
    }

    // Needle Gauge
    const needle = document.getElementById('solubilityNeedle');
    if (needle) {
      needle.style.left = `${solubility.gaugePercent}%`;
    }

    // Unit Conversions
    const molarEl = document.getElementById('molarSolubility');
    const massEl = document.getElementById('massSolubility');
    if (molarEl) molarEl.innerText = `${solubility.molarSolubility.toExponential(2)} mol/L`;
    if (massEl) massEl.innerText = `${solubility.mgPerMl.toFixed(3)} mg/mL`;

    // ESOL Breakdown Cards
    const apContribEl = document.getElementById('breakdownAP');
    const mwContribEl = document.getElementById('breakdownMW');
    const clogpContribEl = document.getElementById('breakdownLogP');
    const rbContribEl = document.getElementById('breakdownRB');

    if (apContribEl) {
      apContribEl.innerText = `${solubility.breakdown.ap_contrib >= 0 ? '+' : ''}${solubility.breakdown.ap_contrib.toFixed(2)}`;
    }
    if (mwContribEl) {
      mwContribEl.innerText = `${solubility.breakdown.mw_contrib >= 0 ? '+' : ''}${solubility.breakdown.mw_contrib.toFixed(2)}`;
    }
    if (clogpContribEl) {
      clogpContribEl.innerText = `${solubility.breakdown.cLogP_contrib >= 0 ? '+' : ''}${solubility.breakdown.cLogP_contrib.toFixed(2)}`;
    }
    if (rbContribEl) {
      rbContribEl.innerText = `${solubility.breakdown.rb_contrib >= 0 ? '+' : ''}${solubility.breakdown.rb_contrib.toFixed(2)}`;
    }

    // Descriptors Grid
    setFieldText('descMW', `${descriptors.mw} Da`);
    setFieldText('descLogP', descriptors.cLogP.toFixed(2));
    setFieldText('descHBD', descriptors.hbd);
    setFieldText('descHBA', descriptors.hba);
    setFieldText('descRB', descriptors.rotatableBonds);
    setFieldText('descTPSA', `${descriptors.tpsa} Å²`);
    setFieldText('descAromatic', `${descriptors.aromaticCount} (${(descriptors.aromaticProportion * 100).toFixed(0)}%)`);
    setFieldText('descHeavyAtoms', descriptors.heavyAtoms);

    // Dynamic banner glow
    const banner = document.querySelector('.solubility-main-banner');
    if (banner) {
      banner.style.setProperty('--sol-color-glow', solubility.glowColor);
    }
  }

  function setFieldText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
  }

  /* -------------------------------------------------------------------------- */
  /* Lipinski Rule of 5 UI                                                      */
  /* -------------------------------------------------------------------------- */
  function updateLipinskiUI(descriptors, lipinski) {
    const statusPill = document.getElementById('ro5StatusPill');
    const rulesList = document.getElementById('ro5RulesList');

    if (statusPill) {
      statusPill.innerText = lipinski.verdict;
      if (lipinski.complies) {
        statusPill.style.background = 'rgba(16, 185, 129, 0.15)';
        statusPill.style.color = 'var(--accent-emerald)';
        statusPill.style.border = '1px solid rgba(16, 185, 129, 0.4)';
      } else {
        statusPill.style.background = 'rgba(244, 63, 94, 0.15)';
        statusPill.style.color = 'var(--accent-rose)';
        statusPill.style.border = '1px solid rgba(244, 63, 94, 0.4)';
      }
    }

    if (rulesList) {
      rulesList.innerHTML = '';
      [...lipinski.rules, ...lipinski.veberRules].forEach(rule => {
        const item = document.createElement('div');
        item.className = `rule-item ${rule.passed ? 'pass' : 'fail'}`;
        item.innerHTML = `
          <div>
            <span style="font-weight: 600; color: #fff;">${rule.name}</span>
            <span style="font-size: 0.75rem; color: var(--text-muted); margin-left: 6px;">(Criterion: ${rule.criterion})</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-family: var(--font-mono); font-weight: 700; color: #fff;">${rule.value}</span>
            <span style="color: ${rule.passed ? 'var(--accent-emerald)' : 'var(--accent-rose)'}; font-weight: 700;">
              ${rule.passed ? 'PASS' : 'ALERT'}
            </span>
          </div>
        `;
        rulesList.appendChild(item);
      });
    }
  }

  /* -------------------------------------------------------------------------- */
  /* ADMET Radar Chart                                                          */
  /* -------------------------------------------------------------------------- */
  function setupRadarChart() {
    const ctx = document.getElementById('radarChart');
    if (!ctx || typeof Chart === 'undefined') return;

    radarChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['MW / 5', 'cLogP * 20', 'HBD * 20', 'HBA * 10', 'RB * 10', 'TPSA * 0.7'],
        datasets: [
          {
            label: 'Lipinski Ro5 Optimal Space',
            data: [100, 100, 100, 100, 100, 100],
            borderColor: 'rgba(16, 185, 129, 0.4)',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            borderDash: [4, 4],
            pointRadius: 0
          },
          {
            label: 'Current Molecule',
            data: [0, 0, 0, 0, 0, 0],
            borderColor: '#00f2fe',
            backgroundColor: 'rgba(0, 242, 254, 0.25)',
            borderWidth: 2,
            pointBackgroundColor: '#00f2fe',
            pointRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            angleLines: { color: 'rgba(255, 255, 255, 0.08)' },
            grid: { color: 'rgba(255, 255, 255, 0.08)' },
            pointLabels: {
              color: '#94a3b8',
              font: { family: 'Outfit', size: 11, weight: '600' }
            },
            ticks: { display: false },
            suggestedMin: 0,
            suggestedMax: 140
          }
        },
        plugins: {
          legend: {
            labels: { color: '#cbd5e1', font: { family: 'Inter', size: 11 } }
          }
        }
      }
    });
  }

  function updateRadarChart(d) {
    if (!radarChart) return;
    // Normalize properties so Lipinski thresholds align near ~100
    // MW: 500 -> 100
    // cLogP: 5.0 -> 100
    // HBD: 5 -> 100
    // HBA: 10 -> 100
    // RB: 10 -> 100
    // TPSA: 140 -> 100
    const normalized = [
      Math.min(160, Math.max(10, (d.mw / 500) * 100)),
      Math.min(160, Math.max(10, (Math.max(0, d.cLogP) / 5) * 100)),
      Math.min(160, Math.max(10, (d.hbd / 5) * 100)),
      Math.min(160, Math.max(10, (d.hba / 10) * 100)),
      Math.min(160, Math.max(10, (d.rotatableBonds / 10) * 100)),
      Math.min(160, Math.max(10, (d.tpsa / 140) * 100))
    ];

    radarChart.data.datasets[1].data = normalized;
    radarChart.update();
  }

  /* -------------------------------------------------------------------------- */
  /* 2D / 3D Viewer Switching & Controls                                        */
  /* -------------------------------------------------------------------------- */
  function setupViewerControls() {
    // 2D vs 3D tab toggle
    const btn2D = document.getElementById('viewMode2D');
    const btn3D = document.getElementById('viewMode3D');
    const canvas2D = document.getElementById('canvas2d');
    const viewer3D = document.getElementById('viewer3d');
    const controls3D = document.getElementById('controls3d');

    if (btn2D && btn3D && canvas2D && viewer3D) {
      btn2D.addEventListener('click', () => {
        btn2D.classList.add('active');
        btn3D.classList.remove('active');
        canvas2D.style.display = 'block';
        viewer3D.style.display = 'none';
        if (controls3D) controls3D.style.display = 'none';
        if (currentMolecule) Viewer2D.render(currentMolecule.smiles, currentMolecule.name);
      });

      btn3D.addEventListener('click', () => {
        btn3D.classList.add('active');
        btn2D.classList.remove('active');
        canvas2D.style.display = 'none';
        viewer3D.style.display = 'block';
        if (controls3D) controls3D.style.display = 'flex';
        Viewer3D.resetCamera();
      });
    }

    // 3D Style Switcher
    const styleSelect = document.getElementById('styleSelect3d');
    if (styleSelect) {
      styleSelect.addEventListener('change', (e) => {
        Viewer3D.setStyle(e.target.value);
      });
    }

    // 3D Spin Toggle
    const spinBtn = document.getElementById('spinToggleBtn');
    if (spinBtn) {
      spinBtn.addEventListener('click', () => {
        const spinning = Viewer3D.toggleSpin();
        spinBtn.classList.toggle('active', spinning);
      });
    }

    // 3D Surface Toggle
    const surfaceBtn = document.getElementById('surfaceToggleBtn');
    if (surfaceBtn) {
      surfaceBtn.addEventListener('click', () => {
        const hasSurface = Viewer3D.toggleSurface();
        surfaceBtn.classList.toggle('active', hasSurface);
      });
    }

    // 3D Reset View
    const resetBtn = document.getElementById('resetViewBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        Viewer3D.resetCamera();
      });
    }

    // Download 2D Depiction
    const download2DBtn = document.getElementById('download2dBtn');
    if (download2DBtn) {
      download2DBtn.addEventListener('click', () => {
        Viewer2D.downloadImage();
      });
    }
  }

  /* -------------------------------------------------------------------------- */
  /* Code Export Modal (Python / RDKit / cURL)                                  */
  /* -------------------------------------------------------------------------- */
  function setupCodeModal() {
    const openBtn = document.getElementById('openCodeExportBtn');
    const closeBtn = document.getElementById('closeModalBtn');
    const modal = document.getElementById('codeModal');
    const copyBtns = document.querySelectorAll('.btn-copy-code');

    if (openBtn && modal) {
      openBtn.addEventListener('click', () => {
        updateCodeSnippets();
        modal.classList.add('open');
      });
    }

    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => {
        modal.classList.remove('open');
      });
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
      });
    }

    copyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const codeEl = document.getElementById(targetId);
        if (codeEl) {
          navigator.clipboard.writeText(codeEl.innerText).then(() => {
            showToast('Code copied to clipboard!', 'info');
          });
        }
      });
    });
  }

  function updateCodeSnippets() {
    const smiles = currentMolecule ? currentMolecule.smiles : 'CC(=O)Oc1ccccc1C(=O)O';
    const pyCodeEl = document.getElementById('codePythonRdkit');
    const jsCodeEl = document.getElementById('codeJsEngine');

    if (pyCodeEl) {
      pyCodeEl.innerText = `import numpy as np
from rdkit import Chem
from rdkit.Chem import Descriptors, Crippen, Lipinski

def calculate_delaney_esol(smiles_str: str) -> dict:
    mol = Chem.MolFromSmiles(smiles_str)
    if not mol:
        raise ValueError("Invalid SMILES string")
        
    mw = Descriptors.MolWt(mol)
    clogp = Crippen.MolLogP(mol)
    rot_bonds = Lipinski.NumRotatableBonds(mol)
    
    # Aromatic Proportion
    aromatic_atoms = sum(1 for atom in mol.GetAtoms() if atom.GetIsAromatic())
    heavy_atoms = mol.GetNumHeavyAtoms()
    aromatic_prop = aromatic_atoms / heavy_atoms if heavy_atoms > 0 else 0
    
    # Delaney ESOL Linear Regression Equation
    logs = 0.16 - (0.63 * clogp) - (0.0062 * mw) + (0.066 * rot_bonds) - (0.74 * aromatic_prop)
    
    return {
        "smiles": smiles_str,
        "mw": round(mw, 2),
        "clogp": round(clogp, 2),
        "logs_mol_l": round(logs, 2),
        "solubility_mg_ml": (10 ** logs) * mw
    }

# Run prediction for target compound
result = calculate_delaney_esol("${smiles}")
print(f"Predicted LogS: {result['logs_mol_l']} mol/L ({result['solubility_mg_ml']:.4f} mg/mL)")`;
    }

    if (jsCodeEl) {
      jsCodeEl.innerText = `// Instant Browser / Node.js Evaluation
const ChemEngine = require('./js/chemEngine.js');

const analysis = ChemEngine.analyze("${smiles}");
console.log("Compound Solubility:", analysis.solubility.classification);
console.log("LogS (mol/L):", analysis.solubility.logS);
console.log("Lipinski Ro5 Compliant:", analysis.lipinski.complies);`;
    }
  }

  /* -------------------------------------------------------------------------- */
  /* Toast Notification Helper                                                  */
  /* -------------------------------------------------------------------------- */
  function showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';

    let icon = 'info';
    let borderColor = 'var(--accent-cyan)';
    if (type === 'success') {
      icon = 'check-circle';
      borderColor = 'var(--accent-emerald)';
    } else if (type === 'error') {
      icon = 'alert-triangle';
      borderColor = 'var(--accent-rose)';
    }

    toast.style.borderColor = borderColor;
    toast.innerHTML = `<i data-lucide="${icon}" style="width:18px;height:18px;color:${borderColor};"></i> <span>${message}</span>`;
    container.appendChild(toast);

    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(30px)';
      toast.style.transition = 'all 250ms ease';
      setTimeout(() => toast.remove(), 250);
    }, 3500);
  }

  return {
    init,
    loadPreset,
    loadCompoundIntoPlayground,
    showToast
  };
})();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
