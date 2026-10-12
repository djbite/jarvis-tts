const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const text = req.query.text || 'Привет, сэр. Джарвис готов к работе.';
  const voice = req.query.voice || 'ru-RU-DmitryNeural';

  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const readable = tts.toStream(text);

    const chunks = [];
    readable.on('data', (chunk) => chunks.push(chunk));
    readable.on('end', () => {
      const audioBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.status(200).send(audioBuffer);
    });
    readable.on('error', async (err) => {
      console.error('Edge TTS error, fallback to Google:', err);
      fallbackGoogle(text, res);
    });
  } catch (err) {
    console.error('Edge TTS init error, fallback to Google:', err);
    fallbackGoogle(text, res);
  }
};

async function fallbackGoogle(text, res) {
  try {
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=ru&client=tw-ob`;
    const upstream = await fetch(ttsUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const buf = await upstream.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    return res.status(200).send(Buffer.from(buf));
  } catch (e) {
    return res.status(500).send('Error: ' + e.message);
  }
}
