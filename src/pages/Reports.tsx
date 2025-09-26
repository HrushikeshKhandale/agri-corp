import React, { useState } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Statistic, 
  Select, 
  DatePicker,
  Table,
  Tag,
  Button,
  Space
} from 'antd';
import { 
  BarChartOutlined,
  DollarOutlined,
  ShoppingOutlined,
  TeamOutlined,
  DownloadOutlined,
  PrinterOutlined
} from '@ant-design/icons';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import dayjs from 'dayjs';
import { generateReportFromElement } from '../utils/pdfGenerator';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const Reports: React.FC = () => {
  const { 
    products, 
    showrooms, 
    employees, 
    orders, 
    transfers,
    getTotalStockValue,
    salaryRecords 
  } = useData();
  const { authState } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<string>('month');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  // Filter data based on user role
  const userShowrooms = authState.user?.role === 'Super Admin' 
    ? showrooms 
    : showrooms.filter(s => s.id === authState.showroomId);

  const userOrders = authState.user?.role === 'Super Admin' 
    ? orders 
    : orders.filter(o => o.showroomId === authState.showroomId);

  const userEmployees = authState.user?.role === 'Super Admin' 
    ? employees 
    : employees.filter(e => e.showroomId === authState.showroomId);

  // Calculate date range based on period
  const getDateRange = () => {
    if (dateRange) {
      return [dateRange[0].toDate(), dateRange[1].toDate()];
    }
    
    const now = new Date();
    let startDate = new Date();
    
    switch (selectedPeriod) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }
    
    return [startDate, now];
  };

  const [startDate, endDate] = getDateRange();

  // Filter orders by date range
  const filteredOrders = userOrders.filter(order => {
    const orderDate = new Date(order.createdAt);
    return orderDate >= startDate && orderDate <= endDate;
  });

  // Sales by showroom data
  const salesByShowroom = userShowrooms.map(showroom => {
    const showroomOrders = filteredOrders.filter(order => order.showroomId === showroom.id);
    const totalSales = showroomOrders.reduce((sum, order) => sum + order.total, 0);
    const orderCount = showroomOrders.length;
    
    return {
      name: showroom.name.split(' ')[0], // Short name for chart
      sales: totalSales,
      orders: orderCount,
      stockValue: getTotalStockValue(showroom.id)
    };
  });

  // Product category sales
  const categorySales = ['Seeds', 'Fertilizer', 'Pesticide', 'Equipment'].map(category => {
    const categoryProducts = products.filter(p => p.category === category);
    const categoryOrders = filteredOrders.flatMap(order => 
      order.items.filter(item => 
        categoryProducts.some(p => p.id === item.productId)
      )
    );
    
    const totalSales = categoryOrders.reduce((sum, item) => 
      sum + (item.quantity * item.price), 0
    );
    
    return {
      name: category,
      sales: totalSales,
      count: categoryOrders.length
    };
  });

  // Monthly sales trend (last 6 months)
  const monthlySales = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
    
    const monthOrders = userOrders.filter(order => 
      order.createdAt.startsWith(monthKey)
    );
    
    return {
      month: date.toLocaleDateString('en-IN', { month: 'short' }),
      sales: monthOrders.reduce((sum, order) => sum + order.total, 0),
      orders: monthOrders.length
    };
  });

  // Top selling products
  const topProducts = products.map(product => {
    const productOrders = filteredOrders.flatMap(order => 
      order.items.filter(item => item.productId === product.id)
    );
    
    const totalQuantity = productOrders.reduce((sum, item) => sum + item.quantity, 0);
    const totalRevenue = productOrders.reduce((sum, item) => 
      sum + (item.quantity * item.price), 0
    );
    
    return {
      id: product.id,
      name: product.name,
      category: product.category,
      quantitySold: totalQuantity,
      revenue: totalRevenue,
      stockLeft: Object.values(product.stock).reduce((sum, qty) => sum + qty, 0)
    };
  })
  .filter(product => product.quantitySold > 0)
  .sort((a, b) => b.revenue - a.revenue)
  .slice(0, 10);

  // Summary statistics
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = filteredOrders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalEmployees = userEmployees.length;
  const monthlyPayroll = userEmployees.reduce((sum, emp) => sum + emp.salary, 0);

  const exportToPDF = async () => {
    try {
      await generateReportFromElement('reports-dashboard', 'AgriERP_Report.pdf');
    } catch (error) {
      console.error('Failed to export PDF:', error);
    }
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

  const topProductColumns = [
    {
      title: 'Product',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <div>
          <div className="font-medium">{text}</div>
          <Tag className={`category-${record.category.toLowerCase()}`}>
            {record.category}
          </Tag>
        </div>
      )
    },
    {
      title: 'Qty Sold',
      dataIndex: 'quantitySold',
      key: 'quantitySold',
      render: (qty: number) => qty.toLocaleString()
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (revenue: number) => `₹${revenue.toLocaleString()}`
    },
    {
      title: 'Stock Left',
      dataIndex: 'stockLeft',
      key: 'stockLeft',
      render: (stock: number) => (
        <Tag color={stock < 50 ? 'red' : stock < 200 ? 'orange' : 'green'}>
          {stock.toLocaleString()}
        </Tag>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Title level={2} className="!mb-1">Reports & Analytics</Title>
          <p className="text-gray-600">Business insights and performance metrics</p>
        </div>
        <Space>
          <Button 
            icon={<DownloadOutlined />}
            onClick={exportToPDF}
          >
            Export PDF
          </Button>
          <Button 
            icon={<PrinterOutlined />}
            onClick={() => window.print()}
          >
            Print
          </Button>
        </Space>
      </div>

      {/* Filters */}
      <Card className="ag-card">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <Text strong>Time Period: </Text>
            <Select
              value={selectedPeriod}
              onChange={setSelectedPeriod}
              className="ml-2"
              style={{ width: 120 }}
            >
              <Option value="week">Last Week</Option>
              <Option value="month">Last Month</Option>
              <Option value="quarter">Last Quarter</Option>
              <Option value="year">Last Year</Option>
            </Select>
          </Col>
          <Col xs={24} md={8}>
            <Text strong>Custom Range: </Text>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              className="ml-2"
            />
          </Col>
        </Row>
      </Card>

      <div id="reports-dashboard">
        {/* Key Metrics */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card className="ag-card">
              <Statistic
                title="Total Revenue"
                value={totalRevenue}
                prefix={<DollarOutlined />}
                precision={0}
                suffix="₹"
                valueStyle={{ color: 'hsl(var(--success))' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="ag-card">
              <Statistic
                title="Total Orders"
                value={totalOrders}
                prefix={<ShoppingOutlined />}
                valueStyle={{ color: 'hsl(var(--primary))' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="ag-card">
              <Statistic
                title="Avg Order Value"
                value={averageOrderValue}
                prefix="₹"
                precision={0}
                valueStyle={{ color: 'hsl(var(--info))' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="ag-card">
              <Statistic
                title="Monthly Payroll"
                value={monthlyPayroll}
                prefix={<TeamOutlined />}
                precision={0}
                suffix="₹"
                valueStyle={{ color: 'hsl(var(--warning))' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Charts Row 1 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="Sales by Showroom" className="ag-card">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesByShowroom}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₹${value}`, 'Sales']} />
                  <Bar dataKey="sales" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          
          <Col xs={24} lg={12}>
            <Card title="Category Performance" className="ag-card">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categorySales}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="sales"
                  >
                    {categorySales.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`₹${value}`, 'Sales']} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>

        {/* Charts Row 2 */}
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card title="Sales Trend (Last 6 Months)" className="ag-card">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlySales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="sales" fill="hsl(var(--primary))" name="Sales (₹)" />
                  <Line yAxisId="right" type="monotone" dataKey="orders" stroke="hsl(var(--warning))" name="Orders" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>

        {/* Top Products Table */}
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card title="Top Selling Products" className="ag-card">
              <Table
                columns={topProductColumns}
                dataSource={topProducts}
                rowKey="id"
                pagination={false}
                size="middle"
              />
            </Card>
          </Col>
        </Row>

        {/* Stock Value by Showroom */}
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card title="Stock Value Analysis" className="ag-card">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={salesByShowroom}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="stockValue" fill="hsl(var(--info))" name="Stock Value (₹)" />
                  <Bar dataKey="sales" fill="hsl(var(--success))" name="Sales (₹)" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default Reports;