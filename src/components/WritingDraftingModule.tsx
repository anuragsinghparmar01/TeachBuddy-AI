import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Send, 
  Copy, 
  Check, 
  Printer, 
  Download, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Scale, 
  BookOpen, 
  ShieldCheck, 
  RefreshCw, 
  HelpCircle,
  Clock,
  Bookmark,
  ChevronRight,
  Sliders,
  AlignLeft,
  Briefcase,
  FileCheck2,
  Share2
} from 'lucide-react';
import type { UserProfile, IndianLanguageCode } from '../types';
import { aiService } from '../services/aiService';
import { audioService } from '../services/audioService';

interface WritingDraftingModuleProps {
  user: UserProfile;
  darkMode: boolean;
  onOpenVoiceCallWithTopic?: (topic: string) => void;
}

type DocCategory = 'applications' | 'letters' | 'emails' | 'notices' | 'legal' | 'speeches';

interface DocPreset {
  id: string;
  category: DocCategory;
  name: string;
  defaultTitle: string;
  defaultRecipient: string;
  defaultPurpose: string;
  defaultDetails: string;
  tone: 'Professional & Formal' | 'Strictly Legal & Statutory' | 'Courteous & Polite' | 'Persuasive & Impactful';
  tips: string;
}

const PRESET_TEMPLATES: DocPreset[] = [
  // Applications
  {
    id: 'leave_app',
    category: 'applications',
    name: 'School / College Leave Application',
    defaultTitle: 'Application for Sick Leave / Family Function',
    defaultRecipient: 'The Principal / Dean, St. Xavier Academy',
    defaultPurpose: 'Grant leave of absence for 3 days due to high fever and medical treatment',
    defaultDetails: 'Dates: 25th to 27th Oct. Doctor prescription attached. Syllabus work will be completed from classmate.',
    tone: 'Courteous & Polite',
    tips: 'Ensure exact dates are clearly highlighted and reference any attached medical certificate.',
  },
  {
    id: 'job_app',
    category: 'applications',
    name: 'Job Application & Cover Letter',
    defaultTitle: 'Application for Junior Software Developer / Analyst',
    defaultRecipient: 'Hiring Manager, Innovate Tech Solutions Pvt Ltd',
    defaultPurpose: 'Apply for the advertised Junior Developer opening matching my React, Node.js & Problem-Solving skills',
    defaultDetails: 'Recent Computer Science graduate with 8.9 CGPA, 2 live internship projects, active GitHub repository.',
    tone: 'Professional & Formal',
    tips: 'Highlight 2-3 specific quantifiable achievements and align your skills with company requirements.',
  },
  {
    id: 'fee_concession',
    category: 'applications',
    name: 'Fee Concession / Scholarship Request',
    defaultTitle: 'Application for Full/Partial Tuition Fee Concession',
    defaultRecipient: 'The Registrar / Scholarship Committee, National Institute of Technology',
    defaultPurpose: 'Request financial assistance or fee concession under merit-cum-means criteria',
    defaultDetails: 'Maintained 9.2 CGPA in previous semesters, family agricultural income under ₹2.5 Lakh per annum, income certificate enclosed.',
    tone: 'Courteous & Polite',
    tips: 'Mention your academic consistency and provide verifiable income certificates.',
  },

  // Letters
  {
    id: 'formal_bank',
    category: 'letters',
    name: 'Letter to Bank Manager',
    defaultTitle: 'Request for Transfer of Savings Account & Issue of New Cheque Book',
    defaultRecipient: 'The Branch Manager, State Bank of India, Hazratganj Branch',
    defaultPurpose: 'Transfer Savings Account No. 3400291823 from Lucknow to New Delhi branch due to job relocation',
    defaultDetails: 'Account Number: 3400291823. Current address proof (Aadhaar & Rent Agreement) enclosed. Requesting debit card reissue.',
    tone: 'Professional & Formal',
    tips: 'Always mention account number, registered phone number, and list enclosed KYC documents.',
  },
  {
    id: 'letter_editor',
    category: 'letters',
    name: 'Letter to the Editor (Newspaper)',
    defaultTitle: 'Urgent Attention Needed on Deteriorating Road Infrastructure & Streetlights',
    defaultRecipient: 'The Editor, The Times of India / Hindustan Times',
    defaultPurpose: 'Draw municipal authorities attention to open potholes and non-functional streetlights in Sector 14',
    defaultDetails: 'Frequent minor accidents occurring daily, repeated complaints to municipal ward went unanswered.',
    tone: 'Persuasive & Impactful',
    tips: 'Focus on public welfare, provide specific locations, and end with a constructive call to civic action.',
  },
  {
    id: 'resignation_letter',
    category: 'letters',
    name: 'Formal Resignation Letter',
    defaultTitle: 'Letter of Resignation from Position of Senior Marketing Executive',
    defaultRecipient: 'Head of Human Resources & Department Lead, Apex Enterprises',
    defaultPurpose: 'Tender resignation with formal 30-day notice period to pursue higher academic studies',
    defaultDetails: 'Last working day: 15th November. Committed to full knowledge transfer and training replacement.',
    tone: 'Professional & Formal',
    tips: 'Keep it appreciative, specify your exact last working day, and express willingness for smooth handover.',
  },

  // Emails
  {
    id: 'internship_cold',
    category: 'emails',
    name: 'Cold Outreach for Research / Internship',
    defaultTitle: 'Application for Summer Research Internship in Applied AI & Machine Learning',
    defaultRecipient: 'Prof. Dr. A. Sharma, Head of AI Lab, IIT Delhi',
    defaultPurpose: 'Inquire about research intern openings under your ongoing automated reasoning project',
    defaultDetails: 'Read your recent IEEE paper on neural models. Built open-source project in Python with 200+ stars.',
    tone: 'Professional & Formal',
    tips: 'Reference a specific paper or project of the recipient in the very first 2 sentences.',
  },
  {
    id: 'client_proposal',
    category: 'emails',
    name: 'Professional Business Proposal Email',
    defaultTitle: 'Proposal: Web Architecture Redesign & Automated Educational Suite',
    defaultRecipient: 'Director of Operations, Horizon Education Systems',
    defaultPurpose: 'Submit customized scope of work, timeline, and commercial quotation following our discovery call',
    defaultDetails: 'Deliverables: Responsive web app, AI tutor integration, 4-week delivery, milestone-based payment structure.',
    tone: 'Professional & Formal',
    tips: 'Include clear deliverables, timelines, and next steps for contract execution.',
  },

  // Notices
  {
    id: 'society_notice',
    category: 'notices',
    name: 'Resident Welfare Society (RWA) Notice',
    defaultTitle: 'Notice: Scheduled Water Supply Interruption & Overhead Tank Cleaning',
    defaultRecipient: 'All Residents of Palm Grove Heights, Towers A, B, & C',
    defaultPurpose: 'Inform residents of 6-hour water supply maintenance and request water storage beforehand',
    defaultDetails: 'Date: Saturday, 28th October, 10:00 AM to 4:00 PM. Drinking water tankers will be stationed at Gate 2.',
    tone: 'Professional & Formal',
    tips: 'State date, time, affected areas, and contingency contact numbers boldly.',
  },
  {
    id: 'college_notice',
    category: 'notices',
    name: 'College / School Event & Exam Notice',
    defaultTitle: 'Notice: Mid-Term Practical Examinations Schedule & Submission Deadline',
    defaultRecipient: 'All 3rd Year B.Tech Students (All Departments)',
    defaultPurpose: 'Notify compulsory submission of laboratory record notebooks and attendance criteria for practical viva',
    defaultDetails: 'Submissions accepted until 3:00 PM on 30th October in Lab 4. Hall tickets required.',
    tone: 'Professional & Formal',
    tips: 'Use bold uppercase title, reference number, issued date, and official issuing authority signature.',
  },

  // Legal & Certified Documents
  {
    id: 'legal_notice_dues',
    category: 'legal',
    name: 'Legal Demand Notice for Recovery of Dues',
    defaultTitle: 'Legal Notice under Section 138 of Negotiable Instruments Act / Recovery of Unpaid Invoice',
    defaultRecipient: 'M/s Global Trading Corp, Represented by Managing Director',
    defaultPurpose: 'Demand immediate payment of unpaid balance amount of ₹3,45,000/- with 18% interest within 15 days',
    defaultDetails: 'Invoice No. GT-409 dated 12th July. Cheque No. 492019 drawn on HDFC Bank returned dishonored for "Funds Insufficient".',
    tone: 'Strictly Legal & Statutory',
    tips: 'Statutory notices must give 15 days cure period and warn of criminal/civil litigation under applicable laws.',
  },
  {
    id: 'trust_deed',
    category: 'legal',
    name: 'Charitable Trust Deed Drafting',
    defaultTitle: 'Indenture of Public Charitable & Educational Trust',
    defaultRecipient: 'To All to Whom These Presents Shall Come',
    defaultPurpose: 'Establish a Non-Profit Public Charitable Trust for Education, Healthcare, and Skill Development for Underprivileged Youths',
    defaultDetails: 'Settlor: Anurag Singh. Initial Trust Fund: ₹1,00,000/-. Board of 3 Trustees. Perpetual succession, registered office in Lucknow.',
    tone: 'Strictly Legal & Statutory',
    tips: 'Requires Settlor, minimum two Trustees, clearly defined charitable objects, initial corpus fund, and power to acquire property.',
  },
  {
    id: 'rent_agreement',
    category: 'legal',
    name: 'Residential Rent Agreement',
    defaultTitle: 'Residential Tenancy Agreement for 11 Months',
    defaultRecipient: 'Between Landlord (Lessor) and Tenant (Lessee)',
    defaultPurpose: 'Lease 2-BHK Residential Flat No. 402, Green Valley Apartments for 11 months with mutual terms',
    defaultDetails: 'Monthly rent ₹22,000/-, Security deposit ₹44,000/-, 10% annual escalation, 1-month notice period for vacation.',
    tone: 'Strictly Legal & Statutory',
    tips: '11-month residential agreements do not require mandatory registration in most states, but stamp duty must be paid.',
  },
  {
    id: 'affidavit',
    category: 'legal',
    name: 'General Affidavit / Gap Year Declaration',
    defaultTitle: 'Affidavit for Educational Gap Year / Name Discrepancy',
    defaultRecipient: 'Before the Notary Public / Competent Admission Authority',
    defaultPurpose: 'Declare that student did not engage in any unlawful activity during 1-year study break while preparing for competitive exams',
    defaultDetails: 'Deponent: Rahul Verma, S/o R.K. Verma, Age 19 years. Gap period: 2024 to 2025 for JEE Preparation. Truth verification affirmed.',
    tone: 'Strictly Legal & Statutory',
    tips: 'Must include verification on oath and signature of Notary Public with registered stamp.',
  },

  // Speeches
  {
    id: 'welcome_speech',
    category: 'speeches',
    name: 'Welcome Address / Keynote Speech',
    defaultTitle: 'Welcome Address for Annual Science & Technology Symposium',
    defaultRecipient: 'Honorable Chief Guest, Dignitaries on Dais, Faculty, and Students',
    defaultPurpose: 'Deliver an inspiring 4-minute opening speech welcoming dignitaries and introducing theme of Innovation & AI in Education',
    defaultDetails: 'Theme: "Empowering Minds Through Accessible Technology". 500+ participants from 24 schools.',
    tone: 'Persuasive & Impactful',
    tips: 'Acknowledge chief guests by name, state the symposium theme with emotion, and end with high energy.',
  },
];

