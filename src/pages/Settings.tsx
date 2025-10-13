import React, { useState } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  InputNumber, 
  Switch, 
  Button, 
  Typography, 
  Row, 
  Col,
  message,
  Divider,
  Select,
  Segmented,
  Table,
  Modal
} from 'antd';
import { 
  SaveOutlined,
  SettingOutlined,
  EditOutlined
} from '@ant-design/icons';
import { LocalStorageService, STORAGE_KEYS } from '../utils/localStorage';
import { useAuth } from '../context/AuthContexts';
import { Card as UICard, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card';
import { Button as UIButton, buttonVariants } from '../components/ui/button';

const { Title, Text } = Typography;
const { Option } = Select;

interface Settings {
  appTitle: string;
  companyName: string;
  gstNumber: string;
  address: string;
  defaultGst: number;
  currency: string;
  theme: string;
  notifications: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
}

const Settings: React.FC = () => {
  const { authState, hasPermission } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editField, setEditField] = useState<string | null>(null);
  const [editForm] = Form.useForm();

  // Load current settings
  const currentSettings: Settings = LocalStorageService.get(STORAGE_KEYS.SETTINGS, {
    appTitle: 'AgriCorp',
    companyName: 'Green Fields Agriculture',
    gstNumber: '22AAAAA0000A1Z5',
    address: '123 Agriculture Hub, Farm City, State - 123456',
    defaultGst: 12,
    currency: 'INR',
    theme: 'light',
    notifications: {
      email: true,
      sms: true,
      whatsapp: true
    }
  });

  // Initialize form with current settings
  React.useEffect(() => {
    form.setFieldsValue(currentSettings);
  }, [form]);

  const handleSave = async () => {
    if (!hasPermission('manage_settings')) {
      message.error('You do not have permission to modify settings');
      console.log(`Permission check failed: manage_settings for role ${authState.role}`);
      return;
    }
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      LocalStorageService.set(STORAGE_KEYS.SETTINGS, values);
      message.success('Settings saved successfully!');
      console.log(`Settings saved by user with role ${authState.role}:`, values);
      
      // Update document title
      document.title = values.appTitle;
    } catch (error) {
      console.error('Failed to save settings:', error);
      message.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const resetToDefault = () => {
    if (!hasPermission('manage_settings')) {
      message.error('You do not have permission to reset settings');
      console.log(`Permission check failed: manage_settings for role ${authState.role}`);
      return;
    }
    const defaultSettings: Settings = {
      appTitle: 'AgriCorp',
      companyName: 'Green Fields Agriculture',
      gstNumber: '22AAAAA0000A1Z5',
      address: '123 Agriculture Hub, Farm City, State - 123456',
      defaultGst: 12,
      currency: 'INR',
      theme: 'light',
      notifications: {
        email: true,
        sms: true,
        whatsapp: true
      }
    };
    
    form.setFieldsValue(defaultSettings);
    message.info('Settings reset to default values');
    console.log(`Settings reset to default by user with role ${authState.role}`);
  };

  const handleExportData = () => {
    if (!hasPermission('manage_settings')) {
      message.error('You do not have permission to export data');
      console.log(`Permission check failed: manage_settings for role ${authState.role}`);
      return;
    }
    const allData = {
      products: LocalStorageService.get(STORAGE_KEYS.PRODUCTS, []),
      showrooms: LocalStorageService.get(STORAGE_KEYS.SHOWROOMS, []),
      employees: LocalStorageService.get(STORAGE_KEYS.EMPLOYEES, []),
      orders: LocalStorageService.get(STORAGE_KEYS.ORDERS, []),
      transfers: LocalStorageService.get(STORAGE_KEYS.TRANSFERS, []),
      attendance: LocalStorageService.get(STORAGE_KEYS.ATTENDANCE, []),
      salaryRecords: LocalStorageService.get(STORAGE_KEYS.SALARY_RECORDS, []),
      settings: LocalStorageService.get(STORAGE_KEYS.SETTINGS, {})
    };
    
    const dataStr = JSON.stringify(allData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AgriCorp_data_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    message.success('Data exported successfully!');
    console.log(`Data exported by user with role ${authState.role}`);
  };

  const handleResetData = () => {
    if (!hasPermission('manage_settings')) {
      message.error('You do not have permission to reset data');
      console.log(`Permission check failed: manage_settings for role ${authState.role}`);
      return;
    }
    if (window.confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
      LocalStorageService.clear();
      window.location.reload();
      console.log(`All data reset by user with role ${authState.role}`);
    }
  };

  const handleEditField = (field: string, value: any) => {
    if (!hasPermission('manage_settings')) {
      message.error('You do not have permission to modify settings');
      console.log(`Permission check failed: manage_settings for role ${authState.role}`);
      return;
    }
    setEditField(field);
    editForm.setFieldsValue({ value });
    setEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    if (!hasPermission('manage_settings')) {
      message.error('You do not have permission to modify settings');
      console.log(`Permission check failed: manage_settings for role ${authState.role}`);
      return;
    }
    try {
      const { value } = await editForm.validateFields();
      const updatedSettings = { ...currentSettings };
      if (editField === 'notifications.email') {
        updatedSettings.notifications.email = value;
      } else if (editField === 'notifications.sms') {
        updatedSettings.notifications.sms = value;
      } else if (editField === 'notifications.whatsapp') {
        updatedSettings.notifications.whatsapp = value;
      } else {
        (updatedSettings as any)[editField!] = value;
      }
      LocalStorageService.set(STORAGE_KEYS.SETTINGS, updatedSettings);
      form.setFieldsValue(updatedSettings);
      message.success('Setting updated successfully');
      console.log(`Updated setting ${editField} to ${value} by user with role ${authState.role}`);
      setEditModalVisible(false);
      setEditField(null);
      editForm.resetFields();
    } catch (error) {
      message.error('Failed to update setting');
      console.error('Failed to update setting:', error);
    }
  };

  if (!hasPermission('manage_settings')) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <Title level={2} className="!mb-1">Settings</Title>
        <p className="text-gray-600">You do not have permission to view or modify settings.</p>
      </div>
    );
  }

  const settingsData = [
    { key: 'appTitle', name: 'Application Title', value: currentSettings.appTitle, type: 'text' },
    { key: 'companyName', name: 'Company Name', value: currentSettings.companyName, type: 'text' },
    { key: 'gstNumber', name: 'GST Number', value: currentSettings.gstNumber, type: 'text' },
    { key: 'address', name: 'Company Address', value: currentSettings.address, type: 'textarea' },
    { key: 'defaultGst', name: 'Default GST Rate (%)', value: currentSettings.defaultGst, type: 'number' },
    { key: 'currency', name: 'Default Currency', value: currentSettings.currency, type: 'select', options: ['INR', 'USD', 'EUR'] },
    { key: 'theme', name: 'Theme', value: currentSettings.theme, type: 'select', options: ['light', 'dark'] },
    { key: 'notifications.email', name: 'Email Notifications', value: currentSettings.notifications.email ? 'Enabled' : 'Disabled', type: 'switch' },
    { key: 'notifications.sms', name: 'SMS Notifications', value: currentSettings.notifications.sms ? 'Enabled' : 'Disabled', type: 'switch' },
    { key: 'notifications.whatsapp', name: 'WhatsApp Notifications', value: currentSettings.notifications.whatsapp ? 'Enabled' : 'Disabled', type: 'switch' }
  ];

  const columns = [
    { title: 'Setting', dataIndex: 'name', key: 'name' },
    { title: 'Value', dataIndex: 'value', key: 'value' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Button
          icon={<EditOutlined />}
          onClick={() => handleEditField(record.key, record.type === 'switch' ? record.value === 'Enabled' : record.value)}
          disabled={!hasPermission('manage_settings')}
        >
          Edit
        </Button>
      )
    }
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <div>
          <Title level={2} className="!mb-1">Settings</Title>
          <p className="text-gray-600">Configure application preferences and company information</p>
        </div>
        <div className="flex gap-2">
          {/* <Segmented
            options={['Card View', 'List View']}
            value={viewMode === 'card' ? 'Card View' : 'List View'}
            onChange={(value) => {
              const newMode = value === 'Card View' ? 'card' : 'list';
              console.log(`Switching to ${newMode} view for user with role ${authState.role}`);
              setViewMode(newMode);
            }}
          /> */}
          <UIButton
            variant="primary"
            onClick={handleSave}
            disabled={loading || !hasPermission('manage_settings')}
          >
            <SaveOutlined /> Save Settings
          </UIButton>
        </div>
      </div>

      {viewMode === 'card' ? (
        <Form form={form} layout="vertical" onFinish={handleSave}>
          {/* Application Settings */}
          <UICard className="ag-card">
            <CardHeader>
              <CardTitle>Application Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="appTitle"
                    label="Application Title"
                    rules={[{ required: true, message: 'Please input application title!' }]}
                  >
                    <Input placeholder="AgriCorp" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="theme" label="Theme">
                    <Select>
                      <Option value="light">Light</Option>
                      <Option value="dark">Dark</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item name="currency" label="Default Currency">
                    <Select>
                      <Option value="INR">INR (₹)</Option>
                      <Option value="USD">USD ($)</Option>
                      <Option value="EUR">EUR (€)</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="defaultGst"
                    label="Default GST Rate (%)"
                    rules={[{ required: true, message: 'Please input default GST rate!' }]}
                  >
                    <InputNumber min={0} max={100} className="w-full" />
                  </Form.Item>
                </Col>
              </Row>
            </CardContent>
          </UICard>

          {/* Company Information */}
          <UICard className="ag-card">
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="companyName"
                    label="Company Name"
                    rules={[{ required: true, message: 'Please input company name!' }]}
                  >
                    <Input placeholder="Green Fields Agriculture" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="gstNumber"
                    label="GST Number"
                    rules={[{ required: true, message: 'Please input GST number!' }]}
                  >
                    <Input placeholder="22AAAAA0000A1Z5" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                name="address"
                label="Company Address"
                rules={[{ required: true, message: 'Please input company address!' }]}
              >
                <Input.TextArea rows={3} placeholder="Enter complete company address" />
              </Form.Item>
            </CardContent>
          </UICard>

          {/* Notification Preferences */}
          <UICard className="ag-card">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <Text strong>Email Notifications</Text>
                    <div className="text-sm text-gray-500">Receive notifications via email</div>
                  </div>
                  <Form.Item name={['notifications', 'email']} valuePropName="checked" className="!mb-0">
                    <Switch />
                  </Form.Item>
                </div>
                <Divider className="!my-3" />
                <div className="flex justify-between items-center">
                  <div>
                    <Text strong>SMS Notifications</Text>
                    <div className="text-sm text-gray-500">Receive notifications via SMS</div>
                  </div>
                  <Form.Item name={['notifications', 'sms']} valuePropName="checked" className="!mb-0">
                    <Switch />
                  </Form.Item>
                </div>
                <Divider className="!my-3" />
                <div className="flex justify-between items-center">
                  <div>
                    <Text strong>WhatsApp Notifications</Text>
                    <div className="text-sm text-gray-500">Receive notifications via WhatsApp</div>
                  </div>
                  <Form.Item name={['notifications', 'whatsapp']} valuePropName="checked" className="!mb-0">
                    <Switch />
                  </Form.Item>
                </div>
              </div>
            </CardContent>
          </UICard>

          {/* Data Management */}
          <UICard className="ag-card">
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Text strong>Export Data</Text>
                  <div className="text-sm text-gray-500 mb-2">Download all your data in JSON format</div>
                  <Button onClick={handleExportData} disabled={!hasPermission('manage_settings')}>
                    Export All Data
                  </Button>
                </div>
                <Divider />
                <div>
                  <Text strong className="text-red-600">Reset All Data</Text>
                  <div className="text-sm text-gray-500 mb-2">This will delete all your data permanently</div>
                  <Button danger onClick={handleResetData} disabled={!hasPermission('manage_settings')}>
                    Reset All Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </UICard>

          {/* Action Buttons */}
          <UICard className="ag-card">
            <CardContent>
              <div className="flex justify-between">
                <Button onClick={resetToDefault} disabled={!hasPermission('manage_settings')}>
                  Reset to Default
                </Button>
                <div className="space-x-2">
                  <Button onClick={() => form.resetFields()}>
                    Cancel Changes
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<SaveOutlined />}
                    disabled={!hasPermission('manage_settings')}
                  >
                    Save Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </UICard>
        </Form>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow">
          <Table
            dataSource={settingsData}
            columns={columns}
            rowKey="key"
            pagination={false}
          />
        </div>
      )}

      <Modal
        title={`Edit ${settingsData.find(s => s.key === editField)?.name}`}
        open={editModalVisible}
        onOk={handleEditSubmit}
        onCancel={() => {
          setEditModalVisible(false);
          setEditField(null);
          editForm.resetFields();
        }}
        okText="Save"
        okButtonProps={{ className: buttonVariants({ variant: 'primary' }) }}
        cancelButtonProps={{ className: buttonVariants({ variant: 'outline' }) }}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="value"
            label="Value"
            rules={[{ required: true, message: 'Please input a value!' }]}
          >
            {editField === 'defaultGst' ? (
              <InputNumber min={0} max={100} className="w-full" />
            ) : editField === 'currency' ? (
              <Select>
                <Option value="INR">INR (₹)</Option>
                <Option value="USD">USD ($)</Option>
                <Option value="EUR">EUR (€)</Option>
              </Select>
            ) : editField === 'theme' ? (
              <Select>
                <Option value="light">Light</Option>
                <Option value="dark">Dark</Option>
              </Select>
            ) : editField?.startsWith('notifications.') ? (
              <Switch />
            ) : editField === 'address' ? (
              <Input.TextArea rows={3} />
            ) : (
              <Input />
            )}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Settings;



