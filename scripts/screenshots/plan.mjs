// Builds a fictional journal and the screenshot plan (config.json) for shoot.swift. Nobody here is real:
// the names, handles and stories are made up, and the "photos" are illustrations from art.mjs.
// Usage: node plan.mjs <output dir>
import { mkdirSync, writeFileSync } from 'node:fs'
import { portrait, scenes } from './art.mjs'

const OUT = process.argv[2]
const BASE = 'http://localhost:5174'
const t0 = Date.parse('2026-01-01')

const person = (id, name, fields) => ({ id, name, tags: [], createdAt: t0, updatedAt: t0, ...fields })

const people = [
  person('camille', 'Camille', {
    photo: 'face-camille',
    start: '2025-04-12',
    born: '1993',
    country: 'FR',
    rating: 9,
    tags: ['funny', 'comfy', 'bookworm', 'home'],
    about: 'We met in the queue of a tiny cinema in Lyon. She laughed at the wrong moment in a very serious film, and I knew I wanted to find out why.',
    instagram: 'camille.demo',
    facebook: 'camille.demo',
    linkedin: 'camille-demo',
    phone: '+33 1 00 00 00 00',
  }),
  person('noor', 'Noor', { photo: 'face-noor', start: '2019-09-02', born: '1991-02-14', country: 'MA', rating: 9, tags: ['friend', 'wise', 'funny'], about: 'The friend who always knows what to say, usually at two in the morning.' }),
  person('lucas', 'Lucas', { photo: 'face-lucas', start: '2024-12-31', end: '2024-12-31', born: '1990', country: 'BR', rating: 7, tags: ['fun', 'summer'] }),
  person('elin', 'Elin', { photo: 'face-elin', start: '2023-11-04', end: '2024-08-25', born: '1994', country: 'SE', rating: 8, tags: ['calm', 'adventurous', 'kind'] }),
  person('mateo', 'Mateo', { photo: 'face-mateo', start: '2022-06-03', end: '2023-09-17', born: '1992', country: 'ES', rating: 8, tags: ['funny', 'summer', 'travel'] }),
  person('lucia', 'Lucía', { photo: 'face-lucia', start: '2021-05-20', end: '2021-11-02', born: '1995', country: 'ES', rating: 6, tags: ['fun', 'chaotic'] }),
  person('hugo', 'Hugo', { start: '2020-02-08', end: '2020-10-30', born: '1989', country: 'FR', rating: 7, tags: ['comfy', 'kind'] }),
  person('yuki', 'Yuki', { photo: 'face-yuki', start: '2019-03-20', end: '2019-04-02', born: '1991', country: 'JP', rating: 8, tags: ['travel', 'long distance'] }),
  person('manon', 'Manon', { start: '2018-09-15', end: '2019-01-20', born: '1992', country: 'FR', rating: 6, tags: ['funny'] }),
  person('sofia', 'Sofía', { start: '2023-02-11', end: '2023-02-19', born: '1994', country: 'MX', rating: 7, tags: ['fun', 'travel'] }),
  person('emma', 'Emma', { start: '2020-11-21', end: '2021-03-30', born: '1993', country: 'CA', rating: 6, tags: ['calm', 'long distance'] }),
  person('priya', 'Priya', { photo: 'face-priya', start: '2016-10-02', end: '2017-03-11', born: '1990', country: 'IN', rating: 7, tags: ['kind', 'wise'] }),
  person('jack', 'Jack', { photo: 'face-jack', start: '2015-01-17', end: '2015-08-30', born: '1988', country: 'AU', rating: 6, tags: ['adventurous', 'summer'] }),
  person('tom', 'Tom', { photo: 'face-tom', start: '2017-05-14', end: '2018-12-02', born: '1990', country: 'US', rating: 10, tags: ['first love', 'bookworm', 'summer'] }),
]

const story = (id, date, title, text, people, fields = {}) => ({ id, date, title, text, people, tags: [], photos: [], createdAt: t0, updatedAt: t0, ...fields })

