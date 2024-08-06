const axios = require('axios');

async function generateImage() {
  const url = "https://api.rendernet.ai/pub/v1/generations";

  const payload = [
    {
      "aspect_ratio": "1:1",
      "batch_size": 1,
      "cfg_scale": 7,
      "control_net": {
        "asset_id": "ast_01",
        "control_mode": 1,
        "name": "Depth",
        "resize_mode": 1
      },
      "facelock": {
        "asset_id": "ast_01"
      },
      "loras": [
        {
          "weight": 0.5,
          "name": "lora_name"
        }
      ],
      "model": "JuggernautXL",
      "prompt": {
        "negative": "nsfw, deformed, extra limbs, bad anatomy, deformed pupils, text, worst quality, jpeg artifacts, ugly, duplicate, morbid, mutilated",
        "positive": "a man looking into the camera"
      },
      "quality": "Plus",
      "sampler": "DPM++ 2M Karras",
      "seed": 1234,
      "steps": 20
    }
  ];

  try {
    const response = await axios.post(url, payload, {
      headers: {
        'X-API-KEY': process.env.RENDERNET_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response:', response);
    return response.data; 
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}


module.exports = {
  generateImage
}