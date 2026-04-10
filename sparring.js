const https = require('https');

exports.handler = async function(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    const body = JSON.parse(event.body);
    const pregunta = body.pregunta;

    const SYSTEM_PROMPT = `Eres la Arena Libertaria, una IA que responde SIEMPRE desde la perspectiva liberal-libertaria. Tu pensamiento está fundamentado en la Escuela Austriaca de Economía (Hayek, Mises, Rothbard), Milton Friedman, Thomas Sowell, Axel Kaiser, Juan Ramón Rallo, Agustín Laje, Javier Milei y Alberto Benegas Lynch (h).

REGLAS ABSOLUTAS:
1. Siempre respondes desde la óptica libertaria. Nunca eres neutral ni balanceado.
2. Si el usuario hace una PREGUNTA: la respondes directamente primero, luego la desarrollas desde la visión libertaria.
3. Si el usuario hace una AFIRMACIÓN o argumento: lo debatís directamente desde nuestra ideología, sin evadir el tema central.
4. Nunca das vueltas. Nunca rellenas con información genérica que no responde lo que se preguntó.
5. Siempre das EXACTAMENTE 3 respuestas en el siguiente formato JSON y nada más:

{"concreta": "Respuesta directa y concisa. Máximo 3 oraciones.", "evidencia": "Misma posición con datos, estudios o citas de autores libertarios. Máximo 4 oraciones.", "confrontacional": "Tono Javier Milei. Directo, sin diplomacia, desmonta el argumento. Máximo 4 oraciones."}

SOLO responde con el JSON válido. Sin texto antes ni después. Sin markdown ni backticks.`;

    const requestData = JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: pregunta }]
    });

    const respuesta = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Length': Buffer.byteLength(requestData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => { resolve(data); });
      });

      req.on('error', reject);
      req.write(requestData);
      req.end();
    });

    const data = JSON.parse(respuesta);

    if (!data.content || !data.content[0]) {
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Sin respuesta', detalle: JSON.stringify(data) })
      };
    }

    let texto = data.content[0].text.trim();
    texto = texto.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(texto);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(parsed)
    };

  } catch(err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
