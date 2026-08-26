export default function TermsPage() {
  return (
    <main className="max-w-4xl mx-auto py-20 px-6 text-slate-300 leading-relaxed">
      <h1 className="text-3xl font-bold mb-2 text-white">Terms of Service</h1>
      <p className="text-sm text-slate-500 mb-8">Last updated: August 26, 2026</p>
      
      <div className="space-y-6 text-slate-400">
        <p>Welcome to Scannit ("Scannit," "we," "us," or "our"). These Terms of Service ("Terms") govern your access to and use of our website, services, and software, including our high-density NVIDIA GPU cluster leases (collectively, the "Services").</p>

        <p>By accessing or using our Services, you agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, please do not use our Services.</p>

        <h2 className="text-xl font-semibold text-white mt-8">1. Acceptance of Terms</h2>
        <p>These Terms constitute a binding agreement between you ("User," "you," or "your") and Scannit. Your access to and use of the Services is conditioned upon your acceptance of and compliance with these Terms.</p>

        <h2 className="text-xl font-semibold text-white mt-8">2. Description of Services</h2>
        <p>Scannit provides access to GPU computing resources for enterprise AI workloads. We may, at our discretion, modify or discontinue any part of the Services without prior notice.</p>

        <h2 className="text-xl font-semibold text-white mt-8">3. Acceptable Use Policy (AUP)</h2>
        <p>You agree to use our Services only for lawful purposes. Prohibited activities include, but are not limited to:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Unauthorized crypto mining, blockchain processing, or similar resource-intensive activities not related to AI modeling.</li>
          <li>Generating, hosting, or distributing malicious software, ransomware, or botnet infrastructure.</li>
          <li>Engaging in denial-of-service (DDoS) attacks or network interference.</li>
          <li>Generating or hosting unlawful content, including content that incites violence or terrorism.</li>
          <li>Unauthorized scanning or exploitation of network resources.</li>
          <li>Violation of export control or sanctions laws.</li>
        </ul>
        <p>Violation of this AUP may result in immediate suspension or termination of your account without a refund.</p>

        <h2 className="text-xl font-semibold text-white mt-8">4. Limitation of Liability and SLAs</h2>
        <p>TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, SCANNIT WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR EXEMPLARY DAMAGES, INCLUDING DAMAGES FOR LOSS OF PROFITS, REVENUES, CUSTOMERS, OPPORTUNITIES, GOODWILL, USE, OR DATA, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</p>
        <p>Our Service Level Agreement (SLA) defines specific uptime guarantees for enterprise agreements. For all other services, we provide the Services on an "AS IS" and "AS AVAILABLE" basis. While we optimize for hardware uptime, we are not liable for data loss or service interruption during automatic spot network failovers.</p>

        <h2 className="text-xl font-semibold text-white mt-8">5. Account and Billing</h2>
        <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to pay all fees associated with your use of the Services, as described in your pricing tier or service agreement.</p>
      </div>
    </main>
  );
}