// import React, { useState } from 'react';
// import { 
//   Card, 
//   Form, 
//   Input, 
//   InputNumber, 
//   Switch, 
//   Button, 
//   Typography, 
//   Row, 
//   Col,
//   message,
//   Divider,
//   Select
// } from 'antd';
// import { 
//   SaveOutlined,
//   SettingOutlined 
// } from '@ant-design/icons';
// import { LocalStorageService, STORAGE_KEYS } from '../utils/localStorage';

// const { Title, Text } = Typography;
// const { Option } = Select;

// interface Settings {
//   appTitle: string;
//   companyName: string;
//   gstNumber: string;
//   address: string;
//   defaultGst: number;
//   currency: string;
//   theme: string;
//   notifications: {
//     email: boolean;
//     sms: boolean;
//     whatsapp: boolean;
//   };
// }

// const Settings: React.FC = () => {
//   const [form] = Form.useForm();
//   const [loading, setLoading] = useState(false);

//   // Load current settings
//   const currentSettings: Settings = LocalStorageService.get(STORAGE_KEYS.SETTINGS, {
//     appTitle: 'AgriCorp',
//     companyName: 'Green Fields Agriculture',
//     gstNumber: '22AAAAA0000A1Z5',
//     address: '123 Agriculture Hub, Farm City, State - 123456',
//     defaultGst: 12,
//     currency: 'INR',
//     theme: 'light',
//     notifications: {
//       email: true,
//       sms: true,
//       whatsapp: true
//     }
//   });

