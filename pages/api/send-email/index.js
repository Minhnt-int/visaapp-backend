// pages/api/send-email/index.js
import nodemailer from 'nodemailer';
import { cors } from '../../../middleware/cors';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Chỉ chấp nhận phương thức POST' });
  }

  const { to, subject, text } = req.body;

  if (!to || !subject || !text) {
    return res.status(400).json({ success: false, message: 'Thiếu thông tin người nhận, chủ đề hoặc nội dung email.' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // VERIFY connection trước khi gửi
    console.log('🔍 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified');

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      text: text,
    };

    // CAPTURE result từ sendMail
    console.log('📤 Sending email to:', to);
    const result = await transporter.sendMail(mailOptions);
    
    // LOG chi tiết kết quả
    console.log('✅ Email sent successfully:', {
      messageId: result.messageId,
      response: result.response,
      accepted: result.accepted,
      rejected: result.rejected
    });

    // Kiểm tra email có được accepted không
    if (result.rejected && result.rejected.length > 0) {
      throw new Error(`Email rejected for: ${result.rejected.join(', ')}`);
    }

    res.status(200).json({ 
      success: true, 
      message: 'Email đã được gửi thành công!',
      messageId: result.messageId,
      accepted: result.accepted
    });
  } catch (error) {
    console.error('❌ Detailed email error:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    
    res.status(500).json({ 
      success: false, 
      message: 'Có lỗi xảy ra khi gửi email.', 
      error: error.message,
      code: error.code
    });
  }
}

// Export với CORS wrapper
export default cors(handler);