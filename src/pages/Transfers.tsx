import React, { useState, useEffect } from 'react';
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
  message,
  Spin // Add Spin for loading state
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  CheckOutlined, 
  CloseOutlined,
  SwapOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContexts';

// Static data interfaces (same as before)
interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  stock: Record<string, number>;
}

interface Showroom {
  id: string;
  name: string;
}

interface Transfer {
  id: string;
  productId: string;
  productName: string;
  fromShowroomId: string;
  toShowroomId: string;
  quantity: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  requestedBy: string;
  approvedBy?: string;
  notes?: string;
  createdAt: string;
}

const { Title } = Typography;
const { Option } = Select;

// Static data
const STATIC_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Premium Sofa',
    category: 'Furniture',
    unit: 'pcs',
    stock: { '1': 15, '2': 8 }
  },
  {
    id: '2',
    name: 'Office Chair',
    category: 'Furniture',
    unit: 'pcs',
    stock: { '1': 22, '2': 12 }
  }
];

const STATIC_SHOWROOMS: Showroom[] = [
  { id: '1', name: 'Downtown Showroom' },
  { id: '2', name: 'Mall Showroom' }
];

let staticTransfers: Transfer[] = [
  {
    id: '1',
    productId: '1',
    productName: 'Premium Sofa',
    fromShowroomId: '1',
    toShowroomId: '2',
    quantity: 3,
    status: 'Pending',
    requestedBy: 'John Doe',
    createdAt: '2023-05-15'
  },
  {
    id: '2',
    productId: '2',
    productName: 'Office Chair',
    fromShowroomId: '2',
    toShowroomId: '1',
    quantity: 5,
    status: 'Approved',
    requestedBy: 'Jane Smith',
    approvedBy: 'Admin User',
    createdAt: '2023-05-10'
  }
];

