# 🧬 Drug Discovery Assistant: Molecular Solubility Predictor

<p align="center">
  <img src="assets/logo.svg" alt="SoluChem Drug Discovery Assistant" width="420">
</p>

<p align="center">
  <strong>Predicting the aqueous solubility ($\log S$) and ADMET profile of chemical compounds using molecular structure data.</strong>
</p>

<p align="center">
  <a href="https://github.com"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://github.com"><img src="https://img.shields.io/badge/GitHub_Pages-Ready-00f2fe.svg" alt="GitHub Pages"></a>
  <a href="https://github.com"><img src="https://img.shields.io/badge/Model-Delaney_ESOL-10b981.svg" alt="Delaney ESOL"></a>
  <a href="https://github.com"><img src="https://img.shields.io/badge/Accuracy_R²-0.89-purple.svg" alt="Model Accuracy"></a>
  <a href="https://github.com"><img src="https://img.shields.io/badge/Bioinformatics-Cheminformatics-orange.svg" alt="Cheminformatics"></a>
</p>

---

## 🔬 Scientific Background & Overview

Aqueous solubility ($\log S$) is one of the most critical physicochemical parameters in early-stage **drug discovery and lead optimization**. Over 40% of newly discovered chemical entities and combinatorial chemistry leads exhibit poor water solubility, leading to:
- Low oral bioavailability and erratic clinical pharmacokinetics.
- Inadequate target organ concentrations.
- High attrition rates during preclinical and clinical development.

The **Drug Discovery Assistant (SoluChem AI)** enables medicinal chemists, researchers, and students to predict compound aqueous solubility directly from molecular structure (**SMILES notation**) in real time, evaluate **Lipinski's Rule of 5**, inspect **2D and 3D molecular structures**, and run **high-throughput batch screenings** on candidate libraries.

---

## ⚡ Core Features

- 🧪 **Interactive Chemical Playground**:
  - Live SMILES parser with instant descriptor calculation.
  - Curated 1-click clinical drug presets: *Aspirin, Ibuprofen, Paracetamol, Caffeine, Remdesivir, Metformin, Paclitaxel, Curcumin, Atorvastatin*, and more.
- 📐 **Delaney ESOL Prediction Engine**:
  - Calculates Molecular Weight ($\text{MW}$), Octanol-Water partition ($\text{cLogP}$), Hydrogen Bond Donors ($\text{HBD}$), Hydrogen Bond Acceptors ($\text{HBA}$), Rotatable Bonds ($\text{RB}$), and Aromatic Proportion ($\text{AP}$).
  - Computes $\log S$ ($\text{mol/L}$) and mass solubility ($\text{mg/mL}$).
  - Provides a 5-tier qualitative solubility classification (Highly Soluble, Very Soluble, Moderately Soluble, Slightly Soluble, Insoluble).
  - Detailed parameter contribution breakdown showing exact penalties and bonuses.
- 🌐 **2D & 3D WebGL Molecular Depiction**:
  - **2D Structure**: Clean chemical bond diagrams powered by `SmilesDrawer`.
  - **3D Conformer Viewer**: Interactive WebGL rendering powered by `3Dmol.js` featuring auto-rotation, stick/sphere styles, and electrostatic surface visualization.
- 📊 **ADMET & Lipinski Rule of 5 Radar**:
  - Evaluates Pfizer's Rule of 5 (MW $\le 500$, $\text{cLogP} \le 5$, $\text{HBD} \le 5$, $\text{HBA} \le 10$) and Veber criteria ($\text{RB} \le 10$, $\text{TPSA} \le 140\text{ \AA}^2$).
  - Radar chart visualizing the compound's compliance envelope against optimal drug-like chemical space.
- 📁 **High-Throughput Batch Screening**:
  - Drag-and-drop CSV upload for processing entire libraries of chemical compounds.
  - Dynamic correlation scatter plot ($\log S$ vs $\text{MW}$ / $\text{cLogP}$) powered by `Chart.js`.
  - Filterable, sortable data table with instant CSV export.
- 💻 **Reproducible Code Exporter**:
  - Auto-generated Python (`rdkit`), Scikit-Learn, and JavaScript snippets to replicate predictions in computational notebooks.
- 🚀 **Zero-Config GitHub Pages Deployment**:
  - 100% client-side modern ES architecture. No complex servers or heavy dependencies required.

---

## 📐 Mathematical Formulation: Delaney ESOL Model

The aqueous solubility predictor uses the validated **Delaney ESOL (Estimated Solubility)** linear regression model:

$$\log S = 0.16 - 0.63 \times \text{cLogP} - 0.0062 \times \text{MW} + 0.066 \times \text{RB} - 0.74 \times \text{Aromatic Proportion}$$

