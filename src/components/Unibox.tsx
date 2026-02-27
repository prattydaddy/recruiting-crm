import { useState, useMemo } from "react";

interface Message {
  id: string;
  from: "them" | "me";
  text: string;
  time: string;
  type?: "text" | "voice";
}

interface Conversation {
  id: string;
  name: string;
  photo: string;
  lastMessage: string;
  time: string;
  unread: boolean;
  sentiment: "positive" | "interested" | "not_interested" | "neutral";
  channel: "InMail" | "Connection";
  campaign: string;
  messages: Message[];
}

const CONVERSATIONS: Conversation[] = [
  {
    id: "c1", name: "Justin Silver", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
    lastMessage: "so excited to chat more. Shoot me a text pls. 516 524 0810",
    time: "2h ago", unread: true, sentiment: "positive", channel: "InMail", campaign: "NYC SWE Q1",
    messages: [
      { id: "m1", from: "me", text: "Hi Justin — I came across your profile and was really impressed by your work at Gong. We're building something exciting and I think you'd be a great fit. Would love to chat.", time: "Feb 25, 10:30 AM" },
      { id: "m2", from: "them", text: "Hey! Thanks for reaching out. What's the role exactly?", time: "Feb 25, 2:15 PM" },
      { id: "m3", from: "me", text: "We're looking for a senior engineer to help build our core platform. Competitive comp, small team, big impact. Here's the JD for reference.", time: "Feb 26, 9:00 AM" },
      { id: "m4", from: "them", text: "so excited to chat more. Shoot me a text pls. 516 524 0810 Here's the JD for t", time: "Feb 27, 1:45 PM" },
    ]
  },
  {
    id: "c2", name: "Sophie Martin", photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=80&h=80&fit=crop&crop=face",
    lastMessage: "I'd love to learn more. Can we set up a call this week?",
    time: "3h ago", unread: true, sentiment: "interested", channel: "InMail", campaign: "NYC SWE Q1",
    messages: [
      { id: "m1", from: "me", text: "Hi Sophie — your background at Bloomberg is really impressive. We're hiring principal engineers and I think there could be a great fit.", time: "Feb 24, 11:00 AM" },
      { id: "m2", from: "them", text: "Thanks for reaching out! Tell me more about the team and tech stack.", time: "Feb 25, 3:20 PM" },
      { id: "m3", from: "me", text: "React + TypeScript frontend, Go backend, Neon Postgres. Team of 8 engineers, fully remote-friendly with an NYC hub.", time: "Feb 26, 10:15 AM" },
      { id: "m4", from: "them", text: "I'd love to learn more. Can we set up a call this week?", time: "Feb 27, 12:30 PM" },
    ]
  },
  {
    id: "c3", name: "Marcus Chen", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=face",
    lastMessage: "Not looking right now but keep me in mind for the future",
    time: "5h ago", unread: false, sentiment: "not_interested", channel: "InMail", campaign: "NYC SWE Q1",
    messages: [
      { id: "m1", from: "me", text: "Hi Marcus — saw your work at Stripe on their payments infra. We're building in a similar space and would love to chat.", time: "Feb 23, 9:00 AM" },
      { id: "m2", from: "them", text: "Not looking right now but keep me in mind for the future", time: "Feb 27, 10:00 AM" },
    ]
  },
  {
    id: "c4", name: "Rachel Adams", photo: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=80&h=80&fit=crop&crop=face",
    lastMessage: "This sounds interesting. What's the comp range?",
    time: "1d ago", unread: true, sentiment: "interested", channel: "Connection", campaign: "NYC SWE Q1",
    messages: [
      { id: "m1", from: "me", text: "Hi Rachel — your engineering leadership at Notion is exactly what we're looking for. Would love to connect.", time: "Feb 22, 2:00 PM" },
      { id: "m2", from: "them", text: "Thanks! What's the opportunity?", time: "Feb 24, 11:30 AM" },
      { id: "m3", from: "me", text: "VP Engineering role, leading a team of ~20. Series B, strong traction. Happy to share more details.", time: "Feb 25, 9:45 AM" },
      { id: "m4", from: "them", text: "This sounds interesting. What's the comp range?", time: "Feb 26, 4:15 PM" },
    ]
  },
  {
    id: "c5", name: "Tom Nguyen", photo: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=80&h=80&fit=crop&crop=face",
    lastMessage: "Let me think about it and get back to you next week",
    time: "1d ago", unread: false, sentiment: "neutral", channel: "InMail", campaign: "NYC SWE Q1",
    messages: [
      { id: "m1", from: "me", text: "Hi Tom — your 6+ years at MongoDB building distributed systems is exactly the expertise we need. Interested in chatting?", time: "Feb 21, 10:00 AM" },
      { id: "m2", from: "them", text: "Possibly — what's the role?", time: "Feb 23, 1:00 PM" },
      { id: "m3", from: "me", text: "Distinguished Engineer level. You'd own our data layer architecture. Fully remote OK.", time: "Feb 24, 9:30 AM" },
      { id: "m4", from: "them", text: "Let me think about it and get back to you next week", time: "Feb 26, 11:00 AM" },
    ]
  },
  {
    id: "c6", name: "Amanda Liu", photo: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=80&h=80&fit=crop&crop=face",
    lastMessage: "Yes! I've been wanting to move into a smaller team. When can we talk?",
    time: "2d ago", unread: true, sentiment: "positive", channel: "InMail", campaign: "NYC ML Eng",
    messages: [
      { id: "m1", from: "me", text: "Hi Amanda — your ML work at OpenAI is incredible. We're building AI-powered recruiting tools and could use your expertise.", time: "Feb 20, 11:00 AM" },
      { id: "m2", from: "them", text: "Oh interesting! Tell me more about the ML stack.", time: "Feb 22, 3:45 PM" },
      { id: "m3", from: "me", text: "We use a mix of fine-tuned LLMs and classical ML for scoring. Python + PyTorch on the ML side. Small team, lots of ownership.", time: "Feb 23, 10:00 AM" },
      { id: "m4", from: "them", text: "Yes! I've been wanting to move into a smaller team. When can we talk?", time: "Feb 25, 9:30 AM" },
    ]
  },
  {
    id: "c7", name: "David Park", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face",
    lastMessage: "I appreciate the outreach but I'm happy at Vercel",
    time: "3d ago", unread: false, sentiment: "not_interested", channel: "Connection", campaign: "NYC SWE Q1",
    messages: [
      { id: "m1", from: "me", text: "Hi David — love what you're building at Vercel. Would you be open to hearing about a senior full stack role?", time: "Feb 19, 2:00 PM" },
      { id: "m2", from: "them", text: "I appreciate the outreach but I'm happy at Vercel", time: "Feb 24, 10:00 AM" },
    ]
  },
  {
    id: "c8", name: "Lisa Wang", photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&h=80&fit=crop&crop=face",
    lastMessage: "Can you send over more details about the equity package?",
    time: "3d ago", unread: false, sentiment: "interested", channel: "InMail", campaign: "NYC SWE Q1",
    messages: [
      { id: "m1", from: "me", text: "Hi Lisa — your platform engineering work at Netflix is exactly what we're looking for. Would love to connect.", time: "Feb 18, 11:00 AM" },
      { id: "m2", from: "them", text: "Thanks! What stage is the company at?", time: "Feb 20, 2:00 PM" },
      { id: "m3", from: "me", text: "Series B, $40M raised. Growing fast. Competitive comp + meaningful equity.", time: "Feb 21, 9:00 AM" },
      { id: "m4", from: "them", text: "Can you send over more details about the equity package?", time: "Feb 24, 4:30 PM" },
    ]
  },
];

