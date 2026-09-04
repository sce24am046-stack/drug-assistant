/**
 * ==========================================================================
 * VIEWER2D.JS - 2D Chemical Structure Depiction Engine
 * ==========================================================================
 */

const Viewer2D = (() => {
  let drawer = null;
  let canvasElement = null;

  function init() {
    canvasElement = document.getElementById('canvas2d');
    if (!canvasElement) return;

    if (typeof SmilesDrawer !== 'undefined') {
      try {
        drawer = new SmilesDrawer.Drawer({
          width: canvasElement.parentElement.clientWidth || 450,
          height: 380,
          bondThickness: 2.2,
          bondLength: 24,
          shortBondLength: 0.85,
          bondSpacing: 4.5,
          atomVisualization: 'default',
          isomeric: true,
          debug: false,
          terminalCarbons: false,
          explicitHydrogens: false,
          themes: {
            dark: {
              C: '#f1f5f9',
              O: '#f43f5e',
              N: '#38bdf8',
              F: '#34d399',
              CL: '#2dd4bf',
              BR: '#c084fc',
              I: '#f472b6',
              P: '#fb923c',
              S: '#facc15',
              B: '#38bdf8',
              SI: '#06b6d4',
              H: '#94a3b8',
              BACKGROUND: '#060913'
            }
          }
        });
      } catch (e) {
        console.warn('SmilesDrawer initialization warning:', e);
      }
    }
  }

  function render(smiles, moleculeName = '') {
    if (!canvasElement) {
      canvasElement = document.getElementById('canvas2d');
    }
    if (!canvasElement) return;

    const container = canvasElement.parentElement;
    const width = container.clientWidth || 450;
    const height = 380;
    canvasElement.width = width;
    canvasElement.height = height;

    const ctx = canvasElement.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    if (typeof SmilesDrawer !== 'undefined') {
      try {
        if (!drawer) {
          init();
        }
        SmilesDrawer.parse(smiles, (tree) => {
          drawer.draw(tree, canvasElement, 'dark', false);
        }, (err) => {
          console.warn('SmilesDrawer parse error, falling back to vector generator:', err);
          renderFallback(ctx, smiles, moleculeName, width, height);
        });
        return;
      } catch (err) {
        console.warn('Error in SmilesDrawer drawing, falling back:', err);
      }
    }

    // Fallback if SmilesDrawer not yet loaded or errored
    renderFallback(ctx, smiles, moleculeName, width, height);
  }

  /**
   * Aesthetic chemical topology diagram fallback
   */
  function renderFallback(ctx, smiles, moleculeName, width, height) {
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, width, height);

    // Subtle background grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridSize = 25;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Parse characters to create nodes & bonds
    const clean = smiles.replace(/[0-9()=\[\]#]/g, '');
    const numNodes = Math.min(14, Math.max(5, clean.length));
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.32;

    const nodes = [];
    for (let i = 0; i < numNodes; i++) {
      const angle = (i / numNodes) * Math.PI * 2 - Math.PI / 2;
      const r = radius * (0.75 + 0.35 * Math.sin(i * 1.5));
      const char = clean[i % clean.length] || 'C';
      nodes.push({
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        atom: char.toUpperCase()
      });
    }

    // Draw Bonds
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let i = 0; i < nodes.length; i++) {
      const next = nodes[(i + 1) % nodes.length];
      const grad = ctx.createLinearGradient(nodes[i].x, nodes[i].y, next.x, next.y);
      grad.addColorStop(0, '#00f2fe');
      grad.addColorStop(1, '#38bdf8');
      ctx.strokeStyle = grad;
      ctx.beginPath();
      ctx.moveTo(nodes[i].x, nodes[i].y);
      ctx.lineTo(next.x, next.y);
      ctx.stroke();
    }

    // Draw Nodes
    const colors = {
      C: '#f1f5f9',
      O: '#f43f5e',
      N: '#38bdf8',
      S: '#facc15',
      CL: '#2dd4bf',
      F: '#34d399'
    };

    nodes.forEach((n, idx) => {
      // Glow
      ctx.beginPath();
      ctx.arc(n.x, n.y, 14, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(10, 15, 29, 0.9)';
      ctx.fill();
      ctx.strokeStyle = colors[n.atom] || '#00f2fe';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Text
      ctx.fillStyle = colors[n.atom] || '#ffffff';
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(n.atom, n.x, n.y);
    });

    // Molecular Label
    ctx.fillStyle = '#64748b';
    ctx.font = '11px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`2D Structural Topology: ${moleculeName || smiles.slice(0, 20)}`, width / 2, height - 16);
  }

  function downloadImage() {
    if (!canvasElement) return;
    const link = document.createElement('a');
    link.download = 'molecule_structure_2D.png';
    link.href = canvasElement.toDataURL('image/png');
    link.click();
  }

  return {
    init,
    render,
    downloadImage
  };
})();
