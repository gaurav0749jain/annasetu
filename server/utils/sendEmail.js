const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendEmail = async ({ to, subject, html }) => {
    try {
        await transporter.sendMail({
            from: `"AnnaSetu 🍱" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        });
        console.log(`Email sent to ${to}`);
    } catch (err) {
        console.error('Email error:', err.message);
    }
};

const emailTemplates = {
    pickupClaimed: (donorName, listingTitle, receiverName) => ({
        subject: '🤝 Your food listing has been claimed!',
        html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px">
        <div style="background:#16a34a;padding:20px;border-radius:12px 12px 0 0;text-align:center">
          <h1 style="color:white;margin:0;font-size:24px">🍱 AnnaSetu</h1>
        </div>
        <div style="background:#f9fafb;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
          <h2 style="color:#166534">Great news, ${donorName}! 🎉</h2>
          <p style="color:#374151">Your food listing <strong>"${listingTitle}"</strong> has been claimed by <strong>${receiverName}</strong>.</p>
          <div style="background:#dcfce7;border-radius:8px;padding:16px;margin:16px 0">
            <p style="color:#166534;margin:0;font-weight:500">What happens next?</p>
            <p style="color:#166534;margin:8px 0 0">Please confirm or reject the claim from your dashboard. A volunteer will be assigned once confirmed.</p>
          </div>
          <a href="${process.env.CLIENT_URL}/dashboard" style="display:inline-block;background:#16a34a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">Go to Dashboard →</a>
        </div>
        <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:16px">AnnaSetu — Bridging surplus food with genuine need</p>
      </div>
    `,
    }),

    pickupConfirmed: (receiverName, listingTitle, donorName) => ({
        subject: '✅ Your food claim has been confirmed!',
        html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px">
        <div style="background:#16a34a;padding:20px;border-radius:12px 12px 0 0;text-align:center">
          <h1 style="color:white;margin:0;font-size:24px">🍱 AnnaSetu</h1>
        </div>
        <div style="background:#f9fafb;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
          <h2 style="color:#166534">Confirmed! ✅</h2>
          <p style="color:#374151">Hi ${receiverName}, your claim for <strong>"${listingTitle}"</strong> by <strong>${donorName}</strong> has been confirmed!</p>
          <div style="background:#dcfce7;border-radius:8px;padding:16px;margin:16px 0">
            <p style="color:#166534;margin:0;font-weight:500">A volunteer will be assigned soon</p>
            <p style="color:#166534;margin:8px 0 0">Track the pickup status from your dashboard in real-time.</p>
          </div>
          <a href="${process.env.CLIENT_URL}/dashboard" style="display:inline-block;background:#16a34a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">Track Pickup →</a>
        </div>
        <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:16px">AnnaSetu — Bridging surplus food with genuine need</p>
      </div>
    `,
    }),

    volunteerAssigned: (name, listingTitle, volunteerName) => ({
        subject: '🚗 A volunteer has been assigned!',
        html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px">
        <div style="background:#16a34a;padding:20px;border-radius:12px 12px 0 0;text-align:center">
          <h1 style="color:white;margin:0;font-size:24px">🍱 AnnaSetu</h1>
        </div>
        <div style="background:#f9fafb;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
          <h2 style="color:#166534">Volunteer Assigned! 🚗</h2>
          <p style="color:#374151">Hi ${name}, <strong>${volunteerName}</strong> will pick up <strong>"${listingTitle}"</strong> and deliver it shortly.</p>
          <div style="background:#dbeafe;border-radius:8px;padding:16px;margin:16px 0">
            <p style="color:#1e40af;margin:0;font-weight:500">Use the chat to coordinate</p>
            <p style="color:#1e40af;margin:8px 0 0">You can chat with the volunteer and other parties from your dashboard.</p>
          </div>
          <a href="${process.env.CLIENT_URL}/dashboard" style="display:inline-block;background:#16a34a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">Open Dashboard →</a>
        </div>
        <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:16px">AnnaSetu — Bridging surplus food with genuine need</p>
      </div>
    `,
    }),

    foodDelivered: (donorName, receiverName, listingTitle, meals) => ({
        subject: '🎉 Food delivered successfully!',
        html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px">
        <div style="background:#16a34a;padding:20px;border-radius:12px 12px 0 0;text-align:center">
          <h1 style="color:white;margin:0;font-size:24px">🍱 AnnaSetu</h1>
        </div>
        <div style="background:#f9fafb;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
          <h2 style="color:#166534">Delivered! 🎉</h2>
          <p style="color:#374151">Hi ${donorName}, your food <strong>"${listingTitle}"</strong> has been successfully delivered to <strong>${receiverName}</strong>!</p>
          <div style="background:#dcfce7;border-radius:8px;padding:16px;margin:16px 0;text-align:center">
            <p style="color:#166534;font-size:32px;margin:0">🍱</p>
            <p style="color:#166534;font-size:24px;font-weight:700;margin:8px 0">${meals} meals saved!</p>
            <p style="color:#166534;margin:0">CO₂ saved: ~${(meals * 0.5 * 2.5).toFixed(1)} kg</p>
          </div>
          <p style="color:#374151">Thank you for making a difference! Check your impact report on the dashboard.</p>
          <a href="${process.env.CLIENT_URL}/dashboard" style="display:inline-block;background:#16a34a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">View Impact Report →</a>
        </div>
        <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:16px">AnnaSetu — Bridging surplus food with genuine need</p>
      </div>
    `,
    }),
};

module.exports = { sendEmail, emailTemplates };