import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, MapPin, Package, ShoppingCart, Warehouse,
  ClipboardList, Scale, Truck, Factory, TrendingUp, Users, BarChart3,
  ChevronRight, LogOut, Bird,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'

const allNav = [
  { path: '/dashboard',     label: 'Dashboard',      icon: LayoutDashboard, roles: ['admin','supervisor','operator'] },
  { path: '/farms',         label: 'Farms',           icon: MapPin,          roles: ['admin','supervisor'] },
  { path: '/batches',       label: 'Batches',         icon: Package,         roles: ['admin','supervisor','operator'] },
  { path: '/procurement',   label: 'Procurement',     icon: ShoppingCart,    roles: ['admin'] },
  { path: '/inventory',     label: 'Inventory',       icon: Warehouse,       roles: ['admin'] },
  { path: '/daily-reports', label: 'Daily Reports',   icon: ClipboardList,   roles: ['admin','supervisor'] },
  { path: '/weighing',      label: 'Weighing',        icon: Scale,           roles: ['admin','supervisor'] },
  { path: '/transport',     label: 'Transport',       icon: Truck,           roles: ['admin','supervisor','operator'] },
  { path: '/processing',    label: 'Processing',      icon: Factory,         roles: ['admin','operator'] },
  { path: '/sales',         label: 'Sales',           icon: TrendingUp,      roles: ['admin'] },
  { path: '/reports',       label: 'Reports',         icon: BarChart3,       roles: ['admin','supervisor'] },
  { path: '/users',         label: 'Users',           icon: Users,           roles: ['admin'] },
]

export default function Sidebar() {
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const nav = allNav.filter(n => user && n.roles.includes(user.role))

  return (
    <aside className="w-64 bg-slate-900 border-r border-border flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
            <Bird className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-bold text-slate-100">PoultryFlow</p>
            <p className="text-xs text-muted capitalize">{user?.role} Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {nav.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path
          return (
            <Link key={path} to={path}>
              <motion.div
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.97 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
                  ${active
                    ? 'bg-primary/15 text-primary border border-primary/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                  }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight className="w-3 h-3 opacity-60" />}
              </motion.div>
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-3 px-3">
          <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center text-primary font-bold text-sm">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
            <p className="text-xs text-muted truncate">{user?.email}</p>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-400
                     hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </motion.button>
      </div>
    </aside>
  )
}
