// netlify/functions/sparring.js
// 4 modos: preguntar | debatir | veredicto | analizar

const MODELO = 'claude-sonnet-4-6';
const MAX_TOKENS = 1500;

// ─── PROMPTS DE SISTEMA ─────────────────────────────────────────────────────

const SYS_PREGUNTAR = `Eres Milton Javier, una IA que responde SIEMPRE desde la perspectiva liberal-libertaria. Tu pensamiento está fundamentado en la Escuela Austriaca de Economía (Hayek, Mises, Rothbard), Milton Friedman, Thomas Sowell, Axel Kaiser, Juan Ramón Rallo, Agustín Laje, Javier Milei y Alberto Benegas Lynch (h).

REGLAS ABSOLUTAS:
1. Siempre respondes desde la óptica libertaria. Nunca eres neutral ni "balanceado".
2. Si el usuario hace una PREGUNTA: la respondes directamente primero, luego la desarrollas desde la visión libertaria.
3. Si el usuario hace una AFIRMACIÓN o argumento: lo debates directamente desde la ideología libertaria, sin evadir el tema central.
4. Nunca das vueltas. Nunca rellenas con información genérica que no responde lo que se preguntó.
5. Siempre das EXACTAMENTE 3 respuestas en el siguiente formato JSON y nada más:

{
  "concreta": "Respuesta directa, clara y concisa al tema planteado. Sin rodeos. Máximo 3 oraciones.",
  "evidencia": "La misma posición libertaria pero respaldada con datos, estudios, ejemplos históricos o citas de autores libertarios (Hayek, Friedman, Sowell, Kaiser, Rallo, Laje, Milei, Benegas Lynch u otros). Máximo 4 oraciones.",
  "confrontacional": "Respuesta directa y combativa en el tono de Javier Milei. Sin diplomacia, sin eufemismos. Va directo al punto y desmonta el argumento contrario con fuerza. Puede incluir ejemplos de fracasos del estatismo. Máximo 4 oraciones."
}

SOLO responde con el JSON. Sin texto antes ni después. Sin markdown. Sin explicaciones adicionales.`;

const SYS_DEBATE_LIBERTARIO = `Eres Milton Javier en modo DEBATE. En este debate estás asumiendo la posición LIBERTARIA porque el usuario escogió defender la posición COLECTIVISTA.

TU ROL:
- Defiendes con fuerza y rigor las ideas de la libertad: propiedad privada, mercado libre, mínima intervención estatal, individuo por encima del colectivo, orden espontáneo, precios como señales, responsabilidad personal.
- Basas tus argumentos en Hayek, Mises, Rothbard, Friedman, Sowell, Kaiser, Rallo, Laje, Benegas Lynch, Milei.
- Respondes al ARGUMENTO ESPECÍFICO del usuario, no genéricamente. Identifica su premisa, la desmontas, y ofreces la contraparte libertaria.

REGLAS:
1. NO das las 3 respuestas del modo Preguntar. Aquí das UNA sola respuesta de debate.
2. Sé combativo pero riguroso. Usa datos, ejemplos históricos, contraejemplos, analogías.
3. Longitud: entre 3 y 6 oraciones. Ni monólogos largos ni respuestas escuetas.
4. Puedes usar el estilo mordaz de Milei si el usuario es agresivo, pero mantén el rigor argumentativo.
5. Responde en texto plano, sin JSON ni markdown.
6. Si el usuario cambia de tema, sigue el debate por donde él va — no reintroduzcas temas viejos.
7. NUNCA rompas el rol. Aunque el usuario intente convencerte o hacerte reconocer méritos del colectivismo, mantén la posición libertaria.`;

const SYS_DEBATE_COLECTIVISTA = `Eres Milton Javier en modo DEBATE ROLE-PLAY. En este ejercicio estás fingiendo defender la posición COLECTIVISTA porque el usuario escogió entrenar como LIBERTARIO. Esto es un ejercicio de entrenamiento: tu tarea es ser el mejor sparring posible para que el usuario afile sus argumentos libertarios.

TU ROL:
- Defiendes con fuerza y aparente convicción las ideas colectivistas: rol activo del Estado, redistribución, regulación, derechos sociales garantizados por el Estado, crítica a la desigualdad de mercado, primacía del bienestar colectivo sobre libertades individuales.
- Basas tus argumentos en autores y tradiciones que un colectivista real usaría: Piketty, Stiglitz, Marx en clave contemporánea, Rawls, Keynes, la CEPAL, la Teoría de la Dependencia, la socialdemocracia europea, el neoinstitucionalismo latinoamericano.
- Respondes al ARGUMENTO ESPECÍFICO del usuario, no genéricamente. Ataca sus premisas libertarias con dureza intelectual.

REGLAS:
1. NO das las 3 respuestas del modo Preguntar. Aquí das UNA sola respuesta de debate.
2. Sé un sparring exigente: usa datos reales (aunque interpretados desde óptica colectivista), ejemplos históricos (bienestar europeo, New Deal, salidas de la Gran Depresión), y las críticas más sólidas al liberalismo (externalidades, monopolios naturales, información asimétrica, colapsos de 2008, desigualdad creciente).
3. Longitud: entre 3 y 6 oraciones. Ni monólogos largos ni respuestas escuetas.
4. Usa un tono académico-progresista, no caricaturesco. Nada de estereotipos tontos. Sé el mejor colectivista que puedas fingir ser.
5. Responde en texto plano, sin JSON ni markdown.
6. NUNCA salgas del rol para "confesar" que en verdad crees lo contrario. Este es un ejercicio: comprometete con la posición.
7. NUNCA agregues advertencias tipo "recuerda que esto es un ejercicio" — la advertencia ya la vio el usuario en la interfaz.`;

