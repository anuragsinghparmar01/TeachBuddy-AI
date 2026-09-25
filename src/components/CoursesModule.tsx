import React, { useState } from 'react';
import { 
  GraduationCap, 
  Award, 
  Phone, 
  MessageSquare, 
  CheckCircle2, 
  BookOpen, 
  Clock, 
  Star, 
  ArrowRight, 
  Download, 
  ShieldCheck, 
  Sparkles,
  ExternalLink,
  Layers,
  ChevronRight
} from 'lucide-react';
import type { UserProfile } from '../types';

interface CoursesModuleProps {
  user: UserProfile;
  darkMode: boolean;
  onStartQuizForTopic?: (topic: string) => void;
  onOpenVoiceCallWithTopic?: (topic: string) => void;
}

export const CoursesModule: React.FC<CoursesModuleProps> = ({
  user,
  darkMode,
  onStartQuizForTopic = (_t?: string) => {},
  onOpenVoiceCallWithTopic = (_t?: string) => {}
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>('math-mastery');
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [modalCourseTitle, setModalCourseTitle] = useState('');

  const courses = [
    {
      id: 'math-mastery',
      title: 'Mathematics & Vedic Speed Math Mastery',
      tag: 'Most Popular',
      tagColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      duration: '18 Hours',
      level: 'All Classes',
      rating: '4.9/5',
      desc: 'Master mental arithmetic, calculus fundamentals, algebraic factoring, and time-saving shortcuts.',
      modules: [
        { title: 'Vedic Multiplication & Mental Square Roots', duration: '3 hrs', done: true },
        { title: 'Algebraic Factoring & Quadratic Equations', duration: '4 hrs', done: true },
        { title: 'Trigonometry & Coordinate Geometry', duration: '5 hrs', done: false },
        { title: 'Calculus: Differentiation & Integration Rules', duration: '6 hrs', done: false },
      ]
    },
    {
      id: 'physics-accelerator',
      title: 'Conceptual Physics & Mechanics Accelerator',
      tag: 'STEM Focus',
      tagColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
      duration: '15 Hours',
      level: 'High School & College',
      rating: '4.8/5',
      desc: 'Build rock-solid intuition for Newton\'s laws, kinematics, work-energy, electrostatics, and optics.',
      modules: [
        { title: 'Kinematics & Projectile Motion with Vectors', duration: '3 hrs', done: true },
        { title: 'Newtonian Dynamics & Friction Coefficients', duration: '4 hrs', done: false },
        { title: 'Current Electricity & Circuit Kirchhoff Rules', duration: '4 hrs', done: false },
        { title: 'Wave Optics & Ray Reflection/Refraction', duration: '4 hrs', done: false },
      ]
    },
    {
      id: 'chemistry-booster',
      title: 'Organic Chemistry & Reaction Mechanisms',
      tag: 'Exam High Yield',
      tagColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      duration: '14 Hours',
      level: 'Class 10 - 12',
      rating: '4.9/5',
      desc: 'Never memorize blindly: understand electron flow, resonance, nomenclature, and functional group conversions.',
      modules: [
        { title: 'IUPAC Nomenclature & Structural Isomerism', duration: '3 hrs', done: true },
        { title: 'Electrophilic & Nucleophilic Substitution (SN1/SN2)', duration: '4 hrs', done: false },
        { title: 'Aldehydes, Ketones & Carboxylic Acid Conversions', duration: '4 hrs', done: false },
        { title: 'Periodic Trends & Chemical Bonding Hybrids', duration: '3 hrs', done: false },
      ]
    },
    {
      id: 'spoken-english',
      title: 'Spoken English & Communication Confidence',
      tag: 'Career Skill',
      tagColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      duration: '12 Hours',
      level: 'Beginner to Advanced',
      rating: '4.9/5',
      desc: 'Overcome hesitation, master tense usage, interview articulation, and native pronunciation with AI voice practice.',
      modules: [
        { title: 'Daily Conversational Sentences & Fluency Habits', duration: '3 hrs', done: true },
        { title: 'Mastering English Tenses without Confusion', duration: '3 hrs', done: false },
        { title: 'Public Speaking, Debates & Exam Viva Articulation', duration: '3 hrs', done: false },
        { title: 'Email Writing & Professional Vocabulary', duration: '3 hrs', done: false },
      ]
    },
    {
      id: 'coding-python',
      title: 'Python for Students & AI Fundamentals',
      tag: 'Tech Future',
      tagColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      duration: '20 Hours',
      level: 'Class 6 - College',
      rating: '5.0/5',
      desc: 'Learn practical coding from scratch: loops, functions, lists, automation scripts, and how AI models work.',
      modules: [
        { title: 'Python Syntax, Variables & Conditionals', duration: '4 hrs', done: true },
        { title: 'Data Structures: Lists, Tuples & Dictionaries', duration: '5 hrs', done: false },
        { title: 'Functions, Recursion & File Automation', duration: '5 hrs', done: false },
        { title: 'Building your First AI Prompt & Chatbot App', duration: '6 hrs', done: false },
      ]
    }
  ];

  const currentCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  const handleOpenCertificateClaim = (courseTitle: string) => {
    setModalCourseTitle(courseTitle);
    setIsCertificateModalOpen(true);
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Prominent Verification & Certification Banner */}
      <div className={`rounded-2xl p-4 sm:p-5 border transition-all ${
        darkMode 
          ? 'bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border-purple-800/80 text-white shadow-xl' 
          : 'bg-gradient-to-r from-indigo-50/90 via-purple-50/80 to-amber-50/80 border-indigo-200/90 text-slate-900 shadow-md shadow-indigo-100/50'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 shrink-0 mt-0.5">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black tracking-tight font-outfit">
                  TeachBuddy Certified Courses
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] border border-emerald-500/20">
                  Government-Standard Curriculum
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Official Certification can be obtained by contacting: <strong className="text-indigo-600 dark:text-indigo-400 font-bold font-mono text-sm underline decoration-indigo-400">9455109687</strong>. 
                Complete lessons, pass the verification test, and receive your digital credential.
              </p>
            </div>
          </div>

          {/* Direct Contact CTAs */}
          <div className="flex items-center gap-2 sm:self-center shrink-0">
            <a
              href="tel:9455109687"
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition cursor-pointer flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call: 9455109687</span>
            </a>
            <a
              href="https://wa.me/919455109687?text=Hello%20TeachBuddy%20AI%20Team,%20I%20want%20to%20apply%20for%20Course%20Certification"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition cursor-pointer flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Grid: Course List & Active Course Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Course Selection List */}
        <div className="space-y-2.5">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Available Course Tracks
          </h2>
          {courses.map((course) => {
            const isSelected = course.id === selectedCourseId;
            return (
              <button
                key={course.id}
                onClick={() => setSelectedCourseId(course.id)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? darkMode
                      ? 'bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-950/50'
                      : 'bg-white border-indigo-500 shadow-md shadow-indigo-100/60 ring-1 ring-indigo-500/20'
                    : darkMode
                    ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    : 'bg-white/80 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${course.tagColor}`}>
                    {course.tag}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{course.rating}</span>
                  </div>
                </div>
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white font-outfit mb-1">
                  {course.title}
                </h3>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {course.duration}
                  </span>
                  <span>•</span>
                  <span>{course.level}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: Active Course Curriculum & Certificate Action */}
        <div className="lg:col-span-2 space-y-4">
          <div className={`p-5 rounded-2xl border transition-all ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-xs'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${currentCourse.tagColor}`}>
                  {currentCourse.tag}
                </span>
                <h2 className="text-base sm:text-lg font-black font-outfit mt-1 text-slate-900 dark:text-white">
                  {currentCourse.title}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {currentCourse.desc}
                </p>
              </div>

              <button
                onClick={() => handleOpenCertificateClaim(currentCourse.title)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md shadow-amber-500/25 transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
              >
                <Award className="w-4 h-4" />
                <span>Claim Certificate</span>
              </button>
            </div>

            {/* Curriculum Modules */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Course Syllabus & Practical Modules
              </h3>
              {currentCourse.modules.map((mod, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                    darkMode ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      mod.done 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {mod.done ? '✓' : idx + 1}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {mod.title}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {mod.duration}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenVoiceCallWithTopic(`${currentCourse.title}: ${mod.title}`)}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Teach Me</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Quick Practice Quiz CTA */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Ready to test your knowledge for this course?
              </div>
              <button
                onClick={() => onStartQuizForTopic(currentCourse.title)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Take Course Final Test</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Certificate Claim Modal */}
      {isCertificateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black font-outfit">
                Obtain Verified Certificate
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Course: <strong className="text-slate-800 dark:text-slate-200">{modalCourseTitle}</strong>
              </p>

              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-left space-y-2">
                <div className="text-xs font-bold text-amber-800 dark:text-amber-300">
                  Certification Process:
                </div>
                <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1 list-disc pl-4">
                  <li>Directly contact our academic team at <strong>9455109687</strong>.</li>
                  <li>Provide your registered student name and completed quiz score.</li>
                  <li>Receive an authenticated digital certificate with verification QR code.</li>
                </ul>
              </div>

              {/* Direct Buttons */}
              <div className="flex flex-col gap-2 pt-2">
                <a
                  href="tel:9455109687"
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call 9455109687 for Certificate</span>
                </a>
                <a
                  href={`https://wa.me/919455109687?text=Hello%20TeachBuddy%20AI%20Team,%20I%20have%20completed%20the%20course%20"${encodeURIComponent(modalCourseTitle)}"%20and%20want%20my%20official%20certificate.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp 9455109687</span>
                </a>
                <button
                  onClick={() => setIsCertificateModalOpen(false)}
                  className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-xs hover:bg-slate-200 transition cursor-pointer mt-1"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
