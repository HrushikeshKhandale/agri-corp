import React, { useState } from "react";
import { Table, Modal, Form, Input, Checkbox, message, Segmented } from "antd";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { Showroom } from "../context/DataContext";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../components/ui/card";
import { Button, buttonVariants } from "../components/ui/button";

const Showrooms: React.FC = () => {
  const { showrooms, addShowroom, updateShowroom, deleteShowroom } = useData();
  const { authState, hasPermission } = useAuth();
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingShowroom, setEditingShowroom] = useState<Showroom | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "card">("list");

  if (!hasPermission("view_showrooms")) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <h2 className="text-2xl font-semibold">Showrooms</h2>
        <p className="text-gray-600">You do not have permission to view showrooms.</p>
      </div>
    );
  }

  // Filter showrooms for non-Super Admin users
  const filteredShowrooms = authState.role === 'Super Admin'
    ? showrooms
    : showrooms.filter(s => s.id === authState.showroomId);

  const columns = [
    {
      title: "Sr. No.",
      render: (_: any, __: any, index: number) => index + 1,
      align: "center" as const,
    },
    { title: "Name", dataIndex: "name", key: "name", align: "center" as const },
    { title: "Location", dataIndex: "location", key: "location", align: "center" as const },
    { title: "Contact Person", dataIndex: "contactPerson", key: "contactPerson", align: "center" as const },
    { title: "Phone", dataIndex: "phone", key: "phone", align: "center" as const },
    { title: "Email", dataIndex: "email", key: "email", align: "center" as const },
    {
      title: "Actions",
      key: "actions",
      align: "center" as const,
      render: (_: any, record: Showroom) => (
        <span className="flex flex-wrap justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingShowroom(record);
              form.setFieldsValue(record);
              setIsModalVisible(true);
            }}
            disabled={!hasPermission("manage_showrooms") || (authState.role !== 'Super Admin' && record.id !== authState.showroomId)}
          >
            <EditOutlined />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              console.log(`Attempting to delete showroom ${record.id} by user with role ${authState.role}`);
              deleteShowroom(record.id);
            }}
            disabled={!hasPermission("manage_showrooms") || (authState.role !== 'Super Admin' && record.id !== authState.showroomId)}
          >
            <DeleteOutlined />
            Delete
          </Button>
        </span>
      ),
    },
  ];

  const handleSubmit = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const values = await form.validateFields();
      const showroomData = {
        name: values.name,
        location: values.location,
        contactPerson: values.contactPerson,
        phone: values.phone,
        email: values.email,
      };

      let newShowroomId: string;
      if (editingShowroom) {
        if (authState.role !== 'Super Admin' && editingShowroom.id !== authState.showroomId) {
          message.error("You can only edit your own showroom");
          console.log(`Permission check failed: edit showroom ${editingShowroom.id} for role ${authState.role}`);
          return;
        }
        updateShowroom(editingShowroom.id, showroomData);
        newShowroomId = editingShowroom.id;
      } else {
        if (authState.role !== 'Super Admin') {
          message.error("Only Super Admin can add new showrooms");
          console.log(`Permission check failed: add showroom for role ${authState.role}`);
          return;
        }
        newShowroomId = addShowroom(showroomData);
      }

      if (
        !editingShowroom &&
        values.createAdmin &&
        values.adminEmail &&
        values.adminPassword &&
        hasPermission("manage_users")
      ) {
        addUser({
          name: `${values.name} Manager`,
          email: values.adminEmail,
          password: values.adminPassword,
          role: "Showroom Admin",
          showroomId: newShowroomId,
        });
      } else if (!editingShowroom && values.createAdmin && !hasPermission("manage_users")) {
        message.error("You do not have permission to create a Showroom Admin account");
        console.log(`Permission check failed: manage_users for role ${authState.role}`);
      }

      message.success(`Showroom ${editingShowroom ? "updated" : "added"} successfully!`);
      form.resetFields();
      setEditingShowroom(null);
      setIsModalVisible(false);
    } catch (error) {
      message.error("Failed to save showroom");
      console.error("Error saving showroom:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <h2 className="text-2xl font-semibold">
          {authState.role === 'Super Admin' ? 'Showrooms' : 'Your Showroom'}
        </h2>
        <div className="flex gap-2 flex-wrap items-center">
          <Segmented
            options={["List View", "Card View"]}
            value={viewMode === "list" ? "List View" : "Card View"}
            onChange={(value) => setViewMode(value === "List View" ? "list" : "card")}
          />
          <Button
            variant="default"
            onClick={() => {
              setEditingShowroom(null);
              form.resetFields();
              setIsModalVisible(true);
            }}
            disabled={!hasPermission("manage_showrooms") || authState.role !== 'Super Admin'}
          >
            Add Showroom
          </Button>
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="overflow-x-auto bg-white rounded shadow">
          <Table
            scroll={{ x: "max-content" }}
            dataSource={filteredShowrooms}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredShowrooms.map((showroom, index) => (
            <Card key={showroom.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{showroom.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p>
                  <strong>Location:</strong> {showroom.location}
                </p>
                <p>
                  <strong>Contact Person:</strong> {showroom.contactPerson}
                </p>
                <p>
                  <strong>Phone:</strong> {showroom.phone}
                </p>
                <p>
                  <strong>Email:</strong> {showroom.email}
                </p>
                <p>
                  <strong>Sr. No.:</strong> {index + 1}
                </p>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingShowroom(showroom);
                    form.setFieldsValue(showroom);
                    setIsModalVisible(true);
                  }}
                  disabled={!hasPermission("manage_showrooms") || (authState.role !== 'Super Admin' && showroom.id !== authState.showroomId)}
                >
                  <EditOutlined />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    console.log(`Attempting to delete showroom ${showroom.id} by user with role ${authState.role}`);
                    deleteShowroom(showroom.id);
                  }}
                  disabled={!hasPermission("manage_showrooms") || (authState.role !== 'Super Admin' && showroom.id !== authState.showroomId)}
                >
                  <DeleteOutlined />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Modal
        title={editingShowroom ? "Edit Showroom" : "Add Showroom"}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingShowroom(null);
          form.resetFields();
        }}
        confirmLoading={isLoading}
        width={600}
        okText="Save"
        okButtonProps={{ className: buttonVariants({ variant: "primary" }) }}
        cancelButtonProps={{ className: buttonVariants({ variant: "outline" }) }}
      >
        <Form form={form} layout="vertical" className="space-y-2">
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Please input showroom name!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="location"
            label="Location"
            rules={[{ required: true, message: "Please input location!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="contactPerson"
            label="Contact Person"
            rules={[{ required: true, message: "Please input contact person!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Phone"
            rules={[{ required: true, message: "Please input phone number!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Please input email!" },
              { type: "email", message: "Invalid email format" },
            ]}
          >
            <Input />
          </Form.Item>
          {!editingShowroom && (
            <>
              <Form.Item
                name="createAdmin"
                valuePropName="checked"
                className="mb-0"
                rules={[{ validator: () => hasPermission("manage_users") ? Promise.resolve() : Promise.reject("You do not have permission to create a Showroom Admin account") }]}
              >
                <Checkbox disabled={!hasPermission("manage_users")}>
                  Create a Showroom Admin account
                </Checkbox>
              </Form.Item>
              <Form.Item
                name="adminEmail"
                label="Admin Email"
                rules={[
                  {
                    required: form.getFieldValue("createAdmin"),
                    message: "Please input admin email!",
                  },
                  { type: "email", message: "Invalid email format" },
                ]}
              >
                <Input disabled={!hasPermission("manage_users")} />
              </Form.Item>
              <Form.Item
                name="adminPassword"
                label="Admin Password"
                rules={[
                  {
                    required: form.getFieldValue("createAdmin"),
                    message: "Please input admin password!",
                  },
                ]}
              >
                <Input.Password disabled={!hasPermission("manage_users")} />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default Showrooms;
// import React, { useState } from 'react';
// import {
//   Table,
//   Button,
//   Input,
//   Space,
//   Typography,
//   Card,
//   Tag,
//   Modal,
//   Form,
//   Popconfirm,
//   Row,
//   Col,
//   Statistic
// } from 'antd';
// import {
//   PlusOutlined,
//   SearchOutlined,
//   EditOutlined,
//   DeleteOutlined,
//   ShopOutlined,
//   PhoneOutlined,
//   MailOutlined,
//   EnvironmentOutlined
// } from '@ant-design/icons';
// import { useData, Showroom } from '../context/DataContext';
// import { useAuth } from '../context/AuthContext';

// const { Title } = Typography;

// const Showrooms: React.FC = () => {
//   const { showrooms, addShowroom, updateShowroom, deleteShowroom, getTotalStockValue } = useData();
//   const { hasPermission } = useAuth();
//   const [searchText, setSearchText] = useState('');
//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const [editingShowroom, setEditingShowroom] = useState<Showroom | null>(null);
//   const [form] = Form.useForm();

//   // Filter showrooms
//   const filteredShowrooms = showrooms.filter(showroom => {
//     return showroom.name.toLowerCase().includes(searchText.toLowerCase()) ||
//            showroom.location.toLowerCase().includes(searchText.toLowerCase()) ||
//            showroom.contactPerson.toLowerCase().includes(searchText.toLowerCase());
//   });

//   const columns = [
//     {
//       title: 'Showroom',
//       key: 'showroom',
//       render: (_, record: Showroom) => (
//         <div className="space-y-1">
//           <div className="font-medium text-lg">{record.name}</div>
//           <div className="flex items-center text-gray-500 text-sm">
//             <EnvironmentOutlined className="mr-1" />
//             {record.location}
//           </div>
//         </div>
//       ),
//       width: 250
//     },
//     {
//       title: 'Contact Person',
//       key: 'contact',
//       render: (_, record: Showroom) => (
//         <div className="space-y-1">
//           <div className="font-medium">{record.contactPerson}</div>
//           <div className="flex items-center text-gray-500 text-sm">
//             <PhoneOutlined className="mr-1" />
//             {record.phone}
//           </div>
//           <div className="flex items-center text-gray-500 text-sm">
//             <MailOutlined className="mr-1" />
//             {record.email}
//           </div>
//         </div>
//       ),
//       width: 200
//     },
//     {
//       title: 'Stock Value',
//       key: 'stockValue',
//       render: (_, record: Showroom) => {
//         const value = getTotalStockValue(record.id);
//         return (
//           <Statistic
//             value={value}
//             prefix="₹"
//             precision={0}
//             valueStyle={{ fontSize: '16px' }}
//           />
//         );
//       },
//       width: 150
//     },
//     {
//       title: 'Status',
//       key: 'status',
//       render: () => (
//         <Tag color="green">Active</Tag>
//       ),
//       width: 100
//     },
//     {
//       title: 'Created',
//       dataIndex: 'createdAt',
//       key: 'createdAt',
//       render: (date: string) => new Date(date).toLocaleDateString('en-IN'),
//       width: 120
//     }
//   ];

//   if (hasPermission('manage_showrooms')) {
//     columns.push({
//       title: 'Actions',
//       key: 'actions',
//       render: (_, record: Showroom) => (
//         <Space>
//           <Button
//             icon={<EditOutlined />}
//             size="small"
//             onClick={() => handleEdit(record)}
//           />
//           <Popconfirm
//             title="Are you sure you want to delete this showroom?"
//             description="This will remove all associated stock and data."
//             onConfirm={() => deleteShowroom(record.id)}
//             okText="Yes"
//             cancelText="No"
//           >
//             <Button
//               icon={<DeleteOutlined />}
//               size="small"
//               danger
//             />
//           </Popconfirm>
//         </Space>
//       ),
//       width: 100
//     } as any);
//   }

//   const handleEdit = (showroom: Showroom) => {
//     setEditingShowroom(showroom);
//     form.setFieldsValue(showroom);
//     setIsModalVisible(true);
//   };

//   const handleAdd = () => {
//     setEditingShowroom(null);
//     form.resetFields();
//     setIsModalVisible(true);
//   };

//   const handleSubmit = async () => {
//     try {
//       const values = await form.validateFields();

//       if (editingShowroom) {
//         updateShowroom(editingShowroom.id, values);
//       } else {
//         addShowroom(values);
//       }

//       setIsModalVisible(false);
//       form.resetFields();
//     } catch (error) {
//       console.error('Validation failed:', error);
//     }
//   };

//   return (
//     <div className="space-y-6">
//       <div className="flex justify-between items-center">
//         <div>
//           <Title level={2} className="!mb-1">Showrooms</Title>
//           <p className="text-gray-600">Manage your agriculture showroom locations</p>
//         </div>
//         {hasPermission('manage_showrooms') && (
//           <Button
//             type="primary"
//             icon={<PlusOutlined />}
//             onClick={handleAdd}
//           >
//             Add Showroom
//           </Button>
//         )}
//       </div>

//       {/* Summary Cards */}
//       <Row gutter={[16, 16]}>
//         <Col xs={24} sm={8}>
//           <Card className="ag-card">
//             <Statistic
//               title="Total Showrooms"
//               value={showrooms.length}
//               prefix={<ShopOutlined />}
//               valueStyle={{ color: 'hsl(var(--primary))' }}
//             />
//           </Card>
//         </Col>
//         <Col xs={24} sm={8}>
//           <Card className="ag-card">
//             <Statistic
//               title="Total Stock Value"
//               value={getTotalStockValue()}
//               prefix="₹"
//               precision={0}
//               valueStyle={{ color: 'hsl(var(--success))' }}
//             />
//           </Card>
//         </Col>
//         <Col xs={24} sm={8}>
//           <Card className="ag-card">
//             <Statistic
//               title="Average Stock Value"
//               value={showrooms.length > 0 ? getTotalStockValue() / showrooms.length : 0}
//               prefix="₹"
//               precision={0}
//               valueStyle={{ color: 'hsl(var(--info))' }}
//             />
//           </Card>
//         </Col>
//       </Row>

//       {/* Search */}
//       <Card className="ag-card">
//         <Input
//           placeholder="Search showrooms..."
//           prefix={<SearchOutlined />}
//           value={searchText}
//           onChange={(e) => setSearchText(e.target.value)}
//           allowClear
//           className="max-w-md"
//         />
//       </Card>

//       {/* Showrooms Table */}
//       <Card className="ag-card">
//         <Table
//           columns={columns}
//           dataSource={filteredShowrooms}
//           rowKey="id"
//           pagination={{
//             pageSize: 10,
//             showSizeChanger: true,
//             showTotal: (total) => `Total ${total} showrooms`
//           }}
//           scroll={{ x: 800 }}
//         />
//       </Card>

//       {/* Add/Edit Modal */}
//       <Modal
//         title={editingShowroom ? 'Edit Showroom' : 'Add New Showroom'}
//         open={isModalVisible}
//         onOk={handleSubmit}
//         onCancel={() => {
//           setIsModalVisible(false);
//           form.resetFields();
//         }}
//         width={600}
//         okText={editingShowroom ? 'Update' : 'Create'}
//       >
//         <Form
//           form={form}
//           layout="vertical"
//         >
//           <Form.Item
//             name="name"
//             label="Showroom Name"
//             rules={[{ required: true, message: 'Please input showroom name!' }]}
//           >
//             <Input placeholder="Enter showroom name" />
//           </Form.Item>

//           <Form.Item
//             name="location"
//             label="Location"
//             rules={[{ required: true, message: 'Please input location!' }]}
//           >
//             <Input placeholder="City, State" />
//           </Form.Item>

//           <Row gutter={[16, 16]}>
//             <Col xs={24} md={12}>
//               <Form.Item
//                 name="contactPerson"
//                 label="Contact Person"
//                 rules={[{ required: true, message: 'Please input contact person!' }]}
//               >
//                 <Input placeholder="Manager name" />
//               </Form.Item>
//             </Col>
//             <Col xs={24} md={12}>
//               <Form.Item
//                 name="phone"
//                 label="Phone Number"
//                 rules={[
//                   { required: true, message: 'Please input phone number!' },
//                   { pattern: /^[+]?[\d\s-()]+$/, message: 'Please enter a valid phone number!' }
//                 ]}
//               >
//                 <Input placeholder="+91 XXXXXXXXXX" />
//               </Form.Item>
//             </Col>
//           </Row>

//           <Form.Item
//             name="email"
//             label="Email Address"
//             rules={[
//               { required: true, message: 'Please input email!' },
//               { type: 'email', message: 'Please enter a valid email!' }
//             ]}
//           >
//             <Input placeholder="showroom@email.com" />
//           </Form.Item>
//         </Form>
//       </Modal>
//     </div>
//   );
// };

// export default Showrooms;
