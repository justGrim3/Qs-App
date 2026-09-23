export const DEFAULT_SECTIONS = [
  "Substructure",
  "Superstructure — Frame",
  "Superstructure — Envelope",
  "Internal finishes",
  "Services",
  "External works"
];

export const TEMPLATES = {
  "Substructure": [
    ["Site clearance","m²"],["Excavate topsoil for preservation","m³"],["Excavate to reduce level","m³"],
    ["Excavate foundation trench","m³"],["Earthwork support to excavation","m²"],["Compact bottom of excavation","m²"],
    ["Disposal of surplus excavated material","m³"],["Filling to make up levels","m³"],["Blinding","m²"],
    ["Mass concrete foundation","m³"],["Reinforced concrete foundation","m³"],["Formwork to foundation sides","m²"],
    ["Reinforcement","kg"],["Damp proof course","m²"],["Brickwork/blockwork below dpc","m²"]
  ],
  "Superstructure — Frame": [
    ["Reinforced concrete columns","m³"],["Formwork to columns","m²"],["Reinforcement to columns","kg"],
    ["Reinforced concrete beams","m³"],["Formwork to beams","m²"],["Reinforcement to beams","kg"],
    ["Structural steel frame","kg"],["Suspended slab concrete","m³"],["Formwork to soffit of slab","m²"],["Reinforcement to slab","kg"]
  ],
  "Superstructure — Envelope": [
    ["External walls in blockwork","m²"],["Facing brickwork","m²"],["Cavity wall insulation","m²"],
    ["Windows","nr"],["External doors","nr"],["Roof covering","m²"],["Roof insulation","m²"],["Rainwater goods","m"]
  ],
  "Internal finishes": [
    ["Plaster to walls","m²"],["Screed to floors","m²"],["Floor tiling","m²"],["Wall tiling","m²"],
    ["Painting to walls","m²"],["Suspended ceiling","m²"],["Skirting","m"]
  ],
  "Services": [
    ["Electrical power points","nr"],["Lighting points","nr"],["Sanitary fittings","nr"],
    ["Drainage pipework","m"],["Inspection chambers/manholes","nr"]
  ],
  "External works": [
    ["Site fencing","m"],["Paving","m²"],["Kerbs","m"],["Turfing/landscaping","m²"],["External drainage","m"]
  ]
};
