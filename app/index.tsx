import { sendMessageToAI } from "@/utils/api"; 
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator } from 'react-native';
import { API_URL } from '@/constants/API';

type Message = {
  id: string;
  text: string;
  role: 'user' | 'assistant';
};

export default function ChatPage() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const { id, preset, mode } = useLocalSearchParams();
  const chatId = parseInt(id as string);
  const [userId, setUserId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [scoreInfo, setScoreInfo] = useState<{ score: number; total: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inGame, setInGame] = useState(false);
  const [isParentMode, setIsParentMode] = useState(false);
  const params = useLocalSearchParams();
  const gameType = params.gameType as string;
  const gameQuestion = params.gameQuestion ? decodeURIComponent(params.gameQuestion as string) : '';
  const gameAnswer = params.gameAnswer ? decodeURIComponent(params.gameAnswer as string) : '';

  // 小游戏答题相关state
  const [gameActive, setGameActive] = useState(!!gameQuestion);
  const [currentGame, setCurrentGame] = useState(gameType); // 记录当前小游戏类型
  const [currentGameAnswer, setCurrentGameAnswer] = useState(gameAnswer);

  // 新增：是否等待继续/退出小游戏
  const [waitingContinue, setWaitingContinue] = useState(false);

  useEffect(() => {
    // 检查是否是家长模式
    if (mode === 'parent') {
      setIsParentMode(true);
      AsyncStorage.setItem('isParentMode', 'true');
    } else {
      // 从存储中读取模式状态
      AsyncStorage.getItem('isParentMode').then(value => {
        setIsParentMode(value === 'true');
      });
    }
  }, [mode]);

  useEffect(() => {
    const getUserId = async () => {
      const id = await AsyncStorage.getItem('user_id');
      setUserId(id);
    };
    getUserId();
  }, []);

  useEffect(() => {
    if (!chatId || isNaN(chatId)) {
      console.warn("❌ chatId 无效:", id);
      return;
    }
  
    const loadChatHistory = async () => {
      try {
        const res = await fetch(`${API_URL}/chathistory/${chatId}`, {
          headers: { "x-api-key": "cs46_learning_companion_secure_key_2024" }
        });
  
        if (!res.ok) {
          console.warn("无法获取聊天记录，状态码:", res.status);
          return;
        }
  
        const data = await res.json();
        console.log("✅ 获取到的聊天数据:", data);
  
        if (!data?.chat?.messages || !Array.isArray(data.chat.messages)) {
          console.warn("⚠️ chat.messages 结构异常:", data.chat);
          return;
        }
  
        const loadedMessages = data.chat.messages.map((msg: any, idx: number) => ({
          id: idx.toString(),
          text: msg.content,
          role: msg.role,
        }));
  
        setMessages(loadedMessages);
      } catch (err) {
        console.error("Failed to load chat history:", err);
      }
    };
  
    loadChatHistory();
  }, [chatId]);
  
  useEffect(() => {
    console.log("💡 Current chatId is:", chatId);
  }, [chatId]);
  

  useEffect(() => { 
    if (preset && typeof preset === 'string') {
      const command = decodeURIComponent(preset);
      const requestBody = {
        id: chatId,
        user_id: userId ? parseInt(userId) : 1,
        message: command,
        age: 5,
        language: "en",
        interests: ["books", "reading"],
      };

      console.log('📤 Preset message API request body:', {
        url: `${API_URL}/chat`,
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "cs46_learning_companion_secure_key_2024"
        },
        body: requestBody,
        timestamp: new Date().toISOString()
      });

      sendMessageToAI(command, chatId.toString(), userId ? parseInt(userId) : 1)
        .then((result) => {
          console.log('📥 Preset message API response body:', {
            status: 'success',
            data: {
              response: result.response,
              conversation_id: result.conversation_id,
              timestamp: result.timestamp
            },
            timestamp: new Date().toISOString()
          });
          // ✅ 识别游戏开始或退出标志
          if (result.response?.toLowerCase().includes("next question")) {
            setInGame(true); // 游戏继续中
          } else if (result.response?.toLowerCase().includes("exited the game")) {
            setInGame(false); // 游戏结束
          } else if (result.response?.toLowerCase().includes("let's play")) {
            setInGame(true); // 游戏启动
          }
  
          const botMessage: Message = {
            id: Date.now().toString() + "_bot",
            text: result.response || "Game started",
            role: "assistant" as 'assistant',
          };
          setMessages((prev) => [...prev, botMessage]);
        })
        .catch((err) => {
          console.error('❌ Preset message API error:', {
            error: err instanceof Error ? err.message : 'Unknown error',
            request: requestBody,
            timestamp: new Date().toISOString()
          });
          console.warn("Failed to send preset:", err);
        });
    }
  }, [preset]);  
  
  // 新增：首次加载时将题目插入AI消息，并保存答案
  useEffect(() => {
    setCurrentGameAnswer(gameAnswer);
    // 输出初始题目和答案
    console.log('🎮 First game parameters:', { gameQuestion, gameAnswer });
  }, [gameQuestion, gameAnswer, gameActive]);

  useEffect(() => {
    if (gameQuestion && gameType) {
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString() + '_game', text: gameQuestion, role: 'assistant' as 'assistant' }
      ]);
      setCurrentGame(gameType);
      setCurrentGameAnswer(gameAnswer);
      setGameActive(true);
    }
  }, [gameQuestion, gameType]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    // 1. 等待继续/退出小游戏状态
    if (waitingContinue) {
      const userInput = inputText.trim().toLowerCase();
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), text: inputText, role: 'user' as 'user' },
      ]);
      setInputText("");
      if (userInput === 'y') {
        // 重新请求新题
        try {
          const res = await fetch(`${API_URL}/game/grammar`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': 'cs46_learning_companion_secure_key_2024',
            },
            body: JSON.stringify({ user_id: userId, chat_id: chatId }),
          });
          if (!res.ok) throw new Error('Failed to get new question');
          const data = await res.json();
          console.log('🎮 Game interface original reply:', data);
          let question = '', answer = '';
          if (Array.isArray(data)) {
            question = data[0]; answer = data[1];
          } else if (typeof data === 'object' && data.Question && data.Answer) {
            question = data.Question; answer = data.Answer;
          }
          const formattedQuestion = formatGrammarQuestion(question);
          setMessages(prev => [
            ...prev,
            { id: Date.now().toString() + '_game', text: formattedQuestion, role: 'assistant' as 'assistant' },
          ]);
          setCurrentGameAnswer(answer);
          setGameActive(true);
          setWaitingContinue(false);
        } catch (err) {
          setMessages(prev => [
            ...prev,
            { id: Date.now().toString() + '_game_result', text: 'Failed to get new question, please try again.', role: 'assistant' as 'assistant' },
          ]);
        }
      } else if (userInput === 'n') {
        setMessages(prev => [
          ...prev,
          { id: Date.now().toString() + '_game_result', text: 'Exited game.', role: 'assistant' as 'assistant' },
        ]);
        setGameActive(false);
        setCurrentGame('');
        setCurrentGameAnswer('');
        setWaitingContinue(false);
      } else {
        setMessages(prev => [
          ...prev,
          { id: Date.now().toString() + '_game_result', text: 'Please enter y to continue, n to exit.', role: 'assistant' as 'assistant' },
        ]);
      }
      return;
    }

    // 2. 小游戏答题优先处理
    if (gameActive && currentGame === 'grammar') {
      const userMessage = {
        id: Date.now().toString(),
        text: inputText,
        role: 'user' as 'user',
      };
      setMessages(prev => [...prev, userMessage]);
      setInputText("");
      // 新增：输入校验，只允许a/b/c
      const trimmed = userMessage.text.trim().toLowerCase();
      if (!['a', 'b', 'c'].includes(trimmed)) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString() + '_game_result',
            text: 'Please enter a, b, or c.',
            role: 'assistant' as 'assistant',
          },
        ]);
        return;
      }
      // 新增：判断是否答对
      const answerLetter = currentGameAnswer.trim().toLowerCase().charAt(0); // 只取首字母
      if (trimmed === answerLetter) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString() + '_game_result',
            text: 'Correct! Do you want to continue the game? Please enter y to continue, n to exit.',
            role: 'assistant' as 'assistant',
          },
        ]);
        setGameActive(false);
        setWaitingContinue(true);
        return;
      }
      // 答案不对时才调用后端校验（可选，或直接本地判断）
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString() + '_game_result',
          text: 'Incorrect answer, please try again.',
          role: 'assistant' as 'assistant',
        },
      ]);
      return;
    }

    if (gameActive && currentGame === 'math') {
      // 判断数字
      if (inputText.trim() === currentGameAnswer.trim()) {
        // 正确
      } else {
        // 错误
      }
    }

    if (gameActive && currentGame === 'vocabulary') {
      // 判断单词
      if (inputText.trim().toLowerCase() === currentGameAnswer.trim().toLowerCase()) {
        // 正确
      } else {
        // 错误
      }
    }

    // 请求体日志
    const requestBody = {
      id: chatId,
      user_id: userId ? parseInt(userId) : 1,
      message: inputText,
      age: 5,
      language: "en",
      interests: ["books", "reading"],
    };

    console.log('📤 API请求体:', {
      url: `${API_URL}/chat`,
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "cs46_learning_companion_secure_key_2024"
      },
      body: requestBody,
      timestamp: new Date().toISOString()
    });
  
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      role: "user" as 'user',
    };
  
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true); 
  
    try {
      const result = await sendMessageToAI(inputText, chatId.toString(), userId ? parseInt(userId) : 1) as {
        response: string;
        conversation_id?: string;
        timestamp?: string;
      };
      
      // 响应体日志
      console.log('📥 API响应体:', {
        status: 'success',
        data: {
          response: result.response,
          conversation_id: result.conversation_id,
          timestamp: result.timestamp
        },
        timestamp: new Date().toISOString()
      });
  
      if (result?.response?.includes("Your score:")) {
        const match = result.response.match(/Your score: (\d+) \/ (\d+)/);
        if (match) {
          const score = parseInt(match[1], 10);
          const total = parseInt(match[2], 10);
          console.log('🎯 游戏分数:', { score, total });
          setScoreInfo({ score, total });
        }
      } else {
        setScoreInfo(null); 
      }      
  
      const botMessage: Message = {
        id: Date.now().toString() + "_bot",
        text: result.response || "Sorry, I didn't understand that.",
        role: "assistant" as 'assistant',
      };
  
      setMessages((prev) => [...prev, botMessage]);
      await AsyncStorage.setItem("last_conversation_id", result.conversation_id ?? "");
    } catch (err) {
      // 错误日志
      console.error('❌ API错误:', {
        error: err instanceof Error ? err.message : '未知错误',
        request: requestBody,
        timestamp: new Date().toISOString()
      });
  
      const fallbackReply: Message = {
        id: Date.now().toString() + "_fallback",
        text: "something wrong.",
        role: "assistant" as 'assistant',
      };
      setMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setIsLoading(false);  
    }
  };
  

  const renderItem = ({ item }: { item: Message }) => {
    const imageMatch = item.text.match(/\[image:(https?:\/\/[^\]]+)\]/);
    const parts = item.text.split(/\[image:(https?:\/\/[^\]]+)\]/); // 分割文字和图片链接
  
    return (
      <View style={[
        styles.messageRow,
        item.role === 'user' && styles.userMessageRow
      ]}>
        {item.role === 'assistant' && (
          <Image
            source={require('../assets/images/Lumi Sun.png')}
            style={styles.avatar}
            resizeMode="cover"
          />
        )}
  
        <View
          style={[
            styles.messageBubble,
            item.role === 'user' ? styles.userBubble : styles.assistantBubble,
          ]}
        >
          {parts.map((part, index) => {
            if (imageMatch && part === imageMatch[1]) {
              return (
                <Image
                  key={`img-${index}`}
                  source={{ uri: part }}
                  defaultSource={require('../assets/images/Lumi Sun.png')}  
                  onError={(e) => {
                    console.warn("image load error:", part);
                  }}
                  style={{ width: 200, height: 150, borderRadius: 10, marginBottom: 6 }}
                  resizeMode="cover"
                />
              );
            } else if (part.trim() !== "") {
              return (
                <Text
                  key={`text-${index}`}
                  style={[
                    styles.messageText,
                    item.role === 'user' && styles.userMessageText,
                  ]}
                >
                  {part.trim()}
                </Text>
              );
            } else {
              return null;
            }
          })}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 顶部区域 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIconLeft}
          onPress={() => router.push('/SideBar/chatlist')}
        >
          <Ionicons name="menu" size={24} color="black" />
        </TouchableOpacity>

        <Image
          source={require('../assets/images/LumiKid Logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
          accessibilityLabel="LumiKid Logo"
        />

        <TouchableOpacity
          style={styles.headerIconRight}
          onPress={() => router.push('/SideBar/menulist')}
        >
          <Ionicons name="ellipsis-vertical" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* 显示当前模式 */}
      {isParentMode && (
        <View style={styles.modeIndicator}>
          <Text style={styles.modeText}>Parent Mode</Text>
        </View>
      )}

      {isLoading && (
        <View style={{ alignItems: 'center', marginVertical: 10 }}>
          <Text style={{ fontSize: 16, fontWeight: '500', color: '#555' }}>
            Lumi is thinking
          </Text>
          <ActivityIndicator size="large" color="#555" style={{ marginTop: 8 }} />
        </View>
      )}


      {/* 聊天内容 */}
      <FlatList
        ref={flatListRef}
        data={messages}
        extraData={messages}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 10 }}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
      />


      {inGame && (
        <>
          {scoreInfo && (
            <View style={{ paddingHorizontal: 20, paddingBottom: 6 }}>
              <Text style={{ fontSize: 16, color: '#007AFF', fontWeight: '500' }}>
                🎯 Game Score: {scoreInfo.score} / {scoreInfo.total}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={{
              backgroundColor: '#FF3B30',
              padding: 10,
              borderRadius: 10,
              alignItems: 'center',
              marginHorizontal: 20,
              marginBottom: 10,
            }}
            onPress={async () => {
              const result = await sendMessageToAI("exit_game", chatId.toString(), userId ? parseInt(userId) : 1) as {
                response: string;
                conversation_id?: string;
                timestamp?: string;
              };

              setScoreInfo(null);  
              setInGame(false);

              const botMessage: Message = {
                id: Date.now().toString() + "_bot",
                text: result.response || "Exited game.",
                role: "assistant" as 'assistant',
              };

              setMessages((prev) => [...prev, botMessage]);
            }}            
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Exit Game</Text>
          </TouchableOpacity>
        </>
      )}

      {/* 输入区 */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.micButton}
          onPress={() => router.push(`/voice?id=${chatId}`)}>
          <Ionicons name="mic" size={20} color="black" />
        </TouchableOpacity>


          <TextInput
            style={[styles.textInput, { flex: 1 }]}
            placeholder="Type a message"
            value={inputText}
            onChangeText={setInputText}
          />

          <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function formatGrammarQuestion(raw: string) {
  // 匹配 a) b) c) 及其后内容
  const optionRegex = /(a\)[^b|c]*)(b\)[^c]*)(c\).*)/i;
  const match = raw.match(optionRegex);
  if (match) {
    // 题干 + 换行 + 每个选项单独一行
    const [_, a, b, c] = match;
    const stem = raw.split(/a\)/i)[0].trim();
    return `${stem}\n${a.trim()}\n${b.trim()}\n${c.trim()}`;
  }
  return raw;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  headerIconLeft: {
    padding: 8,
  },
  headerIconRight: {
    padding: 8,
  },

  logoImage: {
    width: 120,
    height: 40,
    resizeMode: 'contain',
    alignItems: 'center',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 5,
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 20,
    maxWidth: '75%',
  },
  userBubble: {
    backgroundColor: '#D3F9D8',
  },
  assistantBubble: {
    backgroundColor: '#EEE',
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  userMessageText: {
    color: '#000',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#ccc',
  },
  textInput: {
    backgroundColor: '#F1F0F0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 8,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 20,
  },
  micButton: {
    backgroundColor: '#EAEAEA',
    padding: 10,
    borderRadius: 20,
  },
  modeIndicator: {
    backgroundColor: '#4CAF50',
    padding: 8,
    alignItems: 'center',
  },
  modeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});