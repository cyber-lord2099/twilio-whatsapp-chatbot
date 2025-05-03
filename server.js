require('dotenv').config();
const express = require('express');
const twilio = require('twilio');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;

// Validate Twilio credentials and initialize client
let client;
try {
  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials are missing. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in environment variables.');
  }
  client = new twilio(accountSid, authToken);
} catch (error) {
  console.error('Failed to initialize Twilio client:', error.message);
  client = null;
}

// Store user state (in-memory; use a database in production)
const userState = {};

// Sub-schemes for each main scheme
const subSchemes = {
  '1': [
    '1. मॅट्रिकपूर्व शिष्यवृती',
    '2. मॅट्रिकोत्तर शिष्यवृती',
    '3. परदेशात उच्च शिक्षणासाठी शिष्यवृती योजना'
  ],
  '2': [], // ज्ञानज्योती सावित्रीबाई फुले आधार योजना has no sub-schemes
  '3': [], // पंडित दीनदयाळ उपाध्याय स्वयंम योजना has no sub-schemes
  '4': [], // मोदी आवास योजना has no sub-schemes
  '5': [], // मॅट्रिक पूर्व शिष्यवृत्ती योजना has no sub-schemes
  '6': [], // इतर मागास बहुजन कल्याण मुलांचे शासकीय वसतीगृह कोल्हापूर has no sub-schemes
  '7': []  // इतर मागास बहुजन कल्याण मुलींचे शासकीय वसतीगृह कोल्हापूर has no sub-schemes
};

// Sub-scheme details
const subSchemeDetails = {
  '1': {
    '1': 'लाभ घेणारा प्रवर्ग: इतर मागास वर्ग व VJNT व SBC\n\n१. मॅट्रिकपूर्व शिष्यवृती\n   या योजनेंतर्गत इतर मागास वर्ग (OBC), विमुक्त जाती (VJNT), आणि विशेष मागास प्रवर्ग (SBC) मधील विद्यार्थ्यांना मॅट्रिकपूर्व शिक्षणासाठी शिष्यवृत्ती दिली जाते. या योजनेचा उद्देश प्राथमिक आणि माध्यमिक स्तरावर शिक्षणाला प्रोत्साहन देणे हा आहे.',
    '2': 'लाभ घेणारा प्रवर्ग: इतर मागास वर्ग व VJNT व SBC\n\n२. मॅट्रिकोत्तर शिष्यवृती\n   या योजनेंतर्गत इतर मागास वर्ग (OBC), विमुक्त जाती (VJNT), आणि विशेष मागास प्रवर्ग (SBC) मधील विद्यार्थ्यांना मॅट्रिकोत्तर शिक्षणासाठी शिष्यवृत्ती दिली जाते. या योजनेचा उद्देश उच्च शिक्षणाला प्रोत्साहन देणे हा आहे.',
    '3': 'लाभ घेणारा प्रवर्ग: इतर मागास वर्ग व VJNT व SBC\n\n३. परदेशात उच्च शिक्षणासाठी शिष्यवृती योजना\n   या योजनेंतर्गत इतर मागास वर्ग (OBC), विमुक्त जाती (VJNT), आणि विशेष मागास प्रवर्ग (SBC) मधील गुणवंत विद्यार्थ्यांना परदेशात उच्च शिक्षण घेण्यासाठी शिष्यवृत्ती दिली जाते. या योजनेचा उद्देश आंतरराष्ट्रीय स्तरावर शिक्षणाची संधी उपलब्ध करून देणे हा आहे.'
  },
  '2': {
    '0': 'लाभ घेणारा प्रवर्ग: OBC, VJNT व SBC\n\nज्ञानज्योती सावित्रीबाई फुले आधार योजना\n   या योजनेंतर्गत इतर मागास प्रवर्ग (OBC), विमुक्त जाती (VJNT), आणि विशेष मागास प्रवर्ग (SBC) मधील मुलींना शिक्षणासाठी आर्थिक आधार दिला जातो. या योजनेचा उद्देश मुलींच्या शिक्षणाला प्रोत्साहन देणे आणि त्यांना स्वावलंबी बनविणे हा आहे.'
  },
  '3': {
    '0': 'पंडित दीनदयाळ उपाध्याय स्वयंम योजना\n   धनगर समाजाच्या विद्यार्थ्यांसाठी पंडित दीनदयाल उपाध्याय स्वयंम योजना राबविली जाते. या योजनेंतर्गत धनगर समाजातील विद्यार्थ्यांना स्वयंरोजगार आणि कौशल्य विकासासाठी प्रशिक्षण आणि आर्थिक सहाय्य दिले जाते.'
  },
  '4': {
    '0': 'मोदी आवास योजना\n   या योजनेअंतर्गत घरकुले बांधण्यासाठी मदत दिली जाते. विमुक्त जाती आणि भटक्या जमातींसह इतर मागास प्रवर्गातील कुटुंबांना निवासासाठी आर्थिक सहाय्य प्रदान केले जाते.'
  },
  '5': {
    '0': 'मॅट्रिक पूर्व शिष्यवृत्ती योजना\n   या योजनेंतर्गत इतर मागास वर्ग (OBC), विमुक्त जाती (VJNT), आणि विशेष मागास प्रवर्ग (SBC) मधील विद्यार्थ्यांना मॅट्रिकपूर्व शिक्षणासाठी शिष्यवृत्ती दिली जाते. या योजनेचा उद्देश प्राथमिक आणि माध्यमिक स्तरावर शिक्षणाला प्रोत्साहन देणे हा आहे.'
  },
  '6': {
    '0': 'इतर मागास बहुजन कल्याण मुलांचे शासकीय वसतीगृह कोल्हापूर\n   या योजनेंतर्गत इतर मागास प्रवर्ग, विमुक्त जाती, भटक्या जमाती व विशेष मागास प्रवर्ग या प्रवर्गातील मुलांसाठी कोल्हापूर येथे शासकीय वसतीगृह चालविले जाते. या वसतीगृहात मुलांना मोफत निवास, भोजन आणि शैक्षणिक सुविधा पुरविल्या जातात.'
  },
  '7': {
    '0': 'इतर मागास बहुजन कल्याण मुलींचे शासकीय वसतीगृह कोल्हापूर\n   या योजनेंतर्गत इतर मागास प्रवर्ग, विमुक्त जाती, भटक्या जमाती व विशेष मागास प्रवर्ग या प्रवर्गातील मुलींसाठी कोल्हापूर येथे शासकीय वसतीगृह चालविले जाते. या वसतीगृहात मुलींना मोफत निवास, भोजन आणि शैक्षणिक सुविधा पुरविल्या जातात.'
  }
};

