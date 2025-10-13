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
import { useAuth } from '../context/AuthContexts';
import { EditOutlined, DeleteOutlined, ProductOutlined } from '@ant-design/icons';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';

const { Option } = Select;

const Products: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useData();
  const { authState, hasPermission } = useAuth();
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  // filter products
  const filteredProducts = products.filter(p =>
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (!selectedCategory || p.category === selectedCategory)
  );

  // submit handler
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        name: values.name,
        category: values.category,
        unit: values.unit,
        price: values.price,
        gst: values.gst,
        imageUrl: values.imageUrl || '',
        description: values.description,
        companyName: values.companyName,
        type: values.type,
        subtype: values.subtype,
        inwardPrice: values.inwardPrice,
        discount: values.discount,
        stock: values.stock,
      };
      if (editingProduct) {
        await updateProduct(editingProduct.id!, payload);
      } else {
        await addProduct(payload);
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
    { 
      title: 'Name', 
      dataIndex: 'name', 
      key: 'name',
      width: 150,
      ellipsis: true
    },
    { 
      title: 'Category', 
      dataIndex: 'category', 
      key: 'category',
      width: 120
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
      width: 80
    },
    {
      title: 'Company',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 120,
      ellipsis: true
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      ellipsis: true
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (val: number) => `₹${val.toFixed(2)}`,
    },
    {
      title: 'Inward Price',
      dataIndex: 'inwardPrice',
      key: 'inwardPrice',
      width: 110,
      render: (val: number) => `₹${val.toFixed(2)}`,
    },
    {
      title: 'GST (%)',
      dataIndex: 'gst',
      key: 'gst',
      width: 80
    },
    {
      title: 'Discount (%)',
      dataIndex: 'discount',
      key: 'discount',
      width: 100
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
      width: 80,
      render: (stock: number) => stock || 0,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_: any, record: Product) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingProduct(record);
              form.setFieldsValue({
                ...record,
                imageUrl: record.imageUrl,
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
            onClick={() => deleteProduct(record.id!)}
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
      <div className="w-full">
        <Card className="w-full">
          <div className="p-4 text-center">
            <Row gutter={[12, 12]} className="mb-6">
              <Col xs={12} sm={6}>
                <Card className="ag-card-compact text-center">
                  <Statistic
                    title="Total Products"
                    value={products.length}
                    prefix={<ProductOutlined />}
                    valueStyle={{ color: 'hsl(var(--primary))', fontSize: 'clamp(1.2rem, 3vw, 1.8rem)' }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card className="ag-card-compact text-center">
                  <Statistic
                    title="Out of Stock"
                    value={products.filter(p => (p.stock || 0) === 0).length}
                    valueStyle={{ color: 'hsl(var(--destructive))', fontSize: 'clamp(1.2rem, 3vw, 1.8rem)' }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card className="ag-card-compact text-center">
                  <Statistic
                    title="Total Stock"
                    value={products.reduce((sum, p) => sum + (p.stock || 0), 0)}
                    valueStyle={{ color: 'hsl(var(--info))', fontSize: 'clamp(1.2rem, 3vw, 1.8rem)' }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card className="ag-card-compact text-center">
                  <Statistic
                    title="Categories"
                    value={[...new Set(products.map(p => p.category))].length}
                    valueStyle={{ color: 'hsl(var(--secondary))', fontSize: 'clamp(1.2rem, 3vw, 1.8rem)' }}
                  />
                </Card>
              </Col>
            </Row>
          </div>

          <CardHeader>
            <div className="ag-mobile-stack w-full">
              <h3 className="text-xl md:text-2xl font-semibold">Products Management</h3>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <Segmented
                  options={[
                    { label: 'Cards', value: 'card' },
                    { label: 'Table', value: 'list' },
                  ]}
                  value={viewMode}
                  onChange={val => setViewMode(val as 'card' | 'list')}
                  size="small"
                />
                <Button
                  variant="default"
                  onClick={() => {
                    form.resetFields();
                    setEditingProduct(null);
                    setIsModalVisible(true);
                  }}
                  disabled={!hasPermission('manage_products')}
                  className="w-full sm:w-auto"
                >
                  Add Product
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 sm:max-w-xs"
                size="middle"
              />
              <Select
                placeholder="Filter by category"
                value={selectedCategory}
                onChange={setSelectedCategory}
                allowClear
                className="w-full sm:w-48"
                size="middle"
              >
                <Option value="Seeds">Seeds</Option>
                <Option value="Fertilizer">Fertilizer</Option>
                <Option value="Pesticide">Pesticide</Option>
                <Option value="Equipment">Equipment</Option>
              </Select>
            </div>

            {viewMode === 'card' ? (
              <div className="ag-responsive-grid">
                {filteredProducts.map(product => (
                  <Card key={product.id} className="ag-card-compact hover:shadow-md transition-shadow">
                    <CardContent className="p-0">
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-32 sm:h-40 object-cover rounded-t mb-3"
                        />
                      )}
                      <div className="p-4">
                        <h4 className="font-semibold text-base sm:text-lg mb-2 line-clamp-2">{product.name}</h4>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                            {product.category}
                          </span>
                          <span className="text-xs text-gray-500">{product.companyName}</span>
                        </div>
                        {product.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                        )}
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-semibold text-green-600">₹{product.price.toFixed(2)}</span>
                          <span className={`text-sm px-2 py-1 rounded ${
                            (product.stock || 0) > 10 ? 'bg-green-100 text-green-800' : 
                            (product.stock || 0) > 0 ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'
                          }`}>
                            Stock: {product.stock || 0}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingProduct(product);
                              form.setFieldsValue({
                                ...product,
                                imageUrl: product.imageUrl,
                              });
                              setIsModalVisible(true);
                            }}
                            disabled={!hasPermission('manage_products')}
                            className="flex-1"
                          >
                            <EditOutlined className="mr-1" /> Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteProduct(product.id!)}
                            disabled={!hasPermission('manage_products')}
                            className="flex-1"
                          >
                            <DeleteOutlined className="mr-1" /> Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table
                  columns={columns}
                  dataSource={filteredProducts}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 1200 }}
                  size="small"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingProduct(null);
          form.resetFields();
        }}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Product Name"
                rules={[{ required: true, message: 'Please enter product name' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: 'Please select category' }]}
              >
                <Select>
                  <Option value="Seeds">Seeds</Option>
                  <Option value="Fertilizer">Fertilizer</Option>
                  <Option value="Pesticide">Pesticide</Option>
                  <Option value="Equipment">Equipment</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="unit"
                label="Unit"
                rules={[{ required: true, message: 'Please enter unit' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="companyName"
                label="Company Name"
                rules={[{ required: true, message: 'Please enter company name' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="type"
                label="Type"
                rules={[{ required: true, message: 'Please enter type' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="subtype"
                label="Subtype"
                rules={[{ required: true, message: 'Please enter subtype' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="stock"
                label="Stock"
                rules={[{ required: true, message: 'Please enter stock quantity' }]}
              >
                <InputNumber min={0} className="w-full" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="price"
                label="Price (₹)"
                rules={[{ required: true, message: 'Please enter price' }]}
              >
                <InputNumber min={0} step={0.01} className="w-full" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="inwardPrice"
                label="Inward Price (₹)"
                rules={[{ required: true, message: 'Please enter inward price' }]}
              >
                <InputNumber min={0} step={0.01} className="w-full" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="gst"
                label="GST (%)"
                rules={[{ required: true, message: 'Please enter GST percentage' }]}
              >
                <InputNumber min={0} max={100} className="w-full" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="discount"
                label="Discount (%)"
              >
                <InputNumber min={0} max={100} className="w-full" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="imageUrl"
                label="Image URL"
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default Products;
