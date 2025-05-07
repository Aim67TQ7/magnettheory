import { N_GRADES } from './Constants.js';

export class UIManager {
    constructor(callbacks) {
        this.callbacks = callbacks; // { onConfigChange, onDistanceChange, onResetView, onShowFieldLines, onSaveConfig }

        // Magnet 1
        this.magnet1Shape = document.getElementById('magnet1-shape');
        this.magnet1DimsContainer = document.getElementById('magnet1-dims');
        this.magnet1Strength = document.getElementById('magnet1-strength');
        this.magnet1RotX = document.getElementById('magnet1-rotX');
        this.magnet1RotY = document.getElementById('magnet1-rotY');
        this.magnet1RotZ = document.getElementById('magnet1-rotZ');


        // Object 2
        this.object2Type = document.getElementById('object2-type');
        this.object2ConfigContainer = document.getElementById('object2-config');
         this.object2RotX = document.getElementById('object2-rotX');
        this.object2RotY = document.getElementById('object2-rotY');
        this.object2RotZ = document.getElementById('object2-rotZ');

        // Interaction
        this.distanceSlider = document.getElementById('distance');
        this.distanceValueDisplay = document.getElementById('distance-value');

        // Results
        this.forceValueDisplay = document.getElementById('force-value');
        this.forceTypeDisplay = document.getElementById('force-type');

        // Visualization
        this.showFieldLinesCheckbox = document.getElementById('show-field-lines');
        this.resetViewBtn = document.getElementById('reset-view-btn');
        this.saveConfigBtn = document.getElementById('compare-config-btn');


        this._populateNGrades();
        this._attachEventListeners();
        this.updateDimensionsUI('magnet1', this.magnet1Shape.value);
        this.updateObject2ConfigUI(this.object2Type.value);
    }

    _populateNGrades() {
        Object.keys(N_GRADES).forEach(grade => {
            const option = document.createElement('option');
            option.value = grade;
            option.textContent = grade;
            this.magnet1Strength.appendChild(option.cloneNode(true));
            // Will do similar for magnet2-strength when it's created
        });
         // Set default selection
        this.magnet1Strength.value = "N35";
    }

