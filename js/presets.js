/**
 * ==========================================================================
 * PRESETS.JS - Curated Benchmark Chemical Compounds & FDA Drugs
 * ==========================================================================
 */

const PRESET_COMPOUNDS = [
  {
    id: 'aspirin',
    name: 'Aspirin (Acetylsalicylic Acid)',
    shortName: 'Aspirin',
    smiles: 'CC(=O)Oc1ccccc1C(=O)O',
    category: 'Analgesic / Anti-inflammatory',
    indication: 'Non-steroidal anti-inflammatory drug (NSAID) and platelet aggregation inhibitor.',
    experimentalLogS: -1.74,
    reference: 'Delaney ESOL Benchmark (2004)',
    cid: 2244
  },
  {
    id: 'paracetamol',
    name: 'Paracetamol (Acetaminophen)',
    shortName: 'Paracetamol',
    smiles: 'CC(=O)Nc1ccc(O)cc1',
    category: 'Antipyretic / Analgesic',
    indication: 'Widely used for mild-to-moderate pain and fever reduction.',
    experimentalLogS: -1.02,
    reference: 'AqSolDB Curated Set',
    cid: 1983
  },
  {
    id: 'ibuprofen',
    name: 'Ibuprofen',
    shortName: 'Ibuprofen',
    smiles: 'CC(C)Cc1ccc(cc1)C(C)C(=O)O',
    category: 'NSAID',
    indication: 'Non-steroidal anti-inflammatory for pain, osteoarthritis, and dysmenorrhea.',
    experimentalLogS: -3.87,
    reference: 'Delaney ESOL Benchmark (2004)',
    cid: 3672
  },
  {
    id: 'caffeine',
    name: 'Caffeine',
    shortName: 'Caffeine',
    smiles: 'Cn1cnc2c1c(=O)n(c(=O)n2C)C',
    category: 'CNS Stimulant',
    indication: 'Central nervous system stimulant of the methylxanthine class.',
    experimentalLogS: -0.99,
    reference: 'Delaney ESOL Benchmark (2004)',
    cid: 2519
  },
  {
    id: 'metformin',
    name: 'Metformin',
    shortName: 'Metformin',
    smiles: 'CN(C)C(=N)NC(=N)N',
    category: 'Antidiabetic',
    indication: 'Biguanide first-line medication for type 2 diabetes.',
    experimentalLogS: -0.42,
    reference: 'AqSolDB Curated Set',
    cid: 4091
  },
  {
    id: 'nicotinamide',
    name: 'Nicotinamide (Vitamin B3)',
    shortName: 'Nicotinamide',
    smiles: 'NC(=O)c1cccnc1',
    category: 'Vitamin / Nutrient',
    indication: 'Dietary supplement and component of coenzymes NAD and NADP.',
    experimentalLogS: -0.09,
    reference: 'Delaney ESOL Benchmark (2004)',
    cid: 936
  },
  {
    id: 'diclofenac',
    name: 'Diclofenac',
    shortName: 'Diclofenac',
    smiles: 'O=C(O)Cc1ccccc1Nc2c(Cl)cccc2Cl',
    category: 'NSAID',
    indication: 'Potent non-steroidal anti-inflammatory drug used to treat pain and arthritis.',
    experimentalLogS: -4.89,
    reference: 'AqSolDB Curated Set',
    cid: 3033
  },
  {
    id: 'sulfamethoxazole',
    name: 'Sulfamethoxazole',
    shortName: 'Sulfamethoxazole',
    smiles: 'Cc1cc(NS(=O)(=O)c2ccc(N)cc2)no1',
    category: 'Sulfonamide Antibiotic',
    indication: 'Bacteriostatic antibiotic used for urinary tract infections.',
    experimentalLogS: -2.71,
    reference: 'Delaney ESOL Benchmark (2004)',
    cid: 5329
  },
  {
    id: 'curcumin',
    name: 'Curcumin',
    shortName: 'Curcumin',
    smiles: 'COc1cc(ccc1O)C=CC(=O)CC(=O)C=Cc2ccc(c(c2)OC)O',
    category: 'Polyphenol Phytochemical',
    indication: 'Natural antioxidant and anti-inflammatory candidate from Curcuma longa.',
    experimentalLogS: -4.95,
    reference: 'AqSolDB Curated Set',
    cid: 969516
  },
  {
    id: 'atorvastatin',
    name: 'Atorvastatin',
    shortName: 'Atorvastatin',
    smiles: 'CC(C)c1c(C(=O)Nc2ccccc2)c(-c2ccccc2)c(-c2ccc(F)cc2)n1CCC(O)CC(O)CC(=O)O',
    category: 'HMG-CoA Reductase Inhibitor',
    indication: 'Statin medication to prevent cardiovascular disease and treat dyslipidemia.',
    experimentalLogS: -5.32,
    reference: 'DrugBank Database',
    cid: 60823
  },
  {
    id: 'remdesivir',
    name: 'Remdesivir',
    shortName: 'Remdesivir',
    smiles: 'CCC(CC)COC(=O)C(C)NP(=O)(OCC1C(C(C(O1)n2cnc3c2ncn3N)C#N)O)Oc4ccccc4',
    category: 'Antiviral Nucleotide Prodrug',
    indication: 'Broad-spectrum antiviral medication for severe respiratory viral infections.',
    experimentalLogS: -4.48,
    reference: 'Literature Benchmark',
    cid: 121304016
  },
  {
    id: 'paclitaxel',
    name: 'Paclitaxel (Taxol)',
    shortName: 'Paclitaxel',
    smiles: 'CC(=O)OC1C(=O)C2(C)C(O)CC3OCC3(OC(=O)C)C2C(OC(=O)c4ccccc4)C5(O)CC(OC(=O)C(O)C(NC(=O)c6ccccc6)c7ccccc7)C(=C1C)C5(C)C',
    category: 'Chemotherapy / Antineoplastic',
    indication: 'Microtubule-stabilizing anticancer drug used in solid tumor oncology.',
    experimentalLogS: -6.12,
    reference: 'DrugBank Database',
    cid: 36314
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PRESET_COMPOUNDS;
}
