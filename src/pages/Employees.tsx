import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Input, 
  Space, 
  Typography, 
  Card, 
  Row,
  Col,
  Statistic,
  Spin,
  message
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  UserOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContexts';
import userService, { Employee as ApiEmployee } from '../services/userService';

const { Title } = Typography;

const Employees: React.FC = () => {
  const { hasPermission } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [apiEmployees, setApiEmployees] = useState<ApiEmployee[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const employeesData = await userService.getAllEmployees();
      setApiEmployees(employeesData);
    } catch (error) {
      message.error('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const filteredApiEmployees = apiEmployees.filter(employee => {
    const matchesSearch = employee.username.toLowerCase().includes(searchText.toLowerCase()) ||
                         employee.role.toLowerCase().includes(searchText.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchText.toLowerCase());
    return matchesSearch;
  });

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      width: 150
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 120
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Title level={2} className="!mb-1">Employees</Title>
          <p className="text-gray-600">Manage staff and users</p>
        </div>
        {hasPermission('manage_employees') && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => message.info('Add employee functionality')}
          >
            Add Employee
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Employees"
              value={apiEmployees.length}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Admin Users"
              value={apiEmployees.filter(emp => emp.role === 'ADMIN').length}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Regular Users"
              value={apiEmployees.filter(emp => emp.role === 'USER').length}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Active Employees"
              value={apiEmployees.length}
            />
          </Card>
        </Col>
      </Row>

      {/* Search Filter */}
      <Card>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12} lg={8}>
            <Input
              placeholder="Search employees..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
        </Row>
      </Card>

      {/* Employees Table */}
      <Card>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredApiEmployees}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} employees`
            }}
            scroll={{ x: 1000 }}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default Employees;