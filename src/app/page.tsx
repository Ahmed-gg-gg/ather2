import Link from "next/link";

const features = [
  { icon: "📚", title: "تعلم منظم", text: "المادة ← الكورس ← الدرس ← الاختبار في مسار واضح." },
  { icon: "📝", title: "اختبارات متقدمة", text: "اختيارات، صح وخطأ، إكمال، ترتيب، توصيل، صور وصوت." },
  { icon: "📊", title: "تحليل حقيقي", text: "نتائج ونِسب وتحليل للأسئلة ومواطن القوة والتحسين." },
  { icon: "🏆", title: "تعلّم ممتع", text: "نقاط، مستويات، شارات، وStreak لتحفيز الاستمرار." },
  { icon: "🤖", title: "مساعد أثر", text: "مساعدة للطالب بالتلميحات، وأدوات ذكية للمعلم." },
  { icon: "🔔", title: "متابعة مستمرة", text: "إشعارات ونشاط يساعدانك تعرف ما الذي يحتاج انتباهك." },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-paper overflow-hidden" dir="rtl">
      <header className="sticky top-0 z-20 border-b border-line/80 bg-paper/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label="أثر - الصفحة الرئيسية">
            <span className="w-9 h-9 rounded-xl bg-green text-white grid place-items-center text-lg shadow-sm">أ</span>
            <span className="font-display text-xl font-bold text-ink">أثر</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-ink-soft" aria-label="التنقل الرئيسي">
            <a href="#features" className="hover:text-green-text transition-colors">المميزات</a>
            <a href="#roles" className="hover:text-green-text transition-colors">لمن أثر؟</a>
            <a href="#about" className="hover:text-green-text transition-colors">عن المنصة</a>
          </nav>
          <Link href="/login" className="bg-green text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity">
            دخول المنصة
          </Link>
        </div>
      </header>

      <section className="relative">
        <div className="absolute -top-28 -right-28 w-72 h-72 rounded-full bg-green-light blur-3xl opacity-70" />
        <div className="absolute top-40 -left-28 w-72 h-72 rounded-full bg-gold-light blur-3xl opacity-70" />
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-14 sm:pt-20 pb-16 sm:pb-24 grid lg:grid-cols-[1.05fr_.95fr] gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-green-light text-green-text rounded-full px-3.5 py-2 text-xs font-medium mb-5">
              <span>✨</span> منصة تعليمية تصنع أثرًا حقيقيًا
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.2] tracking-tight text-ink max-w-2xl">
              كل تعلّم له <span className="text-green-text">أثر.</span>
              <br />
              ونحن نبنيه معك.
            </h1>
            <p className="text-ink-soft text-base sm:text-lg leading-8 mt-5 max-w-xl">
              أثر تجمع الدروس والكورسات والاختبارات والنتائج والتحفيز في تجربة واحدة بسيطة، واضحة، ومناسبة للطالب والمعلم.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-green text-white font-medium px-6 py-3.5 rounded-xl shadow-sm hover:-translate-y-0.5 transition-transform">
                ابدأ من المنصة <span aria-hidden="true">←</span>
              </Link>
              <a href="#features" className="inline-flex items-center justify-center bg-surface border border-line text-ink font-medium px-6 py-3.5 rounded-xl hover:border-green transition-colors">
                اكتشف المميزات
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-7 text-xs text-ink-faint">
              <span>✓ تجربة عربية وRTL</span>
              <span>✓ متوافق مع الهاتف</span>
              <span>✓ صلاحيات حسب الدور</span>
            </div>
          </div>

          <div className="relative lg:pr-8">
            <div className="bg-surface border border-line rounded-[28px] p-4 sm:p-5 shadow-[0_24px_70px_rgba(22,33,58,0.10)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-ink-faint">لوحة الطالب</p>
                  <p className="font-display font-bold text-lg text-ink mt-1">أهلًا بك في أثر 👋</p>
                </div>
                <span className="bg-green-light text-green-text rounded-full px-3 py-1 text-xs font-bold">المستوى 4</span>
              </div>
              <div className="grid grid-cols-3 gap-2.5 mb-3">
                <div className="bg-paper rounded-2xl p-3"><span className="text-lg">⭐</span><p className="text-xs text-ink-faint mt-2">النقاط</p><p className="font-bold text-ink">420</p></div>
                <div className="bg-paper rounded-2xl p-3"><span className="text-lg">🔥</span><p className="text-xs text-ink-faint mt-2">Streak</p><p className="font-bold text-ink">7 أيام</p></div>
                <div className="bg-paper rounded-2xl p-3"><span className="text-lg">🏅</span><p className="text-xs text-ink-faint mt-2">الشارات</p><p className="font-bold text-ink">12</p></div>
              </div>
              <div className="border border-line rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3"><span className="font-medium text-sm">تقدم الأسبوع</span><span className="text-xs text-green-text font-bold">78%</span></div>
                <div className="h-2 bg-paper rounded-full overflow-hidden"><div className="h-full w-[78%] bg-green rounded-full" /></div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="bg-green-light rounded-xl p-3"><p className="text-xs text-green-text">اختبارات مكتملة</p><p className="font-bold text-xl text-ink mt-1">8</p></div>
                  <div className="bg-gold-light rounded-xl p-3"><p className="text-xs text-gold-text">نقاط هذا الأسبوع</p><p className="font-bold text-xl text-ink mt-1">145</p></div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-2 sm:-left-6 bg-surface border border-line rounded-2xl px-4 py-3 shadow-lg flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-gold-light grid place-items-center text-xl">🏆</span>
              <div><p className="text-xs text-ink-faint">إنجاز جديد</p><p className="text-sm font-bold text-ink">أحسنت! أكملت اختبارًا 🎉</p></div>
            </div>
          </div>
        </div>
      </section>

      <section id="roles" className="bg-surface border-y border-line">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <p className="text-xs font-bold text-green-text mb-2">تجربة مختلفة لكل مستخدم</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink">أثر يتكيّف مع دورك</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-line rounded-2xl p-6 bg-paper">
              <div className="w-12 h-12 rounded-2xl bg-green-light grid place-items-center text-2xl mb-4">🎓</div>
              <h3 className="font-display text-xl font-bold text-ink">للطالب</h3>
              <p className="text-sm text-ink-soft leading-7 mt-2">تعلم، اختبر نفسك، تابع تقدمك، اجمع النقاط والشارات، واستعن بالمساعد الذكي عندما تحتاج إلى تلميح.</p>
            </div>
            <div className="border border-line rounded-2xl p-6 bg-paper">
              <div className="w-12 h-12 rounded-2xl bg-gold-light grid place-items-center text-2xl mb-4">👨‍🏫</div>
              <h3 className="font-display text-xl font-bold text-ink">للمعلم</h3>
              <p className="text-sm text-ink-soft leading-7 mt-2">أنشئ الدروس والاختبارات، تابع الفصول، حلل الأخطاء، واستفد من أدوات الذكاء الاصطناعي في التحضير والمتابعة.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-bold text-green-text mb-2">كل ما تحتاجه في مكان واحد</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink">UX واضحة بدل الزحمة.</h2>
          <p className="text-ink-soft mt-3 leading-7">صممنا التجربة بحيث تعرف أين تذهب، ماذا تفعل، وما الذي تحسن فيه — من أول ضغطة حتى النتيجة.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => (
            <article key={feature.title} className="bg-surface border border-line rounded-2xl p-5 hover:-translate-y-1 hover:shadow-md transition-all">
              <div className="w-11 h-11 rounded-xl bg-paper grid place-items-center text-xl mb-4">{feature.icon}</div>
              <h3 className="font-display font-bold text-lg text-ink">{feature.title}</h3>
              <p className="text-sm text-ink-soft leading-7 mt-2">{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="about" className="px-5 sm:px-8 pb-14">
        <div className="max-w-6xl mx-auto rounded-[28px] bg-green text-white p-7 sm:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-7">
          <div>
            <p className="text-white/70 text-xs font-bold mb-2">جاهز تبدأ؟</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold">خلّي كل درس يترك أثرًا.</h2>
            <p className="text-white/75 text-sm leading-7 mt-2 max-w-xl">سجّل الدخول بالحساب الذي أنشأه لك الأدمن وابدأ مباشرة من لوحة التحكم المناسبة لدورك.</p>
          </div>
          <Link href="/login" className="shrink-0 bg-white text-green-text font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity">دخول المنصة ←</Link>
        </div>
      </section>

      <footer className="border-t border-line bg-surface">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-faint">
          <span>© {new Date().getFullYear()} أثر — حيث يبقى للتعليم أثر حقيقي</span>
          <span>تعلم • طبّق • تقدّم</span>
        </div>
      </footer>
    </main>
  );
}
