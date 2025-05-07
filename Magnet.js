import * as THREE from 'three';
import { N_GRADES, MU0 } from './Constants.js';

export class Magnet {
    constructor(params) {
        this.shape = params.shape || 'disc'; // 'disc', 'block', 'ring', 'sphere'
        this.strengthGrade = params.strengthGrade || 'N35'; // e.g., 'N35'
        this.dimensions = { ...params.dimensions }; // { diameter, thickness } or { length, width, height } etc.
        this.position = params.position || new THREE.Vector3(0, 0, 0);
        this.orientation = params.orientation || new THREE.Euler(0, 0, 0); // Euler angles (radians)
        this.mesh = null; // Three.js mesh
        this.id = THREE.MathUtils.generateUUID();

        this.Br = N_GRADES[this.strengthGrade]; // Remanence in Tesla
        this.magnetizationDirection = new THREE.Vector3(0, 1, 0); // Default: magnetized along Y-axis of the object
    }

    getVolume() {
        // Calculate volume based on shape and dimensions
        switch (this.shape) {
            case 'disc':
            case 'ring': // For simplicity, treat ring volume like a disc for now
                return Math.PI * Math.pow(this.dimensions.diameter / 2000, 2) * (this.dimensions.thickness / 1000); // Convert mm to m
            case 'block':
                return (this.dimensions.length / 1000) * (this.dimensions.width / 1000) * (this.dimensions.height / 1000);
            case 'sphere':
                return (4 / 3) * Math.PI * Math.pow(this.dimensions.diameter / 2000, 3);
            default: return 0;
        }
    }

    // Magnetic dipole moment (approximate for uniform magnetization)
    // m = M * V, where M = Br / μ0 for NdFeB magnets
    getMagneticMomentVector() {
        const volume = this.getVolume();
        if (volume === 0 || !this.Br) return new THREE.Vector3(0,0,0);

        const M_magnitude = this.Br / MU0; // Magnetization magnitude
        const momentMagnitude = M_magnitude * volume;

        // The magnetization direction is in the object's local space.
        // We need to rotate it by the object's world orientation.
        let momentVec = this.magnetizationDirection.clone().normalize().multiplyScalar(momentMagnitude);
        momentVec.applyEuler(this.orientation);
        return momentVec;
    }

    updateMesh() {
        if (this.mesh) {
            this.mesh.position.copy(this.position);
            this.mesh.rotation.copy(this.orientation);
        }
    }
}

export class FerromagneticObject {
    constructor(params) {
        this.type = params.type || 'steel-plate'; // 'steel-plate', 'steel-ball'
        this.dimensions = { ...params.dimensions };
        this.position = params.position || new THREE.Vector3(0, 0, 0);
        this.orientation = params.orientation || new THREE.Euler(0, 0, 0);
        this.mesh = null;
        this.id = THREE.MathUtils.generateUUID();
        // May add permeability later if needed for more advanced calculations
    }
    updateMesh() {
        if (this.mesh) {
            this.mesh.position.copy(this.position);
            this.mesh.rotation.copy(this.orientation);
        }
    }
}