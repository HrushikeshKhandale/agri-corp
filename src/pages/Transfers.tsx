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
  Statistic,
  message
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  CheckOutlined, 
  CloseOutlined,
  SwapOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { useData, Transfer } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

const { Title } = Typography;
const { Option } = Select;

const Transfers: React.FC = () => {
  const { 
    transfers, 
    addTransfer, 
    approveTransfer, 
    rejectTransfer,
    products,
    showrooms 
  } = useData();
  const { authState, hasPermission } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Filter transfers based on user role
  const userTransfers = authState.user?.role === 'Super Admin' 
    ? transfers 
    : transfers.filter(transfer => 
        transfer.fromShowroomId === authState.showroomId || 
        transfer.toShowroomId === authState.showroomId
      );

  const filteredTransfers = userTransfers.filter(transfer => {
    const product = products.find(p => p.id === transfer.productId);
    const fromShowroom = showrooms.find(s => s.id === transfer.fromShowroomId);
    const toShowroom = showrooms.find(s => s.id === transfer.toShowroomId);
    
    const matchesSearch = transfer.productName.toLowerCase().includes(searchText.toLowerCase()) ||
                         fromShowroom?.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         toShowroom?.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = !statusFilter || transfer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      title: 'Product',
      dataIndex: 'productName',
      key: 'productName',
      width: 200,
      render: (text: string) => <span className="font-medium">{text}</span>
    },
    {
      title: 'Transfer Route',
      key: 'route',
      render: (_, record: Transfer) => {
        const fromShowroom = showrooms.find(s => s.id === record.fromShowroomId);
        const toShowroom = showrooms.find(s => s.id === record.toShowroomId);
        
        return (
          <div className="flex items-center space-x-2">
            <span className="text-sm">{fromShowroom?.name}</span>
            <ArrowRightOutlined className="text-gray-400" />
            <span className="text-sm">{toShowroom?.name}</span>
          </div>
        );
      },
      width: 250
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity: number, record: Transfer) => {
        const product = products.find(p => p.id === record.productId);
        return `${quantity} ${product?.unit || 'units'}`;
      },
      width: 100
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color = status === 'Approved' ? 'green' : 
                     status === 'Rejected' ? 'red' : 'orange';
        return <Tag color={color}>{status}</Tag>;
      },
      width: 100
    },
    {
      title: 'Requested By',
      dataIndex: 'requestedBy',
      key: 'requestedBy',
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
  render: (_: any, record: Transfer) => (
    <Space>
      {record.status === 'Pending' && hasPermission('manage_transfers', { toShowroomId: record.toShowroomId }) && (
        <>
          <Button
            icon={<CheckOutlined />}
            size="small"
            type="primary"
            onClick={() => handleApprove(record.id, record)}
          >
            Approve
          </Button>
          <Button
            icon={<CloseOutlined />}
            size="small"
            danger
            onClick={() => handleReject(record.id, record)}
          >
            Reject
          </Button>
        </>
      )}
      {record.status !== 'Pending' && (
        <span className="text-sm text-gray-500">
          {record.status} by {record.approvedBy || 'N/A'}
        </span>
      )}
    </Space>
  ),
  width: 200
}
  ];

  const handleApprove = (transferId: string) => {
    approveTransfer(transferId, authState.user?.name || 'Admin');
  };

  const handleReject = (transferId: string) => {
    rejectTransfer(transferId, authState.user?.name || 'Admin');
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // Check if source showroom has enough stock
      const product = products.find(p => p.id === values.productId);
      if (!product) {
        message.error('Product not found');
        return;
      }

      const sourceStock = product.stock[values.fromShowroomId] || 0;
      if (sourceStock < values.quantity) {
        message.error(`Insufficient stock. Available: ${sourceStock} ${product.unit}`);
        return;
      }

      const transferData = {
        productId: values.productId,
        productName: product.name,
        fromShowroomId: values.fromShowroomId,
        toShowroomId: values.toShowroomId,
        quantity: values.quantity,
        status: 'Pending' as const,
        requestedBy: authState.user?.name || 'Unknown',
        notes: values.notes
      };

      addTransfer(transferData);
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Transfer request failed:', error);
    }
  };

  const getAvailableStock = (productId: string, showroomId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.stock[showroomId] || 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Title level={2} className="!mb-1">Stock Transfers</Title>
          <p className="text-gray-600">Manage inventory transfers between showrooms</p>
        </div>
        {hasPermission('request_transfers') && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
          >
            Request Transfer
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={6}>
          <Card className="ag-card">
            <Statistic
              title="Total Transfers"
              value={userTransfers.length}
              prefix={<SwapOutlined />}
              valueStyle={{ color: 'hsl(var(--primary))' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="ag-card">
            <Statistic
              title="Pending"
              value={userTransfers.filter(t => t.status === 'Pending').length}
              valueStyle={{ color: 'hsl(var(--warning))' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="ag-card">
            <Statistic
              title="Approved"
              value={userTransfers.filter(t => t.status === 'Approved').length}
              valueStyle={{ color: 'hsl(var(--success))' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="ag-card">
            <Statistic
              title="Rejected"
              value={userTransfers.filter(t => t.status === 'Rejected').length}
              valueStyle={{ color: 'hsl(var(--error))' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="ag-card">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12} lg={8}>
            <Input
              placeholder="Search transfers..."
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
              <Option value="Rejected">Rejected</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Transfers Table */}
      <Card className="ag-card">
        <Table
          columns={columns}
          dataSource={filteredTransfers}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} transfers`
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Transfer Request Modal */}
      <Modal
        title="Request Stock Transfer"
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        width={600}
        okText="Submit Request"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="productId"
            label="Product"
            rules={[{ required: true, message: 'Please select product!' }]}
          >
            <Select 
              placeholder="Select product"
              onChange={(value) => {
                // Reset quantity when product changes
                form.setFieldValue('quantity', undefined);
              }}
            >
              {products.map(product => (
                <Option key={product.id} value={product.id}>
                  {product.name} ({product.category})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="fromShowroomId"
                label="From Showroom"
                rules={[{ required: true, message: 'Please select source showroom!' }]}
              >
                <Select 
                  placeholder="Select source showroom"
                  onChange={() => form.setFieldValue('quantity', undefined)}
                >
                  {showrooms.map(showroom => (
                    <Option key={showroom.id} value={showroom.id}>
                      {showroom.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="toShowroomId"
                label="To Showroom"
                rules={[
                  { required: true, message: 'Please select destination showroom!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('fromShowroomId') !== value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Source and destination cannot be the same!'));
                    },
                  }),
                ]}
              >
                <Select placeholder="Select destination showroom">
                  {showrooms.map(showroom => (
                    <Option key={showroom.id} value={showroom.id}>
                      {showroom.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[
              { required: true, message: 'Please input quantity!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const productId = getFieldValue('productId');
                  const fromShowroomId = getFieldValue('fromShowroomId');
                  
                  if (!value || !productId || !fromShowroomId) {
                    return Promise.resolve();
                  }

                  const availableStock = getAvailableStock(productId, fromShowroomId);
                  if (value <= availableStock) {
                    return Promise.resolve();
                  }
                  
                  return Promise.reject(
                    new Error(`Maximum available: ${availableStock} units`)
                  );
                },
              }),
            ]}
          >
            <InputNumber 
              min={1} 
              className="w-full"
              placeholder="Enter quantity to transfer"
            />
          </Form.Item>

          <Form.Item dependencies={['productId', 'fromShowroomId']}>
            {({ getFieldValue }) => {
              const productId = getFieldValue('productId');
              const fromShowroomId = getFieldValue('fromShowroomId');
              
              if (productId && fromShowroomId) {
                const product = products.find(p => p.id === productId);
                const availableStock = getAvailableStock(productId, fromShowroomId);
                
                return (
                  <div className="bg-blue-50 p-3 rounded">
                    <span className="text-sm text-blue-600">
                      Available stock: {availableStock} {product?.unit}
                    </span>
                  </div>
                );
              }
              return null;
            }}
          </Form.Item>

          <Form.Item
            name="notes"
            label="Notes (Optional)"
          >
            <Input.TextArea rows={3} placeholder="Reason for transfer or additional notes..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Transfers;