import { useState, useEffect, useRef } from 'react'
import { Send, User, Bot, ShoppingCart, DollarSign, Package, Clock, Check, CheckCheck } from 'lucide-react'
import { useBusiness } from '../hooks/useBusiness'

interface Message {
  id: string
  role: 'customer' | 'ai' | 'system'
  content: string
  timestamp: Date
  status?: 'sent' | 'delivered' | 'read'
  orderCreated?: boolean
  paymentLink?: string
}

export default function WhatsAppDemoPage() {
  const { currentBusiness } = useBusiness()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [demoMode, setDemoMode] = useState<'fashion' | 'food' | 'electronics'>('fashion')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize with welcome message
  useEffect(() => {
    loadDemoScenario(demoMode)
  }, [demoMode])

  const loadDemoScenario = (mode: 'fashion' | 'food' | 'electronics') => {
    const scenarios = {
      fashion: [
        {
          id: '1',
          role: 'system' as const,
          content: '📱 Demo: Fashion Paradise - Lagos',
          timestamp: new Date(),
        },
        {
          id: '2',
          role: 'customer' as const,
          content: 'Hello! I want to buy something nice',
          timestamp: new Date(),
          status: 'read' as const,
        },
        {
          id: '3',
          role: 'ai' as const,
          content: '👋 Welcome to Fashion Paradise! I\'m here to help. We have amazing dresses, handbags, sneakers and more. What are you looking for today?',
          timestamp: new Date(),
          status: 'read' as const,
        },
      ],
      food: [
        {
          id: '1',
          role: 'system' as const,
          content: '📱 Demo: Delicious Bites - Port Harcourt',
          timestamp: new Date(),
        },
        {
          id: '2',
          role: 'customer' as const,
          content: 'Abeg, I wan order jollof rice',
          timestamp: new Date(),
          status: 'read' as const,
        },
        {
          id: '3',
          role: 'ai' as const,
          content: '😊 No wahala! Our Jollof Rice Combo na ₦3,500 with chicken and plantain. E dey sweet well well! You wan add anything else?',
          timestamp: new Date(),
          status: 'read' as const,
        },
      ],
      electronics: [
        {
          id: '1',
          role: 'system' as const,
          content: '📱 Demo: Tech Hub Electronics - Abuja',
          timestamp: new Date(),
        },
        {
          id: '2',
          role: 'customer' as const,
          content: 'Good afternoon. I need a new smartphone',
          timestamp: new Date(),
          status: 'read' as const,
        },
        {
          id: '3',
          role: 'ai' as const,
          content: 'Good afternoon! 📱 We have the latest Android smartphones in stock at ₦250,000. It comes with 128GB storage, 8GB RAM, and excellent camera. Would you like to know more?',
          timestamp: new Date(),
          status: 'read' as const,
        },
      ],
    }
    setMessages(scenarios[mode])
  }

  const quickReplies = {
    fashion: ['Show me dresses', 'What handbags do you have?', 'Sneaker prices?'],
    food: ['Add plantain', 'How much delivery?', 'Make am two'],
    electronics: ['What colors available?', 'Any discount?', 'Yes, I want it'],
  }

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return

    // Add customer message
    const customerMsg: Message = {
      id: Date.now().toString(),
      role: 'customer',
      content: inputMessage,
      timestamp: new Date(),
      status: 'sent',
    }
    setMessages((prev) => [...prev, customerMsg])
    setInputMessage('')
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const aiResponses = getAIResponse(inputMessage.toLowerCase(), demoMode)
      setIsTyping(false)
      
      aiResponses.forEach((response, index) => {
        setTimeout(() => {
          setMessages((prev) => [...prev, response])
        }, index * 500)
      })
    }, 1500)
  }

  const getAIResponse = (message: string, mode: 'fashion' | 'food' | 'electronics'): Message[] => {
    const timestamp = new Date()
    
    if (mode === 'fashion') {
      if (message.includes('dress')) {
        return [
          {
            id: Date.now().toString(),
            role: 'ai',
            content: '👗 We have beautiful dresses! Our Ankara Maxi Dress is ₦15,000 and the Evening Gown is ₦25,000. Both are trending right now! Which one interests you?',
            timestamp,
            status: 'read',
          },
        ]
      }
      if (message.includes('handbag') || message.includes('bag')) {
        return [
          {
            id: Date.now().toString(),
            role: 'ai',
            content: '👜 Our handbags are amazing! We have:\n• Designer Crossbody - ₦12,000\n• Leather Tote - ₦18,000\n• Evening Clutch - ₦8,000\n\nAll original quality! Which one do you like?',
            timestamp,
            status: 'read',
          },
        ]
      }
      if (message.includes('buy') || message.includes('order') || message.includes('yes') || message.includes('want')) {
        return [
          {
            id: Date.now().toString(),
            role: 'ai',
            content: '✅ Great choice! I\'ve created your order for the Ankara Maxi Dress - ₦15,000\n\nI\'ll send you a payment link now...',
            timestamp,
            status: 'read',
            orderCreated: true,
          },
          {
            id: (Date.now() + 1).toString(),
            role: 'ai',
            content: '💳 Here\'s your secure payment link:\nhttps://pay.wazassist.com/xyz123\n\nYou can pay with card, bank transfer, or USSD. Once payment is confirmed, we\'ll deliver within 24 hours! 🚚',
            timestamp,
            status: 'read',
            paymentLink: 'https://pay.wazassist.com/xyz123',
          },
        ]
      }
      if (message.includes('price') || message.includes('how much') || message.includes('cost')) {
        return [
          {
            id: Date.now().toString(),
            role: 'ai',
            content: '💰 Our sneakers range from ₦8,000 to ₦35,000 depending on the brand. The Nike Air Max is ₦35,000, Adidas Originals is ₦28,000, and Canvas Sneakers are ₦8,000. All authentic!',
            timestamp,
            status: 'read',
          },
        ]
      }
    }

    if (mode === 'food') {
      if (message.includes('plantain') || message.includes('add')) {
        return [
          {
            id: Date.now().toString(),
            role: 'ai',
            content: '🍌 Perfect! Extra plantain na ₦500. So your order now be:\n• Jollof Rice Combo - ₦3,500\n• Extra Plantain - ₦500\n\nTotal: ₦4,000\n\nYou don ready to order?',
            timestamp,
            status: 'read',
          },
        ]
      }
      if (message.includes('delivery') || message.includes('deliver')) {
        return [
          {
            id: Date.now().toString(),
            role: 'ai',
            content: '🏍️ Delivery within Port Harcourt na ₦500, e go reach within 45 minutes! Outside PH na ₦1,000-₦1,500 depending on distance. Where you dey?',
            timestamp,
            status: 'read',
          },
        ]
      }
      if (message.includes('two') || message.includes('2') || message.includes('order') || message.includes('yes')) {
        return [
          {
            id: Date.now().toString(),
            role: 'ai',
            content: '✅ Perfect! Your order don set:\n• Jollof Rice Combo x2 - ₦7,000\n• Delivery - ₦500\n\nTotal: ₦7,500\n\nLet me send payment link...',
            timestamp,
            status: 'read',
            orderCreated: true,
          },
          {
            id: (Date.now() + 1).toString(),
            role: 'ai',
            content: '💰 Pay here: https://pay.wazassist.com/food456\n\nOnce you pay, we go start cooking sharp sharp! 🍳 Food go reach hot hot! 🔥',
            timestamp,
            status: 'read',
            paymentLink: 'https://pay.wazassist.com/food456',
          },
        ]
      }
    }

    if (mode === 'electronics') {
      if (message.includes('color') || message.includes('colour')) {
        return [
          {
            id: Date.now().toString(),
            role: 'ai',
            content: '🎨 We have this smartphone in:\n• Midnight Black\n• Ocean Blue\n• Rose Gold\n• Pearl White\n\nAll colors are in stock! Which one do you prefer?',
            timestamp,
            status: 'read',
          },
        ]
      }
      if (message.includes('discount') || message.includes('reduce') || message.includes('promo')) {
        return [
          {
            id: Date.now().toString(),
            role: 'ai',
            content: '🎉 Great timing! We have a special promotion - get 10% off + free screen protector and case worth ₦15,000! New price: ₦225,000 instead of ₦250,000. This offer ends today!',
            timestamp,
            status: 'read',
          },
        ]
      }
      if (message.includes('yes') || message.includes('want') || message.includes('buy') || message.includes('order')) {
        return [
          {
            id: Date.now().toString(),
            role: 'ai',
            content: '✅ Excellent choice! Order created:\n\n📱 Android Smartphone (128GB, 8GB RAM)\n• Color: Midnight Black\n• Price: ₦225,000\n• Free screen protector + case\n• 1 year warranty included\n\nGenerating payment link...',
            timestamp,
            status: 'read',
            orderCreated: true,
          },
          {
            id: (Date.now() + 1).toString(),
            role: 'ai',
            content: '💳 Payment link: https://pay.wazassist.com/tech789\n\nPay now to lock in this special price! Free delivery to your location within Abuja. Phone will be delivered tomorrow. 🚚',
            timestamp,
            status: 'read',
            paymentLink: 'https://pay.wazassist.com/tech789',
          },
        ]
      }
    }

    // Default responses
    return [
      {
        id: Date.now().toString(),
        role: 'ai',
        content: 'I can help you with that! Could you tell me more about what you need? You can also click the quick replies below for faster responses. 😊',
        timestamp,
        status: 'read',
      },
    ]
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            WhatsApp AI Demo 🤖💬
          </h1>
          <p className="text-gray-600">
            Experience how WazAssist AI handles real customer conversations on WhatsApp
          </p>
        </div>

        {/* Demo Scenario Selector */}
        <div className="mb-6 p-4 bg-white rounded-xl shadow-sm border-2 border-gray-200">
          <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
            Choose Demo Scenario:
          </h3>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setDemoMode('fashion')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                demoMode === 'fashion'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              👗 Fashion Paradise
            </button>
            <button
              onClick={() => setDemoMode('food')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                demoMode === 'food'
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🍕 Delicious Bites
            </button>
            <button
              onClick={() => setDemoMode('electronics')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                demoMode === 'electronics'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📱 Tech Hub
            </button>
          </div>
        </div>

        {/* Main Chat Interface */}
        <div className="flex gap-6 h-[600px]">
          {/* Chat Window */}
          <div className="flex-1 bg-white rounded-xl shadow-lg border-2 border-gray-200 flex flex-col overflow-hidden">
            {/* WhatsApp Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-4 flex items-center gap-4 shadow-md">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <Bot className="w-7 h-7 text-green-600" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-lg">WazAssist AI</h2>
                <p className="text-sm text-green-100">Online • Responds instantly</p>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium">
                  Demo Mode
                </span>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-6 overflow-y-auto bg-gray-50 space-y-4">
              {messages.map((msg) => {
                if (msg.role === 'system') {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold shadow-sm">
                        {msg.content}
                      </div>
                    </div>
                  )
                }

                if (msg.role === 'customer') {
                  return (
                    <div key={msg.id} className="flex items-end gap-2 justify-end">
                      <div className="max-w-md">
                        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-3 rounded-2xl rounded-br-none shadow-md">
                          <p className="text-base">{msg.content}</p>
                        </div>
                        <div className="flex items-center gap-1 justify-end mt-1 px-2">
                          <span className="text-xs text-gray-500">
                            {msg.timestamp.toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {msg.status === 'sent' && <Check className="w-4 h-4 text-gray-400" />}
                          {msg.status === 'delivered' && (
                            <CheckCheck className="w-4 h-4 text-gray-400" />
                          )}
                          {msg.status === 'read' && (
                            <CheckCheck className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                      </div>
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                    </div>
                  )
                }

                return (
                  <div key={msg.id} className="flex items-end gap-2">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="max-w-md">
                      <div className={`px-5 py-3 rounded-2xl rounded-bl-none shadow-md ${
                        msg.orderCreated
                          ? 'bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300'
                          : msg.paymentLink
                          ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300'
                          : 'bg-white'
                      }`}>
                        <p className="text-base text-gray-800 whitespace-pre-wrap">
                          {msg.content}
                        </p>
                        {msg.orderCreated && (
                          <div className="mt-2 flex items-center gap-2 text-green-700 font-semibold">
                            <ShoppingCart className="w-4 h-4" />
                            <span className="text-sm">Order Created!</span>
                          </div>
                        )}
                        {msg.paymentLink && (
                          <div className="mt-2 flex items-center gap-2 text-blue-700 font-semibold">
                            <DollarSign className="w-4 h-4" />
                            <span className="text-sm">Payment Link Sent</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1 px-2">
                        <span className="text-xs text-gray-500">
                          {msg.timestamp.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}

              {isTyping && (
                <div className="flex items-end gap-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none shadow-sm">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.4s' }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            <div className="px-6 py-4 bg-white border-t-2 border-gray-200">
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                Quick Replies
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {quickReplies[demoMode].map((reply) => (
                  <button
                    key={reply}
                    onClick={() => {
                      setInputMessage(reply)
                      setTimeout(() => handleSendMessage(), 100)
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-green-50 to-primary-50 hover:from-green-100 hover:to-primary-100 text-gray-700 hover:text-primary-700 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 border-2 border-green-200 hover:border-primary-300 shadow-sm hover:shadow-md"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Area */}
            <div className="px-6 py-4 bg-white border-t-2 border-gray-200 shadow-lg">
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message here..."
                  className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-base"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  className="p-4 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-full hover:from-green-700 hover:to-green-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  <Send className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Sidebar - AI Info */}
          <div className="w-96 bg-white border-2 border-gray-200 rounded-xl shadow-lg p-6 overflow-y-auto">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <span className="text-2xl">🤖</span>
                AI Capabilities
              </h3>
              <p className="text-sm text-gray-600">
                Powered by advanced natural language processing
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
                <div className="flex items-center gap-3 mb-2">
                  <Package className="w-5 h-5 text-green-600" />
                  <h4 className="font-bold text-gray-900">Product Recommendations</h4>
                </div>
                <p className="text-sm text-gray-700">
                  AI suggests products based on customer questions and context
                </p>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                <div className="flex items-center gap-3 mb-2">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                  <h4 className="font-bold text-gray-900">Order Creation</h4>
                </div>
                <p className="text-sm text-gray-700">
                  Automatically creates orders from natural conversations
                </p>
              </div>

              <div className="p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                  <h4 className="font-bold text-gray-900">Payment Links</h4>
                </div>
                <p className="text-sm text-gray-700">
                  Generates secure payment links for customers
                </p>
              </div>

              <div className="p-4 bg-yellow-50 rounded-xl border-2 border-yellow-200">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <h4 className="font-bold text-gray-900">24/7 Availability</h4>
                </div>
                <p className="text-sm text-gray-700">
                  Never miss a sale, even when you're sleeping
                </p>
              </div>
            </div>

            {/* Demo Stats */}
            <div className="mt-6 p-5 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-xl text-white">
              <h4 className="font-bold mb-4 flex items-center gap-2">
                <span className="text-xl">📊</span>
                Live Demo Stats
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold text-green-400">{messages.length}</div>
                  <div className="text-xs text-gray-300">Messages</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-400">~2s</div>
                  <div className="text-xs text-gray-300">Avg Response</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">
                    {messages.filter((m) => m.orderCreated).length}
                  </div>
                  <div className="text-xs text-gray-300">Orders Created</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-400">100%</div>
                  <div className="text-xs text-gray-300">Accuracy</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
