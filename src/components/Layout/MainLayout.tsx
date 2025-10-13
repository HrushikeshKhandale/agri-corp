// src/components/Layout/MainLayout.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, Space, Button, Badge, Drawer } from 'antd';
import {
  DashboardOutlined,
  ShoppingOutlined,
  ShopOutlined,
  TeamOutlined,
  UserOutlined,
  SwapOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
  MenuOutlined,
  BilibiliOutlined,
  ManOutlined,
  UserAddOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContexts';
import { useLocation, useNavigate } from 'react-router-dom';
import { useIsMobile } from '../../hooks/use-mobile';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const auth = useAuth();
  const { user, role, logout, hasPermission } = auth;
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const pendingTransfersCount = 0; // Placeholder for transfers count

  // Dynamic menu items based on permissions
  const menuItems = useMemo(() => {
    const items = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
        permission: 'view_dashboard'
      },
      {
        key: '/bill',
        icon: <BilibiliOutlined />,
        label: 'Create Bill',
        permission: 'create_bill',
        children: [
          {
            key: '/bill/new-bill',
            icon: <SwapOutlined />,
            label: 'Create Bill',
            permission: 'create_bill'
          },
          {
            key: '/bill/history',
            icon: <BarChartOutlined />,
            label: 'Bill History',
            permission: 'view_bill_history'
          }
        ]
      },
      {
        key: '/stock',
        icon: <ShoppingOutlined />,
        label: 'Stock',
        permission: 'view_products',
        children: [
          {
            key: '/stock/products',
            icon: <ShoppingOutlined />,
            label: 'Products',
            permission: 'view_products'
          },
          {
            key: '/stock/add-stocks',
            icon: <ManOutlined />,
            label: 'Add Stocks',
            permission: 'add_stocks'
          },
          {
            key: '/stock/transfers',
            icon: <SwapOutlined />,
            label: 'Stock Transfers',
            permission: 'view_transfers'
          }
        ]
      },
      {
        key: '/orders',
        icon: <ShoppingOutlined />,
        label: 'Orders',
        permission: 'view_orders'
      },
      {
        key: '/customers',
        icon: <UserOutlined />,
        label: 'Customers',
        permission: 'view_customers'
      },
      {
        key: '/showrooms',
        icon: <ShopOutlined />,
        label: 'Showrooms',
        permission: 'view_showrooms'
      },
      {
        key: '/employees-root',
        icon: <TeamOutlined />,
        label: 'Employees',
        permission: 'view_employees',
        children: [
          {
            key: '/employees/users',
            icon: <UserAddOutlined />,
            label: 'Employees',
            permission: 'manage_users'
          }
        ]
      },
      {
        key: '/reports',
        icon: <BarChartOutlined />,
        label: 'Reports',
        permission: 'view_reports'
      },
      {
        key: '/settings',
        icon: <SettingOutlined />,
        label: 'Settings',
        permission: 'manage_settings'
      }
    ];
    
    return items.filter(item => {
      if (!user) return false;
      const hasItemPermission = hasPermission(item.permission);
      if (item.children) {
        item.children = item.children.filter(child => hasPermission(child.permission));
        return hasItemPermission || item.children.length > 0;
      }
      return hasItemPermission;
    });
  }, [user, hasPermission]);

  const userMenuItems = [
    {
      key: 'profile',
      label: 'Profile',
      icon: <UserOutlined />
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: <SettingOutlined />,
      disabled: !hasPermission('manage_settings')
    },
    {
      type: 'divider' as const
    },
    {
      key: 'logout',
      label: 'Logout',
      icon: <LogoutOutlined />,
      danger: true
    }
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout();
      navigate('/login');
    } else {
      navigate(key);
      if (isMobile) setDrawerVisible(false);
    }
  };

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout();
      navigate('/login');
    } else if (key === 'settings' && !hasPermission('manage_settings')) {
      alert('You do not have permission to access settings');
    } else {
      navigate(`/${key}`);
    }
  };

  useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
    }
  }, [isMobile]);

  const siderWidth = collapsed ? 80 : 256;

  const renderSidebarContent = () => (
    <>
      <div className="flex items-center justify-center h-16 ag-gradient">
        <Title level={4} className="!text-white !mb-0">
          {collapsed ? 'AG' : 'AgriCorp'}
        </Title>
      </div>
      <Menu
        theme="light"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        className="border-none"
      />
    </>
  );

  return (
    <Layout>
      {!user ? (
        <Content
          style={{
            marginTop: 64,
            padding: 12,
            minHeight: 'calc(100vh - 64px)',
            overflowY: 'auto',
            background: '#f5f5f5'
          }}
        >
          <div className="bg-white rounded-lg p-4 shadow-sm">{children}</div>
        </Content>
      ) : (
        <>
          {!isMobile ? (
            <Sider
              trigger={null}
              collapsible
              collapsed={collapsed}
              width={256}
              theme="light"
              style={{
                position: 'fixed',
                left: 0,
                top: 0,
                bottom: 0,
                zIndex: 1000,
                background: '#fff',
                borderRight: '1px solid #f0f0f0'
              }}
            >
              {renderSidebarContent()}
            </Sider>
          ) : (
            <Drawer
              placement="left"
              closable={false}
              onClose={() => setDrawerVisible(false)}
              visible={drawerVisible}
              bodyStyle={{ padding: 0 }}
              width={256}
            >
              {renderSidebarContent()}
            </Drawer>
          )}

          <Layout style={{ marginLeft: !isMobile ? siderWidth : 0, transition: 'margin-left 0.2s' }}>
            <Header
              style={{
                position: 'fixed',
                top: 0,
                left: !isMobile ? siderWidth : 0,
                right: 0,
                height: 64,
                background: '#fff',
                zIndex: 1001,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 16px',
                borderBottom: '1px solid #f0f0f0',
                transition: 'left 0.2s'
              }}
            >
              <div>
                <Button
                  type="text"
                  icon={isMobile ? <MenuOutlined /> : (collapsed ? <MenuOutlined /> : <MenuOutlined />)}
                  onClick={() => {
                    if (isMobile) {
                      setDrawerVisible(true);
                    } else {
                      setCollapsed(!collapsed);
                    }
                  }}
                />
              </div>

              <div className="flex items-center space-x-4">
                <Badge count={pendingTransfersCount} size="small">
                  <Button type="text" icon={<BellOutlined />} onClick={() => navigate('/stock/transfers')} />
                </Badge>
                <Dropdown
                  menu={{
                    items: userMenuItems,
                    onClick: handleUserMenuClick
                  }}
                  placement="bottomRight"
                >
                  <div className="flex items-center space-x-2 cursor-pointer px-3 py-1 rounded-lg hover:bg-gray-50">
                    <Space direction="vertical" size={0}>
                      <span className="text-xs text-gray-500">{role || 'Unknown'}</span>
                    </Space>
                  </div>
                </Dropdown>
              </div>
            </Header>

            <Content
              style={{
                marginTop: 64,
                padding: isMobile ? 12 : 24,
                minHeight: 'calc(100vh - 64px)',
                overflowY: 'auto',
                background: '#f5f5f5'
              }}
            >
              <div className="bg-white rounded-lg shadow-sm" style={{ padding: isMobile ? '1rem' : '1.5rem' }}>
                {children}
              </div>
            </Content>
          </Layout>
        </>
      )}
    </Layout>
  );
};

