'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { WorkflowsTab } from '@/components/tabs/workflows-tab'
import { UrlsTab } from '@/components/tabs/urls-tab'
import { KwResearchTab } from '@/components/tabs/kw-research-tab'
import { LinkBuildingTab } from '@/components/tabs/link-building-tab'
import { AnalyticsTab } from '@/components/tabs/analytics-tab'
import { SeoToolsTab } from '@/components/tabs/seo-tools-tab'
import { NofollowCloneTab } from '@/components/tabs/nofollow-clone-tab'
import { AgentTasksTab } from '@/components/tabs/agent-tasks-tab'
import { ModuleSuiteTab } from '@/components/tabs/module-suite-tab'
import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import { useAuth } from '@/hooks/useAuth'

export function Dashboard() {
  const [activeTab, setActiveTab] = useState('workflows')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const router = useRouter()
  const { signOut } = useAuth()

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onLogout={handleLogout} />

        <main className="flex-1 overflow-auto p-4 pb-28 sm:p-6 sm:pb-28 md:pb-6 min-w-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="workflows" className="m-0">
              <WorkflowsTab />
            </TabsContent>
            <TabsContent value="urls" className="m-0">
              <UrlsTab />
            </TabsContent>
            <TabsContent value="kwresearch" className="m-0">
              <KwResearchTab />
            </TabsContent>
            <TabsContent value="linkbuilding" className="m-0">
              <LinkBuildingTab />
            </TabsContent>
            <TabsContent value="nofollow" className="m-0">
              <NofollowCloneTab />
            </TabsContent>
            <TabsContent value="agents" className="m-0">
              <AgentTasksTab />
            </TabsContent>
            <TabsContent value="modules" className="m-0">
              <ModuleSuiteTab />
            </TabsContent>
            <TabsContent value="analytics" className="m-0">
              <AnalyticsTab />
            </TabsContent>
            <TabsContent value="seotools" className="m-0">
              <SeoToolsTab />
            </TabsContent>
          </Tabs>
        </main>
      </div>
      <MobileBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
