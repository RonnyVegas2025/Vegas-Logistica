import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Só permite atualizar obs_parceiro
  const { obs_parceiro } = await req.json()
  const { data, error } = await sb.from('entregas').update({
    obs_parceiro,
    obs_parceiro_em: new Date().toISOString(),
    obs_parceiro_usuario: user.id,
  }).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
