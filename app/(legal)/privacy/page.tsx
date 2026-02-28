import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'Privacy Policy - TipJars',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.jpg" alt="TipJars" width={32} height={32} />
            <span className="text-xl font-bold">TipJars</span>
          </Link>
        </div>
      </header>
      <main className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-8 text-3xl font-bold">Privacy Policy</h1>
        <p className="mb-4 text-sm text-muted-foreground">Last updated: February 28, 2026</p>

        <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold">1. Information We Collect</h2>
            <p>When you use TipJars, we collect the following information:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Account information:</strong> Your name, email address, and authentication credentials when you create an account.</li>
              <li><strong>Financial data:</strong> Income entries, expense records, and budget allocations that you voluntarily enter into the app.</li>
              <li><strong>Usage data:</strong> Basic analytics about how you interact with the app to improve our service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide and maintain the TipJars budgeting service.</li>
              <li>Process and display your income, expenses, and budget allocations.</li>
              <li>Send you important account notifications (e.g., rent reminders).</li>
              <li>Improve and optimize the app experience.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. Data Storage &amp; Security</h2>
            <p>Your data is stored securely using Supabase, which provides enterprise-grade security including:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Encryption at rest and in transit.</li>
              <li>Row-level security ensuring you can only access your own data.</li>
              <li>Regular security audits and compliance monitoring.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. Data Sharing</h2>
            <p>We do <strong>not</strong> sell, trade, or share your personal or financial data with third parties. We may share data only:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>With your explicit consent.</li>
              <li>To comply with legal obligations.</li>
              <li>With service providers who help us operate the app (e.g., hosting, authentication), under strict data processing agreements.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. Google OAuth</h2>
            <p>When you sign in with Google, we receive your name and email address from Google. We do not access your Google contacts, calendar, or any other Google services. We use this information solely for authentication and account creation.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Access all data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your account and all associated data.</li>
              <li>Export your data at any time.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. Cookies</h2>
            <p>We use essential cookies for authentication and session management. We do not use tracking cookies or third-party advertising cookies.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">8. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the updated policy on this page with a new &quot;Last updated&quot; date.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">9. Contact Us</h2>
            <p>If you have questions about this Privacy Policy, contact us at <a href="mailto:apeltekci@gmail.com" className="text-primary underline">apeltekci@gmail.com</a>.</p>
          </section>
        </div>
      </main>
    </div>
  )
}
