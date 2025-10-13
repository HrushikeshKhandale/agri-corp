// src/pages/Login.tsx
import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Space, Alert, Row, Col } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContexts';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    setError(null);
    
    try {
      const success = await login({ username: values.username, password: values.password });
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Invalid username or password. Please try again.');
      }
    } catch (err: unknown) {
      // Log full error for diagnostics
      console.error('Login error:', err);
      // Safely extract a message for the user without leaking internals
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'An unexpected error occurred. Please try again.';
      setError(`Login failed. ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen ag-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <Card className="ag-card shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-green-600">AG</span>
            </div>
            <Title level={2} className="!mb-2 !text-gray-800">Welcome Back</Title>
            <Text type="secondary" className="text-base">Sign in to your AgriCorp account</Text>
          </div>

          {error && (
            <Alert
              message="Login Failed"
              description={error}
              type="error"
              showIcon
              className="mb-6"
            />
          )}

          <Form
            name="login"
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="username"
              label="Username"
              rules={[{ required: true, message: 'Please input your username!' }]}
            >
              <Input
                prefix={<UserOutlined className="text-gray-400" />}
                placeholder="Enter your username"
                className="h-12 rounded-lg"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="Enter your password"
                className="h-12 rounded-lg"
              />
            </Form.Item>

            <Form.Item className="mb-6">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                icon={<LoginOutlined />}
                className="h-12 text-lg font-semibold rounded-lg ag-button"
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>
          
        
        </Card>
      </div>


    </div>
  );
};

export default Login;

// import React, { useState } from 'react';
// import { Form, Input, Button, Card, Typography, Space, Alert, Row, Col } from 'antd';
// import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
// import { useAuth } from '../context/AuthContext';
// import { useNavigate } from 'react-router-dom';

// const { Title, Text, Paragraph } = Typography;

// const Login: React.FC = () => {
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const { login } = useAuth();
//   const navigate = useNavigate();

//   const onFinish = async (values: { email: string; password: string }) => {
//     setLoading(true);
//     setError(null);
    
//     try {
//       const success = await login(values);
//       if (success) {
//         navigate('/dashboard');
//       } else {
//         setError('Invalid email or password. Please try again.');
//       }
//     } catch (error) {
//       setError('Login failed. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const demoCredentials = [
//     { role: 'Admin', email: 'admin@AgriCorp.com', password: 'admin123' },
//     { role: 'Mumbai Store Manager', email: 'mumbai@AgriCorp.com', password: 'mumbai123' },
//     { role: 'Punjab Store Manager', email: 'punjab@AgriCorp.com', password: 'punjab123' },
//     { role: 'Store Employee', email: 'employee@AgriCorp.com', password: 'emp123' }
//   ];

//   return (
//     <div className="min-h-screen ag-gradient flex items-center justify-center p-4">
//       <Row gutter={[32, 32]} className="w-full max-w-6xl" align="middle">
//         {/* Left Side - Login Form */}
//         <Col xs={24} lg={12}>
//           <Card className="ag-card max-w-md mx-auto">
//             <div className="text-center mb-8">
//               <Title level={2} className="!mb-2">Welcome Back</Title>
//               <Text type="secondary">Sign in to your AgriCorp account</Text>
//             </div>

//             {error && (
//               <Alert
//                 message="Login Failed"
//                 description={error}
//                 type="error"
//                 showIcon
//                 className="mb-6"
//               />
//             )}

//             <Form
//               name="login"
//               onFinish={onFinish}
//               layout="vertical"
//               size="large"
//             >
//               <Form.Item
//                 name="email"
//                 label="Email"
//                 rules={[
//                   { required: true, message: 'Please input your email!' },
//                   { type: 'email', message: 'Please enter a valid email!' }
//                 ]}
//               >
//                 <Input
//                   prefix={<UserOutlined />}
//                   placeholder="Enter your email"
//                 />
//               </Form.Item>

//               <Form.Item
//                 name="password"
//                 label="Password"
//                 rules={[{ required: true, message: 'Please input your password!' }]}
//               >
//                 <Input.Password
//                   prefix={<LockOutlined />}
//                   placeholder="Enter your password"
//                 />
//               </Form.Item>

//               <Form.Item>
//                 <Button
//                   type="primary"
//                   htmlType="submit"
//                   loading={loading}
//                   block
//                   icon={<LoginOutlined />}
//                   className="h-12"
//                 >
//                   Sign In
//                 </Button>
//               </Form.Item>
//             </Form>
//           </Card>
//         </Col>

//         {/* Right Side - Demo Credentials */}
//         <Col xs={24} lg={12}>
//           <Card className="ag-card bg-white/10 backdrop-blur border-white/20">
//             <Title level={3} className="!text-white !mb-6">Demo Credentials</Title>
//             <Paragraph className="!text-white/80 !mb-6">
//               Use these demo credentials to explore different user roles and permissions in the system.
//             </Paragraph>
            
//             <Space direction="vertical" size="middle" className="w-full">
//               {demoCredentials.map((cred, index) => (
//                 <Card 
//                   key={index} 
//                   size="small" 
//                   className="ag-card border-white/30"
//                 >
//                   <div className="flex justify-between items-center">
//                     <div>
//                       <Text strong className="block">{cred.role}</Text>
//                       <Text className="text-xs text-gray-600">
//                         {cred.email} / {cred.password}
//                       </Text>
//                     </div>
//                     <Button
//                       size="small"
//                       onClick={() => {
//                         const form = document.querySelector('form');
//                         if (form) {
//                           const emailInput = form.querySelector('input[type="email"]') as HTMLInputElement;
//                           const passwordInput = form.querySelector('input[type="password"]') as HTMLInputElement;
//                           if (emailInput && passwordInput) {
//                             emailInput.value = cred.email;
//                             passwordInput.value = cred.password;
//                             // Trigger React events
//                             emailInput.dispatchEvent(new Event('input', { bubbles: true }));
//                             passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
//                           }
//                         }
//                       }}
//                     >
//                       Use
//                     </Button>
//                   </div>
//                 </Card>
//               ))}
//             </Space>
//           </Card>
//         </Col>
//       </Row>
//     </div>
//   );
// };

// export default Login;