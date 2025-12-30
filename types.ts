export enum Commissionerate {
  HYDERABAD_CITY = 'Hyderabad City',
  CYBERABAD = 'Cyberabad',
  RACHAKONDA = 'Rachakonda',
  WOMEN_PS = 'Women PS',
  BHAROSA = 'Bharosa Centres'
}

export interface Station {
  id: string;
  name: string;
  phone: string;
  mobile?: string;
  secondaryPhone?: string;
  commissionerate: Commissionerate;
  area?: string;
  keywords: string[];
  lat: number;
  lng: number;
}

export interface LocationState {
  lat: number | null;
  lng: number | null;
  address: string | null;
  loading: boolean;
  error: string | null;
}

export interface FIRDraft {
  issueType: string;
  date: string;
  location: string;
  description: string;
  timestamp: string;
  complainantName: string;
  complainantPhone: string;
  suspectDetails: string;
  vehicleDetails: string;
  coords?: { lat: number; lng: number };
  imageData?: string;
}