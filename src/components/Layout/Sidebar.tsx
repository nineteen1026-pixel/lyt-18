import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, Tag, ShoppingCart, BarChart3 } from 'lucide-react';

const navItems = [
  { path: '/', label: '首页', icon: LayoutDashboard },
  { path: '/items', label: '物品管理', icon: Package },
  { path: '/listings', label: '挂售管理', icon: Tag },
  { path: '/sales', label: '成交记录', icon: ShoppingCart },
  { path: '/stats', label: '统计分析', icon: BarChart3 },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 shadow-sm z-40">
      <div className="p-6 border-b border-slate-100">
        <h1 className="text-xl font-bold text-primary-700 flex items-center gap-2">
          <Package className="w-6 h-6" />
          二手管家
        </h1>
        <p className="text-xs text-slate-500 mt-1">全生命周期管理</p>
      </div>
      <nav className="p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary-50 text-primary-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100">
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-4">
          <p className="text-sm font-medium text-primary-700">今日提示</p>
          <p className="text-xs text-primary-600 mt-1">及时更新物品状态，追踪回本进度</p>
        </div>
      </div>
    </aside>
  );
}
