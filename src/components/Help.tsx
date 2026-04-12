import React, { useState } from 'react';
import {
  HelpOutline,
  Settings,
  Key,
  Link as LinkIcon,
  ExpandMore,
  ExpandLess,
  CheckCircle,
  SmartToy,
  RateReview,
  Public,
  Store,
  AutoAwesome,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

export function Help() {
  const { t } = useLanguage();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: t('help.faq1'),
      answer: t('help.faq1Ans'),
    },
    {
      question: t('help.faq2'),
      answer: 'Go to Settings > Google Business Listings, then click "Connect New Listing". You will be redirected to authorize access to your Google Business Profile through our secure partner (EmbedSocial). After authorization, your listings will be automatically synced.',
    },
    {
      question: t('help.faq3'),
      answer: t('help.faq3Ans'),
    },
    {
      question: t('help.faq4'),
      answer: 'The app uses Gemini AI to generate professional replies to customer reviews. Make sure you have configured a Gemini API key in Settings > AI Models API. Click "Generate AI reply" when viewing a review to create a suggested response.',
    },
    {
      question: t('help.faq5'),
      answer: t('help.faq5Ans'),
    },
    {
      question: t('help.faq6'),
      answer: 'Go to Publishing and click "Create New Post". Write your content, select a location, optionally schedule a date/time, and save.',
    },
  ];

  const setupGuides = [
    {
      icon: <Store className="w-5 h-5" />,
      title: t('help.step1'),
      steps: [
        t('help.step1Desc'),
        'Find "Google Business Listings" section',
        'Click "Connect New Listing" button',
        'Authorize access in the popup window',
        'Your listings will sync automatically',
      ],
    },
    {
      icon: <RateReview className="w-5 h-5" />,
      title: t('help.step2'),
      steps: [
        'Go to Reviews page',
        'View all reviews from your listings',
        'Filter by location or rating',
        'Click on a review to see details',
        'Generate AI reply or write your own',
      ],
    },
    {
      icon: <SmartToy className="w-5 h-5" />,
      title: t('help.step3'),
      steps: [
        'Go to Settings > AI Models API',
        'Enter your Gemini API key',
        'Save the settings',
        'Go to Reviews and select a review',
        'Click "Generate AI reply" to create responses',
      ],
    },
    {
      icon: <Public className="w-5 h-5" />,
      title: t('help.step4'),
      steps: [
        'Go to Listings page',
        'Click on a listing to edit',
        'Update business information',
        'Changes are saved automatically',
      ],
    },
  ];

  const features = [
    {
      icon: <RateReview className="w-6 h-6" />,
      title: t('help.feature1'),
      description: 'View and manage Google reviews from all your business locations in one place.',
    },
    {
      icon: <SmartToy className="w-6 h-6" />,
      title: t('help.feature2'),
      description: 'Generate professional responses to customer reviews using Gemini AI.',
    },
    {
      icon: <AutoAwesome className="w-6 h-6" />,
      title: t('help.feature3'),
      description: 'Automatically sync your business listings and reviews from Google Business Profile.',
    },
    {
      icon: <Settings className="w-6 h-6" />,
      title: t('help.feature4'),
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
          <HelpOutline className="w-8 h-8 text-primary" />
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
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-3 text-sm text-slate-600 border-t border-slate-100">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
