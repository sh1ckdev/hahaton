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
                    bg-[#333333] border border-[#555555] rounded-lg shadow-xl 
                    flex flex-col">
        <header className="p-3 border-b border-[#555555] flex justify-between bg-[#1A1A1A] rounded-t-2xl">
          <span className="font-semibold text-white">AI Ассистент</span>
          <button onClick={onClose} className="text-white/60 hover:text-white text-sm transition-colors">✕</button>
        </header>

        <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-[#333333]">
          {messages.map((m,i)=>(
            <div key={i} className={`p-2 rounded-lg max-w-[85%] text-sm ${
              m.role==="user"?"ml-auto bg-[#FFDD2D] text-[#333333]":"bg-[#1A1A1A] text-white"
            }`}>
              {m.text}
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-[#555555] flex gap-2 bg-[#1A1A1A] rounded-b-2xl">
          <input className="flex-1 bg-[#333333] border border-[#555555] px-2 py-1 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FFDD2D]"
                 value={msg} onChange={e=>setMsg(e.target.value)}/>
          <button onClick={send} className="bg-[#FFDD2D] text-[#333333] px-3 rounded-lg font-semibold hover:bg-[#FFE855] transition-colors">↗</button>
        </div>
    </div>
  )
}

export default ChatPanel
