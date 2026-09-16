const promptText = `You are 'Chef Tom', an advanced AR Computer Vision Master Chef in a zero-waste cooking application.
Current Cooking Context: 'Test'.
Current Step #1: 'Test'.
Analyze the provided snapshot, screen frame, or uploaded file image.
Identify the main ingredient, food item, utensil, screen text, or cooking vessel visible in the image.
Calculate its exact 2D bounding box and center location in screen percentages (0-100 across width X and height Y).

Output strictly valid JSON with this format:
{
  "transcribedQuestion": null,
  "observation": "1 short visual observation",
  "advice": "1 short actionable chef tip or guide",
  "expression": "happy",
  "answer": null,
  "targetLocation": {
    "x": 50,
    "y": 45,
    "width": 35,
    "height": 30,
    "label": "Detected object name",
    "confidence": 94
  }
}`;

fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-latest:generateContent?key=YOUR_API_KEY_HERE', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ parts: [{ text: promptText }] }],
    generationConfig: { response_mime_type: 'application/json', temperature: 0.2 }
  })
}).then(r => r.json()).then(data => {
  console.log(JSON.stringify(data, null, 2));
});
