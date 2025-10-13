// src/pages/Login.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, Card, Typography, Space, Alert, Row, Col, notification } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined, WifiOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContexts';
import { useNavigate } from 'react-router-dom';
import { validateInput, sanitizeInput } from '../utils/security';
import { useLoginTests } from '../hooks/useLoginTests';

const { Title, Text, Paragraph } = Typography;

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loginTime, setLoginTime] = useState<number | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { browserInfo } = useLoginTests();
  const usernameInputRef = useRef<any>(null);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      notification.success({ message: 'Connection restored' });
    };
    const handleOffline = () => {
      setIsOnline(false);
      notification.error({ message: 'No internet connection' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cookie detection
  const checkCookiesEnabled = (): boolean => {
    try {
      document.cookie = 'test=1';
      const enabled = document.cookie.indexOf('test=1') !== -1;
      document.cookie = 'test=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      return enabled;
    } catch {
      return false;
    }
  };

  // Input validation
  const validateLoginInput = (username: string, password: string): string | null => {
    // Check length limits
    if (username.length > 100) return 'Username must be less than 100 characters';
    if (password.length > 100) return 'Password must be less than 100 characters';
    
    // Check for special characters in username (basic format validation)
    const usernamePattern = /^[a-zA-Z0-9._@-]+$/;
    if (!usernamePattern.test(username)) return 'Username contains invalid characters';
    
    // Check for SQL injection patterns
    if (!validateInput(username) || !validateInput(password)) {
      console.warn('Suspicious login attempt detected:', { username: sanitizeInput(username) });
      return 'Invalid input detected. Please use valid characters only.';
    }
    
    return null;
  };

  const onFinish = async (values: { username: string; password: string }) => {
    // Check network connection
    if (!isOnline) {
      setError('No internet connection. Please check your network and try again.');
      return;
    }

    // Check cookies
    if (!checkCookiesEnabled()) {
      setError('Cookies are required for login. Please enable cookies in your browser.');
      return;
    }

    // Validate inputs
    const validationError = validateLoginInput(values.username, values.password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    const startTime = performance?.now ? performance.now() : Date.now();
    
    try {
      const success = await login({ 
        username: sanitizeInput(values.username), 
        password: values.password 
      });
      
      const endTime = performance?.now ? performance.now() : Date.now();
      const responseTime = endTime - startTime;
      setLoginTime(responseTime);
      
      // Dispatch performance event for tracking (with fallback)
      if (typeof CustomEvent !== 'undefined') {
        window.dispatchEvent(new CustomEvent('loginPerformance', { 
          detail: { responseTime } 
        }));
      }
      
      if (responseTime > 5000) {
        // notification.warning({ message: `Login took ${(responseTime/1000).toFixed(1)}s - slower than expected` });
      }
      
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Invalid username or password. Please try again.');
      }
    } catch (err: unknown) {
      const endTime = performance?.now ? performance.now() : Date.now();
      setLoginTime(endTime - startTime);
      
      console.error('Login error:', err);
      
      // Enhanced error handling
      if (err instanceof Error) {
        if (err.message.includes('fetch')) {
          setError('Service unavailable. Please try again later.');
        } else if (err.message.includes('timeout')) {
          setError('Request timeout. Please check your connection.');
        } else {
          setError(`Login failed: ${err.message}`);
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Enhanced keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      form.submit();
    } else if (e.key === 'Escape') {
      form.resetFields();
      setError(null);
    }
  };

  // Focus management
  useEffect(() => {
    if (usernameInputRef.current) {
      usernameInputRef.current.focus();
    }
  }, []);

  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50">
        Skip to main content
      </a>
      <main id="main-content" className="min-h-screen ag-gradient flex items-center justify-center p-4" role="main">
      <div className="w-full max-w-md mx-auto">
        <Card className="ag-card shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-green-600">AG</span>
            </div>
            <Title level={2} className="!mb-2 !text-gray-800">Welcome Back</Title>
            <Text type="secondary" className="text-base">Sign in to your AgriCorp account</Text>
          </div>

          {!browserInfo.isSupported && (
            <Alert
              message="Browser Compatibility Warning"
              description={`${browserInfo.name} ${browserInfo.version} may not be fully supported. Please update your browser for the best experience.`}
              type="warning"
              showIcon
              className="mb-4"
            />
          )}

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
            form={form}
            name="login"
            onFinish={onFinish}
            layout="vertical"
            size="large"
            onKeyDown={handleKeyDown}
          >
            <Form.Item
              name="username"
              label="Username"
              rules={[
                { required: true, message: 'Please input your username!' },
                { max: 100, message: 'Username must be less than 100 characters' }
              ]}
            >
              <Input
                ref={usernameInputRef}
                prefix={<UserOutlined className="text-gray-400" />}
                placeholder="Enter your username"
                className="h-12 rounded-lg"
                maxLength={100}
                autoComplete="username"
                aria-label="Username"
                tabIndex={1}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: 'Please input your password!' },
                { max: 100, message: 'Password must be less than 100 characters' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="Enter your password"
                className="h-12 rounded-lg"
                maxLength={100}
                autoComplete="current-password"
                aria-label="Password"
                tabIndex={2}
              />
            </Form.Item>

            {!isOnline && (
              <Alert
                message="No Internet Connection"
                description="Please check your network connection and try again."
                type="warning"
                showIcon
                icon={<WifiOutlined />}
                className="mb-4"
              />
            )}
            
            {loginTime && (
              <div className="mb-4 text-sm text-gray-500">
                Last login response time: {(loginTime/1000).toFixed(2)}s
              </div>
            )}

            <Form.Item className="mb-6">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                disabled={!isOnline}
                block
                icon={<LoginOutlined />}
                className="h-12 text-lg font-semibold rounded-lg ag-button"
                aria-label="Sign in to your account"
                tabIndex={3}
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>
          
        
        </Card>
      </div>
      </main>
    </>
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