// Helper to send WhatsApp text messages via Twilio with message splitting
async function sendMessage(to, body) {
  if (!client) {
    console.error('Twilio client is not initialized. Cannot send message.');
    return;
  }
  const MAX_LENGTH = 1600; // WhatsApp message character limit
  try {
    // If message is under the limit, send it directly
    if (body.length <= MAX_LENGTH) {
      await client.messages.create({
        from: twilioWhatsAppNumber,
        to: to,
        body: body
      });
      console.log(`Text message sent to ${to}`);
    } else {
      // Split the message at newline boundaries
      const lines = body.split('\n');
      let currentChunk = '';
      const chunks = [];

      for (const line of lines) {
        const lineWithNewline = line + '\n';
        if (currentChunk.length + lineWithNewline.length <= MAX_LENGTH) {
          currentChunk += lineWithNewline;
        } else {
          if (currentChunk) {
            chunks.push(currentChunk.trimEnd());
          }
          currentChunk = lineWithNewline;
        }
      }

      if (currentChunk) {
        chunks.push(currentChunk.trimEnd());
      }

      // Send each chunk as a separate message
      for (const chunk of chunks) {
        await client.messages.create({
          from: twilioWhatsAppNumber,
          to: to,
          body: chunk
        });
        console.log(`Text message chunk sent to ${to}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  } catch (error) {
    console.error('Error sending text message:', error.message);
  }
}

// List of main schemes
async function sendMainSchemesList(to) {
  const schemes = [
    '0. मेन्यू परत जा',
    '1. भारत सरकार शिष्यवृत्ती योजना MAHDBT द्वारे',
    '2. ज्ञानज्योती सावित्रीबाई फुले आधार योजना',
    '3. पंडित दीनदयाळ उपाध्याय स्वयंम योजना',
    '4. मोदी आवास योजना',
    '5. मॅट्रिक पूर्व शिष्यवृत्ती योजना',
    '6. इतर मागास बहुजन कल्याण मुलांचे शासकीय वसतीगृह कोल्हापूर',
    '7. इतर मागास बहुजन कल्याण मुलींचे शासकीय वसतीगृह कोल्हापूर'
  ].join('\n');

  const message = `नमस्कार! विभागा अंतर्गत राबविल्या जाणाऱ्या योजनांमध्ये आपले स्वागत आहे.\nकृपया एक योजना निवडा:\n\n${schemes}\n\nक्रमांकासह उत्तर द्या (उदा., 1). मेन्यूवर परत जाण्यासाठी 0 सह उत्तर द्या.`;
  await sendMessage(to, message);
}

// List of sub-schemes for a selected main scheme
async function sendSubSchemesList(to, mainScheme) {
  const subSchemesList = subSchemes[mainScheme];
  if (subSchemesList.length === 0) {
    const details = subSchemeDetails[mainScheme]['0'];
    await sendMessage(to, `${details}\n\nमागील मेन्यूवर परत जाण्यासाठी 0 सह उत्तर द्या.`);
  } else {
    const message = `कृपया खालील योजनांमधून एक निवडा:\n\n0. मागील मेन्यू परत जा\n${subSchemesList.join('\n')}\n\nक्रमांकासह उत्तर द्या (उदा., 1). मागील मेन्यूवर परत जाण्यासाठी 0 सह उत्तर द्या.`;
    await sendMessage(to, message);
  }
}

// Webhook to handle incoming messages from Twilio
app.post('/webhook', async (req, res) => {
  const from = req.body.From;
  const messageBody = req.body.Body;

  if (!userState[from]) {
    userState[from] = { step: 'mainSchemes' };
    await sendMainSchemesList(from);
  } else if (userState[from].step === 'mainSchemes') {
    const choice = messageBody;
    if (/^\d+$/.test(choice)) {
      if (choice === '0') {
        userState[from] = { step: 'mainSchemes' };
        await sendMainSchemesList(from);
      } else if (choice >= 1 && choice <= 7) {
        userState[from] = { step: 'subSchemes', mainScheme: choice };
        await sendSubSchemesList(from, choice);
      } else {
        await sendMessage(from, 'कृपया 0 ते 7 मधील एक वैध क्रमांक निवडा. मेन्यूवर परत जाण्यासाठी 0 सह उत्तर द्या.');
      }
    } else {
      await sendMessage(from, 'कृपया 0 ते 7 मधील एक वैध क्रमांक निवडा. मेन्यूवर परत जाण्यासाठी 0 सह उत्तर द्या.');
    }
  } else if (userState[from].step === 'subSchemes') {
    const mainScheme = userState[from].mainScheme;
    const choice = messageBody;
    const maxSubScheme = subSchemes[mainScheme].length;

    if (/^\d+$/.test(choice)) {
      if (choice === '0') {
        userState[from] = { step: 'mainSchemes' };
        await sendMainSchemesList(from);
      } else if (choice >= 1 && choice <= maxSubScheme) {
        const details = subSchemeDetails[mainScheme][choice];
        await sendMessage(from, `${details}\n\nमागील मेन्यूवर परत जाण्यासाठी 0 सह उत्तर द्या.`);
      } else {
        await sendMessage(from, `कृपया 0 ते ${maxSubScheme} मधील एक वैध क्रमांक निवडा. मागील मेन्यूवर परत जाण्यासाठी 0 सह उत्तर द्या.`);
      }
    } else {
      await sendMessage(from, `कृपया 0 ते ${maxSubScheme} मधील एक वैध क्रमांक निवडा. मागील मेन्यूवर परत जाण्यासाठी 0 सह उत्तर द्या.`);
    }
  }

  res.status(200).send('OK');
});

// Basic route for testing
app.get('/', (req, res) => {
  res.send('व्हॉट्सअॅप चॅटबॉट सुरू आहे!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});