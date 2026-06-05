'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { BarChart3, Plus, TrendingUp, TrendingDown, Minus, Globe, Loader2 } from 'lucide-react'

interface RankEntry {
  id: string
  keyword: string
  url: string
  position: number
  previousPosition: number
  volume: number
  updated: string
}

export function RankTab() {
  const [rankings, setRankings] = useState<RankEntry[]>([
    { id: '1', keyword: 'seo tools', url: 'https://maximo-seo.ai/tools', position: 3, previousPosition: 5, volume: 5400, updated: '2 days ago' },
    { id: '2', keyword: 'n8n dashboard', url: 'https://maximo-seo.ai/dashboard', position: 1, previousPosition: 2, volume: 1200, updated: '1 day ago' },
    { id: '3', keyword: 'workflow automation', url: 'https://maximo-seo.ai/automation', position: 8, previousPosition: 8, volume: 3200, updated: '3 days ago' },
    { id: '4', keyword: 'content brief generator', url: 'https://maximo-seo.ai/content', position: 12, previousPosition: 15, volume: 890, updated: '2 days ago' },
    { id: '5', keyword: 'link building tools', url: 'https://maximo-seo.ai/links', position: 5, previousPosition: 4, volume: 2100, updated: '1 day ago' },
  ])
  const [newKeyword, setNewKeyword] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const addKeyword = async () => {
    if (!newKeyword.trim()) return
    
    setIsAdding(true)
    
    // Simulate API call
    setTimeout(() => {
      const newEntry: RankEntry = {
        id: Date.now().toString(),
        keyword: newKeyword.trim(),
        url: `https://maximo-seo.ai/${newKeyword.trim().replace(/\s+/g, '-')}`,
        position: Math.floor(Math.random() * 20) + 1,
        previousPosition: Math.floor(Math.random() * 20) + 1,
        volume: Math.floor(Math.random() * 5000) + 500,
        updated: 'Just now'
      }
      
      setRankings(prev => [newEntry, ...prev])
      setNewKeyword('')
      setIsAdding(false)
    }, 1500)
  }

  const getPositionChange = (current: number, previous: number) => {
    const diff = previous - current
    if (diff > 0) return { icon: TrendingUp, color: 'text-green-400', text: `+${diff}` }
    if (diff < 0) return { icon: TrendingDown, color: 'text-red-400', text: `${diff}` }
    return { icon: Minus, color: 'text-slate-400', text: '-' }
  }

  const getPositionBadge = (position: number) => {
    if (position === 1) return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">#1</Badge>
    if (position <= 3) return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Top 3</Badge>
    if (position <= 10) return <Badge variant="success">Top 10</Badge>
    if (position <= 20) return <Badge variant="outline" className="border-slate-700 text-slate-400">Top 20</Badge>
    return <Badge variant="outline" className="border-slate-700 text-slate-400">{position}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-500" />
            Rank Monitoring
          </h1>
          <p className="text-slate-400 mt-1">Track keyword rankings and SERP positions</p>
        </div>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">Add Keyword to Track</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Enter keyword to track..."
              className="flex-1 bg-slate-800 border-slate-700 text-white"
            />
            <Button 
              onClick={addKeyword}
              disabled={isAdding || !newKeyword.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isAdding ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking...</>
              ) : (
                <><Plus className="w-4 h-4 mr-2" /> Track</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <h3 className="text-lg font-semibold text-white">Tracked Keywords ({rankings.length})</h3>
        {rankings.map((entry) => {
          const change = getPositionChange(entry.position, entry.previousPosition)
          const ChangeIcon = change.icon
          
          return (
            <Card key={entry.id} className="bg-slate-900 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{entry.keyword}</h3>
                      <p className="text-sm text-slate-400 truncate max-w-md">{entry.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Search Volume</p>
                      <p className="text-white font-medium">{entry.volume.toLocaleString()}/mo</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Position</p>
                      <div className="flex items-center gap-2">
                        {getPositionBadge(entry.position)}
                        <span className={`flex items-center gap-1 ${change.color}`}>
                          <ChangeIcon className="w-3 h-3" />
                          {change.text}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Updated</p>
                      <p className="text-slate-400 text-sm">{entry.updated}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