const Transfers: React.FC = () => {
  const { authState, hasPermission } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [transfers, setTransfers] = useState<Transfer[]>(staticTransfers);
  
  // Handle authState initialization
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    // Wait for authState to be initialized
    if (authState !== undefined) {
      setAuthReady(true);
    }
  }, [authState]);

  // Show loading spinner while auth initializes
  // if (!authReady) {
  //   return (
  //     <div className="flex justify-center items-center h-64">
  //       <Spin size="large" />
  //     </div>
  //   );
  // }

  // Safe access to auth properties with fallbacks
  const userRole = authState?.user?.role;
  const userShowroomId = authState?.showroomId;
  const userName = authState?.user?.name || 'Unknown';

  // Filter transfers based on user role
  const userTransfers = userRole === 'Admin' 
    ? transfers 
    : transfers.filter(transfer => 
        transfer.fromShowroomId === userShowroomId || 
        transfer.toShowroomId === userShowroomId
      );

  const filteredTransfers = userTransfers.filter(transfer => {
    const product = STATIC_PRODUCTS.find(p => p.id === transfer.productId);
    const fromShowroom = STATIC_SHOWROOMS.find(s => s.id === transfer.fromShowroomId);
    const toShowroom = STATIC_SHOWROOMS.find(s => s.id === transfer.toShowroomId);
    
    const matchesSearch = transfer.productName.toLowerCase().includes(searchText.toLowerCase()) ||
                         fromShowroom?.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         toShowroom?.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = !statusFilter || transfer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Static functions (same as before)
  const addTransfer = (transferData: Omit<Transfer, 'id' | 'createdAt'>) => {
    const newTransfer: Transfer = {
      ...transferData,
      id: `transfer-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    staticTransfers = [...staticTransfers, newTransfer];
    setTransfers([...staticTransfers]);
    message.success('Transfer request submitted successfully!');
  };

  const approveTransfer = (transferId: string, approvedBy: string) => {
    staticTransfers = staticTransfers.map(transfer => 
      transfer.id === transferId 
        ? { ...transfer, status: 'Approved', approvedBy } 
        : transfer
    );
    setTransfers([...staticTransfers]);
    message.success('Transfer approved successfully!');
  };

  const rejectTransfer = (transferId: string, approvedBy: string) => {
    staticTransfers = staticTransfers.map(transfer => 
      transfer.id === transferId 
        ? { ...transfer, status: 'Rejected', approvedBy } 
        : transfer
    );
    setTransfers([...staticTransfers]);
    message.success('Transfer rejected successfully!');
  };

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
        const fromShowroom = STATIC_SHOWROOMS.find(s => s.id === record.fromShowroomId);
        const toShowroom = STATIC_SHOWROOMS.find(s => s.id === record.toShowroomId);
        
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
        const product = STATIC_PRODUCTS.find(p => p.id === record.productId);
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
            onClick={() => handleApprove(record.id)}
          >
            Approve
          </Button>
          <Button
            icon={<CloseOutlined />}
            size="small"
            danger
            onClick={() => handleReject(record.id)}
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
    approveTransfer(transferId, userName);
  };

  const handleReject = (transferId: string) => {
    rejectTransfer(transferId, userName);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const product = STATIC_PRODUCTS.find(p => p.id === values.productId);
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
        requestedBy: userName,
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
    const product = STATIC_PRODUCTS.find(p => p.id === productId);
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
        style={{
          position:"relative",
          top:15
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
                form.setFieldValue('quantity', undefined);
              }}
            >
              {STATIC_PRODUCTS.map(product => (
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
                  {STATIC_SHOWROOMS.map(showroom => (
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
                  {STATIC_SHOWROOMS.map(showroom => (
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
                const product = STATIC_PRODUCTS.find(p => p.id === productId);
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


// import React, { useState } from 'react';
// import { 
//   Table, 
//   Button, 
//   Input, 
//   Select, 
//   Space, 
//   Typography, 
//   Card, 
//   Tag, 
//   Modal, 
//   Form, 
//   InputNumber,
//   Row,
//   Col,
//   Statistic,
//   message
// } from 'antd';
// import { 
//   PlusOutlined, 
//   SearchOutlined, 
//   CheckOutlined, 
//   CloseOutlined,
//   SwapOutlined,
//   ArrowRightOutlined
// } from '@ant-design/icons';
// import { useData, Transfer } from '../context/DataContext';
// import { useAuth } from '../context/AuthContexts';

// const { Title } = Typography;
// const { Option } = Select;

// const Transfers: React.FC = () => {
//   const { 
//     transfers, 
//     addTransfer, 
//     approveTransfer, 
//     rejectTransfer,
//     products,
//     showrooms 
//   } = useData();
//   const { authState, hasPermission } = useAuth();
//   const [searchText, setSearchText] = useState('');
//   const [statusFilter, setStatusFilter] = useState<string>('');
//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const [form] = Form.useForm();

//   // Filter transfers based on user role
//   const userTransfers = authState.user?.role === 'Admin' 
//     ? transfers 
//     : transfers.filter(transfer => 
//         transfer.fromShowroomId === authState.showroomId || 
//         transfer.toShowroomId === authState.showroomId
//       );

//   const filteredTransfers = userTransfers.filter(transfer => {
//     const product = products.find(p => p.id === transfer.productId);
//     const fromShowroom = showrooms.find(s => s.id === transfer.fromShowroomId);
//     const toShowroom = showrooms.find(s => s.id === transfer.toShowroomId);
    
//     const matchesSearch = transfer.productName.toLowerCase().includes(searchText.toLowerCase()) ||
//                          fromShowroom?.name.toLowerCase().includes(searchText.toLowerCase()) ||
//                          toShowroom?.name.toLowerCase().includes(searchText.toLowerCase());
//     const matchesStatus = !statusFilter || transfer.status === statusFilter;
//     return matchesSearch && matchesStatus;
//   });

//   const columns = [
//     {
//       title: 'Product',
//       dataIndex: 'productName',
//       key: 'productName',
//       width: 200,
//       render: (text: string) => <span className="font-medium">{text}</span>
//     },
//     {
//       title: 'Transfer Route',
//       key: 'route',
//       render: (_, record: Transfer) => {
//         const fromShowroom = showrooms.find(s => s.id === record.fromShowroomId);
//         const toShowroom = showrooms.find(s => s.id === record.toShowroomId);
        
//         return (
//           <div className="flex items-center space-x-2">
//             <span className="text-sm">{fromShowroom?.name}</span>
//             <ArrowRightOutlined className="text-gray-400" />
//             <span className="text-sm">{toShowroom?.name}</span>
//           </div>
//         );
//       },
//       width: 250
//     },
//     {
//       title: 'Quantity',
//       dataIndex: 'quantity',
//       key: 'quantity',
//       render: (quantity: number, record: Transfer) => {
//         const product = products.find(p => p.id === record.productId);
//         return `${quantity} ${product?.unit || 'units'}`;
//       },
//       width: 100
//     },
//     {
//       title: 'Status',
//       dataIndex: 'status',
//       key: 'status',
//       render: (status: string) => {
//         const color = status === 'Approved' ? 'green' : 
//                      status === 'Rejected' ? 'red' : 'orange';
//         return <Tag color={color}>{status}</Tag>;
//       },
//       width: 100
//     },
//     {
//       title: 'Requested By',
//       dataIndex: 'requestedBy',
//       key: 'requestedBy',
//       width: 120
//     },
//     {
//       title: 'Date',
//       dataIndex: 'createdAt',
//       key: 'createdAt',
//       render: (date: string) => new Date(date).toLocaleDateString('en-IN'),
//       width: 100
//     },
//    {
//   title: 'Actions',
//   key: 'actions',
//   render: (_: any, record: Transfer) => (
//     <Space>
//       {record.status === 'Pending' && hasPermission('manage_transfers', { toShowroomId: record.toShowroomId }) && (
//         <>
//           <Button
//             icon={<CheckOutlined />}
//             size="small"
//             type="primary"
//             onClick={() => handleApprove(record.id, record)}
//           >
//             Approve
//           </Button>
//           <Button
//             icon={<CloseOutlined />}
//             size="small"
//             danger
//             onClick={() => handleReject(record.id, record)}
//           >
//             Reject
//           </Button>
//         </>
//       )}
//       {record.status !== 'Pending' && (
//         <span className="text-sm text-gray-500">
//           {record.status} by {record.approvedBy || 'N/A'}
//         </span>
//       )}
//     </Space>
//   ),
//   width: 200
// }
//   ];

//   const handleApprove = (transferId: string) => {
//     approveTransfer(transferId, authState.user?.name || 'Admin');
//   };

//   const handleReject = (transferId: string) => {
//     rejectTransfer(transferId, authState.user?.name || 'Admin');
//   };

//   const handleSubmit = async () => {
//     try {
//       const values = await form.validateFields();
      
//       // Check if source showroom has enough stock
//       const product = products.find(p => p.id === values.productId);
//       if (!product) {
//         message.error('Product not found');
//         return;
//       }

//       const sourceStock = product.stock[values.fromShowroomId] || 0;
//       if (sourceStock < values.quantity) {
//         message.error(`Insufficient stock. Available: ${sourceStock} ${product.unit}`);
//         return;
//       }

//       const transferData = {
//         productId: values.productId,
//         productName: product.name,
//         fromShowroomId: values.fromShowroomId,
//         toShowroomId: values.toShowroomId,
//         quantity: values.quantity,
//         status: 'Pending' as const,
//         requestedBy: authState.user?.name || 'Unknown',
//         notes: values.notes
//       };

//       addTransfer(transferData);
//       setIsModalVisible(false);
//       form.resetFields();
//     } catch (error) {
//       console.error('Transfer request failed:', error);
//     }
//   };

//   const getAvailableStock = (productId: string, showroomId: string) => {
//     const product = products.find(p => p.id === productId);
//     return product?.stock[showroomId] || 0;
//   };

//   return (
//     <div className="space-y-6">
//       <div className="flex justify-between items-center">
//         <div>
//           <Title level={2} className="!mb-1">Stock Transfers</Title>
//           <p className="text-gray-600">Manage inventory transfers between showrooms</p>
//         </div>
//         {hasPermission('request_transfers') && (
//           <Button
//             type="primary"
//             icon={<PlusOutlined />}
//             onClick={() => setIsModalVisible(true)}
//           >
//             Request Transfer
//           </Button>
//         )}
//       </div>

//       {/* Summary Cards */}
//       <Row gutter={[16, 16]}>
//         <Col xs={24} sm={6}>
//           <Card className="ag-card">
//             <Statistic
//               title="Total Transfers"
//               value={userTransfers.length}
//               prefix={<SwapOutlined />}
//               valueStyle={{ color: 'hsl(var(--primary))' }}
//             />
//           </Card>
//         </Col>
//         <Col xs={24} sm={6}>
//           <Card className="ag-card">
//             <Statistic
//               title="Pending"
//               value={userTransfers.filter(t => t.status === 'Pending').length}
//               valueStyle={{ color: 'hsl(var(--warning))' }}
//             />
//           </Card>
//         </Col>
//         <Col xs={24} sm={6}>
//           <Card className="ag-card">
//             <Statistic
//               title="Approved"
//               value={userTransfers.filter(t => t.status === 'Approved').length}
//               valueStyle={{ color: 'hsl(var(--success))' }}
//             />
//           </Card>
//         </Col>
//         <Col xs={24} sm={6}>
//           <Card className="ag-card">
//             <Statistic
//               title="Rejected"
//               value={userTransfers.filter(t => t.status === 'Rejected').length}
//               valueStyle={{ color: 'hsl(var(--error))' }}
//             />
//           </Card>
//         </Col>
//       </Row>

//       {/* Filters */}
//       <Card className="ag-card">
//         <Row gutter={[16, 16]}>
//           <Col xs={24} md={12} lg={8}>
//             <Input
//               placeholder="Search transfers..."
//               prefix={<SearchOutlined />}
//               value={searchText}
//               onChange={(e) => setSearchText(e.target.value)}
//               allowClear
//             />
//           </Col>
//           <Col xs={24} md={12} lg={8}>
//             <Select
//               placeholder="Filter by status"
//               value={statusFilter}
//               onChange={setStatusFilter}
//               allowClear
//               className="w-full"
//             >
//               <Option value="Pending">Pending</Option>
//               <Option value="Approved">Approved</Option>
//               <Option value="Rejected">Rejected</Option>
//             </Select>
//           </Col>
//         </Row>
//       </Card>

//       {/* Transfers Table */}
//       <Card className="ag-card">
//         <Table
//           columns={columns}
//           dataSource={filteredTransfers}
//           rowKey="id"
//           pagination={{
//             pageSize: 10,
//             showSizeChanger: true,
//             showTotal: (total) => `Total ${total} transfers`
//           }}
//           scroll={{ x: 1000 }}
//         />
//       </Card>

//       {/* Transfer Request Modal */}
//       <Modal
//         title="Request Stock Transfer"
//         open={isModalVisible}
//         onOk={handleSubmit}
//         onCancel={() => {
//           setIsModalVisible(false);
//           form.resetFields();
//         }}
//         width={600}
//         okText="Submit Request"
//       >
//         <Form form={form} layout="vertical">
//           <Form.Item
//             name="productId"
//             label="Product"
//             rules={[{ required: true, message: 'Please select product!' }]}
//           >
//             <Select 
//               placeholder="Select product"
//               onChange={(value) => {
//                 // Reset quantity when product changes
//                 form.setFieldValue('quantity', undefined);
//               }}
//             >
//               {products.map(product => (
//                 <Option key={product.id} value={product.id}>
//                   {product.name} ({product.category})
//                 </Option>
//               ))}
//             </Select>
//           </Form.Item>

//           <Row gutter={[16, 16]}>
//             <Col xs={24} md={12}>
//               <Form.Item
//                 name="fromShowroomId"
//                 label="From Showroom"
//                 rules={[{ required: true, message: 'Please select source showroom!' }]}
//               >
//                 <Select 
//                   placeholder="Select source showroom"
//                   onChange={() => form.setFieldValue('quantity', undefined)}
//                 >
//                   {showrooms.map(showroom => (
//                     <Option key={showroom.id} value={showroom.id}>
//                       {showroom.name}
//                     </Option>
//                   ))}
//                 </Select>
//               </Form.Item>
//             </Col>
//             <Col xs={24} md={12}>
//               <Form.Item
//                 name="toShowroomId"
//                 label="To Showroom"
//                 rules={[
//                   { required: true, message: 'Please select destination showroom!' },
//                   ({ getFieldValue }) => ({
//                     validator(_, value) {
//                       if (!value || getFieldValue('fromShowroomId') !== value) {
//                         return Promise.resolve();
//                       }
//                       return Promise.reject(new Error('Source and destination cannot be the same!'));
//                     },
//                   }),
//                 ]}
//               >
//                 <Select placeholder="Select destination showroom">
//                   {showrooms.map(showroom => (
//                     <Option key={showroom.id} value={showroom.id}>
//                       {showroom.name}
//                     </Option>
//                   ))}
//                 </Select>
//               </Form.Item>
//             </Col>
//           </Row>

//           <Form.Item
//             name="quantity"
//             label="Quantity"
//             rules={[
//               { required: true, message: 'Please input quantity!' },
//               ({ getFieldValue }) => ({
//                 validator(_, value) {
//                   const productId = getFieldValue('productId');
//                   const fromShowroomId = getFieldValue('fromShowroomId');
                  
//                   if (!value || !productId || !fromShowroomId) {
//                     return Promise.resolve();
//                   }

//                   const availableStock = getAvailableStock(productId, fromShowroomId);
//                   if (value <= availableStock) {
//                     return Promise.resolve();
//                   }
                  
//                   return Promise.reject(
//                     new Error(`Maximum available: ${availableStock} units`)
//                   );
//                 },
//               }),
//             ]}
//           >
//             <InputNumber 
//               min={1} 
//               className="w-full"
//               placeholder="Enter quantity to transfer"
//             />
//           </Form.Item>

//           <Form.Item dependencies={['productId', 'fromShowroomId']}>
//             {({ getFieldValue }) => {
//               const productId = getFieldValue('productId');
//               const fromShowroomId = getFieldValue('fromShowroomId');
              
//               if (productId && fromShowroomId) {
//                 const product = products.find(p => p.id === productId);
//                 const availableStock = getAvailableStock(productId, fromShowroomId);
                
//                 return (
//                   <div className="bg-blue-50 p-3 rounded">
//                     <span className="text-sm text-blue-600">
//                       Available stock: {availableStock} {product?.unit}
//                     </span>
//                   </div>
//                 );
//               }
//               return null;
//             }}
//           </Form.Item>

//           <Form.Item
//             name="notes"
//             label="Notes (Optional)"
//           >
//             <Input.TextArea rows={3} placeholder="Reason for transfer or additional notes..." />
//           </Form.Item>
//         </Form>
//       </Modal>
//     </div>
//   );
// };

// export default Transfers;