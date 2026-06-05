'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Target, Plus, Search, Loader2, Globe, TrendingUp, TrendingDown } from 'lucide-react'

interface Competitor {
  id: string
  domain: string
  keywords: number
  backlinks: number
  traffic: number
  change: number
  status: 'tracking' | 'error' | 'pending'
}

export function CompetitorsTab() {
  const [competitors, setCompetitors] = useState<Competitor[]>([
    { id: '1', domain: 'competitor1.com', keywords: 1250, backlinks: 4500, traffic: 25000, change: 5.2, status: 'tracking' },
    { id: '2', domain: 'competitor2.com', keywords: 890, backlinks: 3200, traffic: 18000, change: -2.1, status: 'tracking' },
    { id: '3', domain: 'competitor3.com', keywords: 2100, backlinks: 8900, traffic: 45000, change: 12.5, status: 'tracking' },
  ])
  const [newDomain, setNewDomain] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const addCompetitor = async () => {
    if (!newDomain.trim()) return
    
    setIsAdding(true)
    
    // Simulate API call to DataForSEO
    setTimeout(() => {
      const newCompetitor: Competitor = {
        id: Date.now().toString(),
        domain: newDomain.trim(),
        keywords: Math.floor(Math.random() * 2000) + 500,
        backlinks: Math.floor(Math.random() * 5000) + 1000,
        traffic: Math.floor(Math.random() * 50000) + 5000,
        change: parseFloat((Math.random() * 20 - 10).toFixed(1)),
        status: 'tracking'
      }
      
      setCompetitors(prev => [newCompetitor, ...prev])
      setNewDomain('')
      setIsAdding(false)
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Target className="w-6 h-6 text-red-500" />
            Competitor Tracking
          </h1>
          <p className="text-slate-400 mt-1">Monitor your competitors SEO performance</p>
        </div>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">Add Competitor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="example.com"
              className="flex-1 bg-slate-800 border-slate-700 text-white"
            />
            <Button 
              onClick={addCompetitor}
              disabled={isAdding || !newDomain.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isAdding ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
              ) : (
                <><Plus className="w-4 h-4 mr-2" /> Add</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <h3 className="text-lg font-semibold text-white">Tracked Competitors ({competitors.length})</h3>
        {competitors.map((competitor) => (
          <Card key={competitor.id} className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{competitor.domain}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-slate-400">{competitor.keywords.toLocaleString()} keywords</span>
                      <span className="text-sm text-slate-400">{competitor.backlinks.toLocaleString()} backlinks</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-white font-medium">{competitor.traffic.toLocaleString()}</p>
                    <p className="text-sm text-slate-500">monthly visits</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {competitor.change > 0 ? (
                      <><TrendingUp className="w-4 h-4 text-green-400" /><span className="text-green-400 font-medium">+{competitor.change}%</span></>
                    ) : (
                      <><TrendingDown className="w-4 h-4 text-red-400" /><span className="text-red-400 font-medium">{competitor.change}%</span></>
                    )}
                  </div>
                  <Badge variant={competitor.status === 'tracking' ? 'success' : 'warning'}>
                    {competitor.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
