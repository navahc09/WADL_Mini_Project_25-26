const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

const region = process.env.AWS_REGION;
const fromEmail = process.env.SES_FROM_EMAIL;

function buildClient() {
  const accessKeyId =
    process.env.SES_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey =
    process.env.SES_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

  return new SESClient({
    region,
    credentials: accessKeyId && secretAccessKey
      ? { accessKeyId, secretAccessKey }
      : undefined,
  });
}

const sesClient = buildClient();

async function sendEmail({ to, subject, text, html }) {
  if (!region || !fromEmail) {
    console.warn(`[email] skipped "${subject}" because SES env vars are not configured`);
    return { skipped: true };
  }

  const command = new SendEmailCommand({
    Source: fromEmail,
    Destination: {
      ToAddresses: Array.isArray(to) ? to : [to],
    },
    Message: {
      Subject: { Data: subject, Charset: "UTF-8" },
      Body: html
        ? {
            Html: { Data: html, Charset: "UTF-8" },
            Text: { Data: text || subject, Charset: "UTF-8" },
          }
        : {
            Text: { Data: text || subject, Charset: "UTF-8" },
          },
    },
    ConfigurationSetName: process.env.SES_CONFIGURATION_SET || undefined,
  });

  await sesClient.send(command);
  return { sent: true };
}

module.exports = {
  sendEmail,
};
