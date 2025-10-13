import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Input, 
  Select, 
  Typography, 
  Card, 
  Tag, 
  Modal, 
  Form, 
  InputNumber,
  Row,
  Col,
  message
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  EyeOutlined, 
  PrinterOutlined,
  UserOutlined,
  HomeOutlined,
  PhoneOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import orderService from '../services/orderService';
import showroomService from '../services/showroomService';
import productService, { Product } from '../services/productService';

const { Title, Text } = Typography;
const { Option } = Select;

const Orders: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [viewOrderModal, setViewOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [tablePagination, setTablePagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showrooms, setShowrooms] = useState<{ [key: number]: string }>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [productMap, setProductMap] = useState<{ [key: number]: Product }>({});
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const ordersData = await orderService.getAllOrders();
      setOrders(ordersData);

      const showroomsData = await showroomService.getAllShowrooms();
      const showroomMap = showroomsData.reduce((acc: any, showroom: any) => {
        acc[showroom.id] = showroom.name;
        return acc;
      }, {});
      setShowrooms(showroomMap);

      const productsData = await productService.getAllProducts();
      setProducts(productsData);
      const productMapping = productsData.reduce((acc: any, product: Product) => {
        acc[product.id!] = product;
        return acc;
      }, {});
      setProductMap(productMapping);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const orderNumber = order.id?.toString() ?? '';
    const customerName = order.customerName ?? '';
    const customerPhone = order.phoneNumber ?? '';
    const status = order.status ?? 'Pending';

    const matchesSearch = 
      orderNumber.toLowerCase().includes(searchText.toLowerCase()) ||
      customerName.toLowerCase().includes(searchText.toLowerCase()) ||
      customerPhone.includes(searchText);

    const matchesStatus = !statusFilter || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      title: 'Sr. No.',
      render: (_: any, __: any, index: number) => {
        const { current, pageSize } = tablePagination;
        return (current - 1) * pageSize + index + 1;
      },
      align: 'center' as const,
    },
    {
      title: 'Order #',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (text: number) => <Text strong>#{text}</Text>
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_, record: any) => (
        <div>
          <div className="font-medium">{record.customerName}</div>
          <div className="text-sm text-gray-500 flex items-center">
            <PhoneOutlined className="mr-1" />
            {record.phoneNumber || 'N/A'}
          </div>
          <div className="text-sm text-gray-500 flex items-center">
            <HomeOutlined className="mr-1" />
            {record.deliveryAddress || 'N/A'}
          </div>
        </div>
      ),
      width: 200
    },
    {
      title: 'Items',
      key: 'items',
      render: (_, record: any) => {
        const items = Array.isArray(record.items) ? record.items : [];
        return (
          <div>
            <Text>{items.length} items</Text>
            <div className="text-xs text-gray-500">
              {items.slice(0, 2).map((item: any) => {
                const product = productMap[item.product?.id] || { name: 'Unknown Product' };
                return `${product.name} (${item.quantity})`;
              }).join(', ')}
              {items.length > 2 && '...'}
            </div>
          </div>
        );
      },
      width: 150
    },
    {
      title: 'Amount',
      key: 'amount',
      render: (_, record: any) => {
        const items = Array.isArray(record.orderItems) ? record.orderItems : [];
        const total = items.reduce((sum: number, item: any) => {
          const product = productMap[item.product?.id];
          return sum + (product?.price || 0) * item.quantity;
        }, 0);
        return (
          <div>
            <div className="font-medium">₹{total.toFixed(2)}</div>
          </div>
        );
      },
      width: 120
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record: any) => {
        const status = record.status || 'Pending';
        const color = status === 'Delivered' ? 'green' : 
                     status === 'Approved' ? 'blue' : 'orange';
        return <Tag color={color}>{status}</Tag>;
      },
      width: 100
    },
    {
      title: 'Showroom',
      key: 'showroom',
      render: (_, record: any) => {
        return showrooms[record.showroom?.id] || 'Unknown';
      },
      width: 120
    },
    {
      title: 'Date',
      key: 'date',
      render: (_, record: any) => {
        return record.createdAt ? new Date(record.createdAt).toLocaleDateString('en-IN') : 'N/A';
      },
      width: 100
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: any) => (
        <div className="flex flex-wrap gap-1">
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => viewOrder(record)}
            title="View Order"
          />
          <Button
            icon={<PrinterOutlined />}
            size="small"
            onClick={() => printOrder(record)}
            title="Print Order"
          />
          {record.status === 'Pending' && (
            <Button
              size="small"
              type="primary"
              onClick={() => updateOrderStatus(record.id, 'Approved')}
            >
              Approve
            </Button>
          )}
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => deleteOrder(record.id)}
            title="Delete Order"
          />
        </div>
      ),
      width: 150
    }
  ];

  const viewOrder = (order: any) => {
    setSelectedOrder(order);
    setViewOrderModal(true);
  };

  const printOrder = (order: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const items = Array.isArray(order.orderItems) ? order.orderItems : [];
    const total = items.reduce((sum: number, item: any) => {
      const product = productMap[item.product?.id];
      return sum + (product?.price || 0) * item.quantity;
    }, 0);

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order Invoice</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .company-name { font-size: 24px; font-weight: bold; }
          .order-info { display: flex; justify-content: space-between; margin: 20px 0; }
          .customer-info, .order-details { width: 45%; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total { text-align: right; font-weight: bold; font-size: 18px; }
          .footer { text-align: center; margin-top: 30px; font-style: italic; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">AgriCorp</div>
          <div>123 Agriculture Hub, Farm City, State - 123456</div>
          <div>GST: 22AAAAA0000A1Z5</div>
        </div>
        
        <h2 style="text-align: center;">ORDER INVOICE</h2>
        
        <div class="order-info">
          <div class="customer-info">
            <h3>Customer Information</h3>
            <p><strong>Name:</strong> ${order.customerName}</p>
            <p><strong>Phone:</strong> ${order.phoneNumber}</p>
            <p><strong>Address:</strong> ${order.deliveryAddress}</p>
          </div>
          <div class="order-details">
            <h3>Order Details</h3>
            <p><strong>Order #:</strong> ${order.id}</p>
            <p><strong>Status:</strong> ${order.status || 'Pending'}</p>
            <p><strong>Date:</strong> ${order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : 'N/A'}</p>
            <p><strong>Showroom:</strong> ${showrooms[order.showroom?.id] || 'Unknown'}</p>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item: any) => {
              const product = productMap[item.product?.id] || { name: 'Unknown Product', price: 0 };
              const itemTotal = product.price * item.quantity;
              return `
                <tr>
                  <td>${product.name}</td>
                  <td>${item.quantity}</td>
                  <td>₹${product.price}</td>
                  <td>₹${itemTotal.toFixed(2)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <div class="total">
          Total Amount: ₹${total.toFixed(2)}
        </div>
        
        <div class="footer">
          <p>Thank you for your business!</p>
          <p>This is a computer generated invoice.</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const updateOrderStatus = async (orderId: number, status: 'Approved' | 'Delivered') => {
    try {
      await orderService.updateOrder(orderId, { status } as any);
      message.success(`Order ${orderId} status updated to ${status}`);
      fetchData();
    } catch (error) {
      message.error('Failed to update order');
      console.error('Update order error:', error);
    }
  };

  const handleCreateOrder = () => {
    setIsModalVisible(true);
    form.resetFields();
    form.setFieldsValue({
      showroomId: undefined,
      items: [{}]
    });
  };

  const deleteOrder = async (orderId: number) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this order?',
      content: 'This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await orderService.deleteOrder(orderId);
          message.success('Order deleted successfully!');
          fetchData();
        } catch (error) {
          console.error('Failed to delete order');
          message.error('Failed to delete order');
        }
      },
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      setIsLoading(true);
      const orderData = {
        customerName: values.customerName,
        phoneNumber: values.phoneNumber,
        deliveryAddress: values.deliveryAddress,
        showroom: { id: values.showroomId },
        orderItems: values.items.map((item: any) => ({
          product: { id: item.productId },
          quantity: item.quantity
        }))
      };
      
      await orderService.createOrder(orderData);
      message.success('Order created successfully!');
      setIsModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      console.error('Create order error:', error);
      message.error('Failed to create order');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <Title level={2} className="!mb-0">Orders Management</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateOrder}
          className="w-full sm:w-auto"
        >
          Create Order
        </Button>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <Input
            placeholder="Search orders..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full sm:w-80"
          />
          <Select
            placeholder="Filter by status"
            value={statusFilter}
            onChange={setStatusFilter}
            className="w-full sm:w-40"
            allowClear
          >
            <Option value="Pending">Pending</Option>
            <Option value="Approved">Approved</Option>
            <Option value="Delivered">Delivered</Option>
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={filteredOrders}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1100 }}
          pagination={{
            ...tablePagination,
            total: filteredOrders.length,
            showSizeChanger: true,
            showQuickJumper: true,
            onChange: (page, pageSize) => {
              setTablePagination({ current: page, pageSize: pageSize || 10 });
            },
          }}
        />
      </Card>

      <Modal
        title="Create New Order"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="customerName"
                label="Customer Name"
                rules={[{ required: true, message: 'Please enter customer name' }]}
              >
                <Input prefix={<UserOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phoneNumber"
                label="Phone Number"
                rules={[
                  { required: true, message: 'Please enter a phone number' },
                  { pattern: /^[0-9]{10}$/, message: 'Phone number must be exactly 10 digits' }
                ]}
              >
                <Input
                  prefix={<PhoneOutlined />}
                  maxLength={10}
                  placeholder="Enter 10-digit number"
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="deliveryAddress"
            label="Delivery Address"
            rules={[{ required: true, message: 'Please enter delivery address' }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item
            name="showroomId"
            label="Showroom"
            rules={[{ required: true, message: 'Please select a showroom' }]}
          >
            <Select placeholder="Select Showroom">
              {Object.entries(showrooms).map(([id, name]) => (
                <Option key={id} value={parseInt(id)}>{name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                <div className="flex justify-between items-center mb-4">
                  <Text strong>Order Items</Text>
                  <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>
                    Add Item
                  </Button>
                </div>
                {fields.map(({ key, name, ...restField }) => (
                  <Card key={key} size="small" className="mb-4">
                    <Row gutter={16}>
                      <Col span={10}>
                        <Form.Item
                          {...restField}
                          name={[name, 'productId']}
                          label="Product"
                          rules={[{ required: true, message: 'Please select a product' }]}
                        >
                          <Select placeholder="Select Product" showSearch>
                            {products.map((product) => (
                              <Option key={product.id} value={product.id}>
                                {product.name} - ₹{product.price}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'quantity']}
                          label="Quantity"
                          rules={[{ required: true, message: 'Please enter quantity' }]}
                        >
                          <InputNumber min={1} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item label=" ">
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => remove(name)}
                          >
                            Remove
                          </Button>
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                ))}
              </>
            )}
          </Form.List>

          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={isLoading}>
              Create Order
            </Button>
          </div>
        </Form>
      </Modal>

      <Modal
        title={`Order Details - #${selectedOrder?.id || 'N/A'}`}
        open={viewOrderModal}
        onCancel={() => setViewOrderModal(false)}
        footer={[
          <Button key="close" onClick={() => setViewOrderModal(false)}>
            Close
          </Button>,
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={() => selectedOrder && printOrder(selectedOrder)}>
            Print
          </Button>
        ]}
        width={800}
      >
        {selectedOrder && (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <Card title="Customer Information" size="small">
                  <p><strong>Name:</strong> {selectedOrder.customerName}</p>
                  <p><strong>Phone:</strong> {selectedOrder.phoneNumber}</p>
                  <p><strong>Address:</strong> {selectedOrder.deliveryAddress}</p>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Order Information" size="small">
                  <p><strong>Order #:</strong> #{selectedOrder.id}</p>
                  <p><strong>Status:</strong> <Tag color={selectedOrder.status === 'Delivered' ? 'green' : selectedOrder.status === 'Approved' ? 'blue' : 'orange'}>{selectedOrder.status || 'Pending'}</Tag></p>
                  <p><strong>Date:</strong> {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleDateString('en-IN') : 'N/A'}</p>
                  <p><strong>Showroom:</strong> {showrooms[selectedOrder.showroom?.id] || 'Unknown'}</p>
                </Card>
              </Col>
            </Row>
            
            <Card title="Order Items" className="mt-4" size="small">
              <Table
                dataSource={selectedOrder.orderItems || []}
                pagination={false}
                size="small"
                columns={[
                  {
                    title: 'Product',
                    key: 'product',
                    render: (_, record: any) => {
                      const product = productMap[record.product?.id] || { name: 'Unknown Product' };
                      return product.name;
                    }
                  },
                  {
                    title: 'Quantity',
                    dataIndex: 'quantity',
                    key: 'quantity'
                  },
                  {
                    title: 'Unit Price',
                    key: 'price',
                    render: (_, record: any) => {
                      const product = productMap[record.product?.id];
                      return product ? `₹${product.price}` : 'N/A';
                    }
                  },
                  {
                    title: 'Total',
                    key: 'total',
                    render: (_, record: any) => {
                      const product = productMap[record.product?.id];
                      const total = product ? product.price * record.quantity : 0;
                      return `₹${total.toFixed(2)}`;
                    }
                  }
                ]}
              />
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Orders;