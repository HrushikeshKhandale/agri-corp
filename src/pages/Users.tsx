import React, { useState, useEffect } from 'react';
import { Table, Modal, Form, Input, Select, message, Spin } from 'antd';
import userService, { User as ApiUser, RegisterRequest } from '../services/userService';
import showroomService from '../services/showroomService';
import { Showroom } from '../services/types/showroom';
import { Button } from '@/components/ui/button';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';

const { Option } = Select;

const Users: React.FC = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<ApiUser | null>(null);
  const [apiUsers, setApiUsers] = useState<ApiUser[]>([]);
  const [showrooms, setShowrooms] = useState<Showroom[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchShowrooms();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAllUsers();
      setApiUsers(response.Users);
    } catch (error) {
      message.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchShowrooms = async () => {
    try {
      const data = await showroomService.getAllShowrooms();
      setShowrooms(data);
    } catch (error) {
      message.error('Failed to fetch showrooms');
    }
  };

  const handleUpdateUser = async (id: number, userData: any) => {
    try {
      await userService.updateUser(id, userData);
      message.success('User updated successfully');
      fetchUsers();
    } catch (error: any) {
      message.error(error.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (id: number) => {
    try {
      await userService.deleteUser(id);
      message.success('User deleted successfully');
      fetchUsers();
    } catch (error: any) {
      message.error(error.message || 'Failed to delete user');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'Username', dataIndex: 'username', key: 'username' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Role', dataIndex: 'role', key: 'role' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: ApiUser) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingUser(record);
              form.setFieldsValue({
                name: record.username,
                email: record.email,
                role: record.role,
                password: undefined,
              });
              setIsModalVisible(true);
            }}
          >
            <EditOutlined/>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDeleteUser(record.id)}
          >
            <DeleteOutlined/>
          </Button>
        </div>
      ),
    },
  ];

const handleSubmit = async () => {
  try {
    const values = await form.validateFields();
    
    if (editingUser) {
      const userData = {
        username: values.name,
        email: values.email,
        role: values.role,
        ...(values.password && { password: values.password }),
      };
      await handleUpdateUser(editingUser.id, userData);
    } else {
      if (!values.password) {
        message.error('Password is required for new users');
        return;
      }
      
      const registerData: RegisterRequest = {
        username: values.name,
        password: values.password,
        email: values.email,
        role: values.role,
        createdAt: new Date().toISOString()
      };
      
      await userService.registerUser(registerData);
      message.success('User registered successfully');
      fetchUsers();
    }
    
    setIsModalVisible(false);
    form.resetFields();
    setEditingUser(null);
  } catch (error: any) {
    const errorMessage = error.message || 'Failed to save user';
    message.error(errorMessage);
  }
};

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">User Management</h2>
        <Button
          variant="default"
          onClick={() => {
            setEditingUser(null);
            form.resetFields();
            setIsModalVisible(true);
          }}
        >
          Add New User
        </Button>
      </div>
      <Spin spinning={loading}>
        <Table 
          dataSource={apiUsers} 
          columns={columns} 
          rowKey="id"
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Total ${total} users`,
            showSizeChanger: true,
            showQuickJumper: true
          }}
          scroll={{ x: 600 }}
          className="bg-white rounded-lg shadow-sm"
          bordered
        />
      </Spin>
      <Modal
        title={editingUser ? 'Edit User' : 'Add User'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingUser(null);
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please input name!' }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: !editingUser, message: 'Please input password!' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true, message: 'Please select a role!' }]}>
            <Select>
              <Option value="ADMIN">Admin</Option>
              <Option value="USER">User</Option>
            </Select>
          </Form.Item>
          <Form.Item name="showroomId" label="Showroom">
            <Select allowClear>
              {showrooms.map((s: Showroom) => (
                <Option key={s.id} value={s.id}>
                  {s.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Users;