import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, Row, Col, message } from 'antd';
import { Customer, useData } from '../context/DataContext';

const Customers: React.FC = () => {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useData();
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { title: 'Address', dataIndex: 'address', key: 'address' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Customer) => (
        <span>
          <Button onClick={() => {
            setEditingCustomer(record);
            form.setFieldsValue(record);
            setIsModalVisible(true);
          }}>Edit</Button>
          <Button danger onClick={() => deleteCustomer(record.id)}>Delete</Button>
        </span>
      )
    }
  ];

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingCustomer) {
        updateCustomer(editingCustomer.id, values);
      } else {
        addCustomer(values);
      }
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Failed to save customer');
    }
  };

  return (
    <div className="p-6">
      <Button type="primary" onClick={() => {
        setEditingCustomer(null);
        form.resetFields();
        setIsModalVisible(true);
      }}>Add Customer</Button>
      <Table dataSource={customers} columns={columns} rowKey="id" />
      <Modal
        title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="village" label="Village">
            <Input />
          </Form.Item>
          <Form.Item name="taluka" label="Taluka">
            <Input />
          </Form.Item>
          <Form.Item name="district" label="District">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Customers;