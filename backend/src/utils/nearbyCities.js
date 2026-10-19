// Known cities (approx. coordinates) used to suggest nearby destinations when
// nobody travels to the exact city a sender typed (e.g. Kenitra -> Rabat).
// Names are stored with common spellings so they match what Nominatim / users type.
const CITIES = [
  // Morocco
  { names: ['Rabat'], lat: 34.0209, lng: -6.8416, cur: 'MAD' },
  { names: ['Salé', 'Sale'], lat: 34.0531, lng: -6.7985, cur: 'MAD' },
  { names: ['Témara', 'Temara'], lat: 33.9287, lng: -6.9068, cur: 'MAD' },
  { names: ['Kenitra', 'Kénitra'], lat: 34.261, lng: -6.5802, cur: 'MAD' },
  { names: ['Skhirat'], lat: 33.8519, lng: -7.0306, cur: 'MAD' },
  { names: ['Mohammedia'], lat: 33.6866, lng: -7.3828, cur: 'MAD' },
  { names: ['Casablanca', 'Casa'], lat: 33.5731, lng: -7.5898, cur: 'MAD' },
  { names: ['Berrechid'], lat: 33.2655, lng: -7.5871, cur: 'MAD' },
  { names: ['Settat'], lat: 33.0013, lng: -7.6166, cur: 'MAD' },
  { names: ['El Jadida'], lat: 33.2316, lng: -8.5007, cur: 'MAD' },
  { names: ['Khouribga'], lat: 32.8811, lng: -6.9063, cur: 'MAD' },
  { names: ['Béni Mellal', 'Beni Mellal'], lat: 32.3373, lng: -6.3498, cur: 'MAD' },
  { names: ['Safi'], lat: 32.2994, lng: -9.2372, cur: 'MAD' },
  { names: ['Essaouira'], lat: 31.5085, lng: -9.7595, cur: 'MAD' },
  { names: ['Marrakech', 'Marrakesh'], lat: 31.6295, lng: -7.9811, cur: 'MAD' },
  { names: ['Agadir'], lat: 30.4278, lng: -9.5981, cur: 'MAD' },
  { names: ['Inezgane'], lat: 30.3566, lng: -9.5386, cur: 'MAD' },
  { names: ['Tiznit'], lat: 29.6974, lng: -9.7316, cur: 'MAD' },
  { names: ['Ouarzazate'], lat: 30.9189, lng: -6.8934, cur: 'MAD' },
  { names: ['Errachidia'], lat: 31.9314, lng: -4.4244, cur: 'MAD' },
  { names: ['Fès', 'Fes', 'Fez'], lat: 34.0331, lng: -5.0003, cur: 'MAD' },
  { names: ['Meknès', 'Meknes'], lat: 33.8935, lng: -5.5473, cur: 'MAD' },
  { names: ['Ifrane'], lat: 33.5228, lng: -5.1106, cur: 'MAD' },
  { names: ['Khemisset', 'Khémisset'], lat: 33.8244, lng: -6.0661, cur: 'MAD' },
  { names: ['Sidi Kacem'], lat: 34.2214, lng: -5.7079, cur: 'MAD' },
  { names: ['Sidi Slimane'], lat: 34.2655, lng: -5.9258, cur: 'MAD' },
  { names: ['Larache'], lat: 35.1932, lng: -6.1557, cur: 'MAD' },
  { names: ['Asilah', 'Assilah'], lat: 35.4653, lng: -6.0343, cur: 'MAD' },
  { names: ['Ksar el-Kebir', 'Ksar El Kebir'], lat: 35.0017, lng: -5.9036, cur: 'MAD' },
  { names: ['Tanger', 'Tangier', 'Tánger'], lat: 35.7595, lng: -5.834, cur: 'MAD' },
  { names: ['Tétouan', 'Tetouan', 'Tetuán'], lat: 35.5785, lng: -5.3684, cur: 'MAD' },
  { names: ['Chefchaouen'], lat: 35.1688, lng: -5.2636, cur: 'MAD' },
  { names: ['Martil'], lat: 35.6168, lng: -5.2753, cur: 'MAD' },
  { names: ['Fnideq'], lat: 35.8489, lng: -5.3576, cur: 'MAD' },
  { names: ['Al Hoceima', 'Alhucemas'], lat: 35.2517, lng: -3.9372, cur: 'MAD' },
  { names: ['Nador'], lat: 35.1681, lng: -2.9335, cur: 'MAD' },
  { names: ['Berkane'], lat: 34.9217, lng: -2.3197, cur: 'MAD' },
  { names: ['Oujda'], lat: 34.6867, lng: -1.9114, cur: 'MAD' },
  { names: ['Taza'], lat: 34.2133, lng: -4.0103, cur: 'MAD' },
  { names: ['Laâyoune', 'Laayoune'], lat: 27.1253, lng: -13.1625, cur: 'MAD' },
  { names: ['Dakhla'], lat: 23.6848, lng: -15.9579, cur: 'MAD' },
  // Algeria
  { names: ['Alger', 'Algiers'], lat: 36.7538, lng: 3.0588, cur: 'DZD' },
  { names: ['Blida'], lat: 36.4701, lng: 2.8277, cur: 'DZD' },
  { names: ['Tipaza'], lat: 36.5897, lng: 2.4476, cur: 'DZD' },
  { names: ['Boumerdès', 'Boumerdes'], lat: 36.7664, lng: 3.4772, cur: 'DZD' },
  { names: ['Oran'], lat: 35.6969, lng: -0.6331, cur: 'DZD' },
  { names: ['Constantine'], lat: 36.365, lng: 6.6147, cur: 'DZD' },
  { names: ['Annaba'], lat: 36.9, lng: 7.7667, cur: 'DZD' },
  { names: ['Tlemcen'], lat: 34.8828, lng: -1.315, cur: 'DZD' },
  // Tunisia
  { names: ['Tunis'], lat: 36.8065, lng: 10.1815, cur: 'TND' },
  { names: ['Ariana'], lat: 36.8665, lng: 10.1647, cur: 'TND' },
  { names: ['La Marsa'], lat: 36.8782, lng: 10.325, cur: 'TND' },
  { names: ['Ben Arous'], lat: 36.7533, lng: 10.2282, cur: 'TND' },
  { names: ['Sousse'], lat: 35.8256, lng: 10.6369, cur: 'TND' },
  { names: ['Monastir'], lat: 35.7643, lng: 10.8113, cur: 'TND' },
  { names: ['Sfax'], lat: 34.7406, lng: 10.7603, cur: 'TND' },
  // France
  { names: ['Paris'], lat: 48.8566, lng: 2.3522, cur: 'EUR' },
  { names: ['Saint-Denis'], lat: 48.9362, lng: 2.3574, cur: 'EUR' },
  { names: ['Versailles'], lat: 48.8049, lng: 2.1204, cur: 'EUR' },
  { names: ['Créteil', 'Creteil'], lat: 48.7904, lng: 2.4556, cur: 'EUR' },
  { names: ['Nanterre'], lat: 48.8924, lng: 2.2071, cur: 'EUR' },
  { names: ['Lyon'], lat: 45.764, lng: 4.8357, cur: 'EUR' },
  { names: ['Villeurbanne'], lat: 45.7667, lng: 4.8803, cur: 'EUR' },
  { names: ['Marseille'], lat: 43.2965, lng: 5.3698, cur: 'EUR' },
  { names: ['Aix-en-Provence'], lat: 43.5297, lng: 5.4474, cur: 'EUR' },
  { names: ['Toulouse'], lat: 43.6047, lng: 1.4442, cur: 'EUR' },
  { names: ['Bordeaux'], lat: 44.8378, lng: -0.5792, cur: 'EUR' },
  { names: ['Lille'], lat: 50.6292, lng: 3.0573, cur: 'EUR' },
  { names: ['Nice'], lat: 43.7102, lng: 7.262, cur: 'EUR' },
  { names: ['Nantes'], lat: 47.2184, lng: -1.5536, cur: 'EUR' },
  { names: ['Strasbourg'], lat: 48.5734, lng: 7.7521, cur: 'EUR' },
  { names: ['Montpellier'], lat: 43.6108, lng: 3.8767, cur: 'EUR' },
  // Spain
  { names: ['Madrid'], lat: 40.4168, lng: -3.7038, cur: 'EUR' },
  { names: ['Barcelona', 'Barcelone'], lat: 41.3851, lng: 2.1734, cur: 'EUR' },
  { names: ['Valencia', 'Valence'], lat: 39.4699, lng: -0.3763, cur: 'EUR' },
  { names: ['Algeciras'], lat: 36.1408, lng: -5.4562, cur: 'EUR' },
  { names: ['Málaga', 'Malaga'], lat: 36.7213, lng: -4.4214, cur: 'EUR' },
  { names: ['Sevilla', 'Seville'], lat: 37.3891, lng: -5.9845, cur: 'EUR' },
  // Belgium / Netherlands / Italy / Germany
  { names: ['Bruxelles', 'Brussels', 'Brussel'], lat: 50.8503, lng: 4.3517, cur: 'EUR' },
  { names: ['Anvers', 'Antwerp', 'Antwerpen'], lat: 51.2194, lng: 4.4025, cur: 'EUR' },
  { names: ['Amsterdam'], lat: 52.3676, lng: 4.9041, cur: 'EUR' },
  { names: ['Rotterdam'], lat: 51.9244, lng: 4.4777, cur: 'EUR' },
  { names: ['Milano', 'Milan'], lat: 45.4642, lng: 9.19, cur: 'EUR' },
  { names: ['Roma', 'Rome'], lat: 41.9028, lng: 12.4964, cur: 'EUR' },
  { names: ['Berlin'], lat: 52.52, lng: 13.405, cur: 'EUR' },
  // Switzerland
  { names: ['Genève', 'Geneva', 'Genf', 'Ginebra'], lat: 46.2044, lng: 6.1432, cur: 'CHF' },
  { names: ['Lausanne'], lat: 46.5197, lng: 6.6323, cur: 'CHF' },
  { names: ['Zurich', 'Zürich'], lat: 47.3769, lng: 8.5417, cur: 'CHF' },
  { names: ['Bern', 'Berne'], lat: 46.948, lng: 7.4474, cur: 'CHF' },
];

