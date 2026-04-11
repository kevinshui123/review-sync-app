import React, { useState } from 'react';
import {
  Help,
  Settings,
  Key,
  Api,
  Link as LinkIcon,
  ExpandMore,
  ExpandLess,
  CheckCircle,
  SmartToy,
  RateReview,
  Public,
  OpenInNew,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'motion/react';

export function Help() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: 'How do I connect EmbedSocial?',
      answer: 'Go to Settings > API Keys, then enter your EmbedSocial API key. You can find your API key in your EmbedSocial dashboard under Account > API. The API base URL should be https://embedsocial.com/app/api.',
    },
    {
      question: 'How do I sync reviews from Google?',
      answer: 'After connecting EmbedSocial, go to the Listings page and add your business locations. Link each location to its corresponding EmbedSocial source, then go to the Reviews page and click "Sync Reviews" to pull in all your Google reviews.',
    },
    {
      question: 'How does AI reply generation work?',
      answer: 'The app uses Gemini AI to generate professional replies to customer reviews. Make sure you have configured a Gemini API key in Settings. Click "Generate AI reply" when viewing a review to create a suggested response.',
    },
    {
      question: 'Can I bulk edit multiple locations?',
      answer: 'Yes! Go to Bulk Edits and select the locations you want to update. Choose which fields to modify (phone, address, website), review the changes, and apply them to all selected locations at once.',
    },
    {
      question: 'How do I publish posts to Google?',
      answer: 'Go to Publishing and click "Create New Post". Write your content, select a location, optionally schedule a date/time, and save. Currently posts are saved as drafts in the database.',
    },
    {
      question: 'What data is synced from EmbedSocial?',
      answer: 'The app syncs: Google reviews (with ratings, comments, and dates), location information (name, address, phone), and review metrics. Data is pulled based on your connected EmbedSocial sources.',
    },
  ];

  const setupGuides = [
    {
      icon: <Key className="w-5 h-5" />,
      title: 'Get EmbedSocial API Key',
      steps: [
        'Log in to your EmbedSocial account',
        'Go to Account > API',
        'Copy your API key',
        'Paste it in Settings > API Keys',
      ],
    },
    {
      icon: <LinkIcon className="w-5 h-5" />,
      title: 'Connect Locations',
      steps: [
        'Go to Listings page',
        'Click "New listing" to add a business',
        'Click "Link EmbedSocial" on each location',
        'Select the matching source from EmbedSocial',
      ],
    },
    {
      icon: <RateReview className="w-5 h-5" />,
      title: 'Sync Reviews',
      steps: [
        'Go to Reviews page',
        'Click "Sync Reviews" button',
        'Wait for the sync to complete',
        'Start managing your reviews!',
      ],
    },
    {
      icon: <SmartToy className="w-5 h-5" />,
      title: 'Set Up AI Replies',
      steps: [
        'Go to Settings > API Keys',
        'Enter your Gemini API key',
        'Go to Reviews and select a review',
        'Click "Generate AI reply" to create responses',
      ],
    },
  ];

  const features = [
    {
      icon: <RateReview className="w-6 h-6" />,
      title: 'Review Management',
      description: 'Sync and manage Google reviews from multiple locations in one place.',
    },
    {
      icon: <SmartToy className="w-6 h-6" />,
      title: 'AI-Powered Replies',
      description: 'Generate professional responses to customer reviews using Gemini AI.',
    },
    {
      icon: <Public className="w-6 h-6" />,
      title: 'Bulk Edits',
      description: 'Update phone numbers, addresses, and other info across multiple locations.',
    },
    {
      icon: <Settings className="w-6 h-6" />,
      title: 'Publishing',
      description: 'Schedule and manage posts to your Google Business profiles.',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-6 lg:p-8 max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Help className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Help Center</h1>
        <p className="text-slate-500">Learn how to set up and use Review Sync App</p>
      </div>

      {/* Features Overview */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature, i) => (
            <div key={i} className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
                {feature.icon}
              </div>
              <h3 className="font-bold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-500">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Setup Guides */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Quick Setup Guide</h2>
        <div className="space-y-4">
          {setupGuides.map((guide, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 p-4 bg-slate-50">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                  {guide.icon}
                </div>
                <h3 className="font-bold text-slate-900">{guide.title}</h3>
              </div>
              <div className="p-4">
                <ol className="space-y-2">
                  {guide.steps.map((step, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm">
                      <span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {j + 1}
                      </span>
                      <span className="text-slate-600">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <button
                onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
              >
                <span className="font-semibold text-slate-900 pr-4">{faq.question}</span>
                {expandedFaq === i ? (
                  <ExpandLess className="w-5 h-5 text-slate-400 flex-shrink-0" />
                ) : (
                  <ExpandMore className="w-5 h-5 text-slate-400 flex-shrink-0" />
                )}
              </button>
              <AnimatePresence>
                {expandedFaq === i && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-0 text-sm text-slate-600 border-t border-slate-100 pt-3">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* API Documentation Link */}
      <section className="bg-gradient-to-br from-primary/5 to-primary-container/5 rounded-2xl p-8 border border-primary/10">
        <h2 className="text-xl font-bold text-slate-900 mb-4">EmbedSocial API Documentation</h2>
        <p className="text-slate-600 mb-6">
          For detailed API documentation, visit the official EmbedSocial API reference.
        </p>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-2">Available Endpoints</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <code className="bg-slate-100 px-2 py-0.5 rounded text-xs">GET /rest/v1/items</code>
              <span className="text-slate-500">- Reviews</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <code className="bg-slate-100 px-2 py-0.5 rounded text-xs">GET /rest/v1/listings</code>
              <span className="text-slate-500">- Locations</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <code className="bg-slate-100 px-2 py-0.5 rounded text-xs">PATCH /rest/v1/listings/:id</code>
              <span className="text-slate-500">- Update location</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <code className="bg-slate-100 px-2 py-0.5 rounded text-xs">POST /rest/v1/items/:id/replies</code>
              <span className="text-slate-500">- Reply to review</span>
            </li>
          </ul>
        </div>
      </section>
    </motion.div>
  );
}