//   // Initialize form with current settings
//   React.useEffect(() => {
//     form.setFieldsValue(currentSettings);
//   }, [form]);

//   const handleSave = async () => {
//     try {
//       setLoading(true);
//       const values = await form.validateFields();
      
//       LocalStorageService.set(STORAGE_KEYS.SETTINGS, values);
//       message.success('Settings saved successfully!');
      
//       // Update document title
//       document.title = values.appTitle;
//     } catch (error) {
//       console.error('Failed to save settings:', error);
//       message.error('Failed to save settings');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const resetToDefault = () => {
//     const defaultSettings: Settings = {
//       appTitle: 'AgriCorp',
//       companyName: 'Green Fields Agriculture',
//       gstNumber: '22AAAAA0000A1Z5',
//       address: '123 Agriculture Hub, Farm City, State - 123456',
//       defaultGst: 12,
//       currency: 'INR',
//       theme: 'light',
//       notifications: {
//         email: true,
//         sms: true,
//         whatsapp: true
//       }
//     };
    
//     form.setFieldsValue(defaultSettings);
//     message.info('Settings reset to default values');
//   };

//   return (
//     <div className="space-y-6">
//       <div className="flex justify-between items-center">
//         <div>
//           <Title level={2} className="!mb-1">Settings</Title>
//           <p className="text-gray-600">Configure application preferences and company information</p>
//         </div>
//         <Button
//           type="primary"
//           icon={<SaveOutlined />}
//           loading={loading}
//           onClick={handleSave}
//         >
//           Save Settings
//         </Button>
//       </div>

