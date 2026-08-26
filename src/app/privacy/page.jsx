export default function PrivacyPage() {
  return (
    <main className="max-w-4xl mx-auto py-20 px-6 text-slate-800 leading-relaxed">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-slate-500 mb-8">Last updated: August 26, 2026</p>
      
      <div className="space-y-6 text-slate-600">
        <p>Scannit ("Scannit," "we," "us," or "our") respects your privacy and is committed to protecting it through our compliance with this policy. This Privacy Policy describes how we collect, use, process, and disclose your information in connection with our website, software, and services (collectively, the "Services").</p>

        <p>Generic privacy policies are insufficient for SaaS platforms like Scannit. We continuously process data through complex cloud infrastructure, manage multi-tenant environments, and handle complex data flows across APIs and databases.</p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">1. Information We Collect</h2>
        <p>We collect information you provide directly to us, information collected automatically, and information from third parties.</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>User Account Data:</strong> Name, email address, physical address, and profile information.</li>
          <li><strong>Billing Information:</strong> Payment details (processed by our secure payment provider).</li>
          <li><strong>Usage and Analytics Data:</strong> IP address, session data, login history, and error logs.</li>
        1</ul>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">2. Third-Party Data Disclosures</h2>
        <p>To provide our Services, we may disclose certain personal data to third-party subprocessors for specific operational functions, including:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Marketing and CRM:</strong> Klaviyo, HubSpot.</li>
          <li><strong>Analytics and Optimization:</strong> Google Analytics, Vercel.</li>
          <li><strong>Payment Processing:</strong> Stripe (or your chosen provider).</li>
        </ul>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">3. Lawful Basis for Processing (GDPR/EU)</h2>
        <p>If you are located in the European Economic Area (EEA) or the UK, we process your information under the following lawful bases:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Contractual necessity: Creating accounts, processing billing.</li>
          <li>Legitimate interests: Marketing communications, product improvement, fraud prevention.</li>
          <li>Legal obligation: Tax reporting.</li>
        </ul>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">4. Your Rights (DSGVO/GDPR)</h2>
        <p>You have certain rights regarding your personal information, including:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Right to access: Request a copy of the data we hold.</li>
          <li>Right to deletion: Request we erase your data.</li>
          <li>Right to correct: Request correction of inaccurate information.</li>
          <li>Right to opt-out: Of marketing communications.</li>
        </ul>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">5. Data Retention and Deletion</h2>
        <p>We retain different data types (active accounts, canceled accounts, trial accounts, backups) for specific periods and have detailed deletion procedures in place.</p>
      </div>
    </main>
  );
}