import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Magnet, FerromagneticObject } from './Magnet.js'; // Or separate FerromagneticObject

export class SceneManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, this.canvas.clientWidth / this.canvas.clientHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;


        this.objects = []; // Store magnet/ferro objects
        this.forceArrow = null;
        this.fieldLineMeshes = [];

        this._setupLights();
        this._setupCamera();
        this._setupControls();
        this._setupHelpers();

        this.animate = this.animate.bind(this);
        this.animate();
    }

    _setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 7.5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
    }

    _setupCamera() {
        this.camera.position.set(0.1, 0.15, 0.3); // Adjusted for mm dimensions becoming meters
        this.camera.lookAt(0, 0, 0);
    }

    _setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
    }

    _setupHelpers() {
        const axesHelper = new THREE.AxesHelper(0.1); // 100mm
        this.scene.add(axesHelper);
        const gridHelper = new THREE.GridHelper(0.5, 10); // 500mm grid, 10 subdivisions
        this.scene.add(gridHelper);
    }

    createObject(config) {
        let obj;
        let geometry;
        const material = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff });
        const poleMaterialN = new THREE.MeshStandardMaterial({ color: 0xff0000 }); // Red for North
        const poleMaterialS = new THREE.MeshStandardMaterial({ color: 0x0000ff }); // Blue for South


        if (config.type === 'magnet') {
             const magnetMaterial = new THREE.MeshStandardMaterial({
                color: 0xaaaaaa, // Grey for magnet body
                roughness: 0.5,
                metalness: 0.8
            });
            const poleNMaterial = new THREE.MeshStandardMaterial({ color: 0xff3333, emissive: 0x550000 });
            const poleSMaterial = new THREE.MeshStandardMaterial({ color: 0x3333ff, emissive: 0x000055 });


            obj = new Magnet(config);
            const d = config.dimensions; // in mm
            switch (obj.shape) {
                case 'disc':
                    geometry = new THREE.CylinderGeometry(d.diameter / 2000, d.diameter / 2000, d.thickness / 1000, 32);
                    // Assign materials for poles (top/bottom) and side
                    geometry.groups.forEach(group => {
                        if (group.materialIndex === 1) group.materialIndex = 0; // side
                    });
                    // top face (positive Y) - assume North pole
                    geometry.groups.find(g => Math.abs(g.normal.y - 1) < 0.1).materialIndex = 1;
                     // bottom face (negative Y) - assume South pole
                    geometry.groups.find(g => Math.abs(g.normal.y - (-1)) < 0.1).materialIndex = 2;

                    obj.mesh = new THREE.Mesh(geometry, [magnetMaterial, poleNMaterial, poleSMaterial]);
                    break;
                case 'block':
                    geometry = new THREE.BoxGeometry(d.width / 1000, d.height / 1000, d.length / 1000);
                     // Assuming magnetization along Y (height)
                    geometry.groups[4].materialIndex = 1; // +Y face (North)
                    geometry.groups[5].materialIndex = 2; // -Y face (South)
                    obj.mesh = new THREE.Mesh(geometry, [magnetMaterial, poleNMaterial, poleSMaterial]);
                    break;
                case 'ring':
                    // Inner radius, outer radius, height, radial segments, height segments, openEnded, thetaStart, thetaLength
                    geometry = new THREE.CylinderGeometry(d.outerDiameter / 2000, d.outerDiameter / 2000, d.thickness / 1000, 32, 1, true);
                    const innerCylGeom = new THREE.CylinderGeometry(d.innerDiameter / 2000, d.innerDiameter / 2000, d.thickness / 1000, 32, 1, true);
                    // This needs CSG (Constructive Solid Geometry) which Three.js doesn't directly support easily.
                    // For visualization, a torus might be simpler or two cylinders.
                    // For now, treating as a solid disc visually for simplicity.
                    geometry = new THREE.CylinderGeometry(d.outerDiameter / 2000, d.outerDiameter / 2000, d.thickness / 1000, 32);
                    geometry.groups.forEach(group => {
                        if (group.materialIndex === 1) group.materialIndex = 0; // side
                    });
                    geometry.groups.find(g => Math.abs(g.normal.y - 1) < 0.1).materialIndex = 1;
                    geometry.groups.find(g => Math.abs(g.normal.y - (-1)) < 0.1).materialIndex = 2;
                    obj.mesh = new THREE.Mesh(geometry, [magnetMaterial, poleNMaterial, poleSMaterial]);
                    break;
                case 'sphere':
                    geometry = new THREE.SphereGeometry(d.diameter / 2000, 32, 16);
                    // Sphere poles are harder to color distinctively without custom shaders or more complex geometry.
                    obj.mesh = new THREE.Mesh(geometry, magnetMaterial);
                    break;
            }
        } else { // Ferromagnetic object
            obj = new FerromagneticObject(config);
            const ferroMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness:0.3, metalness: 0.9 });
            const d = config.dimensions;
            switch (obj.type) {
                case 'steel-plate':
                    geometry = new THREE.BoxGeometry(d.width / 1000, d.thickness / 1000, d.length / 1000);
                    obj.mesh = new THREE.Mesh(geometry, ferroMaterial);
                    break;
                case 'steel-ball':
                    geometry = new THREE.SphereGeometry(d.diameter / 2000, 32, 16);
                    obj.mesh = new THREE.Mesh(geometry, ferroMaterial);
                    break;
            }
        }

        if (obj && obj.mesh) {
            obj.mesh.castShadow = true;
            obj.mesh.receiveShadow = true;
            obj.mesh.userData = { id: obj.id, classInstance: obj }; // Link mesh to object instance
            this.scene.add(obj.mesh);
            this.objects.push(obj);
            obj.updateMesh(); // Apply initial position/rotation
            return obj;
        }
        return null;
    }

    removeObject(objectInstance) {
        const index = this.objects.findIndex(obj => obj.id === objectInstance.id);
        if (index > -1) {
            this.scene.remove(objectInstance.mesh);
            objectInstance.mesh.geometry.dispose();
            // objectInstance.mesh.material.dispose(); // if not shared
            this.objects.splice(index, 1);
        }
    }

    updateObjectPositions(obj1, obj2, distanceMM) {
        const distanceM = distanceMM / 1000;
        if (obj1) obj1.position.set(-distanceM / 2, 0, 0);
        if (obj2) obj2.position.set(distanceM / 2, 0, 0);
        if (obj1) obj1.updateMesh();
        if (obj2) obj2.updateMesh();
    }

    updateObjectOrientation(objectInstance, eulerXYZ_degrees) {
        if(objectInstance) {
            objectInstance.orientation.set(
                THREE.MathUtils.degToRad(eulerXYZ_degrees.x),
                THREE.MathUtils.degToRad(eulerXYZ_degrees.y),
                THREE.MathUtils.degToRad(eulerXYZ_degrees.z)
            );
            objectInstance.updateMesh();
        }
    }


    displayForce(originObject, forceVector) {
        if (this.forceArrow) {
            this.scene.remove(this.forceArrow);
            this.forceArrow = null;
        }
        if (!originObject || !forceVector || forceVector.lengthSq() === 0) return;

        const origin = originObject.position.clone();
        const length = forceVector.length() * 0.005; // Scale force for visualization (adjust as needed)
        const hexColor = forceVector.dot(new THREE.Vector3(1,0,0).subVectors(originObject.position, this.objects.find(o => o !== originObject).position)) > 0 ? 0x00ff00 : 0xff0000; // Green for attraction, Red for repulsion (simplistic)
         // A better way: force vector pointing towards other object is attraction
        const otherObject = this.objects.find(o => o !== originObject);
        if (!otherObject) return;

        const directionToOther = new THREE.Vector3().subVectors(otherObject.position, originObject.position).normalize();
        const isAttraction = forceVector.dot(directionToOther) > 0;
        const color = isAttraction ? 0x00ff00 : 0xff0000; // Green for attraction, Red for repulsion

        this.forceArrow = new THREE.ArrowHelper(forceVector.clone().normalize(), origin, Math.max(0.01, length), color, 0.005, 0.003); // Min length, arrow params
        this.scene.add(this.forceArrow);
    }

    // Basic magnetic field line visualization (highly simplified)
    // This needs a proper field calculation (e.g., summing dipole fields)
    drawFieldLines(magnet1, magnet2) {
        this.clearFieldLines();
        if (!magnet1) return;

        const lines = 30; // Number of lines
        const segments = 50; // Segments per line
        const stepSize = 0.002; // Step size for tracing field lines (in meters)
        const maxDist = 0.3; // Max distance to trace

        // Function to get B field at a point (sum of dipoles)
        const getBField = (point) => {
            let B = new THREE.Vector3();
            this.objects.forEach(obj => {
                if (obj instanceof Magnet) {
                    const m = obj.getMagneticMomentVector();
                    const rVec = new THREE.Vector3().subVectors(point, obj.position);
                    const r = rVec.length();
                    if (r < 1e-4) return; // Too close
                    const rHat = rVec.clone().normalize();
                    // B_dipole = (μ0 / (4πr³)) * [3(m⋅r̂)r̂ - m]
                    const m_dot_rHat = m.dot(rHat);
                    const term1 = rHat.clone().multiplyScalar(3 * m_dot_rHat);
                    const term2 = m.clone();
                    const b_dipole_obj = term1.sub(term2).multiplyScalar(MU0 / (4 * Math.PI * Math.pow(r, 3)));
                    B.add(b_dipole_obj);
                }
            });
            return B;
        };

        // Trace from one pole (e.g., North pole of magnet1)
        // This is a very crude way to pick start points
        const startRadius = (magnet1.dimensions.diameter / 2000 || magnet1.dimensions.width / 2000 || 0.01) * 0.6;
        const startHeightOffset = (magnet1.dimensions.thickness / 2000 || magnet1.dimensions.height/2000 || 0.005);


        for (let i = 0; i < lines; i++) {
            const points = [];
            const angle = (i / lines) * 2 * Math.PI;
            // Starting points on a surface slightly above/around the magnet pole
            // This needs to be adapted based on actual pole orientation
            let startPoint = new THREE.Vector3(
                startRadius * Math.cos(angle),
                startHeightOffset * (magnet1.magnetizationDirection.y > 0 ? 1 : -1), // If magnetized along Y
                startRadius * Math.sin(angle)
            );
            // Transform startPoint from magnet's local to world space
            startPoint.applyEuler(magnet1.orientation);
            startPoint.add(magnet1.position);

            points.push(startPoint.clone());
            let currentPoint = startPoint.clone();
            let totalDist = 0;

            for (let j = 0; j < segments; j++) {
                const B = getBField(currentPoint);
                if (B.lengthSq() === 0) break;
                const dir = B.normalize();
                currentPoint.add(dir.multiplyScalar(stepSize));
                points.push(currentPoint.clone());
                totalDist += stepSize;
                if (totalDist > maxDist) break;
                // Check if point is inside another magnet (termination)
                if (magnet2 && currentPoint.distanceTo(magnet2.position) < (magnet2.dimensions.diameter / 2000 || 0.01)) break;
            }

            if (points.length > 1) {
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const material = new THREE.LineBasicMaterial({ color: 0x00dd00, transparent: true, opacity: 0.5 });
                const line = new THREE.Line(geometry, material);
                this.scene.add(line);
                this.fieldLineMeshes.push(line);
            }
        }
    }

    clearFieldLines() {
        this.fieldLineMeshes.forEach(line => {
            this.scene.remove(line);
            line.geometry.dispose();
            line.material.dispose();
        });
        this.fieldLineMeshes = [];
    }


    resizeRendererToDisplaySize() {
        const { width, height, clientWidth, clientHeight } = this.canvas;
        const needResize = width !== clientWidth || height !== clientHeight;
        if (needResize) {
            this.renderer.setSize(clientWidth, clientHeight, false);
            this.camera.aspect = clientWidth / clientHeight;
            this.camera.updateProjectionMatrix();
        }
        return needResize;
    }

    animate() {
        requestAnimationFrame(this.animate);
        this.resizeRendererToDisplaySize();
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    resetCamera() {
        this._setupCamera(); // Re-apply initial camera settings
        this.controls.target.set(0,0,0); // Reset orbit controls target
        this.controls.update();
    }
}