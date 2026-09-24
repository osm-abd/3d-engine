// Reference content for every part in the viewer.
// Figures are for the GM LS3 (6.2 L Gen IV small block), the engine the model's
// proportions follow, from GM Performance Parts specification sheets. General
// engineering notes follow standard texts: Heywood, Internal Combustion Engine
// Fundamentals; Hoag & Dondlinger, Vehicular Engine Design; and the Bosch
// Automotive Handbook.

export const GROUPS = [
  { id: 'block', name: 'Block & bottom end' },
  { id: 'rotating', name: 'Rotating assembly' },
  { id: 'heads', name: 'Cylinder heads & ignition' },
  { id: 'valvetrain', name: 'Valvetrain' },
  { id: 'intake', name: 'Intake & fuel' },
  { id: 'exhaust', name: 'Exhaust' },
  { id: 'lube', name: 'Lubrication' },
  { id: 'front', name: 'Front drive & accessories' },
];

export const OVERVIEW = {
  name: 'The V8 engine',
  latin: '6.2 L pushrod V8 · 90° bank angle · cross-plane crankshaft',
  summary:
    'Eight cylinders in two banks of four, set at 90° to each other over a single crankshaft. Each pair of opposite cylinders shares one crank pin, so the engine is short and stiff, and with a cross-plane crank it fires every 90° of rotation for a smooth, continuous delivery of torque.',
  sections: [
    ['How to use', [
      'Drag to rotate, scroll or pinch to zoom, right-drag (or two-finger drag) to pan.',
      'Click any part, on the model or in the list, to focus on it and read about it. Then move the slider (or press “Pop out”) to slide it out of the engine.',
      '“Explode” pulls every part away from the block along the direction it is removed in a real teardown.',
      '“Run” turns the crankshaft slowly: pistons, rods, camshaft, lifters, pushrods, rockers, valves and springs all move with correct timing.',
      '“Cut” slices the engine across cylinders 1 and 2 to show the classic V cross-section.',
    ]],
    ['Key numbers (LS3)', [
      'Displacement 6,162 cm³ (376 in³): bore 103.25 mm (4.065 in) × stroke 92.0 mm (3.622 in).',
      'Compression ratio 10.7 : 1. Output 430 hp (321 kW) at 5,900 rpm and 424 lb·ft (575 N·m) at 4,600 rpm.',
      'Bore spacing 111.76 mm (4.400 in); deck height 234.7 mm (9.240 in); connecting rods 154.9 mm (6.098 in).',
      'Firing order 1-8-7-2-6-5-4-3; one power stroke every 90° of crank rotation.',
      'Two valves per cylinder (16 in total) worked by one camshaft in the block through hydraulic roller lifters, pushrods and 1.7 : 1 rocker arms.',
    ]],
    ['The four-stroke cycle', [
      'Intake: the piston descends with the intake valve open, drawing in air and fuel.',
      'Compression: both valves shut and the piston rises, squeezing the charge to about 1/10.7 of its volume.',
      'Power: the spark plug fires just before top dead centre; burning gas drives the piston down.',
      'Exhaust: the exhaust valve opens and the rising piston pushes spent gas out. Each cylinder completes the cycle every two crank revolutions, so the camshaft turns at half crank speed.',
    ]],
    ['Orientation', [
      'Front = timing end (belt, balancer, water pump); rear = flywheel end.',
      'Left bank = cylinders 1-3-5-7 (driver’s side in a left-hand-drive car); right bank = 2-4-6-8. The left bank sits slightly forward because the two rods on each crank pin are side by side.',
    ]],
  ],
  note: 'The 3D model is a schematic reconstruction for teaching. Main dimensions, valve sizes, cam timing and kinematics follow the LS3; castings are simplified and small hardware (bolts, sensors, hoses, wiring) is left out.',
};