//       <Form
//         form={form}
//         layout="vertical"
//         onFinish={handleSave}
//       >
//         {/* Application Settings */}
//         <Card title="Application Settings" className="ag-card">
//           <Row gutter={[16, 16]}>
//             <Col xs={24} md={12}>
//               <Form.Item
//                 name="appTitle"
//                 label="Application Title"
//                 rules={[{ required: true, message: 'Please input application title!' }]}
//               >
//                 <Input placeholder="AgriCorp" />
//               </Form.Item>
//             </Col>
//             <Col xs={24} md={12}>
//               <Form.Item
//                 name="theme"
//                 label="Theme"
//               >
//                 <Select>
//                   <Option value="light">Light</Option>
//                   <Option value="dark">Dark</Option>
//                 </Select>
//               </Form.Item>
//             </Col>
//           </Row>

//           <Row gutter={[16, 16]}>
//             <Col xs={24} md={12}>
//               <Form.Item
//                 name="currency"
//                 label="Default Currency"
//               >
//                 <Select>
//                   <Option value="INR">INR (₹)</Option>
//                   <Option value="USD">USD ($)</Option>
//                   <Option value="EUR">EUR (€)</Option>
//                 </Select>
//               </Form.Item>
//             </Col>
//             <Col xs={24} md={12}>
//               <Form.Item
//                 name="defaultGst"
//                 label="Default GST Rate (%)"
//                 rules={[{ required: true, message: 'Please input default GST rate!' }]}
//               >
//                 <InputNumber min={0} max={100} className="w-full" />
//               </Form.Item>
//             </Col>
//           </Row>
//         </Card>

