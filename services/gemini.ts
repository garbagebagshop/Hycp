import { GoogleGenAI, Type } from "@google/genai";
import { Station } from "../types";
import { POLICE_STATIONS } from "../constants";

/**
 * Uses Gemini to resolve a highly specific sub-locality or colony name from coordinates.
 * Specially tuned for Old City Hyderabad where PS limits are very dense.
 */
export async function resolveAreaName(lat: number, lng: number): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `The user is at Coordinates (${lat}, ${lng}) in Hyderabad. 
      STRICT REQUIREMENT: Identify the most specific, localized neighborhood, colony, or sub-locality name. 
      NOTE: This area (around 17.36) is high-density Old City. Distinguish between Hussaini Alam, Charminar, Shahinayathgunj, and Begum Bazar carefully.
      Return ONLY the specific name as a single string.`,
    });

    return response.text?.trim() || "Hyderabad Area";
  } catch (error) {
    console.error("Gemini area resolution failed:", error);
    return "Hyderabad Area";
  }
}

/**
 * Uses Gemini to find the most relevant police station based on coordinates or text.
 */
export async function findNearbyStations(query: string, coords?: { lat: number; lng: number }): Promise<Station[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const stationDetails = POLICE_STATIONS.map(s => `${s.name} PS (${s.commissionerate})`).join(', ');
  
  const prompt = coords 
    ? `The user is at Coordinates (${coords.lat}, ${coords.lng}) in Hyderabad. 
       CORE TASK: Find the exact Police Station jurisdiction for this specific point. 
       PRECISION RULE: In the Old City (South Zone), boundaries are tight. 
       If the user is south of the Musi river near Chowmahalla, it is likely Hussaini Alam. 
       If they are near the Charminar monument, it is Charminar PS. 
       If they are in the wholesale markets near MJ Market, it is Begum Bazar.
       If they are in Dhoolpet/Goshamahal, it is Shahinayathgunj.
       Available Stations: [${stationDetails}]. 
       Return ONLY a JSON array of the top 3 most relevant Station Names in order of proximity.`
    : `Find the police stations matching query: "${query}". 
       Available Stations: [${stationDetails}]. 
       Return ONLY a JSON array of the top 3 Station Names.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const matchedNames: string[] = JSON.parse(response.text || "[]");
    
    const results: Station[] = [];
    matchedNames.forEach(name => {
      const station = POLICE_STATIONS.find(s => 
        name.toLowerCase().includes(s.name.toLowerCase()) || 
        s.name.toLowerCase().includes(name.toLowerCase())
      );
      if (station && !results.find(r => r.id === station.id)) {
        results.push(station);
      }
    });

    return results.length > 0 ? results : POLICE_STATIONS.slice(0, 3);
  } catch (error) {
    console.error("Gemini mapping failed:", error);
    const normalizedQuery = query.toLowerCase();
    return POLICE_STATIONS.filter(s => 
      s.name.toLowerCase().includes(normalizedQuery) || 
      s.keywords.some(k => k.toLowerCase().includes(normalizedQuery))
    ).slice(0, 3);
  }
}