export default MainLayout;



// import React, { useEffect, useState } from 'react';
// import { Layout, Menu, Avatar, Dropdown, Typography, Space, Button, Badge, Drawer, message } from 'antd';
// import {
//   DashboardOutlined,
//   ShoppingOutlined,
//   ShopOutlined,
//   TeamOutlined,
//   UserOutlined,
//   SwapOutlined,
//   BarChartOutlined,
//   SettingOutlined,
//   LogoutOutlined,
//   BellOutlined,
//   MenuOutlined,
//   BilibiliOutlined,
//   ManOutlined,
//   UserAddOutlined
// } from '@ant-design/icons';
// import { useAuth } from '../../context/AuthContexts';
// import { useData } from '../../context/DataContext';
// import { useLocation, useNavigate } from 'react-router-dom';
// import { useIsMobile } from '../../hooks/use-mobile';

// const { Header, Sider, Content } = Layout;
// const { Title } = Typography;

// interface MainLayoutProps {
//   children: React.ReactNode;
// }

// const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
//   const [collapsed, setCollapsed] = useState(false);
//   const [drawerVisible, setDrawerVisible] = useState(false);
//   const auth = useAuth();
//   const { transfers } = useData();
//   const isMobile = useIsMobile();
//   const location = useLocation();
//   const navigate = useNavigate();

//   const pendingTransfersCount = auth.showroomId
//     ? transfers.filter(t => t.toShowroomId === auth.showroomId && t.status === 'Pending').length
//     : transfers.filter(t => t.status === 'Pending').length;

