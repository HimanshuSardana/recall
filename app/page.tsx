import type { Metadata } from "next";
import Link from "next/link";
import { AuthButton } from "@/components/auth-button";
import { LandingTheme } from "@/components/landing-theme";
import { Mark } from "@/components/mark";
import "./landing.css";

const REPO = "https://github.com/HimanshuSardana/minimi-agent";

export const metadata: Metadata = {
  title: "recall — a chat agent that remembers",
  description:
    "A chat agent with a dated memory. Ask once, come back next week, and it starts from what you asked before — searching again when a fact could have moved.",
};

export default function Landing() {
  return (
    <div className="landing">
      <header className="topbar">
        <Link className="brand" href="/">
          <Mark className="size-3.5 text-[var(--text)]" />
          recall
        </Link>
        <a className="nl hide-m" href="#memory">
          Memory
        </a>
        <a className="nl hide-m" href="#how">
          How it works
        </a>
        <a className="nl hide-m" href="#faq">
          FAQ
        </a>
        <a className="nl" href={REPO} target="_blank" rel="noreferrer">
          GitHub
        </a>
        <div className="top-actions">
          <AuthButton className="nl" signedOutLabel="Sign in" signedInLabel="Sign out" />
          <Link className="btn btn-quiet btn-sm" href="/chat">
            Open chat
          </Link>
          <LandingTheme />
        </div>
      </header>

      <main className="wrap">
        <h1 className="tagline-title rise rise-1">Ask once. It remembers.</h1>

        <p className="lede rise rise-2">
          recall is a chat agent with a dated memory. Ask something today, come back next week, and
          it starts from what you asked before — searching the web again when a fact could have
          moved, and showing the <a href="#memory">sources</a> behind every answer. No account: your
          chats and memories live behind a cookie you can clear from the{" "}
          <Link href="/chat">Memories screen</Link>.
        </p>

        <div className="btn-row rise rise-3">
          <Link className="btn btn-solid" href="/chat">
            Start chatting
          </Link>
          <a className="btn btn-ghost" href="#how">
            How it works
          </a>
        </div>

        <p className="sec-label" id="memory">
          Memory
        </p>
        <ul className="feat-list">
          <li>
            <b>Dated log</b> — every question and answer is filed with its timestamp, so “what did I
            ask on 3 November” is a lookup, not a guess
          </li>
          <li>
            <b>Recall tool</b> — the model searches that log itself, by keywords and by date range,
            across every chat you have
          </li>
          <li>
            <b>Last five asks</b> — today’s date and your recent questions ride in the system prompt,
            so most recall happens before any tool call
          </li>
          <li>
            <b>You can correct it</b> — the Memories screen lists what was stored, forget one entry
            or delete all of it
          </li>
        </ul>

        <p className="sec-label" id="how">
          How it works
        </p>
        <ol className="steps">
          <li>
            <b>The prompt</b> carries today’s date and your last five questions; the current chat
            rides along as normal history.
          </li>
          <li>
            <b>Two tools.</b> <code>recall</code> queries the dated log — dates are ranges, not
            similarity. <code>web_search</code> asks Tavily, falling back to a self-hosted SearXNG
            when Tavily is missing or empty.
          </li>
          <li>
            <b>Sources, then prose.</b> Search results reach the model with their URLs; the answer
            streams back and ends in the domains it actually read.
          </li>
        </ol>
        <div className="cmd-box">
          <span className="c"># run it</span>
          {"\n$ npm install\n$ npm run dev            "}
          <span className="c">→ http://localhost:3000</span>
          {"\n\n"}
          <span className="c"># keys (see .env.example)</span>
          {"\nOPENAI_API_KEY=…         "}
          <span className="c"># any OpenAI-compatible endpoint</span>
          {"\nTAVILY_API_KEY=…         "}
          <span className="c"># web search; SEARXNG_* is the fallback</span>
        </div>

        <p className="sec-label" id="faq">
          FAQ
        </p>
        <div className="qa">
          <p className="q">Does it remember across chats?</p>
          <p>
            Yes. Turns are stored against your owner id with timestamps, and the recall tool is
            allowed to read all of them — that is how “has anything changed since we spoke” works.
          </p>
        </div>
        <div className="qa">
          <p className="q">Where does that live?</p>
          <p>
            A SQLite file on the server, scoped to a year-long httpOnly cookie. No account, no
            email. Deleting memories removes the rows; signing in later would reassign them.
          </p>
        </div>
        <div className="qa">
          <p className="q">Which model?</p>
          <p>
            DeepSeek V4.1 Flash or Mimo V2.6 Flash, both over an OpenAI-compatible endpoint that you
            point at with <code>OPENAI_BASE_URL</code>.
          </p>
        </div>
        <div className="qa">
          <p className="q">What if search finds nothing?</p>
          <p>
            It says so. Unrelated pages are filtered before they reach the model, and an answer that
            could not be verified is labelled as such rather than filled in.
          </p>
        </div>

        <footer className="site">
          <div className="foot-cols">
            <div>
              <h5>Product</h5>
              <Link href="/chat">Chat</Link>
              <a href="#memory">Memory</a>
              <a href="#how">How it works</a>
              <a href="#faq">FAQ</a>
            </div>
            <div>
              <h5>Tools</h5>
              <a href="#how">recall</a>
              <a href="#how">web_search</a>
              <a href="#how">Sources</a>
            </div>
            <div>
              <h5>Project</h5>
              <a href={REPO} target="_blank" rel="noreferrer">
                GitHub
              </a>
              <a href={`${REPO}/issues`} target="_blank" rel="noreferrer">
                Issues
              </a>
            </div>
            <div>
              <h5>Author</h5>
              <a href="https://github.com/HimanshuSardana" target="_blank" rel="noreferrer">
                Himanshu
              </a>
              <a href="https://himanshu.co" target="_blank" rel="noreferrer">
                Portfolio
              </a>
            </div>
          </div>
          <div className="foot-base">
            <span>© 2026 Himanshu Sardana</span>
            <span>recall — built for the minimi intern challenge</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
