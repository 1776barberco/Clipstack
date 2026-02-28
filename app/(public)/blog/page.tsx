import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Blog - TipJars',
  description: 'Tips, guides, and advice for barbers, stylists, nail techs, tattoo artists, and independent beauty professionals on managing money and growing your business.',
}

const posts = [
  {
    slug: 'tips-for-managing-barber-income',
    title: '5 Tips for Managing Your Income as a Beauty Professional',
    excerpt: 'Irregular income doesn\'t have to mean financial chaos. Here are five practical strategies every barber, stylist, and beauty pro can use to take control of their money.',
    date: 'February 25, 2026',
  },
  {
    slug: 'why-barbers-need-a-budget',
    title: 'Why Every Beauty Professional Needs a Budget (And How to Start)',
    excerpt: 'Most beauty pros skip budgeting because traditional methods don\'t fit. Here\'s why a jar-based system changes everything.',
    date: 'February 20, 2026',
  },
  {
    slug: 'tax-tips-for-stylists',
    title: 'Tax Tips Every Beauty Professional Should Know',
    excerpt: 'Self-employment taxes don\'t have to be scary. Learn what to deduct, how much to set aside, and how to avoid April surprises.',
    date: 'February 15, 2026',
  },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-emerald-400 hover:text-emerald-300 text-sm mb-8 inline-block">&larr; Back to TipJars</Link>
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">TipJars Blog</h1>
        <p className="text-zinc-400 mb-12">Money tips and business advice for barbers, stylists, nail techs, tattoo artists, and independent professionals.</p>
        <div className="space-y-6">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer">
                <CardContent className="pt-6">
                  <p className="text-zinc-500 text-xs mb-2">{post.date}</p>
                  <h2 className="text-xl font-semibold text-zinc-100 mb-2">{post.title}</h2>
                  <p className="text-zinc-400 text-sm">{post.excerpt}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