//   const menuItems = [
//     {
//       key: '/dashboard',
//       icon: <DashboardOutlined />,
//       label: 'Dashboard',
//       permission: 'view_dashboard'
//     },
//     {
//       key: '/bill',
//       icon: <BilibiliOutlined />,
//       label: 'Create Bill',
//       permission: 'create_bill',
//       children: [
//         {
//           key: '/bill/new-bill',
//           icon: <SwapOutlined />,
//           label: 'Create Bill',
//           permission: 'create_bill'
//         },
//         {
//           key: '/bill/history',
//           icon: <BarChartOutlined />,
//           label: 'Bill History',
//           permission: 'view_bill_history'
//         }
//       ]
//     },
//     {
//       key: '/stock',
//       icon: <ShoppingOutlined />,
//       label: 'Stock',
//       permission: 'view_products',
//       children: [
//         {
//           key: '/stock/products',
//           icon: <ShoppingOutlined />,
//           label: 'Products',
//           permission: 'view_products'
//         },
//         {
//           key: '/stock/add-stocks',
//           icon: <ManOutlined />,
//           label: 'Add Stocks',
//           permission: 'add_stocks'
//         },
//         {
//           key: '/stock/transfers',
//           icon: <SwapOutlined />,
//           label: 'Stock Transfers',
//           permission: 'view_transfers'
//         }
//       ]
//     },
//     {
//       key: '/orders',
//       icon: <ShoppingOutlined />,
//       label: 'Orders',
//       permission: 'view_orders'
//     },
//     {
//       key: '/Customers',
//       icon: <UserOutlined />,
//       label: 'Customers',
//       permission: 'view_customers'
//     },
//     {
//       key: '/showrooms',
//       icon: <ShopOutlined />,
//       label: 'Showrooms',
//       permission: 'view_showrooms'
//     },
//     {
//       key: '/employees',
//       icon: <TeamOutlined />,
//       label: 'Employees',
//       permission: 'view_employees',
//       children: [
//         {
//           key: '/employees',
//           icon: <UserAddOutlined />,
//           label: 'Employees',
//           permission: 'manage_users'
//         }
//       ]
//     },
//     {
//       key: '/reports',
//       icon: <BarChartOutlined />,
//       label: 'Reports',
//       permission: 'view_reports'
//     },
//     {
//       key: '/settings',
//       icon: <SettingOutlined />,
//       label: 'Settings',
//       permission: 'manage_settings'
//     }
//   ].filter(item => {
//     if (!auth.isAuthenticated) {
//       console.log(`Filtering menu item ${item.key}: skipped due to unauthenticated user`);
//       return false;
//     }
//     const hasItemPermission = auth.hasPermission(item.permission);
//     console.log(`Filtering menu item ${item.key} for role ${auth.role || 'unknown'}: ${hasItemPermission}`);
//     if (item.children) {
//       item.children = item.children.filter(child => {
//         const hasChildPermission = auth.hasPermission(child.permission);
//         console.log(`Filtering child menu item ${child.key} for role ${auth.role || 'unknown'}: ${hasChildPermission}`);
//         return hasChildPermission;
//       });
//       return hasItemPermission || item.children.length > 0;
//     }
//     return hasItemPermission;
//   });

//   const userMenuItems = [
//     {
//       key: 'profile',
//       label: 'Profile',
//       icon: <UserOutlined />
//     },
//     {
//       key: 'settings',
//       label: 'Settings',
//       icon: <SettingOutlined />,
//       disabled: !auth.hasPermission('manage_settings')
//     },
//     {
//       type: 'divider' as const
//     },
//     {
//       key: 'logout',
//       label: 'Logout',
//       icon: <LogoutOutlined />,
//       danger: true
//     }
//   ];

//   const handleMenuClick = ({ key }: { key: string }) => {
//     console.log(`Navigating to ${key} by user with role ${auth.role || 'unknown'}`);
//     if (key === 'logout') {
//       auth.logout();
//       navigate('/login');
//     } else {
//       navigate(key);
//       if (isMobile) setDrawerVisible(false);
//     }
//   };

//   const handleUserMenuClick = ({ key }: { key: string }) => {
//     console.log(`User menu clicked: ${key} by user with role ${auth.role || 'unknown'}`);
//     if (key === 'logout') {
//       auth.logout();
//       navigate('/login');
//     } else if (key === 'settings' && !auth.hasPermission('manage_settings')) {
//       message.error('You do not have permission to access settings');
//       console.log(`Permission check failed: manage_settings for role ${auth.role || 'unknown'}`);
//     } else {
//       navigate(`/${key}`);
//     }
//   };

