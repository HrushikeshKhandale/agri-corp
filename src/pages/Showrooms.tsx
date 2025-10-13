 
import React, { useState, useEffect } from 'react';
import { Table, Modal, Form, Input, Checkbox, message, Segmented, Spin } from 'antd';
import { useAuth } from '../context/AuthContexts';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card';
import { Button, buttonVariants } from '../components/ui/button';
import showroomService from '../services/showroomService';
import { Showroom } from '../services/types/showroom';

// Type for create/update payload (without 'id')
type ShowroomPayload = Omit<Showroom, 'id'>;

const Showrooms: React.FC = () => {
  const { user, role, hasPermission } = useAuth();
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingShowroom, setEditingShowroom] = useState<Showroom | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [showrooms, setShowrooms] = useState<Showroom[]>([]);
  const [loadingShowrooms, setLoadingShowrooms] = useState(true);
  const [tablePagination, setTablePagination] = useState({
    current: 1,
    pageSize: 10,
  });

  // Fetch showrooms on mount
  useEffect(() => {
    const fetchShowrooms = async () => {
      try {
        const data = await showroomService.getAllShowrooms();
        setShowrooms(data);
      } catch (error) {
        console.error('Failed to fetch showrooms:', error);
        message.error('Failed to load showrooms');
      } finally {
        setLoadingShowrooms(false);
      }
    };

    if (hasPermission('view_showrooms')) {
      fetchShowrooms();
    } else {
      setLoadingShowrooms(false);
    }
  }, [hasPermission]);

  // Permission guard
  if (!hasPermission('view_showrooms')) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <h2 className="text-2xl font-semibold">Showrooms</h2>
        <p className="text-gray-600">You do not have permission to view showrooms.</p>
      </div>
    );
  }

  if (loadingShowrooms) {
    return (
      <div className="p-8 text-center">
        <Spin size="large" />
        <p className="mt-2">Loading showrooms...</p>
      </div>
    );
  }

  // Find user's showroom by matching contactPerson with username
  const userShowroom = showrooms.find(s => s.contactPerson === user?.username);

  // Filter showrooms: ADMIN sees all, others see only their own
  const filteredShowrooms = role === 'ADMIN' ? showrooms : userShowroom ? [userShowroom] : [];

  // CRUD Functions
  const addShowroom = async (data: ShowroomPayload) => {
    try {
      const newShowroom = await showroomService.createShowroom(data);
      message.success('Showroom added successfully');

      // ✅ Refetch to ensure fresh data
      const updatedShowrooms = await showroomService.getAllShowrooms();
      setShowrooms(updatedShowrooms);

    } catch (error) {
      message.error('Failed to add showroom');
      console.error('Add showroom error:', error);
      throw error;
    }
  };

  const updateShowroom = async (id: number, data: ShowroomPayload) => {
    try {
      const updated = await showroomService.updateShowroom(id, data);
      message.success('Showroom updated successfully');

      // ✅ Refetch to ensure fresh data
      const updatedShowrooms = await showroomService.getAllShowrooms();
      setShowrooms(updatedShowrooms);

    } catch (error) {
      message.error('Failed to update showroom');
      console.error('Update showroom error:', error);
      throw error;
    }
  };

  const deleteShowroom = async (id: number) => {
    try {
      await showroomService.deleteShowroom(id);
      message.success('Showroom deleted successfully');

      // ✅ Refetch to ensure fresh data
      const updatedShowrooms = await showroomService.getAllShowrooms();
      setShowrooms(updatedShowrooms);

    } catch (error) {
      message.error('Failed to delete showroom');
      console.error('Delete showroom error:', error);
    }
  };

  // Table Columns
  const columns = [
    {
      title: 'Sr. No.',
      render: (_: any, __: any, index: number) => {
        const { current, pageSize } = tablePagination;
        return (current - 1) * pageSize + index + 1;
      },
      align: 'center' as const,
    },
    { title: 'Name', dataIndex: 'name', key: 'name', align: 'center' as const },
    { title: 'Location', dataIndex: 'location', key: 'location', align: 'center' as const },
    { title: 'Contact Person', dataIndex: 'contactPerson', key: 'contactPerson', align: 'center' as const },
    { title: 'Phone', dataIndex: 'phone', key: 'phone', align: 'center' as const },
    { title: 'Email', dataIndex: 'email', key: 'email', align: 'center' as const },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center' as const,
      render: (_: any, record: Showroom) => (
        <span className="flex flex-wrap justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              Modal.confirm({
                title: 'Edit Showroom',
                content: `Are you sure you want to edit "${record.name}"?`,
                okText: 'Edit',
                cancelText: 'Cancel',
                onOk: () => {
                  setEditingShowroom(record);
                  setTimeout(() => {
                    form.setFieldsValue(record);
                  }, 0);
                  setIsModalVisible(true);
                },
                onCancel() {
                  console.log('Edit cancelled');
                },
              });
            }}
            disabled={!hasPermission('manage_showrooms') || (role !== 'ADMIN' && record.id !== userShowroom?.id)}
          >
            <EditOutlined /> 
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              Modal.confirm({
                title: 'Delete Showroom',
                content: `Are you sure you want to delete "${record.name}"? This action cannot be undone.`,
                okText: 'Yes, Delete',
                okType: 'danger',
                cancelText: 'Cancel',
                onOk: async () => {
                  console.log(`Attempting to delete showroom ${record.id} by user with role ${role}`);
                  await deleteShowroom(record.id);
                },
                onCancel() {
                  console.log('Delete cancelled');
                },
              });
            }}
            disabled={!hasPermission('manage_showrooms') || (role !== 'ADMIN' && record.id !== userShowroom?.id)}
          >
            <DeleteOutlined /> 
          </Button>
        </span>
      ),
    },
  ];

  // Modal Submit Handler
  const handleSubmit = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const values = await form.validateFields();
      const showroomData: ShowroomPayload = {
        name: values.name,
        location: values.location,
        contactPerson: values.contactPerson,
        phone: values.phone,
        email: values.email,
        adminEmail: values.createAdmin ? values.adminEmail : null,
        adminPassword: values.createAdmin ? values.adminPassword : null,
      };

      if (editingShowroom) {
        if (role !== 'ADMIN' && editingShowroom.id !== userShowroom?.id) {
          message.error('You can only edit your own showroom');
          return;
        }
        await updateShowroom(editingShowroom.id, showroomData);
      } else {
        if (role !== 'ADMIN') {
          message.error('Only ADMIN can add new showrooms');
          return;
        }
        await addShowroom(showroomData);
      }

      form.resetFields();
      setEditingShowroom(null);
      setIsModalVisible(false);
    } catch (error) {
      message.error('Failed to save showroom');
      console.error('Error saving showroom:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h2 className="text-2xl font-semibold">{role === 'ADMIN' ? 'Showrooms' : 'Your Showroom'}</h2>
        <div className="flex gap-2 flex-wrap items-center">
          <Segmented
             options={['List View', 'Card View']}
            value={viewMode === 'list' ? 'List View' : 'Card View'}
            onChange={value => setViewMode(value === 'List View' ? 'list' : 'card')}
          />
          <Button
            variant="default"
            onClick={() => {
              setEditingShowroom(null);
              form.resetFields();
              setIsModalVisible(true);
            }}
            disabled={!hasPermission('manage_showrooms') || role !== 'ADMIN'}
          >
            Add Showroom
          </Button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="overflow-x-auto bg-white rounded shadow">
          <Table
            scroll={{ x: 'max-content' }}
            dataSource={filteredShowrooms}
            columns={columns}
            rowKey="id"
            pagination={{
              ...tablePagination,
              onChange: (page, pageSize) => {
                setTablePagination({ current: page, pageSize });
              },
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} showrooms`,
            }}
            className="min-w-full"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredShowrooms.map((showroom, index) => (
            <Card key={showroom.id} className="flex flex-col h-full overflow-hidden rounded-lg shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-medium truncate">{showroom.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow space-y-2 pt-4 pb-4 overflow-hidden">
                <p><strong>Location:</strong> <span className="block truncate">{showroom.location}</span></p>
                <p><strong>Contact Person:</strong> <span className="block truncate">{showroom.contactPerson}</span></p>
                <p><strong>Phone:</strong> <span className="block truncate">{showroom.phone}</span></p>
                <p><strong>Email:</strong> <span className="block truncate">{showroom.email}</span></p>
                <p><strong>Sr. No.:</strong> {index + 1}</p>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row justify-start gap-2 pt-2 pb-4 px-4 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    Modal.confirm({
                      title: 'Edit Showroom',
                      content: `Are you sure you want to edit "${showroom.name}"?`,
                      okText: 'Edit',
                      cancelText: 'Cancel',
                      onOk: () => {
                        setEditingShowroom(showroom);
                        setTimeout(() => {
                          form.setFieldsValue(showroom);
                        }, 0);
                        setIsModalVisible(true);
                      },
                      onCancel() {
                        console.log('Edit cancelled');
                      },
                    });
                  }}
                  disabled={!hasPermission('manage_showrooms') || (role !== 'ADMIN' && showroom.id !== userShowroom?.id)}
                  className="w-full sm:w-auto text-xs py-1 px-2"
                >
                  <EditOutlined /> Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    Modal.confirm({
                      title: 'Delete Showroom',
                      content: `Are you sure you want to delete "${showroom.name}"? This action cannot be undone.`,
                      okText: 'Yes, Delete',
                      okType: 'danger',
                      cancelText: 'Cancel',
                      onOk: async () => {
                        console.log(`Attempting to delete showroom ${showroom.id} by user with role ${role}`);
                        await deleteShowroom(showroom.id);
                      },
                      onCancel() {
                        console.log('Delete cancelled');
                      },
                    });
                  }}
                  disabled={!hasPermission('manage_showrooms') || (role !== 'ADMIN' && showroom.id !== userShowroom?.id)}
                  className="w-full sm:w-auto text-xs py-1 px-2"
                >
                  <DeleteOutlined /> Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Modal
        title={editingShowroom ? 'Edit Showroom' : 'Add Showroom'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingShowroom(null);
          form.resetFields();
        }}
        confirmLoading={isLoading}
        width={Math.min(window.innerWidth - 40, 600)}
        okText="Save"
        okButtonProps={{ className: buttonVariants({ variant: 'default' }) }}
        cancelButtonProps={{ className: buttonVariants({ variant: 'outline' }) }}
        maskClosable={true}
        destroyOnClose={true}
      >
        <Form form={form} layout="vertical" className="space-y-2">
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please input showroom name!' }]}
          >
            <Input placeholder="Enter showroom name" />
          </Form.Item>
          <Form.Item
            name="location"
            label="Location"
            rules={[{ required: true, message: 'Please input location!' }]}
          >
            <Input placeholder="Enter location" />
          </Form.Item>
          <Form.Item
            name="contactPerson"
            label="Contact Person"
            rules={[{ required: true, message: 'Please input contact person!' }]}
          >
            <Input placeholder="Enter contact person name" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Phone"
            rules={[{ required: true, message: 'Please input phone number!' },
               {
      pattern: /^[0-9]{10}$/,
      message: 'Phone number must be exactly 10 digits',
    },
            ]}
          >
            <Input maxLength={10}
    placeholder="Enter 10-digit number"
    onKeyPress={(e) => {
      // Block any non-numeric key
      if (!/[0-9]/.test(e.key)) {
        e.preventDefault();
      }
    }}/>
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please input email!' },
              { type: 'email', message: 'Invalid email format' },
            ]}
          >
            <Input placeholder="Enter email" />
          </Form.Item>
          {!editingShowroom && (
            <>
              {/* Optional: Admin creation */}
              {/* <Form.Item
                name="createAdmin"
                valuePropName="checked"
                className="mb-0"
                rules={[
                  {
                    validator: () =>
                      hasPermission('manage_users')
                        ? Promise.resolve()
                        : Promise.reject('You do not have permission to create a Showroom Admin account'),
                  },
                ]}
              >
                <Checkbox disabled={!hasPermission('manage_users')}>
                  Create a Showroom Admin account
                </Checkbox>
              </Form.Item>
              <Form.Item
                name="adminEmail"
                label="Admin Email"
                rules={[
                  {
                    required: form.getFieldValue('createAdmin'),
                    message: 'Please input admin email!',
                  },
                  { type: 'email', message: 'Invalid email format' },
                ]}
              >
                <Input placeholder="Enter admin email" disabled={!hasPermission('manage_users')} />
              </Form.Item>
              <Form.Item
                name="adminPassword"
                label="Admin Password"
                rules={[
                  {
                    required: form.getFieldValue('createAdmin'),
                    message: 'Please input admin password!',
                  },
                ]}
              >
                <Input.Password placeholder="Enter admin password" disabled={!hasPermission('manage_users')} />
              </Form.Item> */}
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default Showrooms;




// import React, { useState } from "react";
// import { Table, Modal, Form, Input, Checkbox, message, Segmented } from "antd";
// import { useData } from "../context/DataContext";
// import { useAuth } from "../context/AuthContexts";
// import { Showroom } from "../context/DataContext";
// import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
// import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../components/ui/card";
// import { Button, buttonVariants } from "../components/ui/button";

// const Showrooms: React.FC = () => {
//   const { showrooms, addShowroom, updateShowroom, deleteShowroom } = useData();
//   const { authState, hasPermission } = useAuth();
//   const [form] = Form.useForm();
//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const [editingShowroom, setEditingShowroom] = useState<Showroom | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [viewMode, setViewMode] = useState<"list" | "card">("list");

//   if (!hasPermission("view_showrooms")) {
//     return (
//       <div className="p-4 sm:p-6 md:p-8">
//         <h2 className="text-2xl font-semibold">Showrooms</h2>
//         <p className="text-gray-600">You do not have permission to view showrooms.</p>
//       </div>
//     );
//   }

//   // Filter showrooms for non-ADMIN users
//   const filteredShowrooms = authState.role === 'ADMIN'
//     ? showrooms
//     : showrooms.filter(s => s.id === authState.showroomId);

//   const columns = [
//     {
//       title: "Sr. No.",
//       render: (_: any, __: any, index: number) => index + 1,
//       align: "center" as const,
//     },
//     { title: "Name", dataIndex: "name", key: "name", align: "center" as const },
//     { title: "Location", dataIndex: "location", key: "location", align: "center" as const },
//     { title: "Contact Person", dataIndex: "contactPerson", key: "contactPerson", align: "center" as const },
//     { title: "Phone", dataIndex: "phone", key: "phone", align: "center" as const },
//     { title: "Email", dataIndex: "email", key: "email", align: "center" as const },
//     {
//       title: "Actions",
//       key: "actions",
//       align: "center" as const,
//       render: (_: any, record: Showroom) => (
//         <span className="flex flex-wrap justify-center gap-2">
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={() => {
//               setEditingShowroom(record);
//               form.setFieldsValue(record);
//               setIsModalVisible(true);
//             }}
//             disabled={!hasPermission("manage_showrooms") || (authState.role !== 'ADMIN' && record.id !== authState.showroomId)}
//           >
//             <EditOutlined />
//             Edit
//           </Button>
//           <Button
//             variant="destructive"
//             size="sm"
//             onClick={() => {
//               console.log(`Attempting to delete showroom ${record.id} by user with role ${authState.role}`);
//               deleteShowroom(record.id);
//             }}
//             disabled={!hasPermission("manage_showrooms") || (authState.role !== 'ADMIN' && record.id !== authState.showroomId)}
//           >
//             <DeleteOutlined />
//             Delete
//           </Button>
//         </span>
//       ),
//     },
//   ];

//   const handleSubmit = async () => {
//     if (isLoading) return;
//     setIsLoading(true);
//     try {
//       const values = await form.validateFields();
//       const showroomData = {
//         name: values.name,
//         location: values.location,
//         contactPerson: values.contactPerson,
//         phone: values.phone,
//         email: values.email,
//       };

//       let newShowroomId: string;
//       if (editingShowroom) {
//         if (authState.role !== 'ADMIN' && editingShowroom.id !== authState.showroomId) {
//           message.error("You can only edit your own showroom");
//           console.log(`Permission check failed: edit showroom ${editingShowroom.id} for role ${authState.role}`);
//           return;
//         }
//         updateShowroom(editingShowroom.id, showroomData);
//         newShowroomId = editingShowroom.id;
//       } else {
//         if (authState.role !== 'ADMIN') {
//           message.error("Only ADMIN can add new showrooms");
//           console.log(`Permission check failed: add showroom for role ${authState.role}`);
//           return;
//         }
//         newShowroomId = addShowroom(showroomData);
//       }

//       if (
//         !editingShowroom &&
//         values.createAdmin &&
//         values.adminEmail &&
//         values.adminPassword &&
//         hasPermission("manage_users")
//       ) {
//         addUser({
//           name: `${values.name} Manager`,
//           email: values.adminEmail,
//           password: values.adminPassword,
//           role: "Showroom Admin",
//           showroomId: newShowroomId,
//         });
//       } else if (!editingShowroom && values.createAdmin && !hasPermission("manage_users")) {
//         message.error("You do not have permission to create a Showroom Admin account");
//         console.log(`Permission check failed: manage_users for role ${authState.role}`);
//       }

//       message.success(`Showroom ${editingShowroom ? "updated" : "added"} successfully!`);
//       form.resetFields();
//       setEditingShowroom(null);
//       setIsModalVisible(false);
//     } catch (error) {
//       message.error("Failed to save showroom");
//       console.error("Error saving showroom:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="p-4 sm:p-6 md:p-8">
//       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
//         <h2 className="text-2xl font-semibold">
//           {authState.role === 'ADMIN' ? 'Showrooms' : 'Your Showroom'}
//         </h2>
//         <div className="flex gap-2 flex-wrap items-center">
//           <Segmented
//             options={["List View", "Card View"]}
//             value={viewMode === "list" ? "List View" : "Card View"}
//             onChange={(value) => setViewMode(value === "List View" ? "list" : "card")}
//           />
//           <Button
//             variant="default"
//             onClick={() => {
//               setEditingShowroom(null);
//               form.resetFields();
//               setIsModalVisible(true);
//             }}
//             disabled={!hasPermission("manage_showrooms") || authState.role !== 'ADMIN'}
//           >
//             Add Showroom
//           </Button>
//         </div>
//       </div>

//       {viewMode === "list" ? (
//         <div className="overflow-x-auto bg-white rounded shadow">
//           <Table
//             scroll={{ x: "max-content" }}
//             dataSource={filteredShowrooms}
//             columns={columns}
//             rowKey="id"
//             pagination={{ pageSize: 10 }}
//           />
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//           {filteredShowrooms.map((showroom, index) => (
//             <Card key={showroom.id} className="flex flex-col">
//               <CardHeader>
//                 <CardTitle>{showroom.name}</CardTitle>
//               </CardHeader>
//               <CardContent className="flex-grow">
//                 <p>
//                   <strong>Location:</strong> {showroom.location}
//                 </p>
//                 <p>
//                   <strong>Contact Person:</strong> {showroom.contactPerson}
//                 </p>
//                 <p>
//                   <strong>Phone:</strong> {showroom.phone}
//                 </p>
//                 <p>
//                   <strong>Email:</strong> {showroom.email}
//                 </p>
//                 <p>
//                   <strong>Sr. No.:</strong> {index + 1}
//                 </p>
//               </CardContent>
//               <CardFooter className="flex justify-end gap-2">
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   onClick={() => {
//                     setEditingShowroom(showroom);
//                     form.setFieldsValue(showroom);
//                     setIsModalVisible(true);
//                   }}
//                   disabled={!hasPermission("manage_showrooms") || (authState.role !== 'ADMIN' && showroom.id !== authState.showroomId)}
//                 >
//                   <EditOutlined />
//                   Edit
//                 </Button>
//                 <Button
//                   variant="destructive"
//                   size="sm"
//                   onClick={() => {
//                     console.log(`Attempting to delete showroom ${showroom.id} by user with role ${authState.role}`);
//                     deleteShowroom(showroom.id);
//                   }}
//                   disabled={!hasPermission("manage_showrooms") || (authState.role !== 'ADMIN' && showroom.id !== authState.showroomId)}
//                 >
//                   <DeleteOutlined />
//                   Delete
//                 </Button>
//               </CardFooter>
//             </Card>
//           ))}
//         </div>
//       )}

//       <Modal
//         title={editingShowroom ? "Edit Showroom" : "Add Showroom"}
//         open={isModalVisible}
//         onOk={handleSubmit}
//         onCancel={() => {
//           setIsModalVisible(false);
//           setEditingShowroom(null);
//           form.resetFields();
//         }}
//         confirmLoading={isLoading}
//         width={600}
//         okText="Save"
//         okButtonProps={{ className: buttonVariants({ variant: "primary" }) }}
//         cancelButtonProps={{ className: buttonVariants({ variant: "outline" }) }}
//       >
//         <Form form={form} layout="vertical" className="space-y-2">
//           <Form.Item
//             name="name"
//             label="Name"
//             rules={[{ required: true, message: "Please input showroom name!" }]}
//           >
//             <Input />
//           </Form.Item>
//           <Form.Item
//             name="location"
//             label="Location"
//             rules={[{ required: true, message: "Please input location!" }]}
//           >
//             <Input />
//           </Form.Item>
//           <Form.Item
//             name="contactPerson"
//             label="Contact Person"
//             rules={[{ required: true, message: "Please input contact person!" }]}
//           >
//             <Input />
//           </Form.Item>
//           <Form.Item
//             name="phone"
//             label="Phone"
//             rules={[{ required: true, message: "Please input phone number!" }]}
//           >
//             <Input />
//           </Form.Item>
//           <Form.Item
//             name="email"
//             label="Email"
//             rules={[
//               { required: true, message: "Please input email!" },
//               { type: "email", message: "Invalid email format" },
//             ]}
//           >
//             <Input />
//           </Form.Item>
//           {!editingShowroom && (
//             <>
//               <Form.Item
//                 name="createAdmin"
//                 valuePropName="checked"
//                 className="mb-0"
//                 rules={[{ validator: () => hasPermission("manage_users") ? Promise.resolve() : Promise.reject("You do not have permission to create a Showroom Admin account") }]}
//               >
//                 <Checkbox disabled={!hasPermission("manage_users")}>
//                   Create a Showroom Admin account
//                 </Checkbox>
//               </Form.Item>
//               <Form.Item
//                 name="adminEmail"
//                 label="Admin Email"
//                 rules={[
//                   {
//                     required: form.getFieldValue("createAdmin"),
//                     message: "Please input admin email!",
//                   },
//                   { type: "email", message: "Invalid email format" },
//                 ]}
//               >
//                 <Input disabled={!hasPermission("manage_users")} />
//               </Form.Item>
//               <Form.Item
//                 name="adminPassword"
//                 label="Admin Password"
//                 rules={[
//                   {
//                     required: form.getFieldValue("createAdmin"),
//                     message: "Please input admin password!",
//                   },
//                 ]}
//               >
//                 <Input.Password disabled={!hasPermission("manage_users")} />
//               </Form.Item>
//             </>
//           )}
//         </Form>
//       </Modal>
//     </div>
//   );
// };

// export default Showrooms;
