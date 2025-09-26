import React, { useState } from 'react';
import {
  Table,
  Button,
  Tooltip,
  Modal,
  Steps,
  Card,
  Row,
  Col,
  Tag,
  Divider,
  message,
  Segmented
} from 'antd';
import {
  EyeOutlined,
  DownloadOutlined,
  PrinterOutlined,
  LeftOutlined
} from '@ant-design/icons';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { generateOrderPDF } from '@/utils/pdfGenerator';
import type { Order } from '../../context/DataContext';
import { Card as UICard, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/card';
import { Button as UIButton, buttonVariants } from '../../components/ui/button';

const { Step } = Steps;

const BillsList: React.FC = () => {
  const { orders, showrooms } = useData();
  const { authState, hasPermission } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewOrderModal, setViewOrderModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');

  // Filter orders by showroomId for non-Super Admin users
  const filteredOrders = authState.role === 'Super Admin'
    ? orders
    : orders.filter(order => order.showroomId === authState.showroomId);

  const handleDownloadPDF = async (order: Order) => {
    if (!hasPermission('download_bill_pdf')) {
      message.error('You do not have permission to download bill PDFs');
      console.log(`Permission check failed: download_bill_pdf for role ${authState.role}`);
      return;
    }
    try {
      const companyInfo = {
        companyName: 'AgriCorp Showroom',
        address: '123 Village Lane, District Y',
        gstNumber: '27ABCDE1234F2Z5'
      };
      const transformedOrder = {
        ...order,
        items: order.items.map(item => ({
          productId: item.productId,
          name: item.productName,
          quantity: item.quantity,
          unitPrice: item.price,
          gst: item.gst,
          total: item.totalAmount ?? (item.quantity * item.price),
        })),
      };
      await generateOrderPDF(transformedOrder, companyInfo);
      message.success('Bill PDF downloaded successfully');
    } catch (err) {
      console.error('PDF download error:', err);
      message.error('Failed to download bill PDF');
    }
  };

  const handlePrint = (order: Order) => {
    if (!hasPermission('print_bill')) {
      message.error('You do not have permission to print bills');
      console.log(`Permission check failed: print_bill for role ${authState.role}`);
      return;
    }
    const printWindow = window.open('', '', 'height=600,width=800');
    const content = `
      <html><head><title>Bill</title></head><body>
      <h2>AgriCorp Invoice</h2>
      <p><strong>Customer:</strong> ${order.customerName}</p>
      <p><strong>Phone:</strong> ${order.customerPhone}</p>
      <p><strong>Showroom:</strong> ${showrooms.find(s => s.id === order.showroomId)?.name || 'N/A'}</p>
      <table border="1" style="width:100%; border-collapse:collapse; margin-top:10px;">
        <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
        <tbody>
          ${order.items.map(item => `
            <tr>
              <td>${item.productName}</td>
              <td>${item.quantity} ${item.unit}</td>
              <td>₹${item.price}</td>
              <td>₹${Number(item.totalAmount).toFixed(2)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
      <p><strong>Total:</strong> ₹${Number(order.total).toFixed(2)}</p>
      <p><strong>Paid:</strong> ₹${Number(order.paidAmount).toFixed(2)} | <strong>Unpaid:</strong> ₹${Number(order.unpaidAmount).toFixed(2)}</p>
      </body></html>
    `;
    printWindow?.document.write(content);
    printWindow?.print();
    printWindow?.close();
  };

  const getStatusSteps = (status: string) => {
    switch (status) {
      case 'Approved': return 1;
      case 'Delivered': return 2;
      default: return 0;
    }
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName'
    },
    {
      title: 'Phone',
      dataIndex: 'customerPhone',
      key: 'customerPhone'
    },
    {
      title: 'Showroom',
      dataIndex: 'showroomId',
      key: 'showroomId',
      render: (id: string) => showrooms.find(s => s.id === id)?.name || 'N/A'
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (amount: number) => `₹${Number(amount).toFixed(2)}`
    },
    {
      title: 'Paid',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      render: (amount: number) => `₹${Number(amount).toFixed(2)}`
    },
    {
      title: 'Unpaid',
      dataIndex: 'unpaidAmount',
      key: 'unpaidAmount',
      render: (amount: number) => `₹${Number(amount).toFixed(2)}`
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Order) => (
        <div className="flex gap-2">
          <Tooltip title="Download PDF">
            <Button
              icon={<DownloadOutlined />}
              onClick={() => {
                console.log(`Attempting to download PDF for order ${record.orderNumber} by user with role ${authState.role}`);
                handleDownloadPDF(record);
              }}
              disabled={!hasPermission('download_bill_pdf')}
            />
          </Tooltip>
          <Tooltip title="Print Bill">
            <Button
              icon={<PrinterOutlined />}
              onClick={() => {
                console.log(`Attempting to print bill for order ${record.orderNumber} by user with role ${authState.role}`);
                handlePrint(record);
              }}
              disabled={!hasPermission('print_bill')}
            />
          </Tooltip>
          <Tooltip title="View Bill">
            <Button
              icon={<EyeOutlined />}
              onClick={() => {
                console.log(`Viewing order ${record.orderNumber} by user with role ${authState.role}`);
                setSelectedOrder(record);
                setViewOrderModal(true);
              }}
              disabled={!hasPermission('view_bill_history')}
            />
          </Tooltip>
        </div>
      )
    }
  ];

  if (!hasPermission('view_bill_history')) {
    return (
      <div className="p-4 bg-white rounded">
        <Button icon={<LeftOutlined />} className="cursor-pointer" onClick={() => window.history.back()} />
        <h2 className="text-lg font-semibold mb-4">All Bills</h2>
        <p>You do not have permission to view bills.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <div className="flex items-center gap-4">
          <Button icon={<LeftOutlined />} className="cursor-pointer" onClick={() => window.history.back()} />
          <h2 className="text-lg font-semibold">
            {authState.role === 'Super Admin' ? 'All Bills' : 'Your Showroom Bills'}
          </h2>
        </div>
        <Segmented
          options={['List View', 'Card View']}
          value={viewMode === 'list' ? 'List View' : 'Card View'}
          onChange={(value) => {
            const newMode = value === 'List View' ? 'list' : 'card';
            console.log(`Switching to ${newMode} view for user with role ${authState.role}`);
            setViewMode(newMode);
          }}
        />
      </div>
      {viewMode === 'list' ? (
        <Table
          dataSource={filteredOrders}
          rowKey="id"
          columns={columns}
          scroll={{ x: 1000 }}
          pagination={{ pageSize: 10 }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order, index) => (
            <UICard key={order.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>Order #{order.orderNumber}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                <p><strong>Customer:</strong> {order.customerName}</p>
                <p><strong>Phone:</strong> {order.customerPhone}</p>
                <p><strong>Showroom:</strong> {showrooms.find(s => s.id === order.showroomId)?.name || 'N/A'}</p>
                <p><strong>Total:</strong> ₹{Number(order.total).toFixed(2)}</p>
                <p><strong>Paid:</strong> ₹{Number(order.paidAmount).toFixed(2)}</p>
                <p style={{ color: Number(order.unpaidAmount) > 0 ? 'red' : 'green' }}>
                  <strong>Unpaid:</strong> ₹{Number(order.unpaidAmount).toFixed(2)}
                </p>
                <p><strong>Status:</strong>{' '}
                  <Tag color={
                    order.status === 'Delivered' ? 'green' :
                    order.status === 'Approved' ? 'blue' : 'orange'
                  }>
                    {order.status}
                  </Tag>
                </p>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Tooltip title="Download PDF">
                  <UIButton
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log(`Attempting to download PDF for order ${order.orderNumber} by user with role ${authState.role}`);
                      handleDownloadPDF(order);
                    }}
                    disabled={!hasPermission('download_bill_pdf')}
                  >
                    <DownloadOutlined />
                  </UIButton>
                </Tooltip>
                <Tooltip title="Print Bill">
                  <UIButton
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log(`Attempting to print bill for order ${order.orderNumber} by user with role ${authState.role}`);
                      handlePrint(order);
                    }}
                    disabled={!hasPermission('print_bill')}
                  >
                    <PrinterOutlined />
                  </UIButton>
                </Tooltip>
                <Tooltip title="View Bill">
                  <UIButton
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log(`Viewing order ${order.orderNumber} by user with role ${authState.role}`);
                      setSelectedOrder(order);
                      setViewOrderModal(true);
                    }}
                    disabled={!hasPermission('view_bill_history')}
                  >
                    <EyeOutlined />
                  </UIButton>
                </Tooltip>
              </CardFooter>
            </UICard>
          ))}
        </div>
      )}
      <Modal
        title={<span style={{ fontSize: '18px', fontWeight: 600 }}>{`Order Details - ${selectedOrder?.orderNumber}`}</span>}
        open={viewOrderModal}
        onCancel={() => setViewOrderModal(false)}
        footer={[
          <Button
            key="print"
            icon={<PrinterOutlined />}
            type="primary"
            onClick={() => selectedOrder && handlePrint(selectedOrder)}
            disabled={!hasPermission('print_bill')}
          >
            Print
          </Button>,
          <Button key="close" onClick={() => setViewOrderModal(false)}>
            Close
          </Button>
        ]}
        width={900}
      >
        {selectedOrder && (
          <div className="space-y-6">
            <Row gutter={16}>
              <Col span={12}>
                <Card title="Customer Details" size="small" bordered={false}>
                  <p><strong>Name:</strong> {selectedOrder.customerName}</p>
                  <p><strong>Phone:</strong> {selectedOrder.customerPhone}</p>
                  <p><strong>Address:</strong> {selectedOrder.customerAddress}</p>
                  <p><strong>Village:</strong> {selectedOrder.village}</p>
                  <p><strong>Taluka:</strong> {selectedOrder.taluka}</p>
                  <p><strong>District:</strong> {selectedOrder.district}</p>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Order Information" size="small" bordered={false}>
                  <p><strong>Order #:</strong> {selectedOrder.orderNumber}</p>
                  <p><strong>Date:</strong> {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}</p>
                  <p><strong>Showroom:</strong> {showrooms.find(s => s.id === selectedOrder.showroomId)?.name || 'N/A'}</p>
                  <p><strong>Status:</strong>{' '}
                    <Tag color={
                      selectedOrder.status === 'Delivered' ? 'green' :
                      selectedOrder.status === 'Approved' ? 'blue' : 'orange'
                    }>
                      {selectedOrder.status}
                    </Tag>
                  </p>
                </Card>
              </Col>
            </Row>
            <Divider orientation="left" plain>Products</Divider>
            <Table
              dataSource={selectedOrder.items}
              rowKey="productId"
              pagination={false}
              size="middle"
              bordered
              columns={[
                { title: 'Product', dataIndex: 'productName', key: 'productName' },
                {
                  title: 'Quantity',
                  key: 'quantity',
                  render: (_, item) => `${item.quantity} ${item.unit}`
                },
                {
                  title: 'Price (₹)',
                  dataIndex: 'price',
                  key: 'price',
                  render: (price: number) => `₹${price.toFixed(2)}`
                },
                {
                  title: 'GST (%)',
                  dataIndex: 'gst',
                  key: 'gst',
                  render: (gst: number) => `${gst}%`
                },
                {
                  title: 'Discount (%)',
                  dataIndex: 'discount',
                  key: 'discount',
                  render: (discount: number) => `${discount}%`
                },
                {
                  title: 'Total (₹)',
                  dataIndex: 'totalAmount',
                  key: 'totalAmount',
                  render: (value: number) => `₹${value.toFixed(2)}`
                }
              ]}
            />
            <Divider orientation="left" plain>Payment Summary</Divider>
            <Row justify="end">
              <Col span={12}>
                <div className="summary-box" style={{ fontSize: 16 }}>
                  <p><strong>Subtotal:</strong> ₹{Number(selectedOrder.subtotal).toFixed(2)}</p>
                  <p><strong>GST Total:</strong> ₹{Number(selectedOrder.totalGst).toFixed(2)}</p>
                  <p><strong>Total Amount:</strong> ₹{Number(selectedOrder.total).toFixed(2)}</p>
                  <p><strong>Paid:</strong> ₹{Number(selectedOrder.paidAmount).toFixed(2)}</p>
                  <p style={{ color: Number(selectedOrder.unpaidAmount) > 0 ? 'red' : 'green' }}>
                    <strong>Unpaid:</strong> ₹{Number(selectedOrder.unpaidAmount).toFixed(2)}
                  </p>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BillsList;

// import React, { useState } from 'react';
// import {
//   Table,
//   Button,
//   Tooltip,
//   Modal,
//   Steps,
//   Card,
//   Row,
//   Col,
//   Tag,
//   Divider 
// } from 'antd';
// import {
//   EyeOutlined,
//   DownloadOutlined,
//   PrinterOutlined,
//   LeftOutlined
// } from '@ant-design/icons';
// import { useData } from '../../context/DataContext';
// import { generateOrderPDF } from '@/utils/pdfGenerator';
// import type { Order } from '../../context/DataContext';

// const { Step } = Steps;

// const BillsList: React.FC = () => {
//   const { orders, showrooms } = useData();

//   const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
//   const [viewOrderModal, setViewOrderModal] = useState(false);

//   const handleDownloadPDF = async (order: Order) => {
//     try {
//       const companyInfo = {
//         companyName: 'AgriCorp Showroom',
//         address: '123 Village Lane, District Y',
//         gstNumber: '27ABCDE1234F2Z5'
//       };

//         const transformedOrder = {
//       ...order,
//       items: order.items.map(item => ({
//         productId: item.productId,
//         name: item.productName, // mapping productName to name
//         quantity: item.quantity,
//         unitPrice: item.price,
//         gst: item.gst,
//         total: item.totalAmount ?? (item.quantity * item.price), // fallback if totalAmount is missing
//       })),
//     };

//     await generateOrderPDF(transformedOrder, companyInfo);
//     } catch (err) {
//       console.error('PDF download error:', err);
//     }
//   };

//   const handlePrint = (order: Order) => {
//     const printWindow = window.open('', '', 'height=600,width=800');
//     const content = `
//       <html><head><title>Bill</title></head><body>
//       <h2>AgriCorp Invoice</h2>
//       <p><strong>Customer:</strong> ${order.customerName}</p>
//       <p><strong>Phone:</strong> ${order.customerPhone}</p>
//       <p><strong>Showroom:</strong> ${showrooms.find(s => s.id === order.showroomId)?.name || 'N/A'}</p>
//       <table border="1" style="width:100%; border-collapse:collapse; margin-top:10px;">
//         <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
//         <tbody>
//           ${order.items.map(item => `
//             <tr>
//               <td>${item.productName}</td>
//               <td>${item.quantity} ${item.unit}</td>
//               <td>₹${item.price}</td>
//               <td>₹${Number(item.totalAmount).toFixed(2)}</td>
//             </tr>`).join('')}
//         </tbody>
//       </table>
//       <p><strong>Total:</strong> ₹${Number(order.total).toFixed(2)}</p>
//       <p><strong>Paid:</strong> ₹${Number(order.paidAmount).toFixed(2)} | <strong>Unpaid:</strong> ₹${Number(order.unpaidAmount).toFixed(2)}</p>
//       </body></html>
//     `;
//     printWindow?.document.write(content);
//     printWindow?.print();
//     printWindow?.close();
//   };

//   const getStatusSteps = (status: string) => {
//     switch (status) {
//       case 'Approved': return 1;
//       case 'Delivered': return 2;
//       default: return 0;
//     }
//   };

//   const columns = [
//     {
//       title: 'Date',
//       dataIndex: 'createdAt',
//       key: 'createdAt',
//       render: (date: string) => new Date(date).toLocaleDateString()
//     },
//     {
//       title: 'Customer',
//       dataIndex: 'customerName',
//       key: 'customerName'
//     },
//     {
//       title: 'Phone',
//       dataIndex: 'customerPhone',
//       key: 'customerPhone'
//     },
//     {
//       title: 'Showroom',
//       dataIndex: 'showroomId',
//       key: 'showroomId',
//       render: (id: string) => showrooms.find(s => s.id === id)?.name || 'N/A'
//     },
//     {
//       title: 'Total',
//       dataIndex: 'total',
//       key: 'total',
//       render: (amount: number) => `₹${Number(amount).toFixed(2)}`
//     },
//     {
//       title: 'Paid',
//       dataIndex: 'paidAmount',
//       key: 'paidAmount',
//       render: (amount: number) => `₹${Number(amount).toFixed(2)}`
//     },
//     {
//       title: 'Unpaid',
//       dataIndex: 'unpaidAmount',
//       key: 'unpaidAmount',
//       render: (amount: number) => `₹${Number(amount).toFixed(2)}`
//     },
//     {
//       title: 'Actions',
//       key: 'actions',
//       render: (_: any, record: Order) => (
//         <div className="flex gap-2">
//           <Tooltip title="Download PDF">
//             <Button icon={<DownloadOutlined />} onClick={() => handleDownloadPDF(record)} />
//           </Tooltip>
//           <Tooltip title="Print Bill">
//             <Button icon={<PrinterOutlined />} onClick={() => handlePrint(record)} />
//           </Tooltip>
//           <Tooltip title="View Bill">
//             <Button icon={<EyeOutlined />} onClick={() => {
//               setSelectedOrder(record);
//               setViewOrderModal(true);
//             }} />
//           </Tooltip>
//         </div>
//       )
//     }
//   ];

//   return (
//     <div className="p-4 bg-white rounded ">
//         <Button icon={<LeftOutlined />} className="cursor-pointer" onClick={() => window.history.back()}>
//         </Button>
//       <h2 className="text-lg font-semibold mb-4">All Bills</h2>
//       <Table
//         dataSource={orders}
//         rowKey="id"
//         columns={columns}
//         scroll={{ x: 1000 }}
//         pagination={{ pageSize: 10 }}
//       />

// <Modal
//   title={<span style={{ fontSize: '18px', fontWeight: 600 }}>{`Order Details - ${selectedOrder?.orderNumber}`}</span>}
//   open={viewOrderModal}
//   onCancel={() => setViewOrderModal(false)}
//   footer={[
//     <Button key="print" icon={<PrinterOutlined />} type="primary" onClick={() => selectedOrder && handlePrint(selectedOrder)}>
//       Print
//     </Button>,
//     <Button key="close" onClick={() => setViewOrderModal(false)}>
//       Close
//     </Button>
//   ]}
//   width={900}
// >
//   {selectedOrder && (
//     <div className="space-y-6">
//       {/* Status Steps */}
//       {/* <Steps
//         current={getStatusSteps(selectedOrder.status)}
//         size="small"
//         style={{ marginBottom: 24 }}
//       >
//         <Step title="Pending" />
//         <Step title="Approved" />
//         <Step title="Delivered" />
//       </Steps> */}

//       {/* Customer and Order Info */}
//       <Row gutter={16}>
//         <Col span={12}>
//           <Card title="Customer Details" size="small" bordered={false}>
//             <p><strong>Name:</strong> {selectedOrder.customerName}</p>
//             <p><strong>Phone:</strong> {selectedOrder.customerPhone}</p>
//             <p><strong>Address:</strong> {selectedOrder.customerAddress}</p>
//             <p><strong>Village:</strong> {selectedOrder.village}</p>
//             <p><strong>Taluka:</strong> {selectedOrder.taluka}</p>
//             <p><strong>District:</strong> {selectedOrder.district}</p>
//           </Card>
//         </Col>
//         <Col span={12}>
//           <Card title="Order Information" size="small" bordered={false}>
//             <p><strong>Order #:</strong> {selectedOrder.orderNumber}</p>
//             <p><strong>Date:</strong> {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}</p>
//             <p><strong>Showroom:</strong> {showrooms.find(s => s.id === selectedOrder.showroomId)?.name || 'N/A'}</p>
//             <p><strong>Status:</strong>{' '}
//               <Tag color={
//                 selectedOrder.status === 'Delivered' ? 'green' :
//                 selectedOrder.status === 'Approved' ? 'blue' : 'orange'
//               }>
//                 {selectedOrder.status}
//               </Tag>
//             </p>
//           </Card>
//         </Col>
//       </Row>

//       <Divider orientation="left" plain>Products</Divider>

//       {/* Products Table */}
//       <Table
//         dataSource={selectedOrder.items}
//         rowKey="productId"
//         pagination={false}
//         size="middle"
//         bordered
//         columns={[
//           { title: 'Product', dataIndex: 'productName', key: 'productName' },
//           {
//             title: 'Quantity',
//             key: 'quantity',
//             render: (_, item) => `${item.quantity} ${item.unit}`
//           },
//           {
//             title: 'Price (₹)',
//             dataIndex: 'price',
//             key: 'price',
//             render: (price: number) => `₹${price.toFixed(2)}`
//           },
//           {
//             title: 'GST (%)',
//             dataIndex: 'gst',
//             key: 'gst',
//             render: (gst: number) => `${gst}%`
//           },
//           {
//             title: 'Discount (%)',
//             dataIndex: 'discount',
//             key: 'discount',
//             render: (discount: number) => `${discount}%`
//           },
//           {
//             title: 'Total (₹)',
//             dataIndex: 'totalAmount',
//             key: 'totalAmount',
//             render: (value: number) => `₹${value.toFixed(2)}`
//           }
//         ]}
//       />

//       <Divider orientation="left" plain>Payment Summary</Divider>

//       {/* Summary */}
//       <Row justify="end">
//         <Col span={12}>
//           <div className="summary-box" style={{ fontSize: 16 }}>
//             <p><strong>Subtotal:</strong> ₹{Number(selectedOrder.subtotal).toFixed(2)}</p>
//             <p><strong>GST Total:</strong> ₹{Number(selectedOrder.totalGst).toFixed(2)}</p>
//             <p><strong>Total Amount:</strong> ₹{Number(selectedOrder.total).toFixed(2)}</p>
//             <p><strong>Paid:</strong> ₹{Number(selectedOrder.paidAmount).toFixed(2)}</p>
//             <p style={{ color: Number(selectedOrder.unpaidAmount) > 0 ? 'red' : 'green' }}>
//               <strong>Unpaid:</strong> ₹{Number(selectedOrder.unpaidAmount).toFixed(2)}
//             </p>
//           </div>
//         </Col>
//       </Row>
//     </div>
//   )}
// </Modal>

//     </div>
//   );
// };

// export default BillsList;
