import React from 'react';
import { Card, Row, Col, Statistic, Typography, Progress, Table, Tag, Space } from 'antd';
import {
  ShoppingOutlined,
  ShopOutlined,
  TeamOutlined,
  DollarOutlined,
  AlertOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContexts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const { Title, Text } = Typography;

// Static mock data
const mockProducts = [
  { id: 1, name: 'Wheat Seeds', category: 'Seeds', stock: { '1': 100, '2': 50 }, unit: 'kg' },
  { id: 2, name: 'Nitrogen Fertilizer', category: 'Fertilizer', stock: { '1': 200, '2': 80 }, unit: 'kg' },
  { id: 3, name: 'Pesticide Spray', category: 'Pesticide', stock: { '1': 30, '2': 20 }, unit: 'liters' },
  { id: 4, name: 'Tractor', category: 'Equipment', stock: { '1': 5, '2': 2 }, unit: 'units' },
  { id: 5, name: 'Corn Seeds', category: 'Seeds', stock: { '1': 40, '2': 10 }, unit: 'kg' },
];

const mockShowrooms = [
  { id: 1, name: 'Main Branch', location: 'Delhi' },
  { id: 2, name: 'West Branch', location: 'Mumbai' },
];

const mockEmployees = [
  { id: 1, name: 'John Doe', showroomId: '1' },
  { id: 2, name: 'Jane Smith', showroomId: '1' },
  { id: 3, name: 'Bob Johnson', showroomId: '2' },
];

const mockOrders = [
  { id: 1, orderNumber: 'ORD001', customerName: 'Alice', total: 5000, status: 'Pending', createdAt: '2025-09-20', showroomId: '1' },
  { id: 2, orderNumber: 'ORD002', customerName: 'Bob', total: 3000, status: 'Delivered', createdAt: '2025-09-19', showroomId: '1' },
  { id: 3, orderNumber: 'ORD003', customerName: 'Charlie', total: 7000, status: 'Approved', createdAt: '2025-09-18', showroomId: '2' },
];

const mockTransfers = [
  { id: 1, fromShowroomId: '1', toShowroomId: '2', status: 'Pending' },
  { id: 2, fromShowroomId: '2', toShowroomId: '1', status: 'Approved' },
];

const getTotalStockValue = (showroomId?: string) => {
  if (!showroomId) {
    return mockProducts.reduce((sum, product) => {
      const totalStock = Object.values(product.stock).reduce((acc, qty) => acc + qty, 0);
      return sum + totalStock * 100; // Mock value: 100 INR per unit
    }, 0);
  }
  return mockProducts.reduce((sum, product) => {
    const stock = product.stock[showroomId] || 0;
    return sum + stock * 100; // Mock value: 100 INR per unit
  }, 0);
};

const Dashboard: React.FC = () => {
  const { user, role, hasPermission } = useAuth();

  if (!hasPermission('view_dashboard')) {
    return (
      <div className="p-6">
        <Title level={2}>Dashboard</Title>
        <Text type="secondary">You do not have permission to view the dashboard.</Text>
      </div>
    );
  }

  // Filter data by showroomId for non-Super Admin users
  const filteredShowrooms = role === 'Super Admin'
    ? mockShowrooms
    : mockShowrooms.filter(s => s.id.toString() === user?.showroomId);
  const filteredOrders = role === 'Super Admin'
    ? mockOrders
    : mockOrders.filter(o => o.showroomId === user?.showroomId);
  const filteredEmployees = role === 'Super Admin'
    ? mockEmployees
    : mockEmployees.filter(e => e.showroomId === user?.showroomId);
  const filteredTransfers = role === 'Super Admin'
    ? mockTransfers
    : mockTransfers.filter(t => t.fromShowroomId === user?.showroomId || t.toShowroomId === user?.showroomId);

  // Calculate statistics
  const totalProducts = role === 'Super Admin'
    ? mockProducts.length
    : mockProducts.filter(p => Object.keys(p.stock).includes(user?.showroomId || '')).length;
  const totalShowrooms = filteredShowrooms.length;
  const totalEmployees = filteredEmployees.length;
  const totalOrders = filteredOrders.length;
  const totalStockValue = role === 'Super Admin'
    ? getTotalStockValue()
    : getTotalStockValue(user?.showroomId);
  const pendingOrders = filteredOrders.filter(order => order.status === 'Pending').length;
  const pendingTransfers = filteredTransfers.filter(transfer => transfer.status === 'Pending').length;

  // Recent orders for table
  const recentOrders = filteredOrders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Stock data for chart
  const stockData = filteredShowrooms.map(showroom => ({
    name: showroom.name.split(' ')[0],
    value: getTotalStockValue(showroom.id.toString())
  }));

  // Category distribution for pie chart
  const categoryData = [
    { name: 'Seeds', value: mockProducts.filter(p => p.category === 'Seeds' && (role === 'Super Admin' || Object.keys(p.stock).includes(user?.showroomId || ''))).length, color: '#8884d8' },
    { name: 'Fertilizer', value: mockProducts.filter(p => p.category === 'Fertilizer' && (role === 'Super Admin' || Object.keys(p.stock).includes(user?.showroomId || ''))).length, color: '#82ca9d' },
    { name: 'Pesticide', value: mockProducts.filter(p => p.category === 'Pesticide' && (role === 'Super Admin' || Object.keys(p.stock).includes(user?.showroomId || ''))).length, color: '#ffc658' },
    { name: 'Equipment', value: mockProducts.filter(p => p.category === 'Equipment' && (role === 'Super Admin' || Object.keys(p.stock).includes(user?.showroomId || ''))).length, color: '#ff7c7c' }
  ].filter(category => category.value > 0);

  // Low stock alerts
  const lowStockProducts = mockProducts.filter(product => {
    const stock = role === 'Super Admin'
      ? Object.values(product.stock).reduce((sum, qty) => sum + qty, 0)
      : product.stock[user?.showroomId || ''] || 0;
    return stock < 50;
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
            Welcome back, {user?.username}! Here's what's happening in your {role === 'Super Admin' ? 'agriculture business' : 'showroom'}.
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
                    const stock = role === 'Super Admin'
                      ? Object.values(product.stock).reduce((sum, qty) => sum + qty, 0)
                      : product.stock[user?.showroomId || ''] || 0;
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



// import React from 'react';
// import { Card, Row, Col, Statistic, Typography, Progress, Table, Tag, Space, message } from 'antd';
// import {
//   ShoppingOutlined,
//   ShopOutlined,
//   TeamOutlined,
//   DollarOutlined,
//   AlertOutlined
// } from '@ant-design/icons';
// import { useData } from '../context/DataContext';
// import { useAuth } from '../context/AuthContext';
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// const { Title, Text } = Typography;

// const Dashboard: React.FC = () => {
//   const { 
//     products, 
//     showrooms, 
//     employees, 
//     orders, 
//     getTotalStockValue,
//     transfers 
//   } = useData();
//   const { authState, hasPermission } = useAuth();

//   if (!hasPermission('view_dashboard')) {
//     return (
//       <div className="p-6">
//         <Title level={2}>Dashboard</Title>
//         <Text type="secondary">You do not have permission to view the dashboard.</Text>
//       </div>
//     );
//   }

//   // Filter data by showroomId for non-Super Admin users
//   const filteredShowrooms = authState.role === 'Super Admin'
//     ? showrooms
//     : showrooms.filter(s => s.id === authState.showroomId);
//   const filteredOrders = authState.role === 'Super Admin'
//     ? orders
//     : orders.filter(o => o.showroomId === authState.showroomId);
//   const filteredEmployees = authState.role === 'Super Admin'
//     ? employees
//     : employees.filter(e => e.showroomId === authState.showroomId);
//   const filteredTransfers = authState.role === 'Super Admin'
//     ? transfers
//     : transfers.filter(t => t.fromShowroomId === authState.showroomId || t.toShowroomId === authState.showroomId);

//   // Calculate statistics
//   const totalProducts = authState.role === 'Super Admin'
//     ? products.length
//     : products.filter(p => Object.keys(p.stock).includes(authState.showroomId || '')).length;
//   const totalShowrooms = filteredShowrooms.length;
//   const totalEmployees = filteredEmployees.length;
//   const totalOrders = filteredOrders.length;
//   const totalStockValue = authState.role === 'Super Admin'
//     ? getTotalStockValue()
//     : getTotalStockValue(authState.showroomId);
//   const pendingOrders = filteredOrders.filter(order => order.status === 'Pending').length;
//   const pendingTransfers = filteredTransfers.filter(transfer => transfer.status === 'Pending').length;

//   // Recent orders for table
//   const recentOrders = filteredOrders
//     .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
//     .slice(0, 5);

//   // Stock data for chart
//   const stockData = filteredShowrooms.map(showroom => ({
//     name: showroom.name.split(' ')[0],
//     value: getTotalStockValue(showroom.id)
//   }));

//   // Category distribution for pie chart
//   const categoryData = [
//     { name: 'Seeds', value: products.filter(p => p.category === 'Seeds' && (authState.role === 'Super Admin' || Object.keys(p.stock).includes(authState.showroomId || ''))).length, color: '#8884d8' },
//     { name: 'Fertilizer', value: products.filter(p => p.category === 'Fertilizer' && (authState.role === 'Super Admin' || Object.keys(p.stock).includes(authState.showroomId || ''))).length, color: '#82ca9d' },
//     { name: 'Pesticide', value: products.filter(p => p.category === 'Pesticide' && (authState.role === 'Super Admin' || Object.keys(p.stock).includes(authState.showroomId || ''))).length, color: '#ffc658' },
//     { name: 'Equipment', value: products.filter(p => p.category === 'Equipment' && (authState.role === 'Super Admin' || Object.keys(p.stock).includes(authState.showroomId || ''))).length, color: '#ff7c7c' }
//   ].filter(category => category.value > 0); // Remove categories with zero products

//   // Low stock alerts
//   const lowStockProducts = products.filter(product => {
//     const stock = authState.role === 'Super Admin'
//       ? Object.values(product.stock).reduce((sum, qty) => sum + qty, 0)
//       : product.stock[authState.showroomId || ''] || 0;
//     return stock < 50; // Alert threshold
//   });

//   const orderColumns = [
//     {
//       title: 'Order #',
//       dataIndex: 'orderNumber',
//       key: 'orderNumber',
//       width: 120
//     },
//     {
//       title: 'Customer',
//       dataIndex: 'customerName',
//       key: 'customerName'
//     },
//     {
//       title: 'Total',
//       dataIndex: 'total',
//       key: 'total',
//       render: (value: number) => `₹${value.toFixed(2)}`
//     },
//     {
//       title: 'Status',
//       dataIndex: 'status',
//       key: 'status',
//       render: (status: string) => (
//         <Tag color={
//           status === 'Delivered' ? 'green' : 
//           status === 'Approved' ? 'blue' : 'orange'
//         }>
//           {status}
//         </Tag>
//       )
//     },
//     {
//       title: 'Date',
//       dataIndex: 'createdAt',
//       key: 'createdAt',
//       render: (date: string) => new Date(date).toLocaleDateString('en-IN')
//     }
//   ];

//   return (
//     <div className="space-y-6">
//       <div className="flex justify-between items-center">
//         <div>
//           <Title level={2} className="!mb-1">Dashboard</Title>
//           <Text type="secondary">
//             Welcome back, {authState.user?.name}! Here's what's happening in your {authState.role === 'Super Admin' ? 'agriculture business' : 'showroom'}.
//           </Text>
//         </div>
//       </div>

//       {/* Key Metrics */}
//       <Row gutter={[16, 16]}>
//         {hasPermission('view_products') && (
//           <Col xs={24} sm={12} lg={6}>
//             <Card className="ag-card">
//               <Statistic
//                 title="Total Products"
//                 value={totalProducts}
//                 prefix={<ShoppingOutlined className="text-blue-500" />}
//                 valueStyle={{ color: 'hsl(var(--primary))' }}
//               />
//             </Card>
//           </Col>
//         )}
//         {hasPermission('view_showrooms') && (
//           <Col xs={24} sm={12} lg={6}>
//             <Card className="ag-card">
//               <Statistic
//                 title="Showrooms"
//                 value={totalShowrooms}
//                 prefix={<ShopOutlined className="text-green-500" />}
//                 valueStyle={{ color: 'hsl(var(--success))' }}
//               />
//             </Card>
//           </Col>
//         )}
//         {hasPermission('view_employees') && (
//           <Col xs={24} sm={12} lg={6}>
//             <Card className="ag-card">
//               <Statistic
//                 title="Employees"
//                 value={totalEmployees}
//                 prefix={<TeamOutlined className="text-purple-500" />}
//                 valueStyle={{ color: 'hsl(var(--info))' }}
//               />
//             </Card>
//           </Col>
//         )}
//         {hasPermission('view_stock_alerts') && (
//           <Col xs={24} sm={12} lg={6}>
//             <Card className="ag-card">
//               <Statistic
//                 title="Stock Value"
//                 value={totalStockValue}
//                 prefix={<DollarOutlined className="text-orange-500" />}
//                 precision={0}
//                 suffix="₹"
//                 valueStyle={{ color: 'hsl(var(--warning))' }}
//               />
//             </Card>
//           </Col>
//         )}
//       </Row>

//       {/* Alerts and Quick Stats */}
//       <Row gutter={[16, 16]}>
//         <Col xs={24} lg={8}>
//           <Card title="Quick Actions" className="ag-card">
//             <Space direction="vertical" className="w-full">
//               {hasPermission('view_bill_history') && (
//                 <div className="flex justify-between items-center">
//                   <Text>Pending Orders</Text>
//                   <Tag color="orange">{pendingOrders}</Tag>
//                 </div>
//               )}
//               {hasPermission('view_transfers') && (
//                 <div className="flex justify-between items-center">
//                   <Text>Pending Transfers</Text>
//                   <Tag color="blue">{pendingTransfers}</Tag>
//                 </div>
//               )}
//               {hasPermission('view_stock_alerts') && (
//                 <div className="flex justify-between items-center">
//                   <Text>Low Stock Items</Text>
//                   <Tag color="red">{lowStockProducts.length}</Tag>
//                 </div>
//               )}
//               {hasPermission('view_bill_history') && (
//                 <Progress 
//                   percent={Math.round((filteredOrders.filter(o => o.status === 'Delivered').length / (totalOrders || 1)) * 100)} 
//                   strokeColor="hsl(var(--success))"
//                   format={(percent) => `${percent}% Delivered`}
//                 />
//               )}
//             </Space>
//           </Card>
//         </Col>
        
//         {hasPermission('view_stock_alerts') && (
//           <Col xs={24} lg={16}>
//             <Card title="Stock Value by Showroom" className="ag-card">
//               <ResponsiveContainer width="100%" height={200}>
//                 <BarChart data={stockData}>
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="name" />
//                   <YAxis />
//                   <Tooltip formatter={(value) => [`₹${value}`, 'Stock Value']} />
//                   <Bar dataKey="value" fill="hsl(var(--primary))" />
//                 </BarChart>
//               </ResponsiveContainer>
//             </Card>
//           </Col>
//         )}
//       </Row>

//       {/* Charts and Tables */}
//       <Row gutter={[16, 16]}>
//         {hasPermission('view_products') && (
//           <Col xs={24} lg={12}>
//             <Card title="Product Categories" className="ag-card">
//               <ResponsiveContainer width="100%" height={250}>
//                 <PieChart>
//                   <Pie
//                     data={categoryData}
//                     cx="50%"
//                     cy="50%"
//                     labelLine={false}
//                     label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
//                     outerRadius={80}
//                     fill="#8884d8"
//                     dataKey="value"
//                   >
//                     {categoryData.map((entry, index) => (
//                       <Cell key={`cell-${index}`} fill={entry.color} />
//                     ))}
//                   </Pie>
//                   <Tooltip />
//                 </PieChart>
//               </ResponsiveContainer>
//             </Card>
//           </Col>
//         )}
        
//         {hasPermission('view_stock_alerts') && (
//           <Col xs={24} lg={12}>
//             <Card 
//               title={
//                 <Space>
//                   <AlertOutlined />
//                   Low Stock Alert
//                 </Space>
//               } 
//               className="ag-card"
//             >
//               <div className="space-y-3 max-h-60 overflow-y-auto">
//                 {lowStockProducts.length === 0 ? (
//                   <Text type="secondary">All products are well stocked!</Text>
//                 ) : (
//                   lowStockProducts.map(product => {
//                     const stock = authState.role === 'Super Admin'
//                       ? Object.values(product.stock).reduce((sum, qty) => sum + qty, 0)
//                       : product.stock[authState.showroomId || ''] || 0;
//                     return (
//                       <div key={product.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
//                         <div>
//                           <Text strong>{product.name}</Text>
//                           <div className="text-xs text-gray-500">{product.category}</div>
//                         </div>
//                         <Tag color="red">{stock} {product.unit}</Tag>
//                       </div>
//                     );
//                   })
//                 )}
//               </div>
//             </Card>
//           </Col>
//         )}
//       </Row>

//       {hasPermission('view_bill_history') && (
//         <Card title="Recent Orders" className="ag-card">
//           <Table
//             columns={orderColumns}
//             dataSource={recentOrders}
//             rowKey="id"
//             pagination={false}
//             size="middle"
//           />
//         </Card>
//       )}
//     </div>
//   );
// };

// export default Dashboard;