import React, { useState } from 'react';
import { Button, Card, message, Space, Input, Select, Spin } from 'antd';
import userService, { RegisterRequest } from '../services/userService';

const { Option } = Select;

const ApiTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [registerData, setRegisterData] = useState<RegisterRequest>({
    username: '',
    password: '',
    email: '',
    role: 'USER'
  });

  const callGetAllUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAllUsers();
      setUsers(response.Users);
      message.success(`Fetched ${response.count} users`);
    } catch (error) {
      message.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const callGetAllEmployees = async () => {
    try {
      setLoading(true);
      const response = await userService.getAllEmployees();
      setEmployees(response);
      message.success(`Fetched ${response.length} employees`);
    } catch (error) {
      message.error('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const callRegisterUser = async () => {
    try {
      if (!registerData.username || !registerData.password || !registerData.email) {
        message.error('Please fill all fields');
        return;
      }
      setLoading(true);
      const response = await userService.registerUser(registerData);
      message.success(`User ${response.username} registered successfully`);
      setRegisterData({ username: '', password: '', email: '', role: 'USER' });
    } catch (error) {
      message.error('Failed to register user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1>API Test Page</h1>
      
      <Spin spinning={loading}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          
          {/* Get All Users */}
          <Card title="Get All Users API">
            <Button type="primary" onClick={callGetAllUsers}>
              Call getAllUsers
            </Button>
            {users.length > 0 && (
              <div className="mt-4">
                <h4>Users ({users.length}):</h4>
                <pre>{JSON.stringify(users, null, 2)}</pre>
              </div>
            )}
          </Card>

          {/* Get All Employees */}
          <Card title="Get All Employees API">
            <Button type="primary" onClick={callGetAllEmployees}>
              Call getAllEmployees
            </Button>
            {employees.length > 0 && (
              <div className="mt-4">
                <h4>Employees ({employees.length}):</h4>
                <pre>{JSON.stringify(employees, null, 2)}</pre>
              </div>
            )}
          </Card>

          {/* Register User */}
          <Card title="Register User API">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input
                placeholder="Username"
                value={registerData.username}
                onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
              />
              <Input.Password
                placeholder="Password"
                value={registerData.password}
                onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
              />
              <Input
                placeholder="Email"
                value={registerData.email}
                onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
              />
              <Select
                value={registerData.role}
                onChange={(value) => setRegisterData({...registerData, role: value})}
                style={{ width: '100%' }}
              >
                <Option value="USER">User</Option>
                <Option value="ADMIN">Admin</Option>
              </Select>
              <Button type="primary" onClick={callRegisterUser}>
                Call registerUser
              </Button>
            </Space>
          </Card>

        </Space>
      </Spin>
    </div>
  );
};

export default ApiTest;