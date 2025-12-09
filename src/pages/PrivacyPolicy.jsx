import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="p-3 bg-blue-600 rounded-lg">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Privacy Policy</h1>
          <p className="text-sm text-slate-600">Last updated: December 9, 2025</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 prose prose-slate max-w-none">
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
            <p className="text-slate-700 mb-3">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>Account information (name, email address)</li>
              <li>Company and target data you upload or enter</li>
              <li>Communication preferences and settings</li>
              <li>Usage data and analytics</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
            <p className="text-slate-700 mb-3">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Process and complete transactions</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Analyze usage patterns and trends</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">3. Data Storage and Security</h2>
            <p className="text-slate-700 mb-3">
              We implement appropriate technical and organizational measures to protect your personal data against unauthorized or unlawful processing, accidental loss, destruction, or damage.
            </p>
            <p className="text-slate-700">
              Your data is stored securely using industry-standard encryption and access controls. We regularly review our security practices to ensure the ongoing safety of your information.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">4. Third-Party Services</h2>
            <p className="text-slate-700 mb-3">
              We may integrate with third-party services including:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>Outreach.io for sales automation</li>
              <li>AI services for data enrichment</li>
              <li>Analytics and monitoring tools</li>
            </ul>
            <p className="text-slate-700 mt-3">
              These services have their own privacy policies and we encourage you to review them.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">5. Data Retention</h2>
            <p className="text-slate-700">
              We retain your personal data for as long as necessary to provide our services and fulfill the purposes outlined in this policy, unless a longer retention period is required by law.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">6. Your Rights</h2>
            <p className="text-slate-700 mb-3">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data</li>
              <li>Opt-out of marketing communications</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">7. Cookies and Tracking</h2>
            <p className="text-slate-700">
              We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">8. Changes to This Policy</h2>
            <p className="text-slate-700">
              We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Contact Us</h2>
            <p className="text-slate-700">
              If you have any questions about this Privacy Policy, please contact us through the app or at your designated support channel.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}