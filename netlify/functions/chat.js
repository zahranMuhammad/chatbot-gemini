const fetch = require('node-fetch');

exports.handler = async (event) => {
  const API_KEY = process.env.GEMINI_API_KEY; 
  const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  try {
    const body = JSON.parse(event.body);
    const response = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: body.contents })
    });

    const data = await response.json();
    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};