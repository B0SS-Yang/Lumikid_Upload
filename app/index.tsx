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

  // small game answer related state
  const [gameActive, setGameActive] = useState(!!gameQuestion);
  const [currentGame, setCurrentGame] = useState<'math' | 'vocabulary' | 'grammar'>(
    gameType as 'math' | 'vocabulary' | 'grammar' || 'grammar'
  );
  const [currentGameAnswer, setCurrentGameAnswer] = useState(gameAnswer);

  // new: whether waiting for continue/exit small game
  const [waitingContinue, setWaitingContinue] = useState(false);

  useEffect(() => {
    // check if it is parent mode
    if (mode === 'parent') {
      setIsParentMode(true);
      AsyncStorage.setItem('isParentMode', 'true');
    } else {
      // read the mode status from the storage
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
      console.warn("❌ chatId is invalid:", id);
      return;
    }
  
    const loadChatHistory = async () => {
      try {
        const res = await fetch(`${API_URL}/chathistory/${chatId}`, {
          headers: { "x-api-key": "cs46_learning_companion_secure_key_2024" }
        });
  
        if (!res.ok) {
          console.warn("failed to get chat history, status code:", res.status);
          return;
        }
  
        const data = await res.json();
        console.log("✅ get the chat data:", data);
  
        if (!data?.chat?.messages || !Array.isArray(data.chat.messages)) {
          console.warn("⚠️ chat.messages structure is abnormal:", data.chat);
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
          // ✅ identify the game start or exit flag
          if (result.response?.toLowerCase().includes("next question")) {
            setInGame(true); // game continues
          } else if (result.response?.toLowerCase().includes("exited the game")) {
            setInGame(false); // game ends
          } else if (result.response?.toLowerCase().includes("let's play")) {
            setInGame(true); // game starts
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
  
  // first load the question and save the answer
  useEffect(() => {
    if (gameQuestion && gameType) {
      // ensure the game type is valid
      const validGameType = ['math', 'vocabulary', 'grammar'].includes(gameType) 
        ? gameType as 'math' | 'vocabulary' | 'grammar' 
        : 'grammar';
      
      console.log('🎮 Initializing game:', {
        type: validGameType,
        question: gameQuestion,
        answer: gameAnswer
      });

      // format the question according to the game type
      let formattedQuestion = gameQuestion;
      switch (validGameType) {
        case 'grammar':
          formattedQuestion = formatGrammarQuestion(gameQuestion);
          break;
        case 'vocabulary':
          // ensure the vocabulary question contains options
          formattedQuestion = gameQuestion.includes('(') ? gameQuestion : `${gameQuestion} (${gameAnswer})`;
          break;
        case 'math':
          // math question does not need special formatting
          formattedQuestion = gameQuestion;
          break;
      }

      setMessages(prev => [
        ...prev,
        { id: Date.now().toString() + '_game', text: formattedQuestion, role: 'assistant' as 'assistant' }
      ]);
      setCurrentGame(validGameType);
      setCurrentGameAnswer(gameAnswer);
      setGameActive(true);
    }
  }, [gameQuestion, gameType]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    // 1. waiting for continue/exit small game status
    if (waitingContinue) {
      const userInput = inputText.trim().toLowerCase();
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), text: inputText, role: 'user' as 'user' },
      ]);
      setInputText("");
      if (userInput === 'y') {
        // request a new question, ensure using the same game type
        try {
          console.log(`🎮 Continuing ${currentGame} game...`);
          const res = await fetch(`${API_URL}/game/${currentGame}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': 'cs46_learning_companion_secure_key_2024',
            },
            body: JSON.stringify({ 
              user_id: userId, 
              chat_id: chatId,
              game_type: currentGame 
            }),
          });

          if (!res.ok) throw new Error(`Failed to get new ${currentGame} question`);
          const data = await res.json();
          console.log(`🎮 ${currentGame} game new question response:`, data);

          let question = '', answer = '';
          if (Array.isArray(data)) {
            [question, answer] = data;
          } else if (typeof data === 'object') {
            if (data.Question && data.Answer) {
              question = data.Question;
              answer = data.Answer;
            } else {
              console.error('Unexpected data format:', data);
              throw new Error('Invalid game data format');
            }
          }

          // format the question according to the game type
          let formattedQuestion = question;
          switch (currentGame) {
            case 'grammar':
              formattedQuestion = formatGrammarQuestion(question);
              break;
            case 'vocabulary':
              formattedQuestion = question.includes('(') ? question : `${question} (${answer})`;
              break;
            case 'math':
              formattedQuestion = question;  // math question does not need special formatting
              break;
          }

          console.log(`🎮 Setting new ${currentGame} question:`, {
            formatted: formattedQuestion,
            original: question,
            answer: answer
          });

          setMessages(prev => [
            ...prev,
            { 
              id: Date.now().toString() + '_game', 
              text: formattedQuestion, 
              role: 'assistant' as 'assistant' 
            },
          ]);
          setCurrentGameAnswer(answer);
          setGameActive(true);
          setWaitingContinue(false);
        } catch (err) {
          console.error(`❌ Error in ${currentGame} game continuation:`, err);
          setMessages(prev => [
            ...prev,
            {
              id: Date.now().toString() + '_game_result',
              text: `Failed to get new ${currentGame} question. Would you like to try again? (y/n)`,
              role: 'assistant' as 'assistant',
            },
          ]);
        }
      } else if (userInput === 'n') {
        const gameEndMessage = `Thanks for playing ${currentGame} game! You can start a new game anytime.`;
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString() + '_game_result',
            text: gameEndMessage,
            role: 'assistant' as 'assistant',
          },
        ]);
        setGameActive(false);
        setCurrentGame('grammar');
        setCurrentGameAnswer('');
        setWaitingContinue(false);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString() + '_game_result',
            text: 'Please enter y to continue with another question, or n to exit.',
            role: 'assistant' as 'assistant',
          },
        ]);
      }
      return;
    }

    // 2. small game answer processing
    if (gameActive) {
      const userMessage = {
        id: Date.now().toString(),
        text: inputText,
        role: 'user' as 'user',
      };
      setMessages(prev => [...prev, userMessage]);
      setInputText("");

      // check if exit the game
      if (inputText.toLowerCase() === 'quit') {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString() + '_game_result',
            text: `Game exited. You can start a new ${currentGame} game anytime!`,
            role: 'assistant' as 'assistant',
          },
        ]);
        setGameActive(false);
        setCurrentGame('grammar');
        setCurrentGameAnswer('');
        setWaitingContinue(false);
        return;
      }

      // verify the answer according to the game type
      const trimmedInput = inputText.trim().toLowerCase();
      let isCorrect = false;
      let errorMessage = '';

      switch (currentGame) {
        case 'grammar':
          if (!['a', 'b', 'c'].includes(trimmedInput)) {
            errorMessage = 'Please enter a, b, or c.';
          } else {
            const answerLetter = currentGameAnswer.trim().toLowerCase().charAt(0);
            isCorrect = trimmedInput === answerLetter;
          }
          break;

        case 'math':
          if (!/^\d+$/.test(trimmedInput)) {
            errorMessage = 'Please enter a number.';
          } else {
            isCorrect = trimmedInput === currentGameAnswer.trim();
          }
          break;

        case 'vocabulary':
          // Log the request data for vocabulary game
          console.log('📤 Vocabulary game request:', {
            userInput: trimmedInput,
            currentGameAnswer,
            gameType: 'vocabulary',
            timestamp: new Date().toISOString()
          });

          // For vocabulary game, the correct answer should be the first option
          const correctAnswer = currentGameAnswer.toLowerCase();
          
          // Log the validation process
          console.log('🎮 Vocabulary answer validation:', {
            userInput: trimmedInput,
            currentGameAnswer,
            correctAnswer,
            isCorrect: trimmedInput === correctAnswer,
            timestamp: new Date().toISOString()
          });
          
          if (trimmedInput === correctAnswer) {
            isCorrect = true;
          } else {
            isCorrect = false;
            errorMessage = 'Incorrect answer, please try again.';
          }
          
          // Log the response/result
          console.log('📥 Vocabulary game response:', {
            matchResult: isCorrect ? 'Correct answer' : 'Incorrect answer',
            userInput: trimmedInput,
            correctAnswer: correctAnswer,
            errorMessage: errorMessage,
            timestamp: new Date().toISOString()
          });
          break;
      }

      if (errorMessage) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString() + '_game_result',
            text: errorMessage,
            role: 'assistant' as 'assistant',
          },
        ]);
      } else if (isCorrect) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString() + '_game_result',
            text: `Correct! Do you want to continue playing ${currentGame}? Please enter y to continue, n to exit.`,
            role: 'assistant' as 'assistant',
          },
        ]);
        setWaitingContinue(true);
      } else {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString() + '_game_result',
            text: 'Incorrect answer, please try again or type "quit" to exit.',
          role: 'assistant' as 'assistant',
        },
      ]);
      }
      return;
    }

    // request body log
    const requestBody = {
      id: chatId,
      user_id: userId ? parseInt(userId) : 1,
      message: inputText,
      age: 5,
      language: "en",
      interests: ["books", "reading"],
    };

    console.log('📤 API request body:', {
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
      
      // response body log
      console.log('📥 API response body:', {
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
          console.log('🎯 game score:', { score, total });
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
      // error log
      console.error('❌ API error:', {
        error: err instanceof Error ? err.message : 'unknown error',
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
    const parts = item.text.split(/\[image:(https?:\/\/[^\]]+)\]/); // split text and image link
  
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
      {/* top area */}
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

      {/* show the current mode */}
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


      {/* chat content */}
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

      {/* input area */}
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
  // match a) b) c) and its content
  const optionRegex = /(a\)[^b|c]*)(b\)[^c]*)(c\).*)/i;
  const match = raw.match(optionRegex);
  if (match) {
    // stem + newline + each option in a line
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