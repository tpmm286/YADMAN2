import React from 'react';
import { motion } from 'motion/react';
import { GraduationCap, BookOpen, Clock, Sparkles, CheckCircle2, Layout, Zap, ShieldCheck } from 'lucide-react';

interface OnboardingScreenProps {
  onComplete: (choice: 'automated' | 'manual') => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-white overflow-y-auto">
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto" dir="rtl">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-20 h-20 bg-indigo-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-200">
            <Sparkles className="w-10 h-10" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight">به «یادمان» خوش آمدید</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            دستیار هوشمند شما برای یادگیری پایدار و مدیریت زمان تحصیلی. ما اینجا هستیم تا دغدغه‌های شما را برای فراموشی مطالب و بی‌نظمی در مطالعه به حداقل برسانیم.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 w-full">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex gap-4"
          >
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 mb-1">منحنی ابینگهاوس</h3>
              <p className="text-sm text-slate-500 leading-relaxed">تکرار مطالب در فواصل زمانی دقیق (۹ساعت، ۱روز، ۲روز، ۷روز و ۳۰روز) برای انتقال به حافظه بلندمدت.</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex gap-4"
          >
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 mb-1">برنامه‌ریزی خودکار دانش‌آموزی</h3>
              <p className="text-sm text-slate-500 leading-relaxed">تنظیم هوشمند پارت‌های مطالعه بر اساس برنامه هفتگی مدرسه و زمان‌های آزاد شما.</p>
            </div>
          </motion.div>
        </div>

        {/* Selection Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full bg-indigo-50/50 rounded-[40px] p-8 border border-indigo-100"
        >
          <h2 className="text-xl font-bold text-slate-800 text-center mb-8">نحوه استفاده از برنامه را انتخاب کنید</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Option 1: Automated */}
            <button 
              onClick={() => onComplete('automated')}
              className="group relative bg-white p-6 rounded-3xl border-2 border-transparent hover:border-indigo-600 transition-all text-right shadow-sm hover:shadow-xl hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="px-3 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-full">پیشنهادی</div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">برنامه‌ریزی هوشمند و خودکار</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                حوصله تنظیم دستی ندارید؟ سیستم بر اساس دروس مدرسه و زمان‌های آزاد شما، بهترین زمان برای مطالعه و مرور را پیشنهاد می‌دهد.
              </p>
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                <span>انتخاب و ورود به برنامه</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </button>

            {/* Option 2: Manual */}
            <button 
              onClick={() => onComplete('manual')}
              className="group bg-white p-6 rounded-3xl border-2 border-transparent hover:border-slate-300 transition-all text-right shadow-sm hover:shadow-xl hover:-translate-y-1"
            >
              <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center mb-4">
                <Layout className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">استفاده دستی و آزاد</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                ترجیح می‌دهید خودتان زمان‌های مرور را مدیریت کنید؟ فقط مطالب را اضافه کنید و در زمان‌های مقرر نوتیفیکیشن مرور دریافت کنید.
              </p>
              <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
                <span>انتخاب و شروع ساده</span>
                <CheckCircle2 className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          </div>
        </motion.div>

        {/* Anxiety Reduction Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 flex items-center gap-3 text-emerald-600 bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100"
        >
          <ShieldCheck className="w-5 h-5 shrink-0" />
          <p className="text-xs font-medium leading-relaxed">هدف ما کاهش استرس شماست. با یادمان، هیچ مطلبی فراموش نمی‌شود و زمان شما بهینه‌تر مدیریت خواهد شد.</p>
        </motion.div>
      </div>
    </div>
  );
}
