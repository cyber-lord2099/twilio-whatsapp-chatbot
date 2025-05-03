const express = require('express');
const twilio = require('twilio');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Environment variables (set these in Render)
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER; // e.g., whatsapp:+919876543210

// Initialize Twilio client
const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Store user state (in-memory; use a database in production)
const userState = {};

// Updated dataset with sub-schemes and sub-sub-schemes
const subSchemes = {
  '1': [
    '1. आश्रमशाळा',
    '2. शिष्यवृत्ती',
    '3. वसतीगृहे/आधार योजना'
  ],
  '2': [
    '1. वसंतराव नाईक तांडा/वस्ती सुधार योजना',
    '2. विमुक्त जाती भटक्या जमाती या घटकासह यशवंतराव चव्हाण मुक्त वसाहत योजना',
    '3. मोदी आवास घरकुल योजना'
  ],
  '3': [
    '1. धनगर समाजाच्या विद्यार्थ्यांना शहरातील इंग्रजी माध्यमाच्या नामांकित निवासी शाळेत प्रवेश मिळवून देणे',
    '2. धनगर समाजाच्या विद्यार्थ्यांसाठी पंडित दीनदयाल उपाध्याय स्वयंम योजना',
    '3. संध लोकसेवा आयोग/महाराष्ट्र लोकसेवा आयोग यांच्या पूर्व परीक्षेसाठी निवासी प्रशिक्षण देणे'
  ],
  '4': [
    '1. सामूहिक विवाह सोहळ्यामध्ये भाग घेऊन विवाह करण्याच्या विजाभज, इमाव व विमाप्र दाम्पत्यासाठी कन्यादान योजना',
    '2. स्व. वसंतराव नाईक गुणवत्ता पुरस्कार'
  ],
  '5': [
    '1. संस्था',
    '2. महामंडळ'
  ]
};

// Sub-sub-schemes for applicable sub-schemes
const subSubSchemes = {
  '1': {
    '1': [
      '1. विमुक्त जाती, भटक्या जमाती व विशेष मागास प्रवर्गासाठीच्या आश्रमशाळा',
      '2. ऊसतोड कामगाराच्या मुला-मुलींसाठी निवासी आश्रम शाळा',
      '3. विद्यानिकेतन शाळा'
    ],
    '2': [
      '1. मॅट्रिकपूर्व शिष्यवृत्ती',
      '2. मॅट्रिकोत्तर शिष्यवृत्ती',
      '3. परदेशात उच्च शिक्षणासाठी शिष्यवृत्ती योजना'
    ],
    '3': [
      '1. राज्यातील इतर मागास प्रवर्ग, विमुक्त जाती, भटक्या जमाती व विशेष मागास प्रवर्ग या प्रवर्गातील विद्यार्थ्यांसाठी जिल्हानिहाय वसतीगृहे',
      '2. ज्ञानज्योती सावित्रीबाई फुले आधार योजना'
    ]
  },
  '5': {
    '1': [
      '1. महात्मा ज्योतिबा फुले संशोधन व प्रशिक्षण संस्था (महाज्योती) नागपूर',
      '2. महाराष्ट्र संशोधन उन्नती व प्रशिक्षण प्रबोधिनी (अमृत)'
    ],
    '2': [
      '1. महाराष्ट्र राज्य इतर मागासवर्गीय वित्त आणि विकास महामंडळ (मर्यादित)',
      '2. वसंतराव नाईक विमुक्त जाती व भटक्या जनजाती विकास महामंडळ (मर्यादित)'
    ]
  }
};

