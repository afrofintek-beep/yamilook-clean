// Comprehensive African locations data for all 54 countries
// Cities are ordered by population/importance

export interface AfricanLocation {
  country: string;
  countryCode: string;
  cities: {
    name: string;
    neighborhoods?: string[];
  }[];
}

export const AFRICAN_LOCATIONS: AfricanLocation[] = [
  // Southern Africa
  {
    country: 'Angola',
    countryCode: 'AO',
    cities: [
      { 
        name: 'Luanda', 
        neighborhoods: [
          'Alvalade', 'Benfica', 'Camama', 'Cazenga', 'Dangereux', 'Gamek', 'Golf 2',
          'Kilamba', 'Lar do Patriota', 'Maculusso', 'Maianga', 'Marçal',
          'Morro Bento', 'Mutamba', 'Patriota', 'Prenda', 'Rangel', 'Rocha Pinto',
          'Samba', 'Sambizanga', 'São Paulo', 'Talatona', 'Viana', 'Vila Alice',
          'Zango', 'Zona Verde'
        ]
      },
      { name: 'Benguela', neighborhoods: ['Centro', 'Lobito', 'Catumbela', 'Bairro 11', 'Bairro da Graça'] },
      { name: 'Huambo', neighborhoods: ['Centro', 'Caála', 'Bailundo', 'Bom Pastor', 'Académica'] },
      { name: 'Lubango', neighborhoods: ['Centro', 'Huíla', 'Mapunda', 'Lucrécia'] },
      { name: 'Cabinda', neighborhoods: ['Centro', 'Cabassango', 'Simulambuco'] },
      { name: 'Malanje', neighborhoods: ['Centro', 'Cangandala', 'Ngola Luije'] },
      { name: 'Namibe', neighborhoods: ['Centro', 'Tômbwa'] },
      { name: 'Uíge', neighborhoods: ['Centro'] },
      { name: 'Soyo', neighborhoods: ['Centro'] },
    ]
  },
  {
    country: 'South Africa',
    countryCode: 'ZA',
    cities: [
      { name: 'Johannesburg', neighborhoods: ['Sandton', 'Soweto', 'Rosebank', 'Braamfontein', 'Melville', 'Hillbrow', 'Alexandra'] },
      { name: 'Cape Town', neighborhoods: ['City Bowl', 'Sea Point', 'Camps Bay', 'Khayelitsha', 'Observatory', 'Woodstock'] },
      { name: 'Durban', neighborhoods: ['Umhlanga', 'Berea', 'Umlazi', 'Pinetown', 'Morningside'] },
      { name: 'Pretoria', neighborhoods: ['Hatfield', 'Menlyn', 'Brooklyn', 'Centurion', 'Sunnyside'] },
      { name: 'Port Elizabeth', neighborhoods: ['Central', 'Summerstrand', 'Walmer'] },
      { name: 'Bloemfontein', neighborhoods: ['Central', 'Westdene'] },
    ]
  },
  {
    country: 'Mozambique',
    countryCode: 'MZ',
    cities: [
      { name: 'Maputo', neighborhoods: ['Baixa', 'Polana', 'Sommerschield', 'Matola', 'Costa do Sol'] },
      { name: 'Beira', neighborhoods: ['Centro', 'Ponta Gêa', 'Manga'] },
      { name: 'Nampula', neighborhoods: ['Centro'] },
      { name: 'Matola', neighborhoods: ['Centro'] },
    ]
  },
  {
    country: 'Zimbabwe',
    countryCode: 'ZW',
    cities: [
      { name: 'Harare', neighborhoods: ['CBD', 'Borrowdale', 'Avondale', 'Mbare', 'Highfield'] },
      { name: 'Bulawayo', neighborhoods: ['City Centre', 'Suburbs', 'Hillside'] },
      { name: 'Chitungwiza', neighborhoods: ['Unit L', 'Zengeza'] },
    ]
  },
  {
    country: 'Zambia',
    countryCode: 'ZM',
    cities: [
      { name: 'Lusaka', neighborhoods: ['Cairo Road', 'Kabulonga', 'Woodlands', 'Chilenje', 'Matero'] },
      { name: 'Kitwe', neighborhoods: ['Town Centre', 'Parklands'] },
      { name: 'Ndola', neighborhoods: ['Town Centre', 'Kansenshi'] },
    ]
  },
  {
    country: 'Botswana',
    countryCode: 'BW',
    cities: [
      { name: 'Gaborone', neighborhoods: ['CBD', 'Phakalane', 'Tlokweng', 'Mogoditshane'] },
      { name: 'Francistown', neighborhoods: ['CBD', 'Satellite'] },
    ]
  },
  {
    country: 'Namibia',
    countryCode: 'NA',
    cities: [
      { name: 'Windhoek', neighborhoods: ['CBD', 'Klein Windhoek', 'Katutura', 'Khomasdal'] },
      { name: 'Walvis Bay', neighborhoods: ['Town Centre'] },
      { name: 'Swakopmund', neighborhoods: ['Town Centre'] },
    ]
  },
  {
    country: 'Lesotho',
    countryCode: 'LS',
    cities: [
      { name: 'Maseru', neighborhoods: ['CBD', 'Maseru West'] },
    ]
  },
  {
    country: 'Eswatini',
    countryCode: 'SZ',
    cities: [
      { name: 'Mbabane', neighborhoods: ['CBD', 'Msunduza'] },
      { name: 'Manzini', neighborhoods: ['CBD'] },
    ]
  },
  {
    country: 'Malawi',
    countryCode: 'MW',
    cities: [
      { name: 'Lilongwe', neighborhoods: ['City Centre', 'Area 47', 'Area 25'] },
      { name: 'Blantyre', neighborhoods: ['CBD', 'Limbe', 'Ndirande'] },
    ]
  },
  // West Africa
  {
    country: 'Nigeria',
    countryCode: 'NG',
    cities: [
      { name: 'Lagos', neighborhoods: ['Victoria Island', 'Lekki', 'Ikeja', 'Yaba', 'Surulere', 'Ikoyi', 'Ajah', 'Oshodi'] },
      { name: 'Abuja', neighborhoods: ['Wuse', 'Garki', 'Maitama', 'Asokoro', 'Central Area'] },
      { name: 'Kano', neighborhoods: ['Nassarawa', 'Fagge', 'Tarauni'] },
      { name: 'Ibadan', neighborhoods: ['Bodija', 'Challenge', 'Ring Road'] },
      { name: 'Port Harcourt', neighborhoods: ['GRA', 'Diobu', 'Trans Amadi'] },
    ]
  },
  {
    country: 'Ghana',
    countryCode: 'GH',
    cities: [
      { name: 'Accra', neighborhoods: ['Osu', 'Labone', 'East Legon', 'Cantonments', 'Airport Residential', 'Tema'] },
      { name: 'Kumasi', neighborhoods: ['Adum', 'Nhyiaeso', 'Asokwa'] },
      { name: 'Tamale', neighborhoods: ['Central', 'Lamashegu'] },
    ]
  },
  {
    country: 'Senegal',
    countryCode: 'SN',
    cities: [
      { name: 'Dakar', neighborhoods: ['Plateau', 'Almadies', 'Ngor', 'Ouakam', 'Mermoz', 'Point E', 'Sacré-Cœur'] },
      { name: 'Saint-Louis', neighborhoods: ['Centre', 'Guet Ndar'] },
      { name: 'Thiès', neighborhoods: ['Centre'] },
    ]
  },
  {
    country: 'Côte d\'Ivoire',
    countryCode: 'CI',
    cities: [
      { name: 'Abidjan', neighborhoods: ['Plateau', 'Cocody', 'Marcory', 'Treichville', 'Yopougon', 'Riviera'] },
      { name: 'Yamoussoukro', neighborhoods: ['Centre'] },
      { name: 'Bouaké', neighborhoods: ['Centre'] },
    ]
  },
  {
    country: 'Cameroon',
    countryCode: 'CM',
    cities: [
      { name: 'Douala', neighborhoods: ['Bonanjo', 'Akwa', 'Bonapriso', 'Deido', 'New Bell'] },
      { name: 'Yaoundé', neighborhoods: ['Centre', 'Bastos', 'Nlongkak', 'Mvog-Mbi'] },
    ]
  },
  {
    country: 'Mali',
    countryCode: 'ML',
    cities: [
      { name: 'Bamako', neighborhoods: ['Hippodrome', 'Badalabougou', 'Hamdallaye', 'Niarela'] },
      { name: 'Sikasso', neighborhoods: ['Centre'] },
    ]
  },
  {
    country: 'Burkina Faso',
    countryCode: 'BF',
    cities: [
      { name: 'Ouagadougou', neighborhoods: ['Centre', 'Zone du Bois', 'Ouaga 2000', 'Patte d\'Oie'] },
      { name: 'Bobo-Dioulasso', neighborhoods: ['Centre'] },
    ]
  },
  {
    country: 'Niger',
    countryCode: 'NE',
    cities: [
      { name: 'Niamey', neighborhoods: ['Plateau', 'Yantala', 'Koira Kano'] },
      { name: 'Zinder', neighborhoods: ['Centre'] },
    ]
  },
  {
    country: 'Guinea',
    countryCode: 'GN',
    cities: [
      { name: 'Conakry', neighborhoods: ['Kaloum', 'Ratoma', 'Matam', 'Dixinn'] },
      { name: 'Kankan', neighborhoods: ['Centre'] },
    ]
  },
  {
    country: 'Benin',
    countryCode: 'BJ',
    cities: [
      { name: 'Cotonou', neighborhoods: ['Ganhi', 'Akpakpa', 'Cadjèhoun'] },
      { name: 'Porto-Novo', neighborhoods: ['Centre'] },
    ]
  },
  {
    country: 'Togo',
    countryCode: 'TG',
    cities: [
      { name: 'Lomé', neighborhoods: ['Tokoin', 'Bè', 'Kodjoviakopé', 'Adidogomé'] },
    ]
  },
  {
    country: 'Sierra Leone',
    countryCode: 'SL',
    cities: [
      { name: 'Freetown', neighborhoods: ['Central', 'Hill Station', 'Congo Town', 'Lumley'] },
    ]
  },
  {
    country: 'Liberia',
    countryCode: 'LR',
    cities: [
      { name: 'Monrovia', neighborhoods: ['Central', 'Sinkor', 'Congo Town', 'Paynesville'] },
    ]
  },
  {
    country: 'Mauritania',
    countryCode: 'MR',
    cities: [
      { name: 'Nouakchott', neighborhoods: ['Tevragh-Zeina', 'Ksar', 'Sebkha'] },
    ]
  },
  {
    country: 'Gambia',
    countryCode: 'GM',
    cities: [
      { name: 'Banjul', neighborhoods: ['CBD', 'Half Die'] },
      { name: 'Serrekunda', neighborhoods: ['Central'] },
    ]
  },
  {
    country: 'Guinea-Bissau',
    countryCode: 'GW',
    cities: [
      { name: 'Bissau', neighborhoods: ['Centro', 'Bairro Militar'] },
    ]
  },
  {
    country: 'Cape Verde',
    countryCode: 'CV',
    cities: [
      { name: 'Praia', neighborhoods: ['Plateau', 'Achada Santo António'] },
      { name: 'Mindelo', neighborhoods: ['Centro'] },
    ]
  },
  // East Africa
  {
    country: 'Kenya',
    countryCode: 'KE',
    cities: [
      { name: 'Nairobi', neighborhoods: ['Westlands', 'Kilimani', 'Karen', 'Kibera', 'Lavington', 'Ngong Road'] },
      { name: 'Mombasa', neighborhoods: ['CBD', 'Nyali', 'Bamburi'] },
      { name: 'Kisumu', neighborhoods: ['CBD', 'Milimani'] },
    ]
  },
  {
    country: 'Tanzania',
    countryCode: 'TZ',
    cities: [
      { name: 'Dar es Salaam', neighborhoods: ['Oyster Bay', 'Masaki', 'Mikocheni', 'Kariakoo', 'Kinondoni'] },
      { name: 'Dodoma', neighborhoods: ['Centre'] },
      { name: 'Arusha', neighborhoods: ['CBD', 'Njiro'] },
      { name: 'Zanzibar City', neighborhoods: ['Stone Town', 'Ng\'ambo'] },
    ]
  },
  {
    country: 'Uganda',
    countryCode: 'UG',
    cities: [
      { name: 'Kampala', neighborhoods: ['Nakasero', 'Kololo', 'Bugolobi', 'Ntinda', 'Wandegeya'] },
      { name: 'Entebbe', neighborhoods: ['Town Centre'] },
    ]
  },
  {
    country: 'Ethiopia',
    countryCode: 'ET',
    cities: [
      { name: 'Addis Ababa', neighborhoods: ['Bole', 'Kazanchis', 'Piassa', 'Merkato', 'CMC'] },
      { name: 'Dire Dawa', neighborhoods: ['Centre'] },
      { name: 'Gondar', neighborhoods: ['Centre'] },
    ]
  },
  {
    country: 'Rwanda',
    countryCode: 'RW',
    cities: [
      { name: 'Kigali', neighborhoods: ['Nyarugenge', 'Kicukiro', 'Gasabo', 'Kimihurura'] },
    ]
  },
  {
    country: 'Burundi',
    countryCode: 'BI',
    cities: [
      { name: 'Bujumbura', neighborhoods: ['Centre-ville', 'Rohero', 'Ngagara'] },
    ]
  },
  {
    country: 'Somalia',
    countryCode: 'SO',
    cities: [
      { name: 'Mogadishu', neighborhoods: ['Hamar Weyne', 'Bakara', 'Hodan'] },
      { name: 'Hargeisa', neighborhoods: ['Centre'] },
    ]
  },
  {
    country: 'Eritrea',
    countryCode: 'ER',
    cities: [
      { name: 'Asmara', neighborhoods: ['Centro', 'Godaif', 'Tiravolo'] },
    ]
  },
  {
    country: 'Djibouti',
    countryCode: 'DJ',
    cities: [
      { name: 'Djibouti City', neighborhoods: ['Plateau du Serpent', 'Heron', 'Balbala'] },
    ]
  },
  {
    country: 'South Sudan',
    countryCode: 'SS',
    cities: [
      { name: 'Juba', neighborhoods: ['Hai Cinema', 'Tongping', 'Thongpiny'] },
    ]
  },
  // Central Africa
  {
    country: 'Democratic Republic of the Congo',
    countryCode: 'CD',
    cities: [
      { name: 'Kinshasa', neighborhoods: ['Gombe', 'Lingwala', 'Barumbu', 'Limete', 'Ngaliema', 'Matongé'] },
      { name: 'Lubumbashi', neighborhoods: ['Centre', 'Katuba', 'Kenya'] },
      { name: 'Mbuji-Mayi', neighborhoods: ['Centre'] },
      { name: 'Kisangani', neighborhoods: ['Centre'] },
    ]
  },
  {
    country: 'Republic of the Congo',
    countryCode: 'CG',
    cities: [
      { name: 'Brazzaville', neighborhoods: ['Centre-ville', 'Poto-Poto', 'Bacongo', 'Ouenzé'] },
      { name: 'Pointe-Noire', neighborhoods: ['Centre', 'Loandjili'] },
    ]
  },
  {
    country: 'Gabon',
    countryCode: 'GA',
    cities: [
      { name: 'Libreville', neighborhoods: ['Centre', 'Montagne Sainte', 'Louis', 'Akébé'] },
      { name: 'Port-Gentil', neighborhoods: ['Centre'] },
    ]
  },
  {
    country: 'Equatorial Guinea',
    countryCode: 'GQ',
    cities: [
      { name: 'Malabo', neighborhoods: ['Centro', 'Ela Nguema'] },
      { name: 'Bata', neighborhoods: ['Centro'] },
    ]
  },
  {
    country: 'Central African Republic',
    countryCode: 'CF',
    cities: [
      { name: 'Bangui', neighborhoods: ['Centre-ville', 'Kilomètre 5', 'Combattant'] },
    ]
  },
  {
    country: 'Chad',
    countryCode: 'TD',
    cities: [
      { name: 'N\'Djamena', neighborhoods: ['Centre', 'Moursal', 'Chagoua'] },
    ]
  },
  {
    country: 'São Tomé and Príncipe',
    countryCode: 'ST',
    cities: [
      { name: 'São Tomé', neighborhoods: ['Centro', 'Riboque'] },
    ]
  },
  // North Africa
  {
    country: 'Egypt',
    countryCode: 'EG',
    cities: [
      { name: 'Cairo', neighborhoods: ['Downtown', 'Zamalek', 'Maadi', 'Heliopolis', 'Nasr City', 'Giza'] },
      { name: 'Alexandria', neighborhoods: ['San Stefano', 'Montaza', 'Sidi Gaber'] },
      { name: 'Giza', neighborhoods: ['Dokki', 'Mohandessin', 'Haram'] },
    ]
  },
  {
    country: 'Morocco',
    countryCode: 'MA',
    cities: [
      { name: 'Casablanca', neighborhoods: ['Maarif', 'Anfa', 'Centre-ville', 'Ain Diab'] },
      { name: 'Rabat', neighborhoods: ['Agdal', 'Hassan', 'Souissi'] },
      { name: 'Marrakech', neighborhoods: ['Gueliz', 'Medina', 'Hivernage'] },
      { name: 'Fes', neighborhoods: ['Ville Nouvelle', 'Medina'] },
      { name: 'Tangier', neighborhoods: ['Centre', 'Malabata'] },
    ]
  },
  {
    country: 'Algeria',
    countryCode: 'DZ',
    cities: [
      { name: 'Algiers', neighborhoods: ['Centre', 'Bab El Oued', 'El Biar', 'Hydra'] },
      { name: 'Oran', neighborhoods: ['Centre', 'Bir El Djir'] },
      { name: 'Constantine', neighborhoods: ['Centre'] },
    ]
  },
  {
    country: 'Tunisia',
    countryCode: 'TN',
    cities: [
      { name: 'Tunis', neighborhoods: ['Centre-ville', 'La Marsa', 'Sidi Bou Said', 'Carthage'] },
      { name: 'Sfax', neighborhoods: ['Centre'] },
      { name: 'Sousse', neighborhoods: ['Centre', 'Kantaoui'] },
    ]
  },
  {
    country: 'Libya',
    countryCode: 'LY',
    cities: [
      { name: 'Tripoli', neighborhoods: ['Medina', 'Dahra', 'Hay Andalus'] },
      { name: 'Benghazi', neighborhoods: ['Centre'] },
    ]
  },
  {
    country: 'Sudan',
    countryCode: 'SD',
    cities: [
      { name: 'Khartoum', neighborhoods: ['CBD', 'Omdurman', 'Bahri', 'Riyadh'] },
    ]
  },
  // Island Nations
  {
    country: 'Madagascar',
    countryCode: 'MG',
    cities: [
      { name: 'Antananarivo', neighborhoods: ['Analakely', 'Isoraka', 'Ivandry'] },
      { name: 'Toamasina', neighborhoods: ['Centre'] },
    ]
  },
  {
    country: 'Mauritius',
    countryCode: 'MU',
    cities: [
      { name: 'Port Louis', neighborhoods: ['Centre', 'Caudan'] },
      { name: 'Curepipe', neighborhoods: ['Centre'] },
    ]
  },
  {
    country: 'Seychelles',
    countryCode: 'SC',
    cities: [
      { name: 'Victoria', neighborhoods: ['Centre'] },
    ]
  },
  {
    country: 'Comoros',
    countryCode: 'KM',
    cities: [
      { name: 'Moroni', neighborhoods: ['Centre', 'Volo Volo'] },
    ]
  },
];

