import { GoogleGenAI, Type } from "@google/genai";
import { BoundingBox } from "../types";
import { VIOLATION_SCENARIOS } from "./violationScenarios";

/**
 * Using Gemini 3 Flash for maximum reliability on vision tasks.
 */
const VISION_MODEL = 'gemini-3-flash-preview';

/**
 * Maps grounding is specifically supported on Gemini 2.5 series models.
 */
const MAPS_MODEL = 'gemini-2.5-flash';

/**
 * Helper to implement exponential backoff for API calls.
 */
const retryWithBackoff = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error?.status === 429 || error?.message?.includes('429'))) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

/**
 * Robustly extracts raw base64 data from a data URL or string.
 */
const getRawBase64 = (base64: string): string => {
  if (!base64) return "";
  const parts = base64.split(',');
  const raw = parts.length > 1 ? parts[1] : parts[0];
  return raw.trim().replace(/\s/g, "");
};

export const detectSensitiveAreas = async (base64Image: string): Promise<BoundingBox[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const rawData = getRawBase64(base64Image);

  const prompt = `
    Identify and return the bounding boxes for ALL sensitive or identifiable information that must be blurred for privacy:
    1. ALL vehicle license plates.
    2. ALL human faces.
    3. Identifiable animal faces.
    4. ALL advertisements, company names, logos, branding, or promotional text on vehicles or the environment.
    
    Return a JSON array of objects with fields: "label" ("plate", "face", "ad"), "ymin", "xmin", "ymax", "xmax".
    Coordinates normalized 0-1000.
  `;

  try {
    return await retryWithBackoff(async () => {
      const response = await ai.models.generateContent({
        model: VISION_MODEL,
        contents: {
          parts: [
            { inlineData: { data: rawData, mimeType: 'image/jpeg' } },
            { text: prompt }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                ymin: { type: Type.NUMBER },
                xmin: { type: Type.NUMBER },
                ymax: { type: Type.NUMBER },
                xmax: { type: Type.NUMBER },
              },
              required: ["label", "ymin", "xmin", "ymax", "xmax"]
            }
          }
        }
      });

      return response.text ? JSON.parse(response.text) : [];
    });
  } catch (error) {
    console.error("Gemini Detection Error:", error);
    return [];
  }
};

export const analyzeViolation = async (base64Image: string, lang: string = 'en'): Promise<{
  headline: string;
  points: number;
  reasoning: string;
  idiocyScore: number;
  idiocyCategory: string;
  isVehicle: boolean;
  confidence: number;
  rejectionReason?: string;
}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const rawData = getRawBase64(base64Image);

  const prompt = `
    You are a strictly objective civic parking assistant. Your goal is to validate parking reports with high precision.
    Language: ${lang}.

    **Step 1: Strict Validation**
    - **Quality Check**: Reject if blurry, dark, low resolution, or if the vehicle/context is ambiguous.
    - **Violation Check**: Must see CLEAR visual evidence (lines, signs, obstruction). No assumptions.
    - **Privacy**: Confirm sensitive data (faces/plates) is blurred (automatic pass if pre-blurred).
    
    **Step 2: Scoring Engine**
    - **Base Points**: +5 for any high-quality, clear submission.
    - **Violation Bonus**: +15 if a parking violation is CONFIRMED.
    - **Confidence Bonus**: +5 if your confidence > 90%.
    - *Total Calculation*: Sum these up. Max possible single report = 25.

    **Step 3: Output Generation**
    - **headline**: Professional, clear title (e.g., "Sidewalk Obstruction", "Double Parking Detected").
    - **points**: The calculated total from Step 2.
    - **reasoning**: Helpful feedback. 
        - If Approved: "Great catch! Evidence is clear."
        - If Rejected: "Photo does not clearly show a violation. Try capturing road markings."
    - **idiocyScore**: 0-100 (Renamed logic: strictly likelihood of violation).
    - **idiocyCategory**: The specific violation type (e.g., "Bike Lane Blockage").
    - **isVehicle**: true if a vehicle is present.
    - **confidence**: 0-100.
    - **rejectionReason**: 
        - "LOW_QUALITY" (Blurry/Dark)
        - "NO_VIOLATION" (Legal parking or unclear)
        - "UNCERTAIN_VIOLATION" (Confidence < 80%)

    **Step 4: Rejection Trigger**
    - If Quality Fail OR Confidence < 80%: Return points: 0, isVehicle: false, rejectionReason set.

    Return JSON.
  `;

  try {
    return await retryWithBackoff(async () => {
      const response = await ai.models.generateContent({
        model: VISION_MODEL,
        contents: {
          parts: [
            { inlineData: { data: rawData, mimeType: 'image/jpeg' } },
            { text: prompt }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              headline: { type: Type.STRING },
              points: { type: Type.NUMBER },
              reasoning: { type: Type.STRING },
              idiocyScore: { type: Type.NUMBER },
              idiocyCategory: { type: Type.STRING },
              isVehicle: { type: Type.BOOLEAN },
              confidence: { type: Type.NUMBER },
              rejectionReason: { type: Type.STRING, nullable: true }
            },
            required: ["headline", "points", "reasoning", "idiocyScore", "idiocyCategory", "isVehicle", "confidence"]
          }
        }
      });

      if (!response.text) throw new Error("Empty response");
      return JSON.parse(response.text);
    });
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      headline: "Error Analyzing Image",
      points: 0,
      reasoning: "SYSTEM_OFFLINE",
      idiocyScore: 0,
      idiocyCategory: "Unknown",
      isVehicle: false,
      confidence: 0,
      rejectionReason: "SYSTEM_ERROR"
    };
  }
};

export interface Venue {
  name: string;
  address: string;
  url: string;
  location?: { lat: number; lng: number };
}

export const getMapsInfo = async (lat: number, lng: number, query?: string): Promise<Venue[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = query
    ? `Find the location for "${query}" near Lat: ${lat}, Lng: ${lng}. List the top 5 most relevant places.`
    : `List the top 5 businesses or landmarks exactly at or immediately surrounding Lat: ${lat}, Lng: ${lng}.`;

  try {
    return await retryWithBackoff(async () => {
      const response = await ai.models.generateContent({
        model: MAPS_MODEL,
        contents: { parts: [{ text: prompt }] },
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: { latitude: lat, longitude: lng }
            }
          }
        },
      });

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const venues: Venue[] = [];
      if (chunks) {
        chunks.forEach(chunk => {
          if (chunk.maps) {
            venues.push({
              name: chunk.maps.title || "Nearby Venue",
              address: chunk.maps.title || "Found via Satellite",
              url: chunk.maps.uri || "",
            });
          }
        });
      }

      // Filter out duplicates if any
      const uniqueVenues = Array.from(new Map(venues.map(item => [item.name, item])).values());
      return uniqueVenues;
    });
  } catch (error) {
    console.error("Maps Search Error:", error);
    return [];
  }
};