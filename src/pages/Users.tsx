// src/pages/Users.tsx
import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Spin } from 'antd';
import { useAuth } from '../context/AuthContexts';
import { useData } from '../context/DataContext';
import { User } from '../context/AuthContexts'; // Import User interface
import { Showroom } from '../context/DataContext';
import userService, { User as ApiUser, RegisterRequest } from '../services/userService';

const { Option } = Select; // Import Option from antd Select

const Users: React.FC = () => {
  const { authState, addUser, updateUser, deleteUser, hasPermission } = useAuth();
  const { showrooms } = useData();
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [apiUsers, setApiUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
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

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'Username', dataIndex: 'username', key: 'username' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Role', dataIndex: 'role', key: 'role' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: ApiUser) => (
        <span>
          <Button
            onClick={() => {
              // Convert ApiUser to User format for editing
              const userForEdit = {
                id: record.id.toString(),
                name: record.username,
                email: record.email,
                role: record.role,
                showroomId: ''
              } as User;
              setEditingUser(userForEdit);
              form.setFieldsValue({
                ...userForEdit,
                password: undefined,
              });
              setIsModalVisible(true);
            }}
            disabled={!hasPermission('manage_users')}
          >
            Edit
          </Button>
          <Button
            danger
            onClick={() => deleteUser(record.id.toString())}
            disabled={!hasPermission('manage_users') || record.id.toString() === authState?.user?.id}
          >
            Delete
          </Button>
        </span>
      ),
    },
  ];

const handleSubmit = async () => {
  try {
    const values = await form.validateFields();
    
    if (editingUser) {
      const userData = {
        ...values,
        ...(values.password ? {} : { password: undefined }),
      };
      updateUser(editingUser.id, userData);
    } else {
      if (!values.password) {
        message.error('Password is required for new users');
        return;
      }
      
      const registerData: RegisterRequest = {
        username: values.name,
        password: values.password,
        email: values.email,
        role: values.role
      };
      
      await userService.registerUser(registerData);
      message.success('User registered successfully');
      fetchUsers(); // Refresh the user list
    }
    
    setIsModalVisible(false);
    form.resetFields();
    setEditingUser(null);
  } catch (error) {
    message.error('Failed to save user');
  }
};

  return (
    <div className="p-6">
      <h2>Users</h2>
      <Button
        type="primary"
        onClick={() => {
          setEditingUser(null);
          form.resetFields();
          setIsModalVisible(true);
        }}
        disabled={!hasPermission('manage_users')}
      >
        Add User
      </Button>
      <Spin spinning={loading}>
        <Table 
          dataSource={apiUsers} 
          columns={columns} 
          rowKey="id"
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Total ${total} users`
          }}
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
            rules={[{ required: true, type: 'email', message: 'Please input a valid email!' }]}
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