// Details for sub-schemes or sub-sub-schemes
const details = {
  '1': {
    '1': {
      '1': 'लाभ घेणारा प्रवर्ग: विमुक्त जाती, भटक्या जमाती व विशेष मागास प्रवर्ग\n\nया योजनेंतर्गत विमुक्त जाती (VJNT), भटक्या जमाती आणि विशेष मागास प्रवर्ग (SBC) मधील मुलांसाठी निवासी आश्रमशाळा चालविल्या जातात. या योजनेचा उद्देश प्राथमिक आणि माध्यमिक स्तरावर शिक्षणाला प्रोत्साहन देणे हा आहे.',
      '2': 'लाभ घेणारा प्रवर्ग: विमुक्त जाती, भटक्या जमाती\n\nया योजनेंतर्गत ऊसतोड कामगारांच्या मुला-मुलींसाठी निवासी आश्रमशाळा चालविल्या जातात. या योजनेचा उद्देश त्यांच्या शिक्षणाला प्रोत्साहन देणे हा आहे.',
      '3': 'लाभ घेणारा प्रवर्ग: विमुक्त जाती, भटक्या जमाती व विशेष मागास प्रवर्ग\n\nया योजनेंतर्गत विमुक्त जाती (VJNT), भटक्या जमाती आणि विशेष मागास प्रवर्ग (SBC) मधील मुलांसाठी विद्यानिकेतन शाळा चालविल्या जातात. या योजनेचा उद्देश गुणवत्तापूर्ण शिक्षण देणे हा आहे.'
    },
    '2': {
      '1': 'लाभ घेणारा प्रवर्ग: इतर मागास वर्ग, VJNT व SBC\n\nया योजनेंतर्गत इतर मागास वर्ग (OBC), विमुक्त जाती (VJNT), आणि विशेष मागास प्रवर्ग (SBC) मधील विद्यार्थ्यांना मॅट्रिकपूर्व शिक्षणासाठी शिष्यवृत्ती दिली जाते. या योजनेचा उद्देश प्राथमिक आणि माध्यमिक स्तरावर शिक्षणाला प्रोत्साहन देणे हा आहे.',
      '2': 'लाभ घेणारा प्रवर्ग: इतर मागास वर्ग, VJNT व SBC\n\nया योजनेंतर्गत इतर मागास वर्ग (OBC), विमुक्त जाती (VJNT), आणि विशेष मागास प्रवर्ग (SBC) मधील विद्यार्थ्यांना मॅट्रिकोत्तर शिक्षणासाठी शिष्यवृत्ती दिली जाते. या योजनेचा उद्देश उच्च शिक्षणाला प्रोत्साहन देणे हा आहे.',
      '3': 'लाभ घेणारा प्रवर्ग: इतर मागास वर्ग, VJNT व SBC\n\nया योजनेंतर्गत इतर मागास वर्ग (OBC), विमुक्त जाती (VJNT), आणि विशेष मागास प्रवर्ग (SBC) मधील गुणवंत विद्यार्थ्यांना परदेशात उच्च शिक्षण घेण्यासाठी शिष्यवृत्ती दिली जाते. या योजनेचा उद्देश आंतरराष्ट्रीय स्तरावर शिक्षणाची संधी उपलब्ध करून देणे हा आहे.'
    },
    '3': {
      '1': 'लाभ घेणारा प्रवर्ग: OBC, VJNT व SBC\n\nया योजनेंतर्गत इतर मागास प्रवर्ग, विमुक्त जाती, भटक्या जमाती व विशेष मागास प्रवर्ग या प्रवर्गातील विद्यार्थ्यांसाठी जिल्हानिहाय वसतीगृहे चालविली जातात. या वसतीगृहात विद्यार्थ्यांना मोफत निवास, भोजन आणि शैक्षणिक सुविधा पुरविल्या जातात.',
      '2': 'लाभ घेणारा प्रवर्ग: OBC, VJNT व SBC\n\nया योजनेंतर्गत इतर मागास प्रवर्ग (OBC), विमुक्त जाती (VJNT), आणि विशेष मागास प्रवर्ग (SBC) मधील मुलींना शिक्षणासाठी आर्थिक आधार दिला जातो. या योजनेचा उद्देश मुलींच्या शिक्षणाला प्रोत्साहन देणे आणि त्यांना स्वावलंबी बनविणे हा आहे.'
    }
  },
  '2': {
    '1': 'लाभ घेणारा प्रवर्ग: विमुक्त जाती, भटक्या जमाती (VJNT)\n\nया योजनेंतर्गत विमुक्त जाती आणि भटक्या जमातींसाठी तांडा आणि वस्ती सुधारणा केली जाते. या योजनेचा उद्देश राहणीमान सुधारणे हा आहे.',
    '2': 'लाभ घेणारा प्रवर्ग: विमुक्त जाती, भटक्या जमाती (VJNT)\n\nया योजनेंतर्गत विमुक्त जाती आणि भटक्या जमातींसाठी मुक्त वसाहती बांधल्या जातात. या योजनेचा उद्देश निवासाची सोय करणे हा आहे.',
    '3': 'लाभ घेणारा प्रवर्ग: विमुक्त जाती, भटक्या जमाती (VJNT)\n\nया योजनेंतर्गत विमुक्त जाती आणि भटक्या जमातींसह इतर मागास प्रवर्गातील कुटुंबांना घरकुले बांधण्यासाठी आर्थिक सहाय्य प्रदान केले जाते.'
  },
  '3': {
    '1': 'लाभ घेणारा प्रवर्ग: धनगर समाज (भटक्या जमाती, VJNT)\n\nया योजनेंतर्गत धनगर समाजातील विद्यार्थ्यांना शहरातील इंग्रजी माध्यमाच्या नामांकित निवासी शाळांमध्ये प्रवेश मिळवून दिला जातो. या योजनेचा उद्देश दर्जेदार शिक्षण देणे हा आहे.',
    '2': 'लाभ घेणारा प्रवर्ग: धनगर समाज (भटक्या जमाती, VJNT)\n\nया योजनेंतर्गत धनगर समाजातील विद्यार्थ्यांना स्वयंरोजगार आणि कौशल्य विकासासाठी प्रशिक्षण आणि आर्थिक सहाय्य दिले जाते.',
    '3': 'लाभ घेणारा प्रवर्ग: धनगर समाज (भटक्या जमाती, VJNT)\n\nया योजनेंतर्गत धनगर समाजातील विद्यार्थ्यांना संध लोकसेवा आयोग आणि महाराष्ट्र लोकसेवा आयोगाच्या पूर्व परीक्षेसाठी निवासी प्रशिक्षण दिले जाते.'
  },
  '4': {
    '1': 'लाभ घेणारा प्रवर्ग: विमुक्त जाती, भटक्या जमाती, OBC, SBC\n\nया योजनेंतर्गत सामूहिक विवाह सोहळ्यामध्ये भाग घेणाऱ्या दाम्पत्यांना आर्थिक सहाय्य दिले जाते. या योजनेचा उद्देश सामाजिक एकता वाढवणे हा आहे.',
    '2': 'लाभ घेणारा प्रवर्ग: विमुक्त जाती, भटक्या जमाती, OBC, SBC\n\nया योजनेंतर्गत विमुक्त जाती, भटक्या जमाती, OBC आणि SBC मधील व्यक्तींना त्यांच्या सामाजिक कार्यासाठी गुणवत्ता पुरस्कार दिला जातो.'
  },
  '5': {
    '1': {
      '1': 'लाभ घेणारा प्रवर्ग: इतर मागासवर्ग, विमुक्त जाती, भटक्या जमाती, विशेष मागासवर्ग\n\nया संस्थेमार्फत इतर मागासवर्ग, विमुक्त जाती, भटक्या जमाती आणि विशेष मागासवर्गातील विद्यार्थ्यांसाठी संशोधन आणि प्रशिक्षण कार्यक्रम राबविले जातात.',
      '2': 'लाभ घेणारा प्रवर्ग: खुला प्रवर्ग\n\nया संस्थेमार्फत खुला प्रवर्गातील व्यक्तींसाठी संशोधन आणि प्रशिक्षण कार्यक्रम राबविले जातात.'
    },
    '2': {
      '1': 'लाभ घेणारा प्रवर्ग: OBC\n\nया महामंडळामार्फत इतर मागासवर्गीय (OBC) व्यक्तींसाठी आर्थिक विकासाच्या योजना राबविल्या जातात.',
      '2': 'लाभ घेणारा प्रवर्ग: VJNT\n\nया महामंडळामार्फत विमुक्त जाती आणि भटक्या जमाती (VJNT) साठी आर्थिक विकासाच्या योजना राबविल्या जातात.'
    }
  }
};