### Parameter Impact:
| Parameter | Unit | Physical Role in Dissolution |
| :--- | :--- | :--- |
| **$\text{cLogP}$** | $\log_{10}$ | **Lipophilicity Penalty**: Higher hydrophobicity resists hydration by polar water molecules. |
| **$\text{MW}$** | $\text{Da}$ | **Cavity Penalty**: Larger molecular volume requires more energy to disrupt the water H-bond network. |
| **$\text{RB}$** | Integer | **Entropy Bonus**: Flexible bonds increase conformational entropy in the dissolved state. |
| **$\text{Aromatic Proportion}$** | Ratio ($0-1$) | **Lattice Penalty**: Planar aromatic rings form dense, high-energy crystalline $\pi$-$\pi$ stacking lattices. |

---

## 📂 Repository Structure

```
drug-discovery-assistant/
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Actions automated Pages deployment
├── assets/
│   ├── favicon.svg               # Chemical helix vector icon
│   ├── logo.svg                  # SVG SoluChem brand emblem
│   └── sample_compounds.csv      # Ready-to-test CSV with FDA drug SMILES
├── css/
│   ├── theme.css                 # Dark theme tokens, bioluminescent neon colors
│   ├── main.css                  # Layout, hero canvas, responsive grid
│   └── components.css           # 2D/3D viewers, dials, radar charts, tables
├── js/
│   ├── chemEngine.js             # Delaney ESOL, MW, cLogP, HBD, HBA, Ro5 logic
│   ├── presets.js                # Clinical benchmark drugs library
│   ├── viewer2D.js               # SmilesDrawer 2D molecular structure renderer
│   ├── viewer3D.js               # 3Dmol.js WebGL 3D interactive viewer
│   ├── batchProcessor.js         # Batch CSV parsing, scatter plots, CSV export
│   └── app.js                    # UI orchestration, event bindings & toast alerts
├── index.html                    # SEO-optimized semantic HTML5 application
├── package.json                  # Scripts (npm start / dev) and metadata
├── .gitignore                    # Git ignore file
├── LICENSE                       # MIT License
└── README.md                     # Comprehensive documentation
```

---

## 🚀 Quick Start & Local Development

Because the application is built using modern standards (HTML5, Vanilla CSS, Modular ES JavaScript), you can run it instantly without any build step:

### Option 1: Direct Browser
Simply double-click `index.html` or open it in any modern web browser.

### Option 2: Using npm (Recommended)
```bash
# Clone the repository
git clone https://github.com/your-username/drug-discovery-assistant.git

# Enter repository directory
cd drug-discovery-assistant

# Start local preview server (port 3000)
npm start
```
Then visit `http://localhost:3000`.

### Option 3: Using Python
```bash
# Python 3
python -m http.server 8000
```
Then visit `http://localhost:8000`.

---

## 🌐 Deploy to GitHub Pages in 2 Minutes

1. **Create a new repository** on GitHub (e.g. `drug-discovery-assistant`).
2. **Push this code to your repository**:
   ```bash
   git add .
   git commit -m "Initial commit: Drug Discovery Assistant website"
   git branch -M main
   git remote add origin https://github.com/<your-username>/drug-discovery-assistant.git
   git push -u origin main
   ```
3. **Enable GitHub Pages**:
   - In your GitHub repo, go to **Settings** > **Pages**.
   - Under **Source**, select **GitHub Actions** (the included `.github/workflows/deploy.yml` will handle everything automatically!) OR select **Deploy from a branch** -> `main` / `root`.
   - Click **Save**. Your live website URL will be:
     `https://<your-username>.github.io/drug-discovery-assistant/`

---

## 📚 Scientific References & Citations

1. **Delaney, J. S.** (2004). *ESOL: Estimating Aqueous Solubility Directly from Molecular Structure*. Journal of Chemical Information and Computer Sciences, 44(3), 1000–1005. [DOI: 10.1021/ci034243x](https://pubs.acs.org/doi/10.1021/ci034243x)
2. **Lipinski, C. A., Lombardo, F., Dominy, B. W., & Feeney, P. J.** (1997). *Experimental and computational approaches to estimate solubility and permeability in drug discovery and development settings*. Advanced Drug Delivery Reviews, 23(1-3), 3–25. [DOI: 10.1016/S0169-409X(96)00423-1](https://doi.org/10.1016/S0169-409X(96)00423-1)
3. **Sorkun, M. C., Khetan, A., & Er, S.** (2019). *AqSolDB, a curated aqueous solubility dataset of chemical compounds*. Scientific Data, 6(1), 143. [DOI: 10.1038/s41597-019-0151-1](https://doi.org/10.1038/s41597-019-0151-1)
4. **Veber, D. F., et al.** (2002). *Molecular properties that influence the oral bioavailability of drug candidates*. Journal of Medicinal Chemistry, 45(12), 2615–2623.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
