import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="p-3 bg-emerald-600 rounded-lg">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Terms of Service</h1>
          <p className="text-sm text-slate-600">Last updated: December 9, 2025</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 prose prose-slate max-w-none">
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-slate-700">
              By accessing and using this service, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use this service.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
            <p className="text-slate-700">
              This application provides business development and deal sourcing tools, including data import, analysis, scoring, and integration with third-party services like Outreach.io. The service is provided "as is" and we reserve the right to modify or discontinue the service at any time.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">3. User Accounts and Responsibilities</h2>
            <p className="text-slate-700 mb-3">
              When you create an account, you agree to:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized use</li>
              <li>Not share your account with others</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">4. Acceptable Use</h2>
            <p className="text-slate-700 mb-3">
              You agree not to use the service to:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>Violate any laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Upload malicious code or viruses</li>
              <li>Attempt to gain unauthorized access to systems</li>
              <li>Harass, abuse, or harm others</li>
              <li>Scrape or harvest data without permission</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">5. Data Ownership and Usage</h2>
            <p className="text-slate-700 mb-3">
              You retain ownership of all data you upload to the service. By using the service, you grant us a license to:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>Process and analyze your data to provide the service</li>
              <li>Use anonymized, aggregated data for service improvement</li>
              <li>Store your data securely on our servers</li>
            </ul>
            <p className="text-slate-700 mt-3">
              You are responsible for ensuring you have the right to upload and process any third-party data.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">6. Third-Party Integrations</h2>
            <p className="text-slate-700">
              Our service integrates with third-party platforms including Outreach.io and AI services. Your use of these integrations is subject to their respective terms of service. We are not responsible for the availability, functionality, or policies of third-party services.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">7. Intellectual Property</h2>
            <p className="text-slate-700">
              The service, including its software, design, and content, is protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or reverse engineer any part of the service without our prior written consent.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">8. Fees and Payment</h2>
            <p className="text-slate-700">
              Certain features may require payment. You agree to pay all fees associated with your account. We reserve the right to change pricing with notice. Failure to pay may result in service suspension or termination.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">9. Limitation of Liability</h2>
            <p className="text-slate-700">
              To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including lost profits, data loss, or business interruption, arising from your use of the service.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">10. Disclaimer of Warranties</h2>
            <p className="text-slate-700">
              The service is provided "as is" without warranties of any kind, either express or implied. We do not warrant that the service will be uninterrupted, error-free, or secure. You use the service at your own risk.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">11. Termination</h2>
            <p className="text-slate-700">
              We reserve the right to suspend or terminate your access to the service at any time for violations of these terms or for any other reason. Upon termination, you must cease all use of the service and we may delete your data.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">12. Changes to Terms</h2>
            <p className="text-slate-700">
              We may modify these terms at any time. We will notify you of material changes by email or through the service. Your continued use after such changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">13. Governing Law</h2>
            <p className="text-slate-700">
              These terms are governed by the laws of the jurisdiction in which the service operates, without regard to conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">14. Contact Information</h2>
            <p className="text-slate-700">
              If you have questions about these Terms of Service, please contact us through the app or at your designated support channel.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}