// Flat lesson slugs must be unique across all modules (used as the route param).
export const MODULES = [
  {
    slug: 'basics',
    title: 'The standard method',
    quiz: [
      { q: 'What does "timesing" mean on a dimension sheet?', options: ['The date a dimension was taken', 'The multiplier applied for repeated identical items', 'The unit of measurement used', 'A drawing revision number'], correct: 1 },
      { q: 'Squaring for an area (m²) requires multiplying timesing by:', options: ['Length only', 'Length × width', 'Length × width × height', 'Nothing — areas need no multiplication'], correct: 1 },
      { q: 'Why record dimensions on a sheet instead of writing only the final total?', options: ['It looks more official', 'So someone else can check the working later', "It's required by law", "It's faster than a calculator"], correct: 1 },
      { q: 'A "count" item, billed as "nr", is quantified as:', options: ['Length × width', 'The timesing value itself', 'Length only', 'Always exactly 1'], correct: 1 }
    ],
    lessons: [
      {
        slug: 'what-is-takeoff',
        title: 'What is a takeoff?',
        body: [
          'A "takeoff" is the process of measuring quantities of work from drawings or from a real building, so they can be priced. Every bill of quantities starts here.',
          'The standard method records three things for every measured item: the timesing (how many times it repeats), the dimensions (length, width, height as needed), and the resulting squaring (the calculated quantity).',
          'Working this way — rather than jumping straight to a total — means anyone can check your working later, including you, a week from now.'
        ],
        practice: null
      },
      {
        slug: 'timesing-squaring',
        title: 'Timesing & squaring',
        body: [
          'Squaring is simply multiplication: timesing × length × width × height, using only the dimensions that apply to the unit you are measuring.',
          'An area (m²) needs length × width. A volume (m³) needs length × width × height. A length (m) needs no multiplication at all beyond timesing. A count (nr) is just the timesing value itself.',
          'Try the practice below — it gives you a fresh set of numbers each time.'
        ],
        practice: { type: 'squaring' }
      }
    ]
  },
  {
    slug: 'abstracting',
    title: 'Abstracting & billing',
    quiz: [
      { q: 'What is abstracting?', options: ['Drawing a sketch of the site', 'Collecting matching descriptions from dimension sheets and totalling them', 'Rounding a quantity up for safety', 'Deleting unused dimension rows'], correct: 1 },
      { q: 'A priced BOQ line\'s "amount" is calculated as:', options: ['Quantity + rate', 'Quantity × rate', 'Rate ÷ quantity', 'A fixed value set by the client'], correct: 1 },
      { q: 'A rate should normally reflect:', options: ['Materials cost only', 'Labour cost only', 'Materials, labour, and a share of overheads and profit', 'Whatever the previous project charged, unchanged'], correct: 2 }
    ],
    lessons: [
      {
        slug: 'what-is-abstracting',
        title: 'What is abstracting?',
        body: [
          'A real takeoff produces many dimension-sheet rows — often several for the same item, measured in different places.',
          'Abstracting is collecting every row with the same description and unit, and adding their squaring together into one total. That total is what actually appears in the bill.',
          'Try the practice below: add up the matching rows yourself before checking the answer.'
        ],
        practice: { type: 'abstract' }
      },
      {
        slug: 'billing-basics',
        title: 'From abstract to bill',
        body: [
          'Once quantities are abstracted, billing is just attaching a rate (a price per unit) to each one and multiplying — quantity × rate = amount.',
          'A rate should reflect everything needed to complete that item: materials, labour, and a fair share of overheads and profit, unless your method separates those out elsewhere.',
          'Keep a personal rate list rather than pricing from memory each time — consistency matters as much as accuracy.'
        ],
        practice: null
      }
    ]
  },
  {
    slug: 'drawings',
    title: 'Reading drawings & scale',
    quiz: [
      { q: 'A drawing at 1:100 means 1 unit on paper represents:', options: ['1 unit in real life', '10 units in real life', '100 units in real life', 'It depends on the paper size'], correct: 2 },
      { q: 'Before trusting a scaled measurement, you should:', options: ['Assume the PDF was never resized', 'Check the scale against a known printed dimension', 'Only check the drawing date', 'Multiply everything by 2 to be safe'], correct: 1 },
      { q: '"Net" measurement, compared to "gross", typically:', options: ['Includes all openings regardless of size', 'Deducts voids like door and window openings', 'Ignores the wall entirely', 'Is always the larger of the two figures'], correct: 1 }
    ],
    lessons: [
      {
        slug: 'understanding-scale',
        title: 'Understanding scale',
        body: [
          'A drawing at 1:50 means 1 unit on the paper represents 50 of the same unit in real life. A 20 mm line on that drawing represents 1,000 mm — one metre — on the real building.',
          'Always check a drawing\u2019s stated scale against a known dimension before trusting anything scaled from it — a resized PDF or a photocopy can silently change the effective scale.',
          'Try the practice below with a few different scales.'
        ],
        practice: { type: 'scale' }
      },
      {
        slug: 'net-vs-gross',
        title: 'Net vs gross measurement',
        body: [
          'Net measurement deducts voids (like door and window openings) from an area. Gross measurement includes them, ignoring what interrupts the surface.',
          'Most methods of measurement only require small openings to be ignored (commonly under about 0.5 m²) — larger openings are deducted even under a "gross" convention. Always check which your method specifies.',
          'Getting this wrong is one of the most common takeoff mistakes, because it silently over- or under-states a quantity without looking obviously wrong.'
        ],
        practice: null
      }
    ]
  },
  {
    slug: 'units-rates',
    title: 'Units, rates & BOQ',
    quiz: [
      { q: 'Construction takeoff quantities are almost always recorded in:', options: ['Whatever unit the site crew prefers that day', 'Metres, square metres and cubic metres', 'Only imperial units', 'Currency units'], correct: 1 },
      { q: 'A Bill of Quantities (BOQ) lists, for each item:', options: ['Only the total project cost', 'Unit, quantity, rate and amount', 'Only a description, with no numbers', 'The contractor\'s profit margin alone'], correct: 1 },
      { q: 'Mixing millimetres and metres mid-calculation typically causes:', options: ['No real issue, they cancel out', 'Order-of-magnitude errors', 'Only a rounding difference under 1%', 'A currency conversion error'], correct: 1 }
    ],
    lessons: [
      {
        slug: 'units-you-must-know',
        title: 'Units you must know',
        body: [
          'Construction takeoff almost always works in metres, square metres and cubic metres — even where a country\u2019s trades speak in feet and inches on site.',
          'Convert once, at the point of measurement, and keep everything after that in the same units. Mixing mm and m mid-calculation is a common source of order-of-magnitude errors.',
          'The tip bubble on your dashboard and project pages has a whole "Conversions" category if you need a quick reference.'
        ],
        practice: null
      },
      {
        slug: 'rates-and-boq',
        title: 'Rates and the priced BOQ',
        body: [
          'A Bill of Quantities (BOQ) lists every measured item with its unit, quantity, rate and extended amount — quantity × rate.',
          'A priced BOQ is the same bill with rates applied, giving a total project cost. This is exactly what this app\u2019s "Export priced BOQ" produces from your abstract.',
          'A well-organised BOQ groups items by work section, in the same order a contractor would actually build them — which is also how your dimension sheets are already grouped.'
        ],
        practice: null
      }
    ]
  }
];

export function findLesson(slug) {
  for (const mod of MODULES) {
    const lesson = mod.lessons.find(l => l.slug === slug);
    if (lesson) return { module: mod, lesson };
  }
  return null;
}

export function allLessonSlugs() {
  return MODULES.flatMap(m => m.lessons.map(l => l.slug));
}
