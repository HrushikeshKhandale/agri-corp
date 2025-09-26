import React from 'react';
import { Card, Row, Col, Statistic, Typography, Progress, Table, Tag, Space, message } from 'antd';
import {
  ShoppingOutlined,
  ShopOutlined,
  TeamOutlined,
  DollarOutlined,
  AlertOutlined
} from '@ant-design/icons';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const { 
    products, 
    showrooms, 
    employees, 
    orders, 
    getTotalStockValue,
    transfers 
  } = useData();
  const { authState, hasPermission } = useAuth();

  if (!hasPermission('view_dashboard')) {
    return (
      <div className="p-6">
        <Title level={2}>Dashboard</Title>
        <Text type="secondary">You do not have permission to view the dashboard.</Text>
      </div>
    );
  }

  // Filter data by showroomId for non-Super Admin users
  const filteredShowrooms = authState.role === 'Super Admin'
    ? showrooms
    : showrooms.filter(s => s.id === authState.showroomId);
  const filteredOrders = authState.role === 'Super Admin'
    ? orders
    : orders.filter(o => o.showroomId === authState.showroomId);
  const filteredEmployees = authState.role === 'Super Admin'
    ? employees
    : employees.filter(e => e.showroomId === authState.showroomId);
  const filteredTransfers = authState.role === 'Super Admin'
    ? transfers
    : transfers.filter(t => t.fromShowroomId === authState.showroomId || t.toShowroomId === authState.showroomId);

  // Calculate statistics
  const totalProducts = authState.role === 'Super Admin'
    ? products.length
    : products.filter(p => Object.keys(p.stock).includes(authState.showroomId || '')).length;
  const totalShowrooms = filteredShowrooms.length;
  const totalEmployees = filteredEmployees.length;
  const totalOrders = filteredOrders.length;
  const totalStockValue = authState.role === 'Super Admin'
    ? getTotalStockValue()
    : getTotalStockValue(authState.showroomId);
  const pendingOrders = filteredOrders.filter(order => order.status === 'Pending').length;
  const pendingTransfers = filteredTransfers.filter(transfer => transfer.status === 'Pending').length;

  // Recent orders for table
  const recentOrders = filteredOrders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Stock data for chart
  const stockData = filteredShowrooms.map(showroom => ({
    name: showroom.name.split(' ')[0],
    value: getTotalStockValue(showroom.id)
  }));

  // Category distribution for pie chart
  const categoryData = [
    { name: 'Seeds', value: products.filter(p => p.category === 'Seeds' && (authState.role === 'Super Admin' || Object.keys(p.stock).includes(authState.showroomId || ''))).length, color: '#8884d8' },
    { name: 'Fertilizer', value: products.filter(p => p.category === 'Fertilizer' && (authState.role === 'Super Admin' || Object.keys(p.stock).includes(authState.showroomId || ''))).length, color: '#82ca9d' },
    { name: 'Pesticide', value: products.filter(p => p.category === 'Pesticide' && (authState.role === 'Super Admin' || Object.keys(p.stock).includes(authState.showroomId || ''))).length, color: '#ffc658' },
    { name: 'Equipment', value: products.filter(p => p.category === 'Equipment' && (authState.role === 'Super Admin' || Object.keys(p.stock).includes(authState.showroomId || ''))).length, color: '#ff7c7c' }
  ].filter(category => category.value > 0); // Remove categories with zero products

  // Low stock alerts
  const lowStockProducts = products.filter(product => {
    const stock = authState.role === 'Super Admin'
      ? Object.values(product.stock).reduce((sum, qty) => sum + qty, 0)
      : product.stock[authState.showroomId || ''] || 0;
    return stock < 50; // Alert threshold
  });

  const orderColumns = [
    {
      title: 'Order #',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 120
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName'
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (value: number) => `₹${value.toFixed(2)}`
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={
          status === 'Delivered' ? 'green' : 
          status === 'Approved' ? 'blue' : 'orange'
        }>
          {status}
        </Tag>
      )
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('en-IN')
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Title level={2} className="!mb-1">Dashboard</Title>
          <Text type="secondary">
            Welcome back, {authState.user?.name}! Here's what's happening in your {authState.role === 'Super Admin' ? 'agriculture business' : 'showroom'}.
          </Text>
        </div>
      </div>

      {/* Key Metrics */}
      <Row gutter={[16, 16]}>
        {hasPermission('view_products') && (
          <Col xs={24} sm={12} lg={6}>
            <Card className="ag-card">
              <Statistic
                title="Total Products"
                value={totalProducts}
                prefix={<ShoppingOutlined className="text-blue-500" />}
                valueStyle={{ color: 'hsl(var(--primary))' }}
              />
            </Card>
          </Col>
        )}
        {hasPermission('view_showrooms') && (
          <Col xs={24} sm={12} lg={6}>
            <Card className="ag-card">
              <Statistic
                title="Showrooms"
                value={totalShowrooms}
                prefix={<ShopOutlined className="text-green-500" />}
                valueStyle={{ color: 'hsl(var(--success))' }}
              />
            </Card>
          </Col>
        )}
        {hasPermission('view_employees') && (
          <Col xs={24} sm={12} lg={6}>
            <Card className="ag-card">
              <Statistic
                title="Employees"
                value={totalEmployees}
                prefix={<TeamOutlined className="text-purple-500" />}
                valueStyle={{ color: 'hsl(var(--info))' }}
              />
            </Card>
          </Col>
        )}
        {hasPermission('view_stock_alerts') && (
          <Col xs={24} sm={12} lg={6}>
            <Card className="ag-card">
              <Statistic
                title="Stock Value"
                value={totalStockValue}
                prefix={<DollarOutlined className="text-orange-500" />}
                precision={0}
                suffix="₹"
                valueStyle={{ color: 'hsl(var(--warning))' }}
              />
            </Card>
          </Col>
        )}
      </Row>

      {/* Alerts and Quick Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="Quick Actions" className="ag-card">
            <Space direction="vertical" className="w-full">
              {hasPermission('view_bill_history') && (
                <div className="flex justify-between items-center">
                  <Text>Pending Orders</Text>
                  <Tag color="orange">{pendingOrders}</Tag>
                </div>
              )}
              {hasPermission('view_transfers') && (
                <div className="flex justify-between items-center">
                  <Text>Pending Transfers</Text>
                  <Tag color="blue">{pendingTransfers}</Tag>
                </div>
              )}
              {hasPermission('view_stock_alerts') && (
                <div className="flex justify-between items-center">
                  <Text>Low Stock Items</Text>
                  <Tag color="red">{lowStockProducts.length}</Tag>
                </div>
              )}
              {hasPermission('view_bill_history') && (
                <Progress 
                  percent={Math.round((filteredOrders.filter(o => o.status === 'Delivered').length / (totalOrders || 1)) * 100)} 
                  strokeColor="hsl(var(--success))"
                  format={(percent) => `${percent}% Delivered`}
                />
              )}
            </Space>
          </Card>
        </Col>
        
        {hasPermission('view_stock_alerts') && (
          <Col xs={24} lg={16}>
            <Card title="Stock Value by Showroom" className="ag-card">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stockData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₹${value}`, 'Stock Value']} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        )}
      </Row>

      {/* Charts and Tables */}
      <Row gutter={[16, 16]}>
        {hasPermission('view_products') && (
          <Col xs={24} lg={12}>
            <Card title="Product Categories" className="ag-card">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        )}
        
        {hasPermission('view_stock_alerts') && (
          <Col xs={24} lg={12}>
            <Card 
              title={
                <Space>
                  <AlertOutlined />
                  Low Stock Alert
                </Space>
              } 
              className="ag-card"
            >
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {lowStockProducts.length === 0 ? (
                  <Text type="secondary">All products are well stocked!</Text>
                ) : (
                  lowStockProducts.map(product => {
                    const stock = authState.role === 'Super Admin'
                      ? Object.values(product.stock).reduce((sum, qty) => sum + qty, 0)
                      : product.stock[authState.showroomId || ''] || 0;
                    return (
                      <div key={product.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                        <div>
                          <Text strong>{product.name}</Text>
                          <div className="text-xs text-gray-500">{product.category}</div>
                        </div>
                        <Tag color="red">{stock} {product.unit}</Tag>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </Col>
        )}
      </Row>

      {hasPermission('view_bill_history') && (
        <Card title="Recent Orders" className="ag-card">
          <Table
            columns={orderColumns}
            dataSource={recentOrders}
            rowKey="id"
            pagination={false}
            size="middle"
          />
        </Card>
      )}
    </div>
  );
};

export default Dashboard;