function SentimentBadge({ sentiment }: { sentiment: Conversation["sentiment"] }) {
  const config = {
    positive: { label: "Positive", cls: "bg-emerald-50 text-emerald-600" },
    interested: { label: "Interested", cls: "bg-blue-50 text-blue-500" },
    not_interested: { label: "Not Interested", cls: "bg-red-50 text-red-400" },
    neutral: { label: "Neutral", cls: "bg-gray-50 text-gray-400" },
  };
  const c = config[sentiment];
  return <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${c.cls}`}>{c.label}</span>;
}

function ChannelBadge({ channel }: { channel: string }) {
  return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-50 text-gray-400">{channel}</span>;
}

export default function Unibox() {
  const [activeId, setActiveId] = useState(CONVERSATIONS[0].id);
  const [filter, setFilter] = useState<"all" | "replies">("all");
  const [search, setSearch] = useState("");
  const [replyText, setReplyText] = useState("");

  const active = CONVERSATIONS.find(c => c.id === activeId)!;

  const filtered = useMemo(() => {
    return CONVERSATIONS.filter(c => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filter === "replies" && c.messages.length < 2) return false;
      return true;
    });
  }, [search, filter]);

  const unreadCount = CONVERSATIONS.filter(c => c.unread).length;

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left: Conversation list */}
      <div className="w-[380px] border-r border-gray-100 flex flex-col bg-white shrink-0">
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-gray-900">All Conversations</h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-500">{unreadCount}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-5 flex gap-0 border-b border-gray-100">
          <button onClick={() => setFilter("replies")} className={`flex-1 text-center py-2 text-[12px] font-medium border-b-2 transition-colors ${filter === "replies" ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-500"}`}>Campaign Replies</button>
          <button onClick={() => setFilter("all")} className={`flex-1 text-center py-2 text-[12px] font-medium border-b-2 transition-colors ${filter === "all" ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-500"}`}>All Conversations</button>
        </div>

        {/* Search */}
        <div className="px-5 py-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations..." className="w-full pl-9 pr-3 py-[7px] text-[12px] bg-gray-50 border border-gray-100 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-200" />
          </div>
        </div>

        {/* Count */}
        <div className="px-5 pb-2">
          <p className="text-[11px] text-gray-400">{filtered.length} conversations</p>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.map(c => (
            <div
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={`px-5 py-3.5 cursor-pointer border-b border-gray-50 transition-colors ${c.id === activeId ? "bg-gray-50" : "hover:bg-gray-50/50"}`}
            >
              <div className="flex gap-3">
                <img src={c.photo} alt={c.name} className="w-9 h-9 rounded-full object-cover shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-semibold text-gray-900">{c.name}</span>
                      {c.unread && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                    </div>
                    <span className="text-[11px] text-gray-400 shrink-0">{c.time}</span>
                  </div>
                  <p className="text-[12px] text-gray-500 truncate mt-0.5 leading-relaxed">{c.lastMessage}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <SentimentBadge sentiment={c.sentiment} />
                    <ChannelBadge channel={c.channel} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Chat thread */}
      <div className="flex-1 flex flex-col bg-[#fafafa]">
        {/* Thread header */}
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={active.photo} alt={active.name} className="w-9 h-9 rounded-full object-cover" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold text-gray-900">{active.name}</span>
                <SentimentBadge sentiment={active.sentiment} />
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">{active.campaign} · via {active.channel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-[12px] font-medium bg-white text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Move to Pipeline</button>
            <a className="inline-flex items-center justify-center cursor-pointer hover:opacity-70 transition-opacity">
              <svg className="w-4 h-4 text-[#0A66C2]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-[640px] mx-auto flex flex-col gap-4">
            {active.messages.map(m => (
              <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[420px] ${m.from === "me" ? "order-1" : ""}`}>
                  <div className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed ${m.from === "me" ? "bg-indigo-600 text-white rounded-br-md" : "bg-white text-gray-700 rounded-bl-md shadow-[0_1px_2px_rgba(0,0,0,0.04)] border border-gray-100"}`}>
                    {m.text}
                  </div>
                  <p className={`text-[10px] text-gray-400 mt-1 ${m.from === "me" ? "text-right" : ""}`}>{m.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reply input */}
        <div className="bg-white border-t border-gray-100 px-6 py-4">
          <div className="max-w-[640px] mx-auto">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder={`Reply to ${active.name}...`}
                  rows={1}
                  className="w-full px-4 py-2.5 text-[13px] bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 resize-none"
                />
              </div>
              <button className="px-4 py-2.5 text-[12px] font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shrink-0">
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
