import React from 'react';
import { BookOpen, Key, Link as LinkIcon, AlertTriangle, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

export function Docs() {
  const redirectUri = `${window.location.origin}/api/auth/google/callback`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 md:p-8 space-y-12 max-w-[1000px] mx-auto w-full pb-20"
    >
      {/* Header */}
      <div className="space-y-4 border-b border-outline-variant/10 pb-10">
        <div className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
          Documentation
        </div>
        <h2 className="text-4xl font-extrabold tracking-tight text-on-surface flex items-center gap-3">
          <BookOpen className="w-10 h-10 text-primary" />
          API Integration Guide
        </h2>
        <p className="text-secondary font-medium max-w-2xl text-lg">
          Learn how to obtain the necessary API keys to connect your local business data and unlock AI-powered features.
        </p>
      </div>

      {/* Why do we need these APIs? */}
      <section className="space-y-6">
        <h3 className="text-2xl font-bold text-on-surface flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-500" />
          Why do we need these APIs?
        </h3>
        <div className="bg-surface-container rounded-2xl p-6 text-on-surface-variant leading-relaxed space-y-4">
          <p>
            To provide you with a centralized dashboard for managing your local SEO, we need to securely access your data on platforms like Google Maps and Yelp. 
          </p>
          <p>
            Instead of asking for your passwords (which is insecure), we use <strong>OAuth 2.0</strong> and <strong>API Keys</strong>. This allows you to grant our application specific permissions (like reading reviews or updating business hours) directly through the platform provider. You remain in full control and can revoke these permissions at any time from your Google or Yelp account settings.
          </p>
        </div>
      </section>

      {/* Google Business Profile Setup */}
      <section className="space-y-6">
        <h3 className="text-2xl font-bold text-on-surface flex items-center gap-2">
          <Key className="w-6 h-6 text-primary" />
          Google Business Profile Setup
        </h3>
        
        <div className="bg-surface-container rounded-2xl p-8 space-y-8">
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-on-surface">1. Create a Google Cloud Project</h4>
            <ol className="list-decimal list-inside space-y-2 text-on-surface-variant ml-2">
              <li>Go to the <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium">Google Cloud Console</a>.</li>
              <li>Click on the project drop-down and select <strong>New Project</strong>.</li>
              <li>Enter a project name (e.g., "Local SEO Dashboard") and click <strong>Create</strong>.</li>
            </ol>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-bold text-on-surface">2. Enable Required APIs</h4>
            <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant/20">
              <p className="text-sm text-on-surface-variant mb-3">You must enable the following APIs in the API Library:</p>
              <ul className="list-disc list-inside space-y-1 text-sm font-medium text-on-surface">
                <li>My Business Account Management API</li>
                <li>My Business Business Information API</li>
                <li>Google My Business API (Legacy, if applicable)</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-bold text-on-surface">3. Configure OAuth Consent Screen</h4>
            <ol className="list-decimal list-inside space-y-2 text-on-surface-variant ml-2">
              <li>Go to <strong>APIs & Services {'>'} OAuth consent screen</strong>.</li>
              <li>Choose <strong>External</strong> (unless you have a Google Workspace organization) and click Create.</li>
              <li>Fill in the required fields (App name, User support email, Developer contact information).</li>
              <li>Save and continue through the Scopes and Test Users steps.</li>
              <li className="text-error font-medium flex items-start gap-2 mt-2">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>Important: While your app is in "Testing" mode, you MUST add your Google account email to the <strong>Test users</strong> list, otherwise you will get a 403 Access Denied error when trying to log in.</span>
              </li>
            </ol>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-bold text-on-surface">4. Create OAuth Credentials</h4>
            <ol className="list-decimal list-inside space-y-2 text-on-surface-variant ml-2">
              <li>Go to <strong>APIs & Services {'>'} Credentials</strong>.</li>
              <li>Click <strong>+ CREATE CREDENTIALS</strong> and select <strong>OAuth client ID</strong>.</li>
              <li>Select <strong>Web application</strong> as the Application type.</li>
              <li>Under <strong>Authorized redirect URIs</strong>, click ADD URI and paste the following exact URL:</li>
            </ol>
            <div className="bg-surface-container-lowest p-4 rounded-lg border border-primary/20 flex items-center gap-3 mt-2 ml-6">
              <LinkIcon className="w-5 h-5 text-primary shrink-0" />
              <code className="text-sm font-mono text-primary break-all select-all">
                {redirectUri}
              </code>
            </div>
            <p className="text-sm text-on-surface-variant ml-6 mt-2">
              After creating, copy the <strong>Client ID</strong> and <strong>Client Secret</strong> and paste them into the Settings page of this application.
            </p>
          </div>
        </div>
      </section>

      {/* Yelp Fusion Setup */}
      <section className="space-y-6">
        <h3 className="text-2xl font-bold text-on-surface flex items-center gap-2">
          <Key className="w-6 h-6 text-red-500" />
          Yelp Fusion API Setup
        </h3>
        
        <div className="bg-surface-container rounded-2xl p-8 space-y-4">
          <ol className="list-decimal list-inside space-y-3 text-on-surface-variant ml-2">
            <li>Go to the <a href="https://www.yelp.com/developers/v3/manage_app" target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium">Yelp Developers portal</a> and log in.</li>
            <li>Click on <strong>Create App</strong>.</li>
            <li>Fill out the required information (App Name, Industry, Contact Email, etc.).</li>
            <li>Once created, you will be provided with an <strong>API Key</strong>.</li>
            <li>Copy this API Key and paste it into the Settings page.</li>
          </ol>
        </div>
      </section>

      {/* Gemini AI Setup */}
      <section className="space-y-6">
        <h3 className="text-2xl font-bold text-on-surface flex items-center gap-2">
          <SparklesIcon className="w-6 h-6 text-emerald-500" />
          Gemini AI Setup
        </h3>
        
        <div className="bg-surface-container rounded-2xl p-8 border border-emerald-500/20">
          <p className="text-on-surface-variant leading-relaxed">
            Good news! Because this application is running within the Google AI Studio environment, your <strong>Gemini API key is automatically provisioned and securely injected</strong> into the backend. 
          </p>
          <p className="text-on-surface-variant leading-relaxed mt-4">
            You do not need to manually create or configure a Gemini API key. The AI features for generating review replies and analyzing listing optimizations are ready to use out of the box.
          </p>
        </div>
      </section>

    </motion.div>
  );
}

// Helper icon component
function SparklesIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
