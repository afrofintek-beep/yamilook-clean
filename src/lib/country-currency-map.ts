// Map of African country codes to their currency codes
// Based on memory: features/palco/pricing-and-currency-logic

export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  // Southern Africa
  AO: 'AOA',  // Angola - Kwanza
  ZA: 'ZAR',  // South Africa - Rand
  MZ: 'MZN',  // Mozambique - Metical
  ZW: 'USD',  // Zimbabwe - USD (uses USD)
  ZM: 'ZMW',  // Zambia - Kwacha
  BW: 'BWP',  // Botswana - Pula
  NA: 'NAD',  // Namibia - Dollar
  LS: 'LSL',  // Lesotho - Loti
  SZ: 'SZL',  // Eswatini - Lilangeni
  MW: 'MWK',  // Malawi - Kwacha
  
  // West Africa
  NG: 'NGN',  // Nigeria - Naira
  GH: 'GHS',  // Ghana - Cedi
  SN: 'XOF',  // Senegal - CFA Franc
  CI: 'XOF',  // Côte d'Ivoire - CFA Franc
  CM: 'XAF',  // Cameroon - CFA Franc
  ML: 'XOF',  // Mali - CFA Franc
  BF: 'XOF',  // Burkina Faso - CFA Franc
  NE: 'XOF',  // Niger - CFA Franc
  GN: 'GNF',  // Guinea - Franc
  BJ: 'XOF',  // Benin - CFA Franc
  TG: 'XOF',  // Togo - CFA Franc
  SL: 'SLE',  // Sierra Leone - Leone
  LR: 'LRD',  // Liberia - Dollar
  MR: 'MRU',  // Mauritania - Ouguiya
  GM: 'GMD',  // Gambia - Dalasi
  GW: 'XOF',  // Guinea-Bissau - CFA Franc
  CV: 'CVE',  // Cape Verde - Escudo
  
  // East Africa
  KE: 'KES',  // Kenya - Shilling
  TZ: 'TZS',  // Tanzania - Shilling
  UG: 'UGX',  // Uganda - Shilling
  ET: 'ETB',  // Ethiopia - Birr
  RW: 'RWF',  // Rwanda - Franc
  BI: 'BIF',  // Burundi - Franc
  SO: 'SOS',  // Somalia - Shilling
  ER: 'ERN',  // Eritrea - Nakfa
  DJ: 'DJF',  // Djibouti - Franc
  SS: 'SSP',  // South Sudan - Pound
  
  // Central Africa
  CD: 'CDF',  // DRC - Franc
  CG: 'XAF',  // Republic of Congo - CFA Franc
  GA: 'XAF',  // Gabon - CFA Franc
  GQ: 'XAF',  // Equatorial Guinea - CFA Franc
  CF: 'XAF',  // CAR - CFA Franc
  TD: 'XAF',  // Chad - CFA Franc
  ST: 'STN',  // São Tomé - Dobra
  
  // North Africa
  EG: 'EGP',  // Egypt - Pound
  MA: 'MAD',  // Morocco - Dirham
  DZ: 'DZD',  // Algeria - Dinar
  TN: 'TND',  // Tunisia - Dinar
  LY: 'LYD',  // Libya - Dinar
  SD: 'SDG',  // Sudan - Pound
  
  // Island Nations
  MG: 'MGA',  // Madagascar - Ariary
  MU: 'MUR',  // Mauritius - Rupee
  SC: 'SCR',  // Seychelles - Rupee
  KM: 'KMF',  // Comoros - Franc
};

// Get currency code for a country
export function getCurrencyForCountry(countryCode: string): string {
  return COUNTRY_TO_CURRENCY[countryCode] || 'USD';
}

// Get country code from currency code (reverse lookup)
export function getCountryForCurrency(currencyCode: string): string | undefined {
  return Object.entries(COUNTRY_TO_CURRENCY).find(([_, c]) => c === currencyCode)?.[0];
}
