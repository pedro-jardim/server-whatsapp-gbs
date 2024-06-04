const express = require('express');
const { create, Whatsapp } = require('venom-bot');
const dotenv = require ('dotenv');

dotenv.config();

const app = express();
app.use(express.json());

let clients = {};

// Endpoint para iniciar uma nova sessão
app.post('/start', (req, res) => {
  const { sessionName } = req.body;
  if (clients[sessionName]) {
    return res.status(400).json({ error: 'Sessão já existe' });
  }

  create(
    sessionName,
    (base64Qr, asciiQR) => {
      console.log(asciiQR); // Mostra o QR code no terminal
    },
    undefined,
    { logQR: false } // Não loga QR code como imagem base64 no terminal
  )
    .then((client) => {
      clients[sessionName] = client;      
      client.sendText(process.env.NUMEROWPP, 'Servidor Iniciado')
      
      res.json({ status: 'Serviço Iniciado para a sessão', sessionName });
    })
    .catch((err) => {
      res.status(500).json({ error: err.message });
    });
});

// Endpoint para enviar uma mensagem
app.post('/send', (req, res) => {
  const { sessionName, to, message } = req.body;
  const client = clients[sessionName];

  if (!client) {
    return res.status(404).json({ error: 'Sessão não encontrada' });
  }

  client
    .sendText(to, message)
    .then((result) => {
      res.json({ status: 'Mensagem Enviada com Sucesso!' });
    })
    .catch((err) => {
      res.status(500).json({ error: err.message });
    });
});

// Endpoint para parar uma sessão
app.post('/stop', (req, res) => {
  const { sessionName } = req.body;
  const client = clients[sessionName];

  if (!client) {
    return res.status(404).json({ error: 'Sessão não encontrada' });
  }

  client.close().then(() => {
    delete clients[sessionName];
    res.json({ status: 'Serviço foi Parado', sessionName });
  }).catch((err) => {
    res.status(500).json({ error: err.message });
  });
});

const PORT = process.env.PORT || 3100;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
