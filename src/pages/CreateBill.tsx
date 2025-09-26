import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Table, Row, Col, message, AutoComplete, Select, Modal, Checkbox } from 'antd';
import { Order, useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { generateOrderPDF } from '@/utils/pdfGenerator';
import { DownloadOutlined } from '@ant-design/icons';

const { Option } = Select;

const CreateBill: React.FC = () => {
  const { customers, addCustomer, getCustomerBalance, products, showrooms, createBill, calculateOrderTotal } = useData();
  const { hasPermission, authState } = useAuth();
  const navigate = useNavigate();

  const [form] = Form.useForm();
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedShowroom, setSelectedShowroom] = useState<string | undefined>(undefined);
  const [customerBalance, setCustomerBalance] = useState({ totalPaid: 0, totalUnpaid: 0 });
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const { orders } = useData();
  const previousBills = orders.filter(order => order.customerId === selectedCustomerId);

  useEffect(() => {
    if (authState.role !== 'Super Admin' && authState.showroomId) {
      setSelectedShowroom(authState.showroomId);
      form.setFieldsValue({ showroom: authState.showroomId });
    } else if (showrooms.length > 0) {
      setSelectedShowroom(showrooms[0].id);
      form.setFieldsValue({ showroom: showrooms[0].id });
    }
  }, [authState, showrooms, form]);

  useEffect(() => {
    if (selectedCustomerId) {
      const balance = getCustomerBalance(selectedCustomerId);
      setCustomerBalance(balance);
      form.setFieldsValue({ previousUnpaid: balance.totalUnpaid.toFixed(2) });
    } else {
      setCustomerBalance({ totalPaid: 0, totalUnpaid: 0 });
      form.setFieldsValue({ previousUnpaid: '0.00' });
    }
  }, [selectedCustomerId, getCustomerBalance, form]);

  useEffect(() => {
    const { total } = calculateOrderTotal(selectedProducts.map(p => ({
      productId: p.id,
      productName: p.productName,
      quantity: p.quantity,
      unit: p.unit,
      price: p.salePrice,
      gst: p.gst,
      discount: p.discount,
      discountType: p.discountType,
      totalAmount: p.totalAmount,
    })));
    const includePreviousUnpaid = form.getFieldValue('includePreviousUnpaid');
    const previousUnpaid = includePreviousUnpaid ? customerBalance.totalUnpaid : 0;
    const paidAmount = parseFloat(form.getFieldValue('paidAmount')) || 0;
    form.setFieldsValue({
      total: (total + previousUnpaid).toFixed(2),
      unpaidAmount: (total + previousUnpaid - paidAmount).toFixed(2),
    });
  }, [selectedProducts, customerBalance, form]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.phone.includes(customerSearch)
  );

  const handleGstChange = (key: string, value: number) => {
    if (value < 0 || value > 100) {
      message.error('GST must be between 0 and 100');
      return;
    }
    setSelectedProducts(prev =>
      prev.map(product =>
        product.key === key
          ? { ...product, gst: value, totalAmount: calculateTotal(product, product.quantity) }
          : product
      )
    );
  };

  const handleDiscountChange = (key: string, value: number) => {
    if (value < 0) {
      message.error('Discount cannot be negative');
      return;
    }
    setSelectedProducts(prev =>
      prev.map(product => {
        if (product.key === key) {
          const maxDiscount = product.discountType === 'amount' ? product.salePrice * product.quantity : 100;
          if (value > maxDiscount) {
            message.error(`Discount cannot exceed ${maxDiscount}${product.discountType === 'amount' ? '₹' : '%'}`);
            return product;
          }
          return { ...product, discount: value, totalAmount: calculateTotal(product, product.quantity) };
        }
        return product;
      })
    );
  };

  const handleDiscountTypeChange = (key: string, type: 'percent' | 'amount') => {
    setSelectedProducts(prev =>
      prev.map(product =>
        product.key === key
          ? { ...product, discountType: type, totalAmount: calculateTotal(product, product.quantity) }
          : product
      )
    );
  };

  const calculateTotal = (product: any, qty: number) => {
    let discountAmount = 0;
    const discount = product.discount || 0;
    if (product.discountType === 'amount') {
      discountAmount = discount;
    } else {
      discountAmount = (product.salePrice * discount) / 100;
    }
    const priceAfterDiscount = product.salePrice - discountAmount;
    const gstAmount = (priceAfterDiscount * (product.gst || 0) * qty) / 100;
    return (priceAfterDiscount * qty) + gstAmount;
  };

  const columns = [
    { title: 'Inward Date', dataIndex: 'createdAt', key: 'createdAt', width: 120 },
    {
      title: 'Store',
      dataIndex: 'store',
      key: 'store',
      render: () => showrooms.find(s => s.id === selectedShowroom)?.name || 'N/A',
      width: 100,
    },
    { title: 'Company Name', dataIndex: 'companyName', key: 'companyName', width: 120 },
    { title: 'Category', dataIndex: 'category', key: 'category', width: 100 },
    { title: 'Type', dataIndex: 'type', key: 'type', width: 100 },
    { title: 'Subtype', dataIndex: 'subtype', key: 'subtype', width: 100 },
    { title: 'Unit', dataIndex: 'unit', key: 'unit', width: 80 },
    {
      title: 'Inward Price',
      dataIndex: 'inwardPrice',
      key: 'inwardPrice',
      render: (price: number) => `₹${price.toFixed(2)}`,
      width: 100,
    },
    {
      title: 'Sale Price',
      dataIndex: 'salePrice',
      key: 'salePrice',
      render: (price: number) => `₹${price.toFixed(2)}`,
      width: 100,
    },
    {
      title: 'GST (%)',
      dataIndex: 'gst',
      key: 'gst',
      width: 120,
      render: (gst: number, record: any) => (
        <Input
          type="number"
          min={0}
          max={100}
          value={gst}
          onChange={(e) => handleGstChange(record.key, parseFloat(e.target.value) || 0)}
          addonAfter="%"
        />
      ),
    },
    {
      title: 'Discount',
      dataIndex: 'discount',
      key: 'discount',
      width: 130,
      render: (_: any, record: any) => (
        <Input
          type="number"
          min={0}
          value={record.discount}
          onChange={(e) => handleDiscountChange(record.key, parseFloat(e.target.value) || 0)}
          addonAfter={
            <Select
              value={record.discountType || 'percent'}
              style={{ width: 50 }}
              onChange={(val) => handleDiscountTypeChange(record.key, val)}
            >
              <Option value="percent">%</Option>
              <Option value="amount">₹</Option>
            </Select>
          }
        />
      ),
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (text: number, record: any) => (
        <Input
          type="number"
          min={0}
          max={record.availableStock}
          value={text}
          onChange={(e) => handleQuantityChange(record.key, e.target.value)}
          style={{ width: '80px' }}
        />
      ),
      width: 100,
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (text: number) => `₹${text.toFixed(2)}`,
      width: 120,
    },
    {
      title: 'Available Stock',
      dataIndex: 'availableStock',
      key: 'availableStock',
      render: (stock: number, record: any) => `${stock} ${record.unit}`,
      width: 120,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Button
          type="link"
          danger
          onClick={() => setSelectedProducts(prev => prev.filter(p => p.key !== record.key))}
        >
          Remove
        </Button>
      ),
      width: 100,
    },
  ];

  const handleQuantityChange = (key: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setSelectedProducts(prev =>
      prev.map(product => {
        if (product.key === key) {
          const productData = products.find(p => p.id === product.id);
          const availableStock = productData?.stock[selectedShowroom || ''] || 0;
          if (numValue > availableStock) {
            message.error(`Quantity cannot exceed available stock: ${availableStock} ${product.unit}`);
            return product;
          }
          return {
            ...product,
            quantity: numValue,
            totalAmount: calculateTotal(product, numValue),
          };
        }
        return product;
      })
    );
  };

  const handleAddProduct = (productId: string) => {
    if (!hasPermission('view_products')) {
      message.error('You do not have permission to view products');
      return;
    }
    const product = products.find(p => p.id === productId);
    if (!product) return;
    if (!selectedShowroom) {
      message.error('Please select a showroom first');
      return;
    }
    if (selectedProducts.some(p => p.id === product.id)) {
      message.warning('Product already added!');
      return;
    }
    const availableStock = product.stock[selectedShowroom] || 0;
    if (availableStock <= 0) {
      message.error('No stock available for this product in the selected showroom');
      return;
    }
    const newProduct = {
      key: `${product.id}-${Date.now()}`,
      id: product.id,
      productName: product.name,
      createdAt: product.createdAt,
      store: showrooms.find(s => s.id === selectedShowroom)?.name || 'N/A',
      companyName: product.companyName || 'AgriCorp',
      category: product.category,
      type: product.type || 'Standard',
      subtype: product.subtype || 'Basic',
      unit: product.unit,
      inwardPrice: product.inwardPrice || product.price * 0.8,
      salePrice: product.price,
      gst: product.gst,
      discount: product.discount || 0,
      discountType: 'percent',
      quantity: 1,
      totalAmount: calculateTotal(
        {
          salePrice: product.price,
          gst: product.gst,
          discount: product.discount || 0,
          discountType: 'percent',
        },
        1
      ),
      availableStock,
    };
    setSelectedProducts([...selectedProducts, newProduct]);
    setSearchQuery('');
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    setSelectedCustomerId(customer.id);
    form.setFieldsValue({
      customerName: customer.name,
      contact: customer.phone,
      village: customer.village || '',
      taluka: customer.taluka || '',
      district: customer.district || 'N/A',
    });
    setCustomerSearch('');
  };

  const handleCustomerSearch = (value: string) => {
    setCustomerSearch(value);
    if (!value) {
      setSelectedCustomerId(null);
      setCustomerBalance({ totalPaid: 0, totalUnpaid: 0 });
      form.resetFields(['customerName', 'contact', 'village', 'taluka', 'district', 'previousUnpaid']);
    }
  };

  const handleFinish = (values: any) => {
    if (!hasPermission('create_bill')) {
      message.error('You do not have permission to create bills');
      console.log('Permission check failed: create_bill');
      return;
    }
    if (!selectedShowroom) {
      message.error('Please select a showroom');
      return;
    }
    if (selectedProducts.length === 0) {
      message.error('Please add at least one product');
      return;
    }
    if (!selectedCustomerId && !hasPermission('add_customer')) {
      message.error('You do not have permission to add new customers');
      console.log('Permission check failed: add_customer');
      return;
    }
    if (!selectedCustomerId) {
      const newCustomer = addCustomer({
        name: values.customerName,
        phone: values.contact,
        address: `${values.village || ''}, ${values.taluka || ''}, ${values.district || ''}`,
        village: values.village,
        taluka: values.taluka,
        district: values.district,
      });
      values.customerId = newCustomer.id;
    }

    const { total } = calculateOrderTotal(selectedProducts.map(p => ({
      productId: p.id,
      productName: p.productName,
      quantity: p.quantity,
      unit: p.unit,
      price: p.salePrice,
      gst: p.gst,
      discount: p.discount,
      discountType: p.discountType,
      totalAmount: p.totalAmount,
    })));
    const includePreviousUnpaid = values.includePreviousUnpaid;
    const previousUnpaid = includePreviousUnpaid ? customerBalance.totalUnpaid : 0;
    const totalWithPrevious = total + previousUnpaid;
    const paidAmount = parseFloat(values.paidAmount) || 0;
    if (paidAmount < 0) {
      message.error('Paid amount cannot be negative');
      return;
    }
    if (paidAmount > totalWithPrevious) {
      message.error('Paid amount cannot exceed total');
      return;
    }
    const unpaidAmount = totalWithPrevious - paidAmount;

    const billData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'> = {
      customerId: selectedCustomerId || values.customerId,
      customerName: values.customerName,
      customerPhone: values.contact,
      customerAddress: `${values.village || ''}, ${values.taluka || ''}, ${values.district || ''}`,
      village: values.village,
      taluka: values.taluka,
      district: values.district,
      items: selectedProducts.map(p => ({
        productId: p.id,
        productName: p.productName,
        quantity: p.quantity,
        unit: p.unit,
        price: p.salePrice,
        gst: p.gst,
        discount: p.discount,
        discountType: p.discountType,
        totalAmount: p.totalAmount,
      })),
      subtotal: calculateOrderTotal(selectedProducts).subtotal,
      totalGst: calculateOrderTotal(selectedProducts).totalGst,
      total: totalWithPrevious,
      paidAmount,
      unpaidAmount,
      status: paidAmount === totalWithPrevious ? 'Paid' : 'Pending',
      showroomId: selectedShowroom,
    };

    try {
      createBill(billData);
      message.success('Bill created successfully');
      navigate('/bill/history');
    } catch (error) {
      message.error('Failed to create bill');
      console.error('Bill creation error:', error);
    }
  };

  const handlePrint = () => {
    const { total } = calculateOrderTotal(selectedProducts);
    const includePreviousUnpaid = form.getFieldValue('includePreviousUnpaid');
    const totalWithPrevious = total + (includePreviousUnpaid ? customerBalance.totalUnpaid : 0);
    const paidAmount = parseFloat(form.getFieldValue('paidAmount') || 0);
    const billContent = `
      <html>
        <head><style>body { font-family: Arial; } table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ddd; padding: 8px; } .header { text-align: center; }</style></head>
        <body>
          <h2 class="header">AgriCorp Bill</h2>
          <p>Customer: ${form.getFieldValue('customerName') || 'N/A'}</p>
          <p>Contact: ${form.getFieldValue('contact') || 'N/A'}</p>
          <p>Address: ${form.getFieldValue('village') || ''}, ${form.getFieldValue('taluka') || ''}, ${form.getFieldValue('district') || ''}</p>
          <p>Showroom: ${showrooms.find(s => s.id === selectedShowroom)?.name || 'N/A'}</p>
          <p>Previous Balance: Paid ₹${customerBalance.totalPaid.toFixed(2)} | Unpaid ₹${customerBalance.totalUnpaid.toFixed(2)}</p>
          <table>
            <tr><th>Product</th><th>Qty</th><th>Price</th><th>Discount</th><th>GST</th><th>Total</th></tr>
            ${selectedProducts.map(p => `
              <tr>
                <td>${p.productName} (${p.companyName})</td>
                <td>${p.quantity} ${p.unit}</td>
                <td>₹${p.salePrice.toFixed(2)}</td>
                <td>${p.discount}${p.discountType === 'amount' ? '₹' : '%'}</td>
                <td>${p.gst}%</td>
                <td>₹${p.totalAmount.toFixed(2)}</td>
              </tr>
            `).join('')}
          </table>
          ${includePreviousUnpaid ? `<p>Previous Unpaid Amount: ₹${customerBalance.totalUnpaid.toFixed(2)}</p>` : ''}
          <p>Total: ₹${totalWithPrevious.toFixed(2)}</p>
          <p>Paid: ₹${paidAmount.toFixed(2)}</p>
          <p>Unpaid: ₹${(totalWithPrevious - paidAmount).toFixed(2)}</p>
        </body>
      </html>
    `;
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow?.document.write(billContent);
    printWindow?.document.close();
    printWindow?.print();
    printWindow?.close();
  };

  const handleDownloadBillPdf = async (order: Order) => {
    if (!hasPermission('view_bill_history')) {
      message.error('You do not have permission to download bill PDFs');
      console.log('Permission check failed: view_bill_history');
      return;
    }
    try {
      const companyInfo = {
        companyName: 'AgriCorp Showroom',
        address: '123 Village Street, District X',
        gstNumber: '27ABCDE1234F2Z5',
      };
      const transformedOrder = {
        ...order,
        items: order.items.map(item => ({
          productId: item.productId,
          name: item.productName,
          quantity: item.quantity,
          unitPrice: item.price,
          gst: item.gst,
          discount: item.discount,
          discountType: item.discountType,
          total: calculateTotal(
            {
              salePrice: item.price,
              gst: item.gst,
              discount: item.discount || 0,
              discountType: item.discountType || 'percent',
            },
            item.quantity
          ),
        })),
      };
      await generateOrderPDF(transformedOrder, companyInfo);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      message.error('Failed to generate invoice PDF');
    }
  };

  return (
    <div className="p-4 md:p-6 bg-white shadow rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Create Bill / Sale</h2>

      <Form form={form} onFinish={handleFinish} layout="vertical">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="customerName"
              label="Customer Name"
              rules={[{ required: true, message: 'Please input or select a customer!' }]}
            >
              <AutoComplete
                value={customerSearch}
                onChange={handleCustomerSearch}
                onSelect={handleCustomerSelect}
                placeholder="Search by name or phone"
                style={{ width: '100%' }}
                options={filteredCustomers.map(customer => ({
                  value: customer.id,
                  label: (
                    <div className="flex justify-between">
                      <span>{customer.name} ({customer.phone})</span>
                      <span>{customer.village || 'N/A'}</span>
                    </div>
                  ),
                }))}
                filterOption={false}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="contact" label="Contact" rules={[{ required: true, message: 'Please enter contact' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="showroom" label="Showroom" rules={[{ required: true, message: 'Please select a showroom' }]}>
              <Select
                value={selectedShowroom}
                onChange={setSelectedShowroom}
                disabled={authState.role !== 'Super Admin' && authState.showroomId !== undefined}
              >
                {(authState.role === 'Super Admin'
                  ? showrooms
                  : showrooms.filter(s => s.id === authState.showroomId)
                ).map(showroom => (
                  <Option key={showroom.id} value={showroom.id}>
                    {showroom.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="village" label="Village">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="taluka" label="Taluka">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="district" label="District">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Form.Item label="Search and Add Product">
              <AutoComplete
                value={searchQuery}
                onChange={setSearchQuery}
                onSelect={handleAddProduct}
                placeholder="Search by name, category, or description"
                style={{ width: '100%' }}
                options={filteredProducts.map(product => ({
                  value: product.id,
                  label: (
                    <div className="flex justify-between">
                      <span>{product.name} ({product.category})</span>
                      <span>Stock: {product.stock[selectedShowroom || ''] || 0} {product.companyName}</span>
                    </div>
                  ),
                }))}
                filterOption={false}
              />
            </Form.Item>
          </Col>
        </Row>

        {selectedCustomerId && hasPermission('view_bill_history') && (
          <div className="mb-4">
            <Button type="default" onClick={() => setIsBillModalOpen(true)}>
              Show Previous Bills
            </Button>
          </div>
        )}

        <div style={{ overflowX: 'auto', marginBottom: 16 }}>
          <Table
            columns={columns}
            dataSource={selectedProducts}
            scroll={{ x: 1800 }}
            pagination={false}
            rowKey="key"
          />
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="paidAmount"
              label="Amount Paying Now"
              extra="Enter how much customer is paying right now. Remaining will be marked as unpaid."
              rules={[{ required: true, message: 'Please enter paid amount' }]}
            >
              <Input
                type="number"
                min={0}
                onChange={(e) => {
                  const paid = parseFloat(e.target.value) || 0;
                  const { total } = calculateOrderTotal(selectedProducts.map(p => ({
                    productId: p.id,
                    productName: p.productName,
                    quantity: p.quantity,
                    unit: p.unit,
                    price: p.salePrice,
                    gst: p.gst,
                    discount: p.discount,
                    discountType: p.discountType,
                    totalAmount: p.totalAmount,
                  })));
                  const includePreviousUnpaid = form.getFieldValue('includePreviousUnpaid');
                  const previousUnpaid = includePreviousUnpaid ? customerBalance.totalUnpaid : 0;
                  const totalWithPrevious = total + previousUnpaid;
                  if (paid > totalWithPrevious) {
                    message.warning('Paid amount cannot exceed total');
                    form.setFieldsValue({ paidAmount: totalWithPrevious });
                    return;
                  }
                  form.setFieldsValue({ unpaidAmount: (totalWithPrevious - paid).toFixed(2) });
                }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="unpaidAmount" label="Unpaid Amount">
              <Input style={{ background: "#fff", color: "#000" }} disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="total" label="Total">
              <Input style={{ background: "#fff", color: "#000" }} disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="includePreviousUnpaid" valuePropName="checked">
              <Checkbox
                onChange={() => {
                  const { total } = calculateOrderTotal(selectedProducts.map(p => ({
                    productId: p.id,
                    productName: p.productName,
                    quantity: p.quantity,
                    unit: p.unit,
                    price: p.salePrice,
                    gst: p.gst,
                    discount: p.discount,
                    discountType: p.discountType,
                    totalAmount: p.totalAmount,
                  })));
                  const includePreviousUnpaid = form.getFieldValue('includePreviousUnpaid');
                  const previousUnpaid = includePreviousUnpaid ? customerBalance.totalUnpaid : 0;
                  const paidAmount = parseFloat(form.getFieldValue('paidAmount')) || 0;
                  form.setFieldsValue({
                    total: (total + previousUnpaid).toFixed(2),
                    unpaidAmount: (total + previousUnpaid - paidAmount).toFixed(2),
                  });
                }}
              >
                Include Previous Unpaid Amount
              </Checkbox>
            </Form.Item>
          </Col>
        </Row>

        <div className="flex flex-wrap gap-4 mt-4 justify-center">
          <Button
            type="primary"
            htmlType="submit"
            disabled={!hasPermission('create_bill')}
          >
            Save Bill
          </Button>
          <Button
            type="primary"
            onClick={handlePrint}
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            disabled={selectedProducts.length === 0}
          >
            Print Bill
          </Button>
        </div>
      </Form>

      <Modal
        title={`Previous Bills - ${form.getFieldValue('customerName') || ''}`}
        visible={isBillModalOpen}
        onCancel={() => setIsBillModalOpen(false)}
        footer={null}
        width={800}
      >
        <div style={{ overflowX: 'auto' }}>
          <Table
            dataSource={previousBills}
            rowKey="id"
            scroll={{ x: 1500 }}
            pagination={{ pageSize: 5 }}
            columns={[
              {
                title: 'Date',
                dataIndex: 'createdAt',
                key: 'createdAt',
                align: 'center',
                render: (date: string) => new Date(date).toLocaleDateString(),
              },
              {
                title: 'Total',
                dataIndex: 'total',
                key: 'total',
                align: 'center',
                render: (amount: number) => `₹${amount.toFixed(2)}`,
              },
              {
                title: 'Paid',
                dataIndex: 'paidAmount',
                key: 'paidAmount',
                align: 'center',
                render: (amount: number) => `₹${amount.toFixed(2)}`,
              },
              {
                title: 'Unpaid',
                dataIndex: 'unpaidAmount',
                key: 'unpaidAmount',
                align: 'center',
                render: (amount: number) => `₹${amount.toFixed(2)}`,
              },
              {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                align: 'center',
                render: (status: string) => (
                  <span style={{ color: status === 'Pending' ? 'orange' : 'green' }}>{status}</span>
                ),
              },
              {
                title: 'Actions',
                key: 'actions',
                align: 'center',
                render: (_: any, record: Order) => (
                  <Button
                    icon={<DownloadOutlined />}
                    type="link"
                    onClick={() => handleDownloadBillPdf(record)}
                    disabled={!hasPermission('view_bill_history')}
                  />
                ),
              },
            ]}
          />
        </div>
      </Modal>
    </div>
)}

  export default CreateBill;

//   import React, { useState, useEffect } from 'react';
//   import { Form, Input, Button, Table, Row, Col, message, AutoComplete, Select, Modal, Checkbox } from 'antd';
//   import { Order, useData } from '../context/DataContext';
//   import { useAuth } from '../context/AuthContext';
//   import { useNavigate } from 'react-router-dom';
//   import { generateOrderPDF } from '@/utils/pdfGenerator';
//   import { DownloadOutlined } from '@ant-design/icons';

//   const { Option } = Select;

//   const CreateBill: React.FC = () => {
//     const { customers, addCustomer, getCustomerBalance, products, showrooms, createBill, calculateOrderTotal } = useData();
//     const { hasPermission } = useAuth();
//     const navigate = useNavigate();

//     const [form] = Form.useForm();
//     const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
//     const [searchQuery, setSearchQuery] = useState('');
//     const [customerSearch, setCustomerSearch] = useState('');
//     const [selectedShowroom, setSelectedShowroom] = useState<string | undefined>(showrooms[0]?.id);
//     const [customerBalance, setCustomerBalance] = useState({ totalPaid: 0, totalUnpaid: 0 });
//     const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
//     const [isBillModalOpen, setIsBillModalOpen] = useState(false);
//     const { orders } = useData();
//     const previousBills = orders.filter(order => order.customerId === selectedCustomerId);

//     useEffect(() => {
//       if (selectedCustomerId) {
//         const balance = getCustomerBalance(selectedCustomerId);
//         setCustomerBalance(balance);
//         form.setFieldsValue({ previousUnpaid: balance.totalUnpaid.toFixed(2) });
//       } else {
//         setCustomerBalance({ totalPaid: 0, totalUnpaid: 0 });
//         form.setFieldsValue({ previousUnpaid: '0.00' });
//       }
//     }, [selectedCustomerId, getCustomerBalance, form]);

//     useEffect(() => {
//       const { total } = calculateOrderTotal(selectedProducts.map(p => ({
//         productId: p.id,
//         productName: p.productName,
//         quantity: p.quantity,
//         unit: p.unit,
//         price: p.salePrice,
//         gst: p.gst,
//         discount: p.discount,
//         discountType: p.discountType,
//         totalAmount: p.totalAmount,
//       })));
//       const includePreviousUnpaid = form.getFieldValue('includePreviousUnpaid');
//       const previousUnpaid = includePreviousUnpaid ? customerBalance.totalUnpaid : 0;
//       const paidAmount = parseFloat(form.getFieldValue('paidAmount')) || 0;
//       form.setFieldsValue({
//         total: (total + previousUnpaid).toFixed(2),
//         unpaidAmount: (total + previousUnpaid - paidAmount).toFixed(2),
//       });
//     }, [selectedProducts, customerBalance, form]);

//     const filteredProducts = products.filter(product =>
//       product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       product.description?.toLowerCase().includes(searchQuery.toLowerCase())
//     );

//     const filteredCustomers = customers.filter(customer =>
//       customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
//       customer.phone.includes(customerSearch)
//     );

//     const handleGstChange = (key: string, value: number) => {
//       if (value < 0 || value > 100) {
//         message.error('GST must be between 0 and 100');
//         return;
//       }
//       setSelectedProducts(prev =>
//         prev.map(product =>
//           product.key === key
//             ? { ...product, gst: value, totalAmount: calculateTotal(product, product.quantity) }
//             : product
//         )
//       );
//     };

//     const handleDiscountChange = (key: string, value: number) => {
//       if (value < 0) {
//         message.error('Discount cannot be negative');
//         return;
//       }
//       setSelectedProducts(prev =>
//         prev.map(product => {
//           if (product.key === key) {
//             const maxDiscount = product.discountType === 'amount' ? product.salePrice * product.quantity : 100;
//             if (value > maxDiscount) {
//               message.error(`Discount cannot exceed ${maxDiscount}${product.discountType === 'amount' ? '₹' : '%'}`);
//               return product;
//             }
//             return { ...product, discount: value, totalAmount: calculateTotal(product, product.quantity) };
//           }
//           return product;
//         })
//       );
//     };

//     const handleDiscountTypeChange = (key: string, type: 'percent' | 'amount') => {
//       setSelectedProducts(prev =>
//         prev.map(product =>
//           product.key === key
//             ? { ...product, discountType: type, totalAmount: calculateTotal(product, product.quantity) }
//             : product
//         )
//       );
//     };

//     const calculateTotal = (product: any, qty: number) => {
//       let discountAmount = 0;
//       const discount = product.discount || 0;
//       if (product.discountType === 'amount') {
//         discountAmount = discount;
//       } else {
//         discountAmount = (product.salePrice * discount) / 100;
//       }
//       const priceAfterDiscount = product.salePrice - discountAmount;
//       const gstAmount = (priceAfterDiscount * (product.gst || 0) * qty) / 100;
//       return (priceAfterDiscount * qty) + gstAmount;
//     };

//     const columns = [
//       { title: 'Inward Date', dataIndex: 'createdAt', key: 'createdAt', width: 120 },
//       {
//         title: 'Store',
//         dataIndex: 'store',
//         key: 'store',
//         render: () => showrooms.find(s => s.id === selectedShowroom)?.name || 'N/A',
//         width: 100,
//       },
//       { title: 'Company Name', dataIndex: 'companyName', key: 'companyName', width: 120 },
//       { title: 'Category', dataIndex: 'category', key: 'category', width: 100 },
//       { title: 'Type', dataIndex: 'type', key: 'type', width: 100 },
//       { title: 'Subtype', dataIndex: 'subtype', key: 'subtype', width: 100 },
//       { title: 'Unit', dataIndex: 'unit', key: 'unit', width: 80 },
//       {
//         title: 'Inward Price',
//         dataIndex: 'inwardPrice',
//         key: 'inwardPrice',
//         render: (price: number) => `₹${price.toFixed(2)}`,
//         width: 100,
//       },
//       {
//         title: 'Sale Price',
//         dataIndex: 'salePrice',
//         key: 'salePrice',
//         render: (price: number) => `₹${price.toFixed(2)}`,
//         width: 100,
//       },
//       {
//         title: 'GST (%)',
//         dataIndex: 'gst',
//         key: 'gst',
//         width: 120,
//         render: (gst: number, record: any) => (
//           <Input
//             type="number"
//             min={0}
//             max={100}
//             value={gst}
//             onChange={(e) => handleGstChange(record.key, parseFloat(e.target.value) || 0)}
//             addonAfter="%"
//           />
//         ),
//       },
//       {
//         title: 'Discount',
//         dataIndex: 'discount',
//         key: 'discount',
//         width: 130,
//         render: (_: any, record: any) => (
//           <Input
//             type="number"
//             min={0}
//             value={record.discount}
//             onChange={(e) => handleDiscountChange(record.key, parseFloat(e.target.value) || 0)}
//             addonAfter={
//               <Select
//                 value={record.discountType || 'percent'}
//                 style={{ width: 50 }}
//                 onChange={(val) => handleDiscountTypeChange(record.key, val)}
//               >
//                 <Option value="percent">%</Option>
//                 <Option value="amount">₹</Option>
//               </Select>
//             }
//           />
//         ),
//       },
//       {
//         title: 'Qty',
//         dataIndex: 'quantity',
//         key: 'quantity',
//         render: (text: number, record: any) => (
//           <Input
//             type="number"
//             min={0}
//             max={record.availableStock}
//             value={text}
//             onChange={(e) => handleQuantityChange(record.key, e.target.value)}
//             style={{ width: '80px' }}
//           />
//         ),
//         width: 100,
//       },
//       {
//         title: 'Total Amount',
//         dataIndex: 'totalAmount',
//         key: 'totalAmount',
//         render: (text: number) => `₹${text.toFixed(2)}`,
//         width: 120,
//       },
//       {
//         title: 'Available Stock',
//         dataIndex: 'availableStock',
//         key: 'availableStock',
//         render: (stock: number, record: any) => `${stock} ${record.unit}`,
//         width: 120,
//       },
//       {
//         title: 'Actions',
//         key: 'actions',
//         render: (_: any, record: any) => (
//           <Button
//             type="link"
//             danger
//             onClick={() => setSelectedProducts(prev => prev.filter(p => p.key !== record.key))}
//           >
//             Remove
//           </Button>
//         ),
//         width: 100,
//       },
//     ];

//     const handleQuantityChange = (key: string, value: string) => {
//       const numValue = parseInt(value) || 0;
//       setSelectedProducts(prev =>
//         prev.map(product => {
//           if (product.key === key) {
//             const productData = products.find(p => p.id === product.id);
//             const availableStock = productData?.stock[selectedShowroom || ''] || 0;
//             if (numValue > availableStock) {
//               message.error(`Quantity cannot exceed available stock: ${availableStock} ${product.unit}`);
//               return product;
//             }
//             return {
//               ...product,
//               quantity: numValue,
//               totalAmount: calculateTotal(product, numValue),
//             };
//           }
//           return product;
//         })
//       );
//     };

//     const handleAddProduct = (productId: string) => {
//       const product = products.find(p => p.id === productId);
//       if (!product) return;
//       if (!selectedShowroom) {
//         message.error('Please select a showroom first');
//         return;
//       }
//       if (selectedProducts.some(p => p.id === product.id)) {
//         message.warning('Product already added!');
//         return;
//       }
//       const availableStock = product.stock[selectedShowroom] || 0;
//       if (availableStock <= 0) {
//         message.error('No stock available for this product in the selected showroom');
//         return;
//       }
//       const newProduct = {
//         key: `${product.id}-${Date.now()}`,
//         id: product.id,
//         productName: product.name,
//         createdAt: product.createdAt,
//         store: showrooms.find(s => s.id === selectedShowroom)?.name || 'N/A',
//         companyName: product.companyName || 'AgriCorp',
//         category: product.category,
//         type: product.type || 'Standard',
//         subtype: product.subtype || 'Basic',
//         unit: product.unit,
//         inwardPrice: product.inwardPrice || product.price * 0.8,
//         salePrice: product.price,
//         gst: product.gst,
//         discount: product.discount || 0,
//         discountType: 'percent',
//         quantity: 1,
//         totalAmount: calculateTotal(
//           {
//             salePrice: product.price,
//             gst: product.gst,
//             discount: product.discount || 0,
//             discountType: 'percent',
//           },
//           1
//         ),
//         availableStock,
//       };
//       setSelectedProducts([...selectedProducts, newProduct]);
//       setSearchQuery('');
//     };

//     const handleCustomerSelect = (customerId: string) => {
//       const customer = customers.find(c => c.id === customerId);
//       if (!customer) return;
//       setSelectedCustomerId(customer.id);
//       form.setFieldsValue({
//         customerName: customer.name,
//         contact: customer.phone,
//         village: customer.village || '',
//         taluka: customer.taluka || '',
//         district: customer.district || 'N/A',
//       });
//       setCustomerSearch('');
//     };

//     const handleCustomerSearch = (value: string) => {
//       setCustomerSearch(value);
//       if (!value) {
//         setSelectedCustomerId(null);
//         setCustomerBalance({ totalPaid: 0, totalUnpaid: 0 });
//         form.resetFields(['customerName', 'contact', 'village', 'taluka', 'district', 'previousUnpaid']);
//       }
//     };

//     const handleFinish = (values: any) => {
//       if (!hasPermission('manage_orders')) {
//         message.error('You do not have permission to create bills');
//         return;
//       }
//       if (!selectedShowroom) {
//         message.error('Please select a showroom');
//         return;
//       }
//       if (selectedProducts.length === 0) {
//         message.error('Please add at least one product');
//         return;
//       }
//       if (!selectedCustomerId) {
//         const newCustomer = addCustomer({
//           name: values.customerName,
//           phone: values.contact,
//           address: `${values.village || ''}, ${values.taluka || ''}, ${values.district || ''}`,
//           village: values.village,
//           taluka: values.taluka,
//           district: values.district,
//         });
//         values.customerId = newCustomer.id;
//       }

//       const { total } = calculateOrderTotal(selectedProducts.map(p => ({
//         productId: p.id,
//         productName: p.productName,
//         quantity: p.quantity,
//         unit: p.unit,
//         price: p.salePrice,
//         gst: p.gst,
//         discount: p.discount,
//         discountType: p.discountType,
//         totalAmount: p.totalAmount,
//       })));
//       const includePreviousUnpaid = values.includePreviousUnpaid;
//       const previousUnpaid = includePreviousUnpaid ? customerBalance.totalUnpaid : 0;
//       const totalWithPrevious = total + previousUnpaid;
//       const paidAmount = parseFloat(values.paidAmount) || 0;
//       if (paidAmount < 0) {
//         message.error('Paid amount cannot be negative');
//         return;
//       }
//       if (paidAmount > totalWithPrevious) {
//         message.error('Paid amount cannot exceed total');
//         return;
//       }
//     const unpaidAmount = totalWithPrevious - paidAmount;

//       const billData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'> = {
//         customerId: selectedCustomerId || values.customerId,
//         customerName: values.customerName,
//         customerPhone: values.contact,
//         customerAddress: `${values.village || ''}, ${values.taluka || ''}, ${values.district || ''}`,
//         village: values.village,
//         taluka: values.taluka,
//         district: values.district,
//         items: selectedProducts.map(p => ({
//           productId: p.id,
//           productName: p.productName,
//           quantity: p.quantity,
//           unit: p.unit,
//           price: p.salePrice,
//           gst: p.gst,
//           discount: p.discount,
//           discountType: p.discountType,
//           totalAmount: p.totalAmount,
//         })),
//         subtotal: calculateOrderTotal(selectedProducts).subtotal,
//         totalGst: calculateOrderTotal(selectedProducts).totalGst,
//         total: totalWithPrevious,
//         paidAmount,
//         unpaidAmount,
//         status: paidAmount === totalWithPrevious ? 'Paid' : 'Pending',
//         showroomId: selectedShowroom,
//       };

//       try {
//         createBill(billData);
//         message.success('Bill created successfully');
//         navigate('/bill/history');
//       } catch (error) {
//         message.error('Failed to create bill');
//       }
//     };

//     const handlePrint = () => {
//       const { total } = calculateOrderTotal(selectedProducts);
//       const includePreviousUnpaid = form.getFieldValue('includePreviousUnpaid');
//       const totalWithPrevious = total + (includePreviousUnpaid ? customerBalance.totalUnpaid : 0);
//       const paidAmount = parseFloat(form.getFieldValue('paidAmount') || 0);
//       const billContent = `
//         <html>
//           <head><style>body { font-family: Arial; } table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ddd; padding: 8px; } .header { text-align: center; }</style></head>
//           <body>
//             <h2 class="header">AgriCorp Bill</h2>
//             <p>Customer: ${form.getFieldValue('customerName') || 'N/A'}</p>
//             <p>Contact: ${form.getFieldValue('contact') || 'N/A'}</p>
//             <p>Address: ${form.getFieldValue('village') || ''}, ${form.getFieldValue('taluka') || ''}, ${form.getFieldValue('district') || ''}</p>
//             <p>Showroom: ${showrooms.find(s => s.id === selectedShowroom)?.name || 'N/A'}</p>
//             <p>Previous Balance: Paid ₹${customerBalance.totalPaid.toFixed(2)} | Unpaid ₹${customerBalance.totalUnpaid.toFixed(2)}</p>
//             <table>
//               <tr><th>Product</th><th>Qty</th><th>Price</th><th>Discount</th><th>GST</th><th>Total</th></tr>
//               ${selectedProducts.map(p => `
//                 <tr>
//                   <td>${p.productName} (${p.companyName})</td>
//                   <td>${p.quantity} ${p.unit}</td>
//                   <td>₹${p.salePrice.toFixed(2)}</td>
//                   <td>${p.discount}${p.discountType === 'amount' ? '₹' : '%'}</td>
//                   <td>${p.gst}%</td>
//                   <td>₹${p.totalAmount.toFixed(2)}</td>
//                 </tr>
//               `).join('')}
//             </table>
//             ${includePreviousUnpaid ? `<p>Previous Unpaid Amount: ₹${customerBalance.totalUnpaid.toFixed(2)}</p>` : ''}
//             <p>Total: ₹${totalWithPrevious.toFixed(2)}</p>
//             <p>Paid: ₹${paidAmount.toFixed(2)}</p>
//             <p>Unpaid: ₹${(totalWithPrevious - paidAmount).toFixed(2)}</p>
//           </body>
//         </html>
//       `;
//       const printWindow = window.open('', '', 'height=600,width=800');
//       printWindow?.document.write(billContent);
//       printWindow?.document.close();
//       printWindow?.print();
//       printWindow?.close();
//     };

//     const handleDownloadBillPdf = async (order: Order) => {
//       try {
//         const companyInfo = {
//           companyName: 'AgriCorp Showroom',
//           address: '123 Village Street, District X',
//           gstNumber: '27ABCDE1234F2Z5',
//         };
//         const transformedOrder = {
//           ...order,
//           items: order.items.map(item => ({
//             productId: item.productId,
//             name: item.productName,
//             quantity: item.quantity,
//             unitPrice: item.price,
//             gst: item.gst,
//             discount: item.discount,
//             discountType: item.discountType,
//             total: calculateTotal(
//               {
//                 salePrice: item.price,
//                 gst: item.gst,
//                 discount: item.discount || 0,
//                 discountType: item.discountType || 'percent',
//               },
//               item.quantity
//             ),
//           })),
//         };
//         await generateOrderPDF(transformedOrder, companyInfo);
//       } catch (err) {
//         console.error('Failed to generate PDF:', err);
//         message.error('Failed to generate invoice PDF');
//       }
//     };

//     return (
//       <div className="p-4 md:p-6 bg-white shadow rounded-lg">
//         <h2 className="text-xl font-semibold mb-4">Create Bill / Sale</h2>

//         <Form form={form} onFinish={handleFinish} layout="vertical">
//           <Row gutter={[16, 16]}>
//             <Col xs={24} sm={12} md={8}>
//               <Form.Item
//                 name="customerName"
//                 label="Customer Name"
//                 rules={[{ required: true, message: 'Please input or select a customer!' }]}
//               >
//                 <AutoComplete
//                   value={customerSearch}
//                   onChange={handleCustomerSearch}
//                   onSelect={handleCustomerSelect}
//                   placeholder="Search by name or phone"
//                   style={{ width: '100%' }}
//                   options={filteredCustomers.map(customer => ({
//                     value: customer.id,
//                     label: (
//                       <div className="flex justify-between">
//                         <span>{customer.name} ({customer.phone})</span>
//                         <span>{customer.village || 'N/A'}</span>
//                       </div>
//                     ),
//                   }))}
//                   filterOption={false}
//                 />
//               </Form.Item>
//             </Col>
//             <Col xs={24} sm={12} md={8}>
//               <Form.Item name="contact" label="Contact" rules={[{ required: true, message: 'Please enter contact' }]}>
//                 <Input />
//               </Form.Item>
//             </Col>
//             <Col xs={24} sm={12} md={8}>
//               <Form.Item name="showroom" label="Showroom" rules={[{ required: true, message: 'Please select a showroom' }]}>
//                 <Select value={selectedShowroom} onChange={setSelectedShowroom}>
//                   {showrooms.map(showroom => (
//                     <Option key={showroom.id} value={showroom.id}>
//                       {showroom.name}
//                     </Option>
//                   ))}
//                 </Select>
//               </Form.Item>
//             </Col>
//           </Row>

//           <Row gutter={[16, 16]}>
//             <Col xs={24} sm={12} md={8}>
//               <Form.Item name="village" label="Village">
//                 <Input />
//               </Form.Item>
//             </Col>
//             <Col xs={24} sm={12} md={8}>
//               <Form.Item name="taluka" label="Taluka">
//                 <Input />
//               </Form.Item>
//             </Col>
//             <Col xs={24} sm={12} md={8}>
//               <Form.Item name="district" label="District">
//                 <Input />
//               </Form.Item>
//             </Col>
//           </Row>

//           <Row gutter={[16, 16]}>
//             <Col span={24}>
//               <Form.Item label="Search and Add Product">
//                 <AutoComplete
//                   value={searchQuery}
//                   onChange={setSearchQuery}
//                   onSelect={handleAddProduct}
//                   placeholder="Search by name, category, or description"
//                   style={{ width: '100%' }}
//                   options={filteredProducts.map(product => ({
//                     value: product.id,
//                     label: (
//                       <div className="flex justify-between">
//                         <span>{product.name} ({product.category})</span>
//                         <span>Stock: {product.stock[selectedShowroom || ''] || 0} {product.companyName} </span>
//                       </div>
//                     ),
//                   }))}
//                   filterOption={false}
//                 />
//               </Form.Item>
//             </Col>
//           </Row>

//           {selectedCustomerId && (
//             <div className="mb-4">
//               <Button type="default" onClick={() => setIsBillModalOpen(true)}>
//                 Show Previous Bills
//               </Button>
//             </div>
//           )}

//           <div style={{ overflowX: 'auto', marginBottom: 16 }}>
//             <Table
//               columns={columns}
//               dataSource={selectedProducts}
//               scroll={{ x: 1800 }}
//               pagination={false}
//               rowKey="key"
//             />
//           </div>

//           <Row gutter={[16, 16]}>
//             <Col xs={24} sm={12} md={8}>
//               <Form.Item
//                 name="paidAmount"
//                 label="Amount Paying Now"
//                   extra="Enter how much customer is paying right now. Remaining will be marked as unpaid."
//                 rules={[{ required: true, message: 'Please enter paid amount' }]}
//               >
//                 <Input
//                   type="number"
//                   min={0}
//                   onChange={(e) => {
//                     const paid = parseFloat(e.target.value) || 0;
//                     const { total } = calculateOrderTotal(selectedProducts.map(p => ({
//                       productId: p.id,
//                       productName: p.productName,
//                       quantity: p.quantity,
//                       unit: p.unit,
//                       price: p.salePrice,
//                       gst: p.gst,
//                       discount: p.discount,
//                       discountType: p.discountType,
//                       totalAmount: p.totalAmount,
//                     })));
//                     const includePreviousUnpaid = form.getFieldValue('includePreviousUnpaid');
//                     const previousUnpaid = includePreviousUnpaid ? customerBalance.totalUnpaid : 0;
//                     const totalWithPrevious = total + previousUnpaid;
//                     if (paid > totalWithPrevious) {
//                       message.warning('Paid amount cannot exceed total');
//                       form.setFieldsValue({ paidAmount: totalWithPrevious });
//                       return;
//                     }
//                     form.setFieldsValue({ unpaidAmount: (totalWithPrevious - paid).toFixed(2) });
//                   }}
//                 />
//               </Form.Item>
//             </Col>
//             <Col xs={24} sm={12} md={8}>
//               <Form.Item name="unpaidAmount" label="Unpaid Amount">
//                               <Input style={{background:"#fff",color:"#000"}} disabled />
//               </Form.Item>
//             </Col>
//             <Col xs={24} sm={12} md={8}>
//               <Form.Item name="total" label="Total">
//                 <Input style={{background:"#fff",color:"#000"}} disabled />
//               </Form.Item>
//             </Col>
//             {/* <Col xs={24} sm={12} md={8}>
//               <Form.Item name="previousUnpaid" label="Previous Unpaid Amount">
//                 <Input disabled value={customerBalance.totalUnpaid.toFixed(2)} />
//               </Form.Item>
//             </Col> */}
//             <Col xs={24} sm={12} md={8}>
//               <Form.Item name="includePreviousUnpaid" valuePropName="checked">
//                 <Checkbox
//                   onChange={() => {
//                     const { total } = calculateOrderTotal(selectedProducts.map(p => ({
//                       productId: p.id,
//                       productName: p.productName,
//                       quantity: p.quantity,
//                       unit: p.unit,
//                       price: p.salePrice,
//                       gst: p.gst,
//                       discount: p.discount,
//                       discountType: p.discountType,
//                       totalAmount: p.totalAmount,
//                     })));
//                     const includePreviousUnpaid = form.getFieldValue('includePreviousUnpaid');
//                     const previousUnpaid = includePreviousUnpaid ? customerBalance.totalUnpaid : 0;
//                     const paidAmount = parseFloat(form.getFieldValue('paidAmount')) || 0;
//                     form.setFieldsValue({
//                       total: (total + previousUnpaid).toFixed(2),
//                       unpaidAmount: (total + previousUnpaid - paidAmount).toFixed(2),
//                     });
//                   }}
//                 >
//                   Include Previous Unpaid Amount
//                 </Checkbox>
//               </Form.Item>
//             </Col>
//           </Row>

//           <div className="flex flex-wrap gap-4 mt-4 justify-center">
//             <Button
//               type="primary"
//               htmlType="submit"
//               disabled={!hasPermission('manage_orders')}
//             >
//               Save Bill
//             </Button>
//             <Button
//               type="primary"
//               onClick={handlePrint}
//               style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
//               disabled={selectedProducts.length === 0}
//             >
//               Print Bill
//             </Button>
//           </div>
//         </Form>

//         <Modal
//           title={`Previous Bills - ${form.getFieldValue('customerName') || ''}`}
//           visible={isBillModalOpen}
//           onCancel={() => setIsBillModalOpen(false)}
//           footer={null}
//           width={800}
//         >
//           <div style={{ overflowX: 'auto' }}>
//             <Table
//               dataSource={previousBills}
//               rowKey="id"
//               scroll={{x:1500}}
//               pagination={{ pageSize: 5 }}
//               columns={[
//                 {
//                   title: 'Date',
//                   dataIndex: 'createdAt',
//                   key: 'createdAt',
//                   align: 'center',
//                   render: (date: string) => new Date(date).toLocaleDateString(),
//                 },
//                 {
//                   title: 'Total',
//                   dataIndex: 'total',
//                   key: 'total',
//                   align: 'center',
//                   render: (amount: number) => `₹${amount.toFixed(2)}`,
//                 },
//                 {
//                   title: 'Paid',
//                   dataIndex: 'paidAmount',
//                   key: 'paidAmount',
//                   align: 'center',
//                   render: (amount: number) => `₹${amount.toFixed(2)}`,
//                 },
//                 {
//                   title: 'Unpaid',
//                   dataIndex: 'unpaidAmount',
//                   key: 'unpaidAmount',
//                   align: 'center',
//                   render: (amount: number) => `₹${amount.toFixed(2)}`,
//                 },
//                 {
//                   title: 'Status',
//                   dataIndex: 'status',
//                   key: 'status',
//                   align: 'center',
//                   render: (status: string) => (
//                     <span style={{ color: status === 'Pending' ? 'orange' : 'green' }}>{status}</span>
//                   ),
//                 },
//                 {
//                   title: 'Actions',
//                   key: 'actions',
//                   align: 'center',
//                   render: (_: any, record: Order) => (
//                     <Button
//                       icon={<DownloadOutlined />}
//                       type="link"
//                       onClick={() => handleDownloadBillPdf(record)}
//                     />
//                   ),
//                 },
//               ]}
//             />
//           </div>
//         </Modal>
//       </div>
//     );
//   };

//   export default CreateBill;
 
// // import { Form, Input, Button, Table, Row, Col, message, AutoComplete, Select, Modal } from 'antd';
// // import { Order, useData } from '../context/DataContext';
// // import { useAuth } from '../context/AuthContext';
// // import { useNavigate } from 'react-router-dom';
// // import { generateOrderPDF } from '@/utils/pdfGenerator';
// // import { DownloadOutlined } from '@ant-design/icons';

// // const { Option } = Select;

// // const CreateBill: React.FC = () => {
// //   const { customers, addCustomer, getCustomerBalance, products, showrooms, createBill, calculateOrderTotal } = useData();
// //   const { hasPermission } = useAuth();
// //   const navigate = useNavigate();

// //   const [form] = Form.useForm();
// //   const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
// //   const [searchQuery, setSearchQuery] = useState('');
// //   const [customerSearch, setCustomerSearch] = useState('');
// //   const [selectedShowroom, setSelectedShowroom] = useState<string | undefined>(showrooms[0]?.id);
// //   const [customerBalance, setCustomerBalance] = useState({ totalPaid: 0, totalUnpaid: 0 });
// //   const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
// //   const [isBillModalOpen, setIsBillModalOpen] = useState(false);

// //   const { orders } = useData();
// //   const previousBills = orders.filter(order => order.customerId === selectedCustomerId);

// //   useEffect(() => {
// //     if (selectedCustomerId) {
// //       const balance = getCustomerBalance(selectedCustomerId);
// //       setCustomerBalance(balance);
// //     } else {
// //       setCustomerBalance({ totalPaid: 0, totalUnpaid: 0 });
// //     }
// //   }, [selectedCustomerId, getCustomerBalance]);

// //   const filteredProducts = products.filter(product =>
// //     product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
// //     product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
// //     product.description?.toLowerCase().includes(searchQuery.toLowerCase())
// //   );

// //   const filteredCustomers = customers.filter(customer =>
// //     customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
// //     customer.phone.includes(customerSearch)
// //   );

// //   const handleGstChange = (key: string, value: number) => {
// //     setSelectedProducts(prev =>
// //       prev.map(product =>
// //         product.key === key
// //           ? { ...product, gst: value, totalAmount: calculateTotal(product, product.quantity) }
// //           : product
// //       )
// //     );
// //   };

// //   const handleDiscountChange = (key: string, value: number) => {
// //     setSelectedProducts(prev =>
// //       prev.map(product =>
// //         product.key === key
// //           ? { ...product, discount: value, totalAmount: calculateTotal(product, product.quantity) }
// //           : product
// //       )
// //     );
// //   };

// //   const handleDiscountTypeChange = (key: string, type: 'percent' | 'amount') => {
// //     setSelectedProducts(prev =>
// //       prev.map(product =>
// //         product.key === key
// //           ? { ...product, discountType: type, totalAmount: calculateTotal(product, product.quantity) }
// //           : product
// //       )
// //     );
// //   };

// //   const calculateTotal = (product: any, qty: number) => {
// //     let discountAmount = 0;
// //     const discount = product.discount || 0;
// //     if (product.discountType === 'amount') {
// //       discountAmount = discount;
// //     } else {
// //       discountAmount = (product.salePrice * discount) / 100;
// //     }
// //     const priceAfterDiscount = product.salePrice - discountAmount;
// //     const gstAmount = (priceAfterDiscount * (product.gst || 0) * qty) / 100;
// //     return (priceAfterDiscount * qty) + gstAmount;
// //   };

// //   const columns = [
// //     { title: 'Inward Date', dataIndex: 'createdAt', key: 'createdAt', width: 120 },
// //     {
// //       title: 'Store',
// //       dataIndex: 'store',
// //       key: 'store',
// //       render: () => showrooms.find(s => s.id === selectedShowroom)?.name || 'N/A',
// //       width: 100,
// //     },
// //     { title: 'Company Name', dataIndex: 'companyName', key: 'companyName', width: 120 },
// //     { title: 'Category', dataIndex: 'category', key: 'category', width: 100 },
// //     { title: 'Type', dataIndex: 'type', key: 'type', width: 100 },
// //     { title: 'Subtype', dataIndex: 'subtype', key: 'subtype', width: 100 },
// //     { title: 'Unit', dataIndex: 'unit', key: 'unit', width: 80 },
// //     {
// //       title: 'Inward Price',
// //       dataIndex: 'inwardPrice',
// //       key: 'inwardPrice',
// //       render: (price: number) => `₹${price.toFixed(2)}`,
// //       width: 100,
// //     },
// //     {
// //       title: 'Sale Price',
// //       dataIndex: 'salePrice',
// //       key: 'salePrice',
// //       render: (price: number) => `₹${price.toFixed(2)}`,
// //       width: 100,
// //     },
// //     {
// //       title: 'GST (%)',
// //       dataIndex: 'gst',
// //       key: 'gst',
// //       width: 300,
// //       render: (gst: number, record: any) => (
// //         <Input
// //           type="number"
// //           min={0}
// //           max={100}
// //           value={gst}
// //           onChange={(e) => handleGstChange(record.key, parseFloat(e.target.value) || 0)}
// //           addonAfter="%"
// //         />
// //       ),
// //     },
// //     {
// //       title: 'Discount',
// //       dataIndex: 'discount',
// //       key: 'discount',
// //       width: 200,
// //       render: (_: any, record: any) => (
// //         <Input
// //           type="number"
// //           min={0}
// //           value={record.discount}
// //           onChange={(e) => handleDiscountChange(record.key, parseFloat(e.target.value) || 0)}
// //           addonAfter={
// //             <Select
// //               value={record.discountType || 'percent'}
              
// //               onChange={(val) => handleDiscountTypeChange(record.key, val)}
// //             >
// //               <Option value="percent">%</Option>
// //               <Option value="amount">₹</Option>
// //             </Select>
// //           }
// //         />
// //       ),
// //     },
// //     {
// //       title: 'Qty',
// //       dataIndex: 'quantity',
// //       key: 'quantity',
// //       render: (text: number, record: any) => (
// //         <Input
// //           type="number"
// //           min={0}
// //           max={record.availableStock}
// //           value={text}
// //           onChange={(e) => handleQuantityChange(record.key, e.target.value)}
// //           style={{ width: '80px' }}
// //         />
// //       ),
// //       width: 100,
// //     },
// //     {
// //       title: 'Total Amount',
// //       dataIndex: 'totalAmount',
// //       key: 'totalAmount',
// //       render: (text: number) => `₹${text.toFixed(2)}`,
// //       width: 120,
// //     },
// //     {
// //       title: 'Available Stock',
// //       dataIndex: 'availableStock',
// //       key: 'availableStock',
// //       render: (stock: number, record: any) => `${stock} ${record.unit}`,
// //       width: 120,
// //     },
// //     {
// //       title: 'Actions',
// //       key: 'actions',
// //       render: (_: any, record: any) => (
// //         <Button
// //           type="link"
// //           danger
// //           onClick={() => setSelectedProducts(prev => prev.filter(p => p.key !== record.key))}
// //         >
// //           Remove
// //         </Button>
// //       ),
// //       width: 100,
// //     },
// //   ];

// //   const handleQuantityChange = (key: string, value: string) => {
// //     const numValue = parseInt(value) || 0;
// //     setSelectedProducts(prev =>
// //       prev.map(product => {
// //         if (product.key === key) {
// //           const productData = products.find(p => p.id === product.id);
// //           const availableStock = productData?.stock[selectedShowroom || ''] || 0;
// //           if (numValue > availableStock) {
// //             message.error(`Quantity cannot exceed available stock: ${availableStock} ${product.unit}`);
// //             return product;
// //           }
// //           return {
// //             ...product,
// //             quantity: numValue,
// //             totalAmount: calculateTotal(product, numValue),
// //           };
// //         }
// //         return product;
// //       })
// //     );
// //   };

// //   const handleAddProduct = (productId: string) => {
// //     const product = products.find(p => p.id === productId);
// //     if (!product) return;
// //     if (!selectedShowroom) {
// //       message.error('Please select a showroom first');
// //       return;
// //     }
// //     if (selectedProducts.some(p => p.id === product.id)) {
// //       message.warning('Product already added!');
// //       return;
// //     }
// //     const availableStock = product.stock[selectedShowroom] || 0;
// //     if (availableStock <= 0) {
// //       message.error('No stock available for this product in the selected showroom');
// //       return;
// //     }
// //     const newProduct = {
// //       key: `${product.id}-${Date.now()}`,
// //       id: product.id,
// //       productName: product.name,
// //       createdAt: product.createdAt,
// //       store: showrooms.find(s => s.id === selectedShowroom)?.name || 'N/A',
// //       companyName: product.companyName || 'AgriCorp',
// //       category: product.category,
// //       type: product.type || 'Standard',
// //       subtype: product.subtype || 'Basic',
// //       unit: product.unit,
// //       inwardPrice: product.inwardPrice || product.price * 0.8,
// //       salePrice: product.price,
// //       gst: product.gst,
// //       discount: product.discount || 0,
// //       discountType: 'percent',
// //       quantity: 1,
// //       totalAmount: calculateTotal(
// //         {
// //           salePrice: product.price,
// //           gst: product.gst,
// //           discount: product.discount || 0,
// //           discountType: 'percent',
// //         },
// //         1
// //       ),
// //       availableStock,
// //     };
// //     setSelectedProducts([...selectedProducts, newProduct]);
// //     setSearchQuery('');
// //   };

// //   const handleCustomerSelect = (customerId: string) => {
// //     const customer = customers.find(c => c.id === customerId);
// //     if (!customer) return;
// //     setSelectedCustomerId(customer.id);
// //     form.setFieldsValue({
// //       name: customer.name,
// //       contact: customer.phone,
// //       village: customer.village || '',
// //       taluka: customer.taluka || '',
// //       district: customer.district || 'N/A',
// //     });
// //     setCustomerSearch('');
// //   };

// //   const handleCustomerSearch = (value: string) => {
// //     setCustomerSearch(value);
// //     if (!value) {
// //       setSelectedCustomerId(null);
// //       setCustomerBalance({ totalPaid: 0, totalUnpaid: 0 });
// //       form.resetFields(['customerName', 'contact', 'village', 'taluka', 'district']);
// //     }
// //   };

// //   const handleFinish = (values: any) => {
// //     if (!hasPermission('manage_orders')) {
// //       message.error('You do not have permission to create bills');
// //       return;
// //     }
// //     if (!selectedShowroom) {
// //       message.error('Please select a showroom');
// //       return;
// //     }
// //     if (selectedProducts.length === 0) {
// //       message.error('Please add at least one product');
// //       return;
// //     }
// //     if (!selectedCustomerId) {
// //       const newCustomer = addCustomer({
// //         name: values.customerName,
// //         phone: values.contact,
// //         address: `${values.village || ''}, ${values.taluka || ''}, ${values.district || ''}`,
// //         village: values.village,
// //         taluka: values.taluka,
// //         district: values.district,
// //       });
// //       values.customerId = newCustomer.id;
// //     }

// //     const { total } = calculateOrderTotal(selectedProducts.map(p => ({
// //       productId: p.id,
// //       productName: p.productName,
// //       quantity: p.quantity,
// //       unit: p.unit,
// //       price: p.salePrice,
// //       gst: p.gst,
// //       discount: p.discount,
// //       discountType: p.discountType,
// //       totalAmount: p.totalAmount,
// //     })));
// //     const paidAmount = parseFloat(values.paidAmount) || 0;
// //     if (paidAmount < 0) {
// //       message.error('Paid amount cannot be negative');
// //       return;
// //     }
// //     if (paidAmount > total) {
// //       message.error('Paid amount cannot exceed total');
// //       return;
// //     }

// //     const billData = {
// //       customerId: selectedCustomerId || values.customerId,
// //       customerName: values.customerName,
// //       customerPhone: values.contact,
// //       customerAddress: `${values.village || ''}, ${values.taluka || ''}, ${values.district || ''}`,
// //       village: values.village,
// //       taluka: values.taluka,
// //       district: values.district,
// //       items: selectedProducts.map(p => ({
// //         productId: p.id,
// //         productName: p.productName,
// //         quantity: p.quantity,
// //         unit: p.unit,
// //         price: p.salePrice,
// //         gst: p.gst,
// //         discount: p.discount,
// //         discountType: p.discountType,
// //         totalAmount: p.totalAmount,
// //       })),
// //       subtotal: calculateOrderTotal(selectedProducts).subtotal,
// //       totalGst: calculateOrderTotal(selectedProducts).totalGst,
// //       total: calculateOrderTotal(selectedProducts).total,
// //       paidAmount,
// //       unpaidAmount: total - paidAmount,
// //       status: paidAmount === total ? 'Paid' : 'Pending',
// //       showroomId: selectedShowroom,
// //     };

// //     try {
// //       createBill(billData);
// //       message.success('Bill created successfully');
// //       navigate('/bill/history');
// //     } catch (error) {
// //       message.error('Failed to create bill');
// //     }
// //   };

// //   const handlePrint = () => {
// //     const { total } = calculateOrderTotal(selectedProducts);
// //     const paidAmount = parseFloat(form.getFieldValue('paidAmount') || 0);
// //     const billContent = `
// //       <html>
// //         <head><style>body { font-family: Arial; } table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ddd; padding: 8px; } .header { text-align: center; }</style></head>
// //         <body>
// //           <h2 class="header">AgriCorp Bill</h2>
// //           <p>Customer: ${form.getFieldValue('customerName') || 'N/A'}</p>
// //           <p>Contact: ${form.getFieldValue('contact') || 'N/A'}</p>
// //           <p>Address: ${form.getFieldValue('village') || ''}, ${form.getFieldValue('taluka') || ''}, ${form.getFieldValue('district') || ''}</p>
// //           <p>Showroom: ${showrooms.find(s => s.id === selectedShowroom)?.name || 'N/A'}</p>
// //           <p>Previous Balance: Paid ₹${customerBalance.totalPaid.toFixed(2)} | Unpaid ₹${customerBalance.totalUnpaid.toFixed(2)}</p>
// //           <table>
// //             <tr><th>Product</th><th>Qty</th><th>Price</th><th>Discount</th><th>GST</th><th>Total</th></tr>
// //             ${selectedProducts.map(p => `
// //               <tr>
// //                 <td>${p.productName} (${p.companyName})</td>
// //                 <td>${p.quantity} ${p.unit}</td>
// //                 <td>₹${p.salePrice.toFixed(2)}</td>
// //                 <td>${p.discount}${p.discountType === 'amount' ? '₹' : '%'}</td>
// //                 <td>${p.gst}%</td>
// //                 <td>₹${p.totalAmount.toFixed(2)}</td>
// //               </tr>
// //             `).join('')}
// //           </table>
// //           <p>Total: ₹${total.toFixed(2)}</p>
// //           <p>Paid: ₹${paidAmount.toFixed(2)}</p>
// //           <p>Unpaid: ₹${(total - paidAmount).toFixed(2)}</p>
// //         </body>
// //       </html>
// //     `;
// //     const printWindow = window.open('', '', 'height=600,width=800');
// //     printWindow?.document.write(billContent);
// //     printWindow?.document.close();
// //     printWindow?.print();
// //     printWindow?.close();
// //   };

// //   const handleDownloadBillPdf = async (order: Order) => {
// //     try {
// //       const companyInfo = {
// //         companyName: 'AgriCorp Showroom',
// //         address: '123 Village Street, District X',
// //         gstNumber: '27ABCDE1234F2Z5',
// //       };
// //       const transformedOrder = {
// //         ...order,
// //         items: order.items.map(item => ({
// //           productId: item.productId,
// //           name: item.productName,
// //           quantity: item.quantity,
// //           unitPrice: item.price,
// //           gst: item.gst,
// //           discount: item.discount,
// //           discountType: item.discountType,
// //           total: calculateTotal(
// //             {
// //               salePrice: item.price,
// //               gst: item.gst,
// //               discount: item.discount || 0,
// //               discountType: item.discountType || 'percent',
// //             },
// //             item.quantity
// //           ),
// //         })),
// //       };
// //       await generateOrderPDF(transformedOrder, companyInfo);
// //     } catch (err) {
// //       console.error('Failed to generate PDF:', err);
// //       message.error('Failed to generate invoice PDF');
// //     }
// //   };

// //   return (
// //     <div className="p-4 md:p-6 bg-white shadow rounded-lg">
// //       <h2 className="text-xl font-semibold mb-4">Create Bill / Sale</h2>

// //       <Form form={form} onFinish={handleFinish} layout="vertical">
// //         <Row gutter={[16, 16]}>
// //           <Col xs={24} sm={12} md={8}>
// //             <Form.Item
// //               name="customerName"
// //               label="Customer Name"
// //               rules={[{ required: true, message: 'Please input or select a customer!' }]}
// //             >
// //               <AutoComplete
// //                 value={customerSearch}
// //                 onChange={handleCustomerSearch}
// //                 onSelect={handleCustomerSelect}
// //                 placeholder="Search by name or phone"
// //                 style={{ width: '100%' }}
// //                 options={filteredCustomers.map(customer => ({
// //                   value: customer.id,
// //                   label: (
// //                     <div className="flex justify-between">
// //                       <span>{customer.name} ({customer.phone})</span>
// //                       <span>{customer.village || 'N/A'}</span>
// //                     </div>
// //                   ),
// //                 }))}
// //                 filterOption={false}
// //               />
// //             </Form.Item>
// //           </Col>
// //           <Col xs={24} sm={12} md={8}>
// //             <Form.Item name="contact" label="Contact" rules={[{ required: true, message: 'Please enter contact' }]}>
// //               <Input />
// //             </Form.Item>
// //           </Col>
// //           <Col xs={24} sm={12} md={8}>
// //             <Form.Item name="showroom" label="Showroom" rules={[{ required: true, message: 'Please select a showroom' }]}>
// //               <Select value={selectedShowroom} onChange={setSelectedShowroom}>
// //                 {showrooms.map(showroom => (
// //                   <Option key={showroom.id} value={showroom.id}>
// //                     {showroom.name}
// //                   </Option>
// //                 ))}
// //               </Select>
// //             </Form.Item>
// //           </Col>
// //         </Row>

// //         <Row gutter={[16, 16]}>
// //           <Col xs={24} sm={12} md={8}>
// //             <Form.Item name="village" label="Village">
// //               <Input />
// //             </Form.Item>
// //           </Col>
// //           <Col xs={24} sm={12} md={8}>
// //             <Form.Item name="taluka" label="Taluka">
// //               <Input />
// //             </Form.Item>
// //           </Col>
// //           <Col xs={24} sm={12} md={8}>
// //             <Form.Item name="district" label="District">
// //               <Input />
// //             </Form.Item>
// //           </Col>
// //         </Row>

// //         <Row gutter={[16, 16]}>
// //           <Col span={24}>
// //             <Form.Item label="Search and Add Product">
// //               <AutoComplete
// //                 value={searchQuery}
// //                 onChange={setSearchQuery}
// //                 onSelect={handleAddProduct}
// //                 placeholder="Search by name, category, or description"
// //                 style={{ width: '100%' }}
// //                 options={filteredProducts.map(product => ({
// //                   value: product.id,
// //                   label: (
// //                     <div className="flex justify-between">
// //                       <span>{product.name} ({product.category})</span>
// //                       <span>Stock: {product.stock[selectedShowroom || ''] || 0} {product.unit}</span>
// //                     </div>
// //                   ),
// //                 }))}
// //                 filterOption={false}
// //               />
// //             </Form.Item>
// //           </Col>
// //         </Row>

// //         {selectedCustomerId && (
// //           <div className="mb-4">
// //             <Button type="default" onClick={() => setIsBillModalOpen(true)}>
// //               Show Previous Bills
// //             </Button>
// //           </div>
// //         )}

// //         <div style={{ overflowX: 'auto', marginBottom: 16 }}>
// //           <Table
// //             columns={columns}
// //             dataSource={selectedProducts}
// //             scroll={{ x: 1500 }}
// //             pagination={false}
// //             rowKey="key"
// //           />
// //         </div>

// //         <Row gutter={[16, 16]}>
// //           <Col xs={24} sm={12} md={8}>
// //             <Form.Item
// //               name="paidAmount"
// //               label="Paid Amount"
// //               rules={[{ required: true, message: 'Please enter paid amount' }]}
// //             >
// //               <Input
// //                 type="number"
// //                 min={0}
// //                 onChange={(e) => {
// //                   const paid = parseFloat(e.target.value) || 0;
// //                   const { total } = calculateOrderTotal(selectedProducts.map(p => ({
// //                     productId: p.id,
// //                     productName: p.productName,
// //                     quantity: p.quantity,
// //                     unit: p.unit,
// //                     price: p.salePrice,
// //                     gst: p.gst,
// //                     discount: p.discount,
// //                     discountType: p.discountType,
// //                     totalAmount: p.totalAmount,
// //                   })));
// //                   if (paid > total) {
// //                     message.warning('Paid amount cannot exceed total');
// //                     form.setFieldsValue({ paidAmount: total });
// //                   }
// //                   form.setFieldsValue({ unpaidAmount: total - paid });
// //                 }}
// //               />
// //             </Form.Item>
// //           </Col>
// //           <Col xs={24} sm={12} md={8}>
// //             <Form.Item name="unpaidAmount" label="Unpaid Amount">
// //               <Input disabled />
// //             </Form.Item>
// //           </Col>
// //           <Col xs={24} sm={12} md={8}>
// //             <Form.Item name="total" label="Total">
// //               <Input disabled value={calculateOrderTotal(selectedProducts).total.toFixed(2)} />
// //             </Form.Item>
// //           </Col>
// //           <Col xs={24} sm={24} md={12}>
// //             <Form.Item label="Customer Balance">
// //               <Input
// //                 disabled
// //                 value={`Paid: ₹${customerBalance.totalPaid.toFixed(2)} | Unpaid: ₹${customerBalance.totalUnpaid.toFixed(2)}`}
// //               />
// //             </Form.Item>
// //           </Col>
// //         </Row>

// //         <div className="flex flex-wrap gap-4 mt-4 justify-center">
// //           <Button
// //             type="primary"
// //             htmlType="submit"
// //             disabled={!hasPermission('manage_orders')}
// //           >
// //             Save Bill
// //           </Button>
// //           <Button
// //             type="primary"
// //             onClick={handlePrint}
// //             style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
// //             disabled={selectedProducts.length === 0}
// //           >
// //             Print Bill
// //           </Button>
// //         </div>
// //       </Form>

// //       <Modal
// //         title={`Previous Bills - ${form.getFieldValue('customerName') || ''}`}
// //         visible={isBillModalOpen}
// //         onCancel={() => setIsBillModalOpen(false)}
// //         footer={null}
// //         width={800}
// //       >
// //         <div style={{ overflowX: 'auto' }}>
// //           <Table
// //             dataSource={previousBills}
// //             rowKey="id"
// //             pagination={{ pageSize: 5 }}
// //             columns={[
// //               {
// //                 title: 'Date',
// //                 dataIndex: 'createdAt',
// //                 key: 'createdAt',
// //                 align: 'center',
// //                 render: (date: string) => new Date(date).toLocaleDateString(),
// //               },
// //               {
// //                 title: 'Total',
// //                 dataIndex: 'total',
// //                 key: 'total',
// //                 align: 'center',
// //                 render: (amount: number) => `₹${amount.toFixed(2)}`,
// //               },
// //               {
// //                 title: 'Paid',
// //                 dataIndex: 'paidAmount',
// //                 key: 'paidAmount',
// //                 align: 'center',
// //                 render: (amount: number) => `₹${amount.toFixed(2)}`,
// //               },
// //               {
// //                 title: 'Unpaid',
// //                 dataIndex: 'unpaidAmount',
// //                 key: 'unpaidAmount',
// //                 align: 'center',
// //                 render: (amount: number) => `₹${amount.toFixed(2)}`,
// //               },
// //               {
// //                 title: 'Status',
// //                 dataIndex: 'status',
// //                 key: 'status',
// //                 align: 'center',
// //                 render: (status: string) => (
// //                   <span style={{ color: status === 'Pending' ? 'orange' : 'green' }}>{status}</span>
// //                 ),
// //               },
// //               {
// //                 title: 'Actions',
// //                 key: 'actions',
// //                 align: 'center',
// //                 render: (_: any, record: Order) => (
// //                   <Button
// //                     icon={<DownloadOutlined />}
// //                     type="link"
// //                     onClick={() => handleDownloadBillPdf(record)}
// //                   />
// //                 ),
// //               },
// //             ]}
// //           />
// //         </div>
// //       </Modal>
// //     </div>
// //   );
// // };

// // export default CreateBill;



// // import React, { useState, useEffect } from 'react';
// // import { Form, Input, Button, Table, Row, Col, message, AutoComplete, Select, Modal } from 'antd';
// // import { Order, useData } from '../context/DataContext';
// // import { useAuth } from '../context/AuthContext';
// // import { useNavigate } from 'react-router-dom';
// // import { generateOrderPDF } from '@/utils/pdfGenerator';
// // import { DownloadOutlined, EyeOutlined } from '@ant-design/icons';

// // const { Option } = Select;

// // const CreateBill: React.FC = () => {
// //   const { customers, addCustomer, getCustomerBalance, products, showrooms, addOrder, calculateOrderTotal } = useData();
// //   const { hasPermission } = useAuth();
// //   const navigate = useNavigate();

// //   const [form] = Form.useForm();
// //   const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
// //   const [searchQuery, setSearchQuery] = useState('');
// //   const [customerSearch, setCustomerSearch] = useState('');
// //   const [selectedShowroom, setSelectedShowroom] = useState<string | undefined>(showrooms[0]?.id);
// //   const [unpaidAmount, setUnpaidAmount] = useState(0);
// //   const [customerBalance, setCustomerBalance] = useState({ totalPaid: 0, totalUnpaid: 0 });
// //   const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

// // const [selectedBill, setSelectedBill] = useState<Order | null>(null);

// //   const { orders } = useData(); // assuming you have access to all orders
// // const [isBillModalOpen, setIsBillModalOpen] = useState(false);
// // const previousBills = orders.filter(order => order.customerId === selectedCustomerId);

// //   useEffect(() => {
// //     const { total } = calculateOrderTotal(selectedProducts.map(p => ({
// //       productId: p.id,
// //       productName: p.productName,
// //       quantity: p.quantity,
// //       unit: p.unit,
// //       price: p.salePrice,
// //       gst: p.gst,
// //       discount: p.discount || 0,
// //       totalAmount: p.totalAmount
// //     })));
// //     const paid = parseFloat(form.getFieldValue('paidAmount')) || 0;
// //     setUnpaidAmount(total - paid);
// //   }, [selectedProducts, form, calculateOrderTotal]);

// //   useEffect(() => {
// //     if (selectedCustomerId) {
// //       const balance = getCustomerBalance(selectedCustomerId);
// //       setCustomerBalance(balance);
// //     } else {
// //       setCustomerBalance({ totalPaid: 0, totalUnpaid: 0 });
// //     }
// //   }, [selectedCustomerId, getCustomerBalance]);

// //   const filteredProducts = products.filter(product =>
// //     product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
// //     product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
// //     product.description?.toLowerCase().includes(searchQuery.toLowerCase())
// //   );

// //   const filteredCustomers = customers.filter(customer =>
// //     customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
// //     customer.phone.includes(customerSearch)
// //   );

// //   const handleGstChange = (key: string, value: number) => {
// //   setSelectedProducts(prev =>
// //     prev.map(product =>
// //       product.key === key
// //         ? { ...product, gst: value, totalAmount: calculateTotal(product, product.quantity, product.discount, product.discountType) }
// //         : product
// //     )
// //   );
// // };


// // const handleDiscountChange = (key: string, value: number) => {
// //   setSelectedProducts(prev =>
// //     prev.map(product =>
// //       product.key === key
// //         ? { ...product, discount: value, totalAmount: calculateTotal(product, product.quantity, value, product.discountType) }
// //         : product
// //     )
// //   );
// // };

// // const handleDiscountTypeChange = (key: string, type: 'percent' | 'amount') => {
// //   setSelectedProducts(prev =>
// //     prev.map(product =>
// //       product.key === key
// //         ? { ...product, discountType: type, totalAmount: calculateTotal(product, product.quantity, product.discount, type) }
// //         : product
// //     )
// //   );
// // };
// // const calculateTotal = (product: any, qty: number, discount = product.discount, discountType = product.discountType) => {
// //   let discountAmount = 0;

// //   if (discountType === 'percent') {
// //     discountAmount = (product.salePrice * discount) / 100;
// //   } else {
// //     discountAmount = discount;
// //   }

// //   const priceAfterDiscount = product.salePrice - discountAmount;
// //   return priceAfterDiscount * qty;
// // };


// //   const columns = [
// //     { title: 'Inward Date', dataIndex: 'createdAt', key: 'createdAt', width: 120 },
// //     { 
// //       title: 'Store', 
// //       dataIndex: 'store', 
// //       key: 'store',
// //       render: () => showrooms.find(s => s.id === selectedShowroom)?.name || 'N/A',
// //       width: 100 
// //     },
// //     { title: 'Company Name', dataIndex: 'companyName', key: 'companyName', width: 120 },
// //     { title: 'Category', dataIndex: 'category', key: 'category', width: 100 },
// //     { title: 'Type', dataIndex: 'type', key: 'type', width: 100 },
// //     { title: 'Subtype', dataIndex: 'subtype', key: 'subtype', width: 100 },
// //     { title: 'Unit', dataIndex: 'unit', key: 'unit', width: 80 },
// //     { 
// //       title: 'Inward Price', 
// //       dataIndex: 'inwardPrice', 
// //       key: 'inwardPrice', 
// //       render: (price: number) => `₹${price.toFixed(2)}`,
// //       width: 100 
// //     },
// //     { 
// //       title: 'Sale Price', 
// //       dataIndex: 'salePrice', 
// //       key: 'salePrice', 
// //       render: (price: number) => `₹${price.toFixed(2)}`,
// //       width: 100 
// //     },
// //   {
// //   title: 'GST (%)',
// //   dataIndex: 'gst',
// //   key: 'gst',
// //   width: 100,
// //   render: (gst: number, record: any) => (
// //     <Input
// //       type="number"
// //       min={0}
// //       max={100}
// //       value={gst}
// //       onChange={(e) => handleGstChange(record.key, parseFloat(e.target.value))}
// //       addonAfter="%"
// //     />
// //   )
// // },
// // {
// //   title: 'Discount',
// //   dataIndex: 'discount',
// //   key: 'discount',
// //   width: 150,
// //   render: (_: any, record: any) => (
// //     <Input
// //       type="number"
// //       min={0}
// //       value={record.discount}
// //       onChange={(e) =>
// //         handleDiscountChange(record.key, parseFloat(e.target.value))
// //       }
// //       addonAfter={
// //         <Select
// //           value={record.discountType || 'percent'}
// //           style={{ width: 70 }}
// //           onChange={(val) => handleDiscountTypeChange(record.key, val)}
// //         >
// //           <Option value="percent">%</Option>
// //           <Option value="amount">₹</Option>
// //         </Select>
// //       }
// //     />
// //   )
// // },

// //     {
// //       title: 'Qty',
// //       dataIndex: 'quantity',
// //       key: 'quantity',
// //       render: (text: number, record: any) => (
// //         <Input
// //           type="number"
// //           min={0}
// //           max={record.availableStock}
// //           value={text}
// //           onChange={(e) => handleQuantityChange(record.key, e.target.value)}
// //           style={{ width: '80px' }}
// //         />
// //       ),
// //       width: 100
// //     },
// //     {
// //       title: 'Total Amount',
// //       dataIndex: 'totalAmount',
// //       key: 'totalAmount',
// //       render: (text: number, record: any) => {
// //         const total = (record.salePrice * (1 - (record.discount || 0) / 100)) * record.quantity;
// //         return <span>₹{total.toFixed(2)}</span>;
// //       },
// //       width: 120
// //     },
// //     { 
// //       title: 'Available Stock', 
// //       dataIndex: 'availableStock', 
// //       key: 'availableStock', 
// //       render: (stock: number, record: any) => `${stock} 
      
// //       `
// //       ,
// //       width: 120 
// //     },
// //     {
// //       title: 'Actions',
// //       key: 'actions',
// //       render: (_: any, record: any) => (
// //         <Button
// //           type="link"
// //           danger
// //           onClick={() => setSelectedProducts(prev => prev.filter(p => p.key !== record.key))}
// //         >
// //           Remove
// //         </Button>
// //       ),
// //       width: 100
// //     }
// //   ];

// //   const handleQuantityChange = (key: string, value: string) => {
// //     const numValue = parseInt(value) || 0;
// //     setSelectedProducts(prev =>
// //       prev.map(product => {
// //         if (product.key === key) {
// //           const productData = products.find(p => p.id === product.id);
// //           const availableStock = productData?.stock[selectedShowroom || ''] || 0;
// //           if (numValue > availableStock) {
// //             message.error(`Quantity cannot exceed available stock: ${availableStock} ${product.unit}`);
// //             return product;
// //           }
// //           return { 
// //             ...product, 
// //             quantity: numValue, 
// //             totalAmount: calculateTotal(product, numValue) 
// //           };
// //         }
// //         return product;
// //       })
// //     );
// //   };



// //   const handleAddProduct = (productId: string) => {
// //     const product = products.find(p => p.id === productId);
// //     if (!product) return;
// //     if (!selectedShowroom) {
// //       message.error('Please select a showroom first');
// //       return;
// //     }
// //     if (selectedProducts.some(p => p.id === product.id)) {
// //       message.warning('Product already added!');
// //       return;
// //     }
// //     const availableStock = product.stock[selectedShowroom] || 0;
// //     if (availableStock <= 0) {
// //       message.error('No stock available for this product in the selected showroom');
// //       return;
// //     }
// //     const newProduct = {
// //       key: `${product.id}-${Date.now()}`,
// //       id: product.id,
// //       productName: product.name,
// //       createdAt: product.createdAt,
// //       store: showrooms.find(s => s.id === selectedShowroom)?.name || 'N/A',
// //       companyName: product.companyName || 'AgriCorp',
// //       category: product.category,
// //       type: product.type || 'Standard',
// //       subtype: product.subtype || 'Basic',
// //       unit: product.unit,
// //       inwardPrice: product.inwardPrice || product.price * 0.8,
// //       salePrice: product.price,
// //       gst: product.gst,
// //   discount: product.discount || 0,
// //   discountType: 'percent',       quantity: 1,
// //       totalAmount: product.price * (1 - (product.discount || 0) / 100),
// //       availableStock
// //     };
// //     setSelectedProducts([...selectedProducts, newProduct]);
// //     setSearchQuery('');
// //   };

// //   const handleCustomerSelect = (customerId: string) => {
// //     const customer = customers.find(c => c.id === customerId);
// //     if (!customer) return;
// //     setSelectedCustomerId(customer.id);
// //     form.setFieldsValue({
// //       customerName: customer.name,
// //       contact: customer.phone,
// //       village: customer.village || '',
// //       taluka: customer.taluka || '',
// //       district: customer.district || ''
// //     });
// //     setCustomerSearch('');
// //   };

// //   const handleCustomerSearch = (value: string) => {
// //     setCustomerSearch(value);
// //     if (!value) {
// //       setSelectedCustomerId(null);
// //       setCustomerBalance({ totalPaid: 0, totalUnpaid: 0 });
// //       form.resetFields(['customerName', 'contact', 'village', 'taluka', 'district']);
// //     }
// //   };

// //     const handleFinish = (values: any) => {
// //     if (!hasPermission('manage_orders')) {
// //       message.error('You do not have permission to create bills!');
// //       return;
// //     }
// //     if (!selectedShowroom) {
// //       message.error('Please select a showroom');
// //       return;
// //     }
// //     if (selectedProducts.length === 0) {
// //       message.error('Please add at least one product to the bill');
// //       return;
// //     }
// //     if (!selectedCustomerId) {
// //       const newCustomer = addCustomer({
// //         name: values.customerName,
// //         phone: values.contact,
// //         address: `${values.village || ''}, ${values.taluka || ''}, ${values.district || ''}`,
// //         village: values.village,
// //         taluka: values.taluka,
// //         district: values.district
// //       });
// //       values.customerId = newCustomer.id;
// //     }
// //     const orderData = {
// //       customerId: selectedCustomerId || values.customerId,
// //       customerName: values.customerName,
// //       customerPhone: values.contact,
// //       customerAddress: `${values.village || ''}, ${values.taluka || ''}, ${values.district || ''}`,
// //       village: values.village,
// //       taluka: values.taluka,
// //       district: values.district,
// //       items: selectedProducts.map(p => ({
// //         productId: p.id,
// //         productName: p.productName,
// //         quantity: p.quantity,
// //         unit: p.unit,
// //         price: p.salePrice,
// //         gst: p.gst,
// //         discount: p.discount,
// //         totalAmount: p.totalAmount
// //       })),
// //       subtotal: calculateOrderTotal(selectedProducts).subtotal,
// //       totalGst: calculateOrderTotal(selectedProducts).totalGst,
// //       total: calculateOrderTotal(selectedProducts).total,
// //       paidAmount: parseFloat(values.paidAmount) || 0,
// //       unpaidAmount,
// //       status: 'Pending' as const,
// //       showroomId: selectedShowroom
// //     };
// //     addOrder(orderData);
// //     message.success('Bill created successfully!');
// //     navigate('/bill/history');
// //   };
// // // const handleFinish = (values: any) => {
// // //   if (!hasPermission('manage_orders')) {
// // //     message.error('You do not have permission to create bills!');
// // //     return;
// // //   }
// // //   if (!selectedShowroom) {
// // //     message.error('Please select a showroom');
// // //     return;
// // //   }
// // //   if (selectedProducts.length === 0) {
// // //     message.error('Please add at least one product to the bill');
// // //     return;
// // //   }
// // //   if (!selectedCustomerId) {
// // //     const newCustomer = addCustomer({
// // //       name: values.customerName,
// // //       phone: values.contact,
// // //       address: `${values.village || ''}, ${values.taluka || ''}, ${values.district || ''}`,
// // //       village: values.village,
// // //       taluka: values.taluka,
// // //       district: values.district,
// // //     });
// // //     values.customerId = newCustomer.id;
// // //   }
// // //   const billData = {
// // //     customerId: selectedCustomerId || values.customerId,
// // //     customerName: values.customerName,
// // //     customerPhone: values.contact,
// // //     customerAddress: `${values.village || ''}, ${values.taluka || ''}, ${values.district || ''}`,
// // //     village: values.village,
// // //     taluka: values.taluka,
// // //     district: values.district,
// // //     items: selectedProducts.map(p => ({
// // //       productId: p.id,
// // //       productName: p.productName,
// // //       quantity: p.quantity,
// // //       unit: p.unit,
// // //       price: p.salePrice,
// // //       gst: p.gst,
// // //       discount: p.discount,
// // //       totalAmount: p.totalAmount,
// // //     })),
// // //     subtotal: calculateOrderTotal(selectedProducts).subtotal,
// // //     totalGst: calculateOrderTotal(selectedProducts).totalGst,
// // //     total: calculateOrderTotal(selectedProducts).total,
// // //     paidAmount: parseFloat(values.paidAmount) || 0,
// // //     unpaidAmount,
// // //     status: 'Pending' as const,
// // //     showroomId: selectedShowroom,
// // //   };
// // //   try {
// // //     CreateBill(billData);
// // //     message.success('Bill created successfully!');
// // //     navigate('/orders');
// // //   } catch (error) {
// // //     // Error message is already handled in createBill
// // //   }
// // // };

// //   const handlePrint = () => {
// //     const billContent = `
// //       <html>
// //         <head><style>body { font-family: Arial; } table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ddd; padding: 8px; } .header { text-align: center; }</style></head>
// //         <body>
// //           <h2 class="header">AgriCorp Bill</h2>
// //           <p>Customer: ${form.getFieldValue('customerName') || 'N/A'}</p>
// //           <p>Contact: ${form.getFieldValue('contact') || 'N/A'}</p>
// //           <p>Address: ${form.getFieldValue('village') || ''}, ${form.getFieldValue('taluka') || ''}, ${form.getFieldValue('district') || ''}</p>
// //           <p>Showroom: ${showrooms.find(s => s.id === selectedShowroom)?.name || 'N/A'}</p>
// //           <p>Previous Balance: Paid ₹${customerBalance.totalPaid.toFixed(2)} | Unpaid ₹${customerBalance.totalUnpaid.toFixed(2)}</p>
// //           <table>
// //             <tr><th>Product</th><th>Qty</th><th>Price</th><th>Discount</th><th>Total</th></tr>
// //             ${selectedProducts.map(p => `
// //               <tr>
// //                 <td>${p.productName} (${p.companyName})</td>
// //                 <td>${p.quantity} ${p.unit}</td>
// //                 <td>₹${p.salePrice}</td>
// //                 <td>${p.discount}%</td>
// //                 <td>₹${p.totalAmount.toFixed(2)}</td>
// //               </tr>
// //             `).join('')}
// //           </table>
// //           <p>Total: ₹${calculateOrderTotal(selectedProducts).total.toFixed(2)}</p>
// //           <p>Paid: ₹${form.getFieldValue('paidAmount') || 0}</p>
// //           <p>Unpaid: ₹${unpaidAmount.toFixed(2)}</p>
// //         </body>
// //       </html>
// //     `;
// //     const printWindow = window.open('', '', 'height=600,width=800');
// //     printWindow?.document.write(billContent);
// //     printWindow?.print();
// //     printWindow?.close();
// //   };


// // //   const handleDownloadBillPdf = async (order: Order) => {
// // //   try {
// // //     const companyInfo = {
// // //       companyName: 'AgriCorp Showroom', // or dynamically from context
// // //       address: '123 Village Street, District X',
// // //       gstNumber: '27ABCDE1234F2Z5'
// // //     };
// // //     await generateOrderPDF(order, companyInfo);
// // //   } catch (err) {
// // //     console.error('Failed to generate PDF:', err);
// // //     message.error('Failed to generate invoice PDF');
// // //   }
// // // };


// // const handleDownloadBillPdf = async (order: Order) => {
// //   try {
// //     const companyInfo = {
// //       companyName: 'AgriCorp Showroom',
// //       address: '123 Village Street, District X',
// //       gstNumber: '27ABCDE1234F2Z5'
// //     };

// //     // Transform the order object to match the expected type
// //     const transformedOrder = {
// //       ...order,
// //       items: order.items.map(item => ({
// //         productId: item.productId,
// //         name: item.productName, // map 'productName' to 'name'
// //         quantity: item.quantity,
// //         unitPrice: item.price,
// //         gst: item.gst,
// //         total: item.totalAmount ?? (item.price * item.quantity) // fallback calculation if needed
// //       }))
// //     };

// //     await generateOrderPDF(transformedOrder, companyInfo);
// //   } catch (err) {
// //     console.error('Failed to generate PDF:', err);
// //     message.error('Failed to generate invoice PDF');
// //   }
// // };




// // return (
// //   <div className="p-4 md:p-6 bg-white shadow rounded-lg">
// //     <h2 className="text-xl font-semibold mb-4">Create Bill / Sale</h2>

// //     <Form form={form} onFinish={handleFinish} layout="vertical">
// //       <Row gutter={[16, 16]}>
// //         <Col xs={24} sm={12} md={8}>
// //           <Form.Item
// //             name="customerName"
// //             label="Customer Name"
// //             rules={[{ required: true, message: 'Please input or select a customer!' }]}
// //           >
// //             <AutoComplete
// //               value={customerSearch}
// //               onChange={handleCustomerSearch}
// //               onSelect={handleCustomerSelect}
// //               placeholder="Search by name or phone"
// //               style={{ width: '100%' }}
// //               options={filteredCustomers.map(customer => ({
// //                 value: customer.id,
// //                 label: (
// //                   <div className="flex justify-between">
// //                     <span>{customer.name} ({customer.phone})</span>
// //                     <span>{customer.village || 'N/A'}</span>
// //                   </div>
// //                 )
// //               }))}
// //               filterOption={false}
// //             />
// //           </Form.Item>
// //         </Col>
// //         <Col xs={24} sm={12} md={8}>
// //           <Form.Item name="contact" label="Contact" rules={[{ required: true }]}>
// //             <Input />
// //           </Form.Item>
// //         </Col>
// //         <Col xs={24} sm={12} md={8}>
// //           <Form.Item name="showroom" label="Showroom" rules={[{ required: true }]}>
// //             <Select value={selectedShowroom} onChange={setSelectedShowroom}>
// //               {showrooms.map(showroom => (
// //                 <Option key={showroom.id} value={showroom.id}>
// //                   {showroom.name}
// //                 </Option>
// //               ))}
// //             </Select>
// //           </Form.Item>
// //         </Col>
// //       </Row>

// //       <Row gutter={[16, 16]}>
// //         <Col xs={24} sm={12} md={8}>
// //           <Form.Item name="village" label="Village">
// //             <Input />
// //           </Form.Item>
// //         </Col>
// //         <Col xs={24} sm={12} md={8}>
// //           <Form.Item name="taluka" label="Taluka">
// //             <Input />
// //           </Form.Item>
// //         </Col>
// //         <Col xs={24} sm={12} md={8}>
// //           <Form.Item name="district" label="District">
// //             <Input />
// //           </Form.Item>
// //         </Col>
// //       </Row>

// //       <Row gutter={[16, 16]}>
// //         <Col span={24}>
// //           <Form.Item label="Search and Add Product">
// //             <AutoComplete
// //               value={searchQuery}
// //               onChange={setSearchQuery}
// //               onSelect={handleAddProduct}
// //               placeholder="Search by name, category, or description"
// //               style={{ width: '100%' }}
// //               options={filteredProducts.map(product => ({
// //                 value: product.id,
// //                 label: (
// //                   <div className="flex justify-between">
// //                     <span>{product.name} ({product.category})</span>
// //                     <span>Stock: {product.stock[selectedShowroom || ''] || 0} {product.unit}</span>
// //                   </div>
// //                 )
// //               }))}
// //               filterOption={false}
// //             />
// //           </Form.Item>
// //         </Col>
// //       </Row>

// //       {selectedCustomerId && (
// //         <div className="mb-4">
// //           <Button type="default" onClick={() => setIsBillModalOpen(true)}>
// //             Show Previous Bills
// //           </Button>
// //         </div>
// //       )}

// //       <div style={{ overflowX: 'auto', marginBottom: 16 }}>
// //         <Table
// //           columns={columns}
// //           dataSource={selectedProducts}
// //           scroll={{ x: 1500 }}
// //           pagination={false}
// //           rowKey="key"
// //         />
// //       </div>

// //       <Row gutter={[16, 16]}>
// //         <Col xs={24} sm={12} md={8}>
// //           <Form.Item name="paidAmount" label="Paid Amount" rules={[{ required: true }]}>
// //             <Input
// //               type="number"
// //               min={0}
// //               onChange={() =>
// //                 form.setFieldsValue({
// //                   paidAmount: parseFloat(form.getFieldValue('paidAmount')) || 0
// //                 })
// //               }
// //             />
// //           </Form.Item>
// //         </Col>
// //         {/*         <Col xs={24} sm={12} md={8}>
// //           <Form.Item name="unpaidAmount" label="Unpaid Amount">
// //             <Input disabled value={unpaidAmount.toFixed(2)} />
// //           </Form.Item>
// //         </Col>
// // <Col xs={24} sm={12} md={8}>
// //           <Form.Item name="total" label="Total">
// //             <Input disabled value={calculateOrderTotal(selectedProducts).total.toFixed(2)} />
// //           </Form.Item>
// //         </Col> */}
// //         <Col xs={24} sm={24} md={8}>
// //           <Form.Item label="Customer Balance">
// //             <Input
// //               disabled
// //               value={`Paid: ₹${customerBalance.totalPaid.toFixed(2)} | Unpaid: ₹${customerBalance.totalUnpaid.toFixed(2)}`}
// //             />
// //           </Form.Item>
// //         </Col>
// //       </Row>

// //       <div className="flex flex-wrap gap-4 mt-4 justify-center">
// //         <Button
// //           type="primary"
// //           htmlType="submit"
// //           disabled={!hasPermission('manage_orders')}
// //         >
// //           Save Bill
// //         </Button>
// //         <Button
// //           type="primary"
// //           onClick={handlePrint}
// //           style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
// //           disabled={selectedProducts.length === 0}
// //         >
// //           Print Bill
// //         </Button>
// //       </div>
// //     </Form>

// //     <Modal
// //       title={`Previous Bills - ${form.getFieldValue('customerName') || ''}`}
// //       visible={isBillModalOpen}
// //       onCancel={() => setIsBillModalOpen(false)}
// //       footer={null}
// //       width={800}
// //     >
// //       <div style={{ overflowX: 'auto' }}>
// //         <Table
// //           dataSource={previousBills}
// //           rowKey="id"
// //           pagination={{ pageSize: 5 }}
// //           onRow={(record) => ({
// //             onClick: () => setSelectedBill(record),
// //           })}
// //           columns={[
// //             {
// //               title: 'Date',
// //               dataIndex: 'createdAt',
// //               key: 'createdAt',
// //               align:"center",
// //               render: (date: string) => new Date(date).toLocaleDateString(),
// //             },
// //             {
// //               title: 'Total',
// //               dataIndex: 'total',
// //               align:"center",
// //               key: 'total',
// //               render: (amount: number) => `₹${amount.toFixed(2)}`
// //             },
// //             {
// //               title: 'Paid',
// //               dataIndex: 'paidAmount',
// //               key: 'paidAmount',
// //               align:"center",
// //               render: (amount: number) => `₹${amount.toFixed(2)}`
// //             },
// //             {
// //               title: 'Unpaid',
// //               dataIndex: 'unpaidAmount',
// //               align:"center",
// //               key: 'unpaidAmount',
// //               render: (amount: number) => `₹${amount.toFixed(2)}`
// //             },
// //             {
// //               title: 'Status',
// //               dataIndex: 'status',
// //               align:"center",
// //               key: 'status',
// //               render: (status: string) => (
// //                 <span style={{ color: status === 'Pending' ? 'orange' : 'green' }}>{status}</span>
// //               )
// //             },
// //             {
// //               title: 'Actions',
// //               key: 'actions',
// //               align:"center",
// //               render: (_: any, record: Order) => (
// //                 <Button
// //                   icon={<DownloadOutlined />}
// //                   type="link"
// //                   onClick={() => handleDownloadBillPdf(record)}
// //                 />
// //               )
// //             }
// //           ]}
// //         />
// //       </div>
// //     </Modal>

// //     {/* {selectedBill && (
// //       <div id="bill-preview" className="mt-6 border p-4 rounded bg-gray-50">
// //         <h3 className="text-lg font-semibold mb-2">
// //           Preview - Bill #{selectedBill.orderNumber}
// //         </h3>
// //         <p><strong>Date:</strong> {new Date(selectedBill.createdAt).toLocaleDateString()}</p>
// //         <p><strong>Customer:</strong> {selectedBill.customerName}</p>
// //         <p><strong>Phone:</strong> {selectedBill.customerPhone}</p>
// //         <p><strong>Status:</strong> {selectedBill.status}</p>
// //         <p><strong>Items:</strong></p>
// //         <ul className="list-disc ml-6">
// //           {selectedBill.items.map(item => (
// //             <li key={item.productId}>
// //               {item.name} - {item.quantity} x ₹{Number(item.unitPrice).toFixed(2)} (GST: {item.gst}%)
// //             </li>
// //           ))}
// //         </ul>
// //         <p className="mt-2">
// //           <strong>Total:</strong> ₹{selectedBill.total.toFixed(2)} | <strong>Paid:</strong> ₹{selectedBill.paidAmount.toFixed(2)} | <strong>Unpaid:</strong> ₹{selectedBill.unpaidAmount.toFixed(2)}
// //         </p>
// //       </div>
// //     )} */}
// //   </div>
// // );

// // };

// // export default CreateBill;