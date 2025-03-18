import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const {
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USER,
  EMAIL_PASS,
  EMAIL_FROM,
  EMAIL_TO
} = process.env;

if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS || !EMAIL_FROM || !EMAIL_TO) {
  throw new Error('Missing email configuration in environment variables');
}

const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: parseInt(EMAIL_PORT),
  secure: false,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

interface PriceAlertData {
  title: string;
  oldPrice: number;
  newPrice: number;
  percentDecrease: number;
}

export async function sendPriceAlert(data: PriceAlertData): Promise<void> {
  const { title, oldPrice, newPrice, percentDecrease } = data;
  
  const mailOptions = {
    from: EMAIL_FROM,
    to: EMAIL_TO,
    subject: `Price Alert: ${title}`,
    html: `
      <h2>Price Decrease Alert</h2>
      <p><strong>Product:</strong> ${title}</p>
      <p><strong>Old Price:</strong> $${oldPrice.toFixed(2)}</p>
      <p><strong>New Price:</strong> $${newPrice.toFixed(2)}</p>
      <p><strong>Decrease:</strong> ${percentDecrease.toFixed(2)}%</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Price alert email sent for ${title}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

export const sendEmail = async (subject: string, text: string) => {
  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: EMAIL_TO,
      subject,
      text
    });
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};