const stories = [
  story('market', '2026-10-18', 'Sunday market', 'She talked the cheese seller into a discount, then gave half of it to a stranger’s dog. Coffee on the bench after, not saying much. I want more mornings like this one.', ['camille'], { country: 'FR', tags: ['comfy', 'home'], photos: ['cafe'] }),
  story('lisbon', '2026-08-09', 'Our week in Lisbon', 'We got lost on purpose every day. She fell asleep on tram 28 with her head on my shoulder, and I stayed on two stops too many so she wouldn’t wake up.\n\nThe last evening we sat by the river until the sky went pink and neither of us wanted to say it was over.', ['camille'], { country: 'PT', tags: ['travel', 'summer'], photos: ['tram', 'sunset', 'beach'] }),
  story('fete', '2026-06-21', 'Dancing in the street', 'A terrible cover band outside the bakery. We danced anyway.', ['camille'], { country: 'FR', tags: ['funny', 'summer'] }),
  story('marrakech', '2026-05-02', 'Marrakech with Noor', 'Five days, three lost scarves, and the best mint tea of my life on her aunt’s roof.', ['noor'], { country: 'MA', tags: ['travel', 'friend'], photos: ['medina'] }),
  story('tart', '2026-03-14', 'The burnt tart', 'We set off the smoke alarm trying to impress her parents. They still talk about it.', ['camille'], { country: 'FR', tags: ['funny', 'comfy'] }),
  story('christmas', '2025-12-24', 'A first Christmas', 'Her grandmother taught me a card game and took all my chocolate.', ['camille'], { country: 'FR', tags: ['comfy', 'home'] }),
  story('friends', '2025-11-15', 'Noor meets Camille', 'I was so nervous, and within ten minutes they were laughing at me together.', ['camille', 'noor'], { country: 'FR', tags: ['friend', 'funny'] }),
  story('rome', '2025-10-25', 'Rome in the rain', 'We shared one umbrella and argued happily about the best gelato.', ['camille'], { country: 'IT', tags: ['travel', 'comfy'] }),
  story('paris', '2025-09-06', 'A weekend in Paris', 'We climbed every stair in Montmartre, then watched the lights come on over the rooftops.', ['camille'], { country: 'FR', tags: ['travel', 'comfy'], photos: ['paris'] }),
  story('ferry', '2025-07-19', 'The slow ferry', 'Nine hours on deck between two Greek islands, sharing one book.', ['camille'], { country: 'GR', tags: ['travel', 'summer'], photos: ['sunset2'] }),
  story('queue', '2025-04-12', 'The queue at the cinema', 'The first time I heard that laugh. We skipped the second film and walked along the river instead.', ['camille'], { country: 'FR', tags: ['first date', 'funny'] }),
  story('rio', '2024-12-31', 'New Year in Rio', 'One night, one beach, one very good conversation. We never saw each other again, and that was all right.', ['lucas'], { country: 'BR', tags: ['summer', 'fun'], photos: ['fireworks'] }),
  story('midsummer', '2024-06-21', 'Midsummer', 'Flower crowns, herring, and dancing like frogs around the pole. The sun never really went down.', ['elin'], { country: 'SE', tags: ['summer', 'travel'], photos: ['meadow', 'lake'] }),
  story('call', '2024-02-11', 'The call that fixed everything', 'Three hours on the phone with Noor. I came out of it a calmer person.', ['noor'], { tags: ['friend'] }),
  story('aurora', '2024-01-13', 'Northern lights', 'Minus twenty, and we forgot we were cold.', ['elin'], { country: 'SE', tags: ['travel', 'calm'], photos: ['aurora'] }),
  story('oaxaca', '2023-02-14', 'A week in Oaxaca', 'We met on the first day of the trip and said goodbye on the last. No regrets.', ['sofia'], { country: 'MX', tags: ['travel', 'fun'] }),
  story('swim', '2023-08-20', 'Last swim of the summer', 'We both knew it, and neither of us said it. It was a good way to say goodbye.', ['mateo'], { country: 'ES', tags: ['summer'], photos: ['beach'] }),
  story('andalusia', '2022-09-03', 'White villages', 'A hired car with no air conditioning, and every village prettier than the last.', ['mateo'], { country: 'ES', tags: ['travel', 'summer'], photos: ['village'] }),
  story('tapas', '2022-06-03', 'Tapas and a missed train', 'We talked so long that I missed the last train home. I wasn’t sorry.', ['mateo'], { country: 'ES', tags: ['first date', 'funny'] }),
  story('granada', '2021-08-14', 'Rooftop in Granada', 'Far too much sangria and a lot of bad singing.', ['lucia'], { country: 'ES', tags: ['fun'] }),
  story('lockdown', '2020-04-02', 'Baking through it', 'Six weeks, forty loaves, and we still liked each other at the end.', ['hugo'], { country: 'FR', tags: ['comfy', 'home'] }),
  story('kyoto', '2019-03-28', 'Under the cherry trees', 'Two weeks, and I still think about that walk near Mount Fuji.', ['yuki'], { country: 'JP', tags: ['travel', 'long distance'], photos: ['blossom'] }),
  story('roadtrip', '2018-07-04', 'Road trip to the coast', 'The car broke down twice. It was the best week of that year.', ['tom'], { country: 'US', tags: ['summer', 'travel'] }),
  story('train', '2017-01-20', 'The night train to Goa', 'Chai at every stop, and a card game we made up ourselves.', ['priya'], { country: 'IN', tags: ['travel', 'kind'] }),
  story('bookshop', '2017-05-14', 'The bookshop', 'He recommended the wrong book on purpose so I’d come back and complain.', ['tom'], { country: 'US', tags: ['first date', 'bookworm'] }),
  story('surf', '2015-03-08', 'First surf lesson', 'I stood up for almost two seconds. He cheered as if I’d won something.', ['jack'], { country: 'AU', tags: ['summer', 'adventurous'] }),
]

const data = {
  people,
  stories,
  profile: { name: 'Alex', birthday: '1992-05-18', about: 'Learning to pay attention to the small things. This is where I keep them.', updatedAt: t0 },
}

