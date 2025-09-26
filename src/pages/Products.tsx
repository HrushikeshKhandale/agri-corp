import React, { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Row,
  Col,
  Table,
  Segmented,
  Statistic,
} from 'antd';
import { Product, useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { EditOutlined, DeleteOutlined, ShoppingCartOutlined, ProductOutlined } from '@ant-design/icons';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/card';
import { Button, buttonVariants } from '../components/ui/button';

const { Option } = Select;

const Products: React.FC = () => {
  const { orders, 
    addOrder, 
    updateOrder,products, showrooms, addProduct, updateProduct, deleteProduct } = useData();
  const { authState, hasPermission } = useAuth();
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [searchText, setSearchText] = useState('');

  const [statusFilter, setStatusFilter] = useState<string>('');



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
  



  // filter products
  const filteredProducts = products.filter(p =>
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (!selectedCategory || p.category === selectedCategory) &&
    (authState.role !== 'Super Admin'
      ? p.stock[authState.showroomId || ''] > 0
      : true)
  );

  // submit handler
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const stockPayload = authState.role === 'Super Admin'
        ? { [values.showroomId]: values.stock }
        : { [authState.showroomId || '']: values.stock };
      const payload = {
        name: values.name,
        category: values.category,
        unit: values.unit,
        price: values.price,
        gst: values.gst,
        image: values.image,
        description: values.description,
        companyName: values.companyName,
        type: values.type,
        subtype: values.subtype,
        inwardPrice: values.inwardPrice,
        discount: values.discount,
        stock: stockPayload,
      };
      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        message.success('Product updated successfully!');
      } else {
        await addProduct(
          payload,
          authState.role === 'Super Admin'
            ? values.showroomId
            : authState.showroomId || ''
        );
        message.success('Product added successfully!');
      }
      form.resetFields();
      setEditingProduct(null);
      setIsModalVisible(false);
    } catch {
      message.error('Failed to save product. Please review inputs.');
    }
  };

  // columns for list view
  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Category', dataIndex: 'category', key: 'category' },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (val: number) => `₹${val.toFixed(2)}`,
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
      render: (_: any, record: Product) =>
        authState.role === 'Super Admin'
          ? Object.entries(record.stock)
              .map(([id, qty]) => {
                const sr = showrooms.find(s => s.id === id);
                return `${sr?.name || 'Unknown'}: ${qty}`;
              })
              .join(', ')
          : record.stock[authState.showroomId || ''] || 0,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Product) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingProduct(record);
              form.setFieldsValue({
                ...record,
                stock: authState.role === 'Super Admin'
                  ? undefined
                  : record.stock[authState.showroomId || ''],
                showroomId: authState.role === 'Super Admin'
                  ? undefined
                  : authState.showroomId,
              });
              setIsModalVisible(true);
            }}
            disabled={!hasPermission('manage_products')}
          >
            <EditOutlined />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => deleteProduct(record.id)}
            disabled={!hasPermission('manage_products')}
          >
            <DeleteOutlined />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
         
    <Card className="p-6" style={{ maxWidth: 1200, margin: 'auto' }}>
<div className='p-2 justify-center align-center text-center'>
   {/* Summary Cards */}
      <Row gutter={[16, 16]} className="mb-6">
  <Col xs={24} sm={6}>
    <Card className="ag-card">
      <Statistic
        title="Total Products"
        value={products.length}
        prefix={<ProductOutlined />}
        valueStyle={{ color: 'hsl(var(--primary))' }}
      />
    </Card>
  </Col>
{/* 
  <Col xs={24} sm={6}>
    <Card className="ag-card">
      <Statistic
        title="Filtered Products"
        value={filteredProducts.length}
        valueStyle={{ color: 'hsl(var(--accent))' }}
      />
    </Card>
  </Col> */}

  <Col xs={24} sm={6}>
    <Card className="ag-card">
      <Statistic
        title="Out of Stock"
        value={
          authState.role === 'Super Admin'
            ? products.filter(p =>
                Object.values(p.stock).every(qty => qty === 0)
              ).length
            : products.filter(p => (p.stock[authState.showroomId || ''] || 0) === 0).length
        }
        valueStyle={{ color: 'hsl(var(--destructive))' }}
      />
    </Card>
  </Col>

  <Col xs={24} sm={6}>
    <Card className="ag-card">
      <Statistic
        title="Total Stock"
        value={
          authState.role === 'Super Admin'
            ? products.reduce(
                (sum, p) =>
                  sum + Object.values(p.stock).reduce((s, qty) => s + qty, 0),
                0
              )
            : products.reduce(
                (sum, p) => sum + (p.stock[authState.showroomId || ''] || 0),
                0
              )
        }
        valueStyle={{ color: 'hsl(var(--info))' }}
      />
    </Card>
  </Col>

  <Col xs={24} sm={6}>
    <Card className="ag-card">
      <Statistic
        title="Total Categories"
        value={[...new Set(products.map(p => p.category))].length}
        valueStyle={{ color: 'hsl(var(--secondary))' }}
      />
    </Card>
  </Col>

  {/* <Col xs={24} sm={6}>
    <Card className="ag-card">
      <Statistic
        title="Pending Orders"
        value={userOrders.filter(o => o.status === 'Pending').length}
        valueStyle={{ color: 'hsl(var(--warning))' }}
      />
    </Card>
  </Col>

  <Col xs={24} sm={6}>
    <Card className="ag-card">
      <Statistic
        title="Delivered Orders"
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
  </Col>*/}