//         {/* Company Information */}
//         <Card title="Company Information" className="ag-card">
//           <Row gutter={[16, 16]}>
//             <Col xs={24} md={12}>
//               <Form.Item
//                 name="companyName"
//                 label="Company Name"
//                 rules={[{ required: true, message: 'Please input company name!' }]}
//               >
//                 <Input placeholder="Green Fields Agriculture" />
//               </Form.Item>
//             </Col>
//             <Col xs={24} md={12}>
//               <Form.Item
//                 name="gstNumber"
//                 label="GST Number"
//                 rules={[{ required: true, message: 'Please input GST number!' }]}
//               >
//                 <Input placeholder="22AAAAA0000A1Z5" />
//               </Form.Item>
//             </Col>
//           </Row>

//           <Form.Item
//             name="address"
//             label="Company Address"
//             rules={[{ required: true, message: 'Please input company address!' }]}
//           >
//             <Input.TextArea rows={3} placeholder="Enter complete company address" />
//           </Form.Item>
//         </Card>

//         {/* Notification Settings */}
//         <Card title="Notification Preferences" className="ag-card">
//           <div className="space-y-4">
//             <div className="flex justify-between items-center">
//               <div>
//                 <Text strong>Email Notifications</Text>
//                 <div className="text-sm text-gray-500">Receive notifications via email</div>
//               </div>
//               <Form.Item name={['notifications', 'email']} valuePropName="checked" className="!mb-0">
//                 <Switch />
//               </Form.Item>
//             </div>

