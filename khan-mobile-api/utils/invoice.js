const PDFDocument = require('pdfkit');

const money = (n) => `Rs. ${Number(n || 0).toLocaleString('en-PK')}`;
const safe = (value, fallback = '-') => {
  const text = String(value ?? '').trim();
  return text || fallback;
};

const titleCase = (value) =>
  safe(value, 'Pending')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const streamInvoice = (order, res) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.orderNumber}.pdf"`);
  doc.pipe(res);

  const page = { left: 50, right: 545, width: 495 };
  const navy = '#0F172A';
  const slate = '#475569';
  const muted = '#64748B';
  const light = '#F8FAFC';
  const border = '#E2E8F0';
  const accent = '#16A34A';
  const white = '#FFFFFF';

  // Brand header
  doc.rect(0, 0, 595, 126).fill(navy);
  doc.font('Helvetica-Bold').fontSize(25).fillColor(white)
    .text('KHAN MOBILES', page.left, 34);
  doc.font('Helvetica').fontSize(9.5).fillColor('#CBD5E1')
    .text('Mobile Accessories & Gadgets', page.left, 66);
  doc.fontSize(9).text('Industrial Estate Area - Near UBL Bank - Multan', page.left, 82);
  doc.fontSize(9).text('khanmobiles345@gmail.com - WhatsApp: 03166953534', page.left, 97);

  doc.font('Helvetica-Bold').fontSize(22).fillColor(white)
    .text('INVOICE', 390, 38, { width: 157, align: 'right' });
  doc.font('Helvetica').fontSize(9).fillColor('#CBD5E1')
    .text(`Order # ${safe(order.orderNumber)}`, 390, 69, { width: 157, align: 'right' })
    .text(
      `Date: ${new Date(order.createdAt || Date.now()).toLocaleDateString('en-PK', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })}`,
      390, 84, { width: 157, align: 'right' }
    );

  // Status badge
  const status = titleCase(order.status);
  doc.roundedRect(445, 98, 102, 18, 9).fill('#166534');
  doc.font('Helvetica-Bold').fontSize(8).fillColor(white)
    .text(status, 445, 103, { width: 102, align: 'center' });

  // Customer / payment cards
  let y = 151;
  doc.roundedRect(page.left, y, 319, 113, 7).fill(light).strokeColor(border).stroke();
  doc.roundedRect(379, y, 168, 113, 7).fill(light).strokeColor(border).stroke();

  doc.font('Helvetica-Bold').fontSize(10).fillColor(navy)
    .text('CUSTOMER & DELIVERY', 63, y + 15);
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(slate)
    .text(safe(order.fullName), 63, y + 37);
  doc.font('Helvetica').fontSize(8.5)
    .text(safe(order.phone), 63, y + 53)
    .text(safe(order.email), 63, y + 67)
    .text(safe(order.address), 63, y + 81, { width: 285 });
  const location = [order.landmark && `Landmark: ${order.landmark}`, order.city]
    .filter(Boolean).join(' - ');
  if (location) doc.text(location, 63, y + 95, { width: 285 });

  doc.font('Helvetica-Bold').fontSize(10).fillColor(navy)
    .text('PAYMENT', 394, y + 15);
  doc.font('Helvetica-Bold').fontSize(11).fillColor(accent)
    .text(order.paymentMethod === 'cod' ? 'Cash on Delivery' : titleCase(order.paymentMethod), 394, y + 39, { width: 140 });
  doc.font('Helvetica').fontSize(8.5).fillColor(muted)
    .text('Payment status', 394, y + 67)
    .text('Pay on delivery', 394, y + 82);

  // Items
  y = 292;
  doc.font('Helvetica-Bold').fontSize(10).fillColor(navy).text('ORDER ITEMS', page.left, y);
  y += 18;

  doc.roundedRect(page.left, y, page.width, 29, 5).fill(navy);
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(white)
    .text('ITEM', 60, y + 10)
    .text('QTY', 350, y + 10, { width: 42, align: 'right' })
    .text('UNIT PRICE', 398, y + 10, { width: 68, align: 'right' })
    .text('TOTAL', 477, y + 10, { width: 61, align: 'right' });
  y += 29;

  doc.font('Helvetica').fontSize(9).fillColor(slate);
  const items = Array.isArray(order.items) ? order.items : [];
  items.forEach((item, index) => {
    const rowHeight = 34;
    if (index % 2 === 0) doc.rect(page.left, y, page.width, rowHeight).fill('#F8FAFC');
    const itemTotal = Number(item.price || 0) * Number(item.quantity || 0);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(navy)
      .text(safe(item.name), 60, y + 11, { width: 275,  });
    doc.font('Helvetica').fontSize(9).fillColor(slate)
      .text(String(item.quantity || 0), 350, y + 11, { width: 42, align: 'right' })
      .text(money(item.price), 398, y + 11, { width: 68, align: 'right' })
      .text(money(itemTotal), 477, y + 11, { width: 61, align: 'right' });
    doc.moveTo(page.left, y + rowHeight).lineTo(545, y + rowHeight).strokeColor(border).stroke();
    y += rowHeight;
  });

  // Totals
  y += 18;
  const totalsX = 335;
  const totalsW = 212;
  const row = (label, value, bold = false) => {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(bold ? 12 : 9.5)
      .fillColor(bold ? navy : slate)
      .text(label, totalsX, y, { width: 115 })
      .text(value, totalsX + 115, y, { width: 97, align: 'right' });
    y += bold ? 25 : 19;
  };

  doc.moveTo(totalsX, y - 5).lineTo(totalsX + totalsW, y - 5).strokeColor(border).stroke();
  row('Subtotal', money(order.subtotal));
  if (Number(order.discount || 0) > 0) {
    row(order.promoCode ? `Discount (${order.promoCode})` : 'Discount', `- ${money(order.discount)}`);
  }
  row('Delivery', Number(order.deliveryFee || 0) === 0 ? 'FREE' : money(order.deliveryFee));
  doc.moveTo(totalsX, y - 5).lineTo(totalsX + totalsW, y - 5).strokeColor(navy).lineWidth(1.2).stroke();
  y += 10;
  row('TOTAL', money(order.total), true);

  // Footer note
  const footerY = Math.max(y + 24, 675);
  doc.roundedRect(page.left, footerY, page.width, 57, 7).fill('#F0FDF4').strokeColor('#DCFCE7').stroke();
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#166534')
    .text('Thank you for shopping with Khan Mobiles!', 63, footerY + 13);
  doc.font('Helvetica').fontSize(8).fillColor(slate)
    .text('Please keep this invoice for your order record.', 63, footerY + 29)
    .text('For order support, contact us using the details shown above.', 63, footerY + 41);

  doc.font('Helvetica').fontSize(7.5).fillColor('#94A3B8')
    .text('Computer-generated invoice - Khan Mobiles', page.left, 760, {
      width: page.width,
      align: 'center',
    });

  doc.end();
};

module.exports = { streamInvoice };
