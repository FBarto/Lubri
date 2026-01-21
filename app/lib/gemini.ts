'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Definimos la estructura para mantener el sistema Type-safe
export interface StructuredLead {
    vehicle_model: string | null;
    plate: string | null;
    service_type: string | null;
    urgency: 'baja' | 'media' | 'alta' | null;
    summary: string | null;
}

// Usamos el modelo flash con una configuración de respuesta tipo JSON
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
        responseMimeType: "application/json",
    }
});

/**
 * Generic function to generate content from Gemini
 */
export async function generateAIContent(prompt: string) {
    if (!process.env.GEMINI_API_KEY) {
        return { success: false, error: "GEMINI_API_KEY is not defined in .env" };
    }

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return { success: true, text };
    } catch (error: any) {
        console.error("Gemini API Error:", error);
        return { success: false, error: error.message || "Failed to generate AI content" };
    }
}

/**
 * Procesa el mensaje del cliente y devuelve un objeto estructurado.
 */
export async function parseLeadIntake(rawText: string): Promise<{
    success: boolean;
    data?: StructuredLead;
    error?: string;
}> {
    if (!process.env.GEMINI_API_KEY) {
        return { success: false, error: "API Key no configurada en el servidor." };
    }

    const prompt = `
    Eres un asistente experto de un Lubricentro llamado "Lubri".
    Analiza el mensaje del cliente y extrae la información técnica necesaria.
    
    Mensaje del cliente: "${rawText}"
    
    Formato de salida (JSON):
    {
      "vehicle_model": "Marca y modelo",
      "plate": "Patente/Dominio",
      "service_type": "Servicio solicitado",
      "urgency": "baja" | "media" | "alta",
      "summary": "Resumen conciso"
    }
    
    Reglas:
    - Si no conoces un dato, pon null.
    - La urgencia "alta" es para goteos de aceite, ruidos fuertes o viajes inminentes.
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Al usar responseMimeType: "application/json", Gemini ya no envía ```json
        const parsedData = JSON.parse(text) as StructuredLead;

        return {
            success: true,
            data: parsedData
        };

    } catch (error: any) {
        console.error("Lubri AI Error:", error);
        return {
            success: false,
            error: "Error procesando el mensaje del cliente."
        };
    }
}

/**
 * Genera un "Insight del Mecánico" basado en el historial del vehículo.
 */
export async function generateVehicleInsight(historyText: string): Promise<{
    success: boolean;
    insight?: string;
    error?: string;
}> {
    if (!process.env.GEMINI_API_KEY) {
        return { success: false, error: "API Key no configurada." };
    }

    const prompt = `
    Eres un asesor técnico Senior de un Lubricentro llamado "Lubri". 
    Tu objetivo es analizar el historial de servicios de un vehículo y dar una recomendación estratégica de máximo 20 palabras.
    
    Busca patrones como:
    - Kilometraje acumulado (si no cambió filtros hace mucho).
    - Tipo de aceite usado siempre.
    - Oportunidades de venta (si nunca cambió batería o líquido de freno).
    
    Historial:
    "${historyText}"
    
    Respuesta esperada: Una frase corta, directa y profesional que ayude al vendedor a ofrecer algo extra o confirmar el servicio actual. Empieza con un emoji relacionado.
  `;

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();

        return {
            success: true,
            insight: text
        };

    } catch (error: any) {
        console.error("Lubri Insight Error:", error);
        return {
            success: false,
            error: "No se pudo generar el insight."
        };
    }
}
