export const MU0 = 4 * Math.PI * 1e-7; // Permeability of free space (Tm/A)

// Approximate Remanence (Br) in Tesla for N-grades
// Source: Various magnet suppliers. Values can vary slightly.
export const N_GRADES = {
    "N35": 1.17, // T
    "N38": 1.21,
    "N40": 1.25,
    "N42": 1.29,
    "N45": 1.33,
    "N48": 1.38,
    "N50": 1.41,
    "N52": 1.44
};

export const STEEL_PERMEABILITY_RELATIVE = 1000; // Example relative permeability for mild steel (can vary greatly)