import * as THREE from 'three';
import { MU0 } from './Constants.js';

export class PhysicsEngine {
    constructor() {}

    /**
     * Calculates the force between two magnetic dipoles.
     * This is an approximation, especially for magnets close together or not small compared to their separation.
     * @param {Magnet} magnet1
     * @param {Magnet} magnet2
     * @param {THREE.Vector3} r - vector from magnet1 to magnet2
     * @returns {THREE.Vector3} Force vector ON magnet2 BY magnet1
     */
    calculateDipoleDipoleForce(magnet1, magnet2) {
        const m1 = magnet1.getMagneticMomentVector();
        const m2 = magnet2.getMagneticMomentVector();
        const rVec = new THREE.Vector3().subVectors(magnet2.position, magnet1.position);
        const r = rVec.length();

        if (r < 1e-6) return new THREE.Vector3(0,0,0); // Avoid division by zero

        const rHat = rVec.clone().normalize();

        // General dipole-dipole force formula (vector form)
        // F = (3 * μ0 / (4 * π * r^4)) *
        //     [ (m1 ⋅ r̂)m2 + (m2 ⋅ r̂)m1 + (m1 ⋅ m2)r̂ - 5(m1 ⋅ r̂)(m2 ⋅ r̂)r̂ ]
        // See: https://en.wikipedia.org/wiki/Force_between_magnets#Force_between_two_magnetic_dipoles

        const m1_dot_rHat = m1.dot(rHat);
        const m2_dot_rHat = m2.dot(rHat);
        const m1_dot_m2 = m1.dot(m2);

        const term1 = m2.clone().multiplyScalar(m1_dot_rHat);
        const term2 = m1.clone().multiplyScalar(m2_dot_rHat);
        const term3 = rHat.clone().multiplyScalar(m1_dot_m2);
        const term4 = rHat.clone().multiplyScalar(-5 * m1_dot_rHat * m2_dot_rHat);

        const forceVector = new THREE.Vector3()
            .add(term1)
            .add(term2)
            .add(term3)
            .add(term4);

        forceVector.multiplyScalar((3 * MU0) / (4 * Math.PI * Math.pow(r, 4)));

        return forceVector;
    }

    /**
     * Calculates force between a magnet and a ferromagnetic material (simplified).
     * Uses method of images or a simplified attraction law.
     * For now, let's use a simplified formula F ~ (B_at_surface)^2 * Area / (2*mu0) and an exponential decay.
     * This is a VERY ROUGH approximation.
     * @param {Magnet} magnet
     * @param {FerromagneticObject} ferroObject
     * @param {number} distance - center-to-center distance in meters
     * @returns {THREE.Vector3} Attraction force vector ON ferroObject BY magnet
     */
    calculateMagnetToFerroForce(magnet, ferroObject, distance) {
        if (distance < 1e-6) distance = 1e-6;

        // Simplified model: Force proportional to Br^2 and an area term, decaying with distance.
        // This is highly empirical and would need refinement or replacement.
        // A more accurate model would involve calculating the field from the magnet at the surface
        // of the steel and then integrating. Or using image dipole method.

        // For simplicity, let's assume the force is always attractive towards the magnet.
        const Br = magnet.Br;
        let area_approx; // Approximate interaction area
        if (magnet.shape === 'disc' || magnet.shape === 'sphere') {
            area_approx = Math.PI * Math.pow(magnet.dimensions.diameter / 2000, 2);
        } else if (magnet.shape === 'block') {
            // Assume facing with largest area for simplicity
            const l = magnet.dimensions.length / 1000;
            const w = magnet.dimensions.width / 1000;
            const h = magnet.dimensions.height / 1000;
            area_approx = Math.max(l*w, l*h, w*h);
        } else { // Ring
            area_approx = Math.PI * Math.pow(magnet.dimensions.outerDiameter / 2000, 2);
        }

        // F_contact_approx = (Br^2 * area_approx) / (2 * MU0); // Very rough contact force
        // Let's use a known formula for force between two identical magnets at contact
        // and assume steel doubles this. Then decay it.
        // F_axial_cyl_contact ≈ (Br^2 * A) / (2 * MU0) * (1 / (1 + L/D)^2) (very approx)
        // For now, let's use a simpler K&J Magnetics inspired formula (conceptual)
        // F = (Br^2 * Area_pole * K_factor) / ( (gap + effective_length)^2 )
        // This is still too complex to implement quickly.

        // Let's go back to a very simple approximation based on dipole strength and distance.
        // Image dipole: Pretend the steel creates an "image" magnet.
        // The force can be similar to two attracting magnets.
        const m_mag = magnet.getMagneticMomentVector().length();
        if (m_mag === 0) return new THREE.Vector3(0,0,0);

        // Simplified force magnitude for attraction to a large permeable surface
        // F ~ (μ0 * m^2) / (2 * π * d^4) * k (where k is some factor for steel, maybe 2-4x of magnet-magnet)
        // This is highly dependent on geometry and assumptions.
        // Let's take the general dipole-dipole structure for attraction:
        // F = (3 * μ0 * m1 * m_image) / (2 * π * (2*d)^4) for certain orientations if m_image ~ m1
        // For a more practical approach, many calculators use empirical fits.
        // Let's use a simplified pull force formula often seen for a magnet pulling on a thick steel plate:
        // F = (B_surface^2 * Area_pole) / (2 * MU0)
        // B_surface is field at the magnet's pole, related to Br. For NdFeB, B_surface can be ~Br.
        // This formula is for CONTACT. We need distance dependence.

        let forceMagnitude = (Math.pow(Br, 2) * area_approx) / (2 * MU0); // Contact force

        // Exponential decay or 1/d^n decay. Let's use a (gap_effective)^2 rule for simplicity.
        // d_eff = distance from magnet surface to steel surface + some internal magnetic length
        let surfaceToSurfaceDistance = distance - (magnet.dimensions.thickness / 2000 || magnet.dimensions.diameter / 2000); // Assuming centered
        if (surfaceToSurfaceDistance < 0) surfaceToSurfaceDistance = 0.0001; // Min gap
        
        // F(d) = F_contact / (1 + d_surface / D_magnet)^2  (very very rough)
        let characteristicLength = magnet.dimensions.thickness / 1000 || magnet.dimensions.diameter / 1000;
        forceMagnitude /= Math.pow(1 + surfaceToSurfaceDistance / characteristicLength, 2.5); // Decay exponent needs tuning

        const direction = new THREE.Vector3().subVectors(magnet.position, ferroObject.position).normalize(); // Attraction
        return direction.multiplyScalar(forceMagnitude);
    }


    // More accurate formulas for specific shapes (e.g., axially aligned cylinders)
    // would go here. These are complex. For example, from K&J Magnetics or papers by Ravaud, Lemarquand.
    // For now, dipole-dipole is the most general we can easily implement.
    // Example: Force between two identical axially magnetized cylindrical magnets:
    // F = (π * Br^2 * R^4) / (4 * μ0) * [ 1/(x^2) + 1/((x+2L)^2) - 2/((x+L)^2) ]
    // where R is radius, L is length, x is gap between magnets.
    // This is still simplified (assumes L >> R sometimes or vice-versa).
}