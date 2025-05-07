import * as THREE from 'three'; // Only if main needs direct THREE access, usually not.
import { SceneManager } from './SceneManager.js';
import { UIManager } from './UIManager.js';
import { PhysicsEngine } from './PhysicsEngine.js';
import { Magnet, FerromagneticObject } from './Magnet.js'; // Ensure these are exported/imported correctly

class App {
    constructor() {
        this.canvas = document.getElementById('renderer-canvas');
        this.sceneManager = new SceneManager(this.canvas);
        this.physicsEngine = new PhysicsEngine();

        this.magnet1 = null;
        this.object2 = null;

        this.uiManager = new UIManager({
            onConfigChange: () => this.handleConfigChange(),
            onDistanceChange: (dist) => this.handleDistanceChange(dist),
            onShowFieldLines: (show) => this.toggleFieldLines(show),
            onResetView: () => this.sceneManager.resetCamera(),
            onSaveConfig: () => this.saveConfiguration()
        });

        this.savedConfigs = []; // For comparison view

        // Initial setup
        this.handleConfigChange();
    }

    handleConfigChange() {
        const magnet1Config = this.uiManager.getMagnetConfig('magnet1');
        const object2Config = this.uiManager.getObject2Config();
        const distance = this.uiManager.getDistance();

        // Remove old objects if they exist
        if (this.magnet1) this.sceneManager.removeObject(this.magnet1);
        if (this.object2) this.sceneManager.removeObject(this.object2);

        // Create new objects
        this.magnet1 = this.sceneManager.createObject(magnet1Config);
        this.object2 = this.sceneManager.createObject(object2Config);

        if(this.magnet1) this.sceneManager.updateObjectOrientation(this.magnet1, magnet1Config.orientation);
        if(this.object2) this.sceneManager.updateObjectOrientation(this.object2, object2Config.orientation);


        this.sceneManager.updateObjectPositions(this.magnet1, this.object2, distance);
        this.calculateAndDisplayForce();
        this.toggleFieldLines(this.uiManager.showFieldLinesCheckbox.checked); // Re-draw if enabled
    }

    handleDistanceChange(distance) {
        this.sceneManager.updateObjectPositions(this.magnet1, this.object2, distance);
        this.calculateAndDisplayForce();
        this.toggleFieldLines(this.uiManager.showFieldLinesCheckbox.checked);
    }

    calculateAndDisplayForce() {
        if (!this.magnet1 || !this.object2) return;

        let forceVector;
        if (this.object2 instanceof Magnet) {
            forceVector = this.physicsEngine.calculateDipoleDipoleForce(this.magnet1, this.object2);
        } else if (this.object2 instanceof FerromagneticObject) {
             const distanceM = this.uiManager.getDistance() / 1000;
            forceVector = this.physicsEngine.calculateMagnetToFerroForce(this.magnet1, this.object2, distanceM);
            // For ferro, force is on ferro BY magnet. Arrow should originate from ferroObject.
            // To display force on magnet1 by ferroObject, invert the vector.
            // For now, let's display force ON object2.
        } else {
             forceVector = new THREE.Vector3(0,0,0);
        }


        // The dipole-dipole calculation gives force ON magnet2.
        // We want to display the force acting on one of the magnets (e.g., magnet2).
        this.sceneManager.displayForce(this.object2, forceVector); // Display force on object2
        this.uiManager.updateForceDisplay(forceVector, this.magnet1, this.object2);
    }

    toggleFieldLines(show) {
        if (show) {
            if (this.magnet1) { // Ensure magnet1 exists
                this.sceneManager.drawFieldLines(this.magnet1, this.object2 instanceof Magnet ? this.object2 : null);
            }
        } else {
            this.sceneManager.clearFieldLines();
        }
    }

    saveConfiguration() {
        // Basic save - could be expanded to store full state
        const config = {
            magnet1: this.uiManager.getMagnetConfig('magnet1'),
            object2: this.uiManager.getObject2Config(),
            distance: this.uiManager.getDistance(),
            force: document.getElementById('force-value').textContent // Or get from calculation
        };
        this.savedConfigs.push(config);
        alert(`Configuration saved! (${this.savedConfigs.length} saved)`);
        // Implement a UI to display/compare these saved configs later.
        console.log("Saved Configs:", this.savedConfigs);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new App();
});