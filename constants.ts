import { Commissionerate, Station } from './types';

export const POLICE_STATIONS: Station[] = [
  // Hyderabad City
  { id: 'hc-1', name: 'Abids', phone: '040-27852433', mobile: '9490616377', commissionerate: Commissionerate.HYDERABAD_CITY, keywords: ['abids', 'central', 'koti', 'moazzam jahi market'], lat: 17.3910, lng: 78.4764 },
  { id: 'hc-2', name: 'Begumbazar', phone: '040-27852434', mobile: '9490616378', commissionerate: Commissionerate.HYDERABAD_CITY, keywords: ['begum bazar', 'market', 'siddiamber bazar'], lat: 17.3789, lng: 78.4716 },
  { id: 'hc-20', name: 'Banjara Hills', phone: '040-27852467', mobile: '9490616396', commissionerate: Commissionerate.HYDERABAD_CITY, keywords: ['banjara hills', 'road no 1', 'kbr park'], lat: 17.4156, lng: 78.4347 },
  { id: 'hc-21', name: 'Jubilee Hills', phone: '040-27852468', mobile: '9490616397', commissionerate: Commissionerate.HYDERABAD_CITY, keywords: ['jubilee hills', 'film nagar', 'checkpost'], lat: 17.4284, lng: 78.4121 },
  { id: 'hc-22', name: 'Panjagutta', phone: '040-27852469', mobile: '9490616398', commissionerate: Commissionerate.HYDERABAD_CITY, keywords: ['panjagutta', 'ameerpet', 'somajiguda'], lat: 17.4264, lng: 78.4531 },
  
  // Cyberabad - South Zone (User Area)
  { id: 'cb-4', name: 'Rajendranagar', phone: '040-27854611', mobile: '9490617304', commissionerate: Commissionerate.CYBERABAD, keywords: ['rajendranagar', 'budvel', 'agr university'], lat: 17.3200, lng: 78.4035 },
  { id: 'cb-41', name: 'Mailardevpally', phone: '040-27854614', mobile: '9490617267', commissionerate: Commissionerate.CYBERABAD, keywords: ['mailardevpally', 'katedan', 'shastripuram', 'durga nagar'], lat: 17.3235, lng: 78.4385 },
  { id: 'cb-42', name: 'Attapur', phone: '040-27854613', mobile: '9490617130', commissionerate: Commissionerate.CYBERABAD, keywords: ['attapur', 'hyderguda', 'pillar 100'], lat: 17.3620, lng: 78.4230 },
  { id: 'cb-43', name: 'Shamshabad', phone: '040-27854615', mobile: '9490617306', commissionerate: Commissionerate.CYBERABAD, keywords: ['shamshabad', 'airport', 'rgia'], lat: 17.2520, lng: 78.4320 },
  
  // Cyberabad - West Zone
  { id: 'cb-10', name: 'Madhapur', phone: '040-27854581', mobile: '9490617310', commissionerate: Commissionerate.CYBERABAD, keywords: ['madhapur', 'hitech city', 'inorbit'], lat: 17.4483, lng: 78.3915 },
  { id: 'cb-11', name: 'Raidurgam', phone: '040-27854582', mobile: '9490617311', commissionerate: Commissionerate.CYBERABAD, keywords: ['raidurgam', 'biodiversity', 'mindspace'], lat: 17.4287, lng: 78.3811 },
  { id: 'cb-12', name: 'Gachibowli', phone: '040-27854583', mobile: '9490617312', commissionerate: Commissionerate.CYBERABAD, keywords: ['gachibowli', 'financial district', 'dlf'], lat: 17.4401, lng: 78.3489 },
  { id: 'cb-13', name: 'Narsingi', phone: '040-27854584', mobile: '9490617313', commissionerate: Commissionerate.CYBERABAD, keywords: ['narsingi', 'kokapet', 'gandipet', 'manikonda'], lat: 17.3911, lng: 78.3325 },
  
  // Rachakonda
  { id: 'rk-12', name: 'LB Nagar', phone: '040-27853819', mobile: '9490617212', commissionerate: Commissionerate.RACHAKONDA, keywords: ['lb nagar', 'lal bahadur nagar'], lat: 17.3457, lng: 78.5522 },
  { id: 'rk-3', name: 'Uppal', phone: '040-27854080', mobile: '9490617203', commissionerate: Commissionerate.RACHAKONDA, keywords: ['uppal', 'stadium', 'boduppal'], lat: 17.4018, lng: 78.5602 },
];