//   useEffect(() => {
//     if (isMobile) {
//       setCollapsed(true);
//     }
//   }, [isMobile]);

//   const siderWidth = collapsed ? 80 : 256;

//   const renderSidebarContent = () => (
//     <>
//       <div className="flex items-center justify-center h-16 ag-gradient">
//         <Title level={4} className="!text-white !mb-0">
//           {collapsed ? 'AG' : 'AgriCorp'}
//         </Title>
//       </div>
//       <Menu
//         theme="light"
//         mode="inline"
//         selectedKeys={[location.pathname]}
//         items={menuItems}
//         onClick={handleMenuClick}
//         className="border-none"
//       />
//     </>
//   );

//   return (
//     <Layout>
//       {!auth.isAuthenticated ? (
//         <Content
//           style={{
//             marginTop: 64,
//             padding: 24,
//             minHeight: 'calc(100vh - 64px)',
//             overflowY: 'auto',
//             background: '#f5f5f5'
//           }}
//         >
//           <div className="bg-white rounded-lg p-6 shadow-sm">{children}</div>
//         </Content>
//       ) : (
//         <>
//           {!isMobile ? (
//             <Sider
//               trigger={null}
//               collapsible
//               collapsed={collapsed}
//               width={256}
//               theme="light"
//               style={{
//                 position: 'fixed',
//                 left: 0,
//                 top: 0,
//                 bottom: 0,
//                 zIndex: 1000,
//                 background: '#fff',
//                 borderRight: '1px solid #f0f0f0'
//               }}
//             >
//               {renderSidebarContent()}
//             </Sider>
//           ) : (
//             <Drawer
//               placement="left"
//               closable={false}
//               onClose={() => setDrawerVisible(false)}
//               visible={drawerVisible}
//               bodyStyle={{ padding: 0 }}
//               width={256}
//             >
//               {renderSidebarContent()}
//             </Drawer>
//           )}

//           <Layout style={{ marginLeft: !isMobile ? siderWidth : 0, transition: 'margin-left 0.2s' }}>
//             <Header
//               style={{
//                 position: 'fixed',
//                 top: 0,
//                 left: !isMobile ? siderWidth : 0,
//                 right: 0,
//                 height: 64,
//                 background: '#fff',
//                 zIndex: 1001,
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'space-between',
//                 padding: '0 16px',
//                 borderBottom: '1px solid #f0f0f0',
//                 transition: 'left 0.2s'
//               }}
//             >
//               <div>
//                 <Button
//                   type="text"
//                   icon={isMobile ? <MenuOutlined /> : (collapsed ? <MenuOutlined /> : <MenuOutlined />)}
//                   onClick={() => {
//                     if (isMobile) {
//                       setDrawerVisible(true);
//                     } else {
//                       setCollapsed(!collapsed);
//                     }
//                   }}
//                 />
//               </div>

//               <div className="flex items-center space-x-4">
//                 <Badge count={pendingTransfersCount} size="small">
//                   <Button type="text" icon={<BellOutlined />} onClick={() => navigate('/stock/transfers')} />
//                 </Badge>
//                 <Dropdown
//                   menu={{
//                     items: userMenuItems,
//                     onClick: handleUserMenuClick
//                   }}
//                   placement="bottomRight"
//                 >
//                   <div className="flex items-center space-x-2 cursor-pointer px-3 py-1 rounded-lg hover:bg-gray-50">
//                     <Avatar src={auth.user?.avatar} icon={<UserOutlined />} size="small" />
//                     <Space direction="vertical" size={0}>
//                       {/* <span className="text-sm font-medium">{auth.user?.name || 'Unknown'}</span> */}
//                       <span className="text-xs text-gray-500">{auth.user?.role || 'Unknown'}</span>
//                     </Space>
//                   </div>
//                 </Dropdown>
//               </div>
//             </Header>

//             <Content
//               style={{
//                 marginTop: 64,
//                 padding: 24,
//                 minHeight: 'calc(100vh - 64px)',
//                 overflowY: 'auto',
//                 background: '#f5f5f5'
//               }}
//             >
//               <div className="bg-white rounded-lg p-6 shadow-sm">{children}</div>
//             </Content>
//           </Layout>
//         </>
//       )}
//     </Layout>
//   );
// };

// export default MainLayout;

 