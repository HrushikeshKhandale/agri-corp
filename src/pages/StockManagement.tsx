import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Select, Input, Button, Table, message, Modal, DatePicker, AutoComplete } from 'antd';
import { generateBarcode } from '@/utils/barcodeGenerator';
import moment from 'moment';

const { Option } = Select;

interface StockFormData {
  productId: string;
  showroomId: string;
  quantity: number;
  inwardDate: string;
  companyName: string;
    companyId?: string;
  category: string;
  type: string;
  subtype: string;
  unit: string;
  inwardPrice: number;
  salePrice: number;
  gst: number;
  discount: number;
  qty: number;
  totalAmount: number;
  availableStock: number;
  barcode: string;
  rack: string;
}

const StockManagement = () => {
  const { 
    products, 
    showrooms, 
    stockStores, 
    addStockStore, 
    updateStockStore, 
    deleteStockStore, 
    companies,
    addCompany
  } = useData();
  
  const [formData, setFormData] = useState<StockFormData>({
    productId: '',
    showroomId: '',
    quantity: 0,
    inwardDate: '',
    companyName: '',
     companyId: '',
   category: '',
    type: '',
    subtype: '',
    unit: '',
    inwardPrice: 0,
    salePrice: 0,
    gst: 0,
    discount: 0,
    qty: 0,
    totalAmount: 0,
    availableStock: 0,
    barcode: '',
    rack: ''
  });
  
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [filteredCompanies, setFilteredCompanies] = useState(companies);
  const [isNewCompany, setIsNewCompany] = useState(false);

 // Load existing stock data when company is selected
  useEffect(() => {
    if (formData.companyId && stockStores.length > 0 && !isNewCompany) {
      const existingStock = stockStores.find(stock => 
        stock.companyId === formData.companyId && 
        (!editingStockId || stock.id !== editingStockId)
      );
      
      if (existingStock) {
        setFormData(prev => ({
          ...prev,
          ...existingStock,
          qty: existingStock.quantity
        }));
      }
    }
  }, [formData.companyId]);

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
    if (formData.qty <= 0) {
      message.error('Quantity must be greater than 0');
      return false;
    }
    if (!formData.companyName) {
      message.error('Please select or add a company');
      return false;
    }
    return true;
  };

  const calculateTotalAmount = (): number => {
    return formData.qty * formData.salePrice;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name.includes('Price') || name.includes('gst') || name.includes('discount') || name.includes('qty')
        ? parseFloat(value) || 0 
        : value,
      totalAmount: name === 'salePrice' || name === 'qty' 
        ? (name === 'salePrice' ? parseFloat(value) || 0 : formData.salePrice) * 
          (name === 'qty' ? parseFloat(value) || 0 : formData.qty)
        : prev.totalAmount
    }));
  };

  const handleSelectChange = (name: keyof StockFormData, value: string) => {
    setFormData(prev => {
      const updatedData = { ...prev, [name]: value };
      if (name === 'productId') {
        const product = products.find(p => p.id === value);
        if (product) {
          updatedData.category = product.category;
          updatedData.unit = product.unit;
          updatedData.salePrice = product.price;
          updatedData.gst = product.gst;
          updatedData.totalAmount = product.price * updatedData.qty;
        }
      }
      return updatedData;
    });
  };

  const handleDateChange = (date: moment.Moment | null, dateString: string) => {
    setFormData(prev => ({ ...prev, inwardDate: dateString }));
  };

  const handleCompanySearch = (value: string) => {
    const filtered = companies.filter(company =>
      company.name.toLowerCase().includes(value.toLowerCase()) ||
      (company.phone && company.phone.includes(value))
    );
    setFilteredCompanies(filtered);
    setIsNewCompany(filtered.length === 0 && value.trim() !== '');
  };

  const handleCompanySelect = (value: string) => {
    const selectedCompany = companies.find(company => company.id === value);
    if (selectedCompany) {
      setIsNewCompany(false);
      setFormData(prev => ({
        ...prev,
        companyName: selectedCompany.name,
            companyId: selectedCompany.id
  }));
    }
  };

  const handleAddNewCompany = async () => {
    if (!formData.companyName.trim()) {
      message.error('Please enter a company name');
      return;
    }

    try {
      const newCompany = await addCompany({
        name: formData.companyName,
        address: '',
        phone: '',
        email: ''
      });

      setFormData(prev => ({
        ...prev,
        companyId: newCompany.id
      }));
      setIsNewCompany(false);
      message.success('Company added successfully');
    } catch (error) {
      message.error('Failed to add company: ' + error.message);
    }
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
      productId: '',
      showroomId: '',
      quantity: 0,
      inwardDate: '',
      companyName: '',
          companyId: '',
  category: '',
      type: '',
      subtype: '',
      unit: '',
      inwardPrice: 0,
      salePrice: 0,
      gst: 0,
      discount: 0,
      qty: 0,
      totalAmount: 0,
      availableStock: 0,
      barcode: '',
      rack: ''
    });
    setEditingStockId(null);
    setIsNewCompany(false);
  };

    const handleAddStock = async () => {
    if (!validateForm()) return;

    // If it's a new company, add it first
    if (isNewCompany) {
      await handleAddNewCompany();
      if (!formData.companyId) {
        message.error('Failed to add company');
        return;
      }
    }

    const product = products.find(p => p.id === formData.productId);
    const showroom = showrooms.find(s => s.id === formData.showroomId);
    
    if (!product || !showroom) {
      message.error('Invalid product or showroom selected');
      return;
    }

    if (!formData.companyId) {
      message.error('Company not properly selected');
      return;
    }

    const newStock = {
      ...formData,
      productId: formData.productId,
      showroomId: formData.showroomId,
      quantity: formData.qty,
      companyId: formData.companyId,
      companyName: formData.companyName,
      category: product.category,
      unit: product.unit,
      totalAmount: calculateTotalAmount(),
      availableStock: formData.qty,
      barcode: formData.barcode || generateBarcode()
    };

    try {
      await addStockStore(newStock);
      resetForm();
      message.success('Stock added successfully');
    } catch (error) {
      message.error('Failed to add stock: ' + error.message);
    }
  };


  
  const handleEditStock = (stockId: string) => {
    const stockToEdit = stockStores.find(stock => stock.id === stockId);
    if (stockToEdit) {
      setFormData({
        ...stockToEdit,
        qty: stockToEdit.quantity // Map quantity to qty for form
      });
      setEditingStockId(stockId);
      setIsNewCompany(false);
      message.info('Editing stock record');
    }
  };

  const handleSaveEdit = () => {
    if (!editingStockId || !validateForm()) return;

    const product = products.find(p => p.id === formData.productId);
    const showroom = showrooms.find(s => s.id === formData.showroomId);
    
    if (!product || !showroom) {
      message.error('Invalid product or showroom selected');
      return;
    }

    const updatedStock = {
      ...formData,
      quantity: formData.qty, // Map qty to quantity for storage
      category: product.category,
      unit: product.unit,
      totalAmount: calculateTotalAmount(),
      availableStock: formData.qty // Simplified for edit (in real app, you'd calculate this differently)
    };

    try {
      updateStockStore(editingStockId, updatedStock);
      resetForm();
      message.success('Stock updated successfully');
    } catch (error) {
      message.error('Failed to update stock: ' + error.message);
    }
  };

  const handleDeleteStock = (stockId: string) => {
    Modal.confirm({
      title: 'Confirm Delete',
      content: 'Are you sure you want to delete this stock record?',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        deleteStockStore(stockId);
        message.success('Stock deleted successfully');
      }
    });
  };

  const columns = [
    { title: 'Sr', dataIndex: 'sr', key: 'sr' },
    { title: 'Inward Date', dataIndex: 'inwardDate', key: 'inwardDate' },
    { 
      title: 'Store', 
      dataIndex: 'showroomId', 
      key: 'showroomId', 
      render: (id: string) => showrooms.find(s => s.id === id)?.name || 'N/A' 
    },
    { title: 'Company', dataIndex: 'companyName', key: 'companyName' },
    { 
      title: 'Product', 
      dataIndex: 'productId', 
      key: 'productId',
      render: (id: string) => products.find(p => p.id === id)?.name || 'N/A'
    },
    { title: 'Category', dataIndex: 'category', key: 'category' },
    { title: 'Unit', dataIndex: 'unit', key: 'unit' },
    { 
      title: 'Inward Price', 
      dataIndex: 'inwardPrice', 
      key: 'inwardPrice',
      render: (value: number) => `₹${value.toFixed(2)}`
    },
    { 
      title: 'Sale Price', 
      dataIndex: 'salePrice', 
      key: 'salePrice',
      render: (value: number) => `₹${value.toFixed(2)}`
    },
    { title: 'Qty', dataIndex: 'quantity', key: 'quantity' },
    { 
      title: 'Total', 
      dataIndex: 'totalAmount', 
      key: 'totalAmount',
      render: (value: number) => `₹${value.toFixed(2)}`
    },
    { title: 'Stock', dataIndex: 'availableStock', key: 'availableStock' },
    { title: 'Barcode', dataIndex: 'barcode', key: 'barcode' },
    { title: 'Rack', dataIndex: 'rack', key: 'rack' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <div>
          <Button onClick={() => handleEditStock(record.id)} style={{ marginRight: 8 }}>Edit</Button>
          <Button onClick={() => handleDeleteStock(record.id)} danger>Delete</Button>
        </div>
      ),
    },
  ];

  const tableData = stockStores.map((stock, index) => ({
    ...stock,
    sr: index + 1,
    key: stock.id,
  }));

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, padding: 24, backgroundColor: '#fff', borderRadius: 8 }}>
        <h2>{editingStockId ? 'Edit Stock' : 'Add New Stock'}</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
          {/* Row 1 */}
          <div>
            <label>Inward Date</label>
            <DatePicker
              value={formData.inwardDate ? moment(formData.inwardDate) : null}
              onChange={handleDateChange}
              style={{ width: '100%' }}
            />
          </div>
          
          <div>
            <label>Company Name</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <AutoComplete
                value={formData.companyName}
                onChange={(value) => {
                  setFormData(prev => ({ ...prev, companyName: value }));
                  handleCompanySearch(value);
                }}
                onSelect={handleCompanySelect}
                onSearch={handleCompanySearch}
                placeholder="Search company"
                style={{ flex: 1 }}
                options={filteredCompanies.map(company => ({
                  value: company.id,
                  label: company.name
                }))}
              />
              {isNewCompany && (
                <Button 
                  type="primary" 
                  onClick={handleAddNewCompany}
                  style={{ width: 100 }}
                >
                  Add Company
                </Button>
              )}
            </div>
          </div>
          
          <div>
            <label>Product</label>
            <Select
              value={formData.productId}
              onChange={(value) => handleSelectChange('productId', value)}
              style={{ width: '100%' }}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option?.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {products.map(product => (
                <Option key={product.id} value={product.id}>{product.name}</Option>
              ))}
            </Select>
          </div>
          
          <div>
            <label>Showroom</label>
            <Select
              value={formData.showroomId}
              onChange={(value) => handleSelectChange('showroomId', value)}
              style={{ width: '100%' }}
            >
              {showrooms.map(showroom => (
                <Option key={showroom.id} value={showroom.id}>{showroom.name}</Option>
              ))}
            </Select>
          </div>

          {/* Row 2 */}
          <div>
            <label>Category</label>
            <Input
              name="category"
              value={formData.category}
              readOnly
              style={{ width: '100%' }}
            />
          </div>
          
          <div>
            <label>Unit</label>
            <Input
              name="unit"
              value={formData.unit}
              readOnly
              style={{ width: '100%' }}
            />
          </div>
          
          <div>
            <label>Inward Price</label>
            <Input
              type="number"
              name="inwardPrice"
              value={formData.inwardPrice}
              onChange={handleInputChange}
              style={{ width: '100%' }}
            />
          </div>
          
          <div>
            <label>Sale Price</label>
            <Input
              type="number"
              name="salePrice"
              value={formData.salePrice}
              onChange={handleInputChange}
              style={{ width: '100%' }}
            />
          </div>

          {/* Row 3 */}
          <div>
            <label>GST (%)</label>
            <Input
              type="number"
              name="gst"
              value={formData.gst}
              onChange={handleInputChange}
              style={{ width: '100%' }}
            />
          </div>
          
          <div>
            <label>Discount</label>
            <Input
              type="number"
              name="discount"
              value={formData.discount}
              onChange={handleInputChange}
              style={{ width: '100%' }}
            />
          </div>
          
          <div>
            <label>Quantity</label>
            <Input
              type="number"
              name="qty"
              value={formData.qty}
              onChange={handleInputChange}
              style={{ width: '100%' }}
            />
          </div>
          
          <div>
            <label>Total Amount</label>
            <Input
              type="number"
              name="totalAmount"
              value={calculateTotalAmount()}
              readOnly
              style={{ width: '100%' }}
            />
          </div>

          {/* Row 4 */}
          <div>
            <label>Barcode</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <Input
                name="barcode"
                value={formData.barcode}
                onChange={handleInputChange}
                style={{ flex: 1 }}
              />
              <Button 
                onClick={handleGenerateBarcode}
                disabled={!!formData.barcode}
              >
                Generate
              </Button>
            </div>
          </div>
          
          <div>
            <label>Rack</label>
            <Input
              name="rack"
              value={formData.rack}
              onChange={handleInputChange}
              style={{ width: '100%' }}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            {editingStockId ? (
              <>
                <Button 
                  type="primary" 
                  onClick={handleSaveEdit}
                  style={{ flex: 1 }}
                >
                  Save Changes
                </Button>
                <Button 
                  onClick={resetForm}
                  style={{ flex: 1 }}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button 
                type="primary" 
                onClick={handleAddStock}
                style={{ flex: 1 }}
              >
                Add Stock
              </Button>
            )}
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: '#fff', padding: 24, borderRadius: 8 }}>
        <Table
          columns={columns}
          dataSource={tableData}
          scroll={{ x: 1500 }}
          pagination={{ pageSize: 10 }}
          bordered
          title={() => <h3>Stock Records</h3>}
        />
      </div>
    </div>
  );
};

export default StockManagement;