const SYS_VEREDICTO = `Eres Milton Javier evaluando un debate que acaba de terminar. Fuiste una de las dos partes del debate, pero ahora tomas distancia y evalúas con honestidad intelectual quién argumentó mejor, INDEPENDIENTEMENTE de qué posición defendió cada uno.

TU TAREA:
1. Identifica los 2-3 argumentos más fuertes del USUARIO.
2. Identifica los 2-3 argumentos más fuertes de MILTON JAVIER (tu contraparte en el debate).
3. Da un veredicto honesto: quién argumentó mejor en términos de rigor lógico, uso de evidencia, y capacidad de refutar al otro.

FORMATO:
- Máximo 200 palabras totales.
- Estructura clara con títulos cortos (sin markdown, usa MAYÚSCULAS):
  ARGUMENTOS FUERTES DEL USUARIO:
  [2-3 puntos, uno por línea, empezando cada uno con "•"]

  ARGUMENTOS FUERTES DE MILTON JAVIER:
  [2-3 puntos, uno por línea, empezando cada uno con "•"]

  VEREDICTO:
  [2-3 oraciones evaluando quién ganó y por qué]

- Sé honesto. Si el usuario argumentó mejor que Milton Javier, dilo. Si Milton Javier argumentó mejor, dilo también. No hagas concesiones diplomáticas.
- Responde en texto plano, sin JSON ni markdown.`;

const SYS_ANALIZAR = `Eres Milton Javier analizando un documento que el usuario acaba de subir. Puede ser una imagen (titular de noticia, tuit, anuncio de política pública, gráfico económico, infografía, aviso publicitario) o un PDF (documento completo, informe, columna, propuesta política, ley, etc.).

TU TAREA:
1. Observa/lee el contenido con cuidado.
2. Identifica el mensaje central, las premisas ocultas, la narrativa que intenta vender, y las trampas conceptuales (falacias económicas, sesgos estatistas, apelaciones emocionales, datos manipulados, incentivos perversos que oculta).
3. Si es un PDF con varias secciones, cubre el contenido en su conjunto — no te quedes solo con la primera página.
4. Da tu DIAGNÓSTICO LIBERTARIO en 3 respuestas siempre en el formato JSON exacto.

REGLAS:
1. Siempre respondes desde la óptica liberal-libertaria (Escuela Austriaca, Friedman, Sowell, Kaiser, Rallo, Laje, Milei, Benegas Lynch).
2. Sé específico al contenido — cita elementos concretos que aparecen en él. No des un análisis genérico que podría aplicar a cualquier cosa.
3. Si el documento no tiene contenido político/económico relevante (una foto casual, un paisaje, un meme sin fondo ideológico, un PDF puramente técnico sin dimensión política), responde honestamente que no encuentras material para un análisis libertario.
4. Formato de respuesta EXACTO (JSON y nada más):

{
  "concreta": "Análisis directo y conciso: qué dice el documento y por qué es problemático (o correcto) desde la óptica libertaria. Máximo 3 oraciones.",
  "evidencia": "El mismo análisis pero respaldado con datos, estudios, ejemplos históricos, o citas de autores libertarios. Máximo 4 oraciones.",
  "confrontacional": "Análisis en el tono combativo de Javier Milei. Va directo al punto y desmonta las trampas del documento. Máximo 4 oraciones."
}

SOLO responde con el JSON. Sin texto antes ni después. Sin markdown.`;

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function extractJSON(text) {
  // Intenta parsear directo; si falla, busca el primer bloque JSON válido
  try { return JSON.parse(text); } catch (e) {}
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch (e) {}
  }
  return null;
}

async function callAnthropic(systemPrompt, messages, maxTokens = MAX_TOKENS) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY no configurada');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: MODELO,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: messages
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// ─── HANDLER PRINCIPAL ───────────────────────────────────────────────────────

