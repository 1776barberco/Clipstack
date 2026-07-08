import { JarDetail } from '@/components/JarDetail'

export default async function JarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return <JarDetail jarId={id} />
}