// List of main schemes
async function sendMainSchemesList(to) {
  const schemes = [
    '0. मेन्यू परत जा',
    '1. शैक्षणिक योजना',
    '2. घरकुल/पायाभूत सुविधा बाबतच्या योजना',
    '3. भटक्या जमाती क प्रवर्ग (धनगर) समाजासाठी राबविण्यात येणान्या विविध योजना',
    '4. सामाजिक योजना',
    '5. कौशल्य विकास व अर्थसाहाय्याच्या योजना'
  ].join('\n');

  const message = `नमस्कार! विभागा अंतर्गत राबविल्या जाणाऱ्या योजनांमध्ये आपले स्वागत आहे.\nकृपया एक योजना निवडा:\n\n${schemes}\n\nक्रमांकासह उत्तर द्या (उदा., 1). मेन्यूवर परत जाण्यासाठी 0 सह उत्तर द्या.`;
  await splitMessage(to, message);
}

// List of sub-schemes for a selected main scheme
async function sendSubSchemesList(to, mainScheme) {
  const subSchemesList = subSchemes[mainScheme];
  const message = `कृपया खालील योजनांमधून एक निवडा:\n\n0. मागील मेन्यू परत जा\n${subSchemesList.join('\n')}\n\nक्रमांकासह उत्तर द्या (उदा., 1). मागील मेन्यूवर परत जाण्यासाठी 0 सह उत्तर द्या.`;
  await splitMessage(to, message);
}

