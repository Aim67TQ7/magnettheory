# magnettheory

I. Project Structure (Conceptual)
We can think of this in terms of modules or major components:
main.js / app.js: Entry point, initializes everything, orchestrates communication between modules.
UIManager.js: Handles all DOM interactions (sliders, dropdowns, buttons, text displays).
SceneManager.js (Three.js): Manages the 3D scene, camera, lights, rendering loop, and creating/updating 3D magnet objects.
PhysicsEngine.js: Contains the core logic for calculating magnetic forces.
Magnet.js (Class): A blueprint for magnet objects, storing properties like shape, dimensions, strength (Br), position, orientation.
FerromagneticObject.js (Class, optional): If treating steel objects distinctly from magnets in terms of properties.
Constants.js: For physical constants (μ₀), N-grade to Br mappings, material properties.

IMPORTANT: Real magnetic force calculations are hard.
The dipole-dipole model is good for far distances or small magnets. It breaks down for close, large magnets.
For specific shapes (e.g., two axially aligned cylinders), more accurate (but complex) analytical formulas exist. See papers or magnet manufacturer sites (e.g., K&J Magnetics' calculators are based on such formulas, though they don't always publish the exact ones).
Magnet-to-steel is often approximated by the "method of images" or using empirical formulas. The force is generally attractive. A very permeable material can roughly double the force compared to an identical magnet at contact.

III. Key Implementation Points & Challenges
Physics Accuracy:
Dipole-Dipole: Simplest general model. Accurate at large distances (R >> magnet size). Less accurate up close. Orientation matters greatly.
Shape-Specific Formulas: For axial alignment of simple shapes (cylinders, blocks), more complex but accurate formulas exist. Integrating these would be a significant upgrade.
Magnet-to-Steel: Often involves the "method of images" or empirical formulas based on magnet's surface field strength (related to Br) and contact area. Permeability of steel plays a role. Force is always attractive.
Off-axis & Complex Orientations: Extremely hard analytically. FEM solvers are used in professional tools. Dipole-dipole is often the only practical approximation for a web app unless restricting to specific cases.
N-Grade to Br: You'll need a lookup table. N_GRADES in Constants.js is a start.
Units: Be METICULOUS with units (Tesla, A/m, meters, Newtons). Convert mm from UI to meters for physics.
Three.js Visualization:
Magnet Meshes: CylinderGeometry (disc, ring base), BoxGeometry, SphereGeometry. For rings, you might fake it with two cylinders or use a TorusGeometry if axially magnetized. True ring geometry with poles is tricky.
Pole Coloring: For simple shapes, you can assign different materials to faces if the geometry supports it (e.g. Box, Cylinder). For spheres, it's harder without custom shaders or more complex geometry.
Rotation: object.rotation.set(x, y, z) (Euler angles in radians). Get from UI (degrees) and convert.
Force Arrows: THREE.ArrowHelper is perfect for this. Length proportional to magnitude, color for attraction/repulsion.
Field Lines: This is advanced.
Simplest: Calculate B-field vector at various points using dipole approximation for each magnet.
Trace lines: Start points near one pole, step along field vector, connect points.
Use THREE.LineSegments or THREE.Line.
Performance can be an issue for many, long lines.
UI Interactivity:
Dynamically show/hide dimension inputs based on selected shape.
Update 3D scene and force calculation in real-time on slider/select changes.
Debouncing input for performance might be needed if calculations are heavy.
"Adjustments to Consider" Implementation:
Magnetic Field Lines: Covered above. Start simple (dipole sum).
Comparison View: Store configurations (parameters + calculated force) in an array. Display them in a table or side-by-side UI elements. No need for multiple 3D scenes unless you want a very fancy comparison.
Preset Configurations: Hardcode some initial magnet1Config, object2Config, and distance values that the user can select from a dropdown.
Temperature Effects: This is very advanced. Magnet strength (Br) decreases with temperature, dropping to zero at the Curie temperature. You'd need Br(T) curves for specific materials. For a first pass, this is likely out of scope unless you have specific data.
IV. Development Workflow Suggestion
Basic HTML/CSS layout.
Setup Three.js scene: Camera, lights, renderer, orbit controls, basic cube.
Implement UIManager: Get controls working, log values to console.
Implement Magnet class: Store properties.
SceneManager - Create Magnets: Function to create/add a 3D magnet mesh based on Magnet properties.
Integrate UI and Scene: Change UI -> update magnet object in SceneManager.
PhysicsEngine - Dipole-Dipole: Implement the basic dipole-dipole force calculation.
Display Force: Show calculated force value in UI and as an arrow in 3D.
Refine and Add Shapes: Add all magnet shapes and their dimension controls.
Ferromagnetic Objects: Implement FerromagneticObject and simplified magnet-to-steel force.
Field Lines (Optional Stretch Goal): Implement basic field line visualization.
Advanced Features: Presets, comparison view.
Testing and Refinement: Crucial throughout.
This is a substantial project, but breaking it down makes it manageable. The physics accuracy will be the biggest ongoing challenge/compromise.
