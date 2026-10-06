import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';

interface WhatsAppTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type: 'success' | 'error') => void;
}

export const DEFAULT_WHATSAPP_TEMPLATE = `🎉 أهلاً بحضرتك يا عريسنا الغالي / أ/ [اسم_العريس]

يسعدنا ويشرفنا اختياركم لـ (قاعات نادي اجوان) لنحتفل معاً بأجمل ليلة في العمر! 💍✨

📋 نؤكد لحضرتك تفاصيل الحجز:
🏛️ القاعة: [القاعة]
📅 تاريخ المناسبة: [التاريخ]
💵 سعر القاعة الأساسي: [سعر_القاعة_الأساسي]
✨ الخدمات الإضافية: [الخدمات_الإضافية]
💰 إجمالي المبلغ: [المبلغ_الكلي]
💸 إجمالي المدفوع: [إجمالي_المدفوع]
💳 المبلغ المتبقي: [المتبقي]

[سجل_الدفعات]

[مشتملات_القاعة]

[الملاحظات]

نتمنى لكم حفل زفاف أسطوري ومليء بالفرح والبهجة! ✨
لأية استفسارات نحن في خدمتكم دائماً. 🤍`;

export const WhatsAppTemplateModal: React.FC<WhatsAppTemplateModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [template, setTemplate] = useState(DEFAULT_WHATSAPP_TEMPLATE);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTemplate();
    }
  }, [isOpen]);

  const loadTemplate = async () => {
    setIsLoading(true);
    const settings = await dbService.fetchSettings();
    if (settings['whatsapp_template']) {
      setTemplate(settings['whatsapp_template']);
    } else {
      setTemplate(DEFAULT_WHATSAPP_TEMPLATE);
    }
    setIsLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await dbService.saveSetting('whatsapp_template', template);
    onShowToast('تم حفظ قالب رسالة الواتس آب بنجاح', 'success');
    setIsLoading(false);
    onClose();
  };

  const insertVariable = (variable: string) => {
    setTemplate((prev) => prev + ` [${variable}] `);
  };

  if (!isOpen) return null;

  const variables = [
    'اسم_العريس',
    'القاعة',
    'التاريخ',
    'سعر_القاعة_الأساسي',
    'الخدمات_الإضافية',
    'المبلغ_الكلي',
    'إجمالي_المدفوع',
    'المتبقي',
    'سجل_الدفعات',
    'مشتملات_القاعة',
    'تفاصيل_الإضافات',
    'قيمة_الخصم',
    'الملاحظات',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl p-4 sm:p-6 relative flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <h3 className="text-base sm:text-lg font-bold text-amber-400 flex items-center gap-2">
            <i className="fa-brands fa-whatsapp"></i>
            <span>تعديل قالب رسالة الواتس آب</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition flex items-center justify-center cursor-pointer"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1 pl-1">
          <div className="text-slate-300 text-sm mb-2">
            يمكنك استخدام المتغيرات التالية بالضغط عليها لإضافتها في المكان المناسب:
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {variables.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => insertVariable(v)}
                className="bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer"
              >
                [{v}]
              </button>
            ))}
          </div>

          <form id="wa-template-form" onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-slate-400 font-semibold mb-2 text-sm">نص الرسالة</label>
              <textarea
                rows={12}
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-3 focus:border-emerald-500 focus:outline-none transition resize-none font-medium leading-relaxed"
                dir="auto"
              ></textarea>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setTemplate(DEFAULT_WHATSAPP_TEMPLATE)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition cursor-pointer"
          >
            استعادة الافتراضي
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition cursor-pointer"
          >
            إلغاء
          </button>
          <button
            form="wa-template-form"
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-md transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            <i className="fa-solid fa-floppy-disk"></i>
            <span>حفظ القالب</span>
          </button>
        </div>
      </div>
    </div>
  );
};
