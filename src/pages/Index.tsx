import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar, BookOpen, Users, Heart, Globe, ChevronRight } from 'lucide-react';
import cucuLogo from '@/assets/cucu-logo.png';

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="bg-hero-gradient text-primary-foreground">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={cucuLogo} alt="CUCU Logo" className="w-10 h-10 rounded-lg object-cover" />
            <span className="font-display font-bold text-lg">CUCU</span>
          </div>
          <Link to="/auth"><Button variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">Sign In</Button></Link>
        </nav>
        <div className="max-w-7xl mx-auto px-6 py-24 text-center">
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-6 leading-tight">Chuka University<br />Christian Union</h1>
          <p className="text-xl text-primary-foreground/70 max-w-2xl mx-auto mb-10">Digital Governance Platform — Faith, Leadership, Community</p>
          <div className="flex gap-4 justify-center">
            <Link to="/auth"><Button size="lg" className="bg-gold text-navy-deep hover:bg-gold-light font-semibold px-8">Get Started</Button></Link>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="font-display text-3xl font-bold text-center mb-12">Platform Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { icon: Calendar, title: 'Events', desc: 'Campus-wide event coordination and livestream management' },
            { icon: BookOpen, title: 'Programs', desc: 'CBR, Bible Study, Faith Foundation, BEST-P with progress tracking' },
            { icon: Users, title: 'Welfare', desc: 'Member welfare support requests and tracking' },
            { icon: Heart, title: 'Prayer', desc: 'Community prayer request board and intercession' },
            { icon: Globe, title: 'Missions', desc: 'Outreach planning, team coordination, and soul tracking' },
            { icon: ChevronRight, title: 'Governance', desc: 'Finance ledger, asset management, and role-based access' },
          ].map(f => (
            <div key={f.title} className="p-6 rounded-xl border border-border/50 hover:shadow-lg transition-shadow">
              <f.icon className="w-10 h-10 text-primary mb-4" />
              <h3 className="font-display text-xl font-semibold mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-muted-foreground text-sm">
        <p>© {new Date().getFullYear()} Chuka University Christian Union. All rights reserved.</p>
      </footer>
    </div>
  );
}
