const key = 'AQ.Ab8RN6Je_1vwkg3Q69Ym_i3SDlcuITqhjMMPS-7-svBctYnzEw';
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    contents: [{ parts: [{ text: 'Hello' }] }]
  })
})
.then(res => res.json())
.then(data => {
  if (data.error) {
    console.error('Gemini Live Test Failed:', data.error);
    process.exit(1);
  } else {
    console.log('Gemini Live Test Success:', JSON.stringify(data.candidates[0].content.parts));
  }
})
.catch(err => {
  console.error('Gemini Live Test Network Error:', err);
  process.exit(1);
});
