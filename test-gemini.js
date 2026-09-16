async function test() {
  const apiKey = "YOUR_API_KEY_HERE";
  const prompt = "Hello";
  const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    })
  });
  console.log('Status:', geminiRes.status);
  console.log('Text:', await geminiRes.text());
}
test();
