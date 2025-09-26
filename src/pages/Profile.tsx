import React from 'react';
import { 
  Card, 
  Typography, 
  Avatar, 
  Descriptions, 
  Tag,
  Row,
  Col,
  Statistic,
  List
} from 'antd';
import { 
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  CalendarOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const Profile: React.FC = () => {
  const { authState } = useAuth();
  const { 
    employees, 
    showrooms, 
    attendance, 
    salaryRecords, 
    orders 
  } = useData();

  const user = authState.user;
  const employee = employees.find(emp => emp.email === user?.email);
  const showroom = showrooms.find(s => s.id === authState.showroomId);

  // Get user statistics
  const currentMonth = dayjs().format('YYYY-MM');
  const userAttendance = attendance.filter(att => 
    att.employeeId === employee?.id && 
    att.date.startsWith(currentMonth)
  );
  
  const presentDays = userAttendance.filter(att => att.status === 'Present').length;
  const totalWorkingDays = dayjs().daysInMonth();
  
  const latestSalary = salaryRecords
    .filter(record => record.employeeId === employee?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  const userOrders = user?.role === 'Employee' 
    ? [] 
    : orders.filter(order => order.showroomId === authState.showroomId);

  const recentActivity = [
    ...userAttendance.slice(-5).map(att => ({
      title: `Marked ${att.status}`,
      description: `Date: ${new Date(att.date).toLocaleDateString('en-IN')}`,
      time: att.createdAt
    })),
    ...userOrders.slice(-3).map(order => ({
      title: `Order ${order.orderNumber}`,
      description: `Customer: ${order.customerName} - ₹${order.total}`,
      time: order.createdAt
    }))
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Title level={2} className="!mb-1">Profile</Title>
        <p className="text-gray-600">Your account information and activity</p>
      </div>

      <Row gutter={[16, 16]}>
        {/* Profile Information */}
        <Col xs={24} lg={16}>
          <Card title="Profile Information" className="ag-card">
            <div className="flex items-start space-x-6">
              <Avatar 
                src={user.avatar} 
                icon={<UserOutlined />}
                size={120}
                className="flex-shrink-0"
              />
              
              <div className="flex-1">
                <Descriptions column={{ xs: 1, md: 2 }}>
                  <Descriptions.Item label="Name" span={2}>
                    <Text strong className="text-lg">{user.name}</Text>
                  </Descriptions.Item>
                  
                  <Descriptions.Item label="Role">
                    <Tag color="blue">{user.role}</Tag>
                  </Descriptions.Item>
                  
                  <Descriptions.Item label="Email">
                    <div className="flex items-center">
                      <MailOutlined className="mr-2" />
                      {user.email}
                    </div>
                  </Descriptions.Item>
                  
                  {employee && (
                    <>
                      <Descriptions.Item label="Phone">
                        <div className="flex items-center">
                          <PhoneOutlined className="mr-2" />
                          {employee.phone}
                        </div>
                      </Descriptions.Item>
                      
                      <Descriptions.Item label="Salary">
                        <div className="flex items-center">
                          <DollarOutlined className="mr-2" />
                          ₹{employee.salary.toLocaleString()}/month
                        </div>
                      </Descriptions.Item>
                    </>
                  )}
                  
                  {showroom && (
                    <Descriptions.Item label="Showroom" span={2}>
                      <div className="flex items-center">
                        <HomeOutlined className="mr-2" />
                        {showroom.name} - {showroom.location}
                      </div>
                    </Descriptions.Item>
                  )}
                  
                  <Descriptions.Item label="Member Since" span={2}>
                    <div className="flex items-center">
                      <CalendarOutlined className="mr-2" />
                      {employee ? new Date(employee.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                    </div>
                  </Descriptions.Item>
                </Descriptions>
              </div>
            </div>
          </Card>
        </Col>

        {/* Quick Stats */}
        <Col xs={24} lg={8}>
          <div className="space-y-4">
            {/* Attendance Stats */}
            <Card title="This Month" size="small" className="ag-card">
              <Row gutter={[8, 8]}>
                <Col span={12}>
                  <Statistic
                    title="Present Days"
                    value={presentDays}
                    suffix={`/${totalWorkingDays}`}
                    valueStyle={{ fontSize: '18px', color: 'hsl(var(--success))' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Attendance %"
                    value={Math.round((presentDays / totalWorkingDays) * 100)}
                    suffix="%"
                    valueStyle={{ fontSize: '18px', color: 'hsl(var(--primary))' }}
                  />
                </Col>
              </Row>
            </Card>

            {/* Salary Info */}
            {latestSalary && (
              <Card title="Latest Salary" size="small" className="ag-card">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Text>Base Salary:</Text>
                    <Text strong>₹{latestSalary.baseSalary.toLocaleString()}</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text>Advance:</Text>
                    <Text>₹{latestSalary.advanceTaken.toLocaleString()}</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text>Net Salary:</Text>
                    <Text strong className="text-green-600">₹{latestSalary.netSalary.toLocaleString()}</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text>Status:</Text>
                    <Tag color={latestSalary.status === 'Paid' ? 'green' : 'orange'}>
                      {latestSalary.status}
                    </Tag>
                  </div>
                </div>
              </Card>
            )}

            {/* Performance Stats for Admins */}
            {user.role !== 'Employee' && (
              <Card title="Performance" size="small" className="ag-card">
                <Row gutter={[8, 8]}>
                  <Col span={24}>
                    <Statistic
                      title="Orders Handled"
                      value={userOrders.length}
                      valueStyle={{ fontSize: '18px', color: 'hsl(var(--info))' }}
                    />
                  </Col>
                  <Col span={24}>
                    <Statistic
                      title="Revenue Generated"
                      value={userOrders.reduce((sum, order) => sum + order.total, 0)}
                      prefix="₹"
                      precision={0}
                      valueStyle={{ fontSize: '18px', color: 'hsl(var(--success))' }}
                    />
                  </Col>
                </Row>
              </Card>
            )}
          </div>
        </Col>
      </Row>

      {/* Recent Activity */}
      <Card title="Recent Activity" className="ag-card">
        {recentActivity.length > 0 ? (
          <List
            dataSource={recentActivity}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={item.title}
                  description={
                    <div>
                      <div>{item.description}</div>
                      <Text className="text-xs text-gray-400">
                        {new Date(item.time).toLocaleString('en-IN')}
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            )}
            size="small"
          />
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Text>No recent activity found</Text>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Profile;