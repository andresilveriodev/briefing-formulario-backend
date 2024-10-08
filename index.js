// Importações e configuração inicial
const { google } = require('googleapis'); // Importa a biblioteca googleapis
const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;
require('dotenv').config(); // Carrega as variáveis de ambiente do arquivo .env
const nodemailer = require('nodemailer');
const sendEmail = require('./sendEmail');

// Permitir CORS para todas as origens
app.use(cors());

// Adiciona este middleware para processar dados JSON
app.use(express.json());


// Configuração da Google Sheets API
const sheets = google.sheets('v4');
const auth = new google.auth.GoogleAuth({
  credentials: {
    type: process.env.GOOGLE_TYPE,
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: process.env.GOOGLE_AUTH_URI,
    token_uri: process.env.GOOGLE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

// Função para gravar dados na planilha
async function gravarNoSheet(formData) {
  const client = await auth.getClient();
  const spreadsheetId = '1GcCVBkRESLjmhpKpk6Tc1TQtYd_b4rJK_ykhe4fpPug';
  const range = 'Sheet1!A:B'; // Ajuste o intervalo conforme necessário

  const currentDate = new Date();
  const month = currentDate.toLocaleString('default', { month: 'long' }); // Nome do mês
  const year = currentDate.getFullYear();
  
  const values = [
    [
      new Date().toISOString(),  // Data e hora do envio
      formData.solicitante,      // Quem está solicitando
      formData.departamento,     // Departamento
      month + " " + year,        // Mês e ano
      formData.tipoFormulario,   // Tipo do formulario
    ]
  ]; 

  const resource = {
    values
  };

  try {
    await sheets.spreadsheets.values.append({
      auth: client,
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      resource
    });
    console.log('Dados gravados na planilha com sucesso.');
  } catch (error) {
    console.error('Erro ao gravar dados na planilha:', error);
  }
}


// Função que envia um e-mail e grava os dados no Google Sheets
async function enviarEmail(formData, res) {
  try {
      await sendEmail(formData); // Chama a função sendEmail para enviar o e-mail
  } catch (error) {
      console.error("Erro ao enviar e-mail:", error);
      res.status(500).send("Erro ao enviar e-mail");
      return; // Para a execução se der erro
  }

  // Gravar os dados no Google Sheets após o envio do e-mail
  await gravarNoSheet(formData);

  res.status(200).send("E-mail enviado com sucesso"); // Esta linha envia a resposta final
}




// Rota para enviar o e-mail
app.post('/send-email', (req, res) => {
  const formData = req.body; // Acessa req.body diretamente
  enviarEmail(formData, res); // Chama a função enviarEmail para processar o envio
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`emailformProject is listening at http://localhost:${port}`);
});



  