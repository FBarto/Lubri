
const API_KEY = "AIzaSyAag7U7qU-hv0vwrMEf6eC4iFKnuRxbsQM";
const QUERY = "FB Lubricentro y Baterías Villa Carlos Paz";

async function findPlaceId() {
    const url = `https://places.googleapis.com/v1/places:searchText`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': API_KEY,
                'X-Goog-FieldMask': 'places.name,places.id,places.formattedAddress'
            },
            body: JSON.stringify({
                textQuery: QUERY
            })
        });
        const data = await response.json();

        if (data.places && data.places.length > 0) {
            console.log("Found Place Name (Resource):", data.places[0].name);
            console.log("Place ID:", data.places[0].id);
            console.log("Address:", data.places[0].formattedAddress);
        } else {
            console.log("No results found.");
            console.log("Response:", JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error("Error fetching place:", error);
    }
}

findPlaceId();