//             <Divider className="!my-3" />

//             <div className="flex justify-between items-center">
//               <div>
//                 <Text strong>SMS Notifications</Text>
//                 <div className="text-sm text-gray-500">Receive notifications via SMS</div>
//               </div>
//               <Form.Item name={['notifications', 'sms']} valuePropName="checked" className="!mb-0">
//                 <Switch />
//               </Form.Item>
//             </div>

//             <Divider className="!my-3" />

//             <div className="flex justify-between items-center">
//               <div>
//                 <Text strong>WhatsApp Notifications</Text>
//                 <div className="text-sm text-gray-500">Receive notifications via WhatsApp</div>
//               </div>
//               <Form.Item name={['notifications', 'whatsapp']} valuePropName="checked" className="!mb-0">
//                 <Switch />
//               </Form.Item>
//             </div>
//           </div>
//         </Card>

//         {/* Data Management */}
//         <Card title="Data Management" className="ag-card">
//           <div className="space-y-4">
//             <div>
//               <Text strong>Export Data</Text>
//               <div className="text-sm text-gray-500 mb-2">Download all your data in JSON format</div>
//               <Button onClick={() => {
//                 const allData = {
//                   products: LocalStorageService.get(STORAGE_KEYS.PRODUCTS, []),
//                   showrooms: LocalStorageService.get(STORAGE_KEYS.SHOWROOMS, []),
//                   employees: LocalStorageService.get(STORAGE_KEYS.EMPLOYEES, []),
//                   orders: LocalStorageService.get(STORAGE_KEYS.ORDERS, []),
//                   transfers: LocalStorageService.get(STORAGE_KEYS.TRANSFERS, []),
//                   attendance: LocalStorageService.get(STORAGE_KEYS.ATTENDANCE, []),
//                   salaryRecords: LocalStorageService.get(STORAGE_KEYS.SALARY_RECORDS, []),
//                   settings: LocalStorageService.get(STORAGE_KEYS.SETTINGS, {})
//                 };
                
//                 const dataStr = JSON.stringify(allData, null, 2);
//                 const dataBlob = new Blob([dataStr], { type: 'application/json' });
//                 const url = URL.createObjectURL(dataBlob);
//                 const link = document.createElement('a');
//                 link.href = url;
//                 link.download = `AgriCorp_data_${new Date().toISOString().split('T')[0]}.json`;
//                 link.click();
//                 URL.revokeObjectURL(url);
                
//                 message.success('Data exported successfully!');
//               }}>
//                 Export All Data
//               </Button>
//             </div>

//             <Divider />

//             <div>
//               <Text strong className="text-red-600">Reset All Data</Text>
//               <div className="text-sm text-gray-500 mb-2">This will delete all your data permanently</div>
//               <Button 
//                 danger 
//                 onClick={() => {
//                   if (window.confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
//                     LocalStorageService.clear();
//                     window.location.reload();
//                   }
//                 }}
//               >
//                 Reset All Data
//               </Button>
//             </div>
//           </div>
//         </Card>

//         {/* Action Buttons */}
//         <Card className="ag-card">
//           <div className="flex justify-between">
//             <Button onClick={resetToDefault}>
//               Reset to Default
//             </Button>
//             <div className="space-x-2">
//               <Button onClick={() => form.resetFields()}>
//                 Cancel Changes
//               </Button>
//               <Button 
//                 type="primary" 
//                 htmlType="submit"
//                 loading={loading}
//                 icon={<SaveOutlined />}
//               >
//                 Save Settings
//               </Button>
//             </div>
//           </div>
//         </Card>
//       </Form>
//     </div>
//   );
// };

// export default Settings;