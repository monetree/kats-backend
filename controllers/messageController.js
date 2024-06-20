const {
  saveMessage,
  getPreviousMessages,
  getConversations,
} = require("../utils/db");
const {
  preparePromptData,
  updateEmotionState,
  getPredefinedResponse,
  textToSpeech,
  detectEmotion,
  getOpenAIResponse,
} = require("../helpers/messageHelper");

async function handleUserMessage(socket, data) {
  const { text, userId, girlId, love_mode, page = 1, limit = 10 } = data;

  const emotionState = updateEmotionState(text);

  try {
    const messages = await getPreviousMessages(userId, girlId);
    // const messages = []; // Map previous messages if needed

    const predefinedResponse = getPredefinedResponse(text.toLowerCase());

    if (predefinedResponse) {
      await saveMessage(userId, girlId, text, "user");
      await saveMessage(userId, girlId, predefinedResponse, "girl");

      socket.emit("reply", { reply: predefinedResponse });
    } else {
      const promptData = preparePromptData(
        text,
        messages,
        emotionState,
        love_mode
      );
      const reply = await getOpenAIResponse(promptData);
      const voice = await textToSpeech("Laila", reply);
      const detectedEmotion = await detectEmotion(reply);

      await saveMessage(userId, girlId, text, "user");
      await saveMessage(userId, girlId, reply, "girl");

      const offset = (page - 1) * limit;
      const conversations = await getConversations(
        userId,
        girlId,
        offset,
        limit
      );

      socket.emit("reply", { reply: reply, conversations: conversations });
    }
  } catch (error) {
    console.error(error);
    socket.emit("error", "Error generating response");
  }
}

async function sendMessageToOpenAI() {
  try {
    const messages = [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "Hello, how are you?" },
    ];
    const completion = await getOpenAIResponse(messages);
    return completion;
  } catch (error) {
    console.error("Error interacting with OpenAI:", error);
  }
}

module.exports = { handleUserMessage, sendMessageToOpenAI };
