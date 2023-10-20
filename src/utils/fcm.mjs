import admin from 'firebase-admin';
import fs from 'fs';

// Initialize the FCM SDK
const serviceAccount = JSON.parse(fs.readFileSync(process.env.SERVICE_ACCOUNT_KEY_PATH, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://leon-art.firebaseio.com"
});

export const sendFCMMessage = async (token, title, body) => {
  try {
    const message = {
      notification: {
        title,
        body
      },
      token
    };
    await admin.messaging().send(message);
  } catch (err) {
    console.error(err.message);
  }
};