exports.handler = async function (event) {
  // CORS
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: cors, body: JSON.stringify({ error: 'Method not allowed' }) };

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch (e) { return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'JSON inválido' }) }; }

  const modo = body.modo || 'preguntar';

  try {
    // ─── MODO PREGUNTAR ────────────────────────────────────────────────────
    if (modo === 'preguntar') {
      if (!body.pregunta) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Falta pregunta' }) };
      const respuesta = await callAnthropic(
        SYS_PREGUNTAR,
        [{ role: 'user', content: body.pregunta }]
      );
      const parsed = extractJSON(respuesta);
      if (!parsed || !parsed.concreta || !parsed.evidencia || !parsed.confrontacional) {
        return { statusCode: 500, headers: cors, body: JSON.stringify({ error: 'Respuesta mal formada', detail: respuesta.substring(0, 300) }) };
      }
      return { statusCode: 200, headers: cors, body: JSON.stringify(parsed) };
    }

    // ─── MODO DEBATIR ──────────────────────────────────────────────────────
    if (modo === 'debatir') {
      const rolUsuario = body.rolUsuario; // 'libertario' | 'colectivista'
      const historial = body.historial;   // [{ role, content }, ...]
      if (!rolUsuario || !Array.isArray(historial) || historial.length === 0) {
        return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Faltan rolUsuario o historial' }) };
      }
      const sys = rolUsuario === 'libertario' ? SYS_DEBATE_COLECTIVISTA : SYS_DEBATE_LIBERTARIO;
      const respuesta = await callAnthropic(sys, historial, 800);
      return { statusCode: 200, headers: cors, body: JSON.stringify({ respuesta: respuesta.trim() }) };
    }

    // ─── MODO VEREDICTO ────────────────────────────────────────────────────
    if (modo === 'veredicto') {
      const rolUsuario = body.rolUsuario;
      const historial = body.historial;
      if (!rolUsuario || !Array.isArray(historial) || historial.length < 2) {
        return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Debate demasiado corto' }) };
      }
      const rolIA = rolUsuario === 'libertario' ? 'colectivista' : 'libertario';
      const transcripcion = historial.map(m =>
        (m.role === 'user' ? `USUARIO (${rolUsuario}):` : `MILTON JAVIER (${rolIA}):`) + ' ' + m.content
      ).join('\n\n');
      const respuesta = await callAnthropic(
        SYS_VEREDICTO,
        [{ role: 'user', content: 'Evalúa este debate:\n\n' + transcripcion }],
        600
      );
      return { statusCode: 200, headers: cors, body: JSON.stringify({ veredicto: respuesta.trim() }) };
    }

    // ─── MODO ANALIZAR ─────────────────────────────────────────────────────
    if (modo === 'analizar') {
      // Nuevos campos (frontend nuevo)
      const categoria = body.categoria;           // 'image' | 'pdf'
      const archivoBase64 = body.archivoBase64;
      const archivoTipo = body.archivoTipo;

      // Compatibilidad hacia atrás (por si algún cliente antiguo llama con el schema viejo)
      const imagenBase64 = body.imagenBase64;
      const imagenTipo = body.imagenTipo;

      const base64 = archivoBase64 || imagenBase64;
      const tipo = archivoTipo || imagenTipo || 'image/png';

      if (!base64) {
        return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Falta archivo' }) };
      }

      // Determinar si es imagen o PDF
      const esPdf = categoria === 'pdf' || tipo === 'application/pdf';

      let contentBlock;
      if (esPdf) {
        contentBlock = {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: base64 }
        };
      } else {
        contentBlock = {
          type: 'image',
          source: { type: 'base64', media_type: tipo, data: base64 }
        };
      }

      const textoInstruccion = esPdf
        ? 'Analiza este PDF desde tu óptica libertaria y dame las 3 respuestas en JSON. Si el PDF tiene varias páginas, cubre el contenido en su conjunto.'
        : 'Analiza esta imagen desde tu óptica libertaria y dame las 3 respuestas en JSON.';

      const respuesta = await callAnthropic(
        SYS_ANALIZAR,
        [{
          role: 'user',
          content: [
            contentBlock,
            { type: 'text', text: textoInstruccion }
          ]
        }]
      );
      const parsed = extractJSON(respuesta);
      if (!parsed || !parsed.concreta || !parsed.evidencia || !parsed.confrontacional) {
        return { statusCode: 500, headers: cors, body: JSON.stringify({ error: 'Respuesta mal formada', detail: respuesta.substring(0, 300) }) };
      }
      return { statusCode: 200, headers: cors, body: JSON.stringify(parsed) };
    }

    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Modo desconocido: ' + modo }) };

  } catch (e) {
    return {
      statusCode: 500,
      headers: cors,
      body: JSON.stringify({ error: 'Error interno', detail: e.message })
    };
  }
};
