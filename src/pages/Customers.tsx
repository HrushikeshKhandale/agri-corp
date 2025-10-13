// src/pages/Customers.tsx

import React, { useState, useEffect } from "react";
import {
  Table,
   Modal,
  Form,
  Input,
  Row,
  Col,
  message,
  Modal as AntdModal,
} from "antd";
import customerService from "../services/customerService";
import { Customer } from "../services/types/customer";
import { useAuth } from '../context/AuthContexts';
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Button, buttonVariants } from '../components/ui/button';

const Customers: React.FC = () => {
  const { hasPermission } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);

  // Permission guard
  if (!hasPermission('view_customers')) {
    return (
      <div className="p-6">
        <h2>Customers</h2>
        <p>You do not have permission to view customers.</p>
      </div>
    );
  }
// Add this state
const [tablePagination, setTablePagination] = useState({
  current: 1,
  pageSize: 10,
});

  // Fetch customers on mount
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const data = await customerService.getAllCustomers();
        setCustomers(data);
      } catch (error) {
        message.error("Failed to load customers");
        console.error("Fetch customers error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // CRUD Functions
  const addCustomer = async (data: Customer) => {
    try {
      const newCustomer = await customerService.createCustomer(data);
      setCustomers((prev) => [...prev, newCustomer]);
      message.success("Customer added successfully");
    } catch (error) {
      message.error("Failed to add customer");
      console.error("Add customer error:", error);
      throw error;
    }
  };

const updateCustomer = async (id: number, data: Customer) => {
  try {
    const updated = await customerService.updateCustomer(id, data);
    message.success('Customer updated successfully');

    // ✅ Refetch from server to ensure fresh data
    const updatedCustomers = await customerService.getAllCustomers();
    setCustomers(updatedCustomers);

  } catch (error) {
    message.error('Failed to update customer');
    console.error('Update customer error:', error);
    throw error;
  }
};

 const deleteCustomer = async (id: number) => {
  try {
    await customerService.deleteCustomer(id);
    message.success('Customer deleted successfully');
    
    // ✅ Refetch from server to ensure fresh data
    const updatedCustomers = await customerService.getAllCustomers();
    setCustomers(updatedCustomers);
    
  } catch (error) {
    message.error('Failed to delete customer');
    console.error('Delete customer error:', error);
  }
};

  const columns = [
    {
    title: 'Sr. No.',
    render: (_: any, __: any, index: number) => {
      const { current, pageSize } = tablePagination;
      return (current - 1) * pageSize + index + 1;
    },
    align: 'center' as const,
  },
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Phone", dataIndex: "phone", key: "phone" },
    { title: "Address", dataIndex: "address", key: "address" },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Customer) => (
        <div className="flex gap-2">
          <Button
variant="outline"
            size="sm"            onClick={() => {
              Modal.confirm({
                title: "Edit Customer",
                content: `Are you sure you want to edit "${record.name}"?`,
                okText: "Edit",
                cancelText: "Cancel",
                maskClosable: true,
                onOk: () => {
                  setEditingCustomer(record);
                  form.setFieldsValue(record);
                  setIsModalVisible(true);
                },
                onCancel() {
                  console.log("Edit cancelled");
                },
              });
            }}
            disabled={!hasPermission('edit_customer')}
          >
            <EditOutlined /> 
          </Button>
          <Button
              variant="destructive"
            size="sm"
            onClick={() => {
              Modal.confirm({
                title: "Are you sure you want to delete this customer?",
                content: `This action cannot be undone. Customer: ${record.name}`,
                okText: "Yes, Delete",
                okType: "danger",
                cancelText: "Cancel",
                maskClosable: true,
                onOk: async () => {
                  await deleteCustomer(record.id);
                },
                onCancel() {
                  console.log("Delete cancelled");
                },
              });
            }}
            disabled={!hasPermission('edit_customer')}
          >
            <DeleteOutlined /> 
          </Button>
        </div>
      ),
    },
  ];

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, values);
      } else {
        await addCustomer(values);
      }
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error("Failed to save customer");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Customers Management</h2>
        <Button
          type="primary"
          onClick={() => {
            setEditingCustomer(null);
            form.resetFields();
            setIsModalVisible(true);
          }}
          disabled={!hasPermission('add_customer')}
        >
          Add Customer
        </Button>
      </div>
      
      <Table
        dataSource={customers}
        columns={columns}
        rowKey="id"
        loading={loading}
  pagination={{
    ...tablePagination,
    onChange: (page, pageSize) => {
      setTablePagination({ current: page, pageSize });
    },
    showSizeChanger: true,
    pageSizeOptions: ['2','5','10', '20', '50', '100'],
    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} customers`,
  }}      />
      <Modal
        title={editingCustomer ? "Edit Customer" : "Add Customer"}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={loading}
        width={600}
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

// import React, { useState } from 'react';
// import { Table, Button, Modal, Form, Input, Row, Col, message } from 'antd';
// import { Customer, useData } from '../context/DataContext';

// const Customers: React.FC = () => {
//   const { customers, addCustomer, updateCustomer, deleteCustomer } = useData();
//   const [form] = Form.useForm();
//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

//   const columns = [
//     { title: 'Name', dataIndex: 'name', key: 'name' },
//     { title: 'Phone', dataIndex: 'phone', key: 'phone' },
//     { title: 'Address', dataIndex: 'address', key: 'address' },
//     {
//       title: 'Actions',
//       key: 'actions',
//       render: (_: any, record: Customer) => (
//         <span>
//           <Button onClick={() => {
//             setEditingCustomer(record);
//             form.setFieldsValue(record);
//             setIsModalVisible(true);
//           }}>Edit</Button>
//           <Button danger onClick={() => deleteCustomer(record.id)}>Delete</Button>
//         </span>
//       )
//     }
//   ];

//   const handleSubmit = async () => {
//     try {
//       const values = await form.validateFields();
//       if (editingCustomer) {
//         updateCustomer(editingCustomer.id, values);
//       } else {
//         addCustomer(values);
//       }
//       setIsModalVisible(false);
//       form.resetFields();
//     } catch (error) {
//       message.error('Failed to save customer');
//     }
//   };

//   return (
//     <div className="p-6">
//       <Button type="primary" onClick={() => {
//         setEditingCustomer(null);
//         form.resetFields();
//         setIsModalVisible(true);
//       }}>Add Customer</Button>
//       <Table dataSource={customers} columns={columns} rowKey="id" />
//       <Modal
//         title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
//         open={isModalVisible}
//         onOk={handleSubmit}
//         onCancel={() => setIsModalVisible(false)}
//       >
//         <Form form={form} layout="vertical">
//           <Form.Item name="name" label="Name" rules={[{ required: true }]}>
//             <Input />
//           </Form.Item>
//           <Form.Item name="phone" label="Phone" rules={[{ required: true }]}>
//             <Input />
//           </Form.Item>
//           <Form.Item name="village" label="Village">
//             <Input />
//           </Form.Item>
//           <Form.Item name="taluka" label="Taluka">
//             <Input />
//           </Form.Item>
//           <Form.Item name="district" label="District">
//             <Input />
//           </Form.Item>
//         </Form>
//       </Modal>
//     </div>
//   );
// };

// export default Customers;
