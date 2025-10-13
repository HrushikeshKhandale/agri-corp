import React, { useState, useEffect } from 'react';
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
import { useAuth } from '../context/AuthContexts';
import { EditOutlined, DeleteOutlined, ProductOutlined } from '@ant-design/icons';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { categoryService } from '../services/categoryService';
import { subcategoryService } from '../services/subcategoryService';
import { Category } from '../services/types/category';
import { SubCategory } from '../services/types/subcategory';
import productService, { Product, ProductPayload } from '../services/productService'; // ✅ Import service and types

const { Option } = Select;

const Products: React.FC = () => {
  // ✅ Local state for products instead of context
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const { authState, hasPermission } = useAuth();
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [viewMode, setViewMode] = useState<'card' | 'list'>('list');
  const [categories, setCategories] = useState<Category[]>([]);
  const [types, setTypes] = useState<SubCategory[]>([]);
  const [subtypes, setSubtypes] = useState<SubCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>();

  // ✅ Fetch all data on mount
useEffect(() => {
    const normalizeArray = (res: any) => {
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      if (res && Array.isArray(res.result)) return res.result;
      return [];
    };

    const fetchData = async () => {
      setLoading(true);
      try {
        // fetch each resource independently so one failing API doesn't block others
        const [
          productsResp,
          categoriesResp,
          typesResp
        ] = await Promise.allSettled([
          productService.getAllProducts(),
          categoryService.getAll(),
          subcategoryService.getAll(),
        ]);

        // products
        const rawProducts = productsResp.status === 'fulfilled' ? normalizeArray(productsResp.value) : [];
        if (productsResp.status === 'rejected') {
          console.error('Products API error:', productsResp.reason);
          message.error('Failed to load products');
        }

        const normalizedProducts: Product[] = rawProducts.map((p: any) => ({
          id: p.id,
          name: p.name ?? p.productName ?? '',
          category: p.category ?? p.categoryName ?? '',
          unit: p.unit ?? p.uom ?? '',
          price: Number(p.price ?? 0),
          gst: Number(p.gst ?? 0),
          stock: p.stock ?? 0,
          imageUrl: p.imageUrl ?? p.image ?? '',
          description: p.description ?? '',
          companyName: p.companyName ?? p.manufacturer ?? '',
          type: p.type ?? '',
          subtype: p.subtype ?? '',
          inwardPrice: Number(p.inwardPrice ?? p.cost ?? 0),
          discount: Number(p.discount ?? 0),
        }));
        setProducts(normalizedProducts);

        // categories (tolerate failure)
        if (categoriesResp.status === 'fulfilled') {
          const rawCategories = normalizeArray(categoriesResp.value);
          const normalizedCategories: Category[] = rawCategories.map((c: any) => ({
            id: c.id,
            name: c.name ?? c.categoryName ?? String(c.id),
          }));
          setCategories(normalizedCategories);
        } else {
          console.warn('Categories API failed:', categoriesResp.reason);
          message.warning('Failed to load categories (some filters may be empty)');
          setCategories([]); // fallback
        }

        // types / subtypes (tolerate failure)
        if (typesResp.status === 'fulfilled') {
          const rawTypes = normalizeArray(typesResp.value);
          const normalizedTypes: SubCategory[] = rawTypes.map((t: any) => ({
            id: t.id,
            name: t.name ?? t.typeName ?? '',
            category: t.category ?? (t.categoryId ? { id: t.categoryId, name: t.categoryName ?? '' } : { id: 0, name: '' }),
          }));
          setTypes(normalizedTypes);
          setSubtypes(normalizedTypes);
        } else {
          console.warn('Types API failed:', typesResp.reason);
          message.warning('Failed to load types/subtypes');
          setTypes([]);
          setSubtypes([]);
        }
      } catch (error) {
        console.error('Unexpected fetch error:', error);
        message.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ✅ Refetch products after any mutation (optional but safe)
  const refreshProducts = async () => {
    try {
      const productsData = await productService.getAllProducts();
      // normalize if service returns wrapper
      const normalizeArray = (res: any) => {
        if (Array.isArray(res)) return res;
        if (res && Array.isArray(res.data)) return res.data;
        if (res && Array.isArray(res.result)) return res.result;
        return [];
      };
      const raw = normalizeArray(productsData);
      const normalizedProducts: Product[] = raw.map((p: any) => ({
        id: p.id,
        name: p.name ?? p.productName ?? '',
        category: p.category ?? p.categoryName ?? '',
        unit: p.unit ?? p.uom ?? '',
        price: Number(p.price ?? 0),
        gst: Number(p.gst ?? 0),
        stock: p.stock ?? 0,
        imageUrl: p.imageUrl ?? p.image ?? '',
        description: p.description ?? '',
        companyName: p.companyName ?? p.manufacturer ?? '',
        type: p.type ?? '',
        subtype: p.subtype ?? '',
        inwardPrice: Number(p.inwardPrice ?? p.cost ?? 0),
        discount: Number(p.discount ?? 0),
      }));
      setProducts(normalizedProducts);
    } catch (error) {
      console.error('refreshProducts error:', error);
      message.error('Failed to refresh products');
    }
  };

  // ✅ Filter products
  const filteredProducts = products.filter(p =>
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (!selectedCategory || p.category === selectedCategory)
  );

  // ✅ Submit handler using service
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload: ProductPayload = {
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
        stock: values.stock ?? 0, // ensure stock is defined
      };

      if (editingProduct && editingProduct.id) {
        await productService.updateProduct(editingProduct.id, payload);
        message.success('Product updated successfully');
      } else {
        await productService.createProduct(payload);
        message.success('Product added successfully');
      }

      form.resetFields();
      setEditingProduct(null);
      setIsModalVisible(false);
      await refreshProducts(); // ✅ Sync UI with backend
    } catch (error: any) {
      message.error(error.message || 'Failed to save product. Please review inputs.');
    }
  };

  // ✅ Handle delete using service
  const handleDelete = async (id: number) => {
    try {
      await productService.deleteProduct(id);
      message.success('Product deleted successfully');
      await refreshProducts();
    } catch (error: any) {
      message.error(error.message || 'Failed to delete product');
    }
  };

  // ✅ Rest of your columns and UI remains mostly unchanged...
  const columns = [
    { 
      title: 'Name', 
      dataIndex: 'name', 
      key: 'name',
      width: 150,
      ellipsis: true,
      onFilter: (value: string, record: Product) => record.name.toLowerCase().includes(value.toLowerCase())
    },
    { 
      title: 'Category', 
      dataIndex: 'category', 
      key: 'category',
      width: 120,
      filters: categories.map(category => ({ text: category.name, value: category.name })),
      onFilter: (value: string, record: Product) => record.category === value
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
      onFilter: (value: string, record: Product) => record.unit?.toLowerCase().includes(value.toLowerCase())
    },
    {
      title: 'Company',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 120,
      ellipsis: true,
      onFilter: (value: string, record: Product) => record.companyName?.toLowerCase().includes(value.toLowerCase())
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      ellipsis: true,
      onFilter: (value: string, record: Product) => record.type?.toLowerCase().includes(value.toLowerCase())
    },
    {
      title: 'Subtype',
      dataIndex: 'subtype',
      key: 'subtype',
      width: 100,
      ellipsis: true,
      // ❌ Fix: was filtering on `type` — should be `subtype`
      onFilter: (value: string, record: Product) => record.subtype?.toLowerCase().includes(value.toLowerCase())
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (val: number) => `₹${val.toFixed(2)}`,
      sorter: (a: Product, b: Product) => a.price - b.price
    },
    {
      title: 'Inward Price',
      dataIndex: 'inwardPrice',
      key: 'inwardPrice',
      width: 110,
      render: (val: number) => `₹${val.toFixed(2)}`,
      sorter: (a: Product, b: Product) => (a.inwardPrice || 0) - (b.inwardPrice || 0)
    },
    {
      title: 'GST (%)',
      dataIndex: 'gst',
      key: 'gst',
      width: 80,
      sorter: (a: Product, b: Product) => (a.gst || 0) - (b.gst || 0)
    },
    {
      title: 'Discount (%)',
      dataIndex: 'discount',
      key: 'discount',
      width: 100,
      sorter: (a: Product, b: Product) => (a.discount || 0) - (b.discount || 0)
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
                imageUrl: record.imageUrl || '',
                stock: record.stock ?? 0,
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
            onClick={() => handleDelete(record.id!)}
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
              <h2 className="text-2xl font-semibold">Products Management</h2>
              <div className="flex gap-2 flex-wrap items-center">
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
                {categories.map(category => (
                  <Option key={category.id} value={category.name}>
                    {category.name}
                  </Option>
                ))}
              </Select>
            </div>

            {viewMode === 'card' ? (
              <div className="ag-responsive-grid">
                {filteredProducts.map(product => (
                  <Card key={product.id} className="ag-card-compact hover:shadow-md transition-shadow">
                    <CardContent className="p-0">
                      {/* {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-32 sm:h-40 object-cover rounded-t mb-3"
                        />
                      )} */}
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
                                imageUrl: product.imageUrl || '',
                                stock: product.stock ?? 0,
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
                            onClick={() => handleDelete(product.id!)}
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
                  loading={loading}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal remains same, but ensure stock is handled */}
      <Modal
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingProduct(null);
          form.resetFields();
        }}
        style={{
          position:"relative",top:10
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
                <Select
                  onChange={(value, option: any) => {
                    setSelectedCategoryId(option.key);
                    form.setFieldsValue({ type: undefined, subtype: undefined });
                  }}
                >
                  {categories.map(category => (
                    <Option key={category.id} value={category.name}>
                      {category.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="unit"
                label="Unit"
                rules={[{ required: true, message: 'Please select unit' }]}
              >
                <Select>
                  <Option value="kg">Kilogram (kg)</Option>
                  <Option value="g">Gram (g)</Option>
                  <Option value="ltr">Liter (ltr)</Option>
                  <Option value="ml">Milliliter (ml)</Option>
                  <Option value="pcs">Pieces (pcs)</Option>
                  <Option value="pack">Pack</Option>
                  <Option value="bag">Bag</Option>
                  <Option value="bottle">Bottle</Option>
                  <Option value="box">Box</Option>
                  <Option value="ton">Ton</Option>
                </Select>
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
            <Col span={12}>
              <Form.Item name="type" label="Type">
                <Select
                  placeholder="Select type"
                  onChange={() => form.setFieldsValue({ subtype: undefined })}
                >
                  {types
                    .filter(type => !selectedCategoryId || type.category.id === selectedCategoryId)
                    .map(type => (
                      <Option key={type.id} value={type.name}>
                        {type.name}
                      </Option>
                    ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="subtype" label="Subtype">
                <Select placeholder="Select subtype">
                  {subtypes
                    .filter(subtype => !selectedCategoryId || subtype.category.id === selectedCategoryId)
                    .map(subtype => (
                      <Option key={subtype.id} value={subtype.name}>
                        {subtype.name}
                      </Option>
                    ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
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
                name="price"
                label="Selling Price (₹)"
                rules={[{ required: true, message: 'Please enter price' }]}
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
            <Col span={8}>
              <Form.Item name="discount" label="Discount (%)">
                <InputNumber min={0} max={100} className="w-full" />
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
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default Products;


// import React, { useState, useEffect } from 'react';
// import {
//   Modal,
//   Form,
//   Input,
//   Select,
//   InputNumber,
//   message,
//   Row,
//   Col,
//   Table,
//   Segmented,
//   Statistic,
// } from 'antd';
// import { Product, useData } from '../context/DataContext';
// import { useAuth } from '../context/AuthContexts';
// import { EditOutlined, DeleteOutlined, ProductOutlined } from '@ant-design/icons';
// import { Card, CardHeader, CardContent } from '../components/ui/card';
// import { Button } from '../components/ui/button';
// import { categoryService } from '../services/categoryService';
// import { subcategoryService } from '../services/subcategoryService';
// import { Category } from '../services/types/category';
// import { SubCategory } from '../services/types/subcategory';

// const { Option } = Select;

// const Products: React.FC = () => {
//   const { products, addProduct, updateProduct, deleteProduct } = useData();
//   const { authState, hasPermission } = useAuth();
//   const [form] = Form.useForm();
//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const [editingProduct, setEditingProduct] = useState<Product | null>(null);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [selectedCategory, setSelectedCategory] = useState<string>();
//   const [viewMode, setViewMode] = useState<'card' | 'list'>('list');
//   const [categories, setCategories] = useState<Category[]>([]);
//   const [types, setTypes] = useState<SubCategory[]>([]);
//   const [subtypes, setSubtypes] = useState<SubCategory[]>([]);
//   const [selectedCategoryId, setSelectedCategoryId] = useState<number>();

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const [categoriesData, typesData] = await Promise.all([
//           categoryService.getAll(),
//           subcategoryService.getAll()
//         ]);
//         setCategories(categoriesData);
//         setTypes(typesData);
//         setSubtypes(typesData);
//       } catch (error) {
//         message.error('Failed to fetch categories and types');
//       }
//     };
//     fetchData();
//   }, []);

//   // filter products
//   const filteredProducts = products.filter(p =>
//     (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       p.description?.toLowerCase().includes(searchQuery.toLowerCase())) &&
//     (!selectedCategory || p.category === selectedCategory)
//   );

//   // submit handler
//   const handleSubmit = async () => {
//     try {
//       const values = await form.validateFields();
//       const payload = {
//         name: values.name,
//         category: values.category,
//         unit: values.unit,
//         price: values.price,
//         gst: values.gst,
//         imageUrl: values.imageUrl || '',
//         description: values.description,
//         companyName: values.companyName,
//         type: values.type,
//         subtype: values.subtype,
//         inwardPrice: values.inwardPrice,
//         discount: values.discount,
//         stock: values.stock,
//       };
//       if (editingProduct) {
//         await updateProduct(editingProduct.id!, payload);
//       } else {
//         await addProduct(payload);
//       }
//       form.resetFields();
//       setEditingProduct(null);
//       setIsModalVisible(false);
//     } catch {
//       message.error('Failed to save product. Please review inputs.');
//     }
//   };

//   // columns for list view
//   const columns = [
//     { 
//       title: 'Name', 
//       dataIndex: 'name', 
//       key: 'name',
//       width: 150,
//       ellipsis: true,
//       filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
//         <div className="p-2">
//           <Input
//             placeholder="Search name"
//             value={selectedKeys[0]}
//             onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
//             onPressEnter={() => confirm()}
//             className="mb-2"
//           />
//           <div className="flex gap-1">
//             <Button size="sm" onClick={() => confirm()}>Search</Button>
//             <Button size="sm" onClick={() => clearFilters()}>Reset</Button>
//           </div>
//         </div>
//       ),
//       onFilter: (value: string, record: Product) => record.name.toLowerCase().includes(value.toLowerCase())
//     },
//     { 
//       title: 'Category', 
//       dataIndex: 'category', 
//       key: 'category',
//       width: 120,
//       filters: categories.map(category => ({
//         text: category.name,
//         value: category.name
//       })),
//       onFilter: (value: string, record: Product) => record.category === value
//     },
//     {
//       title: 'Unit',
//       dataIndex: 'unit',
//       key: 'unit',
//       width: 80,
//       filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
//         <div className="p-2">
//           <Input
//             placeholder="Search unit"
//             value={selectedKeys[0]}
//             onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
//             onPressEnter={() => confirm()}
//             className="mb-2"
//           />
//           <div className="flex gap-1">
//             <Button size="sm" onClick={() => confirm()}>Search</Button>
//             <Button size="sm" onClick={() => clearFilters()}>Reset</Button>
//           </div>
//         </div>
//       ),
//       onFilter: (value: string, record: Product) => record.unit?.toLowerCase().includes(value.toLowerCase())
//     },
//     {
//       title: 'Company',
//       dataIndex: 'companyName',
//       key: 'companyName',
//       width: 120,
//       ellipsis: true,
//       filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
//         <div className="p-2">
//           <Input
//             placeholder="Search company"
//             value={selectedKeys[0]}
//             onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
//             onPressEnter={() => confirm()}
//             className="mb-2"
//           />
//           <div className="flex gap-1">
//             <Button size="sm" onClick={() => confirm()}>Search</Button>
//             <Button size="sm" onClick={() => clearFilters()}>Reset</Button>
//           </div>
//         </div>
//       ),
//       onFilter: (value: string, record: Product) => record.companyName?.toLowerCase().includes(value.toLowerCase())
//     },
//     {
//       title: 'Type',
//       dataIndex: 'type',
//       key: 'type',
//       width: 100,
//       ellipsis: true,
//       filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
//         <div className="p-2">
//           <Input
//             placeholder="Search type"
//             value={selectedKeys[0]}
//             onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
//             onPressEnter={() => confirm()}
//             className="mb-2"
//           />
//           <div className="flex gap-1">
//             <Button size="sm" onClick={() => confirm()}>Search</Button>
//             <Button size="sm" onClick={() => clearFilters()}>Reset</Button>
//           </div>
//         </div>
//       ),
//       onFilter: (value: string, record: Product) => record.type?.toLowerCase().includes(value.toLowerCase())
//     },
//     {
//       title: 'subtype',
//       dataIndex: 'subtype',
//       key: 'subtype',
//       width: 100,
//       ellipsis: true,
//       filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
//         <div className="p-2">
//           <Input
//             placeholder="Search type"
//             value={selectedKeys[0]}
//             onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
//             onPressEnter={() => confirm()}
//             className="mb-2"
//           />
//           <div className="flex gap-1">
//             <Button size="sm" onClick={() => confirm()}>Search</Button>
//             <Button size="sm" onClick={() => clearFilters()}>Reset</Button>
//           </div>
//         </div>
//       ),
//       onFilter: (value: string, record: Product) => record.type?.toLowerCase().includes(value.toLowerCase())
//     },
//     {
//       title: 'Price',
//       dataIndex: 'price',
//       key: 'price',
//       width: 100,
//       render: (val: number) => `₹${val.toFixed(2)}`,
//       sorter: (a: Product, b: Product) => a.price - b.price
//     },
//     {
//       title: 'Inward Price',
//       dataIndex: 'inwardPrice',
//       key: 'inwardPrice',
//       width: 110,
//       render: (val: number) => `₹${val.toFixed(2)}`,
//       sorter: (a: Product, b: Product) => (a.inwardPrice || 0) - (b.inwardPrice || 0)
//     },
//     {
//       title: 'GST (%)',
//       dataIndex: 'gst',
//       key: 'gst',
//       width: 80,
//       sorter: (a: Product, b: Product) => (a.gst || 0) - (b.gst || 0)
//     },
//     {
//       title: 'Discount (%)',
//       dataIndex: 'discount',
//       key: 'discount',
//       width: 100,
//       sorter: (a: Product, b: Product) => (a.discount || 0) - (b.discount || 0)
//     },
//     {
//       title: 'Actions',
//       key: 'actions',
//       width: 120,
//       fixed: 'right',
//       render: (_: any, record: Product) => (
//         <div className="flex gap-2">
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={() => {
//               setEditingProduct(record);
//               form.setFieldsValue({
//                 ...record,
//                 imageUrl: record.imageUrl,
//               });
//               setIsModalVisible(true);
//             }}
//             disabled={!hasPermission('manage_products')}
//           >
//             <EditOutlined />
//           </Button>
//           <Button
//             variant="destructive"
//             size="sm"
//             onClick={() => deleteProduct(record.id!)}
//             disabled={!hasPermission('manage_products')}
//           >
//             <DeleteOutlined />
//           </Button>
//         </div>
//       ),
//     },
//   ];

//   return (
//     <>
//       <div className="w-full">
//         <Card className="w-full">
//           <div className="p-4 text-center">
//             <Row gutter={[12, 12]} className="mb-6">
//               <Col xs={12} sm={6}>
//                 <Card className="ag-card-compact text-center">
//                   <Statistic
//                     title="Total Products"
//                     value={products.length}
//                     prefix={<ProductOutlined />}
//                     valueStyle={{ color: 'hsl(var(--primary))', fontSize: 'clamp(1.2rem, 3vw, 1.8rem)' }}
//                   />
//                 </Card>
//               </Col>
//               <Col xs={12} sm={6}>
//                 <Card className="ag-card-compact text-center">
//                   <Statistic
//                     title="Out of Stock"
//                     value={products.filter(p => (p.stock || 0) === 0).length}
//                     valueStyle={{ color: 'hsl(var(--destructive))', fontSize: 'clamp(1.2rem, 3vw, 1.8rem)' }}
//                   />
//                 </Card>
//               </Col>
//               <Col xs={12} sm={6}>
//                 <Card className="ag-card-compact text-center">
//                   <Statistic
//                     title="Total Stock"
//                     value={products.reduce((sum, p) => sum + (p.stock || 0), 0)}
//                     valueStyle={{ color: 'hsl(var(--info))', fontSize: 'clamp(1.2rem, 3vw, 1.8rem)' }}
//                   />
//                 </Card>
//               </Col>
//               <Col xs={12} sm={6}>
//                 <Card className="ag-card-compact text-center">
//                   <Statistic
//                     title="Categories"
//                     value={[...new Set(products.map(p => p.category))].length}
//                     valueStyle={{ color: 'hsl(var(--secondary))', fontSize: 'clamp(1.2rem, 3vw, 1.8rem)' }}
//                   />
//                 </Card>
//               </Col>
//             </Row>
//           </div>

//           <CardHeader>
//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
//         <h2 className="text-2xl font-semibold">Products Management</h2>
//         <div className="flex gap-2 flex-wrap items-center">
//                 <Segmented
//                   options={[
//                     { label: 'Cards', value: 'card' },
//                     { label: 'Table', value: 'list' },
//                   ]}
//                   value={viewMode}
//                   onChange={val => setViewMode(val as 'card' | 'list')}
//                   size="small"
//                 />
//                 <Button
//                   variant="default"
//                   onClick={() => {
//                     form.resetFields();
//                     setEditingProduct(null);
//                     setIsModalVisible(true);
//                   }}
//                   disabled={!hasPermission('manage_products')}
//                   className="w-full sm:w-auto"
//                 >
//                   Add Product
//                 </Button>
//               </div>
//             </div>
//           </CardHeader>

//           <CardContent>
//             <div className="flex flex-col sm:flex-row gap-3 mb-6">
//               <Input
//                 placeholder="Search products..."
//                 value={searchQuery}
//                 onChange={e => setSearchQuery(e.target.value)}
//                 className="flex-1 sm:max-w-xs"
//                 size="middle"
//               />
//               <Select
//                 placeholder="Filter by category"
//                 value={selectedCategory}
//                 onChange={setSelectedCategory}
//                 allowClear
//                 className="w-full sm:w-48"
//                 size="middle"
//               >
//                 {categories.map(category => (
//                   <Option key={category.id} value={category.name}>
//                     {category.name}
//                   </Option>
//                 ))}
//               </Select>
//             </div>

//             {viewMode === 'card' ? (
//               <div className="ag-responsive-grid">
//                 {filteredProducts.map(product => (
//                   <Card key={product.id} className="ag-card-compact hover:shadow-md transition-shadow">
//                     <CardContent className="p-0">
//                       {product.imageUrl && (
//                         <img
//                           src={product.imageUrl}
//                           alt={product.name}
//                           className="w-full h-32 sm:h-40 object-cover rounded-t mb-3"
//                         />
//                       )}
//                       <div className="p-4">
//                         <h4 className="font-semibold text-base sm:text-lg mb-2 line-clamp-2">{product.name}</h4>
//                         <div className="flex items-center gap-2 mb-2">
//                           <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
//                             {product.category}
//                           </span>
//                           <span className="text-xs text-gray-500">{product.companyName}</span>
//                         </div>
//                         {product.description && (
//                           <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
//                         )}
//                         <div className="flex justify-between items-center mb-3">
//                           <span className="font-semibold text-green-600">₹{product.price.toFixed(2)}</span>
//                           <span className={`text-sm px-2 py-1 rounded ${
//                             (product.stock || 0) > 10 ? 'bg-green-100 text-green-800' : 
//                             (product.stock || 0) > 0 ? 'bg-yellow-100 text-yellow-800' : 
//                             'bg-red-100 text-red-800'
//                           }`}>
//                             Stock: {product.stock || 0}
//                           </span>
//                         </div>
//                         <div className="flex gap-2">
//                           <Button
//                             variant="outline"
//                             size="sm"
//                             onClick={() => {
//                               setEditingProduct(product);
//                               form.setFieldsValue({
//                                 ...product,
//                                 imageUrl: product.imageUrl,
//                               });
//                               setIsModalVisible(true);
//                             }}
//                             disabled={!hasPermission('manage_products')}
//                             className="flex-1"
//                           >
//                             <EditOutlined className="mr-1" /> Edit
//                           </Button>
//                           <Button
//                             variant="destructive"
//                             size="sm"
//                             onClick={() => deleteProduct(product.id!)}
//                             disabled={!hasPermission('manage_products')}
//                             className="flex-1"
//                           >
//                             <DeleteOutlined className="mr-1" /> Delete
//                           </Button>
//                         </div>
//                       </div>
//                     </CardContent>
//                   </Card>
//                 ))}
//               </div>
//             ) : (
//               <div className="overflow-x-auto">
//                 <Table
//                   columns={columns}
//                   dataSource={filteredProducts}
//                   rowKey="id"
//                   pagination={{ pageSize: 10 }}
//                   scroll={{ x: 1200 }}
//                   size="small"
//                 />
//               </div>
//             )}
//           </CardContent>
//         </Card>
//       </div>

//       <Modal
//         title={editingProduct ? 'Edit Product' : 'Add Product'}
//         open={isModalVisible}
//         onOk={handleSubmit}
//         onCancel={() => {
//           setIsModalVisible(false);
//           setEditingProduct(null);
//           form.resetFields();
//         }}
//         width={800}
//       >
//         <Form form={form} layout="vertical">
//           <Row gutter={16}>
//             <Col span={12}>
//               <Form.Item
//                 name="name"
//                 label="Product Name"
//                 rules={[{ required: true, message: 'Please enter product name' }]}
//               >
//                 <Input />
//               </Form.Item>
//             </Col>
//             <Col span={12}>
//               <Form.Item
//                 name="category"
//                 label="Category"
//                 rules={[{ required: true, message: 'Please select category' }]}
//               >
//                 <Select
//                   onChange={(value, option: any) => {
//                     setSelectedCategoryId(option.key);
//                     form.setFieldsValue({ type: undefined, subtype: undefined });
//                   }}
//                 >
//                   {categories.map(category => (
//                     <Option key={category.id} value={category.name}>
//                       {category.name}
//                     </Option>
//                   ))}
//                 </Select>
//               </Form.Item>
//             </Col>
//           </Row>
//           <Row gutter={16}>
//             <Col span={12}>
//               <Form.Item
//                 name="unit"
//                 label="Unit"
//                 rules={[{ required: true, message: 'Please select unit' }]}
//               >
//                 <Select>
//                   <Option value="kg">Kilogram (kg)</Option>
//                   <Option value="g">Gram (g)</Option>
//                   <Option value="ltr">Liter (ltr)</Option>
//                   <Option value="ml">Milliliter (ml)</Option>
//                   <Option value="pcs">Pieces (pcs)</Option>
//                   <Option value="pack">Pack</Option>
//                   <Option value="bag">Bag</Option>
//                   <Option value="bottle">Bottle</Option>
//                   <Option value="box">Box</Option>
//                   <Option value="ton">Ton</Option>
//                 </Select>
//               </Form.Item>
//             </Col>
//             <Col span={12}>
//               <Form.Item
//                 name="companyName"
//                 label="Company Name"
//                 rules={[{ required: true, message: 'Please enter company name' }]}
//               >
//                 <Input />
//               </Form.Item>
//             </Col>
//           </Row>
//           <Row gutter={16}>
//             <Col span={12}>
//               <Form.Item
//                 name="type"
//                 label="Type"
//               >
//                 <Select
//                   placeholder="Select type"
//                   onChange={() => form.setFieldsValue({ subtype: undefined })}
//                 >
//                   {types
//                     .filter(type => !selectedCategoryId || type.category.id === selectedCategoryId)
//                     .map(type => (
//                     <Option key={type.id} value={type.name}>
//                       {type.name}
//                     </Option>
//                   ))}
//                 </Select>
//               </Form.Item>
//             </Col>
//             <Col span={12}>
//               <Form.Item
//                 name="subtype"
//                 label="Subtype"
//               >
//                 <Select placeholder="Select subtype">
//                   {subtypes
//                     .filter(subtype => !selectedCategoryId || subtype.category.id === selectedCategoryId)
//                     .map(subtype => (
//                     <Option key={subtype.id} value={subtype.name}>
//                       {subtype.name}
//                     </Option>
//                   ))}
//                 </Select>
//               </Form.Item>
//             </Col>
//           </Row>
//           <Row gutter={16}>
//             <Col span={8}>
//               <Form.Item
//                 name="inwardPrice"
//                 label="Inward Price (₹)"
//                 rules={[{ required: true, message: 'Please enter inward price' }]}
//               >
//                 <InputNumber min={0} step={0.01} className="w-full" />
//               </Form.Item>
//             </Col>
//             <Col span={8}>
//               <Form.Item
//                 name="price"
//                 label="Selling Price (₹)"
//                 rules={[{ required: true, message: 'Please enter price' }]}
//               >
//                 <InputNumber min={0} step={0.01} className="w-full" />
//               </Form.Item>
//             </Col>
            
//             <Col span={8}>
//               <Form.Item
//                 name="gst"
//                 label="GST (%)"
//                 rules={[{ required: true, message: 'Please enter GST percentage' }]}
//               >
//                 <InputNumber min={0} max={100} className="w-full" />
//               </Form.Item>
//             </Col>
//           </Row>
//           <Row gutter={16}>
//             <Col span={12}>
//               <Form.Item
//                 name="discount"
//                 label="Discount (%)"
//               >
//                 <InputNumber min={0} max={100} className="w-full" />
//               </Form.Item>
//             </Col>
//           </Row>
//           <Form.Item
//             name="description"
//             label="Description"
//           >
//             <Input.TextArea rows={3} />
//           </Form.Item>
//         </Form>
//       </Modal>
//     </>
//   );
// };

// export default Products;
