const ChatFloatingButton = ({onClick}) => (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 bg-primary text-black 
                 rounded-full w-14 h-14 flex items-center justify-center 
                 shadow-xl hover:scale-105 transition">
        💬
    </button>
  )
  export default ChatFloatingButton
  