import dotenv from "dotenv";
dotenv.config();

let client = null;

const SID = process.env.TWILIO_SID;
const TOKEN = process.env.TWILIO_AUTH;
const FROM = process.env.TWILIO_NUMBER;

if (SID && TOKEN) {
  const twilioImport = await import("twilio");
  client = twilioImport.default(SID, TOKEN);
}

export async function sendOtpSms(phone, otp) {
  if (client && FROM) {
    return client.messages.create({
      body: `Your StockMaster OTP is: ${otp}`,
      from: FROM,
      to: phone
    });
  } else {
    console.log(`⚠️ TWILIO NOT CONFIGURED — Dev OTP for ${phone}: ${otp}`);
    return { sid: "DEV-OTP", otp };
  }
}