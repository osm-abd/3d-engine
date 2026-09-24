# Motor — an interactive 3D V8 engine

A browser-based study of a V8 engine, in the same style as the [Encephalon brain atlas](https://github.com/osm-abd/3d-brain): ink line-art over soft colour washes on a white background. Each part has its own colour, and the index shows matching swatches.

- **Rotate, zoom and pan** the model (drag / scroll / right-drag, or touch gestures).
- **Click any part** (on the model or in the index) to focus on it. The rest of the engine fades to a faint outline, the camera flies to the part, and the panel describes what it does, how it is built, its LS3 figures and how it fails. While a part is selected, the slider (or the **Pop out** button) slides it out of the engine along the direction it comes out in a real teardown.
- **Explode** (button, slider or <kbd>E</kbd>) pulls every part away from the block: heads, gaskets and valvetrain lift off along the bank axes, the intake rises out of the valley, the crank, main caps, pickup and pan drop down, and the front drive fans out forward.
- **Run** (<kbd>Space</kbd>) turns the engine over in slow motion. Pistons and rods follow true slider-crank kinematics on a cross-plane crank. The camshaft turns at half speed, and every lifter, pushrod, rocker, valve and spring follows its own cam lobe in firing order 1-8-7-2-6-5-4-3. This also works while exploded.
- **Cut** (<kbd>C</kbd>) slices the engine across cylinders 1 and 2. Cut faces are hatched, like a sectioned engineering drawing.
- You can hide any part from the index, or **Isolate** one. Standard views: L / R sides, F front, B rear, T top, U underside. <kbd>Esc</kbd> deselects and <kbd>R</kbd> resets.

To keep the page fast there are no floating 3D labels. The part under the cursor is named in a single line above the toolbar. The page stops rendering when nothing is moving.

## Parts (34 types, 131 pieces)

| Group | Parts |
| --- | --- |
| Block & bottom end | Cylinder block, cylinder liners, main bearing caps |
| Rotating assembly | Crankshaft, connecting rods ×8, pistons ×8, flywheel, harmonic balancer |
| Cylinder heads & ignition | Cylinder heads ×2, head gaskets ×2, valve covers ×2, spark plugs ×8, ignition coils ×8 |
| Valvetrain | Camshaft, timing chain & sprockets, roller lifters ×16, pushrods ×16, rocker arms ×16, intake valves ×8, exhaust valves ×8, valve springs ×16 |
| Intake & fuel | Intake manifold, throttle body, fuel rails & injectors |
| Exhaust | Exhaust manifolds ×2 |
| Lubrication | Oil pan, oil pump, oil pickup, oil filter |
| Front drive & accessories | Front cover, water pump, alternator, serpentine belt & idler, starter motor |

The engine is a 90° pushrod (OHV) V8 with two valves per cylinder and a cross-plane crank. Its main dimensions follow the GM LS3 (6.2 L Gen IV small block):

| | |
| --- | --- |
| Bore × stroke | 103.25 × 92.0 mm (4.065 × 3.622 in) |
| Bore spacing / deck height | 111.76 mm (4.400 in) / 234.7 mm (9.240 in) |
| Connecting rod | 154.9 mm (6.098 in) centres |
| Valves | 55.0 mm intake, 40.4 mm exhaust; 1.7 : 1 rockers |
| Valve lift | 14.0 / 13.3 mm (0.551 / 0.522 in) |
| Firing order | 1-8-7-2-6-5-4-3 (odd cylinders on the left bank) |

The text in `js/parts.js` follows GM Performance Parts specification sheets for the LS3 and standard references: Heywood's *Internal Combustion Engine Fundamentals*, Hoag & Dondlinger's *Vehicular Engine Design* and the Bosch *Automotive Handbook*.

**About the model:** the geometry is a *schematic* reconstruction for teaching. Every part is in its correct place relative to its neighbours and at the correct scale. Castings are simplified, and small hardware such as bolts, sensors, hoses and wiring is left out.

## Running locally

The site is static and needs no build step. Serve the folder over HTTP:

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

Three.js r170 is vendored in `vendor/`, so the site works offline. The only external request is for the Google Fonts stylesheet. The site also works on GitHub Pages without changes.

## How the geometry is made

All the geometry is generated in the browser at load time by `js/engine.js`. There is nothing to download beyond the scripts, and generation takes well under a second.

1. Parts are built in millimetres from extruded profiles, lathe (revolved) profiles, tubes and boxes: the block as a Y-section crankcase plus two bored barrel decks, crank webs as extruded counterweight profiles, cam lobes as extruded lift profiles, pistons with ring grooves, and so on.
2. Parts on a cylinder bank are modelled once in bank coordinates and mirrored for the other bank, which sits 21 mm further back because paired rods share a crank pin.
3. Each mesh gets creased normals, so machined edges stay crisp and curved surfaces stay smooth. Hard edges become ink lines, silhouettes come from an inverted hull that keeps a constant width in screen pixels, and shading uses screen-space hatching (see `js/materials.js`).
4. Moving parts get a transform for each crank angle (`kinematicMatrix`): slider-crank for pistons and rods, half-speed rotation for the cam, and cos² lift curves for the lifters, pushrods, rockers, valves and springs.

## Files

```
index.html          page shell
css/style.css       layout and typography
js/main.js          scene, interaction, explode / pop-out, run, section
js/engine.js        procedural geometry, layout and kinematics
js/materials.js     line-art shaders
js/parts.js         reference text and colours
vendor/             three.js (MIT)
```
