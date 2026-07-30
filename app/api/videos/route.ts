import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  if (!supabase) {
    return NextResponse.json({ videos: [] })
  }

  const { data, error } = await supabase
    .from('published_videos')
    .select('id, title, description, video_url, thumbnail_url, view_count')
    .eq('published', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('GET /api/videos error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ videos: data ?? [] })
}
