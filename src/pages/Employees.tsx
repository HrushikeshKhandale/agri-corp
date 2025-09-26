import React, { useState } from 'react';
import { 
  Table, 
  Button, 
  Input, 
  Select, 
  Space, 
  Typography, 
  Card, 
  Tag, 
  Modal, 
  Form, 
  InputNumber,
  Avatar,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Tabs,
  DatePicker,
  Progress
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  EditOutlined, 
  DeleteOutlined,
  UserOutlined,
  DollarOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useData, Employee, AttendanceRecord, SalaryRecord } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const Employees: React.FC = () => {
  const { 
    employees, 
    addEmployee, 
    updateEmployee, 
    deleteEmployee,
    showrooms,
    attendance,
    markAttendance,
    salaryRecords,
    addSalaryRecord,
    updateSalaryRecord
  } = useData();
  const { authState, hasPermission } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [showroomFilter, setShowroomFilter] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [attendanceModal, setAttendanceModal] = useState(false);
  const [salaryModal, setSalaryModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [form] = Form.useForm();
  const [attendanceForm] = Form.useForm();
  const [salaryForm] = Form.useForm();

  // Filter employees based on user role
  const userEmployees = authState.user?.role === 'Super Admin' 
    ? employees 
    : employees.filter(emp => emp.showroomId === authState.showroomId);

  const filteredEmployees = userEmployees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         employee.role.toLowerCase().includes(searchText.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchText.toLowerCase());
    const matchesShowroom = !showroomFilter || employee.showroomId === showroomFilter;
    return matchesSearch && matchesShowroom;
  });

  const getAttendanceThisMonth = (employeeId: string) => {
    const currentMonth = dayjs().format('YYYY-MM');
    return attendance.filter(att => 
      att.employeeId === employeeId && 
      att.date.startsWith(currentMonth) &&
      att.status === 'Present'
    ).length;
  };

  const getLatestSalaryRecord = (employeeId: string) => {
    return salaryRecords
      .filter(record => record.employeeId === employeeId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  };

  const columns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_, record: Employee) => (
        <div className="flex items-center space-x-3">
          <Avatar 
            src={record.avatar} 
            icon={<UserOutlined />}
            size={48}
          />
          <div>
            <div className="font-medium">{record.name}</div>
            <div className="text-sm text-gray-500">{record.role}</div>
            <div className="text-xs text-gray-400">{record.email}</div>
          </div>
        </div>
      ),
      width: 250
    },
    {
      title: 'Showroom',
      key: 'showroom',
      render: (_, record: Employee) => {
        const showroom = showrooms.find(s => s.id === record.showroomId);
        return showroom?.name || 'Unknown';
      },
      width: 150
    },
    {
      title: 'Salary',
      key: 'salary',
      render: (_, record: Employee) => (
        <div>
          <div className="font-medium">₹{record.salary.toLocaleString()}</div>
          <div className="text-sm text-gray-500">{record.paymentMethod}</div>
          {record.advanceTaken > 0 && (
            <div className="text-xs text-orange-600">Advance: ₹{record.advanceTaken}</div>
          )}
        </div>
      ),
      width: 120
    },
    {
      title: 'Attendance',
      key: 'attendance',
      render: (_, record: Employee) => {
        const daysPresent = getAttendanceThisMonth(record.id);
        const workingDays = dayjs().daysInMonth();
        const percentage = Math.round((daysPresent / workingDays) * 100);
        
        return (
          <div>
            <div className="text-sm">{daysPresent}/{workingDays} days</div>
            <Progress percent={percentage} size="small" strokeColor="hsl(var(--success))" />
          </div>
        );
      },
      width: 120
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record: Employee) => {
        const salaryRecord = getLatestSalaryRecord(record.id);
        return salaryRecord?.status === 'Paid' ? 
          <Tag color="green">Paid</Tag> : 
          <Tag color="orange">Pending</Tag>;
      },
      width: 80
    }
  ];

  if (hasPermission('manage_employees')) {
    columns.push({
      title: 'Actions',
      key: 'actions',
      render: (_, record: Employee) => (
        <Space>
          <Button
            icon={<CalendarOutlined />}
            size="small"
            onClick={() => openAttendanceModal(record)}
            title="Mark Attendance"
          />
          <Button
            icon={<DollarOutlined />}
            size="small"
            onClick={() => openSalaryModal(record)}
            title="Manage Salary"
          />
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Are you sure you want to delete this employee?"
            onConfirm={() => deleteEmployee(record.id)}
          >
            <Button
              icon={<DeleteOutlined />}
              size="small"
              danger
            />
          </Popconfirm>
        </Space>
      ),
      width: 200
    } as any);
  }

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    form.setFieldsValue(employee);
    setIsModalVisible(true);
  };

  const handleAdd = () => {
    setEditingEmployee(null);
    form.resetFields();
    form.setFieldsValue({
      showroomId: authState.showroomId || showrooms[0]?.id,
      paymentMethod: 'Bank Transfer',
      advanceTaken: 0
    });
    setIsModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingEmployee) {
        updateEmployee(editingEmployee.id, values);
      } else {
        addEmployee(values);
      }
      
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const openAttendanceModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    attendanceForm.setFieldsValue({
      date: dayjs(),
      status: 'Present'
    });
    setAttendanceModal(true);
  };

  const handleAttendanceSubmit = async () => {
    try {
      const values = await attendanceForm.validateFields();
      
      markAttendance({
        employeeId: selectedEmployee!.id,
        date: values.date.format('YYYY-MM-DD'),
        status: values.status,
        checkIn: values.checkIn?.format('HH:mm'),
        checkOut: values.checkOut?.format('HH:mm'),
        notes: values.notes
      });
      
      setAttendanceModal(false);
      attendanceForm.resetFields();
    } catch (error) {
      console.error('Attendance marking failed:', error);
    }
  };

  const openSalaryModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    const currentMonth = dayjs().format('YYYY-MM');
    const existingRecord = salaryRecords.find(r => 
      r.employeeId === employee.id && r.month === currentMonth
    );

    if (existingRecord) {
      salaryForm.setFieldsValue({
        ...existingRecord,
        month: dayjs(existingRecord.month)
      });
    } else {
      salaryForm.setFieldsValue({
        month: dayjs(),
        baseSalary: employee.salary,
        advanceTaken: employee.advanceTaken,
        deductions: 0,
        bonus: 0,
        status: 'Pending'
      });
    }
    setSalaryModal(true);
  };

  const handleSalarySubmit = async () => {
    try {
      const values = await salaryForm.validateFields();
      const netSalary = values.baseSalary - values.advanceTaken - values.deductions + values.bonus;
      
      const salaryData = {
        employeeId: selectedEmployee!.id,
        month: values.month.format('YYYY-MM'),
        baseSalary: values.baseSalary,
        advanceTaken: values.advanceTaken,
        deductions: values.deductions,
        bonus: values.bonus,
        netSalary,
        status: values.status,
        paidAt: values.status === 'Paid' ? new Date().toISOString() : undefined
      };

      const existingRecord = salaryRecords.find(r => 
        r.employeeId === selectedEmployee!.id && r.month === salaryData.month
      );

      if (existingRecord) {
        updateSalaryRecord(existingRecord.id, salaryData);
      } else {
        addSalaryRecord(salaryData);
      }
      
      setSalaryModal(false);
      salaryForm.resetFields();
    } catch (error) {
      console.error('Salary processing failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Title level={2} className="!mb-1">Employees</Title>
          <p className="text-gray-600">Manage staff, attendance, and salary</p>
        </div>
        {hasPermission('manage_employees') && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            Add Employee
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={6}>
          <Card className="ag-card">
            <Statistic
              title="Total Employees"
              value={userEmployees.length}
              prefix={<UserOutlined />}
              valueStyle={{ color: 'hsl(var(--primary))' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="ag-card">
            <Statistic
              title="Present Today"
              value={attendance.filter(att => 
                att.date === dayjs().format('YYYY-MM-DD') && 
                att.status === 'Present' &&
                userEmployees.some(emp => emp.id === att.employeeId)
              ).length}
              valueStyle={{ color: 'hsl(var(--success))' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="ag-card">
            <Statistic
              title="Monthly Payroll"
              value={userEmployees.reduce((sum, emp) => sum + emp.salary, 0)}
              prefix="₹"
              precision={0}
              valueStyle={{ color: 'hsl(var(--info))' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="ag-card">
            <Statistic
              title="Pending Salaries"
              value={salaryRecords.filter(record => 
                record.status === 'Pending' &&
                userEmployees.some(emp => emp.id === record.employeeId)
              ).length}
              valueStyle={{ color: 'hsl(var(--warning))' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="ag-card">
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
          <Col xs={24} md={12} lg={8}>
            <Select
              placeholder="Filter by showroom"
              value={showroomFilter}
              onChange={setShowroomFilter}
              allowClear
              className="w-full"
            >
              {showrooms.map(showroom => (
                <Option key={showroom.id} value={showroom.id}>
                  {showroom.name}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Employees Table */}
      <Card className="ag-card">
        <Table
          columns={columns}
          dataSource={filteredEmployees}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} employees`
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Add/Edit Employee Modal */}
      <Modal
        title={editingEmployee ? 'Edit Employee' : 'Add New Employee'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label="Full Name"
                rules={[{ required: true, message: 'Please input name!' }]}
              >
                <Input placeholder="Enter full name" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="role"
                label="Role"
                rules={[{ required: true, message: 'Please input role!' }]}
              >
                <Input placeholder="e.g., Store Manager, Sales Executive" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Please input email!' },
                  { type: 'email', message: 'Please enter valid email!' }
                ]}
              >
                <Input placeholder="employee@email.com" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="phone"
                label="Phone"
                rules={[{ required: true, message: 'Please input phone!' }]}
              >
                <Input placeholder="+91 XXXXXXXXXX" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="showroomId"
            label="Showroom"
            rules={[{ required: true, message: 'Please select showroom!' }]}
          >
            <Select placeholder="Select showroom">
              {showrooms.map(showroom => (
                <Option key={showroom.id} value={showroom.id}>
                  {showroom.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Form.Item
                name="salary"
                label="Monthly Salary (₹)"
                rules={[{ required: true, message: 'Please input salary!' }]}
              >
                <InputNumber min={0} className="w-full" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="paymentMethod"
                label="Payment Method"
                rules={[{ required: true, message: 'Please select payment method!' }]}
              >
                <Select>
                  <Option value="Bank Transfer">Bank Transfer</Option>
                  <Option value="Cash">Cash</Option>
                  <Option value="UPI">UPI</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="advanceTaken"
                label="Advance Taken (₹)"
              >
                <InputNumber min={0} className="w-full" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="avatar"
            label="Profile Picture URL"
          >
            <Input placeholder="https://example.com/avatar.jpg" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Attendance Modal */}
      <Modal
        title={`Mark Attendance - ${selectedEmployee?.name}`}
        open={attendanceModal}
        onOk={handleAttendanceSubmit}
        onCancel={() => setAttendanceModal(false)}
      >
        <Form form={attendanceForm} layout="vertical">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="date"
                label="Date"
                rules={[{ required: true, message: 'Please select date!' }]}
              >
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Please select status!' }]}
              >
                <Select>
                  <Option value="Present">Present</Option>
                  <Option value="Absent">Absent</Option>
                  <Option value="Half Day">Half Day</Option>
                  <Option value="Leave">Leave</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item name="checkIn" label="Check In Time">
                <DatePicker.TimePicker className="w-full" format="HH:mm" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="checkOut" label="Check Out Time">
                <DatePicker.TimePicker className="w-full" format="HH:mm" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Additional notes..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Salary Modal */}
      <Modal
        title={`Salary Management - ${selectedEmployee?.name}`}
        open={salaryModal}
        onOk={handleSalarySubmit}
        onCancel={() => setSalaryModal(false)}
        width={600}
      >
        <Form form={salaryForm} layout="vertical">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="month"
                label="Salary Month"
                rules={[{ required: true, message: 'Please select month!' }]}
              >
                <DatePicker.MonthPicker className="w-full" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="baseSalary"
                label="Base Salary (₹)"
                rules={[{ required: true, message: 'Please input base salary!' }]}
              >
                <InputNumber min={0} className="w-full" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Form.Item name="advanceTaken" label="Advance Taken (₹)">
                <InputNumber min={0} className="w-full" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="deductions" label="Deductions (₹)">
                <InputNumber min={0} className="w-full" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="bonus" label="Bonus (₹)">
                <InputNumber min={0} className="w-full" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="status"
            label="Payment Status"
            rules={[{ required: true, message: 'Please select status!' }]}
          >
            <Select>
              <Option value="Pending">Pending</Option>
              <Option value="Paid">Paid</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Employees;