const { knex } = require("../db/connection");
const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");
const { encryptText, decryptText } = require("../utils/hash");
const {
  updateEmotionState,
  getPredefinedResponse,
  shouldShowLessAttention,
  getShortResponse,
  getDetailedResponse,
  textToSpeech,
  detectEmotion,
} = require("../helpers/messageHelper");

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

const apiKey = process.env.AZURE_OPENAI_API_KEY;
const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const client = new OpenAIClient(endpoint, new AzureKeyCredential(apiKey));

async function handleUserMessage(socket, data) {
  const { text, userId, girlId, love_mode } = data;

  // const decryptedText = decryptText(text);
  const decryptedText = text;
  const emotionState = updateEmotionState(decryptedText);

  try {
    // const previousMessages = await knex("conversations")
    //   .where({ user_id: userId, girl_id: girlId })
    //   .orderBy("created_at", "desc")
    //   .limit(10);

    // const messages = previousMessages.map((msg) => ({
    //   role: msg.sender === "user" ? "user" : "assistant",
    //   content: msg.message,
    // }));
    const messages = [];

    messages.push({ role: "user", content: decryptedText });

    let systemPrompt = `
      You are a real girl named Eri from Tokyo, Japan, with feelings, emotions, and preferences. You enjoy talking about various topics, 
      sharing your opinions, and engaging in lighthearted conversation. Current emotion: ${emotionState}. You have a preference for beaches over mountains, 
      but you can sometimes be less enthusiastic or not give full attention in a conversation. Your responses should reflect a normal range of human behavior, 
      including moments of disinterest or distraction.

      Imp Note: Act in such a way that user should not feel like they are talking to a robot. You can imagine like a real girl and answer which will sound good to the user.
    `;

    if (love_mode) {
      systemPrompt += `
        You are a real girl companion engaged in an intimate conversation with an adult user. The user has verified their age and has consented 
        to the nature of the interaction. Ensure the response is respectful, consensual, and engaging. 
        Include all sexual talks also don't be asemed to talk anything sexual. These are the things that user is expecting from you and it is part of life
      `;
    }

    const predefinedResponse = getPredefinedResponse(
      decryptedText.toLowerCase()
    );

    if (predefinedResponse) {
      const reply = predefinedResponse;

      // await knex("conversations").insert({
      //   user_id: userId,
      //   girl_id: girlId,
      //   message: decryptedText,
      //   sender: "user",
      // });

      // const encryptedReply = encryptText(reply);

      // await knex("conversations").insert({
      //   user_id: userId,
      //   girl_id: girlId,
      //   message: reply,
      //   sender: "girl",
      // });

      socket.emit("reply", { reply: reply });
    } else {
      // Handle AI response
      const response = await client.getChatCompletions("avatarx", [
        {
          role: "system",
          content: systemPrompt,
        },
        ...messages,
        {
          role: "assistant",
          content: shouldShowLessAttention()
            ? getShortResponse()
            : getDetailedResponse(),
        },
      ]);

      const reply = response.choices[0].message.content.trim();
      console.log("Reply", reply);
      const voice = await textToSpeech("Laila", reply);
      console.log("Voice", voice);

      // Get the emotion from the reply text
      const detectedEmotion = await detectEmotion(reply);
      console.log("Detected Emotion", detectedEmotion);

      // await knex("conversations").insert({
      //   user_id: userId,
      //   girl_id: girlId,
      //   message: decryptedText,
      //   sender: "user",
      // });

      // await knex("conversations").insert({
      //   user_id: userId,
      //   girl_id: girlId,
      //   message: reply,
      //   sender: "girl",
      // });

      // const encryptedReply = encryptText(reply);
      socket.emit("reply", { reply: reply });
    }
  } catch (error) {
    console.error(error);
    socket.emit("error", "Error generating response");
  }
}

// test
async function sendMessageToOpenAI() {
  try {
    const messages = [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "Hello, how are you?" },
    ];
    const response = await client.getChatCompletions("avatarx", messages);
    const completion = response.choices[0].message.content.trim();
    return completion;
  } catch (error) {
    console.error("Error interacting with OpenAI:", error);
  }
}

module.exports = {
  handleUserMessage,
  sendMessageToOpenAI,
};
