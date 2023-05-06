import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

import { Configuration, OpenAIApi } from 'openai';

dotenv.config();

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const engineId = 'stable-diffusion-v1-5';
const apiHost = 'https://api.stability.ai';
const apiKey2 = process.env.STABILITY_API_KEY;
let prevImage = '';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', async(req, res) => {
    res.status(200).send({
        message: 'Hello from FriendlyAI',
    })
});

app.post('/', async(req, res) => {
    try {
        const prompt = req.body.prompt;

        const response = await openai.createCompletion({
            model:"text-davinci-003",
            prompt: `${prompt}`,
            temperature: 1,
            max_tokens:3000,
            frequency_penalty:0.5,
            presence_penalty:0,
        })

        res.status(200).send({
            bot: response.data.choices[0].text
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({ error })
    }
})

app.post('/images', async(req, res) => {
    try {
        const prompt = req.body.prompt;

        const response = await openai.createImage({
            prompt: `${prompt}`,
            n: 1,
            size: "1024x1024",
        });

        res.status(200).send({
            image: response.data
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({ error })
    }
})

app.post('/stablediff', async(req, res) => {
    try {
        const prompt = req.body.prompt;
        
        const response = await fetch(
            `${apiHost}/v1/generation/${engineId}/text-to-image`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Authorization: `Bearer ${apiKey2}`,
              },
              body: JSON.stringify({
                text_prompts: [
                  {
                    text: `${prompt}`,
                  },
                ],
                cfg_scale: 30,
                clip_guidance_preset: 'FAST_BLUE',
                height: 512,
                width: 512,
                samples: 1,
              }),
            }
        )

        const responseJSON = (await response.json());

        prevImage = Buffer.from(responseJSON.artifacts[0].base64, 'base64');

        res.status(200).send({
            images: responseJSON
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({ error })
    }
})

app.post('/stablediffimg2img', async(req, res) => {
    try {
        const prompt = req.body.prompt;

        const formData = new FormData();
        formData.append('init_image', prevImage);
        formData.append('init_image_mode', 'IMAGE_STRENGTH');
        formData.append('image_strength', 0.1);
        formData.append('text_prompts[0][text]', prompt);
        formData.append('cfg_scale', 30);
        formData.append('clip_guidance_preset', 'FAST_BLUE');
        formData.append('samples', 1);
        
        const response = await fetch(
            `${apiHost}/v1/generation/${engineId}/image-to-image`,
            {
              method: 'POST',
              headers: {
                ...formData.getHeaders(),
                Accept: 'application/json',
                Authorization: `Bearer ${apiKey2}`,
              },
              body: formData
            }
        )

        if (!response.ok) {
            throw new Error(`Non-200 response: ${await response.text()}`)
        }

        const responseJSON = (await response.json());

        prevImage = Buffer.from(responseJSON.artifacts[0].base64, 'base64');

        res.status(200).send({
            images: responseJSON
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({ error })
    }
})

app.listen(4000, () => console.log('Server is running on port http://localhost:4000'));

