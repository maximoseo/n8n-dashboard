'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'

const stats = [
  { label: 'Total Workflow Runs', value: '12,847', change: '+23%', trend: 'up' },
  { label: 'Screenshots Captured', value: '45,231', change: '+156', trend: 'up' },
  { label: 'Keywords Analyzed', value: '892K', change: '+12%', trend: 'up' },
  { label: 'Active Campaigns', value: '24', change: '+3', trend: 'up' },
]

const recentActivity = [
  { id: 1, action: 'Workflow completed', target: 'URL Screenshot Pipeline', time: '2 min ago', status: 'success' },
  { id: 2, action: 'Keyword scan started', target: 'Dental SEO Q3', time: '15 min ago', status: 'processing' },
  { id: 3, action: 'Link campaign approved', target: 'industry-blog.com', time: '1 hour ago', status: 'success' },
  { id: 4, action: 'Sheet writeback completed', target: 'Parent ID Scanner', time: '2 hours ago', status: 'success' },
  { id: 5, action: 'Error in workflow', target: 'Link Building Scorer', time: '3 hours ago', status: 'error' },
]

export function AnalyticsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-500" />
          Analytics
        </h1>
        <p className="text-slate-400 mt-1">Dashboard performance and activity overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <p className="text-sm text-slate-400">{stat.label}</p>
              <div className="flex items-end justify-between mt-2">
                <span className="text-2xl font-bold text-white">{stat.value}</span>
                <div className={`flex items-center gap-1 text-sm ${stat.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                  {stat.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {stat.change}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Recent Activity
            </CardTitle>
            <CardDescription className="text-slate-400">Latest actions across all modules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  {activity.status === 'success' && <CheckCircle className="w-5 h-5 text-green-400" />}
                  {activity.status === 'processing' && (
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  )}
                  {activity.status === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
                  <div>
                    <p className="text-sm font-medium text-white">{activity.action}</p>
                    <p className="text-xs text-slate-400">{activity.target}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-500">{activity.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              System Status
            </CardTitle>
            <CardDescription className="text-slate-400">Component health and availability</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
              <span className="text-white">n8n API</span>
              <Badge variant="success" className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Operational
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
              <span className="text-white">Browserless Screenshots</span>
              <Badge variant="success" className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Operational
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
              <span className="text-white">KW Research API</span>
              <Badge variant="success" className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Operational
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
              <span className="text-white">Paperclip Integration</span>
              <Badge variant="success" className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Operational
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