export const PARTS = {
  cylinder_block: {
    name: 'Cylinder block',
    latin: 'Engine block · crankcase',
    group: 'block',
    summary:
      'The backbone of the engine: a single casting that holds the eight cylinder bores, supports the crankshaft and camshaft, and carries coolant and oil passages to everything else.',
    sections: [
      ['Construction', [
        'Cast aluminium alloy (319-type), about half the mass of an equivalent iron block.',
        'A 90° “Y-block” with deep skirts that extend below the crank centreline, forming a stiff box around the main bearings.',
        'The camshaft runs in a tunnel in the “valley” between the banks, directly above the crankshaft.',
        'Water jackets surround the bores; core (freeze) plugs close the holes left by the casting sand cores.',
      ]],
      ['In this engine', [
        'Bore spacing 4.400 in (111.76 mm) — the defining small-block dimension since 1955.',
        'Deck height 9.240 in (234.7 mm) from crank centreline to the head face.',
        'Siamesed bores leave only about 8.5 mm of metal between neighbouring cylinders.',
      ]],
      ['Failure & service', [
        'Overheating can warp the deck, causing head-gasket leaks; decks are checked with a straightedge and skimmed if needed.',
        'Main-bearing bores are line-honed as a set so all five stay concentric.',
      ]],
    ],
  },
  cylinder_liners: {
    name: 'Cylinder liners',
    latin: 'Cast-iron sleeves',
    group: 'block',
    summary:
      'Thin iron tubes cast into the aluminium block. They give the pistons and rings a hard, wear-resistant running surface that aluminium alone could not provide.',
    sections: [
      ['Function', [
        'Carry the rubbing load of the piston rings and hold a fine cross-hatch hone pattern that retains an oil film.',
        'Conduct combustion heat from the gas side to the coolant in the surrounding water jacket.',
      ]],
      ['Construction', [
        'Centrifugally cast grey iron, placed in the mould so the aluminium solidifies around them (“cast-in” dry liners).',
        'Wall thickness is only a few millimetres, which limits how far the bores can be over-bored.',
      ]],
      ['Service', [
        'Worn bores show a ridge at the top of ring travel; they are re-honed or bored oversize with matching pistons.',
      ]],
    ],
  },
  main_caps: {
    name: 'Main bearing caps',
    latin: 'Six-bolt, cross-bolted caps',
    group: 'block',
    summary:
      'Five iron caps that clamp the crankshaft’s main bearings into the block. Each is held by four vertical bolts plus two horizontal “cross bolts” through the block skirts.',
    sections: [
      ['Function', [
        'Carry the downward share of firing loads and the inertia loads of the rotating assembly.',
        'Cross-bolting ties the skirts together so the caps cannot “walk” sideways at high rpm.',
      ]],
      ['Construction', [
        'Powder-metal or nodular iron, machined together with the block; every cap is numbered and must go back in the same place, the same way round.',
        'The centre or rear cap usually carries the thrust bearing that locates the crank end-to-end.',
      ]],
      ['Failure & service', [
        'Oil starvation spins bearings and damages the cap bores, which then need line-boring.',
        'Bolts are torque-to-yield and are tightened in a set sequence.',
      ]],
    ],
  },
  oil_pan: {
    name: 'Oil pan',
    latin: 'Sump',
    group: 'lube',
    summary:
      'The reservoir under the crankcase that holds the engine oil. On the LS it is a structural aluminium casting bolted to both the block and the transmission.',
    sections: [
      ['Function', [
        'Stores roughly 5–6 quarts of oil (varies by application) and lets it cool and de-aerate before it is picked up again.',
        'Internal baffles and a windage tray keep oil round the pickup during hard cornering and braking.',
        'Adds stiffness to the lower block and engine–gearbox joint.',
      ]],
      ['Details', [
        'The drain plug sits at the lowest point; many LS pans also carry the oil filter mount and the oil-level sensor.',
        'Pan shape varies by car: shallow front-sump for trucks, rear-sump for the Camaro, and dry-sump systems on some Corvettes.',
      ]],
    ],
  },
  crankshaft: {
    name: 'Crankshaft',
    latin: 'Cross-plane crank, 92 mm stroke',
    group: 'rotating',
    summary:
      'Turns the up-and-down motion of the pistons into rotation. Its four crank pins are set at 90° intervals (0°, 90°, 270°, 180°), so seen from the end they form a cross — hence “cross-plane”.',
    sections: [
      ['Function', [
        'Each crank pin carries two connecting rods, one from each bank.',
        'Five main journals support it in the block; counterweights opposite each pin balance the rotating mass.',
        'The nose drives the timing chain, oil pump and harmonic balancer; the rear flange carries the flywheel.',
      ]],
      ['Why cross-plane?', [
        'It gives even 90° firing intervals and allows full balancing of primary forces and couples with counterweights.',
        'The cost: each bank fires unevenly, producing the traditional American V8 “burble” and making tuned exhaust headers harder. Flat-plane V8s (Ferrari, Mustang GT350) make the opposite trade-off.',
      ]],
      ['In this engine', [
        'Nodular cast iron with induction-hardened journals; 46 mm throw for a 92 mm stroke.',
        'Main journals ≈ 65 mm (2.559 in), crank pins ≈ 53 mm (2.100 in).',
        'A 58-tooth reluctor wheel on the crank tells the engine computer the exact crank angle.',
      ]],
    ],
  },
  connecting_rods: {
    name: 'Connecting rods',
    latin: 'I-beam rods, 6.098 in centres',
    group: 'rotating',
    summary:
      'Link each piston to the crankshaft. The small end pivots on the piston’s wrist pin, the big end wraps around the crank pin on a split plain bearing.',
    sections: [
      ['Function', [
        'Transmit combustion force (several tonnes at peak cylinder pressure) in compression and the piston’s inertia in tension near top dead centre.',
        'The rod swings from side to side as the crank turns; rod length / throw (here ≈ 3.4) sets how much side thrust the piston puts on the bore.',
      ]],
      ['Construction', [
        'Powder-metal steel, forged to shape, with an I-beam shank for stiffness at low mass.',
        'The big-end cap is “cracked” off the rod after machining, so the rough fracture faces lock back together precisely.',
        'Two rods share each crank pin, which is why the left bank sits 21 mm ahead of the right.',
      ]],
      ['Failure & service', [
        'Over-revving or oil starvation can stretch the rod bolts or spin a bearing; a broken rod usually destroys the block.',
      ]],
    ],
  },
  pistons: {
    name: 'Pistons',
    latin: 'Hypereutectic aluminium, 103.25 mm',
    group: 'rotating',
    summary:
      'Form the moving floor of each combustion chamber. The pressure of the burning charge pushes on the crown, and the piston passes that force through the wrist pin to the rod.',
    sections: [
      ['Anatomy', [
        'Crown: faces the combustion chamber; valve reliefs give clearance for the open valves.',
        'Ring belt: two compression rings seal gas, the third (oil-control) ring scrapes excess oil back down the bore.',
        'Skirt: guides the piston in the bore and takes the side thrust; often graphite- or polymer-coated.',
        'Wrist (gudgeon) pin: a hardened steel pin, free-floating or pressed into the rod.',
      ]],
      ['In this engine', [
        'Compression height ≈ 33.8 mm, so at top dead centre the crown sits level with the deck.',
        'Mean piston speed at the 5,900 rpm power peak ≈ 18 m/s; peak acceleration exceeds 2,000 g.',
      ]],
      ['Failure & service', [
        'Detonation (knock) cracks ring lands or melts crowns; worn rings raise oil consumption and blow-by.',
      ]],
    ],
  },
  flywheel: {
    name: 'Flywheel',
    latin: 'With starter ring gear',
    group: 'rotating',
    summary:
      'A heavy disc on the rear of the crankshaft. It stores rotational energy to carry the engine smoothly between power strokes, and its toothed ring gear lets the starter turn the engine.',
    sections: [
      ['Function', [
        'Smooths the torque pulses from each firing, especially at idle.',
        'Provides the friction face for the clutch (manual gearbox) — automatics use a thin flexplate and torque converter instead.',
        'The outer ring gear meshes with the starter pinion; ring gears of 168 teeth are common on LS engines.',
      ]],
      ['Trade-offs', [
        'A lighter flywheel lets the engine rev more quickly but makes idle and pulling away less smooth.',
      ]],
    ],
  },
  harmonic_balancer: {
    name: 'Harmonic balancer',
    latin: 'Torsional vibration damper & crank pulley',
    group: 'rotating',
    summary:
      'Bolted to the crank nose. An outer inertia ring bonded to the hub by rubber absorbs the crankshaft’s twisting vibrations, and its grooved face drives the accessory belt.',
    sections: [
      ['Function', [
        'Each power stroke twists the long crank slightly; at certain speeds these twists resonate. The rubber-mounted ring moves out of phase and dissipates that energy as heat.',
        'The ribbed pulley drives the water pump, alternator and (in a car) power-steering and A/C compressor.',
      ]],
      ['Failure & service', [
        'The rubber ages and the ring can slip or separate — a wobbling pulley is a warning sign.',
        'LS balancers are a press fit on the crank nose and need a special tool to install.',
      ]],
    ],
  },
  cylinder_heads: {
    name: 'Cylinder heads',
    latin: 'Cast aluminium, rectangular ports',
    group: 'heads',
    summary:
      'Close the top of each bank of cylinders. Each head contains the combustion chambers, intake and exhaust ports, valve guides and seats, spark plug holes and the rocker arm mountings.',
    sections: [
      ['Function', [
        'Shape the air flow into and out of the cylinders — the ports and chambers largely decide how much power the engine makes.',
        'Carry coolant close to the chambers and valve seats, the hottest parts of the engine.',
      ]],
      ['In this engine', [
        'L92-type heads: tall rectangular intake ports and 68 cm³ combustion chambers.',
        'Valves inclined about 15° from the bore axis; intake valve 2.165 in (55.0 mm), exhaust 1.590 in (40.4 mm).',
        'Both heads are identical; valve order front-to-rear is E-I-I-E-E-I-I-E.',
      ]],
      ['Failure & service', [
        'Overheating warps heads and cracks seats; a “valve job” re-cuts the seats and faces.',
      ]],
    ],
  },
  head_gaskets: {
    name: 'Head gaskets',
    latin: 'Multi-layer steel (MLS)',
    group: 'heads',
    summary:
      'Thin seals clamped between block and head. They seal combustion pressure around each bore and keep coolant and oil passages separate.',
    sections: [
      ['Construction', [
        'Several layers of embossed stainless steel with elastomer coatings; the embossed beads around the bores act as springs that keep sealing as parts expand.',
        'Compressed thickness is about 1.3 mm (0.051 in) on the LS, which also sets part of the compression ratio.',
      ]],
      ['Failure & service', [
        'A failed gasket can leak combustion gas into the coolant, coolant into the cylinders (white exhaust smoke) or oil into the coolant.',
        'Replacement requires new, torque-to-yield head bolts.',
      ]],
    ],
  },
  valve_covers: {
    name: 'Valve covers',
    latin: 'Rocker covers',
    group: 'heads',
    summary:
      'Lightweight lids on top of each head that enclose the rocker arms and valve springs, keep oil in and dirt out, and on the LS carry the ignition coils.',
    sections: [
      ['Details', [
        'Cast magnesium or aluminium, or moulded composite, with an oil filler cap and a crankcase-ventilation (PCV) connection.',
        'Internal baffles stop oil splashed by the rockers from being drawn into the PCV system.',
      ]],
      ['Service', [
        'The gasket (usually a reusable moulded rubber seal) is the most common oil leak on older engines.',
      ]],
    ],
  },
  spark_plugs: {
    name: 'Spark plugs',
    latin: 'Iridium-tipped, one per cylinder',
    group: 'heads',
    summary:
      'Screwed into each combustion chamber from the exhaust side of the head. A high-voltage pulse jumps the electrode gap and ignites the compressed charge.',
    sections: [
      ['Function', [
        'Ignition is timed a few degrees before top dead centre (more at high rpm) so peak pressure arrives just after TDC.',
        'Plugs must shed heat fast enough to avoid pre-ignition but stay hot enough to burn off deposits — the “heat range”.',
      ]],
      ['Details', [
        'Iridium or platinum tips resist erosion; typical service life is 100,000 miles (160,000 km).',
        'The LS mounts its plugs at an angle, so they are reached from the side of the engine next to the exhaust manifolds.',
      ]],
    ],
  },
  ignition_coils: {
    name: 'Ignition coils',
    latin: 'Coil-near-plug, one per cylinder',
    group: 'heads',
    summary:
      'Eight individual coils, mounted on brackets on the valve covers, each feeding its own spark plug through a short lead.',
    sections: [
      ['Function', [
        'Each coil is a transformer: the computer switches ~14 V through the primary winding, and when it stops, the collapsing field induces tens of kilovolts in the secondary.',
        'With one coil per cylinder there is no distributor, and each coil has longer to charge between sparks.',
      ]],
      ['Failure & service', [
        'A failing coil causes a misfire on one cylinder, which the engine computer reports with a cylinder-specific fault code.',
      ]],
    ],
  },
  camshaft: {
    name: 'Camshaft',
    latin: 'Single cam in block, 16 lobes',
    group: 'valvetrain',
    summary:
      'A single shaft in the block valley with one lobe per valve. It turns at half crankshaft speed, and its lobes decide exactly when each valve opens, how far and for how long.',
    sections: [
      ['Function', [
        'Each lobe lifts a roller lifter; the motion travels up a pushrod to a rocker arm that pushes the valve open.',
        'One cam serves both banks — the defining feature of a “pushrod” or overhead-valve (OHV) engine, which keeps the engine compact and low.',
      ]],
      ['In this engine (LS3)', [
        'Lobe lift ≈ 8.2 mm (0.324 in) intake and 7.8 mm (0.306 in) exhaust, giving 14.0 / 13.3 mm (0.551 / 0.522 in) at the valve.',
        'Duration 204° / 211° at 0.050 in lift, on a 117° lobe separation angle.',
        'Steel billet core with five large bearing journals, so the cam slides out through the front of the block.',
      ]],
      ['See it move', [
        'Press “Run”: the lobes you can see nudging the lifters are in firing order 1-8-7-2-6-5-4-3.',
      ]],
    ],
  },
  timing_set: {
    name: 'Timing chain & sprockets',
    latin: 'Cam drive, 2 : 1',
    group: 'valvetrain',
    summary:
      'A roller chain links a small sprocket on the crank nose to a sprocket on the camshaft with twice as many teeth, so the cam turns once for every two crank revolutions.',
    sections: [
      ['Function', [
        'Keeps valve timing locked to piston position. If the chain jumps a tooth, timing is lost; on many engines the valves can then strike the pistons.',
        'A tensioner and guide keep the chain from slapping as it wears.',
      ]],
      ['Details', [
        'Gen IV cam sprockets also carry the reluctor for the camshaft position sensor, mounted in the front cover.',
        'Engines with variable valve timing replace the cam sprocket with a hydraulic phaser.',
      ]],
    ],
  },
  lifters: {
    name: 'Hydraulic roller lifters',
    latin: 'Tappets / cam followers',
    group: 'valvetrain',
    summary:
      'Sixteen cylindrical followers that ride on the cam lobes on small rollers and push up on the pushrods. An oil-filled plunger inside takes up all clearance automatically.',
    sections: [
      ['Function', [
        'The roller cuts friction and allows steeper, more aggressive lobe profiles than a flat tappet.',
        'Engine oil pressure fills the internal plunger, so the valvetrain runs with zero lash and needs no periodic adjustment.',
      ]],
      ['Details', [
        'Body diameter 0.842 in (21.4 mm); pairs are held in plastic guide trays that stop them rotating.',
        'Engines with cylinder deactivation (AFM/DFM) use special lifters that can collapse to keep a valve shut.',
      ]],
      ['Failure & service', [
        'A sticking or collapsed lifter makes a ticking noise; a failed roller can wipe out the cam lobe.',
      ]],
    ],
  },
  pushrods: {
    name: 'Pushrods',
    latin: 'Hollow steel tubes',
    group: 'valvetrain',
    summary:
      'Slim tubes that carry each lifter’s motion from the cam in the valley up through the head to its rocker arm.',
    sections: [
      ['Details', [
        'Stock length is about 7.4 in (188 mm), 5/16 in (7.9 mm) diameter, with ball-shaped ends.',
        'They are hollow so oil pumped up from the lifter can lubricate the rocker arm.',
        'Must be stiff: any bending at high rpm lets the valve motion lag the cam profile, which limits the engine’s safe rev range.',
      ]],
    ],
  },
  rocker_arms: {
    name: 'Rocker arms',
    latin: '1.7 : 1 roller-trunnion rockers',
    group: 'valvetrain',
    summary:
      'Levers on top of the head. The pushrod lifts one end, and the other end pushes the valve open — multiplied by the rocker ratio.',
    sections: [
      ['Function', [
        'With a 1.7 : 1 ratio, 8.2 mm of lift at the lobe becomes 14 mm at the valve.',
        'The rocker also reverses the motion: pushrod up, valve down into the cylinder.',
      ]],
      ['Details', [
        'Pairs sit on a pedestal rail and pivot on needle-roller trunnion bearings; a roller tip rolls over the valve stem.',
        'LS3/L92 heads use offset intake rockers because the intake valve was moved to straighten the port.',
      ]],
    ],
  },
  intake_valves: {
    name: 'Intake valves',
    latin: 'Poppet valves, 55.0 mm head',
    group: 'valvetrain',
    summary:
      'The larger of the two valves in each chamber. They open during the intake stroke to let the air–fuel charge flow into the cylinder.',
    sections: [
      ['Details', [
        'Head diameter 2.165 in (55.0 mm), stem 8 mm; solid steel with a hardened tip.',
        'Opens about 27° before TDC and closes well after bottom dead centre, using the inertia of the incoming air to pack the cylinder.',
        'Larger than the exhaust valve because the intake stroke is driven only by atmospheric pressure, whereas exhaust gas leaves under pressure.',
      ]],
      ['Failure & service', [
        'Carbon build-up on the back of intake valves is a known problem on direct-injection engines; port injection, as here, washes them with fuel.',
      ]],
    ],
  },
  exhaust_valves: {
    name: 'Exhaust valves',
    latin: 'Poppet valves, 40.4 mm head',
    group: 'valvetrain',
    summary:
      'The smaller valve in each chamber. It opens near the end of the power stroke and stays open while the piston pushes the burnt gas out.',
    sections: [
      ['Details', [
        'Head diameter 1.590 in (40.4 mm); runs at 700 °C or more, so it is made of heat-resistant steel.',
        'Opening before bottom dead centre (“blowdown”) lets cylinder pressure do most of the work of emptying the cylinder.',
        'Heat escapes mainly through the seat when closed and through the stem and guide.',
      ]],
      ['Failure & service', [
        'A poorly seating exhaust valve overheats and “burns”, causing a dead cylinder.',
      ]],
    ],
  },
  valve_springs: {
    name: 'Valve springs',
    latin: 'Beehive springs',
    group: 'valvetrain',
    summary:
      'Coil springs that close each valve and keep the whole valvetrain — rocker, pushrod and lifter — pressed against the cam lobe.',
    sections: [
      ['Function', [
        'Must be stiff enough to follow the cam’s closing ramp at maximum rpm; otherwise the valve “floats” and can hit the piston.',
        'The spring is held on the valve by a retainer and two tapered locks (keepers).',
      ]],
      ['Details', [
        'LS3 uses tapered “beehive” springs: the smaller top coils reduce moving mass and resist harmful surge vibrations.',
        'Watch them compress as the valves open while the engine runs.',
      ]],
    ],
  },
  intake_manifold: {
    name: 'Intake manifold',
    latin: 'Composite plenum & runners',
    group: 'intake',
    summary:
      'Sits in the valley between the banks. Air enters a central plenum through the throttle body and is shared out to eight long runners, one per intake port.',
    sections: [
      ['Function', [
        'Runner length and plenum volume are tuned so pressure waves arrive at the intake valve just as it closes, boosting cylinder filling in the main rev range.',
        'Equal-length runners give every cylinder the same breathing.',
      ]],
      ['Details', [
        'Moulded from glass-reinforced nylon, which is light and keeps the incoming air cooler than aluminium would.',
        'Carries the fuel rails and injectors, and on the LS3 is shaped to clear the car’s low bonnet line.',
      ]],
    ],
  },
  throttle_body: {
    name: 'Throttle body',
    latin: 'Electronic, 90 mm bore',
    group: 'intake',
    summary:
      'A butterfly valve at the front of the plenum that meters how much air the engine can draw in, and so controls its power output.',
    sections: [
      ['Function', [
        'Drive-by-wire: the accelerator pedal is a sensor, and the engine computer moves the throttle plate with an electric motor.',
        'Two position sensors cross-check each other for safety; the computer also uses the throttle for idle speed and traction control.',
      ]],
    ],
  },
  fuel_rails: {
    name: 'Fuel rails & injectors',
    latin: 'Sequential port fuel injection',
    group: 'intake',
    summary:
      'A pressurised rail runs along each bank and feeds eight injectors, which spray fuel into the intake ports just behind the intake valves.',
    sections: [
      ['Function', [
        'The engine computer opens each injector for a few milliseconds, once per cycle, timed to its own cylinder’s intake stroke (sequential injection).',
        'Pulse width sets the amount of fuel; the oxygen sensors in the exhaust trim it to the ideal (stoichiometric) ratio of about 14.7 : 1 by mass.',
      ]],
      ['Details', [
        'Rail pressure on LS engines is about 58 psi (4 bar); a crossover tube at the rear links the two rails.',
      ]],
    ],
  },
  exhaust_manifolds: {
    name: 'Exhaust manifolds',
    latin: 'Cast iron or stainless headers',
    group: 'exhaust',
    summary:
      'Collect the hot gas from the four exhaust ports on each bank and route it into the exhaust system, catalytic converters and silencers.',
    sections: [
      ['Details', [
        'Gas leaves the ports at 600–900 °C; manifolds are made from cast iron, or thin-wall stainless tube (“headers”) on performance cars.',
        'Short, compact manifolds heat the catalytic converters quickly after a cold start, which matters for emissions.',
        'On a cross-plane V8 each bank fires unevenly (e.g. 1-7-5-3 on the left), which gives the typical V8 sound.',
      ]],
      ['Failure & service', [
        'Heat cycling cracks manifolds or breaks their studs, making a ticking exhaust leak when cold.',
      ]],
    ],
  },
  oil_pump: {
    name: 'Oil pump',
    latin: 'Crank-driven gerotor pump',
    group: 'lube',
    summary:
      'Bolted to the front of the block around the crank nose, which drives it directly. It pulls oil from the pan and pushes it through the filter to every bearing.',
    sections: [
      ['Function', [
        'A gerotor: an inner lobed rotor turns inside an outer rotor with one more lobe, trapping and moving pockets of oil.',
        'A spring-loaded relief valve caps pressure at high rpm, when the pump could deliver far more than the engine needs.',
        'Oil galleries carry it to the main and rod bearings, cam bearings, lifters, and up the pushrods to the rockers.',
      ]],
      ['Why it matters', [
        'Plain bearings float on a pressurised oil film only thousandths of a millimetre thick; losing pressure destroys them within seconds.',
      ]],
    ],
  },
  oil_pickup: {
    name: 'Oil pickup',
    latin: 'Pickup tube & screen',
    group: 'lube',
    summary:
      'A tube from the oil pump down into the deepest part of the pan, ending in a mesh screen that keeps large debris out of the pump.',
    sections: [
      ['Details', [
        'Its inlet sits a few millimetres above the pan floor so it stays submerged even when the oil sloshes.',
        'The joint to the pump is sealed by an O-ring; a leaking or missing O-ring lets the pump suck air and oil pressure falls.',
      ]],
    ],
  },
  oil_filter: {
    name: 'Oil filter',
    latin: 'Full-flow spin-on filter',
    group: 'lube',
    summary:
      'All the oil from the pump passes through this canister before it reaches the bearings, trapping wear metal, soot and dirt.',
    sections: [
      ['Details', [
        'Pleated paper or synthetic media inside a steel can, with an anti-drainback valve that keeps the filter full after shutdown.',
        'A bypass valve opens if the filter clogs or the oil is cold and thick, so the engine is never starved of oil.',
        'Changed with the oil, typically every 5,000–7,500 miles or as the car’s oil-life monitor advises.',
      ]],
    ],
  },
  front_cover: {
    name: 'Front cover',
    latin: 'Timing cover',
    group: 'front',
    summary:
      'Encloses the timing chain and oil pump at the front of the block. It holds the front crankshaft oil seal and, on Gen IV engines, the camshaft position sensor.',
    sections: [
      ['Details', [
        'Cast aluminium; the crank seal runs on the hub of the harmonic balancer.',
        'Must be centred on the crank during installation so the seal does not leak.',
      ]],
    ],
  },
  water_pump: {
    name: 'Water pump',
    latin: 'Belt-driven centrifugal pump',
    group: 'front',
    summary:
      'Circulates coolant through the block, heads and radiator. An impeller behind the pulley flings coolant outward into passages feeding both banks.',
    sections: [
      ['Function', [
        'Pumps coolant through the water jackets around the bores and combustion chambers, then to the radiator.',
        'A thermostat keeps the engine near 90–105 °C: it stays shut when cold so the engine warms quickly.',
      ]],
      ['Failure & service', [
        'A weep hole below the shaft seal drips coolant when the seal starts to fail — an early warning.',
      ]],
    ],
  },
  alternator: {
    name: 'Alternator',
    latin: 'Belt-driven AC generator',
    group: 'front',
    summary:
      'Generates electricity to charge the battery and run the car’s electrical systems once the engine is running.',
    sections: [
      ['Function', [
        'A spinning rotor electromagnet induces three-phase AC in the stator; a diode bridge rectifies it to DC.',
        'A regulator (often controlled by the engine computer) holds the system near 14 V.',
        'Driven faster than the crank — the pulley ratio is roughly 2.5–3 : 1 — so it charges at idle.',
      ]],
    ],
  },
  drive_belt: {
    name: 'Accessory drive belt',
    latin: 'Serpentine belt & idler',
    group: 'front',
    summary:
      'A single ribbed belt snakes around the crank pulley, water pump, alternator and idler pulleys, driving all the accessories at once.',
    sections: [
      ['Details', [
        'Multi-rib (“poly-V”) rubber belt; its back face drives some pulleys in the opposite direction.',
        'An automatic spring tensioner keeps it tight as it stretches; idlers route it around the front of the engine.',
        'Squealing on start-up or cracks across the ribs mean it is time for a new one.',
      ]],
    ],
  },
  starter: {
    name: 'Starter motor',
    latin: 'Pre-engaged DC motor',
    group: 'front',
    summary:
      'A powerful electric motor that turns the engine over to start it. A solenoid throws its small pinion gear into the flywheel ring gear.',
    sections: [
      ['Function', [
        'Draws 150–250 A from the battery to crank the engine at roughly 150–250 rpm, enough for the first firings.',
        'A one-way clutch stops the engine from over-spinning the motor once it fires; the solenoid then pulls the pinion back.',
      ]],
    ],
  },
};

