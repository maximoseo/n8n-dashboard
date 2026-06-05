'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sparkles, Loader2, Copy, Download, Check } from 'lucide-react'

interface GeneratedContent {
  type: 'brief' | 'titles' | 'content' | 'analysis'
  content: string
  timestamp: string
}

export function AIContentGenerator() {
  const [activeTab, setActiveTab] = useState('brief')
  const [keyword, setKeyword] = useState('')
  const [topic, setTopic] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null)
  const [copied, setCopied] = useState(false)

  const generateContent = async () => {
    let prompt = ''
    
    switch (activeTab) {
      case 'brief':
        prompt = `Create a comprehensive SEO content brief for the keyword: "${keyword}"

Include:
1. Target audience and search intent
2. Recommended content type (guide, listicle, etc.)
3. Key sections to cover
4. Recommended word count
5. 3 title options
6. Meta description
7. Related keywords (LSI)
8. Content structure (H2/H3 outline)

Format in clean markdown.`
        break
      case 'titles':
        prompt = `Generate 5 SEO-optimized titles and 3 meta descriptions for keyword: "${keyword}"

Requirements:
- Titles: 50-60 characters, compelling, include keyword
- Meta descriptions: 150-160 characters, include CTA

Format as:
TITLES:
1. [title]
2. [title]
...

META DESCRIPTIONS:
1. [description]
2. [description]
...`
        break
      case 'content':
        prompt = `Write a comprehensive article about: "${topic || keyword}"

Requirements:
- 800-1200 words
- Include introduction, main sections with H2 headings, conclusion
- SEO-optimized with natural keyword usage
- Engaging and informative tone
- Include a call-to-action at the end

Format in markdown with proper headings.`
        break
      case 'analysis':
        prompt = `Analyze the keyword: "${keyword}" for SEO

Provide:
1. Search intent analysis
2. Competition level assessment
3. Content gap opportunities
4. Related topics to cover
5. User questions this content should answer
6. Recommended internal linking topics

Format in markdown.`
        break
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, type: activeTab })
      })

      const data = await response.json()

      if (data.success) {
        setGeneratedContent({
          type: activeTab as any,
          content: data.content,
          timestamp: new Date().toISOString()
        })
      } else {
        alert('Failed to generate: ' + data.error)
      }
    } catch (error) {
      alert('Error generating content')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = () => {
    if (generatedContent?.content) {
      navigator.clipboard.writeText(generatedContent.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const downloadContent = () => {
    if (generatedContent?.content) {
      const blob = new Blob([generatedContent.content], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ai-generated-${activeTab}-${Date.now()}.md`
      a.click()
    }
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          AI Content Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="brief">Content Brief</TabsTrigger>
            <TabsTrigger value="titles">Titles & Meta</TabsTrigger>
            <TabsTrigger value="content">Article</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-3">
          {activeTab === 'content' ? (
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter article topic..."
              className="bg-slate-800 border-slate-700 text-white"
            />
          ) : (
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Enter keyword..."
              className="bg-slate-800 border-slate-700 text-white"
            />
          )}

          <Button
            onClick={generateContent}
            disabled={isGenerating || (!keyword && !topic)}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {isGenerating ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> Generate with AI</>
            )}
          </Button>
        </div>

        {generatedContent && (
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                Generated {new Date(generatedContent.timestamp).toLocaleTimeString()}
              </Badge>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="border-slate-700" onClick={copyToClipboard}>
                  {copied ? <><Check className="w-4 h-4 mr-1" /> Copied</> : <><Copy className="w-4 h-4 mr-1" /> Copy</>}
                </Button>
                <Button variant="outline" size="sm" className="border-slate-700" onClick={downloadContent}>
                  <Download className="w-4 h-4 mr-1" /> Download
                </Button>
              </div>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 max-h-[500px] overflow-y-auto">
              <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono">{generatedContent.content}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
