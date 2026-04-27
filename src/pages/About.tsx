import { Github, Mail } from 'lucide-react'

export default function About() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-slate-800">Hi, I'm Tom</h1>

      <p className="mt-5 text-slate-600 leading-relaxed">
        I'm a developer who builds web apps and tools. This portfolio collects the projects
        I've shipped — some practical, some experimental, all things I wanted to exist.
        Feel free to poke around, check the repos, and reach out if anything catches your eye.
      </p>

      <div className="mt-10 flex flex-col gap-4">
        <a
          href="https://github.com/timtomnow"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 text-slate-600 hover:text-accent-600 transition-colors"
        >
          <Github size={18} className="shrink-0" />
          <span>github.com/timtomnow</span>
        </a>
        <a
          href="mailto:timtomnow.github@gmail.com"
          className="inline-flex items-center gap-2.5 text-slate-600 hover:text-accent-600 transition-colors"
        >
          <Mail size={18} className="shrink-0" />
          <span>timtomnow.github@gmail.com</span>
        </a>
      </div>
    </div>
  )
}