// List of sub-sub-schemes for a selected sub-scheme
async function sendSubSubSchemesList(to, mainScheme, subScheme) {
  const subSubSchemesList = subSubSchemes[mainScheme][subScheme];
  const message = `कृपया खालील योजनांमधून एक निवडा:\n\n0. मागील मेन्यू परत जा\n${subSubSchemesList.join('\n')}\n\nक्रमांकासह उत्तर द्या (उदा., 1). मागील मेन्यूवर परत जाण्यासाठी 0 सह उत्तर द्या.`;
  await splitMessage(to, message);
}

// Send details for a selected sub-scheme or sub-sub-scheme
async function sendDetails(to, mainScheme, subScheme, subSubScheme = null) {
  let detail;
  if (subSubScheme) {
    detail = details[mainScheme][subScheme][subSubScheme];
  } else {
    detail = details[mainScheme][subScheme];
  }

  const message = `${detail}\n\nमागील मेन्यूवर परत जाण्यासाठी 0 सह उत्तर द्या.`;
  await splitMessage(to, message);
}

// Function to split messages exceeding 1600 characters
async function splitMessage(to, message) {
  const MAX_LENGTH = 1600;
  if (message.length <= MAX_LENGTH) {
    await sendWhatsAppMessage(to, message);
    return;
  }

  const parts = [];
  let currentPart = '';
  const lines = message.split('\n');

  for (const line of lines) {
    if (currentPart.length + line.length + 1 > MAX_LENGTH) {
      if (currentPart) parts.push(currentPart.trim());
      currentPart = line;
    } else {
      currentPart += (currentPart ? '\n' : '') + line;
    }
  }
  if (currentPart) parts.push(currentPart.trim());

  for (let i = 0; i < parts.length; i++) {
    const partMessage = parts[i] + (i < parts.length - 1 ? '\n\n(पुढील भाग पाहण्यासाठी थांबा...)' : '');
    await sendWhatsAppMessage(to, partMessage);
    if (i < parts.length - 1) await new Promise(resolve => setTimeout(resolve, 1000)); // 1-second delay between parts
  }
}

