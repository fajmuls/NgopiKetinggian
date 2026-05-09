import { jsPDF } from 'jspdf';

export const generateRundownPdf = async (durInfo: any, destinasi: string, jalur: string, durasi: string) => {
  const doc = new jsPDF();
  const primaryColor = [26, 26, 26] as [number, number, number];
  
  // Try adding Logo Watermark
  await new Promise<void>((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      doc.setGState(new (doc.GState as any)({ opacity: 0.02 }));
      const aspectRatio = img.width / img.height;
      doc.addImage(img, 'PNG', 45, 100, 120, 120 / aspectRatio);
      doc.setGState(new (doc.GState as any)({ opacity: 1 }));
      resolve();
    };
    img.onerror = () => {
      // Fallback text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(60);
      doc.setTextColor(240, 240, 240);
      doc.text("NGOPI DI", 105, 140, { angle: 45, align: 'center' });
      doc.text("KETINGGIAN", 105, 170, { angle: 45, align: 'center' });
      resolve();
    };
    img.src = 'https://files.catbox.moe/lubzno.png';
  });

  // Header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('ITINERARY / RUNDOWN', 20, 20);
  doc.setFontSize(12);
  doc.text(`${destinasi.toUpperCase()} VIA ${jalur.toUpperCase()}`, 20, 30);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Durasi: ${durasi}`, 150, 30);

  // Content
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Rincian Kegiatan Perjalanan', 20, 55);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const textLines = doc.splitTextToSize(durInfo.rundownHtml || 'Rundown tidak tersedia.', 170);
  doc.text(textLines, 20, 65);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Dokumen ini dihasilkan secara otomatis oleh sistem Ngopi Di Ketinggian.', 105, 285, { align: 'center' });

  doc.save(`Rundown_${destinasi.replace(/\s/g, '_')}_${durasi.replace(/\s/g, '_')}.pdf`);
};

export const generateInvoice = (booking: any) => {
  const doc = new jsPDF();
  const primaryColor = [26, 26, 26];
  const accentColor = [255, 107, 0];
  
  doc.setFillColor(250, 250, 250);
  doc.rect(0, 0, 210, 297, 'F');
  
  // Watermark
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(60);
  doc.setTextColor(235, 235, 235);
  doc.text("NGOPI DI", 105, 140, { angle: 45, align: 'center' });
  doc.text("KETINGGIAN", 105, 170, { angle: 45, align: 'center' });

  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 50, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('NGOPI DI KETINGGIAN', 20, 25);
  doc.setFontSize(9);
  doc.text('ADVENTURE & BREW • EST. 2026', 20, 32);
  doc.setFontSize(10);
  doc.text('KUITANSI PEMBAYARAN', 140, 20);
  doc.setFontSize(14);
  doc.text(`#${(booking.id || '').substring(0, 8).toUpperCase()}`, 140, 30);
  doc.setFontSize(9);
  const bookingDate = booking.createdAt ? new Date(booking.createdAt.seconds * 1000) : new Date();
  const displayDate = isNaN(bookingDate.getTime()) ? new Date() : bookingDate;
  doc.text(`TANGGAL: ${displayDate.toLocaleDateString('id-ID')}`, 140, 38);

  const drawHeader = (title: string, y: number) => {
    doc.setFillColor(240, 240, 240);
    doc.rect(20, y, 170, 8, 'F');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 25, y + 5.5);
  };

  drawHeader('INFORMASI PELANGGAN', 60);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`NAMA LENGKAP: ${(booking.nama || '').toUpperCase()}`, 25, 75);
  doc.text(`WHATSAPP: ${booking.wa || ''}`, 25, 82);
  doc.text(`EMAIL: ${booking.email || 'N/A'}`, 25, 89);
  
  drawHeader('DETAIL PERJALANAN', 100);
  doc.text(`DESTINASI: ${(booking.destinasi || '').toUpperCase()} (VIA ${(booking.jalur || '').toUpperCase()})`, 25, 115);
  doc.text(`JADWAL: ${booking.jadwal || ''}`, 25, 122);
  doc.text(`PESERTA: ${booking.peserta || 0} PAX`, 25, 129);
  doc.text(`TIPE TRIP: ${booking.type === 'open' ? 'OPEN TRIP' : booking.type === 'open_request' ? 'REQUEST OPEN TRIP' : 'PRIVATE TRIP'}`, 25, 136);

  drawHeader('RINCIAN BIAYA & FASILITAS', 150);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('ITEM LAYANAN', 25, 165);
  doc.text('SUBTOTAL', 160, 165);
  doc.line(20, 168, 190, 168);
  
  doc.setFont('helvetica', 'normal');
  let currentY = 175;
  
  // Base Trip Package Highlight
  doc.setFillColor( accentColor[0], accentColor[1], accentColor[2], 0.1); 
  doc.rect(20, currentY - 5, 170, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text(`PAKET TRIP ${(booking.destinasi || '').toUpperCase()}`, 25, currentY);
  const baseTotal = (booking.totalPrice || 0) + (booking.discountAmount || 0) - (booking.opsionalPrice || 0);
  doc.text(`Rp ${baseTotal.toLocaleString('id-ID')}`, 160, currentY);
  doc.setFont('helvetica', 'normal');
  currentY += 10;

  if (booking.opsionalItems && booking.opsionalItems.length > 0) {
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('LAYANAN TAMBAHAN:', 25, currentY - 2);
    currentY += 5;
    
    booking.opsionalItems.forEach((item: any) => {
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      const isPending = item.status === 'pending_price' || (item.price === 0 && (booking.status === 'pending' || booking.status === 'processing'));
      const priceLabel = isPending ? '(Menunggu Konf. Admin)' : `@ Rp ${(item.price || 0).toLocaleString('id-ID')}`;
      const itemLine = `(+) ${item.name} (${item.count || 1}x • ${item.days || 1} Hari ${priceLabel})`;
      
      const splitItem = doc.splitTextToSize(itemLine, 130);
      doc.text(splitItem, 25, currentY);
      doc.text(isPending ? 'Mnggu Konf.' : `Rp ${(item.subtotal || 0).toLocaleString('id-ID')}`, 160, currentY);
      currentY += (splitItem.length * 6);
    });
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(10);
  }

  if (booking.promoCode) {
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text(`KODE PROMO: ${booking.promoCode}`, 25, currentY);
    doc.text(`- Rp ${booking.discountAmount?.toLocaleString('id-ID')}`, 160, currentY);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    currentY += 8;
  }

  currentY += 4;
  doc.line(140, currentY, 190, currentY);
  currentY += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', 140, currentY);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text(`Rp ${booking.totalPrice?.toLocaleString('id-ID')}`, 160, currentY);

  doc.save(`Invoice_${(booking.nama || 'User').replace(/\s/g, '_')}.pdf`);
};
