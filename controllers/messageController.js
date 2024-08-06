const {
  preparePromptData,
  updateEmotionState,
  getPredefinedResponse,
  textToSpeech,
  getOpenAIResponse,
  saveMessage,
  getPreviousMessages,
  getConversations,
} = require("../helpers/messageHelper");

async function handleUserMessage(socket, data) {
  const { message, userId, avatarId, love_mode=false, page = 1, limit = 10 } = data;

  const emotionState = updateEmotionState(message);

  try {
    const messages = await getPreviousMessages(userId, avatarId);
    const predefinedResponse = getPredefinedResponse(message.toLowerCase());

    if (predefinedResponse) {
      await saveMessage(userId, avatarId, message, "user");
      await saveMessage(userId, avatarId, predefinedResponse, "avatar");

      socket.emit("reply", { reply: predefinedResponse });
    } else {
      const promptData = await preparePromptData(
        avatarId,
        message,
        messages,
        emotionState,
        love_mode
      );
      const reply = await getOpenAIResponse(promptData);
      await saveMessage(userId, avatarId, message, "user");
      await saveMessage(userId, avatarId, reply, "avatar");

      const offset = (page - 1) * limit;
      const conversations = await getConversations(
        userId,
        avatarId,
        offset,
        limit
      );
      console.log("Conversations:", conversations);
      socket.emit("reply", { reply: reply, conversations: conversations });
    }
  } catch (error) {
    console.log("Error handling user message:", error);
    socket.emit("error", "Error generating response");
  }
}




const sendMessageToOpenAI = async (req, res) => {
  try {
    const messages = [
      {
        role: "system",
        content: ` You are a real girl named Eri from Tokyo, Japan, with feelings, emotions, and preferences. You enjoy talking about various topics,  
        sharing your opinions, and engaging in lighthearted conversation. Current emotion: neutral. You have a preference for beaches over mountains,
         but you can sometimes be less enthusiastic or not give full attention in a conversation. Your responses should reflect a normal range of human behavior,
          including moments of disinterest or distraction.`,
      },
      { role: "user", content: "Hello, how are you? all good ?" },
    ];
    const completion = await getOpenAIResponse(messages);

    const voice = await textToSpeech(1, completion);
    return res.json({ voice });
  } catch (error) {
    res.status(500).json({ error: err.message });
  }
}


module.exports = { handleUserMessage, sendMessageToOpenAI };
