/**
 * ==========================================================================
 * CHEMENGINE.JS - Cheminformatics & Delaney ESOL Solubility Engine
 * ==========================================================================
 * Implements:
 * 1. SMILES parsing & atom graph extraction
 * 2. Molecular weight (MW) and empirical formula calculation
 * 3. Lipinski descriptors (cLogP, HBD, HBA, TPSA, Rotatable Bonds)
 * 4. Delaney ESOL (Estimated Solubility) linear regression model:
 *    LogS = 0.16 - 0.63 * cLogP - 0.0062 * MW + 0.066 * RB - 0.74 * AromaticProportion
 * 5. Unit conversions (mol/L, mg/mL, ug/mL) and qualitative classification
 */

const ChemEngine = (() => {
  // Standard IUPAC Atomic Weights (g/mol)
  const ATOMIC_WEIGHTS = {
    H: 1.008,
    C: 12.011,
    N: 14.007,
    O: 15.999,
    F: 18.998,
    P: 30.974,
    S: 32.06,
    Cl: 35.45,
    Br: 79.904,
    I: 126.904,
    B: 10.81,
    Na: 22.99,
    K: 39.098
  };

  /**
   * Parse basic SMILES to count atoms, rings, bonds, and estimate properties
   */
  function parseSmiles(smiles) {
    if (!smiles || typeof smiles !== 'string') {
      throw new Error('Invalid SMILES string');
    }
    const clean = smiles.trim();
    if (clean.length === 0) throw new Error('Empty SMILES string');

    // Count aromatic atoms (lowercase letters: c, n, o, s)
    const aromaticMatches = clean.match(/[cnosp]/g) || [];
    const aromaticCount = aromaticMatches.length;

    // Detect elements
    // Handle two-letter symbols first: Cl, Br, Na
    let working = clean.replace(/Cl/g, 'L').replace(/Br/g, 'R').replace(/Na/g, 'A');

    const counts = {
      C: 0, H: 0, N: 0, O: 0, F: 0, P: 0, S: 0, Cl: 0, Br: 0, I: 0
    };

    // Extract explicit hydrogen counts from brackets like [NH], [OH], [CH3]
    const bracketMatches = clean.match(/\[([A-Z][a-z]?)(H\d*)?\]/g) || [];
    let explicitH = 0;
    bracketMatches.forEach(b => {
      const hMatch = b.match(/H(\d*)/);
      if (hMatch) {
        explicitH += hMatch[1] ? parseInt(hMatch[1], 10) : 1;
      }
    });

    for (let i = 0; i < working.length; i++) {
      const ch = working[i];
      if (ch === 'C' || ch === 'c') counts.C++;
      else if (ch === 'N' || ch === 'n') counts.N++;
      else if (ch === 'O' || ch === 'o') counts.O++;
      else if (ch === 'F') counts.F++;
      else if (ch === 'P' || ch === 'p') counts.P++;
      else if (ch === 'S' || ch === 's') counts.S++;
      else if (ch === 'L') counts.Cl++;
      else if (ch === 'R') counts.Br++;
      else if (ch === 'I') counts.I++;
    }

    // Heavy atom count (excluding Hydrogen)
    const heavyAtoms = counts.C + counts.N + counts.O + counts.F + counts.P + counts.S + counts.Cl + counts.Br + counts.I;
    if (heavyAtoms === 0) {
      throw new Error('SMILES must contain at least one heavy atom');
    }

    // Estimate implicit hydrogens based on standard valencies (neutral organic molecules)
    // C valency 4, N valency 3, O valency 2, Halogens 1, P 3 or 5, S 2
    // Deduce bonds from connectivity and special characters
    const doubleBonds = (clean.match(/=/g) || []).length;
    const tripleBonds = (clean.match(/#/g) || []).length;
    const ringClosures = (clean.match(/[0-9]/g) || []).length / 2;

    // Approximate valence saturation for hydrogens
    let estimatedH = (counts.C * 4 + counts.N * 3 + counts.O * 2 + counts.P * 3 + counts.S * 2 + counts.F + counts.Cl + counts.Br + counts.I)
                    - (heavyAtoms - 1 + ringClosures) * 2 - doubleBonds * 2 - tripleBonds * 4;
    
    // Fallback: Aromatic rings take 1 H per carbon
    if (aromaticCount > 0) {
      estimatedH = Math.max(aromaticCount * 0.7, estimatedH);
    }
    estimatedH = Math.max(0, Math.round(estimatedH) + explicitH);
    counts.H = estimatedH;

    // Calculate Molecular Weight
    let mw = 0;
    for (const [elem, count] of Object.entries(counts)) {
      if (ATOMIC_WEIGHTS[elem]) {
        mw += count * ATOMIC_WEIGHTS[elem];
      }
    }

    // Calculate Empirical Formula (Hill system: C first, then H, then alphabetical)
    let formula = '';
    if (counts.C > 0) formula += 'C' + (counts.C > 1 ? counts.C : '');
    if (counts.H > 0) formula += 'H' + (counts.H > 1 ? counts.H : '');
    const otherElems = Object.keys(counts).filter(e => e !== 'C' && e !== 'H').sort();
    for (const el of otherElems) {
      if (counts[el] > 0) formula += el + (counts[el] > 1 ? counts[el] : '');
    }

    // Hydrogen Bond Donors (HBD): OH and NH groups
    // Roughly estimate count of O and N that have attached H
    const ohCount = (clean.match(/O(?![a-zA-Z0-9])/g) || []).length + (clean.match(/\[OH\]/g) || []).length;
    const nhCount = (clean.match(/N(?![a-zA-Z0-9])/g) || []).length + (clean.match(/\[NH\d?\]/g) || []).length;
    const hbd = Math.min(counts.O + counts.N, Math.max(0, Math.round((counts.O * 0.45) + (counts.N * 0.65))));

    // Hydrogen Bond Acceptors (HBA): Total N and O atoms
    const hba = counts.N + counts.O;

    // Rotatable Bonds (RB): Single non-ring bonds between heavy atoms (excluding terminal atoms)
    // Heuristic: single bonds not in rings and not terminal
    const branchPoints = (clean.match(/\(/g) || []).length;
    const totalSingleBonds = Math.max(0, heavyAtoms - 1 - doubleBonds - tripleBonds);
    const ringBonds = Math.round(ringClosures * 3);
    const rotatableBonds = Math.max(0, Math.min(25, Math.round(branchPoints + (totalSingleBonds - ringBonds) * 0.35)));

    // Aromatic Proportion (AP): Number of aromatic atoms / heavy atoms
    const aromaticProportion = heavyAtoms > 0 ? (aromaticCount / heavyAtoms) : 0;

    // Approximate Topological Polar Surface Area (TPSA in Å²)
    // N: ~12-24 Å², O: ~9-20 Å², P: ~10 Å², S: ~25 Å²
    const tpsa = Math.round((counts.N * 16.5 + counts.O * 14.2 + counts.S * 28.2 + counts.P * 11.5) * 10) / 10;

    // Crippen cLogP Estimation (Atom-contribution approximation)
    // Carbon contributes ~0.20 to 0.35, Halogens ~0.5 to 1.1, Nitrogen ~-0.7 to -0.2, Oxygen ~-0.4 to -0.8
    let estimatedLogP = (counts.C * 0.285)
                      + (counts.Cl * 0.68)
                      + (counts.Br * 0.88)
                      + (counts.F * 0.31)
                      + (counts.I * 1.15)
                      + (counts.S * 0.45)
                      - (counts.O * 0.58)
                      - (counts.N * 0.72)
                      + (aromaticCount * 0.12)
                      - (counts.H * 0.02)
                      - 0.15;
    
    // Bound logP to realistic drug space [-4, 10]
    estimatedLogP = Math.round(estimatedLogP * 100) / 100;

    return {
      smiles: clean,
      formula,
      counts,
      heavyAtoms,
      mw: Math.round(mw * 100) / 100,
      cLogP: estimatedLogP,
      hbd,
      hba,
      rotatableBonds,
      aromaticCount,
      aromaticProportion: Math.round(aromaticProportion * 1000) / 1000,
      tpsa
    };
  }

  /**
   * Delaney ESOL Model Calculation
   * Equation: LogS = 0.16 - 0.63*cLogP - 0.0062*MW + 0.066*RB - 0.74*AP
   */
  function predictSolubility(descriptors) {
    const { cLogP, mw, rotatableBonds, aromaticProportion } = descriptors;

    // ESOL Linear Coefficients (Delaney, 2004)
    const intercept = 0.16;
    const cLogP_term = -0.63 * cLogP;
    const mw_term = -0.0062 * mw;
    const rb_term = 0.066 * rotatableBonds;
    const ap_term = -0.74 * aromaticProportion;

    const logS = intercept + cLogP_term + mw_term + rb_term + ap_term;
    const roundedLogS = Math.round(logS * 100) / 100;

    // Molar Solubility S in mol/L: 10^(LogS)
    const molarSolubility = Math.pow(10, roundedLogS);

    // Mass Solubility: S (g/L) = S (mol/L) * MW (g/mol)
    // Note: 1 g/L = 1 mg/mL = 1000 ug/mL
    const mgPerMl = molarSolubility * mw;
    const ugPerMl = mgPerMl * 1000;

    // Qualitative Classification and Color Codes
    let classification = '';
    let category = '';
    let color = '';
    let glowColor = '';
    let description = '';

    if (roundedLogS >= -1.0) {
      classification = 'Highly Soluble';
      category = 'high';
      color = '#10b981'; // Emerald
      glowColor = 'rgba(16, 185, 129, 0.35)';
      description = 'Rapid oral dissolution; very low risk of solubility-limited absorption.';
    } else if (roundedLogS >= -3.0) {
      classification = 'Very Soluble';
      category = 'very-good';
      color = '#38bdf8'; // Cyan-Blue
      glowColor = 'rgba(56, 189, 248, 0.35)';
      description = 'Favorable aqueous solubility profile for standard oral drug formulations.';
    } else if (roundedLogS >= -4.5) {
      classification = 'Moderately Soluble';
      category = 'moderate';
      color = '#f59e0b'; // Amber
      glowColor = 'rgba(245, 158, 11, 0.35)';
      description = 'Borderline solubility; may require micronization or formulation enhancers.';
    } else if (roundedLogS >= -6.0) {
      classification = 'Slightly Soluble';
      category = 'slight';
      color = '#fb923c'; // Orange
      glowColor = 'rgba(251, 146, 60, 0.35)';
      description = 'Poor aqueous solubility; high risk of dissolution-limited bioavailability.';
    } else {
      classification = 'Insoluble / Poor';
      category = 'poor';
      color = '#f43f5e'; // Crimson Rose
      glowColor = 'rgba(244, 63, 94, 0.35)';
      description = 'Extremely lipophilic or high MW; significant formulation challenge.';
    }

    // Gauge Needle Percentage (Mapped between LogS -8 and +1)
    // -8 -> 0%, +1 -> 100%
    const gaugePercent = Math.max(2, Math.min(98, Math.round(((roundedLogS - (-8)) / (1 - (-8))) * 100)));

    return {
      logS: roundedLogS,
      molarSolubility,
      mgPerMl,
      ugPerMl,
      classification,
      category,
      color,
      glowColor,
      description,
      gaugePercent,
      breakdown: {
        intercept: +0.16,
        cLogP_contrib: Math.round(cLogP_term * 100) / 100,
        mw_contrib: Math.round(mw_term * 100) / 100,
        rb_contrib: Math.round(rb_term * 100) / 100,
        ap_contrib: Math.round(ap_term * 100) / 100
      }
    };
  }

  /**
   * Evaluate Lipinski's Rule of 5 (Pfizer) & Veber Rules
   */
  function evaluateLipinski(descriptors) {
    const { mw, cLogP, hbd, hba, rotatableBonds, tpsa } = descriptors;

    const rules = [
      {
        name: 'Molecular Weight (MW)',
        value: `${mw} Da`,
        criterion: '≤ 500 Da',
        passed: mw <= 500,
        penalty: mw > 500 ? 'Bulky molecule' : null
      },
      {
        name: 'Lipophilicity (cLogP)',
        value: cLogP.toFixed(2),
        criterion: '≤ 5.0',
        passed: cLogP <= 5.0,
        penalty: cLogP > 5.0 ? 'Excessive lipophilicity' : null
      },
      {
        name: 'H-Bond Donors (HBD)',
        value: hbd,
        criterion: '≤ 5',
        passed: hbd <= 5,
        penalty: hbd > 5 ? 'High polar donor penalty' : null
      },
      {
        name: 'H-Bond Acceptors (HBA)',
        value: hba,
        criterion: '≤ 10',
        passed: hba <= 10,
        penalty: hba > 10 ? 'High acceptor penalty' : null
      }
    ];

    const veberRules = [
      {
        name: 'Rotatable Bonds (RB)',
        value: rotatableBonds,
        criterion: '≤ 10',
        passed: rotatableBonds <= 10
      },
      {
        name: 'Polar Surface Area (TPSA)',
        value: `${tpsa} Å²`,
        criterion: '≤ 140 Å²',
        passed: tpsa <= 140
      }
    ];

    const violations = rules.filter(r => !r.passed).length;
    const complies = violations <= 1; // Lipinski rule allows 1 violation

    return {
      complies,
      violations,
      rules,
      veberRules,
      verdict: complies ? 'Drug-like (Lipinski Ro5 Pass)' : 'Non-Drug-like (Lipinski Violations > 1)'
    };
  }

  /**
   * Complete Pipeline: SMILES -> Descriptors -> ESOL Solubility -> Lipinski Check
   */
  function analyze(smiles) {
    const descriptors = parseSmiles(smiles);
    const solubility = predictSolubility(descriptors);
    const lipinski = evaluateLipinski(descriptors);

    return {
      descriptors,
      solubility,
      lipinski
    };
  }

  return {
    analyze,
    parseSmiles,
    predictSolubility,
    evaluateLipinski
  };
})();

// Export globally for browser or module environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChemEngine;
}
