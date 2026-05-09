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
