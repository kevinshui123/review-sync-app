import React, { useState } from 'react';
import {
  Dashboard,
  PushPin,
  RateReview,
  Edit,
  CalendarToday,
  History,
  BarChart,
  Public,
  Settings,
  CheckCircle,
  Pending,
  Lock,
  ArrowForward,
  Add,
} from '@mui/icons-material';
import { motion } from 'motion/react';

interface BulkEditsProps {
  setActiveTab: (tab: string) => void;
}

export function BulkEdits({ setActiveTab }: BulkEditsProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectAll, setSelectAll] = useState(true);

  const steps = [
    { id: 1, title: 'Select locations', active: true, completed: false },
    { id: 2, title: 'Choose info type', active: false, completed: false },
    { id: 3, title: 'Review & Apply', active: false, completed: false },
  ];

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-6 lg:p-8 max-w-5xl mx-auto"
    >
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline mb-2">Bulk Edits</h1>
          <p className="text-slate-500">Efficiently update multiple business locations simultaneously.</p>
        </div>
        <div className="flex bg-slate-50 p-1 rounded-full">
          <button className="px-4 py-1.5 text-xs font-semibold bg-white shadow-sm rounded-full text-primary">Single-info bulk edit</button>
          <button className="px-4 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700">Multi-info bulk CSV</button>
          <button className="px-4 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700">Template manager</button>
        </div>
      </div>

      {/* Wizard Steps */}
      <div className="space-y-8">
        {/* Step 1: Active */}
        <section className={`bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden ${currentStep === 1 ? '' : 'opacity-40 grayscale-[0.3]'}`}>
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                currentStep === 1 ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {currentStep > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
              </div>
              <h2 className="text-lg font-bold">Select locations</h2>
            </div>
          </div>
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <div className="w-full max-w-md">
              <div className="mb-8 flex flex-col items-center">
                <div className="w-24 h-24 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
                  <div className="w-20 h-20 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400 font-bold text-xl">
                    M
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">Mahjong mini bowl</h3>
                <p className="text-slate-500 text-sm mb-6">12 active locations selected from your portfolio.</p>

                {/* Selection Toggle */}
                <div className="w-full flex items-center justify-center gap-3 mb-8">
                  <button
                    onClick={() => setSelectAll(true)}
                    className={`flex items-center gap-2 px-4 py-2 border-2 rounded-xl text-sm font-semibold transition-all ${
                      selectAll
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-slate-200 text-slate-500'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" style={{ fontVariationSettings: "'FILL' 1" }} />
                    All locations
                  </button>
                  <button
                    onClick={() => setSelectAll(false)}
                    className={`flex items-center gap-2 px-4 py-2 border-2 rounded-xl text-sm font-medium transition-all ${
                      !selectAll
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-slate-200 text-slate-500'
                    }`}
                  >
                    Filter selection
                  </button>
                </div>
              </div>

              {currentStep === 1 && (
                <button
                  onClick={handleNext}
                  className="w-full py-4 bg-primary hover:bg-primary-container text-white font-bold rounded-xl transition-all duration-300 shadow-md shadow-primary/20 flex items-center justify-center gap-2"
                >
                  Next
                  <ArrowForward className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Step 2: Disabled */}
        <section className={`bg-white rounded-xl border border-slate-100 overflow-hidden ${currentStep === 2 ? '' : 'opacity-40 grayscale-[0.3]'}`}>
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                currentStep === 2 ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {currentStep > 2 ? <CheckCircle className="w-5 h-5" /> : '2'}
              </div>
              <h2 className="text-lg font-bold text-slate-400">Choose info type</h2>
            </div>
          </div>
          <div className="p-12 text-center">
            <Pending className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-sm">
              {currentStep === 2 ? 'Select the fields you wish to edit' : 'Complete Step 1 to select the fields you wish to edit.'}
            </p>
            {currentStep === 2 && (
              <div className="mt-8 grid grid-cols-2 gap-4">
                {['Business Name', 'Address', 'Phone', 'Hours', 'Description', 'Photos'].map((item) => (
                  <button
                    key={item}
                    className="p-4 border-2 border-slate-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-sm font-medium"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Step 3: Disabled */}
        <section className={`bg-white rounded-xl border border-slate-100 overflow-hidden ${currentStep === 3 ? '' : 'opacity-40 grayscale-[0.3]'}`}>
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                currentStep === 3 ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {currentStep > 3 ? <CheckCircle className="w-5 h-5" /> : '3'}
              </div>
              <h2 className="text-lg font-bold text-slate-400">Review & Apply</h2>
            </div>
          </div>
          <div className="p-12 text-center">
            <Lock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-sm">
              {currentStep === 3 ? 'Review your changes and apply them' : 'Complete previous steps to review changes.'}
            </p>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
