import React, { useState, useEffect } from 'react';
import { Select, Input, Button, Table, message, Modal, DatePicker, Card, Space, Typography, Divider, Row, Col, Spin } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, BarcodeOutlined, ReloadOutlined } from '@ant-design/icons';
import stockService, { Stock, StockPayload } from '../services/stockService';
import productService, { Product } from '../services/productService';
import showroomService from '../services/showroomService';
import { generateBarcode } from '@/utils/barcodeGenerator';
import { useAuth } from '../context/AuthContexts';
import moment from 'moment';

const { Option } = Select;
const { Title } = Typography;

interface StockFormData {
  inwardDate: string;
  companyName: string;
  productId: number;
  showroomId: number;
  category: string;
  unit: string;
  inwardPrice: number;
  salePrice: number;
  gst: number;
  discount: number;
  quantity: number;
  totalAmount: number;
  barcode: string;
  rack: string;
}

const StockManagement = () => {
  const { hasPermission } = useAuth();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showrooms, setShowrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);

  // Permission guard
  if (!hasPermission('add_stocks')) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <h2>Stock Management</h2>
        <p>You do not have permission to manage stocks.</p>
      </div>
    );
  }
  
  const [formData, setFormData] = useState<StockFormData>({
    inwardDate: '',
    companyName: '',
    productId: 0,
    showroomId: 0,
    category: '',
    unit: '',
    inwardPrice: 0,
    salePrice: 0,
    gst: 0,
    discount: 0,
    quantity: 0,
    totalAmount: 0,
    barcode: '',
    rack: ''
  });
  
  const [editingStockId, setEditingStockId] = useState<number | null>(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setTableLoading(true);
    try {
      const [stocksData, productsData, showroomsData] = await Promise.all([
        stockService.getAllStocks(),
        productService.getAllProducts(),
        showroomService.getAllShowrooms()
      ]);
      
      setStocks(stocksData);
      setProducts(productsData);
      setShowrooms(showroomsData);
    } catch (error) {
      message.error('Failed to load data');
    } finally {
      setTableLoading(false);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.productId) {
      message.error('Please select a product');
      return false;
    }
    if (!formData.showroomId) {
      message.error('Please select a showroom');
      return false;
    }
    if (!formData.inwardDate) {
      message.error('Please select an inward date');
      return false;
    }
    if (formData.quantity <= 0) {
      message.error('Quantity must be greater than 0');
      return false;
    }
    if (!formData.companyName.trim()) {
      message.error('Please enter company name');
      return false;
    }
    return true;
  };

  const calculateTotalAmount = (): number => {
    return formData.quantity * formData.salePrice;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name.includes('Price') || name.includes('gst') || name.includes('discount') || name.includes('quantity')
        ? parseFloat(value) || 0 
        : value,
      totalAmount: name === 'salePrice' || name === 'quantity' 
        ? (name === 'salePrice' ? parseFloat(value) || 0 : formData.salePrice) * 
          (name === 'quantity' ? parseFloat(value) || 0 : formData.quantity)
        : prev.totalAmount
    }));
  };

  const handleSelectChange = (name: keyof StockFormData, value: any) => {
    setFormData(prev => {
      const updatedData = { ...prev, [name]: value };
      if (name === 'productId') {
        const product = products.find(p => p.id === value);
        if (product) {
          updatedData.category = product.category;
          updatedData.unit = product.unit;
          updatedData.salePrice = product.price;
          updatedData.gst = product.gst;
          updatedData.totalAmount = product.price * updatedData.quantity;
        }
      }
      return updatedData;
    });
  };

  const handleDateChange = (date: moment.Moment | null, dateString: string) => {
    setFormData(prev => ({ ...prev, inwardDate: dateString }));
  };

  const handleGenerateBarcode = () => {
    if (!formData.barcode) {
      const newBarcode = generateBarcode();
      setFormData(prev => ({ ...prev, barcode: newBarcode }));
      message.success('Barcode generated successfully');
    } else {
      message.info('Barcode already exists');
    }
  };

  const resetForm = () => {
    setFormData({
      inwardDate: '',
      companyName: '',
      productId: 0,
      showroomId: 0,
      category: '',
      unit: '',
      inwardPrice: 0,
      salePrice: 0,
      gst: 0,
      discount: 0,
      quantity: 0,
      totalAmount: 0,
      barcode: '',
      rack: ''
    });
    setEditingStockId(null);
  };

  const handleAddStock = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const stockPayload: StockPayload = {
        inwardDate: formData.inwardDate,
        companyName: formData.companyName,
        product: { id: formData.productId },
        showroom: { id: formData.showroomId },
        category: formData.category,
        unit: formData.unit,
        inwardPrice: formData.inwardPrice,
        salePrice: formData.salePrice,
        gst: formData.gst,
        discount: formData.discount,
        quantity: formData.quantity,
        totalAmount: calculateTotalAmount(),
        barcode: formData.barcode || generateBarcode(),
        rack: formData.rack
      };

      const newStock = await stockService.createStock(stockPayload);
      setStocks(prev => [...prev, newStock]);
      resetForm();
      message.success('Stock added successfully');
    } catch (error) {
      message.error('Failed to add stock');
    } finally {
      setLoading(false);
    }
  };

  const handleEditStock = (stock: Stock) => {
    setFormData({
      inwardDate: stock.inwardDate,
      companyName: stock.companyName,
      productId: stock.product.id,
      showroomId: stock.showroom.id,
      category: stock.category,
      unit: stock.unit,
      inwardPrice: stock.inwardPrice,
      salePrice: stock.salePrice,
      gst: stock.gst,
      discount: stock.discount,
      quantity: stock.quantity,
      totalAmount: stock.totalAmount,
      barcode: stock.barcode,
      rack: stock.rack
    });
    setEditingStockId(stock.id!);
  };

  const handleSaveEdit = async () => {
    if (!editingStockId || !validateForm()) return;

    setLoading(true);
    try {
      const stockPayload: StockPayload = {
        inwardDate: formData.inwardDate,
        companyName: formData.companyName,
        product: { id: formData.productId },
        showroom: { id: formData.showroomId },
        category: formData.category,
        unit: formData.unit,
        inwardPrice: formData.inwardPrice,
        salePrice: formData.salePrice,
        gst: formData.gst,
        discount: formData.discount,
        quantity: formData.quantity,
        totalAmount: calculateTotalAmount(),
        barcode: formData.barcode,
        rack: formData.rack
      };

      const updatedStock = await stockService.updateStock(editingStockId, stockPayload);
      setStocks(prev => prev.map(stock => 
        stock.id === editingStockId ? updatedStock : stock
      ));
      resetForm();
      message.success('Stock updated successfully');
    } catch (error) {
      message.error('Failed to update stock');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStock = (stockId: number) => {
    Modal.confirm({
      title: 'Confirm Delete',
      content: 'Are you sure you want to delete this stock record?',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await stockService.deleteStock(stockId);
          setStocks(prev => prev.filter(stock => stock.id !== stockId));
          message.success('Stock deleted successfully');
        } catch (error) {
          message.error('Failed to delete stock');
        }
      }
    });
  };

  const columns = [
    { 
      title: 'Sr', 
      dataIndex: 'sr', 
      key: 'sr',
      width: 60,
      align: 'center' as const
    },
    { 
      title: 'Inward Date', 
      dataIndex: 'inwardDate', 
      key: 'inwardDate',
      width: 120,
      render: (date: string) => moment(date).format('DD/MM/YYYY')
    },
    { 
      title: 'Store', 
      dataIndex: 'showroom', 
      key: 'showroom',
      width: 120,
      render: (showroom: any) => showroom?.name || 'N/A'
    },
    { 
      title: 'Company', 
      dataIndex: 'companyName', 
      key: 'companyName',
      width: 150
    },
    { 
      title: 'Product', 
      dataIndex: 'product', 
      key: 'product',
      width: 150,
      render: (product: any) => product?.name || 'N/A'
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
      title: 'Inward Price', 
      dataIndex: 'inwardPrice', 
      key: 'inwardPrice',
      width: 120,
      align: 'right' as const,
      render: (value: number) => `₹${value.toFixed(2)}`
    },
    { 
      title: 'Sale Price', 
      dataIndex: 'salePrice', 
      key: 'salePrice',
      width: 120,
      align: 'right' as const,
      render: (value: number) => `₹${value.toFixed(2)}`
    },
    { 
      title: 'Qty', 
      dataIndex: 'quantity', 
      key: 'quantity',
      width: 80,
      align: 'center' as const
    },
    { 
      title: 'Total', 
      dataIndex: 'totalAmount', 
      key: 'totalAmount',
      width: 120,
      align: 'right' as const,
      render: (value: number) => `₹${value.toFixed(2)}`
    },
    { 
      title: 'Barcode', 
      dataIndex: 'barcode', 
      key: 'barcode',
      width: 120
    },
    { 
      title: 'Rack', 
      dataIndex: 'rack', 
      key: 'rack',
      width: 100
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: Stock) => (
        <Space size="small">
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => handleEditStock(record)}
            size="small"
            disabled={!hasPermission('add_stocks')}
          />
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDeleteStock(record.id!)}
            size="small"
            disabled={!hasPermission('add_stocks')}
          />
        </Space>
      ),
    },
  ];

  const tableData = stocks.map((stock, index) => ({
    ...stock,
    sr: index + 1,
    key: stock.id,
  }));

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Card 
        style={{ marginBottom: 24 }}
        title={
          <Space>
            <PlusOutlined />
            <Title level={4} style={{ margin: 0 }}>
              {editingStockId ? 'Edit Stock' : 'Add New Stock'}
            </Title>
          </Space>
        }
        extra={
          <Button 
            icon={<ReloadOutlined />} 
            onClick={loadInitialData}
            loading={tableLoading}
          >
            Refresh
          </Button>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Inward Date</label>
            <DatePicker
              value={formData.inwardDate ? moment(formData.inwardDate, 'YYYY-MM-DD') : null}
              onChange={handleDateChange}
              style={{ width: '100%' }}
              placeholder="Select date"
              format="YYYY-MM-DD"
            />
          </Col>
          
          <Col xs={24} sm={12} md={8} lg={6}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Company Name</label>
            <Input
              value={formData.companyName}
              onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
              placeholder="Enter company name"
            />
          </Col>
          
          <Col xs={24} sm={12} md={8} lg={6}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Product</label>
            <Select
              value={formData.productId || undefined}
              onChange={(value) => handleSelectChange('productId', value)}
              style={{ width: '100%' }}
              showSearch
              placeholder="Select product"
              optionFilterProp="children"
              filterOption={(input, option) =>
                option?.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {products.map(product => (
                <Option key={product.id} value={product.id}>{product.name}</Option>
              ))}
            </Select>
          </Col>
          
          <Col xs={24} sm={12} md={8} lg={6}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Showroom</label>
            <Select
              value={formData.showroomId || undefined}
              onChange={(value) => handleSelectChange('showroomId', value)}
              style={{ width: '100%' }}
              placeholder="Select showroom"
            >
              {showrooms.map(showroom => (
                <Option key={showroom.id} value={showroom.id}>{showroom.name}</Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Category</label>
            <Input
              name="category"
              value={formData.category}
              readOnly
              style={{ backgroundColor: '#f5f5f5' }}
            />
          </Col>
          
          <Col xs={24} sm={12} md={8} lg={6}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Unit</label>
            <Input
              name="unit"
              value={formData.unit}
              readOnly
              style={{ backgroundColor: '#f5f5f5' }}
            />
          </Col>
          
          <Col xs={24} sm={12} md={8} lg={6}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Inward Price</label>
            <Input
              type="number"
              name="inwardPrice"
              value={formData.inwardPrice}
              onChange={handleInputChange}
              placeholder="0.00"
            />
          </Col>
          
          <Col xs={24} sm={12} md={8} lg={6}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Sale Price</label>
            <Input
              type="number"
              name="salePrice"
              value={formData.salePrice}
              onChange={handleInputChange}
              placeholder="0.00"
            />
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>GST (%)</label>
            <Input
              type="number"
              name="gst"
              value={formData.gst}
              onChange={handleInputChange}
              placeholder="0"
            />
          </Col>
          
          <Col xs={24} sm={12} md={8} lg={6}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Discount</label>
            <Input
              type="number"
              name="discount"
              value={formData.discount}
              onChange={handleInputChange}
              placeholder="0.00"
            />
          </Col>
          
          <Col xs={24} sm={12} md={8} lg={6}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Quantity</label>
            <Input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              placeholder="0"
            />
          </Col>
          
          <Col xs={24} sm={12} md={8} lg={6}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Total Amount</label>
            <Input
              type="number"
              value={calculateTotalAmount()}
              readOnly
              style={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}
            />
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Barcode</label>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                name="barcode"
                value={formData.barcode}
                onChange={handleInputChange}
                placeholder="Auto-generated"
              />
              <Button 
                icon={<BarcodeOutlined />}
                onClick={handleGenerateBarcode}
                disabled={!!formData.barcode}
              />
            </Space.Compact>
          </Col>
          
          <Col xs={24} sm={12} md={8} lg={6}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Rack</label>
            <Input
              name="rack"
              value={formData.rack}
              onChange={handleInputChange}
              placeholder="Rack location"
            />
          </Col>
          
          <Col xs={24} sm={12} md={8} lg={6}>
            <div style={{ paddingTop: 30 }}>
              {editingStockId ? (
                <Space>
                  <Button 
                    type="primary" 
                    onClick={handleSaveEdit}
                    loading={loading}
                    disabled={!hasPermission('add_stocks')}
                  >
                    Save Changes
                  </Button>
                  <Button onClick={resetForm}>
                    Cancel
                  </Button>
                </Space>
              ) : (
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={handleAddStock}
                  loading={loading}
                  block
                  disabled={!hasPermission('add_stocks')}
                >
                  Add Stock
                </Button>
              )}
            </div>
          </Col>
        </Row>
      </Card>

      <Card 
        title={
          <Space>
            <Title level={4} style={{ margin: 0 }}>Stock Records</Title>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={tableData}
          loading={tableLoading}
          scroll={{ x: 1500 }}
          pagination={{ 
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
          }}
          bordered
          size="small"
        />
      </Card>
    </div>
  );
};

export default StockManagement;