    _attachEventListeners() {
        // Magnet 1
        this.magnet1Shape.addEventListener('change', () => {
            this.updateDimensionsUI('magnet1', this.magnet1Shape.value);
            this.callbacks.onConfigChange();
        });
        this.magnet1Strength.addEventListener('change', this.callbacks.onConfigChange);
        [this.magnet1RotX, this.magnet1RotY, this.magnet1RotZ].forEach(el => el.addEventListener('change', this.callbacks.onConfigChange));


        // Object 2
        this.object2Type.addEventListener('change', () => {
            this.updateObject2ConfigUI(this.object2Type.value);
            this.callbacks.onConfigChange();
        });
        [this.object2RotX, this.object2RotY, this.object2RotZ].forEach(el => el.addEventListener('change', this.callbacks.onConfigChange));


        // Interaction
        this.distanceSlider.addEventListener('input', () => {
            this.distanceValueDisplay.textContent = `${this.distanceSlider.value} mm`;
            this.callbacks.onDistanceChange(parseFloat(this.distanceSlider.value));
        });

        // Visualization
        this.showFieldLinesCheckbox.addEventListener('change', (e) => this.callbacks.onShowFieldLines(e.target.checked));
        this.resetViewBtn.addEventListener('click', this.callbacks.onResetView);
        this.saveConfigBtn.addEventListener('click', this.callbacks.onSaveConfig);

        // Listen for changes within dynamically added dimension inputs
        this.magnet1DimsContainer.addEventListener('change', (e) => {
            if (e.target.tagName === 'INPUT') this.callbacks.onConfigChange();
        });
        this.object2ConfigContainer.addEventListener('change', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') this.callbacks.onConfigChange();
        });
    }

    updateDimensionsUI(objPrefix, shape) {
        const container = objPrefix === 'magnet1' ? this.magnet1DimsContainer : document.getElementById('magnet2-dims'); // Assuming magnet2-dims exists
        if (!container) return;
        container.innerHTML = ''; // Clear previous inputs

        const createInput = (id, label, unit, value, type='number', step=1) => {
            const div = document.createElement('div');
            div.className = 'dim-input-group';
            const lbl = document.createElement('label');
            lbl.htmlFor = `${objPrefix}-${id}`;
            lbl.textContent = `${label}:`;
            const input = document.createElement('input');
            input.type = type;
            input.id = `${objPrefix}-${id}`;
            input.name = id;
            input.value = value;
            input.step = step;
            const span = document.createElement('span');
            span.textContent = unit;
            div.appendChild(lbl);
            div.appendChild(input);
            div.appendChild(span);
            return div;
        };

        switch (shape) {
            case 'disc':
                container.appendChild(createInput('diameter', 'Diameter', 'mm', 20));
                container.appendChild(createInput('thickness', 'Thickness', 'mm', 5));
                break;
            case 'block':
                container.appendChild(createInput('length', 'Length (Z)', 'mm', 20));
                container.appendChild(createInput('width', 'Width (X)', 'mm', 10));
                container.appendChild(createInput('height', 'Height (Y)', 'mm', 5));
                break;
            case 'ring':
                container.appendChild(createInput('outerDiameter', 'Outer Dia.', 'mm', 20));
                container.appendChild(createInput('innerDiameter', 'Inner Dia.', 'mm', 10));
                container.appendChild(createInput('thickness', 'Thickness', 'mm', 5));
                break;
            case 'sphere':
                container.appendChild(createInput('diameter', 'Diameter', 'mm', 10));
                break;
        }
    }

    updateObject2ConfigUI(type) {
        this.object2ConfigContainer.innerHTML = ''; // Clear previous
        if (type === 'magnet') {
            const shapeLabel = document.createElement('label');
            shapeLabel.htmlFor = 'magnet2-shape';
            shapeLabel.textContent = 'Shape:';
            const shapeSelect = document.createElement('select');
            shapeSelect.id = 'magnet2-shape';
            ['disc', 'block', 'ring', 'sphere'].forEach(s => {
                const opt = document.createElement('option');
                opt.value = s; opt.textContent = s.charAt(0).toUpperCase() + s.slice(1);
                shapeSelect.appendChild(opt);
            });

            const strengthLabel = document.createElement('label');
            strengthLabel.htmlFor = 'magnet2-strength';
            strengthLabel.textContent = 'Strength:';
            const strengthSelect = document.createElement('select');
            strengthSelect.id = 'magnet2-strength';
            Object.keys(N_GRADES).forEach(grade => {
                const option = document.createElement('option');
                option.value = grade; option.textContent = grade;
                strengthSelect.appendChild(option);
            });
            strengthSelect.value = "N35"; // Default


            const dimsDiv = document.createElement('div');
            dimsDiv.id = 'magnet2-dims';

            this.object2ConfigContainer.appendChild(shapeLabel);
            this.object2ConfigContainer.appendChild(shapeSelect);
            this.object2ConfigContainer.appendChild(strengthLabel);
            this.object2ConfigContainer.appendChild(strengthSelect);
            this.object2ConfigContainer.appendChild(dimsDiv);

            shapeSelect.addEventListener('change', () => {
                this.updateDimensionsUI('magnet2', shapeSelect.value);
                this.callbacks.onConfigChange();
            });
            strengthSelect.addEventListener('change', this.callbacks.onConfigChange);
            this.updateDimensionsUI('magnet2', shapeSelect.value); // Initial dims for magnet2
        } else if (type === 'steel-plate') {
            // Dimensions for steel plate
            const createInput = (id, label, unit, value) => {
                const div = document.createElement('div');
                div.className = 'dim-input-group';
                const lbl = document.createElement('label');
                lbl.htmlFor = `object2-${id}`; lbl.textContent = `${label}:`;
                const input = document.createElement('input');
                input.type = 'number'; input.id = `object2-${id}`; input.name = id; input.value = value;
                const span = document.createElement('span');
                span.textContent = unit;
                div.appendChild(lbl); div.appendChild(input); div.appendChild(span);
                return div;
            };
            this.object2ConfigContainer.appendChild(createInput('length', 'Length (Z)', 'mm', 50));
            this.object2ConfigContainer.appendChild(createInput('width', 'Width (X)', 'mm', 50));
            this.object2ConfigContainer.appendChild(createInput('thickness', 'Thickness (Y)', 'mm', 10));

        } else if (type === 'steel-ball') {
            // Dimensions for steel ball
             const createInput = (id, label, unit, value) => {
                const div = document.createElement('div');
                div.className = 'dim-input-group';
                const lbl = document.createElement('label');
                lbl.htmlFor = `object2-${id}`; lbl.textContent = `${label}:`;
                const input = document.createElement('input');
                input.type = 'number'; input.id = `object2-${id}`; input.name = id; input.value = value;
                const span = document.createElement('span');
                span.textContent = unit;
                div.appendChild(lbl); div.appendChild(input); div.appendChild(span);
                return div;
            };
            this.object2ConfigContainer.appendChild(createInput('diameter', 'Diameter', 'mm', 20));
        }
    }

    getMagnetConfig(prefix) {
        const shape = document.getElementById(`${prefix}-shape`).value;
        const strengthGrade = document.getElementById(`${prefix}-strength`)?.value; // Optional for non-magnets
        const dimensions = {};
        const dimContainer = document.getElementById(`${prefix}-dims`);
        dimContainer.querySelectorAll('input[type="number"]').forEach(input => {
            dimensions[input.name] = parseFloat(input.value);
        });
         const rotX = parseFloat(document.getElementById(`${prefix}-rotX`).value);
        const rotY = parseFloat(document.getElementById(`${prefix}-rotY`).value);
        const rotZ = parseFloat(document.getElementById(`${prefix}-rotZ`).value);


        return { type: 'magnet', shape, strengthGrade, dimensions, orientation: {x: rotX, y: rotY, z: rotZ} };
    }

    getObject2Config() {
        const type = this.object2Type.value;
        const dimensions = {};
        const rotX = parseFloat(document.getElementById(`object2-rotX`).value);
        const rotY = parseFloat(document.getElementById(`object2-rotY`).value);
        const rotZ = parseFloat(document.getElementById(`object2-rotZ`).value);
        const orientation = {x: rotX, y: rotY, z: rotZ};

        if (type === 'magnet') {
            const config = this.getMagnetConfig('magnet2');
            config.orientation = orientation; // ensure it uses object2's rotation
            return config;
        } else {
            // For steel plate/ball
            this.object2ConfigContainer.querySelectorAll('input[type="number"]').forEach(input => {
                dimensions[input.name] = parseFloat(input.value);
            });
            return { type, dimensions, orientation };
        }
    }


    updateForceDisplay(forceVector, obj1, obj2) {
        if (!forceVector || !obj1 || !obj2) {
            this.forceValueDisplay.textContent = `0 N`;
            this.forceTypeDisplay.textContent = `-`;
            return;
        }
        const magnitude = forceVector.length();
        this.forceValueDisplay.textContent = `${magnitude.toFixed(3)} N`;

        // Determine attraction/repulsion based on force direction relative to object positions
        // Force is ON obj2 BY obj1.
        // If forceVector points from obj1 towards obj2, it's attraction.
        const directionToObj2 = new THREE.Vector3().subVectors(obj2.position, obj1.position).normalize();
        const dotProduct = forceVector.dot(directionToObj2);

        if (obj2 instanceof FerromagneticObject) { // Assuming FerromagneticObject class is defined
             this.forceTypeDisplay.textContent = "Attraction";
        } else { // Magnet to Magnet
            this.forceTypeDisplay.textContent = dotProduct > 0 ? "Attraction" : "Repulsion";
        }
    }

    getDistance() {
        return parseFloat(this.distanceSlider.value);
    }
}