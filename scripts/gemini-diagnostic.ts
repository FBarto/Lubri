import { GoogleGenerativeAI } from "@google/generative-ai";

async function diagnostic() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error("❌ No hay API Key en el entorno.");
        return;
    }

    const genAI = new GoogleGenerativeAI(key);

    console.log("--- DIAGNÓSTICO DE API KEY ---");
    console.log("Key (recortada):", key.substring(0, 8) + "...");

    // Test 1: Gemini 1.5 Flash (Most stable for paid)
    try {
        console.log("\n1. Probando Gemini 1.5 Flash...");
        const model15 = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const res15 = await model15.generateContent("Test");
        console.log("✅ 1.5 Flash OK:", res15.response.text().substring(0, 10));
    } catch (e: any) {
        console.log("❌ 1.5 Flash Falló:", e.status, e.statusText);
        if (e.status === 429) console.log("   Causa: Límite de cuota (Rate Limit).");
    }

    // Test 2: Gemini 2.0 Flash (Experimental)
    try {
        console.log("\n2. Probando Gemini 2.0 Flash...");
        const model20 = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const res20 = await model20.generateContent("Test");
        console.log("✅ 2.0 Flash OK:", res20.response.text().substring(0, 10));
    } catch (e: any) {
        console.log("❌ 2.0 Flash Falló:", e.status, e.statusText);
    }
}

diagnostic().catch(console.error);