const faces = {
  'face-camille': { bg: '#ffd27a', skin: 'light', hair: '#6b3a22', top: '#ef7b5b', style: 'long' },
  'face-noor': { bg: '#c9bcf6', skin: 'tan', hair: '#2d2130', top: '#ffc233', style: 'bun' },
  'face-lucas': { bg: '#9fdccb', skin: 'deep', hair: '#231a18', top: '#fff4e4', style: 'curly' },
  'face-elin': { bg: '#a9c6f4', skin: 'light', hair: '#e8c26a', top: '#7b4535', style: 'bob' },
  'face-mateo': { bg: '#f7b39a', skin: 'warm', hair: '#3a2820', top: '#5664c8', style: 'beard' },
  'face-lucia': { bg: '#f6a3bd', skin: 'warm', hair: '#5a2f24', top: '#8ea53b', style: 'curly' },
  'face-yuki': { bg: '#cfdc98', skin: 'light', hair: '#1d1a22', top: '#e2574c', style: 'bob' },
  'face-priya': { bg: '#f7c6b6', skin: 'tan', hair: '#241a1a', top: '#5664c8', style: 'long' },
  'face-jack': { bg: '#bfe3f2', skin: 'warm', hair: '#7a5230', top: '#8ea53b', style: 'short' },
  'face-tom': { bg: '#f9c79c', skin: 'light', hair: '#a8662e', top: '#3f6f8f', style: 'short' },
}

const pictures = {
  cafe: scenes.cafe(),
  tram: scenes.tram(),
  sunset: scenes.sunsetSea(),
  sunset2: scenes.sunsetSea(),
  beach: scenes.beach(),
  medina: scenes.medina(),
  paris: scenes.parisDusk(),
  fireworks: scenes.fireworks(),
  meadow: scenes.meadow(),
  lake: scenes.lake(),
  aurora: scenes.aurora(),
  village: scenes.whiteVillage(),
  blossom: scenes.blossom(),
}

const art = { ...pictures, ...Object.fromEntries(Object.entries(faces).map(([id, f]) => [id, portrait(f)])) }

const photoIds = [...new Set(stories.flatMap((s) => s.photos))]
const missing = [...photoIds, ...Object.keys(faces)].filter((id) => !art[id])
if (missing.length) throw new Error(`No art for ${missing}`)

const seed = `
  localStorage.setItem('ls:data:v1', ${JSON.stringify(JSON.stringify(data))})
  localStorage.setItem('ls:device-mode', '1')
  const { writePhoto } = await import('/src/data/photos.ts')
  const art = ${JSON.stringify(art)}
  const toBlob = (svg) => new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = image.width
      canvas.height = image.height
      canvas.getContext('2d').drawImage(image, 0, 0)
      canvas.toBlob(resolve, 'image/jpeg', 0.92)
    }
    image.onerror = reject
    image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
  })
  for (const [id, svg] of Object.entries(art)) await writePhoto('device', id, await toBlob(svg))
`

const click = (selector, text) => `[...document.querySelectorAll(${JSON.stringify(selector)})].find(e => e.innerText.trim().startsWith(${JSON.stringify(text)})).click()`
const scrollTo = (selector, offset = 24) => `document.querySelector(${JSON.stringify(selector)}).scrollIntoView({ block: 'start' }); window.scrollBy(0, -${offset})`

const steps = [
  { url: `${BASE}/`, wait: 2.5, shot: 'welcome.jpg' },
  { js: seed },
  { url: `${BASE}/`, wait: 2.5, shot: 'hearts.jpg' },
  { url: `${BASE}/people/camille`, wait: 2, shot: 'person.jpg' },
  { js: scrollTo('.link-row'), wait: 1, shot: 'person-stories.jpg' },
  { url: `${BASE}/people/camille/edit`, wait: 2 },
  { js: scrollTo('.age-input', 250), wait: 0.8, shot: 'person-editor.jpg' },
  { js: click('button', 'Add a word'), wait: 1, shot: 'words.jpg' },
  { url: `${BASE}/stories`, wait: 2, shot: 'stories.jpg' },
  { url: `${BASE}/stories/lisbon`, wait: 2, shot: 'story.jpg' },
  { url: `${BASE}/stories/lisbon/edit`, wait: 2, shot: 'story-editor.jpg' },
  { url: `${BASE}/map`, wait: 3.5, shot: 'map.jpg' },
  { js: click('.rank-row', '🇫🇷'), wait: 2, shot: 'map-country.jpg' },
  { url: `${BASE}/map`, wait: 3 },
  { js: click('.segmented__option', 'Stories'), wait: 1.5, shot: 'map-stories.jpg' },
  { url: `${BASE}/you`, wait: 2, shot: 'you.jpg' },
  { js: scrollTo('.chart-card'), wait: 1.2, shot: 'you-stats.jpg' },
]

mkdirSync(OUT, { recursive: true })
writeFileSync(`${OUT}/config.json`, JSON.stringify({ width: 390, height: 844, quality: 0.88, outDir: OUT, steps }, null, 2))
console.log(`${people.length} people, ${stories.length} stories, ${Object.keys(art).length} pictures`)
