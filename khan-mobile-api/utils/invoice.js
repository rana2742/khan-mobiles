const PDFDocument = require('pdfkit');

const money = (n) => `Rs. ${Number(n).toLocaleString('en-PK')}`;

// Streams a PDF invoice directly to the HTTP response — nothing is written
// to disk, it's generated fresh on every request.
const streamInvoice = (order, res) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.orderNumber}.pdf"`);
  doc.pipe(res);

  // Header
  doc.fontSize(20).font('Helvetica-Bold').fillColor('#0F172A').text('Khan Mobile Shop', 50, 50);
  doc.fontSize(9).font('Helvetica').fillColor('#64748B').text('Hafeez Center, Gulberg III, Lahore, Pakistan', 50, 74);
  doc.fontSize(9).text('info@khanmobile.pk · +92 300 123 4567', 50, 87);

  doc.fontSize(16).font('Helvetica-Bold').fillColor('#0F172A').text('INVOICE', 400, 50, { align: 'right' });
  doc.fontSize(9).font('Helvetica').fillColor('#64748B')
    .text(`Order #: ${order.orderNumber}`, 400, 74, { align: 'right' })
    .text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}`, 400, 87, { align: 'right' })
    .text(`Status: ${order.status[0].toUpperCase() + order.status.slice(1)}`, 400, 100, { align: 'right' });

  doc.moveTo(50, 120).lineTo(545, 120).strokeColor('#E2E8F0').stroke();

  // Billing info
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#0F172A').text('Billed & Shipped To', 50, 135);
  doc.fontSize(9).font('Helvetica').fillColor('#334155')
    .text(order.fullName, 50, 152)
    .text(order.phone, 50, 165)
    .text(order.email, 50, 178)
    .text(`${order.address}${order.landmark ? ` · Landmark: ${order.landmark}` : ''}`, 50, 191, { width: 300 })
    .text(order.city, 50, 191 + (order.address.length > 60 ? 26 : 13));

  const paymentY = 152;
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#0F172A').text('Payment Method', 350, 135);
  doc.fontSize(9).font('Helvetica').fillColor('#334155')
    .text(order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod, 350, paymentY);

  // Items table
  let y = 250;
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#0F172A');
  doc.text('Item', 50, y).text('Qty', 350, y, { width: 50, align: 'right' })
    .text('Price', 400, y, { width: 70, align: 'right' }).text('Total', 470, y, { width: 75, align: 'right' });
  y += 18;
  doc.moveTo(50, y).lineTo(545, y).strokeColor('#E2E8F0').stroke();
  y += 12;

  doc.font('Helvetica').fontSize(9).fillColor('#334155');
  for (const item of order.items) {
    doc.text(item.name, 50, y, { width: 290 })
      .text(String(item.quantity), 350, y, { width: 50, align: 'right' })
      .text(money(item.price), 400, y, { width: 70, align: 'right' })
      .text(money(item.price * item.quantity), 470, y, { width: 75, align: 'right' });
    y += 20;
  }

  y += 10;
  doc.moveTo(350, y).lineTo(545, y).strokeColor('#E2E8F0').stroke();
  y += 12;

  const totalsRow = (label, value, bold = false) => {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 11 : 9.5).fillColor(bold ? '#0F172A' : '#334155')
      .text(label, 350, y, { width: 120 })
      .text(value, 470, y, { width: 75, align: 'right' });
    y += bold ? 20 : 16;
  };

  totalsRow('Subtotal', money(order.subtotal));
  if (order.discount > 0) totalsRow(`Discount${order.promoCode ? ` (${order.promoCode})` : ''}`, `− ${money(order.discount)}`);
  totalsRow('Delivery', order.deliveryFee === 0 ? 'Free' : money(order.deliveryFee));
  y += 4;
  doc.moveTo(350, y).lineTo(545, y).strokeColor('#0F172A').stroke();
  y += 8;
  totalsRow('Total', money(order.total), true);

  doc.fontSize(8).fillColor('#94A3B8').text(
    'Thank you for shopping with Khan Mobile Shop. This is a computer-generated invoice.',
    50, 720, { align: 'center', width: 495 }
  );

  doc.end();
};

module.exports = { streamInvoice };