// Helper to get cities by country
export function getCitiesByCountry(countryCode: string): string[] {
  const country = AFRICAN_LOCATIONS.find(l => l.countryCode === countryCode);
  return country?.cities.map(c => c.name) || [];
}

// Helper to get neighborhoods by country and city
export function getNeighborhoods(countryCode: string, cityName: string): string[] {
  const country = AFRICAN_LOCATIONS.find(l => l.countryCode === countryCode);
  const city = country?.cities.find(c => c.name === cityName);
  return city?.neighborhoods || [];
}

// Helper to get all countries
export function getCountries(): { name: string; code: string }[] {
  return AFRICAN_LOCATIONS.map(l => ({ name: l.country, code: l.countryCode }));
}

// Helper to find country by coordinates (approximate)
export function getNearestCountry(lat: number, lng: number): AfricanLocation | undefined {
  // Simplified country detection based on coordinate ranges
  // This is a basic implementation - in production you'd use a proper geocoding service
  
  // Angola check (roughly -5 to -18 lat, 12 to 24 lng)
  if (lat >= -18 && lat <= -5 && lng >= 12 && lng <= 24) {
    return AFRICAN_LOCATIONS.find(l => l.countryCode === 'AO');
  }
  
  // South Africa check
  if (lat >= -35 && lat <= -22 && lng >= 16 && lng <= 33) {
    return AFRICAN_LOCATIONS.find(l => l.countryCode === 'ZA');
  }
  
  // Nigeria check
  if (lat >= 4 && lat <= 14 && lng >= 2 && lng <= 15) {
    return AFRICAN_LOCATIONS.find(l => l.countryCode === 'NG');
  }
  
  // Kenya check
  if (lat >= -5 && lat <= 5 && lng >= 34 && lng <= 42) {
    return AFRICAN_LOCATIONS.find(l => l.countryCode === 'KE');
  }
  
  // Egypt check
  if (lat >= 22 && lat <= 32 && lng >= 25 && lng <= 36) {
    return AFRICAN_LOCATIONS.find(l => l.countryCode === 'EG');
  }
  
  // Morocco check
  if (lat >= 27 && lat <= 36 && lng >= -13 && lng <= -1) {
    return AFRICAN_LOCATIONS.find(l => l.countryCode === 'MA');
  }
  
  // DRC check
  if (lat >= -14 && lat <= 6 && lng >= 12 && lng <= 31) {
    return AFRICAN_LOCATIONS.find(l => l.countryCode === 'CD');
  }
  
  // Ghana check
  if (lat >= 4 && lat <= 12 && lng >= -3 && lng <= 1) {
    return AFRICAN_LOCATIONS.find(l => l.countryCode === 'GH');
  }
  
  // Default to Angola if in Africa but no specific match
  return AFRICAN_LOCATIONS.find(l => l.countryCode === 'AO');
}

// Helper to check if a neighborhood name matches any in the list (case-insensitive, fuzzy)
export function findMatchingNeighborhood(
  countryCode: string, 
  cityName: string, 
  searchTerm: string
): string | null {
  const neighborhoods = getNeighborhoods(countryCode, cityName);
  if (!neighborhoods.length || !searchTerm) return null;
  
  const normalizedSearch = searchTerm.toLowerCase().trim();
  
  // Exact match first
  const exactMatch = neighborhoods.find(n => 
    n.toLowerCase() === normalizedSearch
  );
  if (exactMatch) return exactMatch;
  
  // Contains match
  const containsMatch = neighborhoods.find(n => 
    normalizedSearch.includes(n.toLowerCase()) || 
    n.toLowerCase().includes(normalizedSearch)
  );
  if (containsMatch) return containsMatch;
  
  // Partial match (starts with)
  const startsWithMatch = neighborhoods.find(n => 
    n.toLowerCase().startsWith(normalizedSearch) ||
    normalizedSearch.startsWith(n.toLowerCase())
  );
  if (startsWithMatch) return startsWithMatch;
  
  return null;
}
