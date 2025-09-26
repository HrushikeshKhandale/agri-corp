// src/pages/Users.tsx
import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, message } from 'antd';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { User } from '../context/AuthContext'; // Import User interface
import { Showroom } from '../context/DataContext';

const { Option } = Select; // Import Option from antd Select

const Users: React.FC = () => {
  const { authState, addUser, updateUser, deleteUser, hasPermission } = useAuth();
  const { showrooms } = useData();
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Role', dataIndex: 'role', key: 'role' },
    {
      title: 'Showroom',
      dataIndex: 'showroomId',
      key: 'showroomId',
      render: (id: string) => showrooms.find((s: Showroom) => s.id === id)?.name || 'N/A',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: User) => (
        <span>
          <Button
            onClick={() => {
              setEditingUser(record);
              form.setFieldsValue({
                ...record,
                password: undefined, // Clear password field for security
              });
              setIsModalVisible(true);
            }}
            disabled={!hasPermission('manage_users')}
          >
            Edit
          </Button>
          <Button
            danger
            onClick={() => deleteUser(record.id)}
            disabled={!hasPermission('manage_users') || record.id === authState.user?.id}
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
    const userData = {
      ...values,
      ...(editingUser && !values.password ? { password: undefined } : {}),
    };
    if (editingUser) {
      updateUser(editingUser.id, userData);
    } else {
      if (!values.password) {
        message.error('Password is required for new users');
        return;
      }
      addUser(userData);
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
      <Table dataSource={authState.users} columns={columns} rowKey="id" />
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
              <Option value="Super Admin">Super Admin</Option>
              <Option value="Showroom Admin">Showroom Admin</Option>
              <Option value="Employee">Employee</Option>
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