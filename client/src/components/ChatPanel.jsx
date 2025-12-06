import { useState } from "react"
import api from "../api/client"

const ChatPanel = ({open,onClose}) =>{
  const [msg,setMsg]=useState("")
  const [messages,setMessages]=useState([])

  const send=async()=>{
      const res = await api.post("/ai/chat",{message:msg,userId:"test"})
      setMessages([...messages,{role:"user",text:msg},{role:"ai",text:res.data.answer}])
      setMsg("")
  }

  if(!open) return null

  return(
    <div className="fixed bottom-4 right-4 w-80 h-96 
                    bg-slate-900 border border-slate-800 rounded-2xl shadow-xl 
                    flex flex-col">
        <header className="p-3 border-b border-slate-800 flex justify-between">
          <span className="font-semibold">AI Ассистент</span>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm">✕</button>
        </header>

        <div className="flex-1 p-3 overflow-y-auto space-y-2">
          {messages.map((m,i)=>(
            <div key={i} className={`p-2 rounded-xl max-w-[85%] text-sm ${
              m.role==="user"?"ml-auto bg-primary text-black":"bg-slate-800"
            }`}>
              {m.text}
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-slate-800 flex gap-2">
          <input className="flex-1 bg-slate-800 border border-slate-700 px-2 py-1 rounded-xl"
                 value={msg} onChange={e=>setMsg(e.target.value)}/>
          <button onClick={send} className="bg-primary text-black px-3 rounded-xl font-semibold">↗</button>
        </div>
    </div>
  )
}

export default ChatPanel