export const WritingDraftingModule: React.FC<WritingDraftingModuleProps> = ({
  user,
  darkMode,
  onOpenVoiceCallWithTopic,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<DocCategory>('applications');
  const [activePreset, setActivePreset] = useState<DocPreset>(PRESET_TEMPLATES[0]);

  // Form Inputs
  const [docTitle, setDocTitle] = useState(PRESET_TEMPLATES[0].defaultTitle);
  const [senderName, setSenderName] = useState(user.name || 'Anurag Singh');
  const [recipientName, setRecipientName] = useState(PRESET_TEMPLATES[0].defaultRecipient);
  const [purpose, setPurpose] = useState(PRESET_TEMPLATES[0].defaultPurpose);
  const [keyDetails, setKeyDetails] = useState(PRESET_TEMPLATES[0].defaultDetails);
  const [docTone, setDocTone] = useState(PRESET_TEMPLATES[0].tone);
  const [language, setLanguage] = useState<IndianLanguageCode>(user.preferredLanguage || 'en-US');

  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState<string>('');
  const [subjectLine, setSubjectLine] = useState<string>('');
  const [keyClauses, setKeyClauses] = useState<string[]>([]);
  const [legalTips, setLegalTips] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeView, setActiveView] = useState<'editor' | 'preview'>('editor');

  // Sync when preset is selected
  const handleSelectPreset = (preset: DocPreset) => {
    setActivePreset(preset);
    setDocTitle(preset.defaultTitle);
    setRecipientName(preset.defaultRecipient);
    setPurpose(preset.defaultPurpose);
    setKeyDetails(preset.defaultDetails);
    setDocTone(preset.tone);
    audioService.playSound('click');
  };

  // Switch category
  const handleCategoryChange = (cat: DocCategory) => {
    setSelectedCategory(cat);
    const firstInCat = PRESET_TEMPLATES.find((p) => p.category === cat);
    if (firstInCat) {
      handleSelectPreset(firstInCat);
    }
  };

  // Trigger AI Generation
  const handleGenerateDocument = async () => {
    if (!purpose.trim()) return;

    setIsGenerating(true);
    audioService.playSound('whoosh');

    try {
      const res = await aiService.generateDocumentDraft({
        category: selectedCategory,
        docType: activePreset.name,
        title: docTitle,
        sender: senderName,
        recipient: recipientName,
        purpose: purpose,
        keyDetails: keyDetails,
        tone: docTone,
        languageCode: language,
      });

      setGeneratedDoc(res.formattedContent);
      setSubjectLine(res.subjectLine);
      setKeyClauses(res.keyClauses || []);
      setLegalTips(res.legalOrOfficialTips || []);
      setActiveView('preview');
      audioService.playSound('success');
    } catch (err) {
      console.error('Drafting generation error:', err);
      // Helpful fallback draft
      setGeneratedDoc(`DATE: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}\n\nTO:\n${recipientName}\n\nFROM:\n${senderName}\n\nSUBJECT: ${docTitle}\n\nRespected Sir / Madam,\n\nI am writing to formally place on record ${purpose}. \n\nIn furtherance of the above, please note the pertinent details:\n${keyDetails}\n\nI kindly request your favorable consideration and expedited formal action in this regard. Should any further clarification or documentation be required, I shall be pleased to furnish the same without delay.\n\nThanking You,\n\nYours faithfully,\n\n_________________________\n${senderName}\nContact / Verified Signatory`);
      setActiveView('preview');
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy to clipboard
  const handleCopy = () => {
    if (!generatedDoc) return;
    navigator.clipboard.writeText(generatedDoc);
    setCopied(true);
    audioService.playSound('pop');
    setTimeout(() => setCopied(false), 2000);
  };

  // Print Document
  const handlePrint = () => {
    window.print();
  };

  // Download as text document
  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([generatedDoc], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${activePreset.id}_${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    audioService.playSound('pop');
  };

  // Voice playback
  const handleToggleVoicePlayback = () => {
    if (isSpeaking) {
      audioService.stopSpeaking();
      setIsSpeaking(false);
    } else {
      if (!generatedDoc) return;
      setIsSpeaking(true);
      audioService.speak(
        generatedDoc.slice(0, 1000),
        user.selectedVoice || 'female',
        1.0,
        1.0,
        language,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false)
      );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto">
      {/* Header Banner with Creative Gradients */}
      <div className={`p-6 sm:p-8 rounded-3xl transition-all duration-300 relative overflow-hidden border ${
        darkMode 
          ? 'bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 border-indigo-500/20 text-white shadow-2xl' 
          : 'bg-gradient-to-br from-white via-indigo-50/40 to-sky-50/50 border-indigo-100/80 text-slate-900 shadow-xl shadow-indigo-100/30'
      }`}>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-gradient-to-r from-indigo-500/15 to-violet-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 mb-2">
              <Scale className="w-3.5 h-3.5" />
              Official, Legal & Academic Drafting Suite
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Application & Legal Document Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
              Draft publication-grade formal applications, statutory legal notices, registered trust deeds, residential leases, society notices, and executive emails in seconds.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenVoiceCallWithTopic && (
              <button
                onClick={() => onOpenVoiceCallWithTopic(activePreset.name)}
                className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                <span>Ask AI Lawyer / Mentor</span>
              </button>
            )}
          </div>
        </div>

        {/* Ambient Decorative Blurs */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {[
          { id: 'applications', label: 'Applications', icon: FileText, desc: 'School, Job, Leave' },
          { id: 'letters', label: 'Formal Letters', icon: AlignLeft, desc: 'Bank, Municipal, Editor' },
          { id: 'emails', label: 'Official Emails', icon: Send, desc: 'Outreach, Proposals' },
          { id: 'notices', label: 'Notices & Circulars', icon: Briefcase, desc: 'Society, College, Public' },
          { id: 'legal', label: 'Legal & Certified Deeds', icon: Scale, desc: 'Trust Deed, Legal Notice, Rent' },
          { id: 'speeches', label: 'Speeches & Scripts', icon: Volume2, desc: 'Welcome, Debate, Keynote' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleCategoryChange(tab.id as DocCategory)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl font-bold text-xs whitespace-nowrap transition-all duration-200 border cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-500 shadow-md shadow-indigo-600/25 scale-[1.02]'
                  : darkMode
                  ? 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-800'
                  : 'bg-white/90 hover:bg-slate-50 text-slate-700 border-slate-200/80 shadow-xs'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-indigo-500'}`} />
              <div className="text-left">
                <div>{tab.label}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Template Selector Chips for Current Category */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
          Templates:
        </span>
        {PRESET_TEMPLATES.filter((p) => p.category === selectedCategory).map((preset) => (
          <button
            key={preset.id}
            onClick={() => handleSelectPreset(preset)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer border whitespace-nowrap ${
              activePreset.id === preset.id
                ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500/60 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs'
                : 'bg-white/60 dark:bg-slate-900/60 border-slate-200/70 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Main Grid: Left Form, Right Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Generator Form (5 Cols) */}
        <div className={`lg:col-span-5 p-5 sm:p-6 rounded-3xl border transition-all duration-300 space-y-4 ${
          darkMode 
            ? 'bg-slate-900/90 border-slate-800 shadow-xl' 
            : 'bg-white/95 border-slate-200/80 shadow-lg shadow-indigo-100/20'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-extrabold text-base flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Document Parameters
            </h2>
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
              {activePreset.name}
            </span>
          </div>

          {/* Document Working Title / Subject */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Document Subject / Title
            </label>
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="e.g. Leave Application for 3 Days"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                darkMode 
                  ? 'bg-slate-950/80 border-slate-700 text-white placeholder:text-slate-600' 
                  : 'bg-slate-50/90 border-slate-200 text-slate-900 placeholder:text-slate-400'
              }`}
            />
          </div>

          {/* Two Cols: Sender & Recipient */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                From (Sender / Drafter)
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Your Name / Designation"
                className={`w-full px-3 py-2 rounded-xl border text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  darkMode 
                    ? 'bg-slate-950/80 border-slate-700 text-white' 
                    : 'bg-slate-50/90 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                To (Recipient / Authority)
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="The Principal / Branch Manager"
                className={`w-full px-3 py-2 rounded-xl border text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  darkMode 
                    ? 'bg-slate-950/80 border-slate-700 text-white' 
                    : 'bg-slate-50/90 border-slate-200 text-slate-900'
                }`}
              />
            </div>
          </div>

          {/* Primary Purpose */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Primary Purpose / Core Ground
            </label>
            <textarea
              rows={2}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="What is the core reason or request?"
              className={`w-full px-3.5 py-2 rounded-xl border text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${
                darkMode 
                  ? 'bg-slate-950/80 border-slate-700 text-white' 
                  : 'bg-slate-50/90 border-slate-200 text-slate-900'
              }`}
            />
          </div>

          {/* Specific Facts, Dates, Amounts, Clauses */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Key Details, Dates, Amounts, or Enclosures
            </label>
            <textarea
              rows={3}
              value={keyDetails}
              onChange={(e) => setKeyDetails(e.target.value)}
              placeholder="Dates, account numbers, amounts, certificates attached..."
              className={`w-full px-3.5 py-2 rounded-xl border text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${
                darkMode 
                  ? 'bg-slate-950/80 border-slate-700 text-white' 
                  : 'bg-slate-50/90 border-slate-200 text-slate-900'
              }`}
            />
          </div>

          {/* Tone & Language Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                Tone & Style
              </label>
              <select
                value={docTone}
                onChange={(e) => setDocTone(e.target.value as any)}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <option value="Professional & Formal">Professional & Formal</option>
                <option value="Strictly Legal & Statutory">Strictly Legal & Statutory</option>
                <option value="Courteous & Polite">Courteous & Polite</option>
                <option value="Persuasive & Impactful">Persuasive & Impactful</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <option value="en-US">English (Standard)</option>
                <option value="hi-IN">Hindi (हिन्दी)</option>
                <option value="hi-mix">Hinglish (Hindi + English)</option>
              </select>
            </div>
          </div>

          {/* Legal / Expert Tip Callout */}
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Drafting Note: </span>
              <span>{activePreset.tips}</span>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateDocument}
            disabled={isGenerating || !purpose.trim()}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Crafting Publication Draft...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Official Document</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Live Document Letterhead View (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className={`rounded-3xl border transition-all duration-300 overflow-hidden ${
            darkMode 
              ? 'bg-slate-900/90 border-slate-800 shadow-2xl' 
              : 'bg-white border-slate-200/80 shadow-xl shadow-indigo-100/20'
          }`}>
            {/* Document Action Toolbar */}
            <div className={`p-4 border-b flex flex-wrap items-center justify-between gap-3 ${
              darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/80 border-slate-200/80'
            }`}>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-extrabold text-xs text-slate-700 dark:text-slate-300">
                  {generatedDoc ? 'Official Document Ready' : 'Document Preview Canvas'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleToggleVoicePlayback}
                  disabled={!generatedDoc}
                  title={isSpeaking ? 'Stop Reading' : 'Read Aloud'}
                  className={`p-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    isSpeaking 
                      ? 'bg-rose-500 text-white border-rose-500' 
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={handleCopy}
                  disabled={!generatedDoc}
                  title="Copy Document"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  onClick={handlePrint}
                  disabled={!generatedDoc}
                  title="Print / Save PDF"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>

                <button
                  onClick={handleDownload}
                  disabled={!generatedDoc}
                  title="Download .txt"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
              </div>
            </div>

            {/* Document Content Canvas with Paper Styling */}
            <div className="p-6 sm:p-10 min-h-[480px]">
              {generatedDoc ? (
                <div className="space-y-4">
                  {/* Subject Line Pill if Available */}
                  {subjectLine && (
                    <div className="p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-indigo-950 dark:text-indigo-200 font-bold text-xs sm:text-sm">
                      <span className="text-indigo-600 dark:text-indigo-400 font-extrabold mr-1.5">RE:</span>
                      {subjectLine}
                    </div>
                  )}

                  {/* Formatted Text Paper */}
                  <div className={`p-6 sm:p-8 rounded-2xl border font-sans text-xs sm:text-sm leading-relaxed whitespace-pre-wrap select-text ${
                    darkMode 
                      ? 'bg-slate-950/90 border-slate-800 text-slate-100 shadow-inner' 
                      : 'bg-amber-50/15 border-slate-200 text-slate-900 shadow-sm'
                  }`}>
                    {generatedDoc}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                  <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-slate-700">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200">
                      Ready to Draft {activePreset.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
                      Customize parameters on the left or choose a template preset, then click "Generate Official Document" to produce formal legal text.
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateDocument}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition cursor-pointer"
                  >
                    Quick Generate Template
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Key Clauses & Legal Tips Summary */}
          {(keyClauses.length > 0 || legalTips.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {keyClauses.length > 0 && (
                <div className={`p-4 rounded-2xl border ${
                  darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 mb-2">
                    <FileCheck2 className="w-3.5 h-3.5" />
                    Essential Clauses Included
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    {keyClauses.map((c, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-indigo-500 font-bold">•</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {legalTips.length > 0 && (
                <div className={`p-4 rounded-2xl border ${
                  darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-2">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Statutory & Execution Tips
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    {legalTips.map((t, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
