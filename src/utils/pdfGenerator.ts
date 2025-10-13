import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    gst: number;
    total: number;
  }>;
  subtotal: number;
  totalGst: number;
  total: number;
  status: 'Pending' | 'Approved' | 'Delivered' | 'Draft'; // Added 'Draft'
  showroomId: string;
  createdAt: string;
  updatedAt?: string;
}

export const generateOrderPDF = async (order: Order, companyInfo: any) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Header
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(companyInfo.companyName || 'AgriCorp', pageWidth / 2, 25, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(companyInfo.address || 'Address not configured', pageWidth / 2, 35, { align: 'center' });
  pdf.text(`GST: ${companyInfo.gstNumber || 'Not configured'}`, pageWidth / 2, 42, { align: 'center' });
  
  // Order Details
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ORDER INVOICE', pageWidth / 2, 60, { align: 'center' });
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  // Order Info Box
  pdf.rect(15, 70, pageWidth - 30, 35);
  pdf.text(`Order Number: ${order.orderNumber}`, 20, 80);
  pdf.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 20, 87);
  pdf.text(`Status: ${order.status}`, 20, 94);
  
  // Customer Info
  pdf.text(`Customer: ${order.customerName}`, pageWidth / 2 + 10, 80);
  pdf.text(`Phone: ${order.customerPhone}`, pageWidth / 2 + 10, 87);
  pdf.text(`Address: ${order.customerAddress.substring(0, 40)}`, pageWidth / 2 + 10, 94);
  if (order.customerAddress.length > 40) {
    pdf.text(order.customerAddress.substring(40), pageWidth / 2 + 10, 101);
  }
  
  // Items Table Header
  let yPosition = 120;
  pdf.setFont('helvetica', 'bold');
  pdf.rect(15, yPosition - 7, pageWidth - 30, 10);
  pdf.text('Item', 20, yPosition);
  pdf.text('Qty', 90, yPosition);
  pdf.text('Unit', 110, yPosition);
  pdf.text('Rate', 130, yPosition);
  pdf.text('GST%', 150, yPosition);
  pdf.text('Amount', 170, yPosition);
  
  // Items
  pdf.setFont('helvetica', 'normal');
  yPosition += 15;
  
  order.items.forEach((item) => {
    const itemTotal = item.quantity * item.price;
    pdf.text(item.productName.substring(0, 25), 20, yPosition);
    pdf.text(item.quantity.toString(), 90, yPosition);
    pdf.text(item.unit, 110, yPosition);
    pdf.text(`₹${item.price}`, 130, yPosition);
    pdf.text(`${item.gst}%`, 150, yPosition);
    pdf.text(`₹${itemTotal.toFixed(2)}`, 170, yPosition);
    yPosition += 10;
  });
  
  // Totals
  yPosition += 10;
  pdf.line(15, yPosition, pageWidth - 15, yPosition);
  yPosition += 15;
  
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Subtotal: ₹${order.subtotal.toFixed(2)}`, pageWidth - 80, yPosition);
  yPosition += 10;
  pdf.text(`GST: ₹${order.totalGst.toFixed(2)}`, pageWidth - 80, yPosition);
  yPosition += 10;
  pdf.text(`Total: ₹${order.total.toFixed(2)}`, pageWidth - 80, yPosition);
  
  // Footer
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'italic');
  pdf.text('Thank you for your business!', pageWidth / 2, pageHeight - 20, { align: 'center' });
  pdf.text('This is a computer generated invoice.', pageWidth / 2, pageHeight - 15, { align: 'center' });
  
  // Save the PDF
  pdf.save(`Invoice_${order.orderNumber}.pdf`);
};

// Generate report from HTML element
export const generateReportFromElement = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id ${elementId} not found`);
  }
  
  const canvas = await html2canvas(element, {
    scale: 1,
    logging: false,
    useCORS: true,
    allowTaint: false,
    backgroundColor: '#ffffff'
  });
  
  const imgWidth = 210;
  const pageHeight = 295;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  let position = 0;
  
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;
  
  while (heightLeft >= 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }
  
  pdf.save(filename);
};