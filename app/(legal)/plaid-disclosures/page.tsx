import Link from 'next/link'

export const metadata = {
  title: 'Plaid Disclosures - TipJars',
}

export default function PlaidDisclosuresPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold">TipJars</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-8 text-3xl font-bold">Plaid Disclosures</h1>
        <p className="mb-4 text-sm text-muted-foreground">Last updated: May 18, 2026</p>

        <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold">How TipJars Uses Plaid</h2>
            <p>
              TipJars uses Plaid, a third-party financial data provider, to help you securely connect your bank account and display up-to-date balance and transaction information inside TipJars.
            </p>
            <p>
              Connecting through Plaid makes it easier to visualize your income, spending, and jar activity without manually entering every transaction. This helps your TipJars dashboard reflect what is happening in your real finances more smoothly and accurately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Read-Only Access</h2>
            <p>
              TipJars only uses Plaid to receive read-only financial information, such as account balances and transaction history. TipJars does not touch, transfer, withdraw, deposit, or move money in any way.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Bank Credentials and Security</h2>
            <p>
              Your bank login information is handled through Plaid and protected by Plaid&apos;s security features. TipJars does not store your bank username or password.
            </p>
            <p>
              Plaid acts as the secure third-party connection between your financial institution and TipJars so we can display current bank balance and transaction information in your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Your Control</h2>
            <p>
              You can choose whether to connect a bank account through Plaid. If you disconnect your bank account, TipJars will stop receiving updated balance and transaction data from Plaid for that account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Important Disclaimer</h2>
            <p>
              TipJars is a budgeting and financial organization tool. It is not a bank, financial institution, payment processor, or money transfer service. Plaid is an independent third-party service used by TipJars to provide secure access to financial data.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
