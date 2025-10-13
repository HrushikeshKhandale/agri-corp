import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Tooltip,
  Modal,
  Card,
  Row,
  Col,
  Divider,
  message,
  Segmented,
  Popconfirm,
  Tabs
} from 'antd';
import {
  EyeOutlined,
  DownloadOutlined,
  PrinterOutlined,
  LeftOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContexts';
import { generateOrderPDF } from '@/utils/pdfGenerator';
import { Card as UICard, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/card';
import { Button as UIButton } from '../../components/ui/button';
import billService, { BillResponse } from '../../services/billService';

const BillsList: React.FC = () => {
  const { showrooms } = useData();
  const { hasPermission } = useAuth();
  const [bills, setBills] = useState<BillResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBill, setSelectedBill] = useState<BillResponse | null>(null);
  const [viewBillModal, setViewBillModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');

  useEffect(() => {
    fetchBills();
  }, []);

// Add this validation function at the top of the file
const isValidBill = (bill: BillResponse): boolean => {
  return !!(
    bill &&
    bill.id &&
    bill.customerName &&
    Array.isArray(bill.items) &&
    typeof bill.total === 'number'
  );
};

// Update the fetchBills function
const fetchBills = async () => {
  setLoading(true);
  try {
    const data = await billService.getAllBills();
    // Filter out any invalid bill data
    const validBills = data.filter(isValidBill);
    if (validBills.length !== data.length) {
      console.warn('Some bills were filtered out due to invalid data');
    }
    setBills(validBills);
  } catch (error) {
    console.error("Failed to fetch bills:", error);
    message.error('Failed to load bills');
  } finally {
    setLoading(false);
  }
};

// Update the render method for amount values to handle potential null/undefined
const formatAmount = (amount: number | null | undefined): string => {
  return amount ? `₹${Number(amount).toFixed(2)}` : '₹0.00';
};

  const handleDeleteBill = async (id: number) => {
    try {
      await billService.deleteBill(id);
      message.success('Bill deleted successfully');
      fetchBills();
    } catch (error) {
      message.error('Failed to delete bill');
    }
  };

  const handleDownloadPDF = async (bill: BillResponse) => {
    try {
      const companyInfo = {
        companyName: 'AgriCorp Showroom',
        address: '123 Village Lane, District Y',
        gstNumber: '27ABCDE1234F2Z5'
      };
      const transformedOrder = {
        ...bill,
        customerName: bill.customerName,
        customerPhone: bill.contact,
        items: bill.items.map(item => ({
          productId: item.id.toString(),
          name: `${item.companyName} - ${item.category}`,
          quantity: item.quantity,
          unitPrice: item.salePrice,
          gst: item.gst,
          total: item.totalAmount,
        })),
      };
      await generateOrderPDF(transformedOrder, companyInfo);
      message.success('Bill PDF downloaded successfully');
    } catch (err) {
      console.error('PDF download error:', err);
      message.error('Failed to download bill PDF');
    }
  };

  const handlePrint = (bill: BillResponse) => {
    const printWindow = window.open('', '', 'height=600,width=800');
    const content = `
      <html><head><title>Bill</title></head><body>
      <h2>AgriCorp Invoice</h2>
      <p><strong>Customer:</strong> ${bill.customerName}</p>
      <p><strong>Phone:</strong> ${bill.contact}</p>
      <p><strong>Address:</strong> ${bill.village}, ${bill.taluka}, ${bill.district}</p>
      <table border="1" style="width:100%; border-collapse:collapse; margin-top:10px;">
        <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
        <tbody>
          ${bill.items.map(item => `
            <tr>
              <td>${item.companyName} - ${item.category}</td>
              <td>${item.quantity} ${item.unit}</td>
              <td>₹${item.salePrice}</td>
              <td>₹${Number(item.totalAmount).toFixed(2)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
      <p><strong>Total:</strong> ₹${Number(bill.total).toFixed(2)}</p>
      <p><strong>Paid:</strong> ₹${Number(bill.amountPayingNow).toFixed(2)} | <strong>Unpaid:</strong> ₹${Number(bill.unpaidAmount).toFixed(2)}</p>
      </body></html>
    `;
    printWindow?.document.write(content);
    printWindow?.print();
    printWindow?.close();
  };

  const columns = [
    {
      title: 'Bill ID',
      dataIndex: 'id',
      key: 'id'
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName'
    },
    {
      title: 'Phone',
      dataIndex: 'contact',
      key: 'contact'
    },
    {
      title: 'Location',
      key: 'location',
      render: (_, record: BillResponse) => `${record.village}, ${record.district}`
    },
    {
  title: 'Total',
  dataIndex: 'total',
  key: 'total',
  render: (amount: number) => formatAmount(amount)
},
{
  title: 'Paid',
  dataIndex: 'amountPayingNow',
  key: 'amountPayingNow',
  render: (amount: number) => formatAmount(amount)
},
{
  title: 'Unpaid',
  dataIndex: 'unpaidAmount',
  key: 'unpaidAmount',
  render: (amount: number) => formatAmount(amount)
},
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: BillResponse) => (
        <div className="flex gap-2">
          <Tooltip title="View Bill">
            <Button
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedBill(record);
                setViewBillModal(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Print Bill">
            <Button
              icon={<PrinterOutlined />}
              onClick={() => handlePrint(record)}
            />
          </Tooltip>
          <Tooltip title="Download PDF">
            <Button
              icon={<DownloadOutlined />}
              onClick={() => handleDownloadPDF(record)}
            />
          </Tooltip>
          <Tooltip title="Delete Bill">
            <Popconfirm
              title="Are you sure you want to delete this bill?"
              onConfirm={() => handleDeleteBill(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                icon={<DeleteOutlined />}
                danger
              />
            </Popconfirm>
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
          <h2 className="text-lg font-semibold">All Bills</h2>
        </div>
        <Segmented
          options={['List View', 'Card View']}
          value={viewMode === 'list' ? 'List View' : 'Card View'}
          onChange={(value) => {
            const newMode = value === 'List View' ? 'list' : 'card';
            setViewMode(newMode);
          }}
        />
      </div>
      <Tabs defaultActiveKey="final" items={[
        {
          key: 'quotation',
          label: 'Quotation Bills',
          children: (
            viewMode === 'list' ? (
              <Table
                dataSource={bills}
                rowKey="id"
                columns={columns}
                scroll={{ x: 1000 }}
                pagination={{ pageSize: 10 }}
                loading={loading}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {bills.map((bill) => (
                  <UICard key={bill.id} className="flex flex-col">
                    <CardHeader>
                      <CardTitle>Bill #{bill.id}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p><strong>Customer:</strong> {bill.customerName}</p>
                      <p><strong>Phone:</strong> {bill.contact}</p>
                      <p><strong>Location:</strong> {bill.village}, {bill.district}</p>
                      <p><strong>Total:</strong> ₹{Number(bill.total).toFixed(2)}</p>
                      <p><strong>Paid:</strong> ₹{Number(bill.amountPayingNow).toFixed(2)}</p>
                      <p style={{ color: Number(bill.unpaidAmount) > 0 ? 'red' : 'green' }}>
                        <strong>Unpaid:</strong> ₹{Number(bill.unpaidAmount).toFixed(2)}
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                      <Tooltip title="Download PDF">
                        <UIButton
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadPDF(bill)}
                        >
                          <DownloadOutlined />
                        </UIButton>
                      </Tooltip>
                      <Tooltip title="Print Bill">
                        <UIButton
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrint(bill)}
                        >
                          <PrinterOutlined />
                        </UIButton>
                      </Tooltip>
                      <Tooltip title="View Bill">
                        <UIButton
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBill(bill);
                            setViewBillModal(true);
                          }}
                        >
                          <EyeOutlined />
                        </UIButton>
                      </Tooltip>
                    </CardFooter>
                  </UICard>
                ))}
              </div>
            )
          )
        },
        {
          key: 'provisional',
          label: 'Provisional Bills',
          children: (
            viewMode === 'list' ? (
              <Table
                dataSource={bills}
                rowKey="id"
                columns={columns}
                scroll={{ x: 1000 }}
                pagination={{ pageSize: 10 }}
                loading={loading}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {bills.map((bill) => (
                  <UICard key={bill.id} className="flex flex-col">
                    <CardHeader>
                      <CardTitle>Bill #{bill.id}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p><strong>Customer:</strong> {bill.customerName}</p>
                      <p><strong>Phone:</strong> {bill.contact}</p>
                      <p><strong>Location:</strong> {bill.village}, {bill.district}</p>
                      <p><strong>Total:</strong> ₹{Number(bill.total).toFixed(2)}</p>
                      <p><strong>Paid:</strong> ₹{Number(bill.amountPayingNow).toFixed(2)}</p>
                      <p style={{ color: Number(bill.unpaidAmount) > 0 ? 'red' : 'green' }}>
                        <strong>Unpaid:</strong> ₹{Number(bill.unpaidAmount).toFixed(2)}
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                      <Tooltip title="Download PDF">
                        <UIButton
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadPDF(bill)}
                        >
                          <DownloadOutlined />
                        </UIButton>
                      </Tooltip>
                      <Tooltip title="Print Bill">
                        <UIButton
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrint(bill)}
                        >
                          <PrinterOutlined />
                        </UIButton>
                      </Tooltip>
                      <Tooltip title="View Bill">
                        <UIButton
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBill(bill);
                            setViewBillModal(true);
                          }}
                        >
                          <EyeOutlined />
                        </UIButton>
                      </Tooltip>
                    </CardFooter>
                  </UICard>
                ))}
              </div>
            )
          )
        },
        {
          key: 'final',
          label: 'Final Bills',
          children: (
            viewMode === 'list' ? (
              <Table
                dataSource={bills}
                rowKey="id"
                columns={columns}
                scroll={{ x: 1000 }}
                pagination={{ pageSize: 10 }}
                loading={loading}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {bills.map((bill) => (
                  <UICard key={bill.id} className="flex flex-col">
                    <CardHeader>
                      <CardTitle>Bill #{bill.id}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p><strong>Customer:</strong> {bill.customerName}</p>
                      <p><strong>Phone:</strong> {bill.contact}</p>
                      <p><strong>Location:</strong> {bill.village}, {bill.district}</p>
                      <p><strong>Total:</strong> ₹{Number(bill.total).toFixed(2)}</p>
                      <p><strong>Paid:</strong> ₹{Number(bill.amountPayingNow).toFixed(2)}</p>
                      <p style={{ color: Number(bill.unpaidAmount) > 0 ? 'red' : 'green' }}>
                        <strong>Unpaid:</strong> ₹{Number(bill.unpaidAmount).toFixed(2)}
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                      <Tooltip title="Download PDF">
                        <UIButton
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadPDF(bill)}
                        >
                          <DownloadOutlined />
                        </UIButton>
                      </Tooltip>
                      <Tooltip title="Print Bill">
                        <UIButton
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrint(bill)}
                        >
                          <PrinterOutlined />
                        </UIButton>
                      </Tooltip>
                      <Tooltip title="View Bill">
                        <UIButton
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBill(bill);
                            setViewBillModal(true);
                          }}
                        >
                          <EyeOutlined />
                        </UIButton>
                      </Tooltip>
                    </CardFooter>
                  </UICard>
                ))}
              </div>
            )
          )
        }
      ]} />
      <Modal
        title={<span style={{ fontSize: '18px', fontWeight: 600 }}>{`Bill Details - #${selectedBill?.id}`}</span>}
        open={viewBillModal}
        onCancel={() => setViewBillModal(false)}
        footer={[
          <Button
            key="print"
            icon={<PrinterOutlined />}
            type="primary"
            onClick={() => selectedBill && handlePrint(selectedBill)}
          >
            Print
          </Button>,
          <Button key="close" onClick={() => setViewBillModal(false)}>
            Close
          </Button>
        ]}
        width={900}
      >
        {selectedBill && (
          <div className="space-y-6">
            <Row gutter={16}>
              <Col span={12}>
                <Card title="Customer Details" size="small" bordered={false}>
                  <p><strong>Name:</strong> {selectedBill.customerName}</p>
                  <p><strong>Phone:</strong> {selectedBill.contact}</p>
                  <p><strong>Village:</strong> {selectedBill.village}</p>
                  <p><strong>Taluka:</strong> {selectedBill.taluka}</p>
                  <p><strong>District:</strong> {selectedBill.district}</p>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Bill Information" size="small" bordered={false}>
                  <p><strong>Bill ID:</strong> {selectedBill.id}</p>
                  <p><strong>Items Count:</strong> {selectedBill.items.length}</p>
                  <p><strong>Showroom:</strong> {selectedBill.showroom || 'Main Showroom'}</p>
                </Card>
              </Col>
            </Row>
            <Divider orientation="left" plain>Products</Divider>
            <Table
              dataSource={selectedBill.items}
              rowKey={(record, index) => index}
              pagination={false}
              size="small"
              bordered
              scroll={{ x: 1200 }}
              columns={[
                { title: 'Company', dataIndex: 'companyName', key: 'companyName', width: 120 },
                { title: 'Category', dataIndex: 'category', key: 'category', width: 100 },
                { title: 'Type', dataIndex: 'type', key: 'type', width: 100 },
                { title: 'Subtype', dataIndex: 'subtype', key: 'subtype', width: 100 },
                { title: 'Unit', dataIndex: 'unit', key: 'unit', width: 60 },
                {
                  title: 'Inward Price',
                  dataIndex: 'inwardPrice',
                  key: 'inwardPrice',
                  width: 100,
                  render: (price: number) => `₹${price.toFixed(2)}`
                },
                {
                  title: 'Sale Price',
                  dataIndex: 'salePrice',
                  key: 'salePrice',
                  width: 100,
                  render: (price: number) => `₹${price.toFixed(2)}`
                },
                {
                  title: 'GST %',
                  dataIndex: 'gst',
                  key: 'gst',
                  width: 70,
                  render: (gst: number) => `${gst}%`
                },
                {
                  title: 'Discount %',
                  dataIndex: 'discount',
                  key: 'discount',
                  width: 80,
                  render: (discount: number) => `${discount}%`
                },
                {
                  title: 'Quantity',
                  dataIndex: 'quantity',
                  key: 'quantity',
                  width: 80
                },
                {
                  title: 'Total Amount',
                  dataIndex: 'totalAmount',
                  key: 'totalAmount',
                  width: 120,
                  render: (value: number) => `₹${value.toFixed(2)}`
                }
              ]}
            />
            <Divider orientation="left" plain>Payment Summary</Divider>
            <Row justify="end">
              <Col span={12}>
                <div className="summary-box" style={{ fontSize: 16 }}>
                  <p><strong>Total Amount:</strong> ₹{Number(selectedBill.total).toFixed(2)}</p>
                  <p><strong>Amount Paid:</strong> ₹{Number(selectedBill.amountPayingNow).toFixed(2)}</p>
                  <p style={{ color: Number(selectedBill.unpaidAmount) > 0 ? 'red' : 'green' }}>
                    <strong>Unpaid Amount:</strong> ₹{Number(selectedBill.unpaidAmount).toFixed(2)}
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