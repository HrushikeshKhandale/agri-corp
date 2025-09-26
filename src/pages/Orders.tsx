import React, { useState } from 'react';
import { 
  Table, 
  Button, 
  Input, 
  Select, 
  Space, 
  Typography, 
  Card, 
  Tag, 
  Modal, 
  Form, 
  InputNumber,
  Row,
  Col,
  Divider,
  Steps,
  Statistic,
  message
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  EyeOutlined, 
  PrinterOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  HomeOutlined,
  PhoneOutlined
} from '@ant-design/icons';
import { useData, Order } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { generateOrderPDF } from '../utils/pdfGenerator';

const { Title, Text } = Typography;
const { Option } = Select;
const { Step } = Steps;

const Orders: React.FC = () => {
  const { 
    orders, 
    addOrder, 
    updateOrder, 
    products, 
    showrooms,
    getProductsByShowroom 
  } = useData();
  const { authState, hasPermission } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [viewOrderModal, setViewOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [form] = Form.useForm();

  // Filter orders based on user role
  const userOrders = authState.user?.role === 'Super Admin' 
    ? orders 
    : orders.filter(order => order.showroomId === authState.showroomId);

  const filteredOrders = userOrders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchText.toLowerCase()) ||
                         order.customerName.toLowerCase().includes(searchText.toLowerCase()) ||
                         order.customerPhone.includes(searchText);
    const matchesStatus = !statusFilter || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      title: 'Order #',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 120,
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_, record: Order) => (
        <div>
          <div className="font-medium">{record.customerName}</div>
          <div className="text-sm text-gray-500 flex items-center">
            <PhoneOutlined className="mr-1" />
            {record.customerPhone}
          </div>
        </div>
      ),
      width: 200
    },
    {
      title: 'Items',
      key: 'items',
      render: (_, record: Order) => (
        <div>
          <Text>{record.items.length} items</Text>
          <div className="text-xs text-gray-500">
            {record.items.slice(0, 2).map(item => item.productName).join(', ')}
            {record.items.length > 2 && '...'}
          </div>
        </div>
      ),
      width: 150
    },
    {
      title: 'Amount',
      key: 'amount',
      render: (_, record: Order) => (
        <div>
          <div className="font-medium">₹{record.total.toFixed(2)}</div>
          <div className="text-xs text-gray-500">
            GST: ₹{record.totalGst.toFixed(2)}
          </div>
        </div>
      ),
      width: 120
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color = status === 'Delivered' ? 'green' : 
                     status === 'Approved' ? 'blue' : 'orange';
        return <Tag color={color}>{status}</Tag>;
      },
      width: 100
    },
    {
      title: 'Showroom',
      key: 'showroom',
      render: (_, record: Order) => {
        const showroom = showrooms.find(s => s.id === record.showroomId);
        return showroom?.name || 'Unknown';
      },
      width: 120
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('en-IN'),
      width: 100
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: Order) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => viewOrder(record)}
          />
          <Button
            icon={<PrinterOutlined />}
            size="small"
            onClick={() => printOrder(record)}
          />
          {hasPermission('manage_orders') && record.status === 'Pending' && (
            <Button
              size="small"
              type="primary"
              onClick={() => updateOrderStatus(record.id, 'Approved')}
            >
              Approve
            </Button>
          )}
        </Space>
      ),
      width: 150
    }
  ];

  const viewOrder = (order: Order) => {
    setSelectedOrder(order);
    setViewOrderModal(true);
  };

  const printOrder = async (order: Order) => {
    try {
      const companyInfo = {
        companyName: 'AgriERP Pro',
        address: '123 Agriculture Hub, Farm City, State - 123456',
        gstNumber: '22AAAAA0000A1Z5'
      };
      await generateOrderPDF(order, companyInfo);
      message.success('PDF generated successfully!');
    } catch (error) {
      message.error('Failed to generate PDF');
    }
  };

  const updateOrderStatus = (orderId: string, status: 'Approved' | 'Delivered') => {
    updateOrder(orderId, { status });
  };

  const handleCreateOrder = () => {
    setIsModalVisible(true);
    form.resetFields();
    form.setFieldsValue({
      showroomId: authState.showroomId || showrooms[0]?.id,
      items: [{}]
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // Calculate totals
      let subtotal = 0;
      let totalGst = 0;
      
      const orderItems = values.items.map((item: any) => {
        const product = products.find(p => p.id === item.productId);
        if (!product) throw new Error('Product not found');
        
        const itemTotal = item.quantity * product.price;
        const itemGst = (itemTotal * product.gst) / 100;
        
        subtotal += itemTotal;
        totalGst += itemGst;
        
        return {
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unit: product.unit,
          price: product.price,
          gst: product.gst
        };
      });

      const orderData = {
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        customerAddress: values.customerAddress,
        items: orderItems,
        subtotal,
        totalGst,
        total: subtotal + totalGst,
        status: 'Pending' as const,
        showroomId: values.showroomId
      };

      addOrder(orderData);
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Order creation failed:', error);
    }
  };

  const getStatusSteps = (status: string) => {
    const steps = ['Pending', 'Approved', 'Delivered'];
    return steps.indexOf(status);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Title level={2} className="!mb-1">Orders</Title>
          <p className="text-gray-600">Manage customer orders and deliveries</p>
        </div>
        {hasPermission('manage_orders') && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateOrder}
          >
            Create Order
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={6}>
          <Card className="ag-card">
            <Statistic
              title="Total Orders"
              value={userOrders.length}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: 'hsl(var(--primary))' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="ag-card">
            <Statistic
              title="Pending"
              value={userOrders.filter(o => o.status === 'Pending').length}
              valueStyle={{ color: 'hsl(var(--warning))' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="ag-card">
            <Statistic
              title="Delivered"
              value={userOrders.filter(o => o.status === 'Delivered').length}
              valueStyle={{ color: 'hsl(var(--success))' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="ag-card">
            <Statistic
              title="Total Revenue"
              value={userOrders.reduce((sum, order) => sum + order.total, 0)}
              prefix="₹"
              precision={0}
              valueStyle={{ color: 'hsl(var(--info))' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="ag-card">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12} lg={8}>
            <Input
              placeholder="Search orders..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} md={12} lg={8}>
            <Select
              placeholder="Filter by status"
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              className="w-full"
            >
              <Option value="Pending">Pending</Option>
              <Option value="Approved">Approved</Option>
              <Option value="Delivered">Delivered</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Orders Table */}
      <Card className="ag-card">
        <Table
          columns={columns}
          dataSource={filteredOrders}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} orders`
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Create Order Modal */}
      <Modal
        title="Create New Order"
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        width={800}
        okText="Create Order"
      >
        <Form form={form} layout="vertical">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="customerName"
                label="Customer Name"
                rules={[{ required: true, message: 'Please input customer name!' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="Enter customer name" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="customerPhone"
                label="Phone Number"
                rules={[{ required: true, message: 'Please input phone number!' }]}
              >
                <Input prefix={<PhoneOutlined />} placeholder="+91 XXXXXXXXXX" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="customerAddress"
            label="Delivery Address"
            rules={[{ required: true, message: 'Please input delivery address!' }]}
          >
            <Input.TextArea rows={2} placeholder="Enter delivery address" />
          </Form.Item>

          <Form.Item
            name="showroomId"
            label="Showroom"
            rules={[{ required: true, message: 'Please select showroom!' }]}
          >
            <Select placeholder="Select showroom">
              {showrooms.map(showroom => (
                <Option key={showroom.id} value={showroom.id}>
                  {showroom.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Divider>Order Items</Divider>

          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row key={key} gutter={[16, 16]} className="mb-4">
                    <Col xs={24} md={10}>
                      <Form.Item
                        {...restField}
                        name={[name, 'productId']}
                        label="Product"
                        rules={[{ required: true, message: 'Select product!' }]}
                      >
                        <Select placeholder="Select product">
                          {products.map(product => (
                            <Option key={product.id} value={product.id}>
                              {product.name} - ₹{product.price}/{product.unit}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'quantity']}
                        label="Quantity"
                        rules={[{ required: true, message: 'Enter quantity!' }]}
                      >
                        <InputNumber min={1} className="w-full" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={6}>
                      <Form.Item label=" ">
                        <Button onClick={() => remove(name)} danger>
                          Remove
                        </Button>
                      </Form.Item>
                    </Col>
                  </Row>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Add Item
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>

      {/* View Order Modal */}
      <Modal
        title={`Order Details - ${selectedOrder?.orderNumber}`}
        open={viewOrderModal}
        onCancel={() => setViewOrderModal(false)}
        footer={[
          <Button key="print" icon={<PrinterOutlined />} onClick={() => selectedOrder && printOrder(selectedOrder)}>
            Print PDF
          </Button>,
          <Button key="close" onClick={() => setViewOrderModal(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {selectedOrder && (
          <div className="space-y-6">
            <Steps current={getStatusSteps(selectedOrder.status)} size="small">
              <Step title="Pending" />
              <Step title="Approved" />
              <Step title="Delivered" />
            </Steps>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card size="small" title="Customer Information">
                  <div className="space-y-2">
                    <div><strong>Name:</strong> {selectedOrder.customerName}</div>
                    <div><strong>Phone:</strong> {selectedOrder.customerPhone}</div>
                    <div><strong>Address:</strong> {selectedOrder.customerAddress}</div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card size="small" title="Order Information">
                  <div className="space-y-2">
                    <div><strong>Order #:</strong> {selectedOrder.orderNumber}</div>
                    <div><strong>Date:</strong> {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}</div>
                    <div><strong>Status:</strong> <Tag color={selectedOrder.status === 'Delivered' ? 'green' : selectedOrder.status === 'Approved' ? 'blue' : 'orange'}>{selectedOrder.status}</Tag></div>
                  </div>
                </Card>
              </Col>
            </Row>

            <Card size="small" title="Order Items">
              <Table
                dataSource={selectedOrder.items}
                pagination={false}
                size="small"
                columns={[
                  { title: 'Product', dataIndex: 'productName', key: 'productName' },
                  { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', render: (qty, record) => `${qty} ${record.unit}` },
                  { title: 'Rate', dataIndex: 'price', key: 'price', render: (price) => `₹${price}` },
                  { title: 'GST', dataIndex: 'gst', key: 'gst', render: (gst) => `${gst}%` },
                  { title: 'Amount', key: 'amount', render: (_, record) => `₹${(record.quantity * record.price).toFixed(2)}` }
                ]}
              />
              
              <div className="mt-4 text-right space-y-1">
                <div>Subtotal: ₹{selectedOrder.subtotal.toFixed(2)}</div>
                <div>GST: ₹{selectedOrder.totalGst.toFixed(2)}</div>
                <div className="font-bold text-lg">Total: ₹{selectedOrder.total.toFixed(2)}</div>
              </div>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Orders;