const norm = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

const INDEX = new Map();
for (const c of CITIES) for (const n of c.names) INDEX.set(norm(n), c);

const haversineKm = (a, b) => {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

// Resolve free text ("Kénitra, Morocco", "kenitra") to a known city, if any.
const findCity = (text) => {
  const q = norm(text);
  if (!q) return null;
  if (INDEX.has(q)) return INDEX.get(q);
  const head = norm(String(text).split(',')[0]);
  return INDEX.get(head) || null;
};

// Every spelling of the typed city, plus cities within `radiusKm` (nearest first).
const expandDestination = (text, radiusKm = 80) => {
  const city = findCity(text);
  if (!city) return { exactNames: [String(text).trim()], nearby: [] };
  const nearby = CITIES.filter((c) => c !== city)
    .map((c) => ({ city: c, distanceKm: Math.round(haversineKm(city, c)) }))
    .filter((x) => x.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .map((x) => ({ names: x.city.names, distanceKm: x.distanceKm }));
  return { exactNames: city.names, nearby };
};

// Matcher for one search field (origin or destination). Returns null when the
// field is empty. `where(field)` is a Prisma prefilter; `distanceOf(city)` is
// 0 for an exact match, the km distance for a nearby one, null for no match.
const makeMatcher = (text, radiusKm = 80) => {
  const typed = String(text || '').trim();
  if (!typed) return null;
  const { exactNames, nearby } = expandDestination(typed, radiusKm);
  const known = !!findCity(typed);
  const exactSet = new Set(exactNames.map(norm));
  const names = [...exactNames, ...nearby.flatMap((n) => n.names)];
  return {
    where: (field) => ({ OR: names.map((n) => ({ [field]: { contains: n, mode: 'insensitive' } })) }),
    distanceOf: (city) => {
      if (!known) return 0; // free text: DB "contains" already decided
      const head = norm(String(city).split(',')[0]);
      if (exactSet.has(head)) return 0;
      const hit = nearby.find((n) => n.names.some((x) => norm(x) === head));
      return hit ? hit.distanceKm : null; // whole-name match: "Nice" != "Venice"
    },
  };
};

// Currency of the country a known city is in (undefined for unknown cities).
const currencyForCity = (text) => findCity(text)?.cur;

module.exports = { expandDestination, findCity, norm, makeMatcher, currencyForCity };
