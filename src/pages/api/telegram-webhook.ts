import type { APIRoute } from 'astro';
import { PDFDocument, rgb } from 'pdf-lib';

// Ganti dengan Token Bot dari BotFather atau gunakan Cloudflare Environment Variable
const TELEGRAM_TOKEN = "8789561311:AAF_3wI86kpBOd-p7_Z6QQDayFckVU0TDsA"; 

export const POST: APIRoute = async ({ request }) => {
  try {
    const payload = await request.json();
    const chatId = payload.message?.chat?.id;
    const text = payload.message?.text;

    // Jika tidak ada pesan teks atau chatId, abaikan
    if (!text || !chatId) {
      return new Response('OK', { status: 200 });
    }

    // Jika user mengirim perintah /start
    if (text === '/start') {
      await sendTelegramMessage(chatId, "👋 Halo! Kirimkan data invoice dengan format:\n\n`Nama Event | Qty | Harga`\n\n*Contoh:*\n`Konser JKT48 | 2 | 150000`");
      return new Response('OK', { status: 200 });
    }

    // Memisahkan teks berdasarkan karakter "|"
    const parts = text.split('|').map((item: string) => item.trim());

    // Validasi format input
    if (parts.length < 3) {
      await sendTelegramMessage(chatId, "⚠️ *Format Salah!*\nSilakan kirim ulang dengan format:\n`Nama Event | Qty | Harga` ");
      return new Response('OK', { status: 200 });
    }

    const [eventName, qtyStr, priceStr] = parts;
    const qty = parseInt(qtyStr) || 1;
    const price = parseInt(priceStr) || 0;
    const total = qty * price;

    // --- PROSES GENERATE PDF MENGGUNAKAN PDF-LIB ---
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([400, 400]); // Ukuran canvas PDF kustom
    
    // Menggambar teks ke PDF
    page.drawText('INVOICE OTOMATIS', { x: 50, y: 340, size: 20 });
    page.drawText(`Event: ${eventName}`, { x: 50, y: 290, size: 14 });
    page.drawText(`Jumlah (Qty): ${qty}`, { x: 50, y: 260, size: 14 });
    page.drawText(`Harga Satuan: Rp ${price.toLocaleString('id-ID')}`, { x: 50, y: 230, size: 14 });
    
    // Garis pembatas
    page.drawLine({ start: { x: 50, y: 200 }, end: { x: 350, y: 200 }, thickness: 1, color: rgb(0.7, 0.7, 0.7) });
    
    page.drawText(`Total Bayar: Rp ${total.toLocaleString('id-ID')}`, { x: 50, y: 170, size: 16, color: rgb(0, 0.5, 0) });

    // Simpan PDF menjadi bentuk byte array
    const pdfBytes = await pdfDoc.save();

    // --- KIRIM FILE PDF KEMBALI KE USER ---
    const fileName = `Invoice_${eventName.replace(/\s+/g, '_')}.pdf`;
    await sendTelegramDocument(chatId, pdfBytes, fileName);

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error Webhook:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};

// Fungsi Helper: Mengirim Pesan Teks
async function sendTelegramMessage(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'Markdown' })
  });
}

// Fungsi Helper: Mengirim File Dokumen (PDF)
async function sendTelegramDocument(chatId: number, pdfBuffer: Uint8Array, filename: string) {
  const formData = new FormData();
  formData.append('chat_id', chatId.toString());
  
  const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
  formData.append('document', blob, filename);

  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendDocument`, {
    method: 'POST',
    body: formData
  });
}