</Row>

</div>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
          <h3 className="text-2xl font-semibold">Products Management</h3>
      

              <div className="flex items-center gap-2">
            {/* AntD Segmented toggle */}
            <Segmented
              options={[
                { label: 'Card View', value: 'card' },
                { label: 'List View', value: 'list' },
              ]}
              value={viewMode}
              onChange={val => setViewMode(val as 'card' | 'list')}
            />
           <Button
              variant="default"
              onClick={() => {
                setEditingProduct(null);
                form.resetFields();
                setIsModalVisible(true);
              }}
              disabled={!hasPermission('manage_products')}
            >
              Add Product
            </Button>
          </div>
        </div>
      </CardHeader>


      <CardContent>
        {/* filters */}
        <Row gutter={16} className="mb-6">
          <Col xs={24} sm={12} md={6}>
            <Input
              allowClear
              placeholder="Search by name or description"
              onChange={e => setSearchQuery(e.target.value)}
              size="large"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              allowClear
              placeholder="Filter by category"
              onChange={setSelectedCategory}
              style={{ width: '100%' }}
              size="large"
              showSearch
              optionFilterProp="children"
            >
              <Option value="Seeds">Seeds</Option>
              <Option value="Fertilizer">Fertilizer</Option>
              <Option value="Pesticide">Pesticide</Option>
              <Option value="Equipment">Equipment</Option>
            </Select>
          </Col>
        </Row>
        {/* view switch */}
        {viewMode === 'card' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map(product => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <h4 className="text-lg font-medium">{product.name}</h4>
                  <p className="text-sm text-gray-600">Category: {product.category}</p>
                  <p className="text-sm text-gray-600">Price: ₹{product.price.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">
                    Stock: {authState.role === 'Super Admin'
                      ? Object.entries(product.stock)
                          .map(([id, qty]) => {
                            const sr = showrooms.find(s => s.id === id);
                            return `${sr?.name || 'Unknown'}: ${qty}`;
                          })
                          .join(', ')
                      : product.stock[authState.showroomId || ''] || 0}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 p-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingProduct(product);
                      form.setFieldsValue({
                        ...product,
                        stock: authState.role === 'Super Admin'
                          ? undefined
                          : product.stock[authState.showroomId || ''],
                        showroomId: authState.role === 'Super Admin'
                          ? undefined
                          : authState.showroomId,
                      });
                      setIsModalVisible(true);
                    }}
                    disabled={!hasPermission('manage_products')}
                  >
                    <EditOutlined /> Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteProduct(product.id)}
                    disabled={!hasPermission('manage_products')}
                  >
                    <DeleteOutlined /> Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredProducts}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        )}
      </CardContent>

      {/* modal form */}
      <Modal
        width={900}
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        okText={editingProduct ? 'Update' : 'Create'}
        okButtonProps={{ className: buttonVariants({ variant: 'primary' }) }}
        cancelButtonProps={{ className: buttonVariants({ variant: 'outline' }) }}
        bodyStyle={{ maxHeight: '70vh', overflowY: 'auto', paddingBottom: 24 }}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label="Name"
                rules={[{ required: true, message: 'Please input product name!' }]}
              >
                <Input placeholder="Product Name" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: 'Please select a category!' }]}
              >
                <Select placeholder="Select category">
                  <Option value="Seeds">Seeds</Option>
                  <Option value="Fertilizer">Fertilizer</Option>
                  <Option value="Pesticide">Pesticide</Option>
                  <Option value="Equipment">Equipment</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="unit"
                label="Unit"
                rules={[{ required: true, message: 'Please select unit!' }]}
              >
                <Select placeholder="Select unit">
                  <Option value="Kg">Kg</Option>
                  <Option value="Liter">Liter</Option>
                  <Option value="Packet">Packet</Option>
                  <Option value="Piece">Piece</Option>
                  <Option value="Box">Box</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="price"
                label="Price"
                rules={[{ required: true, message: 'Please input price!' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="Price"
                  formatter={val => val ? `₹ ${val}` : ''}
                  parser={val => val?.replace(/₹\s?|(,*)/g, '') || ''}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="gst"
                label="GST (%)"
                rules={[{ required: true, message: 'Please select GST!' }]}
              >
                <Select placeholder="Select GST">
                  <Option value={0}>0%</Option>
                  <Option value={5}>5%</Option>
                  <Option value={12}>12%</Option>
                  <Option value={18}>18%</Option>
                  <Option value={28}>28%</Option>
                </Select>
              </Form.Item>
            </Col>
            {authState.role === 'Super Admin' && (
              <Col xs={24} md={12}>
                <Form.Item
                  name="showroomId"
                  label="Showroom"
                  rules={[{ required: true, message: 'Please select a showroom!' }]}
                >
                  <Select placeholder="Select showroom">
                    {showrooms.map(s => (
                      <Option key={s.id} value={s.id}>{s.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            )}
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="stock"
                label="Stock"
                rules={[{ required: true, message: 'Please input stock!' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="Quantity in stock" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="image" label="Image URL">
                <Input placeholder="http://example.com/image.jpg" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="description" label="Description">
                <Input.TextArea rows={4} placeholder="Product description" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="companyName"
                label="Company Name"
                rules={[{ required: true, message: 'Please select a company!' }]}
              >
                <Select placeholder="Select company">
                  <Option value="AgriCorp">AgriCorp</Option>
                  <Option value="GreenFields">GreenFields</Option>
                  <Option value="FarmTech">FarmTech</Option>
                  <Option value="BioGrow">BioGrow</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="type"
                label="Type"
                rules={[{ required: true, message: 'Please select a type!' }]}
              >
                <Select placeholder="Select type">
                  <Option value="Standard">Standard</Option>
                  <Option value="Premium">Premium</Option>
                  <Option value="Organic">Organic</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="subtype"
                label="Subtype"
                rules={[{ required: true, message: 'Please select a subtype!' }]}
              >
                <Select placeholder="Select subtype">
                  <Option value="Basic">Basic</Option>
                  <Option value="Advanced">Advanced</Option>
                  <Option value="Special">Special</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="inwardPrice" label="Inward Price">
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="Purchase price"
                  formatter={val => val ? `₹ ${val}` : ''}
                  parser={val => val?.replace(/₹\s?|(,*)/g, '') || ''}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="discount" label="Discount (%)">
                <Select placeholder="Select discount">
                  <Option value={0}>0%</Option>
                  <Option value={5}>5%</Option>
                  <Option value={10}>10%</Option>
                  <Option value={15}>15%</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Card>
    </>
  );
};

export default Products;


// import React, { useState } from 'react';
// import {
//   Table,
//   Button,
//   Modal,
//   Form,
//   Input,
//   Select,
//   InputNumber,
//   message,
//   Row,
//   Col,
//   Typography,
//   Card,
//   Space,
// } from 'antd';
// import { Product, useData } from '../context/DataContext';
// import { useAuth } from '../context/AuthContext';

// const { Option } = Select;
// const { Title } = Typography;

// const Products: React.FC = () => {
//   const { products, showrooms, addProduct, updateProduct, deleteProduct } = useData();
//   const { authState, hasPermission } = useAuth();
//   const [form] = Form.useForm();
//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const [editingProduct, setEditingProduct] = useState<Product | null>(null);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);

//   const filteredProducts = products.filter(
//     (product) =>
//       (product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         product.description?.toLowerCase().includes(searchQuery.toLowerCase())) &&
//       (!selectedCategory || product.category === selectedCategory) &&
//       (authState.role !== 'Super Admin' ? product.stock[authState.showroomId || ''] > 0 : true)
//   );

//   const columns = [
//     { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
//     { title: 'Category', dataIndex: 'category', key: 'category', sorter: (a, b) => a.category.localeCompare(b.category) },
//     { title: 'Unit', dataIndex: 'unit', key: 'unit' },
//     {
//       title: 'Price',
//       dataIndex: 'price',
//       key: 'price',
//       sorter: (a, b) => a.price - b.price,
//       render: (price: number) => `₹${price.toFixed(2)}`,
//     },
//     {
//       title: 'GST (%)',
//       dataIndex: 'gst',
//       key: 'gst',
//       render: (gst: number) => `${gst}%`,
//     },
//     {
//       title: 'Stock',
//       dataIndex: 'stock',
//       key: 'stock',
//       render: (stock: Record<string, number>) =>
//         authState.role === 'Super Admin'
//           ? Object.entries(stock)
//               .map(([showroomId, qty]) => {
//                 const showroom = showrooms.find((s) => s.id === showroomId);
//                 return `${showroom?.name || 'Unknown'}: ${qty}`;
//               })
//               .join(', ')
//           : stock[authState.showroomId || ''] || 0,
//     },
//     {
//       title: 'Actions',
//       key: 'actions',
//       fixed: 'right' as const,
//       width: 140,
//       render: (_: any, record: Product) => (
//         <Space>
//           <Button
//             type="primary"
//             onClick={() => {
//               setEditingProduct(record);
//               form.setFieldsValue({
//                 ...record,
//                 stock: authState.role === 'Super Admin' ? undefined : record.stock[authState.showroomId || ''],
//                 showroomId: authState.role === 'Super Admin' ? undefined : authState.showroomId,
//               });
//               setIsModalVisible(true);
//             }}
//             disabled={!hasPermission('manage_products')}
//             size="small"
//           >
//             Edit
//           </Button>
//           <Button
//             danger
//             onClick={() => deleteProduct(record.id)}
//             disabled={!hasPermission('manage_products')}
//             size="small"
//           >
//             Delete
//           </Button>
//         </Space>
//       ),
//     },
//   ];

//   const handleSubmit = async () => {
//     try {
//       const values = await form.validateFields();
//       const stock =
//         authState.role === 'Super Admin'
//           ? { [values.showroomId]: values.stock }
//           : { [authState.showroomId || '']: values.stock };
//       const productData = {
//         name: values.name,
//         category: values.category,
//         unit: values.unit,
//         price: values.price,
//         gst: values.gst,
//         image: values.image,
//         description: values.description,
//         companyName: values.companyName,
//         type: values.type,
//         subtype: values.subtype,
//         inwardPrice: values.inwardPrice,
//         discount: values.discount,
//         stock,
//       };

//       if (editingProduct) {
//         await updateProduct(editingProduct.id, productData);
//         message.success('Product updated successfully!');
//       } else {
//         await addProduct(productData, authState.role === 'Super Admin' ? values.showroomId : authState.showroomId || '');
//         message.success('Product added successfully!');
//       }
//       setIsModalVisible(false);
//       form.resetFields();
//       setEditingProduct(null);
//     } catch (error) {
//       message.error('Failed to save product. Please check the inputs.');
//     }
//   };

//   return (
//     <div className="p-6" style={{ maxWidth: 1200, margin: 'auto' }}>
//       <Card
//         bordered={false}
//         style={{ marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
//       >
//         <Title level={3} style={{ marginBottom: 16 }}>
//           Products Management
//         </Title>
//         <Row gutter={16} style={{ marginBottom: 24 }}>
//           <Col xs={24} sm={12} md={8}>
//             <Input
//               allowClear
//               placeholder="Search by name or description"
//               onChange={(e) => setSearchQuery(e.target.value)}
//               size="large"
//             />
//           </Col>
//           <Col xs={24} sm={12} md={8}>
//             <Select
//               allowClear
//               placeholder="Filter by category"
//               onChange={setSelectedCategory}
//               style={{ width: '100%' }}
//               size="large"
//             >
//               <Option value="Seeds">Seeds</Option>
//               <Option value="Fertilizer">Fertilizer</Option>
//               <Option value="Pesticide">Pesticide</Option>
//               <Option value="Equipment">Equipment</Option>
//             </Select>
//           </Col>
//           <Col xs={24} sm={24} md={8} style={{ textAlign: 'right' }}>
//             <Button
//               type="primary"
//               onClick={() => {
//                 setEditingProduct(null);
//                 form.resetFields();
//                 setIsModalVisible(true);
//               }}
//               disabled={!hasPermission('manage_products')}
//               size="large"
//             >
//               Add Product
//             </Button>
//           </Col>
//         </Row>

//         <Table
//           dataSource={filteredProducts}
//           columns={columns}
//           rowKey="id"
//           pagination={{ pageSize: 10, showSizeChanger: true }}
//           bordered
//           scroll={{ x: 'max-content' }}
//           size="middle"
//           rowClassName={(_, index) => (index % 2 === 0 ? 'ant-table-row-light' : '')}
//           // Adds striped rows style, you may define .ant-table-row-light in your CSS
//           // or use AntD built-in styles (less custom)
//         />
//       </Card>

//       <Modal
//         width={900}
//         title={editingProduct ? 'Edit Product' : 'Add Product'}
//         open={isModalVisible}
//         onOk={handleSubmit}
//         onCancel={() => setIsModalVisible(false)}
//         okText={editingProduct ? 'Update' : 'Create'}
//         bodyStyle={{ maxHeight: '70vh', overflowY: 'auto', paddingBottom: 24 }}
//         destroyOnClose
//       >
//         <Form form={form} layout="vertical">
//           <Row gutter={16}>
//             <Col xs={24} md={12}>
//               <Form.Item
//                 name="name"
//                 label="Name"
//                 rules={[{ required: true, message: 'Please input product name!' }]}
//               >
//                 <Input placeholder="Product Name" />
//               </Form.Item>
//             </Col>
//             <Col xs={24} md={12}>
//               <Form.Item
//                 name="category"
//                 label="Category"
//                 rules={[{ required: true, message: 'Please select a category!' }]}
//               >
//                 <Select placeholder="Select category">
//                   <Option value="Seeds">Seeds</Option>
//                   <Option value="Fertilizer">Fertilizer</Option>
//                   <Option value="Pesticide">Pesticide</Option>
//                   <Option value="Equipment">Equipment</Option>
//                 </Select>
//               </Form.Item>
//             </Col>
//           </Row>

//           <Row gutter={16}>
//             <Col xs={24} md={12}>
//                <Form.Item
//       name="unit"
//       label="Unit"
//       rules={[{ required: true, message: 'Please select unit!' }]}
//     >
//       <Select placeholder="Select unit">
//         <Option value="Kg">Kg</Option>
//         <Option value="Liter">Liter</Option>
//         <Option value="Packet">Packet</Option>
//         <Option value="Piece">Piece</Option>
//         <Option value="Box">Box</Option>
//       </Select>
//     </Form.Item>
//             </Col>
//             <Col xs={24} md={12}>
//               <Form.Item
//                 name="price"
//                 label="Price"
//                 rules={[{ required: true, message: 'Please input price!' }]}
//               >
//                 <InputNumber
//                   min={0}
//                   style={{ width: '100%' }}
//                   placeholder="Price"
//                   formatter={(value) => (value ? `₹ ${value}` : '')}
//                   parser={(value) => value?.replace(/₹\s?|(,*)/g, '') || ''}
//                 />
//               </Form.Item>
//             </Col>
//           </Row>

//           <Row gutter={16}>
//             <Col xs={24} md={12}>
//               <Form.Item
//                 name="gst"
//                 label="GST (%)"
//                 rules={[{ required: true, message: 'Please input GST!' }]}
//               >
//                 <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="GST %" />
//               </Form.Item>
//             </Col>

//             {authState.role === 'Super Admin' && (
//               <Col xs={24} md={12}>
//                 <Form.Item
//                   name="showroomId"
//                   label="Showroom"
//                   rules={[{ required: true, message: 'Please select a showroom!' }]}
//                 >
//                   <Select placeholder="Select showroom">
//                     {showrooms.map((showroom) => (
//                       <Option key={showroom.id} value={showroom.id}>
//                         {showroom.name}
//                       </Option>
//                     ))}
//                   </Select>
//                 </Form.Item>
//               </Col>
//             )}
//           </Row>

//           <Row gutter={16}>
//             <Col xs={24} md={12}>
//               <Form.Item
//                 name="stock"
//                 label="Stock"
//                 rules={[{ required: true, message: 'Please input stock!' }]}
//               >
//                 <InputNumber min={0} style={{ width: '100%' }} placeholder="Quantity in stock" />
//               </Form.Item>
//             </Col>
//             <Col xs={24} md={12}>
//               <Form.Item name="image" label="Image URL">
//                 <Input placeholder="http://example.com/image.jpg" />
//               </Form.Item>
//             </Col>
//           </Row>

//           <Row gutter={16}>
//             <Col xs={24} md={12}>
//               <Form.Item name="description" label="Description">
//                 <Input.TextArea rows={4} placeholder="Product description" />
//               </Form.Item>
//             </Col>
//             <Col xs={24} md={12}>
//               <Form.Item name="companyName" label="Company Name">
//                 <Input placeholder="Company name" />
//               </Form.Item>
//             </Col>
//           </Row>

//           <Row gutter={16}>
//             <Col xs={24} md={12}>
//               <Form.Item name="type" label="Type">
//                 <Input placeholder="Type" />
//               </Form.Item>
//             </Col>
//             <Col xs={24} md={12}>
//               <Form.Item name="subtype" label="Subtype">
//                 <Input placeholder="Subtype" />
//               </Form.Item>
//             </Col>
//           </Row>

//           <Row gutter={16}>
//             <Col xs={24} md={12}>
//               <Form.Item name="inwardPrice" label="Inward Price">
//                 <InputNumber
//                   min={0}
//                   style={{ width: '100%' }}
//                   placeholder="Purchase price"
//                   formatter={(value) => (value ? `₹ ${value}` : '')}
//                   parser={(value) => value?.replace(/₹\s?|(,*)/g, '') || ''}
//                 />
//               </Form.Item>
//             </Col>
//             <Col xs={24} md={12}>
//               <Form.Item name="discount" label="Discount (%)">
//                 <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="Discount %" />
//               </Form.Item>
//             </Col>
//           </Row>
//         </Form>
//       </Modal>
//     </div>
//   );
// };

// export default Products;

 
// // import { 
// //   Table, 
// //   Button, 
// //   Input, 
// //   Select, 
// //   Space, 
// //   Typography, 
// //   Card, 
// //   Tag, 
// //   Avatar, 
// //   Modal, 
// //   Form, 
// //   InputNumber, 
// //   Upload,
// //   message,
// //   Popconfirm,
// //   Row,
// //   Col
// // } from 'antd';
// // import { 
// //   PlusOutlined, 
// //   SearchOutlined, 
// //   EditOutlined, 
// //   DeleteOutlined,
// //   UploadOutlined
// // } from '@ant-design/icons';
// // import { useData, Product } from '../context/DataContext';
// // import { useAuth } from '../context/AuthContext';

// // const { Title } = Typography;
// // const { Option } = Select;

// // const Products: React.FC = () => {
// //   const { products, addProduct, updateProduct, deleteProduct, showrooms } = useData();
// //   const { hasPermission } = useAuth();
// //   const [searchText, setSearchText] = useState('');
// //   const [categoryFilter, setCategoryFilter] = useState<string>('');
// //   const [isModalVisible, setIsModalVisible] = useState(false);
// //   const [editingProduct, setEditingProduct] = useState<Product | null>(null);
// //   const [form] = Form.useForm();

// //   // Filter products
// //   const filteredProducts = products.filter(product => {
// //     const matchesSearch = product.name.toLowerCase().includes(searchText.toLowerCase()) ||
// //                          product.description?.toLowerCase().includes(searchText.toLowerCase());
// //     const matchesCategory = !categoryFilter || product.category === categoryFilter;
// //     return matchesSearch && matchesCategory;
// //   });

// //   const columns = [
// //     {
// //       title: 'Product',
// //       key: 'product',
// //       render: (_, record: Product) => (
// //         <div className="flex items-center space-x-3">
// //           <Avatar 
// //             src={record.image} 
// //             shape="square" 
// //             size={48}
// //             className="flex-shrink-0"
// //           />
// //           <div>
// //             <div className="font-medium">{record.name}</div>
// //             <div className="text-sm text-gray-500">{record.description}</div>
// //           </div>
// //         </div>
// //       ),
// //       width: 250
// //     },
// //     {
// //       title: 'Category',
// //       dataIndex: 'category',
// //       key: 'category',
// //       render: (category: string) => (
// //         <Tag className={`category-${category.toLowerCase()}`}>
// //           {category}
// //         </Tag>
// //       ),
// //       width: 120
// //     },
// //     {
// //       title: 'Price',
// //       key: 'price',
// //       render: (_, record: Product) => (
// //         <div>
// //           <div className="font-medium">₹{record.price}/{record.unit}</div>
// //           <div className="text-sm text-gray-500">GST: {record.gst}%</div>
// //         </div>
// //       ),
// //       width: 120
// //     },
// //     {
// //       title: 'Stock by Showroom',
// //       key: 'stock',
// //       render: (_, record: Product) => (
// //         <div className="space-y-1">
// //           {showrooms.map(showroom => {
// //             const stock = record.stock[showroom.id] || 0;
// //             return (
// //               <div key={showroom.id} className="flex justify-between text-sm">
// //                 <span className="text-gray-600">{showroom.name.split(' ')[0]}:</span>
// //                 <Tag color={stock < 10 ? 'red' : stock < 50 ? 'orange' : 'green'}>
// //                   {stock} {record.unit}
// //                 </Tag>
// //               </div>
// //             );
// //           })}
// //         </div>
// //       ),
// //       width: 200
// //     },
// //     {
// //       title: 'Total Stock',
// //       key: 'totalStock',
// //       render: (_, record: Product) => {
// //         const total = Object.values(record.stock).reduce((sum, qty) => sum + qty, 0);
// //         return (
// //           <Tag color={total < 50 ? 'red' : total < 200 ? 'orange' : 'green'}>
// //             {total} {record.unit}
// //           </Tag>
// //         );
// //       },
// //       width: 100
// //     }
// //   ];

// //   if (hasPermission('manage_products')) {
// //     columns.push({
// //       title: 'Actions',
// //       key: 'actions',
// //       render: (_, record: Product) => (
// //         <Space>
// //           <Button
// //             icon={<EditOutlined />}
// //             size="small"
// //             onClick={() => handleEdit(record)}
// //           />
// //           <Popconfirm
// //             title="Are you sure you want to delete this product?"
// //             onConfirm={() => deleteProduct(record.id)}
// //             okText="Yes"
// //             cancelText="No"
// //           >
// //             <Button
// //               icon={<DeleteOutlined />}
// //               size="small"
// //               danger
// //             />
// //           </Popconfirm>
// //         </Space>
// //       ),
// //       width: 100
// //     } as any);
// //   }

// //   const handleEdit = (product: Product) => {
// //     setEditingProduct(product);
// //     form.setFieldsValue({
// //       ...product,
// //       ...Object.fromEntries(
// //         showrooms.map(showroom => [`stock_${showroom.id}`, product.stock[showroom.id] || 0])
// //       )
// //     });
// //     setIsModalVisible(true);
// //   };

// //   const handleAdd = () => {
// //     setEditingProduct(null);
// //     form.resetFields();
// //     form.setFieldsValue({
// //       ...Object.fromEntries(
// //         showrooms.map(showroom => [`stock_${showroom.id}`, 0])
// //       )
// //     });
// //     setIsModalVisible(true);
// //   };

// //   const handleSubmit = async () => {
// //     try {
// //       const values = await form.validateFields();
      
// //       // Extract stock data
// //       const stock: Record<string, number> = {};
// //       showrooms.forEach(showroom => {
// //         stock[showroom.id] = values[`stock_${showroom.id}`] || 0;
// //         delete values[`stock_${showroom.id}`];
// //       });

// //       const productData = {
// //         ...values,
// //         stock
// //       };

// //       if (editingProduct) {
// //         updateProduct(editingProduct.id, productData);
// //       } else {
// //         addProduct(productData);
// //       }
      
// //       setIsModalVisible(false);
// //       form.resetFields();
// //     } catch (error) {
// //       console.error('Validation failed:', error);
// //     }
// //   };

// //   return (
// //     <div className="space-y-6">
// //       <div className="flex justify-between items-center">
// //         <div>
// //           <Title level={2} className="!mb-1">Products</Title>
// //           <p className="text-gray-600">Manage your agriculture product inventory</p>
// //         </div>
// //         {hasPermission('manage_products') && (
// //           <Button
// //             type="primary"
// //             icon={<PlusOutlined />}
// //             onClick={handleAdd}
// //           >
// //             Add Product
// //           </Button>
// //         )}
// //       </div>

// //       {/* Filters */}
// //       <Card className="ag-card">
// //         <Row gutter={[16, 16]}>
// //           <Col xs={24} md={12} lg={8}>
// //             <Input
// //               placeholder="Search products..."
// //               prefix={<SearchOutlined />}
// //               value={searchText}
// //               onChange={(e) => setSearchText(e.target.value)}
// //               allowClear
// //             />
// //           </Col>
// //           <Col xs={24} md={12} lg={8}>
// //             <Select
// //               placeholder="Filter by category"
// //               value={categoryFilter}
// //               onChange={setCategoryFilter}
// //               allowClear
// //               className="w-full"
// //             >
// //               <Option value="Seeds">Seeds</Option>
// //               <Option value="Fertilizer">Fertilizer</Option>
// //               <Option value="Pesticide">Pesticide</Option>
// //               <Option value="Equipment">Equipment</Option>
// //             </Select>
// //           </Col>
// //         </Row>
// //       </Card>

// //       {/* Products Table */}
// //       <Card className="ag-card">
// //         <Table
// //           columns={columns}
// //           dataSource={filteredProducts}
// //           rowKey="id"
// //           pagination={{
// //             pageSize: 10,
// //             showSizeChanger: true,
// //             showQuickJumper: true,
// //             showTotal: (total) => `Total ${total} products`
// //           }}
// //           scroll={{ x: 800 }}
// //         />
// //       </Card>

// //       {/* Add/Edit Modal */}
// //       <Modal
// //         title={editingProduct ? 'Edit Product' : 'Add New Product'}
// //         open={isModalVisible}
// //         onOk={handleSubmit}
// //         onCancel={() => {
// //           setIsModalVisible(false);
// //           form.resetFields();
// //         }}
// //         width={800}
// //         okText={editingProduct ? 'Update' : 'Create'}
// //       >
// //         <Form
// //           form={form}
// //           layout="vertical"
// //           initialValues={{
// //             category: 'Seeds',
// //             unit: 'kg',
// //             price: 0,
// //             gst: 12
// //           }}
// //         >
// //           <Row gutter={[16, 16]}>
// //             <Col xs={24} md={12}>
// //               <Form.Item
// //                 name="name"
// //                 label="Product Name"
// //                 rules={[{ required: true, message: 'Please input product name!' }]}
// //               >
// //                 <Input placeholder="Enter product name" />
// //               </Form.Item>
// //             </Col>
// //             <Col xs={24} md={12}>
// //               <Form.Item
// //                 name="category"
// //                 label="Category"
// //                 rules={[{ required: true, message: 'Please select category!' }]}
// //               >
// //                 <Select>
// //                   <Option value="Seeds">Seeds</Option>
// //                   <Option value="Fertilizer">Fertilizer</Option>
// //                   <Option value="Pesticide">Pesticide</Option>
// //                   <Option value="Equipment">Equipment</Option>
// //                 </Select>
// //               </Form.Item>
// //             </Col>
// //           </Row>

// //           <Row gutter={[16, 16]}>
// //             <Col xs={24} md={8}>
// //               <Form.Item
// //                 name="unit"
// //                 label="Unit"
// //                 rules={[{ required: true, message: 'Please input unit!' }]}
// //               >
// //                 <Input placeholder="kg, liters, pieces" />
// //               </Form.Item>
// //             </Col>
// //             <Col xs={24} md={8}>
// //               <Form.Item
// //                 name="price"
// //                 label="Price per Unit (₹)"
// //                 rules={[{ required: true, message: 'Please input price!' }]}
// //               >
// //                 <InputNumber min={0} className="w-full" />
// //               </Form.Item>
// //             </Col>
// //             <Col xs={24} md={8}>
// //               <Form.Item
// //                 name="gst"
// //                 label="GST (%)"
// //                 rules={[{ required: true, message: 'Please input GST!' }]}
// //               >
// //                 <InputNumber min={0} max={100} className="w-full" />
// //               </Form.Item>
// //             </Col>
// //           </Row>

// //           <Form.Item
// //             name="description"
// //             label="Description"
// //           >
// //             <Input.TextArea rows={3} placeholder="Product description..." />
// //           </Form.Item>

// //           <Form.Item
// //             name="image"
// //             label="Product Image URL"
// //           >
// //             <Input placeholder="https://example.com/image.jpg" />
// //           </Form.Item>

// //           <Title level={5}>Stock by Showroom</Title>
// //           <Row gutter={[16, 16]}>
// //             {showrooms.map(showroom => (
// //               <Col xs={24} md={8} key={showroom.id}>
// //                 <Form.Item
// //                   name={`stock_${showroom.id}`}
// //                   label={showroom.name}
// //                 >
// //                   <InputNumber min={0} className="w-full" />
// //                 </Form.Item>
// //               </Col>
// //             ))}
// //           </Row>
// //         </Form>
// //       </Modal>
// //     </div>
// //   );
// // };

// // export default Products;