// Soft atlas-style washes, loosely grouped by system.
export const COLORS = {
  cylinder_block: '#9fb7c9',
  cylinder_liners: '#c5cad3',
  main_caps: '#7f9bb3',
  oil_pan: '#b8c4a8',
  crankshaft: '#e9c46a',
  connecting_rods: '#f4a261',
  pistons: '#e5898f',
  flywheel: '#d4a373',
  harmonic_balancer: '#c9a26b',
  cylinder_heads: '#74c69d',
  head_gaskets: '#cdb4db',
  valve_covers: '#6f9fd8',
  spark_plugs: '#f6d365',
  ignition_coils: '#8d99ae',
  camshaft: '#b48ad6',
  timing_set: '#9a7fd1',
  lifters: '#4fb3b0',
  pushrods: '#3e9aa6',
  rocker_arms: '#9fd6cf',
  intake_valves: '#7ec8e3',
  exhaust_valves: '#e07a5f',
  valve_springs: '#d487b8',
  intake_manifold: '#b7c96a',
  throttle_body: '#93ad4a',
  fuel_rails: '#ffc857',
  exhaust_manifolds: '#ad8d6c',
  oil_pump: '#e3d7b8',
  oil_pickup: '#c2a47e',
  oil_filter: '#f28c5b',
  front_cover: '#8fb3a8',
  water_pump: '#5aa9d6',
  alternator: '#c9679d',
  drive_belt: '#8a8a8a',
  starter: '#957a5d',
};
