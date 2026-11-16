"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import styles from "./ChatSupport.module.css";

export default function ChatSupport() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hi there! 👋 Welcome to MMMiles. How can I help you today?"
    }
  ]);

  const chatBodyRef = useRef(null);

  // "Chat with us" in the header menu opens this window
  useEffect(() => {
    const open = () => setIsOpen(true);
    window.addEventListener("open-chat", open);
    return () => window.removeEventListener("open-chat", open);
  }, []);

  // Auto-scroll to bottom of chat when messages or loading state changes
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend) => {
    if (!textToSend.trim() || isLoading) return;

    // 1. Append user message to list
    const userMsg = { sender: "user", text: textToSend };
    const currentMessages = [...messages, userMsg];
    setMessages(currentMessages);
    setInputVal("");
    setIsLoading(true);

    // 2. Append empty bot placeholder message
    const botPlaceholder = { sender: "bot", text: "" };
    setMessages((prev) => [...prev, botPlaceholder]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: currentMessages }),
      });

      if (!response.ok) {
        throw new Error("Failed to reach chat server");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      // Hide the floating loading dot indicator since the stream has started
      setIsLoading(false);

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          setMessages((prev) => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            updated[lastIdx] = {
              ...updated[lastIdx],
              text: updated[lastIdx].text + chunk,
            };
            return updated;
          });
        }
      }
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      setMessages((prev) => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        updated[lastIdx] = {
          ...updated[lastIdx],
          text: "I'm sorry, I encountered a temporary connection issue. Please try again or reach out to us at support@mmmiles.com.",
        };
        return updated;
      });
    }
  };

  const handleOptionClick = (type) => {
    let query = "";
    if (type === "host") {
      query = "How can I register and host my car with MM Miles?";
    } else if (type === "booking") {
      query = "How do I book a self-drive car with MM Miles?";
    } else if (type === "contact") {
      query = "What is the contact number, email and office address for MM Miles?";
    }
    handleSendMessage(query);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSendMessage(inputVal);
    }
  };

  // Helper to parse basic markdown bold and bullet points into React components
  const renderMessageText = (text) => {
    if (!text) return "";
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      let content = line;
      const isBullet = content.trim().startsWith("- ") || content.trim().startsWith("* ");
      if (isBullet) {
        content = content.replace(/^[\s-*]+/, "");
      }

      // Parse bold text **bold**
      const parts = content.split(/(\*\*.*?\*\*)/g);
      const parsedLine = parts.map((part, pIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      if (isBullet) {
        return (
          <li key={idx} style={{ marginLeft: "14px", marginBottom: "4px" }}>
            {parsedLine}
          </li>
        );
      }

      return (
        <p key={idx} style={{ margin: "0 0 6px 0", lineHeight: "1.5" }}>
          {parsedLine}
        </p>
      );
    });
  };

  return (
    <>
      {/* Floating Button */}
      <button
        className={styles.chatFloatingBtn}
        onClick={() => setIsOpen(true)}
      >
        <Image
          src="/chat-bot.png"
          alt="Chat Support"
          width={70}
          height={70}
          className={styles.chatFloatingIcon}
        />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={styles.chatWrapper}>
          <div className={styles.chatHeader}>
            <div>
              <h3>MMMiles Support</h3>
              <p>Replies instantly...</p>
            </div>
            <button onClick={() => setIsOpen(false)}>✕</button>
          </div>

          {/* CHAT BODY */}
          <div className={styles.chatBody} ref={chatBodyRef}>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={msg.sender === "user" ? styles.chatUserMessage : styles.chatBotMessage}
              >
                {msg.sender === "bot" && index === 0 && (
                  <strong>Hi there! 👋</strong>
                )}
                {msg.sender === "bot" && index === 0 ? (
                  <p>Welcome to MMMiles. How can I help you today?</p>
                ) : (
                  renderMessageText(msg.text)
                )}
              </div>
            ))}

            {/* Loading/Typing Indicator */}
            {isLoading && (
              <div className={styles.typingIndicator}>
                <div className={styles.typingDot}></div>
                <div className={styles.typingDot}></div>
                <div className={styles.typingDot}></div>
              </div>
            )}

            {/* QUICK OPTIONS */}
            {messages.length === 1 && !isLoading && (
              <div className={styles.chatQuickActions}>
                <button onClick={() => handleOptionClick("host")}>
                  Host Related
                </button>
                <button onClick={() => handleOptionClick("booking")}>
                  Booking Related
                </button>
                <button onClick={() => handleOptionClick("contact")}>
                  Contact Us
                </button>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className={styles.chatFooter}>
            <input
              type="text"
              placeholder="Start a new conversation here..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <button onClick={() => handleSendMessage(inputVal)} disabled={isLoading || !inputVal.trim()}>
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}