// Function to send a WhatsApp message using Twilio
async function sendWhatsAppMessage(to, message) {
  try {
    await client.messages.create({
      from: TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${to}`,
      body: message
    });
    console.log(`Message sent to ${to}`);
  } catch (error) {
    console.error('Error sending WhatsApp message:', error.message);
  }
}

// Webhook endpoint to receive messages (Twilio format)
app.post('/webhook', async (req, res) => {
  const from = req.body.From.replace('whatsapp:', ''); // Sender's phone number
  const messageBody = req.body.Body; // User's message

  if (!userState[from]) {
    userState[from] = { step: 'mainSchemes' };
    await sendMainSchemesList(from);
  } else if (userState[from].step === 'mainSchemes') {
    const choice = messageBody;
    if (/^\d+$/.test(choice)) {
      if (choice === '0') {
        userState[from] = { step: 'mainSchemes' };
        await sendMainSchemesList(from);
      } else if (choice >= 1 && choice <= 5) {
        userState[from] = { step: 'subSchemes', mainScheme: choice };
        await sendSubSchemesList(from, choice);
      } else {
        await splitMessage(from, 'कृपया 0 ते 5 मधील एक वैध क्रमांक निवडा. मेन्यूवर परत जाण्यासाठी 0 सह उत्तर द्या.');
      }
    } else {
      await splitMessage(from, 'कृपया 0 ते 5 मधील एक वैध क्रमांक निवडा. मेन्यूवर परत जाण्यासाठी 0 सह उत्तर द्या.');
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
        userState[from] = { step: 'subSubSchemesOrDetails', mainScheme: mainScheme, subScheme: choice };
        // Check if this sub-scheme has sub-sub-schemes
        if (subSubSchemes[mainScheme] && subSubSchemes[mainScheme][choice]) {
          await sendSubSubSchemesList(from, mainScheme, choice);
        } else {
          await sendDetails(from, mainScheme, choice);
        }
      } else {
        await splitMessage(from, `कृपया 0 ते ${maxSubScheme} मधील एक वैध क्रमांक निवडा. मागील मेन्यूवर परत जाण्यासाठी 0 सह उत्तर द्या.`);
      }
    } else {
      await splitMessage(from, `कृपया 0 ते ${maxSubScheme} मधील एक वैध क्रमांक निवडा. मागील मेन्यूवर परत जाण्यासाठी 0 सह उत्तर द्या.`);
    }
  } else if (userState[from].step === 'subSubSchemesOrDetails') {
    const mainScheme = userState[from].mainScheme;
    const subScheme = userState[from].subScheme;
    const choice = messageBody;

    // Check if we're in a sub-sub-scheme selection
    if (subSubSchemes[mainScheme] && subSubSchemes[mainScheme][subScheme]) {
      const maxSubSubScheme = subSubSchemes[mainScheme][subScheme].length;
      if (/^\d+$/.test(choice)) {
        if (choice === '0') {
          userState[from] = { step: 'subSchemes', mainScheme: mainScheme };
          await sendSubSchemesList(from, mainScheme);
        } else if (choice >= 1 && choice <= maxSubSubScheme) {
          userState[from] = { step: 'details', mainScheme: mainScheme, subScheme: subScheme, subSubScheme: choice };
          await sendDetails(from, mainScheme, subScheme, choice);
        } else {
          await splitMessage(from, `कृपया 0 ते ${maxSubSubScheme} मधील एक वैध क्रमांक निवडा. मागील मेन्यूवर परत जाण्यासाठी 0 सह उत्तर द्या.`);
        }
      } else {
        await splitMessage(from, `कृपया 0 ते ${maxSubSubScheme} मधील एक वैध क्रमांक निवडा. मागील मेन्यूवर परत जाण्यासाठी 0 सह उत्तर द्या.`);
      }
    } else {
      // If no sub-sub-schemes, we're already in details
      if (choice === '0') {
        userState[from] = { step: 'subSchemes', mainScheme: mainScheme };
        await sendSubSchemesList(from, mainScheme);
      } else {
        await splitMessage(from, 'कृपया मागील मेन्यूवर परत जाण्यासाठी 0 सह उत्तर द्या.');
      }
    }
  } else if (userState[from].step === 'details') {
    const choice = messageBody;
    if (choice === '0') {
      userState[from] = { step: 'subSubSchemesOrDetails', mainScheme: userState[from].mainScheme, subScheme: userState[from].subScheme };
      if (subSubSchemes[userState[from].mainScheme] && subSubSchemes[userState[from].mainScheme][userState[from].subScheme]) {
        await sendSubSubSchemesList(from, userState[from].mainScheme, userState[from].subScheme);
      } else {
        userState[from] = { step: 'subSchemes', mainScheme: userState[from].mainScheme };
        await sendSubSchemesList(from, userState[from].mainScheme);
      }
    } else {
      await splitMessage(from, 'कृपया मागील मेन्यूवर परत जाण्यासाठी 0 सह उत्तर द्या.');
    }
  }

  res.sendStatus(200);
});

// Basic route for Render health check
app.get('/', (req, res) => {
  res.send('व्हॉट्सअॅप चॅटबॉट सुरू आहे!');
});

app.listen(3000, () => console.log('Server running on port 3000'));